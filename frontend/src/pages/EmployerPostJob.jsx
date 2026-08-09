// src/pages/EmployerPostJob.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useDashboard } from '../components/layout/DashboardContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import jobService from '../services/jobService';

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'freelance'];

const translations = {
  en: {
    title: 'Post a Job',
    editTitle: 'Edit Job',
    subtitle: 'Post a job and reach the right workers',
    jobTitle: 'Job Title',
    jobTitlePlaceholder: 'e.g., Senior Nanny',
    location: 'Location',
    locationPlaceholder: 'e.g., Cairo, Egypt',
    employmentType: 'Employment Type',
    salaryMin: 'Min Salary (EGP)',
    salaryMinPlaceholder: 'e.g., 3000',
    salaryMax: 'Max Salary (EGP)',
    salaryMaxPlaceholder: 'e.g., 4500',
    jobDescription: 'Job Description',
    descriptionPlaceholder: 'Describe the job responsibilities and requirements...',
    requirements: 'Requirements',
    addRequirementPlaceholder: 'Add a requirement...',
    add: 'Add',
    benefits: 'Benefits',
    addBenefitPlaceholder: 'Add a benefit...',
    contractType: 'Contract Type',
    workSchedule: 'Work Schedule',
    workSchedulePlaceholder: 'e.g., Sunday - Thursday, 9AM - 5PM',
    startDate: 'Start Date',
    deadline: 'Application Deadline',
    isUrgent: 'Mark as Urgent',
    isFeatured: 'Feature this job',
    postJob: 'Post Job',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    posting: 'Posting...',
    saving: 'Saving...',
    success: 'Job posted successfully!',
    editSuccess: 'Job updated successfully!',
    error: 'Failed to post job. Please try again.',
    editError: 'Failed to update job. Please try again.',
    validateMinSalary: 'Min salary must be 0 or more',
    validateMaxSalary: 'Max salary must be 0 or more',
    validateSalaryRange: 'Max salary must be greater than or equal to min salary',
  },
  ar: {
    title: 'نشر وظيفة',
    editTitle: 'تعديل الوظيفة',
    subtitle: 'انشر وظيفة واعثر على العمال المناسبين',
    jobTitle: 'المسمى الوظيفي',
    jobTitlePlaceholder: 'مثال: مربية أطفال أول',
    location: 'الموقع',
    locationPlaceholder: 'مثال: القاهرة، مصر',
    employmentType: 'نوع التوظيف',
    salaryMin: 'الحد الأدنى للراتب (جنيه)',
    salaryMinPlaceholder: 'مثال: 3000',
    salaryMax: 'الحد الأقصى للراتب (جنيه)',
    salaryMaxPlaceholder: 'مثال: 4500',
    jobDescription: 'وصف الوظيفة',
    descriptionPlaceholder: 'صف مسؤوليات ومتطلبات الوظيفة...',
    requirements: 'المتطلبات',
    addRequirementPlaceholder: 'أضف متطلباً...',
    add: 'إضافة',
    benefits: 'المزايا',
    addBenefitPlaceholder: 'أضف ميزة...',
    contractType: 'نوع العقد',
    workSchedule: 'جدول العمل',
    workSchedulePlaceholder: 'مثال: الأحد - الخميس، 9ص - 5م',
    startDate: 'تاريخ البدء',
    deadline: 'الموعد النهائي للتقديم',
    isUrgent: 'وضع علامة عاجل',
    isFeatured: 'تمييز هذه الوظيفة',
    postJob: 'نشر الوظيفة',
    saveChanges: 'حفظ التغييرات',
    cancel: 'إلغاء',
    posting: 'جارٍ النشر...',
    saving: 'جارٍ الحفظ...',
    success: 'تم نشر الوظيفة بنجاح!',
    editSuccess: 'تم تحديث الوظيفة بنجاح!',
    error: 'فشل نشر الوظيفة. حاول مرة أخرى.',
    editError: 'فشل تحديث الوظيفة. حاول مرة أخرى.',
    validateMinSalary: 'الحد الأدنى للراتب يجب أن يكون 0 أو أكثر',
    validateMaxSalary: 'الحد الأقصى للراتب يجب أن يكون 0 أو أكثر',
    validateSalaryRange: 'الحد الأقصى للراتب يجب أن يكون أكبر من أو يساوي الحد الأدنى',
  },
};

