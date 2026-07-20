// src/pages/EmployerPayments.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
import NotificationBell from '../components/NotificationBell';
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
  Crown,
  Info
} from 'lucide-react';
import { isUserPremium as checkUserPremium } from '../utils/subscriptionService';

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

  const t = translations[language] || translations.en;

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

  const userIsPremium = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return checkUserPremium(userId);
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
// DEBUG FUNCTION
// ============================================================
const debugPayments = (userEmail) => {
  console.log('🔍 DEBUGGING PAYMENTS');
  console.log('========================================');
  console.log('Current user email:', userEmail);
  
  const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
  console.log('📋 all_payments count:', allPayments.length);
  console.log('📋 all_payments:', allPayments);
  
  const employerPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
  console.log('📋 employer_payments count:', employerPayments.length);
  console.log('📋 employer_payments:', employerPayments);
  
  const user = JSON.parse(localStorage.getItem('homelyserv_user'));

const userPayments = allPayments.filter(p =>
  p.employerEmail === user.email ||
  p.employerId === user.id ||
  p.employerId === user.email
);

console.table(userPayments);
  
  const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
  const userOffers = employerOffers.filter(o => 
    o.employerEmail === userEmail || o.employerId === userEmail
  );
  console.log(`📋 Offers for ${userEmail}:`, userOffers);
  console.log('========================================');
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    totalCommissionPaid: 0,
    pendingCount: 0,
    completedCount: 0,
    totalWorkers: 0,
    monthlyAverage: 0,
    totalSalary: 0
  });
  const isLoadingRef = React.useRef(false);

  // ============================================================
  // TRANSLATIONS - DEFINED INSIDE COMPONENT
  // ============================================================
  const translations = {
    en: {
      title: 'Payments',
      subtitle: 'Manage your platform commission payments',
      stats: {
        totalPaid: 'Total Commission Paid',
        pending: 'Pending',
        completed: 'Completed',
        workers: 'Workers Hired',
        monthlyAverage: 'Monthly Avg',
        totalSalary: 'Total Worker Salaries'
      },
      status: {
        completed: 'Completed',
        pending: 'Pending',
        accepted: 'Accepted',
        rejected: 'Rejected',
        processing: 'Processing',
        waiting_payment: 'Waiting for Payment',
        in_progress: 'In Progress'
      },
      table: {
        id: 'Payment ID',
        worker: 'Worker',
        job: 'Job',
        commission: 'Commission',
        fullSalary: 'Monthly Salary',
        date: 'Date',
        status: 'Status',
        actions: 'Actions'
      },
      modal: {
        title: 'Payment Details',
        paymentId: 'Payment ID',
        worker: 'Worker',
        job: 'Job Title',
        commission: 'Platform Commission',
        fullSalary: 'Worker\'s Monthly Salary',
        note: 'Note: The worker\'s full salary is paid directly to the worker by the employer. The platform only charges a commission fee.',
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
        payNow: 'Pay Commission',
        contact: 'Contact Worker'
      },
      empty: {
        title: 'No payments found',
        description: 'You haven\'t made any commission payments yet',
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
      payNowToUnlock: 'Pay commission to unlock contact information',
      contactRevealed: 'Contact information revealed',
      waitingForPayment: 'Waiting for payment confirmation',
      commissionInfo: 'You pay the platform commission only. Worker\'s salary is paid directly by you.',
      paymentSuccess: '✅ Payment completed successfully! Worker can now start working.',
      markPaid: 'Mark as Paid',
      markPaidConfirm: 'Mark this payment as completed? This will unlock contact info and notify the worker.'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة مدفوعات عمولة المنصة',
      stats: {
        totalPaid: 'إجمالي العمولة المدفوعة',
        pending: 'معلقة',
        completed: 'مكتملة',
        workers: 'عدد العمال',
        monthlyAverage: 'المتوسط الشهري',
        totalSalary: 'إجمالي رواتب العمال'
      },
      status: {
        completed: 'مكتملة',
        pending: 'معلقة',
        accepted: 'مقبولة',
        rejected: 'مرفوضة',
        processing: 'قيد المعالجة',
        waiting_payment: 'في انتظار الدفع',
        in_progress: 'قيد التنفيذ'
      },
      table: {
        id: 'رقم الدفع',
        worker: 'العامل',
        job: 'الوظيفة',
        commission: 'العمولة',
        fullSalary: 'الراتب الشهري',
        date: 'التاريخ',
        status: 'الحالة',
        actions: 'الإجراءات'
      },
      modal: {
        title: 'تفاصيل الدفع',
        paymentId: 'رقم الدفع',
        worker: 'العامل',
        job: 'عنوان الوظيفة',
        commission: 'عمولة المنصة',
        fullSalary: 'راتب العامل الشهري',
        note: 'ملاحظة: يدفع صاحب العمل الراتب الكامل للعامل مباشرة. المنصة تفرض عمولة فقط.',
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
        payNow: 'ادفع العمولة',
        contact: 'اتصال بالعامل'
      },
      empty: {
        title: 'لا توجد مدفوعات',
        description: 'لم تقم بأي مدفوعات عمولة بعد',
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
      payNowToUnlock: 'ادفع العمولة لفتح معلومات الاتصال',
      contactRevealed: 'تم فتح معلومات الاتصال',
      waitingForPayment: 'في انتظار تأكيد الدفع',
      commissionInfo: 'أنت تدفع عمولة المنصة فقط. راتب العامل يدفع من قبلك مباشرة.',
      paymentSuccess: '✅ تم الدفع بنجاح! يمكن للعامل البدء في العمل.',
      markPaid: 'تحديد كمكتمل',
      markPaidConfirm: 'تحديد هذه الدفعة كمكتملة؟ سيتم فتح معلومات الاتصال وإشعار العامل.'
    }
  };

  const t = translations[language] || translations.en;

  // ============================================================
  // TOGGLE FUNCTIONS
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

  // ============================================================
  // FORCE RELOAD
  // ============================================================
  const forceReload = () => {
    console.log('🔄 Force reloading payments...');
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      loadData();
    }, 100);
  };

  // ============================================================
  // PAYMENT SUCCESS HANDLER - FIXED
  // ============================================================
  const handlePaymentSuccess = (paymentId, offerId) => {
    try {
      console.log('✅ Payment completed for offer:', offerId);
      console.log('✅ Payment ID:', paymentId);
      console.log('✅ Current user:', user?.email);
      
      if (!offerId) {
        console.error('❌ No offerId provided');
        return false;
      }

      if (!user?.email) {
        console.error('❌ No user email found');
        return false;
      }

      let employerOffers = [];
      try {
        employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      } catch (e) {
        console.error('Error reading employer_offers:', e);
        employerOffers = [];
      }
      
      const offer = employerOffers.find(o => o.id === offerId);
      if (!offer) {
        console.error('❌ Offer not found:', offerId);
        return false;
      }
      
      console.log('📋 Found offer:', offer.jobTitle, 'for', offer.workerEmail);
      
      // 1. UPDATE EMPLOYER_OFFERS
      const updatedOffers = employerOffers.map(o => {
        if (o.id === offerId) {
          return {
            ...o,
            paymentCompleted: true,
            paymentDate: new Date().toISOString(),
            paymentId: paymentId,
            paymentStatus: 'completed',
            status: 'in_progress',
            employerEmail: user.email,
            employerId: user.id || user.email,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      });
      localStorage.setItem('employer_offers', JSON.stringify(updatedOffers));
      console.log('✅ Updated employer_offers');
      
      // 2. UPDATE WORKER_OFFERS
      if (offer.workerEmail) {
        let workerOffers = [];
        try {
          workerOffers = JSON.parse(localStorage.getItem(`worker_offers_${offer.workerEmail}`) || '[]');
        } catch (e) {
          console.error('Error reading worker_offers:', e);
          workerOffers = [];
        }
        
        const updatedWorkerOffers = workerOffers.map(o => {
          if (o.id === offerId) {
            return {
              ...o,
              paymentCompleted: true,
              paymentDate: new Date().toISOString(),
              paymentId: paymentId,
              paymentStatus: 'completed',
              status: 'paid',
              employerEmail: user.email,
              updatedAt: new Date().toISOString()
            };
          }
          return o;
        });
        
        if (!updatedWorkerOffers.some(o => o.id === offerId)) {
          updatedWorkerOffers.push({
            ...offer,
            paymentCompleted: true,
            paymentDate: new Date().toISOString(),
            paymentId: paymentId,
            paymentStatus: 'completed',
            status: 'paid',
            employerEmail: user.email,
            updatedAt: new Date().toISOString()
          });
        }
        
        localStorage.setItem(`worker_offers_${offer.workerEmail}`, JSON.stringify(updatedWorkerOffers));
        console.log(`✅ Updated worker_offers for ${offer.workerEmail}`);
      }
      
      // 3. CREATE PAYMENT RECORD - FIXED with all required fields
      const commissionRate = 0.15;
      const fullSalary = Number(offer.amount || 0);
      const commission = Math.round(fullSalary * commissionRate * 100) / 100;
      
      const paymentRecord = {
        id: paymentId || 'PAY-' + Date.now(),
        offerId: offerId,
        workerId: offer.workerId || offer.workerEmail,
        workerName: offer.workerName || 'Worker',
        workerEmail: offer.workerEmail || '',
        workerPhone: offer.workerPhone || '',
        workerLocation: offer.workerLocation || 'Not specified',
        workerRating: offer.workerRating || 4.5,
        workerImage: offer.workerImage || '',
        employerId: user.id || user.email,
        employerEmail: user.email,
        jobTitle: offer.jobTitle || 'Service Provider',
        commission: commission,
        fullSalary: fullSalary,
        status: 'completed',
        paymentVerified: true,
        contactRevealed: true,
        paymentMethod: 'commission',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        description: offer.description || `Commission for hiring ${offer.workerName}`,
        reference: 'REF-' + offer.id,
        paymentType: 'commission',
        type: 'commission', // <-- CRITICAL: This must be set for filtering
        hasReceipt: false,
        paymentId: paymentId || 'PAY-' + Date.now()
      };
      
      console.log('📋 Creating payment record with employer email:', user.email);
      console.log('📋 Payment record:', paymentRecord);
      
      // 4. SAVE TO all_payments
      let allPayments = [];
      try {
        allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      } catch (e) {
        console.error('Error reading all_payments:', e);
        allPayments = [];
      }
      
      // Remove any existing payment with same offerId
      const filteredPayments = allPayments.filter(p => p.offerId !== offerId);
      filteredPayments.push(paymentRecord);
      localStorage.setItem('all_payments', JSON.stringify(filteredPayments));
      console.log('✅ Updated all_payments. New count:', filteredPayments.length);
      
      // 5. SAVE TO employer_payments
      let employerPayments = [];
      try {
        employerPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
      } catch (e) {
        console.error('Error reading employer_payments:', e);
        employerPayments = [];
      }
      
      const empFiltered = employerPayments.filter(p => p.offerId !== offerId);
      empFiltered.push(paymentRecord);
      localStorage.setItem('employer_payments', JSON.stringify(empFiltered));
      console.log('✅ Updated employer_payments. New count:', empFiltered.length);
      
      // 6. CREATE NOTIFICATION
      try {
        const notifications = JSON.parse(localStorage.getItem('homelyserv_notifications') || '[]');
        const notification = {
          id: 'notif_' + Date.now(),
          type: 'payment_received',
          title: 'Payment Received 💰',
          message: `Payment for "${offer.jobTitle || 'job offer'}" has been completed. You can now start working!`,
          offerId: offer.id,
          offerTitle: offer.jobTitle || 'Job Offer',
          workerEmail: offer.workerEmail,
          workerName: offer.workerName || 'Worker',
          employerName: user.fullName || 'Employer',
          date: new Date().toISOString(),
          read: false,
          link: '/worker/offers'
        };
        
        const exists = notifications.some(n => 
          n.offerId === offer.id && n.type === 'payment_received'
        );
        
        if (!exists) {
          notifications.push(notification);
          localStorage.setItem('homelyserv_notifications', JSON.stringify(notifications));
          console.log('✅ Payment notification created for worker');
        }
      } catch (e) {
        console.error('Error creating notification:', e);
      }
      
      console.log('✅ Payment success fully processed');
      
      alert(t.paymentSuccess);
      
      // Force reload of payments
      setLoading(true);
      setTimeout(() => {
        loadData();
        setRefreshKey(prev => prev + 1);
        setSelectedPayment(null);
        setShowDetailsModal(false);
      }, 500);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error processing payment success:', error);
      alert('Error processing payment. Please try again.');
      return false;
    }
  };

  // ============================================================
  // MARK PAYMENT AS COMPLETED
  // ============================================================
  const markPaymentAsCompleted = (payment) => {
    if (!confirm(t.markPaidConfirm)) {
      return;
    }
    
    const paymentId = 'manual_' + Date.now();
    console.log('🔄 Marking payment as completed:', paymentId, 'for offer:', payment.offerId);
    handlePaymentSuccess(paymentId, payment.offerId);
  };

  // ============================================================
  // LOAD DATA - FIXED to properly load all payments
  // ============================================================
  const loadData = () => {
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
      console.log('📂 Loading commission payments for employer:', employerEmail);

      // 1. GET PAYMENTS FROM all_payments
      let allPayments = [];
      try {
        allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
        console.log('📋 all_payments count:', allPayments.length);
      } catch (e) {
        console.error('Error reading all_payments:', e);
        allPayments = [];
      }
      
      // Filter for this employer's commission payments
      const employerId = user?.id;
let employerPayments = allPayments.filter((p) => {
  const isCurrentEmployer =
    p.employerId === employerId ||
    p.employerEmail === employerEmail ||
    p.employerId === employerEmail; // للتوافق مع البيانات القديمة

  const isSupportedPayment =
    ['commission', 'commission_payment', 'recruitment'].includes(p.paymentType) ||
    ['commission', 'recruitment'].includes(p.type);

  return isCurrentEmployer && isSupportedPayment;
});
      
      console.log(`📋 Found ${employerPayments.length} commission payments in all_payments`);

      // 2. GET PAYMENTS FROM employer_payments
      let empPayments = [];
      try {
        empPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
        console.log('📋 employer_payments count:', empPayments.length);
      } catch (e) {
        console.error('Error reading employer_payments:', e);
        empPayments = [];
      }
      
      const empFiltered = empPayments.filter((p) => {
  const isCurrentEmployer =
    p.employerId === employerId ||
    p.employerEmail === user?.email ||
    p.employerId === user?.email;

  const isSupportedPayment =
    ['commission', 'commission_payment', 'recruitment'].includes(p.paymentType) ||
    ['commission', 'recruitment'].includes(p.type);

  return isCurrentEmployer && isSupportedPayment;
});
      
      console.log(`📋 Found ${empFiltered.length} commission payments in employer_payments`);

      // 3. MERGE PAYMENTS (deduplicate by offerId or id)
      const mergedMap = {};
      [...employerPayments, ...empFiltered].forEach(p => {
        // Use offerId as key if available, otherwise use id
        const key = p.offerId || p.id;
        if (key && !mergedMap[key]) {
          mergedMap[key] = p;
        } else if (key && mergedMap[key]) {
          // If duplicate, merge and keep the one with more data
          const existing = mergedMap[key];
          if (p.status === 'completed' && existing.status !== 'completed') {
            mergedMap[key] = { ...existing, ...p };
          }
        }
      });
      employerPayments = Object.values(mergedMap);
      console.table(
  employerPayments.map(p => ({
    id: p.id,
    employerId: p.employerId,
    employerEmail: p.employerEmail,
    paymentType: p.paymentType,
    type: p.type,
    status: p.status
  }))
);
      console.log(`📋 After merging: ${employerPayments.length} unique payments`);

      // 4. CHECK OFFERS FOR ANY MISSING PAYMENTS
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const employerAcceptedOffers = employerOffers.filter((o) => {
  const isEmployer =
    o.employerId === employerId ||
    o.employerEmail === employerEmail ||
    o.employerId === employerEmail; // دعم البيانات القديمة

  const isAccepted =
    o.status === 'accepted' ||
    o.status === 'completed' ||
    o.status === 'terminated' ||
    o.status === 'in_progress' ||
    o.paymentCompleted === true;

  return isEmployer && isAccepted;
});

      console.log(`📋 Found ${employerAcceptedOffers.length} accepted/completed offers`);

      const existingPaymentOfferIds = new Set(employerPayments.map(p => p.offerId).filter(Boolean));
      
      const commissionRate = 0.15;
      let newPayments = [];
      
      employerAcceptedOffers.forEach(offer => {
        // Check if payment exists for this offer
        if (!existingPaymentOfferIds.has(offer.id)) {
          const fullSalary = Number(offer.amount || 0);
          const commission = Math.round(fullSalary * commissionRate * 100) / 100;
          
          // Determine if payment should be considered completed
          const isCompleted = offer.paymentCompleted === true || 
                             offer.status === 'in_progress' || 
                             offer.status === 'completed' ||
                             offer.paymentStatus === 'completed';
          
          // Check if there's a payment record in all_payments with this offerId
          const existingPayment = allPayments.find(p => p.offerId === offer.id);
          if (existingPayment) {
            // Use existing payment data
            const payment = {
  ...existingPayment,
  employerId: employerId,
  employerEmail: employerEmail
};
            newPayments.push(payment);
            existingPaymentOfferIds.add(offer.id);
            console.log(`📋 Using existing payment for offer ${offer.id}`);
            return;
          }
          
          const payment = {
            id: offer.paymentId || `PAY-${offer.id}`,
            offerId: offer.id,
            workerId: offer.workerId || offer.workerEmail,
            workerName: offer.workerName || 'Worker',
            workerEmail: offer.workerEmail || '',
            workerPhone: offer.workerPhone || '',
            workerLocation: offer.workerLocation || 'Not specified',
            workerRating: offer.workerRating || 4.5,
            workerImage: offer.workerImage || '',
            employerId: employerId,
            employerEmail: employerEmail,
            jobTitle: offer.jobTitle || 'Service Provider',
            commission: commission,
            fullSalary: fullSalary,
            status: isCompleted ? 'completed' : 'pending',
            paymentVerified: isCompleted || false,
            contactRevealed: isCompleted || false,
            paymentMethod: isCompleted ? 'commission' : null,
            paymentType: 'commission',
            type: 'commission', // <-- CRITICAL
            createdAt: offer.workerResponseAt || offer.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: isCompleted ? new Date().toISOString() : null,
            description: offer.description || `Commission for hiring ${offer.workerName}`,
            reference: 'REF-' + offer.id,
            hasReceipt: false
          };
          newPayments.push(payment);
          existingPaymentOfferIds.add(offer.id);
          console.log(`📋 Created new payment for offer ${offer.id}`);
        }
      });

      // 5. SAVE NEW PAYMENTS
      if (newPayments.length > 0) {
        const updatedAllPayments = [...allPayments, ...newPayments];
        localStorage.setItem('all_payments', JSON.stringify(updatedAllPayments));
        employerPayments = [...employerPayments, ...newPayments];
        console.log(`✅ Added ${newPayments.length} new payments`);
      }

      // 6. SORT BY DATE
      employerPayments.sort((a, b) => 
        new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
      );

      console.log(`✅ Loaded ${employerPayments.length} total commission payments`);

      // 7. UPDATE STATE
      setPayments(employerPayments);
      setFilteredPayments(employerPayments);

      // 8. CALCULATE STATS
      const completedPayments = employerPayments.filter(p => 
        p.status === 'completed' || p.paymentVerified === true
      );
      const totalCommissionPaid = completedPayments.reduce((sum, p) => sum + (p.commission || 0), 0);
      const totalFullSalary = completedPayments.reduce((sum, p) => sum + (p.fullSalary || 0), 0);
      const pendingCount = employerPayments.filter(p => 
        (p.status === 'pending' || p.status === 'waiting_payment') && !p.paymentVerified
      ).length;
      const completedCount = completedPayments.length;

      const uniqueWorkers = new Set();
      employerPayments.forEach(p => {
        if (p.workerEmail || p.workerId) {
          uniqueWorkers.add(p.workerEmail || p.workerId);
        }
      });

      setStats({
        totalCommissionPaid: totalCommissionPaid,
        pendingCount: pendingCount,
        completedCount: completedCount,
        totalWorkers: uniqueWorkers.size,
        monthlyAverage: completedCount > 0 ? Math.round(totalCommissionPaid / Math.max(completedCount, 1)) : 0,
        totalSalary: totalFullSalary
      });

      console.log(`📊 Stats: Total Commission: ${totalCommissionPaid}, Pending: ${pendingCount}, Completed: ${completedCount}`);
      
    } catch (error) {
      console.error('Error loading payments:', error);
      console.error('Error details:', error.stack);
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
        console.log('✅ User loaded:', parsedUser.email);
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

  useEffect(() => {
    if (user) {
      console.log('🔄 Loading data for user:', user.email);
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [refreshKey]);

  // Filter payments
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

    const pendingPayment = {
      paymentId: paymentData.id,
      amount: Number(paymentData.commission || 0), 
      fullSalary: Number(paymentData.fullSalary || 0),
      workerName: paymentData.workerName,
      workerId: paymentData.workerId || paymentData.id,
      workerEmail: paymentData.workerEmail || '',
      jobTitle: paymentData.jobTitle || 'Service Provider',
      description: paymentData.description || `Commission for ${paymentData.workerName}`,
      paymentType: 'commission',
      offerId: paymentData.offerId,
      employerId: user?.id || user?.email,
      employerName: user?.fullName || 'Employer',
      returnTo: '/employer-payments',
      onPaymentSuccess: (paymentId) => {
        console.log('🔄 Payment callback triggered for offer:', paymentData.offerId);
        handlePaymentSuccess(paymentId, paymentData.offerId);
      }
    };

    localStorage.setItem('homelyserv_pending_payment', JSON.stringify(pendingPayment));
    
    const workerData = {
      workerId: paymentData.workerId || paymentData.id,
      workerName: paymentData.workerName,
      workerEmail: paymentData.workerEmail || '',
      workerPhone: paymentData.workerPhone || 'Not provided',
      workerLocation: paymentData.workerLocation || 'Not specified',
      desiredJob: paymentData.jobTitle || 'Service Provider',
      fullSalary: paymentData.fullSalary || 0,
      workerSkills: paymentData.workerSkills || [],
      rating: paymentData.workerRating || 4.5,
      profileImage: paymentData.workerImage || '',
      offerId: paymentData.offerId
    };

    localStorage.setItem('homelyserv_selected_worker', JSON.stringify(workerData));

    setShowDetailsModal(false);
    setSelectedPayment(null);

    navigate('/payment-options');
  };

  const handleContact = async (payment, method) => {
    const phone = payment.workerPhone;
    
    if (method === 'whatsapp') {
      if (phone) {
        const formattedPhone = phone.replace(/\s/g, '').replace(/^0/, '20');
        window.open(`https://wa.me/${formattedPhone}`, '_blank');
      } else {
        alert('No phone number available');
      }
    } else if (method === 'message') {
      const workerId = payment.workerId || payment.workerEmail;
      const workerName = payment.workerName || 'Worker';
      
      console.log('💬 Opening chat with worker from Payments:', { workerId, workerName });
      
      if (!workerId) {
        console.error('No worker ID found for payment:', payment);
        alert('Unable to open chat: Worker ID not found');
        return;
      }
      
      try {
        setCreatingConversation(true);
      } catch (e) {
        // setCreatingConversation may not exist in this scope, ignore
      }
      
      const employerId = user?.id || user?.email;
      const employerName = user?.fullName || 'Employer';
      
      // Create/ensure conversation before navigating (identical to MyHires pattern)
      try {
        const result = await sendMessage(
          employerId,
          employerName,
          'EMPLOYER',
          workerId,
          workerName,
          `Hello ${workerName}! Let's discuss your work.`
        );
        
        if (result) {
          console.log('✅ Conversation ensured from Payments page');
        }
      } catch (error) {
        console.error('Error ensuring conversation:', error);
      } finally {
        try {
          setCreatingConversation(false);
        } catch (e) {
          // ignore
        }
      }
      
      // Store worker info in localStorage (same keys as MyHires)
      localStorage.setItem('homelyserv_chat_worker_id', workerId);
      localStorage.setItem('homelyserv_chat_worker_name', workerName);
      localStorage.setItem('homelyserv_chat_worker_image', payment.workerImage || '');
      localStorage.setItem('homelyserv_chat_hire_id', payment.offerId || payment.id || '');
      localStorage.setItem('homelyserv_chat_hire_job', payment.jobTitle || '');
      
      navigate('/employer-messages');
    }
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
    console.log('🔄 Manual refresh triggered');
    loadData();
  };

  const handleDebug = () => {
  console.log("Current User:", user);
  console.log("User ID:", user?.id);
  console.log("User Email:", user?.email);

  if (user?.email) {
    debugPayments(user.email);
    alert('Debug data printed to console. Check the browser console (F12).');
  }
};

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-teal-100 text-teal-800'
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
      case 'in_progress': return <Briefcase size={14} />;
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

  // ============================================================
  // RENDER
  // ============================================================
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
              <NotificationBell userId={user?.id || user?.email} />
              
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
              <button
                onClick={handleDebug}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 text-xs text-gray-500"
                title="Debug - Check console"
              >
                🐛 Debug
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-teal-100 mt-1">{t.subtitle}</p>
              <p className="text-teal-200 text-sm mt-1 flex items-center gap-1">
                <Info size={14} />
                {t.commissionInfo}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.stats.totalPaid}</p>
                <DollarSign size={16} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(stats.totalCommissionPaid)}</p>
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
                <p className="text-xs text-gray-500">{t.stats.totalSalary}</p>
                <Briefcase size={16} className="text-orange-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(stats.totalSalary)}</p>
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
                        {t.table.commission}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        {t.table.fullSalary}
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
                      <tr key={payment.id || payment.offerId} className="hover:bg-gray-50 transition-colors">
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
                          <p className="text-sm font-semibold text-teal-600">{formatCurrency(payment.commission)}</p>
                          <p className="text-xs text-gray-400">Platform commission</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-gray-700">{formatCurrency(payment.fullSalary)}</p>
                          <p className="text-xs text-gray-400">Worker's salary</p>
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
                              <>
                                <button
                                  onClick={() => handleProcessPayment(payment)}
                                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <CreditCard size={12} />
                                  {t.actions.payNow}
                                </button>
                                <button
                                  onClick={() => markPaymentAsCompleted(payment)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle size={12} />
                                  {t.markPaid}
                                </button>
                              </>
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
                  <p className="text-sm text-gray-500">{t.modal.commission}</p>
                  <p className="text-xl font-bold text-teal-600">{formatCurrency(selectedPayment.commission)}</p>
                  <p className="text-xs text-gray-400">Platform commission (15%)</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{t.modal.fullSalary}</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(selectedPayment.fullSalary)}</p>
                  <p className="text-xs text-gray-400">Paid directly to worker</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">{t.modal.date}</p>
                  <p className="text-xl font-bold text-gray-800">{formatDate(selectedPayment.createdAt)}</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">{t.modal.note}</p>
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
                  {selectedPayment.paymentMethod && (
                    <p className="text-sm text-gray-500 mt-1">{t.modal.method}: {selectedPayment.paymentMethod}</p>
                  )}
                </div>
              </div>

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
                <>
                  <button
                    onClick={() => handleProcessPayment(selectedPayment)}
                    className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} />
                    {t.actions.payNow}
                  </button>
                  <button
                    onClick={() => markPaymentAsCompleted(selectedPayment)}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    {t.markPaid}
                  </button>
                </>
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