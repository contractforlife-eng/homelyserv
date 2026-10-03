// backend/src/services/studentClassmateService.js
// ============================================================
// STUDENT CLASSMATE SERVICE
//
// Resolves eligible peer classmates for an authenticated Student user.
//
// BUSINESS & INTEGRITY RULES:
// 1. ONE_ON_ONE lessons do NOT create classmates (only 1 student attached).
// 2. Classmate eligibility is strictly derived from shared GROUP lessons:
//    - Requesting user must have an active TeacherStudent relationship.
//    - Requesting user must have an ACTIVE TeacherGroupEnrollment.
//    - The group must have at least one valid, non-cancelled TeacherLesson
//      (lessonStatus in ['SCHEDULED', 'COMPLETED']).
//    - Peer students must be actively enrolled in the same group.
//    - Peer students must be linked HomelyServ users (linkedUserId / studentUserId exists).
//    - Peer students must be verified Users with role: 'STUDENT'.
//    - External/unlinked students are NEVER returned.
//    - Requesting student is excluded.
// ============================================================
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherGroup from '../models/TeacherGroup.js';
import User from '../models/User.js';

/**
 * Resolves the complete set of eligible classmate user IDs and shared group metadata
 * for a given student user ID.
 *
 * @param {string|mongoose.Types.ObjectId} studentUserId
 * @returns {Promise<Array<{ user: object, sharedGroups: Array<{ id: string, name: string, subject: string }> }>>}
 */
export const getEligibleClassmates = async (studentUserId) => {
  const sUserId = String(studentUserId || '');
  if (!sUserId) return [];

  // 1. Find all active TeacherStudent records for the requesting user
  const myRelationships = await TeacherStudent.find({
    $or: [{ linkedUserId: sUserId }, { studentUserId: sUserId }],
    isActive: true,
    relationshipStatus: 'ACTIVE'
  }).select('_id');

  const myTeacherStudentIds = myRelationships.map((r) => r._id);
  if (myTeacherStudentIds.length === 0) {
    return [];
  }

  // 2. Find active group enrollments for the requesting student
  const myEnrollments = await TeacherGroupEnrollment.find({
    studentId: { $in: myTeacherStudentIds },
    status: 'ACTIVE',
    isActive: true
  }).select('groupId');

  const myGroupIds = [...new Set(myEnrollments.map((e) => String(e.groupId)))];
  if (myGroupIds.length === 0) {
    return [];
  }

  // 3. Filter groups that have at least one valid (SCHEDULED or COMPLETED) TeacherLesson
  const validLessons = await TeacherLesson.find({
    groupId: { $in: myGroupIds },
    lessonType: 'GROUP',
    lessonStatus: { $in: ['SCHEDULED', 'COMPLETED'] },
    isActive: true
  }).select('groupId');

  const validGroupIds = [...new Set(validLessons.map((l) => String(l.groupId)))];
  if (validGroupIds.length === 0) {
    return [];
  }

  // 4. Fetch group details for display metadata
  const groupDocs = await TeacherGroup.find({
    _id: { $in: validGroupIds },
    isActive: true
  }).select('_id name subject');
  const groupMap = new Map(groupDocs.map((g) => [String(g._id), g]));

  // 5. Find other ACTIVE enrollments in these valid groups (excluding my TeacherStudent IDs)
  const peerEnrollments = await TeacherGroupEnrollment.find({
    groupId: { $in: validGroupIds },
    studentId: { $nin: myTeacherStudentIds },
    status: 'ACTIVE',
    isActive: true
  }).select('groupId studentId');

  if (peerEnrollments.length === 0) {
    return [];
  }

  const peerTeacherStudentIds = [...new Set(peerEnrollments.map((e) => String(e.studentId)))];

  // 6. Resolve peer TeacherStudent records to find real HomelyServ accounts
  const peerRelationships = await TeacherStudent.find({
    _id: { $in: peerTeacherStudentIds },
    isActive: true,
    relationshipStatus: 'ACTIVE',
    $or: [
      { linkedUserId: { $ne: null } },
      { studentUserId: { $ne: null } }
    ]
  }).select('_id linkedUserId studentUserId');

  // Map each peer TeacherStudent ID to its canonical User ID
  const tsToUserMap = new Map();
  for (const rel of peerRelationships) {
    const canonicalUserId = String(rel.linkedUserId || rel.studentUserId);
    if (canonicalUserId && canonicalUserId !== sUserId) {
      tsToUserMap.set(String(rel._id), canonicalUserId);
    }
  }

  const peerUserIds = [...new Set(Array.from(tsToUserMap.values()))];
  if (peerUserIds.length === 0) {
    return [];
  }

  // 7. Verify peer users are real, non-suspended users with role: 'STUDENT'
  const peerUsers = await User.find({
    _id: { $in: peerUserIds },
    role: 'STUDENT',
    isSuspended: false
  }).select('_id fullName profileImage email');

  const validUserMap = new Map(peerUsers.map((u) => [String(u._id), u]));

  // 8. Associate each valid peer with the shared groups they participate in with the caller
  const classmateMap = new Map();

  for (const enrollment of peerEnrollments) {
    const peerTsId = String(enrollment.studentId);
    const peerUid = tsToUserMap.get(peerTsId);
    if (!peerUid) continue;

    const peerUser = validUserMap.get(peerUid);
    if (!peerUser) continue;

    const gId = String(enrollment.groupId);
    const gDoc = groupMap.get(gId);

    if (!classmateMap.has(peerUid)) {
      classmateMap.set(peerUid, {
        userId: peerUid,
        fullName: peerUser.fullName || 'Student',
        profileImage: peerUser.profileImage || null,
        sharedGroups: []
      });
    }

    if (gDoc) {
      const entry = classmateMap.get(peerUid);
      if (!entry.sharedGroups.some((g) => g.id === gId)) {
        entry.sharedGroups.push({
          id: gId,
          name: gDoc.name || 'Group Class',
          subject: gDoc.subject || ''
        });
      }
    }
  }

  return Array.from(classmateMap.values());
};

