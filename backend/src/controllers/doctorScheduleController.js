// backend/src/controllers/doctorScheduleController.js
import mongoose from 'mongoose';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorClinic from '../models/DoctorClinic.js';
import { DOCTOR_CONSULTATION_TYPES } from '../models/DoctorConsultationService.js';

// Helper to check for valid 24-character hexadecimal MongoDB ObjectId
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

// HH:mm 24-hour time format regex
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Convert 'HH:mm' string to total minutes from midnight
const timeToMinutes = (timeStr) => {
  if (typeof timeStr !== 'string') return -1;
  const match = timeStr.match(TIME_REGEX);
  if (!match) return -1;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
};

/**
 * Check if two time intervals [startA, endA) and [startB, endB) overlap.
 * Intervals are considered overlapping if max(startA, startB) < min(endA, endB).
 */
const isTimeOverlapping = (startA, endA, startB, endB) => {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return Math.max(sA, sB) < Math.min(eA, eB);
};

/**
 * GET /api/doctors/schedule
 * List availability slots for the authenticated doctor.
 * Supports query params: ?dayOfWeek=0..6 & ?includeInactive=true
 */
export const getDoctorSchedules = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { dayOfWeek, includeInactive } = req.query || {};

    const filter = { doctorId };

    if (includeInactive !== 'true') {
      filter.isActive = true;
    }

    if (dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek !== '') {
      const parsedDay = parseInt(dayOfWeek, 10);
      if (!Number.isNaN(parsedDay) && parsedDay >= 0 && parsedDay <= 6) {
        filter.dayOfWeek = parsedDay;
      }
    }

    const schedules = await DoctorSchedule.find(filter)
      .populate('clinicId', 'clinicName city addressLine isPrimary isActive')
      .sort({ dayOfWeek: 1, startTime: 1, createdAt: 1 });

    return res.json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching doctor schedules:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching schedules',
      error: error.message
    });
  }
};

/**
 * POST /api/doctors/schedule
 * Create a new availability slot for the authenticated doctor.
 */
export const createDoctorSchedule = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    // Validate dayOfWeek (0 = Sunday ... 6 = Saturday)
    if (body.dayOfWeek === undefined || body.dayOfWeek === null || body.dayOfWeek === '') {
      return res.status(400).json({
        success: false,
        message: 'Day of week is required'
      });
    }
    const dayOfWeek = Number(body.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        message: 'Day of week must be an integer between 0 (Sunday) and 6 (Saturday)'
      });
    }

    // Validate startTime & endTime
    const startTime = typeof body.startTime === 'string' ? body.startTime.trim() : '';
    const endTime = typeof body.endTime === 'string' ? body.endTime.trim() : '';

    if (!startTime || !TIME_REGEX.test(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time is required and must be in HH:mm 24-hour format'
      });
    }

    if (!endTime || !TIME_REGEX.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'End time is required and must be in HH:mm 24-hour format'
      });
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Validate consultationType
    const consultationType = typeof body.consultationType === 'string'
      ? body.consultationType.trim().toUpperCase()
      : 'CLINIC';

    if (!DOCTOR_CONSULTATION_TYPES.includes(consultationType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid consultation type. Must be one of: ${DOCTOR_CONSULTATION_TYPES.join(', ')}`
      });
    }

    // Validate clinicId ownership if provided or required for CLINIC type
    let clinicId = null;
    if (body.clinicId !== undefined && body.clinicId !== null && body.clinicId !== '') {
      const clinicIdStr = String(body.clinicId);
      if (!isValidObjectId(clinicIdStr)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid clinic ID format'
        });
      }

      // Verify clinic exists and belongs to the authenticated doctor
      const clinic = await DoctorClinic.findOne({ _id: clinicIdStr, doctorId });
      if (!clinic) {
        return res.status(404).json({
          success: false,
          message: 'Clinic not found or not authorized'
        });
      }
      clinicId = clinic._id;
    }

    // Validate slotDurationMinutes if provided
    let slotDurationMinutes = 30;
    if (body.slotDurationMinutes !== undefined && body.slotDurationMinutes !== null && body.slotDurationMinutes !== '') {
      const duration = Number(body.slotDurationMinutes);
      if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
        return res.status(400).json({
          success: false,
          message: 'Slot duration must be between 5 and 240 minutes'
        });
      }
      slotDurationMinutes = duration;
    }

    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    // Overlap protection:
    // Prevent overlapping active slots for the same Doctor on the same day.
    // Query active slots for this doctor on the same day.
    const existingDaySlots = await DoctorSchedule.find({
      doctorId,
      dayOfWeek,
      isActive: true
    });

    for (const slot of existingDaySlots) {
      if (isTimeOverlapping(startTime, endTime, slot.startTime, slot.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Availability slot overlaps with an existing slot (${slot.startTime} - ${slot.endTime}) on this day`
        });
      }
    }

    // Create the schedule slot
    const schedule = await DoctorSchedule.create({
      doctorId,
      clinicId,
      serviceId: null,
      consultationType,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes,
      isActive
    });

    // Populate clinic details if attached
    if (clinicId) {
      await schedule.populate('clinicId', 'clinicName city addressLine isPrimary isActive');
    }

    return res.status(201).json({
      success: true,
      message: 'Availability slot created successfully',
      schedule
    });
  } catch (error) {
    console.error('Error creating doctor schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating schedule',
      error: error.message
    });
  }
};

