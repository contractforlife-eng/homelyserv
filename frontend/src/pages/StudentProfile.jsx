// frontend/src/pages/StudentProfile.jsx
// ============================================================
// STUDENT PROFILE PAGE
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  User,
  GraduationCap,
  BookOpen,
  MapPin,
  Building,
  Save,
  Pencil,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Calendar,
  FileText
} from 'lucide-react';

const ViewField = ({ label, value, icon: Icon }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
      {Icon && <Icon size={14} className="text-red-500" />}
      <span>{label}</span>
    </label>
    <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-900 dark:text-white min-h-[42px] flex items-center">
      {value ? (
        <span className="truncate">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">—</span>
      )}
    </div>
  </div>
);

const StudentProfile = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore((state) => state.user);
  const updateStoreUser = useAuthStore((state) => state.updateProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    school: '',
    gradeLevel: '',
    educationLevel: '',
    subjects: [],
    country: '',
    city: '',
    address: '',
    notes: '',
    isProfileComplete: false
  });

  const [subjectInput, setSubjectInput] = useState('');
  const [snapshot, setSnapshot] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/api/students/profile');
      if (res.data?.success && res.data?.profile) {
        const p = res.data.profile;
        const initial = {
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          gender: p.gender || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
          school: p.school || '',
          gradeLevel: p.gradeLevel || '',
          educationLevel: p.educationLevel || '',
          subjects: Array.isArray(p.subjects) ? p.subjects : [],
          country: p.country || '',
          city: p.city || '',
          address: p.address || '',
          notes: p.notes || '',
          isProfileComplete: p.isProfileComplete || false
        };
        setFormData(initial);
        setSnapshot(initial);
      }
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
      setErrorMessage(t('studentProfile.loadError') || 'Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const trimmed = subjectInput.trim();
      if (trimmed && !formData.subjects.includes(trimmed)) {
        setFormData((prev) => ({
          ...prev,
          subjects: [...prev.subjects, trimmed]
        }));
        setSubjectInput('');
      }
    }
  };

  const handleRemoveSubject = (subToRemove) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subToRemove)
    }));
  };

  const handleCancel = () => {
    if (snapshot) {
      setFormData(snapshot);
    }
    setSubjectInput('');
    setErrorMessage('');
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null,
        school: formData.school,
        gradeLevel: formData.gradeLevel,
        educationLevel: formData.educationLevel,
        subjects: formData.subjects,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        notes: formData.notes
      };

      const res = await api.put('/api/students/profile', payload);
      if (res.data?.success && res.data?.profile) {
        const p = res.data.profile;
        const updated = {
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          gender: p.gender || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
          school: p.school || '',
          gradeLevel: p.gradeLevel || '',
          educationLevel: p.educationLevel || '',
          subjects: Array.isArray(p.subjects) ? p.subjects : [],
          country: p.country || '',
          city: p.city || '',
          address: p.address || '',
          notes: p.notes || '',
          isProfileComplete: p.isProfileComplete || false
        };
        setFormData(updated);
        setSnapshot(updated);
        setIsEditing(false);
        setSuccessMessage(t('studentProfile.saveSuccess') || 'Student profile updated successfully.');

        // Update user state in authStore if user object is returned
        if (res.data.user) {
          useAuthStore.setState((state) => ({
            user: { ...state.user, ...res.data.user }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to save student profile:', err);
      setErrorMessage(
        err.response?.data?.message || t('studentProfile.saveError') || 'Failed to save student profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const fullNameDisplay = `${formData.firstName} ${formData.lastName}`.trim() || authUser?.fullName || 'Student';

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('studentProfile.headerTitle') || 'Student Profile'}
        badge={t('studentNav.studentPortal') || 'Student Portal'}
        badgeColor="red"
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-600 hover:text-red-800 dark:hover:text-red-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-red-500/20 shrink-0">
                {fullNameDisplay ? fullNameDisplay.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {fullNameDisplay}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Mail size={12} />
                    <span>{authUser?.email}</span>
                  </span>
                  {authUser?.phone && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Phone size={12} />
                      <span>{authUser.phone}</span>
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      formData.isProfileComplete
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {formData.isProfileComplete
                      ? t('studentProfile.profileCompleteBadge') || 'Completed'
                      : t('studentProfile.profileIncompleteBadge') || 'Needs Information'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-sm"
                >
                  <Pencil size={16} />
                  <span>{t('studentProfile.editProfileBtn') || 'Edit Profile'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
                  >
                    <X size={16} />
                    <span>{t('studentProfile.cancel') || 'Cancel'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span>{t('studentProfile.saveChanges') || 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('studentProfile.loading') || 'Loading student profile...'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                <User size={18} className="text-red-600" />
                <span>{t('studentProfile.basicInfoTitle') || 'Basic Information'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.firstNameLabel') || 'First Name'}
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="e.g. John"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.lastNameLabel') || 'Last Name'}
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="e.g. Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.genderLabel') || 'Gender'}
                      </label>
                      <select
                        name="gender"
                        value={formData.gender?.toUpperCase() || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      >
                        <option value="">{t('studentProfile.genderSelect') || 'Select Gender'}</option>
                        <option value="MALE">{t('studentProfile.genderMale') || 'Male'}</option>
                        <option value="FEMALE">{t('studentProfile.genderFemale') || 'Female'}</option>
                        <option value="OTHER">{t('studentProfile.genderOther') || 'Other'}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.dateOfBirthLabel') || 'Date of Birth'}
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <ViewField
                      label={t('studentProfile.firstNameLabel') || 'First Name'}
                      value={formData.firstName}
                    />
                    <ViewField
                      label={t('studentProfile.lastNameLabel') || 'Last Name'}
                      value={formData.lastName}
                    />
                    <ViewField
                      label={t('studentProfile.genderLabel') || 'Gender'}
                      value={
                        formData.gender?.toUpperCase() === 'MALE'
                          ? t('studentProfile.genderMale') || 'Male'
                          : formData.gender?.toUpperCase() === 'FEMALE'
                          ? t('studentProfile.genderFemale') || 'Female'
                          : formData.gender?.toUpperCase() === 'OTHER'
                          ? t('studentProfile.genderOther') || 'Other'
                          : formData.gender
                      }
                    />
                    <ViewField
                      label={t('studentProfile.dateOfBirthLabel') || 'Date of Birth'}
                      value={formData.dateOfBirth}
                      icon={Calendar}
                    />
                  </>
                )}
              </div>
            </div>

            {/* 2. Academic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                <GraduationCap size={18} className="text-red-600" />
                <span>{t('studentProfile.academicInfoTitle') || 'Academic Information'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isEditing ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.schoolLabel') || 'School / Academy'}
                      </label>
                      <input
                        type="text"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder={t('studentProfile.schoolPlaceholder') || 'e.g. Al-Amal High School'}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.gradeLevelLabel') || 'Grade / Year'}
                      </label>
                      <input
                        type="text"
                        name="gradeLevel"
                        value={formData.gradeLevel}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder={t('studentProfile.gradeLevelPlaceholder') || 'e.g. 10th Grade'}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.educationLevelLabel') || 'Education Level'}
                      </label>
                      <select
                        name="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      >
                        <option value="">{t('studentProfile.educationLevelSelect') || 'Select Level'}</option>
                        <option value="PRIMARY">{t('studentProfile.educationPrimary') || 'Primary'}</option>
                        <option value="PREPARATORY">{t('studentProfile.educationPreparatory') || 'Preparatory / Middle'}</option>
                        <option value="SECONDARY">{t('studentProfile.educationSecondary') || 'Secondary / High School'}</option>
                        <option value="UNIVERSITY">{t('studentProfile.educationUniversity') || 'University'}</option>
                        <option value="OTHER">{t('studentProfile.educationOther') || 'Other'}</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <ViewField
                      label={t('studentProfile.schoolLabel') || 'School / Academy'}
                      value={formData.school}
                      icon={Building}
                    />
                    <ViewField
                      label={t('studentProfile.gradeLevelLabel') || 'Grade / Year'}
                      value={formData.gradeLevel}
                      icon={GraduationCap}
                    />
                    <ViewField
                      label={t('studentProfile.educationLevelLabel') || 'Education Level'}
                      value={
                        formData.educationLevel
                          ? formData.educationLevel.charAt(0).toUpperCase() +
                            formData.educationLevel.slice(1).toLowerCase()
                          : ''
                      }
                      icon={BookOpen}
                    />
                  </>
                )}
              </div>

              {/* Subjects / Interests */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t('studentProfile.subjectsLabel') || 'Subjects / Interests'}
                </label>

                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={handleAddSubject}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder={t('studentProfile.subjectsPlaceholder') || 'Add subject and press Enter'}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <Plus size={16} />
                      <span>Add</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.subjects.length > 0 ? (
                    formData.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/50 text-xs font-medium"
                      >
                        <span>{sub}</span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub)}
                            className="text-red-400 hover:text-red-700"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                      {t('studentProfile.noSubjects') || 'No subjects listed yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Location & Address */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                <MapPin size={18} className="text-red-600" />
                <span>{t('studentProfile.contactInfoTitle') || 'Location & Contact'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isEditing ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.countryLabel') || 'Country'}
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="e.g. Egypt"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.cityLabel') || 'City'}
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="e.g. Cairo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('studentProfile.addressLabel') || 'Address'}
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="Street or neighborhood"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <ViewField
                      label={t('studentProfile.countryLabel') || 'Country'}
                      value={formData.country}
                      icon={MapPin}
                    />
                    <ViewField
                      label={t('studentProfile.cityLabel') || 'City'}
                      value={formData.city}
                      icon={MapPin}
                    />
                    <ViewField
                      label={t('studentProfile.addressLabel') || 'Address'}
                      value={formData.address}
                      icon={MapPin}
                    />
                  </>
                )}
              </div>
            </div>

            {/* 4. Notes / Learning Objectives */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                <FileText size={18} className="text-red-600" />
                <span>{t('studentProfile.notesTitle') || 'Additional Notes & Goals'}</span>
              </h3>

              {isEditing ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t('studentProfile.notesLabel') || 'Notes / Learning Objectives'}
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder={t('studentProfile.notesPlaceholder') || 'Describe your learning goals, preferred subjects, or any special requests...'}
                  />
                </div>
              ) : (
                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-900 dark:text-white min-h-[80px] whitespace-pre-wrap">
                  {formData.notes || (
                    <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                  )}
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
