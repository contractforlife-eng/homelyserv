// src/pages/WorkerPayment.jsx - RED AND WHITE THEME WITH WORKING NOTIFICATIONS AND FIXED TOGGLES
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../components/layout/DashboardContext';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import hireService from '../services/hireService';
import api from '../utils/api';
import {
  User,
  Briefcase,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  X,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  Search,
  Wallet,
  Building,
  Phone,
  RefreshCw,
  Shield,
  Crown
} from 'lucide-react';

// ============================================
// 2. MAIN COMPONENT - WorkerPayment - WITH WORKING NOTIFICATIONS
// ============================================
const WorkerPayment = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const dashboard = useDashboard();
  
  // Payment info form
  const [workerPaymentInfo, setWorkerPaymentInfo] = useState({
    walletNumber: '',
    instapayNumber: '',
    bankAccountNumber: '',
    bankName: '',
    accountHolderName: ''
  });
  const [isEditingPaymentInfo, setIsEditingPaymentInfo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [workerStats, setWorkerStats] = useState({
    totalTasksCompleted: 0,
    totalEarned: 0,
    hourlyRate: 0,
    monthlySalary: 0
  });

   // ============================================
   // IS PREMIUM CHECK
   // ============================================
  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  // ============================================
  // 3. TRANSLATIONS
  // ============================================
  const translations = {
    en: {
      title: 'Payments',
      subtitle: 'Manage your payments and payment information',
      stats: {
        totalEarned: 'Total Earned',
        tasksCompleted: 'Tasks Completed',
        hourlyRate: 'Hourly Rate',
        monthlySalary: 'Monthly Salary'
      },
      paymentInfo: {
        title: 'Payment Information',
        walletNumber: 'Wallet Number',
        instapayNumber: 'InstaPay Number',
        bankAccount: 'Bank Account Number',
        bankName: 'Bank Name',
        accountHolder: 'Account Holder Name',
        edit: 'Edit Payment Info',
        save: 'Save Changes',
        cancel: 'Cancel',
        saved: 'Payment information updated successfully!',
        saveError: 'Failed to save payment information. Please try again.',
        loadError: 'Failed to load payment information.'
      },
      paymentHistory: {
        title: 'Payment History',
        id: 'Transaction ID',
        employer: 'Employer',
        amount: 'Amount',
        date: 'Date',
        status: 'Status',
        description: 'Description',
        noResults: 'No payments found',
        searchPlaceholder: 'Search payments...',
        employerId: 'Employer ID',
        passportNumber: 'Passport Number'
      },
      status: {
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
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading payment data...',
      noPayments: 'No payment history yet',
      noPaymentsDesc: 'Your payment history will appear here once you complete tasks',
      refresh: 'Refresh',
      premiumBadge: 'Premium Verified',
      getPremium: 'Get Premium',
      noNotifications: 'No new notifications'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة مدفوعاتك ومعلومات الدفع',
      stats: {
        totalEarned: 'إجمالي المكاسب',
        tasksCompleted: 'المهام المكتملة',
        hourlyRate: 'السعر بالساعة',
        monthlySalary: 'الراتب الشهري'
      },
      paymentInfo: {
        title: 'معلومات الدفع',
        walletNumber: 'رقم المحفظة',
        instapayNumber: 'رقم InstaPay',
        bankAccount: 'رقم الحساب البنكي',
        bankName: 'اسم البنك',
        accountHolder: 'اسم صاحب الحساب',
        edit: 'تعديل معلومات الدفع',
        save: 'حفظ التغييرات',
        cancel: 'إلغاء',
        saved: 'تم تحديث معلومات الدفع بنجاح!',
        saveError: 'تعذر حفظ معلومات الدفع. حاول مرة أخرى.',
        loadError: 'تعذر تحميل معلومات الدفع.'
      },
      paymentHistory: {
        title: 'سجل المدفوعات',
        id: 'رقم المعاملة',
        employer: 'صاحب العمل',
        amount: 'المبلغ',
        date: 'التاريخ',
        status: 'الحالة',
        description: 'الوصف',
        noResults: 'لا توجد مدفوعات',
        searchPlaceholder: 'ابحث عن مدفوعات...',
        employerId: 'معرف صاحب العمل',
        passportNumber: 'رقم جواز السفر'
      },
      status: {
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
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل بيانات الدفع...',
      noPayments: 'لا يوجد سجل مدفوعات بعد',
      noPaymentsDesc: 'سيظهر سجل مدفوعاتك هنا بمجرد إكمال المهام',
      refresh: 'تحديث',
      premiumBadge: 'مميز معتمد',
      getPremium: 'اشتراك مميز',
      noNotifications: 'لا توجد إشعارات جديدة'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  // ============================================
  // 4. DATA LOADING FUNCTIONS
  // ============================================
  const loadPaymentData = async () => {
    if (!authUser) return;
    
    setLoading(true);

    try {
      const userId = authUser.id || authUser.email;
      
      // Load real Hire data from backend ONLY
      const allHiresData = await hireService.getMyHires();
      const myHires = Array.isArray(allHiresData) ? allHiresData : [];
      
      // Filter completed hires (active or completed status with payment completed)
      const completedHires = myHires.filter(h => 
        h.status === 'active' || h.status === 'completed' || h.paymentStatus === 'completed'
      );
      
      // Convert hires to payments format directly from database
      const paymentsFromHires = completedHires.map(hire => ({
        id: hire.paymentReference || `PAY-${hire.id}`,
        hireId: hire.id,
        offerId: hire.offerId,
        employer: {
          name: hire.employerName || 'Unknown Employer',
          id: hire.employerId || 'EMP-001'
        },
        amount: hire.agreedSalary || hire.salary || 0,
        date: new Date(hire.createdAt || Date.now()).toLocaleDateString(
          dashboard.language === 'ar' ? 'ar-EG' : 'en-US',
          { year: 'numeric', month: 'short', day: 'numeric' }
        ),
        status: 'completed',
        description: `Payment for ${hire.jobTitle || 'service'}`,
        workerId: userId,
        workerEmail: authUser.email,
        createdAt: hire.createdAt || new Date().toISOString()
      }));
      
      // Sort by date
      paymentsFromHires.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setPayments(paymentsFromHires);
      setFilteredPayments(paymentsFromHires);
      
      updateStatsFromPayments(paymentsFromHires);
      
      console.log(`✅ Loaded ${paymentsFromHires.length} payments from database for worker`);
      
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatsFromPayments = (paymentsList) => {
    const completedPayments = paymentsList.filter(p => p.status === 'completed');
    const totalEarned = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalTasksCompleted = completedPayments.length;
    
    const hourlyRate = authUser?.hourlyRate || 35;
    const monthlySalary = totalEarned / 6;
    
    setWorkerStats({
      totalTasksCompleted,
      totalEarned,
      hourlyRate: hourlyRate,
      monthlySalary: monthlySalary || hourlyRate * 160
    });
  };

  const PAYOUT_FIELDS = ['walletNumber', 'instapayNumber', 'bankAccountNumber', 'bankName', 'accountHolderName'];
  const PAYOUT_KEY = (userId) => `worker_payment_info_${userId}`;

  const applyPayoutDetailsToForm = (record) => {
    if (!record) return;
    setWorkerPaymentInfo(prev => {
      const next = { ...prev };
      PAYOUT_FIELDS.forEach(field => {
        if (typeof record[field] === 'string') {
          next[field] = record[field];
        }
      });
      return next;
    });
  };

  // Migrate a legacy localStorage payout record to the backend once.
  // Only runs when the backend has no record, and never overwrites it.
  const migrateLegacyPayoutDetails = async () => {
    if (!authUser) return false;
    try {
      const raw = localStorage.getItem(PAYOUT_KEY(authUser.id));
      if (!raw) return false;

      const legacy = JSON.parse(raw);
      const payload = {};
      PAYOUT_FIELDS.forEach(field => {
        if (legacy && typeof legacy[field] === 'string' && legacy[field].trim()) {
          payload[field] = legacy[field].trim();
        }
      });

      if (Object.keys(payload).length === 0) return false;

      setWorkerPaymentInfo(prev => ({ ...prev, ...payload }));
      await api.put('/api/worker/payout-details', payload);
      localStorage.removeItem(PAYOUT_KEY(authUser.id));
      console.log('✅ Legacy payout details migrated to backend');
      return true;
    } catch (error) {
      console.warn('Legacy payout details migration skipped:', error.message);
      return false;
    }
  };

  const loadPayoutDetails = async () => {
    if (!authUser) return;
    try {
      const response = await api.get('/api/worker/payout-details');
      const record = response.data?.payoutDetails;
      if (record) {
        applyPayoutDetailsToForm(record);
      } else {
        await migrateLegacyPayoutDetails();
      }
    } catch (error) {
      console.error('Error loading payout details:', error);
      setPayoutError(t.paymentInfo.loadError);
      setTimeout(() => setPayoutError(''), 4000);
    }
  };

  // ============================================
  // 5. EFFECTS
  // ============================================
  useEffect(() => {
     if (authLoading) return;

     if (!isAuthenticated || !authUser) {
       return;
     }

     if (authUser.role !== 'WORKER') {
       return;
     }
   }, [authUser, isAuthenticated, authLoading]);

  useEffect(() => {
    if (authUser) {
      loadPaymentData();
      loadPayoutDetails();
    }
  }, [authUser]);

  useEffect(() => {
    let filtered = payments;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.id?.toLowerCase().includes(searchLower) ||
        p.employer?.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  // ============================================
  // 6. HANDLERS
  // ============================================
  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setWorkerPaymentInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePaymentInfo = async () => {
    if (!authUser) return;

    const payload = {};
    PAYOUT_FIELDS.forEach(field => {
      const value = workerPaymentInfo[field];
      if (value && typeof value === 'string' && value.trim()) {
        payload[field] = value.trim();
      }
    });

    if (Object.keys(payload).length === 0) {
      setPayoutError(t.paymentInfo.saveError);
      setTimeout(() => setPayoutError(''), 4000);
      return;
    }

    setPayoutSaving(true);
    setPayoutError('');

    try {
      await api.put('/api/worker/payout-details', payload);
      setIsEditingPaymentInfo(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving payout details:', error);
      setPayoutError(t.paymentInfo.saveError);
      setTimeout(() => setPayoutError(''), 4000);
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleRefresh = () => {
    loadPaymentData();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      failed: 'bg-red-100 text-red-800 border border-red-200'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'failed': return <X size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const formatCurrency = (amount) => `EGP ${amount?.toLocaleString() || 0}`;

  const stats = {
    totalEarned: workerStats.totalEarned || 0,
    tasksCompleted: workerStats.totalTasksCompleted || 0,
    hourlyRate: workerStats.hourlyRate || authUser?.hourlyRate || 0,
    monthlySalary: workerStats.monthlySalary || 0
  };

  const userProfileImage = authUser?.profileImage || null;

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={userIsPremium}
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
          
          {/* Welcome Banner - RED THEME */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 md:p-8 mb-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800/20 border-2 border-white/50 overflow-hidden flex-shrink-0 shadow-inner relative">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
                      alt={authUser.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-white m-3" />
                  )}
                  {userIsPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white/50">
                      <Crown size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
                    {userIsPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                        <Crown size={12} className="text-yellow-300" />
                        {t.premiumBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 mt-1 text-sm md:text-base">{t.subtitle}</p>
                </div>
              </div>
              {!userIsPremium && (
                <Link
                  to="/subscription"
                  className="bg-yellow-500/30 hover:bg-yellow-500/40 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-yellow-400/30"
                >
                  <Crown size={16} />
                  {t.getPremium}
                </Link>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: t.stats.totalEarned, value: formatCurrency(stats.totalEarned), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
              { label: t.stats.tasksCompleted, value: stats.tasksCompleted, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
              { label: t.stats.hourlyRate, value: `EGP ${stats.hourlyRate}/hr`, icon: Clock, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
              { label: t.stats.monthlySalary, value: formatCurrency(stats.monthlySalary), icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">{stat.label}</p>
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Payment Information Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <CreditCard size={20} className="text-red-500" />
                {t.paymentInfo.title}
              </h3>
              {!isEditingPaymentInfo ? (
                <button
                  onClick={() => setIsEditingPaymentInfo(true)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 hover:text-red-600 transition-colors shadow-sm w-full sm:w-auto"
                >
                  {t.paymentInfo.edit}
                </button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsEditingPaymentInfo(false)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                  >
                    {t.paymentInfo.cancel}
                  </button>
                  <button
                    onClick={handleSavePaymentInfo}
                    disabled={payoutSaving}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-medium hover:shadow-md transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {payoutSaving ? '...' : t.paymentInfo.save}
                  </button>
                </div>
              )}
            </div>

            {saveSuccess && (
              <div className="px-6 py-3 bg-green-50 dark:bg-green-900/30/80 border-b border-green-100 text-green-700 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {t.paymentInfo.saved}
              </div>
            )}

            {payoutError && (
              <div className="px-6 py-3 bg-red-50 dark:bg-red-900/30 border-b border-red-100 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {payoutError}
              </div>
            )}

            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {[
                  { label: t.paymentInfo.walletNumber, name: 'walletNumber', icon: Wallet, placeholder: '01xxxxxxxxx' },
                  { label: t.paymentInfo.instapayNumber, name: 'instapayNumber', icon: Phone, placeholder: 'username@instapay' },
                  { label: t.paymentInfo.bankAccount, name: 'bankAccountNumber', icon: Building, placeholder: 'EGxx xxxx xxxx' },
                  { label: t.paymentInfo.bankName, name: 'bankName', icon: Building, placeholder: 'Bank Name' }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{field.label}</label>
                    <div className="relative">
                      <field.icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        name={field.name}
                        value={workerPaymentInfo[field.name] || ''}
                        onChange={handlePaymentInfoChange}
                        disabled={!isEditingPaymentInfo}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors ${
                          isEditingPaymentInfo 
                            ? 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800' 
                            : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.paymentInfo.accountHolder}</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="accountHolderName"
                      value={workerPaymentInfo.accountHolderName || ''}
                      onChange={handlePaymentInfoChange}
                      disabled={!isEditingPaymentInfo}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors ${
                        isEditingPaymentInfo 
                          ? 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800' 
                          : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                      placeholder="Full Name as in Bank"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.paymentHistory.title}</h3>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder={t.paymentHistory.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  />
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    <option value="all">{t.filters.all}</option>
                    <option value="completed">{t.filters.completed}</option>
                    <option value="pending">{t.filters.pending}</option>
                    <option value="failed">{t.filters.failed}</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={32} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t.noPayments}</h3>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm max-w-sm mx-auto">{t.noPaymentsDesc}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.id}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.employer}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.amount}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.date}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:bg-gray-900/50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 font-mono">{payment.id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{payment.employer?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">{payment.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {t.status[payment.status] || payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Showing {filteredPayments.length} results
            </div>
          </div>         </div>
    </DashboardLayout>
  );
};

export default WorkerPayment;