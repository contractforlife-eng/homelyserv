import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, ChevronDown, Globe2, Phone, Save, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import CountrySelect from '../components/CountrySelect';
import { getCountryByCode } from '../utils/countries';
import { JOB_OPTIONS } from '../constants/jobOptions';
import { TUTOR_SPECIALIZATIONS } from '../constants/tutorSpecializations';
import { trackTikTokCompleteRegistration } from '../utils/tiktokPixel';

const SocialOnboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const setAuth = useAuthStore((store) => store.setAuth);
  const providerUser = state?.providerUser;
  const onboardingToken = state?.onboardingToken;

  const [formData, setFormData] = useState({
    role: '',
    countryCode: state?.suggestedCountryCode || '',
    phone: '',
    desiredJob: '',
    hourlyRate: '',
    tutorSpecialization: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const tikTokRegistrationTrackedRef = useRef(false);

  useEffect(() => {
    if (formData.countryCode) return;
    try {
      const locales = Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language];
      for (const locale of locales) {
        const region = String(locale || '').split('-')[1]?.trim().toUpperCase();
        const repositoryCode = region === 'GB' ? 'UK' : region;
        if (getCountryByCode(repositoryCode)) {
          setFormData((current) => current.countryCode
            ? current
            : { ...current, countryCode: repositoryCode });
          break;
        }
      }
    } catch {
      // The user can always choose a country manually.
    }
  }, [formData.countryCode]);

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.role) nextErrors.role = t('roleRequired');
    const phone = String(formData.phone || '').trim();
    if (!phone) nextErrors.phone = t('phoneRequired');
    else if (!/^\+?[0-9\s\-().]{7,20}$/.test(phone)) nextErrors.phone = t('phoneInvalid');
    else if (phone.replace(/\D/g, '').length < 7) nextErrors.phone = t('phoneDigits');

    if (!formData.countryCode) nextErrors.countryCode = t('countryRequired');
    else if (!getCountryByCode(formData.countryCode)) nextErrors.countryCode = t('countryInvalid');

    if (formData.role === 'WORKER') {
      if (!formData.desiredJob) nextErrors.desiredJob = t('register.jobRequired');
      else if (!JOB_OPTIONS.some((job) => job.value === formData.desiredJob)) nextErrors.desiredJob = t('register.jobInvalid');

      const rate = Number(formData.hourlyRate);
      if (!String(formData.hourlyRate || '').trim()) nextErrors.hourlyRate = t('register.hourlyRateRequired');
      else if (!Number.isFinite(rate) || rate <= 0) nextErrors.hourlyRate = t('register.hourlyRateInvalid');

      if (formData.desiredJob === 'tutor' && !formData.tutorSpecialization) {
        nextErrors.tutorSpecialization = t('tutorSpecializationRequired');
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onboardingToken || !providerUser || !validate()) return;

    setSubmitting(true);
    try {
      const response = await api.post('/api/oauth/social-onboarding/complete', {
        onboardingToken,
        role: formData.role,
        countryCode: formData.countryCode,
        phone: String(formData.phone).trim(),
        ...(formData.role === 'WORKER' ? {
          desiredJob: formData.desiredJob,
          hourlyRate: formData.hourlyRate,
          ...(formData.desiredJob === 'tutor' ? { tutorSpecialization: formData.tutorSpecialization } : {}),
        } : {}),
      });

      if (!response.data?.success || !response.data?.token || !response.data?.user) {
        throw new Error(response.data?.message || t('registrationFailed'));
      }

      setAuth(response.data.user, response.data.token);
      if (!tikTokRegistrationTrackedRef.current) {
        const tikTokQueued = trackTikTokCompleteRegistration();
        if (tikTokQueued) tikTokRegistrationTrackedRef.current = true;
      }
      if (response.data.user.role?.toUpperCase() === 'EMPLOYER') {
        navigate('/employer-dashboard', { replace: true });
      } else {
        navigate('/worker-dashboard', { replace: true });
      }
    } catch (error) {
      setErrors({ general: error.response?.data?.message || error.message || t('registrationFailed') });
    } finally {
      setSubmitting(false);
    }
  };

  if (!onboardingToken || !providerUser) {
    return (
      <main className="min-h-dvh bg-gradient-to-br from-red-50 via-white to-red-50/30 p-4">
        <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register')}</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t('socialLoginError')}</p>
          <Link to="/login" className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold text-white">{t('login')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-red-50 via-white to-red-50/30 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:p-8">
        <div className="mb-7 flex items-start gap-3">
          <div className="rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-300"><Globe2 size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register')}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{providerUser.fullName} · {providerUser.email}</p>
          </div>
        </div>

        {errors.general && <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{errors.general}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('registerAs')} *</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => updateField('role', 'EMPLOYER')} className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${formData.role === 'EMPLOYER' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'}`}>
                  <User size={19} className="mx-auto mb-1" />
                  {t('employer')}
                </button>
                <button type="button" onClick={() => updateField('role', 'WORKER')} className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${formData.role === 'WORKER' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'}`}>
                  <Briefcase size={19} className="mx-auto mb-1" />
                  {t('jobSeeker')}
                </button>
              </div>
              {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.country')} *</label>
              <CountrySelect
                value={formData.countryCode}
                onChange={({ countryCode }) => updateField('countryCode', countryCode)}
                error={!!errors.countryCode}
              />
              {errors.countryCode && <p className="mt-1 text-sm text-red-500">{errors.countryCode}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('phone')} *</label>
              <div className="relative">
                <Phone size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} className={`w-full rounded-xl border bg-gray-50 py-3.5 pl-10 pr-3 dark:bg-gray-900/80 ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`} placeholder={t('phonePlaceholder')} />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>

            {formData.role === 'WORKER' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('workerOwnProfile.desiredJob')} *</label>
                  <div className="relative">
                    <Briefcase size={17} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <select value={formData.desiredJob} onChange={(event) => updateField('desiredJob', event.target.value)} className={`w-full appearance-none rounded-xl border bg-gray-50 py-3.5 pl-10 pr-10 dark:bg-gray-900/80 ${errors.desiredJob ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}>
                      <option value="">{t('workerOwnProfile.selectJob')}</option>
                      {JOB_OPTIONS.map((job) => <option key={job.value} value={job.value}>{t(`employerSearch.jobs.${job.value}`)}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-3.5 text-gray-400" />
                  </div>
                  {errors.desiredJob && <p className="mt-1 text-sm text-red-500">{errors.desiredJob}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('workerProfile.hourlyRate')} *</label>
                  <input type="number" min="0.01" step="0.01" value={formData.hourlyRate} onChange={(event) => updateField('hourlyRate', event.target.value)} className={`w-full rounded-xl border bg-gray-50 px-3 py-3.5 dark:bg-gray-900/80 ${errors.hourlyRate ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`} placeholder={t('hourlyRatePlaceholder')} />
                  {errors.hourlyRate && <p className="mt-1 text-sm text-red-500">{errors.hourlyRate}</p>}
                </div>
              </>
            )}

            {formData.role === 'WORKER' && formData.desiredJob === 'tutor' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tutorSpecialization')} *</label>
                <select value={formData.tutorSpecialization} onChange={(event) => updateField('tutorSpecialization', event.target.value)} className={`w-full appearance-none rounded-xl border bg-gray-50 px-3 py-3.5 dark:bg-gray-900/80 ${errors.tutorSpecialization ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}>
                  <option value="">{t('selectTutorSpecialization')}</option>
                  {TUTOR_SPECIALIZATIONS.map((specialization) => <option key={specialization.value} value={specialization.value}>{t(specialization.labelKey)}</option>)}
                </select>
                {errors.tutorSpecialization && <p className="mt-1 text-sm text-red-500">{errors.tutorSpecialization}</p>}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={18} />
            {submitting ? t('creatingAccount') : t('register')}
          </button>
        </form>
      </div>
    </main>
  );
};

export default SocialOnboarding;
