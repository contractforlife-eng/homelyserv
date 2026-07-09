// src/pages/employer/EmployerPayments.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  UserCheck
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
            <Link to="/employer-dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/employer-dashboard" className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center mx-auto">
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
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-teal-600" />
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

// Main EmployerPayments Component - Simplified
const EmployerPayments = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const translations = {
    en: {
      title: 'Payment Details',
      subtitle: 'Review and confirm your hiring payment',
      workerDetails: 'Worker Details',
      paymentSummary: 'Payment Summary',
      hourlyRate: 'Hourly Rate',
      subtotal: 'Subtotal',
      commission: 'Commission (15%)',
      total: 'Total Amount',
      confirmPayment: 'Confirm Payment',
      processing: 'Processing...',
      success: 'Payment Successful!',
      successMessage: 'You have successfully hired this worker.',
      backToSearch: 'Back to Search',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading payment details...',
      noWorkerData: 'No worker selected',
      goBack: 'Go back and select a worker'
    },
    ar: {
      title: 'تفاصيل الدفع',
      subtitle: 'مراجعة وتأكيد دفع التوظيف',
      workerDetails: 'تفاصيل العامل',
      paymentSummary: 'ملخص الدفع',
      hourlyRate: 'السعر بالساعة',
      subtotal: 'المجموع الفرعي',
      commission: 'العمولة (15%)',
      total: 'المبلغ الإجمالي',
      confirmPayment: 'تأكيد الدفع',
      processing: 'جاري المعالجة...',
      success: 'تم الدفع بنجاح!',
      successMessage: 'لقد قمت بتوظيف هذا العامل بنجاح.',
      backToSearch: 'العودة إلى البحث',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل تفاصيل الدفع...',
      noWorkerData: 'لم يتم اختيار عامل',
      goBack: 'ارجع واختر عاملاً'
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

    // Load selected worker data
    const selectedWorker = localStorage.getItem('homelyserv_selected_worker');
    if (selectedWorker) {
      try {
        setWorkerData(JSON.parse(selectedWorker));
      } catch (error) {
        console.error('Error parsing worker data:', error);
        setWorkerData(null);
      }
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

  const handleBack = () => {
    navigate('/employer-search');
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      
      // Save hire record
      const hireRecord = {
        id: 'hire_' + Date.now(),
        workerId: workerData?.workerId,
        workerName: workerData?.workerName,
        employerId: user?.id || user?.email,
        employerName: user?.fullName,
        amount: total,
        commission: commissionAmount,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      const hires = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
      hires.push(hireRecord);
      localStorage.setItem('homelyserv_hires', JSON.stringify(hires));
      
      localStorage.removeItem('homelyserv_selected_worker');
    }, 2000);
  };

  const hourlyRate = parseFloat(workerData?.hourlyRate) || 0;
  const hoursPerWeek = 40;
  const weeksPerMonth = 4;
  const subtotal = hourlyRate * hoursPerWeek * weeksPerMonth;
  const commissionRate = 0.15;
  const commissionAmount = subtotal * commissionRate;
  const total = subtotal + commissionAmount;

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
                onClick={handleBack}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                {t.backToSearch}
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
          {paymentSuccess ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-green-200">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.success}</h2>
              <p className="text-gray-600 mb-6">{t.successMessage}</p>
              <button
                onClick={() => navigate('/employer-search')}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                {t.backToSearch}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.workerDetails}</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                      <User size={32} className="text-teal-600" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">{workerData?.workerName}</h4>
                      <p className="text-gray-500">{workerData?.desiredJob || 'Worker'}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {workerData?.workerLocation || 'Location not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-24">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.paymentSummary}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t.hourlyRate}</span>
                      <span className="font-medium">EGP {hourlyRate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Hours/Week</span>
                      <span className="font-medium">40 hrs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Weeks/Month</span>
                      <span className="font-medium">4 weeks</span>
                    </div>
                    
                    <div className="border-t border-gray-200 my-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t.subtotal}</span>
                        <span className="font-medium">EGP {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t.commission}</span>
                        <span className="font-medium text-red-500">+ EGP {commissionAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>{t.total}</span>
                        <span className="text-teal-600">EGP {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="w-full mt-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t.processing}
                      </>
                    ) : (
                      <>
                        <Shield size={18} />
                        {t.confirmPayment}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBack}
                    className="w-full mt-2 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    {t.backToSearch}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployerPayments;