import mongoose from 'mongoose';
import crypto from 'node:crypto';
import StudentLocationObservation from '../models/StudentLocationObservation.js';
import StudentTrackingSetting from '../models/StudentTrackingSetting.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import { ALLOWED_PARENT_ROLES, requireActiveParentStudentRelationship } from '../services/parentStudentService.js';
import {
  CURRENT_CONSENT_VERSION,
  LAST_KNOWN_MAX_AGE_MS,
  MAX_HISTORY_RECORDS,
  MAX_OBSERVATIONS_PER_REQUEST,
  buildRouteSegments,
  getGuardianRetention,
  getUtcDayRange,
  hasActiveGuardian,
  isValidTimeZone,
  normalizeTimeZone,
  parseCalendarDate,
  serializeObservation,
  validateObservation
} from '../services/familyTrackingService.js';
import { verifyAndroidKeyAttestation } from '../services/attestation/keyAttestationVerifier.js';
import { executeShadowAttestation, isShadowPilotEligible } from '../services/attestation/shadowAttestationService.js';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const permissionStatuses = new Set(['UNSUPPORTED', 'NOT_REQUESTED', 'DENIED', 'GRANTED_WHILE_IN_USE', 'GRANTED_BACKGROUND']);
const NATIVE_PROOF_VERSION = 'android-native-v1';
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const hashChallenge = (value) => crypto.createHash('sha256').update(value).digest('hex');
const isAdult = (dateOfBirth, now = new Date()) => {
  if (!(dateOfBirth instanceof Date) || Number.isNaN(dateOfBirth.getTime())) return false;
  const threshold = new Date(now);
  threshold.setUTCFullYear(threshold.getUTCFullYear() - 18);
  return dateOfBirth <= threshold;
};

const requireStudentSelf = (req, res) => {
  const studentId = String(req.params.studentId || '');
  if (req.userRole !== 'STUDENT' || studentId !== String(req.userId) || !isValidObjectId(studentId)) {
    res.status(403).json({ success: false, message: 'Students may only manage tracking for their own account' });
    return null;
  }
  return studentId;
};

const requireGuardianAccess = async (req, res) => {
  if (!ALLOWED_PARENT_ROLES.has(req.userRole)) {
    res.status(403).json({ success: false, message: 'An eligible guardian account is required' });
    return null;
  }
  if (!isValidObjectId(req.params.studentId)) {
    res.status(400).json({ success: false, message: 'Invalid student ID' });
    return null;
  }
  const relationship = await requireActiveParentStudentRelationship(req.userId, req.params.studentId);
  if (!relationship) {
    res.status(403).json({ success: false, message: 'An active, student-approved relationship is required' });
    return null;
  }
  return relationship;
};

const getSetting = async (studentId) => StudentTrackingSetting.findOne({ studentUserId: studentId }).lean();

const getTrackingStatusPayload = async (studentId, guardianUserId, studentView = false) => {
  const setting = await getSetting(studentId);
  const timeZone = normalizeTimeZone(setting?.timeZone);
  const lastKnownCutoff = new Date(Date.now() - LAST_KNOWN_MAX_AGE_MS);
  const [latest, student, retention] = await Promise.all([
    StudentLocationObservation.findOne({ studentUserId: studentId, recordedAt: { $gte: lastKnownCutoff } })
      .sort({ recordedAt: -1 }).lean(),
    User.findById(studentId).select('fullName profileImage').lean(),
    studentView
      ? Promise.resolve({ premium: false, retentionDays: null, earliestDate: null, todayDate: null })
      : getGuardianRetention(guardianUserId, new Date(), timeZone)
  ]);
  return {
    student: student ? { id: String(student._id), fullName: student.fullName, profileImage: student.profileImage || null } : null,
    available: true,
    activationState: setting?.activationState || 'DISABLED',
    collectionEnabled: setting?.activationState === 'ACTIVE' && setting?.collectionEnabled === true,
    permissionStatus: setting?.reportedPermissionStatus || 'NOT_REQUESTED',
    nativePermissionVerified: Boolean(setting?.nativePermissionVerifiedAt),
    ageSafeguardStatus: setting?.ageSafeguardStatus || 'REQUIRED',
    disabledReason: setting?.disabledReason || 'NOT_ACTIVATED',
    platform: setting?.platform || 'unknown',
    timeZone,
    lastReportedAt: setting?.lastReportedAt || null,
    lastLocationAt: latest?.recordedAt || null,
    premium: retention.premium,
    retentionDays: retention.retentionDays,
    earliestAvailableDate: retention.earliestDate,
    todayDate: retention.todayDate,
    lastKnownMaximumAgeHours: LAST_KNOWN_MAX_AGE_MS / (60 * 60 * 1000),
    liveTrackingImplemented: false
  };
};

