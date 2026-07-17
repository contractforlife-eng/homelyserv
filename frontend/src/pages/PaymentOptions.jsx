// src/pages/PaymentOptions.jsx - COMPLETE WITH PAYMOB & PAYPAL INTEGRATION
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
import { createPaymobPayment, createPayPalOrder, capturePayPalOrder } from '../services/paymentService';
import { PAYMENT_METHODS, PAYMENT_STATUS, TRANSACTION_TYPES } from '../config/paymentConfig';
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Building2,
  Shield,
  CheckCircle,
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
  User,
  MapPin,
  DollarSign,
  Smartphone,
  Banknote,
  Lock,
  Star,
  Copy,
  Check,
  Calendar,
  User as UserIcon,
  Phone,
  Mail,
  Briefcase,
  Crown,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

// Employer Sidebar Component
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
// MAIN PAYMENT OPTIONS COMPONENT - PAYMOB & PAYPAL ONLY
// ============================================================
const PaymentOptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workerData, setWorkerData] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymobIframe, setPaymobIframe] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Payment Methods - ONLY PAYMOB & PAYPAL (previous methods disabled)
  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PAYMOB,
      name: 'Paymob',
      icon: CreditCard,
      description: 'Pay with credit card, debit card, or online banking',
      color: 'teal',
      badge: 'Recommended',
      badgeColor: 'bg-green-100 text-green-700'
    },
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: 'PayPal',
      icon: Wallet,
      description: 'Pay securely with your PayPal account',
      color: 'blue',
      badge: null,
      badgeColor: null
    }
  ];

  const translations = {
    en: {
      title: 'Payment Options',
      subtitle: 'Choose your preferred payment method',
      selectedWorker: 'Selected Worker',
      totalAmount: 'Total Amount',
      commission: 'Commission (15%) included',
      paymentMethods: 'Payment Methods',
      selectMethod: 'Select a payment method',
      confirmPayment: 'Confirm Payment',
      processing: 'Processing...',
      success: 'Payment Successful!',
      successMessage: 'You have successfully hired this worker. An offer has been created for them.',
      back: 'Back',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading payment options...',
      noWorkerData: 'No worker selected',
      goBack: 'Go back and select a worker',
      securePayment: 'Secure Payment',
      chooseMethod: 'Choose your payment method below',
      jobTitle: 'Job Title',
      employer: 'Employer',
      worker: 'Worker',
      hireSuccess: '✅ Successfully hired {worker}!',
      viewHires: 'View My Hires',
      paymobTitle: 'Pay with Paymob',
      paypalTitle: 'Pay with PayPal',
      redirecting: 'Redirecting to payment page...',
      paymentFailed: 'Payment failed. Please try again.',
      paymentCancelled: 'Payment cancelled.',
      paymentVerifying: 'Verifying payment...',
      payNow: 'Pay Now',
      reference: 'Reference',
      orderId: 'Order ID',
      amount: 'Amount',
      currency: 'EGP'
    },
    ar: {
      title: 'خيارات الدفع',
      subtitle: 'اختر طريقة الدفع المفضلة لديك',
      selectedWorker: 'العامل المختار',
      totalAmount: 'المبلغ الإجمالي',
      commission: 'العمولة (15%) مشمولة',
      paymentMethods: 'طرق الدفع',
      selectMethod: 'اختر طريقة الدفع',
      confirmPayment: 'تأكيد الدفع',
      processing: 'جاري المعالجة...',
      success: 'تم الدفع بنجاح!',
      successMessage: 'لقد قمت بتوظيف هذا العامل بنجاح. تم إنشاء عرض عمل له.',
      back: 'رجوع',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل خيارات الدفع...',
      noWorkerData: 'لم يتم اختيار عامل',
      goBack: 'ارجع واختر عاملاً',
      securePayment: 'دفع آمن',
      chooseMethod: 'اختر طريقة الدفع أدناه',
      jobTitle: 'المسمى الوظيفي',
      employer: 'صاحب العمل',
      worker: 'العامل',
      hireSuccess: '✅ تم توظيف {worker} بنجاح!',
      viewHires: 'عرض توظيفاتي',
      paymobTitle: 'الدفع عبر Paymob',
      paypalTitle: 'الدفع عبر PayPal',
      redirecting: 'جاري التوجيه إلى صفحة الدفع...',
      paymentFailed: 'فشل الدفع. يرجى المحاولة مرة أخرى.',
      paymentCancelled: 'تم إلغاء الدفع.',
      paymentVerifying: 'جاري التحقق من الدفع...',
      payNow: 'ادفع الآن',
      reference: 'المرجع',
      orderId: 'رقم الطلب',
      amount: 'المبلغ',
      currency: 'EGP'
    }
  };

  const t = translations[language];

  // ============================================================
  // CALCULATE TOTAL - UPDATED VERSION
  // ============================================================
  const calculateTotal = () => {
    // Premium Quick Hire
    if (pendingPayment?.paymentType === "quick_hire_premium") {
        return 299;
    }

    // Use amount already calculated by EmployerSearch
    if (pendingPayment?.amount && Number(pendingPayment.amount) > 0) {
        return Number(pendingPayment.amount);
    }

    // Try every possible salary field
    const hourlyRate =
        Number(workerData?.hourlyRate) ||
        Number(workerData?.expectedHourlyRate) ||
        Number(workerData?.salary) ||
        Number(workerData?.expectedSalary) ||
        Number(workerData?.rate) ||
        Number(workerData?.price) ||
        30;

    return hourlyRate * 40 * 4 * 1.15;
  };

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
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
      }
    } else {
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }

    // Get worker data
    const selectedWorker = localStorage.getItem('homelyserv_selected_worker');
    if (selectedWorker) {
      try {
        const parsedWorker = JSON.parse(selectedWorker);
        setWorkerData(parsedWorker);
        console.log('✅ Worker Data:', parsedWorker);
      } catch (error) {
        console.error('Error parsing worker data:', error);
        setWorkerData(null);
      }
    }
    
    // Get pending payment
    const savedPendingPayment = localStorage.getItem('homelyserv_pending_payment');
    if (savedPendingPayment) {
      try {
        const parsedPayment = JSON.parse(savedPendingPayment);
        setPendingPayment(parsedPayment);
        console.log('✅ Pending Payment:', parsedPayment);
      } catch (error) {
        console.error('Error parsing pending payment data:', error);
      }
    }

    // Debug log for calculated total
    setTimeout(() => {
      console.log('✅ Calculated Total:', calculateTotal());
    }, 100);

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // ============================================================
  // PAYMENT HANDLERS
  // ============================================================

  // Handle Paymob iframe message
  const handlePaymobMessage = (event) => {
    if (event.data?.type === 'PAYMENT_COMPLETE') {
      console.log('✅ Paymob payment complete:', event.data);
      setPaymentSuccess(true);
      setIsProcessing(false);
      setPaymobIframe(null);
      window.removeEventListener('message', handlePaymobMessage);
      
      // Process successful payment
      processSuccessfulPayment(event.data);
    }
  };

  // Process successful payment
  const processSuccessfulPayment = (paymentData) => {
    try {
      const total = calculateTotal();
      
      // Save hire record
      const hireId = saveHireRecord(workerData, user, {
        amount: total,
        paymentId: paymentData.paymentId || paymentData.transactionId,
        transactionId: paymentData.transactionId || 'TXN-' + Date.now()
      });

      // Update offer status
      if (pendingPayment?.offerId) {
        updateOfferStatus(pendingPayment.offerId, 'hired', hireId);
      }

      // Create payment record
      const paymentRecord = {
        id: 'PAY-' + Date.now(),
        offerId: pendingPayment?.offerId,
        hireId: hireId,
        workerId: workerData?.workerId || workerData?.workerEmail,
        workerName: workerData?.workerName,
        workerEmail: workerData?.workerEmail,
        jobTitle: workerData?.desiredJob || 'Service Provider',
        employerId: user?.id || user?.email,
        employerName: user?.fullName || 'Employer',
        amount: total,
        status: 'completed',
        paymentMethod: selectedMethod,
        paymentType: pendingPayment?.paymentType || 'recruitment',
        transactionId: paymentData.transactionId || 'TXN-' + Date.now(),
        paymentId: paymentData.paymentId,
        createdAt: new Date().toISOString(),
        contactRevealed: true,
        paymentVerified: true
      };

      // Save to all_payments
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      allPayments.push(paymentRecord);
      localStorage.setItem('all_payments', JSON.stringify(allPayments));

      // Save to employer_payments
      const employerPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
      employerPayments.push(paymentRecord);
      localStorage.setItem('employer_payments', JSON.stringify(employerPayments));

      // Clear pending data
      localStorage.removeItem('homelyserv_pending_payment');
      localStorage.removeItem('homelyserv_selected_worker');

      // Show success and redirect
      setTimeout(() => {
        navigate('/my-hires', {
          replace: true,
          state: {
            hireSuccess: true,
            workerName: workerData?.workerName,
            hireId: hireId,
            message: `✅ Successfully hired ${workerData?.workerName}!`
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentError('Failed to process payment. Please contact support.');
    }
  };

  // ============================================================
  // PAYMENT METHODS
  // ============================================================

  const handlePayment = async () => {
    if (!selectedMethod) {
      setPaymentError('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const total = calculateTotal();
      
      // ADDED: Protection against invalid amount
      if (total <= 0 || Number.isNaN(total)) {
        throw new Error(
          "Invalid payment amount. Worker salary or offer amount is missing."
        );
      }

      const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      const customerData = {
        firstName: user?.fullName?.split(' ')[0] || 'Customer',
        lastName: user?.fullName?.split(' ').slice(1).join(' ') || 'User',
        email: user?.email || 'customer@homelyserv.com',
        phone: user?.phone || '+201234567890',
        country: 'EG',
        city: 'Cairo',
        street: '1 Main Street'
      };

      if (selectedMethod === PAYMENT_METHODS.PAYMOB) {
        // Paymob Payment
        const result = await createPaymobPayment(total, orderId, customerData);
        
        if (result.success) {
          setPaymobIframe(result.iframeUrl);
          window.addEventListener('message', handlePaymobMessage);
        } else {
          throw new Error(result.error || 'Paymob payment failed');
        }
        
      } else if (selectedMethod === PAYMENT_METHODS.PAYPAL) {
        // PayPal Payment
        const result = await createPayPalOrder(total, orderId, customerData);
        
        if (result.success) {
          // Open PayPal in new window
          const paypalWindow = window.open(result.approvalUrl, '_blank');
          
          if (!paypalWindow) {
            throw new Error('Popup blocked. Please allow popups for this site.');
          }
          
          // Start polling for payment completion
          startPollingPayPalOrder(result.orderId);
          
          // Show redirecting message
          setPaymentError(null);
        } else {
          throw new Error(result.error || 'PayPal payment failed');
        }
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message);
      setIsProcessing(false);
    }
  };

  // Polling for PayPal payment completion
  const startPollingPayPalOrder = (orderId) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const interval = setInterval(async () => {
      attempts++;
      console.log(`🔄 Checking PayPal order ${orderId} (attempt ${attempts}/${maxAttempts})`);
      
      try {
        const result = await capturePayPalOrder(orderId);
        
        if (result.success) {
          clearInterval(interval);
          setPaymentSuccess(true);
          setIsProcessing(false);
          processSuccessfulPayment(result.transaction);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentError('Payment verification timed out. Please check your PayPal account.');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('PayPal polling error:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentError('Payment verification failed. Please try again.');
          setIsProcessing(false);
        }
      }
    }, 3000);
    
    setPollingInterval(interval);
  };

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const saveHireRecord = (worker, employer, paymentDetails) => {
    try {
      const hireRecord = {
        id: 'hire_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        workerId: worker.workerId || worker.workerEmail,
        workerName: worker.workerName,
        workerEmail: worker.workerEmail,
        workerPhone: worker.workerPhone || '',
        workerLocation: worker.workerLocation || 'Not specified',
        workerImage: worker.profileImage || '',
        workerRating: worker.rating || 4.5,
        employerId: employer.id || employer.email,
        employerEmail: employer.email,
        employerName: employer.fullName || 'Employer',
        jobTitle: worker.desiredJob || 'Service Provider',
        salary: paymentDetails.amount || 0,
        startDate: new Date().toISOString(),
        status: 'active',
        paymentId: paymentDetails.paymentId || null,
        transactionId: paymentDetails.transactionId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPremium: worker.isPremium || false
      };

      let hires = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
      
      const existingHire = hires.find(h => 
        h.workerId === hireRecord.workerId && 
        h.employerId === hireRecord.employerId &&
        h.status === 'active'
      );

      if (existingHire) {
        const updatedHires = hires.map(h => 
          h.id === existingHire.id ? { ...h, ...hireRecord } : h
        );
        localStorage.setItem('homelyserv_hires', JSON.stringify(updatedHires));
        return existingHire.id;
      } else {
        hires.push(hireRecord);
        localStorage.setItem('homelyserv_hires', JSON.stringify(hires));
        return hireRecord.id;
      }
    } catch (error) {
      console.error('Error saving hire record:', error);
      return null;
    }
  };

  const updateOfferStatus = (offerId, status, hireId) => {
    try {
      if (!offerId) return;
      
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const updatedOffers = employerOffers.map(o => 
        o.id === offerId ? { 
          ...o, 
          status: status,
          hireId: hireId,
          hiredAt: new Date().toISOString()
        } : o
      );
      localStorage.setItem('employer_offers', JSON.stringify(updatedOffers));
    } catch (error) {
      console.error('Error updating offer status:', error);
    }
  };

  // ============================================================
  // UI HELPERS
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

  const handleBack = () => {
    navigate('/employer-payments');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getMethodBgColor = (color) => {
    const colors = {
      teal: 'bg-teal-100 text-teal-600',
      blue: 'bg-blue-100 text-blue-600'
    };
    return colors[color] || colors.teal;
  };

  const getMethodBorderColor = (color, selected) => {
    if (selected) {
      return 'border-teal-500 bg-teal-50 ring-2 ring-teal-500';
    }
    return 'border-gray-200 hover:border-teal-300 hover:bg-teal-50';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('message', handlePaymobMessage);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const total = calculateTotal();

  // ============================================================
  // RENDER
  // ============================================================

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

  if (!workerData) {
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
          <div className="p-4 md:p-6">
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noWorkerData}</h3>
              <p className="text-gray-500">{t.goBack}</p>
              <button
                onClick={() => navigate('/employer-search')}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                {t.goBack}
              </button>
            </div>
          </div>
        </main>
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
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-teal-100 mt-1">{t.subtitle}</p>
            </div>
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {paymentError}
            </div>
          )}

          {/* Success Message */}
          {paymentSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {t.success} Redirecting...
            </div>
          )}

          {/* Worker Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                  {workerData?.profileImage ? (
                    <img 
                      src={workerData.profileImage} 
                      alt={workerData?.workerName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-teal-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{workerData?.workerName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Briefcase size={14} />
                    <span>{workerData?.desiredJob || 'Service Provider'}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {workerData?.workerLocation || 'Location not specified'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" />
                      {workerData?.rating || '4.5'}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-500" />
                      {workerData?.hourlyRate || 30} EGP/hr
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t.totalAmount}</p>
                <p className="text-2xl font-bold text-teal-600">EGP {total.toFixed(2)}</p>
                <p className="text-xs text-gray-400">
                  {pendingPayment?.paymentType === 'quick_hire_premium'
                    ? 'Quick Hire premium service fee'
                    : '15% recruitment commission included'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods - ONLY PAYMOB & PAYPAL */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{t.paymentMethods}</h3>
                <p className="text-sm text-gray-500">{t.chooseMethod}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock size={16} className="text-green-500" />
                <span>{t.securePayment}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((method) => {
                const isSelected = selectedMethod === method.id;
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      if (isProcessing) return;
                      setSelectedMethod(method.id);
                      setPaymentError(null);
                    }}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                      isSelected 
                        ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500 ring-opacity-30'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isProcessing}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">{method.name}</p>
                          {method.badge && (
                            <span className={`px-1.5 py-0.5 ${method.badgeColor} text-[10px] font-semibold rounded`}>
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{method.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePayment}
              disabled={isProcessing || !selectedMethod || paymentSuccess}
              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t.processing}
                </>
              ) : (
                <>
                  <Shield size={18} />
                  {t.payNow}
                </>
              )}
            </button>
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              {t.back}
            </button>
          </div>

          {!selectedMethod && !paymentSuccess && (
            <p className="text-sm text-red-500 mt-3 text-center">{t.selectMethod}</p>
          )}

          {/* Info Message */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 text-center flex items-center justify-center gap-2">
              <Lock size={14} />
              Your payment will be processed securely through Paymob or PayPal. 
              The worker will be hired immediately after payment confirmation.
            </p>
          </div>

          {/* Paymob Iframe Modal */}
          {paymobIframe && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">{t.paymobTitle}</h3>
                  <button
                    onClick={() => {
                      setPaymobIframe(null);
                      setIsProcessing(false);
                      window.removeEventListener('message', handlePaymobMessage);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 h-[500px]">
                  <iframe
                    src={paymobIframe}
                    className="w-full h-full border-0"
                    allow="payment"
                    title="Paymob Payment"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PayPal Processing Message */}
          {selectedMethod === PAYMENT_METHODS.PAYPAL && isProcessing && !paymentSuccess && !paymobIframe && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{t.paypalTitle}</h3>
                <p className="text-gray-500 mt-2">{t.redirecting}</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin text-teal-600" />
                  <span className="text-sm text-gray-500">{t.paymentVerifying}</span>
                </div>
                <button
                  onClick={() => {
                    setIsProcessing(false);
                    setPaymentError(t.paymentCancelled);
                  }}
                  className="mt-4 text-sm text-red-500 hover:text-red-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentOptions;