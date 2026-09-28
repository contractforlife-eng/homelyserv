// src/pages/DoctorHelp.jsx
// ============================================================
// DOCTOR HELP (Doctor module)
// Doctor-specific help and navigation covering all completed
// Doctor modules. Reuses the existing Help page visual style.
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  User, ShieldCheck, Building2, Calendar, Users, FileText, Pill,
  Tag, Crown, MessageCircle, Settings, ChevronRight, HelpCircle
} from 'lucide-react';

const DoctorHelp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const helpSections = [
    {
      icon: User,
      path: '/doctor-profile',
      title: t('doctorHelp.profileTitle') || 'Profile & Credentials',
      desc: t('doctorHelp.profileDesc') || 'Set your professional title, specialty, qualifications, license, bio, profile photo, and profile fees.'
    },
    {
      icon: ShieldCheck,
      path: '/doctor-profile',
      title: t('doctorHelp.verificationTitle') || 'Trust & Verification',
      desc: t('doctorHelp.verificationDesc') || 'Submit documents for review and track your verification status. Verified doctors earn patient trust.'
    },
    {
      icon: Building2,
      path: '/doctor-clinics',
      title: t('doctorHelp.clinicsTitle') || 'Clinics',
      desc: t('doctorHelp.clinicsDesc') || 'Add and manage your clinic locations, addresses, and reception details.'
    },
    {
      icon: Calendar,
      path: '/doctor-schedule',
      title: t('doctorHelp.scheduleTitle') || 'Schedule',
      desc: t('doctorHelp.scheduleDesc') || 'Configure weekly availability, slot durations, and clinic hours. Patients book within your open slots.'
    },
    {
      icon: Calendar,
      path: '/doctor-appointments',
      title: t('doctorHelp.appointmentsTitle') || 'Appointments',
      desc: t('doctorHelp.appointmentsDesc') || 'Review booking requests, confirm or cancel appointments, and mark completed visits.'
    },
    {
      icon: Users,
      path: '/doctor-patients',
      title: t('doctorHelp.patientsTitle') || 'Patients',
      desc: t('doctorHelp.patientsDesc') || 'Your patients with an established relationship. Open a patient to view their medical profile, consultations, and prescriptions.'
    },
    {
      icon: FileText,
      path: '/doctor-patients',
      title: t('doctorHelp.consultationsTitle') || 'Clinical Consultations',
      desc: t('doctorHelp.consultationsDesc') || 'Create draft clinical records, sign them (immutable), and create amendments for established patients.'
    },
    {
      icon: Pill,
      path: '/doctor-patients',
      title: t('doctorHelp.prescriptionsTitle') || 'Prescriptions',
      desc: t('doctorHelp.prescriptionsDesc') || 'Draft, issue, and print prescriptions for signed consultations. Patients see issued prescriptions read-only.'
    },
    {
      icon: Tag,
      path: '/doctor-center',
      title: t('doctorHelp.servicesTitle') || 'Services & Pricing',
      desc: t('doctorHelp.servicesDesc') || 'Manage your bookable offerings: clinic visits, home visits, prices, durations, and follow-up pricing.'
    },
    {
      icon: Crown,
      path: '/doctor-center',
      title: t('doctorHelp.premiumTitle') || 'Doctor Premium',
      desc: t('doctorHelp.premiumDesc') || 'Subscribe weekly, monthly, or yearly. Premium unlocks Profile Performance analytics.'
    },
    {
      icon: MessageCircle,
      path: '/doctor-messages',
      title: t('doctorHelp.messagesTitle') || 'Messages',
      desc: t('doctorHelp.messagesDesc') || 'Chat with your established patients in real time with read receipts and typing indicators.'
    },
    {
      icon: Settings,
      path: '/doctor-settings',
      title: t('doctorHelp.settingsTitle') || 'Settings',
      desc: t('doctorHelp.settingsDesc') || 'Appearance (dark mode), language, and notification preferences.'
    }
  ];

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorHelp.pageTitle') || 'Help & Support'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Intro */}
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                {t('doctorHelp.introTitle') || 'Doctor Portal Guide'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('doctorHelp.introDesc') || 'Everything in the Doctor portal is organized in the sidebar order. Start with Profile, add Clinics and Schedule, then manage Appointments, Patients, Consultations, and Prescriptions. Services & Pricing, Premium, Messages, and Settings live in the Doctor Center.'}
              </p>
            </div>
          </div>
        </div>

        {/* Module guide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {helpSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.title}
                type="button"
                onClick={() => navigate(section.path)}
                className="text-start bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-red-300 dark:hover:border-red-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{section.title}</h3>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 rtl:rotate-180" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{section.desc}</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-3 truncate">{section.path}</p>
              </button>
            );
          })}
        </div>

        {/* Link to full public help center */}
        <div className="text-center">
          <button
            onClick={() => navigate('/help')}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
          >
            {t('doctorHelp.publicHelpLink') || 'Need more? Visit the full Help Center'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHelp;
