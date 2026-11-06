import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flag, ExternalLink, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

export default function WallComplaintContext({ complaint }) {
  const { t } = useTranslation();
  const role = useAuthStore(state => state.user?.role);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  if (!complaint?.wallContentId) return null;
  const snapshot = complaint.wallSnapshot || {};
  const canModerate = ['ADMIN', 'SUPPORT'].includes(role);
  const postLink = `/wall?post=${complaint.wallPostId}${complaint.wallContentType === 'COMMENT' ? `&comment=${complaint.wallContentId}` : ''}`;
  const moderate = async hidden => {
    setBusy(true); setNotice('');
    try { await api.put(`/api/wall/admin/content/${complaint.wallContentId}`, { hidden }); setNotice(t(hidden ? 'wall.contentHidden' : 'wall.contentRestored')); }
    catch { setNotice(t('wall.error')); }
    finally { setBusy(false); }
  };
  return <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
    <h4 className="mb-3 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100"><Flag size={17} />{t(complaint.wallContentType === 'COMMENT' ? 'wall.commentReport' : 'wall.postReport')}</h4>
    <p className="mb-2 text-xs text-amber-800 dark:text-amber-200">{t('wall.contentAuthor')}: {snapshot.authorName || t('wall.member')}</p>
    {snapshot.text && <blockquote className="whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-100">{snapshot.text}</blockquote>}
    {snapshot.image && <img src={snapshot.image} alt={t('wall.reportImage')} className="mt-3 max-h-64 max-w-full rounded-lg object-contain" loading="lazy" />}
    <p className="mt-2 text-xs text-gray-500">{t('wall.reportSnapshot')}</p>
    <div className="mt-4 flex flex-wrap gap-2 text-xs">
      <Link to={postLink} className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-amber-900 dark:bg-gray-900 dark:text-amber-100"><ExternalLink size={14} />{t('wall.openReportedPost')}</Link>
      {canModerate && <><button type="button" disabled={busy} onClick={() => moderate(true)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-white disabled:opacity-50"><EyeOff size={14} />{t('wall.hide')}</button><button type="button" disabled={busy} onClick={() => moderate(false)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white disabled:opacity-50"><Eye size={14} />{t('wall.restore')}</button></>}
    </div>
    {notice && <p role="status" className="mt-3 text-xs">{notice}</p>}
  </section>;
}