/**
 * PUT /api/doctors/schedule/:id
 * Update an existing availability slot owned by the authenticated doctor.
 */
export const updateDoctorSchedule = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule ID format'
      });
    }

    // Verify ownership and existence
    const existingSchedule = await DoctorSchedule.findOne({ _id: id, doctorId });
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule slot not found or not authorized'
      });
    }

    const body = req.body || {};
    const updates = {};

    // Validate dayOfWeek if provided
    let targetDayOfWeek = existingSchedule.dayOfWeek;
    if (Object.prototype.hasOwnProperty.call(body, 'dayOfWeek')) {
      const day = Number(body.dayOfWeek);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        return res.status(400).json({
          success: false,
          message: 'Day of week must be an integer between 0 (Sunday) and 6 (Saturday)'
        });
      }
      targetDayOfWeek = day;
      updates.dayOfWeek = day;
    }

    // Validate startTime if provided
    let targetStartTime = existingSchedule.startTime;
    if (Object.prototype.hasOwnProperty.call(body, 'startTime')) {
      const st = typeof body.startTime === 'string' ? body.startTime.trim() : '';
      if (!st || !TIME_REGEX.test(st)) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be in HH:mm 24-hour format'
        });
      }
      targetStartTime = st;
      updates.startTime = st;
    }

    // Validate endTime if provided
    let targetEndTime = existingSchedule.endTime;
    if (Object.prototype.hasOwnProperty.call(body, 'endTime')) {
      const et = typeof body.endTime === 'string' ? body.endTime.trim() : '';
      if (!et || !TIME_REGEX.test(et)) {
        return res.status(400).json({
          success: false,
          message: 'End time must be in HH:mm 24-hour format'
        });
      }
      targetEndTime = et;
      updates.endTime = et;
    }

    // Verify start < end
    const startMinutes = timeToMinutes(targetStartTime);
    const endMinutes = timeToMinutes(targetEndTime);
    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Validate consultationType if provided
    if (Object.prototype.hasOwnProperty.call(body, 'consultationType')) {
      const ct = typeof body.consultationType === 'string'
        ? body.consultationType.trim().toUpperCase()
        : '';
      if (!DOCTOR_CONSULTATION_TYPES.includes(ct)) {
        return res.status(400).json({
          success: false,
          message: `Invalid consultation type. Must be one of: ${DOCTOR_CONSULTATION_TYPES.join(', ')}`
        });
      }
      updates.consultationType = ct;
    }

    // Validate clinicId ownership if provided
    if (Object.prototype.hasOwnProperty.call(body, 'clinicId')) {
      if (body.clinicId === null || body.clinicId === '') {
        updates.clinicId = null;
      } else {
        const clinicIdStr = String(body.clinicId);
        if (!isValidObjectId(clinicIdStr)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid clinic ID format'
          });
        }

        const clinic = await DoctorClinic.findOne({ _id: clinicIdStr, doctorId });
        if (!clinic) {
          return res.status(404).json({
            success: false,
            message: 'Clinic not found or not authorized'
          });
        }
        updates.clinicId = clinic._id;
      }
    }

    // Validate slotDurationMinutes if provided
    if (Object.prototype.hasOwnProperty.call(body, 'slotDurationMinutes')) {
      const dur = Number(body.slotDurationMinutes);
      if (!Number.isInteger(dur) || dur < 5 || dur > 240) {
        return res.status(400).json({
          success: false,
          message: 'Slot duration must be between 5 and 240 minutes'
        });
      }
      updates.slotDurationMinutes = dur;
    }

    // Validate isActive if provided
    let willBeActive = existingSchedule.isActive;
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      willBeActive = Boolean(body.isActive);
      updates.isActive = willBeActive;
    }

    // Overlap protection if updating slot remains active
    if (willBeActive) {
      const otherDaySlots = await DoctorSchedule.find({
        doctorId,
        dayOfWeek: targetDayOfWeek,
        isActive: true,
        _id: { $ne: id }
      });

      for (const slot of otherDaySlots) {
        if (isTimeOverlapping(targetStartTime, targetEndTime, slot.startTime, slot.endTime)) {
          return res.status(400).json({
            success: false,
            message: `Availability slot overlaps with an existing slot (${slot.startTime} - ${slot.endTime}) on this day`
          });
        }
      }
    }

    const updatedSchedule = await DoctorSchedule.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('clinicId', 'clinicName city addressLine isPrimary isActive');

    return res.json({
      success: true,
      message: 'Availability slot updated successfully',
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error('Error updating doctor schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating schedule',
      error: error.message
    });
  }
};

/**
 * DELETE /api/doctors/schedule/:id
 * Delete an availability slot owned by the authenticated doctor.
 */
export const deleteDoctorSchedule = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule ID format'
      });
    }

    // Verify ownership and existence
    const existingSchedule = await DoctorSchedule.findOne({ _id: id, doctorId });
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule slot not found or not authorized'
      });
    }

    await DoctorSchedule.deleteOne({ _id: id, doctorId });

    return res.json({
      success: true,
      message: 'Availability slot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting doctor schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting schedule',
      error: error.message
    });
  }
};
