// frontend/src/pages/DoctorPublicProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import LegalFooter from '../components/common/LegalFooter';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Stethoscope,
  BadgeCheck,
  CheckCircle,
  AlertCircle,
  Phone,
  User,
  Share2,
  Copy,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function DoctorPublicProfile() {
  const { id } = useParams();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  // Booking Modal State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestReason, setGuestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Share notification
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/public/doctors/${id}`);
        if (res.data?.success) {
          setDoctor(res.data.doctor);
        } else {
          setError(t('publicProfile.notFound') || 'Doctor profile not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || t('publicProfile.notFound') || 'Doctor profile not found');
      } finally {
        setLoading(false);
      }
    }

    async function loadSlots() {
      try {
        setSlotsLoading(true);
        const res = await api.get(`/api/public/doctors/${id}/availability`);
        if (res.data?.success) {
          setSlots(res.data.slots || []);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    }

    if (id) {
      loadData();
      loadSlots();
    }
  }, [id, t]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: doctor?.fullName || 'Doctor Profile',
          text: `${doctor?.fullName} - ${doctor?.professionalTitle || doctor?.specialty}`,
          url
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setBookingError('');

    try {
      const res = await api.post(`/api/public/doctors/${id}/appointments`, {
        name: guestName.trim(),
        phone: guestPhone.trim(),
        reason: guestReason.trim(),
        scheduleId: selectedSlot.scheduleId,
        startsAt: selectedSlot.startsAt
      });

      if (res.data?.success) {
        setBookingSuccess(res.data.appointment);
        // Remove booked slot from list
        setSlots((prev) => prev.filter((s) => s.startsAt !== selectedSlot.startsAt));
      } else {
        setBookingError(res.data?.message || t('publicProfile.bookingFailed') || 'Booking failed');
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || t('publicProfile.bookingFailed') || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-between">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        </div>
        <LegalFooter />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-xl mx-auto my-16 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error || t('publicProfile.notFound') || 'Profile Not Found'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('publicProfile.doctorNotFoundDesc') || 'This doctor profile is not available or is currently unpublished.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
          >
            {t('publicProfile.backHome') || 'Back to Home'}
          </Link>
        </div>
        <LegalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={doctor.profileImage || 'https://via.placeholder.com/150'}
              alt={doctor.fullName}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-red-100 dark:border-red-900/50 shadow-md"
            />
            <div className="flex-1 text-center sm:text-start">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                  {doctor.fullName}
                </h1>
                <BadgeCheck className="w-6 h-6 text-red-600 shrink-0" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                {doctor.professionalTitle || doctor.specialty}
              </p>
              {doctor.subspecialty && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {doctor.subspecialty}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-3">
                {doctor.yearsOfExperience > 0 && (
                  <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg">
                    <Clock size={16} className="text-gray-500" />
                    {doctor.yearsOfExperience} {t('publicProfile.yearsExp') || 'Years Experience'}
                  </span>
                )}
                {doctor.consultationFee > 0 && (
                  <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg font-semibold">
                    {doctor.consultationFee} {doctor.currency || 'EGP'} {t('publicProfile.consultationFee') || 'Consultation'}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleShare}
              className="absolute top-6 end-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-semibold shadow-sm transition-colors"
            >
              <Share2 size={15} />
              <span>{copied ? (t('copied') || 'Copied!') : (t('share') || 'Share Profile')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bio */}
            {doctor.bio && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Stethoscope size={18} className="text-red-600" />
                  {t('about') || 'About Doctor'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {doctor.bio}
                </p>
              </div>
            )}

            {/* Clinics */}
            {doctor.clinics && doctor.clinics.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Building2 size={18} className="text-red-600" />
                  {t('publicProfile.clinics') || 'Clinics & Centers'}
                </h2>
                <div className="space-y-4">
                  {doctor.clinics.map((clinic) => (
                    <div key={clinic.id} className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {clinic.clinicName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin size={14} />
                        <span>{clinic.addressLine}, {clinic.city}</span>
                      </div>
                      {clinic.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Phone size={14} />
                          <span>{clinic.phone}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Appointment Booking Slots */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar size={20} className="text-red-600" />
                    {t('publicProfile.bookAppointment') || 'Book an Appointment'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {t('publicProfile.bookAppointmentDesc') || 'Select an available appointment time below.'}
                  </p>
                </div>
              </div>

              {slotsLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <Calendar size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">
                    {t('publicProfile.noSlots') || 'No appointment slots currently available.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {slots.map((slot) => {
                    const start = new Date(slot.startsAt);
                    const isSelected = selectedSlot?.startsAt === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-start transition-all ${
                          isSelected
                            ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-200 font-semibold ring-2 ring-red-500/30'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-red-300 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm font-bold mt-1">
                          {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 capitalize">
                          {slot.consultationType?.toLowerCase() || 'Clinic'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Guest Booking Form when a slot is chosen */}
              {selectedSlot && !bookingSuccess && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">
                    {t('publicProfile.enterYourDetails') || 'Enter Your Details'}
                  </h3>

                  {bookingError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <form onSubmit={handleBook} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {t('full_name') || 'Full Name'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {t('phone') || 'Phone Number'} *
                        </label>
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="e.g. +201012345678"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t('publicProfile.reason') || 'Reason for Visit (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={guestReason}
                        onChange={(e) => setGuestReason(e.target.value)}
                        placeholder="e.g. General checkup"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      <span>{t('publicProfile.confirmBookingBtn') || 'Confirm Appointment Now'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Booking Success Banner */}
              {bookingSuccess && (
                <div className="mt-8 p-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl text-center animate-fadeIn">
                  <CheckCircle size={36} className="text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-200 mb-1">
                    {t('publicProfile.appointmentConfirmed') || 'Appointment Confirmed!'}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    {t('publicProfile.confirmedDesc') || 'Your appointment has been reserved and confirmed with the doctor.'}
                  </p>
                  <div className="inline-block text-start bg-white dark:bg-gray-800 p-4 rounded-xl border border-green-200 dark:border-green-800 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    <div><strong>{t('publicProfile.doctorLabel') || 'Doctor'}:</strong> {doctor.fullName}</div>
                    <div><strong>{t('publicProfile.timeLabel') || 'Time'}:</strong> {new Date(bookingSuccess.startsAt).toLocaleString()}</div>
                    <div><strong>{t('publicProfile.statusLabel') || 'Status'}:</strong> {bookingSuccess.status}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
