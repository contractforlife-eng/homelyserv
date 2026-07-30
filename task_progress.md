# Task Progress: Unify Chat System

## Analysis Complete - Issues Found

### Root Causes:

1. **AdminMessages uses `conv.otherUserRole` but backend returns `conv.role`** - Backend chat.js line 217 sets `role: otherUser.role`, not `otherUserRole`. AdminMessages references `conv.otherUserRole` which is always `undefined`, falling back to `conv.role`. Works but inconsistent.

2. **AdminMessages auto-refresh only refreshes conversations (3s), not messages** - EmployerMessages and WorkerMessages refresh both conversations AND messages (5s).

3. **AdminMessages has no manual refresh for messages** - `handleRefresh` only refreshes conversations. Other pages have `handleManualRefresh` that refreshes both.

4. **AdminMessages uses button onClick instead of form onSubmit** - Inconsistent with other pages.

5. **AdminMessages uses deprecated `onKeyPress`** instead of `onKeyDown`.

6. **AdminMessages has no `finally` block in handleSendMessage** - `sendingMessage` state never resets on error.

7. **AdminMessages uses `loadConversations()` directly after send** instead of `setRefreshKey` pattern.

### Files to modify:
- `frontend/src/pages/AdminMessages.jsx`
- `frontend/src/pages/EmployerMessages.jsx`
- `frontend/src/pages/WorkerMessages.jsx`
- `frontend/src/utils/chatService.js`