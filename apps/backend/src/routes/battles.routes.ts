import { Router } from 'express';
import { Prisma, Theater, Victor } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination, paginatedResponse } from '../lib/pagination';

export const battlesRouter = Router();

function parseEnum<T extends Record<string, string>>(enumObj: T, value: unknown): T[keyof T] | undefined {
  const upper = String(value ?? '').toUpperCase();
  return Object.values(enumObj).includes(upper) ? (upper as T[keyof T]) : undefined;
}

battlesRouter.get('/', async (req, res, next) => {
  try {
    const pagination = getPagination(req, 25, 100);
    const where: Prisma.BattleWhereInput = {};

    const theater = parseEnum(Theater, req.query.theater);
    if (theater) where.theater = theater;
    const victor = parseEnum(Victor, req.query.victor);
    if (victor) where.victor = victor;
    if (req.query.from || req.query.to) {
      where.startDate = {
        ...(req.query.from ? { gte: new Date(String(req.query.from)) } : {}),
        ...(req.query.to ? { lte: new Date(String(req.query.to)) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      prisma.battle.findMany({ where, orderBy: { startDate: 'asc' }, skip: pagination.skip, take: pagination.take }),
      prisma.battle.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, pagination));
  } catch (err) {
    next(err);
  }
});

battlesRouter.get('/:id', async (req, res, next) => {
  try {
    const battle = await prisma.battle.findUnique({
      where: { id: req.params.id },
      include: {
        campaigns: { include: { campaign: { select: { id: true, name: true, theater: true } } } },
        participants: { include: { person: { select: { id: true, fullName: true, side: true, rank: true } } } },
      },
    });
    if (!battle) return res.status(404).json({ error: 'Battle not found' });
    res.json(battle);
  } catch (err) {
    next(err);
  }
});
