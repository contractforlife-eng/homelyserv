// frontend/src/components/accounts/EmployeeSalaryList.jsx
// ============================================================
// EMPLOYEE SALARIES (read-only Accounts view: Teacher + Doctor)
// ============================================================
// Shows the caller's OWN employees and the employment salary recorded on the
// employee document - the value created from `hire.agreedSalary` at hire
// acceptance and editable through the existing salary endpoint.
//
// NOT A NEW PAYROLL SYSTEM:
//   - It reads the EXISTING, ownership-scoped GET /api/employees endpoint.
//   - The salary shown is ALWAYS Employee.salary. It is never derived from the
//     15% HomelyServ commission, Hire.totalDue, a payment amount or expenses.
//   - The HomelyServ recruitment commission stays where it belongs: an Expense
//     in the Accounts Expenses area. The two are never mixed here.
//   - Nothing is calculated, settled or paid from this view; historical
//     salary settlements/adjustments are untouched.
//
// OWNERSHIP is enforced server-side by the backend owner scope (ownerUserId with
// the legacy doctorId fallback). This component never sends an owner id and does
// not client-side filter: it simply cannot receive another user's data.
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import employeeService from '../../services/employeeService';
import { Users, ShieldCheck } from 'lucide-react';

const PORTAL_ROLES = ['TEACHER', 'DOCTOR'];

/**
 * Employment lifecycle state, mirroring the backend exactly: `terminatedAt` is
 * the ONLY permanent marker, so a temporary pause is never shown as terminated.
 */
export const employeeLifecycleState = (employee) => {
  if (employee?.terminatedAt) return 'TERMINATED';
  return employee?.isActive === false ? 'INACTIVE' : 'ACTIVE';
};

const STATE_BADGE = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  INACTIVE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  TERMINATED: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
};

/**
 * @param {object} copy - already-resolved i18n strings, so the Teacher and the
 *   Doctor Accounts pages can each use their OWN existing namespace
 *   (teacherAccounts.employeeSalaries.* / doctorCms.*) without this component
 *   hardcoding a namespace.
 */
const EmployeeSalaryList = ({ copy }) => {
  const { t, i18n } = useTranslation();
  const authUser = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const locale = i18n.language || 'en';

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await employeeService.getEmployees();
      setEmployees(Array.isArray(data?.employees) ? data.employees : []);
    } catch (requestError) {
      console.error('Error loading employee salaries:', requestError);
      setEmployees([]);
      setError(copy.loadError || '');
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-red-600">
            <Users size={18} />
          </span>
          {copy.title}
        </h2>
        {copy.subtitle ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.subtitle}</p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{copy.loading}</p>
      ) : employees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{copy.empty}</p>
          {copy.emptyDesc ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{copy.emptyDesc}</p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4 text-start font-semibold">{copy.worker}</th>
                <th className="py-3 px-4 text-start font-semibold">{copy.status}</th>
                <th className="py-3 px-4 text-start font-semibold">{copy.salary}</th>
                <th className="py-3 px-4 text-start font-semibold">{copy.startDate}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const state = employeeLifecycleState(employee);
                return (
                  <tr
                    key={employee._id}
                    className="border-b border-gray-100 dark:border-gray-700/60"
                  >
                    <td className="py-3 px-4">
                      {employee.fullName || employee.jobTitle || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE_BADGE[state]}`}
                      >
                        {copy[`status${state.charAt(0)}${state.slice(1).toLowerCase()}`]}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {employee.salary ?? 0} {employee.currency || 'EGP'}
                    </td>
                    <td className="py-3 px-4">{formatDate(employee.startDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {copy.note ? (
        <p className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-red-600" />
          {copy.note}
        </p>
      ) : null}
    </div>
  );
};

export default EmployeeSalaryList;