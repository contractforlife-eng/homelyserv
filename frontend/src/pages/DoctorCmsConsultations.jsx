// frontend/src/pages/DoctorCmsConsultations.jsx
// ============================================================
// CLINIC MANAGEMENT SYSTEM — CONSULTATIONS
// Consultations belong to a patient file (existing Phase 8 module).
// This CMS entry point therefore reuses the existing patient list
// and routes the doctor into the existing patient-scoped
// consultations workspace. No second consultation model.
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import CmsPatientWorkflow from '../components/doctor/cms/CmsPatientWorkflow';
import { FileText } from 'lucide-react';

const DoctorCmsConsultations = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorCms.consultationsTitle') || 'Consultations'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <RolePageHeader
          icon={FileText}
          title={t('doctorCms.consultationsTitle') || 'Consultations'}
          subtitle={t('doctorCms.consultationsSubtitle') || 'Consultations live inside the patient file. Choose a patient to open their clinical consultations.'}
        />

        <CmsPatientWorkflow
          buildDestination={(patientId) => `/doctor-cms/patients/${patientId}/consultations`}
        />
      </div>
    </DashboardLayout>
  );
};

export default DoctorCmsConsultations;
