// src/pages/WorkerPayment.jsx - RED AND WHITE THEME WITH WORKING NOTIFICATIONS AND FIXED TOGGLES
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../components/layout/DashboardContext';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import hireService from '../services/hireService';
import workerEarningService from '../services/workerEarningService';
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
  Info,
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

  const [ledgerRecords, setLedgerRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

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
  const [earningsSummary, setEarningsSummary] = useState({
    pendingContractValue: 0,
    earnedBalance: 0,
    paidTotal: 0,
    onHoldAmount: 0
  });
  const [activeHires, setActiveHires] = useState(0);

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
        pendingContract: 'Pending Contract Value',
        confirmedEarnings: 'Confirmed Earnings',
        paidThroughHomelyServ: 'Paid Through HomelyServ',
        activeHires: 'Active Hires'
      },
      notice: {
        title: 'Salary is paid off-platform between you and the Employer',
        body: 'HomelyServ does not process your salary from Employers. Salary payments are arranged directly between you and the Employer. This page tracks contract and earning status recorded by HomelyServ.'
      },
      paymentInfo: {
        title: 'Payout Details (for future supported payouts)',
        walletNumber: 'Wallet Number',
        instapayNumber: 'InstaPay Number',
        bankAccount: 'Bank Account Number',
        bankName: 'Bank Name',
        accountHolder: 'Account Holder Name',
        edit: 'Edit Payout Details',
        save: 'Save Changes',
        cancel: 'Cancel',
        saved: 'Payout details updated successfully!',
        saveError: 'Failed to save payout details. Please try again.',
        loadError: 'Failed to load payout details.',
        hint: 'Saving your payout details does not transfer money. Payouts are not offered yet.'
      },
      paymentHistory: {
        title: 'Earnings & Contract Ledger',
        id: 'Ledger ID',
        hireId: 'Hire ID',
        amount: 'Amount',
        date: 'Date',
        status: 'Status',
        noResults: 'No ledger entries found',
        searchPlaceholder: 'Search ledger...'
      },
      status: {
        PENDING: 'Pending / Contract Active',
        AWAITING_CONFIRMATION: 'Awaiting Employer Confirmation',
        EARNED: 'Confirmed Earned',
        PAID: 'Paid',
        ON_HOLD: 'On Hold',
        DISPUTED: 'Disputed',
        CANCELLED: 'Cancelled'
      },
      filters: {
        all: 'All Entries',
        PENDING: 'Pending / Contract Active',
        AWAITING_CONFIRMATION: 'Awaiting Employer Confirmation',
        EARNED: 'Confirmed Earned',
        PAID: 'Paid',
        ON_HOLD: 'On Hold',
        DISPUTED: 'Disputed',
        CANCELLED: 'Cancelled'
      },
      submit: {
        button: 'Submit Period',
        confirmTitle: 'Submit this period for confirmation?',
        confirmBody: 'This tells your employer the work period is completed and requests their confirmation. It does NOT confirm salary payment.',
        confirm: 'Submit for Confirmation',
        cancel: 'Cancel',
        submitting: 'Submitting...',
        success: 'Work period submitted for employer confirmation',
        error: 'Failed to submit work period. Please try again.',
        alreadySubmitted: 'This period is already awaiting confirmation'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading earnings data...',
      noPayments: 'No ledger entries yet',
      noPaymentsDesc: 'Your contract ledger will appear here once your hires are activated.',
      refresh: 'Refresh',
      premiumBadge: 'Premium Verified',
      getPremium: 'Get Premium',
      noNotifications: 'No new notifications'
    },
    ar: {
      title: 'المدفوعات',
      subtitle: 'إدارة مدفوعاتك ومعلومات الدفع',
      stats: {
        pendingContract: 'قيمة العقد المعلقة',
        confirmedEarnings: 'أرباح مؤكدة',
        paidThroughHomelyServ: 'مدفوع عبر HomelyServ',
        activeHires: 'عقود نشطة'
      },
      notice: {
        title: 'الراتب يُدفع مباشرة بينك وبين صاحب العمل',
        body: 'لا تتعامل منصة HomelyServ حاليًا مع دفع رواتب الموظفين من أصحاب العمل. يتم ترتيب مدفوعات الراتب مباشرة بينك وبين صاحب العمل. تعرض هذه الصفحة حالة العقد والأرباح التي تسجلها المنصة.'
      },
      paymentInfo: {
        title: 'تفاصيل الدفع (للمدفوعات المستقبلية)',
        walletNumber: 'رقم المحفظة',
        instapayNumber: 'رقم InstaPay',
        bankAccount: 'رقم الحساب البنكي',
        bankName: 'اسم البنك',
        accountHolder: 'اسم صاحب الحساب',
        edit: 'تعديل تفاصيل الدفع',
        save: 'حفظ التغييرات',
        cancel: 'إلغاء',
        saved: 'تم تحديث تفاصيل الدفع بنجاح!',
        saveError: 'تعذر حفظ تفاصيل الدفع. حاول مرة أخرى.',
        loadError: 'تعذر تحميل تفاصيل الدفع.',
        hint: 'حفظ تفاصيل الدفع لا يعني تحويل الأموال. المدفوعات غير متاحة بعد.'
      },
      paymentHistory: {
        title: 'سجل الأرباح والعقود',
        id: 'معرف السجل',
        hireId: 'معرف العقد',
        amount: 'المبلغ',
        date: 'التاريخ',
        status: 'الحالة',
        noResults: 'لا توجد سجلات',
        searchPlaceholder: 'ابحث في السجل...'
      },
      status: {
        PENDING: 'معلق / العقد نشط',
        AWAITING_CONFIRMATION: 'في انتظار تأكيد صاحب العمل',
        EARNED: 'أرباح مؤكدة',
        PAID: 'مدفوع',
        ON_HOLD: 'قيد الانتظار',
        DISPUTED: 'متنازع عليه',
        CANCELLED: 'ملغى'
      },
      filters: {
        all: 'جميع السجلات',
        PENDING: 'معلق / العقد نشط',
        AWAITING_CONFIRMATION: 'في انتظار تأكيد صاحب العمل',
        EARNED: 'أرباح مؤكدة',
        PAID: 'مدفوع',
        ON_HOLD: 'قيد الانتظار',
        DISPUTED: 'متنازع عليه',
        CANCELLED: 'ملغى'
      },
      submit: {
        button: 'إرسال الفترة',
        confirmTitle: 'إرسال هذه الفترة للموافقة؟',
        confirmBody: 'هذا يخبر صاحب العمل أن فترة العمل قد اكتملت ويطلب موافقته. لا يؤكد استلام الراتب.',
        confirm: 'إرسال للموافقة',
        cancel: 'إلغاء',
        submitting: 'جاري الإرسال...',
        success: 'تم إرسال فترة العمل لتأكيد صاحب العمل',
        error: 'فشل إرسال فترة العمل. حاول مرة أخرى.',
        alreadySubmitted: 'هذه الفترة في انتظار التأكيد بالفعل'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل بيانات الأرباح...',
      noPayments: 'لا يوجد سجل بعد',
      noPaymentsDesc: 'سيظهر سجل عقودك هنا بمجرد تفعيل عقودك.',
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
  const loadEarningsData = async () => {
    if (!authUser) return;
    setLoading(true);

    try {
      // Real ledger from the backend. Phase 1 only contains PENDING records
      // (contractual amounts), so earned/paid totals are correctly 0 (or 0
      // until Phase 2/3 events exist). We never fabricate balances.
      const response = await api.get('/api/worker/earnings');
      const data = response.data || {};

      const summary = data.summary || {
        pendingContractValue: 0,
        earnedBalance: 0,
        paidTotal: 0,
        onHoldAmount: 0
      };
      const records = Array.isArray(data.records) ? data.records : [];

      setEarningsSummary(summary);
      setLedgerRecords(records);
      setFilteredRecords(records);

      // Real active-hire count (for the "Active Hires" card).
      let activeCount = 0;
      try {
        const allHiresData = await hireService.getMyHires();
        const myHires = Array.isArray(allHiresData) ? allHiresData : [];
        activeCount = myHires.filter(
          h => h.status === 'active' || h.status === 'completed'
        ).length;
      } catch (hireError) {
        console.warn('Could not load active hire count:', hireError.message);
      }
      setActiveHires(activeCount);

      console.log(`✅ Loaded ${records.length} ledger entries for worker`);
    } catch (error) {
      console.error('Error loading earnings ledger:', error);
    } finally {
      setLoading(false);
    }
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
      loadEarningsData();
      loadPayoutDetails();
    }
  }, [authUser]);

  useEffect(() => {
    let filtered = ledgerRecords;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        String(r.id || '').toLowerCase().includes(searchLower) ||
        String(r.hireId || '').toLowerCase().includes(searchLower) ||
        String(r.idempotencyKey || '').toLowerCase().includes(searchLower)
      );
    }
    setFilteredRecords(filtered);
  }, [ledgerRecords, statusFilter, searchTerm]);

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
    loadEarningsData();
  };

  // Worker submits a PENDING period for employer confirmation.
  const handleSubmitPeriod = async (record) => {
    if (!record || submittingId) return;

    if (!window.confirm(`${t.submit.confirmTitle}\n\n${t.submit.confirmBody}`)) {
      return;
    }

    setSubmittingId(record.id);
    try {
      const data = await workerEarningService.submitWorkerEarning(record.id);
      if (data && data.success) {
        await loadEarningsData();
        alert(t.submit.success);
      } else {
        alert(data?.message || t.submit.error);
      }
    } catch (error) {
      console.error('Error submitting period:', error);
      const message =
        error?.response?.data?.message === 'This period is already awaiting employer confirmation'
          ? t.submit.alreadySubmitted
          : t.submit.error;
      alert(message);
      await loadEarningsData();
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      AWAITING_CONFIRMATION: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      EARNED: 'bg-green-100 text-green-800 border border-green-200',
      PAID: 'bg-blue-100 text-blue-800 border border-blue-200',
      ON_HOLD: 'bg-amber-100 text-amber-800 border border-amber-200',
      DISPUTED: 'bg-red-100 text-red-800 border border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} />;
      case 'AWAITING_CONFIRMATION': return <Clock size={14} />;
      case 'EARNED': return <CheckCircle size={14} />;
      case 'PAID': return <CheckCircle size={14} />;
      case 'ON_HOLD': return <Clock size={14} />;
      case 'DISPUTED': return <AlertTriangle size={14} />;
      case 'CANCELLED': return <X size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const formatCurrency = (amount) => `EGP ${amount?.toLocaleString() || 0}`;

  const stats = {
    pendingContractValue: earningsSummary.pendingContractValue || 0,
    confirmedEarnings: earningsSummary.earnedBalance || 0,
    paidThroughHomelyServ: earningsSummary.paidTotal || 0,
    activeHires: activeHires || 0
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

          {/* Explanatory Notice - salary is off-platform */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex gap-3">
            <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t.notice.title}</p>
              <p className="text-sm text-blue-700/90 dark:text-blue-200/80 mt-0.5">{t.notice.body}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: t.stats.pendingContract, value: formatCurrency(stats.pendingContractValue), icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
              { label: t.stats.confirmedEarnings, value: formatCurrency(stats.confirmedEarnings), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
              { label: t.stats.paidThroughHomelyServ, value: formatCurrency(stats.paidThroughHomelyServ), icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
              { label: t.stats.activeHires, value: stats.activeHires, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' }
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

            <div className="px-6 py-3 bg-blue-50/60 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Info size={14} className="flex-shrink-0" />
              {t.paymentInfo.hint}
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

          {/* Earnings & Contract Ledger Section */}
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
                    <option value="PENDING">{t.filters.PENDING}</option>
                    <option value="AWAITING_CONFIRMATION">{t.filters.AWAITING_CONFIRMATION}</option>
                    <option value="EARNED">{t.filters.EARNED}</option>
                    <option value="PAID">{t.filters.PAID}</option>
                    <option value="ON_HOLD">{t.filters.ON_HOLD}</option>
                    <option value="DISPUTED">{t.filters.DISPUTED}</option>
                    <option value="CANCELLED">{t.filters.CANCELLED}</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
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
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.hireId}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.amount}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.date}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.paymentHistory.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:bg-gray-900/50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 font-mono">
                          {(record.idempotencyKey || record.id || '').replace('worker_earning_initial_', 'EL-')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {record.hireId || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(record.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(record.periodStart || record.createdAt || Date.now()).toLocaleDateString(
                            dashboard.language === 'ar' ? 'ar-EG' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              {t.status[record.status] || record.status}
                            </span>
                            {record.status === 'PENDING' && (
                              <button
                                onClick={() => handleSubmitPeriod(record)}
                                disabled={submittingId !== null}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                              >
                                {submittingId === record.id ? (
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle size={12} />
                                )}
                                {submittingId === record.id ? t.submit.submitting : t.submit.button}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Showing {filteredRecords.length} results
            </div>
          </div>         </div>
    </DashboardLayout>
  );
};

export default WorkerPayment;