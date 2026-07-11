import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { eventsRouter } from './routes/events.routes';
import { battlesRouter } from './routes/battles.routes';
import { peopleRouter } from './routes/people.routes';
import { campaignsRouter } from './routes/campaigns.routes';
import { mapRouter } from './routes/map.routes';
import { statisticsRouter } from './routes/statistics.routes';
import { searchRouter } from './routes/search.routes';
import { adminRouter } from './routes/admin.routes';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/battles', battlesRouter);
  app.use('/api/v1/people', peopleRouter);
  app.use('/api/v1/campaigns', campaignsRouter);
  app.use('/api/v1/map', mapRouter);
  app.use('/api/v1/statistics', statisticsRouter);
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/admin', adminRouter);

  // Unmatched API routes always return JSON.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // In production, serve the built frontend from the same origin so the SPA's
  // relative /api/v1 calls work with no CORS or extra config. Any non-API path
  // falls back to index.html for client-side routing.
  const frontendDist = process.env.FRONTEND_DIST || path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  } else {
    app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  }

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
