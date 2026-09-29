// frontend/src/pages/DoctorAccounts.jsx
// ============================================================
// DOCTOR ACCOUNTS — internal clinic bookkeeping (Doctor role).
// ============================================================
// A doctor records money they ACTUALLY RECEIVED, their own expenses, and
// their own clinic staff. This is bookkeeping only.
//
// NOT a payment system: nothing here charges, refunds, or settles money.
// There is no PayPal / Paymob / Stripe / gateway integration, and this page
// never writes a HomelyServ `Payment`, `AccountingEntry`, Worker earning or
// subscription record. All data goes through the Doctor Accounts API, which
// scopes every record to the authenticated doctor server-side.
//
// CURRENCY ISOLATION: the backend returns { CURRENCY: amount } maps. This
// page renders each currency on its own line and NEVER adds them together.
// There is deliberately no "grand total" across currencies, because adding
// EGP to USD is meaningless.
//
// INCOME IS EXPLICIT: a confirmed appointment never records income by
// itself. The doctor enters income as an action, and the summary counts
// only rows marked RECEIVED.
//
// Employees: `salary` here is a MONTHLY RECURRING salary that the backend
// summary prorates. It is never written as a DoctorExpense record.
//
// Ownership: this page never sends `doctorId` in any payload. The backend
// derives ownership from the authenticated token only.
// ============================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
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
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  X
} from 'lucide-react';

// Shared input styling, matching the Doctor pages (red focus ring).
const INPUT_CLS =
  'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500';
const LABEL_CLS = 'block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5';
const PRIMARY_BTN =
  'inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors';
const GHOST_BTN =
  'rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors';

const RANGE_PRESETS = ['today', 'week', 'month', 'year', 'custom'];

const INCOME_SOURCES = ['CONSULTATION', 'CLINIC', 'OTHER'];
const INCOME_STATUSES = ['RECEIVED', 'PENDING', 'REFUNDED'];
const EXPENSE_CATEGORIES = ['RENT', 'UTILITIES', 'MEDICAL_SUPPLIES', 'MAINTENANCE', 'OTHER'];

/** YYYY-MM-DD in LOCAL time (toISOString would shift the day by timezone). */
const toInputDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * YYYY-MM-DD from a STORED backend date, read in UTC.
 *
 * `toInputDate` above is correct for "today" defaults (it must use the
 * viewer's local calendar day). It is NOT correct for rendering a stored
 * value back into an <input type="date">: the backend stores these at UTC
 * midnight, so local accessors would render the PREVIOUS day for any
 * negative UTC offset (e.g. UTC-5) and silently shift the record when the
 * doctor edits and saves it. Stored dates are therefore read with getUTC*.
 */
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

/**
 * Resolve a preset to an inclusive [from, to] pair of YYYY-MM-DD strings.
 * `week` starts on Sunday, matching the platform's existing dayOfWeek
 * convention (0 = Sunday) used by the Doctor schedule.
 */
const resolvePresetRange = (preset) => {
  const now = new Date();
  const today = toInputDate(now);
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { from: toInputDate(start), to: today };
  }
  if (preset === 'year') return { from: `${now.getFullYear()}-01-01`, to: today };
  // 'month' (the default) and any fallback: first day of this month -> today.
  return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today };
};

/**
 * Convert a backend { CURRENCY: amount } map into sorted display rows.
 * This is a RENAME of the server's buckets — amounts are never combined,
 * so two currencies can never be added together here.
 */
/** 'MEDICAL_SUPPLIES' -> 'MedicalSupplies', for building i18n keys. */
const pascalCase = (value) =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const toCurrencyRows = (map) =>
  Object.entries(map || {})
    .filter(([, amount]) => Number.isFinite(Number(amount)))
    .map(([currency, amount]) => ({ currency, amount: Number(amount) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

// ============================================================
// MODAL
// ============================================================
// One shared modal shell for all three record types, matching the
// existing Doctor modal pattern (fixed overlay, centered card, red
// primary action).
const RecordModal = ({ title, onClose, onSubmit, submitting, error, children, submitLabel, cancelLabel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70" onClick={onClose} />
    <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
      >
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}

        {children}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={GHOST_BTN}>
            {cancelLabel}
          </button>
          <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  </div>
);

/**
 * Renders a { CURRENCY: amount } map as one row per currency.
 * The values are formatted individually and are NEVER summed together, so
 * EGP and USD can never be combined into a single misleading total.
 *
 * Declared at module scope so its identity is stable across renders; this
 * prevents the whole summary/list subtree from remounting on every keystroke.
 */
const CurrencyRows = ({ map, lang, noAmountsLabel }) => {
  const rows = toCurrencyRows(map);
  if (!rows.length) {
    return <p className="text-xs text-slate-400">{noAmountsLabel}</p>;
  }
  return (
    <div className="space-y-0.5">
      {rows.map((row) => (
        <p key={row.currency} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {formatCurrencyAmount(row.amount, row.currency, lang)}
        </p>
      ))}
    </div>
  );
};

/** A titled section card used by the Income / Expenses / Employees lists. */
const SectionCard = ({ icon: Icon, title, subtitle, action, children }) => (
  <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

/** Per-row Edit / Delete buttons for one accounting record. */
const RowActions = ({ type, record, editLabel, deleteLabel, onEdit, onDelete }) => (
  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={() => onEdit(type, record)}
      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
      title={editLabel}
    >
      <Pencil size={15} />
    </button>
    <button
      type="button"
      onClick={() => onDelete(type, record)}
      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
      title={deleteLabel}
    >
      <Trash2 size={15} />
    </button>
  </div>
);

// ============================================================
// PAGE
// ============================================================
const DoctorAccounts = () => {
  const { t, i18n } = useTranslation();

  // ---------------- Date range (frontend default: current month) ----------------
  const [rangePreset, setRangePreset] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Resolve the active range. An incomplete or invalid custom range is
  // reported and never sent, so the API is only ever called with a
  // complete, well-ordered pair.
  const resolvedRange = useMemo(() => {
    if (rangePreset !== 'custom') {
      const { from, to } = resolvePresetRange(rangePreset);
      return { from, to, error: '' };
    }
    if (!customFrom || !customTo) {
      return { from: null, to: null, error: t('doctorCms.rangeIncomplete') };
    }
    if (customFrom > customTo) {
      return { from: null, to: null, error: t('doctorCms.rangeInvalid') };
    }
    return { from: customFrom, to: customTo, error: '' };
  }, [rangePreset, customFrom, customTo, t]);

  const rangeParams = useMemo(() => {
    if (resolvedRange.error || !resolvedRange.from || !resolvedRange.to) return null;
    return { from: resolvedRange.from, to: resolvedRange.to };
  }, [resolvedRange]);

  // ---------------- Data ----------------
  const [summary, setSummary] = useState(null);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  // Employee activate/deactivate failures stay local to the employee section
  // and are cleared on the next toggle attempt or a successful reload.
  const [employeeToggleError, setEmployeeToggleError] = useState('');

  const [modal, setModal] = useState(null); // { type, record }
  const [pendingDelete, setPendingDelete] = useState(null);
  // Monotonic id for loadAll() so a slower earlier response can never
  // overwrite the results of a newer range selection.
  const latestRequestId = useRef(0);

  // ---------------- Employee salary & settlements (display, never calculate) ----------------
  // The backend is the single source of truth for every monetary figure here.
  // This panel only sends an employee id plus a date range and renders what
  // comes back. It never computes gross / deduction / net in React.
  const [financeEmployee, setFinanceEmployee] = useState(null);
  const [financeTab, setFinanceTab] = useState('period');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState(null);
  const [periodBusy, setPeriodBusy] = useState(false);
  const [periodError, setPeriodError] = useState('');
  const [settlements, setSettlements] = useState([]);
  const [settlementsBusy, setSettlementsBusy] = useState(false);
  const [settlementsError, setSettlementsError] = useState('');
  const [settlementDetail, setSettlementDetail] = useState(null);
  const [settlementDetailBusy, setSettlementDetailBusy] = useState(false);
  const [financeActionError, setFinanceActionError] = useState('');
  const [financeBusy, setFinanceBusy] = useState(false);
  const [pendingSettlement, setPendingSettlement] = useState(null); // { from, to }
  const [pendingReversal, setPendingReversal] = useState(null); // the settlement row
  // The employee's own advances/penalties, so the panel can list, edit and
  // delete them. Reloaded whenever the employee or the main list changes.
  const [adjustments, setAdjustments] = useState([]);
  const [adjustmentsBusy, setAdjustmentsBusy] = useState(false);

  // Default the salary period to the current month, mirroring the page default.
  const defaultPeriod = useMemo(() => {
    const now = new Date();
    return {
      from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      to: toInputDate(now)
    };
  }, []);

  const openFinance = (employee) => {
    setFinanceEmployee(employee);
    setFinanceTab('period');
    setSalaryPeriod(null);
    setSettlements([]);
    setSettlementDetail(null);
    setFinanceActionError('');
    setPeriodError('');
    setSettlementsError('');
    setPeriodFrom((prev) => prev || defaultPeriod.from);
    setPeriodTo((prev) => prev || defaultPeriod.to);
    loadAdjustments(employee);
  };

  const closeFinance = () => {
    setFinanceEmployee(null);
    setSalaryPeriod(null);
    setSettlements([]);
    setSettlementDetail(null);
    setFinanceActionError('');
  };
  const currencyOptions = useMemo(
    () => [LEGACY_DEFAULT_CURRENCY, ...SUPPORTED_CURRENCIES.filter((c) => c !== LEGACY_DEFAULT_CURRENCY)],
    []
  );

  // A record may legitimately hold a currency that is not in the static
  // supported list (the backend only requires a <=10 char string). Adding it
  // to the list for THIS form only stops an edit from silently rewriting the
  // currency to whatever the browser falls back to for an unmatched value.
  const currencyOptionsWith = (current) =>
    current && !currencyOptions.includes(current)
      ? [LEGACY_DEFAULT_CURRENCY, current, ...currencyOptions.slice(1)]
      : currencyOptions;

  // Read-only: GET the backend-calculated salary period for this employee.
  const loadSalaryPeriod = useCallback(async (employee, from, to) => {
    if (!from || !to) return;
    setPeriodBusy(true);
    setPeriodError('');
    try {
      const res = await api.get(
        `/api/doctor-accounts/employees/${employee._id}/salary-period`,
        { params: { from, to } }
      );
      setSalaryPeriod(res.data?.salaryPeriod || null);
    } catch (error) {
      console.error('Error loading salary period:', error);
      setPeriodError(error.response?.data?.message || t('doctorCms.financeLoadError'));
    } finally {
      setPeriodBusy(false);
    }
  }, [t]);

  const loadSettlements = useCallback(async (employee) => {
    setSettlementsBusy(true);
    setSettlementsError('');
    try {
      const res = await api.get(`/api/doctor-accounts/employees/${employee._id}/settlements`);
      setSettlements(Array.isArray(res.data?.settlements) ? res.data.settlements : []);
    } catch (error) {
      console.error('Error loading settlements:', error);
      setSettlementsError(error.response?.data?.message || t('doctorCms.financeLoadError'));
    } finally {
      setSettlementsBusy(false);
    }
  }, [t]);

  // Advances/penalties for the open employee. The backend scopes the list to
  // the session doctor; the employeeId here only narrows it to one employee.
  const loadAdjustments = useCallback(async (employee) => {
    setAdjustmentsBusy(true);
    try {
      const res = await api.get('/api/doctor-accounts/adjustments', {
        params: { employeeId: employee._id }
      });
      setAdjustments(Array.isArray(res.data?.adjustments) ? res.data.adjustments : []);
    } catch (error) {
      console.error('Error loading adjustments:', error);
      setAdjustments([]);
    } finally {
      setAdjustmentsBusy(false);
    }
  }, []);

  // Settlement detail is the STORED snapshot, served by the backend as-is.
  const loadSettlementDetail = useCallback(async (employee, settlementId) => {
    setSettlementDetailBusy(true);
    setSettlementDetail(null);
    try {
      const res = await api.get(
        `/api/doctor-accounts/employees/${employee._id}/settlements/${settlementId}`
      );
      setSettlementDetail(res.data?.settlement || null);
    } catch (error) {
      console.error('Error loading settlement detail:', error);
      setFinanceActionError(error.response?.data?.message || t('doctorCms.financeLoadError'));
    } finally {
      setSettlementDetailBusy(false);
    }
  }, [t]);

  // Settle. The body carries ONLY { from, to, notes } — never doctorId,
  // never a monetary value. The backend recalculates and snapshots everything.
  const confirmSettlement = async () => {
    if (!pendingSettlement || !financeEmployee) return;
    const { from, to } = pendingSettlement;
    setFinanceBusy(true);
    setFinanceActionError('');
    try {
      await api.post(
        `/api/doctor-accounts/employees/${financeEmployee._id}/settlements`,
        { from, to, notes: '' }
      );
      setPendingSettlement(null);
      await loadSettlements(financeEmployee);
      await loadSalaryPeriod(financeEmployee, from, to);
    } catch (error) {
      console.error('Error settling salary period:', error);
      setFinanceActionError(error.response?.data?.message || t('doctorCms.financeSaveError'));
    } finally {
      setFinanceBusy(false);
    }
  };

  // Reverse a SETTLED period. The backend restores the advances itself; this
  // only calls the endpoint and then refreshes what is on screen.
  const confirmReversal = async () => {
    if (!pendingReversal || !financeEmployee) return;
    const employee = financeEmployee;
    const target = pendingReversal;
    setFinanceBusy(true);
    setFinanceActionError('');
    try {
      await api.post(
        `/api/doctor-accounts/employees/${employee._id}/settlements/${target._id}/reversal`,
        {}
      );
      setPendingReversal(null);
      setSettlementDetail(null);
      await loadSettlements(employee);
      await loadSalaryPeriod(employee, periodFrom, periodTo);
    } catch (error) {
      console.error('Error reversing settlement:', error);
      setFinanceActionError(error.response?.data?.message || t('doctorCms.financeSaveError'));
    } finally {
      setFinanceBusy(false);
    }
  };

  const loadAll = useCallback(async () => {
    if (!rangeParams) {
      // An incomplete or invalid Custom range must never show the PREVIOUS
      // period's money. Clear everything and make no request at all.
      setLoading(false);
      setSummary(null);
      setIncome([]);
      setExpenses([]);
      setEmployees([]);
      return;
    }
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    // Range-dependent data is cleared up front so the previous range's rows
    // are never shown against the newly selected period.
    setSummary(null);
    setIncome([]);
    setExpenses([]);
    setEmployees([]);
    setLoading(true);
    setLoadError('');
    try {
      const params = { params: rangeParams };
      const [summaryRes, incomeRes, expensesRes, employeesRes] = await Promise.all([
        api.get('/api/doctor-accounts/summary', params),
        api.get('/api/doctor-accounts/income', params),
        api.get('/api/doctor-accounts/expenses', params),
        api.get('/api/doctor-accounts/employees')
      ]);
      // A newer loadAll() has started: discard this response entirely.
      if (requestId !== latestRequestId.current) return;
      setSummary(summaryRes.data?.summary || null);
      setIncome(Array.isArray(incomeRes.data?.income) ? incomeRes.data.income : []);
      setExpenses(Array.isArray(expensesRes.data?.expenses) ? expensesRes.data.expenses : []);
      setEmployees(Array.isArray(employeesRes.data?.employees) ? employeesRes.data.employees : []);
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      console.error('Error loading doctor accounts:', error);
      setLoadError(error.response?.data?.message || t('doctorCms.accountsLoadError'));
    } finally {
      // Only the newest request may clear the spinner, otherwise an older
      // request would hide the loading state of a still-running newer one.
      if (requestId === latestRequestId.current) setLoading(false);
    }
  }, [rangeParams, t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---------------- CRUD ----------------
  // NOTE: no payload ever contains `doctorId`. Ownership is derived
  // server-side from the authenticated token.
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setSaving(true);
    setFormError('');
    try {
      await api.delete(`/api/doctor-accounts/${pendingDelete.type}/${pendingDelete.record._id}`);
      setPendingDelete(null);
      await loadAll();
      // Deleting an advance/penalty changes what the open panel shows.
      if (financeEmployee) {
        await loadAdjustments(financeEmployee);
        await loadSalaryPeriod(financeEmployee, periodFrom, periodTo);
      }
    } catch (error) {
      console.error('Error deleting doctor accounts record:', error);
      setFormError(error.response?.data?.message || t('doctorCms.accountsDeleteError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleEmployeeActive = async (employee) => {
    setEmployeeToggleError('');
    try {
      await api.patch(`/api/doctor-accounts/employees/${employee._id}`, {
        isActive: !employee.isActive
      });
      setEmployeeToggleError('');
      await loadAll();
    } catch (error) {
      console.error('Error toggling employee status:', error);
      // Local to the employee section: a failed toggle must not leave a
      // stale page-level load banner behind.
      setEmployeeToggleError(
        error.response?.data?.message || t('doctorCms.accountsSaveError')
      );
    }
  };

  const openAdd = (type) => {
    setFormError('');
    setModal({ type, record: null });
  };

  const openEdit = (type, record) => {
    setFormError('');
    setModal({ type, record });
  };

  // Opens the delete confirmation for one record. Passed down to RowActions.
  const handleRequestDelete = (type, record) => {
    setFormError('');
    setPendingDelete({ type, record });
  };

  const money = (amount, currency) => formatCurrencyAmount(amount, currency, i18n.language);

  // ---------------- Employee salary & settlement rendering ----------------
  // Every figure below comes straight from the server. These helpers only pick
  // a localized label for a reason code the backend already decided.
  const lineReasonLabel = (reason) => {
    switch (reason) {
      case 'OUTSIDE_PERIOD': return t('doctorCms.salaryPeriodOutside');
      case 'NO_GROSS_AVAILABLE': return t('doctorCms.salaryPeriodNoGross');
      case 'PARTIALLY_APPLIED': return t('doctorCms.salaryPeriodPartiallyApplied');
      case 'ALREADY_SETTLED': return t('doctorCms.salaryPeriodAlreadySettled');
      case 'NOT_YET_EFFECTIVE': return t('doctorCms.salaryPeriodNotYetEffective');
      default: return t('doctorCms.salaryPeriodApplied');
    }
  };

  const settlementStatusLabel = (status) =>
    status === 'REVERSED'
      ? t('doctorCms.statusReversed')
      : t('doctorCms.statusSettled');

  // Settlements arrive newest period first; a REVERSED row can never be settled
  // again, so only a SETTLED row offers the Reverse action.
  const canReverse = (row) => row?.status === 'SETTLED';

  const openAddAdjustment = (employee, type) => {
    setModal({ type: 'adjustments', record: { employeeId: employee._id, type, employeeCurrency: employee.currency } });
  };

  const openEditAdjustment = (employee, adjustment) => {
    setModal({ type: 'adjustments', record: { ...adjustment, employeeId: employee._id } });
  };

  // ---------------- Forms ----------------
  // Each form builds a payload of ALLOWED fields only. `doctorId` is never
  // included, and no request body is spread through wholesale.
  const incomeForm = useMemo(() => {
    const rec = modal?.record;
    return {
      amount: rec?.amount ?? '',
      currency: normalizeCurrencyCode(rec?.currency) || LEGACY_DEFAULT_CURRENCY,
      incomeDate: rec?.incomeDate ? toInputDateUTC(rec.incomeDate) : toInputDate(new Date()),
      source: rec?.source || 'CONSULTATION',
      status: rec?.status || 'RECEIVED',
      appointmentId: rec?.appointmentId || '',
      patientId: rec?.patientId || '',
      clinicPatientId: rec?.clinicPatientId || '',
      notes: rec?.notes || ''
    };
  }, [modal]);

  const expenseForm = useMemo(() => {
    const rec = modal?.record;
    return {
      category: rec?.category || '',
      description: rec?.description || '',
      amount: rec?.amount ?? '',
      currency: normalizeCurrencyCode(rec?.currency) || LEGACY_DEFAULT_CURRENCY,
      expenseDate: rec?.expenseDate ? toInputDateUTC(rec.expenseDate) : toInputDate(new Date()),
      notes: rec?.notes || ''
    };
  }, [modal]);

  const employeeForm = useMemo(() => {
    const rec = modal?.record;
    return {
      fullName: rec?.fullName || '',
      jobTitle: rec?.jobTitle || '',
      salary: rec?.salary ?? '',
      currency: normalizeCurrencyCode(rec?.currency) || LEGACY_DEFAULT_CURRENCY,
      startDate: rec?.startDate ? toInputDateUTC(rec.startDate) : toInputDate(new Date()),
      isActive: rec?.isActive !== false,
      notes: rec?.notes || ''
    };
  }, [modal]);

  const [incomeDraft, setIncomeDraft] = useState(incomeForm);
  const [expenseDraft, setExpenseDraft] = useState(expenseForm);
  const [employeeDraft, setEmployeeDraft] = useState(employeeForm);
  const [adjustmentDraft, setAdjustmentDraft] = useState({
    type: 'ADVANCE',
    amount: '',
    currency: LEGACY_DEFAULT_CURRENCY,
    adjustmentDate: toInputDate(new Date()),
    reason: '',
    notes: ''
  });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (modal?.type === 'income') { setIncomeDraft(incomeForm); setValidationError(''); }
    if (modal?.type === 'expenses') { setExpenseDraft(expenseForm); setValidationError(''); }
    if (modal?.type === 'employees') { setEmployeeDraft(employeeForm); setValidationError(''); }
    // New advance/penalty starts from the employee's own salary currency, so the
    // backend currency match cannot fail on a fresh record.
    if (modal?.type === 'adjustments') {
      const rec = modal.record;
      setAdjustmentDraft({
        type: rec?.type === 'PENALTY' ? 'PENALTY' : 'ADVANCE',
        amount: rec?.amount ?? '',
        currency: normalizeCurrencyCode(rec?.currency) || normalizeCurrencyCode(rec?.employeeCurrency) || LEGACY_DEFAULT_CURRENCY,
        adjustmentDate: rec?.adjustmentDate ? toInputDateUTC(rec.adjustmentDate) : toInputDate(new Date()),
        reason: rec?.reason || '',
        notes: rec?.notes || ''
      });
      setValidationError('');
    }
  }, [modal, incomeForm, expenseForm, employeeForm]);

  /**
   * Build a validated payload of ALLOWED fields only, or set a message and
   * return null. `doctorId` is never produced here.
   */
  const buildModalPayload = () => {
    setValidationError('');
    if (!modal) return null;

    if (modal.type === 'income') {
      const amount = Number(incomeDraft.amount);
      if (incomeDraft.amount === '' || !Number.isFinite(amount)) {
        setValidationError(t('doctorCms.incomeAmountRequired'));
        return null;
      }
      if (!incomeDraft.incomeDate) {
        setValidationError(t('doctorCms.incomeDateRequired'));
        return null;
      }
      // CONSULTATION income must name EXACTLY ONE patient (the backend enforces
      // this XOR). Checking both branches here avoids a guaranteed failed
      // round trip that would otherwise surface a raw Mongoose message.
      if (
        incomeDraft.source === 'CONSULTATION' &&
        !(
          (!!incomeDraft.patientId && !incomeDraft.clinicPatientId) ||
          (!incomeDraft.patientId && !!incomeDraft.clinicPatientId)
        )
      ) {
        setValidationError(t('doctorCms.incomeConsultationNeedsPatient'));
        return null;
      }
      // Relationship links are OPTIONAL and normalized to null when empty.
      // The edit form is pre-filled with the stored values, so an untouched
      // field is still non-empty and is sent back unchanged, while a field the
      // doctor deliberately CLEARS sends an explicit null and is detached.
      const link = (draftValue) => draftValue || null;
      return {
        amount,
        currency: incomeDraft.currency,
        incomeDate: incomeDraft.incomeDate,
        source: incomeDraft.source,
        status: incomeDraft.status,
        appointmentId: link(incomeDraft.appointmentId),
        patientId: link(incomeDraft.patientId),
        clinicPatientId: link(incomeDraft.clinicPatientId),
        notes: incomeDraft.notes
      };
    }

    if (modal.type === 'expenses') {
      const amount = Number(expenseDraft.amount);
      if (!expenseDraft.category) { setValidationError(t('doctorCms.expenseCategoryRequired')); return null; }
      if (!expenseDraft.description.trim()) { setValidationError(t('doctorCms.expenseDescriptionRequired')); return null; }
      if (expenseDraft.amount === '' || !Number.isFinite(amount)) { setValidationError(t('doctorCms.expenseAmountRequired')); return null; }
      if (!expenseDraft.expenseDate) { setValidationError(t('doctorCms.expenseDateRequired')); return null; }
      return {
        category: expenseDraft.category,
        description: expenseDraft.description.trim(),
        amount,
        currency: expenseDraft.currency,
        expenseDate: expenseDraft.expenseDate,
        notes: expenseDraft.notes
      };
    }

    if (modal.type === 'adjustments') {
      const amount = Number(adjustmentDraft.amount);
      if (adjustmentDraft.amount === '' || !Number.isFinite(amount) || amount <= 0) {
        setValidationError(t('doctorCms.incomeAmountRequired'));
        return null;
      }
      if (!adjustmentDraft.adjustmentDate) {
        setValidationError(t('doctorCms.rangeIncomplete'));
        return null;
      }
      // A penalty must state why. The amount is always exactly what the doctor
      // typed — nothing here derives it from salary, days or a percentage.
      if (adjustmentDraft.type === 'PENALTY' && !adjustmentDraft.reason.trim()) {
        setValidationError(t('doctorCms.adjustmentReasonRequired'));
        return null;
      }
      return {
        // Identifies which of the doctor's own employees this belongs to. The
        // backend re-verifies ownership against the session user, so this is an
        // identifier, never a trusted financial value. Ignored on PATCH.
        employeeId: modal.record.employeeId,
        type: adjustmentDraft.type,
        amount,
        currency: adjustmentDraft.currency,
        adjustmentDate: adjustmentDraft.adjustmentDate,
        reason: adjustmentDraft.reason.trim(),
        notes: adjustmentDraft.notes
      };
    }

    const salary = Number(employeeDraft.salary);
    if (!employeeDraft.fullName.trim()) { setValidationError(t('doctorCms.employeeNameRequired')); return null; }
    if (employeeDraft.salary === '' || !Number.isFinite(salary)) { setValidationError(t('doctorCms.employeeSalaryRequired')); return null; }
    if (!employeeDraft.startDate) { setValidationError(t('doctorCms.employeeStartDateRequired')); return null; }
    return {
      fullName: employeeDraft.fullName.trim(),
      jobTitle: employeeDraft.jobTitle,
      salary,
      currency: employeeDraft.currency,
      startDate: employeeDraft.startDate,
      isActive: employeeDraft.isActive,
      notes: employeeDraft.notes
    };
  };

  const submitModal = async () => {
    const values = buildModalPayload();
    if (!values) return;
    setSaving(true);
    setFormError('');
    try {
      const { type, record } = modal;
      const isEdit = Boolean(record?._id);
      if (type === 'adjustments') {
        // Adjustments live under their own resource; the employee is only ever
        // sent as the owner on create, never as a trusted financial identity.
        if (isEdit) await api.patch(`/api/doctor-accounts/adjustments/${record._id}`, values);
        else await api.post('/api/doctor-accounts/adjustments', values);
      } else {
        const endpoint = `/api/doctor-accounts/${type}${isEdit ? `/${record._id}` : ''}`;
        if (isEdit) await api.patch(endpoint, values);
        else await api.post(endpoint, values);
      }
      setModal(null);
      await loadAll();
      if (financeEmployee) {
        await Promise.all([
          loadSettlements(financeEmployee),
          loadAdjustments(financeEmployee)
        ]);
        await loadSalaryPeriod(financeEmployee, periodFrom, periodTo);
      }
    } catch (error) {
      console.error('Error saving doctor accounts record:', error);
      setFormError(error.response?.data?.message || t('doctorCms.accountsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  // ---------------- Render ----------------
  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('doctorCms.accountsTitle')}
        subtitle={t('doctorCms.accountsSubtitle')}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {loadError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{loadError}</p>
          </div>
        )}

        {/* ---------------- Date range ---------------- */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
              {t('doctorCms.rangeLabel')}
            </span>
            <div className="flex flex-wrap gap-2">
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRangePreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    rangePreset === preset
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {t(`doctorCms.range${preset.charAt(0).toUpperCase()}${preset.slice(1)}`)}
                </button>
              ))}
            </div>

            {rangePreset === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="acc-from">
                  {t('doctorCms.rangeFrom')}
                </label>
                <input
                  id="acc-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1.5 text-xs"
                />
                <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="acc-to">
                  {t('doctorCms.rangeTo')}
                </label>
                <input
                  id="acc-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1.5 text-xs"
                />
              </div>
            )}
          </div>
          {resolvedRange.error && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{resolvedRange.error}</p>
          )}
        </div>

        {/* ---------------- Financial summary ---------------- */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 1. Total Income */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-red-600" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('doctorCms.summaryIncome')}
                  </span>
                </div>
                <CurrencyRows
                  map={summary?.income}
                  lang={i18n.language}
                  noAmountsLabel={t('doctorCms.summaryNoAmounts')}
                />
              </div>

              {/* 2. Other Expenses — the manually recorded DoctorExpense rows,
                  i.e. everything in Total Expenses that is NOT salary. */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={16} className="text-rose-600" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('doctorCms.summaryOtherExpenses')}
                  </span>
                </div>
                <CurrencyRows
                  map={summary?.expenses}
                  lang={i18n.language}
                  noAmountsLabel={t('doctorCms.summaryNoAmounts')}
                />
              </div>

              {/* 3. Salary Expense — prorated server-side; never a local calc. */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-red-600" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('doctorCms.summarySalary')}
                  </span>
                </div>
                <CurrencyRows
                  map={summary?.salaryExpense}
                  lang={i18n.language}
                  noAmountsLabel={t('doctorCms.summaryNoAmounts')}
                />
              </div>

              {/* 4. Total Expenses — backend value, never recomputed here. */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={16} className="text-rose-600" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('doctorCms.summaryExpenses')}
                  </span>
                </div>
                <CurrencyRows
                  map={summary?.totalExpenses}
                  lang={i18n.language}
                  noAmountsLabel={t('doctorCms.summaryNoAmounts')}
                />
              </div>

              {/* 5. Net Balance — backend value, never recomputed here. */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-slate-600" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('doctorCms.summaryNet')}
                  </span>
                </div>
                <CurrencyRows
                  map={summary?.netBalance}
                  lang={i18n.language}
                  noAmountsLabel={t('doctorCms.summaryNoAmounts')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: t('doctorCms.summaryRegisteredPatients'), value: summary?.registeredPatients?.total ?? 0 },
                { label: t('doctorCms.summaryConfirmedAppointments'), value: summary?.confirmedAppointments ?? 0 },
                { label: t('doctorCms.summaryActiveEmployees'), value: summary?.activeEmployees ?? 0 }
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metric.value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400">{t('doctorCms.summaryIncomeReceivedOnly')}</p>
          </div>
        )}


        {/* ---------------- Income ---------------- */}
        <SectionCard
          icon={TrendingUp}
          title={t('doctorCms.incomeTitle')}
          subtitle={t('doctorCms.incomeSubtitle')}
          action={
            <button type="button" onClick={() => openAdd('income')} className={PRIMARY_BTN}>
              <Plus size={16} />
              {t('doctorCms.incomeAdd')}
            </button>
          }
        >
          {income.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">{t('doctorCms.incomeEmpty')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {income.map((record) => (
                <li key={record._id} className="py-3 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {money(record.amount, record.currency)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDisplayDate(record.incomeDate)} ·{' '}
                      {t(`doctorCms.incomeSource${record.source.charAt(0)}${record.source.slice(1).toLowerCase()}`)}
                      {record.appointmentId ? ' · #APPT' : ''}
                    </p>
                    {record.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{record.notes}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      record.status === 'RECEIVED'
                        ? 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                        : record.status === 'PENDING'
                          ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t(`doctorCms.incomeStatus${record.status.charAt(0)}${record.status.slice(1).toLowerCase()}`)}
                  </span>
                  <RowActions
                    type="income"
                    record={record}
                    editLabel={t('doctorCms.accountsEdit')}
                    deleteLabel={t('doctorCms.accountsDelete')}
                    onEdit={openEdit}
                    onDelete={handleRequestDelete}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ---------------- Expenses ---------------- */}
        <SectionCard
          icon={TrendingDown}
          title={t('doctorCms.expensesTitle')}
          subtitle={t('doctorCms.expensesSubtitle')}
          action={
            <button type="button" onClick={() => openAdd('expenses')} className={PRIMARY_BTN}>
              <Plus size={16} />
              {t('doctorCms.expensesAdd')}
            </button>
          }
        >
          {expenses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">{t('doctorCms.expensesEmpty')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((record) => (
                <li key={record._id} className="py-3 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {money(record.amount, record.currency)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDisplayDate(record.expenseDate)} · {record.description}
                    </p>
                    {record.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{record.notes}</p>
                    )}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {t(`doctorCms.expenseCategory${pascalCase(record.category)}`)}
                  </span>
                  <RowActions
                    type="expenses"
                    record={record}
                    editLabel={t('doctorCms.accountsEdit')}
                    deleteLabel={t('doctorCms.accountsDelete')}
                    onEdit={openEdit}
                    onDelete={handleRequestDelete}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ---------------- Employees ---------------- */}
        <SectionCard
          icon={Users}
          title={t('doctorCms.employeesTitle')}
          subtitle={t('doctorCms.employeesSubtitle')}
          action={
            <button type="button" onClick={() => openAdd('employees')} className={PRIMARY_BTN}>
              <Plus size={16} />
              {t('doctorCms.employeesAdd')}
            </button>
          }
        >
          {employeeToggleError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 dark:text-rose-300">{employeeToggleError}</p>
            </div>
          )}
          {employees.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">{t('doctorCms.employeesEmpty')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((record) => (
                <li key={record._id} className="py-3 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{record.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {record.jobTitle || '—'} · {money(record.salary, record.currency)} ·{' '}
                      <Calendar size={11} className="inline" /> {formatDisplayDate(record.startDate)}
                    </p>
                    {record.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{record.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => (financeEmployee?._id === record._id ? closeFinance() : openFinance(record))}
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      financeEmployee?._id === record._id
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/70'
                    }`}
                  >
                    <Wallet size={12} />
                    {t('doctorCms.employeeFinanceOpen')}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleEmployeeActive(record)}
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                      record.isActive
                        ? 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                    title={record.isActive ? t('doctorCms.employeeDeactivate') : t('doctorCms.employeeActivate')}
                  >
                    {record.isActive ? t('doctorCms.employeeActive') : t('doctorCms.employeeInactive')}
                  </button>
                  <RowActions
                    type="employees"
                    record={record}
                    editLabel={t('doctorCms.accountsEdit')}
                    deleteLabel={t('doctorCms.accountsDelete')}
                    onEdit={openEdit}
                    onDelete={handleRequestDelete}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ---------------- Employee salary & settlements panel ---------------- */}
        {financeEmployee && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet size={16} className="text-red-600" />
                  {t('doctorCms.employeeFinance')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {financeEmployee.fullName} · {t('doctorCms.employeeFinanceHint')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => openAddAdjustment(financeEmployee, 'ADVANCE')} className={PRIMARY_BTN}>
                  <Plus size={16} />
                  {t('doctorCms.advanceAdd')}
                </button>
                <button
                  type="button"
                  onClick={() => openAddAdjustment(financeEmployee, 'PENALTY')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <Plus size={16} />
                  {t('doctorCms.penaltyAdd')}
                </button>
                <button
                  type="button"
                  onClick={closeFinance}
                  aria-label={t('doctorCms.employeeFinanceClose')}
                  className="shrink-0 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {financeActionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2">
                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-300">{financeActionError}</p>
              </div>
            )}

            {/* ---- Period selector (drives the read-only calculation only) ---- */}
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className={LABEL_CLS} htmlFor="fin-from">{t('doctorCms.rangeFrom')}</label>
                <input
                  id="fin-from"
                  type="date"
                  value={periodFrom}
                  onChange={(e) => setPeriodFrom(e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS} htmlFor="fin-to">{t('doctorCms.rangeTo')}</label>
                <input
                  id="fin-to"
                  type="date"
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
              <button
                type="button"
                disabled={periodBusy}
                onClick={() => loadSalaryPeriod(financeEmployee, periodFrom, periodTo)}
                className={PRIMARY_BTN}
              >
                {periodBusy && <Loader2 size={16} className="animate-spin" />}
                {t('doctorCms.salaryPeriodTitle')}
              </button>
              <button
                type="button"
                disabled={settlementsBusy}
                onClick={() => loadSettlements(financeEmployee)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {settlementsBusy && <Loader2 size={16} className="animate-spin" />}
                {t('doctorCms.settlementHistory')}
              </button>
            </div>

            {periodError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{periodError}</p>
            )}

            {/* ---- Server-calculated salary period. Read-only by design. ---- */}
            {salaryPeriod && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  {t('doctorCms.salaryPeriodReadOnly')}
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ['doctorCms.salaryPeriodGross', salaryPeriod.grossSalary],
                    ['doctorCms.salaryPeriodAdvanceDeduction', salaryPeriod.advanceDeduction],
                    ['doctorCms.salaryPeriodPenaltyDeduction', salaryPeriod.penaltyDeduction],
                    ['doctorCms.salaryPeriodNet', salaryPeriod.netSalary]
                  ].map(([key, value]) => (
                    <div key={key} className="min-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t(key)}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {money(value, salaryPeriod.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('doctorCms.salaryPeriodOutstanding')}</p>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {money(salaryPeriod.advanceOutstandingAfter, salaryPeriod.currency)}
                  </p>
                </div>

                {((salaryPeriod.advanceLines?.length || 0) > 0 || (salaryPeriod.penaltyLines?.length || 0) > 0) ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {salaryPeriod.advanceLines?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          {t('doctorCms.salaryPeriodAdvanceLines')}
                        </p>
                        <ul className="space-y-1">
                          {salaryPeriod.advanceLines.map((line) => (
                            <li key={line.adjustmentId} className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="font-mono">{line.adjustmentId?.slice?.(-6) || line.adjustmentId}</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {lineReasonLabel(line.reason)} · {t('doctorCms.salaryPeriodApplied')}{' '}
                                {money(line.applied, salaryPeriod.currency)} · {t('doctorCms.salaryPeriodRemaining')}{' '}
                                {money(line.deferred, salaryPeriod.currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {salaryPeriod.penaltyLines?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          {t('doctorCms.salaryPeriodPenaltyLines')}
                        </p>
                        <ul className="space-y-1">
                          {salaryPeriod.penaltyLines.map((line) => (
                            <li key={line.adjustmentId} className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="font-mono">{line.adjustmentId?.slice?.(-6) || line.adjustmentId}</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {lineReasonLabel(line.reason)} · {t('doctorCms.salaryPeriodApplied')}{' '}
                                {money(line.applied, salaryPeriod.currency)} · {t('doctorCms.salaryPeriodRemaining')}{' '}
                                {money(line.shortfall, salaryPeriod.currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{t('doctorCms.salaryPeriodEmpty')}</p>
                )}

                {/* Settlement is an explicit action, never implicit from viewing. */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!periodFrom || !periodTo}
                    onClick={() => setPendingSettlement({ from: periodFrom, to: periodTo })}
                    className={PRIMARY_BTN}
                  >
                    <Wallet size={16} />
                    {t('doctorCms.settleSalary')}
                  </button>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {periodFrom} → {periodTo}
                  </span>
                </div>
              </div>
            )}

            {/* ---- Advances & penalties recorded for this employee ---- */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
                {t('doctorCms.adjustmentType')}
              </p>
              {adjustmentsBusy ? (
                <div className="py-4 flex justify-center">
                  <Loader2 size={16} className="animate-spin text-red-600" />
                </div>
              ) : adjustments.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{t('doctorCms.salaryPeriodEmpty')}</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adjustments.map((adj) => (
                    <li key={adj._id} className="py-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          adj.type === 'ADVANCE'
                            ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                            : 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {adj.type === 'ADVANCE' ? t('doctorCms.advanceAdd') : t('doctorCms.penaltyAdd')}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {money(adj.amount, adj.currency)}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        <Calendar size={10} className="inline" /> {formatDisplayDate(adj.adjustmentDate)}
                      </span>
                      {adj.reason && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                          {adj.reason}
                        </span>
                      )}
                      <span className="flex-1" />
                      <button
                        type="button"
                        onClick={() => openEditAdjustment(financeEmployee, adj)}
                        aria-label={t('doctorCms.accountsEdit')}
                        className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestDelete('adjustments', adj)}
                        aria-label={t('doctorCms.accountsDelete')}
                        className="shrink-0 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ---- Settlement history: STORED snapshots, never recomputed ---- */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
                {t('doctorCms.settlementHistory')}
              </p>
              {settlementsError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mb-2">{settlementsError}</p>
              )}
              {settlementsBusy ? (
                <div className="py-4 flex justify-center">
                  <Loader2 size={16} className="animate-spin text-red-600" />
                </div>
              ) : settlements.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{t('doctorCms.settlementEmpty')}</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {settlements.map((row) => (
                    <li key={row._id} className="py-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {formatDisplayDate(row.periodFrom)} → {formatDisplayDate(row.periodTo)}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {money(row.netSalary, row.currency)}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          row.status === 'REVERSED'
                            ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {settlementStatusLabel(row.status)}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        <Calendar size={10} className="inline" /> {formatDisplayDate(row.settledAt)}
                      </span>
                      <span className="flex-1" />
                      <button
                        type="button"
                        onClick={() => loadSettlementDetail(financeEmployee, row._id)}
                        className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        {t('doctorCms.settlementView')}
                      </button>
                      {/* Only a SETTLED row can be reversed. */}
                      {canReverse(row) && (
                        <button
                          type="button"
                          onClick={() => setPendingReversal(row)}
                          className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors"
                        >
                          {t('doctorCms.settlementReverse')}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ---- Settlement detail: the stored snapshot, read-only ---- */}
            {settlementDetailBusy && (
              <div className="py-4 flex justify-center">
                <Loader2 size={16} className="animate-spin text-red-600" />
              </div>
            )}
            {settlementDetail && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {formatDisplayDate(settlementDetail.periodFrom)} →{' '}
                    {formatDisplayDate(settlementDetail.periodTo)}
                  </p>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {settlementStatusLabel(settlementDetail.status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ['doctorCms.salaryPeriodGross', settlementDetail.grossSalary],
                    ['doctorCms.salaryPeriodAdvanceDeduction', settlementDetail.advanceDeduction],
                    ['doctorCms.salaryPeriodPenaltyDeduction', settlementDetail.penaltyDeduction],
                    ['doctorCms.salaryPeriodNet', settlementDetail.netSalary]
                  ].map(([key, value]) => (
                    <div key={key} className="min-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t(key)}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {money(value, settlementDetail.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('doctorCms.settlementDetailAdvance')}
                    </p>
                    {settlementDetail.advanceDetails?.length ? (
                      <ul className="space-y-0.5">
                        {settlementDetail.advanceDetails.map((line) => (
                          <li key={line.adjustmentId} className="text-[11px] text-slate-600 dark:text-slate-300">
                            {line.adjustmentId?.slice?.(-6)} · {t('doctorCms.salaryPeriodApplied')}{' '}
                            {money(line.appliedAmount, settlementDetail.currency)} ·{' '}
                            {t('doctorCms.salaryPeriodRemaining')}{' '}
                            {money(line.remainingAfter, settlementDetail.currency)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {t('doctorCms.settlementDetailNone')}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('doctorCms.settlementDetailPenalty')}
                    </p>
                    {settlementDetail.penaltyDetails?.length ? (
                      <ul className="space-y-0.5">
                        {settlementDetail.penaltyDetails.map((line) => (
                          <li key={line.adjustmentId} className="text-[11px] text-slate-600 dark:text-slate-300">
                            {line.adjustmentId?.slice?.(-6)} · {t('doctorCms.salaryPeriodApplied')}{' '}
                            {money(line.appliedAmount, settlementDetail.currency)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {t('doctorCms.settlementDetailNone')}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('doctorCms.settlementSettledAt')}: {formatDisplayDate(settlementDetail.settledAt)}
                </p>
                {settlementDetail.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{settlementDetail.notes}</p>
                )}
              </div>
            )}
          </div>
        )}

      {/* ---------------- Income modal ---------------- */}
      {modal?.type === 'income' && (
        <RecordModal
          title={modal.record ? t('doctorCms.accountsEdit') : t('doctorCms.incomeAdd')}
          onClose={() => setModal(null)}
          onSubmit={submitModal}
          submitting={saving}
          error={validationError || formError}
          submitLabel={t('doctorCms.accountsSave')}
          cancelLabel={t('doctorCms.accountsCancel')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="inc-amount">{t('doctorCms.incomeAmount')}</label>
              <input
                id="inc-amount"
                type="number"
                min="0"
                step="0.01"
                value={incomeDraft.amount}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, amount: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="inc-currency">{t('doctorCms.currencyLabel')}</label>
              <select
                id="inc-currency"
                value={incomeDraft.currency}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, currency: e.target.value }))}
                className={INPUT_CLS}
              >
                {currencyOptionsWith(incomeDraft.currency).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="inc-date">{t('doctorCms.incomeDate')}</label>
              <input
                id="inc-date"
                type="date"
                value={incomeDraft.incomeDate}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, incomeDate: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="inc-source">{t('doctorCms.incomeSource')}</label>
              <select
                id="inc-source"
                value={incomeDraft.source}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, source: e.target.value }))}
                className={INPUT_CLS}
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>{t(`doctorCms.incomeSource${pascalCase(s)}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="inc-status">{t('doctorCms.incomeStatus')}</label>
              <select
                id="inc-status"
                value={incomeDraft.status}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, status: e.target.value }))}
                className={INPUT_CLS}
              >
                {INCOME_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`doctorCms.incomeStatus${pascalCase(s)}`)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="inc-appt">{t('doctorCms.incomeAppointment')}</label>
              <input
                id="inc-appt"
                type="text"
                value={incomeDraft.appointmentId}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, appointmentId: e.target.value }))}
                placeholder={t('doctorCms.incomeAppointmentOptional')}
                className={INPUT_CLS}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('doctorCms.incomeFeeHint')}</p>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="inc-patient">{t('doctorCms.incomePatient')}</label>
              <input
                id="inc-patient"
                type="text"
                value={incomeDraft.patientId}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, patientId: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="inc-cpatient">{t('doctorCms.incomeClinicPatient')}</label>
              <input
                id="inc-cpatient"
                type="text"
                value={incomeDraft.clinicPatientId}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, clinicPatientId: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="inc-notes">{t('doctorCms.incomeNotes')}</label>
              <input
                id="inc-notes"
                type="text"
                value={incomeDraft.notes}
                onChange={(e) => setIncomeDraft((d) => ({ ...d, notes: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
          </div>
        </RecordModal>
      )}

      {/* ---------------- Expense modal ---------------- */}
      {modal?.type === 'expenses' && (
        <RecordModal
          title={modal.record ? t('doctorCms.accountsEdit') : t('doctorCms.expensesAdd')}
          onClose={() => setModal(null)}
          onSubmit={submitModal}
          submitting={saving}
          error={validationError || formError}
          submitLabel={t('doctorCms.accountsSave')}
          cancelLabel={t('doctorCms.accountsCancel')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="exp-category">{t('doctorCms.expenseCategory')}</label>
              <select
                id="exp-category"
                value={expenseDraft.category}
                onChange={(e) => setExpenseDraft((d) => ({ ...d, category: e.target.value }))}
                className={INPUT_CLS}
              >
                <option value="">{t('doctorCms.expenseSelectCategory')}</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`doctorCms.expenseCategory${pascalCase(c)}`)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="exp-desc">{t('doctorCms.expenseDescription')}</label>
              <input
                id="exp-desc"
                type="text"
                maxLength={200}
                value={expenseDraft.description}
                onChange={(e) => setExpenseDraft((d) => ({ ...d, description: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="exp-amount">{t('doctorCms.incomeAmount')}</label>
              <input
                id="exp-amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseDraft.amount}
                onChange={(e) => setExpenseDraft((d) => ({ ...d, amount: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="exp-currency">{t('doctorCms.currencyLabel')}</label>
              <select
                id="exp-currency"
                value={expenseDraft.currency}
                onChange={(e) => setExpenseDraft((d) => ({ ...d, currency: e.target.value }))}
                className={INPUT_CLS}
              >
                {currencyOptionsWith(expenseDraft.currency).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="exp-date">{t('doctorCms.expenseDate')}</label>
              <input
                id="exp-date"
                type="date"
                value={expenseDraft.expenseDate}
                onChange={(e) => setExpenseDraft((d) => ({ ...d, expenseDate: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="exp-notes">{t('doctorCms.incomeNotes')}</label>
              <input
                id="exp-notes"
                type="text"
                value={expenseDraft.notes}
                onChange={(e) => setExpenseDraft((d) => ({ ...d, notes: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
          </div>
        </RecordModal>
      )}


      {/* ---------------- Employee modal ---------------- */}
      {modal?.type === 'employees' && (
        <RecordModal
          title={modal.record ? t('doctorCms.accountsEdit') : t('doctorCms.employeesAdd')}
          onClose={() => setModal(null)}
          onSubmit={submitModal}
          submitting={saving}
          error={validationError || formError}
          submitLabel={t('doctorCms.accountsSave')}
          cancelLabel={t('doctorCms.accountsCancel')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="emp-name">{t('doctorCms.employeeFullName')}</label>
              <input
                id="emp-name"
                type="text"
                maxLength={120}
                value={employeeDraft.fullName}
                onChange={(e) => setEmployeeDraft((d) => ({ ...d, fullName: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="emp-title">{t('doctorCms.employeeJobTitle')}</label>
              <input
                id="emp-title"
                type="text"
                maxLength={120}
                value={employeeDraft.jobTitle}
                onChange={(e) => setEmployeeDraft((d) => ({ ...d, jobTitle: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="emp-salary">{t('doctorCms.employeeSalary')}</label>
              <input
                id="emp-salary"
                type="number"
                min="0"
                step="0.01"
                value={employeeDraft.salary}
                onChange={(e) => setEmployeeDraft((d) => ({ ...d, salary: e.target.value }))}
                className={INPUT_CLS}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('doctorCms.employeeSalaryNote')}</p>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="emp-currency">{t('doctorCms.currencyLabel')}</label>
              <select
                id="emp-currency"
                value={employeeDraft.currency}
                onChange={(e) => setEmployeeDraft((d) => ({ ...d, currency: e.target.value }))}
                className={INPUT_CLS}
              >
                {currencyOptionsWith(employeeDraft.currency).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="emp-start">{t('doctorCms.employeeStartDate')}</label>
              <input
                id="emp-start"
                type="date"
                value={employeeDraft.startDate}
                onChange={(e) => setEmployeeDraft((d) => ({ ...d, startDate: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={employeeDraft.isActive}
                  onChange={(e) => setEmployeeDraft((d) => ({ ...d, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                {t('doctorCms.employeeActive')}
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="emp-notes">{t('doctorCms.incomeNotes')}</label>
              <input
                id="emp-notes"
                type="text"
                value={employeeDraft.notes}
                onChange={(e) => setEmployeeDraft((d) => ({ ...d, notes: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
          </div>
        </RecordModal>
      )}

      {/* ---------------- Advance / Penalty modal ---------------- */}
      {modal?.type === 'adjustments' && (
        <RecordModal
          title={
            modal.record?._id
              ? t('doctorCms.adjustmentEdit')
              : adjustmentDraft.type === 'ADVANCE'
                ? t('doctorCms.advanceAdd')
                : t('doctorCms.penaltyAdd')
          }
          onClose={() => setModal(null)}
          onSubmit={submitModal}
          submitting={saving}
          error={validationError || formError}
          submitLabel={t('doctorCms.accountsSave')}
          cancelLabel={t('doctorCms.accountsCancel')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS} htmlFor="adj-type">{t('doctorCms.adjustmentType')}</label>
              <select
                id="adj-type"
                value={adjustmentDraft.type}
                onChange={(e) => setAdjustmentDraft((d) => ({ ...d, type: e.target.value }))}
                className={INPUT_CLS}
              >
                <option value="ADVANCE">{t('doctorCms.advanceAdd')}</option>
                <option value="PENALTY">{t('doctorCms.penaltyAdd')}</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="adj-currency">{t('doctorCms.currencyLabel')}</label>
              <select
                id="adj-currency"
                value={adjustmentDraft.currency}
                onChange={(e) => setAdjustmentDraft((d) => ({ ...d, currency: e.target.value }))}
                className={INPUT_CLS}
              >
                {currencyOptionsWith(adjustmentDraft.currency).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="adj-amount">{t('doctorCms.incomeAmount')}</label>
              <input
                id="adj-amount"
                type="number"
                min="0"
                step="0.01"
                value={adjustmentDraft.amount}
                onChange={(e) => setAdjustmentDraft((d) => ({ ...d, amount: e.target.value }))}
                className={INPUT_CLS}
              />
              {/* A penalty is the EXACT typed amount. Nothing is derived here. */}
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {adjustmentDraft.type === 'ADVANCE'
                  ? t('doctorCms.adjustmentAmountHintAdvance')
                  : t('doctorCms.adjustmentAmountHintPenalty')}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="adj-date">{t('doctorCms.adjustmentDate')}</label>
              <input
                id="adj-date"
                type="date"
                value={adjustmentDraft.adjustmentDate}
                onChange={(e) => setAdjustmentDraft((d) => ({ ...d, adjustmentDate: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="adj-reason">
                {adjustmentDraft.type === 'PENALTY'
                  ? t('doctorCms.adjustmentPenaltyReason')
                  : t('doctorCms.adjustmentReason')}
              </label>
              <input
                id="adj-reason"
                type="text"
                value={adjustmentDraft.reason}
                onChange={(e) => setAdjustmentDraft((d) => ({ ...d, reason: e.target.value }))}
                className={INPUT_CLS}
              />
              {adjustmentDraft.type === 'PENALTY' ? (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {t('doctorCms.adjustmentReasonRequired')}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('doctorCms.adjustmentReasonHint')}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="adj-notes">{t('doctorCms.incomeNotes')}</label>
              <input
                id="adj-notes"
                type="text"
                value={adjustmentDraft.notes}
                onChange={(e) => setAdjustmentDraft((d) => ({ ...d, notes: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
          </div>
        </RecordModal>
      )}

      {/* ---------------- Settlement confirmation ---------------- */}
      {pendingSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setPendingSettlement(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('doctorCms.settleConfirmTitle')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('doctorCms.settleConfirmBody')}
            </p>
            {/* Summary of the figures the BACKEND already calculated. */}
            {salaryPeriod && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-4 space-y-1.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('doctorCms.settlementPeriod')}: {pendingSettlement.from} → {pendingSettlement.to}
                </p>
                {[
                  ['doctorCms.salaryPeriodGross', salaryPeriod.grossSalary],
                  ['doctorCms.salaryPeriodAdvanceDeduction', salaryPeriod.advanceDeduction],
                  ['doctorCms.salaryPeriodPenaltyDeduction', salaryPeriod.penaltyDeduction],
                  ['doctorCms.salaryPeriodNet', salaryPeriod.netSalary]
                ].map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t(key)}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {money(value, salaryPeriod.currency)}
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('doctorCms.settleNotesHint')}</p>
              </div>
            )}
            {financeActionError && (
              <p className="mb-3 text-xs text-rose-600 dark:text-rose-400">{financeActionError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPendingSettlement(null)} className={GHOST_BTN}>
                {t('doctorCms.accountsCancel')}
              </button>
              <button type="button" onClick={confirmSettlement} disabled={financeBusy} className={PRIMARY_BTN}>
                {financeBusy && <Loader2 size={16} className="animate-spin" />}
                {t('doctorCms.settleSalary')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Reversal confirmation ---------------- */}
      {pendingReversal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setPendingReversal(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('doctorCms.settlementReverseConfirmTitle')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('doctorCms.settlementReverseConfirmBody')}
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-4 space-y-1.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('doctorCms.settlementPeriod')}: {formatDisplayDate(pendingReversal.periodFrom)} →{' '}
                {formatDisplayDate(pendingReversal.periodTo)}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{t('doctorCms.salaryPeriodNet')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {money(pendingReversal.netSalary, pendingReversal.currency)}
                </span>
              </div>
            </div>
            {financeActionError && (
              <p className="mb-3 text-xs text-rose-600 dark:text-rose-400">{financeActionError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPendingReversal(null)} className={GHOST_BTN}>
                {t('doctorCms.accountsCancel')}
              </button>
              <button
                type="button"
                onClick={confirmReversal}
                disabled={financeBusy}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
              >
                {financeBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('doctorCms.settlementReverse')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Delete confirmation ---------------- */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setPendingDelete(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('doctorCms.accountsDeleteConfirmTitle')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {t('doctorCms.accountsDeleteConfirmBody')}
            </p>
            {formError && (
              <p className="mb-3 text-xs text-rose-600 dark:text-rose-400">{formError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className={GHOST_BTN}>
                {t('doctorCms.accountsCancel')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
                {t('doctorCms.accountsDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorAccounts;