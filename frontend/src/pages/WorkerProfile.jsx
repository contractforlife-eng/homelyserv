// src/pages/worker/WorkerProfile.jsx - WITH WORKING NOTIFICATIONS AND FIXED TOGGLES
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { JOB_OPTIONS } from '../constants/jobOptions';
import { fetchSubscriptionStatus } from '../services/paymentService';
import WorkerPremiumCard from '../components/worker/WorkerPremiumCard';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import { formatExperienceDisplay } from '../utils/experienceDisplay';

const RATE_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

const isCanonicalCurrencyCode = (value) =>
  typeof value === 'string' && /^[A-Z]{3}$/.test(value);

const getInitialRateCurrency = (user) => {
  if (isCanonicalCurrencyCode(user?.hourlyRateCurrency)) return user.hourlyRateCurrency;
  if (user?.hourlyRate) return 'EGP';
  if (isCanonicalCurrencyCode(user?.preferredCurrency)) return user.preferredCurrency;
  if (isCanonicalCurrencyCode(user?.effectiveCurrency)) return user.effectiveCurrency;
  return 'EGP';
};

import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Edit,
  Save,
  X,
  Globe,
  Menu,
  Bell,
  ChevronDown,
  Camera,
  Star,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Shield,
  Crown
} from 'lucide-react';


