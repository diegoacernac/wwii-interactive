import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { getPagination, paginatedResponse } from '../lib/pagination';

export const campaignsRouter = Router();

campaignsRouter.get('/', async (req, res, next) => {
  try {
    const pagination = getPagination(req, 25, 100);
    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { startDate: 'asc' },
        skip: pagination.skip,
        take: pagination.take,
        include: { _count: { select: { battles: true } } },
      }),
      prisma.campaign.count(),
    ]);
    res.json(paginatedResponse(data, total, pagination));
  } catch (err) {
    next(err);
  }
});

campaignsRouter.get('/:id', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        battles: {
          orderBy: { battleOrder: 'asc' },
          include: { battle: true },
        },
      },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});
