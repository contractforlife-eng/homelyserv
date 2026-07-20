// src/pages/AdminDashboard.jsx - WITH WORKING NOTIFICATION BELL
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
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
  UserPlus,
  UserMinus,
  UserCheck,
  Pause,
  Play,
  Trash2,
  Edit,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Download,
  FileText,
  MoreVertical,
  Shield,
  Award,
  TrendingUp,
  User as UserIcon,
  AlertTriangle,
  BarChart3,
  FileCheck,
  Crown,
  MessageSquare,
  CheckCheck,
  XCircle,
  RefreshCw
} from 'lucide-react';

// Admin Sidebar Component - Dark Theme
const AdminSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  user, 
  handleLogout,
  unreadNotifications
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

  const t = translations[language] || translations.en;

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
              {item.id === 'complaints' && !isActive(item.path) && (
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-medium animate-pulse">!</span>
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
      
      // Sort by date (newest first)
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

  // Check for new notifications from various sources
  const checkForNewNotifications = async () => {
    const existingNotifications = JSON.parse(
      localStorage.getItem('admin_notifications') || '[]'
    );
    
    const newNotifications = [];
    const existingIds = new Set(existingNotifications.map(n => n.id));

    // 1. Check for new user registrations
    // 1. Check for new user registrations from MongoDB
let users = [];

try {
  const response = await api.get('/api/auth/users')

  if (response.data.success) {
    users = response.data.users || [];
  }
} catch (error) {
  console.error('Failed to load users for notifications:', error);
}

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

    // 5. Check for payment failures
    const failedPayments = allPayments.filter(p => {
      const createdAt = new Date(p.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > oneDayAgo && p.status === 'failed';
    });

    failedPayments.forEach(payment => {
      const notifId = `failed_payment_${payment.id}`;
      if (!existingIds.has(notifId)) {
        newNotifications.push({
          id: notifId,
          type: 'payment_failed',
          title: 'Payment Failed ❌',
          message: `Payment of ${payment.amount || 0} EGP from ${payment.employerName || 'Employer'} failed. Please check.`,
          read: false,
          createdAt: new Date().toISOString(),
          link: '/admin/payments',
          icon: 'alert_circle',
          amount: payment.amount,
          employerName: payment.employerName
        });
      }
    });

    // 6. Check for premium subscription activations
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

    // Add all new notifications
    if (newNotifications.length > 0) {
      const updatedNotifications = [...newNotifications, ...existingNotifications];
      localStorage.setItem('admin_notifications', JSON.stringify(updatedNotifications));
      loadNotifications();
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
    setUnreadCount(updated.filter(n => !n.read).length);
  };

  // Mark all as read
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
    setUnreadCount(0);
  };

  // Handle notification click
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

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      'new_user': <UserPlus size={16} className="text-blue-400" />,
      'new_payment': <DollarSign size={16} className="text-green-400" />,
      'new_complaint': <AlertTriangle size={16} className="text-red-400" />,
      'new_hire': <Briefcase size={16} className="text-purple-400" />,
      'payment_failed': <XCircle size={16} className="text-red-400" />,
      'premium_activation': <Crown size={16} className="text-yellow-400" />
    };
    return icons[type] || <Bell size={16} className="text-gray-400" />;
  };

  // Get notification time
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

  // Initial load and periodic checks
  useEffect(() => {
    loadNotifications();
    
    // Check for new notifications every 10 seconds
    const interval = setInterval(checkForNewNotifications, 10000);
    
    // Also check when component mounts
    setTimeout(checkForNewNotifications, 1000);
    
    // Click outside to close dropdown
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
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPayments: 0,
    totalMessages: 0,
    pendingActions: 0,
    totalComplaints: 0,
    pendingComplaints: 0
  });

  const translations = {
    en: {
      title: 'Admin Dashboard',
      subtitle: 'Manage your platform',
      stats: {
        users: 'Total Users',
        payments: 'Total Payments',
        messages: 'Messages',
        pending: 'Pending Actions',
        complaints: 'Total Complaints',
        pendingComplaints: 'Pending Complaints'
      },
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      manageUsers: 'Manage Users',
      viewMessages: 'View Messages',
      viewPayments: 'View Payments',
      viewComplaints: 'View Complaints',
      settings: 'Settings',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      noActivity: 'No recent activity',
    
    },
    ar: {
      title: 'لوحة تحكم المشرف',
      subtitle: 'إدارة منصتك',
      stats: {
        users: 'إجمالي المستخدمين',
        payments: 'إجمالي المدفوعات',
        messages: 'الرسائل',
        pending: 'إجراءات معلقة',
        complaints: 'إجمالي الشكاوى',
        pendingComplaints: 'شكاوى معلقة'
      },
      recentActivity: 'النشاط الأخير',
      quickActions: 'إجراءات سريعة',
      manageUsers: 'إدارة المستخدمين',
      viewMessages: 'عرض الرسائل',
      viewPayments: 'عرض المدفوعات',
      viewComplaints: 'عرض الشكاوى',
      settings: 'الإعدادات',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      noActivity: 'لا يوجد نشاط حديث'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'ADMIN') {
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

    // Load stats from localStorage
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    let users = [];

    try {
      const response = await api.get('/api/auth/users');

      if (response.data.success) {
        users = response.data.users || [];
      }

      console.log('✅ Loaded users from MongoDB:', users.length);

    } catch (error) {
      console.error('❌ Failed loading users from backend:', error);
    }

    // Get message stats from backend
    let totalMessages = 0;
    try {
      const msgResponse = await api.get('/api/chat/messages/stats');
      if (msgResponse.data.success) {
        totalMessages = msgResponse.data.totalMessages || 0;
      }
    } catch (error) {
      console.error('Error loading message stats:', error);
    }

    // Load complaints from all sources
    const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
    const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
    const adminComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
    const allComplaints = [...employerComplaints, ...workerComplaints, ...adminComplaints];
    
    setStats({
      totalUsers: users.length,
      totalPayments: 0,
      totalMessages: totalMessages,
      pendingActions: 0,
      totalComplaints: allComplaints.length,
      pendingComplaints: allComplaints.filter(c => c.status === 'pending').length
    });
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
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
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
        unreadNotifications={0}
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
              {/* WORKING NOTIFICATION BELL */}
              <NotificationBell userId={user?.id || user?.email} />
              
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/10 transition-colors text-gray-300 hover:text-yellow-500 flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black">{t.title}</h1>
              <p className="text-black/70 mt-1">{t.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.users}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.payments}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalPayments}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.messages}</p>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalMessages}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.complaints}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalComplaints}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.pendingComplaints}</p>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.pendingComplaints}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.pending}</p>
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-orange-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.pendingActions}</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-6 border border-yellow-500/20 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t.quickActions}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Link
                to="/admin/users"
                className="flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
              >
                <Users size={20} className="text-blue-400" />
                <span className="font-medium text-blue-300">{t.manageUsers}</span>
              </Link>
              <Link
                to="/admin/messages"
                className="flex items-center gap-3 p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/20"
              >
                <MessageCircle size={20} className="text-purple-400" />
                <span className="font-medium text-purple-300">{t.viewMessages}</span>
              </Link>
              <Link
                to="/admin/payments"
                className="flex items-center gap-3 p-3 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
              >
                <CreditCard size={20} className="text-green-400" />
                <span className="font-medium text-green-300">{t.viewPayments}</span>
              </Link>
              <Link
                to="/admin/complaints"
                className="flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
              >
                <AlertTriangle size={20} className="text-red-400" />
                <span className="font-medium text-red-300">{t.viewComplaints}</span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex items-center gap-3 p-3 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/20"
              >
                <Settings size={20} className="text-yellow-400" />
                <span className="font-medium text-yellow-300">{t.settings}</span>
              </Link>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-6 border border-yellow-500/20">
            <h3 className="text-lg font-semibold text-white mb-4">{t.recentActivity}</h3>
            <div className="text-center py-8">
              <p className="text-gray-500">{t.noActivity}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;