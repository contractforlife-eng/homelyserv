// src/pages/AdminMessages.jsx - FIXED WITH CO-ADMIN LABEL IN SENT MESSAGES
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
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
  Briefcase,
  BarChart3,
  AlertTriangle,
  Shield,
  RefreshCw,
  Plus,
  UserPlus,
  MoreVertical
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationId,
  getAllConversations,
  debugChatData
} from '../utils/chatService';

// Admin Sidebar Component - Dark Theme
const AdminSidebar = ({ 
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
      users: 'Users',
      hires: 'Hires',
      messages: 'Messages',
      payments: 'Payments',
      complaints: 'Complaints',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout',
      overview: 'Overview'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      users: 'المستخدمين',
      hires: 'التوظيفات',
      messages: 'الرسائل',
      payments: 'المدفوعات',
      complaints: 'الشكاوى',
      reports: 'التقارير',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/admin' },
    { id: 'users', label: t.users, icon: Users, path: '/admin/users' },
    { id: 'hires', label: t.hires, icon: Briefcase, path: '/admin/hires' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/admin/messages' },
    { id: 'payments', label: t.payments, icon: CreditCard, path: '/admin/payments' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/admin/complaints' },
    { id: 'reports', label: t.reports, icon: BarChart3, path: '/admin/reports' },
    { id: 'settings', label: t.settings, icon: Settings, path: '/admin/settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-[#1a1a1a] border-r border-yellow-500/20 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-yellow-500/20">
          {!sidebarCollapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className="text-yellow-500" />
                <Home size={14} className="text-yellow-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-white text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/admin" className="relative mx-auto">
              <Shield size={28} className="text-yellow-500" />
              <Home size={14} className="text-yellow-300 absolute -bottom-1 -right-1" />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors hidden lg:block text-gray-400 hover:text-yellow-500"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors lg:hidden text-gray-400 hover:text-yellow-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-yellow-500/20 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user?.fullName || 'Admin'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={20} className="text-black" />
              )}
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user.fullName || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{user.email || 'admin@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t.overview}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-yellow-500'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-black' : 'text-gray-400 group-hover:text-yellow-500'} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-yellow-500 rounded-full"></div>
              )}
              {item.id === 'messages' && (
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] rounded-full font-medium">Live</span>
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-yellow-500/20">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-500 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

// Main AdminMessages Component - WITH CO-ADMIN LABEL FIXED
const AdminMessages = () => {
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [newChatUserId, setNewChatUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  const translations = {
    en: {
      title: 'Support Messages',
      subtitle: 'View and respond to messages from all users',
      searchPlaceholder: 'Search conversations...',
      typeMessage: 'Type your reply...',
      send: 'Send',
      noConversations: 'No conversations yet',
      noConversationsDesc: 'Messages from users will appear here',
      online: 'Online',
      offline: 'Offline',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading messages...',
      noMessages: 'No messages yet',
      startConversation: 'Start the conversation!',
      refresh: 'Refresh',
      premiumBadge: 'Admin',
      getPremium: 'Get Premium',
      allUsers: 'All Users',
      conversations: 'Conversations',
      startNewChat: 'Start New Chat',
      noUsersFound: 'No users found',
      selectUser: 'Select a user to start chatting',
      userList: 'User List',
      coAdmin: 'Co-Admin'
    },
    ar: {
      title: 'رسائل الدعم',
      subtitle: 'عرض والرد على الرسائل من جميع المستخدمين',
      searchPlaceholder: 'ابحث في المحادثات...',
      typeMessage: 'اكتب ردك...',
      send: 'إرسال',
      noConversations: 'لا توجد محادثات بعد',
      noConversationsDesc: 'ستظهر رسائل المستخدمين هنا',
      online: 'متصل',
      offline: 'غير متصل',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الرسائل...',
      noMessages: 'لا توجد رسائل بعد',
      startConversation: 'ابدأ المحادثة!',
      refresh: 'تحديث',
      premiumBadge: 'مدير',
      getPremium: 'اشتراك مميز',
      allUsers: 'جميع المستخدمين',
      conversations: 'المحادثات',
      startNewChat: 'بدء محادثة جديدة',
      noUsersFound: 'لم يتم العثور على مستخدمين',
      selectUser: 'اختر مستخدمًا لبدء المحادثة',
      userList: 'قائمة المستخدمين',
      coAdmin: 'مدير مساعد'
    }
  };

  const t = translations[language];

  // Load user and conversations
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      let parsedUser;
      try {
        parsedUser = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
        return;
      }

      if (parsedUser.role !== 'ADMIN') {
        navigate('/login');
        return;
      }

      setUser(parsedUser);

      const userId = parsedUser.id || parsedUser.email;

      const loadInitialData = async () => {
        if (!userId) {
          setLoading(false);
          return;
        }

        // Load all registered users
        const allRegisteredUsers = loadAllUsers();
        setAllUsers(allRegisteredUsers);
        console.log('📋 All registered users loaded:', allRegisteredUsers.length);

        const userConversations = await getUserConversations(userId);
        console.log('📋 Initial load - admin conversations:', userConversations);
        setConversations(userConversations);

        const savedConversationId = localStorage.getItem('homelyserv_selected_conversation_admin');
        if (savedConversationId) {
          const exists = userConversations.some(c => c.id === savedConversationId);
          if (exists) {
            setSelectedConversationId(savedConversationId);
            const conversationMessages = await getConversationMessages(savedConversationId);
            setMessages(conversationMessages);
            await markMessagesAsRead(savedConversationId, userId);
          } else {
            localStorage.removeItem('homelyserv_selected_conversation_admin');
          }
        }

        setLoading(false);
      };

      loadInitialData();
    } else {
      navigate('/login');
      setLoading(false);
      return;
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, [navigate]);

  // Function to load all registered users from localStorage
  const loadAllUsers = () => {
    const users = [];
    
    // Load employer users
    const employerUsers = JSON.parse(localStorage.getItem('employer_users') || '[]');
    employerUsers.forEach(u => {
      if (u.email) {
        users.push({
          id: u.id || u.email,
          name: u.fullName || u.name || 'User',
          email: u.email,
          role: 'EMPLOYER',
          avatar: u.profileImage || null,
          status: 'online'
        });
      }
    });

    // Load worker users
    const workerUsers = JSON.parse(localStorage.getItem('worker_users') || '[]');
    workerUsers.forEach(u => {
      if (u.email) {
        users.push({
          id: u.id || u.email,
          name: u.fullName || u.name || 'User',
          email: u.email,
          role: 'WORKER',
          avatar: u.profileImage || null,
          status: 'online'
        });
      }
    });

    // Also check for users in homelyserv_users
    const homelyUsers = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
    homelyUsers.forEach(u => {
      if (u.email && !users.some(existing => existing.email === u.email)) {
        users.push({
          id: u.id || u.email,
          name: u.fullName || u.name || 'User',
          email: u.email,
          role: u.role || 'USER',
          avatar: u.profileImage || null,
          status: 'online'
        });
      }
    });

    // Remove duplicates by email
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.email === user.email)
    );

    return uniqueUsers;
  };

  // Refresh conversations when refreshKey changes
  useEffect(() => {
    if (!user) return;
    
    const userId = user.id || user.email;
    if (!userId) return;
    
    (async () => {
      const userConversations = await getUserConversations(userId);
      console.log('🔄 Refresh load - admin conversations:', userConversations);
      setConversations(userConversations);
    })();
  }, [user, refreshKey]);

  // ============================================================
  // AUTO-REFRESH FROM SERVER - polls the API so messages from the
  // other person show up without a manual refresh
  // ============================================================
  useEffect(() => {
    if (!user) return;
    
    const userId = user.id || user.email;
    if (!userId) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(async () => {
      const updatedConversations = await getUserConversations(userId);
      setConversations(prevConversations => {
        if (JSON.stringify(prevConversations) !== JSON.stringify(updatedConversations)) {
          console.log('🔄 Auto-refresh: Admin conversations updated');
          return updatedConversations;
        }
        return prevConversations;
      });
      
      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
            console.log('🔄 Auto-refresh: Admin messages updated for conversation:', selectedConversationId);
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
  }, [user, selectedConversationId]);

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
    
    localStorage.setItem('homelyserv_selected_conversation_admin', conversationId);
    
    const userId = user?.id || user?.email;
    if (userId) {
      await markMessagesAsRead(conversationId, userId);
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
    localStorage.removeItem('homelyserv_selected_conversation_admin');
    navigate('/login');
  };

  const handleSelectConversation = (conversationId) => {
    console.log('📨 Selecting conversation:', conversationId);
    setSelectedConversationId(conversationId);
    setShowAllUsers(false);
    loadMessagesForConversation(conversationId);
  };

  // Start a new chat with a selected user
  const handleStartNewChat = (selectedUser) => {
    console.log('🆕 Starting new chat with user:', selectedUser);
    
    // Check if conversation already exists
    const existingConv = conversations.find(
      c => c.otherUserId === selectedUser.id || c.otherUserId === selectedUser.email
    );
    
    if (existingConv) {
      handleSelectConversation(existingConv.id);
      return;
    }

    // Create a new conversation
    const newConv = {
      id: `conv_${Date.now()}`,
      otherUserId: selectedUser.id || selectedUser.email,
      otherUserName: selectedUser.name,
      role: selectedUser.role,
      avatar: selectedUser.avatar,
      lastMessage: 'No messages yet',
      time: 'Just now',
      unread: 0
    };

    setConversations(prev => [newConv, ...prev]);
    setSelectedConversationId(newConv.id);
    setMessages([]);
    setShowAllUsers(false);
    
    localStorage.setItem('homelyserv_selected_conversation_admin', newConv.id);
    
    // Store the conversation in the chat service
    const allConversations = JSON.parse(localStorage.getItem('chat_conversations') || '{}');
    const userId = user?.id || user?.email;
    
    if (!allConversations[userId]) {
      allConversations[userId] = [];
    }
    
    // Check if this conversation already exists in storage
    const existingInStorage = allConversations[userId].some(
      c => c.otherUserId === selectedUser.id || c.otherUserId === selectedUser.email
    );
    
    if (!existingInStorage) {
      allConversations[userId].push({
        id: newConv.id,
        otherUserId: selectedUser.id || selectedUser.email,
        otherUserName: selectedUser.name,
        role: selectedUser.role,
        avatar: selectedUser.avatar,
        lastMessage: 'No messages yet',
        time: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' }),
        unread: 0
      });
      localStorage.setItem('chat_conversations', JSON.stringify(allConversations));
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = allUsers.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================================
  // FIXED: Send message with Co-Admin label
  // ============================================================
  const handleSendMessage = async (e) => {
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

    // Get the admin name with Co-Admin label
    const adminNameWithLabel = `${user.fullName || 'Admin'} (${t.coAdmin})`;

    console.log('📤 Sending message from admin to:', selectedConv.otherUserId);
    console.log('📤 Sender name with label:', adminNameWithLabel);
    console.log('📤 Recipient name:', selectedConv.otherUserName);

    const result = await sendMessage(
      user.id || user.email,
      adminNameWithLabel, // Send the name with Co-Admin label
      'ADMIN',
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
    
    if (user) {
      const userId = user.id || user.email;
      const updatedConversations = await getUserConversations(userId);
      setConversations(updatedConversations);
      
      // Refresh all users list
      const updatedUsers = loadAllUsers();
      setAllUsers(updatedUsers);
      
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

  const userProfileImage = user?.profileImage || null;

  // Function to get the display name with role label (for UI display only)
  const getDisplayName = (name, role, isAdmin = false) => {
    if (isAdmin) {
      return name; // Name already includes the label from the message data
    }
    return name;
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <AdminSidebar
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
        <header className="bg-[#1a1a1a] border-b border-yellow-500/20 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors lg:hidden text-gray-400 hover:text-yellow-500"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white hidden sm:block">{t.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors relative text-gray-400 hover:text-yellow-500">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-500 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/10 transition-colors text-gray-300 hover:text-yellow-500 flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/10 transition-colors text-gray-300 hover:text-yellow-500 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                {t.refresh}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Welcome Banner - YELLOW THEME */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black/20 border-2 border-white/50 overflow-hidden flex-shrink-0">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
                      alt={user.fullName || 'Admin'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={24} className="text-black m-3" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">{t.title}</h1>
                  <p className="text-black/70 mt-1">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-black/80">
                  {user?.fullName || 'Admin'}
                </span>
                <span className="px-2 py-1 bg-green-500/30 text-black text-xs rounded-full">
                  {conversations.length} chats
                </span>
                <span className="px-2 py-1 bg-blue-500/30 text-black text-xs rounded-full">
                  {allUsers.length} users
                </span>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* Conversations List */}
              <div className="border-r border-yellow-500/20">
                <div className="p-4 border-b border-yellow-500/20">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-3 top-3 text-gray-500" />
                      <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setShowAllUsers(!showAllUsers);
                        setSearchTerm('');
                      }}
                      className={`px-3 py-2.5 rounded-lg transition flex items-center gap-1 ${
                        showAllUsers 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-[#0a0a0a] border border-gray-700 text-gray-400 hover:text-yellow-500'
                      }`}
                      title={t.startNewChat}
                    >
                      <UserPlus size={18} />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto h-[calc(600px-73px)]">
                  {/* Toggle between conversations and all users */}
                  {showAllUsers ? (
                    // ALL USERS LIST
                    <div>
                      <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/10">
                        <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                          {t.userList} ({filteredUsers.length})
                        </p>
                      </div>
                      {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="text-4xl mb-3">👤</div>
                          <p className="text-gray-400">{t.noUsersFound}</p>
                        </div>
                      ) : (
                        filteredUsers.map((userItem) => (
                          <button
                            key={userItem.id || userItem.email}
                            onClick={() => handleStartNewChat(userItem)}
                            className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition border-b border-yellow-500/10 text-left"
                          >
                            <img
                              src={userItem.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userItem.name)}&background=yellow&color=000&size=100&bold=true`}
                              alt={userItem.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500/30"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="font-semibold text-white truncate">{userItem.name}</p>
                                <span className="text-xs text-yellow-500 flex-shrink-0 ml-2">{userItem.role}</span>
                              </div>
                              <p className="text-sm text-gray-400 truncate">{userItem.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-green-400">● Online</span>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    // CONVERSATIONS LIST
                    <div>
                      <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/10">
                        <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                          {t.conversations} ({filteredConversations.length})
                        </p>
                      </div>
                      {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="text-4xl mb-3">💬</div>
                          <p className="text-gray-400">{t.noConversations}</p>
                          <p className="text-sm text-gray-500">{t.noConversationsDesc}</p>
                          <button
                            onClick={() => setShowAllUsers(true)}
                            className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition text-sm font-medium"
                          >
                            <UserPlus size={16} className="inline mr-2" />
                            {t.startNewChat}
                          </button>
                        </div>
                      ) : (
                        filteredConversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv.id)}
                            className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition border-b border-yellow-500/10 ${
                              selectedConversationId === conv.id ? 'bg-yellow-500/10 border-l-4 border-l-yellow-500' : ''
                            }`}
                          >
                            <img
                              src={conv.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherUserName)}&background=yellow&color=000&size=100&bold=true`}
                              alt={conv.otherUserName}
                              className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500/30"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex justify-between items-start">
                                <p className="font-semibold text-white truncate">{conv.otherUserName}</p>
                                <span className="text-xs text-gray-500 flex-shrink-0">{conv.time}</span>
                              </div>
                              <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-yellow-500">{conv.role || 'User'}</span>
                                {conv.unread > 0 && (
                                  <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
                                    {conv.unread}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="col-span-2 flex flex-col h-[600px]">
                {selectedConversationId ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-yellow-500/20 flex items-center justify-between bg-white/5">
                      <div className="flex items-center gap-3">
                        <img
                          src={conversations.find(c => c.id === selectedConversationId)?.avatar || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(conversations.find(c => c.id === selectedConversationId)?.otherUserName || 'User')}&background=yellow&color=000&size=100&bold=true`}
                          alt="Chat"
                          className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/30"
                        />
                        <div>
                          <p className="font-semibold text-white">
                            {conversations.find(c => c.id === selectedConversationId)?.otherUserName}
                          </p>
                          <p className="text-xs text-yellow-500">{conversations.find(c => c.id === selectedConversationId)?.role || 'User'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowAllUsers(true)}
                          className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-yellow-500"
                          title={t.startNewChat}
                        >
                          <UserPlus size={18} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-yellow-500">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0a0a]">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p>{t.noMessages}</p>
                          <p className="text-sm">{t.startConversation}</p>
                        </div>
                      ) : (
                        messages.map((msg, index) => {
                          const isAdmin = msg.senderRole === 'ADMIN';
                          const showAvatar = index === 0 || 
                            (index > 0 && messages[index - 1]?.senderRole !== msg.senderRole);
                          
                          // Check if the sender name already has (Co-Admin) label
                          // If not, add it for display purposes (for backward compatibility)
                          let displayName = msg.senderName || 'User';
                          if (isAdmin && !displayName.includes('(Co-Admin)')) {
                            displayName = `${displayName} (${t.coAdmin})`;
                          }
                          
                          return (
                            <div
                              key={msg.id || index}
                              className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} items-end gap-2`}
                            >
                              {!isAdmin && showAvatar && (
                                <img
                                  src={conversations.find(c => c.id === selectedConversationId)?.avatar || 
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || 'User')}&background=yellow&color=000&size=100&bold=true`}
                                  alt={msg.senderName}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-700 flex-shrink-0"
                                />
                              )}
                              {!isAdmin && !showAvatar && (
                                <div className="w-8 flex-shrink-0"></div>
                              )}
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  isAdmin
                                    ? 'bg-yellow-500 text-black rounded-br-none'
                                    : 'bg-[#1a1a1a] text-white rounded-bl-none border border-gray-700'
                                }`}
                              >
                                {!isAdmin && (
                                  <p className="text-xs font-medium text-yellow-500 mb-1">
                                    {displayName}
                                  </p>
                                )}
                                {isAdmin && (
                                  <p className="text-xs font-medium text-black/70 mb-1">
                                    {displayName}
                                  </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                                  isAdmin ? 'text-black/60' : 'text-gray-500'
                                }`}>
                                  {msg.time}
                                  {isAdmin && (
                                    <CheckCircle size={14} className={msg.read ? 'text-green-600' : 'text-black/40'} />
                                  )}
                                </p>
                              </div>
                              {isAdmin && showAvatar && (
                                <img
                                  src={userProfileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'Admin')}&background=yellow&color=000&size=100&bold=true`}
                                  alt={user.fullName || 'Admin'}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-yellow-500/30 flex-shrink-0"
                                />
                              )}
                              {isAdmin && !showAvatar && (
                                <div className="w-8 flex-shrink-0"></div>
                              )}
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-yellow-500/20 bg-[#1a1a1a]">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t.typeMessage}
                          className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2 disabled:opacity-50"
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
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {showAllUsers ? t.selectUser : 'Select a conversation'}
                      </h3>
                      <p className="text-gray-400">
                        {showAllUsers 
                          ? 'Choose a user from the list to start chatting' 
                          : 'Choose a conversation from the list to start messaging'}
                      </p>
                      {!showAllUsers && (
                        <button
                          onClick={() => setShowAllUsers(true)}
                          className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition text-sm font-medium"
                        >
                          <UserPlus size={16} className="inline mr-2" />
                          {t.startNewChat}
                        </button>
                      )}
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

export default AdminMessages;