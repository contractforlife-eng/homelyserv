// src/pages/PortalHires.jsx - TEACHER + DOCTOR HIRES (My Hires)
// ============================================================
// Hiring-management view for the Teacher and Doctor portals.
//
// REUSES THE EXISTING CANONICAL HIRING LIFECYCLE - no new hire model,
// endpoint or lifecycle is introduced:
//   GET /api/hires/offers    -> the offers THIS user sent
//                               (pending / accepted / declined)
//   GET /api/hires/my-hires  -> the Hire records that exist because a
//                               Worker accepted one of those offers
// Both endpoints scope strictly to the authenticated caller's own records
// (employerId = req.userId), so a Teacher/Doctor only ever sees their own
// hiring activity.
//
// OUT OF SCOPE (separate follow-up tasks): payments, 15% commission,
// commission UI, expense creation, employee records, salary editing, payroll.
// This page is therefore read-only: it lists and reports, and never mutates
// offers or hires.
//
// Reuses existing hiring translation keys (myHiresPage.*, workerOffers.status.*)
// so no new strings were introduced.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import hireService from '../services/hireService';
import employeeService from '../services/employeeService';
import { employeeLifecycleState } from '../components/accounts/EmployeeSalaryList';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { formatCompensationAmount } from '../utils/compensationDisplay';
import {
  Briefcase,
  CheckCircle,
  RefreshCw,
  Search as SearchIcon,
  Users,
  XCircle,
} from 'lucide-react';

const PORTAL_ROLES = ['TEACHER', 'DOCTOR'];

// Canonical Offer statuses written by the existing lifecycle:
// offerService.createOffer -> 'pending'; respondToOffer -> 'accepted' | 'rejected'.
const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};

// Canonical Hire statuses (mirror the Employer My Hires page).
const HIRE_STATUS = {
  OFFER_SENT: 'offer_sent',
  ACTIVE: 'active',
  TERMINATED: 'terminated'
};

