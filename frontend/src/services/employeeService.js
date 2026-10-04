// frontend/src/services/employeeService.js
// ============================================================
// EMPLOYEES API CLIENT (shared: Teacher + Doctor)
// ============================================================
// Thin client over the EXISTING (role-generalized) Employees endpoints.
// The backend resolves ownership from the authenticated user and the
// authoritative Hire - the client never sends an owner or worker id.
// ============================================================
import api from '../utils/api';

/** List the authenticated Teacher/Doctor's own employees. */
export const getEmployees = async (params = {}) => {
  const response = await api.get('/api/employees', { params });
  return response.data;
};

/** Edit the salary of one employee the caller owns. */
export const updateEmployeeSalary = async (employeeId, salary) => {
  const response = await api.patch(`/api/employees/${employeeId}/salary`, { salary });
  return response.data;
};

/**
 * Employment lifecycle: activate / deactivate / terminate.
 *
 * These are employment-state operations only - they never change the salary and
 * never touch hire, payment or expense data. Termination is permanent: the
 * employee keeps its record and history but can no longer be reactivated.
 */
const lifecycle = (employeeId, action) =>
  api.patch(`/api/employees/${employeeId}/${action}`).then((response) => response.data);

/** INACTIVE -> ACTIVE. */
export const activateEmployee = (employeeId) => lifecycle(employeeId, 'activate');

/** ACTIVE -> INACTIVE (temporarily; the record and salary are kept). */
export const deactivateEmployee = (employeeId) => lifecycle(employeeId, 'deactivate');

/** ACTIVE/INACTIVE -> TERMINATED (permanent; history is kept). */
export const terminateEmployee = (employeeId) => lifecycle(employeeId, 'terminate');

/**
 * Add a MANUAL employee (staff hired directly, outside the HomelyServ hire
 * flow). The backend derives ownership from the authenticated user, so no owner
 * or worker id is ever sent, and no Offer/Hire/payment is created.
 */
export const createEmployee = async (payload) => {
  const response = await api.post('/api/employees', payload);
  return response.data;
};

const employeeService = {
  getEmployees,
  createEmployee,
  updateEmployeeSalary,
  activateEmployee,
  deactivateEmployee,
  terminateEmployee,
};

export default employeeService;