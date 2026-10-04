// src/pages/DoctorComplaints.jsx - DOCTOR SUPPORT TICKET SYSTEM
// Reuses the existing shared TicketSystem + complaints API. The backend
// scopes every read/write to the authenticated caller's own complaints, so
// a Doctor only ever sees and creates their own tickets.
import React from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import TicketSystem from '../components/TicketSystem';

const DoctorComplaints = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('ticketSystem.wrapperLoading')}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader
        title={t('ticketSystem.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isUserPremium(authUser?.id || authUser?.email)}
      />
      {/* Doctor identity theme (red), matching DoctorDashboard / DoctorSidebar */}
      <TicketSystem theme="doctor" userRole="DOCTOR" />
    </DashboardLayout>
  );
};

export default DoctorComplaints;