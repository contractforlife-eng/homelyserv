/**
 * Pure state reducer helpers for Wall interactions (Likes, Gifts, Comments).
 * Extracted for deterministic Node unit tests verifying:
 * - Rapid like toggles & out-of-order responses
 * - Local rollback on failure
 * - Pending comment generation and server replacement
 * - Stale response protection
 */

/**
 * Applies an optimistic like toggle.
 * 
 * @param {Array} posts
 * @param {string} postId
 * @returns {{ updatedPosts: Array, newLiked: boolean, targetSeq: number }}
 */
export const applyOptimisticLike = (posts, postId, currentSeq = 0) => {
  const nextSeq = currentSeq + 1;
  let newLiked = false;

  const updatedPosts = posts.map(post => {
    if (String(post.id) !== String(postId)) return post;
    newLiked = !post.liked;
    const countDelta = newLiked ? 1 : -1;
    return {
      ...post,
      liked: newLiked,
      likes: Math.max(0, (post.likes || 0) + countDelta),
      _likeSeq: nextSeq,
    };
  });

  return { updatedPosts, newLiked, targetSeq: nextSeq };
};

/**
 * Reconciles a like failure or out-of-order response.
 * If the response matches the latest user sequence, it commits or rolls back.
 * If a newer like action was started by the user in the meantime (responseSeq < post._likeSeq),
 * the stale response is ignored.
 * 
 * @param {Array} posts
 * @param {string} postId
 * @param {number} responseSeq
 * @param {boolean} rollbackToLiked
 * @returns {Array}
 */
export const reconcileLikeFailure = (posts, postId, responseSeq, rollbackToLiked) => {
  return posts.map(post => {
    if (String(post.id) !== String(postId)) return post;
    // If user clicked again after this request was sent, do NOT overwrite the newer intent
    if ((post._likeSeq || 0) > responseSeq) {
      return post;
    }
    const countDelta = rollbackToLiked ? 1 : -1;
    return {
      ...post,
      liked: rollbackToLiked,
      likes: Math.max(0, (post.likes || 0) + countDelta),
    };
  });
};

/**
 * Merges a background feed response while preserving uncommitted newer optimistic interactions.
 * 
 * @param {Array} currentPosts
 * @param {Array} incomingPosts
 * @param {Map<string, number>} pendingLikesMap
 * @returns {Array}
 */
export const mergeFeedWithOptimisticLikes = (currentPosts, incomingPosts, pendingLikesMap = new Map()) => {
  return incomingPosts.map(inPost => {
    const curPost = currentPosts.find(p => String(p.id) === String(inPost.id));
    if (curPost && pendingLikesMap.has(String(inPost.id))) {
      // User has an uncommitted like operation in-flight: preserve the optimistic local state
      return {
        ...inPost,
        liked: curPost.liked,
        likes: curPost.likes,
        _likeSeq: curPost._likeSeq,
      };
    }
    return inPost;
  });
};

/**
 * Adds an optimistic pending comment to the comments map.
 * 
 * @param {object} commentsState
 * @param {string} postId
 * @param {object} pendingComment
 * @returns {object}
 */
export const addPendingComment = (commentsState, postId, pendingComment) => {
  const current = commentsState[postId] || { comments: [], next: null };
  return {
    ...commentsState,
    [postId]: {
      ...current,
      comments: [pendingComment, ...current.comments],
    },
  };
};

/**
 * Replaces an optimistic pending comment with the server-created comment on success.
 * 
 * @param {object} commentsState
 * @param {string} postId
 * @param {string} tempId
 * @param {object} serverComment
 * @returns {object}
 */
export const replacePendingComment = (commentsState, postId, tempId, serverComment) => {
  const current = commentsState[postId];
  if (!current) return commentsState;

  // Filter out any duplicate of serverComment.id if it was already received
  const filtered = current.comments.filter(c => c.id !== tempId && c.id !== serverComment.id);
  return {
    ...commentsState,
    [postId]: {
      ...current,
      comments: [serverComment, ...filtered],
    },
  };
};

/**
 * Marks a pending comment as failed on error without dropping text/image draft.
 * 
 * @param {object} commentsState
 * @param {string} postId
 * @param {string} tempId
 * @param {string} errorMessage
 * @returns {object}
 */
export const markCommentFailed = (commentsState, postId, tempId, errorMessage = '') => {
  const current = commentsState[postId];
  if (!current) return commentsState;

  return {
    ...commentsState,
    [postId]: {
      ...current,
      comments: current.comments.map(c => c.id === tempId ? { ...c, _failed: true, _error: errorMessage } : c),
    },
  };
};

/**
 * Removes a failed comment draft from state.
 * 
 * @param {object} commentsState
 * @param {string} postId
 * @param {string} tempId
 * @returns {object}
 */
export const removePendingComment = (commentsState, postId, tempId) => {
  const current = commentsState[postId];
  if (!current) return commentsState;

  return {
    ...commentsState,
    [postId]: {
      ...current,
      comments: current.comments.filter(c => c.id !== tempId),
    },
  };
};
