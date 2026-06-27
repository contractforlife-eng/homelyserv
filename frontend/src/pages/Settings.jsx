import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Bell, Shield, Globe, Moon, Sun, 
  Mail, Phone, Lock, Eye, EyeOff, Save,
  Smartphone, CreditCard, LogOut, Trash2, AlertTriangle
} from 'lucide-react';

function Settings() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    language: 'en',
    currency: 'EGP',
    twoFactor: false
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-2 bg-red-50 text-red-600 rounded-lg">
                  <User size={18} /> Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                  <Bell size={18} /> Notifications
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                  <Shield size={18} /> Privacy
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                  <Globe size={18} /> Language
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                  <CreditCard size={18} /> Payments
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Profile Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue="Ahmed Ali" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue="ahmed@homelyserv.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue="+201234567890" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue="Cairo, Egypt" />
                </div>
              </div>
              <button className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Save Changes
              </button>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Notifications</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-700">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications on your device</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-700">Email Alerts</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-700">SMS Alerts</p>
                    <p className="text-sm text-gray-500">Receive updates via text message</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                </label>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Change Password</label>
                  <div className="flex gap-3">
                    <input type="password" placeholder="Current Password" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                    <input type="password" placeholder="New Password" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Update</button>
                  </div>
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-700">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={24} className="text-red-600" />
                <h3 className="text-xl font-bold text-red-600">Danger Zone</h3>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2">
                  <LogOut size={18} /> Deactivate Account
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                  <Trash2 size={18} /> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;