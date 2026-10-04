// frontend/src/pages/Employees.jsx
// ============================================================
// EMPLOYEES (shared: Teacher + Doctor portals)
// ============================================================
// Lists the authenticated Teacher/Doctor's own employees and lets them edit
// an employee's salary, using the EXISTING Employee UI language and the
// EXISTING employees translation vocabulary (doctorCms.employees* keys -
// already translated in en/ar/fr/ru/tr/de), so no new strings were added.
//
// Ownership is enforced server-side; this page only ever reads and writes the
// caller's own employees. Salary here is the WORKER employment salary and is
// completely separate from the HomelyServ recruitment commission expense.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import employeeService from '../services/employeeService';
import { Users, Pencil, Check, X, ShieldCheck, UserCheck, PauseCircle, UserX } from 'lucide-react';

const PORTAL_ROLES = ['TEACHER', 'DOCTOR'];

// Employment lifecycle mirrors the backend exactly: `terminatedAt` is the only
// permanent marker, so a temporary pause is never shown as a termination.
const lifecycleStateOf = (employee) => {
  if (employee?.terminatedAt) return 'TERMINATED';
  return employee?.isActive === false ? 'INACTIVE' : 'ACTIVE';
};

const STATE_BADGE = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  INACTIVE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  TERMINATED: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
};

