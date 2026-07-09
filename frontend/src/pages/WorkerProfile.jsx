// src/pages/worker/WorkerProfile.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  Home,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Star,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Camera,
  ChevronDown
} from 'lucide-react';

// Sidebar Component
const WorkerSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  user, 
  handleLogout 
}) => {
  const location = useLocation();

  const translations = {
    en: {
      dashboard: 'Dashboard',
      myProfile: 'My Profile',
      myOffers: 'My Offers',
      messages: 'Messages',
      complaints: 'Complaints',
      payment: 'Payment',
      settings: 'Settings',
      help: 'Help & Support',
      logout: 'Logout',
      overview: 'Overview'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      myProfile: 'ملفي الشخصي',
      myOffers: 'عروضي',
      messages: 'الرسائل',
      complaints: 'الشكاوى',
      payment: 'الدفع',
      settings: 'الإعدادات',
      help: 'المساعدة والدعم',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/worker-profile' },
    { id: 'offers', label: t.myOffers, icon: Briefcase, path: '/worker/offers' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/payment' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <Link to="/worker-dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/worker-dashboard" className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">H</span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-red-600" />
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.fullName || 'Worker'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || 'worker@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.overview}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-red-600' : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-red-600 rounded-full"></div>
              )}
            </Link>
          ))}

          <div className="border-t border-gray-200 my-3"></div>

          <Link
            to="/worker-settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Settings size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.settings}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.settings}
              </div>
            )}
          </Link>
          <Link
            to="/help"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <HelpCircle size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.help}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.help}
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.logout}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.logout}
              </div>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
};

