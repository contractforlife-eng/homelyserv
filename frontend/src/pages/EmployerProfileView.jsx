import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { UserAvatar, UserDisplayName } from '../components/users';
import api from '../utils/api';

const EmployerProfileView = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const backLabelKey = location.state?.from === 'offers'
    ? 'messagesProfile.backOffers'
    : location.state?.from === 'messages'
      ? 'messagesProfile.backMessages'
      : 'messagesProfile.backFallback';
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const initialProfile = location.state?.employer;
      if (initialProfile) {
        if (!cancelled) {
          setProfile(initialProfile);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get(`/api/employers/profile/${encodeURIComponent(userId)}`);
        if (!cancelled) setProfile(response.data?.user || null);
      } catch (requestError) {
        if (cancelled) return;
        const status = requestError?.response?.status;
        setError(status === 403
          ? t('messagesProfile.accessDenied')
          : status === 404
            ? t('messagesProfile.notFound')
            : t('messagesProfile.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (userId) loadProfile();
    else {
      setError(t('messagesProfile.notFound'));
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [location.state, userId, t]);

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader title={t('messagesProfile.employerTitle')} />
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-red-600 hover:text-red-700"
        >
          {t(backLabelKey)}
        </button>

        {loading && <p className="text-gray-600 dark:text-gray-300">{t('messagesProfile.loading')}</p>}
        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}
        {!loading && !error && profile && (
          <section className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-6">
              <UserAvatar name={profile.fullName} image={profile.profileImage} role={profile.role} size="lg" />
              <div>
                <UserDisplayName name={profile.fullName} role={profile.role} size="lg" />
                {profile.companyName && <p className="text-sm text-gray-500">{profile.companyName}</p>}
              </div>
            </div>
            <div className="grid gap-3 text-sm text-gray-700 dark:text-gray-200">
              {(profile.location || profile.countryName) && (
                <p><span className="font-medium">{t('messagesProfile.location')}:</span> {profile.location || profile.countryName}</p>
              )}
              {profile.language && <p><span className="font-medium">{t('messagesProfile.language')}:</span> {profile.language}</p>}
              {profile.website && <p><span className="font-medium">{t('messagesProfile.website')}:</span> {profile.website}</p>}
              {profile.bio && <p><span className="font-medium">{t('messagesProfile.about')}:</span> {profile.bio}</p>}
              {profile.email && <p><span className="font-medium">{t('messagesProfile.email')}:</span> {profile.email}</p>}
              {profile.phone && <p><span className="font-medium">{t('messagesProfile.phone')}:</span> {profile.phone}</p>}
            </div>
          </section>
        )}
      </main>
    </DashboardLayout>
  );
};

export default EmployerProfileView;
