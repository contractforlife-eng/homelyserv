// frontend/src/components/doctor/cms/CmsPatientWorkflow.jsx
// ============================================================
// CMS patient picker.
// Consultations and Prescriptions are patient-scoped workspaces in
// HomelyServ (they live inside the patient file). This component
// lists the doctor's established patients — the SAME
// GET /api/doctors/patients endpoint used by CMS → Patients — and
// routes the doctor into the existing patient-scoped workflow.
//
// It never widens medical access: the list is exactly what the
// existing Doctor patient relationship rules already return.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../utils/api';
import EmptyState from '../../common/EmptyState';
import { UserAvatar } from '../../users';
import {
  Search, Loader2, AlertCircle, ChevronRight, Users, Calendar
} from 'lucide-react';

const localeFor = (language) => (language === 'ar' ? 'ar-EG' : 'en-US');

const CmsPatientWorkflow = ({ buildDestination, continueLabel }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.get('/api/doctors/patients');
      setPatients(Array.isArray(res.data?.patients) ? res.data.patients : []);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorCms.patientsLoadError') || 'Failed to load your patients.'
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => (patient.patientName || '').toLowerCase().includes(query));
  }, [patients, searchQuery]);

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(localeFor(i18n.language), { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-red-600 mb-2" />
        <p className="text-sm text-gray-500">{t('doctorCms.loading') || 'Loading clinic operations...'}</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <p className="text-sm text-rose-700 dark:text-rose-300">{errorMessage}</p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={t('doctorCms.noPatientsYet') || 'No patients with an established relationship yet.'}
        description={t('doctorCms.choosePatientDesc') || 'Select a patient to open this workspace.'}
      />
    );
  }


  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={16} className="text-red-500" />
            {t('doctorCms.choosePatientTitle') || 'Choose a Patient'}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">{patients.length}</span>
        </div>
        <div className="relative">
          <Search size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('doctorCms.patientsSearchPlaceholder') || 'Search patients by name'}
            className="w-full ltr:pl-9 rtl:pr-9 ltr:pr-3 rtl:pl-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-500">
          {t('doctorCms.noPatientsMatch') || 'No patients match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPatients.map((patient) => (
            <button
              key={patient.patientId}
              type="button"
              onClick={() => navigate(buildDestination(patient.patientId))}
              className="text-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:border-red-300 dark:hover:border-red-700 transition-colors flex items-center gap-3"
            >
              <UserAvatar name={patient.patientName} image={patient.profileImage} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {patient.patientName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={12} />
                  {formatDate(patient.lastAppointmentDate)}
                  <span aria-hidden="true">•</span>
                  {patient.totalAppointments} {t('doctorCms.patientAppointmentsCount') || 'Appointments'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 shrink-0">
                {continueLabel || t('doctorCms.continueAction') || 'Continue'}
                <ChevronRight size={14} className="rtl:rotate-180" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CmsPatientWorkflow;
