import { Router } from 'express';
import { Prisma, Side } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination, paginatedResponse } from '../lib/pagination';

export const peopleRouter = Router();

peopleRouter.get('/', async (req, res, next) => {
  try {
    const pagination = getPagination(req, 25, 100);
    const where: Prisma.PersonWhereInput = {};

    const side = String(req.query.side ?? '').toUpperCase();
    if (Object.values(Side).includes(side as Side)) where.side = side as Side;
    if (req.query.q) {
      const pattern = `%${String(req.query.q)}%`;
      const matches = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM people WHERE unaccent(full_name) ILIKE unaccent(${pattern})`;
      where.id = { in: matches.map((m) => m.id) };
    }

    const [data, total] = await Promise.all([
      prisma.person.findMany({ where, orderBy: { fullName: 'asc' }, skip: pagination.skip, take: pagination.take }),
      prisma.person.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, pagination));
  } catch (err) {
    next(err);
  }
});

peopleRouter.get('/:id', async (req, res, next) => {
  try {
    const person = await prisma.person.findUnique({
      where: { id: req.params.id },
      include: {
        battles: {
          include: {
            battle: { select: { id: true, name: true, startDate: true, theater: true, victor: true } },
          },
        },
      },
    });
    if (!person) return res.status(404).json({ error: 'Person not found' });
    res.json(person);
  } catch (err) {
    next(err);
  }
});
