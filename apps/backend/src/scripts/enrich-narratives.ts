import { prisma } from '../lib/prisma';
import { resolveTitlesByQids, searchTitle, fetchIntroExtracts, esWikiUrl } from '../services/wikipedia.service';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MIN_LENGTH = 200; // ignore stubs shorter than this — not a real "relato"

interface Target {
  kind: 'battle' | 'person';
  id: string;
  label: string;
  qid: string | null;
  title?: string;
}

async function main() {
  const onlyMissing = process.argv.includes('--only-missing');

  const battles = await prisma.battle.findMany({
    where: onlyMissing ? { narrative: null } : {},
    select: { id: true, name: true, externalSourceId: true },
  });
  const people = await prisma.person.findMany({
    where: onlyMissing ? { narrative: null } : {},
    select: { id: true, fullName: true },
  });

  const targets: Target[] = [
    ...battles.map((b) => ({ kind: 'battle' as const, id: b.id, label: b.name, qid: b.externalSourceId })),
    ...people.map((p) => ({ kind: 'person' as const, id: p.id, label: p.fullName, qid: null })),
  ];
  console.log(`Enriqueciendo ${battles.length} batallas y ${people.length} personas…`);

  // 1. Resolve titles: Q-IDs in a batch, everything else via name search.
  const qids = targets.filter((t) => t.qid).map((t) => t.qid!) as string[];
  const byQid = await resolveTitlesByQids(qids);
  for (const t of targets) if (t.qid && byQid.has(t.qid)) t.title = byQid.get(t.qid);

  const needSearch = targets.filter((t) => !t.title);
  console.log(`Resueltos por Q-ID: ${targets.length - needSearch.length}. Buscando por nombre: ${needSearch.length}…`);
  for (const t of needSearch) {
    t.title = (await searchTitle(t.label)) ?? undefined;
    await sleep(120);
  }

  // 2. Fetch intro extracts for all resolved titles (dedup, batched).
  const titles = [...new Set(targets.filter((t) => t.title).map((t) => t.title!))];
  console.log(`Descargando extractos de ${titles.length} artículos…`);
  const extracts = await fetchIntroExtracts(titles);

  // 3. Persist.
  let enrichedBattles = 0;
  let enrichedPeople = 0;
  let noArticle = 0;
  let tooShort = 0;

  for (const t of targets) {
    const extract = t.title ? extracts.get(t.title) : undefined;
    if (!t.title) {
      noArticle++;
      continue;
    }
    if (!extract || extract.length < MIN_LENGTH) {
      tooShort++;
      continue;
    }
    const data = { narrative: extract, narrativeSourceUrl: esWikiUrl(t.title) };
    if (t.kind === 'battle') {
      await prisma.battle.update({ where: { id: t.id }, data });
      enrichedBattles++;
    } else {
      await prisma.person.update({ where: { id: t.id }, data });
      enrichedPeople++;
    }
  }

  console.table({
    'batallas enriquecidas': enrichedBattles,
    'personas enriquecidas': enrichedPeople,
    'sin artículo ES': noArticle,
    'extracto muy corto': tooShort,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
