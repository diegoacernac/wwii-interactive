// Fetches long-form narrative text (the lead/intro section of a Spanish Wikipedia
// article) for battles and people, to enrich the short curated descriptions.

const USER_AGENT = 'WWII-Interactive/0.1 (educational project; contact dcerna@develovers.com.pe)';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const ES_WIKI_API = 'https://es.wikipedia.org/w/api.php';

async function apiGet(base: string, params: Record<string, string>): Promise<any> {
  const url = new URL(base);
  url.search = new URLSearchParams({ ...params, format: 'json', origin: '*' }).toString();
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${base} → HTTP ${res.status}`);
  return res.json();
}

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export const esWikiUrl = (title: string) =>
  `https://es.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

// Wikidata Q-IDs → Spanish Wikipedia article titles (batched, 50 per call).
export async function resolveTitlesByQids(qids: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(qids, 50)) {
    const data = await apiGet(WIKIDATA_API, {
      action: 'wbgetentities',
      ids: batch.join('|'),
      props: 'sitelinks',
      sitefilter: 'eswiki',
    });
    for (const [qid, entity] of Object.entries<any>(data.entities ?? {})) {
      const title = entity?.sitelinks?.eswiki?.title;
      if (title) result.set(qid, title);
    }
  }
  return result;
}

// Best-effort resolution of a free-text name to a Spanish Wikipedia title.
export async function searchTitle(query: string): Promise<string | null> {
  const data = await apiGet(ES_WIKI_API, {
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '1',
  });
  return data?.query?.search?.[0]?.title ?? null;
}

// Article titles → intro (lead section) plain-text extracts (batched, 20 per call).
export async function fetchIntroExtracts(titles: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(titles, 20)) {
    const data = await apiGet(ES_WIKI_API, {
      action: 'query',
      prop: 'extracts',
      exintro: '1',
      explaintext: '1',
      redirects: '1',
      exlimit: '20',
      titles: batch.join('|'),
    });
    const pages = data?.query?.pages ?? {};
    // Redirects/normalizations remap requested titles; build a lookup back to them.
    const normalized = new Map<string, string>();
    for (const n of data?.query?.normalized ?? []) normalized.set(n.to, n.from);
    for (const r of data?.query?.redirects ?? []) normalized.set(r.to, r.from);

    for (const page of Object.values<any>(pages)) {
      if (!page.extract || page.missing !== undefined) continue;
      // Map the resolved page title back to whichever requested title produced it.
      let requested = page.title;
      while (normalized.has(requested)) requested = normalized.get(requested)!;
      result.set(requested, page.extract.trim());
      result.set(page.title, page.extract.trim());
    }
  }
  return result;
}
