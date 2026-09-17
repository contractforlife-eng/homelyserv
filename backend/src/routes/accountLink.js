import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { issueAccountLinkToken } from '../controllers/accountLinkController.js';

const router = Router();

/**
 * POST /api/account-link/token
 *
 * Issues a short-lived (5 minutes), signed HomelyMind account-link token for
 * the CURRENTLY AUTHENTICATED HomelyServ user. Protected by the standard
 * authentication middleware; the user id comes from the verified JWT
 * (req.userId) and never from the request body.
 */
router.post('/token', authenticate, issueAccountLinkToken);

export default router;
