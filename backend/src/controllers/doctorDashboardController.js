// backend/src/controllers/doctorDashboardController.js
// ============================================================
// DOCTOR DASHBOARD SUMMARY
// Real backend data only — no invented statistics. Counts are
// computed from the doctor's own appointments, patients,
// consultations, prescriptions, services, and unread chat.
// ============================================================
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorConsultationRecord from '../models/DoctorConsultationRecord.js';
import Prescription from '../models/Prescription.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import DoctorClinic from '../models/DoctorClinic.js';
import Message from '../models/Message.js';

const idStr = (v) => String(v || '');

export const getDoctorDashboardSummary = async (req, res) => {
  try {
    const doctorId = req.userId;

    const [
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      totalPatients,
      signedConsultations,
      draftConsultations,
      issuedPrescriptions,
      activeServices,
      clinics,
      lastAppointment,
      unreadMessages
    ] = await Promise.all([
      DoctorAppointment.countDocuments({ doctorId, status: 'PENDING' }),
      DoctorAppointment.countDocuments({ doctorId, status: 'CONFIRMED' }),
      DoctorAppointment.countDocuments({ doctorId, status: 'COMPLETED' }),
      DoctorAppointment.distinct('patientId', {
        doctorId,
        status: { $in: ['CONFIRMED', 'COMPLETED'] }
      }),
      DoctorConsultationRecord.countDocuments({ doctorId, status: 'SIGNED' }),
      DoctorConsultationRecord.countDocuments({ doctorId, status: 'DRAFT' }),
      Prescription.countDocuments({ doctorId, status: 'ISSUED' }),
      DoctorConsultationService.countDocuments({ doctorId, isActive: true }),
      DoctorClinic.countDocuments({ doctorId, isActive: true }),
      DoctorAppointment.findOne({ doctorId }).sort({ startsAt: -1 }).select('startsAt status'),
      Message.countDocuments({ recipientId: idStr(doctorId), isRead: false })
    ]);

    return res.json({
      success: true,
      summary: {
        appointments: {
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments
        },
        patients: totalPatients.length,
        consultations: {
          signed: signedConsultations,
          drafts: draftConsultations
        },
        prescriptionsIssued: issuedPrescriptions,
        activeServices,
        activeClinics: clinics,
        latestAppointment: lastAppointment
          ? { startsAt: lastAppointment.startsAt, status: lastAppointment.status }
          : null,
        unreadMessages
      }
    });
  } catch (error) {
    console.error('Error building doctor dashboard summary:', error);
    return res.status(500).json({ success: false, message: 'Server error building dashboard summary' });
  }
};
