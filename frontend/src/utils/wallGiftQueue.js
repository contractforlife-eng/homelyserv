export function mergeWallGiftQueue(queue, incoming, completed = new Set()) {
  const ids = new Set(queue.map(g => g.eventId));
  const additions = [];
  for (const gift of incoming || []) {
    if (!gift?.eventId || !gift.id || !gift.emoji || completed.has(gift.eventId) || ids.has(gift.eventId)) continue;
    ids.add(gift.eventId); additions.push(gift);
  }
  return [...queue, ...additions];
}
