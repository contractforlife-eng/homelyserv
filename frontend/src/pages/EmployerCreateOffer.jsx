// src/pages/EmployerCreateOffer.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useDashboard } from '../components/layout/DashboardContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
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

const EmployerCreateOffer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const dashboard = useDashboard();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
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

  const translations = {
    en: {
      title: 'Create Job Offer',
      subtitle: 'Fill in the work details for this position',
      back: 'Back',
      sendOffer: 'Send Offer',
      sending: 'Sending...',
      workerInfo: 'Worker Information',
      workDetails: 'Work Details',
      hourlyRate: 'Hourly Rate (EGP)',
      monthlySalary: 'Monthly Salary (EGP)',
      workingHoursPerDay: 'Working Hours Per Day',
      workingDaysPerWeek: 'Working Days Per Week',
      weeklyDaysOff: 'Weekly Days Off',
      workStartTime: 'Work Start Time',
      workEndTime: 'Work End Time',
      employmentStartDate: 'Employment Start Date',
      additionalNotes: 'Additional Notes',
      additionalNotesPlaceholder: 'Any additional information about the job...',
      required: 'This field is required',
      success: '✅ Offer sent successfully!',
      error: 'Failed to send offer. Please try again.',
      selectDate: 'Select date',
      noWorkerData: 'No worker data found'
    },
    ar: {
      title: 'إنشاء عرض عمل',
      subtitle: 'أدخل تفاصيل العمل لهذا المنصب',
      back: 'رجوع',
      sendOffer: 'إرسال العرض',
      sending: 'جاري الإرسال...',
      workerInfo: 'معلومات العامل',
      workDetails: 'تفاصيل العمل',
      hourlyRate: 'السعر بالساعة (جنيه)',
      monthlySalary: 'الراتب الشهري (جنيه)',
      workingHoursPerDay: 'ساعات العمل في اليوم',
      workingDaysPerWeek: 'أيام العمل في الأسبوع',
      weeklyDaysOff: 'أيام الإجازة الأسبوعية',
      workStartTime: 'وقت بدء العمل',
      workEndTime: 'وقت انتهاء العمل',
      employmentStartDate: 'تاريخ بدء العمل',
      additionalNotes: 'ملاحظات إضافية',
      additionalNotesPlaceholder: 'أي معلومات إضافية عن الوظيفة...',
      required: 'هذا الحقل مطلوب',
      success: '✅ تم إرسال العرض بنجاح!',
      error: 'فشل إرسال العرض. يرجى المحاولة مرة أخرى.',
      selectDate: 'اختر التاريخ',
      noWorkerData: 'لم يتم العثور على بيانات العامل'
    }
  };

  const t = translations[dashboard.language] || translations.en;

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
        setError(`${t.required}: ${t[field]}`);
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
      setError(t.noWorkerData);
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
        hourlyRate: parseFloat(formData.hourlyRate),
        monthlySalary: parseFloat(formData.monthlySalary),
        workingHoursPerDay: parseFloat(formData.workingHoursPerDay),
        workingDaysPerWeek: parseFloat(formData.workingDaysPerWeek),
        weeklyDaysOff: parseFloat(formData.weeklyDaysOff),
        workStartTime: formData.workStartTime,
        workEndTime: formData.workEndTime,
        employmentStartDate: formData.employmentStartDate,
        additionalNotes: formData.additionalNotes,
        agreedSalary: parseFloat(formData.monthlySalary),
        amount: parseFloat(formData.monthlySalary),
        description: `Job offer for ${worker.fullName} as ${worker.desiredJob || 'Service Provider'}`,
        message: `Job offer for ${worker.fullName} as ${worker.desiredJob || 'Service Provider'}`,
        status: 'pending'
      };

      const response = await hireService.sendOffer(offerData);

      if (response.success) {
        alert(t.success);
        navigate('/employer-payments', {
          state: {
            offerCreated: true,
            workerName: worker.fullName,
            workerId: worker.id || worker.email
          }
        });
      } else {
        throw new Error(response.message || t.error);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setError(error.message || t.error);
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
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
          title={t.title}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <div className="p-4 md:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.noWorkerData}</h3>
            <button
              onClick={handleBack}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              {t.back}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-teal-600 transition mb-4"
        >
          <ArrowLeft size={18} />
          {t.back}
        </button>

        {/* Worker Info Card */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-2">{t.workerInfo}</h2>
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
              <h3 className="text-lg font-semibold">{worker.fullName}</h3>
              <p className="text-teal-100">{worker.desiredJob || 'Service Provider'}</p>
              <p className="text-sm text-teal-100">{worker.location || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Offer Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">{t.workDetails}</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.hourlyRate} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            {/* Monthly Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.monthlySalary} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="monthlySalary"
                  value={formData.monthlySalary}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder="e.g., 5000"
                />
              </div>
            </div>

            {/* Working Hours Per Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.workingHoursPerDay} <span className="text-red-500">*</span>
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
                  placeholder="e.g., 8"
                />
              </div>
            </div>

            {/* Working Days Per Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.workingDaysPerWeek} <span className="text-red-500">*</span>
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
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            {/* Weekly Days Off */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.weeklyDaysOff} <span className="text-red-500">*</span>
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
                  placeholder="e.g., 2"
                />
              </div>
            </div>

            {/* Work Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.workStartTime} <span className="text-red-500">*</span>
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
                {t.workEndTime} <span className="text-red-500">*</span>
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
                {t.employmentStartDate} <span className="text-red-500">*</span>
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
                {t.additionalNotes}
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                  placeholder={t.additionalNotesPlaceholder}
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
                  {t.sending}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t.sendOffer}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-900 transition disabled:opacity-50"
            >
              {t.back}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EmployerCreateOffer;