// backend/src/controllers/clinicController.js
import mongoose from 'mongoose';
import DoctorClinic from '../models/DoctorClinic.js';

// Helper to check for valid 24-character hexadecimal MongoDB ObjectId
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

// Simple email regex aligned with project conventions
const isValidEmail = (email) => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * GET /api/doctors/clinics
 * Get all active clinics for the authenticated doctor.
 * Query param: ?includeInactive=true (optional, defaults to false)
 */
export const getClinics = async (req, res) => {
  try {
    const doctorId = req.userId;
    const includeInactive = req.query?.includeInactive === 'true';

    const filter = { doctorId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const clinics = await DoctorClinic.find(filter)
      .sort({ isPrimary: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: clinics.length,
      clinics
    });
  } catch (error) {
    console.error('Error fetching doctor clinics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching clinics',
      error: error.message
    });
  }
};

/**
 * POST /api/doctors/clinics
 * Create a new clinic for the authenticated doctor.
 */
export const createClinic = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    // Validate required fields: clinicName, addressLine, city, countryCode
    const clinicName = typeof body.clinicName === 'string' ? body.clinicName.trim() : '';
    const addressLine = typeof body.addressLine === 'string' ? body.addressLine.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const countryCode = typeof body.countryCode === 'string' ? body.countryCode.trim().toUpperCase() : '';

    if (!clinicName) {
      return res.status(400).json({
        success: false,
        message: 'Clinic name is required'
      });
    }
    if (clinicName.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Clinic name cannot exceed 150 characters'
      });
    }

    if (!addressLine) {
      return res.status(400).json({
        success: false,
        message: 'Address line is required'
      });
    }
    if (addressLine.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Address line cannot exceed 255 characters'
      });
    }

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City is required'
      });
    }
    if (city.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'City cannot exceed 100 characters'
      });
    }

    if (!countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Country code is required'
      });
    }
    if (countryCode.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Country code cannot exceed 10 characters'
      });
    }

    // Optional fields
    const phone = typeof body.phone === 'string' ? body.phone.trim().substring(0, 50) : '';
    let email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email) {
      if (email.length > 100 || !isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address provided'
        });
      }
    }

    const stateOrProvince = typeof body.stateOrProvince === 'string' ? body.stateOrProvince.trim().substring(0, 100) : '';
    const postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim().substring(0, 20) : '';
    const timezone = typeof body.timezone === 'string' ? body.timezone.trim().substring(0, 50) || 'UTC' : 'UTC';
    const instructions = typeof body.instructions === 'string' ? body.instructions.trim().substring(0, 1000) : '';

    // Coordinates validation if provided
    let latitude = null;
    if (body.latitude !== undefined && body.latitude !== null && body.latitude !== '') {
      const latNum = Number(body.latitude);
      if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
        return res.status(400).json({
          success: false,
          message: 'Latitude must be a valid number between -90 and 90'
        });
      }
      latitude = latNum;
    }

    let longitude = null;
    if (body.longitude !== undefined && body.longitude !== null && body.longitude !== '') {
      const lngNum = Number(body.longitude);
      if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({
          success: false,
          message: 'Longitude must be a valid number between -180 and 180'
        });
      }
      longitude = lngNum;
    }

    const isPrimaryRequested = Boolean(body.isPrimary);

    // If this clinic is set as primary, demote any other existing primary clinics for this doctor
    if (isPrimaryRequested) {
      await DoctorClinic.updateMany(
        { doctorId, isPrimary: true },
        { $set: { isPrimary: false } }
      );
    } else {
      // If doctor has no active clinics yet, make this first clinic primary by default
      const existingCount = await DoctorClinic.countDocuments({ doctorId, isActive: true });
      if (existingCount === 0) {
        // Automatically make first active clinic primary
        body.isPrimary = true;
      }
    }

    const clinic = await DoctorClinic.create({
      doctorId,
      clinicName,
      phone,
      email,
      addressLine,
      city,
      stateOrProvince,
      countryCode,
      postalCode,
      latitude,
      longitude,
      timezone,
      instructions,
      isActive: true,
      isPrimary: Boolean(body.isPrimary || isPrimaryRequested)
    });

    return res.status(201).json({
      success: true,
      message: 'Clinic created successfully',
      clinic
    });
  } catch (error) {
    console.error('Error creating doctor clinic:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating clinic',
      error: error.message
    });
  }
};

/**
 * PUT /api/doctors/clinics/:id
 * Update an existing clinic owned by the authenticated doctor.
 */
