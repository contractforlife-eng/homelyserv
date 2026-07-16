// src/pages/EmployerMessages.jsx - COMPLETE WITH MESSAGE DISPLAY
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
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
  Loader2
} from 'lucide-react';
import { 
  getConversations, 
  getMessages, 
  sendMessage as sendChatMessage,
  markMessagesAsRead,
  getUnreadCount,
  createConversation
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
      payment: 'Payment',
      settings: 'Settings',
      help: 'Help & Support',
      logout: 'Logout',
      overview: 'Overview',
      premium: 'Premium'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      myProfile: 'ملفي الشخصي',
      myHires: 'توظيفاتي',
      search: 'البحث عن عمال',
      messages: 'الرسائل',
      complaints: 'الشكاوى',
      payment: 'الدفع',
      settings: 'الإعدادات',
      help: 'المساعدة والدعم',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة',
      premium: 'مميز'
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
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/employer-payments' },
    { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getProfileImage = () => {
    if (user?.profileImage) {
      return user.profileImage;
    }
    return null;
  };

  const userIsPremium = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const isPremium = userIsPremium();

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
              <div className="relative">
                <Shield size={28} className="text-teal-500" />
                <Home size={14} className="text-teal-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/employer-dashboard" className="relative mx-auto">
              <Shield size={28} className="text-teal-500" />
              <Home size={14} className="text-teal-300 absolute -bottom-1 -right-1" />
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || 'Employer'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
              {isPremium && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
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
              {item.id === 'premium' && !isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full font-medium">NEW</span>
                </div>
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

// ============================================================
// MAIN EMPLOYER MESSAGES COMPONENT
// ============================================================
const EmployerMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const messagesEndRef = useRef(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const translations = {
    en: {
      title: 'Messages',
      subtitle: 'Chat with workers you\'ve hired',
      searchPlaceholder: 'Search conversations...',
      noConversations: 'No conversations yet',
      noConversationsDesc: 'Start a conversation with a worker you\'ve hired',
      startChat: 'Start Chat',
      typeMessage: 'Type your message...',
      send: 'Send',
      online: 'Online',
      offline: 'Offline',
      lastSeen: 'Last seen {time}',
      today: 'Today',
      yesterday: 'Yesterday',
      loadMore: 'Load more',
      noMessages: 'No messages yet',
      startConversation: 'Start a conversation',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading messages...'
    },
    ar: {
      title: 'الرسائل',
      subtitle: 'تواصل مع العمال الذين قمت بتوظيفهم',
      searchPlaceholder: 'ابحث في المحادثات...',
      noConversations: 'لا توجد محادثات',
      noConversationsDesc: 'ابدأ محادثة مع عامل قمت بتوظيفه',
      startChat: 'ابدأ المحادثة',
      typeMessage: 'اكتب رسالتك...',
      send: 'إرسال',
      online: 'متصل',
      offline: 'غير متصل',
      lastSeen: 'آخر ظهور {time}',
      today: 'اليوم',
      yesterday: 'أمس',
      loadMore: 'تحميل المزيد',
      noMessages: 'لا توجد رسائل',
      startConversation: 'ابدأ محادثة',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الرسائل...'
    }
  };

  const t = translations[language];

  // ============================================================
  // Load Conversations
  // ============================================================
  const loadConversations = () => {
    try {
      const userId = user?.id || user?.email;
      if (!userId) {
        setConversations([]);
        setFilteredConversations([]);
        return;
      }

      // Get all conversations
      const allConversations = getConversations(userId);
      
      // Filter conversations for this employer
      const employerConversations = allConversations.filter(
        conv => conv.participants.some(p => p.id === userId || p.id === user?.email)
      );

      // Sort by last message time
      employerConversations.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.updatedAt || 0);
        const timeB = new Date(b.lastMessageTime || b.updatedAt || 0);
        return timeB - timeA;
      });

      // Get unread counts
      const counts = {};
      employerConversations.forEach(conv => {
        counts[conv.id] = getUnreadCount(conv.id, userId);
      });
      setUnreadCounts(counts);

      setConversations(employerConversations);
      setFilteredConversations(employerConversations);
      
      console.log(`✅ Loaded ${employerConversations.length} conversations`);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
      setFilteredConversations([]);
    }
  };

  // ============================================================
  // Load Messages for Selected Conversation
  // ============================================================
  const loadMessages = (conversationId) => {
    try {
      const messagesList = getMessages(conversationId);
      setMessages(messagesList);
      
      // Mark messages as read
      const userId = user?.id || user?.email;
      if (userId) {
        markMessagesAsRead(conversationId, userId);
        // Update unread count
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: 0
        }));
      }
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  // ============================================================
  // Send Message
  // ============================================================
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const userId = user?.id || user?.email;
    const userName = user?.fullName || 'Employer';
    const userRole = 'EMPLOYER';

    setSending(true);

    try {
      // Find the worker participant
      const worker = selectedConversation.participants.find(
        p => p.id !== userId && p.role === 'WORKER'
      );

      if (!worker) {
        alert('Worker not found in conversation');
        setSending(false);
        return;
      }

      const sentMessage = sendChatMessage(
        userId,
        userName,
        userRole,
        worker.id,
        worker.name,
        newMessage.trim()
      );

      if (sentMessage) {
        setNewMessage('');
        // Reload messages
        loadMessages(selectedConversation.id);
        // Reload conversations to update last message
        loadConversations();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // Select Conversation
  // ============================================================
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  // ============================================================
  // Start New Conversation
  // ============================================================
  const handleStartConversation = (workerId, workerName) => {
    const userId = user?.id || user?.email;
    const userName = user?.fullName || 'Employer';
    
    const conversation = createConversation(
      userId,
      userName,
      'EMPLOYER',
      workerId,
      workerName,
      'WORKER'
    );

    if (conversation) {
      setSelectedConversation(conversation);
      loadMessages(conversation.id);
      loadConversations();
    }
  };

  // ============================================================
  // useEffect
  // ============================================================
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);

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

    setLoading(false);
  }, [navigate]);

  // Load conversations when user is set
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Auto-refresh messages every 10 seconds
  useEffect(() => {
    if (!selectedConversation) return;
    
    const interval = setInterval(() => {
      loadMessages(selectedConversation.id);
      loadConversations();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Filter conversations by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = conversations.filter(conv => {
      const participantName = conv.participants
        .find(p => p.role === 'WORKER')
        ?.name?.toLowerCase() || '';
      const lastMessage = conv.lastMessage?.toLowerCase() || '';
      return participantName.includes(searchLower) || lastMessage.includes(searchLower);
    });

    setFilteredConversations(filtered);
  }, [conversations, searchTerm]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // ============================================================
  // UI Helpers
  // ============================================================
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
    navigate('/login');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) return t.today;
    if (date >= yesterday) return t.yesterday;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWorkerFromConversation = (conversation) => {
    const userId = user?.id || user?.email;
    return conversation?.participants?.find(p => p.id !== userId && p.role === 'WORKER');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  const userId = user?.id || user?.email;
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

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
      } ml-0 flex flex-col h-screen`}>
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
              {totalUnread > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {totalUnread} unread
                </span>
              )}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                {totalUnread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-600 rounded-full"></span>
                )}
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageCircle size={48} className="text-gray-300 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700">{t.noConversations}</h3>
                  <p className="text-sm text-gray-500">{t.noConversationsDesc}</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const worker = getWorkerFromConversation(conv);
                  const unread = unreadCounts[conv.id] || 0;
                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                        isSelected ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {worker?.image ? (
                            <img 
                              src={worker.image} 
                              alt={worker?.name || 'Worker'} 
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            worker?.name?.charAt(0) || 'W'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-800 truncate">
                              {worker?.name || 'Worker'}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate">
                              {conv.lastMessage || 'No messages yet'}
                            </p>
                            {unread > 0 && (
                              <span className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full flex-shrink-0">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
                      {getWorkerFromConversation(selectedConversation)?.name?.charAt(0) || 'W'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {getWorkerFromConversation(selectedConversation)?.name || 'Worker'}
                      </p>
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                        Online
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <PhoneCall size={18} className="text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Video size={18} className="text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Info size={18} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle size={40} className="text-gray-300 mb-3" />
                      <p className="text-gray-500">{t.noMessages}</p>
                      <p className="text-sm text-gray-400">{t.startConversation}</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwn = msg.senderId === userId;
                      const showDate = index === 0 || 
                        formatDate(messages[index - 1].timestamp) !== formatDate(msg.timestamp);

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="text-center my-3">
                              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                {formatDate(msg.timestamp)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                              <div className={`rounded-2xl px-4 py-2.5 ${
                                isOwn 
                                  ? 'bg-teal-600 text-white rounded-br-none' 
                                  : 'bg-white border border-gray-200 rounded-bl-none'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                              </div>
                              <div className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                {formatTime(msg.timestamp)}
                                {isOwn && msg.read && (
                                  <CheckCheck size={14} className="inline ml-1 text-teal-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="bg-white border-t border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Paperclip size={20} className="text-gray-500" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={t.typeMessage}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                    >
                      {sending ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageCircle size={64} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">{t.noConversations}</h3>
                <p className="text-gray-500 mt-2">{t.noConversationsDesc}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployerMessages;