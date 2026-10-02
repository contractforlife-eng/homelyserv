// backend/src/services/doctorSearchService.js
// ============================================================
// HOMELYSERV DOCTOR SEARCH — shared doctor card construction.
//
// WHY THIS FILE EXISTS: the Doctor card logic (public DoctorProfile data +
// primary active DoctorClinic, gated on the doctor's EXISTING opt-in flags)
// already existed inline in routes/employer.js and was used to attach a
// `doctor` card to DOCTOR rows in Employer Search.
//
// "Find a Doctor" inside My Medical Profile needs the SAME card for
// WORKER / EMPLOYER / TEACHER / STUDENT, who cannot call
// GET /api/employer/search (requireEmployer).
//
// So the logic is EXTRACTED here verbatim — not rewritten and not
// duplicated — so both entry points share one visibility rule and one
// field allow-list. Employer Search behaviour is unchanged: it imports
// these exact functions and applies them to the same result rows.
//
// VISIBILITY (unchanged, never bypassed): a doctor appears ONLY when
// DoctorProfile.isPublished OR DoctorProfile.searchVisibility is set.
// Schedule/availability is deliberately NOT part of this card.
// ============================================================
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import User from '../models/User.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import { getPublicVerification } from './profileVerificationService.js';

// The ONLY DoctorProfile fields ever exposed on a public/search card.
export const DOCTOR_CARD_FIELDS =
  'userId professionalTitle specialty additionalSpecialties subspecialty bio yearsOfExperience languages profileImage examinationFee consultationFee isPublished searchVisibility';

const CLINIC_CARD_FIELDS = 'doctorId clinicName addressLine city countryCode isPrimary';

const idOf = (obj) => String(obj?._id || obj?.id || obj?.userId || '');

/**
 * Attach `doctor` cards onto DOCTOR rows of an existing result list.
 * Exactly two batched queries, only for DOCTOR rows (no N+1).
 *
 * Attach `doctor` cards onto DOCTOR rows of an existing result list.
 * Exactly two batched queries, only for DOCTOR rows (no N+1).
 *
 * Build one public doctor card from a User row + the batched profile/clinic
 * maps. Returns undefined when the doctor is hidden or has no profile, so
 * callers can simply skip the entry.
 */
export const buildDoctorCard = (userObj, doctorProfileByUserId, primaryClinicByDoctorId) => {
  const profile = doctorProfileByUserId.get(idOf(userObj));
  if (!profile) return undefined;
  // Existing opt-in gate — a doctor who has not opted in never appears.
  if (!profile.isPublished && !profile.searchVisibility) return undefined;

  const clinic = primaryClinicByDoctorId.get(String(profile.userId)) || null;

  return {
    id: idOf(userObj),
    fullName: userObj.fullName || '',
    profileImage: userObj.profileImage || profile.profileImage || '',
    professionalTitle: profile.professionalTitle || '',
    specialty: profile.specialty || '',
    additionalSpecialties: Array.isArray(profile.additionalSpecialties) ? profile.additionalSpecialties : [],
    subspecialty: profile.subspecialty || '',
    bio: profile.bio || '',
    yearsOfExperience: profile.yearsOfExperience ?? null,
    languages: Array.isArray(profile.languages) ? profile.languages : [],
    // Authoritative doctor-owned fees (never DoctorConsultationService prices).
    examinationFee: Number(profile.examinationFee) || 0,
    consultationFee: Number(profile.consultationFee) || 0,
    verification: getPublicVerification(userObj),
    isVerified: userObj.verifiedProfileStatus === 'VERIFIED',
    clinic: clinic
      ? {
          clinicName: clinic.clinicName || '',
          addressLine: clinic.addressLine || '',
          city: clinic.city || '',
          countryCode: clinic.countryCode || '',
          isPrimary: clinic.isPrimary === true
        }
      : null
  };
};

/**
 * Attach `doctor` cards onto DOCTOR rows of an existing result list.
 * Exactly two batched queries, only for DOCTOR rows (no N+1).
 *
 * `premiumIds` is an OPTIONAL pre-resolved Set of user ids with an active
 * Premium entitlement. When provided (and only then), each card carries an
 * `isPremium` Boolean — the SAME batched pattern Employer Search already
 * uses for workers (premiumService.getActivePremiumUserIds). The flag is
 * server-computed, never client-supplied; when omitted the card shape is
 * unchanged, so existing consumers are unaffected.
 */
