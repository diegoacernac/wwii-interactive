import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const mapRouter = Router();

// Battles as GeoJSON FeatureCollection for direct Leaflet consumption
mapRouter.get('/battles', async (_req, res, next) => {
  try {
    const battles = await prisma.battle.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        startDate: true,
        endDate: true,
        theater: true,
        victor: true,
        locationName: true,
        alliedCasualties: true,
        axisCasualties: true,
      },
    });
    res.json({
      type: 'FeatureCollection',
      features: battles.map((b) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [b.longitude, b.latitude] },
        properties: {
          id: b.id,
          name: b.name,
          startDate: b.startDate,
          endDate: b.endDate,
          theater: b.theater,
          victor: b.victor,
          locationName: b.locationName,
          totalCasualties: (b.alliedCasualties ?? 0) + (b.axisCasualties ?? 0),
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});
