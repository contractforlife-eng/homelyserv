// Support Dashboard Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import { useDashboard } from '../../components/layout/DashboardContext';
import {
  Users,
  MessageCircle,
  AlertCircle,
  TrendingUp,
  Shield,
  UserCheck,
  Clock,
  HelpCircle,
  ArrowUpRight,
  CheckCircle2,
  LifeBuoy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const dashboard = useDashboard();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching support stats...');
      const response = await api.get('/api/support/stats');
      console.log('📊 Stats response:', response.data);
      
      if (response.data?.success) {
        console.log('✅ Stats loaded:', response.data.stats);
        setStats(response.data.stats);
      } else {
        console.warn('⚠️ Stats response missing success flag:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const translations = {
    en: {
      title: 'Support Dashboard',
      welcome: 'Welcome',
      subtitle: 'Monitor and manage user support',
      totalUsers: 'Total Users',
      totalConversations: 'Total Conversations',
      pendingMessages: 'Pending Messages',
      usersByRole: 'Users by Role',
      workers: 'Workers',
      employers: 'Employers',
      support: 'Support',
      admin: 'Admin',
      loading: 'Loading...',
      noData: 'No data available',
      openComplaints: 'Open Complaints',
      inProgressComplaints: 'Complaints In Progress',
      escalatedComplaints: 'Escalated Complaints',
      resolvedToday: 'Resolved Today',
      usersAssistedToday: 'Users Assisted Today',
      viewComplaints: 'View Complaints'
    },
    ar: {
      title: 'لوحة تحكم الدعم',
      welcome: 'مرحباً',
      subtitle: 'مراقبة وإدارة دعم المستخدمين',
      totalUsers: 'إجمالي المستخدمين',
      totalConversations: 'إجمالي المحادثات',
      pendingMessages: 'الرسائل المعلقة',
      usersByRole: 'المستخدمين حسب الدور',
      workers: 'العمال',
      employers: 'أصحاب العمل',
      support: 'الدعم',
      admin: 'المديرين',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      openComplaints: 'شكاوى مفتوحة',
      inProgressComplaints: 'شكاوى قيد المعالجة',
      escalatedComplaints: 'شكاوى مرفوعة للمشرف',
      resolvedToday: 'تم حلها اليوم',
      usersAssistedToday: 'مستخدمون تمت مساعدتهم اليوم',
      viewComplaints: 'عرض الشكاوى'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon size={24} className={color} />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? t.loading : value || 0}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <SupportLayout>
      <div className="p-6 md:p-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {t.welcome} {authUser?.fullName || 'Support Agent'}
              </h1>
              <p className="text-white/80 mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label={t.totalUsers}
            value={stats?.totalUsers}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            icon={HelpCircle}
            label={t.openComplaints}
            value={stats?.openComplaints}
            color="text-orange-600"
            bgColor="bg-orange-100 dark:bg-orange-900/30"
          />
          <StatCard
            icon={Clock}
            label={t.inProgressComplaints}
            value={stats?.inProgressComplaints}
            color="text-yellow-600"
            bgColor="bg-yellow-100 dark:bg-yellow-900/30"
          />
          <StatCard
            icon={ArrowUpRight}
            label={t.escalatedComplaints}
            value={stats?.escalatedComplaints}
            color="text-red-600"
            bgColor="bg-red-100 dark:bg-red-900/30"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={CheckCircle2}
            label={t.resolvedToday}
            value={stats?.resolvedToday}
            color="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/30"
          />
          <StatCard
            icon={LifeBuoy}
            label={t.usersAssistedToday}
            value={stats?.usersAssistedToday}
            color="text-teal-600"
            bgColor="bg-teal-100 dark:bg-teal-900/30"
          />
          <StatCard
            icon={MessageCircle}
            label={t.totalConversations}
            value={stats?.totalConversations}
            color="text-purple-600"
            bgColor="bg-purple-100 dark:bg-purple-900/30"
          />
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          <Link
            to="/support-complaints"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition"
          >
            <HelpCircle size={18} />
            {t.viewComplaints}
          </Link>
        </div>

        {/* Users by Role */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            {t.usersByRole}
          </h2>
          
          {stats?.usersByRole ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={18} className="text-red-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t.workers}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.usersByRole.WORKER || 0}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} className="text-teal-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t.employers}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.usersByRole.EMPLOYER || 0}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t.support}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.usersByRole.SUPPORT || 0}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-yellow-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t.admin}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.usersByRole.ADMIN || 0}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t.noData}</p>
          )}
        </div>
      </div>
    </SupportLayout>
  );
};

export default SupportDashboard;