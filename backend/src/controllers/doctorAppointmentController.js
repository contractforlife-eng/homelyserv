// backend/src/controllers/doctorAppointmentController.js
import mongoose from 'mongoose';
import DoctorAppointment, { APPOINTMENT_STATUSES } from '../models/DoctorAppointment.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorConsultationService, { DOCTOR_CONSULTATION_TYPES } from '../models/DoctorConsultationService.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import ClinicPatient from '../models/ClinicPatient.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';

// Helper to check for valid 24-character hexadecimal MongoDB ObjectId
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Check if two date ranges [startA, endA) and [startB, endB) overlap.
 */
const isDateRangeOverlapping = (startA, endA, startB, endB) => {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();
  return Math.max(sA, sB) < Math.min(eA, eB);
};

/**
 * GET /api/doctors/appointments
 * List appointments for the authenticated Doctor.
 * Query params:
 *   tab: 'upcoming' | 'home_visits' | 'history'
 *   status: optional filter
 *   startDate / endDate: optional date range
 */
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { tab, status, consultationType } = req.query || {};

    const filter = { doctorId };
    const now = new Date();

    if (tab === 'home_visits') {
      filter.consultationType = 'HOME_VISIT';
      if (status) {
        filter.status = status;
      }
    } else if (tab === 'upcoming') {
      filter.status = { $in: ['PENDING', 'CONFIRMED'] };
      filter.startsAt = { $gte: now };
    } else if (tab === 'history') {
      filter.$or = [
        { status: { $in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
        { endsAt: { $lt: now } }
      ];
    } else if (status) {
      if (APPOINTMENT_STATUSES.includes(status)) {
        filter.status = status;
      }
    }

    if (consultationType && DOCTOR_CONSULTATION_TYPES.includes(consultationType)) {
      filter.consultationType = consultationType;
    }

    const appointments = await DoctorAppointment.find(filter)
      .populate('patientId', 'fullName email phone profileImage')
      .populate('clinicPatientId', 'fullName phone email')
      .populate('clinicId', 'clinicName addressLine city isPrimary')
      .populate('serviceId', 'serviceName price durationMinutes')
      .populate('scheduleId', 'dayOfWeek startTime endTime')
      .sort({ startsAt: tab === 'history' ? -1 : 1 });

    return res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching appointments',
      error: error.message
    });
  }
};

/**
 * GET /api/doctors/appointments/:id
 * Get details for a specific appointment owned by the doctor.
 */
export const getDoctorAppointmentById = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    const appointment = await DoctorAppointment.findOne({ _id: id, doctorId })
      .populate('patientId', 'fullName email phone profileImage countryName city')
      .populate('clinicPatientId', 'fullName phone email')
      .populate('clinicId', 'clinicName addressLine city phone email isPrimary instructions')
      .populate('serviceId', 'serviceName price durationMinutes description')
      .populate('scheduleId', 'dayOfWeek startTime endTime slotDurationMinutes');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not authorized'
      });
    }

    return res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching appointment',
      error: error.message
    });
  }
};

/**
 * POST /api/doctors/appointments
 * Create a new appointment for the Doctor.
 */
export const createDoctorAppointment = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    const {
      patientId,
      clinicPatientId,
      scheduleId,
      clinicId,
      serviceId,
      consultationType,
      startsAt,
      endsAt,
      reason,
      notes
    } = body;

    // ---- Patient source: exactly one of patientId / clinicPatientId ----
    // The HomelyServ branch below is UNCHANGED. The clinic branch is
    // purely additive.
    const hasUser = patientId !== undefined && patientId !== null && patientId !== '';
    const hasClinic = clinicPatientId !== undefined && clinicPatientId !== null && clinicPatientId !== '';

    if (hasUser && hasClinic) {
      return res.status(400).json({
        success: false,
        message: 'Provide either patientId or clinicPatientId, not both'
      });
    }
    if (!hasUser && !hasClinic) {
      return res.status(400).json({
        success: false,
        message: 'A patient is required: provide either patientId (HomelyServ patient) or clinicPatientId (clinic patient)'
      });
    }

    let resolvedPatientId = null;
    let resolvedClinicPatientId = null;

    if (hasUser) {
      // Validate patient existence
      if (!patientId || !isValidObjectId(String(patientId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid patient ID is required'
        });
      }

      const patient = await User.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient user not found'
        });
      }

      resolvedPatientId = patientId;
    } else {
      if (!isValidObjectId(String(clinicPatientId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid clinic patient ID is required'
        });
      }
      // Ownership is verified against the DOCTOR only. `linkedUserId` on the
      // ClinicPatient is deliberately ignored — it must never grant access.
      const clinicPatient = await ClinicPatient.findOne({ _id: clinicPatientId, doctorId });
      if (!clinicPatient) {
        return res.status(404).json({
          success: false,
          message: 'Clinic patient not found or not authorized'
        });
      }
      resolvedClinicPatientId = clinicPatientId;
    }

    // Validate consultationType
    const cType = typeof consultationType === 'string' ? consultationType.trim().toUpperCase() : 'CLINIC';
    if (!DOCTOR_CONSULTATION_TYPES.includes(cType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid consultation type. Must be one of: ${DOCTOR_CONSULTATION_TYPES.join(', ')}`
      });
    }

    // Validate dates
    if (!startsAt || !endsAt) {
      return res.status(400).json({
        success: false,
        message: 'Appointment start time (startsAt) and end time (endsAt) are required'
      });
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment start or end date format'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Appointment end time must be after start time'
      });
    }

    // Clinic ownership validation if provided
    let validClinicId = null;
    if (clinicId) {
      if (!isValidObjectId(String(clinicId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid clinic ID format'
        });
      }
      const clinic = await DoctorClinic.findOne({ _id: clinicId, doctorId });
      if (!clinic) {
        return res.status(404).json({
          success: false,
          message: 'Clinic not found or not owned by doctor'
        });
      }
      validClinicId = clinic._id;
    }

    // Schedule ownership validation if provided
    let validScheduleId = null;
    if (scheduleId) {
      if (!isValidObjectId(String(scheduleId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid schedule ID format'
        });
      }
      const schedule = await DoctorSchedule.findOne({ _id: scheduleId, doctorId });
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule slot not found or not owned by doctor'
        });
      }
      validScheduleId = schedule._id;
    }

    // Service ownership validation if provided
    let validServiceId = null;
    let feeSnapshot = 0;
    let currency = 'EGP';

    if (serviceId) {
      if (!isValidObjectId(String(serviceId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid service ID format'
        });
      }
      const service = await DoctorConsultationService.findOne({ _id: serviceId, doctorId });
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Consultation service not found or not owned by doctor'
        });
      }
      validServiceId = service._id;
      feeSnapshot = service.price || 0;
      currency = service.currency || 'EGP';
    } else {
      // Fallback to Doctor Profile consultation fee if set
      const profile = await DoctorProfile.findOne({ userId: doctorId });
      if (profile && profile.consultationFee) {
        feeSnapshot = profile.consultationFee;
      }
    }

    // Overlap protection:
    // Check if the doctor already has a non-cancelled appointment overlapping with [startDate, endDate)
    const activeDoctorAppointments = await DoctorAppointment.find({
      doctorId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      startsAt: { $lt: endDate },
      endsAt: { $gt: startDate }
    });

    if (activeDoctorAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This appointment overlaps with an existing appointment for this doctor'
      });
    }

    const appointment = await DoctorAppointment.create({
      doctorId,
      // Exactly one of these is set (enforced above and by the model).
      patientId: resolvedPatientId,
      clinicPatientId: resolvedClinicPatientId,
      scheduleId: validScheduleId,
      clinicId: validClinicId,
      serviceId: validServiceId,
      consultationType: cType,
      startsAt: startDate,
      endsAt: endDate,
      status: body.status && APPOINTMENT_STATUSES.includes(body.status) ? body.status : 'PENDING',
      reason: typeof reason === 'string' ? reason.trim().substring(0, 500) : '',
      notes: typeof notes === 'string' ? notes.trim().substring(0, 2000) : '',
      feeSnapshot,
      currency,
      createdBy: doctorId
    });

    await appointment.populate('patientId', 'fullName email phone profileImage');
    if (resolvedClinicPatientId) {
      await appointment.populate('clinicPatientId', 'fullName phone email');
    }
    if (validClinicId) await appointment.populate('clinicId', 'clinicName addressLine city isPrimary');
    if (validServiceId) await appointment.populate('serviceId', 'serviceName price durationMinutes');

    // Doctor notification: a patient booking request exists (real event).
    // Patient-identifying medical details are never included in previews.
    createNotification(doctorId, {
      type: NOTIFICATION_TYPES.APPOINTMENT_REQUESTED,
      title: 'New appointment request',
      message: `A new ${cType === 'HOME_VISIT' ? 'home visit' : cType.toLowerCase()} appointment was requested for ${startDate.toLocaleString()}.`,
      entityType: 'DOCTOR_APPOINTMENT',
      entityId: String(appointment._id),
      link: '/doctor-appointments',
      data: { appointmentId: String(appointment._id), consultationType: cType }
    }).catch((error) => console.error('Appointment request notification failed:', error.message));

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Error creating doctor appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating appointment',
      error: error.message
    });
  }
};

/**
 * PUT /api/doctors/appointments/:id/status
 * Update appointment status (confirm, complete, cancel, mark no-show).
 * State transitions:
 *   PENDING -> CONFIRMED, CANCELLED
 *   CONFIRMED -> COMPLETED, NO_SHOW, CANCELLED
 *   Terminal (COMPLETED, CANCELLED, NO_SHOW) cannot be transitioned.
 */
export const updateDoctorAppointmentStatus = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const { status, cancellationReason } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    if (!status || !APPOINTMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${APPOINTMENT_STATUSES.join(', ')}`
      });
    }

    const appointment = await DoctorAppointment.findOne({ _id: id, doctorId });
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not authorized'
      });
    }

    // Terminal state protection
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status of an appointment in terminal state: ${appointment.status}`
      });
    }

    // Transition rules:
    // PENDING can only become CONFIRMED or CANCELLED
    if (appointment.status === 'PENDING' && !['CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Pending appointment can only be confirmed or cancelled, not ${status}`
      });
    }

    appointment.status = status;

    if (status === 'CANCELLED') {
      appointment.cancellationReason = typeof cancellationReason === 'string'
        ? cancellationReason.trim().substring(0, 500)
        : '';
      appointment.cancelledBy = doctorId;
      appointment.cancelledAt = new Date();
    }

    await appointment.save();

    await appointment.populate('patientId', 'fullName email phone profileImage');
    await appointment.populate('clinicId', 'clinicName addressLine city isPrimary');

    // Patient notification: real appointment status change initiated by the doctor.
    const statusNotifications = {
      CONFIRMED: {
        type: NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED,
        title: 'Appointment confirmed',
        message: `Your appointment on ${appointment.startsAt?.toLocaleString?.() || 'the scheduled date'} was confirmed.`
      },
      CANCELLED: {
        type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
        title: 'Appointment cancelled',
        message: `Your appointment on ${appointment.startsAt?.toLocaleString?.() || 'the scheduled date'} was cancelled.`
      },
      COMPLETED: {
        type: NOTIFICATION_TYPES.APPOINTMENT_COMPLETED,
        title: 'Appointment completed',
        message: 'Your appointment was marked as completed. The clinical record will be prepared by your doctor.'
      },
      NO_SHOW: {
        type: NOTIFICATION_TYPES.APPOINTMENT_UPDATED,
        title: 'Appointment updated',
        message: `Your appointment on ${appointment.startsAt?.toLocaleString?.() || 'the scheduled date'} was marked as missed.`
      }
    };
    const statusNotification = statusNotifications[status];
    if (statusNotification && appointment.patientId?._id) {
      createNotification(String(appointment.patientId._id), {
        ...statusNotification,
        entityType: 'DOCTOR_APPOINTMENT',
        entityId: String(appointment._id),
        link: '/medical-profile',
        data: { appointmentId: String(appointment._id), status }
      }).catch((error) => console.error('Appointment status notification failed:', error.message));
    }

    return res.json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating appointment status',
      error: error.message
    });
  }
};
