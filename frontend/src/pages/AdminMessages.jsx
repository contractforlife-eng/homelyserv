// src/pages/AdminMessages.jsx - FIXED SEND MESSAGE FUNCTIONALITY
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
  MoreVertical,
  Crown,
  DollarSign
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationId,
  getAllConversations,
  debugChatData,
  deleteConversation
} from '../utils/chatService';
import useAuthStore from '../store/authStore';

import AdminSidebar from '../components/AdminSidebar.jsx';

// ============================================================
// NOTIFICATION BELL COMPONENT
// ============================================================
const NotificationBell = ({ userId, onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Load notifications from localStorage
  const loadNotifications = () => {
    setLoading(true);
    try {
      const storedNotifications = JSON.parse(
        localStorage.getItem('admin_notifications') || '[]'
      );
      
      const sorted = storedNotifications.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setNotifications(sorted);
      setUnreadCount(sorted.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for new notifications
  const checkForNewNotifications = () => {
    const existingNotifications = JSON.parse(
      localStorage.getItem('admin_notifications') || '[]'
    );
    
    const newNotifications = [];
    const existingIds = new Set(existingNotifications.map(n => n.id));

    // 1. Check for new user registrations
    const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
    const recentUsers = users.filter(u => {
      const createdAt = new Date(u.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > oneDayAgo;
    });

    recentUsers.forEach(user => {
      const notifId = `new_user_${user.id}`;
      if (!existingIds.has(notifId)) {
        newNotifications.push({
          id: notifId,
          type: 'new_user',
          title: 'New User Registration 🎉',
          message: `${user.fullName || 'A new user'} (${user.email}) has registered as ${user.role || 'USER'}`,
          read: false,
          createdAt: new Date().toISOString(),
          link: '/admin/users',
          icon: 'user_plus',
          userEmail: user.email,
          userRole: user.role
        });
      }
    });

    // 2. Check for new payments
    const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
    const recentPayments = allPayments.filter(p => {
      const createdAt = new Date(p.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > oneDayAgo && p.status === 'completed';
    });

    recentPayments.forEach(payment => {
      const notifId = `new_payment_${payment.id}`;
      if (!existingIds.has(notifId)) {
        newNotifications.push({
          id: notifId,
          type: 'new_payment',
          title: 'New Payment Received 💰',
          message: `Payment of ${payment.amount || 0} EGP from ${payment.employerName || 'Employer'} for ${payment.jobTitle || 'service'}`,
          read: false,
          createdAt: new Date().toISOString(),
          link: '/admin/payments',
          icon: 'dollar',
          amount: payment.amount,
          employerName: payment.employerName
        });
      }
    });

    // 3. Check for new complaints
    const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
    const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
    const allComplaints = [...employerComplaints, ...workerComplaints];
    
    const recentComplaints = allComplaints.filter(c => {
      const createdAt = new Date(c.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > oneDayAgo && c.status === 'pending';
    });

    recentComplaints.forEach(complaint => {
      const notifId = `new_complaint_${complaint.id}`;
      if (!existingIds.has(notifId)) {
        newNotifications.push({
          id: notifId,
          type: 'new_complaint',
          title: 'New Complaint Received 📋',
          message: `${complaint.userName || 'A user'} submitted a complaint: "${complaint.title || complaint.subject}"`,
          read: false,
          createdAt: new Date().toISOString(),
          link: '/admin/complaints',
          icon: 'alert',
          complaintId: complaint.id,
          complaintTitle: complaint.title || complaint.subject
        });
      }
    });

    // 4. Check for new hires
    const hires = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
    const recentHires = hires.filter(h => {
      const createdAt = new Date(h.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > oneDayAgo && h.status === 'active';
    });

    recentHires.forEach(hire => {
      const notifId = `new_hire_${hire.id}`;
      if (!existingIds.has(notifId)) {
        newNotifications.push({
          id: notifId,
          type: 'new_hire',
          title: 'New Hire Contract 🤝',
          message: `${hire.employerName || 'Employer'} hired ${hire.workerName || 'a worker'} for ${hire.jobTitle || 'a position'}`,
          read: false,
          createdAt: new Date().toISOString(),
          link: '/admin/hires',
          icon: 'briefcase',
          hireId: hire.id
        });
      }
    });

    // 5. Check for premium activations
    const subscriptions = JSON.parse(localStorage.getItem('homelyserv_subscriptions') || '{}');
    Object.values(subscriptions).forEach(sub => {
      if (sub.status === 'active' && sub.activatedAt) {
        const activatedAt = new Date(sub.activatedAt);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (activatedAt > oneDayAgo) {
          const notifId = `premium_activation_${sub.userId}`;
          if (!existingIds.has(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'premium_activation',
              title: 'Premium Activated 👑',
              message: `${sub.userFullName || 'A user'} (${sub.userEmail}) activated Premium subscription`,
              read: false,
              createdAt: new Date().toISOString(),
              link: '/admin/users',
              icon: 'crown',
              userEmail: sub.userEmail
            });
          }
        }
      }
    });

    if (newNotifications.length > 0) {
      const updatedNotifications = [...newNotifications, ...existingNotifications];
      localStorage.setItem('admin_notifications', JSON.stringify(updatedNotifications));
      loadNotifications();
    }
  };

  const markAsRead = (notificationId) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
    setUnreadCount(updated.filter(n => !n.read).length);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'new_user': <UserPlus size={16} className="text-blue-400" />,
      'new_payment': <DollarSign size={16} className="text-green-400" />,
      'new_complaint': <AlertTriangle size={16} className="text-red-400" />,
      'new_hire': <Briefcase size={16} className="text-purple-400" />,
      'premium_activation': <Crown size={16} className="text-yellow-400" />
    };
    return icons[type] || <Bell size={16} className="text-gray-400" />;
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadNotifications();
    
    const interval = setInterval(checkForNewNotifications, 10000);
    setTimeout(checkForNewNotifications, 1000);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors relative text-gray-400 hover:text-yellow-500"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 border-2 border-[#1a1a1a]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#1a1a1a] border border-yellow-500/20 rounded-xl shadow-2xl shadow-yellow-500/10 z-50 max-h-[500px] overflow-y-auto">
          <div className="p-3 border-b border-yellow-500/20 flex justify-between items-center sticky top-0 bg-[#1a1a1a] rounded-t-xl">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Bell size={16} className="text-yellow-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h4>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button 
                onClick={() => {
                  checkForNewNotifications();
                  loadNotifications();
                }}
                className="p-1 rounded hover:bg-yellow-500/10 transition-colors text-gray-400 hover:text-yellow-500"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-yellow-500/10">
            {loading ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-gray-500 mt-1">New notifications will appear here</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 hover:bg-yellow-500/5 cursor-pointer transition-colors ${
                    !notification.read ? 'border-l-2 border-yellow-500 bg-yellow-500/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'text-white font-semibold' : 'text-gray-300'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 20 && (
            <div className="p-2 text-center border-t border-yellow-500/10">
              <Link 
                to="/admin/notifications" 
                className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all notifications ({notifications.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN ADMIN MESSAGES COMPONENT
// ============================================================
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
  const [sending, setSending] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const dropdownRef = useRef(null);

  const translations = {
    en: {
      title: 'Support Messages',
      subtitle: 'View and respond to messages from all users',
      searchPlaceholder: 'Search conversations...',
      typeMessage: 'Type your reply...',
      send: 'Send',
      sending: 'Sending...',
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
      coAdmin: 'Co-Admin',
      sendError: 'Failed to send message. Please try again.',
      messageSent: 'Message sent successfully!'
    },
    ar: {
      title: 'رسائل الدعم',
      subtitle: 'عرض والرد على الرسائل من جميع المستخدمين',
      searchPlaceholder: 'ابحث في المحادثات...',
      typeMessage: 'اكتب ردك...',
      send: 'إرسال',
      sending: 'جاري الإرسال...',
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
      coAdmin: 'مدير مساعد',
      sendError: 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.',
      messageSent: 'تم إرسال الرسالة بنجاح!'
    }
  };

  const t = translations[language] || translations.en;

  // Use authStore as single source of truth
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser || authUser.role !== 'ADMIN') {
      navigate('/login');
      setLoading(false);
      return;
    }

    setUser(authUser);

    const userId = authUser.id || authUser.email;

    const loadInitialData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const allRegisteredUsers = loadAllUsers();
      setAllUsers(allRegisteredUsers);
      console.log('📋 All registered users loaded:', allRegisteredUsers.length);

      const userConversations = await getUserConversations(userId);
      console.log('📋 Initial load - admin conversations:', userConversations);
      setConversations(userConversations);

      setLoading(false);
    };

    loadInitialData();
  }, [authUser, authLoading, navigate]);

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

  // Auto-refresh
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
    
    const userId = user?.id || user?.email;
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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleSelectConversation = (conversationId) => {
    console.log('📨 Selecting conversation:', conversationId);
    setSelectedConversationId(conversationId);
    setShowAllUsers(false);
    loadMessagesForConversation(conversationId);
  };

  // Start a new chat with a selected user
  const handleStartNewChat = async (selectedUser) => {
    console.log('🆕 Starting new chat with user:', selectedUser);
    
    // Check if conversation already exists
    const existingConv = conversations.find(
      c => c.otherUserId === selectedUser.id || c.otherUserId === selectedUser.email
    );
    
    if (existingConv) {
      handleSelectConversation(existingConv.id);
      return;
    }

    // Create a new conversation by sending a system message
    const userId = user?.id || user?.email;
    if (!userId) return;

    const result = await ensureConversationExists(
      userId,
      user.fullName || 'Admin',
      'ADMIN',
      selectedUser.id || selectedUser.email,
      selectedUser.name,
      selectedUser.role
    );

    if (result) {
      // Refresh conversations to get the new one
      const updatedConversations = await getUserConversations(userId);
      setConversations(updatedConversations);
      
      // Find and open the new conversation
      const newConv = updatedConversations.find(
        c => c.otherUserId === selectedUser.id || c.otherUserId === selectedUser.email
      );
      
      if (newConv) {
        setSelectedConversationId(newConv.id);
        setMessages([]);
        setShowAllUsers(false);
      }
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
  // FIXED: Send message with Co-Admin label and error handling
  // ============================================================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      console.log('❌ Cannot send empty message');
      return;
    }
    
    if (!selectedConversationId) {
      console.log('❌ No conversation selected');
      alert('Please select a conversation first');
      return;
    }
    
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    setSending(true);

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) {
      console.log('❌ Conversation not found');
      setSending(false);
      alert('Conversation not found. Please try again.');
      return;
    }

    // Get the admin name with Co-Admin label
    const adminNameWithLabel = `${user.fullName || 'Admin'} (${t.coAdmin})`;

    console.log('📤 Sending message from admin to:', selectedConv.otherUserId);
    console.log('📤 Sender name with label:', adminNameWithLabel);
    console.log('📤 Recipient name:', selectedConv.otherUserName);
    console.log('📤 Message:', message);

    try {
      // Ensure the conversation exists in the chat service
      const result = await sendMessage(
        user.id || user.email,
        adminNameWithLabel,
        'ADMIN',
        selectedConv.otherUserId,
        selectedConv.otherUserName,
        message
      );

      if (result) {
        console.log('✅ Message sent successfully');
        // Clear message input
        setMessage('');
        // Reload messages to show the new message
        await loadMessagesForConversation(selectedConversationId);
        // Trigger refresh
        setRefreshKey(prev => prev + 1);
        // Show success feedback
        // toast.success(t.messageSent);
      } else {
        console.log('❌ Failed to send message - result was false');
        alert(t.sendError);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert(t.sendError);
    } finally {
      setSending(false);
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
              <NotificationBell userId={user?.id || user?.email} />
              
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
                  {showAllUsers ? (
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
                      <div className="flex gap-2 relative" ref={dropdownRef}>
                        <button 
                          onClick={() => setShowAllUsers(true)}
                          className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-yellow-500"
                          title={t.startNewChat}
                        >
                          <UserPlus size={18} />
                        </button>
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-yellow-500"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {dropdownOpen && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-[#1a1a1a] rounded-lg shadow-lg border border-yellow-500/20 py-1 z-50">
                            <button
                              onClick={async () => {
                                setDropdownOpen(false);
                                if (selectedConversationId) {
                                  const success = await deleteConversation(selectedConversationId);
                                  if (success) {
                                    console.log('🗑️ Deleted conversation:', selectedConversationId);
                                    const userId = user?.id || user?.email;
                                    if (userId) {
                                      const updated = await getUserConversations(userId);
                                      setConversations(updated);
                                    }
                                    setSelectedConversationId(null);
                                    setMessages([]);
                                  }
                                }
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
                            >
                              <Trash2 size={16} />
                              Delete Conversation
                            </button>
                            <button
                              disabled
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-500 flex items-center gap-2 cursor-not-allowed"
                            >
                              <Mail size={16} />
                              Mark as unread
                            </button>
                            <button
                              disabled
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-500 flex items-center gap-2 cursor-not-allowed"
                            >
                              <UserIcon size={16} />
                              View User Profile
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

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

                    {/* Input - FIXED with better feedback */}
                    <div className="p-4 border-t border-yellow-500/20 bg-[#1a1a1a]">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t.typeMessage}
                          className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                          disabled={sending}
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!message.trim() || sending}
                        >
                          {sending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                              {t.sending}
                            </>
                          ) : (
                            <>
                              <Send size={18} />
                              {t.send}
                            </>
                          )}
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