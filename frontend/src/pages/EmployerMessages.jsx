// src/pages/EmployerMessages.jsx - COMPLETE FIXED VERSION WITH WORKING NOTIFICATION BELL
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
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
  deleteConversation
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
  
  const [language, setLanguage] = useState('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const autoOpenDoneRef = useRef(false);
  const dropdownRef = useRef(null);

  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  const translations = {
    en: {
      title: 'Messages',
      subtitle: 'Communicate with workers you\'ve hired',
      searchPlaceholder: 'Search conversations...',
      typeMessage: 'Type a message...',
      send: 'Send',
      noConversations: 'No conversations yet',
      noConversationsDesc: 'Start hiring workers to connect with them',
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
      getPremium: 'Get Premium'
    },
    ar: {
      title: 'الرسائل',
      subtitle: 'تواصل مع العمال الذين قمت بتوظيفهم',
      searchPlaceholder: 'ابحث في المحادثات...',
      typeMessage: 'اكتب رسالة...',
      send: 'إرسال',
      noConversations: 'لا توجد محادثات بعد',
      noConversationsDesc: 'ابدأ في توظيف العمال للتواصل معهم',
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
      getPremium: 'اشتراك مميز'
    }
  };

  const t = translations[language] || translations.en;

  // Load conversations
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

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

    const userId = authUser.id || authUser.email;

    const loadInitialData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const userConversations = await getUserConversations(userId);
      console.log('📋 Initial load - employer conversations:', userConversations);
      setConversations(userConversations);

      setLoading(false);
    };

    loadInitialData();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // Refresh conversations when refreshKey changes
  useEffect(() => {
    if (!authUser) return;
    
    const userId = authUser.id || authUser.email;
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
    const userId = authUser.id || authUser.email;
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
  // ============================================================
  useEffect(() => {
    if (!authUser || autoOpenDoneRef.current) return;

    // Check if we have a worker to chat with via URL params or state
    const params = new URLSearchParams(window.location.search);
    const workerId = params.get('workerId');
    const workerName = params.get('workerName');
    
    if (!workerId) return;
    
    // Wait for conversations to finish loading before attempting auto-open
    if (loading) {
      console.log('⏳ Conversations still loading, waiting before auto-open...');
      return;
    }
    
    console.log('💬 Auto-opening chat with worker:', { workerId, workerName });
    
    // Mark as done so we don't re-trigger
    autoOpenDoneRef.current = true;
    
    // Find the conversation with this worker
    const conversation = conversations.find(
      conv => conv.otherUserId === workerId
    );
    
    if (conversation) {
      // If conversation exists, open it
      console.log('✅ Found existing conversation:', conversation.id);
      setSelectedConversationId(conversation.id);
      loadMessagesForConversation(conversation.id);
    } else {
      // If no conversation exists, create one
      console.log('🔄 No conversation found, creating one...');
      const createAndOpenConversation = async () => {
        const userId = authUser.id || authUser.email;
        const senderName = authUser.fullName || 'Employer';
        const senderRole = 'EMPLOYER';
        const recipientId = workerId;
        const recipientName = workerName || 'Worker';
        
        // Send a welcome message to start the conversation
        const result = await sendMessage(
          userId,
          senderName,
          senderRole,
          recipientId,
          recipientName,
          `Hello! I'd like to discuss the job opportunity with you.`
        );
        
        if (result) {
          console.log('✅ Welcome message sent, refreshing conversations...');
          // Refresh conversations and open the new chat
          const updatedConversations = await getUserConversations(userId);
          setConversations(updatedConversations);
          
          const newConversation = updatedConversations.find(
            conv => conv.otherUserId === workerId
          );
          
          if (newConversation) {
            console.log('✅ New conversation created:', newConversation.id);
            setSelectedConversationId(newConversation.id);
            loadMessagesForConversation(newConversation.id);
          }
        }
      };
      
      createAndOpenConversation();
    }
  }, [authUser, conversations, loading]);

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
    
    const userId = authUser?.id || authUser?.email;
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

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

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

    console.log('📤 Sending message from employer to:', selectedConv.otherUserId);
    console.log('📤 Recipient name:', selectedConv.otherUserName);

    const result = await sendMessage(
      authUser.id || authUser.email,
      authUser.fullName || 'Employer',
      'EMPLOYER',
      selectedConv.otherUserId,
      selectedConv.otherUserName,
      message
    );

    if (result) {
      console.log('✅ Message sent successfully');
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
      const userId = authUser.id || authUser.email;
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t.loading}</p>
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
        title={t.title}
        language={language}
        onToggleLanguage={toggleLanguage}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={userIsPremium}
        rightContent={
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {t.refresh}
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
                      alt={authUser.fullName || 'Employer'} 
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
                  {authUser?.fullName || 'Employer'}
                </span>
                <span className="px-2 py-1 bg-green-500/30 text-white text-xs rounded-full">
                  {conversations.length} chats
                </span>
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
                      placeholder={t.searchPlaceholder}
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
                      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.noConversations}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t.noConversationsDesc}</p>
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
                        <img
                          src={conv.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherUserName)}&background=teal&color=fff&size=100&bold=true`}
                          alt={conv.otherUserName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-teal-200"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-gray-800 dark:text-white truncate">{conv.otherUserName}</p>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{conv.time}</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 truncate">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-500">{t.online}</span>
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
                        <img
                          src={conversations.find(c => c.id === selectedConversationId)?.avatar || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(conversations.find(c => c.id === selectedConversationId)?.otherUserName || 'Worker')}&background=teal&color=fff&size=100&bold=true`}
                          alt="Chat"
                          className="w-10 h-10 rounded-full object-cover border-2 border-teal-200"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {conversations.find(c => c.id === selectedConversationId)?.otherUserName}
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
                              View Worker Profile
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/20">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                          <p>{t.noMessages}</p>
                          <p className="text-sm">{t.startConversation}</p>
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
                                <img
                                  src={conversations.find(c => c.id === selectedConversationId)?.avatar || 
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || 'User')}&background=teal&color=fff&size=100&bold=true`}
                                  alt={msg.senderName}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
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
                                  <p className="text-xs font-medium text-teal-600 mb-1">
                                    {msg.senderName}
                                  </p>
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
                                <img
                                  src={userProfileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.fullName || 'Employer')}&background=teal&color=fff&size=100&bold=true`}
                                  alt={authUser.fullName || 'Employer'}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-teal-200 flex-shrink-0"
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
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t.typeMessage}
                          className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
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
        </div>
    </DashboardLayout>
  );
};

export default EmployerMessages;