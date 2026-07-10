import { Router } from 'express';
import { Prisma, EventCategory } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination, paginatedResponse } from '../lib/pagination';

export const eventsRouter = Router();

eventsRouter.get('/', async (req, res, next) => {
  try {
    const pagination = getPagination(req, 50, 200);
    const { category, from, to, minSignificance } = req.query;

    const where: Prisma.EventWhereInput = {};
    if (category && Object.values(EventCategory).includes(String(category).toUpperCase() as EventCategory)) {
      where.category = String(category).toUpperCase() as EventCategory;
    }
    if (from || to) {
      where.eventDate = {
        ...(from ? { gte: new Date(String(from)) } : {}),
        ...(to ? { lte: new Date(String(to)) } : {}),
      };
    }
    if (minSignificance) {
      where.significanceLevel = { gte: parseInt(String(minSignificance), 10) || 1 };
    }

    const [data, total] = await Promise.all([
      prisma.event.findMany({ where, orderBy: { eventDate: 'asc' }, skip: pagination.skip, take: pagination.take }),
      prisma.event.count({ where }),
    ]);
    res.json(paginatedResponse(data, total, pagination));
  } catch (err) {
    next(err);
  }
});

eventsRouter.get('/:id', async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
});
