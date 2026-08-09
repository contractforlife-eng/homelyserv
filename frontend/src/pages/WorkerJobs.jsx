// src/pages/WorkerJobs.jsx — Find Jobs
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useDashboard } from '../components/layout/DashboardContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import { Search, MapPin, Calendar, Loader2, Briefcase, Building } from 'lucide-react';
import jobService from '../services/jobService';

const translations = {
  en: {
    title: 'Find Jobs',
    subtitle: 'Browse open job opportunities',
    searchPlaceholder: 'Search by job title or description...',
    locationPlaceholder: 'All locations',
    employmentType: 'Employment Type',
    allTypes: 'All types',
    fullTime: 'Full Time',
    partTime: 'Part Time',
    contract: 'Contract',
    freelance: 'Freelance',
    salary: 'Salary',
    posted: 'Posted',
    urgent: 'Urgent',
    featured: 'Featured',
    viewJob: 'View Job',
    emptyTitle: 'No jobs found',
    emptyDesc: 'Try adjusting your search or filters.',
    noLocation: 'Location not specified',
    clearFilters: 'Clear filters',
    company: 'Company',
  },
  ar: {
    title: 'البحث عن وظائف',
    subtitle: 'تصفح فرص العمل المتاحة',
    searchPlaceholder: 'ابحث باسم الوظيفة أو الوصف...',
    locationPlaceholder: 'كل المواقع',
    employmentType: 'نوع التوظيف',
    allTypes: 'كل الأنواع',
    fullTime: 'دوام كامل',
    partTime: 'دوام جزئي',
    contract: 'عقد',
    freelance: 'حر',
    salary: 'الراتب',
    posted: 'تاريخ النشر',
    urgent: 'عاجل',
    featured: 'مميزة',
    viewJob: 'عرض الوظيفة',
    emptyTitle: 'لا توجد وظائف',
    emptyDesc: 'حاول تعديل البحث أو الفلاتر.',
    noLocation: 'الموقع غير محدد',
    clearFilters: 'مسح الفلاتر',
    company: 'الشركة',
  },
};

const TYPE_LABELS = {
  'full-time': { en: 'Full Time', ar: 'دوام كامل' },
  'part-time': { en: 'Part Time', ar: 'دوام جزئي' },
  contract: { en: 'Contract', ar: 'عقد' },
  freelance: { en: 'Freelance', ar: 'حر' },
};

const WorkerJobs = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const dashboard = useDashboard();
  const isArabic = dashboard.language === 'ar';
  const t = translations[dashboard.language] || translations.en;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (query.trim()) filters.query = query.trim();
      if (location.trim()) filters.location = location.trim();
      if (employmentType) filters.employmentType = employmentType;

      const data = await jobService.getJobs(filters);
      if (data?.success) {
        setJobs(data.jobs || []);
      } else {
        setError(data?.message || t.emptyTitle);
      }
    } catch (loadError) {
      console.error('Load jobs error:', loadError);
      setError(loadError.response?.data?.message || t.emptyTitle);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [query, location, employmentType, t.emptyTitle]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    loadJobs();
  }, [authLoading, isAuthenticated, authUser, navigate, loadJobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadJobs();
  };

  const handleClear = () => {
    setQuery('');
    setLocation('');
    setEmploymentType('');
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const formatSalary = (job) => {
    const min = job.salaryMin !== null && job.salaryMin !== undefined ? job.salaryMin : null;
    const max = job.salaryMax !== null && job.salaryMax !== undefined ? job.salaryMax : null;
    if (min === null && max === null) return '—';
    if (min !== null && max !== null && min === max) return `${Math.round(min).toLocaleString()} EGP`;
    if (min !== null && max !== null) return `${Math.round(min).toLocaleString()} - ${Math.round(max).toLocaleString()} EGP`;
    if (min !== null) return `${Math.round(min).toLocaleString()}+ EGP`;
    return `${Math.round(max).toLocaleString()} EGP`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const employerDisplayName = (job) => {
    return job.employer?.companyName || job.employer?.fullName || null;
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
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <RolePageHeader title={t.title} subtitle={t.subtitle} />

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t.locationPlaceholder}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{t.allTypes}</option>
                <option value="full-time">{t.fullTime}</option>
                <option value="part-time">{t.partTime}</option>
                <option value="contract">{t.contract}</option>
                <option value="freelance">{t.freelance}</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                <Search size={16} /> {t.title}
              </button>
              {(query || location || employmentType) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                >
                  {t.clearFilters}
                </button>
              )}
            </div>
          </form>

          {error && !loading && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
            </div>
          ) : hasLoaded && jobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.emptyTitle}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t.emptyDesc}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white break-words">{job.jobTitle}</h2>
                      {job.isUrgent && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {t.urgent}
                        </span>
                      )}
                      {job.isFeatured && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {t.featured}
                        </span>
                      )}
                    </div>

                    {employerDisplayName(job) && (
                      <p className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                        <Building size={15} className="text-gray-400 dark:text-gray-500" />
                        {employerDisplayName(job)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} /> {job.location || t.noLocation}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase size={14} /> {TYPE_LABELS[job.employmentType]?.[dashboard.language] || job.employmentType}
                      </span>
                      <span>
                        {t.salary}: <span className="text-gray-700 dark:text-gray-300 font-medium">{formatSalary(job)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={14} /> {t.posted}: {formatDate(job.createdAt)}
                      </span>
                    </div>

                    <div className="flex justify-start">
                      <button
                        onClick={() => navigate(`/job/${job.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                      >
                        {t.viewJob}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkerJobs;
