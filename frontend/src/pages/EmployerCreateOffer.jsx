// src/pages/EmployerCreateOffer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { UserDisplayName } from '../components/users';
import {
  ArrowLeft,
  User,
  Briefcase,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  Send,
  AlertCircle
} from 'lucide-react';
import hireService from '../services/hireService';

const OFFER_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];
const resolveInitialCurrency = (user) => {
  const preferred = typeof user?.preferredCurrency === 'string' ? user.preferredCurrency.toUpperCase() : '';
  const effective = typeof user?.effectiveCurrency === 'string' ? user.effectiveCurrency.toUpperCase() : '';
  if (OFFER_CURRENCIES.includes(preferred)) return preferred;
  if (OFFER_CURRENCIES.includes(effective)) return effective;
  return 'EGP';
};

const EmployerCreateOffer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { t } = useTranslation();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const currencyTouchedRef = useRef(false);

  const [formData, setFormData] = useState({
    compensationCurrency: resolveInitialCurrency(authUser),
    hourlyRate: '',
    monthlySalary: '',
    workingHoursPerDay: '',
    workingDaysPerWeek: '',
    weeklyDaysOff: '',
    workStartTime: '',
    workEndTime: '',
    employmentStartDate: '',
    additionalNotes: ''
  });

  useEffect(() => {
    if (!currencyTouchedRef.current && authUser) {
      setFormData(prev => ({ ...prev, compensationCurrency: resolveInitialCurrency(authUser) }));
    }
  }, [authUser]);

  // Load worker data from location state
  useEffect(() => {
    const workerData = location.state?.worker;
    
    if (workerData) {
      setWorker(workerData);
    } else {
      // No worker data in navigation state
      console.warn('No worker data provided in navigation state');
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'compensationCurrency') currencyTouchedRef.current = true;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    const requiredFields = [
      'hourlyRate',
      'monthlySalary',
      'workingHoursPerDay',
      'workingDaysPerWeek',
      'weeklyDaysOff',
      'workStartTime',
      'workEndTime',
      'employmentStartDate'
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(t('employerCreateOffer.validation.requiredField', {
          field: t(`employerCreateOffer.fields.${field}`)
        }));
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!worker || !authUser) {
      setError(t('employerCreateOffer.noWorkerData'));
      return;
    }

    setSubmitting(true);

    try {
      const offerData = {
        employerId: authUser.id || authUser.email,
        workerId: worker.id || worker.email,
        workerName: worker.fullName,
        workerEmail: worker.email,
        workerPhone: worker.phone || '',
        workerLocation: worker.location || 'Not specified',
        workerRating: worker.rating || 4.5,
        workerSkills: worker.skills || [],
        workerImage: worker.profileImage || '',
        employerName: authUser.fullName || 'Employer',
        employerEmail: authUser.email,
        jobTitle: worker.desiredJob || 'Service Provider',
        hourlyRate: formData.hourlyRate,
        compensationCurrency: formData.compensationCurrency,
        monthlySalary: parseFloat(formData.monthlySalary),
        workingHoursPerDay: parseFloat(formData.workingHoursPerDay),
        workingDaysPerWeek: parseFloat(formData.workingDaysPerWeek),
        weeklyDaysOff: parseFloat(formData.weeklyDaysOff),
        workStartTime: formData.workStartTime,
        workEndTime: formData.workEndTime,
        employmentStartDate: formData.employmentStartDate,
        additionalNotes: formData.additionalNotes,
        agreedSalary: formData.monthlySalary,
        description: `Job offer for ${worker.fullName} as ${worker.desiredJob || 'Service Provider'}`,
        message: `Job offer for ${worker.fullName} as ${worker.desiredJob || 'Service Provider'}`,
        status: 'pending'
      };

      const response = await hireService.sendOffer(offerData);

      if (response.success) {
        alert(t('employerCreateOffer.success'));
        navigate('/employer-payments', {
          state: {
            offerCreated: true,
            workerName: worker.fullName,
            workerId: worker.id || worker.email
          }
        });
      } else {
        throw new Error(response.message || t('employerCreateOffer.error'));
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setError(error.message || t('employerCreateOffer.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerCreateOffer.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  if (!worker) {
    return (
      <DashboardLayout requiredRole="EMPLOYER">
        <DashboardHeader
          title={t('employerCreateOffer.title')}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <div className="p-4 md:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('employerCreateOffer.noWorkerData')}</h3>
            <button
              onClick={handleBack}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              {t('employerCreateOffer.back')}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t('employerCreateOffer.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-teal-600 transition mb-4"
        >
          <ArrowLeft size={18} />
          {t('employerCreateOffer.back')}
        </button>

        {/* Worker Info Card */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-2">{t('employerCreateOffer.workerInfo')}</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800/20 flex items-center justify-center overflow-hidden">
              {worker?.profileImage ? (
                <img
                  src={worker.profileImage}
                  alt={worker.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-white" />
              )}
            </div>
            <div>
              <UserDisplayName
                user={worker}
                size="xl"
                defaultNameClassName="font-semibold text-white"
              />
              <p className="text-teal-100">{worker.desiredJob || t('employerCreateOffer.serviceProvider')}</p>
              <p className="text-sm text-teal-100">{worker.location || t('employerCreateOffer.notSpecified')}</p>
            </div>
          </div>
        </div>

        {/* Offer Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">{t('employerCreateOffer.workDetails')}</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="mb-6 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('employerCreateOffer.fields.compensationCurrency')}
            </label>
            <select
              name="compensationCurrency"
              value={formData.compensationCurrency}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
            >
              {OFFER_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.hourlyRate', { currency: formData.compensationCurrency })} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder={t('employerCreateOffer.placeholders.hourlyRate')}
                />
              </div>
            </div>

            {/* Monthly Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.monthlySalary', { currency: formData.compensationCurrency })} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="monthlySalary"
                  value={formData.monthlySalary}
                  onChange={handleChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder={t('employerCreateOffer.placeholders.monthlySalary')}
                />
              </div>
            </div>

            {/* Working Hours Per Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.workingHoursPerDay')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="workingHoursPerDay"
                  value={formData.workingHoursPerDay}
                  onChange={handleChange}
                  required
                  min="1"
                  max="24"
                  step="0.5"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder={t('employerCreateOffer.placeholders.workingHoursPerDay')}
                />
              </div>
            </div>

            {/* Working Days Per Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.workingDaysPerWeek')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="workingDaysPerWeek"
                  value={formData.workingDaysPerWeek}
                  onChange={handleChange}
                  required
                  min="1"
                  max="7"
                  step="1"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder={t('employerCreateOffer.placeholders.workingDaysPerWeek')}
                />
              </div>
            </div>

            {/* Weekly Days Off */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.weeklyDaysOff')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="weeklyDaysOff"
                  value={formData.weeklyDaysOff}
                  onChange={handleChange}
                  required
                  min="0"
                  max="7"
                  step="1"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder={t('employerCreateOffer.placeholders.weeklyDaysOff')}
                />
              </div>
            </div>

            {/* Work Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.workStartTime')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  name="workStartTime"
                  value={formData.workStartTime}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Work End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.workEndTime')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  name="workEndTime"
                  value={formData.workEndTime}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Employment Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.employmentStartDate')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="employmentStartDate"
                  value={formData.employmentStartDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('employerCreateOffer.fields.additionalNotes')}
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder={t('employerCreateOffer.placeholders.additionalNotes')}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('employerCreateOffer.sending')}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t('employerCreateOffer.sendOffer')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-900 transition disabled:opacity-50"
            >
              {t('employerCreateOffer.back')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EmployerCreateOffer;
