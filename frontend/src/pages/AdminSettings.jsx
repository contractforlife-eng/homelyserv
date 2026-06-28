import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Settings, Save, X, Edit, Eye, EyeOff, 
  Globe, DollarSign, Percent, Phone, Mail,
  Building, Users, Shield, Award, Bell,
  Clock, Calendar, MapPin, CreditCard,
  Wallet, Banknote, ArrowLeft, RefreshCw,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Smartphone, Database, Server, Lock, Key,
  UserCheck, UserX, MessageCircle, FileText,
  Home, Briefcase, Star, TrendingUp
} from 'lucide-react';

function AdminSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'ADMIN') {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'HomelyServ',
    siteDescription: 'Your Home, Our Priority',
    supportEmail: 'support@homelyserv.com',
    supportPhone: '+201009189851',
    defaultLanguage: 'en',
    defaultCurrency: 'EGP',
    timezone: 'Africa/Cairo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',

    // Commission Settings
    commissionRate: 6.5,
    vatRate: 14,
    minCommission: 50,
    maxCommission: 5000,
    commissionType: 'percentage',

    // Payment Settings
    instapayNumber: '01009189851',
    vodafoneNumber: '01009189851',
    bankAccountName: 'HomelyServ',
    bankAccountNumber: '1002425938683',
    bankName: 'QNB Alahli',
    bankIBAN: 'EG580037000908181002425938683',
    bankSWIFT: 'QNBAEGCXXXX',
    bankBranch: 'Cairo Main Branch',

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    jobAlerts: true,
    paymentAlerts: true,
    complaintAlerts: true,

    // Security Settings
    twoFactorAuth: false,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    requireEmailVerification: true,
    requirePhoneVerification: false,

    // Feature Settings
    enableChat: true,
    enablePayments: true,
    enableReviews: true,
    enableComplaints: true,
    enableWhatsApp: true,
    enableMultiLanguage: true,
    enableDarkMode: false
  });

  const [editForm, setEditForm] = useState(settings);

  const handleSave = () => {
    setSettings(editForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (field, value) => {
    setEditForm({...editForm, [field]: value});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  const sections = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'commission', label: 'Commission', icon: <Percent size={18} /> },
    { id: 'payment', label: 'Payment', icon: <CreditCard size={18} /> },
    { id: 'notification', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'features', label: 'Features', icon: <Award size={18} /> }
  ];

  const renderSection = () => {
    switch(activeSection) {
      case 'general':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">General Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input
                  type="text"
                  value={editForm.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
                <input
                  type="text"
                  value={editForm.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={editForm.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                <input
                  type="tel"
                  value={editForm.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
                <select
                  value={editForm.defaultLanguage}
                  onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="fr">Français</option>
                  <option value="ru">Русский</option>
                  <option value="tr">Türkçe</option>
                  <option value="nl">Nederlands</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                <select
                  value={editForm.defaultCurrency}
                  onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="EGP">EGP - Egyptian Pound</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={editForm.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                  <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="America/New_York">America/New_York (GMT-4)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                <select
                  value={editForm.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                <select
                  value={editForm.timeFormat}
                  onChange={(e) => handleChange('timeFormat', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="12h">12-hour</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'commission':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Commission Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={editForm.commissionRate}
                  onChange={(e) => handleChange('commissionRate', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                <input
                  type="number"
                  value={editForm.vatRate}
                  onChange={(e) => handleChange('vatRate', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Commission</label>
                <input
                  type="number"
                  value={editForm.minCommission}
                  onChange={(e) => handleChange('minCommission', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Commission</label>
                <input
                  type="number"
                  value={editForm.maxCommission}
                  onChange={(e) => handleChange('maxCommission', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                <select
                  value={editForm.commissionType}
                  onChange={(e) => handleChange('commissionType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle size={16} />
                Commission is calculated as {editForm.commissionRate}% of the agreed salary + {editForm.vatRate}% VAT
              </p>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Payment Settings</h3>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Mobile Payment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">InstaPay Number</label>
                  <input
                    type="text"
                    value={editForm.instapayNumber}
                    onChange={(e) => handleChange('instapayNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vodafone Cash Number</label>
                  <input
                    type="text"
                    value={editForm.vodafoneNumber}
                    onChange={(e) => handleChange('vodafoneNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Bank Transfer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editForm.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={editForm.bankAccountName}
                    onChange={(e) => handleChange('bankAccountName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={editForm.bankAccountNumber}
                    onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                  <input
                    type="text"
                    value={editForm.bankIBAN}
                    onChange={(e) => handleChange('bankIBAN', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT Code</label>
                  <input
                    type="text"
                    value={editForm.bankSWIFT}
                    onChange={(e) => handleChange('bankSWIFT', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={editForm.bankBranch}
                    onChange={(e) => handleChange('bankBranch', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'notification':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Notification Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.smsNotifications}
                  onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.pushNotifications}
                  onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Job Alerts</p>
                  <p className="text-sm text-gray-500">Get notified about new job opportunities</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.jobAlerts}
                  onChange={(e) => handleChange('jobAlerts', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Payment Alerts</p>
                  <p className="text-sm text-gray-500">Get notified about payment transactions</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.paymentAlerts}
                  onChange={(e) => handleChange('paymentAlerts', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Complaint Alerts</p>
                  <p className="text-sm text-gray-500">Get notified about new complaints</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.complaintAlerts}
                  onChange={(e) => handleChange('complaintAlerts', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Security Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Expiry (days)</label>
                <input
                  type="number"
                  value={editForm.passwordExpiry}
                  onChange={(e) => handleChange('passwordExpiry', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                <input
                  type="number"
                  value={editForm.maxLoginAttempts}
                  onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={editForm.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.twoFactorAuth}
                  onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Email Verification</p>
                  <p className="text-sm text-gray-500">Require email verification for new users</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.requireEmailVerification}
                  onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Phone Verification</p>
                  <p className="text-sm text-gray-500">Require phone verification for new users</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.requirePhoneVerification}
                  onChange={(e) => handleChange('requirePhoneVerification', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Feature Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Enable Chat</p>
                  <p className="text-sm text-gray-500">Allow users to chat with each other</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.enableChat}
                  onChange={(e) => handleChange('enableChat', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Enable Payments</p>
                  <p className="text-sm text-gray-500">Allow users to make payments</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.enablePayments}
                  onChange={(e) => handleChange('enablePayments', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Enable Reviews</p>
                  <p className="text-sm text-gray-500">Allow users to leave reviews</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.enableReviews}
                  onChange={(e) => handleChange('enableReviews', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Enable Complaints</p>
                  <p className="text-sm text-gray-500">Allow users to submit complaints</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.enableComplaints}
                  onChange={(e) => handleChange('enableComplaints', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Enable WhatsApp</p>
                  <p className="text-sm text-gray-500">Allow WhatsApp integration for communication</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.enableWhatsApp}
                  onChange={(e) => handleChange('enableWhatsApp', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Enable Multi-Language</p>
                  <p className="text-sm text-gray-500">Allow users to switch between languages</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.enableMultiLanguage}
                  onChange={(e) => handleChange('enableMultiLanguage', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-700">Enable Dark Mode</p>
                  <p className="text-sm text-gray-500">Allow users to switch to dark theme</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.enableDarkMode}
                  onChange={(e) => handleChange('enableDarkMode', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Admin Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle size={16} /> Saved successfully!
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Save size={18} /> Save Settings
            </button>
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

export default AdminSettings;