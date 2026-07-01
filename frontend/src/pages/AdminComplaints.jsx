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
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Eye
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
      complaints: 'Complaints',
      settings: 'Settings',
      logout: 'Logout',
      overview: 'Overview'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      users: 'المستخدمين',
      messages: 'الرسائل',
      payments: 'المدفوعات',
      complaints: 'الشكاوى',
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
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/admin/complaints' },
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

// Main AdminComplaints Component
const AdminComplaints = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const translations = {
    en: {
      title: 'Complaints',
      subtitle: 'Manage all user complaints',
      stats: {
        total: 'Total Complaints',
        pending: 'Pending',
        resolved: 'Resolved',
        rejected: 'Rejected'
      },
      filters: {
        all: 'All Complaints',
        pending: 'Pending',
        resolved: 'Resolved',
        rejected: 'Rejected'
      },
      table: {
        title: 'Title',
        user: 'User',
        category: 'Category',
        status: 'Status',
        date: 'Date',
        actions: 'Actions',
        noResults: 'No complaints found',
        searchPlaceholder: 'Search complaints...'
      },
      actions: {
        view: 'View Details',
        resolve: 'Resolve',
        reject: 'Reject'
      },
      status: {
        pending: 'Pending',
        resolved: 'Resolved',
        rejected: 'Rejected'
      },
      categories: {
        general: 'General',
        employer: 'Employer Issue',
        payment: 'Payment Issue',
        platform: 'Platform Issue',
        worker: 'Worker Issue',
        other: 'Other'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading complaints...',
      noComplaints: 'No complaints yet'
    },
    ar: {
      title: 'الشكاوى',
      subtitle: 'إدارة جميع شكاوى المستخدمين',
      stats: {
        total: 'إجمالي الشكاوى',
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        rejected: 'مرفوض'
      },
      filters: {
        all: 'جميع الشكاوى',
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        rejected: 'مرفوض'
      },
      table: {
        title: 'العنوان',
        user: 'المستخدم',
        category: 'الفئة',
        status: 'الحالة',
        date: 'التاريخ',
        actions: 'الإجراءات',
        noResults: 'لا توجد شكاوى',
        searchPlaceholder: 'ابحث عن شكاوى...'
      },
      actions: {
        view: 'عرض التفاصيل',
        resolve: 'حل',
        reject: 'رفض'
      },
      status: {
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        rejected: 'مرفوض'
      },
      categories: {
        general: 'عام',
        employer: 'مشكلة مع صاحب العمل',
        payment: 'مشكلة في الدفع',
        platform: 'مشكلة في المنصة',
        worker: 'مشكلة مع عامل',
        other: 'أخرى'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الشكاوى...',
      noComplaints: 'لا توجد شكاوى حتى الآن'
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
        if (parsedUser.role !== 'ADMIN') {
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

    // Load complaints from localStorage
    const storedComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
    setComplaints(storedComplaints);
    setFilteredComplaints(storedComplaints);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Filter complaints
  useEffect(() => {
    let filtered = complaints;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(searchLower) ||
        c.user?.toLowerCase().includes(searchLower) ||
        c.category?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, statusFilter, searchTerm]);

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

  const updateComplaintStatus = (complaintId, newStatus) => {
    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        return { ...c, status: newStatus };
      }
      return c;
    });
    setComplaints(updatedComplaints);
    localStorage.setItem('admin_complaints', JSON.stringify(updatedComplaints));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      resolved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'resolved': return <CheckCircle size={16} className="text-green-400" />;
      case 'rejected': return <X size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'text-blue-400',
      employer: 'text-purple-400',
      payment: 'text-orange-400',
      platform: 'text-pink-400',
      worker: 'text-green-400',
      other: 'text-gray-400'
    };
    return colors[category] || 'text-gray-400';
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length
  };

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.total}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
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
                <p className="text-sm text-gray-400">{t.stats.resolved}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.resolved}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.rejected}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.rejected}</p>
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
                  <option value="pending">{t.filters.pending}</option>
                  <option value="resolved">{t.filters.resolved}</option>
                  <option value="rejected">{t.filters.rejected}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{filteredComplaints.length}</span> complaints
            </p>
          </div>

          {/* Complaints List */}
          {filteredComplaints.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.noComplaints}</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden hover:border-yellow-500/40 transition"
                >
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={20} className="text-yellow-400" />
                          <div>
                            <h3 className="font-semibold text-white">{complaint.title}</h3>
                            <p className="text-sm text-gray-400">{complaint.user}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">{complaint.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                          <span className={`text-xs font-medium ${getCategoryColor(complaint.category)}`}>
                            {t.categories[complaint.category] || complaint.category}
                          </span>
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-500">{complaint.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(complaint.status)}`}>
                            {getStatusIcon(complaint.status)}
                            {t.status[complaint.status] || complaint.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {complaint.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                              className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition"
                            >
                              {t.actions.resolve}
                            </button>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'rejected')}
                              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition"
                            >
                              {t.actions.reject}
                            </button>
                          </>
                        )}
                        <button className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition">
                          <Eye size={14} className="inline mr-1" />
                          {t.actions.view}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminComplaints;