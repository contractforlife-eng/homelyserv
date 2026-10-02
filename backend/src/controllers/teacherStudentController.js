// backend/src/controllers/teacherStudentController.js
// ============================================================
// TEACHER STUDENTS CONTROLLER
// Tenancy-isolated CRUD for Teacher-owned students.
//
// OWNERSHIP / AUTHZ:
// Every query and mutation is strictly scoped to `teacherId: req.userId`.
// An attempt to access another teacher's student returns 404
// so IDs cannot be enumerated.
//
// HOMELY STUDENT BADGE / LINKING:
// - isHomelyStudent is derived strictly from `Boolean(linkedUserId)`.
// - linkedUserId points to a real User with role 'STUDENT' or valid User.
// - External students have `linkedUserId: null`.
// ============================================================
import TeacherStudent from '../models/TeacherStudent.js';
import User from '../models/User.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const MAX = {
  name: 80,
  fullName: 160,
  phone: 50,
  email: 100,
  country: 100,
  city: 100,
  address: 255,
  school: 150,
  gradeLevel: 100,
  educationLevel: 100,
  notes: 2000
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const parseDateOfBirth = (value) => {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { ok: false };
  if (date.getTime() > Date.now()) return { ok: false };
  return { ok: true, value: date };
};

const parseGender = (value) => {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }
  const upper = String(value).toUpperCase();
  if (!['MALE', 'FEMALE', 'OTHER'].includes(upper)) return { ok: false };
  return { ok: true, value: upper };
};

/**
 * Transforms a TeacherStudent document to a clean DTO.
 */
export const toTeacherStudentDto = (doc) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  const isHomelyStudent = Boolean(d.linkedUserId);

  return {
    id: String(d._id),
    teacherId: String(d.teacherId),
    linkedUserId: d.linkedUserId ? String(d.linkedUserId._id || d.linkedUserId) : null,
    studentUserId: d.studentUserId ? String(d.studentUserId._id || d.studentUserId) : (d.linkedUserId ? String(d.linkedUserId._id || d.linkedUserId) : null),
    relationshipStatus: d.relationshipStatus || 'ACTIVE',
    relationshipStartedAt: d.relationshipStartedAt || d.createdAt || null,
    relationshipEndedAt: d.relationshipEndedAt || null,
    isHomelyStudent,
    firstName: d.firstName || '',
    lastName: d.lastName || '',
    fullName: d.fullName || '',
    gender: d.gender || null,
    dateOfBirth: d.dateOfBirth || null,
    country: d.country || '',
    city: d.city || '',
    address: d.address || '',
    phone: d.phone || '',
    email: d.email || '',
    school: d.school || '',
    gradeLevel: d.gradeLevel || '',
    educationLevel: d.educationLevel || '',
    subjects: Array.isArray(d.subjects) ? d.subjects : [],
    notes: d.notes || '',
    status: d.status || 'ACTIVE',
    isActive: d.isActive !== false,
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null
  };
};

/**
 * GET /api/teachers/students
 * List all students belonging to the authenticated teacher.
 * Supports query params: search, status.
 */
export const getTeacherStudents = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { search, status } = req.query || {};

    const filter = { teacherId, isActive: true };

    if (status && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const safeRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { fullName: safeRegex },
        { email: safeRegex },
        { phone: safeRegex },
        { school: safeRegex },
        { gradeLevel: safeRegex },
        { educationLevel: safeRegex }
      ];
    }

    const students = await TeacherStudent.find(filter)
      .sort({ createdAt: -1 })
      .populate('linkedUserId', 'fullName email profileImage role');

    const list = (students || []).map(toTeacherStudentDto);

    return res.json({
      success: true,
      count: list.length,
      students: list
    });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching students',
      error: error.message
    });
  }
};

/**
 * GET /api/teachers/students/:id
 * Get a single student record owned by the authenticated teacher.
 */
