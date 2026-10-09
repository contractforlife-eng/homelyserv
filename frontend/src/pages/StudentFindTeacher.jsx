// frontend/src/pages/StudentFindTeacher.jsx
// ============================================================
// STUDENT FIND A TEACHER PAGE
// Enables students to browse, search, and filter eligible teachers
// and send / view / cancel relationship requests.
// Single source of truth:
//   - GET  /api/students/teachers/discover
//   - POST /api/students/teachers/:teacherId/request
//   - POST /api/students/teachers/:teacherId/cancel-request
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  Search,
  Filter,
  GraduationCap,
  ShieldCheck,
  Award,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Send,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  DollarSign,
  UserCheck
} from 'lucide-react';

const StudentFindTeacher = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [selectedTeacher, setSelectedTeacher] = useState(null); // Details modal
  const [requestTargetTeacher, setRequestTargetTeacher] = useState(null); // Request confirm modal
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Cancellation state
  const [cancellingTeacherId, setCancellingTeacherId] = useState(null);

  const fetchDiscoveredTeachers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = {
        page: currentPage,
        limit: 12
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedSubject !== 'ALL') params.subject = selectedSubject;
      if (selectedLevel !== 'ALL') params.teachingLevel = selectedLevel;
      if (countryFilter.trim()) params.country = countryFilter.trim();
      if (cityFilter.trim()) params.city = cityFilter.trim();
      if (verifiedOnly) params.isVerified = 'true';

      const res = await api.get('/api/students/teachers/discover', { params });
      if (res.data?.success) {
        setTeachers(Array.isArray(res.data.teachers) ? res.data.teachers : []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
      } else {
        setTeachers([]);
      }
    } catch (err) {
      console.error('Error discovering teachers:', err);
      setErrorMessage(t('studentFindTeacher.loadError', 'Failed to search for teachers.'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedSubject, selectedLevel, countryFilter, cityFilter, verifiedOnly, t]);

  useEffect(() => {
    fetchDiscoveredTeachers();
  }, [fetchDiscoveredTeachers]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDiscoveredTeachers();
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('ALL');
    setSelectedLevel('ALL');
    setCountryFilter('');
    setCityFilter('');
    setVerifiedOnly(false);
    setCurrentPage(1);
  };

  // Send request
  const handleSendRequest = async () => {
    if (!requestTargetTeacher) return;
    setSubmittingRequest(true);
    try {
      const res = await api.post(`/api/students/teachers/${requestTargetTeacher.id}/request`, {
        message: requestMessage.trim()
      });

      if (res.data?.success) {
        setSuccessMessage(t('studentFindTeacher.requestSuccess', 'Request sent successfully and is pending teacher approval.'));
        // Optimistically update card status in local state
        setTeachers((prev) =>
          prev.map((teach) =>
            teach.id === requestTargetTeacher.id
              ? { ...teach, relationshipStatus: 'PENDING' }
              : teach
          )
        );
        setRequestTargetTeacher(null);
        setRequestMessage('');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error('Error sending teacher request:', err);
      alert(err.response?.data?.message || t('studentFindTeacher.requestError', 'Failed to send request.'));
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Cancel request
  const handleCancelRequest = async (teacherId) => {
    setCancellingTeacherId(teacherId);
    try {
      const res = await api.post(`/api/students/teachers/${teacherId}/cancel-request`);
      if (res.data?.success) {
        setTeachers((prev) =>
          prev.map((teach) =>
            teach.id === teacherId
              ? { ...teach, relationshipStatus: 'ENDED' }
              : teach
          )
        );
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      alert(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancellingTeacherId(null);
    }
  };

  // Helper for Relationship status buttons/badges
  const renderRelationshipAction = (teacher) => {
    const status = teacher.relationshipStatus || 'NONE';

    if (status === 'ACTIVE') {
      return (
        <Link
          to="/student-teacher"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>{t('studentFindTeacher.btnActive', 'My Teacher')}</span>
        </Link>
      );
    }

    if (status === 'PENDING') {
      const isCancelling = cancellingTeacherId === teacher.id;
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex-1 justify-center">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>{t('studentFindTeacher.btnPending', 'Pending Approval')}</span>
          </span>
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => handleCancelRequest(teacher.id)}
            title={t('studentFindTeacher.cancelBtn', 'Cancel')}
            className="p-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 transition"
          >
            {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          </button>
        </div>
      );
    }

    // NONE, ENDED, or REJECTED: allowed to request
    return (
      <button
        type="button"
        onClick={() => {
          setRequestTargetTeacher(teacher);
          setRequestMessage('');
        }}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm"
      >
        <Send className="w-3.5 h-3.5" />
        <span>{t('studentFindTeacher.btnRequest', 'Request to Study')}</span>
      </button>
    );
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('studentFindTeacher.headerTitle', 'Find a Teacher')}
        subtitle={t('studentFindTeacher.subTitle', 'Browse and connect with qualified teachers in your subjects and educational level.')}
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-800 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('studentFindTeacher.searchPlaceholder', 'Search by teacher name, subject, or title...')}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm transition shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Subject Select */}
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{t('studentFindTeacher.filterSubject', 'Subject')}: {t('studentFindTeacher.filterAll', 'All')}</option>
              <option value="mathematics">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
              <option value="science">Science</option>
              <option value="arabic">Arabic</option>
              <option value="english">English</option>
              <option value="french">French</option>
              <option value="german">German</option>
              <option value="history">History</option>
              <option value="geography">Geography</option>
              <option value="computer_science">Computer Science</option>
              <option value="programming">Programming</option>
              <option value="economics">Economics</option>
            </select>

            {/* Teaching Level Select */}
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{t('studentFindTeacher.filterLevel', 'Level')}: {t('studentFindTeacher.filterAll', 'All')}</option>
              <option value="primary">Primary</option>
              <option value="preparatory">Preparatory</option>
              <option value="secondary">Secondary</option>
              <option value="high_school">High School</option>
              <option value="university">University</option>
              <option value="all_levels">All Levels</option>
            </select>

            {/* Country input */}
            <input
              type="text"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              onBlur={() => setCurrentPage(1)}
              placeholder={t('studentFindTeacher.filterCountry', 'Country')}
              className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />

            {/* City input */}
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              onBlur={() => setCurrentPage(1)}
              placeholder={t('studentFindTeacher.filterCity', 'City')}
              className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />

            {/* Verified Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 select-none text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => {
                  setVerifiedOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span>{t('studentFindTeacher.filterVerified', 'Verified Only')}</span>
            </label>

            {/* Clear Filters */}
            {(searchQuery || selectedSubject !== 'ALL' || selectedLevel !== 'ALL' || countryFilter || cityFilter || verifiedOnly) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="ms-auto text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline text-xs"
              >
                {t('studentFindTeacher.clearFilters', 'Clear Filters')}
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>{t('studentFindTeacher.resultsCount', { count: pagination.total })}</span>
        </div>

        {/* Teacher Cards Grid */}
        {loading ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('studentFindTeacher.loading', 'Searching for teachers...')}
            </p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <GraduationCap className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              {t('studentFindTeacher.noTeachersFound', 'No teachers found matching your search.')}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t('studentFindTeacher.noTeachersFoundDesc', 'Try adjusting your subject, level, or location filters.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teachers.map((teacher) => {
              const allSubjects = teacher.mainSubject
                ? [teacher.mainSubject, ...(teacher.additionalSubjects || [])]
                : teacher.additionalSubjects || [];

              return (
                <div
                  key={teacher.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                    teacher.isPremium
                      ? 'border-purple-400 dark:border-purple-500 bg-purple-100/80 dark:bg-purple-900/30 shadow-[0_0_16px_rgba(168,85,247,0.40)] hover:shadow-[0_0_22px_rgba(168,85,247,0.50)]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-red-500/30'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Avatar, Name, Title & Verified Badge */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {teacher.fullName}
                          </h4>
                          {teacher.isVerified && (
                            <span title={t('studentFindTeacher.verifiedBadge', 'Verified Teacher')}>
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            </span>
                          )}
                        </div>

                        {teacher.title && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {teacher.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subjects Badges */}
                    {allSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {allSubjects.slice(0, 3).map((sub, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/40 capitalize"
                          >
                            {sub.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {allSubjects.length > 3 && (
                          <span className="text-[11px] text-slate-400 self-center">
                            +{allSubjects.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Experience, Levels, and Location */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      {teacher.yearsOfExperience > 0 && (
                        <p className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{teacher.yearsOfExperience} {t('studentFindTeacher.yearsSuffix', 'years experience')}</span>
                        </p>
                      )}

                      {(teacher.city || teacher.country) && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{[teacher.city, teacher.country].filter(Boolean).join(', ')}</span>
                        </p>
                      )}

                      {teacher.lessonRate > 0 && (
                        <p className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white pt-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {teacher.lessonRate} {teacher.pricingCurrency} / {t('studentFindTeacher.perLesson', 'lesson')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    {renderRelationshipAction(teacher)}

                    <button
                      type="button"
                      onClick={() => setSelectedTeacher(teacher)}
                      className="w-full py-1.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                      {t('studentFindTeacher.btnViewDetails', 'View Details')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <span className="text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* REQUEST CONFIRMATION DIALOG MODAL                        */}
        {/* ======================================================== */}
        {requestTargetTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Send className="w-5 h-5 text-red-600" />
                  <span>{t('studentFindTeacher.confirmModalTitle', 'Request Connection with Teacher')}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setRequestTargetTeacher(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('studentFindTeacher.confirmModalBody', { name: requestTargetTeacher.fullName })}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('studentFindTeacher.messageLabel', 'Personal Note / Message (Optional)')}
                </label>
                <textarea
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder={t('studentFindTeacher.messagePlaceholder', 'Introduce yourself or mention your learning goals...')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRequestTargetTeacher(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t('studentFindTeacher.cancelBtn', 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={submittingRequest}
                  onClick={handleSendRequest}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('studentFindTeacher.sendRequestBtn', 'Send Request')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* READ-ONLY TEACHER DETAILS MODAL                          */}
        {/* ======================================================== */}
        {selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {selectedTeacher.avatar ? (
                      <img src={selectedTeacher.avatar} alt={selectedTeacher.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedTeacher.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedTeacher.title || 'Teacher'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                {selectedTeacher.bio && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">
                      {t('studentFindTeacher.bioLabel', 'About Teacher')}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                      {selectedTeacher.bio}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{t('studentFindTeacher.mainSubjectLabel', 'Main Subject')}</span>
                    <p className="font-medium text-slate-900 dark:text-white capitalize">
                      {selectedTeacher.mainSubject?.replace(/_/g, ' ') || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{t('studentFindTeacher.experienceLabel', 'Experience')}</span>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {selectedTeacher.yearsOfExperience} {t('studentFindTeacher.yearsSuffix', 'years')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{t('studentFindTeacher.rateLabel', 'Lesson Rate')}</span>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400 font-bold">
                      {selectedTeacher.lessonRate > 0 ? `${selectedTeacher.lessonRate} ${selectedTeacher.pricingCurrency}` : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">{t('studentFindTeacher.methodLabel', 'Method')}</span>
                    <p className="font-medium text-slate-900 dark:text-white capitalize">
                      {selectedTeacher.teachingMethod || 'Both'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  {t('studentFindTeacher.closeBtn', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentFindTeacher;