// Collapse legacy / alias values into the canonical ones (same rule as MyHires).
const normalizeHireStatus = (status) => {
  switch (status) {
    case 'hired':
    case 'accepted':
    case 'completed':
      return HIRE_STATUS.ACTIVE;
    case 'pending':
      return HIRE_STATUS.OFFER_SENT;
    case 'cancelled':
    case 'canceled':
      return HIRE_STATUS.TERMINATED;
    case HIRE_STATUS.OFFER_SENT:
    case HIRE_STATUS.ACTIVE:
    case HIRE_STATUS.TERMINATED:
      return status;
    default:
      return status || HIRE_STATUS.OFFER_SENT;
  }
};
const PortalHires = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [hires, setHires] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    fullName: '', jobTitle: '', salary: '', currency: 'EGP', startDate: '', notes: '',
  });
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const locale = i18n.language || 'en';

  // ============================================================
  // LOAD — both endpoints are the existing ones and are already
  // scoped to the authenticated caller on the server.
  // ============================================================
  const loadHiringActivity = useCallback(async () => {
    setLoading(true);
    try {
      const [offersData, hiresData] = await Promise.all([
        hireService.getOffers(),
        hireService.getMyHires(),
      ]);
      setOffers(Array.isArray(offersData) ? offersData : []);
      setHires(Array.isArray(hiresData) ? hiresData : []);

      // Owner-scoped employees are loaded alongside the hires so the SAME view
      // can show HomelyServ hires AND manually added staff. The endpoint already
      // scopes to the authenticated Teacher/Doctor, so no owner id is sent.
      try {
        const employeesData = await employeeService.getEmployees();
        setEmployees(Array.isArray(employeesData?.employees) ? employeesData.employees : []);
      } catch (employeeError) {
        console.error('Error loading employees:', employeeError);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading hires:', error);
      setOffers([]);
      setHires([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login', { replace: true });
      return;
    }
    if (!PORTAL_ROLES.includes(String(authUser.role || '').toUpperCase())) {
      navigate('/login', { replace: true });
      return;
    }
    loadHiringActivity();
  }, [authUser, isAuthenticated, authLoading, navigate, loadHiringActivity]);

  // ============================================================
  // DERIVED LISTS — same statuses the backend already writes.
  // A Hire only exists when a Worker accepted, so the Accepted
  // Hires list is exactly the Hire records.
  // ============================================================
  const matchesSearch = (item) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [item.workerName, item.jobTitle]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  };

  const pendingOffers = useMemo(
    () => offers.filter((o) => String(o.status) === OFFER_STATUS.PENDING && matchesSearch(o)),
    [offers, searchTerm],
  );

  const declinedOffers = useMemo(
    () => offers.filter((o) => String(o.status) === OFFER_STATUS.REJECTED && matchesSearch(o)),
    [offers, searchTerm],
  );

  const acceptedHires = useMemo(
    () => hires.filter((h) => matchesSearch(h)),
    [hires, searchTerm],
  );

  // Source is DERIVED from the record, exactly like the backend does:
  // a hireId means the record came from the HomelyServ hire flow; no hireId
  // means staff the Teacher/Doctor added directly.
  const resolveSource = (item) =>
    (item?.source === 'MANUAL' || !item?.hireId) ? 'MANUAL' : 'HOMELYSERV';

  // A HomelyServ employee already appears through its Hire row, so only
  // genuinely manual employees are added to this view.
  const manualEmployees = useMemo(
    () => employees.filter((e) => resolveSource(e) === 'MANUAL' && matchesSearch(e)),
    [employees, searchTerm],
  );

  const offerStatusLabel = (status) => {
    const key = `workerOffers.status.${status}`;
    return t(key, { defaultValue: t('workerOffers.status.pending') });
  };

  const hireStatusLabel = (status) => {
    const normalized = normalizeHireStatus(status);
    const key = `myHiresPage.status.${normalized}`;
    return t(key, { defaultValue: t('myHiresPage.status.unknown') });
  };

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return '—';
    }
  };

  const workerNameOf = (item) => item?.workerName || t('myHiresPage.fallbacks.unknownWorker');

  const sectionHeading = (icon, label, count) => (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span className="text-red-600">{icon}</span>
        {label}
      </h2>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{count}</span>
    </div>
  );

  // ============================================================
  // PAY THE HOMELY SERV COMMISSION
  // Reuses the EXISTING checkout page and payment endpoints. The
  // amount is cosmetic only: the backend re-derives the authoritative
  // total from the Hire and re-checks hire ownership, so a client
  // value can neither change nor inflate what is charged.
  // ============================================================
  const hireNeedsPayment = (hire) =>
    String(hire?.paymentStatus || '').toLowerCase() !== 'completed';

  const handlePay = (hire) => {
    const hiresPath = String(authUser?.role || '').toUpperCase() === 'DOCTOR'
      ? '/doctor-hires'
      : '/teacher-hires';

    navigate('/payment-options', {
      state: {
        pendingPayment: {
          paymentId: hire.id || hire.hireId,
          amount: Number(hire.totalDue ?? 0),
          fullSalary: Number(hire.agreedSalary ?? 0),
          workerName: hire.workerName,
          workerId: hire.workerId,
          workerEmail: hire.workerEmail || '',
          jobTitle: hire.jobTitle || '',
          description: hire.jobTitle || '',
          paymentType: 'commission',
          offerId: hire.offerId,
          hireId: hire.id || hire.hireId,
          employerId: authUser?.id || authUser?.email,
          employerName: authUser?.fullName || '',
          returnTo: hiresPath,
        },
        worker: {
          workerId: hire.workerId,
          workerName: hire.workerName,
          workerEmail: hire.workerEmail || '',
          workerPhone: hire.workerPhone || '',
          workerLocation: hire.workerLocation || '',
          desiredJob: hire.jobTitle || '',
          fullSalary: hire.agreedSalary || 0,
          workerSkills: hire.workerSkills || [],
          rating: hire.workerRating ?? null,
          profileImage: hire.workerImage || '',
          offerId: hire.offerId,
        },
      },
    });
  };
  // Source badge: how this record entered the system. Deliberately distinct
  // from the employment-status badge, which lives beside it.
  const sourceBadge = (source) =>
    source === 'MANUAL' ? (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300">
        {t('myHiresPage.manualHires.manualBadge')}
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
        {t('myHiresPage.manualHires.homelyservBadge')}
      </span>
    );

  const submitManualEmployee = async (event) => {
    event.preventDefault();
    setManualSaving(true);
    setManualError('');
    try {
      // Only employment fields. No worker id, no offer, no hire, no payment.
      await employeeService.createEmployee({
        fullName: manualForm.fullName,
        jobTitle: manualForm.jobTitle,
        salary: manualForm.salary,
        currency: manualForm.currency,
        startDate: manualForm.startDate,
        notes: manualForm.notes,
      });
      setShowManualForm(false);
      setManualForm({ fullName: '', jobTitle: '', salary: '', currency: 'EGP', startDate: '', notes: '' });
      await loadHiringActivity();
    } catch (error) {
      setManualError(error?.response?.data?.message || t('myHiresPage.manualHires.formError'));
    } finally {
      setManualSaving(false);
    }
  };

  // Manual employees reuse the EXISTING employee lifecycle endpoints.
  const runManualLifecycle = async (employee, action) => {
    try {
      if (action === 'activate') await employeeService.activateEmployee(employee._id);
      if (action === 'deactivate') await employeeService.deactivateEmployee(employee._id);
      if (action === 'terminate') await employeeService.terminateEmployee(employee._id);
      await loadHiringActivity();
    } catch (error) {
      console.error('Error updating manual employee:', error);
    }
  };

  // Employee lifecycle controls, shared by HomelyServ and Manual rows.
  // It reuses the EXISTING employeeService lifecycle calls through the existing
  // runManualLifecycle() handler - no new endpoint, no new handler, and the
  // canonical lifecycle rules are untouched. A TERMINATED employee gets no
  // Activate/Deactivate control, exactly as on the Employees page.
  const lifecycleActions = (employee) => {
    if (!employee) return null;
    const state = employeeLifecycleState(employee);

    if (state === 'TERMINATED') {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
          {t('doctorCms.lifecycle.terminated')}
        </span>
      );
    }

    const btn = 'inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium';
    return (
      <>
        {state === 'ACTIVE' ? (
          <button
            type="button"
            onClick={() => runManualLifecycle(employee, 'deactivate')}
            className={`${btn} border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300`}
          >
            {t('doctorCms.lifecycle.deactivate')}
          </button>
        ) : null}
        {state === 'INACTIVE' ? (
          <button
            type="button"
            onClick={() => runManualLifecycle(employee, 'activate')}
            className={`${btn} border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300`}
          >
            {t('doctorCms.lifecycle.activate')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => runManualLifecycle(employee, 'terminate')}
          className={`${btn} border-red-200 text-red-600 dark:border-red-900/60 dark:text-red-400`}
        >
          {t('doctorCms.lifecycle.terminate')}
        </button>
      </>
    );
  };

  // Canonical Hire -> Employee lookup for HOMELYSERV hires.
  // The backend already created the Employee when the Worker accepted, and it
  // stores the originating Hire in `employee.hireId`. That existing id is the
  // ONLY thing used here - never the name, salary, job title or any text.
  const employeeByHireId = useMemo(() => {
    const map = new Map();
    for (const employee of employees) {
      const key = employee?.hireId;
      if (key === null || key === undefined || String(key).trim() === '') continue;
      map.set(String(key), employee);
    }
    return map;
  }, [employees]);

  // One row per record. `kind` decides the icon/colour and the status text.
  const recordRow = (item, statusText, tone, action = null) => {
    const toneClasses =
      tone === 'pending'
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
        : tone === 'declined'
          ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300';

    return (
      <div
        key={item.id || item.hireId || `${item.workerId}-${item.createdAt}`}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {workerNameOf(item)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {item.jobTitle || '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {formatCompensationAmount(item.salary ?? item.agreedSalary, item)}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {formatDate(item.createdAt)}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses}`}>
            {statusText}
          </span>
          {tone === 'accepted' ? sourceBadge('HOMELYSERV') : null}
          {action}
        </div>
      </div>
    );
  };

  const emptyBlock = (label) => (
    <p className="text-sm text-gray-500 dark:text-gray-400 py-3">{label}</p>
  );

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('myHiresPage.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
      />

      <div className="px-4 md:px-6 pb-10 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('myHiresPage.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('myHiresPage.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={loadHiringActivity}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            <RefreshCw size={16} />
            {t('myHiresPage.refresh')}
          </button>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t('workerOffers.status.pending'), value: pendingOffers.length, icon: Briefcase },
            { label: t('workerOffers.status.accepted'), value: acceptedHires.length, icon: CheckCircle },
            { label: t('workerOffers.status.rejected'), value: declinedOffers.length, icon: XCircle },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Manual Employee */}
        <button
          type="button"
          onClick={() => { setManualError(''); setShowManualForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/60 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400"
        >
          <Briefcase size={16} />
          {t('myHiresPage.manualHires.addBtn')}
        </button>

        {/* Search */}
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('myHiresPage.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
          </div>
        ) : (
          <>
            {/* Pending Offers */}
            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              {sectionHeading(<Briefcase size={18} />, t('workerOffers.status.pending'), pendingOffers.length)}
              {pendingOffers.length === 0 ? (
                emptyBlock(t('myHiresPage.empty.title'))
              ) : (
                <div className="space-y-3">
                  {pendingOffers.map((offer) =>
                    recordRow(offer, offerStatusLabel(offer.status), 'pending'),
                  )}
                </div>
              )}
            </section>

            {/* Accepted Hires */}
            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              {sectionHeading(<Users size={18} />, t('workerOffers.status.accepted'), acceptedHires.length)}
              {acceptedHires.length === 0 ? (
                emptyBlock(t('myHiresPage.empty.title'))
              ) : (
                <div className="space-y-3">
                  {acceptedHires.map((hire) => {
                      // The Employee that already exists for this Hire (the
                      // backend created it on acceptance). Canonical hireId link.
                      const employee = employeeByHireId.get(String(hire.id ?? hire.hireId));
                      return recordRow(
                        hire,
                        hireStatusLabel(hire.status),
                        'accepted',
                        <>
                          {/* Pay Commission only while it is genuinely unpaid. */}
                          {hireNeedsPayment(hire) ? (
                            <button
                              type="button"
                              onClick={() => handlePay(hire)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
                            >
                              {/* `paymentOptionsPage.payNow` is the label used on the
                                  Payment Options page this button opens, and it
                                  resolves in all six locales. `myHiresPage.payNow`
                                  and `employerPayments.payNow` do not exist. */}
                              {t('paymentOptionsPage.payNow')}
                            </button>
                          ) : null}
                          {/* Once the Worker has become an Employee, the canonical
                              employee lifecycle controls are available - both
                              before and after payment. */}
                          {lifecycleActions(employee)}
                        </>,
                      );
                    })}
                </div>
              )}
            </section>

            {/* Manual Employees — staff hired directly, outside the HomelyServ
                hire flow. No Offer, no Hire, no payment, no commission. */}
            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              {sectionHeading(<Briefcase size={18} />, t('myHiresPage.manualHires.sectionTitle'), manualEmployees.length)}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t('myHiresPage.manualHires.sectionSubtitle')}
              </p>
              {manualEmployees.length === 0 ? (
                <div className="py-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('myHiresPage.manualHires.emptyTitle')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {t('myHiresPage.manualHires.emptyDesc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {manualEmployees.map((employee) => {
                    const state = employeeLifecycleState(employee);
                    return (
                      <div
                        key={employee._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {employee.fullName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {employee.jobTitle || '—'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {formatCompensationAmount(employee.salary, employee)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {formatDate(employee.startDate)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              state === 'TERMINATED'
                                ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                                : state === 'INACTIVE'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                            }`}
                          >
                            {t(`doctorCms.lifecycle.${state.toLowerCase()}`)}
                          </span>
                          {sourceBadge('MANUAL')}
                          {/* Employee actions only — never Pay Commission. */}
                          {state === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => runManualLifecycle(employee, 'deactivate')}
                              className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              {t('doctorCms.lifecycle.deactivate')}
                            </button>
                          ) : null}
                          {state === 'INACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => runManualLifecycle(employee, 'activate')}
                              className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              {t('doctorCms.lifecycle.activate')}
                            </button>
                          ) : null}
                          {state !== 'TERMINATED' ? (
                            <button
                              type="button"
                              onClick={() => runManualLifecycle(employee, 'terminate')}
                              className="inline-flex items-center rounded-lg border border-red-200 dark:border-red-900/60 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400"
                            >
                              {t('doctorCms.lifecycle.terminate')}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Declined Offers */}
            <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              {sectionHeading(<XCircle size={18} />, t('workerOffers.status.rejected'), declinedOffers.length)}
              {declinedOffers.length === 0 ? (
                emptyBlock(t('myHiresPage.empty.title'))
              ) : (
                <div className="space-y-3">
                  {declinedOffers.map((offer) =>
                    recordRow(offer, offerStatusLabel(offer.status), 'declined'),
                  )}
                </div>
              )}
            </section>

            {pendingOffers.length === 0 &&
              acceptedHires.length === 0 &&
              declinedOffers.length === 0 &&
              searchTerm.trim() &&
              emptyBlock(t('myHiresPage.noResults'))}
          </>
        )}

        {/* Add Manual Employee modal — employment details only. */}
        {showManualForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <form
              onSubmit={submitManualEmployee}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('myHiresPage.manualHires.addTitle')}
              </h3>
              {manualError ? (
                <p className="text-sm text-red-600 dark:text-red-400">{manualError}</p>
              ) : null}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('myHiresPage.manualHires.fullName')}
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={manualForm.fullName}
                  onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('myHiresPage.manualHires.jobTitle')}
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={manualForm.jobTitle}
                  onChange={(e) => setManualForm({ ...manualForm, jobTitle: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('myHiresPage.manualHires.salary')}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={manualForm.salary}
                    onChange={(e) => setManualForm({ ...manualForm, salary: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('myHiresPage.manualHires.currency')}
                  </label>
                  <input
                    type="text"
                    value={manualForm.currency}
                    onChange={(e) => setManualForm({ ...manualForm, currency: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('myHiresPage.manualHires.startDate')}
                </label>
                <input
                  type="date"
                  required
                  value={manualForm.startDate}
                  onChange={(e) => setManualForm({ ...manualForm, startDate: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('myHiresPage.manualHires.notes')}
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t('myHiresPage.terminate.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
                >
                  {t('myHiresPage.manualHires.addSubmit')}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default PortalHires;