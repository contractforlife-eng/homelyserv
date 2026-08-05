// frontend/src/utils/dateTime.js
// ============================================================
// Shared date/time helpers for the messaging experience.
//
// Provides:
//   - formatRelativeTime: "Just now", "2 min ago", "Yesterday",
//     "Monday", "Aug 5" depending on message age.
//   - sortConversationsByLatest: newest-message-first ordering.
//   - getConversationTimestamp: extract the best timestamp.
// ============================================================

const parseDate = (input) => {
  if (!input) return null;
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Format a timestamp as a human-friendly relative time.
 *
 * Examples:
 *   now            -> "Just now"
 *   2 minutes ago  -> "2 min ago"
 *   15 minutes ago -> "15 min ago"
 *   yesterday      -> "Yesterday"
 *   within a week  -> "Monday"
 *   older          -> "Aug 5"
 *
 * @param {string|Date|number} input - Any date-like value.
 * @param {string} [locale='en'] - 'en' or 'ar'.
 * @returns {string} Relative time label, or '' for invalid input.
 */
export const formatRelativeTime = (input, locale = 'en') => {
  const date = parseDate(input);
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  const ar = locale === 'ar';

  // Under a minute
  if (diffSec < 60) return ar ? 'الآن' : 'Just now';

  // Under an hour
  if (diffMin < 60) return ar ? `منذ ${diffMin} دقيقة` : `${diffMin} min ago`;

  // Same calendar day, more than an hour ago
  if (diffHr < 24 && isSameDay(now, date)) {
    return ar ? `منذ ${diffHr} ساعة` : `${diffHr} hr ago`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return ar ? 'أمس' : 'Yesterday';

  // Within the last 7 days -> weekday name (e.g. "Monday")
  if (diffHr < 24 * 7) {
    return date.toLocaleDateString(ar ? 'ar' : 'en-US', { weekday: 'long' });
  }

  // Older -> "Aug 5"
  return date.toLocaleDateString(ar ? 'ar' : 'en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Extract the best available timestamp for a conversation.
 * Prefers updatedAt, then lastMessageTime, then timestamp.
 */
export const getConversationTimestamp = (conv) => {
  if (!conv) return null;
  return conv?.updatedAt || conv?.lastMessageTime || conv?.timestamp || null;
};

/**
 * Sort conversations by newest activity first (newest message first).
 *
 * @param {Array} conversations - List of conversation objects.
 * @param {Object} [activeAtMap] - Optional map of conversationId -> ms
 *   used to bump a conversation to the top when it becomes active.
 * @returns {Array} A new sorted array (does not mutate the input).
 */
export const sortConversationsByLatest = (conversations = [], activeAtMap = {}) => {
  const sorted = [...conversations];

  const getTs = (c) => {
    const base = parseDate(getConversationTimestamp(c));
    const baseMs = base ? base.getTime() : 0;
    const active = activeAtMap[c?.id];
    return Math.max(baseMs, active || 0);
  };

  sorted.sort((a, b) => getTs(b) - getTs(a));
  return sorted;
};

export default {
  formatRelativeTime,
  getConversationTimestamp,
  sortConversationsByLatest
};