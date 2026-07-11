// Fills Person.photoUrl and Battle.imageUrl with the lead image of the matching
// Spanish Wikipedia article (pageimages API). Titles come from the article URL
// saved by enrich-narratives (narrativeSourceUrl), so run that script first.
import { prisma } from '../lib/prisma';

const UA = 'WWII-Interactive/0.1 (educational project; contact dcerna@develovers.com.pe)';
const ES_WIKI_API = 'https://es.wikipedia.org/w/api.php';

const titleFromUrl = (url: string) => decodeURIComponent(url.split('/wiki/')[1] ?? '').replace(/_/g, ' ');

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function fetchThumbnails(titles: string[], size: number): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const batch of chunk(titles, 50)) {
    const url = new URL(ES_WIKI_API);
    url.search = new URLSearchParams({
      action: 'query',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: String(size),
      redirects: '1',
      format: 'json',
      titles: batch.join('|'),
    }).toString();
    const data = await (await fetch(url, { headers: { 'User-Agent': UA } })).json() as any;
    const back = new Map<string, string>();
    for (const n of data?.query?.normalized ?? []) back.set(n.to, n.from);
    for (const r of data?.query?.redirects ?? []) back.set(r.to, r.from);
    for (const page of Object.values<any>(data?.query?.pages ?? {})) {
      if (!page?.thumbnail?.source) continue;
      let requested = page.title;
      while (back.has(requested)) requested = back.get(requested)!;
      result.set(requested, page.thumbnail.source);
      result.set(page.title, page.thumbnail.source);
    }
  }
  return result;
}

async function main() {
  const people = await prisma.person.findMany({
    where: { narrativeSourceUrl: { not: null } },
    select: { id: true, narrativeSourceUrl: true },
  });
  const battles = await prisma.battle.findMany({
    where: { narrativeSourceUrl: { not: null } },
    select: { id: true, narrativeSourceUrl: true },
  });

  const personTitles = people.map((p) => titleFromUrl(p.narrativeSourceUrl!));
  const battleTitles = battles.map((b) => titleFromUrl(b.narrativeSourceUrl!));

  console.log(`Buscando fotos: ${people.length} personas, ${battles.length} batallas…`);
  const [personThumbs, battleThumbs] = await Promise.all([
    fetchThumbnails([...new Set(personTitles)], 600),
    fetchThumbnails([...new Set(battleTitles)], 900),
  ]);

  let peopleUpdated = 0;
  for (let i = 0; i < people.length; i++) {
    const thumb = personThumbs.get(personTitles[i]);
    if (!thumb) continue;
    await prisma.person.update({ where: { id: people[i].id }, data: { photoUrl: thumb } });
    peopleUpdated++;
  }

  let battlesUpdated = 0;
  for (let i = 0; i < battles.length; i++) {
    const thumb = battleThumbs.get(battleTitles[i]);
    if (!thumb) continue;
    await prisma.battle.update({ where: { id: battles[i].id }, data: { imageUrl: thumb } });
    battlesUpdated++;
  }

  console.table({ 'personas con foto': peopleUpdated, 'batallas con imagen': battlesUpdated });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
