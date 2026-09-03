// Sup-Help User Profile Page - Read-only safe profile view
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import UserProfileView from '../../components/users/UserProfileView';
import { Home, Users, MessageCircle } from 'lucide-react';

const SupHelpUserProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    if (authUser.role !== 'SUPPORT_HELPER' && authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">{t('supHelpUserProfilePage.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <SupportLayout
      allowedRoles={['SUPPORT_HELPER', 'ADMIN']}
      role="SUPPORT_HELPER"
      menuItems={[
        { id: 'dashboard', label: t('supHelpNavigation.dashboard'), icon: Home, path: '/sup-help' },
        { id: 'users', label: t('supportNavigation.users'), icon: Users, path: '/sup-help/users' },
        { id: 'messages', label: t('supportNavigation.messages'), icon: MessageCircle, path: '/sup-help/messages' },
      ]}
    >
      <UserProfileView
        userId={id}
        backTarget="/sup-help/users"
        messageTarget="/sup-help/users"
        variant="supHelp"
      />
    </SupportLayout>
  );
};

export default SupHelpUserProfile;
