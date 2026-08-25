import express from 'express';
import { recordAnalyticsEvent, redirectToApk } from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/event', express.json({ limit: '1kb', strict: true }), recordAnalyticsEvent);
router.get('/apk-download', redirectToApk);

export default router;
