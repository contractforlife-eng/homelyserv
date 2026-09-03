// Support Settings Page - Account settings for support and sup-help staff
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import SupportLayout from '../../layouts/SupportLayout';
import BiometricUnlockSettings from '../../components/security/BiometricUnlockSettings';
import ActionMenuPortal from '../../components/common/ActionMenuPortal';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguageGlobal, LANGUAGE_STORAGE_KEY } from '../../i18n';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Globe,
  Moon,
  Sun,
  Lock,
  Edit,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import api from '../../utils/api';

const SupportSettings = ({ isSupHelp = false }) => {
  const navigate = useNavigate();
  const { t: i18nT, i18n } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const uploadProfilePhoto = useAuthStore(state => state.uploadProfilePhoto);
  const theme = useThemeStore(state => state.theme);
  const toggleTheme = useThemeStore(state => state.toggleTheme);
  const isDark = theme === 'dark';

  // Language synced with the global i18n instance (single source of truth)
  const [language, setLanguage] = useState(() => i18n.language || localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    profileImage: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInputRef = useRef(null);

  const t = i18nT('supportSettingsPage', { returnObjects: true }) || {};

  const activeRole = authUser?.role?.toUpperCase();
  const isHelper = isSupHelp || activeRole === 'SUPPORT_HELPER';
  const isAdmin = activeRole === 'ADMIN';

  const bannerGradient = isHelper
    ? 'from-red-600 to-red-700'
    : isAdmin
    ? 'from-yellow-600 to-yellow-700'
    : 'from-green-600 to-green-700';

  const accentColor = isHelper ? 'text-red-600' : isAdmin ? 'text-yellow-600' : 'text-green-600';
  const buttonGradient = isHelper
    ? 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
    : isAdmin
    ? 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
    : 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800';
  const focusRing = isHelper ? 'focus:ring-red-500' : isAdmin ? 'focus:ring-yellow-500' : 'focus:ring-green-500';
  const roleBadgeClass = isHelper
    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    : isAdmin
    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';

  const getRoleLabel = (role) =>
    t.roleLabels?.[String(role || '').toUpperCase()] || t.roleLabels?.USER || role || 'User';

  // Auth check
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'SUPPORT' && authUser.role !== 'ADMIN' && authUser.role !== 'SUPPORT_HELPER') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // Sync profileData when authUser changes
  useEffect(() => {
    if (authUser) {
      setProfileData({
        fullName: authUser.fullName || '',
        phone: authUser.phone || '',
        profileImage: authUser.profileImage || authUser.profilePhotoUrl || ''
      });
      setImagePreview(authUser.profileImage || authUser.profilePhotoUrl || '');
    }
  }, [authUser]);

  // Keep local language in sync whenever i18n changes (from any page)
  useEffect(() => {
    const onLanguageChanged = (lng) => setLanguage(lng);
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, [i18n]);

  // Update document direction
  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const toggleDarkMode = () => {
    toggleTheme();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      let profileImageUrl = profileData.profileImage;

      if (pendingImageFile && uploadProfilePhoto) {
        const uploadResult = await uploadProfilePhoto(pendingImageFile);
        if (uploadResult?.success && typeof uploadResult.user?.profileImage === 'string') {
          profileImageUrl = uploadResult.user.profileImage;
        } else {
          throw new Error(uploadResult?.error || t.profileUpdateFailed || 'Failed to upload photo');
        }
      }

      const response = await api.put('/api/auth/profile', {
        fullName: profileData.fullName,
        phone: profileData.phone,
        profileImage: profileImageUrl
      });

      if (response.data?.success && response.data?.user) {
        useAuthStore.setState({ user: response.data.user });
        setNotification({ type: 'success', text: t.profileUpdated || 'Profile updated successfully!' });
        setShowProfileModal(false);
        setPendingImageFile(null);
      } else {
        setNotification({ type: 'error', text: response.data?.message || t.profileUpdateFailed || 'Failed to update profile' });
      }
    } catch (error) {
      setNotification({ type: 'error', text: error.response?.data?.message || error.message || t.profileUpdateFailed || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({ type: 'error', text: t.passwordMismatch || 'Passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setNotification({ type: 'error', text: t.passwordLength || 'Password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data?.success) {
        setNotification({ type: 'success', text: t.passwordChanged || 'Password changed successfully!' });
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setNotification({ type: 'error', text: response.data?.message || t.passwordChangeFailed || 'Failed to change password' });
      }
    } catch (error) {
      setNotification({ type: 'error', text: error.response?.data?.message || t.passwordChangeFailed || 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getProfileImage = () => {
    return authUser?.profileImage || authUser?.image || null;
  };

  return (
    <SupportLayout allowedRoles={['SUPPORT', 'ADMIN', 'SUPPORT_HELPER']}>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className={`bg-gradient-to-r ${bannerGradient} rounded-2xl p-6 mb-6 text-white`}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{t.title || 'Settings'}</h1>
              <p className="text-white/80 mt-1">{t.subtitle || 'Manage your account preferences'}</p>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-green-500/10 border border-green-500/30 text-green-400'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {notification.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserIcon size={20} className={accentColor} />
                {t.accountInfo || 'Account Information'}
              </h2>
              <button
                onClick={() => {
                  setProfileData({
                    fullName: authUser?.fullName || '',
                    phone: authUser?.phone || '',
                    profileImage: authUser?.profileImage || authUser?.profilePhotoUrl || ''
                  });
                  setImagePreview(authUser?.profileImage || authUser?.profilePhotoUrl || '');
                  setPendingImageFile(null);
                  setShowProfileModal(true);
                }}
                className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-gradient-to-r ${buttonGradient} transition flex items-center gap-1.5 shadow-sm`}
              >
                <Edit size={14} />
                {t.editProfile || 'Edit Profile'}
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${bannerGradient} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                  {getProfileImage() ? (
                    <img src={getProfileImage()} alt={authUser?.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={32} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.name || 'Name'}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{authUser?.fullName || t.supportRole || 'Staff Member'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.email || 'Email'}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{authUser?.email || 'staff@homelyserv.com'}</p>
                </div>
              </div>

              {authUser?.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.phone || 'Phone Number'}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{authUser.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Shield size={18} className={`${isHelper ? 'text-red-500' : isAdmin ? 'text-yellow-500' : 'text-green-500'} flex-shrink-0`} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.role || 'Role'}</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeClass}`}>
                    <Shield size={12} />
                    {getRoleLabel(authUser?.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe size={20} className={accentColor} />
                {t.preferences || 'Account Preferences'}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.darkMode || 'Dark Mode'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.darkModeDesc || 'Toggle between light and dark theme'}</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  aria-label={isDark ? (t.darkModeEnabled || 'Dark mode enabled') : (t.darkModeDisabled || 'Dark mode disabled')}
                  aria-pressed={isDark}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    isDark ? (isHelper ? 'bg-red-600' : isAdmin ? 'bg-yellow-600' : 'bg-green-600') : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
                    isDark ? 'right-1' : 'left-1'
                  }`}>
                    {isDark ? <Moon size={10} className={accentColor} /> : <Sun size={10} className="text-yellow-500" />}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock size={20} className={accentColor} />
              {t.security || 'Security'}
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.changePassword || 'Change Password'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.changePasswordDesc || 'Update your account password'}</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className={`w-full sm:w-auto shrink-0 px-4 py-2 bg-gradient-to-r ${buttonGradient} text-white rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2`}
              >
                <Lock size={16} />
                {t.changePassword || 'Change Password'}
              </button>
              <BiometricUnlockSettings />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserIcon size={20} className={accentColor} />
                {t.editProfile || 'Edit Profile'}
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                aria-label={t.close || 'Close'}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${bannerGradient} flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700 shadow-md`}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={36} className="text-white" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`text-xs font-medium ${accentColor} hover:underline`}
                >
                  {t.editPhoto || 'Click to change photo'}
                </button>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.fullName || 'Full Name'}
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 ${focusRing} text-gray-900 dark:text-white`}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.phone || 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 ${focusRing} text-gray-900 dark:text-white`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={profileLoading}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${buttonGradient} text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {profileLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t.saving || 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{t.saveChanges || 'Save Changes'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock size={20} className={accentColor} />
                {t.changePassword || 'Change Password'}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                aria-label={t.close || 'Close'}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.currentPassword || 'Current Password'}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 ${focusRing} text-gray-900 dark:text-white`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.newPassword || 'New Password'}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 ${focusRing} text-gray-900 dark:text-white`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.confirmPassword || 'Confirm Password'}</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 ${focusRing} text-gray-900 dark:text-white`}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${buttonGradient} text-white rounded-lg hover:shadow-lg transition disabled:opacity-50`}
                >
                  {passwordLoading ? (t.changing || 'Changing...') : (t.confirm || 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupportLayout>
  );
};

export default SupportSettings;
