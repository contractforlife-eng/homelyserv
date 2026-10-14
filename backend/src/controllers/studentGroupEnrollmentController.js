// backend/src/controllers/studentGroupEnrollmentController.js
// ============================================================
// STUDENT GROUP ENROLLMENT CONTROLLER
// Handles student visibility into group enrollment requests and
// claiming unlinked pending requests upon verified account sign-in.
// ============================================================
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import TeacherGroup from '../models/TeacherGroup.js';
import User from '../models/User.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import ClinicPatient from '../models/ClinicPatient.js';

/**
 * GET /api/students/groups/enrollments
 * Returns all group enrollments for the authenticated student.
 */
export const getMyGroupEnrollments = async (req, res) => {
  try {
    const studentUserId = req.userId;

    // Find all student roster entries belonging to this student
    const studentRecords = await TeacherStudent.find({
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      isActive: true
    }).select('_id teacherId fullName phone').lean();

    if (!studentRecords.length) {
      return res.json({ success: true, count: 0, enrollments: [] });
    }

    const studentRecordIds = studentRecords.map((s) => s._id);

    // Fetch enrollments across all groups for these student records
    const enrollments = await TeacherGroupEnrollment.find({
      studentId: { $in: studentRecordIds },
      isActive: true
    })
      .sort({ createdAt: -1 })
      .populate('groupId')
      .populate('teacherId', 'fullName email profileImage')
      .lean();

    const dtoList = enrollments.map((e) => {
      const g = e.groupId || {};
      const t = e.teacherId || {};
      return {
        id: String(e._id),
        status: e.status, // PENDING, ACTIVE, REJECTED, etc.
        enrolledAt: e.enrolledAt,
        notes: e.notes || '',
        group: {
          id: String(g._id || ''),
          name: g.name || '',
          subject: g.subject || '',
          gradeLevel: g.gradeLevel || '',
          onlineMode: g.onlineMode || 'IN_PERSON',
          color: g.color || '#DC2626'
        },
        teacher: {
          id: String(t._id || e.teacherId || ''),
          fullName: t.fullName || 'Teacher',
          profileImage: t.profileImage || null
        }
      };
    });

    return res.json({
      success: true,
      count: dtoList.length,
      enrollments: dtoList
    });
  } catch (error) {
    console.error('Error fetching student group enrollments:', error);
    return res.status(500).json({ success: false, message: 'Server error loading group enrollments' });
  }
};

/**
 * POST /api/students/claim-pending-requests
 * Securely links unlinked TeacherStudent entries and DoctorAppointments
 * that match the verified student's email.
 */
export const claimPendingRequests = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const user = await User.findById(studentUserId).select('_id email role emailVerified');

    if (!user || String(user.role).toUpperCase() !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Only students can claim pending requests' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your email address must be verified before claiming pending requests.'
      });
    }

    const email = String(user.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Account email required to claim requests' });
    }

    let claimedTeacherStudents = 0;
    let claimedDoctorAppointments = 0;

    // 1. Claim unlinked TeacherStudent records matching email
    const unlinkedStudents = await TeacherStudent.find({
      email,
      $or: [{ linkedUserId: null }, { linkedUserId: { $exists: false } }],
      isActive: true
    });

    for (const st of unlinkedStudents) {
      st.linkedUserId = user._id;
      st.studentUserId = user._id;
      await st.save();
      claimedTeacherStudents += 1;
    }

    // 2. Claim unlinked DoctorAppointments matching email
    // ClinicPatients that have matching email and unlinked
    const unlinkedClinicPatients = await ClinicPatient.find({
      email,
      isActive: true
    }).select('_id');

    if (unlinkedClinicPatients.length > 0) {
      const cpIds = unlinkedClinicPatients.map((cp) => cp._id);
      const unlinkedAppointments = await DoctorAppointment.find({
        clinicPatientId: { $in: cpIds },
        patientId: null
      });

      for (const appt of unlinkedAppointments) {
        appt.patientId = user._id;
        appt.clinicPatientId = null;
        appt.createdBy = user._id;
        await appt.save();
        claimedDoctorAppointments += 1;
      }
    }

    return res.json({
      success: true,
      message: 'Pending requests processed successfully',
      claimed: {
        teacherStudents: claimedTeacherStudents,
        doctorAppointments: claimedDoctorAppointments
      }
    });
  } catch (error) {
    console.error('Error claiming pending requests:', error);
    return res.status(500).json({ success: false, message: 'Server error claiming requests' });
  }
};
