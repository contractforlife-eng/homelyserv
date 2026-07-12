// src/pages/WorkerPayment.jsx - نسخة تعمل دائماً مع البيانات المحلية
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
  Globe,
  X,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  Search,
  Wallet,
  Building,
  Phone,
  RefreshCw,
  Shield,
  LogIn
} from 'lucide-react';

// ============================================
// 1. SIDEBAR COMPONENT
// ============================================
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed ? (
            <Link to="/worker-dashboard" className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className="text-amber-500" />
                <Home size={14} className="text-amber-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          ) : (
            <Link to="/worker-dashboard" className="relative mx-auto">
              <Shield size={28} className="text-amber-500" />
              <Home size={14} className="text-amber-300 absolute -bottom-1 -right-1" />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            aria-label="Close Menu"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Profile */}
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

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)] custom-scrollbar">
          {!sidebarCollapsed ? (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.overview}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">•</div>
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
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {t.logout}
              </div>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
};

// ============================================
// 2. MAIN COMPONENT - WorkerPayment
// ============================================
const WorkerPayment = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // States for data
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Payment info form
  const [workerPaymentInfo, setWorkerPaymentInfo] = useState({
    walletNumber: '',
    instapayNumber: '',
    bankAccountNumber: '',
    bankName: '',
    accountHolderName: ''
  });
  const [isEditingPaymentInfo, setIsEditingPaymentInfo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [workerStats, setWorkerStats] = useState({
    totalTasksCompleted: 0,
    totalEarned: 0,
    hourlyRate: 0,
    monthlySalary: 0
  });

  // ============================================
  // 3. TRANSLATIONS
  // ============================================
  const translations = {
    en: {
      title: 'Payments',
      subtitle: 'Manage your payments and payment information',
      stats: {
        totalEarned: 'Total Earned',
        tasksCompleted: 'Tasks Completed',
        hourlyRate: 'Hourly Rate',
        monthlySalary: 'Monthly Salary'
      },
      paymentInfo: {
        title: 'Payment Information',
        walletNumber: 'Wallet Number',
        instapayNumber: 'InstaPay Number',
        bankAccount: 'Bank Account Number',
        bankName: 'Bank Name',
        accountHolder: 'Account Holder Name',
        edit: 'Edit Payment Info',
        save: 'Save Changes',
        cancel: 'Cancel',
        saved: 'Payment information updated successfully!'
      },
      paymentHistory: {
        title: 'Payment History',
        id: 'Transaction ID',
        employer: 'Employer',
        amount: 'Amount',
        date: 'Date',
        status: 'Status',
        description: 'Description',
        noResults: 'No payments found',
        searchPlaceholder: 'Search payments...',
        employerId: 'Employer ID',
        passportNumber: 'Passport Number'
      },
      status: {
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed'
      },
      filters: {
        all: 'All Payments',
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading payment data...',
      noPayments: 'No payment history yet',
      noPaymentsDesc: 'Your payment history will appear here once you complete tasks',
      refresh: 'Refresh'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة مدفوعاتك ومعلومات الدفع',
      stats: {
        totalEarned: 'إجمالي المكاسب',
        tasksCompleted: 'المهام المكتملة',
        hourlyRate: 'السعر بالساعة',
        monthlySalary: 'الراتب الشهري'
      },
      paymentInfo: {
        title: 'معلومات الدفع',
        walletNumber: 'رقم المحفظة',
        instapayNumber: 'رقم InstaPay',
        bankAccount: 'رقم الحساب البنكي',
        bankName: 'اسم البنك',
        accountHolder: 'اسم صاحب الحساب',
        edit: 'تعديل معلومات الدفع',
        save: 'حفظ التغييرات',
        cancel: 'إلغاء',
        saved: 'تم تحديث معلومات الدفع بنجاح!'
      },
      paymentHistory: {
        title: 'سجل المدفوعات',
        id: 'رقم المعاملة',
        employer: 'صاحب العمل',
        amount: 'المبلغ',
        date: 'التاريخ',
        status: 'الحالة',
        description: 'الوصف',
        noResults: 'لا توجد مدفوعات',
        searchPlaceholder: 'ابحث عن مدفوعات...',
        employerId: 'معرف صاحب العمل',
        passportNumber: 'رقم جواز السفر'
      },
      status: {
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة'
      },
      filters: {
        all: 'جميع المدفوعات',
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل بيانات الدفع...',
      noPayments: 'لا يوجد سجل مدفوعات بعد',
      noPaymentsDesc: 'سيظهر سجل مدفوعاتك هنا بمجرد إكمال المهام',
      refresh: 'تحديث'
    }
  };

  const t = translations[language];

  // ============================================
  // 4. DATA LOADING FUNCTIONS - باستخدام البيانات المحلية فقط
  // ============================================
  const loadPaymentData = () => {
    if (!user) return;
    
    setLoading(true);

    try {
      // تحميل معلومات الدفع
      const savedPaymentInfo = localStorage.getItem(`worker_payment_info_${user.id}`);
      if (savedPaymentInfo) {
        setWorkerPaymentInfo(JSON.parse(savedPaymentInfo));
      }

      // تحميل المهام المكتملة
      const appliedOffers = JSON.parse(localStorage.getItem('worker_applied_offers') || '[]');
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      
      const completedTasks = appliedOffers.filter(id => {
        return employerOffers.some(o => o.id === id && o.status === 'completed');
      }).length;

      // تحميل المدفوعات
      const savedPayments = JSON.parse(localStorage.getItem(`worker_payments_${user.id}`) || '[]');
      const totalEarned = savedPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const hourlyRate = user.hourlyRate || 35;
      const monthlySalary = completedTasks > 0 ? hourlyRate * 160 : 0;

      setWorkerStats({
        totalTasksCompleted: completedTasks,
        totalEarned: totalEarned,
        hourlyRate: hourlyRate,
        monthlySalary: monthlySalary
      });

      if (savedPayments.length > 0) {
        setPayments(savedPayments);
        setFilteredPayments(savedPayments);
      } else {
        // إنشاء مدفوعات افتراضية من المهام المكتملة
        const generatedPayments = generatePaymentsFromCompletedTasks(appliedOffers, employerOffers);
        if (generatedPayments.length > 0) {
          setPayments(generatedPayments);
          setFilteredPayments(generatedPayments);
          localStorage.setItem(`worker_payments_${user.id}`, JSON.stringify(generatedPayments));
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentsFromCompletedTasks = (appliedOffers, employerOffers) => {
    const generatedPayments = [];
    const completedOfferIds = appliedOffers.filter(id => {
      return employerOffers.some(o => o.id === id && o.status === 'completed');
    });

    completedOfferIds.forEach((offerId, index) => {
      const offer = employerOffers.find(o => o.id === offerId);
      if (offer) {
        generatedPayments.push({
          id: `PAY-${Date.now()}-${index}`,
          employer: {
            name: offer.company || 'Unknown Employer',
            id: offer.employerId || 'EMP-001',
            passportNumber: offer.employerPassport || 'N/A'
          },
          amount: (offer.salary?.max || 3500) / 2,
          date: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(
            language === 'ar' ? 'ar-EG' : 'en-US',
            { year: 'numeric', month: 'short', day: 'numeric' }
          ),
          status: 'completed',
          description: `Payment for ${offer.title || 'service'}`
        });
      }
    });

    return generatedPayments;
  };

  // ============================================
  // 5. EFFECTS
  // ============================================
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
        if (profiles[parsedUser.email]) {
          parsedUser.profileImage = profiles[parsedUser.email].profileImage || null;
        }
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPaymentData();
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let filtered = payments;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.id?.toLowerCase().includes(searchLower) ||
        p.employer?.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  // ============================================
  // 6. HANDLERS
  // ============================================
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    navigate('/login');
  };

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setWorkerPaymentInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePaymentInfo = () => {
    if (user) {
      localStorage.setItem(`worker_payment_info_${user.id}`, JSON.stringify(workerPaymentInfo));
      setIsEditingPaymentInfo(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleRefresh = () => {
    loadPaymentData();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      failed: 'bg-red-100 text-red-800 border border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'failed': return <X size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const formatCurrency = (amount) => `EGP ${amount?.toLocaleString() || 0}`;

  const stats = {
    totalEarned: workerStats.totalEarned || 0,
    tasksCompleted: workerStats.totalTasksCompleted || 0,
    hourlyRate: workerStats.hourlyRate || user?.hourlyRate || 0,
    monthlySalary: workerStats.monthlySalary || 0
  };

  const userProfileImage = user?.profileImage || null;

  // ============================================
  // 7. RENDER - LOADING STATE
  // ============================================
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

  // ============================================
  // 8. RENDER - USER NOT FOUND
  // ============================================
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">Please login to view your payments</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // 9. RENDER - MAIN COMPONENT
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                aria-label="Open Menu"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.title}</h2>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 overflow-hidden border-2 border-amber-200 shadow-sm">
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
              
              <button aria-label="Notifications" className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border border-white"></span>
              </button>
              
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Globe size={16} />
                <span className="hidden sm:inline">{t.languageToggle}</span>
              </button>
              
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">{t.refresh}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-6 md:p-8 mb-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex-shrink-0 shadow-inner">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
                      alt={user.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-white m-3" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
                  <p className="text-white/80 mt-1 text-sm md:text-base">{t.subtitle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: t.stats.totalEarned, value: formatCurrency(stats.totalEarned), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: t.stats.tasksCompleted, value: stats.tasksCompleted, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: t.stats.hourlyRate, value: `EGP ${stats.hourlyRate}/hr`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: t.stats.monthlySalary, value: formatCurrency(stats.monthlySalary), icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Payment Information Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard size={20} className="text-amber-500" />
                {t.paymentInfo.title}
              </h3>
              {!isEditingPaymentInfo ? (
                <button
                  onClick={() => setIsEditingPaymentInfo(true)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-amber-600 transition-colors shadow-sm w-full sm:w-auto"
                >
                  {t.paymentInfo.edit}
                </button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsEditingPaymentInfo(false)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t.paymentInfo.cancel}
                  </button>
                  <button
                    onClick={handleSavePaymentInfo}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition-shadow"
                  >
                    {t.paymentInfo.save}
                  </button>
                </div>
              )}
            </div>

            {saveSuccess && (
              <div className="px-6 py-3 bg-green-50/80 border-b border-green-100 text-green-700 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {t.paymentInfo.saved}
              </div>
            )}

            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {[
                  { label: t.paymentInfo.walletNumber, name: 'walletNumber', icon: Wallet, placeholder: '01xxxxxxxxx' },
                  { label: t.paymentInfo.instapayNumber, name: 'instapayNumber', icon: Phone, placeholder: 'username@instapay' },
                  { label: t.paymentInfo.bankAccount, name: 'bankAccountNumber', icon: Building, placeholder: 'EGxx xxxx xxxx' },
                  { label: t.paymentInfo.bankName, name: 'bankName', icon: Building, placeholder: 'Bank Name' }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                    <div className="relative">
                      <field.icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name={field.name}
                        value={workerPaymentInfo[field.name] || ''}
                        onChange={handlePaymentInfoChange}
                        disabled={!isEditingPaymentInfo}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors ${
                          isEditingPaymentInfo 
                            ? 'border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white' 
                            : 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed'
                        }`}
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.paymentInfo.accountHolder}</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="accountHolderName"
                      value={workerPaymentInfo.accountHolderName || ''}
                      onChange={handlePaymentInfoChange}
                      disabled={!isEditingPaymentInfo}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors ${
                        isEditingPaymentInfo 
                          ? 'border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white' 
                          : 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed'
                      }`}
                      placeholder="Full Name as in Bank"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800">{t.paymentHistory.title}</h3>
            </div>

            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.paymentHistory.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
                  />
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-gray-700 cursor-pointer"
                  >
                    <option value="all">{t.filters.all}</option>
                    <option value="completed">{t.filters.completed}</option>
                    <option value="pending">{t.filters.pending}</option>
                    <option value="failed">{t.filters.failed}</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.noPayments}</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">{t.noPaymentsDesc}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.paymentHistory.id}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.paymentHistory.employer}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.paymentHistory.amount}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.paymentHistory.date}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.paymentHistory.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{payment.id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{payment.employer?.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{payment.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {t.status[payment.status] || payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
              Showing {filteredPayments.length} results
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default WorkerPayment;