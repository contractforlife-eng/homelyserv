// frontend/src/pages/DoctorCenter.jsx
// ============================================================
// DOCTOR CENTER (HomelyServ Doctor Center)
// Real working center with three functional modules:
//   1. Services & Pricing  - the doctor's bookable offerings
//   2. Doctor Premium      - role-aware plans via existing architecture
//   3. Profile Performance - Premium-only, REAL backend metrics
// There are no "Soon" placeholders: every card here is live.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import {
  LayoutGrid, Calendar, Users, Clock, Building2, FileText, Pill, MessageCircle,
  Settings, Crown, Plus, Pencil, Trash2, Power, AlertCircle, CheckCircle2,
  Loader2, X, Save, BarChart3, TrendingUp, ArrowRight, Sparkles, Info, Tag
} from 'lucide-react';

const CONSULTATION_TYPES = ['CLINIC', 'HOME_VISIT', 'ONLINE'];

const emptyService = () => ({
  consultationType: 'CLINIC',
  serviceName: '',
  description: '',
  durationMinutes: 30,
  price: '',
  followUpPrice: '',
  followUpWindowDays: 0,
  clinicId: '',
  isActive: true
});

const DoctorCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'premium' | 'analytics'
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Services state
  const [services, setServices] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState(emptyService());
  const [saving, setSaving] = useState(false);

  // Premium state
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [premiumQuote, setPremiumQuote] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const [svcRes, clinicRes] = await Promise.all([
        api.get('/api/doctors/services'),
        api.get('/api/doctors/clinics')
      ]);
      setServices(Array.isArray(svcRes.data?.services) ? svcRes.data.services : []);
      setClinics(Array.isArray(clinicRes.data?.clinics) ? clinicRes.data.clinics : []);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorCenter.loadError') || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      const res = await api.get('/api/doctors/analytics/performance');
      setAnalytics(res.data?.analytics || null);
    } catch (err) {
      if (err.response?.status === 403) {
        setAnalyticsError('PREMIUM_REQUIRED');
      } else {
        setAnalyticsError(err.response?.data?.message || t('doctorCenter.analyticsLoadError') || 'Failed to load analytics.');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, [t]);

  const loadPremium = useCallback(async () => {
    try {
      const [statusRes, quoteRes] = await Promise.all([
        api.get('/api/payments/subscription-status'),
        api.get('/api/payments/subscription-quote')
      ]);
      setPremiumStatus(statusRes.data || null);
      setPremiumQuote(quoteRes.data?.quote || null);
    } catch (err) {
      console.warn('Premium load failed:', err?.message);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'premium') loadPremium();
  }, [activeTab, loadAnalytics, loadPremium]);

  // Services handlers
  const handleOpenCreate = () => {
    setFormData(emptyService());
    setSelectedService(null);
    setMode('create');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenEdit = (service) => {
    setSelectedService(service);
    setFormData({
      consultationType: service.consultationType || 'CLINIC',
      serviceName: service.serviceName || '',
      description: service.description || '',
      durationMinutes: service.durationMinutes ?? 30,
      price: service.price ?? '',
      followUpPrice: service.followUpPrice ?? '',
      followUpWindowDays: service.followUpWindowDays ?? 0,
      clinicId: service.clinicId?._id || service.clinicId || '',
      isActive: service.isActive !== false
    });
    setMode('edit');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const buildServicePayload = () => ({
    consultationType: formData.consultationType,
    serviceName: formData.serviceName,
    description: formData.description,
    durationMinutes: Number(formData.durationMinutes) || 30,
    price: Number(formData.price) || 0,
    followUpPrice: formData.followUpPrice === '' ? 0 : Number(formData.followUpPrice) || 0,
    followUpWindowDays: Number(formData.followUpWindowDays) || 0,
    clinicId: formData.clinicId || null,
    isActive: formData.isActive
  });

  const handleSaveService = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (mode === 'create') {
        const res = await api.post('/api/doctors/services', buildServicePayload());
        if (res.data?.success) {
          setSuccessMessage(t('doctorCenter.serviceCreated') || 'Service created successfully.');
          await loadServices();
          setMode('list');
        }
      } else if (mode === 'edit' && selectedService) {
        const res = await api.put(`/api/doctors/services/${selectedService._id}`, buildServicePayload());
        if (res.data?.success) {
          setSuccessMessage(t('doctorCenter.serviceUpdated') || 'Service updated successfully.');
          await loadServices();
          setMode('list');
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorCenter.serviceSaveError') || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const res = await api.put(`/api/doctors/services/${service._id}/active`, { isActive: !service.isActive });
      if (res.data?.success) {
        setSuccessMessage(
          res.data.service.isActive
            ? t('doctorCenter.serviceActivated') || 'Service activated.'
            : t('doctorCenter.serviceDeactivated') || 'Service deactivated.'
        );
        await loadServices();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorCenter.serviceToggleError') || 'Failed to update service.');
    }
  };

  const handleDeleteService = async (service) => {
    if (!window.confirm(t('doctorCenter.serviceDeleteConfirm') || 'Delete this service? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/api/doctors/services/${service._id}`);
      if (res.data?.success) {
        setSuccessMessage(t('doctorCenter.serviceDeleted') || 'Service deleted successfully.');
        await loadServices();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || t('doctorCenter.serviceDeleteError') || 'Failed to delete service.');
    }
  };

  const typeLabel = (type) =>
    type === 'HOME_VISIT'
      ? t('doctorCenter.typeHomeVisit') || 'Home Visit'
      : type === 'ONLINE'
        ? t('doctorCenter.typeOnline') || 'Online'
        : t('doctorCenter.typeClinic') || 'Clinic';

  // Module cards (all real — no placeholders)
  const moduleCards = [
    { id: 'appointments', icon: Calendar, path: '/doctor-appointments', label: t('doctorNav.appointments') || 'Appointments' },
    { id: 'patients', icon: Users, path: '/doctor-patients', label: t('doctorNav.patients') || 'Patients' },
    { id: 'schedule', icon: Clock, path: '/doctor-schedule', label: t('doctorNav.schedule') || 'Schedule' },
    { id: 'clinics', icon: Building2, path: '/doctor-clinics', label: t('doctorNav.clinics') || 'Clinics' },
    { id: 'consultations', icon: FileText, path: null, label: t('doctorNav.consultations') || 'Consultations', note: 'perPatient' },
    { id: 'prescriptions', icon: Pill, path: null, label: t('doctorNav.prescriptions') || 'Prescriptions', note: 'perConsultation' },
    { id: 'messages', icon: MessageCircle, path: '/doctor-messages', label: t('doctorNav.messages') || 'Messages' },
    { id: 'settings', icon: Settings, path: '/doctor-settings', label: t('doctorNav.settings') || 'Settings' }
  ];

  return (
    <DashboardLayout requiredRole="DOCTOR">
      <DashboardHeader title={t('doctorCenter.pageTitle') || 'HomelyServ Doctor Center'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Alerts */}
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

        {/* Module quick access (all real pages) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-red-500" />
            {t('doctorCenter.modulesTitle') || 'Doctor Modules'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {moduleCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => card.path ? navigate(card.path) : navigate('/doctor-patients')}
                  title={card.note ? (t('doctorCenter.perPatientNote') || 'Open a patient, then choose a consultation.') : undefined}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{card.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            {t('doctorCenter.consultationsHint') || 'Consultations and Prescriptions live inside each patient file — open a patient first.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4">
          {[
            { id: 'services', icon: Tag, label: t('doctorCenter.tabServices') || 'Services & Pricing' },
            { id: 'premium', icon: Crown, label: t('doctorCenter.tabPremium') || 'Doctor Premium' },
            { id: 'analytics', icon: BarChart3, label: t('doctorCenter.tabAnalytics') || 'Profile Performance' }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= SERVICES & PRICING ================= */}
        {activeTab === 'services' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t('doctorCenter.servicesTitle') || 'Services & Pricing'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('doctorCenter.servicesSubtitle') || 'Your bookable consultation offerings shown to patients.'}
                  </p>
                </div>
                {mode === 'list' && (
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t('doctorCenter.newService') || 'New Service'}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-red-600 mb-2" />
                  <p className="text-sm text-gray-500">{t('doctorCenter.loading') || 'Loading services...'}</p>
                </div>
              ) : mode !== 'list' ? (
                /* --- Service form --- */
                <div className="pt-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorCenter.serviceType') || 'Consultation Type'} *
                      </label>
                      <select
                        value={formData.consultationType}
                        onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      >
                        {CONSULTATION_TYPES.map((type) => (
                          <option key={type} value={type}>{typeLabel(type)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorCenter.clinicAssociation') || 'Clinic (optional)'}
                      </label>
                      <select
                        value={formData.clinicId}
                        onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">{t('doctorCenter.noClinic') || 'No specific clinic'}</option>
                        {clinics.map((c) => (
                          <option key={c._id} value={c._id}>{c.clinicName}{c.city ? ` — ${c.city}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorCenter.serviceName') || 'Service Name'} *
                      </label>
                      <input
                        type="text"
                        maxLength="150"
                        value={formData.serviceName}
                        onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                        placeholder={t('doctorCenter.serviceNamePlaceholder') || 'e.g. General Consultation (Clinic)'}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorCenter.serviceDescription') || 'Description'}
                      </label>
                      <textarea
                        rows="2"
                        maxLength="2000"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorCenter.duration') || 'Duration (minutes)'} *
                      </label>
                      <input
                        type="number" min="5" max="480"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorCenter.price') || 'Price (EGP)'} *
                      </label>
                      <input
                        type="number" min="0" step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorCenter.followUpPrice') || 'Follow-up Price (EGP)'}
                      </label>
                      <input
                        type="number" min="0" step="0.01"
                        value={formData.followUpPrice}
                        onChange={(e) => setFormData({ ...formData, followUpPrice: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('doctorCenter.followUpWindow') || 'Follow-up Window (days)'}
                      </label>
                      <input
                        type="number" min="0" max="90"
                        value={formData.followUpWindowDays}
                        onChange={(e) => setFormData({ ...formData, followUpWindowDays: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setMode('list')}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveService}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium shadow-sm transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? t('doctorCenter.saving') || 'Saving...' : t('doctorCenter.saveService') || 'Save Service'}
                    </button>
                  </div>
                </div>
              ) : services.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('doctorCenter.noServices') || 'No services configured yet'}
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {t('doctorCenter.noServicesDesc') || 'Create your first bookable service so patients can book consultations with you.'}
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('doctorCenter.createFirst') || 'Create Service'}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {services.map((service) => (
                    <div key={service._id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">{service.serviceName}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            service.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                          }`}>
                            {service.isActive
                              ? t('doctorCenter.active') || 'Active'
                              : t('doctorCenter.inactive') || 'Inactive'}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                            {typeLabel(service.consultationType)}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-xs text-gray-500 truncate max-w-md">{service.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {service.durationMinutes} {t('doctorCenter.minutes') || 'min'} •{' '}
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{service.price} {service.currency || 'EGP'}</span>
                          {service.followUpPrice > 0 && (
                            <> • {t('doctorCenter.followUpShort') || 'Follow-up'}: {service.followUpPrice} {service.currency || 'EGP'}
                              {service.followUpWindowDays > 0 && ` (${service.followUpWindowDays} ${t('doctorCenter.days') || 'days'})`}</>
                          )}
                          {service.clinicId?.clinicName && <> • {service.clinicId.clinicName}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleActive(service)}
                          title={service.isActive ? t('doctorCenter.deactivate') || 'Deactivate' : t('doctorCenter.activate') || 'Activate'}
                          className={`p-2 rounded-lg border transition-colors ${
                            service.isActive
                              ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(service)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-400 px-1">
              {t('doctorCenter.pricingNote') || 'These service prices are your bookable HomelyServ offerings. Your profile consultation and examination fees are managed separately on the Profile page.'}
            </p>
          </div>
        )}

        {/* ================= DOCTOR PREMIUM ================= */}
        {activeTab === 'premium' && (
          <div className="space-y-5">
            {/* Current status */}
            <div className={`rounded-2xl p-6 shadow-sm border ${
              premiumStatus?.isPremium
                ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 dark:border-amber-900/50'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  premiumStatus?.isPremium
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  <Crown className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {premiumStatus?.isPremium
                      ? t('doctorCenter.premiumActive') || 'Doctor Premium is Active'
                      : t('doctorCenter.premiumInactive') || 'Doctor Premium is not active'}
                  </h3>
                  {premiumStatus?.isPremium && premiumStatus.subscription ? (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                      <p>
                        {t('doctorCenter.currentPlan') || 'Current plan'}:{' '}
                        <span className="font-semibold capitalize">{premiumStatus.subscription.plan === 'annual' ? t('doctorCenter.planAnnual') || 'Yearly' : premiumStatus.subscription.plan}</span>
                      </p>
                      {premiumStatus.subscription.endDate && (
                        <p>
                          {t('doctorCenter.expiresOn') || 'Expires on'}:{' '}
                          <span className="font-semibold">{new Date(premiumStatus.subscription.endDate).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('doctorCenter.premiumInactiveDesc') || 'Upgrade to unlock Profile Performance analytics and premium visibility.'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/subscription')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold shadow-sm hover:from-amber-600 hover:to-amber-700 transition-all shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {premiumStatus?.isPremium
                    ? t('doctorCenter.renew') || 'Renew'
                    : t('doctorCenter.upgrade') || 'Upgrade'}
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            </div>

            {/* Doctor plans (server-authoritative quote) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t('doctorCenter.plansTitle') || 'Doctor Premium Plans'}
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                {t('doctorCenter.plansSubtitle') || 'Prices are set by HomelyServ for the Doctor account context.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(premiumQuote?.plans
                  ? Object.entries(premiumQuote.plans).map(([id, p]) => ({ id, ...p }))
                  : [
                      { id: 'weekly', amount: 75, currency: 'EGP', durationDays: 7 },
                      { id: 'monthly', amount: 250, currency: 'EGP', durationDays: 30 },
                      { id: 'annual', amount: 1800, currency: 'EGP', durationDays: 365 }
                    ]
                ).map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-xl border p-4 text-center ${
                      plan.id === 'annual'
                        ? 'border-violet-300 dark:border-violet-700 bg-violet-50/60 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {plan.id === 'annual'
                        ? t('doctorCenter.planAnnual') || 'Yearly'
                        : plan.id === 'monthly'
                          ? t('doctorCenter.planMonthly') || 'Monthly'
                          : t('doctorCenter.planWeekly') || 'Weekly'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {plan.amount != null ? `${plan.amount} ${plan.currency || 'EGP'}` : '—'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {plan.durationDays ? t('doctorCenter.durationDays', { days: plan.durationDays }) || `${plan.durationDays} days` : ''}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/subscription')}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold shadow-sm hover:from-amber-600 hover:to-amber-700 transition-all"
              >
                <Crown className="w-4 h-4" />
                {t('doctorCenter.choosePlan') || 'Choose a Plan'}
              </button>
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                {t('doctorCenter.workerPricingNote') || 'Worker and Employer Premium pricing is separate and unchanged.'}
              </p>
            </div>
          </div>
        )}

        {/* ================= PROFILE PERFORMANCE (PREMIUM) ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            {analyticsLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
                <Loader2 className="w-7 h-7 animate-spin text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('doctorCenter.loadingAnalytics') || 'Loading performance data...'}</p>
              </div>
            ) : analyticsError === 'PREMIUM_REQUIRED' ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <Crown className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('doctorCenter.analyticsPremiumTitle') || 'Premium Feature'}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  {t('doctorCenter.analyticsPremiumDesc') || 'Profile Performance is exclusive to Doctor Premium members. Upgrade to see real booking and consultation activity.'}
                </p>
                <button
                  onClick={() => setActiveTab('premium')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-md hover:from-amber-600 hover:to-amber-700 transition-all"
                >
                  <Crown className="w-4 h-4" />
                  {t('doctorCenter.upgradeToPremium') || 'Upgrade to Premium'}
                </button>
              </div>
            ) : analyticsError ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300">
                {analyticsError}
              </div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'APPOINTMENTS_REQUESTED', label: t('doctorCenter.metricRequests') || 'Appointment Requests', icon: Calendar },
                    { key: 'APPOINTMENTS_CONFIRMED', label: t('doctorCenter.metricConfirmed') || 'Confirmed Appointments', icon: CheckCircle2 },
                    { key: 'APPOINTMENTS_COMPLETED', label: t('doctorCenter.metricCompleted') || 'Completed Appointments', icon: CheckCircle2 },
                    { key: 'PATIENTS_SERVED', label: t('doctorCenter.metricPatients') || 'Patients Served', icon: Users },
                    { key: 'CONSULTATIONS_SIGNED', label: t('doctorCenter.metricSigned') || 'Signed Consultations', icon: FileText },
                    { key: 'PRESCRIPTIONS_ISSUED', label: t('doctorCenter.metricPrescriptions') || 'Prescriptions Issued', icon: Pill },
                    { key: 'SERVICES_ACTIVE', label: t('doctorCenter.metricServices') || 'Active Services', icon: Tag }
                  ].map(({ key, label, icon }) => {
                    const Icon = icon;
                    return (
                      <div key={key} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-red-500" />
                          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analytics.metrics?.[key] ?? 0}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Daily activity (last 30 days, real data) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      {t('doctorCenter.dailyActivity') || 'Daily Activity (last 30 days)'}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />{t('doctorCenter.legendConfirmed') || 'Confirmed'}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />{t('doctorCenter.legendCompleted') || 'Completed'}</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-[3px] h-28">
                    {analytics.dailyActivity?.map((d) => {
                      const max = Math.max(1, ...analytics.dailyActivity.map((x) => Math.max(x.confirmed, x.completed)));
                      return (
                        <div key={d.day} className="flex-1 flex flex-col justify-end gap-[2px] min-w-0" title={`${d.day}: ${d.confirmed} confirmed / ${d.completed} completed`}>
                          <div className="bg-emerald-500 rounded-t-sm" style={{ height: `${(d.completed / max) * 100}%`, minHeight: d.completed ? '3px' : 0 }} />
                          <div className="bg-blue-500 rounded-t-sm" style={{ height: `${(d.confirmed / max) * 100}%`, minHeight: d.confirmed ? '3px' : 0 }} />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3">
                    {t('doctorCenter.analyticsRealDataNote') || 'All metrics are computed from your real appointment, consultation, and prescription records. Profile views and search appearances are not tracked and therefore not shown.'}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorCenter;
