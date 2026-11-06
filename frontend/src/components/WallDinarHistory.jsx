import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, Coins, Gift, Wallet, ShieldAlert, Award, AlertCircle, Clock, Layers } from 'lucide-react';

export default function WallDinarHistory({ history, userId, busy, onMore }) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState('all');
  const summary = history.summary || {};
  const upcoming = summary.upcomingExpiring || [];
  const lots = history.lots || [];

  const direction = entry => {
    if (entry.type === 'PURCHASE') return 'purchase';
    if (entry.type === 'ADMIN_GRANT') return 'grant';
    if (entry.type === 'ADMIN_DEDUCTION') return 'deduction';
    if (entry.type === 'EXPIRED') return 'expired';
    return entry.recipientId === userId ? 'received' : 'sent';
  };

  const entries = (history.entries || []).filter(entry => {
    if (filter === 'all') return true;
    const d = direction(entry);
    if (filter === 'purchase') return d === 'purchase' || d === 'grant';
    return d === filter;
  });

  return (
    <section className="wall-history">
      <header>
        <span className="wall-history-eyebrow"><Wallet size={17} />{t('wall.history')}</span>
        <h2>{t('wall.balance')}</h2>
        <strong>{Number(summary.balance || 0).toLocaleString(i18n.language)} <small>{t('wall.dinar')}</small></strong>
        <p>{t('wall.walletNote')}</p>
      </header>

      {upcoming.length > 0 && (
        <div className="wall-history-upcoming-alert" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          background: 'rgba(234, 88, 12, 0.1)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          borderRadius: '10px',
          color: '#ea580c',
          fontSize: '0.875rem'
        }}>
          <Clock size={18} style={{ flexShrink: 0 }} />
          <span>
            {t('wall.upcomingExpiryNotice', {
              quantity: upcoming[0].remainingQuantity.toLocaleString(i18n.language),
              date: new Date(upcoming[0].expiresAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' })
            })}
          </span>
        </div>
      )}

      {lots.length > 0 && (
        <div className="wall-lots-summary" style={{
          marginBottom: '20px',
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, margin: '0 0 10px 0', opacity: 0.85 }}>
            <Layers size={15} />
            {t('wall.lotsTitle')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lots.map(lot => {
              const isPurchase = lot.type === 'PURCHASE';
              const isExpired = lot.isExpired;
              return (
                <div key={lot.lotId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: isExpired ? 'rgba(239, 68, 68, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                  border: isExpired ? '1px solid rgba(239, 68, 68, 0.2)' : 'none'
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{isPurchase ? t('wall.buy') : t('wall.adminGrant')}</span>
                    <span style={{ opacity: 0.65, marginInlineStart: '6px', fontSize: '0.75rem' }}>
                      {lot.expiresAt
                        ? (isExpired
                            ? `(${t('wall.expiredDinars')})`
                            : t('wall.expiresOn', { date: new Date(lot.expiresAt).toLocaleDateString(i18n.language, { dateStyle: 'short' }) }))
                        : `(${t('wall.nonExpiring')})`}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, color: isExpired ? '#ef4444' : undefined }}>
                    {t('wall.remainingQuantity', {
                      remaining: Number(lot.remainingQuantity || 0).toLocaleString(i18n.language),
                      total: Number(lot.originalQuantity || 0).toLocaleString(i18n.language)
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="wall-history-stats">
        {[
          ['purchased', 'purchased'],
          ['spent', 'spent'],
          ['received', 'received']
        ].map(([key, label]) => (
          <div key={key}>
            <span>{t(`wall.${label}`)}</span>
            <b>{Number(summary[key] || 0).toLocaleString(i18n.language)}</b>
            <small>{t(key === 'received' ? 'wall.gift' : 'wall.dinar')}</small>
          </div>
        ))}
      </div>

      <nav aria-label={t('wall.history')} className="wall-history-tabs">
        {['all', 'purchase', 'sent', 'received'].map(value => (
          <button
            type="button"
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {t(`wall.historyFilter.${value}`)}
          </button>
        ))}
      </nav>

      <div className="wall-history-list">
        {!entries.length && <p className="wall-history-empty">{t('wall.noTransactions')}</p>}
        {entries.map(entry => {
          const kind = direction(entry);
          const incoming = kind === 'purchase' || kind === 'grant' || kind === 'received';
          let Icon = ArrowUpRight;
          if (kind === 'purchase') Icon = Coins;
          else if (kind === 'grant') Icon = Award;
          else if (kind === 'deduction') Icon = ShieldAlert;
          else if (kind === 'expired') Icon = AlertCircle;
          else if (kind === 'received') Icon = ArrowDownLeft;

          return (
            <article key={entry._id} className={`wall-history-entry transaction-${kind}`}>
              <span className="wall-history-icon" aria-hidden="true">
                {entry.type === 'GIFT' ? (entry.giftEmoji || <Gift size={23} />) : <Icon size={23} />}
              </span>
              <div className="wall-history-description">
                <strong>
                  {kind === 'purchase' && t('wall.buy')}
                  {kind === 'grant' && t('wall.adminGrant')}
                  {kind === 'deduction' && t('wall.adminDeduction')}
                  {kind === 'expired' && t('wall.expiredDinars')}
                  {kind === 'received' && t('wall.receivedGift')}
                  {kind === 'sent' && t('wall.sentGift')}
                </strong>
                <p>
                  {entry.type === 'GIFT' && `${t(`wall.${entry.giftId === 'flag' ? 'flagGift' : entry.giftId}`)} · ${entry.peerName || t('wall.member')}`}
                  {entry.type === 'PURCHASE' && (
                    entry.expiresAt
                      ? t('wall.expiresOn', { date: new Date(entry.expiresAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) })
                      : t('wall.topUp')
                  )}
                  {entry.type === 'ADMIN_GRANT' && `${t('wall.nonExpiring')} ${entry.reason ? `· ${entry.reason}` : ''}`}
                  {entry.type === 'ADMIN_DEDUCTION' && (entry.reason ? `${entry.reason}` : '')}
                  {entry.type === 'EXPIRED' && t('wall.expiredDinars')}
                </p>
                <time>{new Date(entry.createdAt).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</time>
              </div>
              <div className="wall-history-amount">
                <strong>{incoming ? '+' : '−'}{(kind === 'received' ? 1 : entry.quantity).toLocaleString(i18n.language)}</strong>
                <small>{t(kind === 'received' ? 'wall.gift' : 'wall.dinar')}</small>
                <span>{t('wall.completed')}</span>
              </div>
            </article>
          );
        })}
      </div>

      {history.next && (
        <button type="button" disabled={busy} className="wall-history-more" onClick={onMore}>
          {t('wall.more')}
        </button>
      )}
      <p className="wall-history-footnote">{t('wall.appreciation')}</p>
    </section>
  );
}
