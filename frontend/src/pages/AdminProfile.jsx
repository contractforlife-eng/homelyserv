// src/pages/AdminProfile.jsx - ADMIN PROFILE WITH DARK THEME
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

import AdminSidebar from '../components/AdminSidebar.jsx';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  Shield,
  Edit,
  Save,
  Camera,
  Crown,
  CheckCircle,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Phone,
  Calendar,
  Clock,
  BarChart3
} from 'lucide-react';


// Main AdminProfile Component
const AdminProfile = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const uploadProfilePhoto = useAuthStore(state => state.uploadProfilePhoto);
  const { logout: authLogout } = useAuthStore();

  const [language, setLanguage] = useState('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkers: 0,
    totalEmployers: 0,
    totalHires: 0,
    totalPayments: 0,
    totalComplaints: 0
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    language: 'en',
    profileImage: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const translations = {
    en: {
      title: 'My Profile',
      subtitle: 'Manage your administrator account',
      personalInfo: 'Personal Information',
      fullName: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      language: 'Language',
      adminBadge: 'Administrator',
      memberSince: 'Member Since',
      lastLogin: 'Last Login',
      editProfile: 'Edit Profile',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      profilePhoto: 'Profile Photo',
      changePhoto: 'Click to change photo',
      saved: '✅ Profile updated successfully!',
      errorSaving: 'Failed to save profile. Please try again.',
      stats: {
        totalUsers: 'Total Users',
        totalWorkers: 'Total Workers',
        totalEmployers: 'Total Employers',
        totalHires: 'Total Hires',
        totalPayments: 'Total Payments',
        totalComplaints: 'Total Complaints'
      }
    },
    ar: {
      title: 'ملفي الشخصي',
      subtitle: 'إدارة حساب المشرف',
      personalInfo: 'المعلومات الشخصية',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      language: 'اللغة',
      adminBadge: 'مشرف',
      memberSince: 'عضو منذ',
      lastLogin: 'آخر تسجيل دخول',
      editProfile: 'تعديل الملف',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      profilePhoto: 'الصورة الشخصية',
      changePhoto: 'انقر لتغيير الصورة',
      saved: '✅ تم تحديث الملف الشخصي بنجاح!',
      errorSaving: 'فشل حفظ الملف الشخصي. يرجى المحاولة مرة أخرى.',
      stats: {
        totalUsers: 'إجمالي المستخدمين',
        totalWorkers: 'إجمالي العمال',
        totalEmployers: 'إجمالي أصحاب العمل',
        totalHires: 'إجمالي التوظيفات',
        totalPayments: 'إجمالي المدفوعات',
        totalComplaints: 'إجمالي الشكاوى'
      }
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    setFormData({
      fullName: authUser.fullName || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
      language: authUser.language || 'en',
      profileImage: authUser.profileImage || ''
    });
    setImagePreview(authUser.profileImage || '');
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

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
        language: authUser.language || 'en',
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
        alert('Image size should be less than 5MB');
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
        alert('User ID not found. Please log in again.');
        setSaving(false);
        return;
      }

      let profileImageUrl = formData.profileImage;

      if (pendingImageFile) {
        const uploadResult = await uploadProfilePhoto(pendingImageFile);
        if (uploadResult.success && uploadResult.user) {
          profileImageUrl = uploadResult.user.profileImage;
        } else {
          throw new Error(uploadResult.error || 'Photo upload failed');
        }
      }

      const response = await api.put('/api/admin/profile', {
        fullName: formData.fullName,
        phone: formData.phone,
        language: formData.language,
        profileImage: profileImageUrl
      });

      if (response.data.success) {
        useAuthStore.setState({ user: response.data.user });
        setPendingImageFile(null);
        setIsEditing(false);
        setSaveSuccess(true);
        alert(t.saved);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError(error.message || t.errorSaving);
      alert(t.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  const loadStats = async () => {
    try {
      const [usersRes, hiresRes, paymentsRes] = await Promise.all([
        api.get('/api/auth/users'),
        api.get('/api/admin/hires'),
        api.get('/api/admin/payments')
      ]);

      const users = usersRes.data.users || [];
      const hires = hiresRes.data.hires || [];
      const payments = paymentsRes.data.payments || [];

      setStats({
        totalUsers: users.length,
        totalWorkers: users.filter(u => u.role === 'WORKER').length,
        totalEmployers: users.filter(u => u.role === 'EMPLOYER').length,
        totalHires: hires.length,
        totalPayments: payments.length,
        totalComplaints: 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    if (authUser && isAuthenticated && !authLoading) {
      loadStats();
    }
  }, [authUser, isAuthenticated, authLoading]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <AdminSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={authUser}
        handleLogout={handleLogout}
      />

      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        <header className="bg-[#1a1a1a] border-b border-yellow-500/20 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors lg:hidden text-gray-400 hover:text-yellow-500"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white hidden sm:block">{t.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/10 transition-colors text-gray-300 hover:text-yellow-500 flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-black">{t.title}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/20 border border-black/10 rounded-full text-xs font-medium text-black">
                    <Crown size={12} />
                    {t.adminBadge}
                  </span>
                </div>
                <p className="text-black/70 mt-1">{t.subtitle}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditToggle}
                  className="bg-black/20 hover:bg-black/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-black/10"
                >
                  {isEditing ? <X size={16} /> : <Edit size={16} />}
                  {isEditing ? t.cancel : t.editProfile}
                </button>
              </div>
            </div>
          </div>

          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {t.saved}
            </div>
          )}

          {saveError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.totalUsers}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.totalWorkers}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <UserIcon size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalWorkers}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.totalEmployers}</p>
                <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-teal-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalEmployers}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.totalHires}</p>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalHires}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.totalPayments}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Settings size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalPayments}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t.stats.totalComplaints}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalComplaints}</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-6 border border-yellow-500/20">
            <h3 className="text-lg font-semibold text-white mb-6">{t.personalInfo}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.profilePhoto}</label>
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-yellow-500/30 bg-gray-800 relative">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-yellow-500/10">
                          <UserIcon size={48} className="text-yellow-500/50" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 p-2 bg-yellow-500 rounded-full cursor-pointer hover:bg-yellow-400 transition shadow-lg">
                        <Camera size={18} className="text-black" />
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
                    <p className="text-sm text-gray-500 mt-2">{t.changePhoto}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.fullName}</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      isEditing ? 'border-yellow-500/20 bg-[#0a0a0a] text-white' : 'border-gray-700 bg-[#0a0a0a] text-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.email}</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-700 bg-[#0a0a0a] text-gray-400 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.phone}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      isEditing ? 'border-yellow-500/20 bg-[#0a0a0a] text-white' : 'border-gray-700 bg-[#0a0a0a] text-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.language}</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3 top-3 text-gray-500" />
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      isEditing ? 'border-yellow-500/20 bg-[#0a0a0a] text-white' : 'border-gray-700 bg-[#0a0a0a] text-gray-400'
                    }`}
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.memberSince}</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={formatDate(authUser.createdAt)}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-700 bg-[#0a0a0a] text-gray-400 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t.lastLogin}</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={formatDate(authUser.lastLogin)}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-700 bg-[#0a0a0a] text-gray-400 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2 disabled:opacity-50 font-medium"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Saving...' : t.saveChanges}
                </button>
                <button
                  onClick={handleEditToggle}
                  disabled={saving}
                  className="px-6 py-2 border border-yellow-500/20 text-gray-300 rounded-lg hover:bg-yellow-500/10 transition disabled:opacity-50"
                >
                  {t.cancel}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProfile;
