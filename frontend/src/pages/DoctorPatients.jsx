// frontend/src/pages/DoctorPatients.jsx
// Doctor Patients module.
//
// Displays patients who have confirmed or completed consultations with the authenticated Doctor.
// Non-medical summary only: Display name, profile image, last appointment, total appointments,
// latest status, and navigation to the patient details page.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import api from '../utils/api';
import {
  Users,
  Search,
  Calendar,
  Building2,
  Home,
  Video,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  UserPlus
} from 'lucide-react';

// Shared input styling for the Add Clinic Patient form.
const INPUT_CLS = 'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500';

const DoctorPatients = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Clinic Patients (Phase 1: independent, no HomelyServ account) ----
  const [clinicPatients, setClinicPatients] = useState([]);
  const [clinicError, setClinicError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdNotice, setCreatedNotice] = useState('');
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', dateOfBirth: '', sex: '', address: '', notes: ''
  });

  const resetForm = useCallback(() => {
    setForm({ fullName: '', phone: '', email: '', dateOfBirth: '', sex: '', address: '', notes: '' });
  }, []);

  const loadClinicPatients = useCallback(async () => {
    try {
      setClinicError('');
      const res = await api.get('/api/doctors/clinic-patients');
      setClinicPatients(Array.isArray(res.data?.patients) ? res.data.patients : []);
    } catch (err) {
      setClinicError(
        err.response?.data?.message || t('doctorCms.patientsLoadError') || 'Failed to load clinic patients.'
      );
    }
  }, [t]);

  const handleCreateClinicPatient = useCallback(async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!form.fullName.trim()) {
      setCreateError(t('doctorCms.clinicPatientNameRequired') || 'Full name is required');
      return;
    }

    try {
      setCreating(true);
      const res = await api.post('/api/doctors/clinic-patients', {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth || null,
        sex: form.sex || null,
        address: form.address.trim(),
        notes: form.notes.trim()
      });
      // Close + reset the form, then refresh so the new record is listed.
      setShowAddForm(false);
      resetForm();
      await loadClinicPatients();
      setCreatedNotice(form.fullName.trim());
      setTimeout(() => setCreatedNotice(''), 4000);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create clinic patient.');
    } finally {
      setCreating(false);
    }
  }, [form, loadClinicPatients, resetForm, t]);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.get('/api/doctors/patients');
      setPatients(Array.isArray(res.data?.patients) ? res.data.patients : []);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorPatients.loadError') || 'Failed to load patients.'
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    loadClinicPatients();
  }, [loadClinicPatients]);

  // ---- Unified list (both sources in ONE list) ----
  // The two endpoints return different shapes and different orderings:
  //   - HomelyServ (`/patients`):  `patientName`, ordered by last appointment
  //   - Clinic     (`/clinic-patients`): `fullName`, ordered by createdAt
  // They are combined here WITHOUT changing either backend. `source` is
  // taken from which collection the row came from — never inferred from a
  // name, and never from the other id field.
  const unifiedPatients = useMemo(() => {
    const homely = patients.map((p) => ({
      key: `homely:${p.patientId || p._id}`,
      source: 'HOMELY',
      id: p.patientId || p._id,
      name: p.patientName || p.fullName || '',
      raw: p
    }));
    const clinic = clinicPatients.map((p) => ({
      key: `clinic:${p.patientId || p._id}`,
      source: 'CLINIC',
      id: p.patientId || p._id,
      name: p.fullName || '',
      raw: p
    }));

    // One deterministic ordering for the combined list: alphabetical by
    // the existing display name, with a stable key tiebreak. No clinical
    // ranking is introduced.
    return [...homely, ...clinic].sort((a, b) => {
      const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
      if (byName !== 0) return byName;
      return a.key.localeCompare(b.key);
    });
  }, [patients, clinicPatients]);

  // One search box covers the single unified list.
  const filteredUnified = useMemo(() => {
    if (!searchQuery.trim()) return unifiedPatients;
    const q = searchQuery.toLowerCase().trim();
    return unifiedPatients.filter((row) => row.name.toLowerCase().includes(q));
  }, [unifiedPatients, searchQuery]);

  const formatDob = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB');
  };

  const getStatusBadge = (status) => {
    const map = {
      CONFIRMED: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        label: t('doctorAppointments.statuses.CONFIRMED') || 'Confirmed'
      },
      COMPLETED: {
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        label: t('doctorAppointments.statuses.COMPLETED') || 'Completed'
      }
    };
    const conf = map[status] || {
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      label: status || '—'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${conf.bg}`}>
        {conf.label}
      </span>
    );
  };

  // The `doctorAppointments.consultationTypes.*` keys do not exist in any
  // language, so i18next returned the raw key as the label. `doctorSchedule.types`
  // is the existing dictionary that already renders the correct localized
  // text on the Doctor Appointments page (Arabic CLINIC = كشف في العيادة).
  // Reuse it rather than adding a duplicate dictionary.
  const getConsultationBadge = (type) => {
    if (type === 'CLINIC') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          {t('doctorSchedule.types.CLINIC') || 'Clinic'}
        </span>
      );
    }
    if (type === 'HOME_VISIT') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Home className="w-3.5 h-3.5 text-amber-500" />
          {t('doctorSchedule.types.HOME_VISIT') || 'Home Visit'}
        </span>
      );
    }
    if (type === 'ONLINE') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Video className="w-3.5 h-3.5 text-purple-500" />
          {t('doctorSchedule.types.ONLINE') || 'Online'}
        </span>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('doctorPatients.headerTitle') || 'My Patients'}
        subtitle={
          t('doctorPatients.pageSubtitle') ||
          'Patients with confirmed or completed consultations through HomelyServ.'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{errorMessage}</p>
          </div>
        )}

        {/* Search bar & Stats */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('doctorPatients.searchPlaceholder') || 'Search patients by name...'}
              className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Users className="w-4 h-4 text-blue-500" />
            <span>
              {patients.length + clinicPatients.length} {t('doctorPatients.patients') || 'Patients'}
            </span>
          </div>
        </div>

        {/* Add Clinic Patient — independent record, no HomelyServ account needed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('doctorCms.clinicPatientsTitle') || 'Clinic Patients'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('doctorCms.clinicPatientsDesc')
                  || 'Independent clinic patients you registered. A HomelyServ account is not required.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowAddForm((v) => !v); setCreateError(''); }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <UserPlus size={16} />
              {t('doctorCms.addClinicPatient') || 'Add Patient'}
            </button>
          </div>

          {createdNotice && (
            <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t('doctorCms.clinicPatientCreated') || 'Patient created'}: {createdNotice}
            </p>
          )}

          {showAddForm && (
            <form onSubmit={handleCreateClinicPatient} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('doctorCms.clinicPatientName') || 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder={t('doctorCms.clinicPatientNamePlaceholder') || 'e.g. Ahmed Saber'}
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('doctorCms.clinicPatientPhone') || 'Phone'}
                </label>
                <input type="tel" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={INPUT_CLS} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('doctorCms.clinicPatientEmail') || 'Email'}
                </label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={INPUT_CLS} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('doctorCms.clinicPatientDob') || 'Date of Birth'}
                </label>
                <input type="date" value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  className={INPUT_CLS} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('doctorCms.clinicPatientSex') || 'Sex'}
                </label>
                <select value={form.sex}
                  onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                  className={INPUT_CLS}>
                  <option value="">{t('doctorCms.clinicPatientSexUnset') || 'Not specified'}</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('doctorCms.clinicPatientAddress') || 'Address'}
                </label>
                <input type="text" value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={INPUT_CLS} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('doctorCms.clinicPatientNotes') || 'Notes'}
                </label>
                <textarea rows={2} value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className={INPUT_CLS} />
              </div>

              {createError && (
                <p className="sm:col-span-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {createError}
                </p>
              )}

              <div className="sm:col-span-2 flex items-center gap-2">
                <button type="submit" disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
                  {creating ? <Loader2 size={16} className="animate-spin" /> : null}
                  {t('doctorCms.saveClinicPatient') || 'Save Patient'}
                </button>
                <button type="button"
                  onClick={() => { setShowAddForm(false); setCreateError(''); resetForm(); }}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {t('doctorCms.cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          )}

          {clinicError && (
            <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">{clinicError}</p>
          )}
          {/* Clinic patients are now rendered in the unified list below,
              so this card keeps only the "Add Patient" action. */}
        </div>



        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading patients...</p>
          </div>
        ) : filteredUnified.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <EmptyState
              icon={Users}
              title={
                searchQuery
                  ? t('doctorPatients.patientNotFound') || 'Patient not found'
                  : t('doctorPatients.emptyTitle') || 'No patients yet'
              }
              description={
                searchQuery
                  ? t('doctorPatients.patientNotFoundDesc') || 'No matching patients found for your search query.'
                  : t('doctorPatients.emptyDesc') ||
                    'Patients will appear here once you have confirmed or completed consultations with them.'
              }
            />
          </div>
        ) : (
          // ONE unified list. Each row keeps its own card style, data and
          // detail route; only the source badge is added.
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnified.map((row) => {
              if (row.source === 'CLINIC') {
                const p = row.raw;
                return (
                  <div key={row.key}
                    onClick={() => navigate(`/doctor-cms/clinic-patients/${row.id}`)}
                    className="group bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-red-300 dark:hover:border-red-800 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {(p.fullName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {p.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {[p.sex || null, formatDob(p.dateOfBirth) || null]
                            .filter(Boolean).join(' • ')
                            || (t('doctorCms.clinicPatientSexUnset') || 'Not specified')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                          {t('doctorCms.sourceClinic') || 'Clinic'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          p.isActive !== false
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}>
                          {p.isActive !== false
                            ? (t('doctorCms.clinicPatientActive') || 'Active')
                            : (t('doctorCms.clinicPatientInactive') || 'Inactive')}
                        </span>
                      </div>
                    </div>
                    {p.phone && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-2">{p.phone}</p>
                    )}
                  </div>
                );
              }

              // HomelyServ patient — appointment-derived, card kept intact.
              const patient = row.raw;
              const patientId = row.id;
              return (
                <div
                  key={row.key}
                  onClick={() => navigate(`/doctor-patients/${patientId}`)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Patient identity row */}
                    <div className="flex items-start gap-3">
                      {patient.profileImage ? (
                        <img
                          src={patient.profileImage}
                          alt={patient.patientName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                          {(patient.patientName || 'P').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {patient.patientName || t('doctorPatients.patient')}
                        </h3>
                        {patient.city && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {patient.city}
                            {patient.countryName ? `, ${patient.countryName}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                        {t('doctorCms.sourceHomelyserv') || 'HomelyServ'}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                      {/* Last appointment date */}
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {t('doctorPatients.lastAppointment') || 'Last Appointment'}:
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {patient.lastAppointmentDate
                            ? new Date(patient.lastAppointmentDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : '—'}
                        </span>
                      </div>

                      {/* Total appointments */}
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {t('doctorPatients.totalAppointments') || 'Total Appointments'}:
                        </span>
                        <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {patient.totalAppointments || 0}
                        </span>
                      </div>

                      {/* Latest Status & Consultation Type */}
                      <div className="flex items-center justify-between pt-1">
                        <div>{getStatusBadge(patient.latestStatus)}</div>
                        <div>{getConsultationBadge(patient.latestConsultationType)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card footer CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
                    <span>{t('doctorPatients.viewPatient') || 'View Patient'}</span>
                    <ChevronRight className="w-4 h-4 ml-1 rtl:mr-1 rtl:rotate-180" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPatients;
