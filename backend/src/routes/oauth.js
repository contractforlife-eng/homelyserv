// backend/src/routes/oauth.js
import express from 'express';

const router = express.Router();

// ============================================================
// SOCIAL LOGIN - Google & Facebook
//
// PHASE 0 SECURITY FIX (audit §2.3): this endpoint previously
// trusted client-supplied `email`/`fullName`/`provider` fields as
// proof of identity with NO verification against Google/Facebook,
// and then signed a real HomelyServ JWT for that identity. Anyone
// could POST an arbitrary email (including an existing user's email)
// and receive a valid, signed session token for that account with no
// password and no proof of ownership - a full authentication bypass /
// account-takeover path.
//
// It also read/wrote user records via `localStorage`, which does not
// exist in a Node.js server process, so the "create or find user"
// logic silently no-op'd on every call (wrapped in try/catch).
//
// This endpoint is disabled until it is reimplemented to verify the
// provider token server-side (e.g. Google: exchange/validate the
// `credential` with `google-auth-library`'s `OAuth2Client.verifyIdToken`
// and check `aud`/`iss`/`exp`; Facebook: validate the access token
// against Facebook's `debug_token` endpoint using the app secret) and
// to persist users through the real database layer rather than
// localStorage. That work is scheduled for a later phase - see the
// audit report, §2.3 and §6 step 4.
// ============================================================
router.post('/social-login', (req, res) => {
  console.warn('⚠️  /api/oauth/social-login called while disabled (Phase 0 security fix - see audit §2.3)');
  return res.status(503).json({
    success: false,
    message: 'Social login is temporarily disabled while server-side provider token verification is implemented. Please use email/password login in the meantime.',
    code: 'SOCIAL_LOGIN_DISABLED'
  });
});

export default router;
