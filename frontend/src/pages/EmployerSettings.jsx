import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Briefcase, User, Search, Clock, DollarSign,
  MessageCircle, Settings, LogOut, Globe, MapPin,
  Languages, Lock, Shield, Bell, Save, CheckCircle,
  AlertTriangle, Smartphone, CreditCard
} from 'lucide-react';

function EmployerSettings() {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const [settings, setSettings] = useState({
    countries: ['Egypt', 'UAE', 'Saudi Arabia'],
    cities: ['Cairo', 'Alexandria', 'Dubai'],
    language: 'en',
    notifications: true,
    twoFactor: false,
    profileLocked: false,
    profileDisabled: false
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Employer Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              {userData.fullName?.charAt(0) || 'E'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{userData.fullName || 'Employer'}</p>
              <p className="text-xs text-gray-500">Employer</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/employer-dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/employer-search" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Search size={20} /> Search
          </Link>
          <Link to="/employer-pending" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Clock size={20} /> Pending
          </Link>
          <Link to="/employer-past" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Past
          </Link>
          <Link to="/employer-payments" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <DollarSign size={20} /> Payments
          </Link>
          <Link to="/employer-profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/employer-complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <AlertCircle size={20} /> Complaints
          </Link>
          <Link to="/employer-messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/employer-settings" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Settings</h2>
              <p className="text-gray-500 text-sm">Manage your preferences</p>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Save size={18} /> Save Settings
            </button>
          </div>
          {saved && (
            <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
              <CheckCircle size={16} /> Settings saved successfully!
            </div>
          )}
        </header>

        <div className="p-6 max-w-4xl">
          <div className="space-y-6">
            {/* Locations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-red-600" /> Preferred Locations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Countries</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                    <option>Egypt</option>
                    <option>UAE</option>
                    <option>Saudi Arabia</option>
                    <option>Kuwait</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cities</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                    <option>Cairo</option>
                    <option>Alexandria</option>
                    <option>Giza</option>
                    <option>Dubai</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Language size={20} className="text-red-600" /> Language Settings
              </h3>
              <select className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
                <option value="ru">Русский</option>
                <option value="tr">Türkçe</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Bell size={20} className="text-red-600" /> Notification Settings
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-700">Push Notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={() => handleToggle('notifications')}
                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-700">Email Alerts</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-700">SMS Alerts</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                </label>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-red-600" /> Security Settings
              </h3>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700">Two-Factor Authentication</span>
                <input
                  type="checkbox"
                  checked={settings.twoFactor}
                  onChange={() => handleToggle('twoFactor')}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-red-600" /> Account Settings
              </h3>
              <div className="space-y-3">
                <button className="w-full md:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                  Temporarily Lock Profile
                </button>
                <button className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition ml-0 md:ml-3">
                  Permanently Disable Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployerSettings;