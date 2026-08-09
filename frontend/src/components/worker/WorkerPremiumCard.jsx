// src/components/worker/WorkerPremiumCard.jsx
// Compact Premium / Availability area for the Worker dashboard.
//   - Every worker (free or premium) can set a truthful availability status.
//   - "Actively Looking" is Premium-only and enforced by the backend (403 if
//     the worker has no active subscription).
// All state is read/written server-side; the frontend never authorizes itself.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap } from 'lucide-react';
import { useDashboard } from '../layout/DashboardContext';
import workerPremiumService from '../../services/workerPremiumService';

const translations = {
  en: {
    availability: 'Availability',
    available: 'Available',
    unavailable: 'Not Available',
    hasAvailabilityError: 'Failed to update availability',
    premiumActive: 'Premium Active',
    expiresOn: 'Expires on {date}',
    cardTitle: 'Premium & Availability',
    activelyLooking: 'Actively Looking',
    activelyLookingHint: 'Raises your position in matching Employer searches',
    activelyLookingOff: 'Set your availability to Available to use Actively Looking.',
    upsell: 'Premium adds a badge, higher visibility for matching Employers and the "Actively Looking" status.',
    getPremium: 'Upgrade to Premium',
    loading: 'Loading...',
    loadError: 'Failed to load status'
  },
  ar: {
    availability: 'التوفر',
    available: 'متاح',
    unavailable: 'غير متاح',
    availabilityError: 'حدث خطأ أثناء تحديث التوفر',
    premiumActive: 'Premium مفعّل',
    expiresOn: 'ينتهي في {date}',
    cardTitle: 'Premium والتوفر',
    activelyLooking: 'أبحث بنشاط عن عمل',
    activelyLookingHint: 'يرفع موقعك في نتائج بحث أصحاب العمل المطابقين',
    activelyLookingOff: 'اجعل حالتك «متاح» لاستخدام خاصية «أبحث بنشاط عن عمل».',
    upsell: 'باقة Premium تمنحك شارة Premium وظهوراً أعلى لأصحاب العمل وحالة «أبحث بنشاط».',
    getPremium: 'الترقية إلى Premium',
    loading: 'جاري التحميل...',
    loadError: 'تعذر تحميل الحالة'
  }
};

const WorkerPremiumCard = () => {
  const navigate = useNavigate();
  const dashboard = useDashboard();
  const t = translations[dashboard.language] || translations.en;

  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await workerPremiumService.getWorkerAvailabilityStatus();
      setStatus(data);
    } catch (err) {
      setError(t.loadError);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = async (res) => {
    if (res?.success) {
      setStatus(res);
      setError('');
    }
  };

  const setAvailability = async (available) => {
    setSaving(true);
    setError('');
    try {
      const res = await workerPremiumService.updateWorkerAvailability(available);
      await apply(res);
    } catch (err) {
      setError(err?.response?.data?.error || t.loadError);
    } finally {
      setSaving(false);
    }
  };

  const setActivelyLooking = async (activelyLooking) => {
    setSaving(true);
    setError('');
    try {
      const res = await workerPremiumService.updateWorkerActivelyLooking(activelyLooking);
      await apply(res);
    } catch (err) {
      setError(err?.response?.data?.error || t.loadError);
    } finally {
      setSaving(false);
    }
  };

  if (!status) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">{error || t.loading}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">{t.cardTitle}</h3>
        {status.isPremium && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-full text-xs font-medium text-yellow-700">
            <Crown size={12} className="text-yellow-500" />
            {t.premiumActive}
          </span>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {/* Normal availability — free for every worker */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.availability}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setAvailability(true)}
            disabled={saving}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
              status.available
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t.available}
          </button>
          <button
            onClick={() => setAvailability(false)}
            disabled={saving}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
              !status.available
                ? 'bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t.unavailable}
          </button>
        </div>
      </div>

      {status.isPremium ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-gray-800 dark:text-white">
              <Zap size={16} className="text-emerald-500" />
              {t.activelyLooking}
            </span>
            <button
              role="switch"
              aria-checked={status.activelyLooking}
              onClick={() => setActivelyLooking(!status.activelyLooking)}
              disabled={saving || !status.available}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                status.activelyLooking ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
              } ${!status.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  status.activelyLooking ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {!status.available ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.activelyLookingOff}</p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.activelyLookingHint}</p>
          )}
          {status.subscription?.endDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1 flex-wrap">
              <Crown size={12} className="text-yellow-500" />
              {t.expiresOn.replace('{date}', new Date(status.subscription.endDate).toLocaleDateString())}
            </p>
          )}
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">{t.upsell}</p>
          <button
            onClick={() => navigate('/subscription')}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600 transition"
          >
            <Crown size={14} />
            {t.getPremium}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkerPremiumCard;