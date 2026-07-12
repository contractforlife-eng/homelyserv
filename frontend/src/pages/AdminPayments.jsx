import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  CreditCard,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  FileText,
  User as UserIcon,
  Calendar,
  TrendingUp
} from 'lucide-react';

// Admin Sidebar Component - Dark Theme
const AdminSidebar = ({ 
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
      users: 'Users',
      messages: 'Messages',
      payments: 'Payments',
      settings: 'Settings',
      logout: 'Logout',
      overview: 'Overview'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      users: 'المستخدمين',
      messages: 'الرسائل',
      payments: 'المدفوعات',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/admin' },
    { id: 'users', label: t.users, icon: Users, path: '/admin/users' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/admin/messages' },
    { id: 'payments', label: t.payments, icon: CreditCard, path: '/admin/payments' },
    { id: 'settings', label: t.settings, icon: Settings, path: '/admin/settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-[#1a1a1a] border-r border-yellow-500/20 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-yellow-500/20">
          {!sidebarCollapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-white text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/admin" className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-black font-bold text-sm">H</span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors hidden lg:block text-gray-400 hover:text-yellow-500"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors lg:hidden text-gray-400 hover:text-yellow-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-yellow-500/20 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
              <UserIcon size={20} className="text-black" />
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user.fullName || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{user.email || 'admin@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t.overview}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-yellow-500'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-black' : 'text-gray-400 group-hover:text-yellow-500'} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-yellow-500 rounded-full"></div>
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-yellow-500/20">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-500 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

// Main AdminPayments Component
const AdminPayments = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const translations = {
    en: {
      title: 'Payments',
      subtitle: 'Manage all payments and transactions',
      stats: {
        total: 'Total Payments',
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed'
      },
      filters: {
        all: 'All Payments',
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed'
      },
      table: {
        id: 'Transaction ID',
        user: 'User',
        amount: 'Amount',
        date: 'Date',
        method: 'Method',
        status: 'Status',
        actions: 'Actions',
        noResults: 'No payments found',
        searchPlaceholder: 'Search payments...'
      },
      actions: {
        view: 'View Details',
        download: 'Download Receipt'
      },
      status: {
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading payments...',
      noPayments: 'No payments yet'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة جميع المدفوعات والمعاملات',
      stats: {
        total: 'إجمالي المدفوعات',
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة'
      },
      filters: {
        all: 'جميع المدفوعات',
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة'
      },
      table: {
        id: 'رقم المعاملة',
        user: 'المستخدم',
        amount: 'المبلغ',
        date: 'التاريخ',
        method: 'الطريقة',
        status: 'الحالة',
        actions: 'الإجراءات',
        noResults: 'لا توجد مدفوعات',
        searchPlaceholder: 'ابحث عن مدفوعات...'
      },
      actions: {
        view: 'عرض التفاصيل',
        download: 'تحميل الإيصال'
      },
      status: {
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل المدفوعات...',
      noPayments: 'لا توجد مدفوعات حتى الآن'
    }
  };

  const t = translations[language];

  useEffect(() => {
  const savedLang = localStorage.getItem('homelyserv_language');
  if (savedLang) {
    setLanguage(savedLang);
  }
  
  // ✅ تحميل المستخدم من localStorage
  const userData = localStorage.getItem('homelyserv_user');
  console.log('📌 User data from localStorage:', userData);
  
  if (userData) {
    try {
      const parsedUser = JSON.parse(userData);
      console.log('📌 Parsed user:', parsedUser);
      console.log('📌 User role:', parsedUser.role);
      
      // ✅ السماح للادمن فقط
      if (parsedUser.role !== 'ADMIN') {
        console.log('❌ User is not admin, redirecting to login');
        navigate('/login');
        return;
      }
      
      setUser(parsedUser);
      console.log('✅ Admin loaded successfully:', parsedUser.fullName);
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  } else {
    console.log('❌ No user data found, redirecting to login');
    navigate('/login');
  }

  const sidebarState = localStorage.getItem('sidebar_collapsed');
  if (sidebarState) {
    setSidebarCollapsed(JSON.parse(sidebarState));
  }

  // تحميل المدفوعات
  const storedPayments = JSON.parse(localStorage.getItem('admin_payments') || '[]');
  setPayments(storedPayments);
  setFilteredPayments(storedPayments);
  setLoading(false);
  
}, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Filter payments
  useEffect(() => {
    let filtered = payments;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.id?.toLowerCase().includes(searchLower) ||
        p.user?.toLowerCase().includes(searchLower) ||
        p.method?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

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

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      failed: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length
  };

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <AdminSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        {/* Top Header Bar */}
        <header className="bg-[#1a1a1a] border-b border-yellow-500/20 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors lg:hidden text-gray-400 hover:text-yellow-500"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white hidden sm:block">{t.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors relative text-gray-400 hover:text-yellow-500">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-500 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/10 transition-colors text-gray-300 hover:text-yellow-500 flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {/* Page Header - Dark Theme */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black">{t.title}</h1>
              <p className="text-black/70 mt-1">{t.subtitle}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.total}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.completed}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.pending}</p>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.failed}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.failed}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Total Amount</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">EGP {totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder={t.table.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="completed">{t.filters.completed}</option>
                  <option value="pending">{t.filters.pending}</option>
                  <option value="failed">{t.filters.failed}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{filteredPayments.length}</span> payments
            </p>
          </div>

          {/* Payments Table */}
          {filteredPayments.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.noPayments}</h3>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a] border-b border-yellow-500/20">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-500/10">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 text-gray-300 text-sm font-mono">{payment.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <UserIcon size={12} className="text-yellow-400" />
                            </div>
                            <span className="text-white text-sm">{payment.user}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-medium">EGP {payment.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{payment.date}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{payment.method}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </span>
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
    </div>
  );
};

export default AdminPayments;