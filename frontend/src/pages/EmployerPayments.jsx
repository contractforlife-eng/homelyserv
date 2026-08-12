// src/pages/EmployerPayments.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { sendMessage } from '../utils/chatService';
import hireService from '../services/hireService';
import { RECRUITMENT_COMMISSION_RATE } from '../config/monetization';
import { UserAvatar } from '../components/users';
import {
  User,
  Briefcase,
  DollarSign,
  MapPin,
  Star,
  CheckCircle,
  CreditCard,
  Shield,
  MessageCircle,
  Menu,
  Globe,
  X,
  Search,
  Clock,
  Eye,
  RefreshCw,
  Copy,
  Users,
  BarChart3,
  Phone,
  Mail,
  Lock,
  Unlock,
  MessageSquare,
  Info
} from 'lucide-react';

const EmployerPayments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    totalCommissionPaid: 0,
    pendingCount: 0,
    completedCount: 0,
    totalWorkers: 0,
    monthlyAverage: 0,
    totalSalary: 0
  });
  const isLoadingRef = React.useRef(false);


  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const loadData = async () => {
    if (isLoadingRef.current || !authUser?.email) {
      setPayments([]);
      setFilteredPayments([]);
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      const employerEmail = authUser.email;
      const employerId = authUser?.id;
      
      // Load real Hire data from backend
      const allHiresData = await hireService.getMyHires();
      const myHires = Array.isArray(allHiresData) ? allHiresData : [];
      
      // Filter hires for this employer
      const employerHires = myHires.filter(h => 
        h.employerId === employerId || h.employerEmail === employerEmail
      );
      
      // Convert hires to payments format
      const paymentsFromHires = employerHires.map(hire => ({
        id: hire.paymentReference || `PAY-${hire.id}`,
        hireId: hire.id,
        offerId: hire.offerId,
        workerId: hire.workerId,
        workerName: hire.workerName || 'Worker',
        workerEmail: hire.workerEmail || '',
        workerPhone: hire.workerPhone || '',
        workerLocation: hire.workerLocation || 'Not specified',
        workerRating: hire.workerRating || 4.5,
        workerImage: hire.workerImage || '',
        employerId: employerId,
        employerEmail: employerEmail,
        jobTitle: hire.jobTitle || 'Service Provider',
        commission: hire.commissionAmount || 0,
        fullSalary: hire.agreedSalary || hire.salary || 0,
        status: hire.paymentStatus === 'completed' ? 'completed' : 'pending',
        paymentVerified: hire.paymentStatus === 'completed',
        contactRevealed: hire.paymentStatus === 'completed',
        paymentMethod: hire.paymentMethod || 'commission',
        paymentType: 'commission',
        type: 'commission',
        createdAt: hire.createdAt || new Date().toISOString(),
        updatedAt: hire.updatedAt || new Date().toISOString(),
        completedAt: hire.paymentStatus === 'completed' ? hire.updatedAt : null,
        description: `Commission for hiring ${hire.workerName}`,
        reference: hire.paymentReference || `REF-${hire.id}`,
        hasReceipt: false
      }));

      // Merge with existing localStorage payments (for backward compatibility)
      let allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      const mergedPayments = [...paymentsFromHires];
      
      allPayments.forEach(p => {
        if (p.employerId === employerId && !mergedPayments.find(mp => mp.hireId === p.hireId)) {
          mergedPayments.push(p);
        }
      });

      // Sort by date
      mergedPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setPayments(mergedPayments);
      setFilteredPayments(mergedPayments);

      // Calculate statistics from database data
      const completedPayments = mergedPayments.filter(p => p.status === 'completed' || p.paymentVerified === true);
      const totalCommissionPaid = completedPayments.reduce((sum, p) => sum + (p.commission || 0), 0);
      const totalFullSalary = completedPayments.reduce((sum, p) => sum + (p.fullSalary || 0), 0);
      const pendingCount = mergedPayments.filter(p => p.status === 'pending' && !p.paymentVerified).length;
      const completedCount = completedPayments.length;

      const uniqueWorkers = new Set();
      mergedPayments.forEach(p => {
        if (p.workerEmail || p.workerId) {
          uniqueWorkers.add(p.workerEmail || p.workerId);
        }
      });

      setStats({
        totalCommissionPaid: totalCommissionPaid,
        pendingCount: pendingCount,
        completedCount: completedCount,
        totalWorkers: uniqueWorkers.size,
        monthlyAverage: completedCount > 0 ? Math.round(totalCommissionPaid / Math.max(completedCount, 1)) : 0,
        totalSalary: totalFullSalary
      });

    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

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
  }, [authUser, authLoading, navigate]);

  useEffect(() => {
    if (authUser) {
      loadData();
    }
  }, [authUser, refreshKey]);

  useEffect(() => {
    let filtered = [...payments];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.workerName?.toLowerCase().includes(searchLower) ||
        p.jobTitle?.toLowerCase().includes(searchLower) ||
        p.id?.toLowerCase().includes(searchLower) ||
        p.workerEmail?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleProcessPayment = (payment) => {
    const paymentData = payment || selectedPayment;
    if (!paymentData) {
      alert(t('employerPayments.paymentNotFound'));
      return;
    }

    const pendingPayment = {
      paymentId: paymentData.id,
      amount: Number(paymentData.commission || 0), 
      fullSalary: Number(paymentData.fullSalary || 0),
      workerName: paymentData.workerName,
      workerId: paymentData.workerId || paymentData.id,
      workerEmail: paymentData.workerEmail || '',
      jobTitle: paymentData.jobTitle || 'Service Provider',
      description: paymentData.description || `Commission for ${paymentData.workerName}`,
      paymentType: 'commission',
      offerId: paymentData.offerId,
      hireId: paymentData.hireId,
      employerId: authUser?.id || authUser?.email,
      employerName: authUser?.fullName || 'Employer',
      returnTo: '/employer-payments'
      // Note: onPaymentSuccess callback removed - cannot pass functions via Router state
      // PaymentOptions will recreate this callback locally using the offerId
    };

    const workerData = {
      workerId: paymentData.workerId || paymentData.id,
      workerName: paymentData.workerName,
      workerEmail: paymentData.workerEmail || '',
      workerPhone: paymentData.workerPhone || 'Not provided',
      workerLocation: paymentData.workerLocation || 'Not specified',
      desiredJob: paymentData.jobTitle || 'Service Provider',
      fullSalary: paymentData.fullSalary || 0,
      workerSkills: paymentData.workerSkills || [],
      rating: paymentData.workerRating || 4.5,
      profileImage: paymentData.workerImage || '',
      offerId: paymentData.offerId
    };

    setShowDetailsModal(false);
    setSelectedPayment(null);

    // Navigate with payment data in state instead of localStorage
    navigate('/payment-options', { 
      state: { 
        pendingPayment,
        worker: workerData
      } 
    });
  };

  const handleContact = async (payment, method) => {
    const phone = payment.workerPhone;
    
    if (method === 'whatsapp') {
      if (phone) {
        const formattedPhone = phone.replace(/\s/g, '').replace(/^0/, '20');
        window.open(`https://wa.me/${formattedPhone}`, '_blank');
      } else {
        alert(t('employerPayments.noPhoneNumber'));
      }
    } else if (method === 'message') {
      const workerId = payment.workerId;
      const workerName = payment.workerName || 'Worker';
      
      if (!workerId) {
        alert(t('employerPayments.workerIdNotFound'));
        return;
      }
      
      const employerId = authUser?.id;
      const employerName = authUser?.fullName || 'Employer';
      
      try {
        await sendMessage(employerId, employerName, 'EMPLOYER', workerId, workerName, `Hello ${workerName}! Let's discuss your work.`);
      } catch (error) {
        console.error('Error ensuring conversation:', error);
      }
      
      const params = new URLSearchParams({
        workerId: workerId,
        workerName: workerName,
        workerImage: payment.workerImage || '',
        hireId: payment.offerId || payment.id || '',
        job: payment.jobTitle || ''
      });
      
      navigate(`/employer-messages?${params.toString()}`);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    alert(t('employerPayments.copySuccess'));
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
  };

  const handleRefresh = () => {
    loadData();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-teal-100 text-teal-800'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'accepted': return <CheckCircle size={14} />;
      case 'rejected': return <X size={14} />;
      case 'processing': return <RefreshCw size={14} />;
      case 'in_progress': return <Briefcase size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString() || 0} EGP`;
  };

  const formatStatus = (status) => {
    return t(`employerPayments.status.${status}`, { defaultValue: status });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerPayments.authLoading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerPayments.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t('employerPayments.title')}
        notificationUserId={authUser?.id}
        isPremium={isUserPremium(authUser?.id)}
        rightContent={
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            {t('employerPayments.refresh')}
          </button>
        }
      />

        <div className="p-4 lg:p-6">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t('employerPayments.title')}</h1>
              <p className="text-teal-100 mt-1">{t('employerPayments.subtitle')}</p>
              <p className="text-teal-200 text-sm mt-1 flex items-center gap-1">
                <Info size={14} />
                {t('employerPayments.commissionInfo')}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerPayments.stats.totalPaid')}</p>
                <DollarSign size={16} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{formatCurrency(stats.totalCommissionPaid)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerPayments.stats.pending')}</p>
                <Clock size={16} className="text-yellow-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{stats.pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerPayments.stats.completed')}</p>
                <CheckCircle size={16} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{stats.completedCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerPayments.stats.workers')}</p>
                <Users size={16} className="text-teal-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{stats.totalWorkers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerPayments.stats.monthlyAverage')}</p>
                <BarChart3 size={16} className="text-purple-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{formatCurrency(stats.monthlyAverage)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerPayments.stats.totalSalary')}</p>
                <Briefcase size={16} className="text-orange-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{formatCurrency(stats.totalSalary)}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={t('employerPayments.searchPlaceholder')}
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
                  <option value="all">{t('employerPayments.filters.all')}</option>
                  <option value="pending">{t('employerPayments.filters.pending')}</option>
                  <option value="completed">{t('employerPayments.filters.completed')}</option>
                  <option value="accepted">{t('employerPayments.filters.accepted')}</option>
                  <option value="rejected">{t('employerPayments.filters.rejected')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {t('ticketSystem.showing')} <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredPayments.length}</span> {t('ticketSystem.categoryValues.payments')}
            </p>
          </div>

          {/* Payments Table */}
          {filteredPayments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('employerPayments.empty.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerPayments.empty.description')}</p>
              <button
                onClick={() => navigate('/employer-search')}
                className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('employerPayments.empty.start')}
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('employerPayments.table.id')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('employerPayments.table.worker')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden md:table-cell">{t('employerPayments.table.job')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('employerPayments.table.commission')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden lg:table-cell">{t('employerPayments.table.fullSalary')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">{t('employerPayments.table.date')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('employerPayments.table.status')}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('employerPayments.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id || payment.offerId} className="hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[80px]">{payment.id}</span>
                            <button onClick={() => handleCopyId(payment.id)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0">
                              <Copy size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={payment.workerName || t('employerPayments.workerFallback')}
                              image={payment.workerImage || null}
                              role="WORKER"
                              size="sm"
                              className="border border-teal-200"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{payment.workerName || t('employerPayments.unknown')}</p>
                              {payment.workerEmail && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 truncate max-w-[100px]">{payment.workerEmail}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{payment.jobTitle || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-teal-600">{formatCurrency(payment.commission)}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t('employerPayments.platformCommission')}</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(payment.fullSalary)}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t('employerPayments.workerSalary')}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{formatDate(payment.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {formatStatus(payment.status)}
                          </span>
                          {payment.status === 'pending' && payment.contactRevealed === false && (
                            <div className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                              <Lock size={10} />
                              {t('employerPayments.waitingForPayment')}
                            </div>
                          )}
                          {payment.status === 'completed' && payment.contactRevealed === true && (
                            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <Unlock size={10} />
                              {t('employerPayments.contactRevealed')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button onClick={() => handleViewDetails(payment)} className="p-1.5 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:bg-teal-900/30 rounded-lg transition-colors" title={t('employerPayments.actions.view')}>
                              <Eye size={16} />
                            </button>
                            {payment.status === 'pending' && !payment.paymentVerified && (
                              <>
                                <button onClick={() => handleProcessPayment(payment)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
                                  <CreditCard size={12} />
                                  {t('employerPayments.actions.payNow')}
                                </button>
                              </>
                            )}
                            {payment.status === 'completed' && payment.contactRevealed === true && (
                              <>
                                <button onClick={() => handleContact(payment, 'whatsapp')} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1">
                                  <MessageSquare size={12} />
                                  {t('employerPayments.whatsapp')}
                                </button>
                                <button onClick={() => handleContact(payment, 'message')} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1">
                                  <MessageCircle size={12} />
                                  {t('employerPayments.message')}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('employerPayments.modal.title')}</h2>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerPayments.modal.paymentId')}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{selectedPayment.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {formatStatus(selectedPayment.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('employerPayments.modal.worker')}</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{selectedPayment.workerName || t('employerPayments.notAvailable')}</p>
                  {selectedPayment.workerEmail && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{selectedPayment.workerEmail}</p>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('employerPayments.modal.job')}</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{selectedPayment.jobTitle || t('employerPayments.notAvailable')}</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">{t('employerPayments.modal.commission')}</p>
                <p className="text-2xl font-bold text-teal-600">{formatCurrency(selectedPayment.commission)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('employerPayments.commissionOfSalary', { rate: RECRUITMENT_COMMISSION_RATE * 100, salary: formatCurrency(selectedPayment.fullSalary) })}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('employerPayments.modal.fullSalary')}</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatCurrency(selectedPayment.fullSalary)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('employerPayments.modal.note')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('employerPayments.modal.date')}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('employerPayments.modal.method')}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedPayment.paymentMethod === 'commission' ? t('employerPayments.commissionMethod') : (selectedPayment.paymentMethod || t('employerPayments.notAvailable'))}</p>
                </div>
              </div>

              {selectedPayment.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('employerPayments.modal.description')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedPayment.description}</p>
                </div>
              )}

              {selectedPayment.reference && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{t('employerPayments.modal.reference')}</p>
                  <p className="text-sm font-mono text-gray-800 dark:text-white">{selectedPayment.reference}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                >
                  {t('employerPayments.modal.close')}
                </button>
                <button
                  onClick={() => handleCopyId(selectedPayment.id)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  {t('employerPayments.modal.copyId')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployerPayments;
