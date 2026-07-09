// src/pages/EmployerMessages.jsx - COMPLETE WITH PERSISTENT CHAT
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  AlertTriangle,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Clock,
  FileText
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationId,
  saveUserConversations,
  saveConversationMessages
} from '../utils/chatService';

// Employer Sidebar Component
const EmployerSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  user, 
  handleLogout 
}) => {
  const location = useLocation();

  const translations = {
    en: {
      dashboard: 'Dashboard',
      myProfile: 'My Profile',
      myHires: 'My Hires',
      search: 'Search Workers',
      messages: 'Messages',
      complaints: 'Complaints',
      settings: 'Settings',
      help: 'Help & Support',
      logout: 'Logout',
      overview: 'Overview'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      myProfile: 'ملفي الشخصي',
      myHires: 'توظيفاتي',
      search: 'البحث عن عمال',
      messages: 'الرسائل',
      complaints: 'الشكاوى',
      settings: 'الإعدادات',
      help: 'المساعدة والدعم',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/employer-profile' },
    { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
    { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <Link to="/employer-dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/employer-dashboard" className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">H</span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-teal-600" />
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || 'employer@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.overview}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-teal-600' : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-teal-600 rounded-full"></div>
              )}
            </Link>
          ))}

          <div className="border-t border-gray-200 my-3"></div>

          <Link
            to="/employer-settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Settings size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.settings}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.settings}
              </div>
            )}
          </Link>
          <Link
            to="/help"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <HelpCircle size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.help}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.help}
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-teal-600 hover:bg-teal-50 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.logout}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.logout}
              </div>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
};

// Main EmployerMessages Component
const EmployerMessages = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const translations = {
    en: {
      title: 'Messages',
      subtitle: 'Communicate with workers and professionals',
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
      refresh: 'Refresh'
    },
    ar: {
      title: 'الرسائل',
      subtitle: 'تواصل مع العمال والمتخصصين',
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
      refresh: 'تحديث'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'EMPLOYER') {
          navigate('/login');
          return;
        }
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }

    loadChatData();
    setLoading(false);
  }, [navigate, refreshKey]);

  // Auto-open chat from MyHires
  useEffect(() => {
    if (!loading && user) {
      const shouldOpenChat = localStorage.getItem('homelyserv_open_chat_on_load');
      if (shouldOpenChat === 'true') {
        const chatRecipient = localStorage.getItem('homelyserv_chat_recipient');
        if (chatRecipient) {
          try {
            const recipient = JSON.parse(chatRecipient);
            console.log('📨 Auto-opening chat with:', recipient);
            addChatRecipient(recipient);
          } catch (error) {
            console.error('Error parsing chat recipient:', error);
          }
        }
        localStorage.removeItem('homelyserv_open_chat_on_load');
        localStorage.removeItem('homelyserv_chat_recipient');
      }
    }
  }, [loading, user]);

  const loadChatData = () => {
    const userId = user?.id || user?.email;
    if (!userId) {
      console.log('No user ID found');
      return;
    }

    const userConversations = getUserConversations(userId);
    console.log('📋 Loaded conversations for employer:', userConversations);
    setConversations(userConversations);
  };

  const loadMessagesForConversation = (conversationId) => {
    console.log('📨 Loading messages for conversation:', conversationId);
    const conversationMessages = getConversationMessages(conversationId);
    console.log('📋 Messages found:', conversationMessages);
    setMessages(conversationMessages);
    
    localStorage.setItem('homelyserv_selected_conversation_employer', conversationId);
    
    const userId = user?.id || user?.email;
    if (userId) {
      markMessagesAsRead(conversationId, userId);
    }
  };

  // ===== NEW: Ensure conversation exists for both users =====
  const ensureConversation = (recipient) => {
    const userId = user?.id || user?.email;
    if (!userId || !recipient) return null;

    const conversationId = getConversationId(userId, recipient.id);
    const messages = getConversationMessages(conversationId);
    
    // Create system message if conversation doesn't exist
    if (messages.length === 0) {
      const systemMessage = {
        id: Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderRole: 'SYSTEM',
        recipientId: userId,
        recipientName: user?.fullName || 'Employer',
        text: 'Start your conversation here',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        read: true
      };
      saveConversationMessages(conversationId, [systemMessage]);
    }
    
    // Update employer's conversation list
    const employerConversations = getUserConversations(userId);
    const exists = employerConversations.some(c => c.id === conversationId);
    
    if (!exists) {
      const newConversation = {
        id: conversationId,
        otherUserId: recipient.id,
        otherUserName: recipient.name || 'Worker',
        lastMessage: messages.length > 0 ? messages[messages.length - 1].text : 'Start your conversation here',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        role: 'WORKER',
        avatar: recipient.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.name || 'Worker')}&background=teal&color=fff&size=100&bold=true`
      };
      employerConversations.unshift(newConversation);
      saveUserConversations(userId, employerConversations);
    }
    
    // Update worker's conversation list too
    const workerConversations = getUserConversations(recipient.id);
    const workerExists = workerConversations.some(c => c.id === conversationId);
    
    if (!workerExists) {
      const workerNewConversation = {
        id: conversationId,
        otherUserId: userId,
        otherUserName: user?.fullName || 'Employer',
        lastMessage: messages.length > 0 ? messages[messages.length - 1].text : 'Start your conversation here',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        role: 'EMPLOYER',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Employer')}&background=teal&color=fff&size=100&bold=true`
      };
      workerConversations.unshift(workerNewConversation);
      saveUserConversations(recipient.id, workerConversations);
    }
    
    return conversationId;
  };

  // ===== Updated: Add chat recipient =====
  const addChatRecipient = (recipient) => {
    const userId = user?.id || user?.email;
    if (!userId) {
      console.log('No user ID');
      return;
    }

    console.log('📨 Adding chat recipient:', recipient);

    // Ensure conversation exists for both users
    const conversationId = ensureConversation(recipient);
    
    if (conversationId) {
      // Reload conversations
      loadChatData();
      // Select the conversation
      setSelectedConversationId(conversationId);
      loadMessagesForConversation(conversationId);
      console.log('✅ Conversation ensured and selected:', conversationId);
    }
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    localStorage.removeItem('homelyserv_selected_conversation_employer');
    localStorage.removeItem('homelyserv_open_chat_on_load');
    navigate('/login');
  };

  const handleSelectConversation = (conversationId) => {
    console.log('📨 Selecting conversation:', conversationId);
    setSelectedConversationId(conversationId);
    loadMessagesForConversation(conversationId);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversationId || !user) {
      console.log('❌ Cannot send message: missing data');
      return;
    }

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) {
      console.log('❌ Conversation not found');
      return;
    }

    console.log('📤 Sending message from employer to:', selectedConv.otherUserId);

    const result = sendMessage(
      user.id || user.email,
      user.fullName || 'Employer',
      'EMPLOYER',
      selectedConv.otherUserId,
      selectedConv.otherUserName,
      message
    );

    if (result) {
      console.log('✅ Message sent successfully');
      loadMessagesForConversation(selectedConversationId);
      loadChatData();
      setMessage('');
    } else {
      console.log('❌ Failed to send message');
    }
  };

  const refreshConversations = () => {
    loadChatData();
    setRefreshKey(prev => prev + 1);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <EmployerSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
        handleLogout={handleLogout}
      />

      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-600 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
              <button
                onClick={refreshConversations}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Clock size={16} />
                {t.refresh}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-teal-100 mt-1">{t.subtitle}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* Conversations List */}
              <div className="border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto h-[calc(600px-73px)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-gray-500">{t.noConversations}</p>
                      <p className="text-sm text-gray-400">{t.noConversationsDesc}</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                          selectedConversationId === conv.id ? 'bg-teal-50' : ''
                        }`}
                      >
                        <img
                          src={conv.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherUserName)}&background=teal&color=fff&size=100&bold=true`}
                          alt={conv.otherUserName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-gray-800 truncate">{conv.otherUserName}</p>
                            <span className="text-xs text-gray-400 flex-shrink-0">{conv.time}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-500">{t.online}</span>
                            {conv.unread > 0 && (
                              <span className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
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

              {/* Chat Area */}
              <div className="col-span-2 flex flex-col h-[600px]">
                {selectedConversationId ? (
                  <>
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={conversations.find(c => c.id === selectedConversationId)?.avatar || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(conversations.find(c => c.id === selectedConversationId)?.otherUserName || 'Worker')}&background=teal&color=fff&size=100&bold=true`}
                          alt="Chat"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {conversations.find(c => c.id === selectedConversationId)?.otherUserName}
                          </p>
                          <p className="text-xs text-green-500">{t.online}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                          <Phone size={18} className="text-gray-600" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                          <Video size={18} className="text-gray-600" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                          <MoreVertical size={18} className="text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <p>{t.noMessages}</p>
                          <p className="text-sm">{t.startConversation}</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderRole === 'EMPLOYER' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                msg.senderRole === 'EMPLOYER'
                                  ? 'bg-teal-600 text-white rounded-br-none'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
                              }`}
                            >
                              <p className="text-sm">{msg.text}</p>
                              <p className={`text-xs mt-1 ${msg.senderRole === 'EMPLOYER' ? 'text-teal-200' : 'text-gray-400'}`}>
                                {msg.time}
                                {msg.senderRole === 'EMPLOYER' && (
                                  <CheckCheck size={14} className="inline ml-1" />
                                )}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t.typeMessage}
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
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
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a conversation</h3>
                      <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployerMessages;