// src/pages/EmployerProfile.jsx - WITH PROFILE PHOTO UPLOAD, PREMIUM BADGE, AND WORKING NOTIFICATION BELL
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import {
  Home,
  User,
  Briefcase,
  FileCheck,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  AlertTriangle,
  Search,
  DollarSign,
  Clock,
  Calendar,
  Star,
  MapPin,
  Phone,
  Mail,
  Edit,
  Save,
  Camera,
  CreditCard,
  Crown,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Main EmployerProfile Component - WITH PHOTO UPLOAD, PREMIUM BADGE, AND NOTIFICATION BELL
const EmployerProfile = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const uploadProfilePhoto = useAuthStore(state => state.uploadProfilePhoto);
  const { logout: authLogout } = useAuthStore();
  
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    companyName: '',
    website: '',
    profileImage: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const checkPremiumStatus = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const isPremium = checkPremiumStatus();

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

    // Load profile data from authUser
    setFormData({
      fullName: authUser.fullName || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
      location: authUser.location || '',
      bio: authUser.bio || '',
      companyName: authUser.companyName || '',
      website: authUser.website || '',
      profileImage: authUser.profileImage || ''
    });
    setImagePreview(authUser.profileImage || '');
  }, [authUser, isAuthenticated, authLoading, navigate]);

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        fullName: authUser.fullName || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        location: authUser.location || '',
        bio: authUser.bio || '',
        companyName: authUser.companyName || '',
        website: authUser.website || '',
        profileImage: authUser.profileImage || ''
      });
      setImagePreview(authUser.profileImage || '');
      setPendingImageFile(null);
    }
    setIsEditing(!isEditing);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('employerProfile.imageTooLarge'));
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

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const userId = authUser?.id || authUser?._id;
      if (!userId) {
        alert(t('employerProfile.userIdNotFound'));
        setSaving(false);
        return;
      }

      let profileImageUrl = formData.profileImage;

      if (pendingImageFile) {
        const uploadResult = await uploadProfilePhoto(pendingImageFile);
        if (uploadResult.success && uploadResult.user) {
          profileImageUrl = uploadResult.user.profileImage;
        } else {
          throw new Error(uploadResult.error || t('employerProfile.photoUploadFailed'));
        }
      }

      const response = await api.put(`/api/employers/profile/${userId}`, {
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        companyName: formData.companyName,
        website: formData.website,
        profileImage: profileImageUrl
      });

      if (response.data.success) {
        useAuthStore.setState({ user: response.data.user });
        setPendingImageFile(null);
        setIsEditing(false);
        setSaveSuccess(true);
        alert(t('employerProfile.saved'));
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(response.data.message || t('employerProfile.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError(error.message || t('employerProfile.errorSaving'));
      alert(t('employerProfile.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 dark:text-gray-300">{t('employerProfile.loading')}</p>
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
        title={t('employerProfile.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isPremium}
      />

        <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{t('employerProfile.title')}</h1>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                      <Crown size={12} className="text-yellow-300" />
                      {t('employerProfile.premiumBadge')}
                    </span>
                  )}
                </div>
                <p className="text-teal-100 mt-1">{t('employerProfile.subtitle')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditToggle}
                  className="bg-white text-teal-600 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isEditing ? <X size={16} /> : <Edit size={16} />}
                  {isEditing ? t('employerProfile.cancel') : t('employerProfile.editProfile')}
                </button>
                <Link
                  to="/subscription"
                  className="bg-yellow-500/30 hover:bg-yellow-500/40 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-yellow-400/30"
                >
                  <Crown size={16} />
                  {t('employerProfile.getPremium')}
                </Link>
              </div>
            </div>
          </div>

          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {t('employerProfile.saved')}
            </div>
          )}

          {saveError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {saveError}
            </div>
          )}

          {/* Profile Photo Section */}
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white dark:text-white mb-4">{t('employerProfile.profilePhoto')}</h3>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-teal-200 bg-gray-100 dark:bg-gray-800 relative">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt={t('employerProfile.profilePhotoAlt')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-50 dark:bg-teal-900/30">
                      <User size={48} className="text-teal-300" />
                    </div>
                  )}
                  {isPremium && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-white">
                      <Crown size={14} className="text-white" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 p-2 bg-teal-600 rounded-full cursor-pointer hover:bg-teal-700 transition shadow-lg">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">{t('employerProfile.changePhoto')}</p>
              )}
              {!isEditing && imagePreview && (
                <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">{t('employerProfile.photoUploaded')}</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white dark:text-white mb-6">{t('employerProfile.personalInfo')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">{t('employerProfile.fullName')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700 dark:border-gray-600' : 'border-gray-100 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">{t('employerProfile.email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-100 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">{t('employerProfile.phone')}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700 dark:border-gray-600' : 'border-gray-100 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">{t('employerProfile.location')}</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700 dark:border-gray-600' : 'border-gray-100 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">{t('employerProfile.company')}</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700 dark:border-gray-600' : 'border-gray-100 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">{t('employerProfile.website')}</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200 dark:border-gray-700 dark:border-gray-600' : 'border-gray-100 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50'
                    }`}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">{t('employerProfile.bio')}</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="4"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isEditing ? 'border-gray-200 dark:border-gray-700 dark:border-gray-600' : 'border-gray-100 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50'
                  }`}
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? t('employerProfile.saving') : t('employerProfile.saveChanges')}
                </button>
                <button
                  onClick={handleEditToggle}
                  disabled={saving}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 transition disabled:opacity-50 w-full sm:w-auto"
                >
                  {t('employerProfile.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
    </DashboardLayout>
  );
};

export default EmployerProfile;