// Main WorkerProfile Component
const WorkerProfile = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    profileImage: '',
    desiredJob: '' // NEW FIELD: Desired job type
  });
  const [newSkill, setNewSkill] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Job options for dropdown
  const jobOptions = [
    { value: 'nanny', label: 'Nanny / Childcare' },
    { value: 'elderly_care', label: 'Elderly Caregiver' },
    { value: 'housekeeper', label: 'Housekeeper / Maid' },
    { value: 'cook', label: 'Cook / Chef' },
    { value: 'driver', label: 'Private Driver' },
    { value: 'gardener', label: 'Gardener / Landscaper' },
    { value: 'house_manager', label: 'House Manager' },
    { value: 'tutor', label: 'Tutor / Teacher' },
    { value: 'pet_care', label: 'Pet Care / Sitter' },
    { value: 'maintenance', label: 'Maintenance / Handyman' },
    { value: 'security', label: 'Security Guard' },
    { value: 'personal_assistant', label: 'Personal Assistant' },
    { value: 'event_planner', label: 'Event Planner' },
    { value: 'fitness_trainer', label: 'Fitness Trainer' },
    { value: 'nurse', label: 'Registered Nurse' },
    { value: 'therapist', label: 'Therapist / Counselor' },
    { value: 'cleaner', label: 'Deep Cleaner' },
    { value: 'other', label: 'Other' }
  ];

  const translations = {
    en: {
      title: 'My Profile',
      subtitle: 'Manage your personal information and preferences',
      personalInfo: 'Personal Information',
      fullName: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      location: 'Location',
      bio: 'About Me',
      skills: 'Skills',
      experience: 'Years of Experience',
      hourlyRate: 'Hourly Rate (EGP)',
      desiredJob: 'Desired Job Type',
      selectJob: 'Select a job type...',
      editProfile: 'Edit Profile',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      addSkill: 'Add Skill',
      profileComplete: 'Profile Complete',
      memberSince: 'Member Since',
      rating: 'Rating',
      jobsCompleted: 'Jobs Completed',
      languages: 'Languages',
      notifications: 'Notifications',
      languageToggle: 'العربية',
      saved: '✅ Profile updated successfully!',
      profilePhoto: 'Profile Photo',
      changePhoto: 'Click to change photo'
    },
    ar: {
      title: 'ملفي الشخصي',
      subtitle: 'إدارة معلوماتك الشخصية وتفضيلاتك',
      personalInfo: 'المعلومات الشخصية',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      location: 'الموقع',
      bio: 'عني',
      skills: 'المهارات',
      experience: 'سنوات الخبرة',
      hourlyRate: 'السعر بالساعة (جنيه)',
      desiredJob: 'نوع الوظيفة المطلوبة',
      selectJob: 'اختر نوع الوظيفة...',
      editProfile: 'تعديل الملف',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      addSkill: 'إضافة مهارة',
      profileComplete: 'الملف مكتمل',
      memberSince: 'عضو منذ',
      rating: 'التقييم',
      jobsCompleted: 'الوظائف المكتملة',
      languages: 'اللغات',
      notifications: 'الإشعارات',
      languageToggle: 'English',
      saved: '✅ تم تحديث الملف الشخصي بنجاح!',
      profilePhoto: 'الصورة الشخصية',
      changePhoto: 'انقر لتغيير الصورة'
    }
  };

  const t = translations[language];

  const loadUserData = () => {
    try {
      const userData = localStorage.getItem('homelyserv_user');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    return null;
  };

  const loadSavedProfile = (email) => {
    try {
      const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
      if (email && profiles[email]) {
        return profiles[email];
      }
    } catch (error) {
      console.error('Error loading saved profile:', error);
    }
    return null;
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }

    const userData = loadUserData();
    if (userData) {
      const savedProfile = loadSavedProfile(userData.email);
      
      if (savedProfile) {
        setUser({ ...userData, ...savedProfile });
        setFormData({
          fullName: savedProfile.fullName || userData.fullName || '',
          email: userData.email || '',
          phone: savedProfile.phone || userData.phone || '',
          location: savedProfile.location || userData.location || '',
          bio: savedProfile.bio || userData.bio || 'Experienced professional in home services.',
          skills: savedProfile.skills || userData.skills || ['Child Care', 'First Aid', 'Communication'],
          experience: savedProfile.experience || userData.experience || '3 years',
          hourlyRate: savedProfile.hourlyRate || userData.hourlyRate || '35',
          profileImage: savedProfile.profileImage || userData.profileImage || '',
          desiredJob: savedProfile.desiredJob || userData.desiredJob || '' // Load desired job
        });
        setImagePreview(savedProfile.profileImage || userData.profileImage || '');
      } else {
        setUser(userData);
        setFormData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          location: userData.location || '',
          bio: userData.bio || 'Experienced professional in home services.',
          skills: userData.skills || ['Child Care', 'First Aid', 'Communication'],
          experience: userData.experience || '3 years',
          hourlyRate: userData.hourlyRate || '35',
          profileImage: userData.profileImage || '',
          desiredJob: userData.desiredJob || '' // Load desired job
        });
        setImagePreview(userData.profileImage || '');
      }
    } else {
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, [navigate]);

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
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    navigate('/login');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      const userData = loadUserData();
      if (userData) {
        const savedProfile = loadSavedProfile(userData.email);
        setFormData({
          fullName: savedProfile?.fullName || userData.fullName || '',
          email: userData.email || '',
          phone: savedProfile?.phone || userData.phone || '',
          location: savedProfile?.location || userData.location || '',
          bio: savedProfile?.bio || userData.bio || 'Experienced professional in home services.',
          skills: savedProfile?.skills || userData.skills || ['Child Care', 'First Aid', 'Communication'],
          experience: savedProfile?.experience || userData.experience || '3 years',
          hourlyRate: savedProfile?.hourlyRate || userData.hourlyRate || '35',
          profileImage: savedProfile?.profileImage || userData.profileImage || '',
          desiredJob: savedProfile?.desiredJob || userData.desiredJob || ''
        });
        setImagePreview(savedProfile?.profileImage || userData.profileImage || '');
      }
    }
    setIsEditing(!isEditing);
    setSaveSuccess(false);
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
        const imageData = reader.result;
        setImagePreview(imageData);
        setFormData(prev => ({
          ...prev,
          profileImage: imageData
        }));
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

  const handleSave = () => {
    const updatedUser = {
      ...user,
      fullName: formData.fullName,
      phone: formData.phone,
      location: formData.location,
      bio: formData.bio,
      skills: formData.skills,
      experience: formData.experience,
      hourlyRate: formData.hourlyRate,
      profileImage: formData.profileImage,
      desiredJob: formData.desiredJob // Save desired job
    };

    localStorage.setItem('homelyserv_user', JSON.stringify(updatedUser));
    
    const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
    profiles[user.email] = {
      fullName: formData.fullName,
      phone: formData.phone,
      location: formData.location,
      bio: formData.bio,
      skills: formData.skills,
      experience: formData.experience,
      hourlyRate: formData.hourlyRate,
      profileImage: formData.profileImage,
      desiredJob: formData.desiredJob, // Save desired job
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('homelyserv_profiles', JSON.stringify(profiles));
    
    try {
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      const userIndex = users.findIndex(u => u.email === user.email);
      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          fullName: formData.fullName,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          skills: formData.skills,
          experience: formData.experience,
          hourlyRate: formData.hourlyRate,
          profileImage: formData.profileImage,
          desiredJob: formData.desiredJob // Save desired job
        };
        localStorage.setItem('homelyserv_users', JSON.stringify(users));
      }
    } catch (error) {
      console.error('Error updating users list:', error);
    }
    
    setUser(updatedUser);
    setIsEditing(false);
    setSaveSuccess(true);
    alert(t.saved);
    
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  // Get label for selected job
  const getJobLabel = (value) => {
    const job = jobOptions.find(j => j.value === value);
    return job ? job.label : value || 'Not specified';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <WorkerSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
        handleLogout={handleLogout}
      />

      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-red-100 mt-1">{t.subtitle}</p>
              </div>
              <button
                onClick={handleEditToggle}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isEditing ? <X size={16} /> : <Edit size={16} />}
                {isEditing ? t.cancel : t.editProfile}
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {t.saved}
            </div>
          )}

          {/* Profile Photo Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.profilePhoto}</h3>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-200 bg-gray-100">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-red-50">
                      <User size={48} className="text-red-300" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 p-2 bg-red-600 rounded-full cursor-pointer hover:bg-red-700 transition shadow-lg">
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
                <p className="text-sm text-gray-500 mt-2">{t.changePhoto}</p>
              )}
              {!isEditing && imagePreview && (
                <p className="text-xs text-gray-400 mt-2">Photo uploaded</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.memberSince}</p>
                <Calendar size={20} className="text-blue-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">June 2025</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.rating}</p>
                <Star size={20} className="text-yellow-500" />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-lg font-bold text-gray-800">4.8</span>
                <span className="text-sm text-gray-400">/ 5.0</span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.jobsCompleted}</p>
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-1">24</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.profileComplete}</p>
                <Award size={20} className="text-purple-500" />
              </div>
              <div className="mt-1">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">90%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">{t.personalInfo}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-100 bg-gray-50 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.location}</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.experience}</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.hourlyRate}</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">EGP</span>
                  <input
                    type="text"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
              </div>

              {/* NEW: Desired Job Dropdown Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.desiredJob}
                </label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3 top-3 text-gray-400 z-10" />
                  <select
                    name="desiredJob"
                    value={formData.desiredJob}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg appearance-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isEditing ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <option value="">{t.selectJob}</option>
                    {jobOptions.map((job) => (
                      <option key={job.value} value={job.value}>
                        {job.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
                {!isEditing && formData.desiredJob && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Selected:</span> {getJobLabel(formData.desiredJob)}
                  </p>
                )}
                {!isEditing && !formData.desiredJob && (
                  <p className="text-sm text-gray-400 mt-1">No job type selected</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.bio}</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="3"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    isEditing ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.skills}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm flex items-center gap-1"
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder={t.addSkill}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      {t.addSkill}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <Save size={18} />
                  {t.saveChanges}
                </button>
                <button
                  onClick={handleEditToggle}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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

export default WorkerProfile;ss