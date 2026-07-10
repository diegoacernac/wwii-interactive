import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const statisticsRouter = Router();

statisticsRouter.get('/overview', async (_req, res, next) => {
  try {
    const [battles, events, people, campaigns, casualties] = await Promise.all([
      prisma.battle.count(),
      prisma.event.count(),
      prisma.person.count(),
      prisma.campaign.count(),
      prisma.battle.aggregate({
        _sum: { alliedCasualties: true, axisCasualties: true, civilianCasualties: true },
      }),
    ]);
    res.json({
      counts: { battles, events, people, campaigns },
      casualties: {
        allied: casualties._sum.alliedCasualties ?? 0,
        axis: casualties._sum.axisCasualties ?? 0,
        civilian: casualties._sum.civilianCasualties ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

statisticsRouter.get('/casualties-by-theater', async (_req, res, next) => {
  try {
    const rows = await prisma.battle.groupBy({
      by: ['theater'],
      _sum: { alliedCasualties: true, axisCasualties: true, civilianCasualties: true },
      _count: true,
    });
    res.json(
      rows.map((r) => ({
        theater: r.theater,
        battles: r._count,
        allied: r._sum.alliedCasualties ?? 0,
        axis: r._sum.axisCasualties ?? 0,
        civilian: r._sum.civilianCasualties ?? 0,
      }))
    );
  } catch (err) {
    next(err);
  }
});

statisticsRouter.get('/battles-by-year', async (_req, res, next) => {
  try {
    const rows = await prisma.$queryRaw<{ year: number; count: bigint; victor: string | null }[]>`
      SELECT EXTRACT(YEAR FROM start_date)::int AS year, victor::text AS victor, COUNT(*) AS count
      FROM battles
      GROUP BY year, victor
      ORDER BY year
    `;
    res.json(rows.map((r) => ({ year: r.year, victor: r.victor, count: Number(r.count) })));
  } catch (err) {
    next(err);
  }
});

statisticsRouter.get('/events-by-category', async (_req, res, next) => {
  try {
    const rows = await prisma.event.groupBy({ by: ['category'], _count: true });
    res.json(rows.map((r) => ({ category: r.category, count: r._count })));
  } catch (err) {
    next(err);
  }
});