export const getTeacherStudentById = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = await TeacherStudent.findOne({ _id: id, teacherId, isActive: true })
      .populate('linkedUserId', 'fullName email profileImage role');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.json({
      success: true,
      student: toTeacherStudentDto(student)
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching student details',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/students
 * Create a new student (defaults to External Student with linkedUserId: null).
 */
export const createTeacherStudent = async (req, res) => {
  try {
    const teacherId = req.userId;
    const body = req.body || {};

    const firstName = cleanString(body.firstName, MAX.name);
    const lastName = cleanString(body.lastName, MAX.name);

    let fullName = cleanString(body.fullName, MAX.fullName);
    if (!fullName) {
      fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Student name is required'
      });
    }

    const dob = parseDateOfBirth(body.dateOfBirth);
    if (!dob.ok) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth must be a valid past date'
      });
    }

    const gender = parseGender(body.gender);
    if (!gender.ok) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be MALE, FEMALE, or OTHER'
      });
    }

    const email = cleanString(body.email, MAX.email).toLowerCase();
    if (email && !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Optional Homely Student account linking check
    let linkedUserId = null;
    if (body.linkedUserId) {
      if (!isValidObjectId(String(body.linkedUserId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid linkedUserId'
        });
      }
      const linkedUser = await User.findById(body.linkedUserId).select('_id role isSuspended');
      if (!linkedUser) {
        return res.status(400).json({
          success: false,
          message: 'Linked HomelyServ user account does not exist'
        });
      }
      linkedUserId = linkedUser._id;
    } else if (email) {
      // Auto-bridge if a registered User with role STUDENT exists with this email
      const matchedUser = await User.findOne({ email, role: 'STUDENT' }).select('_id');
      if (matchedUser) {
        linkedUserId = matchedUser._id;
      }
    }

    // Duplicate check: if teacher already has an active record for this linked student user, reuse/update it
    if (linkedUserId) {
      const existing = await TeacherStudent.findOne({
        teacherId,
        $or: [{ linkedUserId }, { studentUserId: linkedUserId }],
        isActive: true
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Student record already exists for this teacher',
          student: toTeacherStudentDto(existing)
        });
      }
    }

    let subjects = [];
    if (Array.isArray(body.subjects)) {
      subjects = body.subjects
        .filter(s => typeof s === 'string')
        .map(s => s.trim())
        .filter(Boolean);
    }

    const newStudent = await TeacherStudent.create({
      teacherId,
      linkedUserId,
      studentUserId: linkedUserId,
      firstName,
      lastName,
      fullName,
      gender: gender.value,
      dateOfBirth: dob.value,
      country: cleanString(body.country, MAX.country),
      city: cleanString(body.city, MAX.city),
      address: cleanString(body.address, MAX.address),
      phone: cleanString(body.phone, MAX.phone),
      email,
      school: cleanString(body.school, MAX.school),
      gradeLevel: cleanString(body.gradeLevel, MAX.gradeLevel),
      educationLevel: cleanString(body.educationLevel, MAX.educationLevel),
      subjects,
      notes: cleanString(body.notes, MAX.notes),
      status: body.status && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(body.status.toUpperCase())
        ? body.status.toUpperCase()
        : 'ACTIVE',
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student: toTeacherStudentDto(newStudent)
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error creating student:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating student',
      error: error.message
    });
  }
};

/**
 * PUT /api/teachers/students/:id
 * Update teacher's own student record.
 * Preserves linkedUserId if already linked and does not allow modifying the User account.
 */
export const updateTeacherStudent = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = await TeacherStudent.findOne({ _id: id, teacherId, isActive: true });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (body.firstName !== undefined) {
      student.firstName = cleanString(body.firstName, MAX.name);
    }
    if (body.lastName !== undefined) {
      student.lastName = cleanString(body.lastName, MAX.name);
    }

    if (body.fullName !== undefined) {
      const fn = cleanString(body.fullName, MAX.fullName);
      if (!fn) {
        return res.status(400).json({ success: false, message: 'Full name cannot be empty' });
      }
      student.fullName = fn;
    } else if (body.firstName !== undefined || body.lastName !== undefined) {
      student.fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim() || student.fullName;
    }

    if (body.dateOfBirth !== undefined) {
      const dob = parseDateOfBirth(body.dateOfBirth);
      if (!dob.ok) {
        return res.status(400).json({
          success: false,
          message: 'Date of birth must be a valid past date'
        });
      }
      student.dateOfBirth = dob.value;
    }

    if (body.gender !== undefined) {
      const gender = parseGender(body.gender);
      if (!gender.ok) {
        return res.status(400).json({
          success: false,
          message: 'Gender must be MALE, FEMALE, or OTHER'
        });
      }
      student.gender = gender.value;
    }

    if (body.email !== undefined) {
      const email = cleanString(body.email, MAX.email).toLowerCase();
      if (email && !EMAIL_PATTERN.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address'
        });
      }
      student.email = email;
      if (!student.linkedUserId && email) {
        const matchedUser = await User.findOne({ email, role: 'STUDENT' }).select('_id');
        if (matchedUser) {
          student.linkedUserId = matchedUser._id;
          student.studentUserId = matchedUser._id;
        }
      }
    }

    if (body.linkedUserId !== undefined && !student.linkedUserId && body.linkedUserId) {
      if (isValidObjectId(String(body.linkedUserId))) {
        const linkedUser = await User.findById(body.linkedUserId).select('_id role');
        if (linkedUser) {
          student.linkedUserId = linkedUser._id;
          student.studentUserId = linkedUser._id;
        }
      }
    }

    if (body.phone !== undefined) {
      student.phone = cleanString(body.phone, MAX.phone);
    }
    if (body.country !== undefined) {
      student.country = cleanString(body.country, MAX.country);
    }
    if (body.city !== undefined) {
      student.city = cleanString(body.city, MAX.city);
    }
    if (body.address !== undefined) {
      student.address = cleanString(body.address, MAX.address);
    }
    if (body.school !== undefined) {
      student.school = cleanString(body.school, MAX.school);
    }
    if (body.gradeLevel !== undefined) {
      student.gradeLevel = cleanString(body.gradeLevel, MAX.gradeLevel);
    }
    if (body.educationLevel !== undefined) {
      student.educationLevel = cleanString(body.educationLevel, MAX.educationLevel);
    }
    if (body.notes !== undefined) {
      student.notes = cleanString(body.notes, MAX.notes);
    }
    if (body.status !== undefined) {
      const st = String(body.status).toUpperCase();
      if (['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(st)) {
        student.status = st;
      }
    }
    if (Array.isArray(body.subjects)) {
      student.subjects = body.subjects
        .filter(s => typeof s === 'string')
        .map(s => s.trim())
        .filter(Boolean);
    }

    await student.save();

    return res.json({
      success: true,
      message: 'Student updated successfully',
      student: toTeacherStudentDto(student)
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error updating student:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating student',
      error: error.message
    });
  }
};

/**
 * DELETE /api/teachers/students/:id
 * Soft-delete student record (isActive = false).
 */
export const deleteTeacherStudent = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = await TeacherStudent.findOne({ _id: id, teacherId, isActive: true });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.isActive = false;
    await student.save();

    return res.json({
      success: true,
      message: 'Student removed successfully'
    });
  } catch (error) {
    console.error('Error removing student:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing student',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/students/:id/accept
 * Teacher accepts a student's pending relationship request.
 */
export const acceptTeacherStudent = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Student relationship not found' });
    }

    const relationship = await TeacherStudent.findOne({ _id: id, teacherId, isActive: true });
    if (!relationship) {
      return res.status(404).json({ success: false, message: 'Student relationship not found' });
    }

    relationship.relationshipStatus = 'ACTIVE';
    relationship.status = 'ACTIVE';
    if (!relationship.relationshipStartedAt) {
      relationship.relationshipStartedAt = new Date();
    }
    await relationship.save();

    return res.json({
      success: true,
      message: 'Student request accepted successfully',
      student: toTeacherStudentDto(relationship)
    });
  } catch (error) {
    console.error('Error accepting student request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error accepting student request',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/students/:id/reject
 * Teacher declines a student's pending relationship request.
 */
export const rejectTeacherStudent = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Student relationship not found' });
    }

    const relationship = await TeacherStudent.findOne({ _id: id, teacherId, isActive: true });
    if (!relationship) {
      return res.status(404).json({ success: false, message: 'Student relationship not found' });
    }

    relationship.relationshipStatus = 'REJECTED';
    relationship.relationshipEndedAt = new Date();
    await relationship.save();

    return res.json({
      success: true,
      message: 'Student request declined',
      student: toTeacherStudentDto(relationship)
    });
  } catch (error) {
    console.error('Error rejecting student request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error declining student request',
      error: error.message
    });
  }
};

export default {
  getTeacherStudents,
  getTeacherStudentById,
  createTeacherStudent,
  updateTeacherStudent,
  deleteTeacherStudent,
  acceptTeacherStudent,
  rejectTeacherStudent,
  toTeacherStudentDto
};
