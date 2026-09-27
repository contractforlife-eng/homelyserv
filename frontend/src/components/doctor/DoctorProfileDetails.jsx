// frontend/src/components/doctor/DoctorProfileDetails.jsx
// ============================================================
// DOCTOR PROFILE DETAILS — STAFF READ VIEW
// ============================================================
// Renders the REAL Doctor professional profile for Admin (Co-Admin),
// Sup-Admin (SUPPORT) and Sup-Help (SUPPORT_HELPER).
//
// A Doctor is NEVER rendered through a WorkerProfile substitute: this card is
// the Doctor's own professional record — identity-independent of the Worker
// "desired job type" taxonomy that a Doctor does not belong to.
//
// All visible text goes through i18next; Arabic keeps the app-wide RTL layout.
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Building2, MapPin, Phone, Mail, Award, Globe } from 'lucide-react';
import { getDoctorSpecialtyLabel } from '../../constants/doctorSpecialties';

const DoctorEntryList = ({ label, entries, emptyText, icon: Icon }) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return (
    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
        {Icon ? <Icon size={12} /> : null}
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {entries.map((entry, index) => (
          <li
            key={`${entry}-${index}`}
            className="text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1"
          >
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
};

const DoctorField = ({ label, value }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 break-words">{value}</p>
  </div>
);

const DoctorProfileDetails = ({ profile, clinics = [] }) => {
  const { t } = useTranslation();
  const tr = (key, fallback) => t(`userProfileView.${key}`, fallback);

  const notProvided = tr('notProvided', 'Not provided');

  if (!profile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Stethoscope size={18} className="text-red-600" />
            {tr('doctorProfile', 'Doctor Professional Profile')}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tr('doctorProfileNotCreated', 'This Doctor has not created a professional profile yet.')}
          </p>
        </div>
      </div>
    );
  }

  const additionalSpecialties = Array.isArray(profile.additionalSpecialties)
    ? profile.additionalSpecialties
    : [];
  const years = Number(profile.yearsOfExperience) || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Stethoscope size={18} className="text-red-600" />
          {tr('doctorProfile', 'Doctor Professional Profile')}
        </h3>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <DoctorField
          label={tr('professionalTitle', 'Professional Title')}
          value={profile.professionalTitle || notProvided}
        />
        <DoctorField
          label={tr('specialty', 'Medical Specialty')}
          value={getDoctorSpecialtyLabel(profile.specialty, profile.specialtyCustom, t) || notProvided}
        />
        <DoctorField
          label={tr('yearsOfExperience', 'Years of Experience')}
          value={`${years} ${tr('years', 'years')}`}
        />
        <DoctorField
          label={tr('licenseNumber', 'Medical License Number')}
          value={profile.licenseNumber || notProvided}
        />
        <DoctorField
          label={tr('licenseAuthority', 'Licensing Authority / Medical Syndicate')}
          value={profile.licenseAuthority || notProvided}
        />
        <DoctorField
          label={tr('profileComplete', 'Profile Complete')}
          value={profile.isProfileComplete ? tr('complete', 'Complete') : tr('incomplete', 'Incomplete')}
        />
      </div>

      {profile.subspecialty ? (
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{tr('subspecialty', 'Subspecialty')}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{profile.subspecialty}</p>
        </div>
      ) : null}

      {profile.experienceSummary ? (
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{tr('experienceSummary', 'Experience Summary')}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{profile.experienceSummary}</p>
        </div>
      ) : null}

      {profile.bio ? (
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{tr('bio', 'Professional Bio')}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{profile.bio}</p>
        </div>
      ) : null}

      <DoctorEntryList
        label={tr('additionalSpecialties', 'Additional Specialties')}
        entries={additionalSpecialties.map((value) => getDoctorSpecialtyLabel(value, null, t)).filter(Boolean)}
        icon={Stethoscope}
      />
      <DoctorEntryList
        label={tr('qualifications', 'Qualifications')}
        entries={profile.qualifications}
        icon={Award}
      />
      <DoctorEntryList
        label={tr('education', 'Education')}
        entries={profile.education}
        icon={Award}
      />
      <DoctorEntryList
        label={tr('certifications', 'Certifications & Licenses')}
        entries={profile.certifications}
        icon={Award}
      />
      <DoctorEntryList
        label={tr('doctorLanguages', 'Languages')}
        entries={profile.languages}
        icon={Globe}
      />

      {/* DOCTOR CLINICS */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
          <Building2 size={12} />
          {tr('doctorClinics', 'Clinics')}
        </p>

        {!Array.isArray(clinics) || clinics.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tr('noClinics', 'No clinics listed.')}
          </p>
        ) : (
          <ul className="space-y-3">
            {clinics.map((clinic) => (
              <li
                key={clinic.id}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {clinic.clinicName}
                  </span>
                  {clinic.isPrimary ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-full px-2 py-0.5">
                      {tr('primaryClinic', 'Primary')}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-start gap-1.5">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>
                    {[clinic.addressLine, clinic.city, clinic.stateOrProvince, clinic.countryCode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </p>
                {clinic.phone ? (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                    <Phone size={12} />
                    <span>{clinic.phone}</span>
                  </p>
                ) : null}
                {clinic.email ? (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                    <Mail size={12} />
                    <span>{clinic.email}</span>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DoctorProfileDetails;
