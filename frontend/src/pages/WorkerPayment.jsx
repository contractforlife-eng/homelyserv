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
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Wallet,
  Building,
  Phone,
  Save,
  Edit,
  RefreshCw
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
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/payment' },
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

// Main WorkerPayment Component
const WorkerPayment = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
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
      noPaymentsDesc: 'Your payment history will appear here once you complete tasks'
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
      noPaymentsDesc: 'سيظهر سجل مدفوعاتك هنا بمجرد إكمال المهام'
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
        console.log('✅ User loaded in Payment page:', parsedUser.fullName);
        
        const savedPaymentInfo = localStorage.getItem(`worker_payment_info_${parsedUser.id}`);
        if (savedPaymentInfo) {
          setWorkerPaymentInfo(JSON.parse(savedPaymentInfo));
        }
        
        const savedStats = localStorage.getItem(`worker_stats_${parsedUser.id}`);
        if (savedStats) {
          setWorkerStats(JSON.parse(savedStats));
        } else {
          const defaultStats = {
            totalTasksCompleted: 0,
            totalEarned: 0,
            hourlyRate: parsedUser.hourlyRate || 35,
            monthlySalary: 0
          };
          setWorkerStats(defaultStats);
          localStorage.setItem(`worker_stats_${parsedUser.id}`, JSON.stringify(defaultStats));
        }
        
        const savedPayments = localStorage.getItem(`worker_payments_${parsedUser.id}`);
        if (savedPayments) {
          setPayments(JSON.parse(savedPayments));
          setFilteredPayments(JSON.parse(savedPayments));
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    } else {
      console.log('❌ No user data found');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
    setLoading(false);
  }, []);

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

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setWorkerPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePaymentInfo = () => {
    if (user) {
      localStorage.setItem(`worker_payment_info_${user.id}`, JSON.stringify(workerPaymentInfo));
      setIsEditingPaymentInfo(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'failed': return <X size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const formatCurrency = (amount) => {
    return `EGP ${amount?.toLocaleString() || 0}`;
  };

  const stats = {
    totalEarned: workerStats.totalEarned || 0,
    tasksCompleted: workerStats.totalTasksCompleted || 0,
    hourlyRate: workerStats.hourlyRate || user?.hourlyRate || 0,
    monthlySalary: workerStats.monthlySalary || 0
  };

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
          <p className="mt-4 text-gray-600">Please login to view your payments</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Go to Login
          </button>
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
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-red-100 mt-1">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-100">
                  {user?.fullName || 'Worker'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.totalEarned}</p>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalEarned)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.tasksCompleted}</p>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.tasksCompleted}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.hourlyRate}</p>
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">EGP {stats.hourlyRate}/hr</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.monthlySalary}</p>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Wallet size={20} className="text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.monthlySalary)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{t.paymentInfo.title}</h3>
              {!isEditingPaymentInfo ? (
                <button
                  onClick={() => setIsEditingPaymentInfo(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                >
                  {t.paymentInfo.edit}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingPaymentInfo(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    {t.paymentInfo.cancel}
                  </button>
                  <button
                    onClick={handleSavePaymentInfo}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                  >
                    {t.paymentInfo.save}
                  </button>
                </div>
              )}
            </div>

            {saveSuccess && (
              <div className="p-3 bg-green-50 border-b border-green-200 text-green-700 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {t.paymentInfo.saved}
              </div>
            )}

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentInfo.walletNumber}</label>
                  <div className="relative">
                    <Wallet size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="walletNumber"
                      value={workerPaymentInfo.walletNumber || ''}
                      onChange={handlePaymentInfoChange}
                      disabled={!isEditingPaymentInfo}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isEditingPaymentInfo ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}
                      placeholder="Enter wallet number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentInfo.instapayNumber}</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="instapayNumber"
                      value={workerPaymentInfo.instapayNumber || ''}
                      onChange={handlePaymentInfoChange}
                      disabled={!isEditingPaymentInfo}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isEditingPaymentInfo ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}
                      placeholder="Enter InstaPay number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentInfo.bankAccount}</label>
                  <div className="relative">
                    <Building size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={workerPaymentInfo.bankAccountNumber || ''}
                      onChange={handlePaymentInfoChange}
                      disabled={!isEditingPaymentInfo}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isEditingPaymentInfo ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}
                      placeholder="Enter bank account number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentInfo.bankName}</label>
                  <div className="relative">
                    <Building size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="bankName"
                      value={workerPaymentInfo.bankName || ''}
                      onChange={handlePaymentInfoChange}
                      disabled={!isEditingPaymentInfo}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isEditingPaymentInfo ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}
                      placeholder="Enter bank name"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.paymentInfo.accountHolder}</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="accountHolderName"
                      value={workerPaymentInfo.accountHolderName || ''}
                      onChange={handlePaymentInfoChange}
                      disabled={!isEditingPaymentInfo}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isEditingPaymentInfo ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}
                      placeholder="Enter account holder name"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{t.paymentHistory.title}</h3>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.paymentHistory.searchPlaceholder}
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
                    <option value="completed">{t.filters.completed}</option>
                    <option value="pending">{t.filters.pending}</option>
                    <option value="failed">{t.filters.failed}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{filteredPayments.length}</span> payments
              </p>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noPayments}</h3>
                <p className="text-gray-500">{t.noPaymentsDesc}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.paymentHistory.id}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.paymentHistory.employer}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.paymentHistory.employerId}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.paymentHistory.passportNumber}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.paymentHistory.amount}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.paymentHistory.date}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.paymentHistory.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">{payment.id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{payment.employer?.name}</p>
                            <p className="text-xs text-gray-500">{payment.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{payment.employer?.id || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{payment.employer?.passportNumber || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{payment.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(payment.status)}`}>
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerPayment;