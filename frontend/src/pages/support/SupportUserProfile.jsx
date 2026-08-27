// frontend/src/pages/support/SupportUserProfile.jsx
// ============================================================
// SUPPORT USER PROFILE PAGE  (Route: /support/users/:id)
// Renders the shared, layout-independent UserProfileView inside the
// SUPPORT chrome (SupportLayout).
//
// The authenticated SUPPORT session is NEVER modified — the viewed
// profile is owned entirely by UserProfileView's local state.
//
// Permissions (SUPPORT):
//   Allowed:    View users, Reset password, Request suspension,
//               Start conversation, View complaints
//   Not allowed: Delete users, Change roles, Promote to admin,
//               Access system settings
// ============================================================
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import UserProfileView from '../../components/users/UserProfileView';
import { Loader2 } from 'lucide-react';

const SupportUserProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  // ============================================================
  // AUTH CHECK (view permission only; does not mutate session)
  // ============================================================
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    if (authUser.role !== 'SUPPORT' && authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-green-600" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">{t('supportUserProfilePage.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <SupportLayout>
      <UserProfileView
        userId={id}
        backTarget="/support-users"
        messageTarget="/support-messages"
      />
    </SupportLayout>
  );
};

export default SupportUserProfile;
