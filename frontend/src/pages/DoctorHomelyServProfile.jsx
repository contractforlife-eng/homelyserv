// frontend/src/pages/DoctorHomelyServProfile.jsx
// ============================================================
// HOMELYSERV MODULE — MY HOMELYSERV PROFILE
// A read-only preview of how HomelyServ members will see the
// doctor in HomelyServ Doctor search results.
//
// Every displayed value comes from the existing Doctor profile,
// clinic, and Services & Fees records — this page introduces no new
// data source and no new pricing. The Employer Search itself is NOT
// modified in this phase.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import api from '../utils/api';
import { getDoctorSpecialtyLabel } from '../constants/doctorSpecialties';
import { getDisplayName } from '../utils/userDisplay';
import {
  BadgeCheck, Loader2, AlertCircle, Info, MapPin, Building2, Stethoscope,
  ArrowRight, User
} from 'lucide-react';

const DoctorHomelyServProfile = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore((state) => state.user);

  const [profile, setProfile] = useState(null);
  const [fees, setFees] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [profileRes, centerRes, clinicsRes] = await Promise.allSettled([
        api.get('/api/doctors/profile'),
        api.get('/api/doctors/medical-center'),
        api.get('/api/doctors/clinics')
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data?.profile || null);
      if (centerRes.status === 'fulfilled') setFees(centerRes.value.data?.fees || null);
      if (clinicsRes.status === 'fulfilled') {
        setClinics(Array.isArray(clinicsRes.value.data?.clinics) ? clinicsRes.value.data.clinics : []);
      }

      if ([profileRes, centerRes, clinicsRes].every((result) => result.status === 'rejected')) {
        setLoadError(t('doctorCms.profileLoadError') || 'Failed to load your HomelyServ profile preview.');
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const activeClinics = useMemo(() => clinics.filter((clinic) => clinic.isActive !== false), [clinics]);
  const primaryClinic = useMemo(
    () => activeClinics.find((clinic) => clinic.isPrimary === true) || activeClinics[0] || null,
    [activeClinics]
  );

  const specialtyLabel = getDoctorSpecialtyLabel(
    profile?.specialty,
    profile?.subspecialtyCustom || profile?.customSpecialty || '',
    t
  );

  const displayName = getDisplayName(authUser) || authUser?.fullName || '';
  const currency = fees?.currency || 'EGP';
  const locationLabel = [primaryClinic?.city, primaryClinic?.countryCode].filter(Boolean).join(', ');

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorCms.profileTitle') || 'My HomelyServ Profile'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <RolePageHeader
          icon={BadgeCheck}
          title={t('doctorCms.profileTitle') || 'My HomelyServ Profile'}
          subtitle={t('doctorCms.profileSubtitle') || 'Preview of your public card in HomelyServ Doctor search results.'}
        />

        {loadError ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{loadError}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-red-600 mb-2" />
            <p className="text-sm text-gray-500">{t('doctorCms.loading') || 'Loading clinic operations...'}</p>
          </div>
        ) : (
          <>
            {/* Public card preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                  {authUser?.profileImage ? (
                    <img
                      src={authUser.profileImage}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {displayName ? `Dr. ${displayName}` : '—'}
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <Stethoscope size={14} />
                    {specialtyLabel || (t('doctorCms.profileNoSpecialty') || 'Specialty not set')}
                  </p>
                  {locationLabel ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1.5">
                      <MapPin size={12} />
                      {locationLabel}
                    </p>
                  ) : null}
                  {primaryClinic?.clinicName ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                      <Building2 size={12} />
                      {primaryClinic.clinicName}
                      {primaryClinic.addressLine ? ` — ${primaryClinic.addressLine}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                      <Building2 size={12} />
                      {t('doctorCms.profileNoClinic') || 'No clinic added yet'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('doctorCms.profileExaminationFee') || 'Examination Fee'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {Number(fees?.examinationFee) || 0} {currency}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('doctorCms.profileConsultationFee') || 'Consultation Fee'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {Number(fees?.consultationFee) || 0} {currency}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-start gap-3">
              <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('doctorCms.profilePreviewNote') || 'These values come from your Doctor profile and Services & Fees. Update them there if something needs to change.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/doctor-profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                {t('doctorCms.profileManage') || 'Manage Doctor Profile'}
                <ArrowRight size={16} className="rtl:rotate-180" />
              </Link>
              <Link
                to="/doctor-cms/services"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                {t('doctorCms.servicesFeesTitle') || 'Services & Fees'}
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorHomelyServProfile;

