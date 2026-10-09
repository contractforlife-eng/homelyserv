// frontend/src/pages/StudentCourses.jsx
// ============================================================
// STUDENT RECORDED COURSES PAGE (HomelyServ LMS Phase 1)
// ============================================================
// Discovery catalog, enrolled courses tab, free enrollment,
// and embedded YouTube nocookie video player.
// ============================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import ManualPaymentFlow from '../components/Payment/ManualPaymentFlow';
import { TEACHER_SUBJECTS, TEACHING_LEVELS } from '../constants/teacherTaxonomy';
import api from '../utils/api';
import {
  fetchCoursePaymentProviders,
  createPaymentIntent,
  capturePayPalOrder,
  getPaymentStatus,
} from '../services/paymentService';
import { getCoursePaymentMethods } from '../utils/coursePaymentMethods';
import {
  Video,
  Play,
  Lock,
  CheckCircle,
  Search,
  Loader2,
  Clock,
  BookOpen,
  X,
  ExternalLink,
  GraduationCap,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Wallet,
  Smartphone,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const StudentCourses = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'enrolled'
  const [loading, setLoading] = useState(true);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Catalog filters
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [paidFilter, setPaidFilter] = useState('ALL');

  // Player & Details Modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState('');
  const [enrollErrorMessage, setEnrollErrorMessage] = useState('');

  // Course Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState(null); // null | 'polling' | 'capturing' | 'success'
  const paypalPollingIntervalRef = useRef(null);

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (paypalPollingIntervalRef.current) {
        clearInterval(paypalPollingIntervalRef.current);
      }
    };
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      if (res.data?.success) {
        setCatalogCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Error fetching course catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEnrolled = useCallback(async () => {
    try {
      const res = await api.get('/students/courses/enrolled');
      if (res.data?.success) {
        setEnrolledCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
    fetchEnrolled();
  }, [fetchCatalog, fetchEnrolled]);

  const handleOpenCourseDetails = async (courseId) => {
    try {
      setCourseDetailsLoading(true);
      setEnrollSuccessMessage('');
      setEnrollErrorMessage('');
      setIsCheckingOut(false);
      setSelectedMethod(null);
      setCheckoutError('');
      setCheckoutStatus(null);
      if (paypalPollingIntervalRef.current) {
        clearInterval(paypalPollingIntervalRef.current);
      }

      const res = await api.get(`/courses/${courseId}`);
      if (res.data?.success) {
        const details = res.data.course;
        setSelectedCourse({
          ...details,
          isEnrolled: res.data.isEnrolled,
          isAuthorized: res.data.isAuthorized
        });

        // Set initial active lesson: first authorized playable lesson or first lesson
        if (details.lessons?.length > 0) {
          const firstUnlocked = details.lessons.find((l) => !l.isLocked);
          setActiveLesson(firstUnlocked || details.lessons[0]);
        } else {
          setActiveLesson(null);
        }
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
    } finally {
      setCourseDetailsLoading(false);
    }
  };

  const handleStartCheckout = async () => {
    if (!selectedCourse) return;
    setIsCheckingOut(true);
    setCheckoutError('');
    setCheckoutStatus(null);
    setSelectedMethod(null);
    setProvidersLoading(true);

    try {
      const data = await fetchCoursePaymentProviders(selectedCourse._id);
      if (data?.success) {
        setAvailableProviders(data.providers || []);
      } else {
        setAvailableProviders([]);
      }
    } catch (err) {
      console.error('Error fetching payment providers for course:', err);
      setAvailableProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

  const coursePaymentMethods = useMemo(() => {
    if (!selectedCourse) return [];
    return getCoursePaymentMethods({
      currency: selectedCourse.currency,
      backendProviders: availableProviders,
    });
  }, [selectedCourse, availableProviders]);

  // Set default method when methods load
  useEffect(() => {
    if (isCheckingOut && coursePaymentMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(coursePaymentMethods[0].id);
    }
  }, [isCheckingOut, coursePaymentMethods, selectedMethod]);

  const handlePayPalCheckout = async () => {
    if (!selectedCourse) return;
    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const intentRes = await createPaymentIntent({
        paymentMethod: 'paypal',
        purpose: 'COURSE_PURCHASE',
        courseId: selectedCourse._id,
      });

      if (!intentRes?.success || !intentRes.approvalUrl) {
        throw new Error(intentRes?.error || 'Failed to initialize PayPal order');
      }

      window.open(intentRes.approvalUrl, '_blank', 'noopener,noreferrer');
      setCheckoutStatus('polling');

      const orderId = intentRes.paypalOrderId || intentRes.orderId;
      startPayPalCapturePolling(orderId);
    } catch (err) {
      console.error('PayPal checkout error:', err);
      setCheckoutError(
        err.response?.data?.error ||
        err.message ||
        'PayPal payment initiation failed'
      );
      setCheckoutStatus(null);
      setCheckoutLoading(false);
    }
  };

  const startPayPalCapturePolling = (orderId) => {
    if (paypalPollingIntervalRef.current) {
      clearInterval(paypalPollingIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 40; // 40 * 3s = 120s

    paypalPollingIntervalRef.current = setInterval(async () => {
      attempts++;

      try {
        const captureRes = await capturePayPalOrder(orderId);

        if (captureRes?.success) {
          clearInterval(paypalPollingIntervalRef.current);
          setCheckoutStatus('success');
          setCheckoutLoading(false);

          // Authoritative state refresh
          await handleOpenCourseDetails(selectedCourse._id);
          await fetchEnrolled();
          return;
        }

        if (attempts % 4 === 0) {
          const statusRes = await getPaymentStatus(orderId);
          if (statusRes?.success && statusRes.payment?.status === 'completed') {
            clearInterval(paypalPollingIntervalRef.current);
            setCheckoutStatus('success');
            setCheckoutLoading(false);
            await handleOpenCourseDetails(selectedCourse._id);
            await fetchEnrolled();
            return;
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(paypalPollingIntervalRef.current);
          setCheckoutError('Payment capture timed out. Please contact support if your account was charged.');
          setCheckoutStatus(null);
          setCheckoutLoading(false);
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          clearInterval(paypalPollingIntervalRef.current);
          setCheckoutError('Payment verification failed. Please try again.');
          setCheckoutStatus(null);
          setCheckoutLoading(false);
        }
      }
    }, 3000);
  };

  const handleEnrollFree = async (courseId) => {
    try {
      setEnrolling(true);
      setEnrollSuccessMessage('');
      setEnrollErrorMessage('');

      const res = await api.post(`/students/courses/${courseId}/enroll`);
      if (res.data?.success) {
        setEnrollSuccessMessage(
          t('studentCourses.enrolledSuccess') || 'Successfully enrolled in course!'
        );
        // Refresh details
        await handleOpenCourseDetails(courseId);
        await fetchEnrolled();
      }
    } catch (err) {
      console.error('Error enrolling in free course:', err);
      setEnrollErrorMessage(
        err.response?.data?.message ||
          t('studentCourses.enrollError') ||
          'Failed to enroll in course'
      );
    } finally {
      setEnrolling(false);
    }
  };

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return catalogCourses.filter((c) => {
      if (subjectFilter !== 'ALL' && c.subject !== subjectFilter) return false;
      if (levelFilter !== 'ALL' && c.gradeLevel !== levelFilter) return false;
      if (paidFilter === 'FREE' && c.isPaid) return false;
      if (paidFilter === 'PAID' && !c.isPaid) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = c.title?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        const gradeMatch = c.gradeSubtitle?.toLowerCase().includes(q);
        const teacherMatch = c.teacherId?.fullName?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !gradeMatch && !teacherMatch) return false;
      }
      return true;
    });
  }, [catalogCourses, subjectFilter, levelFilter, paidFilter, searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <DashboardHeader
          title={t('studentCourses.title') || 'Recorded Video Courses'}
          subtitle={
            t('studentCourses.subtitle') ||
            'Learn at your own pace with curated lessons from qualified teachers'
          }
        />

        {/* Tab switch */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 rtl:space-x-reverse" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('studentCourses.tabs.catalog') || 'Browse Courses'}</span>
              <span className="ml-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {catalogCourses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('enrolled')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'enrolled'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t('studentCourses.tabs.myCourses') || 'My Enrolled Courses'}</span>
              <span className="ml-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                {enrolledCourses.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Catalog Tab Content */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Filter bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('studentCourses.searchPlaceholder') || 'Search courses or teachers...'}
                  className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">{t('studentCourses.allSubjects') || 'All Subjects'}</option>
                  {TEACHER_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(s.labelKey) || s.value}
                    </option>
                  ))}
                </select>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">{t('studentCourses.allLevels') || 'All Levels'}</option>
                  {TEACHING_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {t(l.labelKey) || l.value}
                    </option>
                  ))}
                </select>

                <select
                  value={paidFilter}
                  onChange={(e) => setPaidFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">{t('studentCourses.allPricing') || 'All Pricing'}</option>
                  <option value="FREE">{t('studentCourses.freeOnly') || 'Free Courses'}</option>
                  <option value="PAID">{t('studentCourses.paidOnly') || 'Paid Courses'}</option>
                </select>
              </div>
            </div>

            {/* Courses grid */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
            ) : filteredCatalog.length === 0 ? (
              <EmptyState
                icon={Video}
                title={t('studentCourses.emptyCatalogTitle') || 'No courses available'}
                description={
                  t('studentCourses.emptyCatalogDesc') ||
                  'There are currently no recorded courses matching your search criteria.'
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCatalog.map((course) => {
                  const isEnrolled = enrolledCourses.some((e) => e._id === course._id);

                  return (
                    <div
                      key={course._id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gray-100 overflow-hidden">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-50 to-amber-100">
                              <Video className="w-12 h-12 text-amber-400" />
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 flex items-center gap-1.5">
                            {course.isPaid ? (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-600 text-white flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>
                                  {course.price} {course.currency || 'EGP'}
                                </span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white">
                                {t('studentCourses.free') || 'Free'}
                              </span>
                            )}
                          </div>

                          {isEnrolled && (
                            <div className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white flex items-center gap-1 shadow-sm">
                                <CheckCircle className="w-3 h-3" />
                                <span>{t('studentCourses.enrolledBadge') || 'Enrolled'}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {t(`teacherTaxonomy.subjects.${course.subject}`) || course.subject}
                            </span>
                            <span>
                              {t(`teacherTaxonomy.levels.${course.gradeLevel}`) || course.gradeLevel}
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
                            {course.title}
                          </h3>

                          {course.teacherId && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                              <span>{course.teacherId.fullName}</span>
                              {course.teacherId.isVerified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                              )}
                            </div>
                          )}

                          <p className="text-sm text-gray-600 line-clamp-2">
                            {course.description ||
                              t('studentCourses.noDescription') ||
                              'No description provided.'}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                            <span>
                              {course.totalLessons} {t('studentCourses.lessons') || 'lessons'}
                            </span>
                            <span>
                              {course.totalDurationMinutes} {t('studentCourses.mins') || 'mins'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="p-4 pt-0">
                        <button
                          onClick={() => handleOpenCourseDetails(course._id)}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>
                            {isEnrolled
                              ? t('studentCourses.resumeCourse') || 'Continue Learning'
                              : t('studentCourses.viewDetails') || 'View Course Details'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Enrolled Courses Tab Content */}
        {activeTab === 'enrolled' && (
          <div>
            {enrolledCourses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={t('studentCourses.noEnrolledTitle') || 'No enrolled courses yet'}
                description={
                  t('studentCourses.noEnrolledDesc') ||
                  'Explore free courses in the catalog and start watching lessons.'
                }
                action={
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {t('studentCourses.browseCatalogBtn') || 'Browse Catalog'}
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                  <div
                    key={course._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video bg-gray-100 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-50 to-amber-100">
                            <Video className="w-12 h-12 text-amber-400" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 rtl:left-auto rtl:right-2 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white">
                          {t('studentCourses.enrolledBadge') || 'Enrolled'}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                          {t(`teacherTaxonomy.subjects.${course.subject}`) || course.subject}
                        </span>
                        <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
                          {course.title}
                        </h3>
                        {course.teacherId && (
                          <p className="text-xs text-gray-600">
                            {t('studentCourses.byTeacher') || 'By'}: {course.teacherId.fullName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {course.totalLessons} {t('studentCourses.lessons') || 'lessons'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => handleOpenCourseDetails(course._id)}
                        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{t('studentCourses.watchLessons') || 'Watch Lessons'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Course Details / Video Player Modal */}
        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="text-amber-700 font-medium">
                      {t(`teacherTaxonomy.subjects.${selectedCourse.subject}`)}
                    </span>
                    <span>•</span>
                    <span>{t(`teacherTaxonomy.levels.${selectedCourse.gradeLevel}`)}</span>
                    {selectedCourse.teacherId && (
                      <>
                        <span>•</span>
                        <span>{selectedCourse.teacherId.fullName}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setActiveLesson(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status messages */}
              {enrollSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{enrollSuccessMessage}</span>
                </div>
              )}

              {enrollErrorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{enrollErrorMessage}</span>
                </div>
              )}

              {/* CHECKOUT VIEW */}
              {isCheckingOut ? (
                <div className="space-y-5 bg-amber-50/40 p-5 rounded-2xl border border-amber-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {t('studentCourses.checkoutTitle') || 'Course Checkout'}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {t('studentCourses.checkoutSubtitle') ||
                          'Select a payment method to purchase and unlock full course access'}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCheckingOut(false)}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                      <span>{t('studentCourses.backToCourse') || 'Back to Course'}</span>
                    </button>
                  </div>

                  {/* Course price display */}
                  <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">
                        {t('studentCourses.checkoutPriceLabel') || 'Course Price:'}
                      </span>
                      <h5 className="font-bold text-gray-900 text-base">{selectedCourse.title}</h5>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-amber-700">
                        {selectedCourse.price} {selectedCourse.currency}
                      </span>
                    </div>
                  </div>

                  {/* Checkout error */}
                  {checkoutError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  {/* Providers loading */}
                  {providersLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-600 mb-2" />
                      <p className="text-xs">{t('studentCourses.loadingCourses') || 'Loading payment options...'}</p>
                    </div>
                  ) : coursePaymentMethods.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-gray-200 text-center text-gray-600 text-sm">
                      {t('studentCourses.noProvidersAvailable') ||
                        'No payment methods are currently available for this course. Please contact support.'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Method Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          {t('studentCourses.paymentMethodLabel') || 'Select Payment Method:'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {coursePaymentMethods.map((method) => {
                            const isSelected = selectedMethod === method.id;
                            const Icon =
                              method.id === 'paypal'
                                ? Wallet
                                : method.id === 'vodafone_cash'
                                ? Smartphone
                                : CreditCard;

                            return (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMethod(method.id);
                                  setCheckoutError('');
                                }}
                                className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-600/20'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className={`p-2 rounded-lg ${
                                      isSelected
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-sm text-gray-900">
                                    {t(method.nameKey) || method.id}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                  {t(method.descKey) || ''}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Method Action Container */}
                      {selectedMethod === 'paypal' ? (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-sm">
                          {checkoutStatus === 'polling' ? (
                            <div className="text-center py-4 space-y-3">
                              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
                              <h5 className="font-semibold text-gray-900 text-sm">
                                {t('studentCourses.paypalPollingMessage') ||
                                  'Waiting for PayPal payment confirmation...'}
                              </h5>
                              <p className="text-xs text-gray-500 max-w-md mx-auto">
                                {t('studentCourses.paypalCapturing') ||
                                  'Please complete your payment in the PayPal window. We will automatically activate your enrollment once verified.'}
                              </p>
                            </div>
                          ) : checkoutStatus === 'success' ? (
                            <div className="text-center py-4 space-y-2">
                              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                              <h5 className="font-bold text-gray-900 text-base">
                                {t('studentCourses.paymentSuccessTitle') || 'Payment Confirmed!'}
                              </h5>
                              <p className="text-xs text-gray-600">
                                {t('studentCourses.paymentSuccessDesc') ||
                                  'Your enrollment is active! All lessons are unlocked.'}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="space-y-0.5">
                                <span className="text-sm font-semibold text-gray-900">
                                  {t('studentCourses.paypalName') || 'PayPal'}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {t('studentCourses.paypalDesc') ||
                                    'Pay securely with your PayPal account or card'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handlePayPalCheckout}
                                disabled={checkoutLoading}
                                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {checkoutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{t('studentCourses.payWithPaypalBtn') || 'Pay with PayPal'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (selectedMethod === 'vodafone_cash' || selectedMethod === 'instapay') ? (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <ManualPaymentFlow
                            paymentMethod={selectedMethod}
                            purpose="COURSE_PURCHASE"
                            courseId={selectedCourse._id}
                            onSubmitted={() => {
                              fetchEnrolled();
                            }}
                            onCancel={() => {
                              setSelectedMethod(null);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : (
                /* NORMAL DETAILS & VIDEO PLAYER VIEW */
                <>
                  {/* Video Player or Locked Banner */}
                  {activeLesson && !activeLesson.isLocked && activeLesson.youtubeVideoId ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeVideoId}?autoplay=1&rel=0`}
                        title={activeLesson.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 flex flex-col items-center justify-center text-white p-6 text-center">
                      <Lock className="w-14 h-14 text-amber-500 mb-3" />
                      <h4 className="text-base font-semibold text-white mb-1">
                        {selectedCourse.isPaid
                          ? t('studentCourses.paidContentLocked') || 'Paid Content Locked'
                          : t('studentCourses.enrollToWatch') || 'Enroll to Watch Video Lessons'}
                      </h4>
                      <p className="text-xs text-gray-300 max-w-md mb-4">
                        {selectedCourse.isPaid
                          ? selectedCourse.isEnrolled
                            ? t('studentCourses.pendingReviewDesc') || 'Your payment proof has been submitted and is pending administrative review.'
                            : t('studentCourses.checkoutSubtitle') ||
                              'Select a payment method to purchase and unlock full course access'
                          : t('studentCourses.freeEnrollNotice') ||
                            'This course is free. Click the button below to enroll and immediately unlock all recorded lessons.'}
                      </p>

                      {/* Call-to-action buttons */}
                      {selectedCourse.isPaid ? (
                        !selectedCourse.isEnrolled && (
                          <button
                            onClick={handleStartCheckout}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>
                              {t('studentCourses.buyCourseBtn', {
                                price: selectedCourse.price,
                                currency: selectedCourse.currency,
                              }) || `Enroll Now (${selectedCourse.price} ${selectedCourse.currency})`}
                            </span>
                          </button>
                        )
                      ) : (
                        !selectedCourse.isEnrolled && (
                          <button
                            onClick={() => handleEnrollFree(selectedCourse._id)}
                            disabled={enrolling}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {enrolling && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{t('studentCourses.enrollNowBtn') || 'Enroll for Free'}</span>
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* Lesson meta if playing */}
                  {activeLesson && (
                    <div className="bg-gray-50 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">{activeLesson.title}</h4>
                        <span className="text-xs text-gray-500">{activeLesson.durationMinutes} mins</span>
                      </div>
                      {activeLesson.description && (
                        <p className="text-xs text-gray-600">{activeLesson.description}</p>
                      )}
                    </div>
                  )}

                  {/* Curriculum List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {t('studentCourses.curriculumTitle') || 'Course Curriculum'} (
                        {selectedCourse.lessons?.length || 0})
                      </h4>
                      {!selectedCourse.isEnrolled && (
                        selectedCourse.isPaid ? (
                          <button
                            onClick={handleStartCheckout}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                          >
                            {t('studentCourses.buyCourseBtn', {
                              price: selectedCourse.price,
                              currency: selectedCourse.currency,
                            }) || `Enroll Now (${selectedCourse.price} ${selectedCourse.currency})`}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnrollFree(selectedCourse._id)}
                            disabled={enrolling}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                          >
                            {t('studentCourses.enrollToUnlockAll') || 'Enroll for free to unlock all'}
                          </button>
                        )
                      )}
                    </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {selectedCourse.lessons?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {t('studentCourses.noLessons') || 'No lessons available.'}
                    </div>
                  ) : (
                    selectedCourse.lessons?.map((lesson) => {
                      const isSelected = activeLesson?._id === lesson._id;
                      const isLocked = lesson.isLocked;

                      return (
                        <div
                          key={lesson._id}
                          onClick={() => {
                            if (!isLocked) setActiveLesson(lesson);
                          }}
                          className={`p-3.5 flex items-center justify-between transition-colors ${
                            isLocked
                              ? 'opacity-60 bg-gray-50/50 cursor-not-allowed'
                              : 'hover:bg-amber-50/40 cursor-pointer'
                          } ${isSelected ? 'bg-amber-50/80 border-l-4 border-amber-600' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                              {lesson.order}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                              {lesson.description && (
                                <div className="text-xs text-gray-500 line-clamp-1">
                                  {lesson.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{lesson.durationMinutes} mins</span>
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Play className="w-4 h-4 text-amber-600" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
</DashboardLayout>
  );
};

export default StudentCourses;
