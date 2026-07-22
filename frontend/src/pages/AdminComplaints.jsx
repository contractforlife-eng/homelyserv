// src/pages/AdminComplaints.jsx - WITH WORKING NOTIFICATION BELL
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
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
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Eye,
  Shield,
  Briefcase,
  UserCheck,
  Check,
  RefreshCw,
  Send,
  BarChart3,
  FileCheck,
  Crown,
  DollarSign,
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

    // 6. Check for complaint responses
    const allComplaintsWithResponses = [...employerComplaints, ...workerComplaints];
    const recentResponses = allComplaintsWithResponses.filter(c => {
      if (!c.adminResponse) return false;
      const responseAt = new Date(c.adminResponseAt || c.updatedAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return responseAt > oneDayAgo && c.status !== 'resolved';
    });

    recentResponses.forEach(complaint => {
      const notifId = `complaint_response_${complaint.id}`;
      if (!existingIds.has(notifId)) {
        newNotifications.push({
          id: notifId,
          type: 'complaint_response',
          title: 'New Complaint Response 💬',
          message: `Admin responded to complaint: "${complaint.title}"`,
          read: false,
          createdAt: new Date().toISOString(),
          link: '/admin/complaints',
          icon: 'message',
          complaintId: complaint.id,
          complaintTitle: complaint.title
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
      'complaint_response': <MessageCircle size={16} className="text-indigo-400" />
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
// MAIN ADMIN COMPLAINTS COMPONENT
// ============================================================
const AdminComplaints = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const translations = {
    en: {
      title: 'Complaints Management',
      subtitle: 'View and manage all complaints from workers and employers',
      stats: {
        total: 'Total Complaints',
        pending: 'Pending',
        resolved: 'Resolved',
        rejected: 'Rejected',
        inProgress: 'In Progress',
        workers: 'From Workers',
        employers: 'From Employers'
      },
      filters: {
        all: 'All Complaints',
        pending: 'Pending',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        rejected: 'Rejected',
        workers: 'Workers Only',
        employers: 'Employers Only'
      },
      table: {
        title: 'Title',
        from: 'From',
        category: 'Category',
        status: 'Status',
        date: 'Date',
        actions: 'Actions',
        noResults: 'No complaints found',
        searchPlaceholder: 'Search complaints...'
      },
      actions: {
        view: 'View Details',
        resolve: 'Resolve',
        reject: 'Reject',
        refresh: 'Refresh',
        delete: 'Delete'
      },
      status: {
        pending: 'Pending',
        resolved: 'Resolved',
        rejected: 'Rejected',
        inProgress: 'In Progress'
      },
      categories: {
        general: 'General',
        employer: 'Employer Issue',
        payment: 'Payment Issue',
        platform: 'Platform Issue',
        worker: 'Worker Issue',
        other: 'Other'
      },
      modal: {
        title: 'Complaint Details',
        complaintId: 'Complaint ID',
        from: 'Submitted By',
        type: 'User Type',
        email: 'Email',
        phone: 'Phone',
        category: 'Category',
        status: 'Status',
        date: 'Date',
        description: 'Description',
        response: 'Admin Response',
        close: 'Close',
        resolve: 'Mark as Resolved',
        reject: 'Reject Complaint',
        resolveConfirm: 'Are you sure you want to mark this complaint as resolved?',
        rejectConfirm: 'Are you sure you want to reject this complaint?',
        resolved: 'Complaint resolved successfully!',
        rejected: 'Complaint rejected.',
        noResponse: 'No response yet',
        addResponse: 'Add Response',
        responsePlaceholder: 'Type your response here...',
        sendResponse: 'Send Response'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading complaints...',
      noComplaints: 'No complaints yet',
      refreshSuccess: 'Complaints refreshed!'
    },
    ar: {
      title: 'إدارة الشكاوى',
      subtitle: 'عرض وإدارة جميع الشكاوى من العمال وأصحاب العمل',
      stats: {
        total: 'إجمالي الشكاوى',
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        rejected: 'مرفوض',
        inProgress: 'قيد المعالجة',
        workers: 'من العمال',
        employers: 'من أصحاب العمل'
      },
      filters: {
        all: 'جميع الشكاوى',
        pending: 'قيد الانتظار',
        inProgress: 'قيد المعالجة',
        resolved: 'تم الحل',
        rejected: 'مرفوض',
        workers: 'عمال فقط',
        employers: 'أصحاب عمل فقط'
      },
      table: {
        title: 'العنوان',
        from: 'من',
        category: 'الفئة',
        status: 'الحالة',
        date: 'التاريخ',
        actions: 'الإجراءات',
        noResults: 'لا توجد شكاوى',
        searchPlaceholder: 'ابحث عن شكاوى...'
      },
      actions: {
        view: 'عرض التفاصيل',
        resolve: 'حل',
        reject: 'رفض',
        refresh: 'تحديث',
        delete: 'حذف'
      },
      status: {
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        rejected: 'مرفوض',
        inProgress: 'قيد المعالجة'
      },
      categories: {
        general: 'عام',
        employer: 'مشكلة مع صاحب العمل',
        payment: 'مشكلة في الدفع',
        platform: 'مشكلة في المنصة',
        worker: 'مشكلة مع عامل',
        other: 'أخرى'
      },
      modal: {
        title: 'تفاصيل الشكوى',
        complaintId: 'رقم الشكوى',
        from: 'مقدم من',
        type: 'نوع المستخدم',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        category: 'الفئة',
        status: 'الحالة',
        date: 'التاريخ',
        description: 'الوصف',
        response: 'رد الإدارة',
        close: 'إغلاق',
        resolve: 'تحديد كمحلولة',
        reject: 'رفض الشكوى',
        resolveConfirm: 'هل أنت متأكد من رغبتك في تحديد هذه الشكوى كمحلولة؟',
        rejectConfirm: 'هل أنت متأكد من رغبتك في رفض هذه الشكوى؟',
        resolved: 'تم حل الشكوى بنجاح!',
        rejected: 'تم رفض الشكوى.',
        noResponse: 'لا يوجد رد حتى الآن',
        addResponse: 'إضافة رد',
        responsePlaceholder: 'اكتب ردك هنا...',
        sendResponse: 'إرسال الرد'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الشكاوى...',
      noComplaints: 'لا توجد شكاوى حتى الآن',
      refreshSuccess: 'تم تحديث الشكاوى!'
    }
  };

  const t = translations[language] || translations.en;

  // ============================================================
  // LOAD COMPLAINTS FROM ALL SOURCES
  // ============================================================
  const loadComplaints = () => {
    setLoading(true);
    
    try {
      // Load employer complaints
      const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
      
      // Load worker complaints  
      const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
      
      // Load admin complaints (if any stored directly)
      const adminComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
      
      // Combine all complaints with source tracking
      const allComplaints = [];
      
      // Add employer complaints
      employerComplaints.forEach(c => {
        allComplaints.push({
          ...c,
          source: 'employer',
          sourceLabel: 'Employer',
          userEmail: c.employerEmail || c.email || 'Unknown',
          userName: c.employerName || c.name || 'Employer',
          userType: 'employer',
          submittedAt: c.date || c.createdAt || c.submittedAt || new Date().toISOString()
        });
      });
      
      // Add worker complaints
      workerComplaints.forEach(c => {
        allComplaints.push({
          ...c,
          source: 'worker',
          sourceLabel: 'Worker',
          userEmail: c.workerEmail || c.email || 'Unknown',
          userName: c.workerName || c.name || 'Worker',
          userType: 'worker',
          submittedAt: c.date || c.createdAt || c.submittedAt || new Date().toISOString()
        });
      });
      
      // Add admin complaints
      adminComplaints.forEach(c => {
        allComplaints.push({
          ...c,
          source: 'admin',
          sourceLabel: 'Admin',
          userEmail: c.adminEmail || c.email || 'Unknown',
          userName: c.adminName || c.name || 'Admin',
          userType: 'admin',
          submittedAt: c.date || c.createdAt || c.submittedAt || new Date().toISOString()
        });
      });
      
      // Sort by date (newest first)
      allComplaints.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.date || a.createdAt || 0);
        const dateB = new Date(b.submittedAt || b.date || b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log(`📋 Loaded ${allComplaints.length} complaints:`, {
        employer: employerComplaints.length,
        worker: workerComplaints.length,
        admin: adminComplaints.length
      });
      
      setComplaints(allComplaints);
      setFilteredComplaints(allComplaints);
      
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UPDATE COMPLAINT STATUS
  // ============================================================
  const updateComplaintStatus = (complaintId, newStatus) => {
    setProcessing(true);
    
    try {
      // Get all complaints from all sources
      const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
      const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
      const adminComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
      
      // Update in employer complaints
      const updatedEmployer = employerComplaints.map(c => 
        c.id === complaintId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      );
      
      // Update in worker complaints
      const updatedWorker = workerComplaints.map(c => 
        c.id === complaintId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      );
      
      // Update in admin complaints
      const updatedAdmin = adminComplaints.map(c => 
        c.id === complaintId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      );
      
      // Save back to localStorage
      localStorage.setItem('employer_complaints', JSON.stringify(updatedEmployer));
      localStorage.setItem('worker_complaints', JSON.stringify(updatedWorker));
      localStorage.setItem('admin_complaints', JSON.stringify(updatedAdmin));
      
      // Create notification
      const notification = {
        id: 'notif_' + Date.now(),
        type: 'complaint_updated',
        message: `Complaint #${complaintId} has been ${newStatus}`,
        complaintId: complaintId,
        date: new Date().toISOString(),
        read: false
      };
      const notifications = JSON.parse(localStorage.getItem('homelyserv_notifications') || '[]');
      notifications.push(notification);
      localStorage.setItem('homelyserv_notifications', JSON.stringify(notifications));
      
      // Reload complaints
      loadComplaints();
      
      // Show success message
      if (newStatus === 'resolved') {
        alert(t.modal.resolved);
      } else if (newStatus === 'rejected') {
        alert(t.modal.rejected);
      }
      
      // Close modal if open
      setShowDetailsModal(false);
      setSelectedComplaint(null);
      
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Failed to update complaint. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // ADD ADMIN RESPONSE TO COMPLAINT
  // ============================================================
  const addResponse = (complaintId, responseText) => {
    if (!responseText.trim()) return;
    
    setProcessing(true);
    
    try {
      // Get all complaints from all sources
      const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
      const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
      const adminComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
      
      // Find the complaint to get its source
      let complaintSource = null;
      let foundComplaint = null;
      
      // Check in employer complaints
      const empComplaint = employerComplaints.find(c => c.id === complaintId);
      if (empComplaint) {
        complaintSource = 'employer';
        foundComplaint = empComplaint;
      }
      
      // Check in worker complaints
      if (!foundComplaint) {
        const workComplaint = workerComplaints.find(c => c.id === complaintId);
        if (workComplaint) {
          complaintSource = 'worker';
          foundComplaint = workComplaint;
        }
      }
      
      // Check in admin complaints
      if (!foundComplaint) {
        const adminComp = adminComplaints.find(c => c.id === complaintId);
        if (adminComp) {
          complaintSource = 'admin';
          foundComplaint = adminComp;
        }
      }
      
      if (!foundComplaint) {
        alert('Complaint not found');
        setProcessing(false);
        return;
      }
      
      // Update the complaint with admin response
      const updatedComplaint = {
        ...foundComplaint,
        adminResponse: responseText,
        adminResponseAt: new Date().toISOString(),
        status: 'inProgress',
        updatedAt: new Date().toISOString()
      };
      
      // Update in the appropriate storage
      if (complaintSource === 'employer') {
        const updatedEmployer = employerComplaints.map(c => 
          c.id === complaintId ? updatedComplaint : c
        );
        localStorage.setItem('employer_complaints', JSON.stringify(updatedEmployer));
      } else if (complaintSource === 'worker') {
        const updatedWorker = workerComplaints.map(c => 
          c.id === complaintId ? updatedComplaint : c
        );
        localStorage.setItem('worker_complaints', JSON.stringify(updatedWorker));
      } else {
        const updatedAdmin = adminComplaints.map(c => 
          c.id === complaintId ? updatedComplaint : c
        );
        localStorage.setItem('admin_complaints', JSON.stringify(updatedAdmin));
      }
      
      // Also update admin_complaints for admin view
      const adminComplaintsUpdated = adminComplaints.map(c => 
        c.id === complaintId ? updatedComplaint : c
      );
      localStorage.setItem('admin_complaints', JSON.stringify(adminComplaintsUpdated));
      
      // Create notification for the complainant
      const notification = {
        id: 'notif_' + Date.now(),
        type: 'complaint_response',
        message: `Admin has responded to your complaint: "${foundComplaint.title}"`,
        complaintId: complaintId,
        complaintTitle: foundComplaint.title,
        response: responseText,
        date: new Date().toISOString(),
        read: false
      };
      
      // Send notification to the appropriate user
      const notifications = JSON.parse(localStorage.getItem('homelyserv_notifications') || '[]');
      notifications.push(notification);
      localStorage.setItem('homelyserv_notifications', JSON.stringify(notifications));
      
      // Reload complaints
      loadComplaints();
      
      // Update selected complaint
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint({
          ...selectedComplaint,
          adminResponse: responseText,
          adminResponseAt: new Date().toISOString(),
          status: 'inProgress'
        });
      }
      
      alert('✅ Response sent successfully! The user will see it in their complaints page.');
      
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Failed to add response. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // useEffects
  // ============================================================
  // Use authStore as single source of truth
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    setUser(authUser);
    loadComplaints();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Filter complaints
  useEffect(() => {
    let filtered = complaints;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(c => c.source === sourceFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(searchLower) ||
        c.userName?.toLowerCase().includes(searchLower) ||
        c.userEmail?.toLowerCase().includes(searchLower) ||
        c.category?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.id?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, statusFilter, sourceFilter, searchTerm]);

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
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    loadComplaints();
    alert(t.refreshSuccess);
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      inProgress: 'bg-blue-500/20 text-blue-400',
      resolved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'inProgress': return <AlertCircle size={16} className="text-blue-400" />;
      case 'resolved': return <CheckCircle size={16} className="text-green-400" />;
      case 'rejected': return <X size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status) => {
    return t.status[status] || status;
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'employer': return <Briefcase size={14} className="text-blue-400" />;
      case 'worker': return <UserCheck size={14} className="text-green-400" />;
      case 'admin': return <Shield size={14} className="text-purple-400" />;
      default: return <UserIcon size={14} className="text-gray-400" />;
    }
  };

  const getSourceLabel = (source) => {
    return source === 'employer' ? 'Employer' : 
           source === 'worker' ? 'Worker' : 
           source === 'admin' ? 'Admin' : 'Unknown';
  };

  const getCategoryLabel = (category) => {
    return t.categories[category] || category || 'General';
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

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'inProgress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    workers: complaints.filter(c => c.source === 'worker').length,
    employers: complaints.filter(c => c.source === 'employer').length
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
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-black/70">
                <span>📋 Total: {stats.total}</span>
                <span>👤 Workers: {stats.workers}</span>
                <span>🏢 Employers: {stats.employers}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.total}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
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
                <p className="text-sm text-gray-400">{t.stats.inProgress}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.inProgress}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.resolved}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.resolved}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.rejected}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.rejected}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">From Workers</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <UserCheck size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.workers}</p>
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
                  <option value="pending">{t.filters.pending}</option>
                  <option value="inProgress">{t.filters.inProgress}</option>
                  <option value="resolved">{t.filters.resolved}</option>
                  <option value="rejected">{t.filters.rejected}</option>
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                >
                  <option value="all">All Sources</option>
                  <option value="employer">Employers Only</option>
                  <option value="worker">Workers Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{filteredComplaints.length}</span> complaints
            </p>
          </div>

          {/* Complaints List */}
          {filteredComplaints.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.noComplaints}</h3>
              <p className="text-gray-400">Complaints from workers and employers will appear here</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
              >
                <RefreshCw size={16} className="inline mr-2" />
                {t.actions.refresh}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden hover:border-yellow-500/40 transition"
                >
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {getSourceIcon(complaint.source)}
                          <span className="text-xs font-medium text-gray-400">
                            {getSourceLabel(complaint.source)}
                          </span>
                          <span className="text-gray-500">|</span>
                          <AlertTriangle size={20} className="text-yellow-400" />
                          <div>
                            <h3 className="font-semibold text-white">{complaint.title}</h3>
                            <p className="text-sm text-gray-400">{complaint.userName}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">{complaint.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                          <span className="text-gray-500">{getCategoryLabel(complaint.category)}</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-gray-500">{formatDate(complaint.submittedAt || complaint.date || complaint.createdAt)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(complaint.status)}`}>
                            {getStatusIcon(complaint.status)}
                            {getStatusLabel(complaint.status)}
                          </span>
                          {complaint.source === 'employer' && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Employer</span>
                          )}
                          {complaint.source === 'worker' && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Worker</span>
                          )}
                          {complaint.adminResponse && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1">
                              <CheckCircle size={12} />
                              Responded
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleViewDetails(complaint)}
                          className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition flex items-center gap-1"
                        >
                          <Eye size={14} />
                          {t.actions.view}
                        </button>
                        {complaint.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                              disabled={processing}
                              className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition disabled:opacity-50"
                            >
                              <CheckCircle size={14} className="inline mr-1" />
                              {t.actions.resolve}
                            </button>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'rejected')}
                              disabled={processing}
                              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition disabled:opacity-50"
                            >
                              <X size={14} className="inline mr-1" />
                              {t.actions.reject}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedComplaint && (
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
                    <p className="text-sm text-gray-400">{t.modal.complaintId}</p>
                    <p className="text-lg font-bold text-white">{selectedComplaint.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedComplaint.status)}`}>
                    {getStatusIcon(selectedComplaint.status)}
                    {getStatusLabel(selectedComplaint.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <UserIcon size={16} className="text-yellow-500" />
                    {t.modal.from}
                  </h3>
                  <p className="font-medium text-white">{selectedComplaint.userName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getSourceIcon(selectedComplaint.source)}
                    <span className="text-sm text-gray-400">{getSourceLabel(selectedComplaint.source)}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{selectedComplaint.userEmail}</p>
                  {selectedComplaint.phone && (
                    <p className="text-sm text-gray-400">{selectedComplaint.phone}</p>
                  )}
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-yellow-500" />
                    Details
                  </h3>
                  <p className="text-sm text-gray-400">{t.modal.category}</p>
                  <p className="font-medium text-white">{getCategoryLabel(selectedComplaint.category)}</p>
                  <p className="text-sm text-gray-400 mt-2">{t.modal.date}</p>
                  <p className="font-medium text-white">{formatDate(selectedComplaint.submittedAt || selectedComplaint.date || selectedComplaint.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 bg-[#0a0a0a] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">{t.modal.description}</h3>
                <p className="text-white whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>

              {/* Admin Response Section */}
              <div className="mt-4 bg-[#0a0a0a] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-yellow-500" />
                  {t.modal.response}
                </h3>
                {selectedComplaint.adminResponse ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-white whitespace-pre-wrap">{selectedComplaint.adminResponse}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(selectedComplaint.adminResponseAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">{t.modal.noResponse}</p>
                )}
                
                <div className="mt-3">
                  <textarea
                    placeholder={t.modal.responsePlaceholder}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                    id="adminResponse"
                  />
                  <button
                    onClick={() => {
                      const response = document.getElementById('adminResponse').value;
                      if (response.trim()) {
                        addResponse(selectedComplaint.id, response);
                        document.getElementById('adminResponse').value = '';
                      } else {
                        alert('Please enter a response');
                      }
                    }}
                    disabled={processing}
                    className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send size={16} />
                    {t.modal.sendResponse}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-6 border-t border-yellow-500/20">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                {t.modal.close}
              </button>
              
              {selectedComplaint.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'resolved')}
                    disabled={processing}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {t.modal.resolve}
                  </button>
                  <button
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'rejected')}
                    disabled={processing}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X size={16} />
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

export default AdminComplaints;