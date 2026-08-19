// frontend/src/components/RatingDialog.jsx
// Modal dialog for submitting a 1-5 star rating on a Hire.
// - Title is "Rate Worker" (employer) or "Rate Employer" (worker).
// - Uses the backend-derived rating-status for eligibility.
// - Submit is disabled until a 1-5 star is selected.
// - Prevents double-submit while the POST is in flight.
// - Handles 409 (already rated) gracefully.
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import StarPicker from './StarPicker';

const RatingDialog = ({
  open,
  onClose,
  title,
  onSubmit,
  loading: externalLoading = false
}) => {
  const { t, i18n } = useTranslation();
  const [selectedStars, setSelectedStars] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    console.log('[i18n-diagnostic] language:', i18n.language);
    console.log('[i18n-diagnostic] exists(rating.title):', i18n.exists('rating.title'));
    console.log('[i18n-diagnostic] t(rating.title):', i18n.t('rating.title'));
    console.log('[i18n-diagnostic] bundle.rating:', i18n.getResourceBundle(i18n.language, 'translation')?.rating);
  }, [open, i18n]);

  const isSubmitting = submitting || externalLoading;
  const canSubmit = selectedStars >= 1 && selectedStars <= 5 && !isSubmitting;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !onSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit(selectedStars);
      // Parent handles status refresh + closing on success.
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedStars(0);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-dialog-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm mx-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 id="rating-dialog-title" className="text-xl font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            aria-label={t('rating.cancel')}
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('rating.selectStars')}
          </p>
          <StarPicker
            value={selectedStars}
            onChange={setSelectedStars}
            disabled={isSubmitting}
            size={32}
            label={title}
          />
          {selectedStars > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('rating.starsSelected', { count: selectedStars })}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            disabled={isSubmitting || selectedStars === 0}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50 text-sm"
          >
            {t('rating.reset')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            {t('rating.submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingDialog;
