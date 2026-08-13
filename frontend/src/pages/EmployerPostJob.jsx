// src/pages/EmployerPostJob.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import jobService from '../services/jobService';

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'freelance'];
const JOB_COMPENSATION_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];
const STRICT_DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;

const normalizeCurrency = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
};

const resolveNewJobCurrency = (user) => {
  const preferred = normalizeCurrency(user?.preferredCurrency);
  if (preferred && JOB_COMPENSATION_CURRENCIES.includes(preferred)) return preferred;

  const effective = normalizeCurrency(user?.effectiveCurrency);
  if (effective && JOB_COMPENSATION_CURRENCIES.includes(effective)) return effective;

  return 'EGP';
};

const parseSalaryInput = (value) => {
  if (value === '') return null;
  if (typeof value !== 'string' || !STRICT_DECIMAL_PATTERN.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const EmployerPostJob = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { t } = useTranslation();

  const editJob = location.state?.editJob || null;

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    compensationCurrency: 'EGP',
    type: 'full-time',
    description: '',
    requirements: [],
    benefits: [],
    contractType: 'Permanent',
    workSchedule: '',
    startDate: '',
    deadline: '',
    isUrgent: false,
    isFeatured: false
  });
  const [requirement, setRequirement] = useState('');
  const [benefit, setBenefit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [compensationDirty, setCompensationDirty] = useState(false);
  const [currencyChangeRequiresAmount, setCurrencyChangeRequiresAmount] = useState(false);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  // Prefill form when editing an existing job
  useEffect(() => {
    if (editJob) {
      const hasLegacyCompensation = editJob.salaryMin !== null && editJob.salaryMin !== undefined ||
        editJob.salaryMax !== null && editJob.salaryMax !== undefined;
      const storedCurrency = normalizeCurrency(editJob.compensationCurrency);
      setFormData({
        title: editJob.jobTitle || '',
        location: editJob.location || '',
        salaryMin: editJob.salaryMin !== null && editJob.salaryMin !== undefined ? String(editJob.salaryMin) : '',
        salaryMax: editJob.salaryMax !== null && editJob.salaryMax !== undefined ? String(editJob.salaryMax) : '',
        compensationCurrency: storedCurrency || (hasLegacyCompensation ? 'EGP' : resolveNewJobCurrency(authUser)),
        type: editJob.employmentType || 'full-time',
        description: editJob.description || '',
        requirements: editJob.requirements || [],
        benefits: editJob.benefits || [],
        contractType: editJob.contractType || 'Permanent',
        workSchedule: editJob.weeklyDaysOff || '',
        startDate: editJob.employmentStartDate ? String(editJob.employmentStartDate).slice(0, 10) : '',
        deadline: editJob.deadline ? String(editJob.deadline).slice(0, 10) : '',
        isUrgent: Boolean(editJob.isUrgent),
        isFeatured: Boolean(editJob.isFeatured)
      });
      setCompensationDirty(false);
      setCurrencyChangeRequiresAmount(false);
    } else {
      setFormData(prev => ({
        ...prev,
        compensationCurrency: resolveNewJobCurrency(authUser)
      }));
    }
  }, [authUser, editJob]);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  const buildPayload = (salaryMin, salaryMax) => {
    const payload = {
      jobTitle: formData.title,
      location: formData.location || null,
      employmentType: EMPLOYMENT_TYPES.includes(formData.type) ? formData.type : 'full-time',
      contractType: formData.contractType || null,
      description: formData.description || null,
      requirements: formData.requirements,
      benefits: formData.benefits,
      weeklyDaysOff: formData.workSchedule || null,
      employmentStartDate: formData.startDate || null,
      deadline: formData.deadline || null,
      isUrgent: Boolean(formData.isUrgent),
      isFeatured: Boolean(formData.isFeatured)
    };

    if (!editJob || compensationDirty) {
      const hasCompensation = salaryMin !== null || salaryMax !== null;
      payload.salaryMin = salaryMin;
      payload.salaryMax = salaryMax;
      payload.compensationCurrency = hasCompensation ? formData.compensationCurrency : null;
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const salaryMin = parseSalaryInput(formData.salaryMin);
    const salaryMax = parseSalaryInput(formData.salaryMax);

    if (salaryMin === undefined || salaryMax === undefined) {
      setError(t('employerPostJob.validateSalaryNumber'));
      return;
    }

    if (salaryMin !== null && salaryMin < 0) {
      setError(t('employerPostJob.validateMinSalary'));
      return;
    }
    if (salaryMax !== null && salaryMax < 0) {
      setError(t('employerPostJob.validateMaxSalary'));
      return;
    }
    if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
      setError(t('employerPostJob.validateSalaryRange'));
      return;
    }
    if ((salaryMin !== null || salaryMax !== null) && !formData.compensationCurrency) {
      setError(t('employerPostJob.validateCompensationCurrency'));
      return;
    }
    if (currencyChangeRequiresAmount && salaryMin === null && salaryMax === null) {
      setError(t('employerPostJob.validateCurrencyReentry'));
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload(salaryMin, salaryMax);

      if (editJob) {
        await jobService.updateJob(editJob.id, payload);
        alert(t('employerPostJob.editSuccess'));
      } else {
        await jobService.createJob(payload);
        alert(t('employerPostJob.success'));
      }

      navigate('/employer-jobs');
    } catch (submitError) {
      console.error('Job submit error:', submitError);
      const serverMessage = submitError.response?.data?.message;
      setError(serverMessage || (editJob ? t('employerPostJob.editError') : t('employerPostJob.error')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'salaryMin' || name === 'salaryMax') {
      setCompensationDirty(true);
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCurrencyChange = (e) => {
    const nextCurrency = e.target.value;
    setCompensationDirty(true);
    setFormData(prev => {
      if (editJob && nextCurrency !== prev.compensationCurrency) {
        const hadCompensation = prev.salaryMin !== '' || prev.salaryMax !== '';
        setCurrencyChangeRequiresAmount(hadCompensation);
        return {
          ...prev,
          salaryMin: '',
          salaryMax: '',
          compensationCurrency: nextCurrency
        };
      }

      return { ...prev, compensationCurrency: nextCurrency };
    });
  };

  const addRequirement = () => {
    if (requirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirement.trim()]
      }));
      setRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addBenefit = () => {
    if (benefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefit.trim()]
      }));
      setBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerPostJob.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={editJob ? t('employerPostJob.editTitle') : t('employerPostJob.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
        <RolePageHeader title={editJob ? t('employerPostJob.editTitle') : t('employerPostJob.title')} subtitle={t('employerPostJob.subtitle')} />

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.jobTitle')}</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={120}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t('employerPostJob.jobTitlePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.location')}</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t('employerPostJob.locationPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.employmentType')}</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="full-time">{t('employerPostJob.employmentTypes.fullTime')}</option>
                <option value="part-time">{t('employerPostJob.employmentTypes.partTime')}</option>
                <option value="contract">{t('employerPostJob.employmentTypes.contract')}</option>
                <option value="freelance">{t('employerPostJob.employmentTypes.freelance')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.salaryMin')}</label>
              <input
                type="number"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleChange}
                min="0"
                step="any"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t('employerPostJob.salaryMinPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.salaryMax')}</label>
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleChange}
                min="0"
                step="any"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t('employerPostJob.salaryMaxPlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.compensationCurrency')}</label>
              <select
                name="compensationCurrency"
                value={formData.compensationCurrency}
                onChange={handleCurrencyChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {JOB_COMPENSATION_CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
              {currencyChangeRequiresAmount && formData.salaryMin === '' && formData.salaryMax === '' && (
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                  {t('employerPostJob.currencyChangeRequiresAmount')}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.jobDescription')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                maxLength={5000}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t('employerPostJob.descriptionPlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.requirements')}</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }}
                  className="flex-1 min-w-[160px] px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={t('employerPostJob.addRequirementPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  {t('employerPostJob.add')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.map((req, index) => (
                  <span key={index} className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 rounded-full text-sm flex items-center gap-1">
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="hover:text-red-600"
                      aria-label={t('employerPostJob.removeRequirement')}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.benefits')}</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBenefit(); } }}
                  className="flex-1 min-w-[160px] px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={t('employerPostJob.addBenefitPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  {t('employerPostJob.add')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((ben, index) => (
                  <span key={index} className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 rounded-full text-sm flex items-center gap-1">
                    {ben}
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="hover:text-red-600"
                      aria-label={t('employerPostJob.removeBenefit')}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.contractType')}</label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="Permanent">{t('employerPostJob.contractTypes.permanent')}</option>
                <option value="Contract">{t('employerPostJob.contractTypes.contract')}</option>
                <option value="Temporary">{t('employerPostJob.contractTypes.temporary')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.workSchedule')}</label>
              <input
                type="text"
                name="workSchedule"
                value={formData.workSchedule}
                onChange={handleChange}
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t('employerPostJob.workSchedulePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.startDate')}</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employerPostJob.deadline')}</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-2 flex gap-6 flex-wrap">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('employerPostJob.isUrgent')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('employerPostJob.isFeatured')}</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (editJob ? t('employerPostJob.saving') : t('employerPostJob.posting')) : (editJob ? t('employerPostJob.saveChanges') : t('employerPostJob.postJob'))}
            </button>
            <button
              type="button"
              onClick={() => navigate('/employer-jobs')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition"
            >
              {t('employerPostJob.cancel')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployerPostJob;
