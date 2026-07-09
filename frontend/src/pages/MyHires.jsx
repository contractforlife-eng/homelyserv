// src/pages/MyHires.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  DollarSign,
  Clock,
  Calendar,
  Star,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Filter,
  FileText,
  Pause,
  Play,
  UserMinus,
  UserCheck,
  MoreVertical,
  Image as ImageIcon
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

// Main MyHires Component
const MyHires = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hires, setHires] = useState([]);
  const [filteredHires, setFilteredHires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedHire, setExpandedHire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [actionType, setActionType] = useState('');

  const translations = {
    en: {
      title: 'My Hires',
      subtitle: 'Track all your employees, their hours, and manage contracts',
      stats: {
        total: 'Total Employees',
        active: 'Current',
        previous: 'Previous',
        onHold: 'On Hold'
      },
      filters: {
        all: 'All Employees',
        active: 'Current',
        previous: 'Previous',
        onHold: 'On Hold'
      },
      table: {
        employee: 'Employee',
        position: 'Position',
        hours: 'Hours Worked',
        status: 'Status',
        salary: 'Salary',
        actions: 'Actions',
        noResults: 'No employees found',
        searchPlaceholder: 'Search by employee name or position...'
      },
      status: {
        active: 'Current',
        previous: 'Previous',
        onHold: 'On Hold'
      },
      actions: {
        chat: 'Chat',
        cancel: 'Cancel Contract',
        suspend: 'Suspend Contract',
        resume: 'Resume Contract',
        viewProfile: 'View Profile'
      },
      modal: {
        cancelTitle: 'Cancel Contract',
        cancelMessage: 'Are you sure you want to cancel this contract? This action cannot be undone.',
        suspendTitle: 'Suspend Contract',
        suspendMessage: 'Are you sure you want to suspend this contract temporarily?',
        resumeTitle: 'Resume Contract',
        resumeMessage: 'Are you sure you want to resume this contract?',
        confirm: 'Confirm',
        cancel: 'Cancel'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading your employees...',
      noHires: "You haven't hired any employees yet.",
      startSearching: 'Search Workers',
      hoursWorked: 'Hours Worked',
      contractStatus: 'Contract Status'
    },
    ar: {
      title: 'موظفيني',
      subtitle: 'تتبع جميع موظفيك وساعات عملهم وإدارة العقود',
      stats: {
        total: 'إجمالي الموظفين',
        active: 'حاليون',
        previous: 'سابقون',
        onHold: 'معلقون'
      },
      filters: {
        all: 'جميع الموظفين',
        active: 'حاليون',
        previous: 'سابقون',
        onHold: 'معلقون'
      },
      table: {
        employee: 'الموظف',
        position: 'الوظيفة',
        hours: 'ساعات العمل',
        status: 'الحالة',
        salary: 'الراتب',
        actions: 'الإجراءات',
        noResults: 'لا يوجد موظفين',
        searchPlaceholder: 'ابحث باسم الموظف أو الوظيفة...'
      },
      status: {
        active: 'حالي',
        previous: 'سابق',
        onHold: 'معلق'
      },
      actions: {
        chat: 'محادثة',
        cancel: 'إلغاء العقد',
        suspend: 'تعليق العقد',
        resume: 'استئناف العقد',
        viewProfile: 'عرض الملف الشخصي'
      },
      modal: {
        cancelTitle: 'إلغاء العقد',
        cancelMessage: 'هل أنت متأكد من رغبتك في إلغاء هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.',
        suspendTitle: 'تعليق العقد',
        suspendMessage: 'هل أنت متأكد من رغبتك في تعليق هذا العقد مؤقتاً؟',
        resumeTitle: 'استئناف العقد',
        resumeMessage: 'هل أنت متأكد من رغبتك في استئناف هذا العقد؟',
        confirm: 'تأكيد',
        cancel: 'إلغاء'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الموظفين...',
      noHires: 'لم تقم بتوظيف أي موظفين بعد.',
      startSearching: 'البحث عن عمال',
      hoursWorked: 'ساعات العمل',
      contractStatus: 'حالة العقد'
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

    loadHiresFromStorage();
  }, [navigate]);

  const loadHiresFromStorage = () => {
    try {
      let savedHires = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
      
      if (savedHires.length === 0) {
        const oldHires = JSON.parse(localStorage.getItem('employer_hires') || '[]');
        if (oldHires.length > 0) {
          savedHires = oldHires;
          localStorage.setItem('homelyserv_hires', JSON.stringify(oldHires));
        }
      }
      
      console.log(`✅ Loaded ${savedHires.length} hires from localStorage`);
      
      const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
      
      const formattedHires = savedHires.map((hire, index) => {
        let profileImage = '';
        
        if (hire.workerEmail && profiles[hire.workerEmail]) {
          profileImage = profiles[hire.workerEmail].profileImage || '';
        }
        
        if (!profileImage && hire.workerPhoto) {
          profileImage = hire.workerPhoto;
        }
        
        if (!profileImage && hire.worker?.image) {
          profileImage = hire.worker.image;
        }
        
        const workerName = hire.workerName || 'Worker';
        const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(workerName)}&background=teal&color=fff&size=100&bold=true`;
        
        return {
          id: hire.id || `hire_${index}`,
          worker: {
            id: hire.workerId || hire.worker?.id || `worker_${index}`,
            name: workerName,
            email: hire.workerEmail || hire.worker?.email || '',
            phone: hire.workerPhone || hire.worker?.phone || '',
            location: hire.workerLocation || hire.worker?.location || 'Not specified',
            category: hire.desiredJob || hire.worker?.category || 'Worker',
            image: profileImage || fallbackImage,
            rating: hire.workerRating || hire.worker?.rating || 4.5
          },
          position: hire.desiredJob || hire.position || 'Worker',
          hoursWorked: hire.hoursWorked || 0,
          salary: hire.amount || hire.salary || 0,
          status: hire.status || 'active',
          startDate: hire.startDate || hire.date || new Date().toISOString().split('T')[0],
          contractType: hire.contractType || 'Full Time',
          workSchedule: hire.workSchedule || 'Sunday - Thursday, 9AM - 5PM',
          documents: hire.documents || [],
          paymentMethod: hire.paymentMethod || 'Not specified',
          commission: hire.commission || 0
        };
      });
      
      setHires(formattedHires);
      setFilteredHires(formattedHires);
      setLoading(false);
    } catch (error) {
      console.error('Error loading hires:', error);
      setHires([]);
      setFilteredHires([]);
      setLoading(false);
    }
  };

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
        h.worker.name.toLowerCase().includes(searchLower) ||
        h.position.toLowerCase().includes(searchLower) ||
        h.worker.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredHires(filtered);
  }, [hires, statusFilter, searchTerm]);

  const toggleExpand = (hireId) => {
    setExpandedHire(expandedHire === hireId ? null : hireId);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      previous: 'bg-gray-100 text-gray-800',
      onHold: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <UserCheck size={16} />;
      case 'previous': return <UserMinus size={16} />;
      case 'onHold': return <Pause size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusLabel = (status) => {
    return t.status[status] || status;
  };

  const handleAction = (hireId, action) => {
    setActionType(action);
    setShowConfirmModal(hireId);
  };

  const confirmAction = () => {
    if (showConfirmModal && actionType) {
      const updatedHires = hires.map(hire => {
        if (hire.id === showConfirmModal) {
          let newStatus = hire.status;
          if (actionType === 'cancel') {
            newStatus = 'previous';
          } else if (actionType === 'suspend') {
            newStatus = 'onHold';
          } else if (actionType === 'resume') {
            newStatus = 'active';
          }
          return { ...hire, status: newStatus };
        }
        return hire;
      });
      setHires(updatedHires);
      
      const hiresToSave = updatedHires.map(hire => ({
        id: hire.id,
        workerId: hire.worker.id,
        workerName: hire.worker.name,
        workerEmail: hire.worker.email,
        workerPhone: hire.worker.phone,
        workerLocation: hire.worker.location,
        desiredJob: hire.position,
        amount: hire.salary,
        status: hire.status,
        date: hire.startDate,
        hoursWorked: hire.hoursWorked,
        commission: hire.commission,
        paymentMethod: hire.paymentMethod,
        workerPhoto: hire.worker.image
      }));
      localStorage.setItem('homelyserv_hires', JSON.stringify(hiresToSave));
      
      setShowConfirmModal(null);
      setActionType('');
    }
  };

  // ===== FIXED: Chat functionality - opens chat directly with the worker =====
  const handleChat = (worker) => {
    console.log('📨 Starting chat with worker:', worker);
    
    // Save the chat recipient data
    const chatData = {
      id: worker.id || worker.email || `worker_${Date.now()}`,
      name: worker.name || 'Worker',
      email: worker.email || '',
      phone: worker.phone || '',
      image: worker.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name || 'Worker')}&background=teal&color=fff&size=100&bold=true`,
      role: 'worker'
    };
    
    localStorage.setItem('homelyserv_chat_recipient', JSON.stringify(chatData));
    localStorage.setItem('homelyserv_open_chat_on_load', 'true');
    
    console.log('✅ Chat data saved, navigating to messages...');
    
    // Navigate to messages page
    navigate('/employer-messages');
  };

  const stats = {
    total: hires.length,
    active: hires.filter(h => h.status === 'active').length,
    previous: hires.filter(h => h.status === 'previous').length,
    onHold: hires.filter(h => h.status === 'onHold').length
  };

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
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-teal-100 mt-1">{t.subtitle}</p>
              </div>
              <Link
                to="/employer-search"
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Users size={16} />
                {t.startSearching}
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.total}</p>
                <Users size={20} className="text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.active}</p>
                <UserCheck size={20} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.onHold}</p>
                <Pause size={20} className="text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.onHold}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.previous}</p>
                <UserMinus size={20} className="text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.previous}</p>
            </div>
          </div>

          {/* Search and Filters */}
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
                  <option value="active">{t.filters.active}</option>
                  <option value="onHold">{t.filters.onHold}</option>
                  <option value="previous">{t.filters.previous}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredHires.length}</span> employees
            </p>
          </div>

          {filteredHires.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.table.noResults}</h3>
              <p className="text-gray-500">{t.noHires}</p>
              <Link
                to="/employer-search"
                className="mt-4 inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {t.startSearching}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHires.map((hire) => (
                <div
                  key={hire.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
                >
                  <div className="p-4 cursor-pointer" onClick={() => toggleExpand(hire.id)}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={hire.worker.image}
                          alt={hire.worker.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hire.worker.name)}&background=teal&color=fff&size=100&bold=true`;
                          }}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">{hire.worker.name}</h3>
                          <p className="text-sm text-gray-500">{hire.position}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Star size={12} className="fill-yellow-400 text-yellow-400" />
                              {hire.worker.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {hire.worker.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          <span className="font-semibold text-gray-800">
                            {hire.hoursWorked}h
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-gray-400" />
                          <span className="font-semibold text-gray-800">
                            EGP {hire.salary.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(hire.status)}`}>
                            {getStatusIcon(hire.status)}
                            {getStatusLabel(hire.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedHire === hire.id ? (
                            <ChevronUp size={18} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={18} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedHire === hire.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Employee Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <span>{hire.worker.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-gray-400" />
                              <span>{hire.worker.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-400" />
                              <span>{hire.worker.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-gray-400" />
                              <span>{hire.worker.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase size={14} className="text-gray-400" />
                              <span>{hire.worker.category}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Contract Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Start Date</span>
                              <span>{hire.startDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Contract Type</span>
                              <span>{hire.contractType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Work Schedule</span>
                              <span className="text-right">{hire.workSchedule}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Monthly Salary</span>
                              <span className="font-medium">EGP {hire.salary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t.hoursWorked}</span>
                              <span className="font-medium">{hire.hoursWorked} hours</span>
                            </div>
                            {hire.paymentMethod && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Payment Method</span>
                                <span className="font-medium">{hire.paymentMethod}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleChat(hire.worker)}
                              className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition flex items-center gap-1"
                            >
                              <MessageCircle size={14} />
                              {t.actions.chat}
                            </button>
                            
                            {hire.status === 'active' && (
                              <>
                                <button
                                  onClick={() => handleAction(hire.id, 'suspend')}
                                  className="px-3 py-1.5 border border-yellow-500 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-50 transition flex items-center gap-1"
                                >
                                  <Pause size={14} />
                                  {t.actions.suspend}
                                </button>
                                <button
                                  onClick={() => handleAction(hire.id, 'cancel')}
                                  className="px-3 py-1.5 border border-red-500 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center gap-1"
                                >
                                  <XCircle size={14} />
                                  {t.actions.cancel}
                                </button>
                              </>
                            )}
                            {hire.status === 'onHold' && (
                              <>
                                <button
                                  onClick={() => handleAction(hire.id, 'resume')}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1"
                                >
                                  <Play size={14} />
                                  {t.actions.resume}
                                </button>
                                <button
                                  onClick={() => handleAction(hire.id, 'cancel')}
                                  className="px-3 py-1.5 border border-red-500 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center gap-1"
                                >
                                  <XCircle size={14} />
                                  {t.actions.cancel}
                                </button>
                              </>
                            )}
                            {hire.status === 'previous' && (
                              <span className="px-3 py-1.5 text-gray-500 text-sm flex items-center gap-1">
                                <CheckCircle size={14} />
                                Contract Ended
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                actionType === 'cancel' ? 'bg-red-100' : 
                actionType === 'suspend' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                {actionType === 'cancel' && <XCircle size={28} className="text-red-600" />}
                {actionType === 'suspend' && <Pause size={28} className="text-yellow-600" />}
                {actionType === 'resume' && <Play size={28} className="text-green-600" />}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {actionType === 'cancel' && t.modal.cancelTitle}
                {actionType === 'suspend' && t.modal.suspendTitle}
                {actionType === 'resume' && t.modal.resumeTitle}
              </h3>
              <p className="text-gray-600 mb-1">
                {actionType === 'cancel' && t.modal.cancelMessage}
                {actionType === 'suspend' && t.modal.suspendMessage}
                {actionType === 'resume' && t.modal.resumeMessage}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t.modal.cancel}
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors ${
                  actionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' :
                  actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-green-600 hover:bg-green-700'
                }`}
              >
                {t.modal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHires;