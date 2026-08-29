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
    <div className="flex flex-col px-8 sm:px-10 py-6 lg:py-4 2xl:max-w-3xl 2xl:mx-auto 2xl:px-14 2xl:py-10">
      {/* Brand */}
      <div className="mb-4 2xl:mb-6">
        <h1 className="text-3xl sm:text-4xl 2xl:text-5xl font-bold mb-1.5 2xl:mb-2">
          <span className="text-red-600">Homely</span><span className="text-emerald-600">Serv</span>
        </h1>
        <p className="text-lg sm:text-xl 2xl:text-2xl font-bold text-teal-700 mb-2 2xl:mb-3">
          {t('brandMessage')}
        </p>
        <p className="text-sm 2xl:text-base text-gray-600 leading-relaxed">
          {t('marketingDescription')}
        </p>
      </div>

      {/* Services */}
      <div className="mb-3 2xl:mb-5">
        <h2 className="text-xs 2xl:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1.5 2xl:mb-2.5">
          {t('ourServices')}
        </h2>
        <div className="grid grid-cols-3 gap-1.5 2xl:gap-2.5">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1 2xl:gap-1.5 p-1.5 2xl:p-2.5 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`p-1.5 2xl:p-2 rounded-lg ${service.accent}`}>
                <service.icon size={18} strokeWidth={2} className="2xl:w-5 2xl:h-5" />
              </div>
              <span className="text-xs 2xl:text-sm font-medium text-gray-700 text-center leading-tight">
                {t(service.labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="space-y-2 2xl:space-y-3 mb-4 2xl:mb-6">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3.5 2xl:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-2.5 2xl:gap-3.5">
            <div className="p-1.5 2xl:p-2 bg-teal-100 rounded-lg">
              <UserCheck size={18} className="text-teal-700 2xl:w-6 2xl:h-6" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm 2xl:text-base font-semibold text-teal-900 mb-0.5 2xl:mb-1">
                {t('forEmployers')}
              </h3>
              <p className="text-xs 2xl:text-sm text-teal-700 leading-relaxed">
                {t('employerMessage')}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 2xl:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-2.5 2xl:gap-3.5">
            <div className="p-1.5 2xl:p-2 bg-red-100 rounded-lg">
              <UserPlus size={18} className="text-red-700 2xl:w-6 2xl:h-6" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm 2xl:text-base font-semibold text-red-900 mb-0.5 2xl:mb-1">
                {t('forWorkers')}
              </h3>
              <p className="text-xs 2xl:text-sm text-red-700 leading-relaxed">
                {t('workerMessage')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto mb-4 pt-1 2xl:mb-5 2xl:pt-2">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 2xl:gap-2.5 px-7 2xl:px-8 py-2.5 2xl:py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold shadow-md hover:shadow-lg text-sm 2xl:text-base"
        >
          {t('createAccount')}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default LoginMarketing;
