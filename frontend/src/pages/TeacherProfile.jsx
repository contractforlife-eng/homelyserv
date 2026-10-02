// frontend/src/pages/TeacherProfile.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { TEACHER_SUBJECTS, TEACHING_LEVELS, TEACHING_METHODS } from '../constants/teacherTaxonomy';
import TrustVerificationSection from '../components/verification/TrustVerificationSection';
import api from '../utils/api';
import { getAccountCurrency, SUPPORTED_CURRENCIES } from '../utils/currencyPresentation';
import {
  User,
  Award,
  BookOpen,
  GraduationCap,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  Upload,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Lock,
  BadgeCheck,
  Banknote,
  Pencil,
  X
} from 'lucide-react';

const ViewValue = ({ children, className = '' }) => {
  const isEmpty = children === '' || children === null || children === undefined;
  return (
    <div
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words ${className}`}
    >
      {isEmpty ? '—' : children}
    </div>
  );
};

const TeacherProfile = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const uploadProfilePhoto = useAuthStore(state => state.uploadProfilePhoto);
  const updateAccountProfile = useAuthStore(state => state.updateProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verification, setVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  const handleVerificationUpdated = (updatedVerification) => {
    if (updatedVerification) {
      setVerification(updatedVerification);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  // SECTION A — Basic account info
  const [fullName, setFullName] = useState('');
  const [initialFullName, setInitialFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialPhone, setInitialPhone] = useState('');
  const [account, setAccount] = useState({
    email: '',
    emailVerified: false,
    phone: '',
    phoneVerified: false,
    phoneVerificationStatus: null
  });
  const [currency, setCurrency] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    mainSubject: '',
    additionalSubjects: [],
    specialization: '',
    teachingLevels: [],
    teachingMethod: 'both',
    experienceSummary: '',
    bio: '',
    yearsOfExperience: 0,
    languages: [],
    qualifications: [],
    education: [],
    certifications: [],
    hourlyRate: '',
    lessonRate: '',
    pricingCurrency: '',
    availableForNewStudents: true,
    isProfileComplete: false
  });

  // Array input helpers
  const [langInput, setLangInput] = useState('');
  const [qualInput, setQualInput] = useState('');
  const [eduInput, setEduInput] = useState('');
  const [certInput, setCertInput] = useState('');

  // Load teacher profile
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const res = await api.get('/api/teachers/profile');
        if (!isMounted) return;

        if (res.data?.success) {
          const user = res.data.user || {};
          const prof = res.data.profile || {};
          const cur = res.data.currency || 'EGP';

          setFullName(user.fullName || '');
          setInitialFullName(user.fullName || '');
          setPhone(user.phone || '');
          setInitialPhone(user.phone || '');
          setAccount({
            email: user.email || '',
            emailVerified: Boolean(user.emailVerified),
            phone: user.phone || '',
            phoneVerified: Boolean(user.phoneVerified),
            phoneVerificationStatus: user.phoneVerificationStatus || null
          });
          setCurrency(cur);

          const resolvedLessonRate = (prof.lessonRate !== undefined && prof.lessonRate !== null)
            ? String(prof.lessonRate)
            : (prof.hourlyRate !== undefined && prof.hourlyRate !== null ? String(prof.hourlyRate) : '');
          const resolvedCurrency = prof.pricingCurrency || '';

          const loadedData = {
            title: prof.title || '',
            mainSubject: prof.mainSubject || '',
            additionalSubjects: Array.isArray(prof.additionalSubjects) ? prof.additionalSubjects : [],
            specialization: prof.specialization || '',
            teachingLevels: Array.isArray(prof.teachingLevels) ? prof.teachingLevels : [],
            teachingMethod: prof.teachingMethod || 'both',
            experienceSummary: prof.experienceSummary || '',
            bio: prof.bio || '',
            yearsOfExperience: prof.yearsOfExperience || 0,
            languages: Array.isArray(prof.languages) ? prof.languages : [],
            qualifications: Array.isArray(prof.qualifications) ? prof.qualifications : [],
            education: Array.isArray(prof.education) ? prof.education : [],
            certifications: Array.isArray(prof.certifications) ? prof.certifications : [],
            hourlyRate: resolvedLessonRate,
            lessonRate: resolvedLessonRate,
            pricingCurrency: resolvedCurrency,
            availableForNewStudents: prof.availableForNewStudents !== undefined ? Boolean(prof.availableForNewStudents) : true,
            isProfileComplete: Boolean(prof.isProfileComplete)
          };

          setFormData(loadedData);
          setSavedSnapshot({
            fullName: user.fullName || '',
            phone: user.phone || '',
            formData: JSON.parse(JSON.stringify(loadedData))
          });

          if (res.data.verification) {
            setVerification(res.data.verification);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load teacher profile:', err);
        setErrorMessage(err.response?.data?.message || t('teacherProfile.loadError') || 'Failed to load profile.');
      } finally {
        if (isMounted) {
          setLoading(false);
          setVerificationLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const handleCancelEdit = () => {
    if (savedSnapshot) {
      setFullName(savedSnapshot.fullName);
      setPhone(savedSnapshot.phone || '');
      setFormData(JSON.parse(JSON.stringify(savedSnapshot.formData)));
    }
    setLangInput('');
    setQualInput('');
    setEduInput('');
    setCertInput('');
    setErrorMessage('');
    setIsEditing(false);
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      setErrorMessage('');
      setSaveSuccess(false);

      const nameChanged = fullName.trim() !== initialFullName.trim();
      const phoneChanged = phone.trim() !== initialPhone.trim();

      // Save full name / phone to auth/profile if changed
      if (nameChanged || phoneChanged) {
        const accountUpdates = {};
        if (nameChanged) accountUpdates.fullName = fullName.trim();
        if (phoneChanged) accountUpdates.phone = phone.trim();

        const authRes = await updateAccountProfile(accountUpdates);

        if (nameChanged) {
          setInitialFullName(fullName.trim());
        }

        if (phoneChanged) {
          const updatedPhone = phone.trim();
          setInitialPhone(updatedPhone);
          setAccount(prev => ({
            ...prev,
            phone: updatedPhone,
            phoneVerified: false,
            phoneVerificationStatus: 'NOT_VERIFIED'
          }));
          setVerification(prev => prev ? {
            ...prev,
            phone: {
              status: 'NOT_VERIFIED',
              verified: false,
              verifiedAt: null
            }
          } : prev);
        }
      }

      // Save teacher profile fields
      const payload = {
        title: formData.title,
        mainSubject: formData.mainSubject,
        additionalSubjects: formData.additionalSubjects,
        specialization: formData.specialization,
        teachingLevels: formData.teachingLevels,
        teachingMethod: formData.teachingMethod,
        experienceSummary: formData.experienceSummary,
        bio: formData.bio,
        yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        languages: formData.languages,
        qualifications: formData.qualifications,
        education: formData.education,
        certifications: formData.certifications,
        hourlyRate: (formData.lessonRate || formData.hourlyRate) ? Number(formData.lessonRate || formData.hourlyRate) : 0,
        lessonRate: (formData.lessonRate || formData.hourlyRate) ? Number(formData.lessonRate || formData.hourlyRate) : 0,
        pricingCurrency: formData.pricingCurrency || undefined,
        availableForNewStudents: formData.availableForNewStudents
      };

      const res = await api.put('/api/teachers/profile', payload);

      if (res.data?.success) {
        const updatedProf = res.data.profile || {};
        const savedData = {
          ...formData,
          isProfileComplete: Boolean(updatedProf.isProfileComplete)
        };
        setFormData(savedData);
        setSavedSnapshot({
          fullName: fullName.trim(),
          phone: phone.trim(),
          formData: JSON.parse(JSON.stringify(savedData))
        });
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save teacher profile:', err);
      setErrorMessage(err.response?.data?.message || t('teacherProfile.saveError') || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMessage('');
      await uploadProfilePhoto(file);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setErrorMessage(err.message || t('teacherProfile.photoUploadError') || 'Failed to upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Helper chips
  const addChip = (field, value, clearFn) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!formData[field].includes(trimmed)) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], trimmed] }));
    }
    clearFn('');
  };

  const removeChip = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const toggleLevel = (val) => {
    setFormData(prev => {
      const exists = prev.teachingLevels.includes(val);
      const nextLevels = exists
        ? prev.teachingLevels.filter(x => x !== val)
        : [...prev.teachingLevels, val];
      return { ...prev, teachingLevels: nextLevels };
    });
  };

  const toggleAdditionalSubject = (val) => {
    setFormData(prev => {
      const exists = prev.additionalSubjects.includes(val);
      const nextSubjects = exists
        ? prev.additionalSubjects.filter(x => x !== val)
        : [...prev.additionalSubjects, val];
      return { ...prev, additionalSubjects: nextSubjects };
    });
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="TEACHER">
        <DashboardHeader title={t('teacherProfile.headerTitle') || 'Teacher Profile'} />
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('teacherProfile.loading') || 'Loading teacher profile...'}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="TEACHER">
      <DashboardHeader title={t('teacherProfile.headerTitle') || 'Teacher Profile'} />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Profile Completion & Edit Mode Banner */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shadow-inner">
                {authUser?.profileImage ? (
                  <img
                    src={authUser.profileImage}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={36} />
                )}
              </div>
              <label
                htmlFor="teacher-photo-input"
                className="absolute -bottom-1 -end-1 p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer transition-colors"
                title={t('teacherProfile.changePhoto') || 'Change Photo'}
              >
                {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </label>
              <input
                id="teacher-photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingImage}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {fullName || 'Teacher'}
                </h1>
                {formData.isProfileComplete ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle size={12} />
                    {t('teacherProfile.profileComplete') || 'Complete'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                    <AlertCircle size={12} />
                    {t('teacherProfile.profileIncomplete') || 'Incomplete'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.title || t('teacherProfile.defaultTitle') || 'Professional Educator'} • {account.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
              >
                <Pencil size={16} />
                {t('teacherProfile.editProfileBtn') || 'Edit Profile'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                >
                  {t('teacherProfile.cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {t('teacherProfile.saveChanges') || 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback banners */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
            <CheckCircle size={18} className="shrink-0 text-emerald-600" />
            <span>{t('teacherProfile.saveSuccess') || 'Profile updated successfully.'}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-sm">
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <User size={20} className="text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('teacherProfile.sectionBasicInfo') || 'Basic Information'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.fullName') || 'Full Name'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="e.g. John Doe"
                />
              ) : (
                <ViewValue>{fullName}</ViewValue>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.professionalTitle') || 'Professional Title'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="e.g. Senior High School Mathematics Teacher"
                  maxLength={100}
                />
              ) : (
                <ViewValue>{formData.title}</ViewValue>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.accountEmail') || 'Email (Read Only)'}
              </label>
              <ViewValue>{account.email}</ViewValue>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.accountPhone') || 'Phone Number'}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="+1234567890"
                />
              ) : (
                <ViewValue>{phone || account.phone || '—'}</ViewValue>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Teaching Specialization & Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <BookOpen size={20} className="text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('teacherProfile.sectionTeaching') || 'Teaching Details'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.mainSubject') || 'Main Subject'}
              </label>
              {isEditing ? (
                <select
                  value={formData.mainSubject}
                  onChange={(e) => setFormData({ ...formData, mainSubject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="">{t('teacherProfile.selectMainSubject') || 'Select Main Subject'}</option>
                  {TEACHER_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(s.labelKey) || s.value}
                    </option>
                  ))}
                </select>
              ) : (
                <ViewValue>
                  {formData.mainSubject
                    ? t(`teacherTaxonomy.subjects.${formData.mainSubject}`) || formData.mainSubject
                    : '—'}
                </ViewValue>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.specialization') || 'Detailed Specialization'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="e.g. Calculus, Linear Algebra, IGCSE Prep"
                  maxLength={120}
                />
              ) : (
                <ViewValue>{formData.specialization}</ViewValue>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.yearsOfExperience') || 'Years of Experience'}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              ) : (
                <ViewValue>{formData.yearsOfExperience} {t('teacherProfile.years') || 'years'}</ViewValue>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.teachingMethod') || 'Teaching Method'}
              </label>
              {isEditing ? (
                <select
                  value={formData.teachingMethod}
                  onChange={(e) => setFormData({ ...formData, teachingMethod: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {TEACHING_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {t(m.labelKey) || m.value}
                    </option>
                  ))}
                </select>
              ) : (
                <ViewValue>
                  {t(`teacherTaxonomy.methods.${formData.teachingMethod}`) || formData.teachingMethod}
                </ViewValue>
              )}
            </div>
          </div>

          {/* Additional Subjects */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('teacherProfile.additionalSubjects') || 'Additional Subjects'}
            </label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {TEACHER_SUBJECTS.filter(s => s.value !== formData.mainSubject).map((s) => {
                  const selected = formData.additionalSubjects.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleAdditionalSubject(s.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {t(s.labelKey) || s.value}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.additionalSubjects.length > 0 ? (
                  formData.additionalSubjects.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40"
                    >
                      {t(`teacherTaxonomy.subjects.${s}`) || s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            )}
          </div>

          {/* Teaching Levels */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('teacherProfile.teachingLevels') || 'Target Teaching Levels / Grades'}
            </label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {TEACHING_LEVELS.map((lvl) => {
                  const selected = formData.teachingLevels.includes(lvl.value);
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => toggleLevel(lvl.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {t(lvl.labelKey) || lvl.value}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.teachingLevels.length > 0 ? (
                  formData.teachingLevels.map((lvl) => (
                    <span
                      key={lvl}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      {t(`teacherTaxonomy.levels.${lvl}`) || lvl}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Pricing & Availability */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Banknote size={20} className="text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('teacherProfile.sectionPricing') || 'Pricing & Availability'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.lessonRate') || t('teacherProfile.hourlyRate') || 'Rate per Lesson'}
              </label>
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={formData.lessonRate !== undefined && formData.lessonRate !== '' ? formData.lessonRate : formData.hourlyRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, lessonRate: val, hourlyRate: val });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="0.00"
                  />
                  <select
                    value={formData.pricingCurrency || ''}
                    onChange={(e) => setFormData({ ...formData, pricingCurrency: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    aria-label={t('teacherProfile.pricingCurrency') || 'Lesson Currency'}
                  >
                    <option value="">
                      {t('teacherProfile.selectCurrency') || 'Select Currency'}
                    </option>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <ViewValue>
                  {(formData.lessonRate !== undefined && formData.lessonRate !== '') || formData.hourlyRate
                    ? `${formData.lessonRate || formData.hourlyRate} ${formData.pricingCurrency || ''}`.trim()
                    : `0 ${formData.pricingCurrency || ''}`.trim()}
                </ViewValue>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('teacherProfile.availabilityStatus') || 'Available for New Students'}
              </label>
              {isEditing ? (
                <label className="flex items-center gap-3 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.availableForNewStudents}
                    onChange={(e) => setFormData({ ...formData, availableForNewStudents: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('teacherProfile.acceptingStudents') || 'Currently accepting new students'}
                  </span>
                </label>
              ) : (
                <ViewValue>
                  {formData.availableForNewStudents
                    ? (t('teacherProfile.acceptingYes') || 'Yes, accepting new students')
                    : (t('teacherProfile.acceptingNo') || 'No, not taking students')}
                </ViewValue>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Bio & Experience Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <GraduationCap size={20} className="text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('teacherProfile.sectionBio') || 'About Me & Teaching Philosophy'}
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('teacherProfile.bio') || 'Biography / About Me'}
            </label>
            {isEditing ? (
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder={t('teacherProfile.bioPlaceholder') || 'Tell prospective students about your background and teaching style...'}
                maxLength={2000}
              />
            ) : (
              <ViewValue>{formData.bio}</ViewValue>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('teacherProfile.experienceSummary') || 'Experience Summary'}
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                value={formData.experienceSummary}
                onChange={(e) => setFormData({ ...formData, experienceSummary: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Summary of schools, tutoring centers, or tutoring history..."
                maxLength={2000}
              />
            ) : (
              <ViewValue>{formData.experienceSummary}</ViewValue>
            )}
          </div>
        </div>

        {/* Section 5: Qualifications, Education & Certificates */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Award size={20} className="text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('teacherProfile.sectionQualifications') || 'Qualifications & Education'}
            </h2>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('teacherProfile.languages') || 'Languages Spoken'}
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('languages', langInput, setLangInput))}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="e.g. English, Arabic, French"
                  />
                  <button
                    type="button"
                    onClick={() => addChip('languages', langInput, setLangInput)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-semibold transition-colors"
                  >
                    {t('teacherProfile.add') || 'Add'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.languages.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40"
                    >
                      {item}
                      <button type="button" onClick={() => removeChip('languages', idx)}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {formData.languages.length > 0 ? (
                  formData.languages.map((l, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {l}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            )}
          </div>

          {/* Education */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('teacherProfile.education') || 'Education & Degrees'}
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eduInput}
                    onChange={(e) => setEduInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('education', eduInput, setEduInput))}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="e.g. B.Sc. in Mathematics, Cairo University (2018)"
                  />
                  <button
                    type="button"
                    onClick={() => addChip('education', eduInput, setEduInput)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-semibold transition-colors"
                  >
                    {t('teacherProfile.add') || 'Add'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.education.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40"
                    >
                      {item}
                      <button type="button" onClick={() => removeChip('education', idx)}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {formData.education.length > 0 ? (
                  formData.education.map((e, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {e}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {t('teacherProfile.certifications') || 'Teaching Certifications & Training'}
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('certifications', certInput, setCertInput))}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="e.g. TEFL Certificate, Cambridge Certified Tutor"
                  />
                  <button
                    type="button"
                    onClick={() => addChip('certifications', certInput, setCertInput)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-semibold transition-colors"
                  >
                    {t('teacherProfile.add') || 'Add'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.certifications.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40"
                    >
                      {item}
                      <button type="button" onClick={() => removeChip('certifications', idx)}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {formData.certifications.length > 0 ? (
                  formData.certifications.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Canonical Trust & Verification */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <TrustVerificationSection
            verification={verification}
            loading={verificationLoading}
            userId={authUser?.id || authUser?._id}
            userRole="TEACHER"
            isOwnProfile={true}
            isAdmin={false}
            doctorMode={false}
            onVerificationUpdated={handleVerificationUpdated}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherProfile;
