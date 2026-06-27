import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
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
=======
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4

const AdminDashboard = () => {
  const navigate = useNavigate();
<<<<<<< HEAD
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
=======
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHires: 0,
    pendingPayments: 0,
    activeHires: 0,
    totalRevenue: 0
  });
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
<<<<<<< HEAD
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
=======
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/hires/all');
      const allHires = res.data || [];
      setHires(allHires);

      const pending = allHires.filter(h => h.paymentStatus === 'pending').length;
      const active = allHires.filter(h => h.status === 'active').length;
      const revenue = allHires
        .filter(h => h.paymentStatus === 'confirmed')
        .reduce((sum, h) => sum + h.totalDue, 0);

      setStats({
        totalHires: allHires.length,
        pendingPayments: pending,
        activeHires: active,
        totalRevenue: revenue
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
  };

  const confirmPayment = async (hireId) => {
    if (!window.confirm('Confirm this payment?')) return;
    try {
      await api.put(`/hires/${hireId}/confirm-payment`);
      toast.success('Payment confirmed!');
      fetchData();
    } catch (err) {
      toast.error('Failed to confirm payment');
    }
  };

  const rejectPayment = async (hireId) => {
    if (!window.confirm('Reject this payment?')) return;
    try {
      await api.put(`/hires/${hireId}/payment`, {
        paymentMethod: 'rejected',
        paymentProofUrl: 'rejected'
      });
      toast.success('Payment rejected');
      fetchData();
    } catch (err) {
      toast.error('Failed to reject payment');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading dashboard...</div>;

  if (user?.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Access denied. Admin only.</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <div style={{ background: '#2C3E50', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>Admin Dashboard</h1>
        <span style={{ marginLeft: 'auto', color: '#bdc3c7', fontSize: '13px' }}>HomelyServ Admin</span>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#C0392B' }}>{stats.totalHires}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Total Hires</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#E67E22' }}>{stats.pendingPayments}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Pending Payments</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#27AE60' }}>{stats.activeHires}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Active Hires</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#C0392B' }}>EGP {stats.totalRevenue.toFixed(0)}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Revenue</div>
          </div>
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
        </div>

<<<<<<< HEAD
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
=======
        {/* Pending Payments */}
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>Pending Payments</h2>

        {hires.filter(h => h.paymentStatus === 'pending').length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#888', marginBottom: '20px' }}>
            ✅ No pending payments
          </div>
        ) : (
          hires.filter(h => h.paymentStatus === 'pending').map(hire => (
            <div key={hire.id} style={{ background: '#fff', borderRadius: '10px', padding: '16px', marginBottom: '10px', border: '1px solid #E0E0E0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1A1A1A' }}>{hire.worker?.user?.fullName}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{hire.worker?.category} · {hire.worker?.user?.city}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Employer: <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{hire.employer?.fullName}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    Method: <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{hire.paymentMethod}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    Reference: <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{hire.paymentReference}</span>
                  </div>
                  {hire.paymentProofUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <a href={hire.paymentProofUrl} target="_blank" rel="noreferrer"
                        style={{ color: '#C0392B', fontSize: '12px', fontWeight: '600', textDecoration: 'none', background: '#FDECEA', padding: '4px 12px', borderRadius: '20px' }}>
                        📎 View payment screenshot
                      </a>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#C0392B' }}>EGP {hire.totalDue?.toFixed(0)}</div>
                  <div style={{ fontSize: '11px', color: '#E67E22', fontWeight: '500' }}>⏳ Pending</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => confirmPayment(hire.id)}
                  style={{ flex: 1, padding: '8px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                  ✅ Confirm Payment
                </button>
                <button onClick={() => rejectPayment(hire.id)}
                  style={{ flex: 1, padding: '8px', background: '#E74C3C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                  ❌ Reject
                </button>
              </div>
            </div>
          ))
        )}

        {/* All Hires */}
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', margin: '20px 0 12px' }}>All Hires ({hires.length})</h2>

        {hires.map(hire => (
          <div key={hire.id} style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px', border: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1A1A1A' }}>{hire.worker?.user?.fullName}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{hire.employer?.fullName} · EGP {hire.agreedSalary} · {hire.paymentReference}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '11px', fontWeight: '500',
                color: hire.paymentStatus === 'confirmed' ? '#27AE60' :
                  hire.paymentStatus === 'pending' ? '#E67E22' : '#888'
              }}>
                {hire.paymentStatus === 'confirmed' ? '✅' :
                  hire.paymentStatus === 'pending' ? '⏳' : '⚪'} {hire.paymentStatus || 'Not started'}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: '500',
                color: hire.status === 'active' ? '#27AE60' :
                  hire.status === 'offer_sent' ? '#F39C12' : '#888'
              }}>
                ● {hire.status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
      </div>
    </div>
  );
};

export default AdminDashboard;