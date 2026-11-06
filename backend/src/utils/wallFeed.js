export function buildWallFeedFilter({ userId, scope = 'public', blocked = [], beforeId = null }) {
  if (!['public', 'mine'].includes(scope)) throw Object.assign(new Error('INVALID_WALL_VIEW'), { status: 400 });
  return {
    postId: null, deleted: false, hidden: false,
    authorId: scope === 'mine' ? String(userId) : { $nin: blocked.filter(id => String(id) !== String(userId)) },
    ...(beforeId ? { _id: { $lt: beforeId } } : {}),
  };
}
