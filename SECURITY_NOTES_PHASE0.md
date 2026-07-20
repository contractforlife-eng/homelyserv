# Phase 0 — Security Emergency Fixes

Companion to `HomelyServ_Production_Readiness_Audit.md`. This documents exactly
what changed, why, and what still needs a human to act on (secrets can't be
rotated by editing source code alone).

## 1. Files changed

| File | Change |
|---|---|
| `backend/src/config/jwtSecret.js` *(new)* | Single, fail-fast accessor for `JWT_SECRET`. No fallback value. |
| `backend/src/middleware/auth.js` | Removed hardcoded fallback secret; now uses `getJwtSecret()`, resolved before token verification so a missing secret returns a clear 500, not a misleading 401. |
| `backend/src/routes/auth.js` | Removed hardcoded fallback secret from register/login/verify/reset-password; added `requireAdmin` to `GET /users` and `GET /users/:id`. |
| `backend/src/routes/admin.js` | Added `router.use(requireAdmin)` — every admin route now requires a valid ADMIN-role JWT. |
| `backend/src/index.js` | Added `requireAdmin` to the three debug/user-dump endpoints (`/api/debug/all-users`, `/api/debug/user-count`, `/api/users/all`). |
| `backend/src/routes/oauth.js` | Replaced the unsafe social-login handler with a disabled `503` placeholder. No more unverified-identity JWT issuance. |
| `backend/src/controllers/googleAuthController.js` | Added a warning banner documenting the `jwt.decode()`-instead-of-`jwt.verify()` bug. File is dead code (not imported anywhere) — left otherwise unchanged. |
| `backend/src/controllers/socialAuthController.js` | Same — warning banner, otherwise unchanged dead code. |
| `backend/create-admin.js` | Removed the hardcoded real email/phone/password. Now reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` / `ADMIN_PHONE` from the environment and refuses to run without them. |
| `recreate-users-simple.js` | Removed all hardcoded plaintext seed passwords. Now reads from a gitignored local JSON file (`seed-users.local.json`, based on the new `seed-users.example.json` template). |
| `seed-users.example.json` *(new)* | Safe-to-commit template with placeholder values only. |
| `.gitignore` | Added `seed-users.local.json`. |

Nothing outside these files was touched. No database schema, no frontend code, no payment/hire/chat logic — that's Phase 1+.

## 2. Manual steps required (I can't do these for you)

These require access I don't have (your GitHub repo's write access, your hosting provider's dashboard, your actual database):

1. **Rotate the leaked password everywhere it was used.** The password `killuemad` appeared in two places tied to a real identity (`contractforlife@gmail.com`, name "emad", phone `01009189851`) and was also reused for an `admin@homelyserv.com` seed account written directly into the **live** `users` collection. Treat it as fully compromised:
   - If that Gmail account or any other account reuses this password, change it there immediately.
   - Connect to your actual production/staging MongoDB and change or delete the `admin@homelyserv.com` user's password (or the account entirely) right away — don't wait for a redeploy.
2. **Scrub the credential from git history**, not just the current file (deleting/editing a file doesn't remove it from earlier commits). With write access to the real repo:
   ```bash
   # Using git-filter-repo (recommended over filter-branch):
   pip install git-filter-repo
   git clone --mirror https://github.com/contractforlife-eng/homelyserv.git
   cd homelyserv.git
   git filter-repo --replace-text <(echo 'killuemad==>***REMOVED***')
   git push --force --all
   git push --force --tags
   ```
   Everyone with a clone must then re-clone (not pull) after the force-push. Also check any forks — you likely can't force-update those.
3. **Set a real `JWT_SECRET`** in every environment (local `.env`, Render, Vercel, etc.). Generate one with:
   ```bash
   openssl rand -hex 32
   ```
   Example output (do not reuse this exact value — generate your own): `ffac3a07a9dffb48dbfbaedc3219e746df6aa05b5aea7056a174f6af8a3bc9a3`
   **Once set, every currently-issued login token becomes invalid** — all users, including yourself, will need to log in again. This is expected and desired, since the old hardcoded secrets must be treated as compromised too.
4. **Redeploy** so the code changes above actually take effect in production.
5. Optionally run `backend/create-admin.js` or the updated `recreate-users-simple.js` with your own env vars / local seed file to (re)create an admin account once you've settled the Phase 1 database-layer decision (today, `create-admin.js` targets the unused Prisma layer — see the "known limitation" note left in that file).

## 3. What Phase 0 deliberately did *not* touch

Per your instruction to keep this phase isolated, the following known issues from the audit are **still present** and will need Phase 1+:

- Payment routes (`routes/payment.js`) still have no authentication and the fake-completion/unsigned-webhook issues (audit §2.5).
- The Hires API still doesn't persist anything (audit §2.6).
- Subscription/premium status is still fully client-controlled via localStorage (audit §2.7).
- Chat (`routes/chat.js`) still has no authentication/ownership checks (audit §3).
- `PUT /api/employers/profile/:userId` and `PUT /api/workers/profile/:userId` are still IDOR-able (audit §3).
- The dual Mongoose/Prisma architecture is unresolved (audit §1) — today's fixes work within the live Mongoose layer, since that's what's actually running.
- `forgot-password` still doesn't send anything (audit §3).
