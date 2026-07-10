import { importBattlesFromWikidata } from '../services/wikidata.service';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Importando batallas de la Segunda Guerra Mundial desde Wikidata…');
  const result = await importBattlesFromWikidata();
  console.log('Import completado:');
  console.table(result);
  const total = await prisma.battle.count();
  const byTheater = await prisma.battle.groupBy({ by: ['theater'], _count: true });
  console.log(`Total de batallas en BD: ${total}`);
  console.table(byTheater.map((t) => ({ teatro: t.theater, batallas: t._count })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
