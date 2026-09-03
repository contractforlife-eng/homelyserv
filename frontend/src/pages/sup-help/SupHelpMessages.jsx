// Sup-Help Messages Page - Internal staff messaging
// Layout mirrors the Support Messages page (red Sup-Help theme).
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
  AlertTriangle,
  Home,
  MessageCircle
} from 'lucide-react';
import {
  createOptimisticMessage,
  reconcileOptimisticMessage,
  markOptimisticMessageFailed
} from '../../utils/chatService';
import { onSocketEvent, getSocket } from '../../utils/socket';
import { UserAvatar, UserDisplayName } from '../../components/users';
import usePresence from '../../hooks/usePresence';

export const CONVERSATION_TABS = {
  SUPPORT: 'SUPPORT',
  INTERNAL: 'INTERNAL',
};

/**
 * Canonical tab classification for Sup-Help conversations:
 *
 * Counterpart role is authoritative:
 * - SUPPORT or ADMIN -> UI tab SUPPORT ("Support Conversations")
 * - WORKER or EMPLOYER -> UI tab INTERNAL ("Internal Conversations")
 *
 * Fallback to database conversation type if role is missing:
 * - INTERNAL (database staff conversation) -> UI tab SUPPORT
 * - SUPPORT (database user conversation) -> UI tab INTERNAL
 *
 * Security / consistency:
 * - PRIVATE conversations are never shown (returns null)
 */
export const getConversationTab = (conv) => {
  const rawType = String(conv?.rawType || conv?.type || '').toUpperCase();
  if (rawType === 'PRIVATE') {
    return null;
  }

  const role = String(conv?.otherUserRole || conv?.role || '').toUpperCase();
  if (role === 'SUPPORT' || role === 'ADMIN') {
    return CONVERSATION_TABS.SUPPORT;
  }
  if (role === 'WORKER' || role === 'EMPLOYER') {
    return CONVERSATION_TABS.INTERNAL;
  }

  const providedTab = String(conv?.tab || '').toUpperCase();
  if (providedTab === CONVERSATION_TABS.SUPPORT || providedTab === CONVERSATION_TABS.INTERNAL) {
    return providedTab;
  }

  if (rawType === 'INTERNAL') {
    return CONVERSATION_TABS.SUPPORT;
  }
  if (rawType === 'SUPPORT') {
    return CONVERSATION_TABS.INTERNAL;
  }

  return null;
};

const SUPPORT_TAB_META = {
  [CONVERSATION_TABS.SUPPORT]: { icon: Shield },
  [CONVERSATION_TABS.INTERNAL]: { icon: Users },
};

const SupHelpMessages = () => {
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
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingStartTimerRef = useRef(null);
  const typingStaleTimerRef = useRef(null);
  const typingStartEmittedRef = useRef(false);
  const typingContextRef = useRef(null);
  const authUserIdRef = useRef(authUser?.id);
  const selectedConversationIdRef = useRef(null);
  const handledRequestedConversationIdRef = useRef(null);

  useEffect(() => {
    authUserIdRef.current = authUser?.id;
  });

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const t = i18nT('supHelpMessagesPage', { returnObjects: true });

  const counterpartUserIds = conversations.map((c) => c.otherUserId).filter(Boolean);
  const presence = usePresence(counterpartUserIds, authUser?.id);

  // ============================================================
  // Data loading
  // ============================================================
  const mapConversation = (conv) => {
    const rawType = conv.rawType || conv.type;
    const role = (conv.otherUserRole || conv.role || '').toUpperCase();
    const uiTab = getConversationTab({ ...conv, rawType, otherUserRole: role });

    return {
      id: conv.id,
      type: uiTab,
      rawType,
      tab: uiTab,
      otherUserId: conv.otherUserId,
      otherUserName: conv.otherUserName || 'User',
      otherUserEmail: conv.otherUserEmail || '',
      otherUserRole: role || 'USER',
      otherUserImage: conv.otherUserImage || null,
      isPremium: conv.isPremium === true,
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      time: conv.time,
      unread: conv.unread || 0,
      role: role || 'USER',
      updatedAt: conv.updatedAt,
    };
  };

  const loadConversations = async () => {
    if (!authUser?.id) return;
    try {
      const response = await api.get('/api/sup-help/messages');
      const raw = response.data?.conversations || [];
      const mapped = raw.map(mapConversation).filter((c) => c.type !== null);
      setConversations(mapped);
    } catch (error) {
      console.error('Error loading sup-help conversations:', error);
      setConversations([]);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    if (authUser.role !== 'SUPPORT_HELPER' && authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    setLoading(true);
    loadConversations().finally(() => setLoading(false));
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!authUser) return;
    intervalRef.current = setInterval(async () => {
      try {
        const response = await api.get('/api/sup-help/messages');
        const raw = response.data?.conversations || [];
        const mapped = raw.map(mapConversation).filter((c) => c.type !== null);
        setConversations(prevConversations => {
          const targetId = requestedConversationId || selectedConversationIdRef.current;
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

        const currentSelected = selectedConversationIdRef.current;
        if (currentSelected) {
          const messagesResponse = await api.get(`/api/sup-help/messages/${encodeURIComponent(currentSelected)}`);
          if (String(selectedConversationIdRef.current) === String(currentSelected)) {
            const updatedMessages = messagesResponse.data?.messages || [];
            setMessages(prevMessages => {
              if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
                api.post(`/api/sup-help/messages/${encodeURIComponent(currentSelected)}/read`, { userId: authUser.id }).catch(() => {});
                return updatedMessages;
              }
              return prevMessages;
            });
          }
        }
      } catch (error) {
        console.warn('Poll error:', error.message);
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authUser, requestedConversationId]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId) return;

    const unsubscribe = onSocketEvent(userId, 'message:new', (payload) => {
      const activeId = selectedConversationIdRef.current;
      const payloadConvId = String(payload.conversationId);

      if (activeId && payloadConvId === String(activeId)) {
        setMessages(prev => {
          if (prev.some(msg => String(msg.id || msg._id) === String(payload.id || payload._id))) {
            return prev;
          }
          const matchingOptimistic = prev.find(msg =>
            msg.pending &&
            String(msg.senderId) === String(payload.senderId) &&
            msg.text === payload.text
          );
          if (matchingOptimistic) {
            return prev.map(msg => (msg.id === matchingOptimistic.id ? payload : msg));
          }
          return [...prev, payload];
        });
        api.post(`/api/sup-help/messages/${encodeURIComponent(activeId)}/read`, { userId }).catch(() => {});
      }

      setConversations(prev =>
        prev.map(conv => {
          if (String(conv.id) === payloadConvId) {
            const isForActiveThread = activeId && payloadConvId === String(activeId);
            return {
              ...conv,
              lastMessage: payload.text || conv.lastMessage,
              lastMessageTime: payload.timestamp || new Date().toISOString(),
              time: new Date(payload.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: isForActiveThread ? 0 : (conv.unread || 0) + 1,
              updatedAt: payload.timestamp || new Date().toISOString(),
            };
          }
          return conv;
        })
      );
    });

    return unsubscribe;
  }, [authUser?.id]);

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
    try {
      const response = await api.get(`/api/sup-help/messages/${encodeURIComponent(conversationId)}`);
      if (String(selectedConversationIdRef.current) !== String(conversationId)) {
        return;
      }
      const conversationMessages = response.data?.messages || [];
      setMessages(conversationMessages);

      const userId = authUser?.id;
      if (userId) {
        api.post(`/api/sup-help/messages/${encodeURIComponent(conversationId)}/read`, { userId })
          .catch((error) => console.error('Error marking messages as read:', error));
      }
    } catch (error) {
      console.error('Error loading messages for conversation:', error);
      if (String(selectedConversationIdRef.current) === String(conversationId)) {
        setMessages([]);
      }
    }
  };

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
    const targetId = String(conversationId);
    setSelectedConversationId(targetId);
    selectedConversationIdRef.current = targetId;
    setMessages([]);
    setOtherUserTyping(false);
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    loadMessagesForConversation(targetId);
    if (window.innerWidth < 768) {
      setShowConversationList(false);
    }
  };

  const handleConversationTabChange = (conversationType) => {
    if (conversationType === activeConversationTab) return;

    setActiveConversationTab(conversationType);
    if (requestedConversationId) {
      handledRequestedConversationIdRef.current = String(requestedConversationId);
    }

    const selectedConv = conversations.find(c => String(c.id) === String(selectedConversationIdRef.current));
    if (selectedConv && selectedConv.type !== conversationType) {
      setSelectedConversationId(null);
      selectedConversationIdRef.current = null;
      setMessages([]);
      setOtherUserTyping(false);
      setDropdownOpen(false);
      setArchiveError('');
    }
    setShowConversationList(true);
  };

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

  const handleStartNewConversation = async (userId, userName, userRole, tab) => {
    if (!authUser?.id) return;

    try {
      const targetTab = tab || activeConversationTab;
      const ensureResponse = await api.post('/api/sup-help/messages/ensure', {
        targetUserId: userId,
        tab: targetTab,
      });
      const conversationId = ensureResponse.data?.conversationId;
      if (!conversationId) return;
      const canonicalConversationId = String(conversationId);

      const normalizedRole = String(userRole || '').toUpperCase();
      const uiTab = getConversationTab({
        otherUserRole: normalizedRole,
        rawType: targetTab === CONVERSATION_TABS.SUPPORT ? 'INTERNAL' : 'SUPPORT',
      }) || targetTab;

      const newConversation = {
        id: canonicalConversationId,
        type: uiTab,
        rawType: targetTab === CONVERSATION_TABS.SUPPORT ? 'INTERNAL' : 'SUPPORT',
        tab: uiTab,
        otherUserId: String(userId),
        otherUserName: userName || 'User',
        otherUserRole: normalizedRole || 'USER',
        otherUserImage: null,
        lastMessage: t.startConversationHere,
        unread: 0,
        role: normalizedRole || 'USER',
        updatedAt: new Date().toISOString(),
      };

      let authorizedConversation = null;
      try {
        const response = await api.get('/api/sup-help/messages');
        const raw = response.data?.conversations || [];
        const mapped = raw.map(mapConversation).filter((c) => c.type !== null);
        authorizedConversation = mapped.find(
          (conversation) => String(conversation.id) === canonicalConversationId
        ) || null;
      } catch (error) {
        console.warn('Unable to refresh conversations:', error);
      }

      const conversationForList = authorizedConversation || newConversation;
      setConversations((current) => [
        conversationForList,
        ...current.filter((conversation) => String(conversation.id) !== canonicalConversationId),
      ]);
      setShowNewConversationModal(false);
      setActiveConversationTab(uiTab);
      handleSelectConversation(canonicalConversationId);
      navigate(`/sup-help/messages?conversationId=${encodeURIComponent(canonicalConversationId)}`, { replace: true });
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const currentConvId = selectedConversationIdRef.current;
    if (!message.trim() || !currentConvId || !authUser) {
      return;
    }

    const selectedConv = conversations.find(c => String(c.id) === String(currentConvId));
    if (!selectedConv) {
      return;
    }

    const draft = message.trim();
    const optimistic = createOptimisticMessage({
      conversationId: currentConvId,
      senderId: authUser.id,
      senderName: authUser.fullName || 'Sup-Help',
      senderRole: 'SUPPORT_HELPER',
      recipientId: selectedConv.otherUserId,
      recipientName: selectedConv.otherUserName,
      text: draft,
    });
    setMessages((current) => [
      ...current.filter((item) => !(item.sendFailed && item.senderId === String(authUser.id) && item.text === draft)),
      optimistic,
    ]);
    setMessage('');
    inputRef.current?.focus();

    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    typingStartEmittedRef.current = false;
    emitTypingEvent(false);

    let result = null;
    try {
      const response = await api.post('/api/sup-help/messages', {
        conversationId: currentConvId,
        recipientId: selectedConv.otherUserId,
        text: draft,
      });
      if (response.status === 200 || response.status === 201) {
        result = response.data;
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }

    if (result) {
      setMessages((current) => reconcileOptimisticMessage(current, optimistic.id, result));
      setRefreshKey(prev => prev + 1);
      inputRef.current?.focus();
    } else {
      setMessages((current) => markOptimisticMessageFailed(current, optimistic.id));
      setMessage((current) => current ? current : draft);
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (authUser) {
      await loadConversations();
      const currentConvId = selectedConversationIdRef.current;
      if (currentConvId) {
        const response = await api.get(`/api/sup-help/messages/${encodeURIComponent(currentConvId)}`);
        const updatedMessages = response.data?.messages || [];
        setMessages(updatedMessages);
        await api.post(`/api/sup-help/messages/${encodeURIComponent(currentConvId)}/read`, { userId: authUser.id });
      }
    }
    setIsRefreshing(false);
  };

  // ============================================================
  // Helpers
  // ============================================================
  const selectedConversation = conversations.find((c) => String(c.id) === String(selectedConversationId)) || null;

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
    conversation?.otherUserName || t.user;

  const getConversationPreview = (conversation) =>
    conversation?.lastMessage || '';

  const getConversationTime = (conversation) =>
    conversation?.time || formatTime(conversation?.lastMessageTime || conversation?.updatedAt);

  const getTabLabel = (type = selectedConversation?.type || activeConversationTab) =>
    type === CONVERSATION_TABS.SUPPORT
      ? t.supportConversations
      : t.internalConversations;

  const tabs = [
    {
      type: CONVERSATION_TABS.SUPPORT,
      label: t.supportConversations,
      icon: Shield,
    },
    {
      type: CONVERSATION_TABS.INTERNAL,
      label: t.internalConversations,
      icon: Users,
    },
  ];

  const tabUnread = {
    [CONVERSATION_TABS.SUPPORT]: conversations
      .filter((c) => c.type === CONVERSATION_TABS.SUPPORT)
      .reduce((sum, c) => sum + (c.unread || 0), 0),
    [CONVERSATION_TABS.INTERNAL]: conversations
      .filter((c) => c.type === CONVERSATION_TABS.INTERNAL)
      .reduce((sum, c) => sum + (c.unread || 0), 0),
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesTab = conv.type === activeConversationTab;
    const matchesSearch =
      !searchTerm.trim() ||
      conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.otherUserEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const renderConversationItem = (conv) => {
    const displayName = getConversationDisplayName(conv);
    const isSelected = String(selectedConversationId) === String(conv.id);
    const isOnline = Boolean(conv?.otherUserId && presence?.[String(conv.otherUserId)] === true);

    return (
      <button
        key={conv.id}
        onClick={() => handleSelectConversation(conv.id)}
        className={`w-full p-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-b border-gray-100 dark:border-gray-700 text-left ${
          isSelected ? 'bg-red-50 dark:bg-red-900/30 border-l-4 border-l-red-600' : ''
        }`}
      >
        <div className="relative flex-shrink-0">
          <UserAvatar
            name={displayName}
            image={conv.otherUserImage || null}
            role={conv.role}
            size="md"
          />
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={isOnline ? t.online : t.offline}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="truncate min-w-0">
              <UserDisplayName
                user={{
                  id: conv.otherUserId,
                  fullName: displayName,
                  role: conv.role,
                  isPremium: conv.isPremium,
                }}
                size="sm"
                className="font-medium text-gray-900 dark:text-white"
              />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{getConversationTime(conv)}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{getConversationPreview(conv)}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">
              {isOnline ? (
                <span className="text-green-600 dark:text-green-400">{t.online}</span>
              ) : (
                <span>{t.offline}</span>
              )}
            </span>
            {conv.unread > 0 && (
              <span className="inline-flex px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.loadingConversations}</p>
        </div>
      );
    }
    if (filteredConversations.length === 0) {
      const ActiveIcon = SUPPORT_TAB_META[activeConversationTab]?.icon || MessageSquare;
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <ActiveIcon size={24} />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {activeConversationTab === CONVERSATION_TABS.SUPPORT
              ? t.noSupportConversations
              : t.noInternalConversations}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
            {activeConversationTab === CONVERSATION_TABS.SUPPORT
              ? t.noSupportConversationsDesc
              : t.noInternalConversationsDesc}
          </p>
          <button
            type="button"
            onClick={() => setShowNewConversationModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition"
          >
            <Plus size={14} />
            {t.newConversation}
          </button>
        </div>
      );
    }
    return filteredConversations.map((conv) => renderConversationItem(conv));
  };

  const renderChatPanel = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/40">
          <div className="text-center px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <MessageSquare size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.selectConversation}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.selectConversationDescription}</p>
          </div>
        </div>
      );
    }

    const displayName = getConversationDisplayName(selectedConversation);
    const isOnline = Boolean(selectedConversation?.otherUserId && presence?.[String(selectedConversation.otherUserId)] === true);

    return (
      <>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <UserAvatar
                name={displayName}
                image={selectedConversation.otherUserImage || null}
                role={selectedConversation.role}
                size="md"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
                title={isOnline ? t.online : t.offline}
              />
            </div>
            <div className="min-w-0">
              <UserDisplayName
                user={{
                  id: selectedConversation.otherUserId,
                  fullName: displayName,
                  role: selectedConversation.role,
                  isPremium: selectedConversation.isPremium,
                }}
                size="sm"
                className="font-medium text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">{getTabLabel(selectedConversation?.type)}</p>
              {otherUserTyping ? (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{i18nT('typingIndicator')}</p>
              ) : (
                <p className="text-xs text-gray-400">
                  {isOnline ? (
                    <span className="text-green-600 dark:text-green-400">{t.online}</span>
                  ) : (
                    <span>{t.offline}</span>
                  )}
                </p>
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
                <button
                  onClick={async () => {
                    setDropdownOpen(false);
                    setArchiveError('');
                    if (selectedConversationId) {
                      try {
                        const response = await api.post(`/api/sup-help/messages/${encodeURIComponent(selectedConversationId)}/close`);
                        if (response.data?.success) {
                          setConversations(prev => prev.filter(c => c.id !== selectedConversationId));
                          setSelectedConversationId(null);
                          setMessages([]);
                          setShowConversationList(true);
                        } else {
                          setArchiveError('Unable to close this conversation.');
                        }
                      } catch (error) {
                        console.error('Failed to close conversation:', error);
                        setArchiveError('Unable to close this conversation.');
                      }
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition"
                >
                  {t.closeConversation || t.close || 'Close'}
                </button>
              </div>
            )}
          </div>
        </div>
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
              const isSelf = String(msg.senderId) === String(authUser?.id);
              const prev = messages[idx - 1];
              const isFirstInGroup = idx === 0 || String(prev?.senderId) !== String(msg.senderId);
              const senderImage = msg.sender?.image || msg.sender?.profileImage || null;
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
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                  }`}>
                    {!isSelf && isFirstInGroup && (
                      <div className="mb-1">
                        <UserDisplayName
                          user={{
                            id: msg.senderId,
                            fullName: senderName,
                            role: senderRole,
                            isPremium: msg.senderIsPremium || msg.sender?.isPremium,
                          }}
                          size="xs"
                          className="text-red-600 dark:text-red-400 font-medium"
                        />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                      isSelf ? 'text-red-100' : 'text-gray-400'
                    }`}>
                      {msg.time || formatTime(msg.timestamp)}
                      {msg.sendFailed && (
                        <AlertTriangle size={13} className="text-red-500" title={i18nT('adminMessagesPage.errors.send')} />
                      )}
                      {isSelf && (
                        <CheckCheck
                          size={14}
                          className={msg.read ? 'text-red-300' : 'text-red-200'}
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
                        role="SUPPORT_HELPER"
                        size="sm"
                        className="flex-shrink-0 border-2 border-red-200"
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder={t.typeMessage}
              className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 text-sm font-medium flex-shrink-0 disabled:opacity-50"
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
    <SupportLayout
      allowedRoles={['SUPPORT_HELPER', 'ADMIN']}
      role="SUPPORT_HELPER"
      menuItems={[
        { id: 'dashboard', label: i18nT('supHelpNavigation.dashboard'), icon: Home, path: '/sup-help' },
        { id: 'users', label: i18nT('supportNavigation.users'), icon: Users, path: '/sup-help/users' },
        { id: 'messages', label: i18nT('supportNavigation.messages'), icon: MessageCircle, path: '/sup-help/messages' },
      ]}
    >
      <div className="h-[calc(100vh-64px)] flex flex-col">
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
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={16} />
                {t.newConversation}
              </button>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? i18nT('adminMessagesPage.refreshing') : t.refresh}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div role="tablist" aria-label={t.title} className="flex gap-2 flex-wrap">
            {tabs.map((tab) => {
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
                      ? 'bg-red-600 text-white font-medium shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {unread > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-black/20' : 'bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className={`${showConversationList ? 'w-80' : 'hidden'} md:w-80 md:flex border-r border-gray-200 dark:border-gray-700 flex-col bg-white dark:bg-gray-800 min-h-0`}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              {renderConversationList()}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-gray-50 dark:bg-gray-900/40">
            {selectedConversation && (
              <button
                onClick={() => setShowConversationList(true)}
                className="md:hidden p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-gray-800 text-left"
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

const NewConversationModal = ({ onSelectUser, onClose, t, activeTab }) => {
  const isStaffMode = activeTab === CONVERSATION_TABS.SUPPORT;
  const [searchTerm, setSearchTerm] = useState('');
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (term = '') => {
    setLoading(true);
    try {
      if (isStaffMode) {
        const response = await api.get('/api/chat/staff-directory');
        if (response.data?.success) {
          const needle = term.trim().toLowerCase();
          setUserList((response.data.staff || []).filter((staff) => {
            const role = String(staff.role || '').toUpperCase();
            return ['SUPPORT', 'ADMIN'].includes(role)
              && (!needle
                || String(staff.fullName || '').toLowerCase().includes(needle)
                || String(staff.email || '').toLowerCase().includes(needle));
          }));
        }
      } else {
        const params = new URLSearchParams();
        if (term.trim()) params.set('search', term.trim());
        const response = await api.get(`/api/sup-help/users?${params.toString()}`);
        if (response.data?.success) {
          setUserList((response.data.users || []).filter((user) => {
            const role = String(user.role || '').toUpperCase();
            return ['WORKER', 'EMPLOYER'].includes(role);
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching modal users:', error);
      setUserList([]);
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t.loadingUsers}</p>
            </div>
          ) : userList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {isStaffMode ? t.noStaffTargets : t.noSupportTargets}
            </p>
          ) : (
            <div className="space-y-2">
              {userList.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user.id, user.fullName, user.role, activeTab)}
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

export default SupHelpMessages;
