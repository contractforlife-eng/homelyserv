import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  UserCheck
} from 'lucide-react';

function EmployerPending() {
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const dashboard = useDashboard();

  const pendingApplications = [
    {
      id: 1,
      workerName: 'Ahmed Ali',
      position: 'Nanny - Full Time',
      category: 'Babysitter',
      location: 'Cairo, Egypt',
      salary: 3500,
      fee: 350,
      status: 'pending_fee',
      date: '2026-06-20',
      phone: '+201234567890',
      email: 'ahmed@example.com',
      experience: 5,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      position: 'Elderly Caregiver',
      category: 'Caregiver',
      location: 'Alexandria, Egypt',
      salary: 4200,
      fee: 420,
      status: 'pending_approval',
      date: '2026-06-18',
      phone: '+201234567891',
      email: 'mona@example.com',
      experience: 7,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face'
    }
  ];

  // Check authentication and redirect if needed
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      window.location.href = '/login';
      return;
    }

    if (authUser.role !== 'EMPLOYER') {
      window.location.href = '/login';
      return;
    }
  }, [authUser, isAuthenticated, authLoading]);

  const handlePayFee = (id) => {
    alert(`Processing payment for application #${id}`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending_fee':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending Fee (10%)</span>;
      case 'pending_approval':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Pending Approval</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-full text-xs">{status}</span>;
    }
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
        title="Pending Applications"
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Pending Applications</h1>
              <p className="text-teal-100 mt-1">Review and manage pending requests</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Pending</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{pendingApplications.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Pending Fee</p>
            <p className="text-2xl font-bold text-yellow-600">
              {pendingApplications.filter(a => a.status === 'pending_fee').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Fee Amount</p>
            <p className="text-2xl font-bold text-red-600">
              EGP {pendingApplications.reduce((sum, a) => sum + a.fee, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {pendingApplications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <img src={app.image} alt={app.workerName} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{app.workerName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{app.position}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">{app.category}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <MapPin size={12} /> {app.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        ⭐ {app.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center min-w-[150px]">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Salary</p>
                  <p className="font-bold text-gray-800 dark:text-white">EGP {app.salary.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Fee (10%)</p>
                  <p className="font-bold text-red-600">EGP {app.fee.toLocaleString()}</p>
                </div>

                <div className="flex flex-col items-end justify-center gap-2 min-w-[160px]">
                  {getStatusBadge(app.status)}
                  <div className="flex gap-2">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:bg-blue-900/30 rounded transition">
                      <Eye size={18} />
                    </button>
                    {app.status === 'pending_fee' && (
                      <button
                        onClick={() => handlePayFee(app.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1"
                      >
                        <CreditCard size={16} /> Pay Fee
                      </button>
                    )}
                  </div>
                  {app.status === 'pending_fee' && (
                    <p className="text-xs text-yellow-600">Pay 10% fee to proceed</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default EmployerPending;
