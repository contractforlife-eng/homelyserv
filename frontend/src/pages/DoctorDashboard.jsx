// frontend/src/pages/DoctorDashboard.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  User,
  Calendar,
  Users,
  Clock,
  Building2,
  Stethoscope,
  MessageCircle,
  Bell,
  ArrowRight,
  Shield,
  Sparkles,
  Info
} from 'lucide-react';

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const authUser = useAuthStore(state => state.user);

  // Future feature card definitions
  const placeholderCards = [
    {
      id: 'appointments',
      title: t('doctorDashboard.appointmentsTitle') || 'Appointments',
      desc: t('doctorDashboard.appointmentsDesc') || 'Manage upcoming clinic consultations and home visit requests.',
      icon: Calendar,
      status: t('doctorNav.comingSoon') || 'Coming soon',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'patients',
      title: t('doctorDashboard.patientsTitle') || 'Patients',
      desc: t('doctorDashboard.patientsDesc') || 'View patient medical histories, clinical records, and consultations.',
      icon: Users,
      status: t('doctorNav.comingSoon') || 'Coming soon',
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20'
    },
    {
      id: 'schedule',
      title: t('doctorDashboard.scheduleTitle') || 'Schedule',
      desc: t('doctorDashboard.scheduleDesc') || 'Configure daily clinic availability, consultation slots, and holidays.',
      icon: Clock,
      status: t('doctorNav.comingSoon') || 'Coming soon',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
    },
    {
      id: 'clinics',
      title: t('doctorDashboard.clinicsTitle') || 'Clinics',
      desc: t('doctorDashboard.clinicsDesc') || 'Manage clinic locations, reception details, and physical addresses.',
      icon: Building2,
      status: t('doctorNav.comingSoon') || 'Coming soon',
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      id: 'consultationSettings',
      title: t('doctorDashboard.consultationSettingsTitle') || 'Consultation Settings',
      desc: t('doctorDashboard.consultationSettingsDesc') || 'Set examination fees, home visit rates, and consultation durations.',
      icon: Stethoscope,
      status: t('doctorNav.comingSoon') || 'Coming soon',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
    },
    {
      id: 'messages',
      title: t('doctorDashboard.messagesTitle') || 'Messages',
      desc: t('doctorDashboard.messagesDesc') || 'Direct clinical communication and secure messages with patients.',
      icon: MessageCircle,
      status: t('doctorNav.comingSoon') || 'Coming soon',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
    }
  ];

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DashboardHeader
          title={t('doctorDashboard.headerTitle') || 'Doctor Dashboard'}
        />

        {/* Welcome Doctor Banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles size={14} />
                {t('doctorDashboard.professionalPortalBadge') || 'Doctor Portal'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t('doctorDashboard.welcomeTitle', { name: authUser?.fullName || 'Doctor' }) || `Welcome, Dr. ${authUser?.fullName || ''}`}
              </h1>
              <p className="mt-1 text-red-100 text-sm max-w-xl">
                {t('doctorDashboard.welcomeSubtitle') || 'Manage your medical specialty, credentials, and practice information. Complete your profile to get ready for consultations.'}
              </p>
            </div>

            <Link
              to="/doctor-profile"
              className="inline-flex items-center justify-center gap-2 bg-white text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              <User size={18} />
              {t('doctorDashboard.manageProfileBtn') || 'Manage Profile'}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Foundation Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-semibold">{t('doctorDashboard.foundationNoticeTitle') || 'Doctor Portal Foundation Active'}: </span>
            {t('doctorDashboard.foundationNoticeDesc') || 'You can now configure your professional title, medical specialty, qualifications, and licensing information. Additional clinic and appointment scheduling capabilities will open in subsequent phases.'}
          </div>
        </div>

        {/* Primary Action Card: My Profile */}
        <div className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center flex-shrink-0">
                <User size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('doctorDashboard.myProfileCardTitle') || 'Doctor Professional Profile'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('doctorDashboard.myProfileCardDesc') || 'Set your professional medical title, canonical specialty, subspecialty, bio, years of practice, and licenses.'}
                </p>
              </div>
            </div>

            <Link
              to="/doctor-profile"
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              {t('doctorDashboard.editProfileBtn') || 'Edit Profile'}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Future Modules Grid (Clean Placeholders) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('doctorDashboard.practiceModulesTitle') || 'Clinical Practice Modules'}
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              {t('doctorDashboard.inDevelopment') || 'In Development'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {placeholderCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm opacity-80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                        <Icon size={20} />
                      </div>
                      <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        {card.status}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                      {card.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <span>{t('doctorDashboard.moduleLocked') || 'Phase 2 Module'}</span>
                    <Shield size={14} className="opacity-60" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
