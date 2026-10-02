// frontend/src/pages/TeacherMessages.jsx
// ============================================================
// TEACHER MESSAGES
//
// Real functional messaging built ENTIRELY on the existing
// chat architecture:
//  - Conversations with Students and HomelyServ Support Staff
//  - GET /api/chat/staff-directory (returns ADMIN / SUPPORT / SUPPORT_HELPER)
//  - /api/chat endpoints (getUserConversations, getConversationMessages, sendMessage)
//  - Socket.IO realtime events (message:new, typing:update)
//  - unread/read state
//  - shared chatService utilities
//
// Zero Worker hiring, client offers, worker report modal, or
// worker-specific functionality.
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { UserAvatar, UserDisplayName } from '../components/users';
import {
  Search,
  Send,
  MessageCircle,
  Loader2,
  AlertCircle,
  CheckCheck,
  ArrowLeft,
  Ban,
  ShieldAlert,
  X,
  Headphones
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  createOptimisticMessage,
  reconcileOptimisticMessage,
  markOptimisticMessageFailed,
  getBlockStatus,
  ensureConversationExists
} from '../utils/chatService';
import { onSocketEvent, getSocket } from '../utils/socket';
import { getRoleLabel } from '../utils/userDisplay';
import api from '../utils/api';

// Staff tiers a Teacher may contact for platform and account support.
// Authorized via GET /api/chat/staff-directory.
const TEACHER_STAFF_GROUPS = ['ADMIN', 'SUPPORT', 'SUPPORT_HELPER'];

const TeacherMessages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore((state) => state.user);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const selectedConversationIdRef = useRef(null);
  const conversationSelectionSeqRef = useRef(0);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockStatus, setBlockStatus] = useState({ blockedByMe: false, blockedMe: false });
  const [loadError, setLoadError] = useState('');

  const messagesEndRef = useRef(null);
  const typingStartEmittedRef = useRef(false);
  const typingStartTimerRef = useRef(null);
  const typingStaleTimerRef = useRef(null);
  const typingContextRef = useRef(null);

  // ---------------- Load conversations ----------------
  useEffect(() => {
    if (!authUser?.id) return;
    let active = true;
    (async () => {
      try {
        const userConversations = await getUserConversations(authUser.id);
        if (!active) return;
        setConversations(Array.isArray(userConversations) ? userConversations : []);
        setLoadError('');
      } catch (error) {
        if (active) {
          setLoadError(t('teacherMessages.loadError') || 'Failed to load conversations.');
        }
      } finally {
        if (active) setConversationsLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [authUser?.id, t]);

  // ---------------- Deep link (?conversationId=) ----------------
  useEffect(() => {
    if (!conversationsLoaded || !location.state?.conversationId) return;
    const target = conversations.find(
      (c) => String(c.id) === String(location.state.conversationId)
    );
    if (target) selectConversation(target.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsLoaded, location.state]);

  const loadMessagesForConversation = useCallback(
    async (conversationId, selectionSeq) => {
      try {
        const fetched = await getConversationMessages(conversationId);
        if (selectedConversationIdRef.current !== conversationId) return;
        if (conversationSelectionSeqRef.current !== selectionSeq) return;
        setMessages(Array.isArray(fetched) ? fetched : []);
        if (authUser?.id) {
          await markMessagesAsRead(conversationId, authUser.id);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        if (selectedConversationIdRef.current === conversationId) {
          setMessagesLoading(false);
        }
      }
    },
    [authUser?.id]
  );

  const selectConversation = (conversationId) => {
    const selectionSeq = conversationSelectionSeqRef.current + 1;
    conversationSelectionSeqRef.current = selectionSeq;
    selectedConversationIdRef.current = conversationId;
    setSelectedConversationId(conversationId);
    setMessages([]);
    setMessagesLoading(true);
    loadMessagesForConversation(conversationId, selectionSeq);

    const conv = conversations.find((c) => c.id === conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c))
    );
    if (conv) {
      getBlockStatus(conversationId)
        .then((status) => setBlockStatus(status || { blockedByMe: false, blockedMe: false }))
        .catch(() => setBlockStatus({ blockedByMe: false, blockedMe: false }));
    }
  };

  // ---------------- Realtime: message:new ----------------
  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || !selectedConversationId) return;
    const unsubscribe = onSocketEvent(userId, 'message:new', (payload) => {
      if (String(payload.conversationId) !== String(selectedConversationId)) return;
      setMessages((prev) => {
        if (prev.some((msg) => String(msg.id) === String(payload.id))) return prev;
        return [...prev, payload];
      });
    });
    return unsubscribe;
  }, [authUser?.id, selectedConversationId]);

  // ---------------- Realtime: typing ----------------
  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || !selectedConversationId) return;
    const unsubscribe = onSocketEvent(userId, 'typing:update', (payload) => {
      if (String(payload.conversationId) !== String(selectedConversationId)) return;
      if (String(payload.userId) === String(userId)) return;
      if (payload.isTyping) {
        setOtherUserTyping(true);
        if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
        typingStaleTimerRef.current = setTimeout(() => setOtherUserTyping(false), 4500);
      } else {
        setOtherUserTyping(false);
      }
    });
    return unsubscribe;
  }, [authUser?.id, selectedConversationId]);

  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // ---------------- Auto refresh ----------------
  const pollRef = useRef(null);
  useEffect(() => {
    if (!authUser?.id) return;
    const userId = authUser.id;

    pollRef.current = setInterval(async () => {
      try {
        const updated = await getUserConversations(userId);
        setConversations((prev) =>
          JSON.stringify(prev) !== JSON.stringify(updated) ? updated : prev
        );
        const activeId = selectedConversationIdRef.current;
        if (activeId) {
          const updatedMessages = await getConversationMessages(activeId);
          if (selectedConversationIdRef.current !== activeId) return;
          setMessages((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(updatedMessages)) {
              markMessagesAsRead(activeId, userId);
              return updatedMessages;
            }
            return prev;
          });
        }
      } catch {
        /* keep last state on transient failures */
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [authUser?.id]);

  // ---------------- Scroll to bottom ----------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const emitTypingEvent = (isTyping) => {
    const conv = conversations.find((c) => c.id === selectedConversationId);
    const recipientId = conv?.otherUserId;
    if (!recipientId || !selectedConversationId || !authUser?.id) return;
    if (blockStatus.blockedByMe || blockStatus.blockedMe) return;
    const socket = getSocket(authUser.id);
    if (!socket) return;
    if (isTyping) {
      typingContextRef.current = { conversationId: selectedConversationId, recipientId };
    } else {
      typingContextRef.current = null;
    }
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      conversationId: selectedConversationId,
      recipientId
    });
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (!typingStartEmittedRef.current && e.target.value.trim()) {
      typingStartEmittedRef.current = true;
      emitTypingEvent(true);
    }
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    typingStartTimerRef.current = setTimeout(() => {
      typingStartEmittedRef.current = false;
      emitTypingEvent(false);
    }, 3000);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversationId || !authUser) return;

    const selectedConv = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConv) return;

    const draft = message.trim();
    const optimistic = createOptimisticMessage({
      conversationId: selectedConversationId,
      senderId: authUser.id,
      senderName: authUser.fullName || 'Teacher',
      senderRole: 'TEACHER',
      recipientId: selectedConv.otherUserId,
      recipientName: selectedConv.otherUserName,
      text: draft
    });
    setMessages((current) => [...current, optimistic]);
    setMessage('');
    if (typingStartEmittedRef.current) {
      typingStartEmittedRef.current = false;
      emitTypingEvent(false);
    }
    setSending(true);

    try {
      const result = await sendMessage(
        authUser.id,
        authUser.fullName || 'Teacher',
        'TEACHER',
        selectedConv.otherUserId,
        selectedConv.otherUserName,
        draft
      );
      if (result?.message) {
        setMessages((current) =>
          reconcileOptimisticMessage(current, optimistic.id, result.message)
        );
      } else if (result?.success) {
        const refreshed = await getConversationMessages(selectedConversationId);
        setMessages(Array.isArray(refreshed) ? refreshed : []);
      } else {
        setMessages((current) => markOptimisticMessageFailed(current, optimistic.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((current) => markOptimisticMessageFailed(current, optimistic.id));
      setLoadError(
        error.response?.data?.error ||
          t('teacherMessages.sendError') ||
          'Failed to send message.'
      );
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const formatTime = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ---------------- Support staff directory ----------------
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffStartingId, setStaffStartingId] = useState(null);

  const openStaffModal = useCallback(async () => {
    setStaffModalOpen(true);
    setStaffError('');
    try {
      setStaffLoading(true);
      const res = await api.get('/api/chat/staff-directory');
      setStaffList(Array.isArray(res.data?.staff) ? res.data.staff : []);
    } catch (error) {
      console.error('Error loading staff directory:', error);
      setStaffError(
        error.response?.data?.error ||
          t('teacherMessages.staffLoadError') ||
          'Failed to load support staff.'
      );
    } finally {
      setStaffLoading(false);
    }
  }, [t]);

  const startStaffConversation = async (staff) => {
    if (!authUser?.id) return;
    setStaffError('');
    try {
      setStaffStartingId(String(staff.id));
      const conversationId = await ensureConversationExists(
        authUser.id,
        authUser.fullName || 'Teacher',
        'TEACHER',
        staff.id,
        staff.fullName || '',
        staff.role
      );
      const refreshed = await getUserConversations(authUser.id);
      setConversations(Array.isArray(refreshed) ? refreshed : []);
      setStaffModalOpen(false);
      if (conversationId) selectConversation(conversationId);
    } catch (error) {
      console.error('Error starting staff conversation:', error);
      setStaffError(
        error.response?.data?.error ||
          t('teacherMessages.staffActionError') ||
          'Failed to start conversation with support.'
      );
    } finally {
      setStaffStartingId(null);
    }
  };

  const groupedStaff = TEACHER_STAFF_GROUPS
    .map((role) => ({ role, label: getRoleLabel(role), members: [] }))
    .map((group) => ({
      ...group,
      members: staffList.filter((staff) => String(staff.role || '').toUpperCase() === group.role)
    }))
    .filter((group) => group.members.length > 0);

  return (
    <DashboardLayout requiredRole="TEACHER">
      <DashboardHeader title={t('teacherMessages.pageTitle') || 'Messages'} />

      <div className="h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-7rem)] flex">
        {/* ---------------- Conversation list ---------------- */}
        <div
          className={`w-full flex flex-col border-e border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:max-w-sm lg:min-w-[320px] ${
            selectedConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('teacherMessages.conversations') || 'Conversations'}
              </h3>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                    {totalUnread}
                  </span>
                )}
                <button
                  type="button"
                  onClick={openStaffModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Headphones size={14} className="text-red-600" />
                  {t('teacherMessages.contactSupport') || 'Contact Support'}
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  t('teacherMessages.searchPlaceholder') || 'Search conversations...'
                }
                className="w-full ps-9 pe-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadError && (
              <div className="m-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                {loadError}
              </div>
            )}
            {!conversationsLoaded ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-red-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  {t('teacherMessages.loading') || 'Loading...'}
                </p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-2">
                <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('teacherMessages.noConversations') || 'No conversations yet'}
                </p>
                <p className="text-xs text-gray-500">
                  {t('teacherMessages.noConversationsDesc') ||
                    'Conversations with students and HomelyServ support appear here.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-start flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${
                    selectedConversationId === conv.id ? 'bg-red-50 dark:bg-red-950/30' : ''
                  }`}
                >
                  <UserAvatar
                    user={{ profileImage: conv.avatar, fullName: conv.otherUserName }}
                    role={conv.otherUserRole}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <UserDisplayName
                        name={conv.otherUserName}
                        role={conv.otherUserRole}
                        size="sm"
                        defaultNameClassName="font-semibold text-gray-900 dark:text-white"
                      />
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage || ''}</p>
                      {conv.unread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ---------------- Conversation view ---------------- */}
        <div
          className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0 ${
            selectedConversationId ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-3">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                {t('teacherMessages.selectConversation') || 'Select a conversation'}
              </h3>
              <p className="text-xs text-gray-500 max-w-xs">
                {t('teacherMessages.selectConversationDesc') ||
                  'Choose a conversation from the list to start messaging.'}
              </p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    setSelectedConversationId(null);
                    selectedConversationIdRef.current = null;
                  }}
                  className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
                <UserAvatar
                  user={{
                    profileImage: selectedConversation.avatar,
                    fullName: selectedConversation.otherUserName
                  }}
                  role={selectedConversation.otherUserRole}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <UserDisplayName
                    name={selectedConversation.otherUserName}
                    role={selectedConversation.otherUserRole}
                    size="sm"
                    defaultNameClassName="font-semibold text-gray-900 dark:text-white"
                  />
                  {otherUserTyping && (
                    <p className="text-[11px] text-emerald-600">
                      {t('teacherMessages.typing') || 'typing...'}
                    </p>
                  )}
                </div>
              </div>

              {/* Blocked banner */}
              {(blockStatus.blockedByMe || blockStatus.blockedMe) && (
                <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <Ban className="w-3.5 h-3.5" />
                  {t('teacherMessages.blockedBanner') ||
                    'Messaging is unavailable for this conversation.'}
                </div>
              )}

              {/* Messages container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500 mx-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs text-gray-400">
                      {t('teacherMessages.noMessages') ||
                        'No messages yet. Send a message to start!'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = String(msg.senderId) === String(authUser?.id);
                    return (
                      <div
                        key={msg.id || msg.optimisticId}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl text-sm ${
                            msg.failed
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300'
                              : isMine
                                ? 'bg-red-600 text-white rounded-ee-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-es-sm border border-gray-100 dark:border-gray-700'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span
                              className={`text-[10px] ${
                                isMine && !msg.failed ? 'text-red-100' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </span>
                            {isMine && !msg.failed && !msg.pending && (
                              <CheckCheck className="w-3 h-3 text-red-100" />
                            )}
                            {msg.failed && <AlertCircle className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
              >
                {blockStatus.blockedByMe || blockStatus.blockedMe ? (
                  <p className="text-center text-xs text-gray-400 py-2 flex items-center justify-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {t('teacherMessages.cannotReply') ||
                      'You cannot reply in this conversation.'}
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={handleMessageChange}
                      placeholder={
                        t('teacherMessages.typeMessage') || 'Type a message...'
                      }
                      maxLength="4000"
                      className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 transition-colors"
                      aria-label={t('teacherMessages.send') || 'Send'}
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 rtl:rotate-180" />
                      )}
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>

      {/* ---------------- Support Staff directory picker modal ---------------- */}
      {staffModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('teacherMessages.contactSupport') || 'Support Staff'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('teacherMessages.contactSupportDesc') ||
                    'Select a HomelyServ support agent to start a conversation.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={t('teacherMessages.close') || 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {staffError ? (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{staffError}</p>
              ) : null}

              {staffLoading ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t('teacherMessages.loading') || 'Loading...'}
                  </p>
                </div>
              ) : groupedStaff.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                  {t('teacherMessages.noStaffAvailable') ||
                    'No HomelyServ support staff are available right now.'}
                </p>
              ) : (
                groupedStaff.map((group) => (
                  <div key={group.role}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      {group.label}
                    </p>
                    <div className="space-y-2">
                      {group.members.map((staff) => (
                        <button
                          key={staff.id}
                          type="button"
                          disabled={staffStartingId === String(staff.id)}
                          onClick={() => startStaffConversation(staff)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-start disabled:opacity-60"
                        >
                          <UserAvatar
                            name={staff.fullName}
                            image={staff.profileImage || null}
                            role={staff.role}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <UserDisplayName
                              name={staff.fullName}
                              role={staff.role}
                              size="sm"
                              defaultNameClassName="font-medium text-gray-900 dark:text-white"
                            />
                          </div>
                          {staffStartingId === String(staff.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Send size={14} className="text-red-600 rtl:rotate-180 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default TeacherMessages;
