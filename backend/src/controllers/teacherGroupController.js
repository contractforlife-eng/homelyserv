// backend/src/controllers/teacherGroupController.js
// ============================================================
// TEACHER GROUPS & ENROLLMENTS CONTROLLER
//
// Strictly tenancy-isolated CRUD for Teacher-owned groups/classes
// and student enrollments.
//
// TENANCY & SECURITY RULES:
// 1. Scoped strictly through `teacherId: req.userId`.
// 2. Access to another teacher's group returns 404 to avoid enumeration.
// 3. Students enrolled into a group MUST belong to the same teacher.
// 4. Removing a student from a group deactivates the enrollment record ONLY;
//    it NEVER deletes the underlying TeacherStudent or User account.
// 5. Homely Student status is strictly derived from `Boolean(student.linkedUserId)`.
// ============================================================
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import TeacherStudent from '../models/TeacherStudent.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/**
 * Transforms a TeacherGroup document to clean DTO.
 */
export const toTeacherGroupDto = (doc, enrollmentCount = 0) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  return {
    id: String(d._id),
    teacherId: String(d.teacherId),
    name: d.name || '',
    subject: d.subject || '',
    gradeLevel: d.gradeLevel || '',
    academicYear: d.academicYear || '',
    description: d.description || '',
    scheduleDays: Array.isArray(d.scheduleDays) ? d.scheduleDays : [],
    color: d.color || '#DC2626',
    status: d.status || 'ACTIVE',
    isActive: d.isActive !== false,
    studentCount: typeof enrollmentCount === 'number' ? enrollmentCount : 0,
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null
  };
};

/**
 * Transforms an enrollment document with populated student to clean DTO.
 */
export const toEnrolledStudentDto = (enrollmentDoc) => {
  if (!enrollmentDoc) return null;
  const e = typeof enrollmentDoc.toObject === 'function' ? enrollmentDoc.toObject() : enrollmentDoc;
  const s = e.studentId || {};

  const isHomelyStudent = Boolean(s.linkedUserId);

  return {
    enrollmentId: String(e._id),
    groupId: String(e.groupId),
    studentId: String(s._id || e.studentId),
    enrolledAt: e.enrolledAt || e.createdAt,
    enrollmentStatus: e.status || 'ACTIVE',
    notes: e.notes || '',
    // Student fields from TeacherStudent
    firstName: s.firstName || '',
    lastName: s.lastName || '',
    fullName: s.fullName || '',
    gender: s.gender || null,
    phone: s.phone || '',
    email: s.email || '',
    school: s.school || '',
    gradeLevel: s.gradeLevel || '',
    subjects: Array.isArray(s.subjects) ? s.subjects : [],
    isHomelyStudent,
    linkedUserId: s.linkedUserId ? String(s.linkedUserId._id || s.linkedUserId) : null,
    studentStatus: s.status || 'ACTIVE'
  };
};

/**
 * GET /api/teachers/groups
 * List all active groups belonging to the authenticated teacher.
 * Includes student enrollment counts.
 */
export const getTeacherGroups = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { search, status } = req.query || {};

    const filter = { teacherId, isActive: true };

    if (status && ['ACTIVE', 'ARCHIVED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const safeRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: safeRegex },
        { subject: safeRegex },
        { gradeLevel: safeRegex },
        { academicYear: safeRegex }
      ];
    }

    const groups = await TeacherGroup.find(filter).sort({ createdAt: -1 });

    // Aggregate active enrollment counts per group
    const groupIds = groups.map((g) => g._id);
    let countsMap = {};

    if (groupIds.length > 0) {
      const counts = await TeacherGroupEnrollment.aggregate([
        {
          $match: {
            groupId: { $in: groupIds },
            teacherId,
            isActive: true,
            status: 'ACTIVE'
          }
        },
        {
          $group: {
            _id: '$groupId',
            count: { $sum: 1 }
          }
        }
      ]);

      countsMap = counts.reduce((acc, curr) => {
        acc[String(curr._id)] = curr.count;
        return acc;
      }, {});
    }

    const dtoList = groups.map((g) =>
      toTeacherGroupDto(g, countsMap[String(g._id)] || 0)
    );

    return res.json({
      success: true,
      count: dtoList.length,
      groups: dtoList
    });
  } catch (error) {
    console.error('Error fetching teacher groups:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching groups',
      error: error.message
    });
  }
};

