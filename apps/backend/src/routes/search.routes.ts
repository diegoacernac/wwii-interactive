import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const searchRouter = Router();

// Global search across events, battles and people.
// unaccent() on both sides makes it accent-insensitive ("zhukov" matches "Zhúkov").
searchRouter.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) return res.json({ events: [], battles: [], people: [] });
    const pattern = `%${q}%`;

    const [events, battles, people] = await Promise.all([
      prisma.$queryRaw`
        SELECT id, title, event_date AS "eventDate", category::text AS category
        FROM events
        WHERE unaccent(title) ILIKE unaccent(${pattern})
           OR unaccent(coalesce(description, '')) ILIKE unaccent(${pattern})
        ORDER BY significance_level DESC LIMIT 10`,
      prisma.$queryRaw`
        SELECT id, name, start_date AS "startDate", theater::text AS theater
        FROM battles
        WHERE unaccent(name) ILIKE unaccent(${pattern})
           OR unaccent(coalesce(description, '')) ILIKE unaccent(${pattern})
           OR unaccent(location_name) ILIKE unaccent(${pattern})
        ORDER BY start_date LIMIT 10`,
      prisma.$queryRaw`
        SELECT id, full_name AS "fullName", role, side::text AS side, nationality
        FROM people
        WHERE unaccent(full_name) ILIKE unaccent(${pattern})
           OR unaccent(coalesce(biography, '')) ILIKE unaccent(${pattern})
        ORDER BY full_name LIMIT 10`,
    ] as [Prisma.PrismaPromise<unknown[]>, Prisma.PrismaPromise<unknown[]>, Prisma.PrismaPromise<unknown[]>]);
    res.json({ events, battles, people });
  } catch (err) {
    next(err);
  }
});
