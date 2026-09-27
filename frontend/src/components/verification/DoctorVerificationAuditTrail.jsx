// frontend/src/components/verification/DoctorVerificationAuditTrail.jsx
// ============================================================
// DOCTOR VERIFICATION AUDIT TRAIL (read-only)
// ============================================================
// Every Doctor verification decision by an administrator (Admin or Sup-Admin)
// writes an immutable audit record. This component shows that history to
// Admin, Sup-Admin and read-only Sup-Help.
//
// The trail is strictly read-only: there is no mutation control here, and the
// backend exposes no update or delete route for audit records at all.
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const STATUS_TONE = {
  VERIFIED: 'text-emerald-600 dark:text-emerald-400',
  PENDING: 'text-amber-600 dark:text-amber-400',
  REJECTED: 'text-red-600 dark:text-red-400',
  UNVERIFIED: 'text-slate-500 dark:text-slate-400'
};

const DoctorVerificationAuditTrail = ({ doctorId, apiBase = '/api/admin' }) => {
  const { t } = useTranslation();
  const tr = (key, fallback) => t(`userProfileView.${key}`, fallback);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await api.get(`${apiBase}/doctors/${doctorId}/verification`);
      if (res.data?.success) {
        setEntries(Array.isArray(res.data.auditTrail) ? res.data.auditTrail : []);
      }
    } catch (err) {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [doctorId, apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const formatTimestamp = (value) => {
    if (!value) return tr('notProvided', 'Not provided');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return tr('notProvided', 'Not provided');
    return date.toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <History size={18} className="text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {tr('doctorAuditTrail', 'Verification Audit Trail')}
        </h3>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
          <ShieldCheck size={12} />
          {tr('doctorAuditTrailImmutable', 'Immutable record')}
        </span>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : failed ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tr('doctorAuditTrailUnavailable', 'Verification history is not available.')}
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tr('doctorAuditTrailEmpty', 'No verification decisions have been recorded yet.')}
          </p>
        ) : (
          <ol className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {tr(`doctorVerificationTypes.${entry.verificationType}`, entry.verificationType)}
                  </span>
                  <span className={STATUS_TONE[entry.previousStatus] || STATUS_TONE.UNVERIFIED}>
                    {entry.previousStatus}
                  </span>
                  <span aria-hidden="true" className="text-gray-400">&rarr;</span>
                  <span className={`font-semibold ${STATUS_TONE[entry.newStatus] || STATUS_TONE.UNVERIFIED}`}>
                    {entry.newStatus}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {tr('doctorAuditReviewer', 'Reviewer')}: {entry.reviewerName || entry.reviewerId || '—'}
                  {entry.reviewerRole ? ` (${entry.reviewerRole})` : ''}
                  {' · '}
                  {tr('doctorAuditTimestamp', 'Date')}: {formatTimestamp(entry.timestamp)}
                </p>
                {entry.rejectionReason ? (
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
                    {tr('doctorAuditRejectionReason', 'Rejection reason')}: {entry.rejectionReason}
                  </p>
                ) : null}
                {entry.notes ? (
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                    {tr('doctorAuditNotes', 'Notes')}: {entry.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default DoctorVerificationAuditTrail;
