// frontend/src/pages/DoctorCmsServicesFees.jsx
// ============================================================
// CLINIC MANAGEMENT SYSTEM — SERVICES & FEES
// The doctor controls their own medical service pricing here.
//
// SINGLE SOURCE OF TRUTH: the Examination Fee and Consultation Fee
// are the EXISTING DoctorProfile fields (examinationFee /
// consultationFee) written through the existing endpoint
// PUT /api/doctors/medical-center/fees and read through
// GET /api/doctors/medical-center. The same values are used by the
// Doctor profile and are the values HomelyServ Doctor search
// results display — there is no second pricing source.
//
// Bookable consultation services (name / price / duration) are the
// existing Doctor consultation services and continue to be managed
// by the existing Doctor Center services module.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import api from '../utils/api';
import {
  Tag, Save, Loader2, AlertCircle, CheckCircle2, Info, ExternalLink,
  Stethoscope, Clock, Power
} from 'lucide-react';

// Mirrors the backend rule: non-negative amount, at most 2 decimals.
const FEE_PATTERN = /^(0|[1-9]\d{0,6})(\.\d{1,2})?$/;

const normalizeFeeInput = (value) => String(value ?? '').trim();

const isFeeValid = (value) => {
  const text = normalizeFeeInput(value);
  if (text === '') return true;
  return FEE_PATTERN.test(text);
};

const DoctorCmsServicesFees = () => {
  const { t } = useTranslation();

  const [fees, setFees] = useState({ examinationFee: '', consultationFee: '', currency: 'EGP' });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [servicesError, setServicesError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    setServicesError('');
    const [centerRes, servicesRes] = await Promise.allSettled([
      api.get('/api/doctors/medical-center'),
      api.get('/api/doctors/services')
    ]);

    if (centerRes.status === 'fulfilled') {
      const loaded = centerRes.value.data?.fees || {};
      setFees({
        examinationFee: loaded.examinationFee ?? '',
        consultationFee: loaded.consultationFee ?? '',
        currency: loaded.currency || 'EGP'
      });
    } else {
      setErrorMessage(t('doctorCms.feesError') || 'Failed to update fees.');
    }

    if (servicesRes.status === 'fulfilled') {
      setServices(Array.isArray(servicesRes.value.data?.services) ? servicesRes.value.data.services : []);
    } else {
      setServicesError(t('doctorCms.loadError') || 'Failed to load clinic operations data.');
    }

    setLoading(false);
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveFees = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!isFeeValid(fees.examinationFee) || !isFeeValid(fees.consultationFee)) {
      setErrorMessage(t('doctorCms.feeInvalid') || 'Enter a valid amount (non-negative, max two decimals).');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        examinationFee: fees.examinationFee === '' ? 0 : Number(fees.examinationFee),
        consultationFee: fees.consultationFee === '' ? 0 : Number(fees.consultationFee)
      };
      const res = await api.put('/api/doctors/medical-center/fees', payload);
      const saved = res.data?.fees;
      if (saved) {
        setFees({
          examinationFee: saved.examinationFee ?? '',
          consultationFee: saved.consultationFee ?? '',
          currency: saved.currency || 'EGP'
        });
      }
      setSuccessMessage(t('doctorCms.feesSaved') || 'Fees updated successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorCms.feesError') || 'Failed to update fees.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorCms.servicesFeesTitle') || 'Services & Fees'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <RolePageHeader
          icon={Tag}
          title={t('doctorCms.servicesFeesTitle') || 'Services & Fees'}
          subtitle={t('doctorCms.servicesFeesSubtitle') || 'Your own medical service pricing. HomelyServ members see these values in Doctor search results.'}
        />

        {successMessage ? (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> {successMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        ) : null}

        {/* Examination & consultation fees (authoritative Doctor values) */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Stethoscope size={16} className="text-red-500" />
            {t('doctorCms.feesTitle') || 'Examination & Consultation Fees'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            {t('doctorCms.feesDesc') || 'These fees are the authoritative Doctor-owned values stored in your Doctor profile.'}
          </p>

          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : (
            <form onSubmit={handleSaveFees} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="examinationFee" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('doctorCms.examinationFee') || 'Examination Fee'}
                  </label>
                  <input
                    id="examinationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={fees.examinationFee}
                    onChange={(event) => setFees((prev) => ({ ...prev, examinationFee: event.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label htmlFor="consultationFee" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('doctorCms.consultationFee') || 'Consultation Fee'}
                  </label>
                  <input
                    id="consultationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={fees.consultationFee}
                    onChange={(event) => setFees((prev) => ({ ...prev, consultationFee: event.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Info size={12} />
                {t('doctorCms.currencyNote') || 'Amounts are in EGP (Egyptian Pound).'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving
                    ? (t('doctorCms.savingFees') || 'Saving...')
                    : (t('doctorCms.saveFees') || 'Save Fees')}
                </button>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-md">
                  {t('doctorCms.singleSourceNote') || 'One pricing source: the same values are used by your Doctor profile and by HomelyServ Doctor search results.'}
                </p>
              </div>
            </form>
          )}
        </section>


        {/* Bookable consultation services (existing Doctor services) */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Tag size={16} className="text-red-500" />
                {t('doctorCms.bookableServicesTitle') || 'Bookable Services'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('doctorCms.bookableServicesDesc') || 'Consultation services patients can book with you.'}
              </p>
            </div>
            <Link
              to="/doctor-center"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors shrink-0"
            >
              {t('doctorCms.manageServices') || 'Manage Services'}
              <ExternalLink size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : servicesError ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300">
              {servicesError}
            </div>
          ) : services.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('doctorCenter.noServices') || 'No services configured yet'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {services.map((service) => (
                <li key={service._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-2">
                      {service.serviceName}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        service.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                      }`}>
                        <Power size={9} />
                        {service.isActive
                          ? (t('doctorCenter.active') || 'Active')
                          : (t('doctorCenter.inactive') || 'Inactive')}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <Clock size={12} />
                      {service.durationMinutes} {t('doctorCenter.minutes') || 'min'}
                      <span aria-hidden="true">•</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {service.price} {service.currency || fees.currency || 'EGP'}
                      </span>
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold shrink-0">
                    {service.consultationType}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default DoctorCmsServicesFees;

