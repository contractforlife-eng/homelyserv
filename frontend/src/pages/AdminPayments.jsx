// src/pages/AdminPayments.jsx - MIGRATED TO DASHBOARD LAYOUT
import React, { useState, useEffect, useRef } from 'react';
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
  Bell,
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
  TrendingUp,
  RefreshCw,
  Shield,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Unlock,
  UserCheck,
  Briefcase,
  BarChart3,
  AlertTriangle,
  Crown,
  UserPlus
} from 'lucide-react';

// ============================================================
// MAIN ADMIN PAYMENTS COMPONENT
// ============================================================
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
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(null);

  const translations = {
    en: {
      title: 'Payments',
      subtitle: 'Manage and verify all payments and transactions',
      stats: {
        total: 'Total Payments',
        completed: 'Verified',
        pending: 'Pending Verification',
        failed: 'Failed',
        totalAmount: 'Total Amount'
      },
      filters: {
        all: 'All Payments',
        completed: 'Verified',
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
        verify: 'Verify Payment',
        reject: 'Reject',
        refresh: 'Refresh',
        approve: 'Approve'
      },
      status: {
        completed: 'Verified',
        pending: 'Pending',
        failed: 'Failed',
        pending_verification: 'Pending Verification'
      },
      modal: {
        title: 'Payment Details',
        paymentId: 'Payment ID',
        worker: 'Worker',
        employer: 'Employer',
        amount: 'Amount',
        date: 'Date',
        method: 'Payment Method',
        status: 'Status',
        description: 'Description',
        reference: 'Reference',
        close: 'Close',
        verify: 'Verify & Confirm',
        reject: 'Reject Payment',
        verifyConfirm: 'Are you sure you want to verify this payment?',
        rejectConfirm: 'Are you sure you want to reject this payment?',
        verified: 'Payment verified successfully!',
        rejected: 'Payment rejected.',
        contactInfo: 'Contact Information',
        jobTitle: 'Job Title',
        workerEmail: 'Worker Email',
        workerPhone: 'Worker Phone'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading payments...',
      noPayments: 'No payments yet'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة والتحقق من جميع المدفوعات والمعاملات',
      stats: {
        total: 'إجمالي المدفوعات',
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة',
        totalAmount: 'المبلغ الإجمالي'
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
        verify: 'تحقق من الدفع',
        reject: 'رفض',
        refresh: 'تحديث',
        approve: 'موافقة'
      },
      status: {
        completed: 'مكتملة',
        pending: 'قيد الانتظار',
        failed: 'فاشلة',
        pending_verification: 'في انتظار التحقق'
      },
      modal: {
        title: 'تفاصيل الدفع',
        paymentId: 'رقم الدفع',
        worker: 'العامل',
        employer: 'صاحب العمل',
        amount: 'المبلغ',
        date: 'التاريخ',
        method: 'طريقة الدفع',
        status: 'الحالة',
        description: 'الوصف',
        reference: 'المرجع',
        close: 'إغلاق',
        verify: 'تحقق وأكد',
        reject: 'رفض الدفع',
        verifyConfirm: 'هل أنت متأكد من رغبتك في التحقق من هذا الدفع؟',
        rejectConfirm: 'هل أنت متأكد من رغبتك في رفض هذا الدفع؟',
        verified: 'تم التحقق من الدفع بنجاح!',
        rejected: 'تم رفض الدفع.',
        contactInfo: 'معلومات الاتصال',
        jobTitle: 'عنوان الوظيفة',
        workerEmail: 'بريد العامل',
        workerPhone: 'هاتف العامل'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل المدفوعات...',
      noPayments: 'لا توجد مدفوعات حتى الآن'
    }
  };

  const t = translations[language] || translations.en;

  // ============================================================
  // loadPayments - Loads from ALL payment sources
  // ============================================================
  const loadPayments = async () => {
    setLoading(true);
    
    try {
      const allPayments = [];
      const seenIds = new Set();

      // 1. Load from all_payments (main payment storage)
      const allPaymentsData = JSON.parse(localStorage.getItem('all_payments') || '[]');
      
      allPaymentsData.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          if (!p.status) {
            p.status = p.paymentVerified ? 'completed' : 'pending';
          }
          allPayments.push(p);
        }
      });

      // 2. Load from employer_payments
      const employerPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
      
      employerPayments.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          if (!p.status) {
            p.status = p.paymentVerified ? 'completed' : 'pending';
          }
          allPayments.push(p);
        }
      });

      // 3. Load from admin_payments
      const adminPayments = JSON.parse(localStorage.getItem('admin_payments') || '[]');
      
      adminPayments.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          if (!p.status) {
            p.status = p.paymentVerified ? 'completed' : 'pending';
          }
          allPayments.push(p);
        }
      });

      // 4. Load from payment verification requests
      const verificationRequests = JSON.parse(localStorage.getItem('homelyserv_payment_verification_requests') || '[]');
      
      verificationRequests.forEach(req => {
        const id = req.id || req.paymentId || 'REQ-' + Date.now();
        if (!seenIds.has(id)) {
          seenIds.add(id);
          allPayments.push({
            ...req,
            id: id,
            status: req.status || 'pending_verification',
            paymentMethod: req.paymentMethod || 'Unknown',
            amount: req.amount || 0,
            workerName: req.workerName || req.userName || 'Unknown',
            employerName: req.employerName || 'Unknown',
            createdAt: req.submittedAt || req.createdAt || new Date().toISOString()
          });
        }
      });

      // 5. Load from worker_payments
      const workerPayments = JSON.parse(localStorage.getItem('worker_payments') || '[]');
      
      workerPayments.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          if (!p.status) {
            p.status = p.paymentVerified ? 'completed' : 'pending';
          }
          allPayments.push(p);
        }
      });

      // 6. Load from homelyserv_payments
      const homelyPayments = JSON.parse(localStorage.getItem('homelyserv_payments') || '[]');
      
      homelyPayments.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          if (!p.status) {
            p.status = p.paymentVerified ? 'completed' : 'pending';
          }
          allPayments.push(p);
        }
      });

      // 7. Generate payments from offers that are completed
      const allOffersData = await hireService.getOffers();
      const allOffers = allOffersData.offers || allOffersData || [];
      const employerOffers = Array.isArray(allOffers) ? allOffers : [];
      const completedOffers = employerOffers.filter(o => 
        o.status === 'completed' || 
        o.status === 'in_progress' || 
        o.paymentConfirmed === true
      );
      
      completedOffers.forEach(offer => {
        const paymentId = offer.paymentId || `PAY-${offer.id}`;
        if (!seenIds.has(paymentId)) {
          seenIds.add(paymentId);
          allPayments.push({
            id: paymentId,
            offerId: offer.id,
            amount: offer.amount || offer.salary || 0,
            currency: 'EGP',
            status: 'completed',
            paymentVerified: true,
            contactRevealed: true,
            workerName: offer.workerName || 'Worker',
            workerEmail: offer.workerEmail || '',
            workerPhone: offer.workerPhone || '',
            employerName: offer.employerName || 'Employer',
            employerEmail: offer.employerEmail || '',
            jobTitle: offer.jobTitle || 'Service',
            paymentMethod: offer.paymentMethod || 'Unknown',
            description: offer.description || `Payment for ${offer.jobTitle || 'service'}`,
            createdAt: offer.hiredAt || offer.updatedAt || offer.createdAt || new Date().toISOString(),
            completedAt: offer.hiredAt || offer.updatedAt || new Date().toISOString()
          });
        }
      });

      // Sort by date (newest first)
      allPayments.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || a.submittedAt || 0);
        const dateB = new Date(b.createdAt || b.date || b.submittedAt || 0);
        return dateB - dateA;
      });

      console.log('✅ Total unique payments loaded:', allPayments.length);
      
      setPayments(allPayments);
      setFilteredPayments(allPayments);
      
      // Save to admin_payments for persistence
      localStorage.setItem('admin_payments', JSON.stringify(allPayments));
      
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // verifyPayment
  // ============================================================
  const verifyPayment = (payment) => {
    if (!confirm(t.modal.verifyConfirm)) return;
    
    setVerifyingPayment(payment.id);
    
    try {
      const updatedPayment = {
        ...payment,
        status: 'completed',
        paymentVerified: true,
        contactRevealed: true,
        verifiedAt: new Date().toISOString(),
        verifiedBy: user?.email || 'admin'
      };
      
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      const updatedAllPayments = allPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('all_payments', JSON.stringify(updatedAllPayments));
      
      const adminPayments = JSON.parse(localStorage.getItem('admin_payments') || '[]');
      const updatedAdminPayments = adminPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('admin_payments', JSON.stringify(updatedAdminPayments));
      
      const employerPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
      const updatedEmployerPayments = employerPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('employer_payments', JSON.stringify(updatedEmployerPayments));
      
      const verificationRequests = JSON.parse(localStorage.getItem('homelyserv_payment_verification_requests') || '[]');
      const updatedRequests = verificationRequests.map(r => 
        r.id === payment.id ? { ...r, status: 'verified', verifiedAt: new Date().toISOString() } : r
      );
      localStorage.setItem('homelyserv_payment_verification_requests', JSON.stringify(updatedRequests));
      
      setPayments(prev => prev.map(p => 
        p.id === payment.id ? updatedPayment : p
      ));
      setFilteredPayments(prev => prev.map(p => 
        p.id === payment.id ? updatedPayment : p
      ));
      
      alert(t.modal.verified);
      
      setShowDetailsModal(false);
      setSelectedPayment(null);
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment. Please try again.');
    } finally {
      setVerifyingPayment(null);
    }
  };

  // ============================================================
  // rejectPayment
  // ============================================================
  const rejectPayment = (payment) => {
    if (!confirm(t.modal.rejectConfirm)) return;
    
    setVerifyingPayment(payment.id);
    
    try {
      const updatedPayment = {
        ...payment,
        status: 'failed',
        rejectedAt: new Date().toISOString(),
        rejectedBy: user?.email || 'admin'
      };
      
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      const updatedAllPayments = allPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('all_payments', JSON.stringify(updatedAllPayments));
      
      const adminPayments = JSON.parse(localStorage.getItem('admin_payments') || '[]');
      const updatedAdminPayments = adminPayments.map(p => 
        p.id === payment.id ? updatedPayment : p
      );
      localStorage.setItem('admin_payments', JSON.stringify(updatedAdminPayments));
      
      const verificationRequests = JSON.parse(localStorage.getItem('homelyserv_payment_verification_requests') || '[]');
      const updatedRequests = verificationRequests.map(r => 
        r.id === payment.id ? { ...r, status: 'rejected', rejectedAt: new Date().toISOString() } : r
      );
      localStorage.setItem('homelyserv_payment_verification_requests', JSON.stringify(updatedRequests));
      
      setPayments(prev => prev.map(p => 
        p.id === payment.id ? updatedPayment : p
      ));
      setFilteredPayments(prev => prev.map(p => 
        p.id === payment.id ? updatedPayment : p
      ));
      
      alert(t.modal.rejected);
      
      setShowDetailsModal(false);
      setSelectedPayment(null);
      
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setVerifyingPayment(null);
    }
  };

  // ============================================================
  // useEffect
  // ============================================================
  // Use authStore as single source of truth
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);

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
    loadPayments();
  }, [authUser, isAuthenticated, authLoading, navigate]);

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
        p.workerName?.toLowerCase().includes(searchLower) ||
        p.employerName?.toLowerCase().includes(searchLower) ||
        p.employer?.toLowerCase().includes(searchLower) ||
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
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    loadPayments();
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      pending_verification: 'bg-blue-500/20 text-blue-400',
      failed: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'pending_verification': return <Clock size={16} className="text-blue-400" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400 dark:text-gray-500" />;
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString() || 0} EGP`;
  };

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed' || p.paymentVerified === true).length,
    pending: payments.filter(p => p.status === 'pending' || p.status === 'pending_verification' || !p.paymentVerified).length,
    failed: payments.filter(p => p.status === 'failed' || p.status === 'rejected').length
  };

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.total}</p>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.completed}</p>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.pending}</p>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.failed}</p>
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.failed}</p>
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
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Showing <span className="font-semibold text-white">{filteredPayments.length}</span> payments
          </p>
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t.noPayments}</h3>
            <p className="text-gray-400 dark:text-gray-500">Payments will appear here</p>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a0a0a] border-b border-yellow-500/20">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Worker</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Employer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-yellow-500/5 transition">
                      <td className="px-4 py-3 text-sm text-gray-300">{payment.id}</td>
                      <td className="px-4 py-3 text-sm text-white">{payment.workerName || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-white">{payment.employerName || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">{formatDate(payment.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleViewDetails(payment)}
                            className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition flex items-center gap-1"
                          >
                            <Eye size={12} />
                            {t.actions.view}
                          </button>
                          {(payment.status === 'pending' || payment.status === 'pending_verification') && (
                            <>
                              <button
                                onClick={() => verifyPayment(payment)}
                                disabled={verifyingPayment === payment.id}
                                className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition disabled:opacity-50"
                              >
                                <CheckCircle size={12} className="inline mr-1" />
                                {t.actions.verify}
                              </button>
                              <button
                                onClick={() => rejectPayment(payment)}
                                disabled={verifyingPayment === payment.id}
                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition disabled:opacity-50"
                              >
                                <X size={12} className="inline mr-1" />
                                {t.actions.reject}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20">
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <h2 className="text-xl font-semibold text-white">{t.modal.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors text-gray-400 dark:text-gray-500 hover:text-yellow-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t.modal.paymentId}</p>
                    <p className="text-lg font-bold text-white">{selectedPayment.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
                    <UserIcon size={16} className="text-yellow-500" />
                    {t.modal.employer}
                  </h3>
                  <p className="font-medium text-white">{selectedPayment.employerName || 'N/A'}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{selectedPayment.employerEmail || 'N/A'}</p>
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
                    <UserCheck size={16} className="text-yellow-500" />
                    {t.modal.worker}
                  </h3>
                  <p className="font-medium text-white">{selectedPayment.workerName || 'N/A'}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{selectedPayment.workerEmail || 'N/A'}</p>
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t.modal.amount}</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(selectedPayment.amount)}</p>
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t.modal.date}</p>
                  <p className="font-medium text-white">{formatDate(selectedPayment.createdAt)}</p>
                </div>
              </div>

              {(selectedPayment.status === 'pending' || selectedPayment.status === 'pending_verification') && (
                <div className="flex flex-wrap items-center gap-3 p-6 border-t border-yellow-500/20">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    {t.modal.close}
                  </button>
                  <button
                    onClick={() => verifyPayment(selectedPayment)}
                    disabled={verifyingPayment === selectedPayment.id}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {t.modal.verify}
                  </button>
                  <button
                    onClick={() => rejectPayment(selectedPayment)}
                    disabled={verifyingPayment === selectedPayment.id}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X size={16} />
                    {t.modal.reject}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminPayments;