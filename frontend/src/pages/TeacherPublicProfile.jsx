// frontend/src/pages/TeacherPublicProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import LegalFooter from '../components/common/LegalFooter';
import {
  BookOpen,
  GraduationCap,
  Clock,
  Globe,
  Share2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Send,
  Loader2,
  BadgeCheck
} from 'lucide-react';

export default function TeacherPublicProfile() {
  const { id } = useParams();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teacher, setTeacher] = useState(null);

  // Inquiry form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  // Share state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTeacher() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/public/teachers/${id}`);
        if (res.data?.success) {
          setTeacher(res.data.teacher);
          if (res.data.teacher?.mainSubject) {
            setSubject(res.data.teacher.mainSubject);
          }
        } else {
          setError(t('publicProfile.notFound') || 'Teacher profile not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || t('publicProfile.notFound') || 'Teacher profile not found');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTeacher();
    }
  }, [id, t]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: teacher?.fullName || 'Teacher Profile',
          text: `${teacher?.fullName} - ${teacher?.title || teacher?.mainSubject}`,
          url
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleInquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setInquiryError('');

    try {
      const res = await api.post(`/api/public/teachers/${id}/inquiries`, {
        name: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim(),
        subject: subject.trim(),
        gradeLevel: gradeLevel.trim(),
        requestedDate,
        requestedTime,
        message: notes.trim()
      });

      if (res.data?.success) {
        setInquirySuccess(true);
      } else {
        setInquiryError(res.data?.message || t('publicProfile.inquiryFailed') || 'Failed to submit inquiry');
      }
    } catch (err) {
      setInquiryError(err.response?.data?.message || t('publicProfile.inquiryFailed') || 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-between">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        </div>
        <LegalFooter />
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-xl mx-auto my-16 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error || t('publicProfile.notFound') || 'Profile Not Found'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('publicProfile.teacherNotFoundDesc') || 'This teacher profile is not available or is currently unpublished.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
          >
            {t('publicProfile.backHome') || 'Back to Home'}
          </Link>
        </div>
        <LegalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={teacher.avatar || 'https://via.placeholder.com/150'}
              alt={teacher.fullName}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-red-100 dark:border-red-900/50 shadow-md"
            />
            <div className="flex-1 text-center sm:text-start">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                  {teacher.fullName}
                </h1>
                {teacher.isVerified && <BadgeCheck className="w-6 h-6 text-red-600 shrink-0" />}
              </div>
              <p className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                {teacher.title || teacher.mainSubject}
              </p>
              {teacher.specialization && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {teacher.specialization}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-3">
                {teacher.yearsOfExperience > 0 && (
                  <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg">
                    <Clock size={16} className="text-gray-500" />
                    {teacher.yearsOfExperience} {t('publicProfile.yearsExp') || 'Years Experience'}
                  </span>
                )}
                {teacher.hourlyRate > 0 && (
                  <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg font-semibold">
                    {teacher.hourlyRate} {teacher.pricingCurrency || 'EGP'} / {t('publicProfile.hour') || 'Hour'}
                  </span>
                )}
                {teacher.lessonRate > 0 && (
                  <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg font-semibold">
                    {teacher.lessonRate} {teacher.pricingCurrency || 'EGP'} / {t('publicProfile.lesson') || 'Lesson'}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleShare}
              className="absolute top-6 end-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-semibold shadow-sm transition-colors"
            >
              <Share2 size={15} />
              <span>{copied ? (t('copied') || 'Copied!') : (t('share') || 'Share Profile')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Details Column */}
          <div className="lg:col-span-1 space-y-6">
            {teacher.bio && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-red-600" />
                  {t('about') || 'About Teacher'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {teacher.bio}
                </p>
              </div>
            )}

            {Array.isArray(teacher.teachingLevels) && teacher.teachingLevels.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <GraduationCap size={18} className="text-red-600" />
                  {t('publicProfile.teachingLevels') || 'Teaching Levels'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {teacher.teachingLevels.map((lvl) => (
                    <span
                      key={lvl}
                      className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-xs font-medium text-gray-800 dark:text-gray-200 capitalize"
                    >
                      {String(lvl).replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inquiry Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="pb-4 border-b border-gray-100 dark:border-gray-700 mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={20} className="text-red-600" />
                  {t('publicProfile.inquireLessonTitle') || 'Request a Lesson / Inquiry'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t('publicProfile.inquireLessonDesc') || 'Send a message directly to the teacher to arrange lessons.'}
                </p>
              </div>

              {inquirySuccess ? (
                <div className="p-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl text-center">
                  <CheckCircle size={36} className="text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-200 mb-1">
                    {t('publicProfile.inquirySent') || 'Inquiry Sent!'}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t('publicProfile.inquirySentDesc') || 'Your lesson inquiry has been submitted and is pending teacher review. The teacher will contact you directly.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquiry} className="space-y-4">
                  {inquiryError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      <span>{inquiryError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('full_name') || 'Student / Parent Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Sarah Smith"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('phone') || 'Contact Phone Number'} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="e.g. +201012345678"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('publicProfile.subject') || 'Subject'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Mathematics"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('publicProfile.gradeLevel') || 'Grade / Level'}
                      </label>
                      <input
                        type="text"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        placeholder="e.g. 10th Grade"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('publicProfile.preferredDate') || 'Preferred Date'}
                      </label>
                      <input
                        type="date"
                        value={requestedDate}
                        onChange={(e) => setRequestedDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('publicProfile.preferredTime') || 'Preferred Time'}
                      </label>
                      <input
                        type="time"
                        value={requestedTime}
                        onChange={(e) => setRequestedTime(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('publicProfile.notes') || 'Additional Notes / Message'}
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Details about current curriculum or goals..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>{t('publicProfile.sendInquiryBtn') || 'Submit Lesson Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
