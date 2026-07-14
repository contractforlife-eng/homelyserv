// src/pages/EmployerPayments.jsx - Fixed version with premium badge
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
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
  Mail,
  Lock,
  Unlock,
  MessageSquare,
  ExternalLink,
  ThumbsUp,
  FileText,
  Crown
} from 'lucide-react';

// ============================================================
// EMPLOYER SIDEBAR COMPONENT - WITH PREMIUM BADGE
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

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getProfileImage = () => {
    if (user?.profileImage) {
      return user.profileImage;
    }
    return null;
  };

  // // ✅ FIX: Check premium status directly using the user ID
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || 'Employer'} 
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
                  <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
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
              {item.id === 'premium' && !isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full font-medium">NEW</span>
                </div>
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
// MAIN EMPLOYER PAYMENTS COMPONENT - FIXED
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
    totalWorkers: 0,
    monthlyAverage: 0,
    commissionTotal: 0
  });
  // ✅ Add a ref to prevent duplicate loads
  const isLoadingRef = React.useRef(false);

  const translations = {
    en: {
      title: 'Payments',
      subtitle: 'Manage all your payments to workers',
      stats: {
        totalPaid: 'Total Paid',
        pending: 'Pending',
        completed: 'Completed',
        workers: 'Workers Paid',
        monthlyAverage: 'Monthly Avg',
        commission: 'Commission Collected'
      },
      status: {
        completed: 'Completed',
        pending: 'Pending',
        accepted: 'Accepted',
        rejected: 'Rejected',
        processing: 'Processing',
        waiting_payment: 'Waiting for Payment'
      },
      table: {
        id: 'Payment ID',
        worker: 'Worker',
        job: 'Job',
        amount: 'Amount',
        commission: 'Commission',
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
        commission: 'Commission (15%)',
        netAmount: 'Net Amount',
        date: 'Date',
        status: 'Status',
        method: 'Payment Method',
        description: 'Description',
        reference: 'Reference',
        receipt: 'Download Receipt',
        close: 'Close',
        copyId: 'Copy ID',
        workerEmail: 'Worker Email',
        workerPhone: 'Worker Phone',
        contactInfo: 'Contact Information',
        contactLocked: 'Contact info locked until payment confirmed',
        contactUnlocked: 'Contact info unlocked!',
        whatsapp: 'WhatsApp',
        message: 'Send Message'
      },
      actions: {
        view: 'View Details',
        download: 'Download Receipt',
        payNow: 'Pay Now',
        contact: 'Contact Worker'
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
        accepted: 'Accepted',
        rejected: 'Rejected'
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
      refresh: 'Refresh',
      acceptedOffer: 'Worker accepted your offer!',
      payNowToUnlock: 'Pay now to unlock contact information',
      contactRevealed: 'Contact information revealed',
      waitingForPayment: 'Waiting for payment confirmation'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة جميع مدفوعاتك للعمال',
      stats: {
        totalPaid: 'إجمالي المدفوع',
        pending: 'معلقة',
        completed: 'مكتملة',
        workers: 'عدد العمال',
        monthlyAverage: 'المتوسط الشهري',
        commission: 'العمولة المحصلة'
      },
      status: {
        completed: 'مكتملة',
        pending: 'معلقة',
        accepted: 'مقبولة',
        rejected: 'مرفوضة',
        processing: 'قيد المعالجة',
        waiting_payment: 'في انتظار الدفع'
      },
      table: {
        id: 'رقم الدفع',
        worker: 'العامل',
        job: 'الوظيفة',
        amount: 'المبلغ',
        commission: 'العمولة',
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
        commission: 'العمولة (15%)',
        netAmount: 'المبلغ الصافي',
        date: 'التاريخ',
        status: 'الحالة',
        method: 'طريقة الدفع',
        description: 'الوصف',
        reference: 'المرجع',
        receipt: 'تحميل الإيصال',
        close: 'إغلاق',
        copyId: 'نسخ الرقم',
        workerEmail: 'بريد العامل',
        workerPhone: 'هاتف العامل',
        contactInfo: 'معلومات الاتصال',
        contactLocked: 'معلومات الاتصال مقفلة حتى تأكيد الدفع',
        contactUnlocked: 'تم فتح معلومات الاتصال!',
        whatsapp: 'واتساب',
        message: 'إرسال رسالة'
      },
      actions: {
        view: 'عرض التفاصيل',
        download: 'تحميل الإيصال',
        payNow: 'ادفع الآن',
        contact: 'اتصال بالعامل'
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
        accepted: 'مقبولة',
        rejected: 'مرفوضة'
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
      refresh: 'تحديث',
      acceptedOffer: 'قبل العامل عرضك!',
      payNowToUnlock: 'ادفع الآن لفتح معلومات الاتصال',
      contactRevealed: 'تم فتح معلومات الاتصال',
      waitingForPayment: 'في انتظار تأكيد الدفع'
    }
  };

  const t = translations[language];

  // ============================================================
  // toggleSidebar
  // ============================================================
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  // ============================================================
  // Load Data - ACCURATE PAYMENT DATA - FIXED
  // ============================================================
  const loadData = () => {
    // ✅ Prevent duplicate loads
    if (isLoadingRef.current) {
      console.log('⏳ Load already in progress, skipping...');
      return;
    }

    if (!user?.email) {
      console.log('❌ No user email, skipping load');
      setPayments([]);
      setFilteredPayments([]);
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      const employerEmail = user.email;
      console.log('📂 Loading payments for employer:', employerEmail);

      // Get all payments from all_payments
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      
      // Filter payments for this employer
      let employerPayments = allPayments.filter(
        p => p.employerId === employerEmail || p.employerEmail === employerEmail
      );

      // Get employer offers for additional payment data
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const employerAcceptedOffers = employerOffers.filter(
        o => (o.status === 'accepted' || o.status === 'completed' || o.status === 'terminated') && 
             (o.employerEmail === employerEmail || o.employerId === employerEmail)
      );

      // Create payment entries for accepted offers that don't have payments yet
      const existingPaymentIds = new Set(employerPayments.map(p => p.offerId).filter(id => id));
      let newPayments = [];
      
      employerAcceptedOffers.forEach(offer => {
        if (!existingPaymentIds.has(offer.id)) {
          const commissionRate = 0.15;
          const amount = offer.amount || 0;
          const commission = amount * commissionRate;
          
          const payment = {
            id: 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            offerId: offer.id,
            workerId: offer.workerId || offer.workerEmail,
            workerName: offer.workerName || 'Worker',
            workerEmail: offer.workerEmail || '',
            workerPhone: offer.workerPhone || '',
            workerLocation: offer.workerLocation || 'Not specified',
            workerRating: offer.workerRating || 4.5,
            workerImage: offer.workerImage || '',
            employerId: offer.employerId || offer.employerEmail,
            employerEmail: offer.employerEmail,
            jobTitle: offer.jobTitle || 'Service Provider',
            amount: amount,
            commission: commission,
            netAmount: amount - commission,
            status: offer.status === 'completed' ? 'completed' : 'pending',
            paymentMethod: null,
            paymentVerified: offer.status === 'completed',
            contactRevealed: offer.status === 'completed',
            createdAt: offer.workerResponseAt || offer.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            description: offer.description || `Payment for ${offer.workerName}`,
            reference: 'REF-' + Date.now(),
            hasReceipt: false,
            paymentType: 'recruitment'
          };
          newPayments.push(payment);
        }
      });

      // ✅ Merge new payments with existing ones
      if (newPayments.length > 0) {
        console.log(`✅ Created ${newPayments.length} new payment entries`);
        employerPayments = [...employerPayments, ...newPayments];
        // Save to localStorage to prevent re-creation
        localStorage.setItem('all_payments', JSON.stringify([...allPayments, ...newPayments]));
      }

      // Also get payments from homelyserv_commission_payments
      const commissionPayments = JSON.parse(localStorage.getItem('homelyserv_commission_payments') || '[]');
      const employerCommissionPayments = commissionPayments.filter(
        p => p.employerId === employerEmail || p.employerEmail === employerEmail
      );
      
      // Merge commission payments
      employerCommissionPayments.forEach(cp => {
        if (!employerPayments.find(p => p.id === cp.id || p.offerId === cp.offerId)) {
          employerPayments.push({
            ...cp,
            amount: cp.amount || cp.commission || 0,
            commission: cp.commission || cp.amount || 0,
            netAmount: 0,
            status: cp.status || 'completed',
            paymentVerified: true,
            contactRevealed: true
          });
        }
      });

      // ✅ Remove duplicates by ID
      const uniquePayments = [];
      const seenIds = new Set();
      employerPayments.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          uniquePayments.push(p);
        }
      });
      employerPayments = uniquePayments;

      // Sort by date (newest first)
      employerPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      console.log(`✅ Loaded ${employerPayments.length} unique payments for employer`);

      setPayments(employerPayments);
      setFilteredPayments(employerPayments);

      // Calculate stats - ACCURATE
      const completedPayments = employerPayments.filter(p => p.status === 'completed' || p.paymentVerified === true);
      const totalPaid = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalCommission = completedPayments.reduce((sum, p) => sum + (p.commission || 0), 0);
      const pendingCount = employerPayments.filter(p => p.status === 'pending' && !p.paymentVerified).length;
      const completedCount = completedPayments.length;

      const uniqueWorkers = new Set();
      employerPayments.forEach(p => {
        if (p.workerEmail || p.workerId) {
          uniqueWorkers.add(p.workerEmail || p.workerId);
        }
      });

      setStats({
        totalPaid: totalPaid,
        pendingCount: pendingCount,
        completedCount: completedCount,
        totalWorkers: uniqueWorkers.size,
        monthlyAverage: completedCount > 0 ? Math.round(totalPaid / Math.max(completedCount, 1)) : 0,
        commissionTotal: totalCommission
      });

      console.log(`📊 Stats: Total Paid: ${totalPaid}, Pending: ${pendingCount}, Completed: ${completedCount}`);
      
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
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
  }, [navigate]);

  // Load data when user is set - ✅ Only load once
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // ============================================================
  // ✅ FIXED: Auto-refresh - Only refresh if there's a change
  // ============================================================
  useEffect(() => {
    // Check for payment verification updates from location state
    if (location.state?.paymentVerificationPending) {
      loadData();
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
    
    // ✅ FIXED: Auto-refresh every 15 seconds, but only check for new data
    // without causing a full reload that makes payments disappear
    const interval = setInterval(() => {
      // Only refresh if not in a modal and not already loading
      if (!showDetailsModal && !isLoadingRef.current) {
        // Check if there are new payments without reloading everything
        try {
          const employerEmail = user?.email;
          if (!employerEmail) return;
          
          const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
          const employerPayments = allPayments.filter(
            p => p.employerId === employerEmail || p.employerEmail === employerEmail
          );
          
          // Check if the count has changed
          if (employerPayments.length !== payments.length) {
            console.log('🔄 New payments detected, refreshing...');
            loadData();
          } else {
            // Check if any payment status has changed
            let hasChanged = false;
            const currentPaymentMap = new Map(payments.map(p => [p.id, p]));
            for (const newPayment of employerPayments) {
              const current = currentPaymentMap.get(newPayment.id);
              if (current && current.status !== newPayment.status) {
                hasChanged = true;
                break;
              }
            }
            if (hasChanged) {
              console.log('🔄 Payment status changed, refreshing...');
              loadData();
            }
          }
        } catch (error) {
          console.error('Error checking for updates:', error);
        }
      }
    }, 15000); // ✅ Increased to 15 seconds
    
    return () => clearInterval(interval);
  }, [location.state, showDetailsModal, payments.length, user]);

  // ============================================================
  // Filter payments
  // ============================================================
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
        p.id?.toLowerCase().includes(searchLower) ||
        p.workerEmail?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleProcessPayment = (payment) => {
    const paymentData = payment || selectedPayment;
    
    if (!paymentData) {
      alert('Payment not found');
      return;
    }

    console.log('🔄 Processing payment:', paymentData);

    const pendingPayment = {
      paymentId: paymentData.id,
      amount: paymentData.amount || 0,
      workerName: paymentData.workerName,
      workerId: paymentData.workerId || paymentData.id,
      workerEmail: paymentData.workerEmail || '',
      jobTitle: paymentData.jobTitle || 'Service Provider',
      description: paymentData.description || `Payment for ${paymentData.workerName || 'worker'}`,
      paymentType: 'recruitment',
      offerId: paymentData.offerId,
      employerId: user?.id || user?.email,
      employerName: user?.fullName || 'Employer',
      returnTo: '/employer-payments'
    };

    localStorage.setItem('homelyserv_pending_payment', JSON.stringify(pendingPayment));
    
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

    setShowDetailsModal(false);
    setSelectedPayment(null);

    navigate('/payment-options');
  };

  const handleContact = (payment, method) => {
    const phone = payment.workerPhone;
    
    if (method === 'whatsapp') {
      if (phone) {
        const formattedPhone = phone.replace(/\s/g, '').replace(/^0/, '20');
        window.open(`https://wa.me/${formattedPhone}`, '_blank');
      } else {
        alert('No phone number available');
      }
    } else if (method === 'message') {
      const chatData = {
        id: payment.workerId || payment.workerEmail,
        name: payment.workerName,
        role: 'worker',
        image: payment.workerImage || ''
      };
      localStorage.setItem('homelyserv_chat_recipient', JSON.stringify(chatData));
      navigate('/employer-messages');
    }
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
    loadData();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'accepted': return <ThumbsUp size={14} />;
      case 'rejected': return <X size={14} />;
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

  // ✅ Don't show loading if we already have payments
  if (loading && payments.length === 0) {
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

          {/* Stats Cards - ACCURATE */}
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
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.stats.commission}</p>
                <FileText size={16} className="text-orange-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(stats.commissionTotal)}</p>
            </div>
          </div>

          {/* Search and Filters */}
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
                  <option value="pending">{t.filters.pending}</option>
                  <option value="completed">{t.filters.completed}</option>
                  <option value="accepted">{t.filters.accepted}</option>
                  <option value="rejected">{t.filters.rejected}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredPayments.length}</span> payments
            </p>
          </div>

          {/* Payments Table */}
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        {t.table.commission}
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
                            <span className="text-sm font-medium text-gray-800 truncate max-w-[80px]">{payment.id}</span>
                            <button
                              onClick={() => handleCopyId(payment.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-xs overflow-hidden flex-shrink-0">
                              {payment.workerImage ? (
                                <img src={payment.workerImage} alt={payment.workerName} className="w-full h-full object-cover" />
                              ) : (
                                payment.workerName?.charAt(0) || 'W'
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {payment.workerName || 'Unknown'}
                              </p>
                              {payment.workerEmail && (
                                <p className="text-xs text-gray-500 truncate max-w-[100px]">{payment.workerEmail}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-700 truncate max-w-[120px]">{payment.jobTitle || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-800">{formatCurrency(payment.amount)}</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-orange-600">{formatCurrency(payment.commission || 0)}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {formatStatus(payment.status)}
                          </span>
                          {payment.status === 'pending' && payment.contactRevealed === false && (
                            <div className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                              <Lock size={10} />
                              {t.waitingForPayment}
                            </div>
                          )}
                          {payment.status === 'completed' && payment.contactRevealed === true && (
                            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <Unlock size={10} />
                              {t.contactRevealed}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewDetails(payment)}
                              className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title={t.actions.view}
                            >
                              <Eye size={16} />
                            </button>
                            {payment.status === 'pending' && !payment.paymentVerified && (
                              <button
                                onClick={() => handleProcessPayment(payment)}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                              >
                                <CreditCard size={12} />
                                {t.actions.payNow}
                              </button>
                            )}
                            {payment.status === 'completed' && payment.contactRevealed === true && (
                              <>
                                <button
                                  onClick={() => handleContact(payment, 'whatsapp')}
                                  className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <MessageSquare size={12} />
                                  WhatsApp
                                </button>
                                <button
                                  onClick={() => handleContact(payment, 'message')}
                                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <MessageCircle size={12} />
                                  Message
                                </button>
                              </>
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

      {/* Details Modal */}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{t.modal.amount}</p>
                  <p className="text-xl font-bold text-teal-600">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{t.modal.commission}</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(selectedPayment.commission || 0)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{t.modal.netAmount}</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(selectedPayment.netAmount || selectedPayment.amount - (selectedPayment.commission || 0))}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User size={16} className="text-teal-600" />
                    {t.modal.worker}
                  </h3>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold overflow-hidden">
                      {selectedPayment.workerImage ? (
                        <img src={selectedPayment.workerImage} alt={selectedPayment.workerName} className="w-full h-full object-cover" />
                      ) : (
                        selectedPayment.workerName?.charAt(0) || 'W'
                      )}
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
                  {selectedPayment.workerLocation && selectedPayment.workerLocation !== 'Not specified' && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      {selectedPayment.workerLocation}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Briefcase size={16} className="text-teal-600" />
                    {t.modal.job}
                  </h3>
                  <p className="font-medium text-gray-800">{selectedPayment.jobTitle || '-'}</p>
                  <p className="text-sm text-gray-500 mt-1">{t.modal.date}: {formatDate(selectedPayment.createdAt)}</p>
                  {selectedPayment.paymentMethod && (
                    <p className="text-sm text-gray-500 mt-1">{t.modal.method}: {selectedPayment.paymentMethod}</p>
                  )}
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="mt-6 p-4 rounded-xl border">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  {selectedPayment.contactRevealed ? (
                    <Unlock size={16} className="text-green-600" />
                  ) : (
                    <Lock size={16} className="text-yellow-600" />
                  )}
                  {t.modal.contactInfo}
                </h3>
                
                {selectedPayment.contactRevealed && selectedPayment.status === 'completed' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle size={14} />
                      {t.modal.contactUnlocked}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedPayment.workerPhone && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-sm">{selectedPayment.workerPhone}</span>
                          <button
                            onClick={() => handleContact(selectedPayment, 'whatsapp')}
                            className="ml-auto px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition flex items-center gap-1"
                          >
                            <MessageSquare size={12} />
                            WhatsApp
                          </button>
                        </div>
                      )}
                      {selectedPayment.workerEmail && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-sm truncate">{selectedPayment.workerEmail}</span>
                          <button
                            onClick={() => handleContact(selectedPayment, 'message')}
                            className="ml-auto px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition flex items-center gap-1"
                          >
                            <MessageCircle size={12} />
                            Message
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Lock size={32} className="text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{t.modal.contactLocked}</p>
                    {selectedPayment.status === 'pending' && (
                      <button
                        onClick={() => handleProcessPayment(selectedPayment)}
                        className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 mx-auto"
                      >
                        <CreditCard size={14} />
                        {t.actions.payNow}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {selectedPayment.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">{t.modal.description}</p>
                  <p className="font-medium text-gray-800">{selectedPayment.description}</p>
                </div>
              )}
              {selectedPayment.reference && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{t.modal.reference}</p>
                  <p className="font-medium text-gray-800">{selectedPayment.reference}</p>
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
              
              {selectedPayment && selectedPayment.status === 'pending' && !selectedPayment.paymentVerified && (
                <button
                  onClick={() => handleProcessPayment(selectedPayment)}
                  className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  {t.actions.payNow}
                </button>
              )}
              
              {selectedPayment && selectedPayment.status === 'completed' && selectedPayment.contactRevealed && (
                <>
                  <button
                    onClick={() => handleContact(selectedPayment, 'whatsapp')}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    <MessageSquare size={16} />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleContact(selectedPayment, 'message')}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerPayments;