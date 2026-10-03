// frontend/src/pages/StudentMessages.jsx
// ============================================================
// STUDENT MESSAGES (PHASE 9C)
//
// Real functional messaging built ENTIRELY on the existing
// HomelyServ chat architecture:
//  - Conversations with Accepted Student Friends and Support Staff
//  - GET /api/chat/conversations/:userId (getUserConversations)
//  - GET /api/students/friends (Accepted student friends list)
//  - GET /api/chat/staff-directory (ADMIN / SUPPORT / SUPPORT_HELPER)
//  - /api/chat/ensure-conversation & /api/chat/send
//  - Socket.IO realtime events (message:new, typing:update)
//  - Unread/read state & markMessagesAsRead
//  - Shared chatService utilities & optimistic updates
//
// Tenancy & Authorization are strictly enforced server-side.
// Zero modifications to schemas or Socket.IO architecture.
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import StudentSidebar from '../components/student/StudentSidebar';
import { UserAvatar, UserDisplayName } from '../components/users';
import {
  Search,
  Send,
  MessageCircle,
  Loader2,
  AlertCircle,
  CheckCheck,
  ArrowLeft,
  Users,
  Headphones,
  X,
  UserCheck
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

const StudentMessages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore((state) => state.user);

  // Tab: 'chats' or 'friends'
  const [activeTab, setActiveTab] = useState('chats');

  // Conversations state
  const [conversations, setConversations] = useState([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const selectedConversationIdRef = useRef(null);
  const conversationSelectionSeqRef = useRef(0);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockStatus, setBlockStatus] = useState({ blockedByMe: false, blockedMe: false });
  const [loadError, setLoadError] = useState('');

  // Accepted friends state
  const [friends, setFriends] = useState([]);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [startingChatFriendId, setStartingChatFriendId] = useState(null);

  // Support staff modal state
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffStartingId, setStaffStartingId] = useState(null);

  const messagesEndRef = useRef(null);
  const typingStartEmittedRef = useRef(false);
  const typingStartTimerRef = useRef(null);
  const typingStaleTimerRef = useRef(null);
  const typingContextRef = useRef(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // ---------------- Load conversations ----------------
  const fetchConversations = useCallback(async () => {
    if (!authUser?.id) return;
    try {
      const userConversations = await getUserConversations(authUser.id);
      setConversations(Array.isArray(userConversations) ? userConversations : []);
      setLoadError('');
    } catch (error) {
      setLoadError(t('studentMessages.loadError') || 'Failed to load conversations.');
    } finally {
      setConversationsLoaded(true);
    }
  }, [authUser?.id, t]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ---------------- Load accepted friends ----------------
  const fetchFriends = useCallback(async () => {
    if (!authUser?.id) return;
    try {
      setFriendsLoading(true);
      const res = await api.get('/api/students/friends');
      if (res.data?.success && Array.isArray(res.data.friends)) {
        setFriends(res.data.friends);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setFriendsLoading(false);
      setFriendsLoaded(true);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // ---------------- Deep link (?conversationId=) ----------------
  useEffect(() => {
    if (!conversationsLoaded || !location.state?.conversationId) return;
    const target = conversations.find(
      (c) => String(c.id) === String(location.state.conversationId)
    );
    if (target) selectConversation(target.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsLoaded, location.state]);

  // ---------------- Message loader ----------------
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
      // Mark as read immediately if current conversation is active
      markMessagesAsRead(selectedConversationId, userId).catch(() => {});
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
        /* keep last state on transient network failures */
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
    }, 2000);
  };

  // ---------------- Send message ----------------
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() || !selectedConversationId || !authUser?.id || sending) return;

    const selectedConv = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConv) return;

    if (blockStatus.blockedByMe || blockStatus.blockedMe) {
      setLoadError(t('studentMessages.blockedBanner') || 'Messaging is unavailable for this conversation.');
      return;
    }

    const draft = message.trim();
    setMessage('');
    setSending(true);

    const optimistic = createOptimisticMessage({
      conversationId: selectedConversationId,
      senderId: authUser.id,
      senderName: authUser.fullName || 'Student',
      senderRole: 'STUDENT',
      recipientId: selectedConv.otherUserId,
      recipientName: selectedConv.otherUserName,
      text: draft
    });
    setMessages((prev) => [...prev, optimistic]);

    try {
      const result = await sendMessage(
        authUser.id,
        authUser.fullName || 'Student',
        'STUDENT',
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
          t('studentMessages.sendError') ||
          'Failed to send message.'
      );
    } finally {
      setSending(false);
    }
  };

  // ---------------- Start Chat with Student Friend ----------------
  const startFriendConversation = async (friendRecord) => {
    if (!authUser?.id || !friendRecord?.peer?.id) return;
    const peer = friendRecord.peer;
    setLoadError('');
    setStartingChatFriendId(String(peer.id));

    try {
      const conversationId = await ensureConversationExists(
        authUser.id,
        authUser.fullName || 'Student',
        'STUDENT',
        peer.id,
        peer.fullName || 'Student',
        'STUDENT'
      );

      // Refresh conversations list to include new or existing thread
      const updated = await getUserConversations(authUser.id);
      setConversations(Array.isArray(updated) ? updated : []);
      setActiveTab('chats');
      selectConversation(conversationId);
    } catch (error) {
      console.error('Error starting conversation with friend:', error);
      setLoadError(
        error.response?.data?.error ||
          t('studentMessages.friendStartingError') ||
          'Failed to start conversation with student friend.'
      );
    } finally {
      setStartingChatFriendId(null);
    }
  };

  // ---------------- Support staff directory ----------------
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
          t('studentMessages.staffLoadError') ||
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
        authUser.fullName || 'Student',
        'STUDENT',
        staff.id,
        staff.fullName || '',
        staff.role
      );
      setStaffModalOpen(false);

      const updated = await getUserConversations(authUser.id);
      setConversations(Array.isArray(updated) ? updated : []);
      setActiveTab('chats');
      selectConversation(conversationId);
    } catch (error) {
      console.error('Error starting conversation with staff:', error);
      setStaffError(
        error.response?.data?.error ||
          t('studentMessages.staffActionError') ||
          'Failed to start conversation with support.'
      );
    } finally {
      setStaffStartingId(null);
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

  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.otherUserName || '').toLowerCase().includes(term) ||
      (c.lastMessage || '').toLowerCase().includes(term)
    );
  });

  const filteredFriends = friends.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (f.peer?.fullName || '').toLowerCase().includes(term);
  });

  return (
    <DashboardLayout sidebar={<StudentSidebar />}>
      <DashboardHeader
        title={t('studentMessages.pageTitle') || 'Messages'}
        subtitle={
          totalUnread > 0
            ? `${totalUnread} unread`
            : undefined
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Error Alert */}
        {loadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{loadError}</span>
            </div>
            <button
              onClick={() => setLoadError('')}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-210px)] min-h-[550px] flex">
          {/* ============================================================ */}
          {/* LEFT COLUMN: Sidebar (Conversations / Friends Tabs) */}
          {/* ============================================================ */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0 ${
              selectedConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Top Toolbar */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('chats')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'chats'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('studentMessages.chatsTab') || 'Chats'}</span>
                  {totalUnread > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'friends'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('studentMessages.friendsTab') || 'Student Friends'}</span>
                  {friends.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-medium bg-gray-200 text-gray-700 rounded-full">
                      {friends.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Contact Support Button */}
              <button
                type="button"
                onClick={openStaffModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                title={t('studentMessages.contactSupport') || 'Contact Support'}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('studentMessages.contactSupport') || 'Support'}</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'chats'
                      ? t('studentMessages.searchPlaceholder') || 'Search conversations...'
                      : t('studentClassmates.searchPlaceholder') || 'Search friends...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'chats' ? (
                // --- CONVERSATIONS TAB ---
                !conversationsLoaded ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
                    <span className="text-xs">{t('studentMessages.loading') || 'Loading...'}</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
                    <MessageCircle className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">
                      {t('studentMessages.noConversations') || "You don't have any conversations yet."}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      {t('studentMessages.noConversationsDesc') ||
                        'Start a chat with an accepted student friend or contact platform support.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map((conv) => {
                      const isSelected = conv.id === selectedConversationId;
                      return (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => selectConversation(conv.id)}
                          className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <UserAvatar
                              user={{
                                id: conv.otherUserId,
                                fullName: conv.otherUserName,
                                profileImage: conv.avatar
                              }}
                              size="md"
                            />
                            {conv.unread > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <UserDisplayName
                                name={conv.otherUserName}
                                role={conv.otherUserRole || conv.role}
                                isPremium={conv.isPremium}
                                size="md"
                                truncate={true}
                                defaultNameClassName={`text-sm ${
                                  conv.unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-800 font-medium'
                                }`}
                              />
                              <span className="text-[11px] text-gray-400 shrink-0">
                                {formatTime(conv.lastMessageTime || conv.updatedAt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-xs truncate ${
                                  conv.unread > 0
                                    ? 'text-gray-900 font-semibold'
                                    : 'text-gray-500'
                                }`}
                              >
                                {conv.lastMessage || 'No messages'}
                              </p>
                              {conv.otherUserRole && conv.otherUserRole !== 'STUDENT' && (
                                <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                                  {getRoleLabel(conv.otherUserRole)}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                // --- ACCEPTED FRIENDS TAB ---
                friendsLoading && !friendsLoaded ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
                    <span className="text-xs">{t('studentMessages.loading') || 'Loading...'}</span>
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
                    <Users className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">
                      {t('studentMessages.noFriends') || "You don't have any accepted student friends to chat with yet."}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      {t('studentMessages.noFriendsDesc') ||
                        'Discover classmates and accept friend requests to chat together.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredFriends.map((f) => {
                      const peer = f.peer || {};
                      const isStarting = startingChatFriendId === String(peer.id);
                      return (
                        <div
                          key={f.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar
                              user={{
                                id: peer.id,
                                fullName: peer.fullName,
                                profileImage: peer.profileImage
                              }}
                              size="md"
                            />
                            <div className="min-w-0">
                              <UserDisplayName
                                name={peer.fullName}
                                role="STUDENT"
                                isPremium={peer.isPremium}
                                size="md"
                                truncate={true}
                                defaultNameClassName="text-sm font-medium text-gray-900 truncate"
                              />
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  {t('studentMessages.acceptedBadge') || 'Friend'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isStarting}
                            onClick={() => startFriendConversation(f)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                          >
                            {isStarting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <MessageCircle className="w-3.5 h-3.5" />
                            )}
                            <span>{t('studentMessages.startChatWithFriend') || 'Chat'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: Active Chat Window or Empty Placeholder */}
          {/* ============================================================ */}
          <div
            className={`flex-1 flex flex-col bg-gray-50 min-w-0 ${
              selectedConversationId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 bg-white border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedConversationId(null)}
                      className="md:hidden p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <UserAvatar
                      user={{
                        id: selectedConversation.otherUserId,
                        fullName: selectedConversation.otherUserName,
                        profileImage: selectedConversation.avatar
                      }}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <UserDisplayName
                          name={selectedConversation.otherUserName}
                          role={selectedConversation.otherUserRole || selectedConversation.role}
                          isPremium={selectedConversation.isPremium}
                          size="md"
                          truncate={true}
                          defaultNameClassName="text-sm font-semibold text-gray-900 truncate"
                        />
                        {selectedConversation.otherUserRole && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {getRoleLabel(selectedConversation.otherUserRole)}
                          </span>
                        )}
                      </div>
                      {otherUserTyping && (
                        <p className="text-[11px] text-emerald-600 animate-pulse">
                          {t('studentMessages.typing') || 'typing...'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Blocked Conversation Notice */}
                {(blockStatus.blockedByMe || blockStatus.blockedMe) && (
                  <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{t('studentMessages.blockedBanner') || 'Messaging is unavailable for this conversation.'}</span>
                  </div>
                )}

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
                      <span className="text-xs">{t('studentMessages.loading') || 'Loading...'}</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                      <MessageCircle className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600">
                        {t('studentMessages.noMessages') || 'No messages yet. Send a message to start!'}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = String(msg.senderId) === String(authUser?.id);
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[78%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-sm ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                            } ${msg.pending ? 'opacity-70' : ''}`}
                          >
                            <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                isMe ? 'text-emerald-100' : 'text-gray-400'
                              }`}
                            >
                              <span>{formatTime(msg.timestamp || msg.createdAt)}</span>
                              {isMe && (
                                <CheckCheck
                                  className={`w-3.5 h-3.5 ${
                                    msg.read ? 'text-white font-bold' : 'text-emerald-200'
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    disabled={blockStatus.blockedByMe || blockStatus.blockedMe || sending}
                    placeholder={
                      blockStatus.blockedByMe || blockStatus.blockedMe
                        ? t('studentMessages.cannotReply') || 'You cannot reply in this conversation.'
                        : t('studentMessages.typeMessage') || 'Type a message...'
                    }
                    value={message}
                    onChange={handleMessageChange}
                    className="flex-1 px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={
                      !message.trim() ||
                      blockStatus.blockedByMe ||
                      blockStatus.blockedMe ||
                      sending
                    }
                    className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 rounded-lg transition-colors shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              // Empty State (no conversation selected)
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  {t('studentMessages.selectConversation') || 'Select a conversation'}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {t('studentMessages.selectConversationDesc') ||
                    'Choose a conversation from the list to start messaging.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUPPORT STAFF MODAL */}
      {/* ============================================================ */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  {t('studentMessages.contactSupport') || 'Contact Support'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-gray-500 mb-3">
                {t('studentMessages.contactSupportDesc') ||
                  'Select a HomelyServ support agent to start a conversation.'}
              </p>

              {staffError && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{staffError}</span>
                </div>
              )}

              {staffLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
                  <span className="text-xs">{t('studentMessages.loading') || 'Loading...'}</span>
                </div>
              ) : staffList.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  {t('studentMessages.noStaffAvailable') ||
                    'No HomelyServ support staff are available right now.'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {staffList.map((staff) => {
                    const isStarting = staffStartingId === String(staff.id);
                    return (
                      <div
                        key={staff.id}
                        className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar
                            user={{
                              id: staff.id,
                              fullName: staff.fullName,
                              profileImage: staff.profileImage
                            }}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <UserDisplayName
                              name={staff.fullName}
                              role={staff.role}
                              size="md"
                              truncate={true}
                              defaultNameClassName="text-sm font-medium text-gray-900 truncate"
                            />
                            <span className="text-[10px] font-medium text-gray-500 block">
                              {getRoleLabel(staff.role)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isStarting}
                          onClick={() => startStaffConversation(staff)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shrink-0 disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          {isStarting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{t('studentMessages.startChatWithFriend') || 'Chat'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900"
              >
                {t('studentMessages.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentMessages;
