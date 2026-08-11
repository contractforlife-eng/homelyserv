// frontend/src/components/LoginMarketing.jsx
// Presentation-only marketing component for login page
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, UserCheck, UserPlus, UserRound, HeartHandshake, Stethoscope, Car, ChefHat, Home, Sprout, ShieldCheck, GraduationCap } from 'lucide-react';

const services = [
  { icon: UserRound, labelKey: 'serviceBabysitter', accent: 'bg-rose-50 text-rose-600' },
  { icon: HeartHandshake, labelKey: 'serviceElderlyCaregiver', accent: 'bg-emerald-50 text-emerald-600' },
  { icon: Stethoscope, labelKey: 'serviceNurse', accent: 'bg-cyan-50 text-cyan-600' },
  { icon: Car, labelKey: 'serviceDriver', accent: 'bg-blue-50 text-blue-600' },
  { icon: ChefHat, labelKey: 'serviceCook', accent: 'bg-orange-50 text-orange-600' },
  { icon: Home, labelKey: 'serviceHouseManager', accent: 'bg-teal-50 text-teal-600' },
  { icon: Sprout, labelKey: 'serviceGardener', accent: 'bg-green-50 text-green-600' },
  { icon: ShieldCheck, labelKey: 'serviceSecurity', accent: 'bg-indigo-50 text-indigo-600' },
  { icon: GraduationCap, labelKey: 'servicePrivateTutor', accent: 'bg-violet-50 text-violet-600' }
];

function LoginMarketing() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col px-8 sm:px-10 py-6">
      {/* Brand */}
      <div className="mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-1.5">
          <span className="text-red-600">Homely</span><span className="text-emerald-600">Serv</span>
        </h1>
        <p className="text-lg sm:text-xl font-bold text-teal-700 mb-2">
          {t('brandMessage')}
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          {t('marketingDescription')}
        </p>
      </div>

      {/* Services */}
      <div className="mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {t('ourServices')}
        </h2>
        <div className="grid grid-cols-3 gap-1.5">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1 p-1.5 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`p-1.5 rounded-lg ${service.accent}`}>
                <service.icon size={18} strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {t(service.labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="space-y-2 mb-4">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3.5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-teal-100 rounded-lg">
              <UserCheck size={18} className="text-teal-700" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-teal-900 mb-0.5">
                {t('forEmployers')}
              </h3>
              <p className="text-xs text-teal-700 leading-relaxed">
                {t('employerMessage')}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <UserPlus size={18} className="text-red-700" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-0.5">
                {t('forWorkers')}
              </h3>
              <p className="text-xs text-red-700 leading-relaxed">
                {t('workerMessage')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-1">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-7 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold shadow-md hover:shadow-lg text-sm"
        >
          {t('createAccount')}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default LoginMarketing;
