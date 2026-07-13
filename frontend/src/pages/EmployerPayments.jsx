// src/pages/EmployerPayments.jsx - النسخة الكاملة المعدلة
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Briefcase,
  DollarSign,
  MapPin,
  Star,
  CheckCircle,
  CreditCard,
  Wallet,
  Building2,
  Shield,
  Home,
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
  FileCheck,
  Search,
  AlertTriangle,
  UserCheck,
  Calendar,
  Clock,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  Receipt,
  Copy,
  ChevronDown,
  Users,
  BarChart3,
  Phone,
  Mail
} from 'lucide-react';

// ============================================================
// EMPLOYER SIDEBAR COMPONENT
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
      overview: 'Overview'
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
      overview: 'نظرة عامة'
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
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/employer-payments' }
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
                <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
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
// MAIN EMPLOYER PAYMENTS COMPONENT
// ============================================================
const EmployerPayments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingCount: 0,
    completedCount: 0,
    upcomingCount: 0,
    totalWorkers: 0,
    monthlyAverage: 0
  });

  const translations = {
    en: {
      title: 'Payments',
      subtitle: 'Manage all your payments to workers',
      stats: {
        totalPaid: 'Total Paid',
        pending: 'Pending',
        completed: 'Completed',
        upcoming: 'Upcoming',
        workers: 'Workers Paid',
        monthlyAverage: 'Monthly Avg'
      },
      status: {
        completed: 'Completed',
        pending: 'Pending',
        upcoming: 'Upcoming',
        failed: 'Failed',
        processing: 'Processing'
      },
      table: {
        id: 'Payment ID',
        worker: 'Worker',
        job: 'Job',
        amount: 'Amount',
        date: 'Date',
        status: 'Status',
        actions: 'Actions'
      },
      modal: {
        title: 'Payment Details',
        paymentId: 'Payment ID',
        worker: 'Worker',
        job: 'Job Title',
        amount: 'Amount',
        date: 'Date',
        status: 'Status',
        method: 'Payment Method',
        description: 'Description',
        reference: 'Reference',
        receipt: 'Download Receipt',
        close: 'Close',
        copyId: 'Copy ID',
        workerEmail: 'Worker Email',
        workerPhone: 'Worker Phone'
      },
      actions: {
        view: 'View Details',
        download: 'Download Receipt',
        payNow: 'Pay Now'
      },
      empty: {
        title: 'No payments found',
        description: 'You haven\'t made any payments yet',
        start: 'Hire a worker to get started'
      },
      filters: {
        all: 'All Payments',
        completed: 'Completed',
        pending: 'Pending',
        upcoming: 'Upcoming',
        failed: 'Failed'
      },
      loading: 'Loading payment history...',
      error: 'Error loading payments. Please try again.',
      retry: 'Retry',
      languageToggle: 'العربية',
      searchPlaceholder: 'Search by worker name, job title, or payment ID...',
      noResults: 'No payments match your search',
      clearFilters: 'Clear filters',
      copySuccess: 'Copied to clipboard!',
      redirectingToPayment: 'Redirecting to payment options...',
      refresh: 'Refresh'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة جميع مدفوعاتك للعمال',
      stats: {
        totalPaid: 'إجمالي المدفوع',
        pending: 'معلقة',
        completed: 'مكتملة',
        upcoming: 'قادمة',
        workers: 'عدد العمال',
        monthlyAverage: 'المتوسط الشهري'
      },
      status: {
        completed: 'مكتملة',
        pending: 'معلقة',
        upcoming: 'قادمة',
        failed: 'فاشلة',
        processing: 'قيد المعالجة'
      },
      table: {
        id: 'رقم الدفع',
        worker: 'العامل',
        job: 'الوظيفة',
        amount: 'المبلغ',
        date: 'التاريخ',
        status: 'الحالة',
        actions: 'الإجراءات'
      },
      modal: {
        title: 'تفاصيل الدفع',
        paymentId: 'رقم الدفع',
        worker: 'العامل',
        job: 'عنوان الوظيفة',
        amount: 'المبلغ',
        date: 'التاريخ',
        status: 'الحالة',
        method: 'طريقة الدفع',
        description: 'الوصف',
        reference: 'المرجع',
        receipt: 'تحميل الإيصال',
        close: 'إغلاق',
        copyId: 'نسخ الرقم',
        workerEmail: 'بريد العامل',
        workerPhone: 'هاتف العامل'
      },
      actions: {
        view: 'عرض التفاصيل',
        download: 'تحميل الإيصال',
        payNow: 'ادفع الآن'
      },
      empty: {
        title: 'لا توجد مدفوعات',
        description: 'لم تقم بأي مدفوعات بعد',
        start: 'قم بتوظيف عامل للبدء'
      },
      filters: {
        all: 'جميع المدفوعات',
        completed: 'مكتملة',
        pending: 'معلقة',
        upcoming: 'قادمة',
        failed: 'فاشلة'
      },
      loading: 'جاري تحميل سجل المدفوعات...',
      error: 'حدث خطأ في تحميل المدفوعات. يرجى المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      languageToggle: 'English',
      searchPlaceholder: 'ابحث باسم العامل أو عنوان الوظيفة أو رقم الدفع...',
      noResults: 'لا توجد مدفوعات تطابق بحثك',
      clearFilters: 'مسح التصفيات',
      copySuccess: 'تم النسخ إلى الحافظة!',
      redirectingToPayment: 'جاري التوجيه إلى خيارات الدفع...',
      refresh: 'تحديث'
    }
  };

  const t = translations[language];

  // ============================================================
  // toggleSidebar - تبديل حالة الشريط الجانبي
  // ============================================================
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  // ============================================================
  // savePaymentToAllStores - حفظ الدفع في جميع الأماكن
  // ============================================================
  const savePaymentToAllStores = (paymentData) => {
    try {
      // 1. حفظ في all_payments (المصدر الرئيسي)
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      // التأكد من عدم وجود مفتاح مكرر
      const exists = allPayments.some(p => p.id === paymentData.id);
      if (!exists) {
        allPayments.push(paymentData);
        localStorage.setItem('all_payments', JSON.stringify(allPayments));
        console.log('✅ Payment saved to all_payments:', paymentData.id);
      }

      // 2. حفظ في employer_payments
      const employerPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
      const existsEmployer = employerPayments.some(p => p.id === paymentData.id);
      if (!existsEmployer) {
        employerPayments.push(paymentData);
        localStorage.setItem('employer_payments', JSON.stringify(employerPayments));
        console.log('✅ Payment saved to employer_payments:', paymentData.id);
      }

      // 3. حفظ في worker_payments (إذا كان هناك عامل)
      if (paymentData.workerId || paymentData.workerEmail) {
        const workerId = paymentData.workerId || paymentData.workerEmail;
        const workerPayments = JSON.parse(localStorage.getItem(`worker_payments_${workerId}`) || '[]');
        const existsWorker = workerPayments.some(p => p.id === paymentData.id);
        if (!existsWorker) {
          workerPayments.push(paymentData);
          localStorage.setItem(`worker_payments_${workerId}`, JSON.stringify(workerPayments));
          console.log('✅ Payment saved to worker_payments:', paymentData.id);
        }
      }

      // 4. حفظ في admin_payments
      const adminPayments = JSON.parse(localStorage.getItem('admin_payments') || '[]');
      const existsAdmin = adminPayments.some(p => p.id === paymentData.id);
      if (!existsAdmin) {
        adminPayments.push(paymentData);
        localStorage.setItem('admin_payments', JSON.stringify(adminPayments));
        console.log('✅ Payment saved to admin_payments:', paymentData.id);
      }

      // 5. تحديث الصفحة الحالية
      loadPaymentsFromLocalStorage();
      
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  // ============================================================
  // Load payments from localStorage
  // ============================================================
  const loadPaymentsFromLocalStorage = () => {
    setLoading(true);
    
    try {
      let allPayments = [];
      const seenIds = new Set();
      
      // 1. Load from all_payments (main source)
      const allPaymentsData = localStorage.getItem('all_payments');
      if (allPaymentsData) {
        try {
          const parsed = JSON.parse(allPaymentsData);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              if (!seenIds.has(p.id)) {
                allPayments.push(p);
                seenIds.add(p.id);
              }
            });
            console.log('📋 Loaded from all_payments:', parsed.length);
          }
        } catch (e) {
          console.error('Error parsing all_payments:', e);
        }
      }
      
      // 2. Load from employer_payments (backup)
      const employerPaymentsData = localStorage.getItem('employer_payments');
      if (employerPaymentsData) {
        try {
          const parsed = JSON.parse(employerPaymentsData);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              if (!seenIds.has(p.id)) {
                allPayments.push(p);
                seenIds.add(p.id);
              }
            });
            console.log('📋 Loaded from employer_payments:', parsed.length);
          }
        } catch (e) {
          console.error('Error parsing employer_payments:', e);
        }
      }
      
      // 3. Check for quick hire data (pending payment)
      const quickHireData = localStorage.getItem('homelyserv_quick_hire_data');
      if (quickHireData) {
        try {
          const parsed = JSON.parse(quickHireData);
          if (!seenIds.has(parsed.id)) {
            allPayments.push(parsed);
            seenIds.add(parsed.id);
            console.log('📋 Loaded quick hire data:', parsed.id);
          }
        } catch (e) {
          console.error('Error parsing quick hire data:', e);
        }
      }
      
      console.log('📋 Total payments loaded:', allPayments.length);
      
      setPayments(allPayments);
      setFilteredPayments(allPayments);
      
      // Calculate stats
      const totalPaid = allPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const pendingCount = allPayments
        .filter(p => p.status === 'pending' || p.status === 'pending_verification')
        .length;
      
      const completedCount = allPayments
        .filter(p => p.status === 'completed')
        .length;
      
      setStats({
        totalPaid: totalPaid,
        pendingCount: pendingCount,
        completedCount: completedCount,
        upcomingCount: 0,
        totalWorkers: allPayments.length,
        monthlyAverage: allPayments.length > 0 ? Math.round(totalPaid / Math.max(allPayments.length, 1)) : 0
      });
      
    } catch (error) {
      console.error('Error loading payments from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Load user and payments on mount
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
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
      return;
    }

    const sidebarState = localStorage.getItem('employer_sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }

    loadPaymentsFromLocalStorage();
    
  }, [navigate]);

  // ============================================================
  // Handle Quick Hire Data from Navigation State
  // ============================================================
  useEffect(() => {
    let quickHireData = location.state?.quickHireData;
    
    if (quickHireData) {
      console.log('📋 Quick hire data received from state:', quickHireData);
      
      // التأكد من عدم وجود مفتاح مكرر
      setPayments(prev => {
        const exists = prev.some(p => p.id === quickHireData.id);
        if (!exists) {
          return [quickHireData, ...prev];
        }
        return prev;
      });
      
      setFilteredPayments(prev => {
        const exists = prev.some(p => p.id === quickHireData.id);
        if (!exists) {
          return [quickHireData, ...prev];
        }
        return prev;
      });
      
      setSelectedPayment(quickHireData);
      setShowDetailsModal(true);
      
      setStats(prev => ({
        ...prev,
        pendingCount: prev.pendingCount + 1,
        totalPaid: prev.totalPaid + (quickHireData.amount || 0)
      }));
    }
  }, [location.state]);

  // Filter payments when filters change
  useEffect(() => {
    let filtered = [...payments];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.workerName?.toLowerCase().includes(searchLower) ||
        p.jobTitle?.toLowerCase().includes(searchLower) ||
        p.id?.toLowerCase().includes(searchLower)
      );
    }
    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  // ============================================================
  // handleProcessPayment - معالجة الدفع والتوجيه إلى payment-options
  // ============================================================
  const handleProcessPayment = (payment) => {
    const paymentData = payment || selectedPayment;
    
    if (!paymentData) {
      alert('Payment not found');
      return;
    }

    console.log('🔄 Processing payment:', paymentData);

    // إنشاء معرف فريد للدفع
    const paymentId = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    // حفظ بيانات الدفع المؤقتة
    const pendingPayment = {
      paymentId: paymentId,
      amount: paymentData.amount,
      workerName: paymentData.workerName,
      workerId: paymentData.workerId || paymentData.id,
      workerEmail: paymentData.workerEmail || '',
      jobTitle: paymentData.jobTitle || 'Service Provider',
      description: paymentData.description || `Payment for ${paymentData.workerName || 'worker'}`,
      paymentType: paymentData.paymentType || 'recruitment',
      employerId: user?.id || user?.email,
      employerName: user?.fullName || 'Employer'
    };

    localStorage.setItem('homelyserv_pending_payment', JSON.stringify(pendingPayment));
    
    // حفظ بيانات العامل
    const workerData = {
      workerId: paymentData.workerId || paymentData.id,
      workerName: paymentData.workerName,
      workerEmail: paymentData.workerEmail || '',
      workerPhone: paymentData.workerPhone || 'Not provided',
      workerLocation: paymentData.workerLocation || 'Not specified',
      desiredJob: paymentData.jobTitle || 'Service Provider',
      hourlyRate: Math.round((paymentData.amount || 0) / 160),
      workerSkills: paymentData.workerSkills || [],
      rating: paymentData.workerRating || 4.5,
      profileImage: paymentData.workerImage || ''
    };

    localStorage.setItem('homelyserv_selected_worker', JSON.stringify(workerData));

    // إغلاق المودال
    setShowDetailsModal(false);
    setSelectedPayment(null);

    // ✅ التوجيه إلى صفحة خيارات الدفع
    navigate('/payment-options');
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    navigate('/login');
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    alert(t.copySuccess);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
  };

  const handleRefresh = () => {
    loadPaymentsFromLocalStorage();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      pending_verification: 'bg-amber-100 text-amber-800',
      upcoming: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'pending_verification': return <AlertTriangle size={14} />;
      case 'upcoming': return <Calendar size={14} />;
      case 'failed': return <X size={14} />;
      case 'processing': return <RefreshCw size={14} />;
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
    return `${amount?.toLocaleString() || 0} EGP`;
  };

  const formatStatus = (status) => {
    return t.status[status] || status;
  };

  if (loading) {
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
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
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

        <div className="p-4 lg:p-6">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-teal-100 mt-1">{t.subtitle}</p>
            </div>
          </div>

          {location.state?.paymentVerificationPending && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Payment submitted successfully. It is pending verification and will not be treated as a completed hire until verified.
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.stats.totalPaid}</p>
                <DollarSign size={16} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.stats.pending}</p>
                <Clock size={16} className="text-yellow-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{stats.pendingCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.stats.completed}</p>
                <CheckCircle size={16} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{stats.completedCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.stats.upcoming}</p>
                <Calendar size={16} className="text-blue-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{stats.upcomingCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.stats.workers}</p>
                <Users size={16} className="text-teal-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{stats.totalWorkers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.stats.monthlyAverage}</p>
                <BarChart3 size={16} className="text-purple-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(stats.monthlyAverage)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                  <option value="completed">{t.filters.completed}</option>
                  <option value="pending">{t.filters.pending}</option>
                  <option value="upcoming">{t.filters.upcoming}</option>
                  <option value="failed">{t.filters.failed}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredPayments.length}</span> payments
            </p>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">💳</div>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.table.id}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.table.worker}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        {t.table.job}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.table.amount}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        {t.table.date}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.table.status}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.table.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-800">{payment.id}</span>
                            <button
                              onClick={() => handleCopyId(payment.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-xs">
                              {payment.workerName?.charAt(0) || 'W'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {payment.workerName || 'Unknown'}
                              </p>
                              {payment.workerEmail && (
                                <p className="text-xs text-gray-500">{payment.workerEmail}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-700 truncate max-w-[150px]">{payment.jobTitle || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-800">{formatCurrency(payment.amount)}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {formatStatus(payment.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(payment)}
                              className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title={t.actions.view}
                            >
                              <Eye size={16} />
                            </button>
                            {payment.status === 'pending' && (
                              <button
                                onClick={() => handleProcessPayment(payment)}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                              >
                                <CreditCard size={12} />
                                {t.actions.payNow}
                              </button>
                            )}
                            {payment.status === 'completed' && (
                              <span className="px-2 py-1 text-xs text-green-600 bg-green-50 rounded-full">
                                Paid
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {showDetailsModal && selectedPayment && (
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
              <div className="bg-teal-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{t.modal.paymentId}</p>
                    <p className="text-lg font-bold text-gray-800">{selectedPayment.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {formatStatus(selectedPayment.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User size={16} className="text-teal-600" />
                    {t.modal.worker}
                  </h3>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold">
                      {selectedPayment.workerName?.charAt(0) || 'W'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {selectedPayment.workerName || 'Unknown'}
                      </p>
                      {selectedPayment.workerEmail && (
                        <p className="text-sm text-gray-500">{selectedPayment.workerEmail}</p>
                      )}
                    </div>
                  </div>
                  {selectedPayment.workerPhone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      {selectedPayment.workerPhone}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-teal-600" />
                    {t.modal.amount}
                  </h3>
                  <p className="text-2xl font-bold text-teal-600">{formatCurrency(selectedPayment.amount)}</p>
                  <p className="text-sm text-gray-500 mt-1">{t.modal.date}: {formatDate(selectedPayment.date)}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t.modal.job}</p>
                  <p className="font-medium text-gray-800">{selectedPayment.jobTitle || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.modal.method}</p>
                  <p className="font-medium text-gray-800">{selectedPayment.paymentMethod || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">{t.modal.description}</p>
                  <p className="font-medium text-gray-800">{selectedPayment.description || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">{t.modal.reference}</p>
                  <p className="font-medium text-gray-800">{selectedPayment.reference || '-'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {t.modal.close}
              </button>
              
              {selectedPayment && selectedPayment.status === 'pending' && (
                <button
                  onClick={() => handleProcessPayment(selectedPayment)}
                  className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerPayments;