const EmployerPostJob = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const dashboard = useDashboard();
  const t = translations[dashboard.language] || translations.en;
  const isArabic = dashboard.language === 'ar';

  const editJob = location.state?.editJob || null;

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
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

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  // Prefill form when editing an existing job
  useEffect(() => {
    if (editJob) {
      setFormData({
        title: editJob.jobTitle || '',
        location: editJob.location || '',
        salaryMin: editJob.salaryMin !== null && editJob.salaryMin !== undefined ? String(editJob.salaryMin) : '',
        salaryMax: editJob.salaryMax !== null && editJob.salaryMax !== undefined ? String(editJob.salaryMax) : '',
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
    }
  }, [editJob]);

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

  const buildPayload = () => {
    const payload = {
      jobTitle: formData.title,
      location: formData.location || null,
      salaryMin: formData.salaryMin !== '' ? parseFloat(formData.salaryMin) : null,
      salaryMax: formData.salaryMax !== '' ? parseFloat(formData.salaryMax) : null,
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
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const salaryMin = formData.salaryMin !== '' ? parseFloat(formData.salaryMin) : null;
    const salaryMax = formData.salaryMax !== '' ? parseFloat(formData.salaryMax) : null;

    if (salaryMin !== null && salaryMin < 0) {
      setError(t.validateMinSalary);
      return;
    }
    if (salaryMax !== null && salaryMax < 0) {
      setError(t.validateMaxSalary);
      return;
    }
    if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
      setError(t.validateSalaryRange);
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload();

      if (editJob) {
        await jobService.updateJob(editJob.id, payload);
        alert(t.editSuccess);
      } else {
        await jobService.createJob(payload);
        alert(t.success);
      }

      navigate('/employer-jobs');
    } catch (submitError) {
      console.error('Job submit error:', submitError);
      const serverMessage = submitError.response?.data?.message;
      setError(serverMessage || (editJob ? t.editError : t.error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
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
        title={editJob ? t.editTitle : t.title}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
        <RolePageHeader title={editJob ? t.editTitle : t.title} subtitle={t.subtitle} />

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.jobTitle}</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={120}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t.jobTitlePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.location}</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t.locationPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.employmentType}</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="full-time">{isArabic ? 'دوام كامل' : 'Full Time'}</option>
                <option value="part-time">{isArabic ? 'دوام جزئي' : 'Part Time'}</option>
                <option value="contract">{isArabic ? 'عقد' : 'Contract'}</option>
                <option value="freelance">{isArabic ? 'حر' : 'Freelance'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.salaryMin}</label>
              <input
                type="number"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t.salaryMinPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.salaryMax}</label>
              <input
                type="number"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t.salaryMaxPlaceholder}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.jobDescription}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                maxLength={5000}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t.descriptionPlaceholder}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.requirements}</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }}
                  className="flex-1 min-w-[160px] px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={t.addRequirementPlaceholder}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  {t.add}
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
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.benefits}</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBenefit(); } }}
                  className="flex-1 min-w-[160px] px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder={t.addBenefitPlaceholder}
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  {t.add}
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
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.contractType}</label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.workSchedule}</label>
              <input
                type="text"
                name="workSchedule"
                value={formData.workSchedule}
                onChange={handleChange}
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder={t.workSchedulePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.startDate}</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.deadline}</label>
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
                <span className="text-sm text-gray-700 dark:text-gray-300">{t.isUrgent}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t.isFeatured}</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (editJob ? t.saving : t.posting) : (editJob ? t.saveChanges : t.postJob)}
            </button>
            <button
              type="button"
              onClick={() => navigate('/employer-jobs')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition"
            >
              {t.cancel}
            </button>
          </div>
        </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployerPostJob;
