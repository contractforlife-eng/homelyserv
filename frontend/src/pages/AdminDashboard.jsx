import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Eye,
  MessageCircle,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  BarChart3,
  Activity,
  RefreshCw,
  Globe,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Check,
  X,
  Plus,
  Settings,
  Bell,
  LogOut,
  Home,
  Star,
  MapPin,
  Phone,
  Mail,
  Shield,
  Award,
  PieChart,
  LineChart,
  Users as UsersIcon,
  Building,
  CreditCard,
  Wallet,
  Banknote
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Translations
  const translations = {
    en: {
      dashboard: 'Dashboard',
      overview: 'Overview',
      workers: 'Workers',
      employers: 'Employers',
      hires: 'Hires',
      payments: 'Payments',
      verifications: 'Verifications',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout',
      welcome: 'Welcome back, Admin',
      stats: {
        totalWorkers: 'Total Workers',
        totalEmployers: 'Total Employers',
        totalHires: 'Total Hires',
        totalRevenue: 'Total Revenue',
        pendingVerifications: 'Pending Verifications',
        activeHires: 'Active Hires',
        pendingPayments: 'Pending Payments',
        monthlyGrowth: 'Monthly Growth'
      },
      languageToggle: 'العربية'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      overview: 'نظرة عامة',
      workers: 'العمال',
      employers: 'أصحاب العمل',
      hires: 'التوظيفات',
      payments: 'المدفوعات',
      verifications: 'التحقق',
      reports: 'التقارير',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      welcome: 'مرحباً بعودتك، مشرف',
      stats: {
        totalWorkers: 'إجمالي العمال',
        totalEmployers: 'إجمالي أصحاب العمل',
        totalHires: 'إجمالي التوظيفات',
        totalRevenue: 'إجمالي الإيرادات',
        pendingVerifications: 'طلبات التحقق المعلقة',
        activeHires: 'التوظيفات النشطة',
        pendingPayments: 'المدفوعات المعلقة',
        monthlyGrowth: 'النمو الشهري'
      },
      languageToggle: 'English'
    }
  };

  const t = translations[language];

  // Demo stats
  const stats = {
    totalWorkers: 2547,
    totalEmployers: 1234,
    totalHires: 895,
    totalRevenue: 187500,
    pendingVerifications: 45,
    activeHires: 342,
    pendingPayments: 28,
    monthlyGrowth: 12.5
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">HomelyServ</span>
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={20} />
              <span>{t.overview}</span>
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'workers' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              <span>{t.workers}</span>
            </button>
            <button
              onClick={() => setActiveTab('employers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'employers' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building size={20} />
              <span>{t.employers}</span>
            </button>
            <button
              onClick={() => setActiveTab('hires')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'hires' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={20} />
              <span>{t.hires}</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'payments' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign size={20} />
              <span>{t.payments}</span>
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'verifications' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shield size={20} />
              <span>{t.verifications}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings size={20} />
              <span>{t.settings}</span>
            </button>
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              localStorage.removeItem('homelyserv_token');
              localStorage.removeItem('homelyserv_user');
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t.dashboard}</h1>
              <p className="text-gray-500 text-sm">{t.welcome}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm"
              >
                <Globe size={16} className="text-gray-600" />
                <span className="font-medium">{t.languageToggle}</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Admin User</p>
                  <p className="text-xs text-gray-500">admin@homelyserv.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalWorkers}</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalWorkers.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Users size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+12%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalEmployers}</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalEmployers.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <Building size={24} className="text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+8%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalHires}</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalHires.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Briefcase size={24} className="text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+15%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalRevenue}</p>
                      <p className="text-2xl font-bold text-gray-800">EGP {stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                      <DollarSign size={24} className="text-red-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+18%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.pendingVerifications}</p>
                      <p className="text-xl font-bold text-gray-800">{stats.pendingVerifications}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.activeHires}</p>
                      <p className="text-xl font-bold text-gray-800">{stats.activeHires}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <AlertCircle size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.pendingPayments}</p>
                      <p className="text-xl font-bold text-gray-800">{stats.pendingPayments}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs */}
          {activeTab !== 'overview' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {t[activeTab] || activeTab}
              </h2>
              <p className="text-gray-500">Management interface for {activeTab} coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;