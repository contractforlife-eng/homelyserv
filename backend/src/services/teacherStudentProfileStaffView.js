// backend/src/services/teacherStudentProfileStaffView.js
// ============================================================
// TEACHER / STUDENT PROFILE — STAFF VIEW ASSEMBLY
// ============================================================
// Same shape and purpose as doctorProfileStaffView.js, for the other two
// provider roles. Admin (Co-Admin), Sup-Admin (SUPPORT) and Sup-Help
// (SUPPORT_HELPER) each open a user through their own detail endpoint, and those
// endpoints only ever selected Worker/Employer shapes — so a Teacher or a Student
// opened with no professional profile at all.
//
// ROLE ISOLATION IS STRICT AND DATA-DRIVEN: a profile is read ONLY when
// payload.role matches. A Teacher can never receive a StudentProfile, a Student
// can never receive a TeacherProfile, and no other role receives either — even
// if a stray document happens to exist for that user.
//
// READ-ONLY: this service never writes, and returns plain serialized data.
// No credentials, tokens or payment data are read or exposed.
// ============================================================
import TeacherProfile from '../models/TeacherProfile.js';
import StudentProfile from '../models/StudentProfile.js';

/** Fields a staff surface is allowed to see on a Teacher profile. */
export const PUBLIC_TEACHER_PROFILE_FIELDS =
  'title mainSubject additionalSubjects specialization teachingLevels teachingMethod ' +
  'experienceSummary bio yearsOfExperience languages qualifications education certifications ' +
  'hourlyRate lessonRate pricingCurrency profileImage isProfileComplete isPublished ' +
  'availableForNewStudents createdAt updatedAt';

/** Fields a staff surface is allowed to see on a Student profile. */
export const PUBLIC_STUDENT_PROFILE_FIELDS =
  'firstName lastName gender dateOfBirth school gradeLevel educationLevel subjects ' +
  'country city address notes isProfileComplete createdAt updatedAt';

const asArray = (value) => (Array.isArray(value) ? value : []);

export const serializeTeacherProfile = (profile) => {
  if (!profile) return null;
  const raw = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  return {
    userId: String(raw.userId),
    title: raw.title || '',
    mainSubject: raw.mainSubject || '',
    additionalSubjects: asArray(raw.additionalSubjects),
    specialization: raw.specialization || '',
    teachingLevels: asArray(raw.teachingLevels),
    teachingMethod: raw.teachingMethod || '',
    experienceSummary: raw.experienceSummary || '',
    bio: raw.bio || '',
    yearsOfExperience: Number(raw.yearsOfExperience) || 0,
    languages: asArray(raw.languages),
    qualifications: asArray(raw.qualifications),
    education: asArray(raw.education),
    certifications: asArray(raw.certifications),
    hourlyRate: Number(raw.hourlyRate) || 0,
    lessonRate: Number(raw.lessonRate) || 0,
    pricingCurrency: raw.pricingCurrency || '',
    profileImage: raw.profileImage || '',
    isProfileComplete: Boolean(raw.isProfileComplete),
    isPublished: Boolean(raw.isPublished),
    availableForNewStudents: Boolean(raw.availableForNewStudents)
  };
};

export const serializeStudentProfile = (profile) => {
  if (!profile) return null;
  const raw = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  return {
    userId: String(raw.userId),
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    gender: raw.gender || null,
    dateOfBirth: raw.dateOfBirth || null,
    school: raw.school || '',
    gradeLevel: raw.gradeLevel || '',
    educationLevel: raw.educationLevel || '',
    subjects: asArray(raw.subjects),
    country: raw.country || '',
    city: raw.city || '',
    address: raw.address || '',
    notes: raw.notes || '',
    isProfileComplete: Boolean(raw.isProfileComplete)
  };
};

/** Loads the Teacher profile for a user id. */
export const getTeacherProfileStaffView = async (userId) => {
  if (!userId) return { TeacherProfile: null };
  try {
    const profile = await TeacherProfile.findOne({ userId })
      .select(PUBLIC_TEACHER_PROFILE_FIELDS)
      .lean();
    return { TeacherProfile: serializeTeacherProfile(profile) };
  } catch (error) {
    console.error('Error assembling teacher staff view:', error);
    return { TeacherProfile: null };
  }
};

/** Loads the Student profile for a user id. */
export const getStudentProfileStaffView = async (userId) => {
  if (!userId) return { StudentProfile: null };
  try {
    const profile = await StudentProfile.findOne({ userId })
      .select(PUBLIC_STUDENT_PROFILE_FIELDS)
      .lean();
    return { StudentProfile: serializeStudentProfile(profile) };
  } catch (error) {
    console.error('Error assembling student staff view:', error);
    return { StudentProfile: null };
  }
};

/**
 * Attaches the matching provider profile onto a staff user payload.
 *
 * Mirrors attachDoctorView(): a matching role ALWAYS receives its key
 * (possibly null) so the client can tell "no profile yet" from "not this role",
 * and every other role is returned completely untouched.
 *
 * @param {Object} payload - the user object being serialized for staff
 * @param {string} payload.role
 * @param {string|import('mongoose').Types.ObjectId} payload.id
 */
export const attachTeacherStudentView = async (payload) => {
  if (!payload) return payload;
  if (payload.role === 'TEACHER') {
    const { TeacherProfile } = await getTeacherProfileStaffView(payload.id);
    return { ...payload, TeacherProfile };
  }
  if (payload.role === 'STUDENT') {
    const { StudentProfile } = await getStudentProfileStaffView(payload.id);
    return { ...payload, StudentProfile };
  }
  return payload;
};

export default {
  getTeacherProfileStaffView,
  getStudentProfileStaffView,
  attachTeacherStudentView,
  serializeTeacherProfile,
  serializeStudentProfile,
  PUBLIC_TEACHER_PROFILE_FIELDS,
  PUBLIC_STUDENT_PROFILE_FIELDS
};