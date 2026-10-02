// frontend/src/pages/MedicalProfile.jsx
// My Medical Profile (Phase 6).
// Shared by WORKER, EMPLOYER, TEACHER, STUDENT.
// Premium-only self-service medical profile editor.
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import useAuthStore from '../store/authStore';
import VerifiedBadge from '../components/verification/VerifiedBadge';
// Same canonical Doctor specialty list the Doctor profile/registration surface
// uses. NOT a second hardcoded list — values, labels and ordering come from
// the single shared constant, and the placeholder reuses the existing
// `doctorProfile.selectSpecialty` key so no new translations are introduced.
import { DOCTOR_SPECIALTIES, getDoctorSpecialtyLabel } from '../constants/doctorSpecialties';
import api from '../utils/api';
import {
  Heart,
  Crown,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Shield,
  Phone,
  User,
  ArrowRight,
  Info,
  Loader2,
  Save,
  X,
  FileText,
  History,
  Pill,
  Search,
  Stethoscope,
  Languages,
  MapPin,
  Award,
  Building2,
  Wallet
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];


// Shared field styling, matching the existing Medical Profile inputs.
const SEARCH_INPUT_CLS =
  'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500';
const SEARCH_LABEL_CLS = 'block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5';

/**
 * FIND A DOCTOR — patient-facing discovery section.
 *
 * Rendered as a tab for Premium users AND directly under the paywall for
 * non-Premium users, because Doctor search is a discovery function and is
 * deliberately NOT Premium-gated.
 *
 * Calls the authenticated /api/doctor-search/doctors endpoint, which returns
 * PUBLIC doctor card data only (same isPublished / searchVisibility opt-in
 * gate as Employer Search). No patient or private data is involved.
 */
