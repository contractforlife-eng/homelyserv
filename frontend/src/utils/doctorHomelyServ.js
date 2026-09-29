// frontend/src/utils/doctorHomelyServ.js
// ============================================================
// Shared helper for the Doctor CMS "HomelyServ" module.
//
// A member appointment request is a DoctorAppointment that references a
// HomelyServ User (`patientId`). Walk-in ClinicPatient appointments the
// doctor created himself (`clinicPatientId`, with no `patientId`) are
// clinical records, NOT member requests, and must never be presented as
// requests coming from HomelyServ members.
//
// Single source of truth so the module hub badge and the Requests list
// always agree. No data, no API call, no new rule — this only reuses the
// patient-source distinction already enforced by the DoctorAppointment
// model (patientId XOR clinicPatientId).
// ============================================================

export const isMemberAppointment = (appointment) => Boolean(appointment?.patientId);
