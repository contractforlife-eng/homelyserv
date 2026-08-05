// Support Profile Page - Manage support staff account
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import { useDashboard } from '../../components/layout/DashboardContext';
import api from '../../utils/api';
import { getRoleLabel } from '../../utils/userDisplay';
import {
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  Shield,
  Edit,
  Save,
  X,
  Camera,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react';

const SupportProfile = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const uploadProfilePhoto = useAuthStore(state => state.uploadProfilePhoto);
  const dashboard = useDashboard();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    language: 'en',
    profileImage: ''
  });

  const translations = {
    en: {
      title: 'My Profile',
      subtitle: 'Manage your support account',
      personalInfo: 'Personal Information',
      fullName: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      language: 'Language',
      role: 'Role',
      memberSince: 'Member Since',
      lastLogin: 'Last Login',
      editProfile: 'Edit Profile',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      saving: 'Saving...',
      profilePhoto: 'Profile Photo',
      changePhoto: 'Click to change photo',
      saveSuccess: 'Profile updated successfully',
      saveError: 'Failed to update profile',
      supportBadge: 'Support Staff',
      adminBadge: 'Administrator'
    },
    ar: {
      title: 'ملفي الشخصي',
      subtitle: 'إدارة حساب الدعم الخاص بك',
      personalInfo: 'المعلومات الشخصية',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      language: 'اللغة',
      role: 'الدور',
      memberSince: 'عضو منذ',
      lastLogin: 'آخر تسجيل دخول',
      editProfile: 'تعديل الملف',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      saving: 'جاري الحفظ...',
      profilePhoto: 'صورة الملف الشخصي',
      changePhoto: 'انقر لتغيير الصورة',
      saveSuccess: 'تم تحديث الملف بنجاح',
      saveError: 'فشل تحديث الملف',
      supportBadge: 'فريق الدعم',
      adminBadge: 'مدير'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(dashboard.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        language: authUser.language || 'en',
        profileImage: authUser.profileImage || authUser.profilePhotoUrl || ''
      });
      setImagePreview(authUser.profileImage || authUser.profilePhotoUrl || '');
    }
  }, [authUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        fullName: authUser?.fullName || '',
        email: authUser?.email || '',
        phone: authUser?.phone || '',
        language: authUser?.language || 'en',
        profileImage: authUser?.profileImage || authUser?.profilePhotoUrl || ''
      });
      setImagePreview(authUser?.profileImage || authUser?.profilePhotoUrl || '');
      setPendingImageFile(null);
    }
    setIsEditing(!isEditing);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      let profileImageUrl = formData.profileImage;

      if (pendingImageFile) {
        const uploadedUrl = await uploadProfilePhoto(pendingImageFile);
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      const response = await api.put('/api/auth/profile', {
        fullName: formData.fullName,
        phone: formData.phone,
        language: formData.language,
        profileImage: profileImageUrl
      });

      if (response.data?.success) {
        setSaveSuccess(true);
        setIsEditing(false);
        setPendingImageFile(null);
        window.location.reload();
      } else {
        setSaveError(response.data?.message || t.saveError);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError(error.response?.data?.message || t.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-green-600" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !authUser) {
    return null;
  }

  const userRole = authUser.role?.toUpperCase();
  const roleBadge = userRole === 'ADMIN' ? t.adminBadge : t.supportBadge;
  const roleBadgeColor = userRole === 'ADMIN'
    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : 'bg-green-500/20 text-green-400 border-green-500/30';

  return (
    <SupportLayout headerTitle={t.title}>
      <div className="p-6 md:p-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 overflow-hidden flex-shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt={authUser.fullName || 'Support'} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={36} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">{authUser.fullName || 'Support Agent'}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadgeColor}`}>
                  <Shield size={12} />
                  {roleBadge}
                </span>
              </div>
              <p className="text-white/80 mt-1">{t.subtitle}</p>
            </div>
            <div>
              {!isEditing ? (
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 font-medium"
                >
                  <Edit size={18} />
                  {t.editProfile}
                </button>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition flex items-center gap-2"
                >
                  <X size={18} />
                  {t.cancel}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-6 px-4 py-3 rounded-lg flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400">
            <CheckCircle size={18} />
            {t.saveSuccess}
          </div>
        )}
        {saveError && (
          <div className="mb-6 px-4 py-3 rounded-lg flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle size={18} />
            {saveError}
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserIcon size={18} className="text-green-600" />
              {t.personalInfo}
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Photo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profilePhoto}</label>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500/30 bg-gray-100 dark:bg-gray-700">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-500/10">
                        <UserIcon size={48} className="text-green-500/50" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-2 bg-green-600 rounded-full cursor-pointer hover:bg-green-700 transition shadow-lg">
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t.changePhoto}</p>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.fullName}</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isEditing
                      ? 'border-green-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.phone}</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isEditing
                      ? 'border-green-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.language}</label>
              <div className="relative">
                <Globe size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    isEditing
                      ? 'border-green-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
                  }`}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.role}</label>
              <div className="relative">
                <Shield size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={getRoleLabel(authUser.role)}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg"
                />
              </div>
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.memberSince}</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formatDate(authUser.createdAt)}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg"
                />
              </div>
            </div>

            {/* Last Login */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.lastLogin}</label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formatDate(authUser.lastLogin)}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 font-medium"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? t.saving : t.saveChanges}
              </button>
              <button
                onClick={handleEditToggle}
                disabled={saving}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                {t.cancel}
              </button>
            </div>
          )}
        </div>
      </div>
    </SupportLayout>
  );
};

export default SupportProfile;