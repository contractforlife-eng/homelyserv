// src/pages/WorkerOffers.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';

// Sidebar Component - Updated with custom logo and profile image
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

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getProfileImage = () => {
    if (user?.profileImage) {
      return user.profileImage;
    }
    return null;
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

// Main WorkerOffers Component
const WorkerOffers = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [savedOffers, setSavedOffers] = useState([]);
  const [appliedOffers, setAppliedOffers] = useState([]);
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const translations = {
    en: {
      title: 'Job Offers',
      subtitle: 'Browse available job opportunities',
      stats: {
        available: 'Available',
        applied: 'Applied',
        saved: 'Saved',
        interviews: 'Interviews'
      },
      filters: {
        all: 'All Offers',
        new: 'New',
        applied: 'Applied',
        saved: 'Saved',
        interview: 'Interview',
        offered: 'Offered',
        rejected: 'Rejected',
        expired: 'Expired'
      },
      sort: {
        newest: 'Newest First',
        oldest: 'Oldest First',
        salary_high: 'Highest Salary',
        salary_low: 'Lowest Salary',
        popular: 'Most Popular'
      },
      card: {
        viewDetails: 'View Details',
        applyNow: 'Apply Now',
        saveOffer: 'Save',
        share: 'Share',
        salaryPerMonth: 'EGP/month',
        location: 'Location',
        type: 'Type',
        skills: 'Skills',
        benefits: 'Benefits',
        posted: 'Posted',
        applicants: 'applicants',
        matchScore: 'Match Score',
        urgent: 'Urgent',
        featured: 'Featured',
        new: 'New',
        applied: 'Applied',
        saved: 'Saved'
      },
      details: {
        title: 'Offer Details',
        about: 'About the Position',
        description: 'Job Description',
        requirements: 'Requirements',
        responsibilities: 'Responsibilities',
        benefits: 'Benefits & Perks',
        salaryRange: 'Salary Range',
        contractType: 'Contract Type',
        workSchedule: 'Work Schedule',
        startDate: 'Expected Start Date',
        applicationDeadline: 'Application Deadline',
        company: 'Company',
        industry: 'Industry',
        companySize: 'Company Size',
        companyDescription: 'About the Employer'
      },
      actions: {
        apply: 'Apply Now',
        applied: 'Applied',
        saved: 'Saved',
        unsave: 'Unsave',
        share: 'Share',
        view: 'View Details',
        close: 'Close',
        loadMore: 'Load More Offers',
        clearFakeOffers: 'Clear Fake Offers'
      },
      empty: {
        title: 'No offers available',
        description: 'No job offers have been posted by employers yet',
        reset: 'Refresh'
      },
      loading: 'Loading offers...',
      languageToggle: 'العربية',
      switchToList: 'List View',
      switchToGrid: 'Grid View',
      welcome: 'Welcome back',
      notifications: 'Notifications',
      clearConfirm: 'Are you sure you want to clear all fake offers?',
      clearSuccess: 'Fake offers cleared successfully!'
    },
    ar: {
      title: 'عروض العمل',
      subtitle: 'تصفح الفرص الوظيفية المتاحة',
      stats: {
        available: 'متاحة',
        applied: 'مقدم عليها',
        saved: 'محفوظة',
        interviews: 'مقابلات'
      },
      filters: {
        all: 'جميع العروض',
        new: 'جديد',
        applied: 'مقدم عليها',
        saved: 'محفوظة',
        interview: 'مقابلة',
        offered: 'تم العرض',
        rejected: 'مرفوض',
        expired: 'منتهي'
      },
      sort: {
        newest: 'الأحدث أولاً',
        oldest: 'الأقدم أولاً',
        salary_high: 'أعلى راتب',
        salary_low: 'أقل راتب',
        popular: 'الأكثر شهرة'
      },
      card: {
        viewDetails: 'عرض التفاصيل',
        applyNow: 'تقديم الآن',
        saveOffer: 'حفظ',
        share: 'مشاركة',
        salaryPerMonth: 'جنيه/شهر',
        location: 'الموقع',
        type: 'النوع',
        skills: 'المهارات',
        benefits: 'المزايا',
        posted: 'نشر',
        applicants: 'متقدم',
        matchScore: 'نسبة التطابق',
        urgent: 'عاجل',
        featured: 'مميز',
        new: 'جديد',
        applied: 'مقدم عليها',
        saved: 'محفوظة'
      },
      details: {
        title: 'تفاصيل العرض',
        about: 'عن الوظيفة',
        description: 'الوصف الوظيفي',
        requirements: 'المتطلبات',
        responsibilities: 'المسؤوليات',
        benefits: 'المزايا والإضافات',
        salaryRange: 'نطاق الراتب',
        contractType: 'نوع العقد',
        workSchedule: 'جدول العمل',
        startDate: 'تاريخ البدء المتوقع',
        applicationDeadline: 'موعد التقديم',
        company: 'الشركة',
        industry: 'المجال',
        companySize: 'حجم الشركة',
        companyDescription: 'عن صاحب العمل'
      },
      actions: {
        apply: 'تقديم الآن',
        applied: 'تم التقديم',
        saved: 'محفوظة',
        unsave: 'إلغاء الحفظ',
        share: 'مشاركة',
        view: 'عرض التفاصيل',
        close: 'إغلاق',
        loadMore: 'تحميل المزيد من العروض',
        clearFakeOffers: 'مسح العروض الوهمية'
      },
      empty: {
        title: 'لا توجد عروض',
        description: 'لم يتم نشر أي عروض عمل من قبل أصحاب العمل حتى الآن',
        reset: 'تحديث'
      },
      loading: 'جاري تحميل العروض...',
      languageToggle: 'English',
      switchToList: 'عرض القائمة',
      switchToGrid: 'عرض الشبكة',
      welcome: 'مرحباً بعودتك',
      notifications: 'الإشعارات',
      clearConfirm: 'هل أنت متأكد من رغبتك في مسح جميع العروض الوهمية؟',
      clearSuccess: 'تم مسح العروض الوهمية بنجاح!'
    }
  };

  const t = translations[language];

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

  // Load offers from localStorage
  const loadOffers = () => {
    try {
      let allOffers = [];
      
      // Get employer offers from localStorage
      const employerOffers = localStorage.getItem('employer_offers');
      if (employerOffers) {
        try {
          const parsed = JSON.parse(employerOffers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allOffers = parsed;
            console.log('✅ Loaded employer offers:', parsed.length);
          }
        } catch (e) {
          console.error('Error parsing employer_offers:', e);
        }
      }
      
      // If no offers found, create a sample real offer
      if (allOffers.length === 0) {
        const sampleOffer = {
          id: 'offer_' + Date.now(),
          title: 'Professional Nanny Needed',
          company: 'HomelyServ',
          companyLogo: `https://ui-avatars.com/api/?name=HomelyServ&background=amber&color=fff&size=100`,
          location: 'Cairo, Egypt',
          salary: { min: 3000, max: 5000 },
          type: 'Full-time',
          status: 'new',
          postedAt: new Date().toISOString(),
          description: 'We are looking for an experienced and caring nanny to take care of two children aged 3 and 5 years old.',
          requirements: [
            'Minimum 2 years of experience in childcare',
            'First Aid certification',
            'Excellent communication skills',
            'Patient and caring personality'
          ],
          responsibilities: [
            'Prepare meals for children',
            'Help with homework',
            'Organize educational activities',
            'Maintain children\'s daily routine'
          ],
          benefits: ['Health Insurance', 'Paid Leave', 'Training & Development'],
          contractType: 'Permanent',
          workSchedule: 'Sunday to Thursday, 8:00 AM - 4:00 PM',
          startDate: 'August 1, 2026',
          deadline: 'July 20, 2026',
          companyInfo: {
            description: 'HomelyServ is a leading platform connecting families with trusted home service professionals.',
            industry: 'Home Services',
            size: '50-100 employees'
          },
          applicants: 0,
          isUrgent: true,
          isFeatured: true,
          matchScore: 85,
          employerId: 'employer_default',
          postedBy: 'HomelyServ'
        };
        allOffers = [sampleOffer];
        // Save the sample offer to localStorage for persistence
        localStorage.setItem('employer_offers', JSON.stringify(allOffers));
      }
      
      // Mark offers as saved or applied based on user data
      const saved = JSON.parse(localStorage.getItem('worker_saved_offers') || '[]');
      const applied = JSON.parse(localStorage.getItem('worker_applied_offers') || '[]');
      
      allOffers = allOffers.map(offer => ({
        ...offer,
        isSaved: saved.includes(offer.id),
        isApplied: applied.includes(offer.id),
        status: applied.includes(offer.id) ? 'applied' : 
                saved.includes(offer.id) ? 'saved' : 
                offer.status || 'new'
      }));
      
      setOffers(allOffers);
      setFilteredOffers(allOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      setOffers([]);
      setFilteredOffers([]);
    }
  };

  // Clear fake offers
  const clearFakeOffers = () => {
    localStorage.removeItem('worker_offers');
    localStorage.removeItem('homelyserv_offers');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('offer') && !key.includes('employer_offers')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(data) && data.length > 0 && data[0].title === 'Senior Nanny - Full Time') {
            localStorage.removeItem(key);
          }
        } catch (e) {}
      }
    });
    
    setShowClearConfirm(false);
    loadOffers();
    alert(t.clearSuccess);
  };

  // Handle Apply Now
  const handleApplyNow = (offer) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (appliedOffers.includes(offer.id)) {
      alert('You have already applied for this position.');
      return;
    }
    
    const newApplied = [...appliedOffers, offer.id];
    setAppliedOffers(newApplied);
    localStorage.setItem('worker_applied_offers', JSON.stringify(newApplied));
    
    setOffers(prev => prev.map(o => 
      o.id === offer.id 
        ? { ...o, status: 'applied', isApplied: true }
        : o
    ));
    
    // Save notification for employer
    const notification = {
      id: 'notif_' + Date.now(),
      type: 'job_application',
      message: `${user.fullName || 'Worker'} has applied for ${offer.title}`,
      workerId: user.id || user.email,
      workerName: user.fullName || 'Worker',
      offerId: offer.id,
      offerTitle: offer.title,
      employerId: offer.employerId || offer.postedBy || 'employer',
      date: new Date().toISOString(),
      read: false
    };
    
    const notifications = JSON.parse(localStorage.getItem('homelyserv_notifications') || '[]');
    notifications.push(notification);
    localStorage.setItem('homelyserv_notifications', JSON.stringify(notifications));
    
    alert(`✅ You have successfully applied for ${offer.title}!`);
  };

  // Handle Contact
  const handleContact = (offer) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const employerName = offer.company || offer.postedBy || 'Employer';
    const employerId = offer.employerId || offer.postedBy || 'employer';
    
    const chatData = {
      id: employerId,
      name: employerName,
      role: 'employer',
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(employerName)}&background=amber&color=fff&size=100&bold=true`
    };
    
    localStorage.setItem('homelyserv_chat_recipient', JSON.stringify(chatData));
    
    const conversationData = {
      workerId: user.id || user.email,
      workerName: user.fullName || 'Worker',
      employerId: employerId,
      employerName: employerName,
      offerId: offer.id,
      offerTitle: offer.title,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('homelyserv_active_conversation', JSON.stringify(conversationData));
    
    navigate('/worker-messages');
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Load profile image from profiles storage
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

    const saved = localStorage.getItem('worker_saved_offers');
    if (saved) {
      setSavedOffers(JSON.parse(saved));
    }
    const applied = localStorage.getItem('worker_applied_offers');
    if (applied) {
      setAppliedOffers(JSON.parse(applied));
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

  useEffect(() => {
    let filtered = [...offers];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.title?.toLowerCase().includes(searchLower) ||
        offer.company?.toLowerCase().includes(searchLower) ||
        offer.location?.toLowerCase().includes(searchLower) ||
        offer.skills?.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        break;
      case 'salary_high':
        filtered.sort((a, b) => (b.salary?.max || 0) - (a.salary?.max || 0));
        break;
      case 'salary_low':
        filtered.sort((a, b) => (a.salary?.min || 0) - (b.salary?.min || 0));
        break;
      default:
        break;
    }

    setFilteredOffers(filtered);
  }, [offers, statusFilter, searchTerm, sortBy]);

  const toggleExpand = (offerId) => {
    setExpandedOffer(expandedOffer === offerId ? null : offerId);
  };

  const toggleSaveOffer = (offerId) => {
    let newSaved;
    if (savedOffers.includes(offerId)) {
      newSaved = savedOffers.filter(id => id !== offerId);
    } else {
      newSaved = [...savedOffers, offerId];
    }
    setSavedOffers(newSaved);
    localStorage.setItem('worker_saved_offers', JSON.stringify(newSaved));
    
    setOffers(prev => prev.map(offer => 
      offer.id === offerId 
        ? { ...offer, isSaved: !offer.isSaved, status: !offer.isSaved ? 'saved' : 'new' }
        : offer
    ));
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      applied: 'bg-yellow-100 text-yellow-800',
      saved: 'bg-purple-100 text-purple-800',
      interview: 'bg-indigo-100 text-indigo-800',
      offered: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <Zap size={16} />;
      case 'applied': return <Clock size={16} />;
      case 'saved': return <Heart size={16} />;
      case 'interview': return <Users size={16} />;
      case 'offered': return <CheckCircle size={16} />;
      case 'rejected': return <X size={16} />;
      case 'expired': return <AlertTriangle size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const getStatusLabel = (status) => {
    return t.filters[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSalary = (salary) => {
    if (!salary) return '';
    if (salary.min === salary.max) {
      return `${salary.min?.toLocaleString() || 0}`;
    }
    return `${salary.min?.toLocaleString() || 0} - ${salary.max?.toLocaleString() || 0}`;
  };

  const stats = {
    available: offers.filter(o => o.status === 'new' || o.status === 'saved').length,
    applied: offers.filter(o => o.status === 'applied').length,
    saved: savedOffers.length,
    interviews: offers.filter(o => o.status === 'interview' || o.status === 'offered').length
  };

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

  // Get user profile image
  const userProfileImage = user?.profileImage || null;

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
              {/* User profile picture in header */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 overflow-hidden border-2 border-amber-200">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
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
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition flex items-center gap-1"
              >
                <Trash2 size={16} />
                {t.actions.clearFakeOffers}
              </button>
            </div>
          </div>
        </header>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={28} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Clear Fake Offers</h3>
                <p className="text-gray-600 mb-6">{t.clearConfirm}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearFakeOffers}
                  className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6">
          {/* Updated Welcome Banner with user profile image */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex-shrink-0">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/90">
                  {t.welcome}, {user?.fullName || 'Worker'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.available}</p>
                <Zap size={20} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.available}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.applied}</p>
                <Clock size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.applied}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.saved}</p>
                <Heart size={20} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.saved}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.interviews}</p>
                <Users size={20} className="text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.interviews}</p>
            </div>
          </div>

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
                  <option value="new">{t.filters.new}</option>
                  <option value="applied">{t.filters.applied}</option>
                  <option value="saved">{t.filters.saved}</option>
                  <option value="interview">{t.filters.interview}</option>
                  <option value="offered">{t.filters.offered}</option>
                  <option value="rejected">{t.filters.rejected}</option>
                  <option value="expired">{t.filters.expired}</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="newest">{t.sort.newest}</option>
                  <option value="salary_high">{t.sort.salary_high}</option>
                  <option value="salary_low">{t.sort.salary_low}</option>
                  <option value="popular">{t.sort.popular}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {language === 'en' ? 'Showing ' : 'عرض '}
              <span className="font-semibold text-gray-700">{filteredOffers.length}</span>
              {language === 'en' ? ' offers' : ' عرض'}
            </p>
          </div>

          {filteredOffers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.empty.title}</h3>
              <p className="text-gray-500">{t.empty.description}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    loadOffers();
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSortBy('newest');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-rose-500 hover:shadow-lg text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  {t.empty.reset}
                </button>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 ${
                    viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
                  }`}
                >
                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start gap-4">
                      <img
                        src={offer.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(offer.company || 'Company')}&background=amber&color=fff&size=80`}
                        alt={offer.company}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(offer.company || 'Company')}&background=amber&color=fff&size=80`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800 truncate">{offer.title}</h3>
                            <p className="text-sm text-gray-500">{offer.company}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                            {offer.isUrgent && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                {t.card.urgent}
                              </span>
                            )}
                            {offer.isFeatured && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                {t.card.featured}
                              </span>
                            )}
                          </div>
                        </div>

                        {offer.matchScore && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    offer.matchScore >= 80 ? 'bg-green-500' :
                                    offer.matchScore >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${offer.matchScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">{offer.matchScore}%</span>
                            </div>
                            <span className="text-xs text-gray-400">{t.card.matchScore}</span>
                          </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="truncate">{offer.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <DollarSign size={14} className="text-gray-400" />
                            <span>EGP {formatSalary(offer.salary)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Briefcase size={14} className="text-gray-400" />
                            <span>{offer.type}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock size={14} className="text-gray-400" />
                            <span>{formatDate(offer.postedAt)}</span>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(offer.status)}`}>
                            {getStatusIcon(offer.status)}
                            {getStatusLabel(offer.status)}
                          </span>
                          {offer.isApplied && (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <CheckCircle size={12} />
                              {t.card.applied}
                            </span>
                          )}
                          {offer.isSaved && !offer.isApplied && (
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Heart size={12} className="fill-current" />
                              {t.card.saved}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{offer.applicants || 0} {t.card.applicants}</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => toggleExpand(offer.id)}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                          >
                            <Eye size={16} />
                            {t.card.viewDetails}
                          </button>
                          <button
                            onClick={() => toggleSaveOffer(offer.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              offer.isSaved
                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Heart size={18} className={offer.isSaved ? 'fill-current' : ''} />
                          </button>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedOffer === offer.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">{t.details.about}</h4>
                            <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
                            
                            <h5 className="font-semibold text-gray-700 mb-1 text-sm">{t.details.requirements}</h5>
                            <ul className="text-sm text-gray-600 space-y-0.5 list-disc list-inside mb-3">
                              {offer.requirements?.map((req, idx) => (
                                <li key={idx}>{req}</li>
                              ))}
                            </ul>

                            <h5 className="font-semibold text-gray-700 mb-1 text-sm">{t.details.responsibilities}</h5>
                            <ul className="text-sm text-gray-600 space-y-0.5 list-disc list-inside">
                              {offer.responsibilities?.map((resp, idx) => (
                                <li key={idx}>{resp}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">{t.details.benefits}</h4>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {offer.benefits?.map((benefit, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                                  {benefit}
                                </span>
                              ))}
                            </div>

                            <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t.details.contractType}</span>
                                <span className="font-medium">{offer.contractType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t.details.workSchedule}</span>
                                <span className="font-medium">{offer.workSchedule}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t.details.startDate}</span>
                                <span className="font-medium">{offer.startDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t.details.applicationDeadline}</span>
                                <span className="font-medium text-red-600">{offer.deadline}</span>
                              </div>
                            </div>

                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <h5 className="font-semibold text-gray-700 text-sm mb-1">{t.details.company}</h5>
                              <p className="text-sm text-gray-600">{offer.companyInfo?.description}</p>
                              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                <span>{offer.companyInfo?.industry}</span>
                                <span>•</span>
                                <span>{offer.companyInfo?.size}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button 
                            onClick={() => handleApplyNow(offer)}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                              offer.isApplied || appliedOffers.includes(offer.id)
                                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:shadow-lg text-white'
                            }`}
                            disabled={offer.isApplied || appliedOffers.includes(offer.id)}
                          >
                            {offer.isApplied || appliedOffers.includes(offer.id) ? (
                              <>
                                <CheckCircle size={18} />
                                Applied
                              </>
                            ) : (
                              <>
                                <BriefcaseIcon size={18} />
                                {t.actions.apply}
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => handleContact(offer)}
                            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <MessageCircle size={18} />
                            {language === 'en' ? 'Contact' : 'اتصال'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {viewMode === 'list' && (
                    <div className="md:w-48 bg-gray-50 p-4 border-t md:border-t-0 md:border-l border-gray-100 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-3">
                      <div className="text-center md:text-left">
                        <p className="text-xs text-gray-500">{t.card.salaryPerMonth}</p>
                        <p className="font-bold text-gray-800 text-lg">
                          EGP {formatSalary(offer.salary)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleExpand(offer.id)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
                      >
                        {expandedOffer === offer.id ? (language === 'en' ? 'Hide Details' : 'إخفاء التفاصيل') : (language === 'en' ? 'View Details' : 'عرض التفاصيل')}
                        {expandedOffer === offer.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  )}
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