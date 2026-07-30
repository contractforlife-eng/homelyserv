// src/pages/AdminHires.jsx - MIGRATED TO DASHBOARD LAYOUT
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import hireService from '../services/hireService';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
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
  RefreshCw,
  Crown,
  UserPlus
} from 'lucide-react';

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

  const t = translations[language] || translations.en;

  const loadHires = async () => {
    setLoading(true);
    
    try {
      const hiresData = await hireService.getAllHires();
      const hires = Array.isArray(hiresData) ? hiresData : [];
      
      console.log(`📋 Found ${hires.length} hires from backend`);
      
      const hireData = hires.map((hire, index) => {
        let satisfaction = 'neutral';
        if (hire.workerRating && hire.workerRating >= 4) {
          satisfaction = 'satisfied';
        } else if (hire.workerRating && hire.workerRating <= 2) {
          satisfaction = 'unsatisfied';
        }
        
        return {
          id: hire.id || `HIRE-${String(index + 1).padStart(4, '0')}`,
          worker: {
            name: hire.workerName || 'Unknown Worker',
            category: hire.workerCategory || 'N/A',
            rating: hire.workerRating || 4.0,
            location: hire.workerLocation || 'N/A',
            phone: hire.workerPhone || 'N/A',
            email: hire.workerEmail || 'N/A'
          },
          employer: {
            name: hire.employerName || 'Unknown Employer',
            phone: hire.employerPhone || 'N/A',
            email: hire.employerEmail || 'N/A'
          },
          position: hire.jobTitle || 'Position',
          salary: hire.salary || hire.agreedSalary || 0,
          status: hire.status,
          startDate: hire.startDate || hire.employmentStartDate || hire.createdAt || new Date().toISOString(),
          createdAt: hire.createdAt || new Date().toISOString(),
          paymentStatus: hire.paymentStatus || 'pending',
          satisfaction: satisfaction,
          workerRating: hire.workerRating || 4.0,
          employerRating: hire.employerRating || 4.5,
          hourlyRate: hire.hourlyRate,
          workingHoursPerDay: hire.workingHoursPerDay,
          workingDaysPerWeek: hire.workingDaysPerWeek,
          weeklyDaysOff: hire.weeklyDaysOff,
          workStartTime: hire.workStartTime,
          workEndTime: hire.workEndTime,
          employmentStartDate: hire.employmentStartDate,
          additionalNotes: hire.additionalNotes,
          commissionAmount: hire.commissionAmount,
          vatAmount: hire.vatAmount,
          totalDue: hire.totalDue,
          paymentReference: hire.paymentReference
        };
      });
      
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

  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    setUser(authUser);
    loadHires();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

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
    useAuthStore.getState().logout();
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
    return colors[status] || 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'active': return <CheckCircle size={16} className="text-green-400" />;
      case 'completed': return <CheckCircle size={16} className="text-blue-400" />;
      case 'cancelled': return <XCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400 dark:text-gray-500" />;
    }
  };

  const getSatisfactionIcon = (satisfaction) => {
    switch (satisfaction) {
      case 'satisfied': return <ThumbsUp size={16} className="text-green-400" />;
      case 'neutral': return <Minus size={16} className="text-yellow-400" />;
      case 'unsatisfied': return <ThumbsDown size={16} className="text-red-400" />;
      default: return <Minus size={16} className="text-gray-400 dark:text-gray-500" />;
    }
  };

  const getSatisfactionColor = (satisfaction) => {
    switch (satisfaction) {
      case 'satisfied': return 'bg-green-500/20 text-green-400';
      case 'neutral': return 'bg-yellow-500/20 text-yellow-400';
      case 'unsatisfied': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
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
          <p className="mt-4 text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        language={language}
        onToggleLanguage={toggleLanguage}
        notificationUserId={user?.id || user?.email}
        isPremium={false}
        variant="admin"
      />

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
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.total}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Briefcase size={20} className="text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.active}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.pending}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.completed}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.cancelled}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.cancelled}</p>
              </div>
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle size={20} className="text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
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
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Showing <span className="font-semibold text-white">{filteredHires.length}</span> hires
          </p>
        </div>

        {/* Hires List */}
        {filteredHires.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t.noHires}</h3>
            <p className="text-gray-400 dark:text-gray-500">No hires have been made yet</p>
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
                          <p className="text-sm text-gray-400 dark:text-gray-500">{hire.position}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
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
                        <DollarSign size={16} className="text-gray-400 dark:text-gray-500" />
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
                      <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        {formatDate(hire.createdAt)}
                      </div>
                      {expandedHire === hire.id ? (
                        <ChevronUp size={18} className="text-gray-400 dark:text-gray-500" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedHire === hire.id && (
                  <div className="border-t border-yellow-500/20 p-4 bg-[#0a0a0a]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-2">Worker Details</h4>
                        <p className="text-sm text-gray-300">Name: {hire.worker.name}</p>
                        <p className="text-sm text-gray-300">Category: {hire.worker.category}</p>
                        <p className="text-sm text-gray-300">Rating: {hire.worker.rating}</p>
                        <p className="text-sm text-gray-300">Location: {hire.worker.location}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-2">Work Details</h4>
                        <p className="text-sm text-gray-300">Hourly Rate: EGP {hire.hourlyRate || 'N/A'}</p>
                        <p className="text-sm text-gray-300">Hours/Day: {hire.workingHoursPerDay || 'N/A'}</p>
                        <p className="text-sm text-gray-300">Days/Week: {hire.workingDaysPerWeek || 'N/A'}</p>
                        <p className="text-sm text-gray-300">Days Off: {hire.weeklyDaysOff || 'N/A'}</p>
                        <p className="text-sm text-gray-300">Start Time: {hire.workStartTime || 'N/A'}</p>
                        <p className="text-sm text-gray-300">End Time: {hire.workEndTime || 'N/A'}</p>
                        <p className="text-sm text-gray-300">Start Date: {hire.employmentStartDate ? new Date(hire.employmentStartDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-2">Payment & Status</h4>
                        <p className="text-sm text-gray-300">Hire Status: {hire.status}</p>
                        <p className="text-sm text-gray-300">Payment Status: {hire.paymentStatus}</p>
                        <p className="text-sm text-gray-300">Commission: EGP {hire.commissionAmount?.toLocaleString() || '0'}</p>
                        <p className="text-sm text-gray-300">Salary: EGP {hire.salary?.toLocaleString() || '0'}</p>
                        <p className="text-sm text-gray-300">Reference: {hire.paymentReference || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminHires;