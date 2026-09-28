// backend/src/controllers/doctorAnalyticsController.js
// ============================================================
// DOCTOR PREMIUM ANALYTICS / PROFILE PERFORMANCE
// Premium-only (Doctor Premium). Every metric below is derived
// from the doctor's own real backend records — there are no
// profile-view or search counters anywhere in the platform, so
// none are reported (no fake numbers).
//
// Metrics and their exact real-world meaning:
//   APPOINTMENTS_REQUESTED  - appointments ever created for this
//                             doctor (any status): booking requests
//   APPOINTMENTS_CONFIRMED  - appointments currently CONFIRMED
//   APPOINTMENTS_COMPLETED  - appointments marked COMPLETED
//   PATIENTS_SERVED         - distinct patients with at least one
//                             COMPLETED appointment
//   CONSULTATIONS_SIGNED    - signed clinical consultation records
//   PRESCRIPTIONS_ISSUED    - issued prescriptions
//   SERVICES_ACTIVE         - active bookable services
//   DAILY_ACTIVITY          - per-day real appointment counts
//                             (confirmed = startsAt of CONFIRMED+,
//                              completed = COMPLETED by that day)
// ============================================================
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorConsultationRecord from '../models/DoctorConsultationRecord.js';
import Prescription from '../models/Prescription.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import { isUserPremium } from '../services/premiumService.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const ANALYTICS_WINDOW_DAYS = 30;

const dayKeyOf = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getDoctorAnalytics = async (req, res) => {
  try {
    const doctorId = req.userId;

    // Premium gate — Doctor Premium uses the same entitlement mechanism
    // (paid Subscription rows / ManualPremiumGrant) as the rest of the app.
    const premium = await isUserPremium(doctorId);
    if (!premium) {
      return res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        message: 'Doctor Premium is required to access profile performance analytics.'
      });
    }

    const since = new Date(Date.now() - (ANALYTICS_WINDOW_DAYS - 1) * DAY_MS);
    since.setHours(0, 0, 0, 0);

    const [
      appointmentsRequested,
      appointmentsConfirmed,
      appointmentsCompleted,
      patientsServedDistinct,
      consultationsSigned,
      prescriptionsIssued,
      servicesActive,
      recentAppointments
    ] = await Promise.all([
      DoctorAppointment.countDocuments({ doctorId }),
      DoctorAppointment.countDocuments({ doctorId, status: 'CONFIRMED' }),
      DoctorAppointment.countDocuments({ doctorId, status: 'COMPLETED' }),
      DoctorAppointment.distinct('patientId', { doctorId, status: 'COMPLETED' }),
      DoctorConsultationRecord.countDocuments({ doctorId, status: 'SIGNED' }),
      Prescription.countDocuments({ doctorId, status: 'ISSUED' }),
      DoctorConsultationService.countDocuments({ doctorId, isActive: true }),
      DoctorAppointment.find({
        doctorId,
        startsAt: { $gte: since },
        status: { $in: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] }
      })
        .select('startsAt status')
        .sort({ startsAt: 1 })
    ]);

    // Build the real per-day activity series (no synthesis of missing days).
    const daily = [];
    for (let i = 0; i < ANALYTICS_WINDOW_DAYS; i++) {
      daily.push({ day: dayKeyOf(new Date(since.getTime() + i * DAY_MS)), confirmed: 0, completed: 0 });
    }
    const byDay = new Map(daily.map((d) => [d.day, d]));
    for (const appt of recentAppointments) {
      const bucket = byDay.get(dayKeyOf(appt.startsAt));
      if (!bucket) continue;
      if (appt.status === 'COMPLETED') {
        bucket.completed += 1;
        bucket.confirmed += 1;
      } else if (appt.status === 'CONFIRMED') {
        bucket.confirmed += 1;
      }
    }

    return res.json({
      success: true,
      analytics: {
        windowDays: ANALYTICS_WINDOW_DAYS,
        metrics: {
          APPOINTMENTS_REQUESTED: appointmentsRequested,
          APPOINTMENTS_CONFIRMED: appointmentsConfirmed,
          APPOINTMENTS_COMPLETED: appointmentsCompleted,
          PATIENTS_SERVED: patientsServedDistinct.length,
          CONSULTATIONS_SIGNED: consultationsSigned,
          PRESCRIPTIONS_ISSUED: prescriptionsIssued,
          SERVICES_ACTIVE: servicesActive
        },
        metricDefinitions: {
          APPOINTMENTS_REQUESTED: 'Total appointment booking requests received (all statuses)',
          APPOINTMENTS_CONFIRMED: 'Appointments currently confirmed and upcoming',
          APPOINTMENTS_COMPLETED: 'Appointments marked completed',
          PATIENTS_SERVED: 'Distinct patients with at least one completed appointment',
          CONSULTATIONS_SIGNED: 'Signed clinical consultation records',
          PRESCRIPTIONS_ISSUED: 'Prescriptions issued to patients',
          SERVICES_ACTIVE: 'Currently active bookable services'
        },
        dailyActivity: daily,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error building doctor analytics:', error);
    return res.status(500).json({ success: false, message: 'Server error building analytics' });
  }
};
