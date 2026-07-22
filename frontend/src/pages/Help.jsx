// src/pages/Help.jsx
// src/pages/Help.jsx - WITH PREMIUM BADGE FIX
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
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
  Search,
  Mail,
  Phone,
  MessageSquare,
  FileQuestion,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Headphones,
  Clock,
  CreditCard,
  FileCheck,
  Send,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  ThumbsUp,
  Shield,
  Lock,
  UserCheck,
  Zap,
  DollarSign,
  Crown
} from 'lucide-react';

// Sidebar Component - WITH PREMIUM BADGE FIX
const HelpSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  authUser, 
  handleLogout,
  userRole 
}) => {
  const location = useLocation();
  const isEmployer = userRole === 'EMPLOYER';

  const translations = {
    en: {
      dashboard: isEmployer ? 'Dashboard' : 'Dashboard',
      myProfile: isEmployer ? 'My Profile' : 'My Profile',
      myHires: isEmployer ? 'My Hires' : 'My Offers',
      search: isEmployer ? 'Search Workers' : 'My Offers',
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
      dashboard: isEmployer ? 'لوحة التحكم' : 'لوحة التحكم',
      myProfile: isEmployer ? 'ملفي الشخصي' : 'ملفي الشخصي',
      myHires: isEmployer ? 'توظيفاتي' : 'عروضي',
      search: isEmployer ? 'البحث عن عمال' : 'عروضي',
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

  let menuItems = [];

  if (isEmployer) {
    menuItems = [
      { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
      { id: 'profile', label: t.myProfile, icon: User, path: '/employer-profile' },
      { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
      { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
      { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
      { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
      { id: 'payment', label: t.payment, icon: CreditCard, path: '/employer-payments' },
      { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
    ];
  } else {
    menuItems = [
      { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
      { id: 'profile', label: t.myProfile, icon: User, path: '/worker-profile' },
      { id: 'offers', label: t.search, icon: Briefcase, path: '/worker/offers' },
      { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
      { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
      { id: 'payment', label: t.payment, icon: CreditCard, path: '/worker-payment' },
      { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
    ];
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isTeal = isEmployer;

  // Get profile image from authUser
  const getProfileImage = () => {
    if (authUser?.profileImage) {
      return authUser.profileImage;
    }
    return null;
  };

  // ✅ FIX: Check premium status directly using the user ID
  const userIsPremium = () => {
    const userId = authUser?.id || authUser?.email;
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
            <Link to={isEmployer ? '/employer-dashboard' : '/worker-dashboard'} className="flex items-center gap-2">
              <div className={`w-8 h-8 ${isTeal ? 'bg-teal-600' : 'bg-amber-600'} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to={isEmployer ? '/employer-dashboard' : '/worker-dashboard'} className={`w-8 h-8 ${isTeal ? 'bg-teal-600' : 'bg-amber-600'} rounded-lg flex items-center justify-center mx-auto`}>
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

        {/* Profile section with image AND PREMIUM BADGE */}
        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${isTeal ? 'bg-teal-100' : 'bg-amber-100'} flex items-center justify-center flex-shrink-0 overflow-hidden relative`}>
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={authUser?.fullName || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className={isTeal ? 'text-teal-600' : 'text-amber-600'} />
              )}
              {isPremium && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            {!sidebarCollapsed && authUser && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{authUser.fullName || 'User'}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{authUser.email || 'user@homelyserv.com'}</p>
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
                  ? isTeal 
                    ? 'bg-teal-50 text-teal-600'
                    : 'bg-amber-50 text-amber-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? (isTeal ? 'text-teal-600' : 'text-amber-600') : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className={`ml-auto w-1.5 h-8 ${isTeal ? 'bg-teal-600' : 'bg-amber-600'} rounded-full`}></div>
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isTeal ? 'text-teal-600 hover:bg-teal-50' : 'text-amber-600 hover:bg-amber-50'} group ${
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


// Main Help Component - ENHANCED
const Help = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const [language, setLanguage] = useState('en');
  const [userRole, setUserRole] = useState('WORKER');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const translations = {
    en: {
      title: 'Help & Support',
      subtitle: 'Find answers to your questions and get support',
      quickSupport: 'Quick Support',
      faq: 'Frequently Asked Questions',
      contact: 'Contact Support',
      email: 'Email Us',
      phone: 'Call Us',
      chat: 'Live Chat',
      documentation: 'Documentation',
      faq1: 'How do I apply for a job?',
      faq1Answer: 'Browse available offers and click "Apply Now" on any position that matches your skills. Your application will be sent to the employer for review.',
      faq2: 'How do I update my profile?',
      faq2Answer: 'Go to "My Profile" in the sidebar and click "Edit Profile" to update your personal information, skills, and experience.',
      faq3: 'How do I contact an employer?',
      faq3Answer: 'Use the "Messages" section to communicate with employers directly. You can also contact them through job postings.',
      faq4: 'How do I report a problem?',
      faq4Answer: 'Go to "Complaints" in the sidebar to submit a report. Our support team will review and respond to your complaint.',
      faq5: 'How do I hire a worker?',
      faq5Answer: 'Use the "Search Workers" page to find qualified candidates. You can view their profiles and send them a hire request.',
      faq6: 'How do I make a payment?',
      faq6Answer: 'Payments can be made securely through the platform using various payment methods including credit cards and bank transfers.',
      faq7: 'What is the commission rate?',
      faq7Answer: 'The platform charges a 15% commission on successful hires. This covers payment processing, support, and platform maintenance.',
      faq8: 'How do I cancel a contract?',
      faq8Answer: 'You can cancel a contract from the "My Hires" page. Select the worker and click "Cancel Contract". Please review the terms and conditions first.',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      supportHours: 'Support Hours',
      supportHoursDesc: '24/7 available',
      responseTime: 'Average Response Time',
      responseTimeDesc: 'Within 24 hours',
      searchPlaceholder: 'Search help articles...',
      noResults: 'No results found',
      tryDifferent: 'Try using different keywords',
      feedback: 'Was this helpful?',
      yes: 'Yes',
      no: 'No',
      thankYou: 'Thank you for your feedback!',
      sendFeedback: 'Send Feedback',
      feedbackPlaceholder: 'Tell us how we can improve...',
      submit: 'Submit',
      popularTopics: 'Popular Topics',
      gettingStarted: 'Getting Started',
      accountManagement: 'Account Management',
      hiring: 'Hiring & Jobs',
      payments: 'Payments & Billing',
      security: 'Security & Privacy',
      troubleshooting: 'Troubleshooting'
    },
    ar: {
      title: 'المساعدة والدعم',
      subtitle: 'ابحث عن إجابات لأسئلتك واحصل على الدعم',
      quickSupport: 'الدعم السريع',
      faq: 'الأسئلة الشائعة',
      contact: 'اتصل بالدعم',
      email: 'راسلنا عبر البريد الإلكتروني',
      phone: 'اتصل بنا',
      chat: 'الدردشة المباشرة',
      documentation: 'التوثيق',
      faq1: 'كيف يمكنني التقديم على وظيفة؟',
      faq1Answer: 'تصفح العروض المتاحة وانقر على "تقديم الآن" لأي منصب يناسب مهاراتك. سيتم إرسال طلبك إلى صاحب العمل للمراجعة.',
      faq2: 'كيف يمكنني تحديث ملفي الشخصي؟',
      faq2Answer: 'اذهب إلى "ملفي الشخصي" في الشريط الجانبي وانقر على "تعديل الملف" لتحديث معلوماتك الشخصية ومهاراتك وخبراتك.',
      faq3: 'كيف يمكنني التواصل مع صاحب العمل؟',
      faq3Answer: 'استخدم قسم "الرسائل" للتواصل مباشرة مع أصحاب العمل. يمكنك أيضاً التواصل معهم من خلال إعلانات الوظائف.',
      faq4: 'كيف يمكنني الإبلاغ عن مشكلة؟',
      faq4Answer: 'اذهب إلى "الشكاوى" في الشريط الجانبي لتقديم بلاغ. سيقوم فريق الدعم بمراجعة شكواك والرد عليها.',
      faq5: 'كيف يمكنني توظيف عامل؟',
      faq5Answer: 'استخدم صفحة "البحث عن عمال" للعثور على مرشحين مؤهلين. يمكنك عرض ملفاتهم الشخصية وإرسال طلب توظيف.',
      faq6: 'كيف يمكنني إجراء دفعة؟',
      faq6Answer: 'يمكن إجراء الدفعات بشكل آمن من خلال المنصة باستخدام طرق دفع متنوعة بما في ذلك بطاقات الائتمان والتحويلات المصرفية.',
      faq7: 'ما هي نسبة العمولة؟',
      faq7Answer: 'تفرض المنصة عمولة 15% على التوظيفات الناجحة. تغطي هذه العمولة معالجة المدفوعات والدعم وصيانة المنصة.',
      faq8: 'كيف يمكنني إلغاء عقد؟',
      faq8Answer: 'يمكنك إلغاء العقد من صفحة "توظيفاتي". اختر العامل وانقر على "إلغاء العقد". يرجى مراجعة الشروط والأحكام أولاً.',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      supportHours: 'ساعات الدعم',
      supportHoursDesc: 'متاح 24/7',
      responseTime: 'متوسط وقت الرد',
      responseTimeDesc: 'خلال 24 ساعة',
      searchPlaceholder: 'ابحث في مقالات المساعدة...',
      noResults: 'لا توجد نتائج',
      tryDifferent: 'حاول استخدام كلمات مختلفة',
      feedback: 'هل كان هذا مفيداً؟',
      yes: 'نعم',
      no: 'لا',
      thankYou: 'شكراً لملاحظاتك!',
      sendFeedback: 'إرسال ملاحظات',
      feedbackPlaceholder: 'أخبرنا كيف يمكننا تحسين...',
      submit: 'إرسال',
      popularTopics: 'مواضيع شائعة',
      gettingStarted: 'بدء الاستخدام',
      accountManagement: 'إدارة الحساب',
      hiring: 'التوظيف والوظائف',
      payments: 'المدفوعات والفواتير',
      security: 'الأمان والخصوصية',
      troubleshooting: 'استكشاف الأخطاء'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    // Get user role from authStore
    if (authUser) {
      setUserRole(authUser.role || 'WORKER');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, [authUser]);

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

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleFeedback = (type) => {
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
    }, 3000);
  };

  const handleFeedbackSubmit = () => {
    if (feedbackText.trim()) {
      alert(t.thankYou);
      setFeedbackText('');
    }
  };

  const isEmployer = userRole === 'EMPLOYER';

  // Filter FAQ based on search
  const filteredFaqs = [
    { question: t.faq1, answer: t.faq1Answer },
    { question: t.faq2, answer: t.faq2Answer },
    { question: t.faq3, answer: t.faq3Answer },
    { question: t.faq4, answer: t.faq4Answer },
    { question: t.faq5, answer: t.faq5Answer },
    { question: t.faq6, answer: t.faq6Answer },
    { question: t.faq7, answer: t.faq7Answer },
    { question: t.faq8, answer: t.faq8Answer }
  ].filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqItems = [
    { question: t.faq1, answer: t.faq1Answer },
    { question: t.faq2, answer: t.faq2Answer },
    { question: t.faq3, answer: t.faq3Answer },
    { question: t.faq4, answer: t.faq4Answer },
    { question: t.faq5, answer: t.faq5Answer },
    { question: t.faq6, answer: t.faq6Answer },
    { question: t.faq7, answer: t.faq7Answer },
    { question: t.faq8, answer: t.faq8Answer }
  ];

  const isTeal = isEmployer;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <HelpSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        authUser={authUser}
        handleLogout={handleLogout}
        userRole={userRole}
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
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {/* Page Header */}
          <div className={`bg-gradient-to-r ${isTeal ? 'from-teal-600 to-teal-700' : 'from-red-600 to-red-700'} rounded-2xl p-6 mb-6 text-white`}>
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className={`${isTeal ? 'text-teal-100' : 'text-red-100'} mt-1`}>{t.subtitle}</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Popular Topics */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.popularTopics}</h3>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm hover:bg-teal-100 transition">
                <Zap size={14} className="inline mr-1" />
                {t.gettingStarted}
              </button>
              <button className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition">
                <User size={14} className="inline mr-1" />
                {t.accountManagement}
              </button>
              <button className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition">
                <Briefcase size={14} className="inline mr-1" />
                {t.hiring}
              </button>
              <button className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm hover:bg-yellow-100 transition">
                <DollarSign size={14} className="inline mr-1" />
                {t.payments}
              </button>
              <button className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition">
                <Shield size={14} className="inline mr-1" />
                {t.security}
              </button>
              <button className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100 transition">
                <AlertCircle size={14} className="inline mr-1" />
                {t.troubleshooting}
              </button>
            </div>
          </div>

          {/* Quick Support Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center hover:shadow-md transition group">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 group-hover:bg-teal-100' : 'bg-red-50 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <Mail size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800">{t.email}</p>
              <p className="text-xs text-gray-500 mt-1">support@homelyserv.com</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center hover:shadow-md transition group">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 group-hover:bg-teal-100' : 'bg-red-50 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <Phone size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800">{t.phone}</p>
              <p className="text-xs text-gray-500 mt-1">+20 123 456 789</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center hover:shadow-md transition group">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 group-hover:bg-teal-100' : 'bg-red-50 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <MessageSquare size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800">{t.chat}</p>
              <p className="text-xs text-gray-500 mt-1">Available 24/7</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center hover:shadow-md transition group">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 group-hover:bg-teal-100' : 'bg-red-50 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <BookOpen size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800">{t.documentation}</p>
              <p className="text-xs text-gray-500 mt-1">User Guide</p>
            </div>
          </div>

          {/* Support Stats */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isTeal ? 'bg-teal-50' : 'bg-red-50'} rounded-lg flex items-center justify-center`}>
                  <Clock size={20} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{t.supportHours}</p>
                  <p className="text-sm text-gray-500">{t.supportHoursDesc}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isTeal ? 'bg-teal-50' : 'bg-red-50'} rounded-lg flex items-center justify-center`}>
                  <Headphones size={20} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{t.responseTime}</p>
                  <p className="text-sm text-gray-500">{t.responseTimeDesc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.faq}</h3>
            
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500">{t.noResults}</p>
                <p className="text-sm text-gray-400">{t.tryDifferent}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition ${
                        expandedFaq === index ? (isTeal ? 'bg-teal-50' : 'bg-red-50') : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileQuestion size={18} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
                        <span className="font-medium text-gray-800">{faq.question}</span>
                      </div>
                      {expandedFaq === index ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-600">{faq.answer}</p>
                        
                        {/* Feedback Section */}
                        {!feedbackSubmitted ? (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4">
                            <span className="text-sm text-gray-500">{t.feedback}</span>
                            <button
                              onClick={() => handleFeedback('yes')}
                              className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm"
                            >
                              <ThumbsUp size={14} />
                              {t.yes}
                            </button>
                            <button
                              onClick={() => handleFeedback('no')}
                              className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
                            >
                              <ThumbsUp size={14} className="rotate-180" />
                              {t.no}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle size={16} />
                              <span className="text-sm">{t.thankYou}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.sendFeedback}</h3>
            <p className="text-sm text-gray-500 mb-4">We value your feedback to improve our support</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t.feedbackPlaceholder}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows="2"
              />
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim()}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
                {t.submit}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;