// src/pages/AdminPayments.jsx - WITH WORKING NOTIFICATION BELL
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
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  FileText,
  User as UserIcon,
  Calendar,
  TrendingUp,
  RefreshCw,
  Shield,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Unlock,
  UserCheck,
  Briefcase,
  BarChart3,
  AlertTriangle,
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

    // 6. Check for payment verification requests
    const verificationRequests = JSON.parse(localStorage.getItem('homelyserv_payment_verification_requests') || '[]');
    const recentVerifications = verificationRequests.filter(req => {
      const createdAt = new Date(req.submittedAt || req.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > oneDayAgo && req.status === 'pending';
    });

    recentVerifications.forEach(req => {
      const notifId = `payment_verification_${req.id}`;
      if (!existingIds.has(notifId)) {
        newNotifications.push({
          id: notifId,
          type: 'payment_verification',
          title: 'Payment Verification Request 📋',
          message: `Payment of ${req.amount || 0} EGP from ${req.employerName || 'Employer'} needs verification`,
          read: false,
          createdAt: new Date().toISOString(),
          link: '/admin/payments',
          icon: 'dollar',
          amount: req.amount,
          employerName: req.employerName
        });
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
      'premium_activation': <Crown size={16} className="text-yellow-400" />,
      'payment_verification': <Shield size={16} className="text-orange-400" />
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

  const isActive = (path) => location.pathname === path;

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
// MAIN ADMIN PAYMENTS COMPONENT
// ============================================================
const AdminPayments = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(null);

  const translations = {
    en: {
      title: 'Payments',
      subtitle: 'Manage and verify all payments and transactions',
      stats: {
        total: 'Total Payments',
        completed: 'Completed',
        pending: 'Pending Verification',
        failed: 'Failed',
        totalAmount: 'Total Amount'
      },
      filters: {
        all: 'All Payments',
        completed: 'Verified',
        pending: 'Pending',
        failed: 'Failed'
      },
      table: {
        id: 'Transaction ID',
        user: 'User',
        amount: 'Amount',
        date: 'Date',
        method: 'Method',
        status: 'Status',
        actions: 'Actions',
        noResults: 'No payments found',
        searchPlaceholder: 'Search payments...'
      },
      actions: {
        view: 'View Details',
        verify: 'Verify Payment',
        reject: 'Reject',
        refresh: 'Refresh',
        approve: 'Approve'
      },
      status: {
        completed: 'Verified',
        pending: 'Pending',
        failed: 'Failed',
        pending_verification: 'Pending Verification'
      },
      modal: {
        title: 'Payment Details',
        paymentId: 'Payment ID',
        worker: 'Worker',
        employer: 'Employer',
        amount: 'Amount',
        date: 'Date',
        method: 'Payment Method',
        status: 'Status',
        description: 'Description',
        reference: 'Reference',
        close: 'Close',
        verify: 'Verify & Confirm',
        reject: 'Reject Payment',
        verifyConfirm: 'Are you sure you want to verify this payment?',
        rejectConfirm: 'Are you sure you want to reject this payment?',
        verified: 'Payment verified successfully!',
        rejected: 'Payment rejected.',
        contactInfo: 'Contact Information',
        jobTitle: 'Job Title',
        workerEmail: 'Worker Email',
        workerPhone: 'Worker Phone'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading payments...',
      noPayments: 'No payments yet'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة والتحقق من جميع المدفوعات والمعاملات',
      stats: {
        total: 'إجمالي المدفوعات',
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة',
        totalAmount: 'المبلغ الإجمالي'
      },
      filters: {
        all: 'جميع المدفوعات',
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة'
      },
      table: {
        id: 'رقم المعاملة',
        user: 'المستخدم',
        amount: 'المبلغ',
        date: 'التاريخ',
        method: 'الطريقة',
        status: 'الحالة',
        actions: 'الإجراءات',
        noResults: 'لا توجد مدفوعات',
        searchPlaceholder: 'ابحث عن مدفوعات...'
      },
      actions: {
        view: 'عرض التفاصيل',
        verify: 'تحقق من الدفع',
        reject: 'رفض',
        refresh: 'تحديث',
        approve: 'موافقة'
      },
      status: {
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة',
        pending_verification: 'في انتظار التحقق'
      },
      modal: {
        title: 'تفاصيل الدفع',
        paymentId: 'رقم الدفع',
        worker: 'العامل',
        employer: 'صاحب العمل',
        amount: 'المبلغ',
        date: 'التاريخ',
        method: 'طريقة الدفع',
        status: 'الحالة',
        description: 'الوصف',
        reference: 'المرجع',
        close: 'إغلاق',
        verify: 'تحقق وأكد',
        reject: 'رفض الدفع',
        verifyConfirm: 'هل أنت متأكد من رغبتك في التحقق من هذا الدفع؟',
        rejectConfirm: 'هل أنت متأكد من رغبتك في رفض هذا الدفع؟',
        verified: 'تم التحقق من الدفع بنجاح!',
        rejected: 'تم رفض الدفع.',
        contactInfo: 'معلومات الاتصال',
        jobTitle: 'عنوان الوظيفة',
        workerEmail: 'بريد العامل',
        workerPhone: 'هاتف العامل'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل المدفوعات...',
      noPayments: 'لا توجد مدفوعات حتى الآن'
    }
  };

  const t = translations[language] || translations.en;

  // ============================================================
  // loadPayments
  // ============================================================
  const loadPayments = () => {
    setLoading(true);
    
    try {
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      console.log('📋 Loaded from all_payments:', allPayments.length);
      
      const verificationRequests = JSON.parse(localStorage.getItem('homelyserv_payment_verification_requests') || '[]');
      
      const mergedPayments = [...allPayments];
      
      verificationRequests.forEach(req => {
        if (!mergedPayments.find(p => p.id === req.id)) {
          mergedPayments.push({
            ...req,
            id: req.id || 'REQ-' + Date.now(),
            status: 'pending_verification',
            paymentMethod: req.paymentMethod || 'Unknown'
          });
        }
      });
      
      mergedPayments.sort((a, b) => new Date(b.createdAt || b.submittedAt || b.date) - new Date(a.createdAt || a.submittedAt || a.date));
      
      setPayments(mergedPayments);
      setFilteredPayments(mergedPayments);
      
      localStorage.setItem('admin_payments', JSON.stringify(mergedPayments));
      console.log('✅ Admin payments loaded:', mergedPayments.length);
      
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // verifyPayment
  // ============================================================
  const verifyPayment = (payment) => {
    if (!confirm(t.modal.verifyConfirm)) return;
    
    setVerifyingPayment(payment.id);
    
    try {
      const updatedPayment = {
        ...payment,
        status: 'completed',
        paymentVerified: true,
        contactRevealed: true,
        verifiedAt: new Date().toISOString(),
        verifiedBy: user?.email || 'admin'
      };
      
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      const updatedAllPayments = allPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('all_payments', JSON.stringify(updatedAllPayments));
      
      const adminPayments = JSON.parse(localStorage.getItem('admin_payments') || '[]');
      const updatedAdminPayments = adminPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('admin_payments', JSON.stringify(updatedAdminPayments));
      
      const employerPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
      const updatedEmployerPayments = employerPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('employer_payments', JSON.stringify(updatedEmployerPayments));
      
      if (payment.offerId) {
        const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
        const updatedOffers = employerOffers.map(o => 
          o.id === payment.offerId ? { ...o, paymentVerified: true, contactRevealed: true } : o
        );
        localStorage.setItem('employer_offers', JSON.stringify(updatedOffers));
      }
      
      const verificationRequests = JSON.parse(localStorage.getItem('homelyserv_payment_verification_requests') || '[]');
      const updatedRequests = verificationRequests.map(r => 
        r.id === payment.id ? { ...r, status: 'verified', verifiedAt: new Date().toISOString() } : r
      );
      localStorage.setItem('homelyserv_payment_verification_requests', JSON.stringify(updatedRequests));
      
      const notification = {
        id: 'notif_' + Date.now(),
        type: 'payment_verified',
        message: `Your payment for ${payment.workerName || 'worker'} has been verified and confirmed!`,
        paymentId: payment.id,
        workerName: payment.workerName,
        employerId: payment.employerId || payment.employerEmail,
        date: new Date().toISOString(),
        read: false
      };
      const notifications = JSON.parse(localStorage.getItem('homelyserv_notifications') || '[]');
      notifications.push(notification);
      localStorage.setItem('homelyserv_notifications', JSON.stringify(notifications));
      
      setPayments(prev => prev.map(p => 
        p.id === payment.id ? updatedPayment : p
      ));
      setFilteredPayments(prev => prev.map(p => 
        p.id === payment.id ? updatedPayment : p
      ));
      
      alert(t.modal.verified);
      
      setShowDetailsModal(false);
      setSelectedPayment(null);
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment. Please try again.');
    } finally {
      setVerifyingPayment(null);
    }
  };

  // ============================================================
  // rejectPayment
  // ============================================================
  const rejectPayment = (payment) => {
    if (!confirm(t.modal.rejectConfirm)) return;
    
    setVerifyingPayment(payment.id);
    
    try {
      const updatedPayment = {
        ...payment,
        status: 'failed',
        rejectedAt: new Date().toISOString(),
        rejectedBy: user?.email || 'admin'
      };
      
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      const updatedAllPayments = allPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('all_payments', JSON.stringify(updatedAllPayments));
      
      const adminPayments = JSON.parse(localStorage.getItem('admin_payments') || '[]');
      const updatedAdminPayments = adminPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('admin_payments', JSON.stringify(updatedAdminPayments));
      
      const verificationRequests = JSON.parse(localStorage.getItem('homelyserv_payment_verification_requests') || '[]');
      const updatedRequests = verificationRequests.map(r => 
        r.id === payment.id ? { ...r, status: 'rejected', rejectedAt: new Date().toISOString() } : r
      );
      localStorage.setItem('homelyserv_payment_verification_requests', JSON.stringify(updatedRequests));
      
      setPayments(prev => prev.map(p => 
        p.id === payment.id ? updatedPayment : p
      ));
      setFilteredPayments(prev => prev.map(p => 
        p.id === payment.id ? updatedPayment : p
      ));
      
      alert(t.modal.rejected);
      
      setShowDetailsModal(false);
      setSelectedPayment(null);
      
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setVerifyingPayment(null);
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

    loadPayments();
    
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Filter payments
  useEffect(() => {
    let filtered = payments;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.id?.toLowerCase().includes(searchLower) ||
        p.workerName?.toLowerCase().includes(searchLower) ||
        p.employerName?.toLowerCase().includes(searchLower) ||
        p.employer?.toLowerCase().includes(searchLower) ||
        p.user?.toLowerCase().includes(searchLower) ||
        p.method?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

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

  const handleRefresh = () => {
    loadPayments();
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      pending_verification: 'bg-blue-500/20 text-blue-400',
      failed: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'pending_verification': return <Clock size={16} className="text-blue-400" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status) => {
    return t.status[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString() || 0} EGP`;
  };

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending' || p.status === 'pending_verification').length,
    failed: payments.filter(p => p.status === 'failed').length
  };

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

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

  if (loading) {
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
              {/* WORKING NOTIFICATION BELL */}
              <NotificationBell userId={user?.id || user?.email} />
              
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/10 transition-colors text-gray-300 hover:text-yellow-500 flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/10 transition-colors text-gray-300 hover:text-yellow-500 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                {t.actions.refresh}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.total}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.completed}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.pending}</p>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.failed}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.failed}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.totalAmount}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalAmount)}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder={t.table.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="completed">{t.filters.completed}</option>
                  <option value="pending">{t.filters.pending}</option>
                  <option value="failed">{t.filters.failed}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{filteredPayments.length}</span> payments
            </p>
          </div>

          {/* Payments Table */}
          {filteredPayments.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.noPayments}</h3>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a] border-b border-yellow-500/20">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-500/10">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 text-gray-300 text-sm font-mono">{payment.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <UserIcon size={12} className="text-yellow-400" />
                            </div>
                            <span className="text-white text-sm">
                              {payment.workerName || payment.user || payment.employerName || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{formatDate(payment.date || payment.createdAt || payment.submittedAt)}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{payment.paymentMethod || payment.method || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(payment)}
                              className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {(payment.status === 'pending' || payment.status === 'pending_verification') && (
                              <>
                                <button
                                  onClick={() => verifyPayment(payment)}
                                  disabled={verifyingPayment === payment.id}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                                >
                                  {verifyingPayment === payment.id ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <ThumbsUp size={12} />
                                  )}
                                  {t.actions.verify}
                                </button>
                                <button
                                  onClick={() => rejectPayment(payment)}
                                  disabled={verifyingPayment === payment.id}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                                >
                                  <ThumbsDown size={12} />
                                  {t.actions.reject}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20">
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <h2 className="text-xl font-semibold text-white">{t.modal.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors text-gray-400 hover:text-yellow-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">{t.modal.paymentId}</p>
                    <p className="text-lg font-bold text-white">{selectedPayment.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <UserIcon size={16} className="text-yellow-500" />
                    {t.modal.worker}
                  </h3>
                  <p className="font-medium text-white">{selectedPayment.workerName || 'Unknown'}</p>
                  {selectedPayment.workerEmail && (
                    <p className="text-sm text-gray-400">{selectedPayment.workerEmail}</p>
                  )}
                  {selectedPayment.workerPhone && (
                    <p className="text-sm text-gray-400">{selectedPayment.workerPhone}</p>
                  )}
                  {selectedPayment.jobTitle && (
                    <p className="text-sm text-gray-400 mt-2">{t.modal.jobTitle}: {selectedPayment.jobTitle}</p>
                  )}
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <Briefcase size={16} className="text-yellow-500" />
                    {t.modal.employer}
                  </h3>
                  <p className="font-medium text-white">{selectedPayment.employerName || selectedPayment.employer || 'Unknown'}</p>
                  {selectedPayment.employerEmail && (
                    <p className="text-sm text-gray-400">{selectedPayment.employerEmail}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <p className="text-sm text-gray-400">{t.modal.amount}</p>
                  <p className="text-2xl font-bold text-yellow-500">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <p className="text-sm text-gray-400">{t.modal.date}</p>
                  <p className="font-medium text-white">{formatDate(selectedPayment.date || selectedPayment.createdAt || selectedPayment.submittedAt)}</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <p className="text-sm text-gray-400">{t.modal.method}</p>
                  <p className="font-medium text-white">{selectedPayment.paymentMethod || selectedPayment.method || 'Unknown'}</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <p className="text-sm text-gray-400">{t.modal.reference}</p>
                  <p className="font-medium text-white">{selectedPayment.reference || '-'}</p>
                </div>
              </div>

              {selectedPayment.description && (
                <div className="mt-4 bg-[#0a0a0a] rounded-xl p-4">
                  <p className="text-sm text-gray-400">{t.modal.description}</p>
                  <p className="font-medium text-white">{selectedPayment.description}</p>
                </div>
              )}

              {selectedPayment.status === 'completed' && selectedPayment.contactRevealed && (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <Unlock size={16} />
                    {t.modal.contactInfo} - Unlocked
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {selectedPayment.workerEmail && (
                      <div>
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white ml-2">{selectedPayment.workerEmail}</span>
                      </div>
                    )}
                    {selectedPayment.workerPhone && (
                      <div>
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white ml-2">{selectedPayment.workerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPayment.status === 'pending' && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
                  <Lock size={20} className="text-yellow-500" />
                  <p className="text-sm text-yellow-400">Contact info locked - Verify payment to unlock</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 p-6 border-t border-yellow-500/20">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                {t.modal.close}
              </button>
              
              {(selectedPayment.status === 'pending' || selectedPayment.status === 'pending_verification') && (
                <>
                  <button
                    onClick={() => verifyPayment(selectedPayment)}
                    disabled={verifyingPayment === selectedPayment.id}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verifyingPayment === selectedPayment.id ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <ThumbsUp size={16} />
                    )}
                    {t.modal.verify}
                  </button>
                  <button
                    onClick={() => rejectPayment(selectedPayment)}
                    disabled={verifyingPayment === selectedPayment.id}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ThumbsDown size={16} />
                    {t.modal.reject}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;