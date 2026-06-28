import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, User, Bell, Shield, Globe, 
  Moon, Sun, Mail, Phone, Lock, Eye, EyeOff, Save,
  Smartphone, CreditCard, LogOut, Trash2, AlertTriangle,
  Check, X, ChevronDown, ChevronUp, Edit2, MapPin,
  Languages, Clock, DollarSign, FileText, Heart,
  Volume2, VolumeX, Wifi, WifiOff, Database, Server
} from 'lucide-react';

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    language: 'en',
    currency: 'EGP',
    twoFactor: false,
    profileVisibility: 'public',
    showEmail: true,
    showPhone: true,
    preferredCountries: ['Egypt', 'UAE'],
    preferredCities: ['Cairo', 'Alexandria', 'Dubai'],
    workingHours: '9:00 AM - 6:00 PM',
    timezone: 'Africa/Cairo',
    dateFormat: 'DD/MM/YYYY'
  });

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    company: '',
    website: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setProfileData({
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        location: parsed.city || '',
        bio: parsed.bio || '',
        company: parsed.company || '',
        website: parsed.website || '',
        socialLinks: {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        }
      });
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLockProfile = () => {
    setShowLockConfirm(true);
  };

  const handleDeleteProfile = () => {
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  const sections = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={18} /> },
    { id: 'language', label: 'Language & Region', icon: <Globe size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <Heart size={18} /> },
    { id: 'account', label: 'Account', icon: <SettingsIcon size={18} /> }
  ];

  const renderSection = () => {
    switch(activeSection) {
      case 'profile':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Profile Settings</h3>
            
            {/* Profile Photo */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-4xl font-bold text-red-600">
                {profileData.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                  Change Photo
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF up to 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Tell others about yourself..."
                />
              </div>
            </div>

            <button onClick={handleSave} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
              <Save size={18} /> Save Changes
            </button>
            {saved && (
              <span className="ml-3 text-sm text-green-600 flex items-center gap-1">
                <Check size={16} /> Saved successfully!
              </span>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Notification Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications on your device</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Email Alerts</p>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">SMS Alerts</p>
                  <p className="text-sm text-gray-500">Receive updates via text message</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Job Alerts</p>
                  <p className="text-sm text-gray-500">Get notified about new job opportunities</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
              </label>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Privacy Settings</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option>Public</option>
                  <option>Private</option>
                  <option>Only Employers</option>
                  <option>Only Workers</option>
                </select>
              </div>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Show Email</p>
                  <p className="text-sm text-gray-500">Display your email on your profile</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Show Phone</p>
                  <p className="text-sm text-gray-500">Display your phone number on your profile</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
              </label>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Language & Region</h3>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
                <option value="ru">Русский</option>
                <option value="tr">Türkçe</option>
                <option value="nl">Nederlands</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Countries</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {settings.preferredCountries.map((country, i) => (
                  <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1">
                    {country} <button className="text-red-500 hover:text-red-700"><X size={14} /></button>
                  </span>
                ))}
              </div>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option>Add Country...</option>
                <option>Egypt</option>
                <option>UAE</option>
                <option>Saudi Arabia</option>
                <option>Kuwait</option>
                <option>Qatar</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Cities</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {settings.preferredCities.map((city, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                    {city} <button className="text-blue-500 hover:text-blue-700"><X size={14} /></button>
                  </span>
                ))}
              </div>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option>Add City...</option>
                <option>Cairo</option>
                <option>Alexandria</option>
                <option>Giza</option>
                <option>Dubai</option>
                <option>Abu Dhabi</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option value="EGP">Egyptian Pound (EGP)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="AED">UAE Dirham (AED)</option>
                <option value="SAR">Saudi Riyal (SAR)</option>
              </select>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Security Settings</h3>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
              <div className="space-y-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Current Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-red-600 hover:underline flex items-center gap-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  Update Password
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
              </label>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Preferences</h3>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue="09:00" />
                <input type="time" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue="18:00" />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700">Dark Mode</p>
                  <p className="text-sm text-gray-500">Switch to dark theme</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" 
                />
              </label>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Account Settings</h3>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Account Status</h4>
              <p className="text-sm text-green-700">Your account is <strong>Active</strong></p>
              <p className="text-xs text-green-600 mt-1">Last login: Today at 2:30 PM</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <Clock size={18} /> Temporarily Lock Profile
              </h4>
              <p className="text-sm text-yellow-700">Lock your profile temporarily. You can unlock it anytime.</p>
              <button 
                onClick={handleLockProfile}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
              >
                Lock Profile
              </button>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle size={20} className="text-red-600" />
                <h4 className="font-semibold text-red-800">Danger Zone</h4>
              </div>
              <p className="text-sm text-red-700">Permanently disable your profile. This action cannot be undone.</p>
              <button 
                onClick={handleDeleteProfile}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Lock Confirmation Modal
  if (showLockConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={24} className="text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-800">Lock Profile</h3>
          </div>
          <p className="text-gray-600 mb-6">Are you sure you want to temporarily lock your profile? You can unlock it anytime.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowLockConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
              Yes, Lock
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Delete Confirmation Modal
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={24} className="text-red-600" />
            <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
          </div>
          <p className="text-gray-600 mb-6">Are you sure you want to permanently delete your account? This action <strong>cannot</strong> be undone.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-4">
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      activeSection === section.id 
                        ? 'bg-red-50 text-red-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm">{section.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;