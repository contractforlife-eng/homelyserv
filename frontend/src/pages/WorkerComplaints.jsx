// src/pages/WorkerComplaints.jsx - SUPPORT TICKET SYSTEM (RED THEME)
import React from 'react';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import TicketSystem from '../components/TicketSystem';

const WorkerComplaints = () => {
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);

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

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title="Support Tickets"
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isUserPremium(authUser?.id || authUser?.email)}
      />
      <TicketSystem theme="red" userRole="WORKER" />
    </DashboardLayout>
  );
};

export default WorkerComplaints;