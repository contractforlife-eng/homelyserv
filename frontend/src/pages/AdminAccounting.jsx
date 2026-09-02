// frontend/src/pages/AdminAccounting.jsx
// Root-admin-only accounting ledger for platform Expenses and Income.
// Backend authorization (requireAdmin + isRootAdminRequest) is authoritative;
// this page is a UI consumer only.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Filter, Plus, RefreshCw, Save, Trash2, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { isCurrentRootAdmin } from '../utils/rootAdminIdentity';

const money = (amount, currency) => `${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} ${currency}`;

const TYPE_OPTIONS = [
  { value: 'EXPENSE', labelKey: 't' },
  { value: 'INCOME', labelKey: 't' },
];

const STATUS_OPTIONS = [
  { value: 'PAID', labelKey: 't' },
  { value: 'PENDING', labelKey: 't' },
  { value: 'CANCELLED', labelKey: 't' },
];

const CURRENCY_OPTIONS = ['USD', 'EGP', 'EUR', 'GBP'];

const SUMMARY_TONES = {
  income: 'border-green-500/25 bg-green-500/10',
  expenses: 'border-red-500/25 bg-red-500/10',
  net: 'border-yellow-500/25 bg-yellow-500/10',
  month: 'border-blue-500/25 bg-blue-500/10',
};
const FormField = ({ label, name, type = 'text', value, onChange, options, placeholder, step, as: As = 'input' }) => (
    <label className="block text-xs font-semibold text-gray-500">
      {label}
      {As === 'select' ? (
        <select
          name={name}
          value={value || ''}
          onChange={onChange}
          className="mt-1.5 block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100"
        >
          {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <As
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          step={step}
          className="mt-1.5 block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100"
        />
      )}
    </label>
  );
const AdminAccounting = () => {
  const { t } = useTranslation();
  const a = useCallback(
  (key, options) => t(`accounting.${key}`, options),
  [t]
);

  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '', currency: '', provider: '', category: '',
    paymentStatus: '', startDate: '', endDate: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const isRootAdmin = isCurrentRootAdmin();

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined));
      params.page = pagination.page;
      params.limit = pagination.limit;
      const { data } = await api.get('/api/admin/accounting', { params });
      setEntries(data.entries || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err.response?.data?.message || a('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, a]);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/accounting/summary');
      setSummary(data.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || a('summaryFailed'));
    }
  }, [a]);

  const refresh = useCallback(() => {
    if (!isRootAdmin) return;
    loadEntries();
    loadSummary();
  }, [loadEntries, loadSummary, isRootAdmin]);

  useEffect(() => {
    if (isRootAdmin) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [refresh, isRootAdmin]);

  const updateFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const openCreate = (type) => {
    setEditEntry(null);
    setForm({
      type: type || 'EXPENSE',
      provider: '',
      category: '',
      description: '',
      amount: '',
      currency: 'USD',
      paymentDate: new Date().toISOString().slice(0, 10),
      billingPeriod: '',
      paymentStatus: 'PAID',
      invoiceNumber: '',
      receiptNumber: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      type: entry.type,
      provider: entry.provider || '',
      category: entry.category,
      description: entry.description || '',
      amount: entry.amount,
      currency: entry.currency,
      paymentDate: new Date(entry.paymentDate).toISOString().slice(0, 10),
      billingPeriod: entry.billingPeriod || '',
      paymentStatus: entry.paymentStatus,
      invoiceNumber: entry.invoiceNumber || '',
      receiptNumber: entry.receiptNumber || '',
      notes: entry.notes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditEntry(null); };

  const handleDelete = async (entry) => {
    setDeleteTarget(entry);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/accounting/${deleteTarget.id}`);
setDeleteTarget(null);
await Promise.all([loadEntries(), loadSummary()]);
    } catch (err) {
      setError(err.response?.data?.message || a('deleteFailed'));
    }
  };

  const submitEntry = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (editEntry) {
        await api.patch(`/api/admin/accounting/${editEntry.id}`, payload);
      } else {
        await api.post('/api/admin/accounting', payload);
      }
      closeModal();
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || a('saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const tabTypeFilter = activeTab === 'expenses' ? 'EXPENSE' : activeTab === 'income' ? 'INCOME' : '';

  const filteredEntries = useMemo(() => {
    if (!tabTypeFilter) return entries;
    return entries.filter((e) => e.type === tabTypeFilter);
  }, [entries, tabTypeFilter]);

  const summaryByCurrency = useMemo(() => summary?.byCurrency || [], [summary]);
  const currentMonthByCurrency = useMemo(() => summary?.currentMonthByCurrency || [], [summary]);

  const currencySet = useMemo(() => {
    const set = new Set();
    summaryByCurrency.forEach((c) => set.add(c.currency));
    currentMonthByCurrency.forEach((c) => set.add(c.currency));
    return [...set];
  }, [summaryByCurrency, currentMonthByCurrency]);

  // Summary card component
  const SummaryCard = ({ label, value, tone = 'gray', Icon }) => (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
        {Icon && <Icon size={18} className="text-gray-400" />}
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );


  return (
    <DashboardLayout requiredRole="ADMIN">
      <DashboardHeader title={a('title')} />
      <div className="p-4 md:p-6 lg:p-8 space-y-7" dir="ltr">
        {!isRootAdmin ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-md">
              This page is restricted to Root Administrators only. You do not have the required permissions to view this content.
            </p>
          </div>
        ) : (
          <>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">{a('nav')}</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{a('title')}</h1>
            <p className="mt-2 max-w-2xl text-gray-500">{a('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-2.5 font-semibold text-black disabled:opacity-50">
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />{a('refresh')}
            </button>
            <button onClick={() => openCreate('EXPENSE')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 font-semibold text-white">
              <Plus size={17} />{a('addExpense')}
            </button>
            <button onClick={() => openCreate('INCOME')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 font-semibold text-white">
              <Plus size={17} />{a('addIncome')}
            </button>
          </div>
        </header>

        {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}

        {/* Summary cards (grouped by currency) */}
        <section>
          {loading && !summary ? (
            <div className="py-12 text-center text-gray-500">{a('loading')}</div>
          ) : currencySet.length === 0 ? (
            <div className="py-12 text-center text-gray-500">{a('noData')}</div>
          ) : (
            currencySet.map((currency) => {
              const total = summaryByCurrency.find((c) => c.currency === currency) || { totalIncome: 0, totalExpenses: 0, net: 0 };
              const current = currentMonthByCurrency.find((c) => c.currency === currency) || { currentMonthIncome: 0, currentMonthExpenses: 0, currentMonthNet: 0 };
              return (
                <div key={currency} className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{currency}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <SummaryCard label={a('totalIncome')} value={money(total.totalIncome, currency)} tone={SUMMARY_TONES.income} />
                    <SummaryCard label={a('totalExpenses')} value={money(total.totalExpenses, currency)} tone={SUMMARY_TONES.expenses} />
                    <SummaryCard label={a('net')} value={money(total.net, currency)} tone={SUMMARY_TONES.net} />
                    <SummaryCard label={a('currentMonthNet')} value={money(current.currentMonthNet, currency)} tone={SUMMARY_TONES.month} />
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span>{a('currentMonthIncome')}: {money(current.currentMonthIncome, currency)}</span>
                    <span>{a('currentMonthExpenses')}: {money(current.currentMonthExpenses, currency)}</span>
                    <span>{a('currentMonthNet')}: {money(current.currentMonthNet, currency)}</span>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Tabs */}
        <nav className="flex gap-2">
          {[
            { key: 'all', label: a('tabAll') },
            { key: 'expenses', label: a('tabExpenses') },
            { key: 'income', label: a('tabIncome') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); }}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                activeTab === tab.key
                  ? 'border-yellow-500 bg-yellow-500 text-black shadow-sm hover:bg-yellow-400'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-yellow-400 hover:bg-yellow-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-yellow-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Filters */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <button onClick={() => setFiltersOpen((v) => !v)} className="flex w-full items-center justify-between p-4 md:p-5">
            <span className="flex items-center gap-2 font-semibold">
              <Filter size={18} className="text-yellow-500" />{a('filters')}
            </span>
            <ChevronDown size={18} className={`transition ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          {filtersOpen && (
            <div className="border-t dark:border-gray-700 p-4 md:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <FormField label={a('filterType')} name="type" as="select" value={filters.type} onChange={updateFilter('type')} options={[{ value: '', label: a('allTypes') }, ...TYPE_OPTIONS.map((o) => ({ ...o, label: a(`type_${o.value.toLowerCase()}`) }))]} />
                <FormField label={a('filterCurrency')} name="currency" as="select" value={filters.currency} onChange={updateFilter('currency')} options={[{ value: '', label: a('allCurrencies') }, ...CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))]} />
                <FormField label={a('filterProvider')} name="provider" value={filters.provider} onChange={updateFilter('provider')} placeholder={a('providerPlaceholder')} />
                <FormField label={a('filterCategory')} name="category" value={filters.category} onChange={updateFilter('category')} placeholder={a('categoryPlaceholder')} />
                <FormField label={a('filterStatus')} name="paymentStatus" as="select" value={filters.paymentStatus} onChange={updateFilter('paymentStatus')} options={[{ value: '', label: a('allStatus') }, ...STATUS_OPTIONS.map((o) => ({ ...o, label: a(`status_${o.value.toLowerCase()}`) }))]} />
                <div className="grid grid-cols-2 gap-2">
                  <FormField label={a('filterFrom')} name="startDate" type="date" value={filters.startDate} onChange={updateFilter('startDate')} />
                  <FormField label={a('filterTo')} name="endDate" type="date" value={filters.endDate} onChange={updateFilter('endDate')} />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setFilters({ type: '', currency: '', provider: '', category: '', paymentStatus: '', startDate: '', endDate: '' })} className="text-sm font-semibold text-yellow-600 hover:underline">{a('clearFilters')}</button>
              </div>
            </div>
          )}
        </section>

        {/* Entries table */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-24 text-center text-gray-500">{a('loading')}</div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-20 text-center text-gray-500">{a('noEntries')}</div>
            ) : (
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-4 py-3">{a('colDate')}</th>
                    <th className="px-4 py-3">{a('colType')}</th>
                    <th className="px-4 py-3">{a('colProvider')}</th>
                    <th className="px-4 py-3">{a('colCategory')}</th>
                    <th className="px-4 py-3">{a('colDescription')}</th>
                    <th className="px-4 py-3 text-right">{a('colAmount')}</th>
                    <th className="px-4 py-3">{a('colCurrency')}</th>
                    <th className="px-4 py-3">{a('colStatus')}</th>
                    <th className="px-4 py-3">{a('colReferences')}</th>
                    <th className="px-4 py-3 text-center">{a('colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">{new Date(entry.paymentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${entry.type === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{a(`type_${entry.type.toLowerCase()}`)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.provider || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.category}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={entry.description}>{entry.description || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{money(entry.amount, entry.currency)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.currency}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{a(`status_${entry.paymentStatus.toLowerCase()}`)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                        {entry.invoiceNumber && <span>INV: {entry.invoiceNumber}</span>}
                        {entry.invoiceNumber && entry.receiptNumber && <span> / </span>}
                        {entry.receiptNumber && <span>RC: {entry.receiptNumber}</span>}
                        {!entry.invoiceNumber && !entry.receiptNumber && '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openEdit(entry)} className="p-1 rounded-lg hover:bg-yellow-500/10 text-yellow-600" title={a('edit')}><Edit size={16} /></button>
                          <button onClick={() => handleDelete(entry)} className="p-1 rounded-lg hover:bg-red-500/10 text-red-600" title={a('delete')}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
              <div className="text-xs text-gray-500">
                {a('pageOf', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft size={14} />{a('prev')}
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  {a('next')}<ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editEntry ? a('editEntry') : a('addEntry')}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={a('fieldType')} name="type" as="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={TYPE_OPTIONS.map((o) => ({ ...o, label: a(`type_${o.value.toLowerCase()}`) }))} />
                <FormField label={a('fieldCurrency')} name="currency" as="select" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} options={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))} />
                <FormField label={a('fieldAmount')} name="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                <FormField label={a('fieldPaymentDate')} name="paymentDate" type="date" value={form.paymentDate} onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))} />
                <FormField label={a('fieldPaymentStatus')} name="paymentStatus" as="select" value={form.paymentStatus} onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))} options={STATUS_OPTIONS.map((o) => ({ ...o, label: a(`status_${o.value.toLowerCase()}`) }))} />
                <FormField label={a('fieldProvider')} name="provider" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} placeholder={a('providerPlaceholder')} />
                <FormField label={a('fieldCategory')} name="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder={a('categoryPlaceholder')} />
                <FormField label={a('fieldBillingPeriod')} name="billingPeriod" value={form.billingPeriod} onChange={(e) => setForm((f) => ({ ...f, billingPeriod: e.target.value }))} placeholder={a('billingPeriodPlaceholder')} />
                <FormField label={a('fieldInvoiceNumber')} name="invoiceNumber" value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} placeholder={a('invoicePlaceholder')} />
                <FormField label={a('fieldReceiptNumber')} name="receiptNumber" value={form.receiptNumber} onChange={(e) => setForm((f) => ({ ...f, receiptNumber: e.target.value }))} placeholder={a('receiptPlaceholder')} />
                <FormField label={a('fieldDescription')} name="description" as="textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder={a('descriptionPlaceholder')} />
                <FormField label={a('fieldNotes')} name="notes" as="textarea" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder={a('notesPlaceholder')} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t dark:border-gray-700">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300">{a('cancel')}</button>
              <button onClick={submitEntry} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-2.5 font-semibold text-black disabled:opacity-50">
                <Save size={16} />{submitting ? a('saving') : a('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="p-5 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{a('deleteConfirmTitle')}</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 dark:text-gray-300">{a('deleteConfirmDesc', { type: deleteTarget.type.toLowerCase() })}</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t dark:border-gray-700">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300">{a('cancel')}</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600">{a('delete')}</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminAccounting;
