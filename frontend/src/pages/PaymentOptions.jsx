// src/pages/PaymentOptions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Check
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

// Main PaymentOptions Component
const PaymentOptions = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Payment methods (Cash removed)
  const paymentMethods = [
    {
      id: 'wallet',
      name: 'Mobile Wallet',
      icon: Smartphone,
      description: 'Pay using your mobile wallet',
      color: 'green',
      details: {
        walletNumber: '01009189851'
      }
    },
    {
      id: 'instapay',
      name: 'InstaPay',
      icon: Wallet,
      description: 'Instant payment with InstaPay',
      color: 'pink',
      details: {
        instapayNumber: '01009189851'
      }
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Direct bank transfer',
      color: 'orange',
      details: {
        accountNumber: '1002425938683',
        iban: 'EG580037000908181002425938683',
        swiftCode: 'QNBAEGCXXXX'
      }
    },
    {
      id: 'credit-card',
      name: 'Credit Card',
      icon: CreditCard,
      description: 'Pay securely with your credit card',
      color: 'blue'
    },
    {
      id: 'debit-card',
      name: 'Debit Card',
      icon: CreditCard,
      description: 'Pay directly from your bank account',
      color: 'purple'
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
      successMessage: 'You have successfully hired this worker.',
      backToSearch: 'Back to Search',
      back: 'Back',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading payment options...',
      noWorkerData: 'No worker selected',
      goBack: 'Go back and select a worker',
      securePayment: 'Secure Payment',
      secureDescription: 'Your payment is encrypted and secure',
      chooseMethod: 'Choose your payment method below',
      recommended: 'Recommended',
      paymentDetails: 'Payment Details',
      walletNumber: 'Wallet Number',
      instapayNumber: 'InstaPay Number',
      accountNumber: 'Account Number',
      iban: 'IBAN',
      swiftCode: 'Swift Code',
      copy: 'Copy',
      copied: 'Copied!'
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
      successMessage: 'لقد قمت بتوظيف هذا العامل بنجاح.',
      backToSearch: 'العودة إلى البحث',
      back: 'رجوع',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل خيارات الدفع...',
      noWorkerData: 'لم يتم اختيار عامل',
      goBack: 'ارجع واختر عاملاً',
      securePayment: 'دفع آمن',
      secureDescription: 'مدفوعاتك مشفرة وآمنة',
      chooseMethod: 'اختر طريقة الدفع أدناه',
      recommended: 'موصى به',
      paymentDetails: 'تفاصيل الدفع',
      walletNumber: 'رقم المحفظة',
      instapayNumber: 'رقم InstaPay',
      accountNumber: 'رقم الحساب',
      iban: 'IBAN',
      swiftCode: 'رمز سويفت',
      copy: 'نسخ',
      copied: 'تم النسخ!'
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
    navigate('/employer-payments');
  };

  const handleSelectMethod = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      
      const hireRecord = {
        id: 'hire_' + Date.now(),
        workerId: workerData?.workerId,
        workerName: workerData?.workerName,
        employerId: user?.id || user?.email,
        employerName: user?.fullName,
        amount: total,
        commission: commissionAmount,
        paymentMethod: selectedMethod,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      const hires = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
      hires.push(hireRecord);
      localStorage.setItem('homelyserv_hires', JSON.stringify(hires));
      
      localStorage.removeItem('homelyserv_selected_worker');
    }, 2500);
  };

  const hourlyRate = parseFloat(workerData?.hourlyRate) || 0;
  const hoursPerWeek = 40;
  const weeksPerMonth = 4;
  const subtotal = hourlyRate * hoursPerWeek * weeksPerMonth;
  const commissionRate = 0.15;
  const commissionAmount = subtotal * commissionRate;
  const total = subtotal + commissionAmount;

  const getMethodColor = (color) => {
    const colors = {
      blue: 'border-blue-200 hover:border-blue-500 hover:bg-blue-50',
      purple: 'border-purple-200 hover:border-purple-500 hover:bg-purple-50',
      green: 'border-green-200 hover:border-green-500 hover:bg-green-50',
      orange: 'border-orange-200 hover:border-orange-500 hover:bg-orange-50',
      pink: 'border-pink-200 hover:border-pink-500 hover:bg-pink-50',
      teal: 'border-teal-200 hover:border-teal-500 hover:bg-teal-50'
    };
    return colors[color] || colors.blue;
  };

  const getMethodBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600',
      teal: 'bg-teal-100 text-teal-600'
    };
    return colors[color] || colors.blue;
  };

  const getSelectedColor = (color) => {
    const colors = {
      blue: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
      purple: 'border-purple-500 bg-purple-50 ring-2 ring-purple-500',
      green: 'border-green-500 bg-green-50 ring-2 ring-green-500',
      orange: 'border-orange-500 bg-orange-50 ring-2 ring-orange-500',
      pink: 'border-pink-500 bg-pink-50 ring-2 ring-pink-500',
      teal: 'border-teal-500 bg-teal-50 ring-2 ring-teal-500'
    };
    return colors[color] || colors.blue;
  };

  const renderPaymentDetails = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method || !method.details) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{t.paymentDetails}</h4>
        <div className="space-y-2">
          {method.details.walletNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.walletNumber}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium">{method.details.walletNumber}</span>
                <button
                  onClick={() => handleCopy(method.details.walletNumber, 'wallet')}
                  className="p-1 hover:bg-gray-200 rounded transition"
                >
                  {copiedField === 'wallet' ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
          {method.details.instapayNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.instapayNumber}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium">{method.details.instapayNumber}</span>
                <button
                  onClick={() => handleCopy(method.details.instapayNumber, 'instapay')}
                  className="p-1 hover:bg-gray-200 rounded transition"
                >
                  {copiedField === 'instapay' ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
          {method.details.accountNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.accountNumber}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium">{method.details.accountNumber}</span>
                <button
                  onClick={() => handleCopy(method.details.accountNumber, 'account')}
                  className="p-1 hover:bg-gray-200 rounded transition"
                >
                  {copiedField === 'account' ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
          {method.details.iban && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.iban}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium">{method.details.iban}</span>
                <button
                  onClick={() => handleCopy(method.details.iban, 'iban')}
                  className="p-1 hover:bg-gray-200 rounded transition"
                >
                  {copiedField === 'iban' ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
          {method.details.swiftCode && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.swiftCode}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium">{method.details.swiftCode}</span>
                <button
                  onClick={() => handleCopy(method.details.swiftCode, 'swift')}
                  className="p-1 hover:bg-gray-200 rounded transition"
                >
                  {copiedField === 'swift' ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/employer-search')}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  {t.backToSearch}
                </button>
                <button
                  onClick={() => navigate('/my-hires')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  View My Hires
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
                <div>
                  <h1 className="text-2xl font-bold">{t.title}</h1>
                  <p className="text-teal-100 mt-1">{t.subtitle}</p>
                </div>
              </div>

              {/* Worker Summary */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                      <User size={28} className="text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{workerData?.workerName}</h3>
                      <p className="text-gray-500">{workerData?.desiredJob || 'Worker'}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {workerData?.workerLocation || 'Location not specified'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500" />
                          {workerData?.rating || '4.5'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{t.totalAmount}</p>
                    <p className="text-2xl font-bold text-teal-600">EGP {total.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{t.commission}</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => {
                    const isSelected = selectedMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => handleSelectMethod(method.id)}
                        className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                          isSelected 
                            ? getSelectedColor(method.color)
                            : getMethodColor(method.color)
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getMethodBgColor(method.color)}`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800">{method.name}</p>
                              {method.id === 'credit-card' && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-semibold rounded">
                                  {t.recommended}
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

                {/* Payment Details - Show when method with details is selected */}
                {renderPaymentDetails()}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing || !selectedMethod}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  {t.back}
                </button>
              </div>

              {!selectedMethod && (
                <p className="text-sm text-red-500 mt-3 text-center">{t.selectMethod}</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentOptions;