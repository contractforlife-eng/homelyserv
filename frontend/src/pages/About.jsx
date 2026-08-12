import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Briefcase, Award, Shield, Heart, Globe, CheckCircle, TrendingUp } from 'lucide-react';
import LegalFooter from '../components/common/LegalFooter';
import useAuthStore from '../store/authStore';

function About() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const handleBack = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (location.key && location.key !== 'default') {
      navigate(-1);
      return;
    }

    if (authUser?.role === 'EMPLOYER') {
      navigate('/employer-dashboard');
    } else if (authUser?.role === 'WORKER') {
      navigate('/worker-dashboard');
    } else {
      navigate('/help');
    }
  };

  const stats = [
    { label: t('aboutPage.stats.activeUsers'), value: '25,000+', icon: <Users size={24} /> },
    { label: t('aboutPage.stats.workers'), value: '8,000+', icon: <Briefcase size={24} /> },
    { label: t('aboutPage.stats.jobsCompleted'), value: '15,000+', icon: <CheckCircle size={24} /> },
    { label: t('aboutPage.stats.satisfactionRate'), value: '98%', icon: <Award size={24} /> }
  ];

  const values = [
    { title: t('aboutPage.values.trust.title'), description: t('aboutPage.values.trust.description'), icon: <Shield size={32} className="text-red-600" /> },
    { title: t('aboutPage.values.quality.title'), description: t('aboutPage.values.quality.description'), icon: <Award size={32} className="text-red-600" /> },
    { title: t('aboutPage.values.care.title'), description: t('aboutPage.values.care.description'), icon: <Heart size={32} className="text-red-600" /> },
    { title: t('aboutPage.values.global.title'), description: t('aboutPage.values.global.description'), icon: <Globe size={32} className="text-red-600" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleBack} className="text-gray-600 dark:text-gray-300 hover:text-red-600 transition">{t('back')}</button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('aboutPage.title')}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">{t('aboutPage.heroTitle')}</h1>
          <p className="text-lg text-red-100 max-w-2xl">
            {t('aboutPage.heroDescription')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('aboutPage.missionTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {t('aboutPage.missionDescription')}
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {values.map((value, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
              <div className="flex justify-center mb-3">{value.icon}</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">{value.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('aboutPage.whyChoose')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{t('aboutPage.features.verified.title')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('aboutPage.features.verified.description')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{t('aboutPage.features.payments.title')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('aboutPage.features.payments.description')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{t('aboutPage.features.chat.title')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('aboutPage.features.chat.description')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{t('aboutPage.features.support.title')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('aboutPage.features.support.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LegalFooter />
    </div>
  );
}

export default About;