// Employee SOURCE badge. The value comes straight from the backend-provided
// `employee.source` field - nothing is inferred here from the name, salary,
// job title or any id. The chip styling and the labels are reused verbatim from
// My Hires so the two screens always show the same terminology
// ("HomelyServ" / "Manual Hire") with no duplicated keys.
const SourceBadge = ({ source }) => {
  const { t } = useTranslation();
  const isManual = source === 'MANUAL';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
        isManual
          ? 'bg-gray-100 text-gray-700 font-medium dark:bg-white/10 dark:text-gray-300'
          : 'bg-sky-100 text-sky-800 font-semibold dark:bg-sky-500/15 dark:text-sky-300'
      }`}
    >
      {t(
        isManual
          ? 'myHiresPage.manualHires.manualBadge'
          : 'myHiresPage.manualHires.homelyservBadge',
      )}
    </span>
  );
};

const Employees = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Presentation-only role branch. The TEACHER portal must not reuse the Doctor
  // Accounts copy ("Your clinic staff..."), so the header, description and empty
  // state are role-aware. Doctor rendering is left unchanged.
  const role = String(authUser?.role || '').toUpperCase();
  const isTeacher = role === 'TEACHER';
  const title = isTeacher ? t('teacherEmployees.title') : t('doctorCms.employeesTitle');
  const subtitle = isTeacher ? t('teacherEmployees.subtitle') : t('doctorCms.employeesSubtitle');
  const emptyLabel = isTeacher ? t('teacherEmployees.empty') : t('doctorCms.employeesEmpty');

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [salaryDraft, setSalaryDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  // Lifecycle state
  const [busyId, setBusyId] = useState(null);
  const [lifecycleError, setLifecycleError] = useState('');
  const [terminateTarget, setTerminateTarget] = useState(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await employeeService.getEmployees();
      setEmployees(Array.isArray(data?.employees) ? data.employees : []);
    } catch (requestError) {
      console.error('Error loading employees:', requestError);
      setEmployees([]);
      setError(requestError?.response?.data?.message || t('doctorCms.accountsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      setLoading(false);
      return;
    }
    if (PORTAL_ROLES.includes(String(authUser.role || '').toUpperCase())) {
      loadEmployees();
    } else {
      setLoading(false);
    }
  }, [authUser, isAuthenticated, authLoading, loadEmployees]);

  /**
   * Run one employment-lifecycle transition. These calls only change the
   * employment status: they never touch the salary, the hire, the payments or
   * the accounts, so a plain reload afterwards is enough.
   */
  const runLifecycle = async (employee, action) => {
    setBusyId(employee._id);
    setLifecycleError('');
    try {
      if (action === 'activate') await employeeService.activateEmployee(employee._id);
      if (action === 'deactivate') await employeeService.deactivateEmployee(employee._id);
      if (action === 'terminate') await employeeService.terminateEmployee(employee._id);
      setTerminateTarget(null);
      await loadEmployees();
    } catch (requestError) {
      setLifecycleError(
        requestError?.response?.data?.message || t('doctorCms.lifecycle.actionFailed'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (employee) => {
    setEditingId(employee._id);
    setSalaryDraft(employee.salary === null || employee.salary === undefined ? '' : String(employee.salary));
    setSaveError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSalaryDraft('');
    setSaveError('');
  };

  const saveSalary = async (employeeId) => {
    setSaving(true);
    setSaveError('');
    try {
      await employeeService.updateEmployeeSalary(employeeId, salaryDraft);
      cancelEdit();
      await loadEmployees();
    } catch (requestError) {
      setSaveError(requestError?.response?.data?.message || t('doctorCms.accountsSaveError'));
    } finally {
      setSaving(false);
    }
  };
return (
    <DashboardLayout>
      <DashboardHeader
        title={title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isUserPremium(authUser?.id || authUser?.email)}
      />

      <div className="px-4 md:px-6 pb-10 max-w-7xl mx-auto space-y-6">
        {/* Page header in the portal red theme, matching the banner used by the other
            Teacher/Doctor pages. The copy is role-aware (teacherEmployees.* for
            TEACHER, doctorCms.employees* for DOCTOR), so the Teacher never shows
            Doctor clinic wording and vice versa. */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-sm">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={24} />
            {title}
          </h1>
          <p className="text-sm text-red-100 mt-1">{subtitle}</p>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
          </div>
        ) : employees.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6">
            {emptyLabel}
          </p>
        ) : (
          <div className="space-y-3">
            {employees.map((employee) => {
              const isEditing = editingId === employee._id;
              return (
                <div
                  key={employee._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {employee.fullName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {employee.jobTitle || '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('doctorCms.employeeSalary')}: {employee.salary ?? 0}{' '}
                    {employee.currency || 'EGP'}
                  </p>
                  {/* Employment status + the backend-provided source, side by side.
                      Source = how the employee entered the system;
                      Status = current employment lifecycle state. */}
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <SourceBadge source={employee.source} />
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATE_BADGE[lifecycleStateOf(employee)]
                      }`}
                    >
                      {t(`doctorCms.lifecycle.${lifecycleStateOf(employee).toLowerCase()}`)}
                    </span>
                  </span>
                </div>

                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={salaryDraft}
                        onChange={(event) => setSalaryDraft(event.target.value)}
                        aria-label={t('doctorCms.employeeSalary')}
                        className="w-full sm:w-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveSalary(employee._id)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-2"
                        >
                          <Check size={14} />
                          {t('doctorCms.accountsSave')}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          <X size={14} />
                          {t('doctorCms.accountsCancel')}
                        </button>
                      </div>
                      {saveError ? (
                        <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 self-start">
                      {lifecycleStateOf(employee) === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => runLifecycle(employee, 'deactivate')}
                          disabled={busyId === employee._id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-60 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          <PauseCircle size={14} />
                          {t('doctorCms.lifecycle.deactivate')}
                        </button>
                      ) : null}

                      {lifecycleStateOf(employee) === 'INACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => runLifecycle(employee, 'activate')}
                          disabled={busyId === employee._id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-60 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          <UserCheck size={14} />
                          {t('doctorCms.lifecycle.activate')}
                        </button>
                      ) : null}

                      {lifecycleStateOf(employee) !== 'TERMINATED' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLifecycleError('');
                            setTerminateTarget(employee);
                          }}
                          disabled={busyId === employee._id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/60 disabled:opacity-60 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400"
                        >
                          <UserX size={14} />
                          {t('doctorCms.lifecycle.terminate')}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => startEdit(employee)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2"
                      >
                        <Pencil size={14} />
                        {t('doctorCms.accountsEdit')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {lifecycleError ? (
          <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {lifecycleError}
          </p>
        ) : null}

        <p className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-red-600" />
          {t('doctorCms.employeeSalaryNote')}
        </p>
      </div>

      {/* Termination confirmation: permanent from an employment point of view,
          but nothing is deleted and no history is lost. */}
      {terminateTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('doctorCms.lifecycle.terminateTitle')}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t('doctorCms.lifecycle.terminateBody')}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTerminateTarget(null)}
                disabled={busyId === terminateTarget._id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-60"
              >
                {t('doctorCms.lifecycle.terminateCancel')}
              </button>
              <button
                type="button"
                onClick={() => runLifecycle(terminateTarget, 'terminate')}
                disabled={busyId === terminateTarget._id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
              >
                <UserX size={14} />
                {t('doctorCms.lifecycle.terminateConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default Employees;
