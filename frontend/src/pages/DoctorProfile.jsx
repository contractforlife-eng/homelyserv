// frontend/src/pages/DoctorProfile.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { DOCTOR_SPECIALTIES } from '../constants/doctorSpecialties';
import api from '../utils/api';
import {
  User,
  Award,
  FileText,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  Upload,
  Camera,
  Eye,
  EyeOff
} from 'lucide-react';

const DoctorProfile = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const uploadProfilePhoto = useAuthStore(state => state.uploadProfilePhoto);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    professionalTitle: '',
    specialty: '',
    subspecialty: '',
    bio: '',
    yearsOfExperience: 0,
    languages: [],
    qualifications: [],
    licenseNumber: '',
    licenseAuthority: '',
    profileImage: '',
    isProfileComplete: false,
    isPublished: false,
    searchVisibility: false
  });

  const [newLanguage, setNewLanguage] = useState('');
  const [newQualification, setNewQualification] = useState('');

  // Fetch initial profile
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const res = await api.get('/api/doctors/profile');
        if (isMounted && res.data?.success) {
          const profile = res.data.profile || {};
          const user = res.data.user || {};
          setFormData({
            professionalTitle: profile.professionalTitle || '',
            specialty: profile.specialty || '',
            subspecialty: profile.subspecialty || '',
            bio: profile.bio || '',
            yearsOfExperience: profile.yearsOfExperience || 0,
            languages: Array.isArray(profile.languages) ? profile.languages : [],
            qualifications: Array.isArray(profile.qualifications) ? profile.qualifications : [],
            licenseNumber: profile.licenseNumber || '',
            licenseAuthority: profile.licenseAuthority || '',
            profileImage: profile.profileImage || user.profileImage || authUser?.profileImage || '',
            isProfileComplete: Boolean(profile.isProfileComplete),
            isPublished: Boolean(profile.isPublished),
            searchVisibility: Boolean(profile.searchVisibility)
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching doctor profile:', err);
          setErrorMessage(err.response?.data?.message || t('doctorProfile.loadError') || 'Failed to load doctor profile');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();
    return () => { isMounted = false; };
  }, [authUser?.profileImage, t]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
    setErrorMessage('');
  };

  const handleAddLanguage = (e) => {
    e.preventDefault();
    const trimmed = newLanguage.trim();
    if (!trimmed) return;
    if (formData.languages.includes(trimmed)) return;
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, trimmed]
    }));
    setNewLanguage('');
  };

  const handleRemoveLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
    }));
  };

  const handleAddQualification = (e) => {
    e.preventDefault();
    const trimmed = newQualification.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, trimmed]
    }));
    setNewQualification('');
  };

  const handleRemoveQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMessage('');
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);

      // Using existing uploadProfilePhoto service if available or direct api
      const res = await api.post('/api/users/profile-photo', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.profileImage) {
        handleInputChange('profileImage', res.data.profileImage);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      // Fallback local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('profileImage', reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage('');
      setSaveSuccess(false);

      const payload = {
        professionalTitle: formData.professionalTitle,
        specialty: formData.specialty,
        subspecialty: formData.subspecialty,
        bio: formData.bio,
        yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        languages: formData.languages,
        qualifications: formData.qualifications,
        licenseNumber: formData.licenseNumber,
        licenseAuthority: formData.licenseAuthority,
        profileImage: formData.profileImage,
        isPublished: formData.isPublished,
        searchVisibility: formData.searchVisibility
      };

      const res = await api.put('/api/doctors/profile', payload);
      if (res.data?.success) {
        setSaveSuccess(true);
        if (res.data.profile) {
          setFormData(prev => ({
            ...prev,
            isProfileComplete: res.data.profile.isProfileComplete,
            isPublished: res.data.profile.isPublished,
            searchVisibility: res.data.profile.searchVisibility
          }));
        }
      }
    } catch (err) {
      console.error('Error saving doctor profile:', err);
      setErrorMessage(err.response?.data?.message || t('doctorProfile.saveError') || 'Failed to save doctor profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="DOCTOR">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <DashboardHeader
          title={t('doctorProfile.headerTitle') || 'Doctor Profile'}
        />

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3 text-green-800 dark:text-green-200 text-sm">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span>{t('doctorProfile.saveSuccess') || 'Your doctor profile has been saved successfully.'}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-800 dark:text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Basic Information */}
          <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('doctorProfile.basicInfoTitle') || 'Basic Information'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('doctorProfile.basicInfoDesc') || 'Your medical specialty and professional public details.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.professionalTitle') || 'Professional Title'}
                </label>
                <input
                  type="text"
                  value={formData.professionalTitle}
                  onChange={(e) => handleInputChange('professionalTitle', e.target.value)}
                  placeholder="e.g. Consultant Pediatrician, Senior Surgeon"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.specialty') || 'Medical Specialty'}
                </label>
                <select
                  value={formData.specialty}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <option value="">{t('doctorProfile.selectSpecialty') || '-- Select Medical Specialty --'}</option>
                  {DOCTOR_SPECIALTIES.map(spec => (
                    <option key={spec.value} value={spec.value}>
                      {t(spec.labelKey, spec.value)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.subspecialty') || 'Subspecialty'}
                </label>
                <input
                  type="text"
                  value={formData.subspecialty}
                  onChange={(e) => handleInputChange('subspecialty', e.target.value)}
                  placeholder="e.g. Pediatric Cardiology, Neonatology"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.yearsOfExperience') || 'Years of Experience'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.bio') || 'Professional Bio'}
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Share your clinical background, areas of clinical focus, and patient philosophy..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                {formData.bio.length} / 2000 {t('doctorProfile.chars') || 'characters'}
              </span>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.languages') || 'Languages Spoken'}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.languages.map(lang => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      className="hover:text-red-900 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="e.g. Arabic, English, French"
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-sm rounded-xl font-medium"
                >
                  {t('doctorProfile.add') || 'Add'}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: Professional Credentials */}
          <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('doctorProfile.credentialsTitle') || 'Professional Credentials'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('doctorProfile.credentialsDesc') || 'Licensing details and medical qualifications.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.licenseNumber') || 'Medical License Number'}
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  placeholder="e.g. MED-849204"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.licenseAuthority') || 'Licensing Authority / Medical Syndicate'}
                </label>
                <input
                  type="text"
                  value={formData.licenseAuthority}
                  onChange={(e) => handleInputChange('licenseAuthority', e.target.value)}
                  placeholder="e.g. Egyptian Medical Syndicate, Ministry of Health"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            {/* Qualifications list */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.qualifications') || 'Qualifications & Degrees'}
              </label>
              <div className="space-y-2 mb-2">
                {formData.qualifications.map((qual, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm"
                  >
                    <span className="text-gray-800 dark:text-gray-200">{qual}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQualification(index)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1"
                    >
                      {t('doctorProfile.remove') || 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  placeholder="e.g. MBBCh (Cairo University), MRCP (UK)"
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleAddQualification}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-sm rounded-xl font-medium"
                >
                  {t('doctorProfile.add') || 'Add'}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Profile Image */}
          <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <Camera size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('doctorProfile.profileImageTitle') || 'Profile Image'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('doctorProfile.profileImageDesc') || 'Upload a clear, professional medical headshot.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold overflow-hidden border-2 border-red-500 flex-shrink-0">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Doctor Headshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} />
                )}
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer shadow-sm">
                  <Upload size={16} />
                  <span>{uploadingImage ? (t('doctorProfile.uploading') || 'Uploading...') : (t('doctorProfile.changePhoto') || 'Upload Headshot')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  {t('doctorProfile.imageRequirements') || 'JPG, PNG or WEBP. Maximum 5MB.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: Publishing & Visibility */}
          <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('doctorProfile.publishingTitle') || 'Publishing & Visibility'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('doctorProfile.publishingDesc') || 'Control profile completion state and public search presence.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    {t('doctorProfile.profileComplete') || 'Profile Complete Status'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.isProfileComplete
                      ? (t('doctorProfile.completeNotice') || 'All essential clinical details are provided.')
                      : (t('doctorProfile.incompleteNotice') || 'Add title, specialty, bio, experience, and license number to complete.')}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  formData.isProfileComplete
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}>
                  {formData.isProfileComplete ? (t('doctorProfile.complete') || 'Complete') : (t('doctorProfile.incomplete') || 'Incomplete')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    {t('doctorProfile.published') || 'Published'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('doctorProfile.publishedDesc') || 'Allow this doctor profile to be visible once credential review is active.'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    {t('doctorProfile.searchVisibility') || 'Search Visibility'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('doctorProfile.searchVisibilityDesc') || 'Enable discovery in provider listings.'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.searchVisibility}
                    onChange={(e) => handleInputChange('searchVisibility', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/doctor-dashboard"
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
            >
              {t('cancel') || 'Cancel'}
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Save size={18} />
              <span>{saving ? (t('saving') || 'Saving...') : (t('save') || 'Save Profile')}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfile;
