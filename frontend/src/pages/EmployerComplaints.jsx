// src/pages/EmployerComplaints.jsx - UPDATED TO SHOW ADMIN RESPONSES WITH NOTIFICATION BELL
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
import NotificationBell from '../components/NotificationBell';
import {
  Home,
  User,
  Briefcase,
  FileCheck,
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
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Filter,
  CreditCard,
  Crown,
  Shield,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Employer Sidebar Component - WITH PREMIUM BADGE FIX
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

  const t = translations[language] || translations.en;

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/employer-profile' },
    { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
    { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/employer-payments' },
    { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
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

  const userIsPremium = () => {
    const userId = user?.id || user?.email;
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
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || 'Employer'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-teal-600" />
              )}
              {isPremium && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
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
              {item.id === 'premium' && !isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full font-medium">NEW</span>
                </div>
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

// Main EmployerComplaints Component - WITH NOTIFICATION BELL
const EmployerComplaints = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(true);

  const translations = {
    en: {
      title: 'Complaints',
      subtitle: 'Submit and track your complaints',
      stats: {
        total: 'Total Complaints',
        pending: 'Pending',
        resolved: 'Resolved',
        inProgress: 'In Progress'
      },
      filters: {
        all: 'All Complaints',
        pending: 'Pending',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        rejected: 'Rejected'
      },
      table: {
        title: 'Title',
        category: 'Category',
        status: 'Status',
        date: 'Date',
        actions: 'Actions',
        noResults: 'No complaints found',
        searchPlaceholder: 'Search complaints...'
      },
      categories: {
        general: 'General',
        worker: 'Worker Issue',
        payment: 'Payment Issue',
        platform: 'Platform Issue',
        other: 'Other'
      },
      status: {
        pending: 'Pending',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        rejected: 'Rejected'
      },
      form: {
        newComplaint: 'New Complaint',
        titleLabel: 'Title',
        categoryLabel: 'Category',
        descriptionLabel: 'Description',
        submit: 'Submit Complaint',
        cancel: 'Cancel'
      },
      actions: {
        view: 'View Details',
        resolve: 'Mark as Resolved',
        reject: 'Reject',
        expand: 'Show Response',
        collapse: 'Hide Response'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading complaints...',
      noComplaints: 'No complaints yet',
      noComplaintsDesc: 'Submit a complaint and we\'ll help you resolve it',
      adminResponse: 'Admin Response',
      responded: 'Responded'
    },
    ar: {
      title: 'الشكاوى',
      subtitle: 'تقديم وتتبع شكاويك',
      stats: {
        total: 'إجمالي الشكاوى',
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        inProgress: 'قيد المعالجة'
      },
      filters: {
        all: 'جميع الشكاوى',
        pending: 'قيد الانتظار',
        inProgress: 'قيد المعالجة',
        resolved: 'تم الحل',
        rejected: 'مرفوض'
      },
      table: {
        title: 'العنوان',
        category: 'الفئة',
        status: 'الحالة',
        date: 'التاريخ',
        actions: 'الإجراءات',
        noResults: 'لا توجد شكاوى',
        searchPlaceholder: 'ابحث عن شكاوى...'
      },
      categories: {
        general: 'عام',
        worker: 'مشكلة مع عامل',
        payment: 'مشكلة في الدفع',
        platform: 'مشكلة في المنصة',
        other: 'أخرى'
      },
      status: {
        pending: 'قيد الانتظار',
        inProgress: 'قيد المعالجة',
        resolved: 'تم الحل',
        rejected: 'مرفوض'
      },
      form: {
        newComplaint: 'شكوى جديدة',
        titleLabel: 'العنوان',
        categoryLabel: 'الفئة',
        descriptionLabel: 'الوصف',
        submit: 'تقديم الشكوى',
        cancel: 'إلغاء'
      },
      actions: {
        view: 'عرض التفاصيل',
        resolve: 'تحديد كمحلولة',
        reject: 'رفض',
        expand: 'عرض الرد',
        collapse: 'إخفاء الرد'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الشكاوى...',
      noComplaints: 'لا توجد شكاوى حتى الآن',
      noComplaintsDesc: 'قدم شكوى وسنساعدك في حلها',
      adminResponse: 'رد الإدارة',
      responded: 'تم الرد'
    }
  };

  const t = translations[language] || translations.en;

  // ============================================================
  // Load complaints only for the current employer
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

    setLoading(false);
  }, [navigate]);

  // ============================================================
  // Load complaints when user is set - FILTER BY EMPLOYER
  // ============================================================
  useEffect(() => {
    if (!user?.email) return;

    // Load complaints from localStorage
    const allComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
    
    // FILTER: Only complaints from this employer
    const employerComplaints = allComplaints.filter(
      complaint => complaint.employerEmail === user.email
    );
    
    console.log(`📋 Loaded ${employerComplaints.length} complaints for employer: ${user.email}`);
    
    setComplaints(employerComplaints);
    setFilteredComplaints(employerComplaints);
  }, [user]);

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
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        (t.categories[c.category] || '').toLowerCase().includes(searchLower)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewComplaint(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ============================================================
  // Submit complaint with employer email
  // ============================================================
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!user?.email) {
      alert('Please login to submit a complaint');
      return;
    }
    
    const complaint = {
      id: Date.now(),
      ...newComplaint,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      response: null,
      adminResponse: null,
      adminResponseAt: null,
      employerId: user.id || user.email,
      employerEmail: user.email,
      employerName: user.fullName || 'Employer'
    };
    
    // Get all complaints from storage
    const allComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
    
    // Add new complaint
    const updatedAllComplaints = [complaint, ...allComplaints];
    localStorage.setItem('employer_complaints', JSON.stringify(updatedAllComplaints));
    
    // Update state with filtered complaints for this employer
    const employerComplaints = updatedAllComplaints.filter(
      c => c.employerEmail === user.email
    );
    
    setComplaints(employerComplaints);
    setFilteredComplaints(employerComplaints);
    
    setNewComplaint({ title: '', description: '', category: 'general' });
    setShowForm(false);
    
    console.log(`✅ Complaint submitted by ${user.email}`);
  };

  // ============================================================
  // Update complaint status
  // ============================================================
  const updateComplaintStatus = (complaintId, newStatus) => {
    // Get all complaints from storage
    const allComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
    
    // Update the specific complaint
    const updatedAllComplaints = allComplaints.map(c =>
      c.id === complaintId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
    );
    
    localStorage.setItem('employer_complaints', JSON.stringify(updatedAllComplaints));
    
    // Filter for this employer
    const employerComplaints = updatedAllComplaints.filter(
      c => c.employerEmail === user.email
    );
    
    setComplaints(employerComplaints);
    setFilteredComplaints(employerComplaints);
  };

  const toggleExpand = (complaintId) => {
    setExpandedComplaint(expandedComplaint === complaintId ? null : complaintId);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      inProgress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'inProgress': return <AlertCircle size={16} />;
      case 'resolved': return <CheckCircle size={16} />;
      case 'rejected': return <X size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'inProgress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
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
              {/* WORKING NOTIFICATION BELL */}
              <NotificationBell userId={user?.id || user?.email} />
              
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
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-teal-100 mt-1">{t.subtitle}</p>
                <p className="text-teal-200 text-sm mt-1">
                  {complaints.length} complaints submitted
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {showForm ? <X size={16} /> : <AlertTriangle size={16} />}
                {showForm ? t.form.cancel : t.form.newComplaint}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.total}</p>
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-teal-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pending}</p>
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.inProgress}</p>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.inProgress}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.resolved}</p>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.resolved}</p>
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.form.newComplaint}</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.form.titleLabel}</label>
                    <input
                      type="text"
                      name="title"
                      value={newComplaint.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.form.categoryLabel}</label>
                    <select
                      name="category"
                      value={newComplaint.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {Object.entries(t.categories).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.form.descriptionLabel}</label>
                  <textarea
                    name="description"
                    value={newComplaint.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
                  >
                    <Send size={18} />
                    {t.form.submit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t.form.cancel}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.table.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-gray-700"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="pending">{t.filters.pending}</option>
                  <option value="inProgress">{t.filters.inProgress}</option>
                  <option value="resolved">{t.filters.resolved}</option>
                  <option value="rejected">{t.filters.rejected}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredComplaints.length}</span> complaints
            </p>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noComplaints}</h3>
              <p className="text-gray-500">{t.noComplaintsDesc}</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                {t.form.newComplaint}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
                >
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={20} className="text-teal-600" />
                          <h3 className="font-semibold text-gray-800">{complaint.title}</h3>
                          {complaint.adminResponse && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                              <Shield size={12} />
                              {t.responded}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{complaint.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                          <span className="text-gray-500">
                            {t.categories[complaint.category] || complaint.category}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500">{complaint.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(complaint.status)}`}>
                            {getStatusIcon(complaint.status)}
                            {t.status[complaint.status] || complaint.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {complaint.adminResponse && (
                          <button
                            onClick={() => toggleExpand(complaint.id)}
                            className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition flex items-center gap-1"
                          >
                            {expandedComplaint === complaint.id ? (
                              <>
                                <ChevronUp size={14} />
                                {t.actions.collapse}
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} />
                                {t.actions.expand}
                              </>
                            )}
                          </button>
                        )}
                        {complaint.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'inProgress')}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1"
                            >
                              <AlertCircle size={14} />
                              {t.actions.view}
                            </button>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              {t.actions.resolve}
                            </button>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'rejected')}
                              className="px-3 py-1.5 border border-red-500 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center gap-1"
                            >
                              <X size={14} />
                              {t.actions.reject}
                            </button>
                          </>
                        )}
                        {complaint.status === 'inProgress' && (
                          <>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              {t.actions.resolve}
                            </button>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'rejected')}
                              className="px-3 py-1.5 border border-red-500 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center gap-1"
                            >
                              <X size={14} />
                              {t.actions.reject}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Admin Response Section - Expanded */}
                    {expandedComplaint === complaint.id && complaint.adminResponse && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield size={16} className="text-green-600" />
                            <h4 className="font-semibold text-green-700">{t.adminResponse}</h4>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{complaint.adminResponse}</p>
                          {complaint.adminResponseAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(complaint.adminResponseAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {complaint.status === 'resolved' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle size={14} />
                          This complaint has been resolved
                        </span>
                      </div>
                    )}

                    {complaint.status === 'rejected' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-sm text-red-600 flex items-center gap-1">
                          <X size={14} />
                          This complaint has been rejected
                        </span>
                      </div>
                    )}
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

export default EmployerComplaints;