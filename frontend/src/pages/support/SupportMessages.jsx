// Support Messages Page - Reuses existing chat system
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import api from '../../utils/api';
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  deleteConversation,
  getSupportConversations,
  getInternalConversations,
  ensureConversationExists,
  getSupportConversationMessages,
  escalateConversation,
  createOptimisticMessage,
  reconcileOptimisticMessage,
  markOptimisticMessageFailed
} from '../../utils/chatService';
import { onSocketEvent, getSocket } from '../../utils/socket';
import { UserAvatar, UserDisplayName } from '../../components/users';

const SupportMessages = () => {
  const { t: i18nT } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get('conversationId');
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const dropdownRef = useRef(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingStartTimerRef = useRef(null);
  const typingStaleTimerRef = useRef(null);
  const typingStartEmittedRef = useRef(false);
  const typingContextRef = useRef(null);
  const authUserIdRef = useRef(authUser?.id);

  // Keep authUserIdRef in sync with the latest authUser id
  useEffect(() => {
    authUserIdRef.current = authUser?.id;
  });

  const t = i18nT('supportMessagesPage', { returnObjects: true });

  // ============================================================
  // loadConversations - SECURE: only assigned support conversations
  // ============================================================
  const mapConversation = (conv, internal = false) => {
    const other = internal ? conv.otherStaff : conv.user;
    return {
      id: conv.id,
      type: conv.type || 'INTERNAL',
      otherUserId: internal ? conv.otherStaffId : conv.userId,
      otherUserName: other?.fullName || 'User',
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
    const [supportConversations, internalConversations] = await Promise.all([
      getSupportConversations(),
      getInternalConversations(),
    ]);
    return [
      ...supportConversations.map((conv) => mapConversation(conv)),
      ...internalConversations.map((conv) => mapConversation(conv, true)),
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
        if (JSON.stringify(prevConversations) !== JSON.stringify(mapped)) {
          return mapped;
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
    setSelectedConversationId(conversationId);
    setOtherUserTyping(false);
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    loadMessagesForConversation(conversationId);
  };

  // Deep-link only to conversations already returned by the server's
  // membership/assignment-scoped list. Unknown IDs remain unselected.
  useEffect(() => {
    if (!requestedConversationId || selectedConversationId || conversations.length === 0) return;
    const conversation = conversations.find(
      (item) => String(item.id) === String(requestedConversationId)
    );
    if (conversation) handleSelectConversation(conversation.id);
  }, [requestedConversationId, conversations, selectedConversationId]);

  const handleStartNewConversation = async (userId, userName, userRole) => {
    if (!authUser?.id) return;

    const conversationId = await ensureConversationExists(
      authUser.id,
      authUser.fullName || 'Support',
      'SUPPORT',
      userId,
      userName,
      userRole
    );

    const newConversation = {
      id: conversationId,
      type: 'SUPPORT',
      otherUserId: String(userId),
      otherUserName: userName || 'User',
      usesFallbackUserName: !userName,
      otherUserRole: userRole || 'USER',
      otherUserImage: null,
      lastMessage: t.startConversationHere,
      unread: 0,
      role: userRole || 'USER',
      updatedAt: new Date().toISOString(),
    };

    setConversations((current) => [
      newConversation,
      ...current.filter((conversation) => conversation.id !== conversationId),
    ]);
    setSelectedConversationId(conversationId);
    setMessages([]);
    setShowNewConversationModal(false);
    await loadMessagesForConversation(conversationId);
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

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getConversationDisplayName = (conversation) =>
    conversation?.usesFallbackUserName ? t.user : (conversation?.otherUserName || t.user);

  const getConversationPreview = (conversation) =>
    conversation?.isNewConversation ? t.startConversationHere : conversation?.lastMessage;

  return (
    <SupportLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-white/80 mt-1">{t.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNewConversationModal(true)}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg transition"
            >
              {t.newConversation}
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Conversations List */}
            <div className="border-r border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(600px-73px)]">
                {loading ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {t.loadingConversations}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-gray-500 dark:text-gray-400">{t.noConversations}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t.noConversationsDesc}</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 ${
                        selectedConversationId === conv.id ? 'bg-green-50 dark:bg-green-900/30' : ''
                      }`}
                    >
                      <UserAvatar
                        name={getConversationDisplayName(conv)}
                        image={conv.otherUserImage || null}
                        role={conv.role}
                        size="md"
                        className="border-2 border-green-200"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-start">
                          <div className="truncate">
                            <UserDisplayName
                              name={getConversationDisplayName(conv)}
                              role={conv.role}
                              isPremium={conv.isPremium}
                              size="sm"
                              className="text-gray-800 dark:text-white"
                            />
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{conv.time}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{getConversationPreview(conv)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-green-500">{t.online}</span>
                          {conv.unread > 0 && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
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

            {/* Messages Area */}
            <div className="col-span-2 flex flex-col h-[600px]">
              {selectedConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/30">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                          name={getConversationDisplayName(conversations.find(c => c.id === selectedConversationId))}
                          image={conversations.find(c => c.id === selectedConversationId)?.otherUserImage || null}
                          role={conversations.find(c => c.id === selectedConversationId)?.role}
                          isPremium={conversations.find(c => c.id === selectedConversationId)?.isPremium}
                          size="md"
                          className="border-2 border-green-200"
                        />
                      <div>
                        <UserDisplayName
                          name={getConversationDisplayName(conversations.find(c => c.id === selectedConversationId))}
                          role={conversations.find(c => c.id === selectedConversationId)?.role}
                          isPremium={conversations.find(c => c.id === selectedConversationId)?.isPremium}
                          size="sm"
                          className="text-gray-800 dark:text-white"
                        />
                          <p className="text-xs text-green-500">{t.online}</p>
                          {otherUserTyping && (
                            <p className="text-xs font-medium text-green-600 dark:text-green-400">{t('typingIndicator')}</p>
                          )}
                        </div>
                    </div>
                    <div className="flex gap-2 relative" ref={dropdownRef}>
                      <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        title={t.refresh}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                      >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        title={t.conversationOptions}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                          <button
                            onClick={async () => {
                              setDropdownOpen(false);
                              if (selectedConversationId) {
                                const success = await deleteConversation(selectedConversationId);
                                if (success) {
                                  setConversations(prev => prev.filter(c => c.id !== selectedConversationId));
                                  setSelectedConversationId(null);
                                  setMessages([]);
                                }
                              }
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                          >
                            {t.deleteConversation}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/20">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <p>{t.noMessages}</p>
                        <p className="text-sm">{t.startConversation}</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isSupport = msg.senderRole === 'SUPPORT';
                        const showAvatar = index === 0 || 
                          (index > 0 && messages[index - 1]?.senderRole !== msg.senderRole);
                        
                        return (
                          <div
                            key={msg.id || index}
                            className={`flex ${isSupport ? 'justify-end' : 'justify-start'} items-end gap-2`}
                          >
                            {!isSupport && showAvatar && (
                              <UserAvatar
                                name={msg.senderName || t.user}
                                image={msg.sender?.image || msg.sender?.profileImage || conversations.find(c => c.id === selectedConversationId)?.otherUserImage || null}
                                role={msg.senderRole}
                                size="sm"
                                className="border border-gray-200"
                              />
                            )}
                            {!isSupport && !showAvatar && (
                              <div className="w-8 flex-shrink-0"></div>
                            )}
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                isSupport
                                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-br-none'
                                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                              }`}
                            >
                              {!isSupport && (
                                <div className="mb-1">
                                  <UserDisplayName
                                    name={msg.senderName}
                                    role={msg.senderRole}
                                    isPremium={msg.senderIsPremium || msg.sender?.isPremium}
                                    size="sm"
                                    className="text-green-600"
                                  />
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                              <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                                isSupport ? 'text-green-200' : 'text-gray-400'
                              }`}>
                                {msg.time}
                                {msg.sendFailed && (
                                  <AlertTriangle size={13} className="text-red-500" title={i18nT('adminMessagesPage.errors.send')} />
                                )}
                                {isSupport && (
                                  <CheckCheck
                                    size={14}
                                    className={msg.read ? 'text-green-300' : 'text-green-200'}
                                    aria-label={msg.read ? t.read : t.sent}
                                  />
                                )}
                              </p>
                            </div>
                            {isSupport && showAvatar && (
                              <UserAvatar
                                name={authUser?.fullName || t.supportAgent}
                                image={authUser?.profileImage || null}
                                role="SUPPORT"
                                size="sm"
                                className="border-2 border-green-200"
                              />
                            )}
                            {isSupport && !showAvatar && (
                              <div className="w-8 flex-shrink-0"></div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={handleMessageChange}
                        placeholder={t.typeMessage}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                        disabled={!message.trim()}
                      >
                        <Send size={18} />
                        {t.send}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.selectConversation}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{t.selectConversationDescription}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showNewConversationModal && (
          <NewConversationModal
            onSelectUser={handleStartNewConversation}
            onClose={() => setShowNewConversationModal(false)}
            t={t}
          />
        )}
      </div>
    </SupportLayout>
  );
};

// New Conversation Modal Component
const NewConversationModal = ({ users, onSelectUser, onClose, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async (term = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        eligibleForSupportChat: 'true',
      });
      if (term.trim()) params.set('search', term.trim());

      const response = await api.get(`/api/support/users?${params.toString()}`);
      if (response.data?.success) {
        setUserList(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t.newConversation}</h3>
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
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t.loadingUsers}</p>
            </div>
          ) : userList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t.noUsers}</p>
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
                  <div>
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
