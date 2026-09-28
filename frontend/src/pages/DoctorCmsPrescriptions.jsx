// frontend/src/pages/DoctorCmsPrescriptions.jsx
// ============================================================
// CLINIC MANAGEMENT SYSTEM — PRESCRIPTIONS
// Prescriptions belong to a signed consultation (existing Phase 9
// module). This CMS entry point reuses the existing patient list and
// routes the doctor into the existing patient → consultation →
// prescription workspace. No second prescription system.
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import CmsPatientWorkflow from '../components/doctor/cms/CmsPatientWorkflow';
import { Pill } from 'lucide-react';

const DoctorCmsPrescriptions = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorCms.prescriptionsTitle') || 'Prescriptions'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <RolePageHeader
          icon={Pill}
          title={t('doctorCms.prescriptionsTitle') || 'Prescriptions'}
          subtitle={t('doctorCms.prescriptionsSubtitle') || 'Prescriptions belong to a signed consultation. Choose a patient to continue.'}
        />

        <CmsPatientWorkflow
          buildDestination={(patientId) => `/doctor-cms/patients/${patientId}/consultations`}
        />
      </div>
    </DashboardLayout>
  );
};

export default DoctorCmsPrescriptions;
