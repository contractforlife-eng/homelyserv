import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const REPORT_REASONS = ['Abuse', 'Fraud', 'Messages', 'Other'];

const ReportModal = ({ t, title, note, onClose, onSubmit, accentClass = 'text-teal-600', buttonClass = 'bg-teal-600 hover:bg-teal-700' }) => {
  const [reason, setReason] = useState('Abuse');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!description.trim()) {
      setError(t('messagesReporting.descriptionRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ reason, description: description.trim(), category: reason });
    } catch (submitError) {
      setError(submitError?.response?.data?.message || t('messagesReporting.failed'));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className={`flex items-center gap-2 text-lg font-semibold ${accentClass} dark:text-white`}>
            <AlertTriangle size={19} />
            {title}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={t('messagesReporting.cancel')}>
            <X size={20} />
          </button>
        </div>
        {note && <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{note}</p>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {t('messagesReporting.reason')}
            <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              {REPORT_REASONS.map((value) => <option key={value} value={value}>{t(`messagesReporting.reasons.${value}`)}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {t('messagesReporting.description')}
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} className="mt-1 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder={t('messagesReporting.descriptionPlaceholder')} />
          </label>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
              {t('messagesReporting.cancel')}
            </button>
            <button type="submit" disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${buttonClass}`}>
              {submitting ? t('messagesReporting.submitting') : t('messagesReporting.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
