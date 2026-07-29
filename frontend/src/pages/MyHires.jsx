// src/pages/MyHires.jsx - COMPLETE FIXED VERSION WITH WORKING NOTIFICATION BELL
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import hireService from '../services/hireService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import {
  User,
  Briefcase,
  FileCheck,
  MessageCircle,
  DollarSign,
  Clock,
  Calendar,
  Star,
  Star as StarIcon,
  CheckCircle,
  Eye,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield,
  Award,
  Zap,
  Heart,
  UserPlus,
  BarChart3,
  SlidersHorizontal,
  ArrowUpDown,
  ThumbsUp,
  LayoutGrid,
  List,
  CreditCard,
  Lock as LockIcon,
  MoreVertical,
  Trash2,
  Edit,
  Check,
  X as XIcon,
  RefreshCw,
  Crown,
  Search as SearchIcon,
  UserCheck,
  Building2,
  MapPinned,
  Languages,
  Users,
  AlertTriangle,
  Mail,
  MapPin,
  Phone,
  X
} from 'lucide-react';
import { sendMessage } from '../utils/chatService';

// ============================================================
// 2. MAIN MY HIRES COMPONENT
// ============================================================
const MyHires = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const dashboard = useDashboard();

  const [loading, setLoading] = useState(true);
  const [hires, setHires] = useState([]);
  const [filteredHires, setFilteredHires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHire, setSelectedHire] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [terminatingHire, setTerminatingHire] = useState(null);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const userIsPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const isPremium = userIsPremium();

  const translations = {
    en: {
      title: 'My Hires',
      subtitle: 'Manage your hired workers',
      stats: {
        total: 'Total Hires',
        active: 'Active',
        terminated: 'Terminated',
        pending: 'Pending'
      },
      status: {
        active: 'Active',
        terminated: 'Terminated',
        pending: 'Pending',
        completed: 'Completed',
        accepted: 'Accepted',
        hired: 'Hired',
        offer_sent: 'Pending Payment'
      },
      table: {
        worker: 'Worker',
        job: 'Job Title',
        salary: 'Salary',
        startDate: 'Start Date',
        status: 'Status',
        actions: 'Actions'
      },
      modal: {
        title: 'Hire Details',
        workerName: 'Worker Name',
        jobTitle: 'Job Title',
        salary: 'Salary',
        startDate: 'Start Date',
        endDate: 'End Date',
        status: 'Status',
        contact: 'Contact Information',
        phone: 'Phone',
        email: 'Email',
        location: 'Location',
        rating: 'Rating',
        notes: 'Notes',
        close: 'Close',
        terminate: 'Terminate',
        message: 'Send Message'
      },
      terminate: {
        title: 'Terminate Hire',
        confirm: 'Are you sure you want to terminate this hire?',
        reason: 'Reason for termination (optional)',
        placeholder: 'Enter reason...',
        cancel: 'Cancel',
        confirmButton: 'Terminate Hire',
        success: 'Hire terminated successfully',
        error: 'Error terminating hire'
      },
      actions: {
        view: 'View Details',
        terminate: 'Terminate',
        message: 'Message Worker',
        pay: 'Pay Now'
      },
      filters: {
        all: 'All Hires',
        active: 'Active',
        terminated: 'Terminated',
        pending: 'Pending',
        hired: 'Hired',
        offerSent: 'Pending Payment'
      },
      empty: {
        title: 'No hires yet',
        description: 'You haven\'t hired any workers yet',
        start: 'Find workers to hire'
      },
      loading: 'Loading hires...',
      languageToggle: 'العربية',
      searchPlaceholder: 'Search by worker name or job title...',
      noResults: 'No hires match your search',
      clearFilters: 'Clear filters',
      refresh: 'Refresh',
      salaryPerMonth: 'EGP/month',
      creatingConversation: 'Creating conversation...'
    },
    ar: {
      title: 'توظيفاتي',
      subtitle: 'إدارة العمال الذين قمت بتوظيفهم',
      stats: {
        total: 'إجمالي التوظيفات',
        active: 'نشط',
        terminated: 'منتهي',
        pending: 'قيد الانتظار'
      },
      status: {
        active: 'نشط',
        terminated: 'منتهي',
        pending: 'قيد الانتظار',
        completed: 'مكتمل',
        accepted: 'مقبول',
        hired: 'موظف',
        offer_sent: 'في انتظار الدفع'
      },
      table: {
        worker: 'العامل',
        job: 'المسمى الوظيفي',
        salary: 'الراتب',
        startDate: 'تاريخ البدء',
        status: 'الحالة',
        actions: 'الإجراءات'
      },
      modal: {
        title: 'تفاصيل التوظيف',
        workerName: 'اسم العامل',
        jobTitle: 'المسمى الوظيفي',
        salary: 'الراتب',
        startDate: 'تاريخ البدء',
        endDate: 'تاريخ الانتهاء',
        status: 'الحالة',
        contact: 'معلومات الاتصال',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        location: 'الموقع',
        rating: 'التقييم',
        notes: 'ملاحظات',
        close: 'إغلاق',
        terminate: 'إنهاء',
        message: 'إرسال رسالة'
      },
      terminate: {
        title: 'إنهاء التوظيف',
        confirm: 'هل أنت متأكد من رغبتك في إنهاء هذا التوظيف؟',
        reason: 'سبب الإنهاء (اختياري)',
        placeholder: 'أدخل السبب...',
        cancel: 'إلغاء',
        confirmButton: 'إنهاء التوظيف',
        success: 'تم إنهاء التوظيف بنجاح',
        error: 'خطأ في إنهاء التوظيف'
      },
      actions: {
        view: 'عرض التفاصيل',
        terminate: 'إنهاء',
        message: 'مراسلة العامل',
        pay: 'ادفع الآن'
      },
      filters: {
        all: 'جميع التوظيفات',
        active: 'نشط',
        terminated: 'منتهي',
        pending: 'قيد الانتظار',
        hired: 'موظف',
        offerSent: 'في انتظار الدفع'
      },
      empty: {
        title: 'لا توجد توظيفات',
        description: 'لم تقم بتوظيف أي عامل بعد',
        start: 'ابحث عن عمال للتوظيف'
      },
      loading: 'جاري تحميل التوظيفات...',
      languageToggle: 'English',
      searchPlaceholder: 'ابحث باسم العامل أو المسمى الوظيفي...',
      noResults: 'لا توجد توظيفات تطابق بحثك',
      clearFilters: 'مسح التصفيات',
      refresh: 'تحديث',
      salaryPerMonth: 'جنيه/شهر',
      creatingConversation: 'جاري إنشاء المحادثة...'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  // ============================================================
  // 3. EFFECTS
  // ============================================================
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }

    loadHires();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // ============================================================
  // 4. LOAD HIRES
  // ============================================================
  const loadHires = async () => {
    setLoading(true);

    try {
    const employerEmail = authUser?.email;
    const employerId = authUser?.id;

    if (!employerEmail) {
      setHires([]);
      setFilteredHires([]);
      setLoading(false);
      return;
    }

      console.log('📂 Loading hires for employer:', { employerEmail, employerId });

      const hiresData = await hireService.getMyHires();
      const employerHires = Array.isArray(hiresData) ? hiresData : [];

      console.log(`📌 Found ${employerHires.length} hires from backend`);

      employerHires.sort((a, b) => {
        const dateA = new Date(a.startDate || a.createdAt || 0);
        const dateB = new Date(b.startDate || b.createdAt || 0);
        return dateB - dateA;
      });

      console.log(`✅ Total hires loaded: ${employerHires.length}`);
      setHires(employerHires);
      setFilteredHires(employerHires);

    } catch (error) {
      console.error('Error loading hires:', error);
      setHires([]);
      setFilteredHires([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      loadHires();
    }
  }, [authUser]);

  // ============================================================
  // 5. FILTERS
  // ============================================================
  useEffect(() => {
    let filtered = [...hires];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(hire => hire.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(hire =>
        hire.workerName?.toLowerCase().includes(searchLower) ||
        hire.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredHires(filtered);
  }, [hires, statusFilter, searchTerm]);

  // ============================================================
  // 6. CREATE CONVERSATION WHEN HIRING
  // ============================================================
  const createConversationForHire = async (hire) => {
    if (!hire) return;

    const workerId = hire.workerId;
    const workerName = hire.workerName || 'Worker';
    const jobTitle = hire.jobTitle || 'the job';

    if (!workerId) {
      console.error('No worker ID found for hire:', hire);
      return false;
    }

    const employerId = authUser?.id;
    const employerName = authUser?.fullName || 'Employer';

    console.log('💬 Creating conversation for hire:', { workerId, workerName, jobTitle });

    try {
      setCreatingConversation(true);

      const result = await sendMessage(
        employerId,
        employerName,
        'EMPLOYER',
        workerId,
        workerName,
        `Hello ${workerName}! I've hired you for ${jobTitle}. Let's discuss the next steps.`
      );

      if (result) {
        console.log('✅ Conversation created successfully');
        return true;
      } else {
        console.log('❌ Failed to create conversation');
        return false;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      return false;
    } finally {
      setCreatingConversation(false);
    }
  };

  // ============================================================
  // 7. HANDLERS
  // ============================================================
  const handleRefresh = () => {
    loadHires();
  };

  const handleViewDetails = (hire) => {
    setSelectedHire(hire);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedHire(null);
  };

  const handleTerminateClick = (hire) => {
    setTerminatingHire(hire);
    setTerminateReason('');
    setShowTerminateModal(true);
    setShowDetailsModal(false);
  };

  const handleTerminateHire = () => {
    if (!terminatingHire) return;

    try {
      const updatedHire = {
        ...terminatingHire,
        status: 'terminated',
        terminationDate: new Date().toISOString(),
        terminationReason: terminateReason || 'No reason provided'
      };

      setHires(prev => prev.map(h =>
        h.id === terminatingHire.id || h.offerId === terminatingHire.offerId
          ? updatedHire
          : h
      ));

      setShowTerminateModal(false);
      setTerminatingHire(null);

      alert(t.terminate.success);

    } catch (error) {
      console.error('Error terminating hire:', error);
      alert(t.terminate.error);
    }
  };

  // ============================================================
  // FIXED: handleSendMessage - Opens chat with the worker
  // ============================================================
  const handleSendMessage = async (hire) => {
    if (!hire) return;

    const workerId = hire.workerId;
    const workerName = hire.workerName || 'Worker';

    console.log('💬 Opening chat with worker:', { workerId, workerName });

    if (!workerId) {
      console.error('No worker ID found for hire:', hire);
      alert('Unable to open chat: Worker ID not found');
      return;
    }

    // First, check if conversation exists by trying to send a message
    // If the conversation doesn't exist, this will create it
    const employerId = authUser?.id;
    const employerName = authUser?.fullName || 'Employer';
    const jobTitle = hire.jobTitle || 'the job';

    // Try to send a message - this will create the conversation if it doesn't exist
    try {
      setCreatingConversation(true);

      // Send a message - this will create the conversation if it doesn't exist
      const result = await sendMessage(
        employerId,
        employerName,
        'EMPLOYER',
        workerId,
        workerName,
        `Hello ${workerName}! Let's discuss your work.`
      );

      if (result) {
        console.log('✅ Conversation ensured');
      }
    } catch (error) {
      console.error('Error ensuring conversation:', error);
      // Continue anyway - the user will be redirected
    } finally {
      setCreatingConversation(false);
    }

    // Navigate to messages page with worker info as URL parameters
    navigate(`/employer-messages?workerId=${encodeURIComponent(workerId)}&workerName=${encodeURIComponent(workerName)}`);
  };

  const handlePayNow = (hire) => {
    if (hire) {
      const fullSalary = hire.salary || 0;
      const applicationFee = Math.round(fullSalary * 0.15 * 100) / 100; // 15% fee

      const pendingPayment = {
        paymentId: hire.hireId || hire.offerId,
        amount: applicationFee,       // ← charge 15% only
        fullSalary: fullSalary,       // ← keep for display/receipt
        feePercentage: 15,
        workerName: hire.workerName,
        workerId: hire.workerId || hire.workerEmail,
        workerEmail: hire.workerEmail || '',
        jobTitle: hire.jobTitle || 'Service Provider',
        description: `15% application fee for ${hire.workerName || 'worker'}`,
        paymentType: 'recruitment',
        offerId: hire.offerId || hire.hireId,
        employerId: authUser?.id || authUser?.email,
        employerName: authUser?.fullName || 'Employer',
        returnTo: '/my-hires'
      };

      const workerData = {
        workerId: hire.workerId || hire.workerEmail,
        workerName: hire.workerName,
        workerEmail: hire.workerEmail || '',
        workerPhone: hire.workerPhone || '',
        workerLocation: hire.workerLocation || 'Not specified',
        desiredJob: hire.jobTitle || 'Service Provider',
        rating: hire.workerRating || 4.5,
        profileImage: hire.workerImage || '',
        hourlyRate: hire.salary ? Math.round(hire.salary / 160) : 30
      };

      localStorage.setItem('homelyserv_pending_payment', JSON.stringify(pendingPayment));
      localStorage.setItem('homelyserv_selected_worker', JSON.stringify(workerData));

      navigate('/payment-options');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border border-green-200',
      hired: 'bg-blue-100 text-blue-800 border border-blue-200',
      accepted: 'bg-blue-100 text-blue-800 border border-blue-200',
      terminated: 'bg-red-100 text-red-800 border border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      offer_sent: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      completed: 'bg-purple-100 text-purple-800 border border-purple-200'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'hired': return <CheckCircle size={14} />;
      case 'accepted': return <CheckCircle size={14} />;
      case 'terminated': return <XIcon size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'offer_sent': return <Clock size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  // Reuses the existing t.status translation mapping (same pattern as AdminHires.jsx)
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
    return `${amount?.toLocaleString() || 0}`;
  };

  const stats = {
    total: hires.length,
    active: hires.filter(h => h.status === 'active' || h.status === 'hired' || h.status === 'accepted').length,
    terminated: hires.filter(h => h.status === 'terminated').length,
    pending: hires.filter(h => h.status === 'pending' || h.status === 'offer_sent').length
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isPremium}
        rightContent={
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            {t.refresh}
          </button>
        }
      />

        <div className="p-4 md:p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800/20 border-2 border-white/50 overflow-hidden flex-shrink-0">
                  {authUser?.profileImage ? (
                    <img src={authUser.profileImage} alt={authUser.fullName || 'Employer'} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-white m-3" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{t.title}</h1>
                  <p className="text-teal-100 mt-1">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-teal-100">
                <Users size={18} />
                <span>{stats.total} workers hired</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.total}</p>
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-teal-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.active}</p>
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.active}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.terminated}</p>
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <XIcon size={20} className="text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.terminated}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.pending}</p>
                <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.pending}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="active">{t.filters.active}</option>
                  <option value="hired">{t.filters.hired || 'Hired'}</option>
                  <option value="terminated">{t.filters.terminated}</option>
                  <option value="pending">{t.filters.pending}</option>
                  <option value="offer_sent">{t.filters.offerSent}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredHires.length}</span> hires
            </p>
          </div>

          {/* Hires List */}
          {filteredHires.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.empty.title}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t.empty.description}</p>
              <button
                onClick={() => navigate('/employer-search')}
                className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.empty.start}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHires.map((hire) => (
                <div
                  key={hire.id || hire.hireId || hire.offerId}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition ${
                    hire.status === 'active' || hire.status === 'hired' || hire.status === 'accepted' ? 'border-green-200' :
                    hire.status === 'terminated' ? 'border-red-200' : 'border-yellow-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                          {hire.workerImage ? (
                            <img src={hire.workerImage} alt={hire.workerName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} className="text-teal-600" />
                          )}
                          {hire.isPremium && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                              <Crown size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800 dark:text-white">{hire.workerName || 'Unknown Worker'}</h3>
                            {hire.isPremium && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700">
                                <Crown size={10} className="text-yellow-500" />
                                Premium
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Briefcase size={14} />
                            <span>{hire.jobTitle || 'Service Provider'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <DollarSign size={14} className="text-green-600" />
                              {formatCurrency(hire.salary)} {t.salaryPerMonth}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(hire.startDate)}
                            </span>
                            {hire.workerRating && (
                              <span className="flex items-center gap-1">
                                <StarIcon size={14} className="text-yellow-500" />
                                {hire.workerRating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(hire.status)}`}>
                          {getStatusIcon(hire.status)}
                          {getStatusLabel(hire.status)}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(hire)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:bg-teal-900/30 rounded-lg transition"
                            title={t.actions.view}
                          >
                            <Eye size={16} />
                          </button>
                          {(hire.status === 'active' || hire.status === 'hired' || hire.status === 'accepted') && (
                            <>
                              <button
                                onClick={() => handleSendMessage(hire)}
                                disabled={creatingConversation}
                                className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/30 rounded-lg transition disabled:opacity-50"
                                title={t.actions.message}
                              >
                                {creatingConversation ? (
                                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <MessageCircle size={16} />
                                )}
                              </button>
                              <button
                                onClick={() => handlePayNow(hire)}
                                className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 dark:bg-green-900/30 rounded-lg transition"
                                title={t.actions.pay}
                              >
                                <CreditCard size={16} />
                              </button>
                              <button
                                onClick={() => handleTerminateClick(hire)}
                                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:bg-red-900/30 rounded-lg transition"
                                title={t.actions.terminate}
                              >
                                <XIcon size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Details Modal */}
      {showDetailsModal && selectedHire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t.modal.title}</h2>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden relative">
                  {selectedHire.workerImage ? (
                    <img src={selectedHire.workerImage} alt={selectedHire.workerName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-teal-600" />
                  )}
                  {selectedHire.isPremium && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                      <Crown size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedHire.workerName}</h3>
                    {selectedHire.isPremium && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700">
                        <Crown size={10} className="text-yellow-500" />
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">{selectedHire.jobTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(selectedHire.status)}`}>
                      {getStatusIcon(selectedHire.status)}
                      {getStatusLabel(selectedHire.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.salary}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(selectedHire.salary)} {t.salaryPerMonth}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.startDate}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{formatDate(selectedHire.startDate)}</p>
                </div>
                {selectedHire.terminationDate && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.endDate}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{formatDate(selectedHire.terminationDate)}</p>
                  </div>
                )}
                {selectedHire.workerRating && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.rating}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-1">
                      <StarIcon size={18} className="text-yellow-500" />
                      {selectedHire.workerRating}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.modal.contact}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerEmail || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerPhone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerLocation || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {(selectedHire.status === 'active' || selectedHire.status === 'hired' || selectedHire.status === 'accepted') && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleSendMessage(selectedHire)}
                    disabled={creatingConversation}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creatingConversation ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MessageCircle size={18} />
                    )}
                    {t.actions.message}
                  </button>
                  <button
                    onClick={() => handleTerminateClick(selectedHire)}
                    className="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 dark:bg-red-900/30 transition flex items-center justify-center gap-2"
                  >
                    <XIcon size={18} />
                    {t.actions.terminate}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminateModal && terminatingHire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.terminate.title}</h3>
              <button
                onClick={() => setShowTerminateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{t.terminate.confirm}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.terminate.reason}
              </label>
              <textarea
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                placeholder={t.terminate.placeholder}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTerminateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {t.terminate.cancel}
              </button>
              <button
                onClick={handleTerminateHire}
                className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg font-medium text-white hover:bg-red-700 transition"
              >
                {t.terminate.confirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyHires;
