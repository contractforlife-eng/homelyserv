// src/pages/Payment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  CreditCard,
  Wallet,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  ArrowLeft,
  Download,
  FileText,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Building2,
  Banknote,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Worker Sidebar Component (keep your existing one - just make sure CreditCard is imported)

// Main Payment Component - UPDATED
const Payment = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  const translations = {
    en: {
      title: 'Payment Management',
      subtitle: 'Track your earnings and payment history',
      stats: {
        balance: 'Available Balance',
        totalEarned: 'Total Earned',
        pending: 'Pending Payments',
        completed: 'Completed'
      },
      history: 'Payment History',
      noTransactions: 'No transactions yet',
      noTransactionsDesc: 'Your payment history will appear here once you complete jobs',
      amount: 'Amount',
      date: 'Date',
      status: 'Status',
      method: 'Method',
      description: 'Description',
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded',
      wallet: 'Wallet',
      bank: 'Bank Transfer',
      card: 'Card',
      cash: 'Cash',
      loading: 'Loading payment data...',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      refresh: 'Refresh'
    },
    ar: {
      title: 'إدارة المدفوعات',
      subtitle: 'تتبع أرباحك وسجل المدفوعات',
      stats: {
        balance: 'الرصيد المتاح',
        totalEarned: 'إجمالي الأرباح',
        pending: 'المدفوعات المعلقة',
        completed: 'مكتملة'
      },
      history: 'سجل المدفوعات',
      noTransactions: 'لا توجد معاملات بعد',
      noTransactionsDesc: 'سيظهر سجل مدفوعاتك هنا بمجرد إكمال الوظائف',
      amount: 'المبلغ',
      date: 'التاريخ',
      status: 'الحالة',
      method: 'الطريقة',
      description: 'الوصف',
      pending: 'معلقة',
      completed: 'مكتملة',
      failed: 'فاشلة',
      refunded: 'مستردة',
      wallet: 'محفظة',
      bank: 'تحويل بنكي',
      card: 'بطاقة',
      cash: 'نقدي',
      loading: 'جاري تحميل بيانات الدفع...',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      refresh: 'تحديث'
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
        loadTransactions(parsedUser);
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

    setLoading(false);
  }, [navigate]);

  // Load transactions from multiple sources
  const loadTransactions = (userData) => {
    try {
      let allTransactions = [];
      
      // 1. Load from worker_transactions
      const savedTransactions = localStorage.getItem('worker_transactions');
      if (savedTransactions) {
        try {
          const parsedTransactions = JSON.parse(savedTransactions);
          allTransactions = parsedTransactions;
        } catch (e) {
          console.error('Error parsing transactions:', e);
        }
      }
      
      // 2. Also check for hires that might not be in worker_transactions yet
      const hires = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
      const workerEmail = userData?.email;
      const workerId = userData?.id;
      
      // Add any hires that are not already in transactions
      hires.forEach(hire => {
        if (hire.workerEmail === workerEmail || hire.workerId === workerId) {
          const exists = allTransactions.some(t => t.hireId === hire.id);
          if (!exists) {
            allTransactions.push({
              id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              workerId: hire.workerId,
              workerName: hire.workerName,
              employerId: hire.employerId,
              employerName: hire.employerName,
              amount: (hire.amount || 0) - (hire.commission || 0),
              commission: hire.commission || 0,
              paymentMethod: hire.paymentMethod || 'bank',
              date: hire.date || new Date().toISOString(),
              status: hire.status === 'completed' ? 'completed' : 'pending',
              description: `Payment from ${hire.employerName || 'Employer'} for work`,
              jobTitle: hire.desiredJob || 'Job',
              hireId: hire.id
            });
          }
        }
      });
      
      // 3. Check for transactions from employer offers
      const offers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      offers.forEach(offer => {
        if (offer.hireId && offer.employerId) {
          const exists = allTransactions.some(t => t.hireId === offer.hireId);
          if (!exists && offer.employerId) {
            allTransactions.push({
              id: 'txn_offer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              workerId: workerId,
              workerName: userData?.fullName || 'Worker',
              employerId: offer.employerId,
              employerName: offer.company || 'Employer',
              amount: (offer.salary?.max || 0) * 0.85,
              commission: (offer.salary?.max || 0) * 0.15,
              paymentMethod: 'bank',
              date: offer.postedAt || new Date().toISOString(),
              status: 'completed',
              description: `Payment from ${offer.company || 'Employer'} for ${offer.title || 'work'}`,
              jobTitle: offer.title || 'Job',
              hireId: offer.hireId
            });
          }
        }
      });
      
      // Save merged transactions back
      if (allTransactions.length > 0) {
        localStorage.setItem('worker_transactions', JSON.stringify(allTransactions));
      }
      
      setTransactions(allTransactions);
      calculateStats(allTransactions);
      
      console.log('✅ Loaded transactions:', allTransactions.length);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    }
  };

  const calculateStats = (txns) => {
    let total = 0;
    let pending = 0;
    let earned = 0;
    
    txns.forEach(t => {
      if (t.status === 'completed') {
        total += t.amount;
        earned += t.amount;
      } else if (t.status === 'pending') {
        pending += t.amount;
      }
    });
    
    setBalance(total);
    setTotalEarned(earned);
    setPendingAmount(pending);
  };

  const refreshData = () => {
    if (user) {
      loadTransactions(user);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      case 'failed': return <X size={16} className="text-red-600" />;
      case 'refunded': return <AlertTriangle size={16} className="text-gray-600" />;
      default: return <AlertCircle size={16} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `EGP ${amount?.toLocaleString() || 0}`;
  };

  const getMethodLabel = (method) => {
    const methods = {
      wallet: 'Wallet',
      instapay: 'InstaPay',
      bank: 'Bank Transfer',
      'bank-transfer': 'Bank Transfer',
      card: 'Card',
      'credit-card': 'Credit Card',
      'debit-card': 'Debit Card',
      cash: 'Cash'
    };
    return methods[method] || method || 'Bank Transfer';
  };

  // Sidebar component (keep your existing one)
  const WorkerSidebar = ({ 
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
        myOffers: 'My Offers',
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
        myOffers: 'عروضي',
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
      { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
      { id: 'profile', label: t.myProfile, icon: User, path: '/worker-profile' },
      { id: 'offers', label: t.myOffers, icon: Briefcase, path: '/worker/offers' },
      { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
      { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
      { id: 'payment', label: t.payment, icon: CreditCard, path: '/payment' },
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
      // ... (keep your existing sidebar JSX)
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
              <Link to="/worker-dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link to="/worker-dashboard" className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
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
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {getProfileImage() ? (
                  <img 
                    src={getProfileImage()} 
                    alt={user?.fullName || 'Worker'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-red-600" />
                )}
              </div>
              {!sidebarCollapsed && user && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{user.fullName || 'Worker'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email || 'worker@homelyserv.com'}</p>
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
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon size={20} className={isActive(item.path) ? 'text-red-600' : ''} />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                )}
                {isActive(item.path) && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-8 bg-red-600 rounded-full"></div>
                )}
              </Link>
            ))}

            <div className="border-t border-gray-200 my-3"></div>

            <Link
              to="/worker-settings"
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 group ${
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

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{loading ? t.loading : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <WorkerSidebar
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>
              <button
                onClick={() => {
                  const newLang = language === 'en' ? 'ar' : 'en';
                  setLanguage(newLang);
                  localStorage.setItem('homelyserv_language', newLang);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
              <button
                onClick={refreshData}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                {t.refresh}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-red-100 mt-1">{t.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.stats.balance}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(balance)}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <Wallet size={24} className="text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.stats.totalEarned}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalEarned)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <DollarSign size={24} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.stats.pending}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(pendingAmount)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Clock size={24} className="text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{t.history}</h3>
              <span className="text-sm text-gray-500">{transactions.length} transactions</span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noTransactions}</h3>
                <p className="text-gray-500">{t.noTransactionsDesc}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.description}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.amount}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.method}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.date}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {transaction.description}
                          {transaction.jobTitle && (
                            <span className="block text-xs text-gray-400">{transaction.jobTitle}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                          {formatCurrency(transaction.amount)}
                          {transaction.commission && (
                            <span className="block text-xs text-gray-400">Commission: {formatCurrency(transaction.commission)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {getMethodLabel(transaction.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            {t[transaction.status] || transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;