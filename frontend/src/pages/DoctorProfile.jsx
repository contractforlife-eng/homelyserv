// frontend/src/pages/DoctorProfile.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { DOCTOR_SPECIALTIES } from '../constants/doctorSpecialties';
import TrustVerificationSection from '../components/verification/TrustVerificationSection';
import api from '../utils/api';
import { getAccountCurrency } from '../utils/currencyPresentation';
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
  EyeOff,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Lock,
  BadgeCheck,
  Banknote,
  Pencil
} from 'lucide-react';

// Read-only presentation of a value while the page is in View Mode. The same
// markup is never used for input, so no editing control exists outside Edit
// Mode.
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

const DoctorProfile = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const uploadProfilePhoto = useAuthStore(state => state.uploadProfilePhoto);
  // Existing shared account update flow (PUT /api/auth/profile). Full name is
  // a canonical User field, so it is written there — not duplicated here.
  const updateAccountProfile = useAuthStore(state => state.updateProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verification, setVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  // The page always opens in View Mode. Editing — and therefore Save/Cancel
  // and every input control — only appears after "Edit Profile" is pressed.
  const [isEditing, setIsEditing] = useState(false);
  // Last values known to be persisted. Cancel restores exactly this snapshot,
  // so unsaved edits are discarded without another round trip to the server.
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  // SECTION A — Basic account information (read-only except the full name).
  const [fullName, setFullName] = useState('');
  const [initialFullName, setInitialFullName] = useState('');
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
    professionalTitle: '',
    specialty: '',
    additionalSpecialties: [],
    subspecialty: '',
    experienceSummary: '',
    bio: '',
    yearsOfExperience: 0,
    languages: [],
    qualifications: [],
    education: [],
    certifications: [],
    licenseNumber: '',
    licenseAuthority: '',
    consultationFee: '',
    examinationFee: '',
    profileImage: '',
    isProfileComplete: false,
    isPublished: false,
    searchVisibility: false
  });

  const [newLanguage, setNewLanguage] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [newCertification, setNewCertification] = useState('');

  // Read-only clinic list shown alongside the profile form.
  const [clinics, setClinics] = useState([]);

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
          setClinics(Array.isArray(res.data.clinics) ? res.data.clinics : []);
          setFullName(user.fullName || authUser?.fullName || '');
          setInitialFullName(user.fullName || authUser?.fullName || '');
          setAccount({
            email: user.email || '',
            emailVerified: Boolean(user.emailVerified),
            phone: user.phone || '',
            phoneVerified: Boolean(user.phoneVerified),
            phoneVerificationStatus: user.phoneVerificationStatus || null
          });
          // The consultation fee is rendered in the account's own currency
          // convention, resolved by the backend. Nothing new is stored.
          setCurrency(
            res.data.currency
            || getAccountCurrency({ ...(authUser || {}), preferredCurrency: user.preferredCurrency })
          );
          const nextFormData = {
            professionalTitle: profile.professionalTitle || '',
            specialty: profile.specialty || '',
            additionalSpecialties: Array.isArray(profile.additionalSpecialties) ? profile.additionalSpecialties : [],
            subspecialty: profile.subspecialty || '',
            experienceSummary: profile.experienceSummary || '',
            bio: profile.bio || '',
            yearsOfExperience: profile.yearsOfExperience || 0,
            languages: Array.isArray(profile.languages) ? profile.languages : [],
            qualifications: Array.isArray(profile.qualifications) ? profile.qualifications : [],
            education: Array.isArray(profile.education) ? profile.education : [],
            certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
            licenseNumber: profile.licenseNumber || '',
            licenseAuthority: profile.licenseAuthority || '',
            consultationFee: Number.isFinite(Number(profile.consultationFee))
              ? String(profile.consultationFee)
              : '',
            examinationFee: Number.isFinite(Number(profile.examinationFee))
              ? String(profile.examinationFee)
              : '',
            profileImage: profile.profileImage || user.profileImage || authUser?.profileImage || '',
            isProfileComplete: Boolean(profile.isProfileComplete),
            isPublished: Boolean(profile.isPublished),
            searchVisibility: Boolean(profile.searchVisibility)
          };
          setFormData(nextFormData);
          // Whatever the server just returned is the View Mode baseline that
          // Cancel restores.
          setSavedSnapshot(nextFormData);
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

  // Load verification status
  useEffect(() => {
    let isMounted = true;
    const loadVerification = async () => {
      try {
        setVerificationLoading(true);
        const res = await api.get('/api/doctors/verification');
        if (isMounted && res.data?.success) {
          setVerification(res.data.verification);
        }
      } catch (err) {
        console.error('Error loading doctor verification:', err);
      } finally {
        if (isMounted) setVerificationLoading(false);
      }
    };

    loadVerification();
    return () => { isMounted = false; };
  }, []);

  const handleVerificationUpdated = (updatedVerification) => {
    setVerification(updatedVerification);
  };

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

  const handleAddEducation = (e) => {
    e.preventDefault();
    const trimmed = newEducation.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      education: prev.education.includes(trimmed) ? prev.education : [...prev.education, trimmed]
    }));
    setNewEducation('');
  };

  const handleRemoveEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleAddCertification = (e) => {
    e.preventDefault();
    const trimmed = newCertification.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(trimmed)
        ? prev.certifications
        : [...prev.certifications, trimmed]
    }));
    setNewCertification('');
  };

  const handleRemoveCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const toggleAdditionalSpecialty = (value) => {
    setFormData(prev => {
      const current = prev.additionalSpecialties || [];
      return {
        ...prev,
        additionalSpecialties: current.includes(value)
          ? current.filter(s => s !== value)
          : [...current, value]
      };
    });
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

  const handleFullNameChange = (e) => {
    setFullName(e.target.value);
    setSaveSuccess(false);
    setErrorMessage('');
  };

  // Enter Edit Mode. No value is touched: editing starts from the values that
  // are already on screen.
  const handleEdit = () => {
    setSaveSuccess(false);
    setErrorMessage('');
    setIsEditing(true);
  };

  // Leave Edit Mode and discard every unsaved change, including a name typed
  // in Basic Information and any "add" text still sitting in a list input.
  const handleCancel = () => {
    if (savedSnapshot) {
      setFormData(savedSnapshot);
    }
    setFullName(initialFullName);
    setNewLanguage('');
    setNewQualification('');
    setNewEducation('');
    setNewCertification('');
    setSaveSuccess(false);
    setErrorMessage('');
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage('');
      setSaveSuccess(false);

      // A. Basic information — full name only, through the existing account
      // update flow. Email and phone are never submitted: they stay read-only
      // here so their verification workflows cannot be bypassed.
      const trimmedName = fullName.trim().replace(/\s+/g, ' ');
      if (trimmedName !== initialFullName.trim().replace(/\s+/g, ' ')) {
        if (trimmedName.length < 2 || trimmedName.length > 100) {
          setErrorMessage(
            t('doctorProfile.fullNameError') || 'Full name must be between 2 and 100 characters.'
          );
          setSaving(false);
          return;
        }
        const nameResult = await updateAccountProfile({ fullName: trimmedName });
        if (!nameResult?.success) {
          setErrorMessage(nameResult?.error || t('doctorProfile.saveError') || 'Failed to save doctor profile');
          setSaving(false);
          return;
        }
        setInitialFullName(trimmedName);
        setFullName(trimmedName);
      }

      // B/C. Professional + practice information.
      const payload = {
        professionalTitle: formData.professionalTitle,
        specialty: formData.specialty,
        additionalSpecialties: formData.additionalSpecialties,
        subspecialty: formData.subspecialty,
        experienceSummary: formData.experienceSummary,
        bio: formData.bio,
        yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        languages: formData.languages,
        qualifications: formData.qualifications,
        education: formData.education,
        certifications: formData.certifications,
        licenseNumber: formData.licenseNumber,
        licenseAuthority: formData.licenseAuthority,
        // Two independent fees: each is sent from its own form value, so
        // changing one never rewrites the other.
        consultationFee: formData.consultationFee === '' ? 0 : formData.consultationFee,
        examinationFee: formData.examinationFee === '' ? 0 : formData.examinationFee,
        profileImage: formData.profileImage,
        isPublished: formData.isPublished,
        searchVisibility: formData.searchVisibility
      };

      const res = await api.put('/api/doctors/profile', payload);
      if (res.data?.success) {
        // Same values as before, only expressed once: the server-normalized
        // fees and status flags become both the displayed value and the new
        // Cancel baseline, so the page can return to View Mode immediately.
        const nextFormData = res.data.profile
          ? {
            ...formData,
            consultationFee: Number.isFinite(Number(res.data.profile.consultationFee))
              ? String(res.data.profile.consultationFee)
              : formData.consultationFee,
            examinationFee: Number.isFinite(Number(res.data.profile.examinationFee))
              ? String(res.data.profile.examinationFee)
              : formData.examinationFee,
            isProfileComplete: res.data.profile.isProfileComplete,
            isPublished: res.data.profile.isPublished,
            searchVisibility: res.data.profile.searchVisibility
          }
          : { ...formData };
        setFormData(nextFormData);
        setSavedSnapshot(nextFormData);
        setSaveSuccess(true);
        setIsEditing(false);
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

        {/* Mode bar: View Mode offers only the "Edit Profile" entry point.
            Save and Cancel exist only while editing. */}
        <div className="flex justify-end">
          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <Pencil size={16} />
              <span>{t('editProfile') || 'Edit Profile'}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============================================================
              SECTION 0: PROFILE IMAGE — first, above Basic Information.
              View Mode shows the current headshot only. The upload control,
              the file input and its existing endpoint/validation appear only
              in Edit Mode; there is no second image system.
              ============================================================ */}
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

              {isEditing && (
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
              )}
            </div>
          </div>

          {/* ============================================================
              SECTION A: BASIC INFORMATION
              Canonical account identity. Full name is the only editable
              field here and it is saved through the existing account update
              flow. Email and phone are displayed read-only so their existing
              verification workflows are preserved untouched.
              ============================================================ */}
          <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('doctorProfile.accountInfoTitle') || 'Basic Information'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('doctorProfile.accountInfoDesc') || 'Your name and account contact details.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.fullName') || 'Full Name'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={handleFullNameChange}
                    maxLength={100}
                    placeholder={t('doctorProfile.fullNamePlaceholder') || 'e.g. Dr. Jane Smith'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                ) : (
                  <ViewValue>{fullName}</ViewValue>
                )}
                <span className="text-xs text-gray-400 mt-1 block">
                  {t('doctorProfile.fullNameHint') || 'Saved to your account. This is the name shown across HomelyServ.'}
                </span>
              </div>

              {/* Email is intentionally read-only: it is the canonical account
                  email and is changed only through the existing account/email
                  verification mechanism. */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.emailAddress') || 'Email Address'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={account.email}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                  />
                  <Mail size={16} className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" />
                </div>
                <div className="flex items-start gap-1.5 mt-1">
                  <Lock size={12} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-400">
                    {t('doctorProfile.emailReadOnlyNote') || 'Read-only. Email changes go through account verification so your verified status is never lost.'}
                  </span>
                </div>
                <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  account.emailVerified
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}>
                  <BadgeCheck size={11} />
                  {account.emailVerified
                    ? t('verification.statusVerified', 'Verified')
                    : t('verification.statusUnverified', 'Unverified')}
                </span>
              </div>

              {/* Phone is read-only here so the existing phone verification
                  workflow stays authoritative. */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.phoneNumber') || 'Phone Number'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={account.phone}
                    readOnly
                    disabled
                    placeholder={t('doctorProfile.phoneNotSet') || 'Not set'}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                  />
                  <Phone size={16} className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" />
                </div>
                <div className="flex items-start gap-1.5 mt-1">
                  <Lock size={12} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-400">
                    {t('doctorProfile.phoneReadOnlyNote') || 'Read-only. Phone changes keep their existing verification status and never auto-verify.'}
                  </span>
                </div>
                {account.phone ? (
                  <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    account.phoneVerified
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>
                    <BadgeCheck size={11} />
                    {account.phoneVerified
                      ? t('verification.statusVerified', 'Verified')
                      : (account.phoneVerificationStatus
                        ? t('verification.statusPending', 'Pending Review')
                        : t('verification.statusUnverified', 'Unverified'))}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* ============================================================
              SECTION B1: PROFESSIONAL INFORMATION
              ============================================================ */}
          <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('doctorProfile.professionalInfoTitle') || 'Professional Information'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('doctorProfile.professionalInfoDesc') || 'Your clinical specialty, experience, and background.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.professionalTitle') || 'Professional Title'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.professionalTitle}
                    onChange={(e) => handleInputChange('professionalTitle', e.target.value)}
                    placeholder="e.g. Consultant Pediatrician, Senior Surgeon"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                ) : (
                  <ViewValue>{formData.professionalTitle}</ViewValue>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.specialty') || 'Medical Specialty'}
                </label>
                {isEditing ? (
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
                ) : (
                  <ViewValue>
                    {formData.specialty ? t(DOCTOR_SPECIALTIES.find(s => s.value === formData.specialty)?.labelKey, formData.specialty) : ''}
                  </ViewValue>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.subspecialty') || 'Subspecialty'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.subspecialty}
                    onChange={(e) => handleInputChange('subspecialty', e.target.value)}
                    placeholder="e.g. Pediatric Cardiology, Neonatology"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                ) : (
                  <ViewValue>{formData.subspecialty}</ViewValue>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.yearsOfExperience') || 'Years of Experience'}
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                ) : (
                  <ViewValue>
                    {Number(formData.yearsOfExperience) > 0 ? String(formData.yearsOfExperience) : ''}
                  </ViewValue>
                )}
              </div>
            </div>

            {/* Additional Specialties — same canonical taxonomy as the primary
                specialty. 'other' remains the final option. */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.additionalSpecialties') || 'Additional Specialties'}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t('doctorProfile.additionalSpecialtiesDesc') || 'Select any other specialties from the medical specialty list.'}
              </p>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {DOCTOR_SPECIALTIES.map(spec => {
                    const selected = (formData.additionalSpecialties || []).includes(spec.value);
                    return (
                      <button
                        key={spec.value}
                        type="button"
                        onClick={() => toggleAdditionalSpecialty(spec.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                          selected
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-red-400'
                        }`}
                      >
                        {t(spec.labelKey, spec.value)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(formData.additionalSpecialties || []).length === 0 ? (
                    <ViewValue className="max-w-xs">—</ViewValue>
                  ) : (
                    (formData.additionalSpecialties || []).map(spec => (
                      <span
                        key={spec}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50"
                      >
                        {t(DOCTOR_SPECIALTIES.find(s => s.value === spec)?.labelKey, spec)}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.experienceSummary') || 'Experience Summary'}
              </label>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={formData.experienceSummary}
                  onChange={(e) => handleInputChange('experienceSummary', e.target.value)}
                  placeholder="e.g. 12 years in interventional cardiology, previously at Cairo University Hospital..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              ) : (
                <ViewValue>{formData.experienceSummary}</ViewValue>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.bio') || 'Professional Bio'}
              </label>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Share your clinical background, areas of clinical focus, and patient philosophy..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              ) : (
                <ViewValue>{formData.bio}</ViewValue>
              )}
              <span className="text-xs text-gray-400 mt-1 block">
                {formData.bio.length} / 2000 {t('doctorProfile.chars') || 'characters'}
              </span>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.languages') || 'Languages Spoken'}
              </label>
              {formData.languages.length === 0 ? (
                <ViewValue className="max-w-xs">—</ViewValue>
              ) : (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.languages.map(lang => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50"
                    >
                      {lang}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(lang)}
                          className="hover:text-red-900 font-bold"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {isEditing && (
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
              )}
            </div>
          </div>

          {/* SECTION B2: Professional Credentials (license, qualifications,
              education, certifications) */}
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
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder="e.g. MED-849204"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                ) : (
                  <ViewValue>{formData.licenseNumber}</ViewValue>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.licenseAuthority') || 'Licensing Authority / Medical Syndicate'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.licenseAuthority}
                    onChange={(e) => handleInputChange('licenseAuthority', e.target.value)}
                    placeholder="e.g. Egyptian Medical Syndicate, Ministry of Health"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                ) : (
                  <ViewValue>{formData.licenseAuthority}</ViewValue>
                )}
              </div>
            </div>

            {/* Qualifications list */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.qualifications') || 'Qualifications & Degrees'}
              </label>
              {formData.qualifications.length === 0 ? (
                <ViewValue className="max-w-xs mb-2">—</ViewValue>
              ) : (
                <div className="space-y-2 mb-2">
                  {formData.qualifications.map((qual, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm"
                    >
                      <span className="text-gray-800 dark:text-gray-200">{qual}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQualification(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1"
                        >
                          {t('doctorProfile.remove') || 'Remove'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
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
              )}
            </div>

            {/* Education list */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.education') || 'Education'}
              </label>
              {formData.education.length === 0 ? (
                <ViewValue className="max-w-xs mb-2">—</ViewValue>
              ) : (
                <div className="space-y-2 mb-2">
                  {formData.education.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm"
                    >
                      <span className="text-gray-800 dark:text-gray-200">{entry}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1"
                        >
                          {t('doctorProfile.remove') || 'Remove'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEducation}
                    onChange={(e) => setNewEducation(e.target.value)}
                    placeholder="e.g. MBBS, Cairo University, 2010"
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-sm rounded-xl font-medium"
                  >
                    {t('doctorProfile.add') || 'Add'}
                  </button>
                </div>
              )}
            </div>

            {/* Certifications & Licenses list */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('doctorProfile.certifications') || 'Certifications & Licenses'}
              </label>
              {formData.certifications.length === 0 ? (
                <ViewValue className="max-w-xs mb-2">—</ViewValue>
              ) : (
                <div className="space-y-2 mb-2">
                  {formData.certifications.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm"
                    >
                      <span className="text-gray-800 dark:text-gray-200">{entry}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCertification(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1"
                        >
                          {t('doctorProfile.remove') || 'Remove'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="e.g. Board Certified in Interventional Cardiology, 2016"
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-sm rounded-xl font-medium"
                  >
                    {t('doctorProfile.add') || 'Add'}
                  </button>
                </div>
              )}
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
                {isEditing ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    formData.isPublished
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {formData.isPublished
                      ? (t('doctorProfile.enabled') || 'Enabled')
                      : (t('doctorProfile.disabled') || 'Disabled')}
                  </span>
                )}
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
                {isEditing ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.searchVisibility}
                      onChange={(e) => handleInputChange('searchVisibility', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    formData.searchVisibility
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {formData.searchVisibility
                      ? (t('doctorProfile.enabled') || 'Enabled')
                      : (t('doctorProfile.disabled') || 'Disabled')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION C: PRACTICE INFORMATION — consultation fee + clinics */}
          <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('doctorProfile.practiceInfoTitle') || 'Practice Information'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('doctorProfile.practiceInfoDesc') || 'Your advertised consultation and examination fees, and your practice locations.'}
                </p>
              </div>
            </div>

            {/* Two completely separate Doctor fees. Each has its own form value
                and its own input, so editing one never changes the other. Both
                are display values only — neither is connected to any payment
                flow. The currency is the account's own currency preference,
                resolved server-side. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.consultationFee') || 'Consultation Fee'}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.consultationFee}
                      onChange={(e) => {
                        // Only plain decimal digits are accepted while typing, so an
                        // invalid or negative amount can never be submitted.
                        const raw = e.target.value;
                        if (raw === '' || /^\d{0,7}(\.\d{0,2})?$/.test(raw)) {
                          handleInputChange('consultationFee', raw);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                    <Banknote size={16} className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" />
                    <span className="absolute top-1/2 -translate-y-1/2 right-3 text-xs font-semibold text-gray-400">
                      {currency || '—'}
                    </span>
                  </div>
                ) : (
                  <ViewValue>
                    {formData.consultationFee === '' || formData.consultationFee === undefined
                      ? ''
                      : `${formData.consultationFee} ${currency || ''}`.trim()}
                  </ViewValue>
                )}
                <span className="text-xs text-gray-400 mt-1 block">
                  {t('doctorProfile.consultationFeeHint') || 'Free to set, non-negative, up to two decimal places. Shown in your account currency and not linked to payments.'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('doctorProfile.examinationFee') || 'Examination Fee'}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.examinationFee}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '' || /^\d{0,7}(\.\d{0,2})?$/.test(raw)) {
                          handleInputChange('examinationFee', raw);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                    <Banknote size={16} className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" />
                    <span className="absolute top-1/2 -translate-y-1/2 right-3 text-xs font-semibold text-gray-400">
                      {currency || '—'}
                    </span>
                  </div>
                ) : (
                  <ViewValue>
                    {formData.examinationFee === '' || formData.examinationFee === undefined
                      ? ''
                      : `${formData.examinationFee} ${currency || ''}`.trim()}
                  </ViewValue>
                )}
                <span className="text-xs text-gray-400 mt-1 block">
                  {t('doctorProfile.examinationFeeHint') || 'Free to set, non-negative, up to two decimal places. Independent from the consultation fee and not linked to payments.'}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('doctorProfile.clinicsTitle') || 'My Clinics'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('doctorProfile.clinicsDesc') || 'Practice locations attached to your professional profile.'}
              </p>

              {clinics.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('doctorProfile.noClinics') || 'No clinics listed yet.'}
                </p>
              ) : (
                <ul className="space-y-3">
                  {clinics.map((clinic) => (
                    <li
                      key={clinic.id}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {clinic.clinicName}
                        </span>
                        {clinic.isPrimary ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-full px-2 py-0.5">
                            {t('doctorProfile.primaryClinic') || 'Primary'}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-start gap-1.5">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        <span>
                          {[clinic.addressLine, clinic.city, clinic.stateOrProvince, clinic.countryCode]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </p>
                      {clinic.phone ? (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                          <Phone size={12} />
                          <span>{clinic.phone}</span>
                        </p>
                      ) : null}
                      {clinic.email ? (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                          <Mail size={12} />
                          <span>{clinic.email}</span>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* SECTION D: TRUST & VERIFICATION — the single place this section
              is rendered for a Doctor. */}
          {verificationLoading ? (
            <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
          ) : (
            <TrustVerificationSection
              verification={verification}
              userId={authUser?.id}
              userRole={authUser?.role}
              isOwnProfile={true}
              isAdmin={false}
              staffMode={false}
              doctorMode={true}
              onVerificationUpdated={handleVerificationUpdated}
            />
          )}

          {/* Form Actions — Edit Mode only. In View Mode the "Edit Profile"
              action at the top of the page is the only control shown. */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
              >
                {t('cancel') || 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                <Save size={18} />
                <span>{saving ? (t('saving') || 'Saving...') : (t('save') || 'Save Profile')}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfile;