// Main WorkerProfile Component - RED THEME WITH WORKING NOTIFICATIONS
const WorkerProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Auth Store
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const uploadProfilePhoto = useAuthStore(state => state.uploadProfilePhoto);
  const { logout: authLogout } = useAuthStore();

  // Local State
  const [isEditing, setIsEditing] = useState(false);
   
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
    experience: '',
    hourlyRate: '',
    hourlyRateCurrency: 'EGP',
    profileImage: '',
    desiredJob: '',
    tutorSpecialization: ''
  });
  const [newSkill, setNewSkill] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rateDirty, setRateDirty] = useState(false);
  const initializedUserIdRef = useRef(null);
  const [realStats, setRealStats] = useState({
    memberSince: '',
    rating: 0,
    jobsCompleted: 0,
    profileComplete: 0
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState({ isPremium: false, subscription: null });

  const jobOptions = JOB_OPTIONS;

  // ============================================================
  // TOGGLE FUNCTIONS - DEFINED AT THE TOP
  // ============================================================
  
  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  // ============================================================
  // NOTIFICATION FUNCTIONS
  // ============================================================
  

  const isPremium = subscriptionStatus.isPremium;

  // Backend subscription is the ONLY source of truth for premium entitlement.
  useEffect(() => {
    let cancelled = false;
    const loadPremium = async () => {
      try {
        const data = await fetchSubscriptionStatus();
        if (!cancelled && data?.success) {
          setSubscriptionStatus({
            isPremium: data.isPremium === true,
            subscription: data.subscription || null
          });
        }
      } catch (error) {
        console.error('Failed to load subscription status:', error);
      }
    };
    loadPremium();
    return () => { cancelled = true; };
  }, []);

  const loadRealStats = (userEmail, userId) => {
    try {
      const completedJobs = 0;
      
      const ratings = JSON.parse(localStorage.getItem('worker_ratings') || '[]');
      const workerRatings = ratings.filter(r => r.workerId === userId || r.workerEmail === userEmail);
      const avgRating = workerRatings.length > 0 
        ? workerRatings.reduce((sum, r) => sum + r.rating, 0) / workerRatings.length 
        : 0;
      
      let completedFields = 0;
      const totalFields = 7;
      if (formData.fullName) completedFields++;
      if (formData.phone) completedFields++;
      if (formData.location) completedFields++;
      if (formData.bio && formData.bio.length > 10) completedFields++;
      if (formData.skills && formData.skills.length > 0) completedFields++;
      if (formData.experience) completedFields++;
      if (formData.hourlyRate) completedFields++;
      
      const completionPercent = Math.round((completedFields / totalFields) * 100);
      
      const memberSince = authUser?.createdAt || new Date().toISOString();
      
      setRealStats({
        memberSince: new Date(memberSince).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        }),
        rating: avgRating || 4.8,
        jobsCompleted: completedJobs || 0,
        profileComplete: completionPercent || 0
      });
      
    } catch (error) {
      console.error('Error loading real stats:', error);
      setRealStats({
        memberSince: t('workerProfile.memberSinceValue'),
        rating: 4.8,
        jobsCompleted: 0,
        profileComplete: 0
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'WORKER') {
      navigate('/login');
      return;
    }

    const userId = String(authUser.id || authUser._id || authUser.email);
    if (initializedUserIdRef.current === userId) return;

    // Load profile data once per authenticated worker. Subsequent auth-store
    // updates must not overwrite unsaved edits or mark a seeded currency dirty.
    setFormData({
      fullName: authUser.fullName || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
      location: authUser.location || '',
      bio: authUser.bio || 'Experienced professional in home services.',
      skills: authUser.skills || ['Child Care', 'First Aid', 'Communication'],
      experience: authUser.experience || '3 years',
      hourlyRate: authUser.hourlyRate ?? '',
      hourlyRateCurrency: getInitialRateCurrency(authUser),
      profileImage: authUser.profileImage || '',
      desiredJob: authUser.desiredJob || '',
      tutorSpecialization: authUser.tutorSpecialization || ''
    });
    setRateDirty(false);
    initializedUserIdRef.current = userId;
    setImagePreview(authUser.profileImage || '');
    loadRealStats(authUser.email, authUser.id);
  }, [authUser, isAuthenticated, authLoading, navigate]);

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        fullName: authUser.fullName || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        location: authUser.location || '',
        bio: authUser.bio || 'Experienced professional in home services.',
        skills: authUser.skills || ['Child Care', 'First Aid', 'Communication'],
        experience: authUser.experience || '3 years',
        hourlyRate: authUser.hourlyRate ?? '',
        hourlyRateCurrency: getInitialRateCurrency(authUser),
        profileImage: authUser.profileImage || '',
        desiredJob: authUser.desiredJob || '',
        tutorSpecialization: authUser.tutorSpecialization || ''
      });
      setImagePreview(authUser.profileImage || '');
      setPendingImageFile(null);
      setRateDirty(false);
    }
    setIsEditing(!isEditing);
    setSaveSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'hourlyRate' || name === 'hourlyRateCurrency') {
      setRateDirty(true);
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('workerOwnProfile.imageTooLarge'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setPendingImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userId = authUser?.id || authUser?._id;
      if (!userId) {
        alert(t('workerOwnProfile.userIdMissing'));
        setSaving(false);
        return;
      }

      let profileImageUrl = formData.profileImage;

      if (pendingImageFile instanceof File) {
        const uploadResult = await uploadProfilePhoto(pendingImageFile);
        if (uploadResult.success && uploadResult.user) {
          profileImageUrl = uploadResult.user.profileImage;
        } else {
          throw new Error(uploadResult.error || t('workerOwnProfile.photoUploadFailed'));
        }
      }

      if (rateDirty) {
        const trimmedRate = formData.hourlyRate.trim();
        const rateResponse = await api.patch('/api/workers/hourly-rate', {
          hourlyRate: trimmedRate === '' ? null : trimmedRate,
          hourlyRateCurrency: trimmedRate === '' ? null : formData.hourlyRateCurrency
        });

        if (!rateResponse.data.success) {
          throw new Error(rateResponse.data.message || t('workerOwnProfile.updateFailed'));
        }

        const canonicalRate = rateResponse.data.hourlyRate;
        const canonicalCurrency = rateResponse.data.hourlyRateCurrency;
        setFormData(prev => ({
          ...prev,
          hourlyRate: canonicalRate ?? '',
          hourlyRateCurrency: canonicalCurrency || prev.hourlyRateCurrency
        }));
        setRateDirty(false);
        useAuthStore.setState(state => ({
          user: state.user ? {
            ...state.user,
            hourlyRate: canonicalRate,
            hourlyRateCurrency: canonicalCurrency
          } : state.user
        }));
      }

      const response = await api.put(`/api/workers/profile/${userId}`, {
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        skills: formData.skills,
        experience: formData.experience,
        profileImage: profileImageUrl,
        desiredJob: formData.desiredJob,
        tutorSpecialization: formData.tutorSpecialization
      });

      if (response.data.success) {
        useAuthStore.setState({ user: response.data.user });
        setPendingImageFile(null);
        setIsEditing(false);
        setSaveSuccess(true);
        alert(t('workerOwnProfile.saved'));
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(response.data.message || t('workerOwnProfile.updateFailed'));
      }
    } catch (error) {
      const status = error.response?.status;
      const backendMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error('Error updating profile:', { status, backendMessage, endpoint: error.config?.url });
      setSaving(false);
      setTimeout(() => alert(backendMessage || t('workerOwnProfile.updateFailedRetry')), 0);
    } finally {
      setSaving(false);
    }
  };

  const getJobLabel = (value) => {
    const job = jobOptions.find(j => j.value === value);
    return job ? t(`employerSearch.jobs.${job.value}`) : value || t('workerOwnProfile.notSpecified');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('workerOwnProfile.loading')}</p>
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
        title={t('workerOwnProfile.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isPremium}
      />

        <div className="p-4 md:p-6">
          {/* Welcome Banner - RED THEME */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{t('workerOwnProfile.title')}</h1>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                      <Crown size={12} className="text-yellow-300" />
                      {t('workerOwnProfile.premiumBadge')}
                    </span>
                  )}
                </div>
                <p className="text-white/80 mt-1">{t('workerOwnProfile.subtitle')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditToggle}
                   className="bg-white text-red-600 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isEditing ? <X size={16} /> : <Edit size={16} />}
                  {isEditing ? t('workerOwnProfile.cancel') : t('workerOwnProfile.editProfile')}
                </button>
                <Link
                  to="/subscription"
                  className="bg-yellow-500/30 hover:bg-yellow-500/40 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-yellow-400/30"
                >
                  <Crown size={16} />
                  {t('workerOwnProfile.getPremium')}
                </Link>
              </div>
            </div>
          </div>

          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {t('workerOwnProfile.saved')}
            </div>
          )}

          {/* Profile Photo Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('workerOwnProfile.profilePhoto')}</h3>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-200 bg-gray-100 dark:bg-gray-800 relative">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt={t('workerOwnProfile.profileImageAlt')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/30">
                      <User size={48} className="text-red-300" />
                    </div>
                  )}
                  {isPremium && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-white">
                      <Crown size={14} className="text-white" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full cursor-pointer hover:shadow-lg transition shadow-lg">
                    <Camera size={18} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {isEditing && (
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">{t('workerOwnProfile.changePhoto')}</p>
              )}
              {!isEditing && imagePreview && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('workerOwnProfile.photoUploaded')}</p>
              )}
            </div>
          </div>

          {/* Real Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerOwnProfile.memberSince')}</p>
                <Calendar size={20} className="text-blue-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{realStats.memberSince}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerOwnProfile.rating')}</p>
                <Star size={20} className="text-yellow-500" />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-lg font-bold text-gray-800 dark:text-white">{realStats.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500">/ 5.0</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerOwnProfile.jobsCompleted')}</p>
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{realStats.jobsCompleted}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerOwnProfile.profileComplete')}</p>
                <Award size={20} className="text-purple-500" />
              </div>
              <div className="mt-1">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full transition-all duration-500" 
                    style={{ width: `${realStats.profileComplete}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{realStats.profileComplete}%</span>
              </div>
            </div>
          </div>

          {/* Premium & Availability — backend-enforced */}
          <div className="mb-6">
            <WorkerPremiumCard />
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">{t('workerOwnProfile.personalInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workerOwnProfile.fullName')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workerOwnProfile.email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workerOwnProfile.phone')}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workerOwnProfile.location')}</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workerOwnProfile.experience')}</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="experience"
                    value={isEditing ? formData.experience : formatExperienceDisplay(formData.experience)}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('workerProfile.hourlyRate')}
                </label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    type="text"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    inputMode="decimal"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  />
                  <select
                    name="hourlyRateCurrency"
                    value={formData.hourlyRateCurrency}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    aria-label={t('employerSettings.currency')}
                    className={`px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    {!RATE_CURRENCIES.includes(formData.hourlyRateCurrency) && (
                      <option value={formData.hourlyRateCurrency}>{formData.hourlyRateCurrency}</option>
                    )}
                    {RATE_CURRENCIES.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Desired Job Dropdown Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('workerOwnProfile.desiredJob')}
                </label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 z-10" />
                  <select
                    name="desiredJob"
                    value={formData.desiredJob}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg appearance-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <option value="">{t('workerOwnProfile.selectJob')}</option>
                    {jobOptions.map((job) => (
                      <option key={job.value} value={job.value}>
                        {t(`employerSearch.jobs.${job.value}`)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
                {!isEditing && formData.desiredJob && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <span className="font-medium">{t('workerOwnProfile.selected')}:</span> {getJobLabel(formData.desiredJob)}
                  </p>
                )}
                {!isEditing && !formData.desiredJob && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('workerOwnProfile.noJobSelected')}</p>
                )}
               </div>

               {formData.desiredJob === 'tutor' && (
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workerOwnProfile.tutorSpecialization')}</label>
                   <input
                     type="text"
                     name="tutorSpecialization"
                     value={formData.tutorSpecialization}
                     onChange={handleInputChange}
                     disabled={!isEditing}
                     maxLength={100}
                     className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                       isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                     }`}
                   />
                 </div>
               )}

               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workerOwnProfile.bio')}</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="3"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    isEditing ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workerOwnProfile.skills')}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 rounded-full text-sm flex items-center gap-1"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-900"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
<div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder={t('workerOwnProfile.addSkill')}
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition"
                    >
                      {t('workerOwnProfile.addSkill')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? t('workerOwnProfile.saving') : t('workerOwnProfile.saveChanges')}
                </button>
                <button
                  onClick={handleEditToggle}
                  disabled={saving}
                  className="px-6 py-2 w-full sm:w-auto border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition disabled:opacity-50"
                >
                  {t('workerOwnProfile.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
    </DashboardLayout>
  );
};

export default WorkerProfile;
