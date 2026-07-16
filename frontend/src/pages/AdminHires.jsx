// src/pages/AdminHires.jsx - COMPLETE WITH ALL FIXES
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
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Shield,
  BarChart3,
  AlertTriangle,
  UserCheck,
  Building2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Award,
  FileText,
  RefreshCw
} from 'lucide-react';

// Admin Sidebar Component - Dark Theme with FULL MENU
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
      hires: 'Hires',
      messages: 'Messages',
      payments: 'Payments',
      complaints: 'Complaints',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout',
      overview: 'Overview'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      users: 'المستخدمين',
      hires: 'التوظيفات',
      messages: 'الرسائل',
      payments: 'المدفوعات',
      complaints: 'الشكاوى',
      reports: 'التقارير',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/admin' },
    { id: 'users', label: t.users, icon: Users, path: '/admin/users' },
    { id: 'hires', label: t.hires, icon: Briefcase, path: '/admin/hires' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/admin/messages' },
    { id: 'payments', label: t.payments, icon: CreditCard, path: '/admin/payments' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/admin/complaints' },
    { id: 'reports', label: t.reports, icon: BarChart3, path: '/admin/reports' },
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
              <div className="relative">
                <Shield size={28} className="text-yellow-500" />
                <Home size={14} className="text-yellow-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-white text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/admin" className="relative mx-auto">
              <Shield size={28} className="text-yellow-500" />
              <Home size={14} className="text-yellow-300 absolute -bottom-1 -right-1" />
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user?.fullName || 'Admin'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-black" />
              )}
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
              {item.id === 'complaints' && !isActive(item.path) && (
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-medium animate-pulse">!</span>
                </div>
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

// ============================================================
// MAIN ADMIN HIRES COMPONENT
// ============================================================
const AdminHires = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hires, setHires] = useState([]);
  const [filteredHires, setFilteredHires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedHire, setExpandedHire] = useState(null);

  const translations = {
    en: {
      title: 'Hire Management',
      subtitle: 'Manage all hires across the platform',
      stats: {
        total: 'Total Hires',
        active: 'Active',
        pending: 'Pending',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      table: {
        id: 'Hire ID',
        worker: 'Worker',
        employer: 'Employer',
        position: 'Position',
        salary: 'Salary',
        status: 'Status',
        date: 'Date',
        satisfaction: 'Satisfaction',
        actions: 'Actions',
        noResults: 'No hires found',
        searchPlaceholder: 'Search hires...'
      },
      status: {
        pending: 'Pending',
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      satisfaction: {
        satisfied: 'Satisfied',
        neutral: 'Neutral',
        unsatisfied: 'Unsatisfied'
      },
      actions: {
        view: 'View Details',
        contact: 'Contact',
        refresh: 'Refresh'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading hires...',
      noHires: 'No hires yet'
    },
    ar: {
      title: 'إدارة التوظيفات',
      subtitle: 'إدارة جميع التوظيفات على المنصة',
      stats: {
        total: 'إجمالي التوظيفات',
        active: 'نشطة',
        pending: 'قيد الانتظار',
        completed: 'مكتملة',
        cancelled: 'ملغية'
      },
      table: {
        id: 'رقم التوظيف',
        worker: 'العامل',
        employer: 'صاحب العمل',
        position: 'الوظيفة',
        salary: 'الراتب',
        status: 'الحالة',
        date: 'التاريخ',
        satisfaction: 'الرضا',
        actions: 'الإجراءات',
        noResults: 'لا توجد توظيفات',
        searchPlaceholder: 'ابحث عن توظيفات...'
      },
      status: {
        pending: 'قيد الانتظار',
        active: 'نشطة',
        completed: 'مكتملة',
        cancelled: 'ملغية'
      },
      satisfaction: {
        satisfied: 'راض',
        neutral: 'محايد',
        unsatisfied: 'غير راض'
      },
      actions: {
        view: 'عرض التفاصيل',
        contact: 'اتصال',
        refresh: 'تحديث'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل التوظيفات...',
      noHires: 'لا توجد توظيفات حتى الآن'
    }
  };

  const t = translations[language];

  // ============================================================
  // Load Hires from localStorage
  // ============================================================
  const loadHires = () => {
    setLoading(true);
    
    try {
      // Get all employer offers that have been accepted
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      
      // Get users for worker and employer details
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      
      // Filter accepted offers
      const acceptedOffers = employerOffers.filter(
        offer => offer.status === 'accepted' || 
                offer.status === 'in_progress' || 
                offer.status === 'completed'
      );
      
      console.log(`📋 Found ${acceptedOffers.length} accepted offers`);
      
      // Map to hire objects with worker and employer details
      const hireData = acceptedOffers.map((offer, index) => {
        // Find worker details
        const worker = users.find(u => u.email === offer.workerEmail);
        // Find employer details
        const employer = users.find(u => u.email === offer.employerEmail);
        
        // Determine satisfaction status based on offer data
        let satisfaction = 'neutral';
        if (offer.workerRating && offer.workerRating >= 4) {
          satisfaction = 'satisfied';
        } else if (offer.workerRating && offer.workerRating <= 2) {
          satisfaction = 'unsatisfied';
        }
        
        // Determine status
        let status = offer.status;
        if (status === 'in_progress') status = 'active';
        if (status === 'accepted') status = 'pending';
        
        return {
          id: offer.id || `HIRE-${String(index + 1).padStart(4, '0')}`,
          worker: {
            name: worker?.fullName || offer.workerName || 'Unknown Worker',
            category: worker?.category || offer.workerCategory || 'N/A',
            rating: offer.workerRating || 4.0,
            location: worker?.location || offer.workerLocation || 'N/A',
            phone: worker?.phone || offer.workerPhone || 'N/A',
            email: worker?.email || offer.workerEmail || 'N/A'
          },
          employer: {
            name: employer?.fullName || offer.employerName || 'Unknown Employer',
            phone: employer?.phone || offer.employerPhone || 'N/A',
            email: employer?.email || offer.employerEmail || 'N/A'
          },
          position: offer.jobTitle || 'Position',
          salary: offer.amount || offer.salary || 0,
          status: status,
          startDate: offer.startDate || offer.createdAt || new Date().toISOString(),
          createdAt: offer.createdAt || offer.updatedAt || new Date().toISOString(),
          paymentStatus: offer.paymentStatus || 'pending',
          satisfaction: satisfaction,
          workerRating: offer.workerRating || 4.0,
          employerRating: offer.employerRating || 4.5
        };
      });
      
      // Sort by date (newest first)
      hireData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setHires(hireData);
      setFilteredHires(hireData);
      
      console.log(`✅ Loaded ${hireData.length} hires`);
      
    } catch (error) {
      console.error('Error loading hires:', error);
      setHires([]);
      setFilteredHires([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // useEffects
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

    loadHires();
    
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Filter hires
  useEffect(() => {
    let filtered = hires;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(h => h.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        h.id?.toLowerCase().includes(searchLower) ||
        h.worker.name.toLowerCase().includes(searchLower) ||
        h.employer.name.toLowerCase().includes(searchLower) ||
        h.position.toLowerCase().includes(searchLower) ||
        h.worker.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredHires(filtered);
  }, [hires, statusFilter, searchTerm]);

  // ============================================================
  // UI Helpers
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

  const handleRefresh = () => {
    loadHires();
  };

  const toggleExpand = (hireId) => {
    setExpandedHire(expandedHire === hireId ? null : hireId);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      active: 'bg-green-500/20 text-green-400',
      completed: 'bg-blue-500/20 text-blue-400',
      cancelled: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'active': return <CheckCircle size={16} className="text-green-400" />;
      case 'completed': return <CheckCircle size={16} className="text-blue-400" />;
      case 'cancelled': return <XCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getSatisfactionIcon = (satisfaction) => {
    switch (satisfaction) {
      case 'satisfied': return <ThumbsUp size={16} className="text-green-400" />;
      case 'neutral': return <Minus size={16} className="text-yellow-400" />;
      case 'unsatisfied': return <ThumbsDown size={16} className="text-red-400" />;
      default: return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getSatisfactionColor = (satisfaction) => {
    switch (satisfaction) {
      case 'satisfied': return 'bg-green-500/20 text-green-400';
      case 'neutral': return 'bg-yellow-500/20 text-yellow-400';
      case 'unsatisfied': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSatisfactionLabel = (satisfaction) => {
    return t.satisfaction[satisfaction] || satisfaction;
  };

  const getStatusLabel = (status) => {
    return t.status[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
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

  const stats = {
    total: hires.length,
    active: hires.filter(h => h.status === 'active').length,
    pending: hires.filter(h => h.status === 'pending').length,
    completed: hires.filter(h => h.status === 'completed').length,
    cancelled: hires.filter(h => h.status === 'cancelled').length
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
      <AdminSidebar
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
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/10 transition-colors text-gray-300 hover:text-yellow-500 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                {t.actions.refresh}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
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
                  <Briefcase size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.active}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
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
                <p className="text-sm text-gray-400">{t.stats.completed}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.cancelled}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <XCircle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.cancelled}</p>
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
                  <option value="all">All Status</option>
                  <option value="pending">{t.status.pending}</option>
                  <option value="active">{t.status.active}</option>
                  <option value="completed">{t.status.completed}</option>
                  <option value="cancelled">{t.status.cancelled}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{filteredHires.length}</span> hires
            </p>
          </div>

          {/* Hires List */}
          {filteredHires.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.noHires}</h3>
              <p className="text-gray-400">No hires have been made yet</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
              >
                <RefreshCw size={16} className="inline mr-2" />
                {t.actions.refresh}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHires.map((hire) => (
                <div
                  key={hire.id}
                  className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden hover:border-yellow-500/40 transition"
                >
                  <div className="p-4 cursor-pointer" onClick={() => toggleExpand(hire.id)}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <User size={20} className="text-yellow-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{hire.worker.name}</h3>
                            <p className="text-sm text-gray-400">{hire.position}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {hire.worker.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                {hire.worker.rating}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 size={12} />
                                {hire.employer.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-gray-400" />
                          <span className="font-semibold text-white">
                            {formatCurrency(hire.salary)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(hire.status)}`}>
                            {getStatusIcon(hire.status)}
                            {getStatusLabel(hire.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getSatisfactionColor(hire.satisfaction)}`}>
                            {getSatisfactionIcon(hire.satisfaction)}
                            {getSatisfactionLabel(hire.satisfaction)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(hire.createdAt)}
                        </div>
                        {expandedHire === hire.id ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedHire === hire.id && (
                    <div className="border-t border-yellow-500/20 p-4 bg-[#0a0a0a]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-400 mb-2 flex items-center gap-2">
                            <UserCheck size={16} className="text-yellow-400" />
                            Worker Details
                          </h4>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-gray-500" />
                              <span className="text-gray-300">{hire.worker.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-500" />
                              <span className="text-gray-300">{hire.worker.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase size={14} className="text-gray-500" />
                              <span className="text-gray-300">{hire.worker.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star size={14} className="text-yellow-400" />
                              <span className="text-gray-300">Rating: {hire.workerRating} ★</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-400 mb-2 flex items-center gap-2">
                            <Building2 size={16} className="text-yellow-400" />
                            Employer Details
                          </h4>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-500" />
                              <span className="text-gray-300">{hire.employer.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-gray-500" />
                              <span className="text-gray-300">{hire.employer.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-500" />
                              <span className="text-gray-300">{hire.employer.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award size={14} className="text-yellow-400" />
                              <span className="text-gray-300">Rating: {hire.employerRating} ★</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-[#1a1a1a] rounded-lg p-3">
                          <p className="text-xs text-gray-500">Hire ID</p>
                          <p className="text-sm font-medium text-white">{hire.id}</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-3">
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="text-sm font-medium text-white">{formatDate(hire.startDate)}</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-3">
                          <p className="text-xs text-gray-500">Payment Status</p>
                          <p className={`text-sm font-medium ${
                            hire.paymentStatus === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {hire.paymentStatus === 'confirmed' ? '✅ Confirmed' : '⏳ Pending'}
                          </p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-3">
                          <p className="text-xs text-gray-500">Satisfaction</p>
                          <p className={`text-sm font-medium flex items-center gap-1 ${getSatisfactionColor(hire.satisfaction)}`}>
                            {getSatisfactionIcon(hire.satisfaction)}
                            {getSatisfactionLabel(hire.satisfaction)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-medium hover:bg-yellow-400 transition flex items-center gap-2">
                          <Eye size={16} />
                          {t.actions.view}
                        </button>
                        <button className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/5 transition flex items-center gap-2">
                          <MessageCircle size={16} />
                          {t.actions.contact}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminHires;