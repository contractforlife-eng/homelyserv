// src/pages/AdminReports.jsx - REAL ANALYTICS
// Fetches real data from GET /api/admin/analytics.
// No fake data. Supports dark/light mode and responsive charts.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import PageLoader from '../components/common/PageLoader';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/admin/StatCard';
import {
  Users,
  Briefcase,
  DollarSign,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  PieChart,
  BarChart3,
  Crown,
  FileText,
  Activity,
  UserPlus,
} from 'lucide-react';

// ============================================================
// FORMAT HELPERS
// ============================================================
const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString()} EGP`;

const colorPalette = [
  'bg-yellow-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-indigo-500',
];

// ============================================================
// MAIN ADMIN REPORTS COMPONENT
// ============================================================
const AdminReports = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.isLoading);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/analytics');
      if (response.data?.success) {
        setAnalytics(response.data.analytics);
      } else {
        setError(response.data?.message || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('❌ Error loading analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
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
    fetchAnalytics();
  }, [authUser, isAuthenticated, authLoading, navigate, fetchAnalytics]);

  const t = {
    title: 'Reports & Analytics',
    subtitle: 'Real platform insights and analytics',
    usersGrowth: 'User Growth',
    revenueOverview: 'Revenue Overview',
    hiresStatistics: 'Hires Statistics',
    complaintsStatistics: 'Complaints Statistics',
    subscriptions: 'Subscriptions',
    categories: 'Category Distribution',
    totalRevenue: 'Total Revenue',
    totalHires: 'Total Hires',
    totalComplaints: 'Total Complaints',
    totalUsers: 'Total Users',
    activeSubs: 'Active Subscriptions',
    byMonth: 'By Month',
    byStatus: 'By Status',
    byMethod: 'By Payment Method',
    overview: 'Overview',
    users: 'Users',
    hires: 'Hires',
    revenue: 'Revenue',
    reports: 'Reports',
    noData: 'No analytics data available',
    refresh: 'Refresh',
    loading: 'Loading analytics...',
  };

  // ============================================================
  // CHART HELPERS
  // ============================================================
  const renderBarChart = (data, valueKey = 'count', labelKey = 'label') => {
    if (!data || data.length === 0) {
      return (
        <EmptyState
          icon={BarChart3}
          title="No data"
          description="No data available for this chart"
        />
      );
    }
    const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
    return (
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center flex-1 min-w-0">
            <div
              className={`w-full ${colorPalette[i % colorPalette.length]} rounded-t transition-all duration-500`}
              style={{ height: `${Math.max(((item[valueKey] || 0) / max) * 100, 2)}%` }}
            ></div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate w-full text-center">
              {String(item[labelKey] || '').replace('-', ' ')}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              {item[valueKey] || 0}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderStatusList = (statusObj) => {
    const entries = Object.entries(statusObj || {});
    if (entries.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">No status data</p>;
    }
    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderKeyValueList = (data, valueKey = 'total', labelKey = 'method') => {
    if (!data || data.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">No data</p>;
    }
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300 capitalize">{item[labelKey]}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {valueKey === 'total' ? formatCurrency(item[valueKey]) : item[valueKey]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER: LOADING / ERROR
  // ============================================================
  if (authLoading) {
    return <PageLoader text="Loading..." fullScreen />;
  }

  if (!authUser) return null;

  if (loading) {
    return <PageLoader text={t.loading} fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-red-500/20 max-w-md w-full">
          <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to load analytics</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition inline-flex items-center gap-2 font-medium"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const a = analytics || {};

  const overviewStats = [
    { label: t.totalUsers, value: a.totalUsers ?? 0, icon: Users, color: 'blue' },
    { label: t.totalRevenue, value: formatCurrency(a.revenueOverview?.total ?? 0), icon: DollarSign, color: 'yellow' },
    { label: t.totalHires, value: a.hiresStatistics?.total ?? 0, icon: Briefcase, color: 'teal' },
    { label: t.totalComplaints, value: a.complaintsStatistics?.total ?? 0, icon: AlertTriangle, color: 'red' },
    { label: t.activeSubs, value: a.subscriptionStatistics?.active ?? 0, icon: Crown, color: 'purple' },
  ];

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">{t.title}</h1>
              <p className="text-black/70 mt-1">{t.subtitle}</p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="bg-black/20 hover:bg-black/30 text-black px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {t.refresh}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-yellow-500/20">
          {['overview', 'users', 'hires', 'revenue', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition capitalize ${
                activeTab === tab
                  ? 'text-yellow-500 border-b-2 border-yellow-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-300'
              }`}
            >
              {t[tab]}
            </button>
          ))}
        </div>

        {/* ============================================
            OVERVIEW
            ============================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {overviewStats.map((card, i) => (
                <StatCard
                  key={i}
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                />
              ))}
            </div>

            {/* User growth chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                {t.usersGrowth} (12 months)
              </h3>
              {renderBarChart(a.usersGrowth || [], 'count', 'label')}
            </div>

            {/* Category distribution + revenue methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieChart size={18} className="text-purple-600" />
                  {t.categories}
                </h3>
                <div className="space-y-3">
                  {(a.categoryDistribution || []).map((cat, i) => {
                    const total = (a.categoryDistribution || []).reduce((s, c) => s + c.count, 0) || 1;
                    const pct = Math.round((cat.count / total) * 100);
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{cat.category}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{cat.count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div className={`h-2 rounded-full ${colorPalette[i % colorPalette.length]}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {(a.categoryDistribution || []).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No category data</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-green-600" />
                  {t.revenueOverview} — {t.byMethod}
                </h3>
                {renderKeyValueList(a.revenueOverview?.byMethod || [], 'total', 'method')}
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            USERS
            ============================================ */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              {t.usersGrowth} (12 months)
            </h3>
            {renderBarChart(a.usersGrowth || [], 'count', 'label')}
          </div>
        )}

        {/* ============================================
            HIRES
            ============================================ */}
        {activeTab === 'hires' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-teal-600" />
                  {t.hiresStatistics}
                </h3>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{a.hiresStatistics?.total ?? 0}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.byStatus}</p>
                  {renderStatusList(a.hiresStatistics?.byStatus)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.byMonth} (12 months)</p>
                  {renderBarChart(a.hiresStatistics?.byMonth || [], 'count', 'label')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            REVENUE
            ============================================ */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign size={18} className="text-yellow-600" />
                  {t.totalRevenue}
                </h3>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(a.revenueOverview?.total ?? 0)}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.byMonth} (12 months)</p>
                  {renderBarChart(a.revenueOverview?.byMonth || [], 'total', 'label')}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.byMethod}</p>
                  {renderKeyValueList(a.revenueOverview?.byMethod || [], 'total', 'method')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            REPORTS
            ============================================ */}
        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-yellow-600" />
              {t.reports}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Analytics data is now sourced from the database. Use the Overview, Users, Hires, and Revenue tabs to explore the data.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;