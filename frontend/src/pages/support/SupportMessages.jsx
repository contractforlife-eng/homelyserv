// Support Messages Page - Reuses existing chat system
// Layout mirrors the Admin Messages page (green Support theme).
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import api from '../../utils/api';
import {
  Search,
  Send,
  Plus,
  ChevronRight,
  MoreVertical,
  CheckCheck,
  RefreshCw,
  Shield,
  Users,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import {
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  archiveConversation,
  getSupportConversations,
  getInternalConversations,
  ensureConversationExists,
  createOptimisticMessage,
  reconcileOptimisticMessage,
  markOptimisticMessageFailed
} from '../../utils/chatService';
import { onSocketEvent, getSocket } from '../../utils/socket';
import { UserAvatar, UserDisplayName } from '../../components/users';
import usePresence from '../../hooks/usePresence';

const CONVERSATION_TABS = {
  SUPPORT: 'SUPPORT',
  INTERNAL: 'INTERNAL',
};

// Tab mapping (data source -> tab, do not swap):
//   "Support Conversations" tab  -> existing authorized staff-side
//                                   (ADMIN/SUPPORT) INTERNAL conversations
//   "Internal Conversations" tab -> ordinary WORKER / EMPLOYER user
//                                   conversations handled by Support
const STAFF_TARGET_ROLES = new Set(['ADMIN', 'SUPPORT']);
const USER_TARGET_ROLES = new Set(['WORKER', 'EMPLOYER']);

const SUPPORT_TAB_META = {
  [CONVERSATION_TABS.SUPPORT]: { icon: Shield },
  [CONVERSATION_TABS.INTERNAL]: { icon: Users },
};

const SupportMessages = () => {
  const { t: i18nT, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get('conversationId');
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConversationTab, setActiveConversationTab] = useState(CONVERSATION_TABS.SUPPORT);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  // Mobile: show the conversation list first; opening a chat hides it until "Back".
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const dropdownRef = useRef(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingStartTimerRef = useRef(null);
  const typingStaleTimerRef = useRef(null);
  const typingStartEmittedRef = useRef(false);
  const typingContextRef = useRef(null);
  const authUserIdRef = useRef(authUser?.id);
  const handledRequestedConversationIdRef = useRef(null);

  // Keep authUserIdRef in sync with the latest authUser id
  useEffect(() => {
    authUserIdRef.current = authUser?.id;
  });

  const t = i18nT('supportMessagesPage', { returnObjects: true });

  // Real-time presence for counterpart users (additive; does not touch chat logic).
  // counterpart user ID is already derived in mapConversation as `otherUserId`.
  const counterpartUserIds = conversations.map((c) => c.otherUserId).filter(Boolean);
  const presence = usePresence(counterpartUserIds, authUser?.id);

  // ============================================================
  // loadConversations - SECURE: only assigned support conversations
  // ============================================================
  // `source` identifies the authorized endpoint that produced the row:
  // 'STAFF' = /api/chat/internal/conversations (staff-side conversations),
  // 'USER'  = /api/support/conversations (ordinary user conversations).
  const mapConversation = (conv, source = 'USER') => {
    const isStaffSource = source === 'STAFF';
    const other = isStaffSource ? conv.otherStaff : conv.user;
    return {
      id: conv.id,
      // Tab mapping: staff-side conversations appear under the
      // "Support Conversations" tab; ordinary user conversations appear
      // under the "Internal Conversations" tab.
      type: isStaffSource ? CONVERSATION_TABS.SUPPORT : CONVERSATION_TABS.INTERNAL,
      otherUserId: isStaffSource ? conv.otherStaffId : conv.userId,
      otherUserName: other?.fullName || 'User',
      otherUserEmail: other?.email || '',
      isPremium: other?.isPremium === true,
      usesFallbackUserName: !other?.fullName,
      otherUserRole: other?.role || 'USER',
      otherUserImage: other?.profileImage || other?.image || null,
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      time: conv.time,
      unread: conv.unread,
      role: other?.role || 'USER',
      updatedAt: conv.updatedAt,
      escalated: conv.type === 'ESCALATED',
      complaintId: conv.complaintId || null,
    };
  };

  const loadVisibleConversations = async () => {
    // Data source -> tab mapping (do not swap):
    //   /api/support/conversations       -> WORKER/EMPLOYER user conversations
    //                                       -> "Internal Conversations" tab
    //   /api/chat/internal/conversations -> ADMIN/SUPPORT staff conversations
    //                                       -> "Support Conversations" tab
    const [userConversations, staffConversations] = await Promise.all([
      getSupportConversations(),
      getInternalConversations(),
    ]);
    return [
      ...userConversations.map((conv) => mapConversation(conv, 'USER')),
      ...staffConversations.map((conv) => mapConversation(conv, 'STAFF')),
    ];
  };

  const loadConversations = async () => {
    if (!authUser?.id) return;

    try {
      // Use the secure support conversations endpoint.
      // Support only sees conversations assigned to them.
      const mapped = await loadVisibleConversations();

      setConversations(mapped);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };
// ============================================================
  // useEffects - EXACT SAME AS ADMIN
  // ============================================================
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'SUPPORT' && authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    // Initial load - only conversations, NOT all users
    setLoading(true);
    loadConversations().finally(() => {
      setLoading(false);
    });
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // One polling loop refreshes both the secure conversation list and the
  // selected conversation. A second overlapping loop previously duplicated
  // conversation requests on this page.
  useEffect(() => {
    if (!authUser) return;

    intervalRef.current = setInterval(async () => {
      const mapped = await loadVisibleConversations();

      setConversations(prevConversations => {
        const targetId = requestedConversationId || selectedConversationId;
        const retainedTarget = targetId
          ? prevConversations.find((conversation) => String(conversation.id) === String(targetId))
          : null;
        const hasTarget = targetId && mapped.some((conversation) => String(conversation.id) === String(targetId));
        const nextConversations = retainedTarget && !hasTarget
          ? [retainedTarget, ...mapped]
          : mapped;
        if (JSON.stringify(prevConversations) !== JSON.stringify(nextConversations)) {
          return nextConversations;
        }
        return prevConversations;
      });

      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
            markMessagesAsRead(selectedConversationId, authUser.id);
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [authUser, selectedConversationId]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
useEffect(() => {
    const userId = authUser?.id;
    if (!userId || !selectedConversationId) return;

    const unsubscribe = onSocketEvent(userId, 'message:new', (payload) => {
      if (String(payload.conversationId) !== String(selectedConversationId)) return;
      setMessages(prev => {
        if (prev.some(msg => String(msg.id) === String(payload.id))) return prev;
        return [...prev, payload];
      });
    });

    return unsubscribe;
  }, [authUser?.id, selectedConversationId]);

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || !selectedConversationId) return;

    const unsubscribe = onSocketEvent(userId, 'typing:update', (payload) => {
      if (String(payload.conversationId) !== String(selectedConversationId)) return;
      if (String(payload.userId) === String(userId)) return;

      if (payload.isTyping) {
        setOtherUserTyping(true);
        if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
        typingStaleTimerRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 4500);
      } else {
        setOtherUserTyping(false);
        if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
      }
    });

    return () => {
      unsubscribe();
      if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    };
  }, [authUser?.id, selectedConversationId]);

  useEffect(() => {
    // Emit typing:stop for the OLD conversation before switching
    if (typingStartEmittedRef.current && typingContextRef.current) {
      const socket = getSocket(authUserIdRef.current);
      if (socket) {
        socket.emit('typing:stop', {
          conversationId: typingContextRef.current.conversationId,
          recipientId: typingContextRef.current.recipientId
        });
      }
      typingContextRef.current = null;
    }
    setOtherUserTyping(false);
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    typingStartEmittedRef.current = false;
  }, [selectedConversationId]);

  // On unmount: emit typing:stop if currently typing, then clear timers
  useEffect(() => {
    return () => {
      if (typingStartEmittedRef.current && typingContextRef.current) {
        const socket = getSocket(authUserIdRef.current);
        if (socket) {
          socket.emit('typing:stop', {
            conversationId: typingContextRef.current.conversationId,
            recipientId: typingContextRef.current.recipientId
          });
        }
      }
      if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
      if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    };
  }, []);
const loadMessagesForConversation = async (conversationId) => {
    const conversationMessages = await getConversationMessages(conversationId);
    setMessages(conversationMessages);

    const userId = authUser?.id;
    if (userId) {
      markMessagesAsRead(conversationId, userId)
        .catch((error) => console.error('Error marking messages as read:', error));
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectConversation = (conversationId) => {
    setArchiveError('');
    setSelectedConversationId(conversationId);
    setOtherUserTyping(false);
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    loadMessagesForConversation(conversationId);
    // Mobile: opening a chat hides the conversation list until the back button.
    if (window.innerWidth < 768) {
      setShowConversationList(false);
    }
  };

  // Deep-link only to conversations already returned by the server's
  // membership/assignment-scoped list. Unknown IDs remain unselected.
  useEffect(() => {
    const targetId = requestedConversationId;
    const targetKey = targetId ? String(targetId) : null;
    if (
      !targetKey
      || handledRequestedConversationIdRef.current === targetKey
      || selectedConversationId
      || conversations.length === 0
    ) return;
    const conversation = conversations.find(
      (item) => String(item.id) === targetKey
    );
    if (conversation) {
      handledRequestedConversationIdRef.current = targetKey;
      if (conversation.type === CONVERSATION_TABS.SUPPORT || conversation.type === CONVERSATION_TABS.INTERNAL) {
        setActiveConversationTab(conversation.type);
      }
      handleSelectConversation(conversation.id);
    }
  }, [requestedConversationId, conversations, selectedConversationId]);

  // New conversations from this page reuse the existing authorized
  // ensure-conversation flow (server re-verifies roles from the database and
  // rejects self-conversations):
  //   Internal Conversations tab -> WORKER / EMPLOYER via /api/support/users
  //   Support Conversations tab  -> ADMIN / SUPPORT staff via the authorized
  //                                 staff directory
  const handleStartNewConversation = async (userId, userName, userRole) => {
    if (!authUser?.id) return;

    const normalizedUserRole = String(userRole || '').toUpperCase();
    const isStaffTarget = STAFF_TARGET_ROLES.has(normalizedUserRole);
    if (!isStaffTarget && !USER_TARGET_ROLES.has(normalizedUserRole)) return;

    const targetTab = isStaffTarget
      ? CONVERSATION_TABS.SUPPORT
      : CONVERSATION_TABS.INTERNAL;

    const ensuredConversation = await ensureConversationExists(
      authUser.id,
      authUser.fullName || 'Support',
      'SUPPORT',
      userId,
      userName,
      normalizedUserRole
    );
    const conversationId = typeof ensuredConversation === 'string'
      ? ensuredConversation
      : ensuredConversation?.conversationId || ensuredConversation?.id;
    if (!conversationId) return;
    const canonicalConversationId = String(conversationId);

    const newConversation = {
      id: canonicalConversationId,
      type: targetTab,
      otherUserId: String(userId),
      otherUserName: userName || 'User',
      usesFallbackUserName: !userName,
      otherUserRole: normalizedUserRole,
      otherUserImage: null,
      lastMessage: t.startConversationHere,
      unread: 0,
      role: normalizedUserRole,
      updatedAt: new Date().toISOString(),
    };

    let authorizedConversation = null;
    try {
      const refreshedConversations = await loadVisibleConversations();
      authorizedConversation = refreshedConversations.find(
        (conversation) => String(conversation.id) === canonicalConversationId
          && conversation.type === targetTab
      ) || null;
    } catch (error) {
      // The locally constructed row remains a safe fallback; message loading
      // still uses the existing server-side conversation authorization.
      console.warn('Unable to refresh the selected conversation:', error);
    }

    const conversationForList = authorizedConversation || newConversation;
    setActiveConversationTab(targetTab);
    setConversations((current) => [
      conversationForList,
      ...current.filter((conversation) => String(conversation.id) !== canonicalConversationId),
    ]);
    setShowNewConversationModal(false);
    // Use the same selection path as a manual conversation-row click. URL
    // synchronization remains available for reloads and notifications.
    handleSelectConversation(canonicalConversationId);
    navigate(`/support-messages?conversationId=${encodeURIComponent(canonicalConversationId)}`, { replace: true });
  };

  const getOtherUserId = () => {
    const c = conversations.find(c => c.id === selectedConversationId);
    return c?.otherUserId || null;
  };
const emitTypingEvent = (isTyping) => {
    const recipientId = getOtherUserId();
    if (!recipientId || !selectedConversationId || !authUser?.id) return;
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

  const handleConversationTabChange = (conversationType) => {
    if (conversationType === activeConversationTab) return;

    setActiveConversationTab(conversationType);
    if (requestedConversationId) {
      handledRequestedConversationIdRef.current = String(requestedConversationId);
    }

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);
    if (selectedConversation && selectedConversation.type !== conversationType) {
      setSelectedConversationId(null);
      setMessages([]);
      setOtherUserTyping(false);
      setDropdownOpen(false);
      setArchiveError('');
    }
    // Always reveal the conversation list after a tab switch (mobile-friendly).
    setShowConversationList(true);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.type === activeConversationTab
    && conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversationId || !authUser) {
      return;
    }

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) {
      return;
    }

    const draft = message.trim();
    const optimistic = createOptimisticMessage({
      conversationId: selectedConversationId,
      senderId: authUser.id,
      senderName: authUser.fullName || 'Support',
      senderRole: 'SUPPORT',
      recipientId: selectedConv.otherUserId,
      recipientName: selectedConv.otherUserName,
      text: draft,
    });
    setMessages((current) => [
      ...current.filter((item) => !(item.sendFailed && item.senderId === String(authUser.id) && item.text === draft)),
      optimistic,
    ]);
    setMessage('');
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    typingStartEmittedRef.current = false;
    emitTypingEvent(false);

    let result = null;
    try {
      result = await sendMessage(
        authUser.id,
        authUser.fullName || 'Support',
        'SUPPORT',
        selectedConv.otherUserId,
        selectedConv.otherUserName,
        draft
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    }

    if (result) {
      setMessages((current) => reconcileOptimisticMessage(current, optimistic.id, result));
      setRefreshKey(prev => prev + 1);
    } else {
      setMessages((current) => markOptimisticMessageFailed(current, optimistic.id));
      setMessage((current) => current || draft);
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    if (authUser) {
      const mapped = await loadVisibleConversations();
      setConversations(mapped);

      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        setMessages(updatedMessages);
        await markMessagesAsRead(selectedConversationId, authUser.id);
      }
    }

    setIsRefreshing(false);
  };
// ============================================================
  // SELECTED CONVERSATION + DISPLAY HELPERS
  // ============================================================
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const locales = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR', ru: 'ru-RU', tr: 'tr-TR', de: 'de-DE' };
    return date.toLocaleTimeString(locales[i18n.resolvedLanguage] || locales.en, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConversationDisplayName = (conversation) =>
    conversation?.usesFallbackUserName ? t.user : (conversation?.otherUserName || t.user);

  const getConversationPreview = (conversation) =>
    conversation?.isNewConversation ? t.startConversationHere : conversation?.lastMessage;

  const getConversationTime = (conversation) =>
    conversation?.time || formatTime(conversation?.lastMessageTime || conversation?.updatedAt);

  const getTabLabel = (conversationType) =>
    conversationType === CONVERSATION_TABS.INTERNAL ? t.internalConversations : t.supportConversations;

  const getEmptyState = () => ({
    title: activeConversationTab === CONVERSATION_TABS.SUPPORT
      ? t.noSupportConversations
      : t.noInternalConversations,
    description: activeConversationTab === CONVERSATION_TABS.SUPPORT
      ? t.noSupportConversationsDesc
      : t.noInternalConversationsDesc,
  });

  const tabUnread = {
    [CONVERSATION_TABS.SUPPORT]: conversations
      .filter((c) => c.type === CONVERSATION_TABS.SUPPORT)
      .reduce((sum, c) => sum + (c.unread || 0), 0),
    [CONVERSATION_TABS.INTERNAL]: conversations
      .filter((c) => c.type === CONVERSATION_TABS.INTERNAL)
      .reduce((sum, c) => sum + (c.unread || 0), 0),
  };

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const renderEmptyState = (title, description) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
        <MessageSquare size={24} className="text-green-600 dark:text-green-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">{description}</p>
      )}
    </div>
  );

  const renderConversationItem = (conv) => {
    const displayName = getConversationDisplayName(conv);
    const isSelected = selectedConversationId === conv.id;
    return (
      <button
        key={conv.id}
        onClick={() => handleSelectConversation(conv.id)}
        className={`w-full p-3 flex items-center gap-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition border-b border-gray-100 dark:border-gray-700 text-left ${
          isSelected ? 'bg-green-50 dark:bg-green-900/30 border-l-2 border-l-green-500' : ''
        }`}
      >
        <UserAvatar
          name={displayName}
          image={conv.otherUserImage || null}
          role={conv.role}
          size="md"
          className="border-2 border-green-500/30 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="truncate min-w-0">
              <UserDisplayName
                name={displayName}
                role={conv.role}
                isPremium={conv.isPremium}
                size="sm"
                defaultNameClassName="font-medium text-gray-900 dark:text-white"
              />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{getConversationTime(conv)}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{getConversationPreview(conv)}</p>
          <div className="flex items-center gap-2 mt-1">
            {presence[String(conv.otherUserId)] === true ? (
              <span className="text-xs text-green-500">{t.online}</span>
            ) : (
              <span className="text-xs text-gray-400">{t.offline}</span>
            )}
            {conv.unread > 0 && (
              <span className="inline-flex px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderConversationList = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.loadingConversations}</p>
        </div>
      );
    }
    const empty = getEmptyState();
    if (filteredConversations.length === 0) {
      return renderEmptyState(empty.title, empty.description);
    }
    return filteredConversations.map((conv) => renderConversationItem(conv));
  };
const renderChatPanel = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/40">
          <div className="text-center px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <MessageSquare size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.selectConversation}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.selectConversationDescription}</p>
          </div>
        </div>
      );
    }

    const displayName = getConversationDisplayName(selectedConversation);

    return (
      <>
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              name={displayName}
              image={selectedConversation.otherUserImage || null}
              role={selectedConversation.role}
              size="md"
              className="border-2 border-green-500/30 flex-shrink-0"
            />
            <div className="min-w-0">
              <UserDisplayName
                name={displayName}
                role={selectedConversation.role}
                isPremium={selectedConversation.isPremium}
                size="sm"
                defaultNameClassName="font-medium text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">{getTabLabel(selectedConversation.type)}</p>
              {presence[String(selectedConversation.otherUserId)] === true ? (
                <p className="text-xs text-green-500">{t.online}</p>
              ) : (
                <p className="text-xs text-gray-400">{t.offline}</p>
              )}
              {otherUserTyping && (
                <p className="text-xs font-medium text-green-600 dark:text-green-400">{i18nT('typingIndicator')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={t.conversationOptions}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <MoreVertical size={18} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {/* Archive applies to ordinary user (SUPPORT-type) conversations,
                    which are listed under the Internal Conversations tab. */}
                {selectedConversation.type === CONVERSATION_TABS.INTERNAL && (
                  <button
                    onClick={async () => {
                      setDropdownOpen(false);
                      setArchiveError('');
                      if (selectedConversationId) {
                        try {
                          const success = await archiveConversation(selectedConversationId);
                          if (success) {
                            setConversations(prev => prev.filter(c => c.id !== selectedConversationId));
                            setSelectedConversationId(null);
                            setMessages([]);
                            setShowConversationList(true);
                          } else {
                            setArchiveError('Unable to archive this conversation.');
                          }
                        } catch (error) {
                          console.error('Failed to archive support conversation:', error);
                          setArchiveError('Unable to archive this conversation.');
                        }
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition"
                  >
                    {t.deleteConversation}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
{/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/40 min-h-0">
          {archiveError && (
            <div role="alert" className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {archiveError}
            </div>
          )}
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.noMessages}</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              // MESSAGE OWNERSHIP: self/other is decided by sender identity,
              // never by role (important for Support <-> Support chats).
              const isSelf = String(msg.senderId) === String(authUser?.id);
              const prev = messages[idx - 1];
              const isFirstInGroup = idx === 0 || String(prev?.senderId) !== String(msg.senderId);
              const counterpartId = selectedConversation?.otherUserId;
              const isCounterpart = !isSelf && (
                !msg.senderId ||
                String(msg.senderId) === String(counterpartId)
              );
              const senderImage = msg.sender?.image ||
                msg.sender?.profileImage ||
                msg.senderImage ||
                msg.avatar ||
                msg.profileImage ||
                msg.image ||
                (isCounterpart ? (selectedConversation?.otherUserImage || null) : null);
              const senderName = msg.senderName || msg.sender?.name || displayName;
              const senderRole = msg.senderRole || msg.sender?.role || selectedConversation?.role || 'USER';

              return (
                <div key={msg.id || idx} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {!isSelf && (
                    isFirstInGroup ? (
                      <UserAvatar
                        name={senderName}
                        image={senderImage}
                        role={senderRole}
                        size="sm"
                        className="flex-shrink-0 border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )
                  )}
<div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    isSelf
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                  }`}>
                    {!isSelf && (
                      <div className="mb-1">
                        <UserDisplayName
                          name={senderName}
                          role={senderRole}
                          isPremium={msg.senderIsPremium || msg.sender?.isPremium}
                          size="sm"
                          className="text-green-600 dark:text-green-400"
                        />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                      isSelf ? 'text-green-100' : 'text-gray-400'
                    }`}>
                      {msg.time || formatTime(msg.timestamp)}
                      {msg.sendFailed && (
                        <AlertTriangle size={13} className="text-red-500" title={i18nT('adminMessagesPage.errors.send')} />
                      )}
                      {isSelf && (
                        <CheckCheck
                          size={14}
                          className={msg.read ? 'text-green-300' : 'text-green-200'}
                          aria-label={msg.read ? t.read : t.sent}
                        />
                      )}
                    </p>
                  </div>
                  {isSelf && (
                    isFirstInGroup ? (
                      <UserAvatar
                        name={authUser?.fullName || t.supportAgent}
                        image={authUser?.profileImage || null}
                        role="SUPPORT"
                        size="sm"
                        className="flex-shrink-0 border-2 border-green-200"
                      />
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
{/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder={t.typeMessage}
              className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 text-sm font-medium flex-shrink-0 disabled:opacity-50"
            >
              <Send size={16} />
              {t.send}
            </button>
          </form>
        </div>
      </>
    );
  };
return (
    <SupportLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Compact Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewConversationModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={16} />
                {t.newConversation}
              </button>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? i18nT('adminMessagesPage.refreshing') : t.refresh}
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div role="tablist" aria-label={t.title} className="flex gap-2 flex-wrap">
            {[
              { type: CONVERSATION_TABS.SUPPORT, label: t.supportConversations },
              { type: CONVERSATION_TABS.INTERNAL, label: t.internalConversations },
            ].map((tab) => {
              const Icon = SUPPORT_TAB_META[tab.type]?.icon || MessageSquare;
              const isActive = activeConversationTab === tab.type;
              const unread = tabUnread[tab.type] || 0;
              return (
                <button
                  key={tab.type}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleConversationTabChange(tab.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-green-600 text-white font-medium shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {unread > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-black/20' : 'bg-green-500/20 text-green-700 dark:text-green-400'
                    }`}>
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
{/* Split View Chat Interface */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* LEFT PANEL - Conversation List */}
          <div className={`${showConversationList ? 'w-80' : 'hidden'} md:w-80 md:flex border-r border-gray-200 dark:border-gray-700 flex-col bg-white dark:bg-gray-800 min-h-0`}>
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              {renderConversationList()}
            </div>
          </div>

          {/* RIGHT PANEL - Conversation View */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-gray-50 dark:bg-gray-900/40">
            {selectedConversation && (
              <button
                onClick={() => setShowConversationList(true)}
                className="md:hidden p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 bg-white dark:bg-gray-800 text-left"
              >
                <ChevronRight size={16} className="rotate-180" />
                <span className="text-sm">{i18nT('adminMessagesPage.back')}</span>
              </button>
            )}
            {renderChatPanel()}
          </div>
        </div>
      </div>

      {showNewConversationModal && (
        <NewConversationModal
          onSelectUser={handleStartNewConversation}
          onClose={() => setShowNewConversationModal(false)}
          t={t}
          activeTab={activeConversationTab}
        />
      )}
    </SupportLayout>
  );
};
// New Conversation Modal Component (tab-aware single modal)
//   Internal Conversations tab -> eligible ordinary users (WORKER / EMPLOYER)
//                                  via the existing authorized /api/support/users
//                                  lookup
//   Support Conversations tab  -> ADMIN / SUPPORT staff via the authorized
//                                  /api/chat/staff-directory endpoint
// Both sources are server-authorized; no staff/user rows are faked here.
const NewConversationModal = ({ onSelectUser, onClose, t, activeTab }) => {
  const isStaffMode = activeTab === CONVERSATION_TABS.SUPPORT;
  const [searchTerm, setSearchTerm] = useState('');
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (term = '') => {
    setLoading(true);
    try {
      if (isStaffMode) {
        // Authorized staff directory (server excludes the caller and returns
        // only ADMIN/SUPPORT with minimal safe fields).
        const response = await api.get('/api/chat/staff-directory');
        if (response.data?.success) {
          const needle = term.trim().toLowerCase();
          setUserList((response.data.staff || []).filter((staff) => (
            STAFF_TARGET_ROLES.has(String(staff.role || '').toUpperCase())
            && (!needle
              || String(staff.fullName || '').toLowerCase().includes(needle)
              || String(staff.email || '').toLowerCase().includes(needle))
          )));
        }
        return;
      }

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        eligibleForSupportChat: 'true',
      });
      if (term.trim()) params.set('search', term.trim());

      const response = await api.get(`/api/support/users?${params.toString()}`);
      if (response.data?.success) {
        setUserList((response.data.users || []).filter((user) => (
          USER_TARGET_ROLES.has(String(user.role || '').toUpperCase())
        )));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(searchTerm), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isStaffMode]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t.newConversation}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isStaffMode ? t.supportConversations : t.internalConversations}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={t.close}>
            ✕
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t.loadingUsers}</p>
            </div>
          ) : userList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{isStaffMode ? t.noStaffTargets : t.noSupportTargets}</p>
          ) : (
            <div className="space-y-2">
              {userList.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user.id, user.fullName, user.role)}
                  className="w-full p-3 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition text-left"
                >
                  <UserAvatar
                    name={user.fullName}
                    image={user.profileImage || user.image || null}
                    role={user.role}
                    size="md"
                  />
                  <div className="min-w-0">
                    <UserDisplayName
                      user={user}
                      size="sm"
                      className="text-gray-900 dark:text-white"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportMessages;