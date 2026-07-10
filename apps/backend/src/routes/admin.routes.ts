import { Router } from 'express';
import { importBattlesFromWikidata } from '../services/wikidata.service';

export const adminRouter = Router();

// Trigger a Wikidata import. In a real deployment this would sit behind auth;
// for the MVP it is a plain endpoint so the import can be run from the UI/curl.
adminRouter.post('/import/wikidata', async (_req, res, next) => {
  try {
    const result = await importBattlesFromWikidata();
    res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
});
