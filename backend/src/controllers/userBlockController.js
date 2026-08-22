import {
  UserBlockValidationError,
  blockPeer,
  getPeerBlockStatus,
  resolveCustomerPeer,
  unblockPeer,
} from '../services/userBlockService.js';

const handleError = (res, error) => {
  if (error instanceof UserBlockValidationError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  console.error('User block error:', error);
  return res.status(500).json({ success: false, message: 'Failed to update block status' });
};

const getConversationId = (req) => req.body?.conversationId || req.query?.conversationId;

export const blockUser = async (req, res) => {
  try {
    const context = await resolveCustomerPeer({
      conversationId: getConversationId(req),
      userId: req.userId,
      userRole: req.userRole,
    });
    await blockPeer({ context });
    return res.json({ success: true, ...await getPeerBlockStatus({ context }) });
  } catch (error) {
    return handleError(res, error);
  }
};

export const unblockUser = async (req, res) => {
  try {
    const context = await resolveCustomerPeer({
      conversationId: getConversationId(req),
      userId: req.userId,
      userRole: req.userRole,
    });
    await unblockPeer({ context });
    return res.json({ success: true, ...await getPeerBlockStatus({ context }) });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getBlockStatus = async (req, res) => {
  try {
    const context = await resolveCustomerPeer({
      conversationId: getConversationId(req),
      userId: req.userId,
      userRole: req.userRole,
    });
    return res.json({ success: true, ...await getPeerBlockStatus({ context }) });
  } catch (error) {
    return handleError(res, error);
  }
};
