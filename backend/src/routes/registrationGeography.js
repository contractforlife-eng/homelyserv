import express from 'express';
import { requireSupport } from '../middleware/supportAuth.js';
import {
  getRegistrationGeographySummary,
  getRegistrationGeographyUsers,
} from '../services/adminRegistrationGeographyService.js';

export const createRegistrationGeographyRouter = ({
  getSummary = getRegistrationGeographySummary,
  getUsers = getRegistrationGeographyUsers,
} = {}) => {
  const router = express.Router();
  router.use(requireSupport);

  router.get('/summary', async (_req, res) => {
    try {
      return res.json({ success: true, ...(await getSummary()) });
    } catch (error) {
      console.error('Registration geography summary failed:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to load registration geography summary' });
    }
  });

  router.get('/users', async (req, res) => {
    try {
      return res.json({ success: true, ...(await getUsers(req.query)) });
    } catch (error) {
      const status = error instanceof TypeError ? 400 : 500;
      if (status === 500) console.error('Registration geography users failed:', error.message);
      return res.status(status).json({ success: false, message: status === 400 ? error.message : 'Failed to load registration geography users' });
    }
  });

  return router;
};

export default createRegistrationGeographyRouter();
