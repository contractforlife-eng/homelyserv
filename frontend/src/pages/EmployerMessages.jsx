// src/pages/EmployerMessages.jsx - COMPLETE FIXED VERSION WITH WORKING NOTIFICATION BELL
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { UserAvatar, UserDisplayName } from '../components/users';
import {
  Home,
  User,
  Briefcase,
  FileCheck,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  CreditCard,
  Search,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Reply,
  Archive,
  Trash2,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Crown,
  Shield,
  MoreVertical,
  Paperclip,
  Smile,
  PhoneCall,
  Video,
  Info,
  CheckCheck,
  Loader2,
  AlertTriangle,
  RefreshCw
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

// ============================================================
// MAIN EMPLOYER MESSAGES COMPONENT - WITH WORKING NOTIFICATION BELL
// ============================================================
const EmployerMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { logout: authLogout } = useAuthStore();
  
  const { t } = useTranslation();
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
  const messageInputRef = useRef(null);
  const intervalRef = useRef(null);
  const autoOpenDoneRef = useRef(false);
  const dropdownRef = useRef(null);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();


  const formatSenderName = (senderName, senderRole) => {
    return formatDisplayName(senderName, senderRole);
  };

  // Load conversations
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }

    const userId = authUser.id;

    const loadInitialData = async () => {
      if (!userId) {
        return;
      }

      const userConversations = await getUserConversations(userId);
      console.log('📋 Initial load - employer conversations:', userConversations);
      setConversations(userConversations);
      setConversationsLoaded(true);
    };

    loadInitialData();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // Refresh conversations when refreshKey changes
  useEffect(() => {
    if (!authUser) return;
    
    const userId = authUser.id;
    if (!userId) return;
    
    (async () => {
      const userConversations = await getUserConversations(userId);
      console.log('🔄 Refresh load - employer conversations:', userConversations);
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
          console.log('🔄 Auto-refresh: Employer conversations updated');
          return updatedConversations;
        }
        return prevConversations;
      });

      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
            console.log('🔄 Auto-refresh: Employer messages updated for conversation:', selectedConversationId);
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

  // ============================================================
  // AUTO-OPEN CHAT FROM MY HIRES / PAYMENTS PAGE
  // Waits until conversations have loaded, then finds-or-creates
  // and selects the conversation. Latches only after data is ready.
  // ============================================================
  useEffect(() => {
    if (!authUser || !conversationsLoaded || autoOpenDoneRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const stateConvId = location.state?.conversationId;
    const workerId = location.state?.workerId || params.get('workerId');
    const workerName = location.state?.workerName || params.get('workerName');

    // Nothing to auto-open
    if (!stateConvId && !workerId) return;

    autoOpenDoneRef.current = true;

    const openConversation = async () => {
      const userId = authUser.id;
      const wid = workerId ? String(workerId).trim() : null;

      // 1) Prefer direct conversation id passed via navigation state
      let target = stateConvId
        ? conversations.find(c => String(c.id) === String(stateConvId))
        : null;

      // 2) Fall back to matching by worker (other user) id
      if (!target && wid) {
        target = conversations.find(c => String(c.otherUserId).trim() === wid);
      }

      // 3) Deterministic id (same algorithm as backend) as a last-resort id
      if (!target && wid) {
        const deterministicId = getConversationId(userId, wid);
        target = conversations.find(c => String(c.id) === String(deterministicId));
      }

      if (target) {
        console.log('✅ Auto-opening existing conversation:', target.id);
        setSelectedConversationId(target.id);
        await loadMessagesForConversation(target.id);
        return;
      }

      // 4) No conversation yet -> create/ensure it, then open
      if (!wid) return;
      console.log('🔄 No existing conversation, ensuring one exists...');
      try {
        const conversationId = await ensureConversationExists(
          userId,
          authUser.fullName || 'Employer',
          'EMPLOYER',
          wid,
          workerName || 'Worker',
          'WORKER'
        );

        if (!conversationId) return;

        // Refresh list so the new conversation appears in the sidebar
        const updated = await getUserConversations(userId);
        setConversations(updated);

        console.log('✅ Auto-opening new conversation:', conversationId);
        setSelectedConversationId(conversationId);
        await loadMessagesForConversation(conversationId);
      } catch (err) {
        console.error('Error auto-opening conversation:', err);
      }
    };

    openConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, conversationsLoaded]);
  // Focus the message input & scroll to latest once a conversation is open
  useEffect(() => {
    if (!selectedConversationId) return;
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      messageInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [selectedConversationId]);

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

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const handleSelectConversation = (conversationId) => {
    console.log('📨 Selecting conversation:', conversationId);
    autoOpenDoneRef.current = true; // Prevent auto-open from overriding manual selection
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

    console.log('📤 [Employer] Sending message');
    console.log('  senderId:', authUser.id);
    console.log('  senderName:', authUser.fullName);
    console.log('  recipientId:', selectedConv.otherUserId);
    console.log('  recipientName:', selectedConv.otherUserName);
    console.log('  conversationId:', selectedConversationId);
    console.log('  text:', message);

    console.log('=== DEBUG ===');
    console.log('selectedConv.otherUserId:', selectedConv.otherUserId);
    console.log('selectedConv:', selectedConv);
    console.log('typeof selectedConv.otherUserId:', typeof selectedConv.otherUserId);
    console.log('=== END DEBUG ===');

    const result = await sendMessage(
      authUser.id,
      authUser.fullName || 'Employer',
      'EMPLOYER',
      selectedConv.otherUserId,
      selectedConv.otherUserName,
      message
    );

    console.log('📥 [Employer] sendMessage response:', result);

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

  const userProfileImage = authUser?.profileImage || null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerMessages.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t('employerMessages.title')}
        notificationUserId={authUser?.id}
        isPremium={userIsPremium}
        rightContent={
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {t('employerMessages.refresh')}
          </button>
        }
      />

        <div className="p-4 md:p-6">
          {/* Welcome Banner - TEAL THEME */}
          <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
                      alt={authUser.fullName || t('employerMessages.employer')}
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
                    <h1 className="text-2xl font-bold">{t('employerMessages.title')}</h1>
                    {userIsPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                        <Crown size={12} className="text-yellow-300" />
                        {t('employerMessages.premiumBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 mt-1">{t('employerMessages.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/90">
                  {authUser?.fullName || t('employerMessages.employer')}
                </span>
                <span className="px-2 py-1 bg-green-500/30 text-white text-xs rounded-full">
                  {t('employerMessages.chatCount', { count: conversations.length })}
                </span>
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="bg-purple-500/30 hover:bg-purple-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 backdrop-blur-sm border border-purple-400/30"
                >
                  <Shield size={12} />
                  {t('employerMessages.contactSupport')}
                </button>
                {!userIsPremium && (
                  <Link
                    to="/subscription"
                    className="bg-yellow-500/30 hover:bg-yellow-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 backdrop-blur-sm border border-yellow-400/30"
                  >
                    <Crown size={12} />
                    {t('employerMessages.getPremium')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* Conversations List */}
              <div className="border-r border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder={t('employerMessages.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto h-[calc(600px-73px)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerMessages.noConversations')}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t('employerMessages.noConversationsDesc')}</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:bg-gray-900 transition border-b border-gray-100 dark:border-gray-700 ${
                          selectedConversationId === conv.id ? 'bg-teal-50 dark:bg-teal-900/30' : ''
                        }`}
                      >
                        <UserAvatar
                          name={conv.otherUserName}
                          image={conv.avatar || null}
                          role={conv.role}
                          size="md"
                          className="border-2 border-teal-200"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-start">
                            <div className="truncate">
                              <UserDisplayName
                                name={conv.otherUserName}
                                role={conv.role}
                                size="sm"
                                className="text-gray-800 dark:text-white"
                              />
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{conv.time}</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 truncate">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-500">{t('employerMessages.online')}</span>
                            {conv.unread > 0 && (
                              <span className="px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">
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
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={conversations.find(c => c.id === selectedConversationId)?.otherUserName || t('employerMessages.worker')}
                          image={conversations.find(c => c.id === selectedConversationId)?.avatar || null}
                          role={conversations.find(c => c.id === selectedConversationId)?.role}
                          size="md"
                          className="border-2 border-teal-200"
                        />
                        <div>
                          <UserDisplayName
                            name={conversations.find(c => c.id === selectedConversationId)?.otherUserName}
                            role={conversations.find(c => c.id === selectedConversationId)?.role}
                            size="sm"
                            className="text-gray-800 dark:text-white"
                          />
                          <p className="text-xs text-green-500">{t('employerMessages.online')}</p>
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
                              {t('employerMessages.deleteConversation')}
                            </button>
                            <button
                              disabled
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2 cursor-not-allowed"
                            >
                              <Mail size={16} />
                              {t('employerMessages.markAsUnread')}
                            </button>
                            <button
                              disabled
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2 cursor-not-allowed"
                            >
                              <UserIcon size={16} />
                              {t('employerMessages.viewWorkerProfile')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/20">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                          <p>{t('employerMessages.noMessages')}</p>
                          <p className="text-sm">{t('employerMessages.startConversation')}</p>
                        </div>
                      ) : (
                        messages.map((msg, index) => {
                          const isEmployer = msg.senderRole === 'EMPLOYER';
                          const showAvatar = index === 0 || 
                            (index > 0 && messages[index - 1]?.senderRole !== msg.senderRole);
                          
                          return (
                            <div
                              key={msg.id || index}
                              className={`flex ${isEmployer ? 'justify-end' : 'justify-start'} items-end gap-2`}
                            >
                              {!isEmployer && showAvatar && (
                                <UserAvatar
                                  name={msg.senderName || t('employerMessages.user')}
                                  image={msg.sender?.image || msg.sender?.profileImage || conversations.find(c => c.id === selectedConversationId)?.avatar || null}
                                  role={msg.senderRole}
                                  size="sm"
                                  className="border border-gray-200 dark:border-gray-700"
                                />
                              )}
                              {!isEmployer && !showAvatar && (
                                <div className="w-8 flex-shrink-0"></div>
                              )}
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  isEmployer
                                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                                }`}
                              >
                                {!isEmployer && (
                                  <div className="mb-1">
                                    <UserDisplayName
                                      name={msg.senderName}
                                      role={msg.senderRole}
                                      size="sm"
                                      className="text-teal-600"
                                    />
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                                  isEmployer ? 'text-teal-200' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {msg.time}
                                  {isEmployer && (
                                    <CheckCheck size={14} className={msg.read ? 'text-green-300' : 'text-teal-200'} />
                                  )}
                                </p>
                              </div>
                              {isEmployer && showAvatar && (
                                <UserAvatar
                                  name={authUser?.fullName || t('employerMessages.employer')}
                                  image={authUser?.profileImage || null}
                                  role="EMPLOYER"
                                  size="sm"
                                  className="border-2 border-teal-200"
                                />
                              )}
                              {isEmployer && !showAvatar && (
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
                          ref={messageInputRef}
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t('employerMessages.typeMessage')}
                          className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                          disabled={!message.trim()}
                        >
                          <Send size={18} />
                          {t('employerMessages.send')}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('employerMessages.selectConversation')}</h3>
                      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerMessages.selectConversationDesc')}</p>
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
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t('employerMessages.contactSupport')}</h3>
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('employerMessages.selectSupportAgent')}</p>
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
                      <UserAvatar
                        name={user.fullName}
                        image={user.profileImage || user.image || null}
                        role={user.role}
                        size="md"
                        className="border-2 border-purple-300"
                      />
                      <div className="text-left">
                        <UserDisplayName
                          user={user}
                          size="sm"
                          className="text-gray-800 dark:text-white"
                        />
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

export default EmployerMessages;
