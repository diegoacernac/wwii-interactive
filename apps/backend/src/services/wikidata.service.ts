import { Prisma, Theater } from '@prisma/client';
import { prisma } from '../lib/prisma';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'WWII-Interactive/0.1 (educational project; contact dcerna@develovers.com.pe)';

// Battles that are part of WWII (Q362), directly or one hop away (via a campaign/theater),
// that are an instance of "battle" (Q178561) or a subclass, and have coordinates.
const BATTLES_QUERY = `
SELECT ?battle ?battleLabel ?coord ?start ?end ?point ?deaths ?locLabel WHERE {
  { ?battle wdt:P361 wd:Q362 . }
  UNION
  { ?battle wdt:P361 ?parent . ?parent wdt:P361 wd:Q362 . }
  ?battle wdt:P31/wdt:P279* wd:Q178561 ;
          wdt:P625 ?coord .
  OPTIONAL { ?battle wdt:P580 ?start. }
  OPTIONAL { ?battle wdt:P582 ?end. }
  OPTIONAL { ?battle wdt:P585 ?point. }
  OPTIONAL { ?battle wdt:P1120 ?deaths. }
  OPTIONAL { ?battle wdt:P276 ?loc. ?loc rdfs:label ?locLabel. FILTER(LANG(?locLabel) = "es") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}`;

interface SparqlBinding {
  battle: { value: string };
  battleLabel?: { value: string };
  coord?: { value: string };
  start?: { value: string };
  end?: { value: string };
  point?: { value: string };
  deaths?: { value: string };
  locLabel?: { value: string };
}

export interface MappedBattle {
  externalSourceId: string;
  sourceUrl: string;
  name: string;
  latitude: number;
  longitude: number;
  locationName: string;
  startDate: Date;
  endDate: Date | null;
  theater: Theater;
  civilianCasualties: number | null;
}

export interface ImportResult {
  fetched: number;
  distinct: number;
  created: number;
  updated: number;
  skippedNoDate: number;
  skippedDuplicateOfCurated: number;
}

async function runSparql(query: string): Promise<SparqlBinding[]> {
  const res = await fetch(SPARQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { results: { bindings: SparqlBinding[] } };
  return json.results.bindings;
}

// "Point(lon lat)" WKT literal → [lon, lat]
function parseWkt(wkt: string): [number, number] | null {
  const m = wkt.match(/Point\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2])];
}

function capitalize(s: string): string {
  const trimmed = s.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// Rough theater classification from coordinates. Heuristic — Wikidata has no clean
// "theater" property, so this gives a sensible default instead of everything being OTHER.
function classifyTheater(lat: number, lon: number): Theater {
  if (lon > 95 || lon < -110) return Theater.PACIFIC;
  if (lat >= 15 && lat <= 37 && lon >= -17 && lon <= 37) return Theater.NORTH_AFRICAN;
  if (lat >= 30 && lat <= 47 && lon >= -6 && lon <= 42) return Theater.MEDITERRANEAN;
  if (lon >= 20 && lat >= 43 && lat <= 72) return Theater.EASTERN_FRONT;
  if (lat >= 36 && lat <= 71 && lon >= -12 && lon < 20) return Theater.EUROPEAN;
  if (lon >= -65 && lon <= -10 && lat >= 15) return Theater.ATLANTIC;
  return Theater.OTHER;
}

// Normalize a battle name for de-duplication against curated entries:
// lowercase, strip accents, drop leading descriptors and punctuation.
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(segunda |primera |tercera )/, '')
    .replace(/^(batalla|sitio|asedio|operacion|campana|invasion|desembarco|ataque)\s+(de\s+la\s+|de\s+|del\s+|a\s+)?/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function mapBindings(bindings: SparqlBinding[]): { mapped: MappedBattle[]; skippedNoDate: number } {
  // Collapse multiple rows per battle (from OPTIONAL joins) into one record.
  const byId = new Map<string, SparqlBinding>();
  for (const b of bindings) {
    const id = b.battle.value;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, b);
    } else {
      // Merge: prefer rows that fill in missing optional fields.
      byId.set(id, {
        ...existing,
        start: existing.start ?? b.start,
        end: existing.end ?? b.end,
        point: existing.point ?? b.point,
        deaths: existing.deaths ?? b.deaths,
        locLabel: existing.locLabel ?? b.locLabel,
      });
    }
  }

  const mapped: MappedBattle[] = [];
  let skippedNoDate = 0;

  for (const [uri, b] of byId) {
    const qid = uri.split('/').pop()!;
    const coords = b.coord ? parseWkt(b.coord.value) : null;
    const startRaw = b.start?.value ?? b.point?.value;
    if (!coords || !startRaw || !b.battleLabel) {
      skippedNoDate++;
      continue;
    }
    const [lon, lat] = coords;
    const startDate = new Date(startRaw);
    const endDate = b.end?.value ? new Date(b.end.value) : null;
    if (isNaN(startDate.getTime())) {
      skippedNoDate++;
      continue;
    }
    // WWII window sanity filter (Wikidata occasionally links stray items).
    const year = startDate.getUTCFullYear();
    if (year < 1937 || year > 1945) {
      skippedNoDate++;
      continue;
    }

    const deaths = b.deaths?.value ? Math.round(parseFloat(b.deaths.value)) : null;

    mapped.push({
      externalSourceId: qid,
      sourceUrl: uri.replace('http://', 'https://'),
      name: capitalize(b.battleLabel.value),
      latitude: lat,
      longitude: lon,
      locationName: b.locLabel ? capitalize(b.locLabel.value) : capitalize(b.battleLabel.value),
      startDate,
      endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
      theater: classifyTheater(lat, lon),
      civilianCasualties: deaths,
    });
  }

  return { mapped, skippedNoDate };
}

export async function importBattlesFromWikidata(): Promise<ImportResult> {
  const bindings = await runSparql(BATTLES_QUERY);
  const { mapped, skippedNoDate } = mapBindings(bindings);

  // Curated battles (source='curated') take precedence: skip any Wikidata battle
  // whose normalized name matches one, so we don't duplicate the rich hand-written entries.
  const curated = await prisma.battle.findMany({
    where: { source: 'curated' },
    select: { name: true },
  });
  const curatedNames = new Set(curated.map((c) => normalizeName(c.name)));

  let created = 0;
  let updated = 0;
  let skippedDuplicateOfCurated = 0;

  for (const m of mapped) {
    if (curatedNames.has(normalizeName(m.name))) {
      skippedDuplicateOfCurated++;
      continue;
    }
    const data: Prisma.BattleUncheckedCreateInput = {
      ...m,
      source: 'wikidata',
    };
    const existing = await prisma.battle.findUnique({
      where: { externalSourceId: m.externalSourceId },
      select: { id: true },
    });
    if (existing) {
      await prisma.battle.update({ where: { externalSourceId: m.externalSourceId }, data });
      updated++;
    } else {
      await prisma.battle.create({ data });
      created++;
    }
  }

  return {
    fetched: bindings.length,
    distinct: mapped.length,
    created,
    updated,
    skippedNoDate,
    skippedDuplicateOfCurated,
  };
}
