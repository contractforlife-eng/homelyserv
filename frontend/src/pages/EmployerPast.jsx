import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import {
  Eye,
  Calendar,
  Star,
  Download,
  Printer
} from 'lucide-react';

function EmployerPast() {
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const dashboard = useDashboard();

  const pastApplications = [
    {
      id: 1,
      workerName: 'Ahmed Ali',
      position: 'Nanny - Full Time',
      salary: 3500,
      status: 'completed',
      date: '2026-06-20',
      endDate: '2026-06-25',
      rating: 4.9,
      feedback: 'Excellent worker! Highly recommended.',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      position: 'Elderly Caregiver',
      salary: 4200,
      status: 'incomplete',
      date: '2026-06-18',
      endDate: '2026-06-22',
      rating: null,
      feedback: 'Worker did not complete the full duration.',
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face'
    }
  ];

  const stats = {
    total: pastApplications.length,
    completed: pastApplications.filter(a => a.status === 'completed').length,
    incomplete: pastApplications.filter(a => a.status === 'incomplete').length,
    completionRate: Math.round((pastApplications.filter(a => a.status === 'completed').length / pastApplications.length) * 100)
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title="Past Applications"
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Past Applications</h1>
              <p className="text-teal-100 mt-1">View your application history</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:bg-gray-900 transition flex items-center gap-1">
                <Download size={16} /> Export
              </button>
              <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:bg-gray-900 transition flex items-center gap-1">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Incomplete</p>
            <p className="text-2xl font-bold text-red-600">{stats.incomplete}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{stats.completionRate}%</p>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {pastApplications.map((app) => (
            <div
              key={app.id}
              className={`rounded-xl shadow-sm border p-4 ${
                app.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200'
                  : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <img src={app.image} alt={app.workerName} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{app.workerName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{app.position}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Calendar size={12} /> {app.date} - {app.endDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center min-w-[120px]">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Salary</p>
                  <p className="font-bold text-gray-800 dark:text-white">EGP {app.salary.toLocaleString()}</p>
                  {app.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{app.rating}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end justify-center gap-2 min-w-[140px]">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    app.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status === 'completed' ? '✅ Completed' : '⏳ Incomplete'}
                  </span>
                  {app.feedback && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 text-right max-w-[200px]">
                      "{app.feedback}"
                    </p>
                  )}
                  <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:bg-blue-900/30 rounded transition">
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default EmployerPast;
