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
  CreditCard
} from 'lucide-react';

// Sidebar Component - Dynamic (works for both worker and employer)
const HelpSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  user, 
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
      overview: 'Overview'
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
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  let menuItems = [];

  if (isEmployer) {
    menuItems = [
      { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
      { id: 'profile', label: t.myProfile, icon: User, path: '/employer-profile' },
      { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
      { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
      { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
      { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
      { id: 'payment', label: t.payment, icon: CreditCard, path: '/payment' },
    ];
  } else {
    menuItems = [
      { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
      { id: 'profile', label: t.myProfile, icon: User, path: '/worker-profile' },
      { id: 'offers', label: t.search, icon: Briefcase, path: '/worker/offers' },
      { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
      { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
      { id: 'payment', label: t.payment, icon: CreditCard, path: '/payment' },
    ];
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isTeal = isEmployer;

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
              <div className={`w-8 h-8 ${isTeal ? 'bg-teal-600' : 'bg-red-600'} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to={isEmployer ? '/employer-dashboard' : '/worker-dashboard'} className={`w-8 h-8 ${isTeal ? 'bg-teal-600' : 'bg-red-600'} rounded-lg flex items-center justify-center mx-auto`}>
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
            <div className={`w-10 h-10 rounded-full ${isTeal ? 'bg-teal-100' : 'bg-red-100'} flex items-center justify-center flex-shrink-0`}>
              <User size={20} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.fullName || 'User'}</p>
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
                  ? isTeal 
                    ? 'bg-teal-50 text-teal-600'
                    : 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? (isTeal ? 'text-teal-600' : 'text-red-600') : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className={`ml-auto w-1.5 h-8 ${isTeal ? 'bg-teal-600' : 'bg-red-600'} rounded-full`}></div>
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isTeal ? 'text-teal-600 hover:bg-teal-50' : 'text-red-600 hover:bg-red-50'} group ${
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

// Main Help Component
const Help = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('WORKER');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

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
      languageToggle: 'العربية',
      notifications: 'Notifications',
      supportHours: 'Support Hours',
      supportHoursDesc: '24/7 available',
      responseTime: 'Average Response Time',
      responseTimeDesc: 'Within 24 hours'
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
      languageToggle: 'English',
      notifications: 'الإشعارات',
      supportHours: 'ساعات الدعم',
      supportHoursDesc: 'متاح 24/7',
      responseTime: 'متوسط وقت الرد',
      responseTimeDesc: 'خلال 24 ساعة'
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
        setUserRole(parsedUser.role || 'WORKER');
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

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const isEmployer = userRole === 'EMPLOYER';

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const faqItems = [
    { question: t.faq1, answer: t.faq1Answer },
    { question: t.faq2, answer: t.faq2Answer },
    { question: t.faq3, answer: t.faq3Answer },
    { question: t.faq4, answer: t.faq4Answer },
    { question: t.faq5, answer: t.faq5Answer },
    { question: t.faq6, answer: t.faq6Answer }
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
        user={user}
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

          {/* Quick Support Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center hover:shadow-md transition">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50' : 'bg-red-50'} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Mail size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800">{t.email}</p>
              <p className="text-xs text-gray-500 mt-1">support@homelyserv.com</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center hover:shadow-md transition">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50' : 'bg-red-50'} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Phone size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800">{t.phone}</p>
              <p className="text-xs text-gray-500 mt-1">+20 123 456 789</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center hover:shadow-md transition">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50' : 'bg-red-50'} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <MessageSquare size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800">{t.chat}</p>
              <p className="text-xs text-gray-500 mt-1">Available 24/7</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center hover:shadow-md transition">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50' : 'bg-red-50'} rounded-xl flex items-center justify-center mx-auto mb-3`}>
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
            <div className="space-y-3">
              {faqItems.map((faq, index) => (
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;