const FindADoctorSection = () => {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  // The patient's own requests, so a PENDING booking is visibly waiting for
  // doctor confirmation. Strictly the signed-in user's own data.
  useEffect(() => {
    let cancelled = false;
    api.get('/api/doctor-search/doctors/appointments/mine')
      .then((res) => {
        if (!cancelled) setMyAppointments(Array.isArray(res.data?.appointments) ? res.data.appointments : []);
      })
      .catch(() => { if (!cancelled) setMyAppointments([]); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const searchDoctors = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/doctor-search/doctors', {
        params: {
          ...(q.trim() ? { q: q.trim() } : {}),
          ...(specialty.trim() ? { specialty: specialty.trim() } : {}),
          ...(country.trim() ? { country: country.trim() } : {}),
          ...(city.trim() ? { city: city.trim() } : {})
        }
      });
      setDoctors(Array.isArray(res.data?.doctors) ? res.data.doctors : []);
      setSearched(true);
    } catch (err) {
      console.error('Error searching doctors:', err);
      setDoctors([]);
      setSearched(true);
      setError(err.response?.data?.message || t('findADoctor.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('findADoctor.title') || 'Find a Doctor'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('findADoctor.subtitle') ||
            'Search HomelyServ doctors by name, specialty, country, or city.'}
        </p>
      </div>
      <DoctorSearchForm
        q={q} setQ={setQ}
        specialty={specialty} setSpecialty={setSpecialty}
        country={country} setCountry={setCountry}
        city={city} setCity={setCity}
        loading={loading} onSubmit={searchDoctors}
      />
      <DoctorSearchResults
        doctors={doctors} loading={loading} searched={searched} error={error}
        onBook={setBookingDoctor}
      />
      <MyDoctorAppointments appointments={myAppointments} />
      {bookingDoctor && (
        <BookAppointmentModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onBooked={() => { setBookingDoctor(null); setReloadKey((k) => k + 1); }}
        />
      )}
    </div>
  );
};

/** Search controls for Find a Doctor. */
const DoctorSearchForm = ({ q, setQ, specialty, setSpecialty, country, setCountry, city, setCity, loading, onSubmit }) => {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className={SEARCH_LABEL_CLS} htmlFor="doctor-q">
          {t('findADoctor.searchPlaceholder') || 'Search by doctor name'}
        </label>
        <input
          id="doctor-q"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('findADoctor.searchPlaceholder') || 'Search by doctor name'}
          className={SEARCH_INPUT_CLS}
        />
      </div>
      <div>
        <label className={SEARCH_LABEL_CLS} htmlFor="doctor-specialty">
          {t('findADoctor.specialty') || 'Specialty'}
        </label>
        <select
          id="doctor-specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className={SEARCH_INPUT_CLS}
        >
          <option value="">
            {t('doctorProfile.selectSpecialty') || '-- Select Medical Specialty --'}
          </option>
          {DOCTOR_SPECIALTIES.map((spec) => (
            <option key={spec.value} value={spec.value}>
              {t(spec.labelKey, spec.value)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={SEARCH_LABEL_CLS} htmlFor="doctor-country">
          {t('findADoctor.country') || 'Country'}
        </label>
        <input id="doctor-country" type="text" value={country}
          onChange={(e) => setCountry(e.target.value)} className={SEARCH_INPUT_CLS} />
      </div>
      <div>
        <label className={SEARCH_LABEL_CLS} htmlFor="doctor-city">
          {t('findADoctor.city') || 'City'}
        </label>
        <input id="doctor-city" type="text" value={city}
          onChange={(e) => setCity(e.target.value)} className={SEARCH_INPUT_CLS} />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={16} />}
          {t('findADoctor.search') || 'Search'}
        </button>
      </div>
    </form>
  );
};

/**
 * A single Doctor result card.
 *
 * One component serves BOTH states: the normal card is a clean, professional
 * medical card, and a Premium doctor gets the same structure with a restrained
 * radiant-purple treatment (static glow + border gradient + badge + avatar
 * highlight). No animation, so it never harms performance or causes motion.
 *
 * `isPremium` comes from the server-computed flag on the card — it is never
 * derived from ids, names, emails or any client-side heuristic.
 */
const DoctorCard = ({ doc, onBook }) => {
  const { t } = useTranslation();
  const isPremium = doc.isPremium === true;

  const shellCls = isPremium
    ? 'relative rounded-2xl border-2 border-purple-400 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_26px_rgba(168,85,247,0.45)] transition-shadow'
    : 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm';

  const innerCls = 'p-4';

  const avatarRingCls = isPremium
    ? 'w-14 h-14 rounded-xl ring-4 ring-violet-300/70 dark:ring-violet-700/70 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 flex items-center justify-center flex-shrink-0'
    : 'w-14 h-14 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center flex-shrink-0';

  const chipCls = isPremium
    ? 'inline-flex items-center gap-1.5 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300'
    : 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300';

  const specialties = [doc.subspecialty, ...(Array.isArray(doc.additionalSpecialties) ? doc.additionalSpecialties : [])]
    .filter(Boolean)
    .map((value) => getDoctorSpecialtyLabel(value, '', t));

  return (
    <li>
      <div className={shellCls}>
        <div className={innerCls}>
          {/* Header: avatar + identity + badges */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              {doc.profileImage ? (
                <img
                  src={doc.profileImage}
                  alt={doc.fullName}
                  className={`h-14 w-14 rounded-xl object-cover ${isPremium ? 'ring-4 ring-violet-300/70 dark:ring-violet-700/70' : 'ring-1 ring-slate-200 dark:ring-slate-700'}`}
                />
              ) : (
                <div className={avatarRingCls}>
                  <User className="h-7 w-7" />
                </div>
              )}
              {isPremium && (
                <span
                  className="absolute -bottom-1.5 -right-1.5 rounded-full bg-violet-600 p-1.5 shadow-lg ring-2 ring-white dark:ring-slate-900"
                  aria-hidden="true"
                >
                  <Crown size={12} className="text-white" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                  Dr. {doc.fullName}
                </p>
                <VerifiedBadge
                  verification={doc.verification || { isVerified: doc.isVerified }}
                  isVerified={doc.isVerified}
                  size="xs"
                />
                {isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    <Crown size={10} className="flex-shrink-0" />
                    {t('findADoctor.premium') || 'Premium'}
                  </span>
                )}
              </div>
              {doc.professionalTitle && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {doc.professionalTitle}
                </p>
              )}
            </div>
          </div>

          {/* Main specialty */}
          {doc.specialty && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <Stethoscope size={15} className={isPremium ? 'flex-shrink-0 text-violet-600 dark:text-violet-400' : 'flex-shrink-0 text-red-500'} />
              <span>{getDoctorSpecialtyLabel(doc.specialty, doc.subspecialty || '', t)}</span>
            </p>
          )}

          {/* Subspecialty / additional specialties */}
          {specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {specialties.map((label, index) => (
                <span
                  key={`${doc.id}-sp-${index}`}
                  className="inline-flex max-w-full items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Professional info blocks */}
          <div className="mt-3 flex flex-wrap gap-2">
            {doc.yearsOfExperience != null && (
              <span className={chipCls}>
                <Award size={13} className="flex-shrink-0" />
                {t('findADoctor.experience') || 'Experience'}: {doc.yearsOfExperience}
              </span>
            )}
            {doc.consultationFee > 0 && (
              <span className={chipCls}>
                <Stethoscope size={13} className="flex-shrink-0" />
                {t('findADoctor.consultationFee') || 'Consultation Fee'}: {doc.consultationFee}
              </span>
            )}
            {doc.examinationFee > 0 && (
              <span className={chipCls}>
                <Wallet size={13} className="flex-shrink-0" />
                {t('findADoctor.examinationFee') || 'Examination Fee'}: {doc.examinationFee}
              </span>
            )}
          </div>

          {/* Languages (kept exactly as stored — free text) */}
          {Array.isArray(doc.languages) && doc.languages.length > 0 && (
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Languages size={14} className="mt-px flex-shrink-0" />
              <span>
                {t('findADoctor.languages') || 'Languages'}: {doc.languages.join(', ')}
              </span>
            </p>
          )}

          {/* Clinic — name, city, country (user data, never translated) */}
          {doc.clinic && (doc.clinic.clinicName || doc.clinic.city) && (
            <p className="mt-1.5 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Building2 size={14} className="mt-px flex-shrink-0" />
              <span>
                {[doc.clinic.clinicName, [doc.clinic.city, doc.clinic.countryCode].filter(Boolean).join(', ')]
                  .filter(Boolean)
                  .join(' — ')}
              </span>
            </p>
          )}

          {doc.bio && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{doc.bio}</p>
          )}

          {/* Primary CTA */}
          <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onBook?.(doc)}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto ${
                isPremium
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 focus:ring-violet-500'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              }`}
            >
              <Calendar size={16} />
              {t('findADoctor.bookAppointment') || 'Book Appointment'}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};
/** Doctor result cards for Find a Doctor (public card data only). */
const DoctorSearchResults = ({ doctors, loading, searched, error, onBook }) => {
  const { t } = useTranslation();
  if (error) {
    return (
      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
        <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {t('findADoctor.loading') || 'Searching doctors...'}
        </p>
      </div>
    );
  }
  if (searched && doctors.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
        {t('findADoctor.noResults') || 'No doctors found.'}
      </p>
    );
  }
  if (doctors.length === 0) return null;
  return (
    <ul className="space-y-3">
      {doctors.map((doc) => (
        <DoctorCard key={doc.id} doc={doc} onBook={onBook} />
      ))}
    </ul>
  );
};

const BOOK_INPUT_CLS =
  'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100';

/** Date/time/reason picker inside the booking modal. */
const BookingSlotPicker = ({ dates, selectedDate, setSelectedDate, timesForDate, selectedSlot, setSelectedSlot, reason, setReason, fmtTime }) => {
  const { t } = useTranslation();
  return (
    <>
      <div>
        <label className={SEARCH_LABEL_CLS} htmlFor="book-date">
          {t('findADoctor.selectDate') || 'Select Date'}
        </label>
        <select id="book-date" value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
          className={BOOK_INPUT_CLS}>
          <option value="">{t('findADoctor.selectDate') || 'Select Date'}</option>
          {dates.map((d) => (<option key={d} value={d}>{d}</option>))}
        </select>
      </div>
      {selectedDate && (
        <div>
          <label className={SEARCH_LABEL_CLS} htmlFor="book-time">
            {t('findADoctor.selectTime') || 'Select Time'}
          </label>
          <select id="book-time" value={selectedSlot?.startsAt || ''}
            onChange={(e) => setSelectedSlot(timesForDate.find((s) => s.startsAt === e.target.value) || null)}
            className={BOOK_INPUT_CLS}>
            <option value="">{t('findADoctor.selectTime') || 'Select Time'}</option>
            {timesForDate.map((s) => (
              <option key={s.startsAt} value={s.startsAt}>{fmtTime(s.startsAt)}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className={SEARCH_LABEL_CLS} htmlFor="book-reason">
          {t('findADoctor.reason') || 'Reason (optional)'}
        </label>
        <input id="book-reason" type="text" value={reason}
          onChange={(e) => setReason(e.target.value)} className={BOOK_INPUT_CLS} />
      </div>
    </>
  );
};

/**
 * BOOK APPOINTMENT — a HomelyServ user books themselves with a doctor.
 *
 * Only slots published by the doctor's ACTIVE DoctorSchedule are offered; the
 * server re-validates the slot and derives `patientId` from the session, so the
 * client cannot choose a patient, a doctor, or a price.
 */
const BookAppointmentModal = ({ doctor, onClose, onBooked }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState([]);
  const [consultationFee, setConsultationFee] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/api/doctor-search/doctors/${doctor.id}/availability`)
      .then((res) => {
        if (cancelled) return;
        setSlots(Array.isArray(res.data?.slots) ? res.data.slots : []);
        setConsultationFee(Number(res.data?.consultationFee) || 0);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || t('findADoctor.bookingFailed'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [doctor?.id, t]);

  const dates = [...new Set(slots.map((s) => String(s.startsAt).slice(0, 10)))];
  const timesForDate = selectedDate
    ? slots.filter((s) => String(s.startsAt).slice(0, 10) === selectedDate)
    : [];

  const submit = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/api/doctor-search/doctors/${doctor.id}/appointments`, {
        scheduleId: selectedSlot.scheduleId,
        startsAt: selectedSlot.startsAt,
        reason: reason.trim() || undefined
      });
      setSuccess(true);
      setTimeout(() => onBooked?.(), 1200);
    } catch (err) {
      setError(err.response?.data?.message || t('findADoctor.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('findADoctor.bookAppointment') || 'Book Appointment'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dr. {doctor.fullName}</p>
            {consultationFee > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('findADoctor.consultationFee') || 'Consultation Fee'}: {consultationFee}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {t('findADoctor.loadingAvailability') || 'Loading availability...'}
            </p>
          </div>
        )}
        {!loading && success && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {t('findADoctor.bookingSuccess') || 'Booking successful.'}
            </p>
          </div>
        )}
        {!loading && !success && (
          <div className="space-y-3">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            )}
            {slots.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                {t('findADoctor.noAvailability') || 'No available appointments.'}
              </p>
            ) : (
              <BookingSlotPicker
                dates={dates}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                timesForDate={timesForDate}
                selectedSlot={selectedSlot}
                setSelectedSlot={setSelectedSlot}
                reason={reason}
                setReason={setReason}
                fmtTime={fmtTime}
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('doctorCms.accountsCancel') || 'Cancel'}
              </button>
              <button type="button" onClick={submit} disabled={!selectedSlot || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('findADoctor.confirmBooking') || 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * MY DOCTOR APPOINTMENTS — the patient's own requests.
 * A PENDING row says it is waiting for doctor confirmation, because the
 * patient only enters the Doctor's Patients list once the doctor confirms
 * (the existing CONFIRMED/COMPLETED relationship rule, unchanged).
 */
const MyDoctorAppointments = ({ appointments }) => {
  const { t } = useTranslation();
  if (!Array.isArray(appointments) || appointments.length === 0) return null;
  const fmt = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
  };
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        {t('findADoctor.myAppointments') || 'My Appointments'}
      </h3>
      <ul className="space-y-2">
        {appointments.map((a) => (
          <li key={a._id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {a.doctor ? `Dr. ${a.doctor.fullName}` : '-'}
              </p>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {a.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{fmt(a.startsAt)}</p>
            {a.clinic?.clinicName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {a.clinic.clinicName}{a.clinic.city ? ` - ${a.clinic.city}` : ''}
              </p>
            )}
            {a.feeSnapshot > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('findADoctor.consultationFee') || 'Consultation Fee'}: {a.feeSnapshot} {a.currency}
              </p>
            )}
            {a.status === 'PENDING' && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t('findADoctor.pendingConfirmation') || 'Waiting for doctor confirmation.'}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const MedicalProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPremiumDenied, setIsPremiumDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Phase 8: Tab switching between Profile and Clinical Consultations
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'consultations' | 'prescriptions'
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Phase 9: Patient Prescriptions (read-only, ISSUED only)
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    sex: '',
    bloodGroup: '',
    heightCm: '',
    weightKg: '',
    chronicConditions: [],
    allergies: [],
    currentMedications: [],
    surgeries: [],
    familyHistory: '',
    smokingStatus: '',
    disabilityStatus: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    consentToShareWithDoctors: false
  });

  // Array input draft states
  const [conditionDraft, setConditionDraft] = useState('');
  const [allergyDraft, setAllergyDraft] = useState('');
  const [medicationDraft, setMedicationDraft] = useState('');
  const [surgeryDraft, setSurgeryDraft] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setIsPremiumDenied(false);

      const res = await api.get('/api/medical/profile');
      if (res.data?.profile) {
        const p = res.data.profile;
        setFormData({
          dateOfBirth: p.dateOfBirth || '',
          sex: p.sex || '',
          bloodGroup: p.bloodGroup || '',
          heightCm: p.heightCm != null ? String(p.heightCm) : '',
          weightKg: p.weightKg != null ? String(p.weightKg) : '',
          chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions : [],
          allergies: Array.isArray(p.allergies) ? p.allergies : [],
          currentMedications: Array.isArray(p.currentMedications) ? p.currentMedications : [],
          surgeries: Array.isArray(p.surgeries) ? p.surgeries : [],
          familyHistory: p.familyHistory || '',
          smokingStatus: p.smokingStatus || '',
          disabilityStatus: p.disabilityStatus || '',
          emergencyContact: {
            name: p.emergencyContact?.name || '',
            relationship: p.emergencyContact?.relationship || '',
            phone: p.emergencyContact?.phone || ''
          },
          consentToShareWithDoctors: Boolean(p.consentToShareWithDoctors)
        });
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'PREMIUM_REQUIRED') {
        setIsPremiumDenied(true);
      } else {
        setErrorMessage(
          err.response?.data?.message || t('medicalProfile.loadError') || 'Failed to load medical profile.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadConsultations = useCallback(async () => {
    try {
      setConsultationsLoading(true);
      const res = await api.get('/api/medical/consultations');
      setConsultations(Array.isArray(res.data?.consultations) ? res.data.consultations : []);
    } catch (err) {
      console.error('Error fetching patient consultations:', err);
    } finally {
      setConsultationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'consultations') {
      loadConsultations();
    }
  }, [activeTab, loadConsultations]);

  const loadPrescriptions = useCallback(async () => {
    try {
      setPrescriptionsLoading(true);
      const res = await api.get('/api/medical/prescriptions');
      setPrescriptions(Array.isArray(res.data?.prescriptions) ? res.data.prescriptions : []);
    } catch (err) {
      console.error('Error fetching patient prescriptions:', err);
    } finally {
      setPrescriptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'prescriptions') {
      loadPrescriptions();
    }
  }, [activeTab, loadPrescriptions]);

  // Array item handlers
  const handleAddItem = (field, draft, setDraft) => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      const current = prev[field] || [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, [field]: [...current, trimmed] };
    });
    setDraft('');
  };

  const handleRemoveItem = (field, indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== indexToRemove)
    }));
  };

  // Submit handler
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Frontend validations
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (dob > new Date()) {
        setErrorMessage(t('medicalProfile.validationErrors.dobFuture') || 'Date of birth cannot be in the future.');
        setSaving(false);
        return;
      }
    }
    if (formData.heightCm !== '') {
      const h = Number(formData.heightCm);
      if (isNaN(h) || h < 30 || h > 300) {
        setErrorMessage(t('medicalProfile.validationErrors.heightRange') || 'Height must be between 30 and 300 cm.');
        setSaving(false);
        return;
      }
    }
    if (formData.weightKg !== '') {
      const w = Number(formData.weightKg);
      if (isNaN(w) || w < 1 || w > 500) {
        setErrorMessage(t('medicalProfile.validationErrors.weightRange') || 'Weight must be between 1 and 500 kg.');
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        dateOfBirth: formData.dateOfBirth || null,
        sex: formData.sex || null,
        bloodGroup: formData.bloodGroup || null,
        heightCm: formData.heightCm ? Number(formData.heightCm) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        chronicConditions: formData.chronicConditions,
        allergies: formData.allergies,
        currentMedications: formData.currentMedications,
        surgeries: formData.surgeries,
        familyHistory: formData.familyHistory,
        smokingStatus: formData.smokingStatus || null,
        disabilityStatus: formData.disabilityStatus,
        emergencyContact: formData.emergencyContact,
        consentToShareWithDoctors: formData.consentToShareWithDoctors
      };

      const res = await api.put('/api/medical/profile', payload);
      if (res.data?.success) {
        setSuccessMessage(t('medicalProfile.profileSaved') || 'Medical profile saved successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('medicalProfile.saveError') || 'Failed to save medical profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.delete('/api/medical/profile');
      if (res.data?.success) {
        setShowDeleteModal(false);
        setSuccessMessage(t('medicalProfile.profileDeleted') || 'Medical profile deleted successfully.');
        setFormData({
          dateOfBirth: '',
          sex: '',
          bloodGroup: '',
          heightCm: '',
          weightKg: '',
          chronicConditions: [],
          allergies: [],
          currentMedications: [],
          surgeries: [],
          familyHistory: '',
          smokingStatus: '',
          disabilityStatus: '',
          emergencyContact: { name: '', relationship: '', phone: '' },
          consentToShareWithDoctors: false
        });
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('medicalProfile.deleteError') || 'Failed to delete medical profile.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('medicalProfile.pageTitle') || 'My Medical Profile'}
        subtitle={
          t('medicalProfile.pageSubtitle') ||
          'Manage your personal medical information, health history, and emergency contacts securely.'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('medicalProfile.loading') || 'Loading medical profile...'}
            </p>
          </div>
        )}

        {/* NON-PREMIUM PAYWALL STATE */}
        {!loading && isPremiumDenied && (
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-2xl p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <Crown className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('medicalProfile.premiumRequiredTitle') || 'Premium Feature'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('medicalProfile.premiumRequiredDesc') ||
                  'My Medical Profile is exclusively available to HomelyServ Premium members. Upgrade your account to maintain a secure personal health profile.'}
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/subscription')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-md hover:from-amber-600 hover:to-amber-700 transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>{t('medicalProfile.upgradeToPremium') || 'Upgrade to Premium'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* PREMIUM USER CONTENT */}
        {!loading && !isPremiumDenied && (
          <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>{t('medicalProfile.tabMyProfile') || 'My Health Profile'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('consultations')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'consultations'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t('medicalProfile.tabConsultations') || 'Doctor Consultations'}</span>
                {consultations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {consultations.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('prescriptions')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'prescriptions'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Pill className="w-4 h-4" />
                <span>{t('medicalProfile.tabPrescriptions') || 'My Prescriptions'}</span>
                {prescriptions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {prescriptions.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('findADoctor')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'findADoctor'
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>{t('findADoctor.tab') || 'Find a Doctor'}</span>
              </button>
            </div>

            {/* TAB 4: FIND A DOCTOR (public discovery, not Premium-gated) */}
            {activeTab === 'findADoctor' && (
              <FindADoctorSection />
            )}

            {/* TAB 3: PATIENT PRESCRIPTIONS (READ-ONLY, ISSUED ONLY) */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-6">
                {prescriptionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs text-slate-500">{t('medicalProfile.rxLoading') || 'Loading prescriptions...'}</p>
                  </div>
                ) : selectedPrescription ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                            {selectedPrescription.prescriptionNumber}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {t('doctorPrescriptions.statuses.ISSUED') || 'Issued'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('doctorPrescriptions.issueDate') || 'Issue Date'}:{' '}
                          {selectedPrescription.issuedAt
                            ? new Date(selectedPrescription.issuedAt).toLocaleString()
                            : '—'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/my-prescriptions/${selectedPrescription._id}/print`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {t('doctorPrescriptions.printPrescription') || 'Print'}
                      </button>
                    </div>

                    {selectedPrescription.documentSnapshot?.doctor?.fullName && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                          {t('doctorPrescriptions.doctorInfo') || 'Doctor'}:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200">
                          {selectedPrescription.documentSnapshot.doctor.professionalTitle
                            ? `${selectedPrescription.documentSnapshot.doctor.professionalTitle} `
                            : ''}
                          {selectedPrescription.documentSnapshot.doctor.fullName}
                          {selectedPrescription.documentSnapshot.doctor.specialty
                            ? ` — ${selectedPrescription.documentSnapshot.doctor.specialty}`
                            : ''}
                        </p>
                      </div>
                    )}

                    {Array.isArray(selectedPrescription.items) && selectedPrescription.items.length > 0 && (
                      <div className="space-y-3">
                        {selectedPrescription.items.map((item, idx) => (
                          <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs space-y-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {idx + 1}. {item.drugName}
                              {item.strength ? ` ${item.strength}` : ''}
                              {item.form ? ` (${item.form})` : ''}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <span className="block text-slate-400 font-medium">{t('doctorPrescriptions.dosage') || 'Dosage'}</span>
                                <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.dosage}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-medium">{t('doctorPrescriptions.frequency') || 'Frequency'}</span>
                                <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.frequency}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-medium">{t('doctorPrescriptions.duration') || 'Duration'}</span>
                                <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.duration}</span>
                              </div>
                              {item.quantity && (
                                <div>
                                  <span className="block text-slate-400 font-medium">{t('doctorPrescriptions.quantity') || 'Quantity'}</span>
                                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.quantity}</span>
                                </div>
                              )}
                            </div>
                            {item.instructions && (
                              <p className="text-slate-600 dark:text-slate-400">
                                <span className="font-medium text-slate-400">{t('doctorPrescriptions.instructions') || 'Instructions'}: </span>
                                {item.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedPrescription.notes && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                          {t('doctorPrescriptions.notes') || 'Notes'}:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line">{selectedPrescription.notes}</p>
                      </div>
                    )}

                    {selectedPrescription.followUpDate && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                          {t('doctorPrescriptions.followUp') || 'Follow-up Date'}:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">
                          {new Date(selectedPrescription.followUpDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedPrescription(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      {t('medicalProfile.rxBackToList') || 'Back to Prescriptions'}
                    </button>
                  </div>
                ) : prescriptions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                    <Pill className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('medicalProfile.rxNoIssued') || 'No issued prescriptions yet'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t('medicalProfile.rxNoIssuedDesc') ||
                        'When your doctor issues a prescription, it will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx._id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-100">
                                {rx.prescriptionNumber}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {t('doctorPrescriptions.statuses.ISSUED') || 'Issued'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-md">
                              {Array.isArray(rx.items) && rx.items.length > 0
                                ? rx.items.map((i) => i.drugName).join(', ')
                                : ''}
                            </p>
                            <p className="text-xs text-slate-500">
                              {rx.documentSnapshot?.doctor?.fullName
                                ? `${t('doctorPrescriptions.doctorInfo') || 'Doctor'}: ${rx.documentSnapshot.doctor.fullName}`
                                : ''}
                              {rx.issuedAt
                                ? ` • ${t('doctorPrescriptions.issueDate') || 'Issued'}: ${new Date(rx.issuedAt).toLocaleDateString()}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedPrescription(rx)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              {t('medicalProfile.rxView') || 'View'}
                            </button>
                            <button
                              onClick={() => navigate(`/my-prescriptions/${rx._id}/print`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {t('doctorPrescriptions.printPrescription') || 'Print'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PATIENT CONSULTATIONS (READ-ONLY) */}
            {activeTab === 'consultations' && (
              <div className="space-y-6">
                {consultationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs text-slate-500">{t('medicalProfile.loadingConsultations') || 'Loading consultations...'}</p>
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('medicalProfile.noSignedConsultations') || 'No signed clinical consultations yet'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t('medicalProfile.noSignedConsultationsDesc') ||
                        'When your consulting doctor signs an official clinical record, it will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consultations.map((c) => (
                      <div
                        key={c._id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                {c.doctorId?.fullName || t('medicalProfile.doctor') || 'Doctor'}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {c.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {c.appointmentId?.appointmentDate || new Date(c.createdAt).toLocaleDateString()}
                              {c.clinicId?.clinicName && ` • ${c.clinicId.clinicName}`}
                            </p>
                          </div>
                          {c.signedAt && (
                            <span className="text-xs text-slate-500">
                              {t('doctorConsultations.signedAt') || 'Signed'}: {new Date(c.signedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 text-xs">
                          {c.chiefComplaint && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                                {t('doctorConsultations.chiefComplaint') || 'Chief Complaint'}:
                              </span>
                              <p className="text-slate-800 dark:text-slate-200">{c.chiefComplaint}</p>
                            </div>
                          )}

                          {Array.isArray(c.diagnosis) && c.diagnosis.length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                                {t('doctorConsultations.diagnosis') || 'Diagnosis'}:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {c.diagnosis.map((d, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  >
                                    <strong>{d.name}</strong>
                                    {d.icdCode && ` (${d.icdCode})`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {c.treatmentPlan && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                                {t('doctorConsultations.treatmentPlan') || 'Treatment Plan & Recommendations'}:
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                {c.treatmentPlan}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: SELF-REPORTED PROFILE FORM */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Feedback Banners */}
                {errorMessage && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-700 dark:text-rose-300">{errorMessage}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
                  </div>
                )}

            {/* Section 1: Personal Medical Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  {t('medicalProfile.personalInfoSection') || 'Personal Medical Information'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.personalInfoDesc') || 'Basic biological and physical indicators.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.dateOfBirth') || 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Sex */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.sex') || 'Sex'}
                  </label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">{t('medicalProfile.selectSex') || 'Select Sex'}</option>
                    <option value="MALE">{t('medicalProfile.sexOptions.MALE') || 'Male'}</option>
                    <option value="FEMALE">{t('medicalProfile.sexOptions.FEMALE') || 'Female'}</option>
                    <option value="OTHER">{t('medicalProfile.sexOptions.OTHER') || 'Other'}</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.bloodGroup') || 'Blood Group'}
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">{t('medicalProfile.selectBloodGroup') || 'Select Blood Group'}</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.heightCm') || 'Height (cm)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    placeholder="175"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.weightKg') || 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    placeholder="70"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Medical History (Array items) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  {t('medicalProfile.medicalHistorySection') || 'Medical History'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.medicalHistoryDesc') ||
                    'Chronic conditions, allergies, and surgical background.'}
                </p>
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.chronicConditions') || 'Chronic Conditions'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={conditionDraft}
                    onChange={(e) => setConditionDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('chronicConditions', conditionDraft, setConditionDraft);
                      }
                    }}
                    placeholder={
                      t('medicalProfile.chronicConditionsPlaceholder') || 'e.g., Asthma, Hypertension...'
                    }
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('chronicConditions', conditionDraft, setConditionDraft)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.chronicConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.chronicConditions.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('chronicConditions', idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.allergies') || 'Allergies'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allergyDraft}
                    onChange={(e) => setAllergyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('allergies', allergyDraft, setAllergyDraft);
                      }
                    }}
                    placeholder={t('medicalProfile.allergiesPlaceholder') || 'e.g., Penicillin, Peanuts...'}
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('allergies', allergyDraft, setAllergyDraft)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.allergies.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('allergies', idx)}
                          className="text-rose-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.currentMedications') || 'Current Medications'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={medicationDraft}
                    onChange={(e) => setMedicationDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('currentMedications', medicationDraft, setMedicationDraft);
                      }
                    }}
                    placeholder={
                      t('medicalProfile.currentMedicationsPlaceholder') ||
                      'e.g., Metformin 500mg, Salbutamol...'
                    }
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleAddItem('currentMedications', medicationDraft, setMedicationDraft)
                    }
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.currentMedications.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.currentMedications.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('currentMedications', idx)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Previous Surgeries */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t('medicalProfile.surgeries') || 'Previous Surgeries'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={surgeryDraft}
                    onChange={(e) => setSurgeryDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('surgeries', surgeryDraft, setSurgeryDraft);
                      }
                    }}
                    placeholder={
                      t('medicalProfile.surgeriesPlaceholder') || 'e.g., Appendectomy (2018)...'
                    }
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('surgeries', surgeryDraft, setSurgeryDraft)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.surgeries.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.surgeries.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('surgeries', idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Family History */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('medicalProfile.familyHistory') || 'Family Medical History'}
                </label>
                <textarea
                  rows="3"
                  maxLength="2000"
                  value={formData.familyHistory}
                  onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
                  placeholder={
                    t('medicalProfile.familyHistoryPlaceholder') ||
                    'Notes on hereditary health conditions in your family...'
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Section 3: Lifestyle & Status */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-500" />
                  {t('medicalProfile.lifestyleSection') || 'Lifestyle & Status'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.lifestyleDesc') || 'Lifestyle factors and accessibility needs.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Smoking Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.smokingStatus') || 'Smoking Status'}
                  </label>
                  <select
                    value={formData.smokingStatus}
                    onChange={(e) => setFormData({ ...formData, smokingStatus: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">
                      {t('medicalProfile.selectSmokingStatus') || 'Select Smoking Status'}
                    </option>
                    <option value="NEVER">
                      {t('medicalProfile.smokingOptions.NEVER') || 'Never smoked'}
                    </option>
                    <option value="FORMER">
                      {t('medicalProfile.smokingOptions.FORMER') || 'Former smoker'}
                    </option>
                    <option value="CURRENT">
                      {t('medicalProfile.smokingOptions.CURRENT') || 'Current smoker'}
                    </option>
                  </select>
                </div>

                {/* Disability Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.disabilityStatus') || 'Disability Status / Mobility Needs'}
                  </label>
                  <input
                    type="text"
                    maxLength="200"
                    value={formData.disabilityStatus}
                    onChange={(e) => setFormData({ ...formData, disabilityStatus: e.target.value })}
                    placeholder={
                      t('medicalProfile.disabilityStatusPlaceholder') ||
                      'Describe any physical disabilities or mobility assistance required...'
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Emergency Contact */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-500" />
                  {t('medicalProfile.emergencyContactSection') || 'Emergency Contact'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.emergencyContactDesc') ||
                    'Designated contact person in case of a medical emergency.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.emergencyName') || 'Contact Name'}
                  </label>
                  <input
                    type="text"
                    maxLength="100"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.emergencyRelationship') || 'Relationship'}
                  </label>
                  <input
                    type="text"
                    maxLength="50"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relationship: e.target.value
                        }
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('medicalProfile.emergencyPhone') || 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    maxLength="30"
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Doctor Sharing Consent */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  {t('medicalProfile.doctorSharingSection') || 'Doctor Sharing & Consent'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('medicalProfile.doctorSharingDesc') ||
                    'Control whether confirmed consulting Doctors can view your profile.'}
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="checkbox"
                  id="consentToShareWithDoctors"
                  checked={formData.consentToShareWithDoctors}
                  onChange={(e) =>
                    setFormData({ ...formData, consentToShareWithDoctors: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="consentToShareWithDoctors"
                    className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    {t('medicalProfile.allowDoctorAccess') ||
                      'Allow Doctors to access my Medical Profile'}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('medicalProfile.doctorSharingNotice') ||
                      'Enabling this allows Doctors with whom you have confirmed appointments to view your basic medical indicators. It does not replace clinical consultation notes.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('medicalProfile.delete') || 'Delete Profile'}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('medicalProfile.saving') || 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('medicalProfile.save') || 'Save Profile'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('medicalProfile.deleteConfirmTitle') || 'Delete Medical Profile?'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('medicalProfile.deleteConfirmDesc') ||
                'Are you sure you want to deactivate and remove your medical profile? You can recreate it anytime.'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t('medicalProfile.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t('medicalProfile.delete') || 'Delete Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MedicalProfile;
