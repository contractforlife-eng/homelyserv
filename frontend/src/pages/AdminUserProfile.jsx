// frontend/src/pages/AdminUserProfile.jsx
// ============================================================
// ADMIN USER PROFILE PAGE  (Route: /admin/users/:id)
// Renders the shared, layout-independent UserProfileView inside the
// ADMIN chrome (AdminSidebar + admin DashboardHeader).
//
// The authenticated ADMIN session is NEVER modified — the viewed
// profile is owned entirely by UserProfileView's local state.
// ============================================================
import React from 'react';
import { useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import UserProfileView from '../components/users/UserProfileView';

const AdminUserProfile = () => {
  const { id } = useParams();
  const authUser = useAuthStore(state => state.user);

  return (
    <DashboardLayout requiredRole="ADMIN">
      <DashboardHeader
        title="User Profile"
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
      />
      <UserProfileView
        userId={id}
        backTarget="/admin/hires"
        messageTarget="/admin/messages"
      />
    </DashboardLayout>
  );
};

export default AdminUserProfile;
