// frontend/src/pages/DoctorClinics.jsx
// Doctor Clinics module.
//
// This page is UI ONLY. It reuses the already implemented Doctor Clinic API
// (GET/POST/PUT/DELETE /api/doctors/clinics) exactly as it is:
//   - ownership stays on the backend (every query is filtered by doctorId)
//   - primary-clinic demotion/promotion stays on the backend
//   - delete stays a soft delete (isActive: false)
//
// No clinic field is invented here: the form only exposes fields that already
// exist on the DoctorClinic model and are accepted by clinicController.js.
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import api from '../utils/api';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Navigation,
  Info,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

const EMPTY_FORM = {
  clinicName: '',
  phone: '',
  email: '',
  addressLine: '',
  city: '',
  stateOrProvince: '',
  countryCode: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  timezone: 'UTC',
  instructions: '',
  isPrimary: false
};

const DoctorClinics = () => {
  const { t } = useTranslation();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add / Edit modal
  const [formMode, setFormMode] = useState(null); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadClinics = useCallback(async () => {
    try {
      setLoading(true);
      // includeInactive=true so the doctor can also SEE deactivated clinics
      // (inactive state + reactivate). The backend already supports this flag
      // and still filters strictly by the authenticated doctorId.
      const res = await api.get('/api/doctors/clinics?includeInactive=true');
      setClinics(Array.isArray(res.data?.clinics) ? res.data.clinics : []);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorClinics.loadError') || 'Failed to load your clinics.'
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  // Mirrors the validation the backend already performs, so the doctor gets an
  // immediate answer without changing any server behaviour.
  const validateForm = (values) => {
    const name = values.clinicName.trim();
    const address = values.addressLine.trim();
    const city = values.city.trim();
    const country = values.countryCode.trim();

    if (!name) return t('doctorClinics.nameRequired') || 'Clinic name is required.';
    if (name.length > 150) return t('doctorClinics.nameTooLong') || 'Clinic name cannot exceed 150 characters.';
    if (!address) return t('doctorClinics.addressRequired') || 'Address line is required.';
    if (address.length > 255) return t('doctorClinics.addressTooLong') || 'Address line cannot exceed 255 characters.';
    if (!city) return t('doctorClinics.cityRequired') || 'City is required.';
    if (city.length > 100) return t('doctorClinics.cityTooLong') || 'City cannot exceed 100 characters.';
    if (!country) return t('doctorClinics.countryRequired') || 'Country code is required.';
    if (country.length > 10) return t('doctorClinics.countryTooLong') || 'Country code cannot exceed 10 characters.';

    const email = values.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return t('doctorClinics.emailInvalid') || 'Enter a valid email address.';
    }
    if (email.length > 100) {
      return t('doctorClinics.emailInvalid') || 'Enter a valid email address.';
    }

    if (values.latitude !== '') {
      const lat = Number(values.latitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return t('doctorClinics.latitudeInvalid') || 'Latitude must be between -90 and 90.';
      }
    }
    if (values.longitude !== '') {
      const lng = Number(values.longitude);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        return t('doctorClinics.longitudeInvalid') || 'Longitude must be between -180 and 180.';
      }
    }

    return '';
  };

  const openAddModal = () => {
    setFormMode('add');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const openEditModal = (clinic) => {
    setFormMode('edit');
    setEditingId(clinic._id || clinic.id);
    setForm({
      clinicName: clinic.clinicName || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      addressLine: clinic.addressLine || '',
      city: clinic.city || '',
      stateOrProvince: clinic.stateOrProvince || '',
      countryCode: clinic.countryCode || '',
      postalCode: clinic.postalCode || '',
      latitude: clinic.latitude === null || clinic.latitude === undefined ? '' : String(clinic.latitude),
      longitude: clinic.longitude === null || clinic.longitude === undefined ? '' : String(clinic.longitude),
      timezone: clinic.timezone || 'UTC',
      instructions: clinic.instructions || '',
      isPrimary: Boolean(clinic.isPrimary)
    });
    setFormError('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const closeModal = () => {
    if (saving) return;
    setFormMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const validationError = validateForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    // Only fields the existing API already accepts. isPrimary is sent as-is so
    // the backend keeps sole ownership of the primary-clinic rules.
    const payload = {
      clinicName: form.clinicName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      stateOrProvince: form.stateOrProvince.trim(),
      countryCode: form.countryCode.trim(),
      postalCode: form.postalCode.trim(),
      latitude: form.latitude === '' ? '' : form.latitude,
      longitude: form.longitude === '' ? '' : form.longitude,
      timezone: form.timezone.trim() || 'UTC',
      instructions: form.instructions.trim(),
      isPrimary: formMode === 'add' ? Boolean(form.isPrimary) : undefined
    };

    if (formMode === 'edit') {
      delete payload.isPrimary;
    }

    try {
      setSaving(true);
      setErrorMessage('');
      setFormError('');

      if (formMode === 'edit') {
        await api.put(`/api/doctors/clinics/${editingId}`, payload);
        setSuccessMessage(t('doctorClinics.updateSuccess') || 'Clinic updated successfully.');
      } else {
        await api.post('/api/doctors/clinics', payload);
        setSuccessMessage(t('doctorClinics.createSuccess') || 'Clinic added successfully.');
      }

      setFormMode(null);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadClinics();
    } catch (err) {
      const message = err.response?.data?.message
        || t('doctorClinics.saveError')
        || 'Failed to save the clinic.';
      // The server stays the source of truth for validation messages.
      if (formMode === 'edit') setErrorMessage(message);
      else setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  // Primary clinic is set through the existing PUT endpoint. The backend
  // demotes the previous primary, so no client-side rule is duplicated here.
  const handleMakePrimary = async (clinic) => {
    const id = clinic._id || clinic.id;
    try {
      setErrorMessage('');
      setSuccessMessage('');
      await api.put(`/api/doctors/clinics/${id}`, { isPrimary: true });
      setSuccessMessage(t('doctorClinics.primarySuccess') || 'Primary clinic updated.');
      await loadClinics();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorClinics.saveError') || 'Failed to update the clinic.'
      );
    }
  };

  // Re-activate a soft-deleted clinic. The backend already accepts `isActive`
  // on PUT and keeps all ownership rules, so no new endpoint is needed.
  const handleReactivate = async (clinic) => {
    const id = clinic._id || clinic.id;
    try {
      setErrorMessage('');
      setSuccessMessage('');
      await api.put(`/api/doctors/clinics/${id}`, { isActive: true });
      setSuccessMessage(t('doctorClinics.reactivateSuccess') || 'Clinic reactivated.');
      await loadClinics();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorClinics.saveError') || 'Failed to update the clinic.'
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteBusy) return;
    const id = deleteTarget._id || deleteTarget.id;
    try {
      setDeleteBusy(true);
      setErrorMessage('');
      // Existing soft-delete API: the document is kept, isActive becomes false.
      await api.delete(`/api/doctors/clinics/${id}`);
      setDeleteTarget(null);
      setSuccessMessage(t('doctorClinics.deleteSuccess') || 'Clinic removed.');
      await loadClinics();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || t('doctorClinics.deleteError') || 'Failed to remove the clinic.'
      );
      setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const renderField = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
        <Icon size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
        <span className="break-words">{value}</span>
      </div>
    );
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const cardClass = 'bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm';

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <DashboardHeader title={t('doctorClinics.headerTitle') || 'My Clinics'} />

        {/* Alerts */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-800 dark:text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3 text-green-800 dark:text-green-200 text-sm">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Page header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('doctorClinics.pageTitle') || 'My Clinics'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('doctorClinics.pageDesc') || 'Manage your practice locations, reception details, and addresses.'}
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>{t('doctorClinics.addBtn') || 'Add Clinic'}</span>
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className={`${cardClass} p-10 flex items-center justify-center`}>
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : clinics.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t('doctorClinics.emptyTitle') || 'No clinics yet'}
            description={t('doctorClinics.emptyDesc') || 'Add your first practice location so patients know where to find you.'}
            action={(
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
              >
                <Plus size={18} />
                <span>{t('doctorClinics.addBtn') || 'Add Clinic'}</span>
              </button>
            )}
          />
        ) : (
          <div className="space-y-4">
            {clinics.map((clinic) => {
              const id = clinic._id || clinic.id;
              const addressParts = [
                clinic.addressLine,
                clinic.city,
                clinic.stateOrProvince,
                clinic.postalCode,
                clinic.countryCode
              ].filter(Boolean).join(', ');
              const hasCoordinates = clinic.latitude !== null && clinic.latitude !== undefined
                || clinic.longitude !== null && clinic.longitude !== undefined;

              return (
                <div key={id} className={`${cardClass} p-5 space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center flex-shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-semibold text-gray-900 dark:text-white break-words">
                            {clinic.clinicName}
                          </h2>
                          {clinic.isPrimary && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                              <Star size={10} />
                              {t('doctorClinics.primaryBadge') || 'Primary'}
                            </span>
                          )}
                          {clinic.isActive === false ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                              {t('doctorClinics.inactiveBadge') || 'Inactive'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                              {t('doctorClinics.activeBadge') || 'Active'}
                            </span>
                          )}
                        </div>
                        {addressParts && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                            {addressParts}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!clinic.isPrimary && clinic.isActive !== false && (
                        <button
                          type="button"
                          onClick={() => handleMakePrimary(clinic)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
                        >
                          <Star size={14} />
                          <span>{t('doctorClinics.makePrimaryBtn') || 'Make primary'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(clinic)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
                      >
                        <Pencil size={14} />
                        <span>{t('doctorClinics.editBtn') || 'Edit'}</span>
                      </button>

                      {clinic.isActive === false ? (
                        <button
                          type="button"
                          onClick={() => handleReactivate(clinic)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-medium transition-colors"
                        >
                          <CheckCircle size={14} />
                          <span>{t('doctorClinics.reactivateBtn') || 'Reactivate'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setDeleteTarget(clinic); setErrorMessage(''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium transition-colors"
                        >
                          <Trash2 size={14} />
                          <span>{t('doctorClinics.deleteBtn') || 'Remove'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {renderField({ icon: MapPin, label: 'Address', value: addressParts })}
                    {renderField({ icon: Phone, label: 'Phone', value: clinic.phone })}
                    {renderField({ icon: Mail, label: 'Email', value: clinic.email })}
                    {renderField({ icon: Globe, label: 'Country', value: clinic.countryCode })}
                    {renderField({ icon: Clock, label: 'Timezone', value: clinic.timezone })}
                    {renderField({
                      icon: Navigation,
                      label: 'Coordinates',
                      value: hasCoordinates
                        ? `${clinic.latitude ?? '—'}, ${clinic.longitude ?? '—'}`
                        : ''
                    })}
                  </div>

                  {clinic.instructions && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200">
                      <Info size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {t('doctorClinics.receptionTitle') || 'Reception information'}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap break-words">{clinic.instructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ================= Add / Edit modal ================= */}
        {formMode && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
            <div className={`${cardClass} w-full max-w-2xl my-8`}>
              <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {formMode === 'edit'
                    ? (t('doctorClinics.formEditTitle') || 'Edit Clinic')
                    : (t('doctorClinics.formAddTitle') || 'Add Clinic')}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={t('cancel') || 'Close'}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-4">
                  {formError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2 text-red-800 dark:text-red-200 text-sm">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div>
                    <label className={labelClass} htmlFor="clinicName">
                      {t('doctorClinics.clinicName') || 'Clinic Name'} *
                    </label>
                    <input
                      id="clinicName"
                      type="text"
                      value={form.clinicName}
                      onChange={(e) => handleFormChange('clinicName', e.target.value)}
                      maxLength={150}
                      placeholder={t('doctorClinics.clinicNamePlaceholder') || 'e.g. Downtown Medical Centre'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="addressLine">
                      {t('doctorClinics.addressLine') || 'Address Line'} *
                    </label>
                    <input
                      id="addressLine"
                      type="text"
                      value={form.addressLine}
                      onChange={(e) => handleFormChange('addressLine', e.target.value)}
                      maxLength={255}
                      placeholder={t('doctorClinics.addressLinePlaceholder') || 'Street, building, floor'}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="city">
                        {t('doctorClinics.city') || 'City'} *
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={form.city}
                        onChange={(e) => handleFormChange('city', e.target.value)}
                        maxLength={100}
                        placeholder={t('doctorClinics.cityPlaceholder') || 'e.g. Cairo'}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="stateOrProvince">
                        {t('doctorClinics.stateOrProvince') || 'State / Province'}
                      </label>
                      <input
                        id="stateOrProvince"
                        type="text"
                        value={form.stateOrProvince}
                        onChange={(e) => handleFormChange('stateOrProvince', e.target.value)}
                        maxLength={100}
                        placeholder={t('doctorClinics.stateOrProvincePlaceholder') || 'e.g. Cairo Governorate'}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="postalCode">
                        {t('doctorClinics.postalCode') || 'Postal Code'}
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => handleFormChange('postalCode', e.target.value)}
                        maxLength={20}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="countryCode">
                        {t('doctorClinics.countryCode') || 'Country Code'} *
                      </label>
                      <input
                        id="countryCode"
                        type="text"
                        value={form.countryCode}
                        onChange={(e) => handleFormChange('countryCode', e.target.value)}
                        maxLength={10}
                        placeholder={t('doctorClinics.countryCodePlaceholder') || 'e.g. EG'}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="clinicPhone">
                        {t('doctorClinics.phone') || 'Reception Phone'}
                      </label>
                      <input
                        id="clinicPhone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        maxLength={50}
                        placeholder={t('doctorClinics.phonePlaceholder') || '+20 2 0000 0000'}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="clinicEmail">
                        {t('doctorClinics.email') || 'Reception Email'}
                      </label>
                      <input
                        id="clinicEmail"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        maxLength={100}
                        placeholder={t('doctorClinics.emailPlaceholder') || 'reception@clinic.com'}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="clinicTimezone">
                        {t('doctorClinics.timezone') || 'Timezone'}
                      </label>
                      <input
                        id="clinicTimezone"
                        type="text"
                        value={form.timezone}
                        onChange={(e) => handleFormChange('timezone', e.target.value)}
                        maxLength={50}
                        placeholder="UTC"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="clinicLatitude">
                        {t('doctorClinics.latitude') || 'Latitude'}
                      </label>
                      <input
                        id="clinicLatitude"
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        value={form.latitude}
                        onChange={(e) => handleFormChange('latitude', e.target.value)}
                        placeholder="30.0444"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="clinicLongitude">
                        {t('doctorClinics.longitude') || 'Longitude'}
                      </label>
                      <input
                        id="clinicLongitude"
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        value={form.longitude}
                        onChange={(e) => handleFormChange('longitude', e.target.value)}
                        placeholder="31.2357"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="clinicInstructions">
                      {t('doctorClinics.instructions') || 'Reception Information'}
                    </label>
                    <textarea
                      id="clinicInstructions"
                      rows={3}
                      value={form.instructions}
                      onChange={(e) => handleFormChange('instructions', e.target.value)}
                      maxLength={1000}
                      placeholder={t('doctorClinics.instructionsPlaceholder') || 'Working hours, reception desk, booking phone...'}
                      className={inputClass}
                    />
                  </div>

                  {/* The backend owns the primary rule: on create it demotes any
                      other primary; the first active clinic becomes primary
                      automatically. On edit the primary is changed through the
                      dedicated action instead, so the toggle stays add-only. */}
                  {formMode === 'add' && (
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPrimary}
                        onChange={(e) => handleFormChange('isPrimary', e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-red-600"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                          {t('doctorClinics.isPrimary') || 'Set as primary clinic'}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {t('doctorClinics.isPrimaryHint') || 'Your current primary clinic will be replaced.'}
                        </span>
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    <span>
                      {saving
                        ? (t('saving') || 'Saving...')
                        : (formMode === 'edit'
                          ? (t('doctorClinics.saveChangesBtn') || 'Save Changes')
                          : (t('doctorClinics.addBtn') || 'Add Clinic'))}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= Delete confirmation ================= */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md`}>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('doctorClinics.deleteConfirmTitle') || 'Remove this clinic?'}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('doctorClinics.deleteConfirmDesc') || 'This removes the clinic from your active practice locations.'}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                  {deleteTarget.clinicName}
                </p>
                {deleteTarget.isPrimary && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                    {t('doctorClinics.deletePrimaryWarning') || 'This is your primary clinic. Another active clinic will become primary automatically.'}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteBusy}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteBusy}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {deleteBusy && <Loader2 size={16} className="animate-spin" />}
                  <span>{t('doctorClinics.deleteConfirmBtn') || 'Yes, remove'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorClinics;
