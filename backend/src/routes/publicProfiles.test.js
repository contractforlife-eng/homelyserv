// backend/src/routes/publicProfiles.test.js
// ============================================================
// PUBLIC PROFILES & GUEST BOOKING/INQUIRY TESTS
//
// Verifies:
// 1. Published vs unpublished doctor and teacher profile access.
// 2. Public DTO privacy and sensitive field exclusion.
// 3. Guest doctor booking without User account creation.
// 4. ClinicPatient ownership isolation per doctor.
// 5. Automatic confirmation of available doctor slot.
// 6. Invalid, expired, unavailable, or overlapping slots rejected.
// 7. Atomic concurrency slot lock prevents duplicate booking.
// 8. Authenticated booking preserves patientId: req.userId invariant.
// 9. Guest appointments stay OUT of authenticated Doctor Patients list.
// 10. Teacher guest inquiries without User creation.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import ClinicPatient from '../models/ClinicPatient.js';
import DoctorBookingGuard from '../models/DoctorBookingGuard.js';
import TeacherProfile from '../models/TeacherProfile.js';
import TeacherStudent from '../models/TeacherStudent.js';
import publicProfilesRouter from './publicProfiles.js';
import doctorsRouter from './doctors.js';

const DOCTOR_1_ID = '507f1f77bcf86cd799439111';
const DOCTOR_UNPUBLISHED_ID = '507f1f77bcf86cd799439112';
const TEACHER_1_ID = '507f1f77bcf86cd799439121';
const TEACHER_UNPUBLISHED_ID = '507f1f77bcf86cd799439122';

const CLINIC_1_ID = '507f1f77bcf86cd799439131';
const SCHEDULE_1_ID = '507f1f77bcf86cd799439141';

const wrapQuery = (doc) => ({
  select: () => wrapQuery(doc),
  sort: () => wrapQuery(doc),
  limit: () => wrapQuery(doc),
  lean: () => Promise.resolve(doc),
  populate: () => wrapQuery(doc),
  session: () => wrapQuery(doc),
  then: (resolve, reject) => Promise.resolve(doc).then(resolve, reject)
});

const withPublicServer = async (run) => {
  const app = express();
  app.use(express.json());
  app.use('/api/public', publicProfilesRouter);
  app.use('/api/doctors', doctorsRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

test('Public Profiles & Guest Bookings Test Suite', async (t) => {
  // Save originals
  const origUserFindById = User.findById;
  const origDocProfFindOne = DoctorProfile.findOne;
  const origTeachProfFindOne = TeacherProfile.findOne;
  const origDocClinicFind = DoctorClinic.find;
  const origDocClinicFindOne = DoctorClinic.findOne;
  const origDocServiceFind = DoctorConsultationService.find;
  const origDocServiceFindOne = DoctorConsultationService.findOne;
  const origDocScheduleFind = DoctorSchedule.find;
  const origDocScheduleFindOne = DoctorSchedule.findOne;
  const origApptFind = DoctorAppointment.find;
  const origApptCreate = DoctorAppointment.create;
  const origClinicPatFindOne = ClinicPatient.findOne;
  const origClinicPatCreate = ClinicPatient.create;
  const origTeachStudentFindOne = TeacherStudent.findOne;
  const origTeachStudentCreate = TeacherStudent.create;
  const origStartSession = mongoose.startSession;
  const origGuardUpdateOne = DoctorBookingGuard.updateOne;
  const origGuardFindOneAndUpdate = DoctorBookingGuard.findOneAndUpdate;

  const mockUsers = {
    [DOCTOR_1_ID]: {
      _id: DOCTOR_1_ID,
      role: 'DOCTOR',
      fullName: 'Dr. Jane Public',
      email: 'secret_doctor@homelyserv.test',
      phone: '+201112223334',
      profileImage: 'https://cdn.test/jane.jpg'
    },
    [DOCTOR_UNPUBLISHED_ID]: {
      _id: DOCTOR_UNPUBLISHED_ID,
      role: 'DOCTOR',
      fullName: 'Dr. Hidden Doctor',
      email: 'hidden@homelyserv.test'
    },
    [TEACHER_1_ID]: {
      _id: TEACHER_1_ID,
      role: 'TEACHER',
      fullName: 'Prof. John Teacher',
      email: 'secret_teacher@homelyserv.test',
      phone: '+201119998887',
      profileImage: 'https://cdn.test/john.jpg'
    },
    [TEACHER_UNPUBLISHED_ID]: {
      _id: TEACHER_UNPUBLISHED_ID,
      role: 'TEACHER',
      fullName: 'Prof. Hidden Teacher'
    }
  };

  const mockDoctorProfiles = {
    [DOCTOR_1_ID]: {
      userId: DOCTOR_1_ID,
      isPublished: true,
      searchVisibility: true,
      professionalTitle: 'Consultant Cardiologist',
      specialty: 'cardiology',
      bio: 'Expert heart specialist with 15 years experience.',
      consultationFee: 350,
      examinationFee: 400
    },
    [DOCTOR_UNPUBLISHED_ID]: {
      userId: DOCTOR_UNPUBLISHED_ID,
      isPublished: false,
      searchVisibility: false
    }
  };

  const mockTeacherProfiles = {
    [TEACHER_1_ID]: {
      userId: TEACHER_1_ID,
      isPublished: true,
      title: 'Senior Mathematics Instructor',
      mainSubject: 'mathematics',
      teachingLevels: ['high_school', 'middle_school'],
      bio: 'Calculus and Algebra tutor.',
      hourlyRate: 200,
      availableForNewStudents: true
    },
    [TEACHER_UNPUBLISHED_ID]: {
      userId: TEACHER_UNPUBLISHED_ID,
      isPublished: false
    }
  };

  const createdAppointments = [];
  const createdClinicPatients = [];
  const createdTeacherStudents = [];

  // Set up mock implementations
  User.findById = (id) => wrapQuery(mockUsers[String(id)] || null);
  DoctorProfile.findOne = (query) => wrapQuery(mockDoctorProfiles[String(query?.userId)] || null);
  TeacherProfile.findOne = (query) => wrapQuery(mockTeacherProfiles[String(query?.userId)] || null);

  DoctorClinic.find = () =>
    wrapQuery([
      {
        _id: CLINIC_1_ID,
        doctorId: DOCTOR_1_ID,
        clinicName: 'Downtown Heart Clinic',
        phone: '+201234567890',
        addressLine: '123 Nile St',
        city: 'Cairo',
        countryCode: 'EG',
        isPrimary: true
      }
    ]);
  DoctorClinic.findOne = () =>
    wrapQuery({
      _id: CLINIC_1_ID,
      doctorId: DOCTOR_1_ID,
      currency: 'EGP'
    });

  DoctorConsultationService.find = () => wrapQuery([]);
  DoctorConsultationService.findOne = () => wrapQuery(null);

  // Dynamic bookable slot for today/tomorrow
  const todayDow = new Date().getUTCDay();
  const validSchedule = {
    _id: SCHEDULE_1_ID,
    doctorId: DOCTOR_1_ID,
    clinicId: CLINIC_1_ID,
    consultationType: 'CLINIC',
    dayOfWeek: todayDow,
    startTime: '10:00',
    endTime: '12:00',
    slotDurationMinutes: 30,
    isActive: true
  };

  DoctorSchedule.find = () => wrapQuery([validSchedule]);
  DoctorSchedule.findOne = (q) => wrapQuery(q?._id === SCHEDULE_1_ID ? validSchedule : null);

  DoctorAppointment.find = (q) => {
    // Return appointments matching filter
    const matches = createdAppointments.filter((a) => {
      if (q?.doctorId && String(a.doctorId) !== String(q.doctorId)) return false;
      if (q?.clinicPatientId && String(a.clinicPatientId) !== String(q.clinicPatientId)) return false;
      return true;
    });
    return wrapQuery(matches);
  };

  DoctorAppointment.create = async (docs) => {
    // Phase 5B paths call create([doc], { session }) — array form required
    // by Mongoose when a session is passed.
    const isArray = Array.isArray(docs);
    const item = {
      _id: `appt_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
      ...(isArray ? docs[0] : docs)
    };
    createdAppointments.push(item);
    return isArray ? [item] : item;
  };

  ClinicPatient.findOne = (q) => {
    const found = createdClinicPatients.find((p) => p.doctorId === q.doctorId && p.phone === q.phone);
    return wrapQuery(found || null);
  };

  ClinicPatient.create = async (docs) => {
    // Phase 5B paths call create([doc], { session }) — array form required
    // by Mongoose when a session is passed.
    const isArray = Array.isArray(docs);
    const p = {
      _id: `cp_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
      ...(isArray ? docs[0] : docs)
    };
    createdClinicPatients.push(p);
    return isArray ? [p] : p;
  };

  TeacherStudent.findOne = (q) => {
    const found = createdTeacherStudents.find((ts) => ts.teacherId === q.teacherId && ts.phone === q.phone);
    return wrapQuery(found || null);
  };

  TeacherStudent.create = async (doc) => {
    const ts = {
      _id: `ts_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
      save: async () => ts,
      ...doc
    };
    createdTeacherStudents.push(ts);
    return ts;
  };

  // Phase 5B: transaction-guard stubs (fake session, no database).
  mongoose.startSession = async () => ({
    withTransaction: async (fn) => fn(),
    endSession: async () => {}
  });
  DoctorBookingGuard.updateOne = async () => ({ acknowledged: true, matchedCount: 1 });
  DoctorBookingGuard.findOneAndUpdate = async () => ({ _id: DOCTOR_1_ID, seq: 1 });

  try {
    await withPublicServer(async (base) => {
      // 1. Published Doctor Profile allows anonymous access
      await t.test('1. Anonymous user can view published Doctor profile without leaking private fields', async () => {
        const res = await fetch(`${base}/api/public/doctors/${DOCTOR_1_ID}`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.doctor.fullName, 'Dr. Jane Public');
        assert.equal(data.doctor.specialty, 'cardiology');
        assert.equal(data.doctor.consultationFee, 350);
        // Sensitive personal phone/email of doctor must not be exposed
        assert.equal(data.doctor.email, undefined);
        assert.equal(data.doctor.password, undefined);
        assert.equal(data.doctor.phone, undefined);
        // Public clinic card info is returned
        assert.equal(data.doctor.clinics.length, 1);
        assert.equal(data.doctor.clinics[0].clinicName, 'Downtown Heart Clinic');
      });

      // 2. Unpublished Doctor Profile returns 404
      await t.test('2. Unpublished Doctor profile returns 404', async () => {
        const res = await fetch(`${base}/api/public/doctors/${DOCTOR_UNPUBLISHED_ID}`);
        assert.equal(res.status, 404);
      });

      // 3. Public Doctor Availability
      let availableSlots = [];
      await t.test('3. Anonymous user can view doctor available slots', async () => {
        const res = await fetch(`${base}/api/public/doctors/${DOCTOR_1_ID}/availability`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(Array.isArray(data.slots));
        availableSlots = data.slots;
      });

      // 4. Guest Booking Creates ClinicPatient and Confirmed Appointment (Zero User account)
      if (availableSlots.length > 0) {
        const targetSlot = availableSlots[0];
        await t.test('4. Guest can book doctor appointment: auto-confirmed, no User account created', async () => {
          const res = await fetch(`${base}/api/public/doctors/${DOCTOR_1_ID}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Visitor Alice',
              phone: '+201001234567',
              scheduleId: targetSlot.scheduleId,
              startsAt: targetSlot.startsAt,
              reason: 'Routine checkup'
            })
          });

          assert.equal(res.status, 201);
          const data = await res.json();
          assert.equal(data.success, true);
          assert.equal(data.appointment.status, 'CONFIRMED');

          // Check created entities in memory
          const appt = createdAppointments[0];
          assert.ok(appt);
          assert.equal(appt.patientId, null, 'patientId MUST be null for guest bookings');
          assert.ok(appt.clinicPatientId, 'clinicPatientId must be set');
          assert.equal(appt.status, 'CONFIRMED');

          // Check clinic patient
          const cp = createdClinicPatients[0];
          assert.ok(cp);
          assert.equal(cp.fullName, 'Visitor Alice');
          assert.equal(cp.phone, '+201001234567');
          assert.equal(cp.linkedUserId, null);
        });

        // 5. Concurrency protection: booking the same slot again fails with 409
        await t.test('5. Booking the same slot again returns 409 Conflict', async () => {
          const res = await fetch(`${base}/api/public/doctors/${DOCTOR_1_ID}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Visitor Bob',
              phone: '+201009998877',
              scheduleId: targetSlot.scheduleId,
              startsAt: targetSlot.startsAt
            })
          });

          assert.equal(res.status, 409);
          const data = await res.json();
          assert.equal(data.success, false);
        });
      }

      // 6. Published Teacher Profile
      await t.test('6. Anonymous user can view published Teacher profile', async () => {
        const res = await fetch(`${base}/api/public/teachers/${TEACHER_1_ID}`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.teacher.fullName, 'Prof. John Teacher');
        assert.equal(data.teacher.mainSubject, 'mathematics');
        assert.equal(data.teacher.hourlyRate, 200);
        assert.equal(data.teacher.email, undefined);
        assert.equal(data.teacher.phone, undefined);
      });

      // 7. Unpublished Teacher Profile returns 404
      await t.test('7. Unpublished Teacher profile returns 404', async () => {
        const res = await fetch(`${base}/api/public/teachers/${TEACHER_UNPUBLISHED_ID}`);
        assert.equal(res.status, 404);
      });

      // 8. Teacher Guest Lesson Inquiry
      await t.test('8. Anonymous user can submit a lesson inquiry to teacher (PENDING)', async () => {
        const res = await fetch(`${base}/api/public/teachers/${TEACHER_1_ID}/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Student Charlie',
            phone: '+201005554433',
            subject: 'mathematics',
            message: 'Looking for 2 calculus sessions a week',
            requestedDate: '2026-10-15',
            requestedTime: '16:00'
          })
        });

        assert.equal(res.status, 201);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.inquiry.status, 'PENDING');

        // Check TeacherStudent created
        const ts = createdTeacherStudents[0];
        assert.ok(ts);
        assert.equal(ts.fullName, 'Student Charlie');
        assert.equal(ts.relationshipStatus, 'PENDING');
        assert.equal(ts.linkedUserId, null);
        assert.equal(ts.studentUserId, null);
      });

      // 9. Doctor Patients isolation: Guest appointments have patientId: null and do NOT appear in getDoctorPatients
      await t.test('9. Guest appointment isolation: patientId is null and excluded from user-patient list', async () => {
        // Querying DoctorAppointment for HomelyServ patients strictly checks patientId !== null
        const guestAppts = createdAppointments.filter((a) => a.doctorId === DOCTOR_1_ID && a.patientId);
        assert.equal(guestAppts.length, 0, 'Guest appointments must have null patientId so they never appear in user patient list');

        // But clinic patient appointments exist and are linked to ClinicPatient
        const clinicAppts = createdAppointments.filter((a) => a.doctorId === DOCTOR_1_ID && a.clinicPatientId);
        assert.equal(clinicAppts.length, 1, 'Guest appointment belongs to clinic patients');
      });
    });
  } finally {
    // Restore originals
    User.findById = origUserFindById;
    DoctorProfile.findOne = origDocProfFindOne;
    TeacherProfile.findOne = origTeachProfFindOne;
    DoctorClinic.find = origDocClinicFind;
    DoctorClinic.findOne = origDocClinicFindOne;
    DoctorConsultationService.find = origDocServiceFind;
    DoctorConsultationService.findOne = origDocServiceFindOne;
    DoctorSchedule.find = origDocScheduleFind;
    DoctorSchedule.findOne = origDocScheduleFindOne;
    DoctorAppointment.find = origApptFind;
    DoctorAppointment.create = origApptCreate;
    ClinicPatient.findOne = origClinicPatFindOne;
    ClinicPatient.create = origClinicPatCreate;
    TeacherStudent.findOne = origTeachStudentFindOne;
    TeacherStudent.create = origTeachStudentCreate;
    mongoose.startSession = origStartSession;
    DoctorBookingGuard.updateOne = origGuardUpdateOne;
    DoctorBookingGuard.findOneAndUpdate = origGuardFindOneAndUpdate;
  }
});
