// frontend/src/pages/DoctorHomelyServ.jsx
// ============================================================
// HOMELYSERV MODULE (inside the Doctor CMS)
// This is NOT the CMS itself. It is the module that connects the
// doctor with HomelyServ members:
//   • Messages               -> existing chat infrastructure
//   • Appointment Requests   -> existing Doctor appointment records
//   • My HomelyServ Profile  -> how members see the doctor
//
// It is deliberately separate from clinical records,
// consultations, prescriptions, and medical history.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import api from '../utils/api';
import {
  Stethoscope, MessageCircle, Calendar, BadgeCheck, ArrowRight, Info
} from 'lucide-react';

const DoctorHomelyServ = () => {
  const { t } = useTranslation();
  const [unreadMessages, setUnreadMessages] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(null);

  const loadCounters = useCallback(async () => {
    const [summaryRes, pendingRes] = await Promise.allSettled([
      api.get('/api/doctors/dashboard/summary'),
      api.get('/api/doctors/appointments?status=PENDING')
    ]);
    if (summaryRes.status === 'fulfilled') {
      setUnreadMessages(Number(summaryRes.value.data?.summary?.unreadMessages) || 0);
    }
    if (pendingRes.status === 'fulfilled') {
      setPendingRequests(Array.isArray(pendingRes.value.data?.appointments) ? pendingRes.value.data.appointments.length : 0);
    }
  }, []);

  useEffect(() => {
    loadCounters();
  }, [loadCounters]);

  const modules = [
    {
      id: 'messages',
      icon: MessageCircle,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
      title: t('doctorCms.homelyservMessages') || 'Messages',
      desc: t('doctorCms.homelyservMessagesDesc') || 'Questions and conversations from HomelyServ members.',
      path: '/doctor-homelyserv/messages',
      badge: unreadMessages
    },
    {
      id: 'requests',
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      title: t('doctorCms.appointmentRequests') || 'Appointment Requests',
      desc: t('doctorCms.appointmentRequestsDesc') || 'Booking requests submitted by HomelyServ members.',
      path: '/doctor-homelyserv/requests',
      badge: pendingRequests
    },
    {
      id: 'profile',
      icon: BadgeCheck,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
      title: t('doctorCms.myHomelyservProfile') || 'My HomelyServ Profile',
      desc: t('doctorCms.myHomelyservProfileDesc') || 'How HomelyServ members see you in Doctor search results.',
      path: '/doctor-homelyserv/profile',
      badge: null
    }
  ];

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorCms.homelyservTitle') || 'HomelyServ'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <RolePageHeader
          icon={Stethoscope}
          title={t('doctorCms.homelyservTitle') || 'HomelyServ'}
          subtitle={t('doctorCms.homelyservSubtitle') || 'Communication and service requests from HomelyServ members.'}
        />

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-start gap-3">
          <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('doctorCms.homelyservHubDesc') || 'The HomelyServ module connects you with HomelyServ members.'}
            {' '}
            {t('doctorCms.homelyservSeparationNote') || 'This module is separate from clinical records, consultations, prescriptions, and medical history.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.id}
                to={module.path}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col justify-between hover:border-red-300 dark:hover:border-red-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${module.color}`}>
                      <Icon size={20} />
                    </div>
                    {typeof module.badge === 'number' && module.badge > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold">
                        {module.badge > 99 ? '99+' : module.badge}
                      </span>
                    ) : null}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">{module.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{module.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs font-medium text-red-600 dark:text-red-400">
                  <span>{t('doctorCms.openModule') || 'Open'}</span>
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorHomelyServ;

