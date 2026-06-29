import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Eye,
  Heart,
  Share2,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  Globe,
  X,
  LayoutGrid,
  List,
  ThumbsUp,
  BriefcaseIcon,
  Home,
  User,
  Settings,
  LogOut,
  Menu,
  Bell,
  Calendar,
  FileText,
  Award,
  TrendingUp,
  Shield,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileCheck,
  Star,
  Clock as ClockIcon
} from 'lucide-react';

// Sidebar Component - Reusable across all worker pages
const WorkerSidebar = ({ 
  language, 
  toggleLanguage, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  user, 
  handleLogout 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const translations = {
    en: {
      dashboard: 'Dashboard',
      myProfile: 'My Profile',
      myOffers: 'My Offers',
      myHires: 'My Hires',
      messages: 'Messages',
      calendar: 'Calendar',
      documents: 'Documents',
      settings: 'Settings',
      help: 'Help & Support',
      logout: 'Logout',
      overview: 'Overview',
      findJobs: 'Find Jobs',
      languageToggle: 'العربية'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      myProfile: 'ملفي الشخصي',
      myOffers: 'عروضي',
      myHires: 'توظيفاتي',
      messages: 'الرسائل',
      calendar: 'التقويم',
      documents: 'المستندات',
      settings: 'الإعدادات',
      help: 'المساعدة والدعم',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة',
      findJobs: 'البحث عن وظائف',
      languageToggle: 'English'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/profile' },
    { id: 'offers', label: t.myOffers, icon: Briefcase, path: '/worker/offers' },
    { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/messages' },
    { id: 'calendar', label: t.calendar, icon: Calendar, path: '/calendar' },
    { id: 'documents', label: t.documents, icon: FileText, path: '/documents' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/dashboard" className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">H</span>
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

        {/* User Profile - Shows logged-in user */}
        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.fullName} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-red-600" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user?.fullName || 'Worker'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'worker@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {/* Overview Section */}
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
            </Link>
          ))}

          <div className="border-t border-gray-200 my-3"></div>

          {/* Bottom menu items */}
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.settings}
            </div>
          )}
          
          <Link
            to="/settings"
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

