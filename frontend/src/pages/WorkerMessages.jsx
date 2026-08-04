// src/pages/WorkerMessages.jsx - WITH WORKING NOTIFICATIONS AND FIXED TOGGLES
import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../components/layout/DashboardContext';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  User,
  X,
  AlertTriangle,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Clock,
  CreditCard,
  Shield,
  RefreshCw,
  Crown,
  Trash2,
  Mail,
  User as UserIcon,
  Bell
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationId,
  ensureConversationExists,
  deleteConversation,
  formatDisplayName,
  getSupportUsers
} from '../utils/chatService';

// Main WorkerMessages Component - RED THEME WITH WORKING NOTIFICATIONS
const WorkerMessages = () => {
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [supportUsers, setSupportUsers] = useState([]);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const dropdownRef = useRef(null);

  const dashboard = useDashboard();

  // ============================================================
  // IS PREMIUM CHECK
  // ============================================================

  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  const translations = {
    en: {
      title: 'Messages',
      subtitle: 'Communicate with employers and professionals',
      searchPlaceholder: 'Search conversations...',
      typeMessage: 'Type a message...',
      send: 'Send',
      noConversations: 'No conversations yet',
      noConversationsDesc: 'Start applying for jobs to connect with employers',
      online: 'Online',
      offline: 'Offline',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading messages...',
      noMessages: 'No messages yet',
      startConversation: 'Start the conversation!',
      refresh: 'Refresh',
      newMessage: 'New message from {name}',
      acceptedOffer: 'You accepted an offer from {name}',
      typing: 'Typing...',
      premiumBadge: 'Premium Verified',
      getPremium: 'Get Premium',
      noNotifications: 'No new notifications'
    },
    ar: {
      title: 'الرسائل',
      subtitle: 'تواصل مع أصحاب العمل والمتخصصين',
      searchPlaceholder: 'ابحث في المحادثات...',
      typeMessage: 'اكتب رسالة...',
      send: 'إرسال',
      noConversations: 'لا توجد محادثات بعد',
      noConversationsDesc: 'ابدأ في التقديم على الوظائف للتواصل مع أصحاب العمل',
      online: 'متصل',
      offline: 'غير متصل',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الرسائل...',
      noMessages: 'لا توجد رسائل بعد',
      startConversation: 'ابدأ المحادثة!',
      refresh: 'تحديث',
      newMessage: 'رسالة جديدة من {name}',
      acceptedOffer: 'لقد قبلت عرضاً من {name}',
      typing: 'جاري الكتابة...',
      premiumBadge: 'مميز معتمد',
      getPremium: 'اشتراك مميز',
      noNotifications: 'لا توجد إشعارات جديدة'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  const formatSenderName = (senderName, senderRole) => {
    return formatDisplayName(senderName, senderRole);
  };

  // Auth check and loading
  useEffect(() => {
     if (authLoading) return;

     if (!isAuthenticated || !authUser) {
       return;
     }

     if (authUser.role !== 'WORKER') {
       return;
     }

      const userId = authUser.id;

      const loadInitialData = async () => {
        if (!userId) {
          return;
        }

        const userConversations = await getUserConversations(userId);
        console.log('📋 Initial load - worker conversations:', userConversations);
        setConversations(userConversations);
      };

      loadInitialData();
    }, [authUser, isAuthenticated, authLoading]);

  // Refresh conversations when refreshKey changes
  useEffect(() => {
    if (!authUser) return;
    
    const userId = authUser.id;
    if (!userId) return;
    
    (async () => {
      const userConversations = await getUserConversations(userId);
      console.log('🔄 Refresh load - worker conversations:', userConversations);
      setConversations(userConversations);
    })();
  }, [authUser, refreshKey]);

  // ============================================================
  // AUTO-REFRESH FROM SERVER
  // ============================================================
  useEffect(() => {
    if (!authUser) return;
    const userId = authUser.id;
    if (!userId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(async () => {
      const updatedConversations = await getUserConversations(userId);
      setConversations(prevConversations => {
        if (JSON.stringify(prevConversations) !== JSON.stringify(updatedConversations)) {
          console.log('🔄 Auto-refresh: Worker conversations updated');
          return updatedConversations;
        }
        return prevConversations;
      });

      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
            console.log('🔄 Auto-refresh: Worker messages updated for conversation:', selectedConversationId);
            markMessagesAsRead(selectedConversationId, userId);
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [authUser, selectedConversationId]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadMessagesForConversation = async (conversationId) => {
    console.log('📨 Loading messages for conversation:', conversationId);
    const conversationMessages = await getConversationMessages(conversationId);
    console.log('📋 Messages found:', conversationMessages);
    setMessages(conversationMessages);
    
    const userId = authUser?.id;
    if (userId) {
      await markMessagesAsRead(conversationId, userId);
    }
  };

  // Close dropdown when selected conversation changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [selectedConversationId]);

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

  // Load support users when modal opens
  useEffect(() => {
    if (showSupportModal) {
      getSupportUsers().then(users => {
        setSupportUsers(users);
      });
    }
  }, [showSupportModal]);

  const handleSelectConversation = (conversationId) => {
    console.log('📨 Selecting conversation:', conversationId);
    setSelectedConversationId(conversationId);
    loadMessagesForConversation(conversationId);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversationId || !authUser) {
      console.log('❌ Cannot send message: missing data');
      return;
    }

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) {
      console.log('❌ Conversation not found');
      return;
    }

    console.log('📤 [Worker] Sending message');
    console.log('  senderId:', authUser.id);
    console.log('  senderName:', authUser.fullName);
    console.log('  recipientId:', selectedConv.otherUserId);
    console.log('  recipientName:', selectedConv.otherUserName);
    console.log('  conversationId:', selectedConversationId);
    console.log('  text:', message);

    const result = await sendMessage(
      authUser.id,
      authUser.fullName || 'Worker',
      'WORKER',
      selectedConv.otherUserId,
      selectedConv.otherUserName,
      message
    );

    console.log('📥 [Worker] sendMessage response:', result);

    if (result) {
      console.log('✅ Message sent successfully, reloading messages...');
      await loadMessagesForConversation(selectedConversationId);
      setRefreshKey(prev => prev + 1);
      setMessage('');
    } else {
      console.log('❌ Failed to send message');
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    if (authUser) {
      const userId = authUser.id;
      const updatedConversations = await getUserConversations(userId);
      setConversations(updatedConversations);
      
      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        setMessages(updatedMessages);
        await markMessagesAsRead(selectedConversationId, userId);
      }
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const getAvatarForUser = (userId, userName) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=red&color=fff&size=100&bold=true`;
  };

  const userProfileImage = authUser?.profileImage || null;

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id}
        isPremium={userIsPremium}
      />

      <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
                      alt={authUser.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-white m-3" />
                  )}
                  {userIsPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white/50">
                      <Crown size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{t.title}</h1>
                    {userIsPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                        <Crown size={12} className="text-yellow-300" />
                        {t.premiumBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 mt-1">{t.subtitle}</p>
                </div>
              </div>
                <div className="flex items-center gap-2">
                <span className="text-sm text-white/90">
                  {authUser?.fullName || 'Worker'}
                </span>
                <span className="px-2 py-1 bg-green-500/30 text-white text-xs rounded-full">
                  {conversations.length} chats
                </span>
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="bg-purple-500/30 hover:bg-purple-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 backdrop-blur-sm border border-purple-400/30"
                >
                  <Shield size={12} />
                  Contact Support
                </button>
                {!userIsPremium && (
                  <Link
                    to="/subscription"
                    className="bg-yellow-500/30 hover:bg-yellow-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 backdrop-blur-sm border border-yellow-400/30"
                  >
                    <Crown size={12} />
                    {t.getPremium}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              <div className="border-r border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto h-[calc(600px-73px)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.noConversations}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t.noConversationsDesc}</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:bg-gray-900 transition border-b border-gray-100 dark:border-gray-700 ${
                          selectedConversationId === conv.id ? 'bg-red-50 dark:bg-red-900/30' : ''
                        }`}
                      >
                        <img
                          src={getAvatarForUser(conv.otherUserId, formatDisplayName(conv.otherUserName, conv.role))}
                          alt={formatDisplayName(conv.otherUserName, conv.role)}
                          className="w-12 h-12 rounded-full object-cover border-2 border-red-200"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-gray-800 dark:text-white truncate">{formatDisplayName(conv.otherUserName, conv.role)}</p>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{conv.time}</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 truncate">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-500">{t.online}</span>
                            {conv.unread > 0 && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
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

              <div className="col-span-2 flex flex-col h-[600px]">
                {selectedConversationId ? (
                  <>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarForUser(
                            conversations.find(c => c.id === selectedConversationId)?.otherUserId,
                            formatDisplayName(conversations.find(c => c.id === selectedConversationId)?.otherUserName, conversations.find(c => c.id === selectedConversationId)?.role)
                          )}
                          alt="Chat"
                          className="w-10 h-10 rounded-full object-cover border-2 border-red-200"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {formatDisplayName(conversations.find(c => c.id === selectedConversationId)?.otherUserName, conversations.find(c => c.id === selectedConversationId)?.role)}
                          </p>
                          <p className="text-xs text-green-500">{t.online}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 relative" ref={dropdownRef}>
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition">
                          <Phone size={18} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition">
                          <Video size={18} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                        >
                          <MoreVertical size={18} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        {dropdownOpen && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                            <button
                              onClick={async () => {
                                setDropdownOpen(false);
                                if (selectedConversationId) {
                                  const success = await deleteConversation(selectedConversationId);
                                  if (success) {
                                    console.log('🗑️ Deleted conversation:', selectedConversationId);
                                    const userId = authUser?.id || authUser?.email;
                                    if (userId) {
                                      const updated = await getUserConversations(userId);
                                      setConversations(updated);
                                    }
                                    setSelectedConversationId(null);
                                    setMessages([]);
                                  }
                                }
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:bg-red-900/30 flex items-center gap-2 transition"
                            >
                              <Trash2 size={16} />
                              Delete Conversation
                            </button>
                            <button
                              disabled
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2 cursor-not-allowed"
                            >
                              <Mail size={16} />
                              Mark as unread
                            </button>
                            <button
                              disabled
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2 cursor-not-allowed"
                            >
                              <UserIcon size={16} />
                              View Employer Profile
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/20">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                          <p>{t.noMessages}</p>
                          <p className="text-sm">{t.startConversation}</p>
                        </div>
                      ) : (
                        messages.map((msg, index) => {
                          const isWorker = msg.senderRole === 'WORKER';
                          const showAvatar = index === 0 || 
                            (index > 0 && messages[index - 1]?.senderRole !== msg.senderRole);
                          
                          return (
                            <div
                              key={msg.id || index}
                              className={`flex ${isWorker ? 'justify-end' : 'justify-start'} items-end gap-2`}
                            >
                              {!isWorker && showAvatar && (
                                <img
                                  src={getAvatarForUser(
                                    conversations.find(c => c.id === selectedConversationId)?.otherUserId,
                                    msg.senderName || 'User'
                                  )}
                                  alt={msg.senderName}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                />
                              )}
                              {!isWorker && !showAvatar && (
                                <div className="w-8 flex-shrink-0"></div>
                              )}
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  isWorker
                                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                                }`}
                              >
                                {!isWorker && (
                                  <p className="text-xs font-medium text-red-600 mb-1">
                                    {formatSenderName(msg.senderName, msg.senderRole)}
                                  </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                                  isWorker ? 'text-red-200' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {msg.time}
                                  {isWorker && (
                                    <CheckCheck size={14} className={msg.read ? 'text-green-300' : 'text-red-200'} />
                                  )}
                                </p>
                              </div>
                              {isWorker && showAvatar && (
                                <img
                                  src={userProfileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.fullName || 'Worker')}&background=red&color=fff&size=100&bold=true`}
                                  alt={authUser.fullName || 'Worker'}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-red-200 flex-shrink-0"
                                />
                              )}
                              {isWorker && !showAvatar && (
                                <div className="w-8 flex-shrink-0"></div>
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
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t.typeMessage}
                          className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
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
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Select a conversation</h3>
                      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Choose a conversation from the list to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Support Modal */}
          {showSupportModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Contact Support</h3>
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Select a support agent to start a conversation:</p>
                <div className="space-y-2">
                  {supportUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={async () => {
                        setShowSupportModal(false);
                        const conversationId = await ensureConversationExists(
                          authUser.id,
                          authUser.fullName,
                          authUser.role,
                          user.id,
                          user.fullName,
                          user.role
                        );
                        setSelectedConversationId(conversationId);
                        loadMessagesForConversation(conversationId);
                      }}
                      className="w-full p-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
                    >
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formatDisplayName(user.fullName, user.role))}&background=purple&color=fff&size=100&bold=true`}
                        alt={formatDisplayName(user.fullName, user.role)}
                        className="w-10 h-10 rounded-full object-cover border-2 border-purple-300"
                      />
                      <div className="text-left">
                        <p className="font-semibold text-gray-800 dark:text-white">{formatDisplayName(user.fullName, user.role)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
</div>
    </DashboardLayout>
  );
};

export default WorkerMessages;