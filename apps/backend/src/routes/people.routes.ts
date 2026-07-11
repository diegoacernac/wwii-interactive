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

// Relationship graph: people (nodes) linked when they took part in the same battle.
// Links are "shared a battlefield"; the weight is the number of shared battles and
// `opposing` marks pairs from different sides. Only curated battles have participants.
peopleRouter.get('/graph', async (_req, res, next) => {
  try {
    const people = await prisma.person.findMany({
      select: { id: true, fullName: true, side: true, role: true, photoUrl: true },
    });
    const parts = await prisma.battleParticipant.findMany({
      select: { battleId: true, personId: true, battle: { select: { name: true } } },
    });

    // group participants by battle
    const byBattle = new Map<string, { personId: string; battle: string }[]>();
    for (const p of parts) {
      const arr = byBattle.get(p.battleId) ?? [];
      arr.push({ personId: p.personId, battle: p.battle.name });
      byBattle.set(p.battleId, arr);
    }

    const sideOf = new Map(people.map((p) => [p.id, p.side]));
    const linkMap = new Map<string, { source: string; target: string; battles: string[]; opposing: boolean }>();
    for (const group of byBattle.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const [a, b] = [group[i], group[j]];
          const key = [a.personId, b.personId].sort().join('|');
          const entry = linkMap.get(key) ?? {
            source: a.personId,
            target: b.personId,
            battles: [],
            opposing: sideOf.get(a.personId) !== sideOf.get(b.personId),
          };
          if (!entry.battles.includes(a.battle)) entry.battles.push(a.battle);
          linkMap.set(key, entry);
        }
      }
    }

    const links = [...linkMap.values()];
    const connected = new Set<string>();
    links.forEach((l) => {
      connected.add(l.source);
      connected.add(l.target);
    });
    const nodes = people.filter((p) => connected.has(p.id));
    res.json({ nodes, links });
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