export const updateClinic = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid clinic ID format'
      });
    }

    // Verify ownership and existence
    const existingClinic = await DoctorClinic.findOne({ _id: id, doctorId });
    if (!existingClinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or not authorized'
      });
    }

    const body = req.body || {};
    const updates = {};

    // Validate fields if supplied
    if (Object.prototype.hasOwnProperty.call(body, 'clinicName')) {
      if (typeof body.clinicName !== 'string' || !body.clinicName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Clinic name cannot be empty'
        });
      }
      const trimmed = body.clinicName.trim();
      if (trimmed.length > 150) {
        return res.status(400).json({
          success: false,
          message: 'Clinic name cannot exceed 150 characters'
        });
      }
      updates.clinicName = trimmed;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'addressLine')) {
      if (typeof body.addressLine !== 'string' || !body.addressLine.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Address line cannot be empty'
        });
      }
      const trimmed = body.addressLine.trim();
      if (trimmed.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Address line cannot exceed 255 characters'
        });
      }
      updates.addressLine = trimmed;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'city')) {
      if (typeof body.city !== 'string' || !body.city.trim()) {
        return res.status(400).json({
          success: false,
          message: 'City cannot be empty'
        });
      }
      const trimmed = body.city.trim();
      if (trimmed.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'City cannot exceed 100 characters'
        });
      }
      updates.city = trimmed;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'countryCode')) {
      if (typeof body.countryCode !== 'string' || !body.countryCode.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Country code cannot be empty'
        });
      }
      const trimmed = body.countryCode.trim().toUpperCase();
      if (trimmed.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Country code cannot exceed 10 characters'
        });
      }
      updates.countryCode = trimmed;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
      updates.phone = typeof body.phone === 'string' ? body.phone.trim().substring(0, 50) : '';
    }

    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (email && (email.length > 100 || !isValidEmail(email))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address provided'
        });
      }
      updates.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'stateOrProvince')) {
      updates.stateOrProvince = typeof body.stateOrProvince === 'string' ? body.stateOrProvince.trim().substring(0, 100) : '';
    }

    if (Object.prototype.hasOwnProperty.call(body, 'postalCode')) {
      updates.postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim().substring(0, 20) : '';
    }

    if (Object.prototype.hasOwnProperty.call(body, 'timezone')) {
      updates.timezone = typeof body.timezone === 'string' ? body.timezone.trim().substring(0, 50) || 'UTC' : 'UTC';
    }

    if (Object.prototype.hasOwnProperty.call(body, 'instructions')) {
      updates.instructions = typeof body.instructions === 'string' ? body.instructions.trim().substring(0, 1000) : '';
    }

    if (Object.prototype.hasOwnProperty.call(body, 'latitude')) {
      if (body.latitude === null || body.latitude === '') {
        updates.latitude = null;
      } else {
        const latNum = Number(body.latitude);
        if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
          return res.status(400).json({
            success: false,
            message: 'Latitude must be a valid number between -90 and 90'
          });
        }
        updates.latitude = latNum;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'longitude')) {
      if (body.longitude === null || body.longitude === '') {
        updates.longitude = null;
      } else {
        const lngNum = Number(body.longitude);
        if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
          return res.status(400).json({
            success: false,
            message: 'Longitude must be a valid number between -180 and 180'
          });
        }
        updates.longitude = lngNum;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      updates.isActive = Boolean(body.isActive);
    }

    // Handle isPrimary logic
    if (Object.prototype.hasOwnProperty.call(body, 'isPrimary')) {
      const willBePrimary = Boolean(body.isPrimary);
      if (willBePrimary) {
        // Demote all other clinics of this doctor
        await DoctorClinic.updateMany(
          { doctorId, _id: { $ne: id }, isPrimary: true },
          { $set: { isPrimary: false } }
        );
        updates.isPrimary = true;
      } else {
        // If unsetting primary, check if another active clinic exists to be primary
        updates.isPrimary = false;
      }
    }

    const updatedClinic = await DoctorClinic.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'Clinic updated successfully',
      clinic: updatedClinic
    });
  } catch (error) {
    console.error('Error updating doctor clinic:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating clinic',
      error: error.message
    });
  }
};

/**
 * DELETE /api/doctors/clinics/:id
 * Soft delete a clinic by setting isActive: false.
 * Physical document is preserved.
 */
export const deleteClinic = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid clinic ID format'
      });
    }

    // Verify ownership and existence
    const existingClinic = await DoctorClinic.findOne({ _id: id, doctorId });
    if (!existingClinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found or not authorized'
      });
    }

    // If soft-deleting a primary clinic, unset isPrimary and demote
    const wasPrimary = existingClinic.isPrimary;

    // Perform soft delete
    const softDeleted = await DoctorClinic.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: { isActive: false, isPrimary: false } },
      { new: true }
    );

    // If this was primary, promote another active clinic if one exists
    if (wasPrimary) {
      const nextActive = await DoctorClinic.findOne({ doctorId, isActive: true }).sort({ createdAt: -1 });
      if (nextActive) {
        nextActive.isPrimary = true;
        await nextActive.save();
      }
    }

    return res.json({
      success: true,
      message: 'Clinic deactivated successfully',
      clinic: softDeleted
    });
  } catch (error) {
    console.error('Error deactivating doctor clinic:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deactivating clinic',
      error: error.message
    });
  }
};
