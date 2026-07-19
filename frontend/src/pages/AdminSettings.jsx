// src/pages/AdminSettings.jsx - COMPREHENSIVE ADMIN SETTINGS WITH WORKING NOTIFICATION BELL
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
  Save,
  Shield,
  Lock,
  Bell as BellIcon,
  Moon,
  Sun,
  RefreshCw,
  User as UserIcon,
  Database,
  Server,
  Mail,
  AlertTriangle,
  Briefcase,
  BarChart3,
  FileCheck,
  UserCog,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Smartphone,
  MailCheck,
  AlertOctagon,
  Archive,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Clock,
  DollarSign,
  Percent,
  Users as UsersIcon,
  Building,
  Star,
  Award,
  Zap,
  Activity,
  PieChart,
  LineChart,
  TrendingUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Crown,
  UserPlus
} from 'lucide-react';

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
// ADMIN SIDEBAR COMPONENT
// ============================================================
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
// TOGGLE SWITCH COMPONENT
// ============================================================
const ToggleSwitch = ({ value, onChange, disabled = false }) => {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        value ? 'bg-yellow-500' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-yellow-500/20'}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
          value ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
};

// ============================================================
// MAIN ADMIN SETTINGS COMPONENT
// ============================================================
const AdminSettings = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    siteName: 'HomelyServ',
    siteDescription: 'Find trusted home service workers',
    contactEmail: 'support@homelyserv.com',
    contactPhone: '+20 123 456 789',
    address: 'Cairo, Egypt',
    
    // Appearance
    darkMode: false,
    primaryColor: '#fbbf24',
    secondaryColor: '#1a1a1a',
    language: 'en',
    
    // Notifications
    systemNotifications: true,
    emailNotifications: true,
    pushNotifications: false,
    complaintNotifications: true,
    paymentNotifications: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    
    // Payment
    currency: 'EGP',
    commissionRate: 6.5,
    minWithdrawal: 100,
    maxWithdrawal: 50000,
    paymentMethods: ['credit_card', 'bank_transfer', 'cash'],
    
    // User Management
    allowRegistration: true,
    requireApproval: false,
    maxUsersPerIp: 10,
    autoSuspendAfter: 30,
    
    // System
    debugMode: false,
    maintenanceMode: false,
    cacheEnabled: true,
    backupSchedule: 'daily'
  });

  const translations = {
    en: {
      title: 'Settings',
      subtitle: 'Manage your admin preferences',
      tabs: {
        general: 'General',
        appearance: 'Appearance',
        notifications: 'Notifications',
        security: 'Security',
        payment: 'Payment',
        users: 'Users',
        system: 'System'
      },
      general: {
        title: 'General Settings',
        siteName: 'Site Name',
        siteDescription: 'Site Description',
        contactEmail: 'Contact Email',
        contactPhone: 'Contact Phone',
        address: 'Address'
      },
      appearance: {
        title: 'Appearance Settings',
        darkMode: 'Dark Mode',
        primaryColor: 'Primary Color',
        secondaryColor: 'Secondary Color',
        language: 'Language'
      },
      notifications: {
        title: 'Notification Settings',
        systemNotifications: 'System Notifications',
        emailNotifications: 'Email Notifications',
        pushNotifications: 'Push Notifications',
        complaintNotifications: 'Complaint Notifications',
        paymentNotifications: 'Payment Notifications'
      },
      security: {
        title: 'Security Settings',
        twoFactorAuth: 'Two-Factor Authentication',
        sessionTimeout: 'Session Timeout (minutes)',
        maxLoginAttempts: 'Max Login Attempts',
        requireEmailVerification: 'Require Email Verification',
        requirePhoneVerification: 'Require Phone Verification',
        changePassword: 'Change Password'
      },
      payment: {
        title: 'Payment Settings',
        currency: 'Currency',
        commissionRate: 'Commission Rate (%)',
        minWithdrawal: 'Minimum Withdrawal',
        maxWithdrawal: 'Maximum Withdrawal',
        paymentMethods: 'Payment Methods'
      },
      users: {
        title: 'User Management',
        allowRegistration: 'Allow New Registrations',
        requireApproval: 'Require Admin Approval',
        maxUsersPerIp: 'Max Users per IP',
        autoSuspendAfter: 'Auto-Suspend After (days)'
      },
      system: {
        title: 'System Settings',
        debugMode: 'Debug Mode',
        maintenanceMode: 'Maintenance Mode',
        cacheEnabled: 'Enable Cache',
        backupSchedule: 'Backup Schedule',
        clearCache: 'Clear Cache',
        backupData: 'Backup Data',
        restoreData: 'Restore Data'
      },
      actions: {
        save: 'Save Changes',
        saving: 'Saving...',
        saved: 'Settings saved successfully!',
        cancel: 'Cancel',
        confirm: 'Confirm',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        passwordMismatch: 'Passwords do not match',
        passwordLength: 'Password must be at least 8 characters',
        passwordChanged: 'Password changed successfully!'
      },
      languageToggle: 'العربية'
    },
    ar: {
      title: 'الإعدادات',
      subtitle: 'إدارة تفضيلات المشرف',
      tabs: {
        general: 'عام',
        appearance: 'المظهر',
        notifications: 'الإشعارات',
        security: 'الأمان',
        payment: 'الدفع',
        users: 'المستخدمين',
        system: 'النظام'
      },
      general: {
        title: 'الإعدادات العامة',
        siteName: 'اسم الموقع',
        siteDescription: 'وصف الموقع',
        contactEmail: 'البريد الإلكتروني للتواصل',
        contactPhone: 'هاتف التواصل',
        address: 'العنوان'
      },
      appearance: {
        title: 'إعدادات المظهر',
        darkMode: 'الوضع الداكن',
        primaryColor: 'اللون الأساسي',
        secondaryColor: 'اللون الثانوي',
        language: 'اللغة'
      },
      notifications: {
        title: 'إعدادات الإشعارات',
        systemNotifications: 'إشعارات النظام',
        emailNotifications: 'الإشعارات البريدية',
        pushNotifications: 'إشعارات الدفع',
        complaintNotifications: 'إشعارات الشكاوى',
        paymentNotifications: 'إشعارات الدفع'
      },
      security: {
        title: 'إعدادات الأمان',
        twoFactorAuth: 'المصادقة الثنائية',
        sessionTimeout: 'انتهاء الجلسة (دقائق)',
        maxLoginAttempts: 'الحد الأقصى لمحاولات تسجيل الدخول',
        requireEmailVerification: 'طلب التحقق من البريد الإلكتروني',
        requirePhoneVerification: 'طلب التحقق من الهاتف',
        changePassword: 'تغيير كلمة المرور'
      },
      payment: {
        title: 'إعدادات الدفع',
        currency: 'العملة',
        commissionRate: 'نسبة العمولة (%)',
        minWithdrawal: 'الحد الأدنى للسحب',
        maxWithdrawal: 'الحد الأقصى للسحب',
        paymentMethods: 'طرق الدفع'
      },
      users: {
        title: 'إدارة المستخدمين',
        allowRegistration: 'السماح بالتسجيل الجديد',
        requireApproval: 'طلب موافقة المشرف',
        maxUsersPerIp: 'الحد الأقصى للمستخدمين لكل IP',
        autoSuspendAfter: 'التعليق التلقائي بعد (أيام)'
      },
      system: {
        title: 'إعدادات النظام',
        debugMode: 'وضع التصحيح',
        maintenanceMode: 'وضع الصيانة',
        cacheEnabled: 'تفعيل التخزين المؤقت',
        backupSchedule: 'جدول النسخ الاحتياطي',
        clearCache: 'مسح التخزين المؤقت',
        backupData: 'نسخ احتياطي للبيانات',
        restoreData: 'استعادة البيانات'
      },
      actions: {
        save: 'حفظ التغييرات',
        saving: 'جاري الحفظ...',
        saved: 'تم حفظ الإعدادات بنجاح!',
        cancel: 'إلغاء',
        confirm: 'تأكيد',
        changePassword: 'تغيير كلمة المرور',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        passwordLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
        passwordChanged: 'تم تغيير كلمة المرور بنجاح!'
      },
      languageToggle: 'English'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
      setSettings(prev => ({ ...prev, language: savedLang }));
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

    // Load saved settings
    const savedSettings = localStorage.getItem('admin_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Auto-hide notification messages
  useEffect(() => {
    if (notificationMessage) {
      const timer = setTimeout(() => {
        setNotificationMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMessage]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    setSettings(prev => ({ ...prev, language: newLang }));
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

  const handleSave = () => {
    setSaving(true);
    setSaveMessage(null);
    setTimeout(() => {
      localStorage.setItem('admin_settings', JSON.stringify(settings));
      setSaving(false);
      setSaveMessage(t.actions.saved);
      setTimeout(() => setSaveMessage(null), 3000);
    }, 1000);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotificationMessage({ type: 'error', text: t.actions.passwordMismatch });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setNotificationMessage({ type: 'error', text: t.actions.passwordLength });
      return;
    }
    setNotificationMessage({ type: 'success', text: t.actions.passwordChanged });
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleBackup = () => {
    setBackupInProgress(true);
    setTimeout(() => {
      const data = {
        users: JSON.parse(localStorage.getItem('homelyserv_users') || '[]'),
        payments: JSON.parse(localStorage.getItem('all_payments') || '[]'),
        offers: JSON.parse(localStorage.getItem('employer_offers') || '[]'),
        complaints: {
          employer: JSON.parse(localStorage.getItem('employer_complaints') || '[]'),
          worker: JSON.parse(localStorage.getItem('worker_complaints') || '[]')
        },
        settings: settings,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homelyserv_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setBackupInProgress(false);
      setNotificationMessage({ type: 'success', text: 'Backup completed successfully!' });
    }, 1500);
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cache? This action cannot be undone.')) {
      localStorage.removeItem('homelyserv_cached_data');
      setNotificationMessage({ type: 'success', text: 'Cache cleared successfully!' });
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      credit_card: 'Credit Card',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      paypal: 'PayPal',
      stripe: 'Stripe'
    };
    return labels[method] || method;
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

          {/* Notification Messages */}
          {notificationMessage && (
            <div className={`mb-4 px-4 py-3 rounded-lg ${
              notificationMessage.type === 'error' 
                ? 'bg-red-500/20 border border-red-500 text-red-400' 
                : 'bg-green-500/20 border border-green-500 text-green-400'
            }`}>
              {notificationMessage.text}
            </div>
          )}

          {saveMessage && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500 text-green-400">
              {saveMessage}
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 border-b border-yellow-500/20 pb-2">
            {['general', 'appearance', 'notifications', 'security', 'payment', 'users', 'system'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition rounded-lg ${
                  activeTab === tab
                    ? 'bg-yellow-500 text-black'
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10'
                }`}
              >
                {t.tabs[tab]}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            {activeTab === 'general' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.general.title}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.general.siteName}</label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => handleSettingChange('siteName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.general.siteDescription}</label>
                    <textarea
                      value={settings.siteDescription}
                      onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.general.contactEmail}</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.general.contactPhone}</label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.general.address}</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => handleSettingChange('address', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.appearance.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.appearance.darkMode}</p>
                      <p className="text-sm text-gray-500">Switch between light and dark theme</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.darkMode} 
                      onChange={() => handleToggleChange('darkMode')} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.appearance.primaryColor}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer bg-[#0a0a0a]"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.appearance.secondaryColor}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                        className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer bg-[#0a0a0a]"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.appearance.language}</label>
                    <select
                      value={settings.language}
                      onChange={(e) => {
                        handleSettingChange('language', e.target.value);
                        setLanguage(e.target.value);
                        localStorage.setItem('homelyserv_language', e.target.value);
                      }}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.notifications.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.notifications.systemNotifications}</p>
                      <p className="text-sm text-gray-500">Enable or disable system notifications</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.systemNotifications} 
                      onChange={() => handleToggleChange('systemNotifications')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.notifications.emailNotifications}</p>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.emailNotifications} 
                      onChange={() => handleToggleChange('emailNotifications')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.notifications.pushNotifications}</p>
                      <p className="text-sm text-gray-500">Enable push notifications</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.pushNotifications} 
                      onChange={() => handleToggleChange('pushNotifications')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.notifications.complaintNotifications}</p>
                      <p className="text-sm text-gray-500">Get notified about new complaints</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.complaintNotifications} 
                      onChange={() => handleToggleChange('complaintNotifications')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.notifications.paymentNotifications}</p>
                      <p className="text-sm text-gray-500">Get notified about payment activity</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.paymentNotifications} 
                      onChange={() => handleToggleChange('paymentNotifications')} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.security.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.security.twoFactorAuth}</p>
                      <p className="text-sm text-gray-500">Require two-factor authentication</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.twoFactorAuth} 
                      onChange={() => handleToggleChange('twoFactorAuth')} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.security.sessionTimeout}</label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.security.maxLoginAttempts}</label>
                    <input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.security.requireEmailVerification}</p>
                      <p className="text-sm text-gray-500">Require email verification for new users</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.requireEmailVerification} 
                      onChange={() => handleToggleChange('requireEmailVerification')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.security.requirePhoneVerification}</p>
                      <p className="text-sm text-gray-500">Require phone verification for new users</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.requirePhoneVerification} 
                      onChange={() => handleToggleChange('requirePhoneVerification')} 
                    />
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full px-4 py-3 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Key size={18} />
                    {t.actions.changePassword}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.payment.title}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.payment.currency}</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleSettingChange('currency', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    >
                      <option value="EGP">EGP - Egyptian Pound</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.payment.commissionRate}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.commissionRate}
                      onChange={(e) => handleSettingChange('commissionRate', parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.payment.minWithdrawal}</label>
                    <input
                      type="number"
                      value={settings.minWithdrawal}
                      onChange={(e) => handleSettingChange('minWithdrawal', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.payment.maxWithdrawal}</label>
                    <input
                      type="number"
                      value={settings.maxWithdrawal}
                      onChange={(e) => handleSettingChange('maxWithdrawal', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.payment.paymentMethods}</label>
                    <div className="space-y-2">
                      {['credit_card', 'bank_transfer', 'cash', 'paypal', 'stripe'].map((method) => (
                        <label key={method} className="flex items-center gap-3 p-2 bg-[#0a0a0a] rounded-lg border border-gray-700 cursor-pointer hover:border-yellow-500/30 transition">
                          <input
                            type="checkbox"
                            checked={settings.paymentMethods.includes(method)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleSettingChange('paymentMethods', [...settings.paymentMethods, method]);
                              } else {
                                handleSettingChange('paymentMethods', settings.paymentMethods.filter(m => m !== method));
                              }
                            }}
                            className="w-4 h-4 accent-yellow-500"
                          />
                          <span className="text-gray-300">{getPaymentMethodLabel(method)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.users.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.users.allowRegistration}</p>
                      <p className="text-sm text-gray-500">Allow new user registrations</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.allowRegistration} 
                      onChange={() => handleToggleChange('allowRegistration')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.users.requireApproval}</p>
                      <p className="text-sm text-gray-500">Require admin approval for new users</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.requireApproval} 
                      onChange={() => handleToggleChange('requireApproval')} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.users.maxUsersPerIp}</label>
                    <input
                      type="number"
                      value={settings.maxUsersPerIp}
                      onChange={(e) => handleSettingChange('maxUsersPerIp', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.users.autoSuspendAfter}</label>
                    <input
                      type="number"
                      value={settings.autoSuspendAfter}
                      onChange={(e) => handleSettingChange('autoSuspendAfter', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.system.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.system.debugMode}</p>
                      <p className="text-sm text-gray-500">Enable debug mode for developers</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.debugMode} 
                      onChange={() => handleToggleChange('debugMode')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.system.maintenanceMode}</p>
                      <p className="text-sm text-gray-500">Put the site in maintenance mode</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.maintenanceMode} 
                      onChange={() => handleToggleChange('maintenanceMode')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-300">{t.system.cacheEnabled}</p>
                      <p className="text-sm text-gray-500">Enable caching for better performance</p>
                    </div>
                    <ToggleSwitch 
                      value={settings.cacheEnabled} 
                      onChange={() => handleToggleChange('cacheEnabled')} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.system.backupSchedule}</label>
                    <select
                      value={settings.backupSchedule}
                      onChange={(e) => handleSettingChange('backupSchedule', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="manual">Manual Only</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleClearCache}
                      className="px-4 py-3 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      {t.system.clearCache}
                    </button>
                    <button
                      onClick={handleBackup}
                      disabled={backupInProgress}
                      className="px-4 py-3 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {backupInProgress ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Backing up...
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          {t.system.backupData}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="p-6 bg-[#0a0a0a] border-t border-yellow-500/20">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2 disabled:opacity-50 font-medium"
              >
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? t.actions.saving : t.actions.save}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full border border-yellow-500/20">
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <h2 className="text-xl font-semibold text-white">{t.actions.changePassword}</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors text-gray-400 hover:text-yellow-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.actions.currentPassword}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.actions.newPassword}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.actions.confirmPassword}</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-yellow-500/20">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition font-medium"
              >
                {t.actions.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;