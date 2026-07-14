// src/pages/MyHires.jsx - Updated to display actual hired workers
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  Briefcase,
  FileCheck,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  AlertTriangle,
  Search,
  DollarSign,
  Clock,
  Calendar,
  Star,
  MapPin,
  Phone,
  Mail,
  Users,
  Filter,
  FileText,
  Search as SearchIcon,
  UserCheck,
  Building2,
  MapPinned,
  Languages,
  Star as StarIcon,
  CheckCircle,
  Eye,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield,
  Award,
  Zap,
  Heart,
  UserPlus,
  BarChart3,
  SlidersHorizontal,
  ArrowUpDown,
  ThumbsUp,
  LayoutGrid,
  List,
  CreditCard,
  Lock as LockIcon,
  MoreVertical,
  Trash2,
  Edit,
  Check,
  X as XIcon,
  RefreshCw,
  Crown
} from 'lucide-react';
import { isUserPremium } from '../utils/subscriptionService';

// ============================================================
// 1. EMPLOYER SIDEBAR COMPONENT
// ============================================================
const EmployerSidebar = ({ 
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
      myHires: 'My Hires',
      search: 'Search Workers',
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
      myHires: 'توظيفاتي',
      search: 'البحث عن عمال',
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

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/employer-profile' },
    { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
    { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/employer-payments' },
    { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
  ];

  const isActive = (path) => location.pathname === path;

  const getProfileImage = () => user?.profileImage || null;

  // Check if user has premium subscription
  const isPremium = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

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
            <Link to="/employer-dashboard" className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className="text-teal-500" />
                <Home size={14} className="text-teal-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/employer-dashboard" className="relative mx-auto">
              <Shield size={28} className="text-teal-500" />
              <Home size={14} className="text-teal-300 absolute -bottom-1 -right-1" />
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || 'Employer'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
                  {isPremium() && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{user.email || 'employer@homelyserv.com'}</p>
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
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-teal-600' : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-teal-600 rounded-full"></div>
              )}
            </Link>
          ))}

          <div className="border-t border-gray-200 my-3"></div>

          <Link
            to="/employer-settings"
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-teal-600 hover:bg-teal-50 group ${
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
// 2. MAIN MY HIRES COMPONENT
// ============================================================
const MyHires = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hires, setHires] = useState([]);
  const [filteredHires, setFilteredHires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHire, setSelectedHire] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [terminatingHire, setTerminatingHire] = useState(null);

  const translations = {
    en: {
      title: 'My Hires',
      subtitle: 'Manage your hired workers',
      stats: {
        total: 'Total Hires',
        active: 'Active',
        terminated: 'Terminated',
        pending: 'Pending'
      },
      status: {
        active: 'Active',
        terminated: 'Terminated',
        pending: 'Pending',
        completed: 'Completed',
        accepted: 'Accepted'
      },
      table: {
        worker: 'Worker',
        job: 'Job Title',
        salary: 'Salary',
        startDate: 'Start Date',
        status: 'Status',
        actions: 'Actions'
      },
      modal: {
        title: 'Hire Details',
        workerName: 'Worker Name',
        jobTitle: 'Job Title',
        salary: 'Salary',
        startDate: 'Start Date',
        endDate: 'End Date',
        status: 'Status',
        contact: 'Contact Information',
        phone: 'Phone',
        email: 'Email',
        location: 'Location',
        rating: 'Rating',
        notes: 'Notes',
        close: 'Close',
        terminate: 'Terminate',
        message: 'Send Message'
      },
      terminate: {
        title: 'Terminate Hire',
        confirm: 'Are you sure you want to terminate this hire?',
        reason: 'Reason for termination (optional)',
        placeholder: 'Enter reason...',
        cancel: 'Cancel',
        confirmButton: 'Terminate Hire',
        success: 'Hire terminated successfully',
        error: 'Error terminating hire'
      },
      actions: {
        view: 'View Details',
        terminate: 'Terminate',
        message: 'Message Worker',
        pay: 'Pay Now'
      },
      filters: {
        all: 'All Hires',
        active: 'Active',
        terminated: 'Terminated',
        pending: 'Pending',
        accepted: 'Accepted'
      },
      empty: {
        title: 'No hires yet',
        description: 'You haven\'t hired any workers yet',
        start: 'Find workers to hire'
      },
      loading: 'Loading hires...',
      languageToggle: 'العربية',
      searchPlaceholder: 'Search by worker name or job title...',
      noResults: 'No hires match your search',
      clearFilters: 'Clear filters',
      refresh: 'Refresh',
      salaryPerMonth: 'EGP/month'
    },
    ar: {
      title: 'توظيفاتي',
      subtitle: 'إدارة العمال الذين قمت بتوظيفهم',
      stats: {
        total: 'إجمالي التوظيفات',
        active: 'نشط',
        terminated: 'منتهي',
        pending: 'قيد الانتظار'
      },
      status: {
        active: 'نشط',
        terminated: 'منتهي',
        pending: 'قيد الانتظار',
        completed: 'مكتمل',
        accepted: 'مقبول'
      },
      table: {
        worker: 'العامل',
        job: 'المسمى الوظيفي',
        salary: 'الراتب',
        startDate: 'تاريخ البدء',
        status: 'الحالة',
        actions: 'الإجراءات'
      },
      modal: {
        title: 'تفاصيل التوظيف',
        workerName: 'اسم العامل',
        jobTitle: 'المسمى الوظيفي',
        salary: 'الراتب',
        startDate: 'تاريخ البدء',
        endDate: 'تاريخ الانتهاء',
        status: 'الحالة',
        contact: 'معلومات الاتصال',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        location: 'الموقع',
        rating: 'التقييم',
        notes: 'ملاحظات',
        close: 'إغلاق',
        terminate: 'إنهاء',
        message: 'إرسال رسالة'
      },
      terminate: {
        title: 'إنهاء التوظيف',
        confirm: 'هل أنت متأكد من رغبتك في إنهاء هذا التوظيف؟',
        reason: 'سبب الإنهاء (اختياري)',
        placeholder: 'أدخل السبب...',
        cancel: 'إلغاء',
        confirmButton: 'إنهاء التوظيف',
        success: 'تم إنهاء التوظيف بنجاح',
        error: 'خطأ في إنهاء التوظيف'
      },
      actions: {
        view: 'عرض التفاصيل',
        terminate: 'إنهاء',
        message: 'مراسلة العامل',
        pay: 'ادفع الآن'
      },
      filters: {
        all: 'جميع التوظيفات',
        active: 'نشط',
        terminated: 'منتهي',
        pending: 'قيد الانتظار',
        accepted: 'مقبول'
      },
      empty: {
        title: 'لا توجد توظيفات',
        description: 'لم تقم بتوظيف أي عامل بعد',
        start: 'ابحث عن عمال للتوظيف'
      },
      loading: 'جاري تحميل التوظيفات...',
      languageToggle: 'English',
      searchPlaceholder: 'ابحث باسم العامل أو المسمى الوظيفي...',
      noResults: 'لا توجد توظيفات تطابق بحثك',
      clearFilters: 'مسح التصفيات',
      refresh: 'تحديث',
      salaryPerMonth: 'جنيه/شهر'
    }
  };

  const t = translations[language];

  // ============================================================
  // 3. EFFECTS
  // ============================================================
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'EMPLOYER') {
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

    loadHires();
  }, [navigate]);

  // ============================================================
  // 4. LOAD HIRES - Get ALL hired workers from localStorage
  // ============================================================
  const loadHires = () => {
    setLoading(true);
    
    try {
      const employerEmail = user?.email;
      if (!employerEmail) {
        setHires([]);
        setFilteredHires([]);
        setLoading(false);
        return;
      }

      console.log('📂 Loading hires for employer:', employerEmail);

      // Get all employer offers
      const allOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      
      // Filter offers for this employer
      const employerOffers = allOffers.filter(
        offer => offer.employerEmail === employerEmail || offer.employerId === employerEmail
      );

      // ✅ FIX: Get ALL accepted/completed offers (these are the hires)
      const hiredOffers = employerOffers.filter(offer => 
        offer.status === 'accepted' || 
        offer.status === 'completed' || 
        offer.status === 'active' ||
        offer.status === 'hired'
      );
      
      console.log(`📌 Found ${hiredOffers.length} hired offers`);

      // Also get from homelyserv_hires
      const hiresFromStorage = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
      const employerHires = hiresFromStorage.filter(
        hire => hire.employerEmail === employerEmail || hire.employerId === employerEmail
      );
      
      console.log(`📌 Found ${employerHires.length} hires from homelyserv_hires`);

      // Merge data - prefer data from hiresFromStorage for status
      const mergedHires = [];
      const processedOfferIds = new Set();
      
      // First, process all hired offers
      hiredOffers.forEach(offer => {
        processedOfferIds.add(offer.id);
        const existingHire = employerHires.find(h => h.offerId === offer.id || h.hireId === offer.id);
        
        // Check if worker has premium subscription
        const workerId = offer.workerId || offer.workerEmail;
        const isPremiumWorker = workerId ? isUserPremium(workerId) : false;
        
        const hireData = {
          ...offer,
          hireId: offer.id,
          workerName: offer.workerName || 'Worker',
          workerEmail: offer.workerEmail || '',
          workerPhone: offer.workerPhone || '',
          workerLocation: offer.workerLocation || 'Not specified',
          workerImage: offer.workerImage || '',
          workerRating: offer.workerRating || 4.5,
          jobTitle: offer.jobTitle || 'Service Provider',
          salary: offer.amount || 0,
          startDate: offer.workerResponseAt || offer.createdAt || new Date().toISOString(),
          status: existingHire?.status || offer.status || 'active',
          employerEmail: employerEmail,
          employerId: employerEmail,
          isPremium: isPremiumWorker,
          terminationReason: existingHire?.terminationReason || offer.terminationReason || null,
          terminationDate: existingHire?.terminationDate || offer.terminationDate || null
        };
        
        // If existing hire has more recent data, use it
        if (existingHire) {
          mergedHires.push({
            ...hireData,
            ...existingHire,
            workerName: existingHire.workerName || hireData.workerName,
            workerEmail: existingHire.workerEmail || hireData.workerEmail,
            workerPhone: existingHire.workerPhone || hireData.workerPhone,
            workerImage: existingHire.workerImage || hireData.workerImage,
            salary: existingHire.salary || hireData.salary,
            startDate: existingHire.startDate || hireData.startDate,
            isPremium: existingHire.isPremium || isPremiumWorker
          });
        } else {
          mergedHires.push(hireData);
        }
      });

      // Add hires from homelyserv_hires that don't have corresponding offers
      employerHires.forEach(hire => {
        if (!processedOfferIds.has(hire.offerId) && !processedOfferIds.has(hire.hireId)) {
          const workerId = hire.workerId || hire.workerEmail;
          const isPremiumWorker = workerId ? isUserPremium(workerId) : false;
          
          mergedHires.push({
            ...hire,
            hireId: hire.id || hire.hireId,
            status: hire.status || 'active',
            isPremium: isPremiumWorker
          });
        }
      });

      // Sort by date (newest first)
      mergedHires.sort((a, b) => {
        const dateA = new Date(a.startDate || a.createdAt || 0);
        const dateB = new Date(b.startDate || b.createdAt || 0);
        return dateB - dateA;
      });

      console.log(`✅ Loaded ${mergedHires.length} total hires`);
      setHires(mergedHires);
      setFilteredHires(mergedHires);
      
    } catch (error) {
      console.error('Error loading hires:', error);
      setHires([]);
      setFilteredHires([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadHires();
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // ============================================================
  // 5. FILTERS
  // ============================================================
  useEffect(() => {
    let filtered = [...hires];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(hire => hire.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(hire =>
        hire.workerName?.toLowerCase().includes(searchLower) ||
        hire.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredHires(filtered);
  }, [hires, statusFilter, searchTerm]);

  // ============================================================
  // 6. HANDLERS
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

  const handleRefresh = () => {
    loadHires();
  };

  const handleViewDetails = (hire) => {
    setSelectedHire(hire);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedHire(null);
  };

  const handleTerminateClick = (hire) => {
    setTerminatingHire(hire);
    setTerminateReason('');
    setShowTerminateModal(true);
    setShowDetailsModal(false);
  };

  const handleTerminateHire = () => {
    if (!terminatingHire) return;

    try {
      // Update the hire status
      const updatedHire = {
        ...terminatingHire,
        status: 'terminated',
        terminationDate: new Date().toISOString(),
        terminationReason: terminateReason || 'No reason provided'
      };

      // Update in homelyserv_hires
      const hiresFromStorage = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
      const hireIndex = hiresFromStorage.findIndex(h => 
        h.id === terminatingHire.hireId || h.offerId === terminatingHire.hireId
      );
      
      if (hireIndex !== -1) {
        hiresFromStorage[hireIndex] = {
          ...hiresFromStorage[hireIndex],
          status: 'terminated',
          terminationDate: new Date().toISOString(),
          terminationReason: terminateReason || 'No reason provided'
        };
      } else {
        hiresFromStorage.push({
          id: terminatingHire.hireId || terminatingHire.offerId,
          offerId: terminatingHire.offerId || terminatingHire.hireId,
          workerName: terminatingHire.workerName,
          workerEmail: terminatingHire.workerEmail,
          workerPhone: terminatingHire.workerPhone,
          workerImage: terminatingHire.workerImage,
          jobTitle: terminatingHire.jobTitle,
          salary: terminatingHire.salary,
          startDate: terminatingHire.startDate || new Date().toISOString(),
          status: 'terminated',
          terminationDate: new Date().toISOString(),
          terminationReason: terminateReason || 'No reason provided',
          employerEmail: user?.email,
          employerId: user?.email
        });
      }
      localStorage.setItem('homelyserv_hires', JSON.stringify(hiresFromStorage));

      // Update in employer_offers
      const allOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const updatedOffers = allOffers.map(o => 
        o.id === terminatingHire.hireId || o.id === terminatingHire.offerId
          ? { ...o, status: 'terminated', terminationReason: terminateReason || 'No reason provided' }
          : o
      );
      localStorage.setItem('employer_offers', JSON.stringify(updatedOffers));

      // Update in worker_offers
      if (terminatingHire.workerEmail) {
        const workerOffers = JSON.parse(localStorage.getItem(`worker_offers_${terminatingHire.workerEmail}`) || '[]');
        const updatedWorkerOffers = workerOffers.map(o => 
          o.id === terminatingHire.hireId || o.id === terminatingHire.offerId
            ? { ...o, status: 'terminated', terminationReason: terminateReason || 'No reason provided' }
            : o
        );
        localStorage.setItem(`worker_offers_${terminatingHire.workerEmail}`, JSON.stringify(updatedWorkerOffers));
      }

      // Update local state
      setHires(prev => prev.map(h => 
        h.hireId === terminatingHire.hireId || h.offerId === terminatingHire.hireId
          ? updatedHire
          : h
      ));

      setShowTerminateModal(false);
      setTerminatingHire(null);
      
      alert(t.terminate.success);
      
    } catch (error) {
      console.error('Error terminating hire:', error);
      alert(t.terminate.error);
    }
  };

  const handleSendMessage = (hire) => {
    if (hire) {
      const chatData = {
        id: hire.workerId || hire.workerEmail,
        name: hire.workerName,
        role: 'worker',
        image: hire.workerImage || ''
      };
      localStorage.setItem('homelyserv_chat_recipient', JSON.stringify(chatData));
      localStorage.setItem('homelyserv_open_chat_on_load', 'true');
      navigate('/employer-messages');
    }
  };

  const handlePayNow = (hire) => {
    if (hire) {
      const pendingPayment = {
        paymentId: hire.hireId || hire.offerId,
        amount: hire.salary || 0,
        workerName: hire.workerName,
        workerId: hire.workerId || hire.workerEmail,
        workerEmail: hire.workerEmail || '',
        jobTitle: hire.jobTitle || 'Service Provider',
        description: `Payment for ${hire.workerName || 'worker'}`,
        paymentType: 'recruitment',
        offerId: hire.offerId || hire.hireId,
        employerId: user?.id || user?.email,
        employerName: user?.fullName || 'Employer',
        returnTo: '/my-hires'
      };
      localStorage.setItem('homelyserv_pending_payment', JSON.stringify(pendingPayment));
      navigate('/payment-options');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border border-green-200',
      accepted: 'bg-blue-100 text-blue-800 border border-blue-200',
      terminated: 'bg-red-100 text-red-800 border border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      completed: 'bg-purple-100 text-purple-800 border border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'accepted': return <CheckCircle size={14} />;
      case 'terminated': return <XIcon size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString() || 0}`;
  };

  const stats = {
    total: hires.length,
    active: hires.filter(h => h.status === 'active' || h.status === 'accepted').length,
    terminated: hires.filter(h => h.status === 'terminated').length,
    pending: hires.filter(h => h.status === 'pending').length
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <EmployerSidebar
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 overflow-hidden border-2 border-teal-200">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Employer'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-white m-1" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user?.fullName || 'Employer'}
                </span>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-600 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                {t.refresh}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex-shrink-0">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Employer'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-white m-3" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{t.title}</h1>
                  <p className="text-teal-100 mt-1">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-teal-100">
                <Users size={18} />
                <span>{stats.total} workers hired</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.total}</p>
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-teal-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.active}</p>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.terminated}</p>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <XIcon size={20} className="text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.terminated}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pending}</p>
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-gray-700 text-sm"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="active">{t.filters.active}</option>
                  <option value="accepted">{t.filters.accepted || 'Accepted'}</option>
                  <option value="terminated">{t.filters.terminated}</option>
                  <option value="pending">{t.filters.pending}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredHires.length}</span> hires
            </p>
          </div>

          {/* Hires List */}
          {filteredHires.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.empty.title}</h3>
              <p className="text-gray-500">{t.empty.description}</p>
              <button
                onClick={() => navigate('/employer-search')}
                className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.empty.start}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHires.map((hire) => (
                <div
                  key={hire.hireId || hire.offerId || hire.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition ${
                    hire.status === 'active' || hire.status === 'accepted' ? 'border-green-200' :
                    hire.status === 'terminated' ? 'border-red-200' :
                    'border-yellow-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                          {hire.workerImage ? (
                            <img 
                              src={hire.workerImage} 
                              alt={hire.workerName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={24} className="text-teal-600" />
                          )}
                          {hire.isPremium && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                              <Crown size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">{hire.workerName || 'Unknown Worker'}</h3>
                            {hire.isPremium && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700">
                                <Crown size={10} className="text-yellow-500" />
                                Premium
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Briefcase size={14} />
                            <span>{hire.jobTitle || 'Service Provider'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <DollarSign size={14} className="text-green-600" />
                              {formatCurrency(hire.salary)} {t.salaryPerMonth}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(hire.startDate)}
                            </span>
                            {hire.workerRating && (
                              <span className="flex items-center gap-1">
                                <StarIcon size={14} className="text-yellow-500" />
                                {hire.workerRating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(hire.status)}`}>
                          {getStatusIcon(hire.status)}
                          {t.status[hire.status] || hire.status}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(hire)}
                            className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            title={t.actions.view}
                          >
                            <Eye size={16} />
                          </button>
                          {(hire.status === 'active' || hire.status === 'accepted') && (
                            <>
                              <button
                                onClick={() => handleSendMessage(hire)}
                                className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title={t.actions.message}
                              >
                                <MessageCircle size={16} />
                              </button>
                              <button
                                onClick={() => handlePayNow(hire)}
                                className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                title={t.actions.pay}
                              >
                                <CreditCard size={16} />
                              </button>
                              <button
                                onClick={() => handleTerminateClick(hire)}
                                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title={t.actions.terminate}
                              >
                                <XIcon size={16} />
                              </button>
                            </>
                          )}
                        </div>
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
      {showDetailsModal && selectedHire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{t.modal.title}</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden relative">
                  {selectedHire.workerImage ? (
                    <img 
                      src={selectedHire.workerImage} 
                      alt={selectedHire.workerName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-teal-600" />
                  )}
                  {selectedHire.isPremium && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                      <Crown size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">{selectedHire.workerName}</h3>
                    {selectedHire.isPremium && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700">
                        <Crown size={10} className="text-yellow-500" />
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500">{selectedHire.jobTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(selectedHire.status)}`}>
                      {getStatusIcon(selectedHire.status)}
                      {t.status[selectedHire.status] || selectedHire.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{t.modal.salary}</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(selectedHire.salary)} {t.salaryPerMonth}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{t.modal.startDate}</p>
                  <p className="text-lg font-bold text-gray-800">{formatDate(selectedHire.startDate)}</p>
                </div>
                {selectedHire.terminationDate && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">{t.modal.endDate}</p>
                    <p className="text-lg font-bold text-gray-800">{formatDate(selectedHire.terminationDate)}</p>
                  </div>
                )}
                {selectedHire.workerRating && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">{t.modal.rating}</p>
                    <p className="text-lg font-bold text-gray-800 flex items-center gap-1">
                      <StarIcon size={18} className="text-yellow-500" />
                      {selectedHire.workerRating}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-2">{t.modal.contact}</h4>
                <div className="space-y-2 text-sm">
                  {selectedHire.workerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span>{selectedHire.workerEmail}</span>
                    </div>
                  )}
                  {selectedHire.workerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span>{selectedHire.workerPhone}</span>
                    </div>
                  )}
                  {selectedHire.workerLocation && selectedHire.workerLocation !== 'Not specified' && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span>{selectedHire.workerLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedHire.terminationReason && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm text-red-600">{selectedHire.terminationReason}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {t.modal.close}
              </button>
              {(selectedHire.status === 'active' || selectedHire.status === 'accepted') && (
                <>
                  <button
                    onClick={() => handleSendMessage(selectedHire)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    {t.modal.message}
                  </button>
                  <button
                    onClick={() => handleTerminateClick(selectedHire)}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    <XIcon size={16} />
                    {t.modal.terminate}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminateModal && terminatingHire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">{t.terminate.title}</h3>
              <button
                onClick={() => setShowTerminateModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="text-center py-4">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-3" />
              <p className="text-gray-700">{t.terminate.confirm}</p>
              <p className="text-sm text-gray-500 mt-2">
                <strong>{terminatingHire.workerName}</strong> - {terminatingHire.jobTitle}
              </p>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.terminate.reason}
              </label>
              <textarea
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                placeholder={t.terminate.placeholder}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTerminateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.terminate.cancel}
              </button>
              <button
                onClick={handleTerminateHire}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.terminate.confirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHires;