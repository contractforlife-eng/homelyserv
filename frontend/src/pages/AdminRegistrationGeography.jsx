import React, { useCallback, useEffect, useState } from 'react';
import { Globe2, MapPin, Search, Users, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import SupportLayout from '../layouts/SupportLayout';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

const MetricCard = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className={`inline-flex rounded-xl p-2.5 ${tone}`}><Icon size={21} /></div>
    <p className="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{Number(value || 0).toLocaleString()}</p>
  </div>
);

const localizedCountryName = (countryCode, fallback, language) => {
  if (!countryCode) return fallback;
  try { return new Intl.DisplayNames([language], { type: 'region' }).of(countryCode) || fallback; } catch { return fallback; }
};

export const RegistrationGeographyContent = () => {
  const { t, i18n } = useTranslation();
  const authUser = useAuthStore((state) => state.user);
  const isSupport = authUser?.role?.toUpperCase() === 'SUPPORT';
  const g = (key, options) => t(`registrationGeography.${key}`, options);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', country: '', role: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const loadSummary = useCallback(async () => {
    const response = await api.get('/api/admin/registration-geography/summary');
    setSummary(response.data);
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    const response = await api.get('/api/admin/registration-geography/users', {
      params: { page, limit: 20, search: debouncedSearch || undefined, country: filters.country || undefined, role: filters.role || undefined },
    });
    setRows(response.data.users || []);
    setPagination(response.data.pagination || { page, total: 0, totalPages: 1 });
  }, [debouncedSearch, filters.country, filters.role]);

  useEffect(() => {
    loadSummary().catch((requestError) => setError(requestError.response?.data?.message || t('registrationGeography.loadFailed')));
  }, [loadSummary, t]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadUsers(1)
      .catch((requestError) => active && setError(requestError.response?.data?.message || t('registrationGeography.loadFailed')))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [loadUsers, t]);

  const changeFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));
  const goToPage = async (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.page) return;
    setLoading(true);
    setError('');
    try { await loadUsers(page); } catch (requestError) { setError(requestError.response?.data?.message || g('loadFailed')); } finally { setLoading(false); }
  };

  const availableRoles = ['ADMIN', 'EMPLOYER', 'WORKER', 'SUPPORT', 'SUPPORT_HELPER'];
  const distributionBarColor = isSupport ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <div className="space-y-7 p-4 md:p-6 lg:p-8" dir="ltr">
      <header><h1 className="text-3xl font-bold text-gray-900 dark:text-white">{g('title')}</h1><p className="mt-2 text-gray-500 dark:text-gray-400">{g('subtitle')}</p></header>
      {error && <div className="rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label={g('totalUsers')} value={summary?.totalUsers} tone="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" />
        <MetricCard icon={MapPin} label={g('knownCountry')} value={summary?.knownCountryUsers} tone="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" />
        <MetricCard icon={UserX} label={g('unknownLegacy')} value={summary?.unknownCountryUsers} tone="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" />
        <MetricCard icon={Globe2} label={g('countriesRepresented')} value={summary?.countriesRepresented} tone="bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{g('topCountries')}</h2>
        <div className="mt-5 space-y-4">
          {summary?.countries?.length ? summary.countries.map((country) => (
            <div key={country.countryCode}>
              <div className="mb-1.5 flex items-center justify-between gap-4 text-sm"><span className="font-semibold text-gray-800 dark:text-gray-200">{localizedCountryName(country.countryCode, country.countryName, i18n.language)} <span className="text-gray-400">({country.countryCode})</span></span><span className="whitespace-nowrap text-gray-500">{country.count.toLocaleString()} · {country.percentage.toFixed(2)}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"><div className={`h-full rounded-full ${distributionBarColor}`} style={{ width: `${Math.min(country.percentage, 100)}%` }} /></div>
            </div>
          )) : <p className="text-sm text-gray-500">{g('noCountryData')}</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-5 dark:border-gray-700"><h2 className="text-xl font-bold text-gray-900 dark:text-white">{g('userDetails')}</h2><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input value={filters.search} onChange={changeFilter('search')} maxLength={100} placeholder={g('searchPlaceholder')} className="w-full rounded-xl border border-gray-200 bg-transparent py-2.5 pl-10 pr-3 text-sm dark:border-gray-600" /></label>
          <select value={filters.country} onChange={changeFilter('country')} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-900"><option value="">{g('allCountries')}</option><option value="UNKNOWN">{g('unknown')}</option>{summary?.countries?.map((country) => <option key={country.countryCode} value={country.countryCode}>{localizedCountryName(country.countryCode, country.countryName, i18n.language)} ({country.countryCode})</option>)}</select>
          <select value={filters.role} onChange={changeFilter('role')} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-900"><option value="">{g('allRoles')}</option>{availableRoles.map((role) => <option key={role} value={role}>{g(`roles.${role}`)}</option>)}</select>
        </div></div>

        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40"><tr>{['user','email','role','country','registrationIp','registeredAt'].map((key) => <th key={key} className="px-5 py-3">{g(key)}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-700">{rows.map((user) => <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30"><td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">{user.name}</td><td className="px-5 py-4 text-gray-600 dark:text-gray-300">{user.email}</td><td className="px-5 py-4">{g(`roles.${user.role}`)}</td><td className="px-5 py-4">{user.registrationCountryCode ? `${localizedCountryName(user.registrationCountryCode, user.registrationCountryName, i18n.language)} (${user.registrationCountryCode})` : g('unknown')}</td><td className="px-5 py-4 font-mono text-xs">{user.registrationIp || g('notRecorded')}</td><td className="px-5 py-4 whitespace-nowrap">{new Date(user.createdAt).toLocaleString(i18n.language)}</td></tr>)}</tbody></table></div>
        {!loading && rows.length === 0 && <p className="p-10 text-center text-gray-500">{g('noUsers')}</p>}
        <div className="flex items-center justify-between border-t border-gray-200 p-4 text-sm dark:border-gray-700"><span className="text-gray-500">{g('pageOf', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}</span><div className="flex gap-2"><button disabled={loading || pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">{g('previous')}</button><button disabled={loading || pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">{g('next')}</button></div></div>
      </section>
    </div>
  );
};

const RegistrationGeography = () => {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.user?.role?.toUpperCase());

  if (role === 'SUPPORT') {
    return (
      <SupportLayout allowedRoles={['SUPPORT', 'ADMIN']} headerTitle="registrationGeography.title">
        <RegistrationGeographyContent />
      </SupportLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="ADMIN">
      <DashboardHeader title={t('registrationGeography.title')} variant="admin" />
      <RegistrationGeographyContent />
    </DashboardLayout>
  );
};

export default RegistrationGeography;