export const requestTrackingActivation = async (req, res) => {
  const studentId = requireStudentSelf(req, res);
  if (!studentId) return;
  if (!await hasActiveGuardian(studentId)) {
    return res.status(409).json({ success: false, code: 'NO_ACTIVE_GUARDIAN', message: 'An active guardian relationship is required' });
  }
  if (req.body?.consentVersion !== CURRENT_CONSENT_VERSION) {
    return res.status(400).json({ success: false, code: 'CONSENT_VERSION_REQUIRED', consentVersion: CURRENT_CONSENT_VERSION });
  }
  if (!isValidTimeZone(req.body?.timeZone)) {
    return res.status(400).json({ success: false, code: 'INVALID_TIME_ZONE', message: 'A valid IANA time zone is required' });
  }
  const [profile, existingSetting] = await Promise.all([
    StudentProfile.findOne({ userId: studentId }).select('dateOfBirth').lean(),
    StudentTrackingSetting.findOne({ studentUserId: studentId }).select('ageSafeguardStatus').lean()
  ]);
  const ageSafeguardStatus = isAdult(profile?.dateOfBirth)
    ? 'VERIFIED_ADULT'
    : existingSetting?.ageSafeguardStatus === 'GUARDIAN_APPROVED' ? 'GUARDIAN_APPROVED' : 'REQUIRED';
  const challenge = crypto.randomBytes(32).toString('base64url');
  const setting = await StudentTrackingSetting.findOneAndUpdate(
    { studentUserId: studentId },
    {
      activationState: ['VERIFIED_ADULT', 'GUARDIAN_APPROVED'].includes(ageSafeguardStatus)
        ? 'AWAITING_NATIVE_VERIFICATION'
        : 'AWAITING_AGE_SAFEGUARD',
      collectionEnabled: false,
      consentVersion: CURRENT_CONSENT_VERSION,
      consentAt: new Date(),
      ageSafeguardStatus,
      reportedPermissionStatus: 'NOT_REQUESTED',
      nativePermissionVerifiedAt: null,
      platform: ['android', 'ios'].includes(req.body?.platform) ? req.body.platform : 'unknown',
      timeZone: req.body.timeZone,
      disabledReason: 'AGE_AND_NATIVE_VERIFICATION_REQUIRED',
      activationChallengeHash: hashChallenge(challenge),
      activationChallengeExpiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      lastReportedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return res.status(202).json({
    success: true,
    activationState: setting.activationState,
    collectionEnabled: false,
    challenge,
    challengeExpiresAt: setting.activationChallengeExpiresAt,
    nativeProofVersion: NATIVE_PROOF_VERSION,
    message: 'Activation is pending age safeguards and native permission verification. GPS collection remains disabled.'
  });
};

export const approveStudentTrackingSafeguard = async (req, res) => {
  const relationship = await requireGuardianAccess(req, res);
  if (!relationship) return;
  const setting = await StudentTrackingSetting.findOne({ studentUserId: req.params.studentId });
  if (!setting?.consentAt) {
    return res.status(409).json({ success: false, code: 'STUDENT_ACTIVATION_REQUIRED', message: 'The student must begin activation on their device first' });
  }
  setting.ageSafeguardStatus = 'GUARDIAN_APPROVED';
  setting.guardianApprovedAt = new Date();
  setting.guardianApprovedBy = req.userId;
  setting.activationState = 'AWAITING_NATIVE_VERIFICATION';
  setting.collectionEnabled = false;
  setting.disabledReason = 'NATIVE_VERIFICATION_REQUIRED';
  await setting.save();
  return res.json({ success: true, activationState: setting.activationState, ageSafeguardStatus: setting.ageSafeguardStatus });
};

export const completeNativeTrackingActivation = async (req, res) => {
  const studentId = requireStudentSelf(req, res);
  if (!studentId) return;

  // STAGE 1: SAFE SHADOW ATTESTATION PROBE
  // If pilot is enabled for this student, run isolated cryptographic verification
  // and log sanitized diagnostics without altering state or consuming the challenge.
  if (isShadowPilotEligible(studentId)) {
    try {
      const [settingForShadow, guardianActive] = await Promise.all([
        StudentTrackingSetting.findOne({ studentUserId: studentId })
          .select('+activationChallengeHash +activationChallengeExpiresAt +nativePublicKey')
          .lean(),
        hasActiveGuardian(studentId)
      ]);

      await executeShadowAttestation({
        studentId,
        requestBody: req.body,
        setting: settingForShadow,
        hasActiveGuardianResult: guardianActive,
        nativeProofVersion: NATIVE_PROOF_VERSION
      });
    } catch {
      // Shadow execution errors must never disrupt the response or leak exceptions
    }
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.ENABLE_ANDROID_KEY_ATTESTATION !== 'true') {
      return res.status(503).json({
        success: false,
        code: 'PRODUCTION_DEVICE_ATTESTATION_REQUIRED',
        message: 'Production activation requires an approved Android app-attestation provider'
      });
    }
    const chain = req.body?.certificateChain;
    if (!Array.isArray(chain) || chain.length === 0) {
      return res.status(403).json({
        success: false,
        code: 'HARDWARE_ATTESTATION_REQUIRED',
        message: 'Hardware-backed Android device attestation certificate chain is required in production'
      });
    }
  }
  if (!await hasActiveGuardian(studentId)) {
    return res.status(409).json({ success: false, code: 'NO_ACTIVE_GUARDIAN', message: 'Tracking requires an active guardian relationship' });
  }
  const { challenge, publicKey, signature, permissionStatus, proofVersion, certificateChain } = req.body || {};
  if (proofVersion !== NATIVE_PROOF_VERSION || permissionStatus !== 'GRANTED_BACKGROUND'
    || typeof challenge !== 'string' || typeof publicKey !== 'string' || typeof signature !== 'string') {
    return res.status(400).json({ success: false, code: 'INVALID_NATIVE_PROOF' });
  }
  const setting = await StudentTrackingSetting.findOne({ studentUserId: studentId })
    .select('+activationChallengeHash +activationChallengeExpiresAt +nativePublicKey');
  if (!setting || setting.activationState !== 'AWAITING_NATIVE_VERIFICATION'
    || !['VERIFIED_ADULT', 'GUARDIAN_APPROVED'].includes(setting.ageSafeguardStatus)
    || !setting.activationChallengeExpiresAt || setting.activationChallengeExpiresAt <= new Date()
    || setting.activationChallengeHash !== hashChallenge(challenge)) {
    return res.status(409).json({ success: false, code: 'ACTIVATION_NOT_READY' });
  }
  if (setting.nativePublicKey && setting.nativePublicKey !== publicKey) {
    return res.status(409).json({ success: false, code: 'NATIVE_KEY_MISMATCH' });
  }

  // If certificateChain is provided, verify hardware-backed key attestation
  if (Array.isArray(certificateChain) && certificateChain.length > 0) {
    const attestationResult = await verifyAndroidKeyAttestation({
      certificateChain,
      expectedChallenge: challenge
    });
    if (!attestationResult.valid) {
      return res.status(403).json({
        success: false,
        code: attestationResult.code || 'ATTESTATION_VERIFICATION_FAILED',
        message: attestationResult.message || 'Hardware attestation verification failed'
      });
    }
  }

  const payload = `${NATIVE_PROOF_VERSION}\n${studentId}\n${challenge}\n${permissionStatus}`;
  let verified = false;
  try {
    verified = crypto.verify('sha256', Buffer.from(payload), crypto.createPublicKey(publicKey), Buffer.from(signature, 'base64'));
  } catch {
    verified = false;
  }
  if (!verified) return res.status(403).json({ success: false, code: 'INVALID_NATIVE_SIGNATURE' });

  setting.nativePublicKey = publicKey;
  setting.nativeKeyRegisteredAt ||= new Date();
  setting.nativePermissionVerifiedAt = new Date();
  setting.reportedPermissionStatus = permissionStatus;
  setting.permissionReportedAt = new Date();
  setting.platform = 'android';
  setting.activationState = 'ACTIVE';
  setting.collectionEnabled = true;
  setting.activatedAt = new Date();
  setting.disabledReason = null;
  setting.activationChallengeHash = null;
  setting.activationChallengeExpiresAt = null;
  setting.lastReportedAt = new Date();
  await setting.save();
  return res.json({ success: true, activationState: 'ACTIVE', collectionEnabled: true });
};

export const disableTracking = async (req, res) => {
  const studentId = requireStudentSelf(req, res);
  if (!studentId) return;
  await StudentTrackingSetting.updateOne({ studentUserId: studentId }, {
    $set: {
      activationState: 'DISABLED', collectionEnabled: false, pausedAt: new Date(), disabledReason: 'STUDENT_DISABLED',
      nativePermissionVerifiedAt: null, reportedPermissionStatus: 'NOT_REQUESTED', activationChallengeHash: null,
      activationChallengeExpiresAt: null, nativePublicKey: null, nativeKeyRegisteredAt: null
    }
  }, { upsert: true });
  return res.json({ success: true, activationState: 'DISABLED', collectionEnabled: false });
};

export const reportTrackingStatus = async (req, res) => {
  const studentId = requireStudentSelf(req, res);
  if (!studentId) return;
  const permissionStatus = req.body?.permissionStatus;
  if (!permissionStatuses.has(permissionStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid permission status' });
  }
  const permissionGranted = String(permissionStatus).startsWith('GRANTED_');
  const update = {
    reportedPermissionStatus: permissionStatus,
    permissionReportedAt: new Date(),
    platform: ['android', 'ios'].includes(req.body?.platform) ? req.body.platform : 'unknown',
    lastReportedAt: new Date()
  };
  if (!permissionGranted) {
    Object.assign(update, {
      activationState: permissionStatus === 'DENIED' ? 'PAUSED' : 'DISABLED',
      collectionEnabled: false,
      nativePermissionVerifiedAt: null,
      pausedAt: new Date(),
      disabledReason: permissionStatus === 'DENIED' ? 'PERMISSION_REVOKED' : 'PERMISSION_UNAVAILABLE'
    });
  } else {
    Object.assign(update, {
      activationState: 'AWAITING_NATIVE_VERIFICATION',
      collectionEnabled: false,
      nativePermissionVerifiedAt: null,
      disabledReason: 'NATIVE_VERIFICATION_REQUIRED'
    });
  }
  const setting = await StudentTrackingSetting.findOneAndUpdate(
    { studentUserId: studentId }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return res.json({ success: true, activationState: setting.activationState, collectionEnabled: false });
};

export const pauseTracking = async (req, res) => {
  const studentId = requireStudentSelf(req, res);
  if (!studentId) return;
  await StudentTrackingSetting.updateOne(
    { studentUserId: studentId },
    { $set: { activationState: 'PAUSED', collectionEnabled: false, pausedAt: new Date(), disabledReason: 'STUDENT_PAUSED' } },
    { upsert: true }
  );
  return res.json({ success: true, activationState: 'PAUSED', collectionEnabled: false });
};

export const receiveLocationObservations = async (req, res) => {
  const studentId = requireStudentSelf(req, res);
  if (!studentId) return;
  if (!await hasActiveGuardian(studentId)) {
    await StudentTrackingSetting.updateOne(
      { studentUserId: studentId },
      { $set: { activationState: 'DISABLED', collectionEnabled: false, disabledReason: 'NO_ACTIVE_GUARDIAN' } }
    );
    return res.status(409).json({ success: false, code: 'NO_ACTIVE_GUARDIAN', message: 'Tracking requires an active guardian relationship' });
  }
  const setting = await getSetting(studentId);
  if (
    setting?.activationState !== 'ACTIVE'
    || setting?.collectionEnabled !== true
    || !setting?.nativePermissionVerifiedAt
    || !['VERIFIED_ADULT', 'GUARDIAN_APPROVED'].includes(setting?.ageSafeguardStatus)
    || !String(setting?.reportedPermissionStatus).startsWith('GRANTED_')
  ) {
    return res.status(409).json({ success: false, code: 'TRACKING_NOT_ACTIVE', message: 'Tracking activation is incomplete or paused' });
  }
  const inputs = Array.isArray(req.body?.observations) ? req.body.observations : [req.body];
  if (inputs.length === 0 || inputs.length > MAX_OBSERVATIONS_PER_REQUEST) {
    return res.status(400).json({ success: false, message: `Submit between 1 and ${MAX_OBSERVATIONS_PER_REQUEST} observations` });
  }
  const now = new Date();
  const validated = inputs.map((input) => validateObservation(input, now));
  const invalidIndex = validated.findIndex((item) => !item.valid);
  if (invalidIndex >= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid location observation',
      observationIndex: invalidIndex,
      invalidFields: validated[invalidIndex].errors
    });
  }
  const receivedAt = new Date();
  const unique = new Map(validated.map(({ value }) => [value.observationId, value]));
  const result = await StudentLocationObservation.bulkWrite(
    [...unique.values()].map((value) => ({
      updateOne: {
        filter: { studentUserId: studentId, observationId: value.observationId },
        update: { $setOnInsert: { studentUserId: studentId, ...value, receivedAt } },
        upsert: true
      }
    })),
    { ordered: false }
  );
  const insertedCount = result.upsertedCount || 0;
  return res.status(201).json({
    success: true,
    acceptedCount: insertedCount,
    duplicateCount: inputs.length - insertedCount
  });
};

export const getTrackingStatus = async (req, res) => {
  const studentSelf = req.userRole === 'STUDENT' && String(req.userId) === String(req.params.studentId);
  if (!studentSelf && !await requireGuardianAccess(req, res)) return;
  if (studentSelf && !await hasActiveGuardian(req.params.studentId)) {
    await StudentTrackingSetting.updateOne({ studentUserId: req.params.studentId }, {
      $set: { activationState: 'DISABLED', collectionEnabled: false, disabledReason: 'NO_ACTIVE_GUARDIAN' }
    });
    return res.status(409).json({ success: false, code: 'NO_ACTIVE_GUARDIAN', message: 'An active guardian relationship is required' });
  }
  return res.json({ success: true, status: await getTrackingStatusPayload(req.params.studentId, req.userId, studentSelf) });
};

export const getLastKnownLocation = async (req, res) => {
  if (!await requireGuardianAccess(req, res)) return;
  const cutoff = new Date(Date.now() - LAST_KNOWN_MAX_AGE_MS);
  const latest = await StudentLocationObservation.findOne({
    studentUserId: req.params.studentId,
    recordedAt: { $gte: cutoff }
  }).sort({ recordedAt: -1 }).lean();
  return res.json({
    success: true,
    location: latest ? serializeObservation(latest) : null,
    maximumAgeHours: LAST_KNOWN_MAX_AGE_MS / (60 * 60 * 1000)
  });
};

const getHistoryForDay = async (req, res, selectedDate) => {
  const setting = await getSetting(req.params.studentId);
  const timeZone = normalizeTimeZone(setting?.timeZone);
  const retention = await getGuardianRetention(req.userId, new Date(), timeZone);
  const day = selectedDate || retention.todayDate;
  if (day < retention.earliestDate || day > retention.todayDate) {
    return res.status(403).json({
      success: false,
      message: `Location history is available for ${retention.retentionDays} days on your plan`,
      retentionDays: retention.retentionDays
    });
  }
  const range = getUtcDayRange(day, timeZone);
  const rows = await StudentLocationObservation.find({
    studentUserId: req.params.studentId,
    recordedAt: { $gte: range.start, $lt: range.end }
  }).sort({ recordedAt: 1 }).limit(MAX_HISTORY_RECORDS).lean();
  const observations = rows.map(serializeObservation);
  return res.json({
    success: true,
    date: day,
    timeZone,
    observations,
    routeSegments: buildRouteSegments(observations),
    truncated: rows.length === MAX_HISTORY_RECORDS,
    retentionDays: retention.retentionDays,
    premium: retention.premium
  });
};

export const getTodayHistory = async (req, res) => {
  if (!await requireGuardianAccess(req, res)) return;
  return getHistoryForDay(req, res, null);
};

export const getHistoricalDay = async (req, res) => {
  if (!await requireGuardianAccess(req, res)) return;
  const selectedDate = parseCalendarDate(req.params.date);
  if (!selectedDate) return res.status(400).json({ success: false, message: 'Date must use YYYY-MM-DD' });
  return getHistoryForDay(req, res, selectedDate);
};