// Main WorkerOffers Component
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
  const [savedOffers, setSavedOffers] = useState([]);
  const [appliedOffers, setAppliedOffers] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Translations for page content
  const translations = {
    en: {
      title: 'Job Offers',
      subtitle: 'Discover opportunities that match your skills and preferences',
      stats: {
        available: 'Available Offers',
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
        popular: 'Most Popular',
        nearby: 'Nearest Location'
      },
      card: {
        viewDetails: 'View Details',
        applyNow: 'Apply Now',
        saveOffer: 'Save Offer',
        share: 'Share',
        salaryPerMonth: 'EGP/month',
        postedBy: 'Posted by',
        location: 'Location',
        experience: 'Experience',
        type: 'Employment Type',
        skills: 'Skills Required',
        benefits: 'Benefits',
        postedAgo: 'Posted',
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
        companyDescription: 'About the Employer',
        applicationStatus: 'Application Status',
        applyNow: 'Apply Now'
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
        confirmApply: 'Confirm Application',
        cancel: 'Cancel'
      },
      empty: {
        title: 'No offers found',
        description: "We couldn't find any offers matching your criteria",
        reset: 'Reset Filters',
        browse: 'Browse All Offers'
      },
      loading: 'Loading offers...',
      error: 'Error loading offers. Please try again.',
      retry: 'Retry',
      languageToggle: 'العربية',
      switchToList: 'List View',
      switchToGrid: 'Grid View',
      applyModal: {
        title: 'Apply for Position',
        message: 'Are you sure you want to apply for this position?',
        confirm: 'Yes, Apply Now',
        cancel: 'Cancel',
        success: 'Application submitted successfully!',
        note: 'You will be notified about the application status via email.'
      },
      welcome: 'Welcome back',
      notifications: 'Notifications'
    },
    ar: {
      title: 'عروض العمل',
      subtitle: 'اكتشف الفرص التي تناسب مهاراتك وتفضيلاتك',
      stats: {
        available: 'العروض المتاحة',
        applied: 'تم التقديم',
        saved: 'المحفوظة',
        interviews: 'المقابلات'
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
        popular: 'الأكثر شهرة',
        nearby: 'الأقرب موقعاً'
      },
      card: {
        viewDetails: 'عرض التفاصيل',
        applyNow: 'تقديم الآن',
        saveOffer: 'حفظ العرض',
        share: 'مشاركة',
        salaryPerMonth: 'جنيه/شهر',
        postedBy: 'نشر بواسطة',
        location: 'الموقع',
        experience: 'الخبرة',
        type: 'نوع التوظيف',
        skills: 'المهارات المطلوبة',
        benefits: 'المزايا',
        postedAgo: 'نشر منذ',
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
        companyDescription: 'عن صاحب العمل',
        applicationStatus: 'حالة التقديم',
        applyNow: 'تقديم الآن'
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
        confirmApply: 'تأكيد التقديم',
        cancel: 'إلغاء'
      },
      empty: {
        title: 'لا توجد عروض',
        description: 'لم نجد أي عروض تطابق معايير البحث الخاصة بك',
        reset: 'إعادة تعيين الفلاتر',
        browse: 'تصفح جميع العروض'
      },
      loading: 'جاري تحميل العروض...',
      error: 'حدث خطأ في تحميل العروض. يرجى المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      languageToggle: 'English',
      switchToList: 'عرض القائمة',
      switchToGrid: 'عرض الشبكة',
      applyModal: {
        title: 'تقديم على الوظيفة',
        message: 'هل أنت متأكد من رغبتك في التقديم على هذه الوظيفة؟',
        confirm: 'نعم، تقديم الآن',
        cancel: 'إلغاء',
        success: 'تم تقديم الطلب بنجاح!',
        note: 'سيتم إعلامك بحالة الطلب عبر البريد الإلكتروني.'
      },
      welcome: 'مرحباً بعودتك',
      notifications: 'الإشعارات'
    }
  };

  const t = translations[language];

  // Get logged-in user from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    // Get the logged-in user data
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('Logged-in user:', parsedUser); // Debug: Check which user is logged in
      } catch (error) {
        console.error('Error parsing user data:', error);
        // If no user found, redirect to login
        navigate('/login');
      }
    } else {
      // No user found, redirect to login
      navigate('/login');
    }

    // Load saved offers for this user
    const savedKey = `worker_saved_offers_${userData ? JSON.parse(userData).id : 'default'}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      setSavedOffers(JSON.parse(saved));
    }

    const appliedKey = `worker_applied_offers_${userData ? JSON.parse(userData).id : 'default'}`;
    const applied = localStorage.getItem(appliedKey);
    if (applied) {
      setAppliedOffers(JSON.parse(applied));
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
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

  // Fetch offers based on logged-in user
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Generate user-specific offers based on logged-in user
        const userOffers = getOffersForUser(user);
        
        const mergedOffers = userOffers.map(offer => ({
          ...offer,
          isSaved: savedOffers.includes(offer.id),
          isApplied: appliedOffers.includes(offer.id)
        }));

        setOffers(mergedOffers);
        setFilteredOffers(mergedOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOffers();
    }
  }, [user]);

  // Function to get offers for specific user
  const getOffersForUser = (currentUser) => {
    // Base offers that all users see
    const baseOffers = [
      {
        id: 'OFF-2026-001',
        title: 'Senior Nanny - Full Time',
        company: 'Elite Family Services',
        companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop',
        location: 'Cairo, Egypt',
        salary: { min: 3500, max: 4500 },
        currency: 'EGP',
        type: 'Full Time',
        experience: '3+ years',
        skills: ['Child Care', 'First Aid', 'Communication', 'Patience'],
        benefits: ['Health Insurance', 'Paid Vacation', 'Transportation', 'Training'],
        description: 'We are looking for an experienced and caring nanny to join our family.',
        requirements: ['Minimum 3 years of experience', 'First Aid certified', 'Valid ID'],
        responsibilities: ['Child supervision', 'Educational activities', 'Meal preparation'],
        postedBy: {
          name: 'Ahmed Family',
          role: 'Employer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop'
        },
        postedAt: '2026-06-25T10:30:00Z',
        applicants: 12,
        matchScore: 92,
        status: 'new',
        isUrgent: true,
        isFeatured: true,
        startDate: '2026-07-15',
        deadline: '2026-07-10',
        contractType: 'Permanent',
        workSchedule: 'Sunday - Thursday, 8AM - 5PM',
        companyInfo: {
          industry: 'Family Services',
          size: '10-50 employees',
          description: 'Leading provider of premium home services'
        },
        applicationStatus: null,
        isSaved: false,
        isApplied: false
      },
      {
        id: 'OFF-2026-002',
        title: 'Elderly Caregiver - Part Time',
        company: 'CarePlus Egypt',
        companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop',
        location: 'Alexandria, Egypt',
        salary: { min: 2800, max: 3600 },
        currency: 'EGP',
        type: 'Part Time',
        experience: '2+ years',
        skills: ['Elderly Care', 'Medication Management', 'Empathy'],
        benefits: ['Flexible Hours', 'Paid Leave', 'Career Growth'],
        description: 'Seeking compassionate caregiver for elderly gentleman with mobility issues.',
        requirements: ['2+ years elderly care experience', 'First Aid certification'],
        responsibilities: ['Daily living assistance', 'Medication reminders', 'Mobility support'],
        postedBy: {
          name: 'Dr. Mohamed',
          role: 'Employer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop'
        },
        postedAt: '2026-06-24T14:20:00Z',
        applicants: 8,
        matchScore: 78,
        status: 'new',
        isUrgent: false,
        isFeatured: false,
        startDate: '2026-07-01',
        deadline: '2026-06-30',
        contractType: 'Contract',
        workSchedule: 'Alternate days, 4 hours/day',
        companyInfo: {
          industry: 'Healthcare',
          size: '50-200 employees',
          description: 'Specialized in home healthcare services'
        },
        applicationStatus: null,
        isSaved: false,
        isApplied: false
      },
      {
        id: 'OFF-2026-003',
        title: 'Private Driver - Full Time',
        company: 'VIP Transport Services',
        companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop',
        location: 'Giza, Egypt',
        salary: { min: 4000, max: 5500 },
        currency: 'EGP',
        type: 'Full Time',
        experience: '5+ years',
        skills: ['Safe Driving', 'Vehicle Maintenance', 'Navigation'],
        benefits: ['Company Car', 'Fuel Allowance', 'Bonus', 'Insurance'],
        description: 'Seeking professional driver for private family.',
        requirements: ['Valid Egyptian driver\'s license', '5+ years experience'],
        responsibilities: ['Transportation of family members', 'Vehicle maintenance'],
        postedBy: {
          name: 'El-Shazly Family',
          role: 'Employer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop'
        },
        postedAt: '2026-06-23T09:15:00Z',
        applicants: 15,
        matchScore: 85,
        status: 'applied',
        isUrgent: true,
        isFeatured: true,
        startDate: '2026-07-10',
        deadline: '2026-07-05',
        contractType: 'Permanent',
        workSchedule: 'Flexible, 6 days/week',
        companyInfo: {
          industry: 'Transportation',
          size: '10-50 employees',
          description: 'Premium private transport services'
        },
        applicationStatus: {
          status: 'pending_review',
          date: '2026-06-24',
          note: 'Application under review'
        },
        isSaved: false,
        isApplied: true
      },
      {
        id: 'OFF-2026-004',
        title: 'Professional Cook - Part Time',
        company: 'Gourmet Home Kitchen',
        companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop',
        location: 'New Cairo, Egypt',
        salary: { min: 3000, max: 4000 },
        currency: 'EGP',
        type: 'Part Time',
        experience: '4+ years',
        skills: ['Cooking', 'Menu Planning', 'Nutrition', 'Food Safety'],
        benefits: ['Meal Allowance', 'Flexible Schedule', 'Training'],
        description: 'Experienced cook needed for private family.',
        requirements: ['4+ years cooking experience', 'Food safety certification'],
        responsibilities: ['Meal preparation', 'Menu planning', 'Kitchen hygiene'],
        postedBy: {
          name: 'Hassan Family',
          role: 'Employer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop'
        },
        postedAt: '2026-06-22T16:45:00Z',
        applicants: 6,
        matchScore: 70,
        status: 'saved',
        isUrgent: false,
        isFeatured: false,
        startDate: '2026-07-20',
        deadline: '2026-07-15',
        contractType: 'Contract',
        workSchedule: '6 days/week, 4 hours/day',
        companyInfo: {
          industry: 'Food Services',
          size: '5-10 employees',
          description: 'Specialized in private home dining'
        },
        applicationStatus: null,
        isSaved: true,
        isApplied: false
      },
      {
        id: 'OFF-2026-005',
        title: 'House Manager - Full Time',
        company: 'Premium Home Solutions',
        companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop',
        location: 'Maadi, Egypt',
        salary: { min: 5000, max: 7000 },
        currency: 'EGP',
        type: 'Full Time',
        experience: '5+ years',
        skills: ['Management', 'Organization', 'Communication'],
        benefits: ['Health Insurance', 'Bonus', 'Paid Leave'],
        description: 'Experienced house manager to oversee daily operations.',
        requirements: ['5+ years house management experience', 'Strong leadership skills'],
        responsibilities: ['Staff supervision', 'Budget management', 'Event planning'],
        postedBy: {
          name: 'El-Gamal Family',
          role: 'Employer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop'
        },
        postedAt: '2026-06-21T11:00:00Z',
        applicants: 9,
        matchScore: 88,
        status: 'interview',
        isUrgent: true,
        isFeatured: true,
        startDate: '2026-07-01',
        deadline: '2026-06-28',
        contractType: 'Permanent',
        workSchedule: 'Sunday - Thursday, 9AM - 6PM',
        companyInfo: {
          industry: 'Property Management',
          size: '20-50 employees',
          description: 'Luxury property management services'
        },
        applicationStatus: {
          status: 'interview_scheduled',
          date: '2026-06-25',
          note: 'Interview scheduled for June 28'
        },
        isSaved: false,
        isApplied: true
      }
    ];

    // If there's a logged-in user, we can personalize offers
    if (currentUser) {
      // You can add user-specific logic here
      // For example, show offers based on user's skills, location, etc.
      return baseOffers.map(offer => {
        // Adjust match score based on user's skills
        if (currentUser.skills) {
          const matchingSkills = offer.skills.filter(skill => 
            currentUser.skills.includes(skill)
          );
          const matchPercentage = Math.round((matchingSkills.length / offer.skills.length) * 100);
          return {
            ...offer,
            matchScore: Math.min(offer.matchScore + (matchPercentage - offer.matchScore) * 0.5, 100)
          };
        }
        return offer;
      });
    }

    return baseOffers;
  };

  // Filter and search
  useEffect(() => {
    let filtered = [...offers];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.title.toLowerCase().includes(searchLower) ||
        offer.company.toLowerCase().includes(searchLower) ||
        offer.location.toLowerCase().includes(searchLower) ||
        offer.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt));
        break;
      case 'salary_high':
        filtered.sort((a, b) => b.salary.max - a.salary.max);
        break;
      case 'salary_low':
        filtered.sort((a, b) => a.salary.min - b.salary.min);
        break;
      case 'popular':
        filtered.sort((a, b) => b.applicants - a.applicants);
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
    const userKey = user ? user.id : 'default';
    let newSaved;
    if (savedOffers.includes(offerId)) {
      newSaved = savedOffers.filter(id => id !== offerId);
    } else {
      newSaved = [...savedOffers, offerId];
    }
    setSavedOffers(newSaved);
    localStorage.setItem(`worker_saved_offers_${userKey}`, JSON.stringify(newSaved));
    
    setOffers(prev => prev.map(offer => 
      offer.id === offerId 
        ? { ...offer, isSaved: !offer.isSaved, status: !offer.isSaved ? 'saved' : 'new' }
        : offer
    ));
  };

  const handleApply = (offerId) => {
    const offer = offers.find(o => o.id === offerId);
    setSelectedOffer(offer);
    setShowApplyModal(true);
  };

  const confirmApply = () => {
    if (selectedOffer) {
      const userKey = user ? user.id : 'default';
      const newApplied = [...appliedOffers, selectedOffer.id];
      setAppliedOffers(newApplied);
      localStorage.setItem(`worker_applied_offers_${userKey}`, JSON.stringify(newApplied));
      
      setOffers(prev => prev.map(offer => 
        offer.id === selectedOffer.id 
          ? { ...offer, isApplied: true, status: 'applied' }
          : offer
      ));
      
      setShowApplyModal(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    }
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
      case 'rejected': return <XCircle size={16} />;
      case 'expired': return <AlertCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusLabel = (status) => {
    return t.filters[status] || status;
  };

  const getApplicationStatusColor = (status) => {
    const colors = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      interview_scheduled: 'bg-indigo-100 text-indigo-800',
      offered: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getApplicationStatusLabel = (status) => {
    const labels = {
      pending_review: 'Pending Review',
      interview_scheduled: 'Interview Scheduled',
      offered: 'Offer Extended',
      rejected: 'Rejected',
      accepted: 'Accepted'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSalary = (salary) => {
    if (salary.min === salary.max) {
      return `${salary.min.toLocaleString()}`;
    }
    return `${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const stats = {
    available: offers.filter(o => o.status === 'new' || o.status === 'saved').length,
    applied: offers.filter(o => o.status === 'applied').length,
    saved: savedOffers.length,
    interviews: offers.filter(o => o.status === 'interview' || o.status === 'offered').length
  };

  // Redirect if no user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg max-w-md">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800">{t.applyModal.success}</h4>
                <p className="text-sm text-green-600">{t.applyModal.note}</p>
              </div>
              <button 
                onClick={() => setShowSuccessToast(false)}
                className="text-green-500 hover:text-green-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Same as Dashboard */}
      <WorkerSidebar
        language={language}
        toggleLanguage={toggleLanguage}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        {/* Top Header Bar */}
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
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
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

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {/* Page Header with dynamic user name */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-red-100 mt-1">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-100">
                  {t.welcome}, {user?.fullName || 'Worker'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
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

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search offers by title, company, or skills...' : 'ابحث عن عروض حسب العنوان أو الشركة أو المهارات...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-700"
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
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-700"
                >
                  <option value="newest">{t.sort.newest}</option>
                  <option value="oldest">{t.sort.oldest}</option>
                  <option value="salary_high">{t.sort.salary_high}</option>
                  <option value="salary_low">{t.sort.salary_low}</option>
                  <option value="popular">{t.sort.popular}</option>
                  <option value="nearby">{t.sort.nearby}</option>
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

          {/* Offers Grid/List */}
          {filteredOffers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.empty.title}</h3>
              <p className="text-gray-500">{t.empty.description}</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSortBy('newest');
                }}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {t.empty.reset}
              </button>
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
                        src={offer.companyLogo}
                        alt={offer.company}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
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
                            {offer.status === 'new' && !offer.isSaved && !offer.isApplied && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {t.card.new}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Match Score */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
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

                        {/* Key Info */}
                        <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{offer.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <DollarSign size={14} className="text-gray-400 flex-shrink-0" />
                            <span>EGP {formatSalary(offer.salary)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
                            <span>{offer.type}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock size={14} className="text-gray-400 flex-shrink-0" />
                            <span>{formatDate(offer.postedAt)}</span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(offer.status)}`}>
                            {getStatusIcon(offer.status)}
                            {getStatusLabel(offer.status)}
                          </span>
                          {offer.applicationStatus && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(offer.applicationStatus.status)}`}>
                              {getApplicationStatusLabel(offer.applicationStatus.status)}
                            </span>
                          )}
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
                          <span className="text-xs text-gray-400">{offer.applicants} {t.card.applicants}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => toggleExpand(offer.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                          >
                            <Eye size={16} />
                            {t.card.viewDetails}
                          </button>
                          {!offer.isApplied && offer.status !== 'offered' && offer.status !== 'rejected' && offer.status !== 'expired' && (
                            <button
                              onClick={() => handleApply(offer.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                            >
                              <BriefcaseIcon size={14} />
                              {t.card.applyNow}
                            </button>
                          )}
                          {offer.isApplied && (
                            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle size={16} />
                              {t.actions.applied}
                            </span>
                          )}
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
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedOffer === offer.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">{t.details.about}</h4>
                            <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
                            
                            <h5 className="font-semibold text-gray-700 mb-1 text-sm">{t.details.requirements}</h5>
                            <ul className="text-sm text-gray-600 space-y-0.5 list-disc list-inside mb-3">
                              {offer.requirements.map((req, idx) => (
                                <li key={idx}>{req}</li>
                              ))}
                            </ul>

                            <h5 className="font-semibold text-gray-700 mb-1 text-sm">{t.details.responsibilities}</h5>
                            <ul className="text-sm text-gray-600 space-y-0.5 list-disc list-inside">
                              {offer.responsibilities.map((resp, idx) => (
                                <li key={idx}>{resp}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">{t.details.benefits}</h4>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {offer.benefits.map((benefit, idx) => (
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
                                <span className="font-medium">{new Date(offer.startDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">{t.details.applicationDeadline}</span>
                                <span className="font-medium text-red-600">{new Date(offer.deadline).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <h5 className="font-semibold text-gray-700 text-sm mb-1">{t.details.company}</h5>
                              <p className="text-sm text-gray-600">{offer.companyInfo.description}</p>
                              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                <span>{offer.companyInfo.industry}</span>
                                <span>•</span>
                                <span>{offer.companyInfo.size}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {!offer.isApplied && offer.status !== 'offered' && offer.status !== 'rejected' && offer.status !== 'expired' && (
                            <button
                              onClick={() => handleApply(offer.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <BriefcaseIcon size={18} />
                              {t.actions.apply}
                            </button>
                          )}
                          {offer.isApplied && (
                            <span className="bg-green-100 text-green-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                              <CheckCircle size={18} />
                              {t.actions.applied}
                            </span>
                          )}
                          <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
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
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
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

          {/* Load More */}
          {filteredOffers.length > 0 && filteredOffers.length < offers.length && (
            <div className="mt-6 text-center">
              <button className="px-8 py-3 border border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-600 rounded-lg font-medium transition-colors">
                {t.actions.loadMore}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Apply Modal */}
      {showApplyModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BriefcaseIcon size={28} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t.applyModal.title}</h3>
              <p className="text-gray-600 mb-1">{t.applyModal.message}</p>
              <p className="text-sm text-gray-500 mt-2">{t.applyModal.note}</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                <p className="font-medium text-gray-800">{selectedOffer.title}</p>
                <p className="text-sm text-gray-500">{selectedOffer.company}</p>
                <p className="text-sm text-gray-500">EGP {formatSalary(selectedOffer.salary)}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={confirmApply}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsUp size={18} />
                {t.actions.confirmApply}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default WorkerOffers;