/**
 * Checks whether a specific recipient user is an eligible classmate of the requester.
 *
 * @param {string|mongoose.Types.ObjectId} requesterUserId
 * @param {string|mongoose.Types.ObjectId} recipientUserId
 * @returns {Promise<boolean>}
 */
export const isEligibleClassmate = async (requesterUserId, recipientUserId) => {
  const rId = String(recipientUserId || '');
  if (!rId || String(requesterUserId) === rId) return false;

  const classmates = await getEligibleClassmates(requesterUserId);
  return classmates.some((c) => String(c.userId) === rId);
};

/**
 * Checks whether an ACCEPTED StudentFriendship exists between two users.
 * - Rejects self-friendship.
 * - Bidirectionally normalizes userLow/userHigh.
 * - Requires status === 'ACCEPTED'.
 * - Returns boolean.
 *
 * @param {string|mongoose.Types.ObjectId} userAId
 * @param {string|mongoose.Types.ObjectId} userBId
 * @param {object} [model=StudentFriendship]
 * @returns {Promise<boolean>}
 */
export const hasAcceptedStudentFriendship = async (userAId, userBId, model = null) => {
  const sA = String(userAId || '');
  const sB = String(userBId || '');
  if (!sA || !sB || sA === sB) return false;

  const userLow = sA < sB ? sA : sB;
  const userHigh = sA < sB ? sB : sA;

  const FriendshipModel = model || (await import('../models/StudentFriendship.js')).default;
  const friendship = await FriendshipModel.findOne({
    userLow,
    userHigh,
    status: 'ACCEPTED'
  }).lean();

  return Boolean(friendship);
};

export default {
  getEligibleClassmates,
  isEligibleClassmate,
  hasAcceptedStudentFriendship
};

