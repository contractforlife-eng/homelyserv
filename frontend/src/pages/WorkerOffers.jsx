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
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  AlertTriangle
} from 'lucide-react';

// Sidebar Component
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
  ];

  const isActive = (path) => {
    return location.pathname === path;
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
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/worker-dashboard" className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
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

        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-red-600" />
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
        applicationStatus: 'Application Status'
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
        reset: 'Reset Filters'
      },
      loading: 'Loading offers...',
      languageToggle: 'العربية',
      switchToList: 'List View',
      switchToGrid: 'Grid View',
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
        applicationStatus: 'حالة التقديم'
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
        reset: 'إعادة تعيين الفلاتر'
      },
      loading: 'جاري تحميل العروض...',
      languageToggle: 'English',
      switchToList: 'عرض القائمة',
      switchToGrid: 'عرض الشبكة',
      welcome: 'مرحباً بعودتك',
      notifications: 'الإشعارات'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('✅ User loaded:', parsedUser.fullName);
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

  // Fetch offers - SIMPLIFIED
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        // Simple demo data - no complex logic
        const demoOffers = [
          {
            id: 'OFF-2026-001',
            title: 'Senior Nanny - Full Time',
            company: 'Elite Family Services',
            companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop',
            location: 'Cairo, Egypt',
            salary: { min: 3500, max: 4500 },
            type: 'Full Time',
            skills: ['Child Care', 'First Aid', 'Communication'],
            benefits: ['Health Insurance', 'Paid Vacation'],
            description: 'Experienced nanny needed for a loving family.',
            requirements: ['3+ years experience', 'First Aid certified'],
            responsibilities: ['Child supervision', 'Meal preparation'],
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
              description: 'Premium home services provider'
            },
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
            type: 'Part Time',
            skills: ['Elderly Care', 'Medication Management'],
            benefits: ['Flexible Hours', 'Paid Leave'],
            description: 'Compassionate caregiver needed for elderly gentleman.',
            requirements: ['2+ years experience', 'First Aid certification'],
            responsibilities: ['Daily living assistance', 'Medication reminders'],
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
              description: 'Home healthcare services'
            },
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
            type: 'Full Time',
            skills: ['Safe Driving', 'Vehicle Maintenance'],
            benefits: ['Company Car', 'Fuel Allowance'],
            description: 'Professional driver needed for private family.',
            requirements: ['Valid license', '5+ years experience'],
            responsibilities: ['Transportation', 'Vehicle maintenance'],
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
              description: 'Premium transport services'
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
            type: 'Part Time',
            skills: ['Cooking', 'Menu Planning', 'Food Safety'],
            benefits: ['Meal Allowance', 'Flexible Schedule'],
            description: 'Experienced cook needed for private family.',
            requirements: ['4+ years experience', 'Food safety certification'],
            responsibilities: ['Meal preparation', 'Menu planning'],
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
              description: 'Private home dining'
            },
            isSaved: true,
            isApplied: false
          }
        ];

        // Merge saved and applied status
        const mergedOffers = demoOffers.map(offer => ({
          ...offer,
          isSaved: savedOffers.includes(offer.id),
          isApplied: appliedOffers.includes(offer.id)
        }));

        console.log('✅ Offers loaded:', mergedOffers.length);
        setOffers(mergedOffers);
        setFilteredOffers(mergedOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [savedOffers, appliedOffers]);

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
        offer.location.toLowerCase().includes(searchLower)
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        break;
      case 'salary_high':
        filtered.sort((a, b) => b.salary.max - a.salary.max);
        break;
      case 'salary_low':
        filtered.sort((a, b) => a.salary.min - b.salary.min);
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
      case 'rejected': return <XCircle size={16} />;
      case 'expired': return <AlertCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusLabel = (status) => {
    return t.filters[status] || status;
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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offers...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <WorkerSidebar
        language={language}
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

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {/* Page Header */}
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
                  placeholder={language === 'en' ? 'Search offers...' : 'ابحث عن عروض...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
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
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="newest">{t.sort.newest}</option>
                  <option value="salary_high">{t.sort.salary_high}</option>
                  <option value="salary_low">{t.sort.salary_low}</option>
                  <option value="popular">{t.sort.popular}</option>
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

          {/* Offers Grid */}
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
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                {t.empty.reset}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <div className="p-4">
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

                        {/* Status Badges */}
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