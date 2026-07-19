// src/pages/AdminReports.jsx - WITH WORKING NOTIFICATION BELL
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
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  Briefcase,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Eye,
  Filter,
  Search,
  Award,
  Shield,
  Building,
  MapPin,
  Activity,
  Zap,
  Target,
  Flag,
  User as UserIcon,
  AlertTriangle,
  FileCheck,
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
// MAIN ADMIN REPORTS COMPONENT
// ============================================================
const AdminReports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [chartType, setChartType] = useState('bar');

  const translations = {
    en: {
      title: 'Reports & Analytics',
      subtitle: 'View platform insights and analytics',
      stats: {
        totalUsers: 'Total Users',
        totalWorkers: 'Total Workers',
        totalEmployers: 'Total Employers',
        totalHires: 'Total Hires',
        totalRevenue: 'Total Revenue',
        totalComplaints: 'Total Complaints',
        activeUsers: 'Active Users',
        completionRate: 'Completion Rate',
        growthRate: 'Growth Rate'
      },
      tabs: {
        overview: 'Overview',
        users: 'Users',
        hires: 'Hires',
        revenue: 'Revenue',
        performance: 'Performance',
        reports: 'Reports'
      },
      chart: {
        monthlyGrowth: 'Monthly Growth',
        switchTo: 'Switch to {type} Chart',
        categoryDistribution: 'Category Distribution'
      },
      recentReports: 'Recent Reports',
      generateReport: 'Generate Report',
      reportType: 'Report Type',
      format: 'Format',
      startDate: 'Start Date',
      endDate: 'End Date',
      export: 'Export',
      print: 'Print',
      refresh: 'Refresh',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading reports...'
    },
    ar: {
      title: 'التقارير والتحليلات',
      subtitle: 'عرض رؤى المنصة والتحليلات',
      stats: {
        totalUsers: 'إجمالي المستخدمين',
        totalWorkers: 'إجمالي العمال',
        totalEmployers: 'إجمالي أصحاب العمل',
        totalHires: 'إجمالي التوظيفات',
        totalRevenue: 'إجمالي الإيرادات',
        totalComplaints: 'إجمالي الشكاوى',
        activeUsers: 'المستخدمين النشطين',
        completionRate: 'معدل الإكمال',
        growthRate: 'معدل النمو'
      },
      tabs: {
        overview: 'نظرة عامة',
        users: 'المستخدمين',
        hires: 'التوظيفات',
        revenue: 'الإيرادات',
        performance: 'الأداء',
        reports: 'التقارير'
      },
      chart: {
        monthlyGrowth: 'النمو الشهري',
        switchTo: 'التبديل إلى مخطط {type}',
        categoryDistribution: 'توزيع الفئات'
      },
      recentReports: 'التقارير الأخيرة',
      generateReport: 'إنشاء تقرير',
      reportType: 'نوع التقرير',
      format: 'التنسيق',
      startDate: 'تاريخ البداية',
      endDate: 'تاريخ النهاية',
      export: 'تصدير',
      print: 'طباعة',
      refresh: 'تحديث',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل التقارير...'
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

    setLoading(false);
  }, [navigate]);

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

  // Report data
  const overviewStats = {
    totalUsers: 25680,
    totalWorkers: 8432,
    totalEmployers: 1234,
    totalHires: 895,
    totalRevenue: 48650,
    totalComplaints: 127,
    activeUsers: 2845,
    completionRate: 78,
    growthRate: 12.5
  };

  const monthlyData = [
    { month: 'Jan', users: 1200, hires: 45, revenue: 3200 },
    { month: 'Feb', users: 1340, hires: 52, revenue: 3800 },
    { month: 'Mar', users: 1500, hires: 58, revenue: 4200 },
    { month: 'Apr', users: 1680, hires: 63, revenue: 4800 },
    { month: 'May', users: 1850, hires: 72, revenue: 5400 },
    { month: 'Jun', users: 2100, hires: 85, revenue: 6200 }
  ];

  const categoryData = [
    { name: 'Nanny', value: 1256, percentage: 39 },
    { name: 'Elderly Care', value: 842, percentage: 26 },
    { name: 'Drivers', value: 612, percentage: 19 },
    { name: 'Security', value: 285, percentage: 9 },
    { name: 'Housekeeping', value: 220, percentage: 7 }
  ];

  const recentReports = [
    { id: 1, title: 'Monthly Revenue Report', date: '2026-06-20', status: 'completed', type: 'revenue' },
    { id: 2, title: 'User Growth Report', date: '2026-06-18', status: 'pending', type: 'users' },
    { id: 3, title: 'Worker Performance Report', date: '2026-06-15', status: 'completed', type: 'workers' },
    { id: 4, title: 'Commission Report', date: '2026-06-12', status: 'completed', type: 'commission' }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">{status}</span>;
    }
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
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Page Header - Dark Theme */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black">{t.title}</h1>
              <p className="text-black/70 mt-1">{t.subtitle}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-yellow-500/20">
            {['overview', 'users', 'hires', 'revenue', 'performance', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition capitalize ${
                  activeTab === tab 
                    ? 'text-yellow-500 border-b-2 border-yellow-500' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {t.tabs[tab] || tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-sm border border-yellow-500/20 hover:border-yellow-500/40 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t.stats.totalUsers}</p>
                      <p className="text-2xl font-bold text-white">{overviewStats.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users size={20} className="text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+{overviewStats.growthRate}%</span>
                    <span className="text-gray-500">vs last month</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-sm border border-yellow-500/20 hover:border-yellow-500/40 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t.stats.totalWorkers}</p>
                      <p className="text-2xl font-bold text-white">{overviewStats.totalWorkers.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Briefcase size={20} className="text-green-400" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+8%</span>
                    <span className="text-gray-500">vs last month</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-sm border border-yellow-500/20 hover:border-yellow-500/40 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t.stats.totalRevenue}</p>
                      <p className="text-2xl font-bold text-white">${overviewStats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign size={20} className="text-yellow-400" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+18%</span>
                    <span className="text-gray-500">vs last month</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-sm border border-yellow-500/20 hover:border-yellow-500/40 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t.stats.completionRate}</p>
                      <p className="text-2xl font-bold text-white">{overviewStats.completionRate}%</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Award size={20} className="text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+5%</span>
                    <span className="text-gray-500">vs last month</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-white">{t.chart.monthlyGrowth}</h3>
                    <button 
                      onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}
                      className="text-sm text-yellow-400 hover:text-yellow-300 transition"
                    >
                      {t.chart.switchTo.replace('{type}', chartType === 'bar' ? 'Line' : 'Bar')}
                    </button>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {monthlyData.map((item, i) => (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div 
                          className={`${chartType === 'bar' ? 'w-full' : 'w-1'} bg-yellow-500 rounded-t transition-all duration-500`}
                          style={{ height: `${(item.users / 2500) * 100}%` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                        <span className="text-xs text-gray-400">{item.users}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 p-6">
                  <h3 className="font-semibold text-white mb-4">{t.chart.categoryDistribution}</h3>
                  <div className="space-y-3">
                    {categoryData.map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{cat.name}</span>
                          <span className="font-medium text-white">{cat.value} ({cat.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              i === 0 ? 'bg-yellow-500' : 
                              i === 1 ? 'bg-blue-500' : 
                              i === 2 ? 'bg-green-500' : 
                              i === 3 ? 'bg-purple-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${cat.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 p-6">
                <h3 className="font-semibold text-white mb-4">{t.recentReports}</h3>
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex justify-between items-center border-b border-yellow-500/10 pb-3">
                      <div>
                        <p className="font-medium text-white">{report.title}</p>
                        <p className="text-sm text-gray-500">{report.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(report.status)}
                        <button className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded transition">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-white transition">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">User Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">New Users (This Month)</p>
                  <p className="text-2xl font-bold text-blue-400">2,100</p>
                  <p className="text-xs text-green-400">+15% from last month</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">{t.stats.activeUsers}</p>
                  <p className="text-2xl font-bold text-green-400">{overviewStats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-400">+8% from last month</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">User Retention Rate</p>
                  <p className="text-2xl font-bold text-purple-400">72%</p>
                  <p className="text-xs text-green-400">+5% from last month</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yellow-500/20">
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">New Users</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Active Users</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((item, i) => (
                      <tr key={i} className="border-b border-yellow-500/10">
                        <td className="py-3 font-medium text-white">{item.month}</td>
                        <td className="py-3 text-gray-400">{item.users}</td>
                        <td className="py-3 text-gray-400">{Math.round(item.users * 0.65)}</td>
                        <td className="py-3 text-green-400">+{Math.round((item.users / 1200 - 1) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Revenue Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">{t.stats.totalRevenue}</p>
                  <p className="text-2xl font-bold text-yellow-400">${overviewStats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">Commission Earned</p>
                  <p className="text-2xl font-bold text-orange-400">${Math.round(overviewStats.totalRevenue * 0.065).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">Average Per Hire</p>
                  <p className="text-2xl font-bold text-blue-400">$54</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yellow-500/20">
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((item, i) => (
                      <tr key={i} className="border-b border-yellow-500/10">
                        <td className="py-3 font-medium text-white">{item.month}</td>
                        <td className="py-3 text-gray-400">${item.revenue}</td>
                        <td className="py-3 text-gray-400">${Math.round(item.revenue * 0.065)}</td>
                        <td className="py-3 text-green-400">+{Math.round((item.revenue / 3200 - 1) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{t.generateReport}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{t.reportType}</label>
                  <select className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white">
                    <option>Revenue Report</option>
                    <option>User Report</option>
                    <option>Worker Report</option>
                    <option>Hire Report</option>
                    <option>Commission Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{t.format}</label>
                  <select className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white">
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{t.startDate}</label>
                  <input type="date" className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">{t.endDate}</label>
                  <input type="date" className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white" />
                </div>
              </div>
              <button className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2 font-medium">
                <FileText size={18} />
                {t.generateReport}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminReports;