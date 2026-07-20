// src/pages/WorkerDashboard.jsx - RED AND WHITE THEME WITH ENHANCED NOTIFICATIONS
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
import { syncCurrentUser } from "../utils/syncUser";
import {
  Home,
  User,
  Briefcase,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Users,
  Heart,
  TrendingUp,
  Globe,
  X,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Shield,
  Sparkles,
  Crown,
  ThumbsUp,
  AlertCircle,
  Star,
  FileText,
  Calendar,
  DollarSign,
  Award
} from 'lucide-react';

// Sidebar Component - RED THEME
const WorkerSidebar = ({ 
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
      myOffers: 'My Offers',
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
      myOffers: 'عروضي',
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

  const t = translations[language] || translations.en;

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/worker-profile' },
    { id: 'offers', label: t.myOffers, icon: Briefcase, path: '/worker/offers' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/worker-payment' },
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
            <Link to="/worker-dashboard" className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className="text-red-500" />
                <Home size={14} className="text-red-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/worker-dashboard" className="relative mx-auto">
              <Shield size={28} className="text-red-500" />
              <Home size={14} className="text-red-300 absolute -bottom-1 -right-1" />
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || 'Worker'} 
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
                  <p className="font-medium text-gray-800 truncate">{user.fullName || 'Worker'}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{user.email || 'worker@homelyserv.com'}</p>
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
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-red-600' : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-red-600 rounded-full"></div>
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
            to="/worker-settings"
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 group ${
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

// Main WorkerDashboard Component - RED THEME
const WorkerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(() => syncCurrentUser());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const updatedUser = syncCurrentUser();

    if (updatedUser) {
      setUser(updatedUser);
    }
  }, []);
  const [stats, setStats] = useState({
    
    totalApplications: 0,
    activeOffers: 0,
    interviews: 0,
    savedJobs: 0,
    profileViews: 0,
    messages: 0,
    completedJobs: 0,
    pendingPayments: 0,
    totalEarnings: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    inProgressOffers: 0,
    rejectedOffers: 0,
    completedOffers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isPremium = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  const translations = {
    en: {
      welcome: 'Welcome back',
      dashboard: 'Dashboard',
      overview: 'Overview',
      stats: {
        applications: 'Applications',
        activeOffers: 'Active Offers',
        interviews: 'Interviews',
        savedJobs: 'Saved Jobs',
        profileViews: 'Profile Views',
        messages: 'Messages',
        completedJobs: 'Completed Jobs',
        pendingPayments: 'Pending Payments',
        totalEarnings: 'Total Earnings',
        pendingOffers: 'Pending Offers',
        acceptedOffers: 'Accepted',
        inProgress: 'In Progress',
        rejected: 'Rejected',
        completed: 'Completed'
      },
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      findJobs: 'Find Jobs',
      viewOffers: 'View Offers',
      viewProfile: 'View Profile',
      viewMessages: 'View Messages',
      notifications: 'Notifications',
      languageToggle: 'العربية',
      noActivity: 'No recent activity',
      noNotifications: 'No notifications',
      viewAll: 'View All',
      markAllRead: 'Mark All Read',
      premiumBadge: 'Premium Verified',
      getPremium: 'Get Premium'
    },
    ar: {
      welcome: 'مرحباً بعودتك',
      dashboard: 'لوحة التحكم',
      overview: 'نظرة عامة',
      stats: {
        applications: 'الطلبات',
        activeOffers: 'العروض النشطة',
        interviews: 'المقابلات',
        savedJobs: 'الوظائف المحفوظة',
        profileViews: 'مشاهدات الملف',
        messages: 'الرسائل',
        completedJobs: 'الوظائف المكتملة',
        pendingPayments: 'المدفوعات المعلقة',
        totalEarnings: 'إجمالي الأرباح',
        pendingOffers: 'عروض معلقة',
        acceptedOffers: 'مقبولة',
        inProgress: 'قيد التنفيذ',
        rejected: 'مرفوضة',
        completed: 'مكتملة'
      },
      recentActivity: 'النشاط الأخير',
      quickActions: 'إجراءات سريعة',
      findJobs: 'البحث عن وظائف',
      viewOffers: 'عرض العروض',
      viewProfile: 'عرض الملف الشخصي',
      viewMessages: 'عرض الرسائل',
      notifications: 'الإشعارات',
      languageToggle: 'English',
      noActivity: 'لا يوجد نشاط حديث',
      noNotifications: 'لا توجد إشعارات',
      viewAll: 'عرض الكل',
      markAllRead: 'تعيين الكل كمقروء',
      premiumBadge: 'مميز معتمد',
      getPremium: 'اشتراك مميز'
    }
  };

  const t = translations[language] || translations.en;

  // =======================const t = translations[language] || translations.en;=====================================
  // TOGGLE FUNCTIONS - DEFINED BEFORE THEY'RE USED
  // ============================================================
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    navigate('/login');
  };

  // ============================================================
  // NOTIFICATION GENERATION FUNCTIONS
  // ============================================================

  // Generate notification for offer status change
  const generateOfferNotification = (offer, action, employerName) => {
    const notification = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'offer',
      title: '',
      message: '',
      time: new Date().toISOString(),
      read: false,
      link: '/worker/offers',
      icon: 'briefcase'
    };

    switch (action) {
      case 'accepted':
        notification.title = 'Offer Accepted ✅';
        notification.message = `${employerName || 'Employer'} has accepted your offer for "${offer.jobTitle || 'position'}"`;
        notification.icon = 'check';
        break;
      case 'rejected':
        notification.title = 'Offer Rejected ❌';
        notification.message = `${employerName || 'Employer'} has rejected your offer for "${offer.jobTitle || 'position'}"`;
        notification.icon = 'x';
        break;
      case 'pending':
        notification.title = 'New Offer Pending ⏳';
        notification.message = `Your offer for "${offer.jobTitle || 'position'}" is pending review`;
        notification.icon = 'clock';
        break;
      case 'in_progress':
        notification.title = 'Offer In Progress 🔄';
        notification.message = `${employerName || 'Employer'} has started work on "${offer.jobTitle || 'position'}"`;
        notification.icon = 'zap';
        break;
      case 'completed':
        notification.title = 'Offer Completed 🎉';
        notification.message = `Work on "${offer.jobTitle || 'position'}" has been completed successfully!`;
        notification.icon = 'check';
        break;
      case 'interview':
        notification.title = 'Interview Scheduled 📅';
        notification.message = `${employerName || 'Employer'} has scheduled an interview for "${offer.jobTitle || 'position'}"`;
        notification.icon = 'calendar';
        break;
      default:
        notification.title = 'Offer Updated';
        notification.message = `Your offer for "${offer.jobTitle || 'position'}" has been updated`;
        notification.icon = 'briefcase';
    }

    return notification;
  };

  // Generate notification for complaint update
  const generateComplaintNotification = (complaint, action) => {
    const notification = {
      id: `complaint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'complaint',
      time: new Date().toISOString(),
      read: false,
      link: '/worker-complaints',
      icon: 'alert'
    };

    switch (action) {
      case 'resolved':
        notification.title = 'Complaint Resolved ✅';
        notification.message = `Your complaint "${complaint.subject || 'issue'}" has been resolved by admin`;
        notification.icon = 'check';
        break;
      case 'response':
        notification.title = 'Complaint Response 📨';
        notification.message = `Admin has responded to your complaint "${complaint.subject || 'issue'}"`;
        notification.icon = 'message';
        break;
      case 'escalated':
        notification.title = 'Complaint Escalated ⬆️';
        notification.message = `Your complaint "${complaint.subject || 'issue'}" has been escalated to senior management`;
        notification.icon = 'alert';
        break;
      case 'closed':
        notification.title = 'Complaint Closed 📕';
        notification.message = `Your complaint "${complaint.subject || 'issue'}" has been closed`;
        notification.icon = 'check';
        break;
      default:
        notification.title = 'Complaint Update';
        notification.message = `Your complaint "${complaint.subject || 'issue'}" has been updated`;
        notification.icon = 'alert';
    }

    return notification;
  };

  // Generate notification for payment
  const generatePaymentNotification = (payment, action) => {
    const notification = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'payment',
      time: new Date().toISOString(),
      read: false,
      link: '/worker-payment',
      icon: 'dollar'
    };

    switch (action) {
      case 'received':
        notification.title = 'Payment Received 💰';
        notification.message = `You have received EGP ${payment.amount || 0} from ${payment.employerName || 'employer'}`;
        notification.icon = 'dollar';
        break;
      case 'pending':
        notification.title = 'Payment Pending ⏳';
        notification.message = `Payment of EGP ${payment.amount || 0} is pending approval`;
        notification.icon = 'clock';
        break;
      case 'confirmed':
        notification.title = 'Payment Confirmed ✅';
        notification.message = `Payment of EGP ${payment.amount || 0} has been confirmed`;
        notification.icon = 'check';
        break;
      default:
        notification.title = 'Payment Update';
        notification.message = `Your payment of EGP ${payment.amount || 0} has been updated`;
        notification.icon = 'dollar';
    }

    return notification;
  };

  // Generate notification for new message
  const generateMessageNotification = (message, senderName) => {
    return {
      id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      title: 'New Message 💬',
      message: `${senderName || 'Someone'} sent you a new message: "${message.preview || message.message?.substring(0, 50) || 'New message'}"`,
      time: new Date().toISOString(),
      read: false,
      link: '/worker-messages',
      icon: 'message'
    };
  };

  // Generate notification for profile review
  const generateProfileNotification = (action) => {
    const notification = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'profile',
      time: new Date().toISOString(),
      read: false,
      link: '/worker-profile',
      icon: 'user'
    };

    switch (action) {
      case 'approved':
        notification.title = 'Profile Approved ✅';
        notification.message = 'Your profile has been approved by admin. You can now apply for jobs!';
        notification.icon = 'check';
        break;
      case 'rejected':
        notification.title = 'Profile Needs Review 📝';
        notification.message = 'Your profile needs some updates. Please check your profile for details.';
        notification.icon = 'alert';
        break;
      case 'viewed':
        notification.title = 'Profile Viewed 👀';
        notification.message = 'An employer has viewed your profile';
        notification.icon = 'user';
        break;
      default:
        notification.title = 'Profile Update';
        notification.message = 'Your profile has been updated';
        notification.icon = 'user';
    }

    return notification;
  };

  // Generate notification for subscription/premium
  const generateSubscriptionNotification = (action) => {
    const notification = {
      id: `subscription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'subscription',
      time: new Date().toISOString(),
      read: false,
      link: '/subscription',
      icon: 'crown'
    };

    switch (action) {
      case 'activated':
        notification.title = 'Premium Activated 👑';
        notification.message = 'Congratulations! Your Premium subscription is now active. Enjoy exclusive features!';
        notification.icon = 'crown';
        break;
      case 'expiring':
        notification.title = 'Premium Expiring Soon ⏰';
        notification.message = 'Your Premium subscription will expire in 7 days. Renew now to keep your benefits!';
        notification.icon = 'clock';
        break;
      case 'expired':
        notification.title = 'Premium Expired ❌';
        notification.message = 'Your Premium subscription has expired. Renew now to regain access to premium features.';
        notification.icon = 'x';
        break;
      default:
        notification.title = 'Subscription Update';
        notification.message = 'Your subscription has been updated';
        notification.icon = 'crown';
    }

    return notification;
  };

  // ============================================================
  // CHECK FOR NEW NOTIFICATIONS FROM VARIOUS SOURCES
  // ============================================================
  const checkForNewNotifications = () => {
    if (!user?.email) return;

    const currentUserEmail = user.email;
    const currentUserId = user.id || user.email;
    const existingNotifications = JSON.parse(
      localStorage.getItem(`worker_notifications_${currentUserEmail}`) || '[]'
    );
    
    const newNotifications = [];
    const existingIds = new Set(existingNotifications.map(n => n.id));

    // 1. Check for offer updates
    const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
    const workerOffers = employerOffers.filter(
      offer => offer.workerEmail === currentUserEmail
    );

    workerOffers.forEach(offer => {
      const existingOfferNotif = existingNotifications.find(
        n => n.type === 'offer' && n.message.includes(offer.jobTitle || 'position')
      );
      
      if (!existingOfferNotif || !existingOfferNotif.message.includes(offer.status)) {
        const notif = generateOfferNotification(
          offer, 
          offer.status, 
          offer.employerName
        );
        newNotifications.push(notif);
      }
    });

    // 2. Check for complaint updates
    const complaints = JSON.parse(localStorage.getItem('homelyserv_complaints') || '[]');
    const workerComplaints = complaints.filter(
      c => c.workerEmail === currentUserEmail || c.workerId === currentUserId
    );

    workerComplaints.forEach(complaint => {
      const existingComplaintNotif = existingNotifications.find(
        n => n.type === 'complaint' && n.message.includes(complaint.subject || 'issue')
      );
      
      if (complaint.status === 'resolved' || complaint.status === 'closed' || complaint.adminResponse) {
        const action = complaint.status === 'resolved' ? 'resolved' : 
                       complaint.status === 'closed' ? 'closed' : 'response';
        if (!existingComplaintNotif) {
          const notif = generateComplaintNotification(complaint, action);
          newNotifications.push(notif);
        }
      }
    });

    // 3. Check for payment updates
    const payments = JSON.parse(localStorage.getItem('homelyserv_payments') || '[]');
    const workerPayments = payments.filter(
      p => p.workerId === currentUserId || p.workerEmail === currentUserEmail
    );

    workerPayments.forEach(payment => {
      const existingPaymentNotif = existingNotifications.find(
        n => n.type === 'payment' && n.message.includes(`EGP ${payment.amount || 0}`)
      );
      
      if (payment.status === 'completed' || payment.status === 'paid') {
        if (!existingPaymentNotif) {
          const notif = generatePaymentNotification(payment, 'received');
          newNotifications.push(notif);
        }
      }
    });

    // 4. Check for new messages
    const allMessages = JSON.parse(localStorage.getItem('homelyserv_chat_messages') || '{}');
    Object.keys(allMessages).forEach(convId => {
      const msgs = allMessages[convId] || [];
      msgs.forEach(msg => {
        if (msg.recipientId === currentUserId && !msg.read) {
          const existingMsgNotif = existingNotifications.find(
            n => n.type === 'message' && n.message.includes(msg.message?.substring(0, 30) || '')
          );
          if (!existingMsgNotif) {
            const notif = generateMessageNotification(msg, msg.senderName || 'Someone');
            newNotifications.push(notif);
            msg.read = true;
          }
        }
      });
      localStorage.setItem('homelyserv_chat_messages', JSON.stringify(allMessages));
    });

    // 5. Check for profile updates
    const profile = JSON.parse(localStorage.getItem(`homelyserv_profile_${currentUserEmail}`) || '{}');
    if (profile.status === 'approved' || profile.status === 'rejected') {
      const existingProfileNotif = existingNotifications.find(
        n => n.type === 'profile' && n.message.includes('profile')
      );
      if (!existingProfileNotif) {
        const notif = generateProfileNotification(profile.status === 'approved' ? 'approved' : 'rejected');
        newNotifications.push(notif);
      }
    }

    // 6. Check for subscription updates
    const subscription = JSON.parse(localStorage.getItem(`homelyserv_subscription_${currentUserId}`) || '{}');
    if (subscription.status === 'active') {
      const existingSubNotif = existingNotifications.find(
        n => n.type === 'subscription' && n.message.includes('Premium')
      );
      if (!existingSubNotif) {
        const notif = generateSubscriptionNotification('activated');
        newNotifications.push(notif);
      }
    }

    if (newNotifications.length > 0) {
      const updatedNotifications = [...newNotifications, ...existingNotifications]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 50);

      localStorage.setItem(`worker_notifications_${currentUserEmail}`, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }
  };

  // ============================================================
  // LOAD STATS
  // ============================================================
  const loadRealStats = () => {
    try {
      if (!user?.email) return;

      const currentUserEmail = user.email;
      const currentUserId = user.id || user.email;
      
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const workerOffers = employerOffers.filter(
        offer => offer.workerEmail === currentUserEmail
      );
      
      const pendingOffers = workerOffers.filter(o => o.status === 'pending').length;
      const acceptedOffers = workerOffers.filter(o => o.status === 'accepted').length;
      const inProgressOffers = workerOffers.filter(o => o.status === 'in_progress').length;
      const rejectedOffers = workerOffers.filter(o => o.status === 'rejected').length;
      const completedOffers = workerOffers.filter(o => o.status === 'completed').length;
      
      const workerSpecificOffers = JSON.parse(localStorage.getItem(`worker_offers_${currentUserEmail}`) || '[]');
      const allWorkerOffers = [...workerOffers];
      workerSpecificOffers.forEach(offer => {
        if (!allWorkerOffers.find(o => o.id === offer.id)) {
          allWorkerOffers.push(offer);
        }
      });
      
      const appliedOffers = JSON.parse(localStorage.getItem('worker_applied_offers') || '[]');
      const workerAppliedOffers = appliedOffers.filter(
        offer => offer.workerEmail === currentUserEmail || offer.workerId === currentUserId
      );
      
      const savedOffers = JSON.parse(localStorage.getItem('worker_saved_offers') || '[]');
      const workerSavedOffers = savedOffers.filter(
        offer => offer.workerEmail === currentUserEmail || offer.workerId === currentUserId
      );
      
      const profileViews = parseInt(localStorage.getItem(`profile_views_${currentUserEmail}`) || '0');
      
      let messagesCount = 0;
      if (currentUserId) {
        const allMessages = JSON.parse(localStorage.getItem('homelyserv_chat_messages') || '{}');
        Object.keys(allMessages).forEach(convId => {
          const msgs = allMessages[convId] || [];
          msgs.forEach(msg => {
            if (msg.recipientId === currentUserId || msg.senderId === currentUserId) {
              messagesCount++;
            }
          });
        });
      }
      
      const payments = JSON.parse(localStorage.getItem('homelyserv_payments') || '[]');
      const workerPayments = payments.filter(
        p => p.workerId === currentUserId || p.workerEmail === currentUserEmail
      );
      const pendingPayments = workerPayments.filter(p => p.status === 'pending').length;
      const totalEarnings = workerPayments
        .filter(p => p.status === 'completed' || p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      setStats({
        totalApplications: workerAppliedOffers.length,
        activeOffers: allWorkerOffers.filter(o => o.status === 'active' || o.status === 'open').length,
        interviews: allWorkerOffers.filter(o => o.status === 'interview').length,
        savedJobs: workerSavedOffers.length,
        profileViews: profileViews,
        messages: messagesCount,
        completedJobs: completedOffers,
        pendingPayments: pendingPayments,
        totalEarnings: totalEarnings,
        pendingOffers: pendingOffers,
        acceptedOffers: acceptedOffers,
        inProgressOffers: inProgressOffers,
        rejectedOffers: rejectedOffers,
        completedOffers: completedOffers
      });
      
      generateRecentActivity(
        allWorkerOffers,
        workerAppliedOffers,
        workerSavedOffers,
        workerPayments,
        currentUserEmail
      );
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ============================================================
  // GENERATE RECENT ACTIVITY
  // ============================================================
  const generateRecentActivity = (
    workerOffers,
    appliedOffers,
    savedOffers,
    payments,
    userEmail
  ) => {
    const activities = [];
    
    workerOffers.forEach(offer => {
      let statusText = '';
      let icon = 'offer';
      
      switch (offer.status) {
        case 'pending':
          statusText = 'Pending Review';
          icon = 'clock';
          break;
        case 'accepted':
          statusText = 'Accepted';
          icon = 'check';
          break;
        case 'in_progress':
          statusText = 'In Progress';
          icon = 'zap';
          break;
        case 'completed':
          statusText = 'Completed';
          icon = 'check';
          break;
        case 'rejected':
          statusText = 'Rejected';
          icon = 'x';
          break;
        default:
          statusText = offer.status || 'Unknown';
      }
      
      activities.push({
        icon: icon,
        message: `${offer.jobTitle || 'Job offer'} from ${offer.employerName || 'employer'} - ${statusText}`,
        time: offer.updatedAt ? new Date(offer.updatedAt).toLocaleDateString() : 'Recently',
        status: statusText
      });
    });
    
    payments.forEach(payment => {
      activities.push({
        icon: 'payment',
        message: `Payment of EGP ${payment.amount} ${payment.status === 'completed' ? 'received' : 'pending'}`,
        time: payment.date ? new Date(payment.date).toLocaleDateString() : 'Recently',
        status: payment.status === 'completed' ? 'Completed' : 'Pending'
      });
    });
    
    activities.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateB - dateA;
    });
    
    setRecentActivity(activities.slice(0, 10));
  };

  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================
  const loadNotifications = () => {
    try {
      if (!user?.email) return;
      
      const storedNotifications = JSON.parse(
        localStorage.getItem(`worker_notifications_${user.email}`) || '[]'
      );
      setNotifications(storedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  // ============================================================
  // USE EFFECTS
  // ============================================================
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }

    const userData = localStorage.getItem('homelyserv_user');

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const profiles = JSON.parse(
          localStorage.getItem('homelyserv_profiles') || '{}'
        );

        if (profiles[parsedUser.email]) {
          parsedUser.profileImage =
            profiles[parsedUser.email].profileImage || null;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error(error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');

    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadRealStats();
      loadNotifications();
      checkForNewNotifications();
    }
  }, [user]);

  // Check for new notifications periodically
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkForNewNotifications();
      loadRealStats();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [user]);

  // ============================================================
  // NOTIFICATION HANDLERS
  // ============================================================
  const markNotificationRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(`worker_notifications_${user.email}`, JSON.stringify(updated));
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`worker_notifications_${user.email}`, JSON.stringify(updated));
  };

  const getNotificationIcon = (type, icon) => {
    const iconMap = {
      'offer': <Briefcase size={16} className="text-blue-600" />,
      'complaint': <AlertTriangle size={16} className="text-red-600" />,
      'payment': <DollarSign size={16} className="text-green-600" />,
      'message': <MessageCircle size={16} className="text-indigo-600" />,
      'profile': <User size={16} className="text-purple-600" />,
      'subscription': <Crown size={16} className="text-yellow-600" />,
      'check': <CheckCircle size={16} className="text-green-600" />,
      'x': <X size={16} className="text-red-600" />,
      'clock': <Clock size={16} className="text-yellow-600" />,
      'zap': <Zap size={16} className="text-orange-600" />,
      'calendar': <Calendar size={16} className="text-blue-600" />,
      'alert': <AlertCircle size={16} className="text-red-600" />,
      'dollar': <DollarSign size={16} className="text-green-600" />,
      'crown': <Crown size={16} className="text-yellow-600" />,
      'user': <User size={16} className="text-purple-600" />,
      'briefcase': <Briefcase size={16} className="text-blue-600" />,
      'star': <Star size={16} className="text-yellow-600" />,
      'award': <Award size={16} className="text-purple-600" />,
      'thumbsup': <ThumbsUp size={16} className="text-green-600" />,
      'file': <FileText size={16} className="text-blue-600" />,
    };
    return iconMap[icon] || <Bell size={16} className="text-gray-600" />;
  };

  const getNotificationBgColor = (type) => {
    const colorMap = {
      'offer': 'bg-blue-50',
      'complaint': 'bg-red-50',
      'payment': 'bg-green-50',
      'message': 'bg-indigo-50',
      'profile': 'bg-purple-50',
      'subscription': 'bg-yellow-50',
    };
    return colorMap[type] || 'bg-gray-50';
  };

  if (user === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <WorkerSidebar
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
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.dashboard}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Bell size={16} />
                        {t.notifications}
                        {unreadCount > 0 && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </h4>
                      {notifications.length > 0 && (
                        <button 
                          onClick={markAllRead}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          {t.markAllRead}
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <div className="text-5xl mb-3">🔔</div>
                          <p className="font-medium">{t.noNotifications}</p>
                          <p className="text-sm mt-1">New notifications will appear here</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <Link
                            key={notification.id}
                            to={notification.link || '#'}
                            className={`block p-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-red-50/50' : ''}`}
                            onClick={() => {
                              markNotificationRead(notification.id);
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 rounded-full ${getNotificationBgColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                                {getNotificationIcon(notification.type, notification.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                    {notification.title || 'Notification'}
                                  </p>
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                  )}
                                </div>
                                <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'} truncate`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.time).toLocaleDateString()} at {new Date(notification.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                      {notifications.length > 10 && (
                        <div className="p-2 text-center border-t border-gray-100">
                          <Link 
                            to="/notifications" 
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                            onClick={() => setShowNotifications(false)}
                          >
                            {t.viewAll} ({notifications.length - 10} more)
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 overflow-hidden border-2 border-red-200 relative">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-white m-1" />
                  )}
                  {userIsPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                      <Crown size={8} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user?.fullName || 'Worker'}
                  </span>
                  {userIsPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 hidden sm:inline-flex">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              {!userIsPremium && (
                <Link
                  to="/subscription"
                  className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 border border-yellow-400/30"
                >
                  <Crown size={14} />
                  <span className="hidden sm:inline">{t.getPremium}</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Welcome Banner - RED THEME */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-white m-3" />
                  )}
                  {userIsPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white/50">
                      <Crown size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{t.welcome}, {user.fullName || 'Worker'}!</h1>
                    {userIsPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                        <Crown size={12} className="text-yellow-300" />
                        {t.premiumBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 mt-1">{t.overview}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/worker/offers"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
                >
                  <Briefcase size={16} />
                  {t.viewOffers}
                </Link>
                <Link
                  to="/worker-profile"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
                >
                  <User size={16} />
                  {t.viewProfile}
                </Link>
                {!userIsPremium && (
                  <Link
                    to="/subscription"
                    className="bg-yellow-500/30 hover:bg-yellow-500/40 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-yellow-400/30"
                  >
                    <Crown size={16} />
                    {t.getPremium}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pendingOffers}</p>
                <Clock size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingOffers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.acceptedOffers}</p>
                <CheckCircle size={20} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.acceptedOffers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.inProgress}</p>
                <Zap size={20} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.inProgressOffers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.completed}</p>
                <CheckCircle size={20} className="text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completedOffers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.rejected}</p>
                <X size={20} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.rejectedOffers}</p>
            </div>
          </div>

          {/* Stats Row 2 - Financial */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.totalEarnings}</p>
                <span className="text-red-500 font-bold">$</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">EGP {stats.totalEarnings}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pendingPayments}</p>
                <CreditCard size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingPayments}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.completedJobs}</p>
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completedJobs}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.messages}</p>
                <MessageCircle size={20} className="text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.messages}</p>
            </div>
          </div>

          {/* Quick Actions - RED THEME */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.quickActions}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/worker/offers"
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 group"
              >
                <Briefcase size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-blue-700">{t.findJobs}</span>
              </Link>
              <Link
                to="/worker/offers"
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 group"
              >
                <Zap size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-green-700">{t.viewOffers}</span>
              </Link>
              <Link
                to="/worker-profile"
                className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 group"
              >
                <User size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-purple-700">{t.viewProfile}</span>
              </Link>
              <Link
                to="/worker-messages"
                className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 group"
              >
                <MessageCircle size={20} className="text-red-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-red-700">{t.viewMessages}</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.recentActivity}</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>{t.noActivity}</p>
                <p className="text-sm mt-2">Start applying for jobs to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.icon === 'offer' || activity.icon === 'zap' ? 'bg-blue-100' :
                      activity.icon === 'check' ? 'bg-green-100' :
                      activity.icon === 'clock' ? 'bg-yellow-100' :
                      activity.icon === 'x' ? 'bg-red-100' :
                      activity.icon === 'payment' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.icon === 'offer' && <Briefcase size={16} className="text-blue-600" />}
                      {activity.icon === 'zap' && <Zap size={16} className="text-green-600" />}
                      {activity.icon === 'check' && <CheckCircle size={16} className="text-green-600" />}
                      {activity.icon === 'clock' && <Clock size={16} className="text-yellow-600" />}
                      {activity.icon === 'x' && <X size={16} className="text-red-600" />}
                      {activity.icon === 'payment' && <CreditCard size={16} className="text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{activity.message}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'Completed' || activity.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                        activity.status === 'Pending' || activity.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700' :
                        activity.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDashboard;