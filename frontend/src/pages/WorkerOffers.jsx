// src/pages/WorkerOffers.jsx - FIXED: Shows "Paid" status when payment is completed
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { JOB_OPTIONS } from '../constants/jobOptions';
import { isUserPremium } from '../utils/subscriptionService';
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
  Search,
  MapPin,
  DollarSign,
  Eye,
  Share2,
  Filter,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  ThumbsUp,
  BriefcaseIcon,
  Star,
  Trash2,
  Shield,
  Sparkles,
  Lock,
  MessageSquare,
  Loader2,
  UserCheck,
  UserX,
  Calendar,
  Building2,
  Crown,
  StopCircle,
  AlertCircle,
  Check,
  ThumbsDown,
  History,
  FileCheck,
  RefreshCw,
  Inbox,
  XCircle,
  CheckCheck,
  Archive,
  Send,
  MoreVertical,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { 
  getConversationId, 
  sendMessage, 
  getUserConversations,
} from '../utils/chatService';

// Sidebar Component - RED THEME (same as before, kept for brevity)
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

  const isActive = (path) => location.pathname === path;
  const getProfileImage = () => user?.profileImage || null;

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

// ============================================================
// MAIN WORKER OFFERS COMPONENT - FIXED PAYMENT STATUS
// ============================================================
const WorkerOffers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingOffer, setProcessingOffer] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Notification state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // ============================================================
  // TOGGLE FUNCTIONS - DEFINED AT THE TOP
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

  const toggleExpand = (offerId) => {
    setExpandedOffer(expandedOffer === offerId ? null : offerId);
  };

  const isPremium = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  // ============================================================
  // NOTIFICATION FUNCTIONS
  // ============================================================
  
  const fetchNotifications = async () => {
    setNotificationLoading(true);
    try {
      const token = localStorage.getItem('homelyserv_token');
      if (!token) {
        setNotifications([]);
        return;
      }

      const userEmail = user?.email;
      if (userEmail) {
        const storedNotifications = JSON.parse(
          localStorage.getItem(`worker_notifications_${userEmail}`) || '[]'
        );
        if (storedNotifications.length > 0) {
          setNotifications(storedNotifications.slice(0, 10));
          setNotificationLoading(false);
          return;
        }
      }

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
      } else if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications();
    }
  }, [isNotificationsOpen]);

  const translations = {
    en: {
      title: 'My Offers',
      subtitle: 'Review and respond to job offers',
      tabs: {
        pending: 'Pending',
        accepted: 'Accepted',
        paid: 'Paid',
        rejected: 'Rejected',
        completed: 'Completed'
      },
      stats: {
        pending: 'Pending',
        accepted: 'Accepted',
        paid: 'Paid',
        rejected: 'Rejected',
        completed: 'Completed',
        total: 'Total'
      },
      card: {
        viewDetails: 'View Details',
        accept: 'Accept',
        reject: 'Decline',
        salaryPerMonth: '/month',
        location: 'Location',
        posted: 'Posted',
        employer: 'Employer',
        noOffers: 'No offers in this section',
        chat: 'Chat',
        completeWork: 'Complete Work',
        waitingPayment: '⏳ Waiting for payment...',
        paymentReceived: '✅ Payment Received',
        workCompleted: 'Work Completed',
        offerRejected: 'Offer Declined',
        inProgress: 'In Progress',
        paid: 'Paid'
      },
      actions: {
        accept: 'Accept Offer',
        rejecting: 'Rejecting...',
        accepting: 'Accepting...',
        view: 'View Details',
        close: 'Close'
      },
      empty: {
        title: 'No offers yet',
        description: 'You haven\'t received any job offers',
        wait: 'Employers will reach out when they find your profile'
      },
      loading: 'Loading offers...',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      acceptSuccess: '✅ Offer accepted from {employer}!',
      rejectSuccess: 'You declined the offer from {employer}',
      acceptError: 'Failed to accept offer. Please try again.',
      rejectError: 'Failed to decline offer. Please try again.',
      premiumBadge: 'Premium',
      getPremium: 'Upgrade',
      noNotifications: 'No new notifications'
    },
    ar: {
      title: 'عروضي',
      subtitle: 'مراجعة والرد على عروض العمل',
      tabs: {
        pending: 'معلقة',
        accepted: 'مقبولة',
        paid: 'مدفوعة',
        rejected: 'مرفوضة',
        completed: 'مكتملة'
      },
      stats: {
        pending: 'معلقة',
        accepted: 'مقبولة',
        paid: 'مدفوعة',
        rejected: 'مرفوضة',
        completed: 'مكتملة',
        total: 'الإجمالي'
      },
      card: {
        viewDetails: 'عرض التفاصيل',
        accept: 'قبول',
        reject: 'رفض',
        salaryPerMonth: '/شهر',
        location: 'الموقع',
        posted: 'نشر',
        employer: 'صاحب العمل',
        noOffers: 'لا توجد عروض في هذا القسم',
        chat: 'محادثة',
        completeWork: 'إكمال العمل',
        waitingPayment: '⏳ في انتظار الدفع...',
        paymentReceived: '✅ تم استلام الدفع',
        workCompleted: 'تم إكمال العمل',
        offerRejected: 'تم رفض العرض',
        inProgress: 'قيد التنفيذ',
        paid: 'مدفوعة'
      },
      actions: {
        accept: 'قبول العرض',
        rejecting: 'جاري الرفض...',
        accepting: 'جاري القبول...',
        view: 'عرض التفاصيل',
        close: 'إغلاق'
      },
      empty: {
        title: 'لا توجد عروض',
        description: 'لم تتلق أي عروض عمل بعد',
        wait: 'سيتواصل معك أصحاب العمل عند العثور على ملفك الشخصي'
      },
      loading: 'جاري تحميل العروض...',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      acceptSuccess: '✅ تم قبول العرض من {employer}!',
      rejectSuccess: 'لقد رفضت العرض من {employer}',
      acceptError: 'فشل قبول العرض. يرجى المحاولة مرة أخرى.',
      rejectError: 'فشل رفض العرض. يرجى المحاولة مرة أخرى.',
      premiumBadge: 'مميز',
      getPremium: 'ترقية',
      noNotifications: 'لا توجد إشعارات جديدة'
    }
  };

  const t = translations[language] || translations.en;

  // ============================================================
  // Load Offers - FIXED: Adds "paid" status
  // ============================================================
  const loadOffers = (userParam) => {
    try {
      const currentUser = userParam || user;
      if (!currentUser?.email) {
        setOffers([]);
        return;
      }
      
      let allOffers = [];
      const userEmail = currentUser.email;
      
      // Load from employer_offers
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      console.log(`📋 Total employer_offers: ${employerOffers.length}`);
      
      // Filter offers for this worker
      const workerOffersFromEmployer = employerOffers.filter(
        offer => offer.workerEmail === userEmail
      );
      console.log(`📋 Found ${workerOffersFromEmployer.length} offers for ${userEmail} from employer_offers`);
      
      // Load from worker-specific storage
      const workerSpecificOffers = JSON.parse(localStorage.getItem(`worker_offers_${userEmail}`) || '[]');
      console.log(`📋 Found ${workerSpecificOffers.length} offers from worker-specific storage`);
      
      // Combine and deduplicate
      const allOfferIds = new Set();
      
      // Add employer offers first
      workerOffersFromEmployer.forEach(offer => {
        if (!allOfferIds.has(offer.id)) {
          allOfferIds.add(offer.id);
          allOffers.push({ ...offer });
        }
      });
      
      // Add worker-specific offers (these might have updated status)
      workerSpecificOffers.forEach(offer => {
        const existingIndex = allOffers.findIndex(o => o.id === offer.id);
        if (existingIndex !== -1) {
          // Update existing offer with newer data
          allOffers[existingIndex] = { ...allOffers[existingIndex], ...offer };
        } else {
          allOffers.push({ ...offer });
        }
      });
      
      // FIXED: Check for payment completion and update status
      allOffers = allOffers.map(offer => {
        // If payment is completed and offer is accepted, mark as 'paid'
        if (offer.paymentCompleted === true && offer.status === 'accepted') {
          console.log(`💰 Offer ${offer.id} - Payment completed, changing status to paid`);
          return { ...offer, status: 'paid' };
        }
        // If offer is accepted and payment is completed, mark as in_progress (for backward compatibility)
        if (offer.status === 'accepted' && offer.paymentCompleted === true) {
          console.log(`💰 Offer ${offer.id} - Payment completed (backward compatibility), changing status to paid`);
          return { ...offer, status: 'paid' };
        }
        // If status is already in_progress but payment is completed, change to paid
        if (offer.status === 'in_progress' && offer.paymentCompleted === true) {
          console.log(`💰 Offer ${offer.id} - In progress with payment completed, changing to paid`);
          return { ...offer, status: 'paid' };
        }
        return offer;
      });
      
      // Sort by newest first
      allOffers.sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt));
      
      // Log final status breakdown
      const statusCount = {};
      allOffers.forEach(o => {
        statusCount[o.status] = (statusCount[o.status] || 0) + 1;
      });
      console.log('📊 Final status breakdown:', statusCount);
      
      setOffers(allOffers);
      
      return allOffers;
      
    } catch (error) {
      console.error('Error loading offers:', error);
      setOffers([]);
      return [];
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
        if (parsedUser.role !== 'WORKER') {
          navigate('/login');
          return;
        }
        const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
        if (profiles[parsedUser.email]) {
          parsedUser.profileImage = profiles[parsedUser.email].profileImage || null;
        }
        setUser(parsedUser);
        loadOffers(parsedUser);
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
    if (user) {
      loadOffers(user);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      loadOffers(user);
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // ============================================================
  // Accept Offer Handler
  // ============================================================
  const handleAcceptOffer = (offer) => {
    if (processingOffer) return;
    setProcessingOffer(offer.id);

    try {
      console.log(`📝 Accepting offer: ${offer.id} - ${offer.jobTitle}`);
      
      const updatedOffer = {
        ...offer,
        status: 'accepted',
        updatedAt: new Date().toISOString(),
        workerResponseAt: new Date().toISOString()
      };

      // Update in employer_offers
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const updatedEmployerOffers = employerOffers.map(o => 
        o.id === offer.id ? updatedOffer : o
      );
      localStorage.setItem('employer_offers', JSON.stringify(updatedEmployerOffers));
      console.log('✅ Updated employer_offers');

      // Update in worker-specific storage
      if (user?.email) {
        const workerOffers = JSON.parse(localStorage.getItem(`worker_offers_${user.email}`) || '[]');
        const updatedWorkerOffers = workerOffers.map(o => 
          o.id === offer.id ? updatedOffer : o
        );
        if (!updatedWorkerOffers.some(o => o.id === offer.id)) {
          updatedWorkerOffers.push(updatedOffer);
        }
        localStorage.setItem(`worker_offers_${user.email}`, JSON.stringify(updatedWorkerOffers));
        console.log('✅ Updated worker-specific storage');
      }

      // Create conversation
      const workerId = user?.id || user?.email;
      const workerName = user?.fullName || 'Worker';
      const employerId = offer.employerId || offer.employerEmail;
      const employerName = offer.employerName || 'Employer';

      if (workerId && employerId) {
        createConversationAndSendWelcome(offer, workerId, workerName, employerId, employerName);
      }

      // Create notification
      const notification = {
        id: 'notif_' + Date.now(),
        type: 'offer_accepted',
        message: `${user?.fullName || 'Worker'} has accepted your job offer for ${offer.jobTitle}`,
        offerId: offer.id,
        offerTitle: offer.jobTitle,
        workerId: workerId,
        workerName: workerName,
        employerId: employerId,
        employerEmail: offer.employerEmail,
        date: new Date().toISOString(),
        read: false
      };
      const notifications = JSON.parse(localStorage.getItem('homelyserv_notifications') || '[]');
      notifications.push(notification);
      localStorage.setItem('homelyserv_notifications', JSON.stringify(notifications));

      // Update local state immediately
      setOffers(prev => prev.map(o => o.id === offer.id ? updatedOffer : o));
      
      alert(t.acceptSuccess.replace('{employer}', offer.employerName || 'Employer'));
      
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error('Error accepting offer:', error);
      alert(t.acceptError);
    } finally {
      setProcessingOffer(null);
    }
  };

  // ============================================================
  // Reject Offer Handler
  // ============================================================
  const handleRejectOffer = (offer) => {
    if (processingOffer) return;
    
    if (!confirm(`Are you sure you want to decline the offer from ${offer.employerName || 'Employer'}?`)) {
      return;
    }

    setProcessingOffer(offer.id);

    try {
      const updatedOffer = {
        ...offer,
        status: 'rejected',
        updatedAt: new Date().toISOString(),
        workerResponseAt: new Date().toISOString()
      };

      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const updatedEmployerOffers = employerOffers.map(o => 
        o.id === offer.id ? updatedOffer : o
      );
      localStorage.setItem('employer_offers', JSON.stringify(updatedEmployerOffers));

      if (user?.email) {
        const workerOffers = JSON.parse(localStorage.getItem(`worker_offers_${user.email}`) || '[]');
        const updatedWorkerOffers = workerOffers.map(o => 
          o.id === offer.id ? updatedOffer : o
        );
        localStorage.setItem(`worker_offers_${user.email}`, JSON.stringify(updatedWorkerOffers));
      }

      setOffers(prev => prev.map(o => o.id === offer.id ? updatedOffer : o));
      alert(t.rejectSuccess.replace('{employer}', offer.employerName || 'Employer'));
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert(t.rejectError);
    } finally {
      setProcessingOffer(null);
    }
  };

  // ============================================================
  // Complete Work Handler
  // ============================================================
  const handleCompleteWork = (offer) => {
    if (processingOffer) return;
    
    if (!confirm('Mark this job as completed? This cannot be undone.')) {
      return;
    }

    setProcessingOffer(offer.id);

    try {
      const updatedOffer = {
        ...offer,
        status: 'completed',
        workCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const updatedEmployerOffers = employerOffers.map(o => 
        o.id === offer.id ? updatedOffer : o
      );
      localStorage.setItem('employer_offers', JSON.stringify(updatedEmployerOffers));

      if (user?.email) {
        const workerOffers = JSON.parse(localStorage.getItem(`worker_offers_${user.email}`) || '[]');
        const updatedWorkerOffers = workerOffers.map(o => 
          o.id === offer.id ? updatedOffer : o
        );
        localStorage.setItem(`worker_offers_${user.email}`, JSON.stringify(updatedWorkerOffers));
      }

      setOffers(prev => prev.map(o => o.id === offer.id ? updatedOffer : o));
      alert('✅ Work completed successfully!');
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error('Error completing work:', error);
      alert('Failed to complete work. Please try again.');
    } finally {
      setProcessingOffer(null);
    }
  };

  // ============================================================
  // Conversation Creation
  // ============================================================
  const createConversationAndSendWelcome = async (offer, workerId, workerName, employerId, employerName) => {
    try {
      const welcomeMessage = `Hello! I've accepted your job offer for ${offer.jobTitle || 'the position'}. I'm excited to work with you. Let me know the next steps.`;
      
      // Use the backend API to ensure conversation exists and send message
      const result = await sendMessage(workerId, workerName, 'WORKER', employerId, employerName, welcomeMessage);
      console.log('✅ Conversation created and welcome message sent');
      
      return result?.conversationId || getConversationId(workerId, employerId);
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // ============================================================
  // UI Helpers
  // ============================================================
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-50 border-amber-200 text-amber-700',
      accepted: 'bg-blue-50 border-blue-200 text-blue-700',
      paid: 'bg-green-50 border-green-200 text-green-700',
      rejected: 'bg-red-50 border-red-200 text-red-700',
      in_progress: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      completed: 'bg-purple-50 border-purple-200 text-purple-700'
    };
    return colors[status] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={14} className="text-amber-500" />;
      case 'accepted': return <CheckCircle size={14} className="text-blue-500" />;
      case 'paid': return <Wallet size={14} className="text-green-500" />;
      case 'rejected': return <XCircle size={14} className="text-red-500" />;
      case 'in_progress': return <Zap size={14} className="text-emerald-500" />;
      case 'completed': return <CheckCheck size={14} className="text-purple-500" />;
      default: return <AlertCircle size={14} className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      paid: 'Paid',
      rejected: 'Declined',
      in_progress: 'In Progress',
      completed: 'Completed'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSalary = (amount) => {
    return `${amount?.toLocaleString() || 0}`;
  };

  // ============================================================
  // Filtered Offers by Tab
  // ============================================================
  const getFilteredOffers = () => {
    let filtered = [];
    switch (activeTab) {
      case 'pending':
        filtered = offers.filter(o => o.status === 'pending');
        break;
      case 'accepted':
        filtered = offers.filter(o => o.status === 'accepted');
        break;
      case 'paid':
        filtered = offers.filter(o => o.status === 'paid' || o.status === 'in_progress');
        break;
      case 'rejected':
        filtered = offers.filter(o => o.status === 'rejected');
        break;
      case 'completed':
        filtered = offers.filter(o => o.status === 'completed');
        break;
      default:
        filtered = offers;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.jobTitle?.toLowerCase().includes(searchLower) ||
        o.employerName?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const filteredOffers = getFilteredOffers();

  const stats = {
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    paid: offers.filter(o => o.status === 'paid' || o.status === 'in_progress').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    completed: offers.filter(o => o.status === 'completed').length,
    total: offers.length
  };

  const tabs = [
    { id: 'pending', label: t.tabs.pending, icon: Clock, count: stats.pending },
    { id: 'accepted', label: t.tabs.accepted, icon: CheckCircle, count: stats.accepted },
    { id: 'paid', label: t.tabs.paid, icon: Wallet, count: stats.paid },
    { id: 'rejected', label: t.tabs.rejected, icon: XCircle, count: stats.rejected },
    { id: 'completed', label: t.tabs.completed, icon: CheckCheck, count: stats.completed }
  ];

  // ============================================================
  // Render Offer Card
  // ============================================================
  const renderOfferCard = (offer) => {
    const statusColor = getStatusColor(offer.status);
    const statusIcon = getStatusIcon(offer.status);
    const statusLabel = getStatusLabel(offer.status);
    const isExpanded = expandedOffer === offer.id;

    return (
      <div
        key={offer.id}
        className={`bg-white rounded-xl border ${statusColor} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
              {offer.workerImage ? (
                <img 
                  src={offer.workerImage} 
                  alt={offer.workerName} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User size={24} className="text-red-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">{offer.jobTitle || 'Job Offer'}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 size={14} />
                    <span>{offer.employerName || 'Employer'}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${statusColor} whitespace-nowrap`}>
                  {statusIcon}
                  {statusLabel}
                </span>
              </div>

              {/* Details Row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{offer.workerLocation || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-gray-400" />
                  <span>EGP {formatSalary(offer.amount)}<span className="text-gray-400 text-xs">/mo</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gray-400" />
                  <span>{formatDate(offer.createdAt || offer.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span>{offer.workerRating || 4.5}</span>
                </div>
              </div>

              {/* Payment Status Badge */}
              {offer.paymentCompleted === true && offer.status !== 'completed' && offer.status !== 'paid' && (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    <Wallet size={12} />
                    Payment Confirmed
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => toggleExpand(offer.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <Eye size={15} />
                  {isExpanded ? 'Hide Details' : t.card.viewDetails}
                </button>
                
                {offer.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAcceptOffer(offer)}
                      disabled={processingOffer === offer.id}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOffer === offer.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ThumbsUp size={14} />
                      )}
                      {t.card.accept}
                    </button>
                    <button
                      onClick={() => handleRejectOffer(offer)}
                      disabled={processingOffer === offer.id}
                      className="px-4 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOffer === offer.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                      {t.card.reject}
                    </button>
                  </>
                )}

                {offer.status === 'accepted' && (
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg flex items-center gap-1.5">
                    <Clock size={14} />
                    {t.card.waitingPayment}
                  </span>
                )}

                {offer.status === 'paid' && (
                  <>
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg flex items-center gap-1.5">
                      <Wallet size={14} />
                      {t.card.paymentReceived}
                    </span>
                    <button
                      onClick={() => navigate('/worker-messages')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} />
                      {t.card.chat}
                    </button>
                  </>
                )}

                {offer.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleCompleteWork(offer)}
                      disabled={processingOffer === offer.id}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {processingOffer === offer.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCheck size={14} />
                      )}
                      {t.card.completeWork}
                    </button>
                    <button
                      onClick={() => navigate('/worker-messages')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} />
                      {t.card.chat}
                    </button>
                  </>
                )}

                {offer.status === 'completed' && (
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg flex items-center gap-1.5">
                    <CheckCheck size={14} />
                    {t.card.workCompleted}
                  </span>
                )}

                {offer.status === 'rejected' && (
                  <span className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg flex items-center gap-1.5">
                    <XCircle size={14} />
                    {t.card.offerRejected}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Offer Details</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Employer</span>
                      <span className="font-medium">{offer.employerName || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Position</span>
                      <span className="font-medium">{offer.jobTitle || 'Service Provider'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Monthly Salary</span>
                      <span className="font-medium">EGP {formatSalary(offer.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hourly Rate</span>
                      <span className="font-medium">EGP {offer.hourlyRate || 30}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span className="font-medium">{offer.workerLocation || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Posted</span>
                      <span className="font-medium">{formatDate(offer.createdAt)}</span>
                    </div>
                    {offer.workerResponseAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Responded</span>
                        <span className="font-medium">{formatDate(offer.workerResponseAt)}</span>
                      </div>
                    )}
                    {offer.workCompletedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completed</span>
                        <span className="font-medium">{formatDate(offer.workCompletedAt)}</span>
                      </div>
                    )}
                    {offer.paymentCompleted && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Status</span>
                        <span className="font-medium text-green-600">✅ Paid</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Status</h4>
                  <div className={`p-3 rounded-lg border ${statusColor}`}>
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      <span className="font-medium">{statusLabel}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5">
                      {offer.status === 'pending' && 'Awaiting your decision on this offer.'}
                      {offer.status === 'accepted' && 'You accepted this offer. Waiting for employer payment.'}
                      {offer.status === 'paid' && '✅ Payment received! You can now start working.'}
                      {offer.status === 'in_progress' && 'Work is in progress.'}
                      {offer.status === 'completed' && 'Work has been completed successfully.'}
                      {offer.status === 'rejected' && 'You declined this offer.'}
                    </p>
                  </div>
                  {(offer.status === 'paid' || offer.status === 'in_progress' || offer.status === 'accepted' || offer.status === 'completed') && (
                    <button
                      onClick={() => navigate('/worker-messages')}
                      className="mt-3 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} />
                      Message Employer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // Loading State
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================
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
        {/* Header */}
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
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user?.fullName || 'Worker'}
                </span>
              </div>
              
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <Bell size={20} className="text-gray-600" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 font-semibold text-sm text-gray-800 flex justify-between items-center">
                      <span>{t.notifications}</span>
                      {notificationLoading && (
                        <span className="text-xs text-gray-400">Loading...</span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificationLoading ? (
                        <div className="px-4 py-6 text-sm text-gray-400 text-center">
                          Loading notifications...
                        </div>
                      ) : notifications && notifications.length > 0 ? (
                        notifications.map((n, index) => (
                          <div 
                            key={n.id || index} 
                            className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors cursor-pointer"
                          >
                            <p className="text-sm font-medium text-gray-900">{n.title || 'Notification'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message || n.body || 'No message'}</p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-sm text-gray-400 text-center">
                          {t.noNotifications}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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

        <div className="p-4 md:p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-red-100 mt-1">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-red-200">
                  {stats.total} total offers
                </span>
                {!userIsPremium && (
                  <Link
                    to="/subscription"
                    className="bg-yellow-400/20 hover:bg-yellow-400/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-yellow-400/30"
                  >
                    <Crown size={16} className="text-yellow-300" />
                    {t.getPremium}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pending}</p>
                <Clock size={18} className="text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.accepted}</p>
                <CheckCircle size={18} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.accepted}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.paid}</p>
                <Wallet size={18} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.paid}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.rejected}</p>
                <XCircle size={18} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.rejected}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.completed}</p>
                <CheckCheck size={18} className="text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completed}</p>
            </div>
          </div>

          {/* Search & Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search offers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <button
                onClick={() => {
                  loadOffers(user);
                  setRefreshKey(prev => prev + 1);
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 border-t border-gray-100 pt-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredOffers.length}</span> offers
            </p>
          </div>

          {/* Offers List */}
          {offers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.empty.title}</h3>
              <p className="text-gray-500">{t.empty.description}</p>
              <p className="text-gray-400 text-sm mt-1">{t.empty.wait}</p>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-700">No results found</h4>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map(offer => renderOfferCard(offer))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkerOffers;