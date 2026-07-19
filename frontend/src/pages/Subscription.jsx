// src/pages/Subscription.jsx - UPDATED WITH PAYMOB & PAYPAL + PREMIUM DESIGN + WORKING NOTIFICATIONS
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
import {
  Shield,
  Star,
  CheckCircle,
  Crown,
  Sparkles,
  ArrowLeft,
  CreditCard,
  Wallet,
  Building,
  Smartphone,
  AlertCircle,
  Loader2,
  User,
  Home,
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
  FileCheck,
  Search,
  AlertTriangle,
  TrendingUp,
  Zap,
  Award,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Users,
  BarChart3,
  Shield as ShieldIcon,
  Zap as ZapIcon,
  Gift,
  Rocket,
  Infinity
} from 'lucide-react';
import {
  getSubscriptionPrice,
  createSubscription,
  getUserSubscription,
  isUserPremium as checkUserPremium,
  getSubscriptionStatus
} from '../utils/subscriptionService';
import { createPaymobPayment, createPayPalOrder } from '../services/paymentService';
import { PAYMENT_METHODS, PAYMENT_CONFIG } from '../config/paymentConfig';

// Sidebar Component (kept the same for brevity)
const SubscriptionSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  user, 
  handleLogout,
  isEmployer 
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

  const menuItems = isEmployer ? [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/employer-profile' },
    { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
    { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/employer-payments' },
    { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
  ] : [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/worker-profile' },
    { id: 'offers', label: 'My Offers', icon: Briefcase, path: '/worker/offers' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/worker-payment' },
    { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
  ];

  const isActive = (path) => location.pathname === path;
  const getProfileImage = () => user?.profileImage || null;

  const isPremiumUser = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return checkUserPremium(userId);
  };

  const premiumUser = isPremiumUser();

  return (
    <>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleMobileMenu} />
      )}

      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <Link to={isEmployer ? '/employer-dashboard' : '/worker-dashboard'} className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className={isEmployer ? 'text-teal-500' : 'text-amber-500'} />
                <Home size={14} className={isEmployer ? 'text-teal-300' : 'text-amber-300'} />
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to={isEmployer ? '/employer-dashboard' : '/worker-dashboard'} className="relative mx-auto">
              <Shield size={28} className={isEmployer ? 'text-teal-500' : 'text-amber-500'} />
              <Home size={14} className={isEmployer ? 'text-teal-300' : 'text-amber-300'} />
            </Link>
          )}
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block">
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button onClick={toggleMobileMenu} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden">
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isEmployer ? 'from-teal-500 to-teal-600' : 'from-amber-500 to-rose-500'} flex items-center justify-center flex-shrink-0 overflow-hidden relative`}>
              {getProfileImage() ? (
                <img src={getProfileImage()} alt={user?.fullName || (isEmployer ? 'Employer' : 'Worker')} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-white" />
              )}
              {premiumUser && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{user.fullName || (isEmployer ? 'Employer' : 'Worker')}</p>
                  {premiumUser && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{user.email || 'user@homelyserv.com'}</p>
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
                  ? isEmployer ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? (isEmployer ? 'text-teal-600' : 'text-amber-600') : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className={`ml-auto w-1.5 h-8 ${isEmployer ? 'bg-teal-600' : 'bg-amber-600'} rounded-full`}></div>
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
            to={isEmployer ? '/employer-settings' : '/worker-settings'}
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isEmployer ? 'text-teal-600 hover:bg-teal-50' : 'text-amber-600 hover:bg-amber-50'} group ${
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
// MAIN SUBSCRIPTION COMPONENT - WITH WORKING NOTIFICATIONS
// ============================================================
const Subscription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [isEmployer, setIsEmployer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [paymobIframe, setPaymobIframe] = useState(null);
  
  // ✅ ADDED: Notification state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  
  const price = isEmployer ? 200 : 100;

  // ✅ ADDED: Fetch notifications function
  const fetchNotifications = async () => {
    setNotificationLoading(true);
    try {
      const token = localStorage.getItem('homelyserv_token');
      if (!token) {
        setNotifications([]);
        return;
      }

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
      } else if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  };

  // ✅ ADDED: Fetch notifications when dropdown opens
  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications();
    }
  }, [isNotificationsOpen]);

  const translations = {
    en: {
      title: 'Premium Subscription',
      subtitle: 'Get verified and unlock premium features',
      pricing: {
        title: 'Premium Plan',
        description: 'Get verified badge and premium features',
        price: 'EGP {price}/month',
        features: [
          '⭐ Verification badge on your profile',
          '⭐ Priority in search results',
          '⭐ Access to premium offers',
          '⭐ Priority support',
          '⭐ Advanced analytics'
        ]
      },
      payment: {
        title: 'Subscribe Now',
        chooseMethod: 'Choose Payment Method',
        processing: 'Processing...',
        subscribe: 'Subscribe Now',
        success: '🎉 Subscription Activated!',
        successMessage: 'Your premium subscription is now active.',
        error: 'Payment failed. Please try again.',
        verifyPending: 'Your payment is being verified...',
        alreadySubscribed: 'You already have an active subscription!'
      },
      methods: {
        paymob: 'Paymob',
        paymobDesc: 'Pay with credit card, debit card, or mobile wallet',
        paypal: 'PayPal',
        paypalDesc: 'Pay securely with your PayPal account'
      },
      status: {
        active: 'Active',
        expired: 'Expired',
        inactive: 'Inactive',
        daysLeft: '{days} days left',
        expiresAt: 'Expires on {date}'
      },
      back: 'Back to Dashboard',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      payNow: 'Subscribe Now',
      securePayment: '🔒 Secure payment processed by HomelyServ',
      noNotifications: 'No new notifications'
    },
    ar: {
      title: 'الاشتراك المميز',
      subtitle: 'احصل على التحقق وافتح الميزات المميزة',
      pricing: {
        title: 'الخطة المميزة',
        description: 'احصل على شارة التحقق والميزات المميزة',
        price: '{price} جنيه/شهر',
        features: [
          '⭐ شارة التحقق على ملفك الشخصي',
          '⭐ أولوية في نتائج البحث',
          '⭐ الوصول إلى العروض المميزة',
          '⭐ دعم ذو أولوية',
          '⭐ تحليلات متقدمة'
        ]
      },
      payment: {
        title: 'اشترك الآن',
        chooseMethod: 'اختر طريقة الدفع',
        processing: 'جاري المعالجة...',
        subscribe: 'اشترك الآن',
        success: '🎉 تم تفعيل الاشتراك!',
        successMessage: 'اشتراكك المميز نشط الآن.',
        error: 'فشل الدفع. يرجى المحاولة مرة أخرى.',
        verifyPending: 'دفعتك قيد التحقق...',
        alreadySubscribed: 'لديك اشتراك نشط بالفعل!'
      },
      methods: {
        paymob: 'Paymob',
        paymobDesc: 'ادفع ببطاقة الائتمان أو الخصم أو المحفظة الإلكترونية',
        paypal: 'PayPal',
        paypalDesc: 'ادفع بأمان باستخدام حساب PayPal الخاص بك'
      },
      status: {
        active: 'نشط',
        expired: 'منتهي',
        inactive: 'غير نشط',
        daysLeft: '{days} أيام متبقية',
        expiresAt: 'ينتهي في {date}'
      },
      back: 'العودة إلى لوحة التحكم',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      payNow: 'اشترك الآن',
      securePayment: '🔒 دفعات آمنة بواسطة HomelyServ',
      noNotifications: 'لا توجد إشعارات جديدة'
    }
  };

  const t = translations[language] || translations.en;

  // Payment Methods - ONLY PAYMOB & PAYPAL
  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PAYMOB,
      name: t.methods.paymob,
      icon: CreditCard,
      description: t.methods.paymobDesc,
      color: 'from-blue-500 to-blue-600',
      badge: 'Recommended',
      badgeColor: 'bg-green-100 text-green-700'
    },
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: t.methods.paypal,
      icon: Wallet,
      description: t.methods.paypalDesc,
      color: 'from-blue-700 to-blue-800',
      badge: null,
      badgeColor: null
    }
  ];

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const isEmployerRole = parsedUser.role === 'EMPLOYER';
        setIsEmployer(isEmployerRole);
        setUser(parsedUser);
        
        const userId = parsedUser.id || parsedUser.email;
        const isPremium = checkUserPremium(userId);
        const subscription = getUserSubscription(userId);
        const status = getSubscriptionStatus(userId);
        
        setCurrentSubscription(subscription);
        setSubscriptionStatus(status);
        
        if (isPremium) {
          setPaymentSuccess(true);
        }
        
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate(isEmployer ? '/employer-dashboard' : '/worker-dashboard');
      }
    } else {
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Handle Paymob iframe message
  const handlePaymobMessage = (event) => {
    if (event.data?.type === 'PAYMENT_COMPLETE') {
      setPaymentSuccess(true);
      setProcessing(false);
      setPaymobIframe(null);
      window.removeEventListener('message', handlePaymobMessage);
      
      // Process successful subscription
      processSuccessfulSubscription(event.data);
    }
  };

  const processSuccessfulSubscription = (paymentData) => {
    try {
      const userId = user.id || user.email;
      const userRole = isEmployer ? 'EMPLOYER' : 'WORKER';
      
      const subscription = createSubscription(
        userId,
        user.email,
        userRole,
        user.fullName || (isEmployer ? 'Employer' : 'Worker')
      );

      if (subscription) {
        setCurrentSubscription(subscription);
        setPaymentSuccess(true);
        
        const userData = JSON.parse(localStorage.getItem('homelyserv_user') || '{}');
        userData.isPremium = true;
        userData.subscriptionActive = true;
        localStorage.setItem('homelyserv_user', JSON.stringify(userData));
        
        const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
          users[userIndex].isPremium = true;
          users[userIndex].subscriptionActive = true;
          localStorage.setItem('homelyserv_users', JSON.stringify(users));
        }
        
        const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
        if (profiles[user.email]) {
          profiles[user.email].isPremium = true;
          profiles[user.email].subscriptionActive = true;
          localStorage.setItem('homelyserv_profiles', JSON.stringify(profiles));
        }
        
        const receipt = {
          id: 'SUB-REC-' + Date.now(),
          userId: userId,
          userEmail: user.email,
          userRole: userRole,
          amount: price,
          currency: 'EGP',
          paymentMethod: selectedMethod,
          transactionId: paymentData.transactionId || subscription.transactionId,
          date: new Date().toISOString(),
          status: 'completed',
          subscriptionId: subscription.id || subscription.transactionId
        };
        
        const receipts = JSON.parse(localStorage.getItem('subscription_receipts') || '[]');
        receipts.push(receipt);
        localStorage.setItem('subscription_receipts', JSON.stringify(receipts));
        
        setSubscriptionStatus({
          active: true,
          status: 'active',
          message: 'Active',
          daysLeft: 30,
          expiresAt: subscription.expiresAt
        });
      }
    } catch (error) {
      console.error('Error processing subscription:', error);
      setPaymentError('Failed to process subscription. Please try again.');
    }
  };

  const handleSubscribe = async () => {
    if (!selectedMethod) {
      setPaymentError('Please select a payment method');
      return;
    }

    if (!user) {
      setPaymentError('User not found');
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      const orderId = 'SUB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      const customerData = {
        firstName: user?.fullName?.split(' ')[0] || 'Customer',
        lastName: user?.fullName?.split(' ').slice(1).join(' ') || 'User',
        email: user?.email || 'customer@homelyserv.com',
        phone: user?.phone || '+201234567890',
        country: 'EG',
        city: 'Cairo',
        items: [
          {
            name: isEmployer ? 'Employer Premium Subscription' : 'Worker Premium Subscription',
            amount: price,
            quantity: 1
          }
        ]
      };

      if (selectedMethod === PAYMENT_METHODS.PAYMOB) {
        // Paymob Payment
        const result = await createPaymobPayment(price, orderId, customerData);
        
        if (result.success) {
          setPaymobIframe(result.iframeUrl);
          window.addEventListener('message', handlePaymobMessage);
        } else {
          throw new Error(result.error || 'Paymob payment failed');
        }
        
      } else if (selectedMethod === PAYMENT_METHODS.PAYPAL) {
        // PayPal Payment
        const result = await createPayPalOrder(price, orderId, customerData);
        
        if (result.success) {
          // Open PayPal in new window
          window.open(result.approvalUrl, '_blank');
          
          // Start polling for payment completion
          startPollingPayPalOrder(result.orderId);
        } else {
          throw new Error(result.error || 'PayPal payment failed');
        }
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message);
      setProcessing(false);
    }
  };

  const startPollingPayPalOrder = (orderId) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const result = await capturePayPalOrder(orderId);
        
        if (result.success) {
          clearInterval(interval);
          processSuccessfulSubscription(result.transaction);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentError('Payment verification timed out. Please check your PayPal account.');
          setProcessing(false);
        }
      } catch (error) {
        console.error('PayPal polling error:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentError('Payment verification failed. Please try again.');
          setProcessing(false);
        }
      }
    }, 3000);
  };

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

  const handleGoBack = () => {
    navigate(isEmployer ? '/employer-dashboard' : '/worker-dashboard');
  };

  // Cleanup
  useEffect(() => {
    return () => {
      window.removeEventListener('message', handlePaymobMessage);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex">
      <SubscriptionSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
        handleLogout={handleLogout}
        isEmployer={isEmployer}
      />

      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
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
              {/* ✅ FIXED: Working Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <Bell size={20} className="text-gray-600" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {/* ✅ ADDED: Notification Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 font-semibold text-sm text-gray-800 flex justify-between items-center">
                      <span>{t.notifications}</span>
                      {notificationLoading && (
                        <span className="text-xs text-gray-400">Loading...</span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificationLoading ? (
                        <div className="px-4 py-6 text-sm text-gray-400 text-center">
                          Loading notifications...
                        </div>
                      ) : notifications && notifications.length > 0 ? (
                        notifications.map((n, index) => (
                          <div 
                            key={n.id || index} 
                            className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors cursor-pointer"
                          >
                            <p className="text-sm font-medium text-gray-900">{n.title || 'Notification'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message || n.body || 'No message'}</p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-sm text-gray-400 text-center">
                          {t.noNotifications}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
          {/* Back Button */}
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            {t.back}
          </button>

          {paymentSuccess ? (
            // Success State
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl mx-auto text-center border border-green-100">
              <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle size={56} className="text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-3">{t.payment.success}</h2>
              <p className="text-gray-600 text-lg mb-8">{t.payment.successMessage}</p>
              
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 mb-8 border border-yellow-200">
                <div className="flex items-center gap-4 justify-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                    <Crown size={28} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 text-lg">
                      {isEmployer ? 'Employer' : 'Worker'} Premium
                    </p>
                    <p className="text-sm text-gray-600">Active Subscription</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">Active</span>
                </div>
                {currentSubscription?.expiresAt && (
                  <p className="text-sm text-gray-500 mt-3">
                    {t.status.expiresAt.replace('{date}', new Date(currentSubscription.expiresAt).toLocaleDateString())}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleGoBack}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            // Subscription Form
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-full text-yellow-700 text-sm font-semibold mb-4">
                  <Sparkles size={16} />
                  Premium Features
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                  Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600">Premium</span> Features
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Get verified and access exclusive benefits to boost your profile
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Pricing Card - Takes 2/5 of the space */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 sticky top-24">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Crown size={36} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{t.pricing.title}</h3>
                      <p className="text-gray-500">{t.pricing.description}</p>
                      <div className="mt-4">
                        <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600">EGP {price}</span>
                        <span className="text-gray-500 text-lg">/month</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {t.pricing.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-gray-700">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle size={14} className="text-white" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {subscriptionStatus?.active && (
                      <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={18} />
                          <span className="font-semibold">{t.status.active}</span>
                          <span className="text-sm text-green-600">
                            ({t.status.daysLeft.replace('{days}', subscriptionStatus.daysLeft || 30)})
                          </span>
                        </div>
                        {subscriptionStatus.expiresAt && (
                          <p className="text-xs text-green-600 mt-1">
                            {t.status.expiresAt.replace('{date}', new Date(subscriptionStatus.expiresAt).toLocaleDateString())}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Form - Takes 3/5 of the space */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">{t.payment.title}</h3>
                    
                    {paymentError && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 flex items-start gap-3">
                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    <div className="space-y-4 mb-8">
                      <p className="font-medium text-gray-700">{t.payment.chooseMethod}</p>
                      {paymentMethods.map((method) => {
                        const isSelected = selectedMethod === method.id;
                        const Icon = method.icon;
                        return (
                          <div
                            key={method.id}
                            onClick={() => {
                              if (processing) return;
                              setSelectedMethod(method.id);
                              setPaymentError(null);
                            }}
                            className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/30'
                            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${method.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <Icon size={28} className="text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-800 text-lg">{method.name}</p>
                                  {method.badge && (
                                    <span className={`px-2.5 py-1 ${method.badgeColor} text-xs font-semibold rounded-full`}>
                                      {method.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{method.description}</p>
                              </div>
                              {isSelected && (
                                <CheckCircle size={28} className="text-purple-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleSubscribe}
                      disabled={processing || !selectedMethod}
                      className={`w-full py-4 rounded-2xl text-white font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                        processing || !selectedMethod
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-xl hover:scale-[1.02] transform transition-all'
                      }`}
                    >
                      {processing ? (
                        <>
                          <Loader2 size={22} className="animate-spin" />
                          {t.payment.processing}
                        </>
                      ) : (
                        <>
                          <Crown size={22} />
                          {t.payNow}
                        </>
                      )}
                    </button>

                    <p className="text-sm text-gray-400 text-center mt-4">
                      🔒 {t.securePayment}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Paymob Iframe Modal */}
      {paymobIframe && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pay with Paymob</h3>
              <button
                onClick={() => {
                  setPaymobIframe(null);
                  setProcessing(false);
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
    </div>
  );
};

export default Subscription;