// frontend/src/pages/TeacherAccounts.jsx
// ============================================================
// TEACHER ACCOUNTS & BOOKKEEPING (Teacher role — Premium only)
// ============================================================
// Internal bookkeeping for Teacher Income and Expenses.
// - Income (RECEIVED = collected, PENDING = outstanding fees)
// - Expenses (Rent, teaching materials, books, equipment, utilities, other)
// - Multi-currency isolated summaries (never sum different currencies)
// - Optional linking to TeacherStudent, TeacherGroup, and TeacherLesson
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import { isUserPremium } from '../utils/subscriptionService';
import EmployeeSalaryList from '../components/accounts/EmployeeSalaryList';
import api from '../utils/api';
import { downloadCsv } from '../utils/csvExport';
import {
  formatCurrencyAmount,
  SUPPORTED_CURRENCIES,
  LEGACY_DEFAULT_CURRENCY,
  normalizeCurrencyCode
} from '../utils/currencyPresentation';
import {
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  Crown,
  Sparkles,
  ArrowRight,
  Download,
  X,
  FileText
} from 'lucide-react';
import TeacherFeeDocumentModal from '../components/teacher/TeacherFeeDocumentModal';

const INPUT_CLS =
  'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors';
const LABEL_CLS = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5';
const PRIMARY_BTN =
  'inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors shadow-sm';
const GHOST_BTN =
  'rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';

const RANGE_PRESETS = ['all', 'today', 'thisMonth', 'lastMonth', 'thisYear', 'custom'];

const TEACHER_INCOME_SOURCES = [
  'LESSON_ONE_ON_ONE',
  'LESSON_GROUP',
  'COURSE_FEE',
  'OTHER'
];
const TEACHER_INCOME_STATUSES = ['RECEIVED', 'PENDING'];
const TEACHER_EXPENSE_CATEGORIES = [
  'RENT',
  'MATERIALS',
  'BOOKS',
  'EQUIPMENT',
  'UTILITIES',
  'OTHER'
];

const toInputDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toInputDateUTC = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const resolvePresetRange = (preset) => {
  const now = new Date();
  const today = toInputDate(now);
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'thisMonth') {
    const pad = (n) => String(n).padStart(2, '0');
    return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today };
  }
  if (preset === 'lastMonth') {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toInputDate(prevMonthDate), to: toInputDate(lastDayPrevMonth) };
  }
  if (preset === 'thisYear') {
    return { from: `${now.getFullYear()}-01-01`, to: today };
  }
  return { from: '', to: '' };
};

const TeacherAccounts = () => {
  const { t, i18n } = useTranslation();
  const authUser = useAuthStore((state) => state.user);
  const dashboard = useDashboard();
  const userId = authUser?.id || authUser?._id;

  const isPremium =
    (dashboard.premiumStatus?.known === true && dashboard.premiumStatus?.isPremium === true) ||
    (userId ? isUserPremium(userId) : false) ||
    authUser?.isPremium === true;

  // Active view tab
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'income' | 'expenses'

  // Date range
  const [rangePreset, setRangePreset] = useState('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Primary teacher pricing currency
  const [defaultCurrency, setDefaultCurrency] = useState('EGP');

  // Ledger state
  const [summary, setSummary] = useState(null);
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dropdown reference options
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [lessons, setLessons] = useState([]);

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    currency: 'EGP',
    incomeDate: toInputDate(new Date()),
    status: 'RECEIVED',
    source: 'LESSON_ONE_ON_ONE',
    studentId: '',
    groupId: '',
    lessonId: '',
    notes: ''
  });
  const [savingIncome, setSavingIncome] = useState(false);
  const [incomeError, setIncomeError] = useState('');

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    category: 'MATERIALS',
    description: '',
    amount: '',
    currency: 'EGP',
    expenseDate: toInputDate(new Date()),
    notes: ''
  });
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  const [deletingRecord, setDeletingRecord] = useState(null); // { type: 'income' | 'expense', id: '' }
  const [deleting, setDeleting] = useState(false);

  // Document Modal state (Invoice / Receipt)
  const [viewingDocument, setViewingDocument] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  const handleOpenDocument = async (incomeItem) => {
    setLoadingDocument(true);
    setErrorMessage('');
    try {
      const res = await api.get(`/api/teachers/accounts/income/${incomeItem.id}/document`);
      if (res?.data?.document) {
        setViewingDocument(res.data.document);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load printable document.');
    } finally {
      setLoadingDocument(false);
    }
  };

  // Load teacher profile default currency
  useEffect(() => {
    if (!authUser?.id) return;
    (async () => {
      try {
        const res = await api.get('/api/teachers/profile');
        if (res.data?.success && res.data.profile?.pricingCurrency) {
          setDefaultCurrency(res.data.profile.pricingCurrency);
        }
      } catch (err) {
        // Fallback default remains EGP
      }
    })();
  }, [authUser?.id]);

  // Load dropdown lists (students, groups, lessons)
  useEffect(() => {
    if (!isPremium) return;
    (async () => {
      try {
        const [stRes, grRes, lsRes] = await Promise.allSettled([
          api.get('/api/teachers/students?status=ACTIVE'),
          api.get('/api/teachers/groups?status=ACTIVE'),
          api.get('/api/teachers/lessons')
        ]);
        if (stRes.status === 'fulfilled' && stRes.value?.data?.students) {
          setStudents(stRes.value.data.students);
        }
        if (grRes.status === 'fulfilled' && grRes.value?.data?.groups) {
          setGroups(grRes.value.data.groups);
        }
        if (lsRes.status === 'fulfilled' && lsRes.value?.data?.lessons) {
          setLessons(lsRes.value.data.lessons);
        }
      } catch (err) {
        console.error('Failed to load accounts reference options:', err);
      }
    })();
  }, [isPremium]);

  // Resolve date range query
  const rangeParams = useMemo(() => {
    if (rangePreset !== 'custom') {
      const { from, to } = resolvePresetRange(rangePreset);
      if (!from && !to) return {};
      return { from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` };
    }
    if (customFrom && customTo) {
      return { from: `${customFrom}T00:00:00.000Z`, to: `${customTo}T23:59:59.999Z` };
    }
    return {};
  }, [rangePreset, customFrom, customTo]);

  // Fetch accounts data
  const loadAccountsData = useCallback(async () => {
    if (!isPremium) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const [sumRes, incRes, expRes] = await Promise.all([
        api.get('/api/teachers/accounts/summary', { params: rangeParams }),
        api.get('/api/teachers/accounts/income', { params: rangeParams }),
        api.get('/api/teachers/accounts/expenses', { params: rangeParams })
      ]);

      setSummary(sumRes.data?.summary || null);
      setIncomeList(Array.isArray(incRes.data?.income) ? incRes.data.income : []);
      setExpenseList(Array.isArray(expRes.data?.expenses) ? expRes.data.expenses : []);
    } catch (err) {
      console.error('Error fetching teacher accounts:', err);
      setErrorMessage(t('teacherAccounts.messages.loadError') || 'Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  }, [isPremium, rangeParams, t]);

  useEffect(() => {
    loadAccountsData();
  }, [loadAccountsData]);

  // Income Modal handlers
  const handleOpenAddIncome = () => {
    setEditingIncome(null);
    setIncomeForm({
      amount: '',
      currency: defaultCurrency || 'EGP',
      incomeDate: toInputDate(new Date()),
      status: 'RECEIVED',
      source: 'LESSON_ONE_ON_ONE',
      studentId: '',
      groupId: '',
      lessonId: '',
      notes: ''
    });
    setIncomeError('');
    setIsIncomeModalOpen(true);
  };

  const handleOpenEditIncome = (item) => {
    setEditingIncome(item);
    setIncomeForm({
      amount: String(item.amount),
      currency: item.currency || defaultCurrency || 'EGP',
      incomeDate: toInputDateUTC(item.incomeDate) || toInputDate(new Date()),
      status: item.status || 'RECEIVED',
      source: item.source || 'OTHER',
      studentId: item.studentId || '',
      groupId: item.groupId || '',
      lessonId: item.lessonId || '',
      notes: item.notes || ''
    });
    setIncomeError('');
    setIsIncomeModalOpen(true);
  };

  const handleSaveIncome = async (e) => {
    e.preventDefault();
    setSavingIncome(true);
    setIncomeError('');
    try {
      const payload = {
        amount: Number(incomeForm.amount),
        currency: incomeForm.currency,
        incomeDate: new Date(incomeForm.incomeDate).toISOString(),
        status: incomeForm.status,
        source: incomeForm.source,
        studentId: incomeForm.studentId || null,
        groupId: incomeForm.groupId || null,
        lessonId: incomeForm.lessonId || null,
        notes: incomeForm.notes
      };

      if (editingIncome) {
        await api.put(`/api/teachers/accounts/income/${editingIncome.id}`, payload);
      } else {
        await api.post('/api/teachers/accounts/income', payload);
      }

      setIsIncomeModalOpen(false);
      setSuccessMessage(t('teacherAccounts.messages.saveSuccess') || 'Record saved successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadAccountsData();
    } catch (err) {
      setIncomeError(err.response?.data?.message || t('teacherAccounts.messages.saveError') || 'Failed to save record.');
    } finally {
      setSavingIncome(false);
    }
  };

  // Expense Modal handlers
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: 'MATERIALS',
      description: '',
      amount: '',
      currency: defaultCurrency || 'EGP',
      expenseDate: toInputDate(new Date()),
      notes: ''
    });
    setExpenseError('');
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (item) => {
    setEditingExpense(item);
    setExpenseForm({
      category: item.category || 'OTHER',
      description: item.description || '',
      amount: String(item.amount),
      currency: item.currency || defaultCurrency || 'EGP',
      expenseDate: toInputDateUTC(item.expenseDate) || toInputDate(new Date()),
      notes: item.notes || ''
    });
    setExpenseError('');
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setSavingExpense(true);
    setExpenseError('');
    try {
      const payload = {
        category: expenseForm.category,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        currency: expenseForm.currency,
        expenseDate: new Date(expenseForm.expenseDate).toISOString(),
        notes: expenseForm.notes
      };

      if (editingExpense) {
        await api.put(`/api/teachers/accounts/expenses/${editingExpense.id}`, payload);
      } else {
        await api.post('/api/teachers/accounts/expenses', payload);
      }

      setIsExpenseModalOpen(false);
      setSuccessMessage(t('teacherAccounts.messages.saveSuccess') || 'Record saved successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadAccountsData();
    } catch (err) {
      setExpenseError(err.response?.data?.message || t('teacherAccounts.messages.saveError') || 'Failed to save record.');
    } finally {
      setSavingExpense(false);
    }
  };

  // Delete handlers
  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setDeleting(true);
    try {
      if (deletingRecord.type === 'income') {
        await api.delete(`/api/teachers/accounts/income/${deletingRecord.id}`);
      } else {
        await api.delete(`/api/teachers/accounts/expenses/${deletingRecord.id}`);
      }
      setDeletingRecord(null);
      setSuccessMessage(t('teacherAccounts.messages.deleteSuccess') || 'Record deleted successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadAccountsData();
    } catch (err) {
      setErrorMessage(t('teacherAccounts.messages.deleteError') || 'Failed to delete record.');
      setDeletingRecord(null);
    } finally {
      setDeleting(false);
    }
  };

  // Format currency helpers
  const availableCurrencies = useMemo(() => {
    return [defaultCurrency, ...SUPPORTED_CURRENCIES.filter((c) => c !== defaultCurrency)];
  }, [defaultCurrency]);

  // CSV Export handler
  const handleExportAccountsCsv = () => {
    const rangeSlug = rangePreset === 'custom' && customFrom && customTo
      ? `${customFrom}_to_${customTo}`
      : rangePreset;

    if (activeTab === 'expenses') {
      const headers = [
        t('teacherAccounts.csv.date') || 'Date',
        t('teacherAccounts.csv.category') || 'Category',
        t('teacherAccounts.csv.description') || 'Description',
        t('teacherAccounts.csv.amount') || 'Amount',
        t('teacherAccounts.csv.currency') || 'Currency',
        t('teacherAccounts.csv.notes') || 'Notes'
      ];
      const rows = expenseList.map((e) => [
        e.expenseDate ? new Date(e.expenseDate).toISOString().split('T')[0] : '',
        e.category || '',
        e.description || '',
        e.amount,
        e.currency || 'EGP',
        e.notes || ''
      ]);
      downloadCsv(`teacher-expenses-${rangeSlug}`, headers, rows);
    } else if (activeTab === 'summary') {
      const headers = [
        t('teacherAccounts.csv.currency') || 'Currency',
        t('teacherAccounts.csv.collectedIncome') || 'Collected Income',
        t('teacherAccounts.csv.outstandingFees') || 'Outstanding Fees',
        t('teacherAccounts.csv.directExpenses') || 'Direct Expenses',
        t('teacherAccounts.csv.salaryExpenses') || 'Salary Expenses',
        t('teacherAccounts.csv.netProfit') || 'Net Profit'
      ];
      const rows = summaryCurrencies.map((cur) => {
        const rec = Number(summary?.receivedIncome?.[cur] || 0);
        const pend = Number(summary?.pendingIncome?.[cur] || 0);
        const exp = Number(summary?.totalExpenses?.[cur] || 0);
        const sal = Number(summary?.salaryExpense?.[cur] || 0);
        const net = rec - (exp + sal);
        return [cur, rec, pend, exp, sal, net];
      });
      downloadCsv(`teacher-financial-summary-${rangeSlug}`, headers, rows);
    } else {
      // Default: Income tab or all income records
      const headers = [
        t('teacherAccounts.csv.date') || 'Date',
        t('teacherAccounts.csv.amount') || 'Amount',
        t('teacherAccounts.csv.currency') || 'Currency',
        t('teacherAccounts.csv.status') || 'Status',
        t('teacherAccounts.csv.source') || 'Source',
        t('teacherAccounts.csv.studentOrGroup') || 'Student / Group',
        t('teacherAccounts.csv.notes') || 'Notes'
      ];
      const rows = incomeList.map((i) => [
        i.incomeDate ? new Date(i.incomeDate).toISOString().split('T')[0] : '',
        i.amount,
        i.currency || 'EGP',
        i.status === 'RECEIVED' ? 'Collected' : 'Pending / Outstanding',
        i.source || '',
        i.student?.fullName || i.group?.name || '',
        i.notes || ''
      ]);
      downloadCsv(`teacher-income-fees-${rangeSlug}`, headers, rows);
    }
  };

  const summaryCurrencies = useMemo(() => {
    if (!summary) return [];
    const keys = new Set([
      ...Object.keys(summary.receivedIncome || {}),
      ...Object.keys(summary.pendingIncome || {}),
      ...Object.keys(summary.totalExpenses || {}),
      ...Object.keys(summary.salaryExpense || {})
    ]);
    return [...keys].sort();
  }, [summary]);

  return (
    <DashboardLayout requiredRole="TEACHER">
      <DashboardHeader title={t('teacherAccounts.headerTitle') || 'Accounts & Bookkeeping'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* ============================================================ */}
        {/* PREMIUM GATING BANNER (When teacher is not premium)           */}
        {/* ============================================================ */}
        {!isPremium ? (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-semibold text-xs tracking-wider uppercase">
              <Crown size={16} />
              {t('teacherAccounts.premiumBadge') || 'Premium Feature'}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {t('teacherAccounts.premiumBannerTitle') || 'Teacher Accounts is a Premium Feature'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                {t('teacherAccounts.premiumBannerSubtitle') ||
                  'Track your lesson fee income, pending student payments, classroom expenses, and net profit with multi-currency bookkeeping.'}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <Sparkles size={16} />
                {t('teacherAccounts.upgradeBtn') || 'Upgrade to Teacher Premium'}
                <ArrowRight size={16} className="rtl:rotate-180" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Success and Error alerts */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-sm text-emerald-700 dark:text-emerald-300">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Header controls: Range Filter + Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'summary'
                      ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('teacherAccounts.tabs.summary') || 'Financial Summary'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('income')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'income'
                      ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('teacherAccounts.tabs.income') || 'Income & Fees'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('expenses')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'expenses'
                      ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('teacherAccounts.tabs.expenses') || 'Expenses'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('employeeSalaries')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'employeeSalaries'
                      ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('teacherAccounts.tabs.employeeSalaries') || 'Employee Salaries'}
                </button>
              </div>

              {/* Date range controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={14} />
                  <select
                    value={rangePreset}
                    onChange={(e) => setRangePreset(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="thisMonth">{t('teacherAccounts.dateRange.thisMonth') || 'This Month'}</option>
                    <option value="today">{t('teacherAccounts.dateRange.today') || 'Today'}</option>
                    <option value="lastMonth">{t('teacherAccounts.dateRange.lastMonth') || 'Last Month'}</option>
                    <option value="thisYear">{t('teacherAccounts.dateRange.thisYear') || 'This Year'}</option>
                    <option value="all">{t('teacherAccounts.dateRange.all') || 'All Time'}</option>
                    <option value="custom">{t('teacherAccounts.dateRange.custom') || 'Custom Range'}</option>
                  </select>
                </div>

                {rangePreset === 'custom' && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white"
                    />
                    <span className="text-gray-400 text-xs">—</span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExportAccountsCsv}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  title={t('teacherAccounts.csv.exportBtn') || 'Export CSV'}
                >
                  <Download size={14} className="text-red-600 dark:text-red-400" />
                  <span>{t('teacherAccounts.csv.exportBtn') || 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* Loading spinner */}
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading accounts...</p>
              </div>
            ) : (
              <>
                {/* ============================================================ */}
                {/* TAB 1: FINANCIAL SUMMARY                                      */}
                {/* ============================================================ */}
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    {summaryCurrencies.length === 0 ? (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 text-sm">
                        {t('teacherAccounts.summary.noData') || 'No financial records found for the selected period.'}
                      </div>
                    ) : (
                      summaryCurrencies.map((cur) => {
                        const rec = Number(summary?.receivedIncome?.[cur] || 0);
                        const pend = Number(summary?.pendingIncome?.[cur] || 0);
                        const exp = Number(summary?.totalExpenses?.[cur] || 0);
                        const net = Number(summary?.netProfit?.[cur] || 0);

                        return (
                          <div
                            key={cur}
                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Wallet size={16} className="text-red-600" />
                                {t('teacherAccounts.summary.currencyBucket', { currency: cur }) || `Currency: ${cur}`}
                              </h4>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {/* Received income */}
                              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                  {t('teacherAccounts.summary.receivedIncome') || 'Collected Income'}
                                </p>
                                <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                                  {formatCurrencyAmount(rec, cur)}
                                </p>
                              </div>

                              {/* Pending fees */}
                              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                  {t('teacherAccounts.summary.pendingIncome') || 'Outstanding Fees'}
                                </p>
                                <p className="text-lg font-bold text-amber-800 dark:text-amber-300 mt-1">
                                  {formatCurrencyAmount(pend, cur)}
                                </p>
                              </div>

                              {/* Expenses */}
                              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                                  {t('teacherAccounts.summary.totalExpenses') || 'Total Expenses'}
                                </p>
                                <p className="text-lg font-bold text-rose-800 dark:text-rose-300 mt-1">
                                  {formatCurrencyAmount(exp, cur)}
                                </p>
                              </div>

                              {/* Net Profit */}
                              <div className={`p-4 rounded-xl border ${
                                net >= 0
                                  ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
                                  : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
                              }`}>
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                  {t('teacherAccounts.summary.netProfit') || 'Net Profit'}
                                </p>
                                <p className={`text-lg font-bold mt-1 ${
                                  net >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-400'
                                }`}>
                                  {formatCurrencyAmount(net, cur)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ============================================================ */}
                {/* TAB 2: INCOME & FEES LIST                                     */}
                {/* ============================================================ */}
                {activeTab === 'income' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t('teacherAccounts.income.title') || 'Income & Lesson Fees'}
                      </h3>
                      <button
                        type="button"
                        onClick={handleOpenAddIncome}
                        className={PRIMARY_BTN}
                      >
                        <Plus size={16} />
                        {t('teacherAccounts.income.addBtn') || 'Record Income'}
                      </button>
                    </div>

                    {incomeList.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">
                        <Wallet className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
                          {t('teacherAccounts.income.empty') || 'No income records found.'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {t('teacherAccounts.income.emptyDesc') || 'Record collected lesson fees or outstanding student dues to start tracking.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs">
                          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-500">
                            <tr>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.income.tableDate') || 'Date'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.income.tableAmount') || 'Amount'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.income.tableStatus') || 'Status'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.income.tableSource') || 'Source'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.income.tableStudentGroup') || 'Student / Group'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.income.tableNotes') || 'Notes'}</th>
                              <th className="py-3 px-4 text-end font-semibold">{t('teacherAccounts.income.tableActions') || 'Actions'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {incomeList.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="py-3 px-4 whitespace-nowrap text-gray-900 dark:text-white">
                                  {formatDisplayDate(item.incomeDate)}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                                  {formatCurrencyAmount(item.amount, item.currency)}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    item.status === 'RECEIVED'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                  }`}>
                                    {item.status === 'RECEIVED'
                                      ? t('teacherAccounts.income.statusReceived') || 'Collected'
                                      : t('teacherAccounts.income.statusPending') || 'Pending / Due'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                  {item.source === 'LESSON_ONE_ON_ONE' && (t('teacherAccounts.income.sourceOneOnOne') || '1-on-1 Lesson')}
                                  {item.source === 'LESSON_GROUP' && (t('teacherAccounts.income.sourceGroup') || 'Group Lesson')}
                                  {item.source === 'COURSE_FEE' && (t('teacherAccounts.income.sourceCourseFee') || 'Course Fee')}
                                  {item.source === 'OTHER' && (t('teacherAccounts.income.sourceOther') || 'Other')}
                                </td>
                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                  {item.student?.fullName || item.group?.name || '—'}
                                </td>
                                <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">
                                  {item.notes || '—'}
                                </td>
                                <td className="py-3 px-4 text-end whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDocument(item)}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        item.status === 'PENDING'
                                          ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                          : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                      }`}
                                      title={item.status === 'PENDING' ? 'Print / View Invoice' : 'Print / View Receipt'}
                                    >
                                      <FileText size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditIncome(item)}
                                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                      title={t('teacherAccounts.income.editBtn') || 'Edit'}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingRecord({ type: 'income', id: item.id })}
                                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                      title={t('teacherAccounts.income.deleteBtn') || 'Delete'}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================ */}
                {/* TAB 3: EXPENSES LIST                                          */}
                {/* ============================================================ */}
                {activeTab === 'expenses' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t('teacherAccounts.expenses.title') || 'Teaching Expenses'}
                      </h3>
                      <button
                        type="button"
                        onClick={handleOpenAddExpense}
                        className={PRIMARY_BTN}
                      >
                        <Plus size={16} />
                        {t('teacherAccounts.expenses.addBtn') || 'Record Expense'}
                      </button>
                    </div>

                    {expenseList.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">
                        <Receipt className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
                          {t('teacherAccounts.expenses.empty') || 'No expense records found.'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {t('teacherAccounts.expenses.emptyDesc') || 'Track classroom supplies, books, rent, and other teaching expenses.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs">
                          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-500">
                            <tr>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.expenses.tableDate') || 'Date'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.expenses.tableCategory') || 'Category'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.expenses.tableDescription') || 'Description'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.expenses.tableAmount') || 'Amount'}</th>
                              <th className="py-3 px-4 text-start font-semibold">{t('teacherAccounts.expenses.tableNotes') || 'Notes'}</th>
                              <th className="py-3 px-4 text-end font-semibold">{t('teacherAccounts.expenses.tableActions') || 'Actions'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {expenseList.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="py-3 px-4 whitespace-nowrap text-gray-900 dark:text-white">
                                  {formatDisplayDate(item.expenseDate)}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                  {item.description}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                                  {formatCurrencyAmount(item.amount, item.currency)}
                                </td>
                                <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">
                                  {item.notes || '—'}
                                </td>
                                <td className="py-3 px-4 text-end whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditExpense(item)}
                                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                      title={t('teacherAccounts.expenses.editBtn') || 'Edit'}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingRecord({ type: 'expense', id: item.id })}
                                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                      title={t('teacherAccounts.expenses.deleteBtn') || 'Delete'}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================ */}
                {/* TAB 4: EMPLOYEE SALARIES (payroll)                            */}
                {/* ============================================================ */}
                {/* Dedicated payroll view for the salary paid to hired Workers.
                    The salary shown is ALWAYS Employee.salary - never the 15%
                    HomelyServ recruitment commission, which stays recorded as an
                    Expense in the Expenses tab above. Ownership is enforced
                    server-side by the existing GET /api/employees scope. */}
                {activeTab === 'employeeSalaries' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <EmployeeSalaryList
                        copy={{
                          title: t('teacherAccounts.employeeSalaries.title'),
                          subtitle: t('teacherAccounts.employeeSalaries.subtitle'),
                          worker: t('teacherAccounts.employeeSalaries.worker'),
                          status: t('teacherAccounts.employeeSalaries.status'),
                          salary: t('teacherAccounts.employeeSalaries.salary'),
                          startDate: t('teacherAccounts.employeeSalaries.startDate'),
                          empty: t('teacherAccounts.employeeSalaries.empty'),
                          loading: t('teacherAccounts.employeeSalaries.loading'),
                          loadError: t('teacherAccounts.employeeSalaries.loadError'),
                          emptyDesc: t('teacherAccounts.employeeSalaries.emptyDesc'),
                          note: t('teacherAccounts.employeeSalaries.note'),
                          statusActive: t('teacherAccounts.employeeSalaries.statusActive'),
                          statusInactive: t('teacherAccounts.employeeSalaries.statusInactive'),
                          statusTerminated:
                            t('teacherAccounts.employeeSalaries.statusTerminated'),
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* INCOME MODAL (Add / Edit)                                    */}
      {/* ============================================================ */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingIncome
                  ? t('teacherAccounts.income.editBtn') || 'Edit Income'
                  : t('teacherAccounts.income.addBtn') || 'Record Income'}
              </h3>
              <button
                type="button"
                onClick={() => setIsIncomeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="p-6 overflow-y-auto space-y-4">
              {incomeError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                  {incomeError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.amount') || 'Amount'} *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    className={INPUT_CLS}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.currency') || 'Currency'} *</label>
                  <select
                    value={incomeForm.currency}
                    onChange={(e) => setIncomeForm({ ...incomeForm, currency: e.target.value })}
                    className={INPUT_CLS}
                  >
                    {availableCurrencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.date') || 'Date'} *</label>
                  <input
                    type="date"
                    required
                    value={incomeForm.incomeDate}
                    onChange={(e) => setIncomeForm({ ...incomeForm, incomeDate: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.status') || 'Status'} *</label>
                  <select
                    value={incomeForm.status}
                    onChange={(e) => setIncomeForm({ ...incomeForm, status: e.target.value })}
                    className={INPUT_CLS}
                  >
                    <option value="RECEIVED">{t('teacherAccounts.income.statusReceived') || 'Collected'}</option>
                    <option value="PENDING">{t('teacherAccounts.income.statusPending') || 'Pending / Due'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>{t('teacherAccounts.form.source') || 'Income Source'} *</label>
                <select
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="LESSON_ONE_ON_ONE">{t('teacherAccounts.income.sourceOneOnOne') || '1-on-1 Lesson'}</option>
                  <option value="LESSON_GROUP">{t('teacherAccounts.income.sourceGroup') || 'Group Lesson'}</option>
                  <option value="COURSE_FEE">{t('teacherAccounts.income.sourceCourseFee') || 'Course Fee'}</option>
                  <option value="OTHER">{t('teacherAccounts.income.sourceOther') || 'Other'}</option>
                </select>
              </div>

              {/* Optional Links: Student, Group, Lesson */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.student') || 'Student (Optional)'}</label>
                  <select
                    value={incomeForm.studentId}
                    onChange={(e) => setIncomeForm({ ...incomeForm, studentId: e.target.value })}
                    className={INPUT_CLS}
                  >
                    <option value="">{t('teacherAccounts.form.selectStudent') || 'Select a student (optional)'}</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.group') || 'Group / Class (Optional)'}</label>
                  <select
                    value={incomeForm.groupId}
                    onChange={(e) => setIncomeForm({ ...incomeForm, groupId: e.target.value })}
                    className={INPUT_CLS}
                  >
                    <option value="">{t('teacherAccounts.form.selectGroup') || 'Select a group (optional)'}</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>{t('teacherAccounts.form.lesson') || 'Lesson (Optional)'}</label>
                <select
                  value={incomeForm.lessonId}
                  onChange={(e) => setIncomeForm({ ...incomeForm, lessonId: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="">{t('teacherAccounts.form.selectLesson') || 'Select a lesson (optional)'}</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.date} — {l.subject} ({l.startTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>{t('teacherAccounts.form.notes') || 'Notes (Optional)'}</label>
                <textarea
                  rows={2}
                  value={incomeForm.notes}
                  onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Additional fee notes or student details..."
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className={GHOST_BTN}
                >
                  {t('teacherAccounts.form.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingIncome}
                  className={PRIMARY_BTN}
                >
                  {savingIncome ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('teacherAccounts.form.saving') || 'Saving...'}
                    </>
                  ) : (
                    t('teacherAccounts.form.save') || 'Save Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EXPENSE MODAL (Add / Edit)                                   */}
      {/* ============================================================ */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingExpense
                  ? t('teacherAccounts.expenses.editBtn') || 'Edit Expense'
                  : t('teacherAccounts.expenses.addBtn') || 'Record Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 overflow-y-auto space-y-4">
              {expenseError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                  {expenseError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.category') || 'Category'} *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className={INPUT_CLS}
                  >
                    <option value="MATERIALS">{t('teacherAccounts.expenses.catMaterials') || 'Materials'}</option>
                    <option value="BOOKS">{t('teacherAccounts.expenses.catBooks') || 'Books'}</option>
                    <option value="RENT">{t('teacherAccounts.expenses.catRent') || 'Rent / Space'}</option>
                    <option value="EQUIPMENT">{t('teacherAccounts.expenses.catEquipment') || 'Equipment'}</option>
                    <option value="UTILITIES">{t('teacherAccounts.expenses.catUtilities') || 'Utilities'}</option>
                    <option value="OTHER">{t('teacherAccounts.expenses.catOther') || 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.date') || 'Date'} *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>{t('teacherAccounts.form.description') || 'Description'} *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="e.g. Science textbooks, Whiteboard markers"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.amount') || 'Amount'} *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className={INPUT_CLS}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>{t('teacherAccounts.form.currency') || 'Currency'} *</label>
                  <select
                    value={expenseForm.currency}
                    onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                    className={INPUT_CLS}
                  >
                    {availableCurrencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>{t('teacherAccounts.form.notes') || 'Notes (Optional)'}</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Receipt number, supplier details..."
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className={GHOST_BTN}
                >
                  {t('teacherAccounts.form.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className={PRIMARY_BTN}
                >
                  {savingExpense ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('teacherAccounts.form.saving') || 'Saving...'}
                    </>
                  ) : (
                    t('teacherAccounts.form.save') || 'Save Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL                                    */}
      {/* ============================================================ */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('teacherAccounts.deleteModal.confirmTitle') || 'Confirm Deletion'}
            </h3>
            <p className="text-sm text-gray-500">
              {t('teacherAccounts.deleteModal.confirmMessage') ||
                'Are you sure you want to delete this record? This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className={GHOST_BTN}
              >
                {t('teacherAccounts.form.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin inline mr-1" />
                    {t('teacherAccounts.deleteModal.deleting') || 'Deleting...'}
                  </>
                ) : (
                  t('teacherAccounts.deleteModal.deleteBtn') || 'Delete Record'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PRINTABLE INVOICE / RECEIPT MODAL                             */}
      {/* ============================================================ */}
      {viewingDocument && (
        <TeacherFeeDocumentModal
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default TeacherAccounts;