/**
 * GET /api/teachers/groups/:id
 * Get a single group and its active enrolled students.
 */
export const getTeacherGroupById = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const group = await TeacherGroup.findOne({ _id: id, teacherId, isActive: true });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Fetch active enrollments with populated student data
    const enrollments = await TeacherGroupEnrollment.find({
      groupId: group._id,
      teacherId,
      isActive: true,
      status: 'ACTIVE'
    })
      .sort({ enrolledAt: -1 })
      .populate('studentId');

    const enrolledStudents = enrollments
      .filter((e) => e.studentId && e.studentId.isActive !== false)
      .map(toEnrolledStudentDto);

    return res.json({
      success: true,
      group: toTeacherGroupDto(group, enrolledStudents.length),
      students: enrolledStudents
    });
  } catch (error) {
    console.error('Error fetching group details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching group details',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/groups
 * Create a new group owned by the authenticated teacher.
 */
export const createTeacherGroup = async (req, res) => {
  try {
    const teacherId = req.userId;
    const body = req.body || {};

    const name = cleanString(body.name, 120);
    const subject = cleanString(body.subject, 100);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    let scheduleDays = [];
    if (Array.isArray(body.scheduleDays)) {
      scheduleDays = body.scheduleDays
        .filter((d) => typeof d === 'string')
        .map((d) => d.trim())
        .filter(Boolean);
    }

    const group = await TeacherGroup.create({
      teacherId,
      name,
      subject,
      gradeLevel: cleanString(body.gradeLevel, 100),
      academicYear: cleanString(body.academicYear, 50),
      description: cleanString(body.description, 1000),
      scheduleDays,
      color: cleanString(body.color, 30) || '#DC2626',
      status: body.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: toTeacherGroupDto(group, 0)
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating group',
      error: error.message
    });
  }
};

/**
 * PUT /api/teachers/groups/:id
 * Update an existing group owned by the teacher.
 */
export const updateTeacherGroup = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const group = await TeacherGroup.findOne({ _id: id, teacherId, isActive: true });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (body.name !== undefined) {
      const n = cleanString(body.name, 120);
      if (!n) {
        return res.status(400).json({ success: false, message: 'Group name cannot be empty' });
      }
      group.name = n;
    }

    if (body.subject !== undefined) {
      const s = cleanString(body.subject, 100);
      if (!s) {
        return res.status(400).json({ success: false, message: 'Subject cannot be empty' });
      }
      group.subject = s;
    }

    if (body.gradeLevel !== undefined) {
      group.gradeLevel = cleanString(body.gradeLevel, 100);
    }

    if (body.academicYear !== undefined) {
      group.academicYear = cleanString(body.academicYear, 50);
    }

    if (body.description !== undefined) {
      group.description = cleanString(body.description, 1000);
    }

    if (body.color !== undefined) {
      group.color = cleanString(body.color, 30) || '#DC2626';
    }

    if (body.status !== undefined) {
      const st = String(body.status).toUpperCase();
      if (['ACTIVE', 'ARCHIVED'].includes(st)) {
        group.status = st;
      }
    }

    if (Array.isArray(body.scheduleDays)) {
      group.scheduleDays = body.scheduleDays
        .filter((d) => typeof d === 'string')
        .map((d) => d.trim())
        .filter(Boolean);
    }

    await group.save();

    // Count active enrollments
    const activeCount = await TeacherGroupEnrollment.countDocuments({
      groupId: group._id,
      teacherId,
      isActive: true,
      status: 'ACTIVE'
    });

    return res.json({
      success: true,
      message: 'Group updated successfully',
      group: toTeacherGroupDto(group, activeCount)
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating group',
      error: error.message
    });
  }
};

/**
 * DELETE /api/teachers/groups/:id
 * Soft-delete / archive group (isActive = false, status = ARCHIVED).
 * Preserves enrollment history.
 */
export const deleteTeacherGroup = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const group = await TeacherGroup.findOne({ _id: id, teacherId, isActive: true });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Soft delete group
    group.isActive = false;
    group.status = 'ARCHIVED';
    await group.save();

    return res.json({
      success: true,
      message: 'Group removed successfully'
    });
  } catch (error) {
    console.error('Error removing group:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing group',
      error: error.message
    });
  }
};

/**
 * GET /api/teachers/groups/:groupId/students
 * List enrolled students in a specific group.
 */
export const getGroupStudents = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { groupId } = req.params;

    if (!isValidObjectId(String(groupId || ''))) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify group belongs to this teacher
    const group = await TeacherGroup.findOne({ _id: groupId, teacherId, isActive: true });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const enrollments = await TeacherGroupEnrollment.find({
      groupId: group._id,
      teacherId,
      isActive: true,
      status: 'ACTIVE'
    })
      .sort({ enrolledAt: -1 })
      .populate('studentId');

    const enrolledStudents = enrollments
      .filter((e) => e.studentId && e.studentId.isActive !== false)
      .map(toEnrolledStudentDto);

    return res.json({
      success: true,
      count: enrolledStudents.length,
      students: enrolledStudents
    });
  } catch (error) {
    console.error('Error fetching group students:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching group students',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/groups/:groupId/students
 * Enroll an existing TeacherStudent into the group.
 * Validates ownership of BOTH group and student.
 * Prevents duplicate active enrollments.
 */
export const enrollStudentInGroup = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { groupId } = req.params;
    const { studentId, notes } = req.body || {};

    if (!isValidObjectId(String(groupId || ''))) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!isValidObjectId(String(studentId || ''))) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required' });
    }

    // 1. Verify group exists and belongs to this teacher
    const group = await TeacherGroup.findOne({ _id: groupId, teacherId, isActive: true });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // 2. Verify student exists, is active, and belongs to this teacher
    const student = await TeacherStudent.findOne({ _id: studentId, teacherId, isActive: true });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in your students list'
      });
    }

    // 3. Check for existing enrollment
    let enrollment = await TeacherGroupEnrollment.findOne({
      groupId: group._id,
      studentId: student._id
    });

    if (enrollment) {
      if (enrollment.isActive && enrollment.status === 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'Student is already enrolled in this group'
        });
      }

      // Reactivate existing enrollment
      enrollment.isActive = true;
      enrollment.status = 'ACTIVE';
      enrollment.enrolledAt = new Date();
      if (notes !== undefined) {
        enrollment.notes = cleanString(notes, 1000);
      }
      await enrollment.save();
    } else {
      // Create new enrollment
      enrollment = await TeacherGroupEnrollment.create({
        teacherId,
        groupId: group._id,
        studentId: student._id,
        enrolledAt: new Date(),
        status: 'ACTIVE',
        notes: cleanString(notes, 1000),
        isActive: true
      });
    }

    enrollment.studentId = student;

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      enrollment: toEnrolledStudentDto(enrollment)
    });
  } catch (error) {
    console.error('Error enrolling student in group:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error enrolling student in group',
      error: error.message
    });
  }
};

/**
 * DELETE /api/teachers/groups/:groupId/students/:studentId
 * Remove / unenroll student from the group.
 * CRITICAL: Only deactivates the enrollment!
 * NEVER deletes the underlying TeacherStudent record.
 */
export const removeStudentFromGroup = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { groupId, studentId } = req.params;

    if (!isValidObjectId(String(groupId || '')) || !isValidObjectId(String(studentId || ''))) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    // Verify group belongs to this teacher
    const group = await TeacherGroup.findOne({ _id: groupId, teacherId, isActive: true });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const enrollment = await TeacherGroupEnrollment.findOne({
      groupId: group._id,
      studentId,
      teacherId,
      isActive: true,
      status: 'ACTIVE'
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Active enrollment not found for this student in this group'
      });
    }

    // Deactivate enrollment ONLY
    enrollment.isActive = false;
    enrollment.status = 'DROPPED';
    await enrollment.save();

    return res.json({
      success: true,
      message: 'Student removed from group successfully'
    });
  } catch (error) {
    console.error('Error removing student from group:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing student from group',
      error: error.message
    });
  }
};