export const attachDoctorCards = async (resultList, { premiumIds = null } = {}) => {
  const doctorUserIds = resultList
    .filter((worker) => worker.role === 'DOCTOR')
    .map((worker) => idOf(worker))
    .filter(Boolean);

  if (doctorUserIds.length === 0) return;

  const [doctorProfiles, doctorClinics] = await Promise.all([
    DoctorProfile.find({ userId: { $in: doctorUserIds } })
      .select(DOCTOR_CARD_FIELDS)
      .lean(),
    DoctorClinic.find({ doctorId: { $in: doctorUserIds }, isActive: true })
      .select(CLINIC_CARD_FIELDS)
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean()
  ]);

  const doctorProfileByUserId = new Map(doctorProfiles.map((profile) => [String(profile.userId), profile]));
  const primaryClinicByDoctorId = new Map();
  doctorClinics.forEach((clinic) => {
    const key = String(clinic.doctorId);
    if (!primaryClinicByDoctorId.has(key)) primaryClinicByDoctorId.set(key, clinic);
  });

  resultList.forEach((userObj) => {
    const card = buildDoctorCard(userObj, doctorProfileByUserId, primaryClinicByDoctorId);
    if (!card) return;
    // Optional Premium flag only. When the caller pre-resolved active
    // Premium entitlements it is attached here, server-side, as a Boolean.
    if (premiumIds !== null) {
      card.isPremium = premiumIds.has(idOf(userObj));
    }
    userObj.doctor = card;
  });
};

export const escapeRegExp = (string) => {
  if (!string) return '';
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Is this user a DOCTOR who is currently VISIBLE in Doctor Search?
 *
 * Reuses the ONE existing visibility rule (DoctorProfile.isPublished ||
 * searchVisibility) so booking can never expose a doctor the patient could not
 * already find. Returns { user, profile }, or null when not discoverable.
 */
export const getSearchableDoctorProfile = async (doctorUserId) => {
  if (!doctorUserId) return null;
  const user = await User.findById(doctorUserId).select('_id role fullName profileImage');
  if (!user || String(user.role || '').toUpperCase() !== 'DOCTOR') return null;

  const profile = await DoctorProfile.findOne({ userId: doctorUserId })
    .select(DOCTOR_CARD_FIELDS)
    .lean();
  if (!profile) return null;
  if (!profile.isPublished && !profile.searchVisibility) return null;
  return { user, profile };
};

const timeToMinutes = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

/**
 * Expand a doctor's ACTIVE DoctorSchedule rows into concrete bookable slots.
 *
 * A schedule is a weekly rule (dayOfWeek + startTime..endTime + slotDuration).
 * This turns the next `days` calendar days into real [startsAt, endsAt) windows
 * and drops any that already began or overlap a live appointment, so a slot
 * shown as available can never silently be double-booked.
 *
 * Returns booking-relevant fields only — no doctor private/admin data.
 */
export const listAvailableSlots = async (doctorUserId, { days = 14, now = new Date(), booked = [] } = {}) => {
  const schedules = await DoctorSchedule.find({ doctorId: doctorUserId, isActive: true })
    .select('dayOfWeek startTime endTime slotDurationMinutes consultationType clinicId serviceId')
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean();

  if (!Array.isArray(schedules) || schedules.length === 0) return [];

  const slots = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
    const dow = day.getUTCDay();

    for (const schedule of schedules) {
      if (Number(schedule.dayOfWeek) !== dow) continue;

      const stepMinutes = Number(schedule.slotDurationMinutes) > 0 ? Number(schedule.slotDurationMinutes) : 30;
      const startMin = timeToMinutes(schedule.startTime);
      const endMin = timeToMinutes(schedule.endTime);

      for (let cursor = startMin; cursor + stepMinutes <= endMin; cursor += stepMinutes) {
        const startsAt = new Date(day.getTime() + (cursor * 60 * 1000));
        const endsAt = new Date(startsAt.getTime() + (stepMinutes * 60 * 1000));
        if (startsAt.getTime() <= now.getTime()) continue;

        const taken = booked.some(
          (a) => a.startsAt.getTime() < endsAt.getTime() && a.endsAt.getTime() > startsAt.getTime()
        );
        if (taken) continue;

        slots.push({
          scheduleId: String(schedule._id),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          consultationType: schedule.consultationType,
          clinicId: schedule.clinicId ? String(schedule.clinicId) : null,
          serviceId: schedule.serviceId ? String(schedule.serviceId) : null,
          durationMinutes: stepMinutes
        });
      }
    }
  }
  return slots.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
};
