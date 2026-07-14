// src/pages/WorkerOffers.jsx - Updated with Accept/Reject and conversation creation
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { JOB_OPTIONS, getJobLabel } from '../constants/jobOptions';
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
  Building2
} from 'lucide-react';
import { 
  getConversationId, 
  sendMessage, 
  getUserConversations,
  saveUserConversations 
} from '../utils/chatService';

// Sidebar Component (same as before)
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
      overview: 'Overview'
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
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/worker-profile' },
    { id: 'offers', label: t.myOffers, icon: Briefcase, path: '/worker/offers' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/worker-payment' },
  ];

  const isActive = (path) => location.pathname === path;
  const getProfileImage = () => user?.profileImage || null;

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
                <Shield size={28} className="text-amber-500" />
                <Home size={14} className="text-amber-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/worker-dashboard" className="relative mx-auto">
              <Shield size={28} className="text-amber-500" />
              <Home size={14} className="text-amber-300 absolute -bottom-1 -right-1" />
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || 'Worker'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.fullName || 'Worker'}</p>
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
                  ? 'bg-amber-50 text-amber-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-amber-600' : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-amber-600 rounded-full"></div>
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-amber-600 hover:bg-amber-50 group ${
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
// MAIN WORKER OFFERS COMPONENT
// ============================================================
const WorkerOffers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingOffer, setProcessingOffer] = useState(null);

  const translations = {
    en: {
      title: 'Job Offers',
      subtitle: 'Review and respond to job offers from employers',
      stats: {
        pending: 'Pending',
        accepted: 'Accepted',
        rejected: 'Rejected',
        total: 'Total'
      },
      filters: {
        all: 'All Offers',
        pending: 'Pending',
        accepted: 'Accepted',
        rejected: 'Rejected'
      },
      sort: {
        newest: 'Newest First',
        oldest: 'Oldest First',
        salary_high: 'Highest Salary',
        salary_low: 'Lowest Salary'
      },
      card: {
        viewDetails: 'View Details',
        accept: 'Accept Offer',
        reject: 'Reject',
        salaryPerMonth: 'EGP/month',
        location: 'Location',
        type: 'Type',
        skills: 'Skills',
        benefits: 'Benefits',
        posted: 'Posted',
        pending: 'Pending Review',
        accepted: 'Accepted',
        rejected: 'Rejected',
        employer: 'Employer'
      },
      actions: {
        accept: 'Accept Offer',
        rejecting: 'Rejecting...',
        accepting: 'Accepting...',
        view: 'View Details',
        close: 'Close'
      },
      empty: {
        title: 'No offers received',
        description: 'You haven\'t received any job offers yet',
        wait: 'Employers will send you offers when they find your profile'
      },
      loading: 'Loading offers...',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      acceptSuccess: '✅ You have accepted the offer from {employer}!',
      rejectSuccess: 'You have rejected the offer from {employer}',
      acceptError: 'Failed to accept offer. Please try again.',
      rejectError: 'Failed to reject offer. Please try again.'
    },
    ar: {
      title: 'عروض العمل',
      subtitle: 'مراجعة والرد على عروض العمل من أصحاب العمل',
      stats: {
        pending: 'قيد الانتظار',
        accepted: 'مقبولة',
        rejected: 'مرفوضة',
        total: 'الإجمالي'
      },
      filters: {
        all: 'جميع العروض',
        pending: 'قيد الانتظار',
        accepted: 'مقبولة',
        rejected: 'مرفوضة'
      },
      sort: {
        newest: 'الأحدث أولاً',
        oldest: 'الأقدم أولاً',
        salary_high: 'أعلى راتب',
        salary_low: 'أقل راتب'
      },
      card: {
        viewDetails: 'عرض التفاصيل',
        accept: 'قبول العرض',
        reject: 'رفض',
        salaryPerMonth: 'جنيه/شهر',
        location: 'الموقع',
        type: 'النوع',
        skills: 'المهارات',
        benefits: 'المزايا',
        posted: 'نشر',
        pending: 'قيد المراجعة',
        accepted: 'مقبولة',
        rejected: 'مرفوضة',
        employer: 'صاحب العمل'
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
        wait: 'سيرسل لك أصحاب العمل عروضاً عندما يجدون ملفك الشخصي'
      },
      loading: 'جاري تحميل العروض...',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      acceptSuccess: '✅ لقد قبلت العرض من {employer}!',
      rejectSuccess: 'لقد رفضت العرض من {employer}',
      acceptError: 'فشل قبول العرض. يرجى المحاولة مرة أخرى.',
      rejectError: 'فشل رفض العرض. يرجى المحاولة مرة أخرى.'
    }
  };

  const t = translations[language];

  // ============================================================
  // EFFECTS
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

    loadOffers();
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // ============================================================
  // LOAD OFFERS
  // ============================================================
  const loadOffers = () => {
    try {
      let allOffers = [];
      
      // Load from employer_offers (main source)
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      
      // Filter offers for this worker
      if (user?.email) {
        allOffers = employerOffers.filter(
          offer => offer.workerEmail === user.email
        );
      }
      
      // Also check worker-specific offers
      if (user?.email) {
        const workerOffers = JSON.parse(localStorage.getItem(`worker_offers_${user.email}`) || '[]');
        workerOffers.forEach(offer => {
          if (!allOffers.find(o => o.id === offer.id)) {
            allOffers.push(offer);
          }
        });
      }
      
      // Sort by newest first
      allOffers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOffers(allOffers);
      setFilteredOffers(allOffers);
      
      console.log(`✅ Loaded ${allOffers.length} offers for worker`);
      
    } catch (error) {
      console.error('Error loading offers:', error);
      setOffers([]);
      setFilteredOffers([]);
    }
  };

  // ============================================================
  // CREATE CONVERSATION BETWEEN WORKER AND EMPLOYER
  // ============================================================
  const createConversationAndSendWelcome = (offer, workerId, workerName, employerId, employerName) => {
    try {
      // Get or create conversation ID
      const conversationId = getConversationId(workerId, employerId);
      
      // Get existing conversations
      const conversations = JSON.parse(localStorage.getItem('homelyserv_conversations') || '[]');
      
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.id === conversationId);
      
      if (!existingConv) {
        // Create new conversation
        const newConversation = {
          id: conversationId,
          participants: [
            { id: workerId, name: workerName, role: 'WORKER' },
            { id: employerId, name: employerName, role: 'EMPLOYER' }
          ],
          lastMessage: `✅ Offer accepted: ${offer.jobTitle || 'Job Offer'}`,
          lastMessageTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        conversations.push(newConversation);
        localStorage.setItem('homelyserv_conversations', JSON.stringify(conversations));
        
        // Send welcome message from worker to employer
        const welcomeMessage = `Hello! I've accepted your job offer for ${offer.jobTitle || 'the position'}. I'm excited to work with you. Let me know the next steps.`;
        
        sendMessage(
          workerId,
          workerName,
          'WORKER',
          employerId,
          employerName,
          welcomeMessage
        );
        
        console.log('✅ Conversation created and welcome message sent');
      }
      
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // ============================================================
  // ACCEPT OFFER
  // ============================================================
  const handleAcceptOffer = (offer) => {
    if (processingOffer) return;
    setProcessingOffer(offer.id);

    try {
      // Update the offer status
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

      // Update in worker_offers
      if (user?.email) {
        const workerOffers = JSON.parse(localStorage.getItem(`worker_offers_${user.email}`) || '[]');
        const updatedWorkerOffers = workerOffers.map(o => 
          o.id === offer.id ? updatedOffer : o
        );
        localStorage.setItem(`worker_offers_${user.email}`, JSON.stringify(updatedWorkerOffers));
      }

      // ============================================================
      // CREATE CONVERSATION BETWEEN WORKER AND EMPLOYER
      // ============================================================
      const workerId = user?.id || user?.email;
      const workerName = user?.fullName || 'Worker';
      const employerId = offer.employerId || offer.employerEmail;
      const employerName = offer.employerName || 'Employer';

      if (workerId && employerId) {
        createConversationAndSendWelcome(
          offer,
          workerId,
          workerName,
          employerId,
          employerName
        );
      }

      // Send notification to employer
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

      // Update local state
      setOffers(prev => prev.map(o => 
        o.id === offer.id ? updatedOffer : o
      ));
      setFilteredOffers(prev => prev.map(o => 
        o.id === offer.id ? updatedOffer : o
      ));

      const successMsg = t.acceptSuccess.replace('{employer}', offer.employerName || 'Employer');
      alert(successMsg);

    } catch (error) {
      console.error('Error accepting offer:', error);
      alert(t.acceptError);
    } finally {
      setProcessingOffer(null);
    }
  };

  // ============================================================
  // REJECT OFFER
  // ============================================================
  const handleRejectOffer = (offer) => {
    if (processingOffer) return;
    
    if (!confirm(`Are you sure you want to reject the offer from ${offer.employerName || 'Employer'}?`)) {
      return;
    }

    setProcessingOffer(offer.id);

    try {
      // Update the offer status
      const updatedOffer = {
        ...offer,
        status: 'rejected',
        updatedAt: new Date().toISOString(),
        workerResponseAt: new Date().toISOString()
      };

      // Update in employer_offers
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const updatedEmployerOffers = employerOffers.map(o => 
        o.id === offer.id ? updatedOffer : o
      );
      localStorage.setItem('employer_offers', JSON.stringify(updatedEmployerOffers));

      // Update in worker_offers
      if (user?.email) {
        const workerOffers = JSON.parse(localStorage.getItem(`worker_offers_${user.email}`) || '[]');
        const updatedWorkerOffers = workerOffers.map(o => 
          o.id === offer.id ? updatedOffer : o
        );
        localStorage.setItem(`worker_offers_${user.email}`, JSON.stringify(updatedWorkerOffers));
      }

      // Send notification to employer
      const notification = {
        id: 'notif_' + Date.now(),
        type: 'offer_rejected',
        message: `${user?.fullName || 'Worker'} has rejected your job offer for ${offer.jobTitle}`,
        offerId: offer.id,
        offerTitle: offer.jobTitle,
        workerId: user?.id || user?.email,
        workerName: user?.fullName || 'Worker',
        employerId: offer.employerId || offer.employerEmail,
        employerEmail: offer.employerEmail,
        date: new Date().toISOString(),
        read: false
      };
      const notifications = JSON.parse(localStorage.getItem('homelyserv_notifications') || '[]');
      notifications.push(notification);
      localStorage.setItem('homelyserv_notifications', JSON.stringify(notifications));

      // Update local state
      setOffers(prev => prev.map(o => 
        o.id === offer.id ? updatedOffer : o
      ));
      setFilteredOffers(prev => prev.map(o => 
        o.id === offer.id ? updatedOffer : o
      ));

      alert(t.rejectSuccess.replace('{employer}', offer.employerName || 'Employer'));

    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert(t.rejectError);
    } finally {
      setProcessingOffer(null);
    }
  };

  // ============================================================
  // FILTERS AND SORT
  // ============================================================
  useEffect(() => {
    let filtered = [...offers];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.jobTitle?.toLowerCase().includes(searchLower) ||
        offer.employerName?.toLowerCase().includes(searchLower) ||
        offer.workerName?.toLowerCase().includes(searchLower)
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'salary_high':
        filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case 'salary_low':
        filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
      default:
        break;
    }

    setFilteredOffers(filtered);
  }, [offers, statusFilter, searchTerm, sortBy]);

  // ============================================================
  // HANDLERS
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

  const toggleExpand = (offerId) => {
    setExpandedOffer(expandedOffer === offerId ? null : offerId);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'accepted': return <CheckCircle size={16} />;
      case 'rejected': return <X size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected'
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
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatSalary = (amount) => {
    return `${amount?.toLocaleString() || 0}`;
  };

  const stats = {
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    total: offers.length
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

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
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 overflow-hidden border-2 border-amber-200">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-white m-1" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user?.fullName || 'Worker'}
                </span>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:flex"
              >
                {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex-shrink-0">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-white m-3" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{t.title}</h1>
                  <p className="text-white/80 mt-1">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Briefcase size={18} />
                <span>{stats.total} offers received</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.total}</p>
                <Briefcase size={20} className="text-gray-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pending}</p>
                <Clock size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.accepted}</p>
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.accepted}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.rejected}</p>
                <X size={20} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.rejected}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search offers...' : 'ابحث عن عروض...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="pending">{t.filters.pending}</option>
                  <option value="accepted">{t.filters.accepted}</option>
                  <option value="rejected">{t.filters.rejected}</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="newest">{t.sort.newest}</option>
                  <option value="oldest">{t.sort.oldest}</option>
                  <option value="salary_high">{t.sort.salary_high}</option>
                  <option value="salary_low">{t.sort.salary_low}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {language === 'en' ? 'Showing ' : 'عرض '}
              <span className="font-semibold text-gray-700">{filteredOffers.length}</span>
              {language === 'en' ? ' offers' : ' عرض'}
            </p>
          </div>

          {/* Offers List */}
          {filteredOffers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.empty.title}</h3>
              <p className="text-gray-500">{t.empty.description}</p>
              <p className="text-gray-400 text-sm mt-2">{t.empty.wait}</p>
              <button
                onClick={loadOffers}
                className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
              : 'space-y-4'
            }>
              {filteredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 ${
                    viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
                  } ${offer.status === 'accepted' ? 'border-green-200 bg-green-50/30' : ''}
                  ${offer.status === 'rejected' ? 'border-red-200 bg-red-50/30' : ''}`}
                >
                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {offer.workerImage ? (
                          <img 
                            src={offer.workerImage} 
                            alt={offer.workerName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={28} className="text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800 truncate">{offer.jobTitle || 'Job Offer'}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building2 size={14} />
                              <span>{offer.employerName || 'Employer'}</span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(offer.status)}`}>
                            {getStatusIcon(offer.status)}
                            {getStatusLabel(offer.status)}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="truncate">{offer.workerLocation || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <DollarSign size={14} className="text-gray-400" />
                            <span>EGP {formatSalary(offer.amount)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock size={14} className="text-gray-400" />
                            <span>{formatDate(offer.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Star size={14} className="text-yellow-500" />
                            <span>{offer.workerRating || 4.5} ★</span>
                          </div>
                        </div>

                        {/* Skills */}
                        {offer.workerSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {offer.workerSkills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                            {offer.workerSkills.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full">
                                +{offer.workerSkills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => toggleExpand(offer.id)}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                          >
                            <Eye size={16} />
                            {t.card.viewDetails}
                          </button>
                          {offer.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAcceptOffer(offer)}
                                disabled={processingOffer === offer.id}
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                              >
                                {processingOffer === offer.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <ThumbsUp size={14} />
                                )}
                                {t.actions.accept}
                              </button>
                              <button
                                onClick={() => handleRejectOffer(offer)}
                                disabled={processingOffer === offer.id}
                                className="px-4 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm rounded-lg transition flex items-center gap-1 disabled:opacity-50"
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
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg flex items-center gap-1">
                              <CheckCircle size={14} />
                              Offer Accepted
                            </span>
                          )}
                          {offer.status === 'rejected' && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg flex items-center gap-1">
                              <X size={14} />
                              Offer Rejected
                            </span>
                          )}
                          {offer.status === 'accepted' && (
                            <button
                              onClick={() => {
                                // Navigate to messages with employer
                                navigate('/worker-messages');
                              }}
                              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition flex items-center gap-1"
                            >
                              <MessageSquare size={14} />
                              Chat
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedOffer === offer.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Offer Details</h4>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Employer</span>
                                <span className="font-medium">{offer.employerName || 'Not provided'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Worker</span>
                                <span className="font-medium">{offer.workerName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Job Title</span>
                                <span className="font-medium">{offer.jobTitle || 'Service Provider'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Monthly Amount</span>
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
                                <span className="text-gray-500">Offer Sent</span>
                                <span className="font-medium">{formatDate(offer.createdAt)}</span>
                              </div>
                              {offer.workerResponseAt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Response Date</span>
                                  <span className="font-medium">{formatDate(offer.workerResponseAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Status Information</h4>
                            <div className={`p-3 rounded-lg ${
                              offer.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                              offer.status === 'accepted' ? 'bg-green-50 border border-green-200' :
                              'bg-red-50 border border-red-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(offer.status)}
                                <span className="font-medium">
                                  {offer.status === 'pending' ? 'Awaiting your response' :
                                   offer.status === 'accepted' ? 'Offer accepted - Contact employer for next steps' :
                                   'Offer rejected'}
                                </span>
                              </div>
                              {offer.status === 'accepted' && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <p>✅ You have accepted this offer. The employer will contact you with next steps.</p>
                                  <p className="mt-1 text-xs text-gray-500">Contact info will be shared after payment confirmation.</p>
                                </div>
                              )}
                              {offer.status === 'pending' && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <p>⏳ Please review this offer and respond.</p>
                                  <p className="mt-1 text-xs text-gray-500">Accepting will notify the employer.</p>
                                </div>
                              )}
                              {offer.status === 'rejected' && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <p>❌ You have declined this offer.</p>
                                </div>
                              )}
                            </div>
                            {offer.status === 'accepted' && (
                              <button
                                onClick={() => {
                                  navigate('/worker-messages');
                                }}
                                className="mt-3 w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkerOffers;