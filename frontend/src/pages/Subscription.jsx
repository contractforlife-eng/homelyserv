// src/pages/Subscription.jsx - FIXED
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
  BarChart3
} from 'lucide-react';
import {
  getSubscriptionPrice,
  createSubscription,
  getUserSubscription,
  isUserPremium as checkUserPremium,
  getSubscriptionStatus
} from '../utils/subscriptionService';

// Sidebar Component - FIXED: Includes Premium menu item
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

  const t = translations[language];

  // ✅ FIX: Premium menu item is now included in all sidebar configurations
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

  // ✅ FIX: Check premium status directly
  const isPremiumUser = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return checkUserPremium(userId);
  };

  const premiumUser = isPremiumUser();

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
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isEmployer ? 'from-teal-500 to-teal-600' : 'from-amber-500 to-rose-500'} flex items-center justify-center flex-shrink-0 overflow-hidden relative`}>
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || (isEmployer ? 'Employer' : 'Worker')} 
                  className="w-full h-full object-cover"
                />
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

// Main Subscription Component
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
  
  const price = isEmployer ? 200 : 100;

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
        creditCard: 'Credit Card',
        wallet: 'Mobile Wallet',
        bankTransfer: 'Bank Transfer'
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
      notifications: 'Notifications'
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
        creditCard: 'بطاقة ائتمان',
        wallet: 'محفظة إلكترونية',
        bankTransfer: 'تحويل بنكي'
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
      notifications: 'الإشعارات'
    }
  };

  const t = translations[language];

  const paymentMethods = [
    { id: 'credit_card', name: t.methods.creditCard, icon: CreditCard },
    { id: 'wallet', name: t.methods.wallet, icon: Smartphone },
    { id: 'bank_transfer', name: t.methods.bankTransfer, icon: Building }
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
          transactionId: subscription.transactionId,
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
        
        setTimeout(() => {
          setProcessing(false);
        }, 1000);
        
      } else {
        setPaymentError('Failed to create subscription. Please try again.');
        setProcessing(false);
      }
      
    } catch (error) {
      console.error('Subscription error:', error);
      setPaymentError('An error occurred. Please try again.');
      setProcessing(false);
    }
  };

  const handleGoBack = () => {
    navigate(isEmployer ? '/employer-dashboard' : '/worker-dashboard');
  };

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
    <div className="min-h-screen bg-gray-50 flex">
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
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
          {/* Back Button */}
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={18} />
            {t.back}
          </button>

          {paymentSuccess ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={48} className="text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{t.payment.success}</h2>
              <p className="text-gray-600 mb-6">{t.payment.successMessage}</p>
              
              <div className="bg-green-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 justify-center">
                  <Crown size={24} className="text-yellow-500" />
                  <span className="font-semibold text-green-800">
                    {isEmployer ? 'Employer' : 'Worker'} Premium Subscription
                  </span>
                  <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full">Active</span>
                </div>
                {currentSubscription?.expiresAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    {t.status.expiresAt.replace('{date}', new Date(currentSubscription.expiresAt).toLocaleDateString())}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleGoBack}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center gap-3">
                  <Crown size={32} className="text-yellow-400" />
                  <div>
                    <h1 className="text-2xl font-bold">{t.title}</h1>
                    <p className="text-teal-100 mt-1">{t.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pricing Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Crown size={32} className="text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{t.pricing.title}</h3>
                    <p className="text-gray-500">{t.pricing.description}</p>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-teal-600">EGP {price}</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {t.pricing.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-gray-600">
                        <CheckCircle size={18} className="text-teal-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {subscriptionStatus?.active && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={16} />
                        <span className="font-medium">{t.status.active}</span>
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

                {/* Payment Form */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.payment.title}</h3>
                  
                  {paymentError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {paymentError}
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-gray-700">{t.payment.chooseMethod}</p>
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => {
                          setSelectedMethod(method.id);
                          setPaymentError(null);
                        }}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          selectedMethod === method.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            selectedMethod === method.id
                              ? 'bg-teal-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <method.icon size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{method.name}</p>
                          </div>
                          {selectedMethod === method.id && (
                            <CheckCircle size={24} className="text-teal-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className={`w-full py-3 rounded-xl text-white font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                      processing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-lg'
                    }`}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {t.payment.processing}
                      </>
                    ) : (
                      <>
                        <Crown size={20} />
                        {t.payment.subscribe}
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    🔒 Secure payment processed by HomelyServ
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Subscription;