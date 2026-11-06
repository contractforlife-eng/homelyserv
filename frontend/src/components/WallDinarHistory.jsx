import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, Coins, Gift, Wallet } from 'lucide-react';

export default function WallDinarHistory({ history, userId, busy, onMore }) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState('all');
  const summary = history.summary || {};
  const direction = entry => entry.type === 'PURCHASE' ? 'purchase' : entry.recipientId === userId ? 'received' : 'sent';
  const entries = (history.entries || []).filter(entry => filter === 'all' || direction(entry) === filter);
  return <section className="wall-history">
    <header><span className="wall-history-eyebrow"><Wallet size={17} />{t('wall.history')}</span><h2>{t('wall.balance')}</h2><strong>{Number(summary.balance || 0).toLocaleString(i18n.language)} <small>{t('wall.dinar')}</small></strong><p>{t('wall.walletNote')}</p></header>
    <div className="wall-history-stats">{[['purchased', 'purchased'], ['spent', 'spent'], ['received', 'received']].map(([key, label]) => <div key={key}><span>{t(`wall.${label}`)}</span><b>{Number(summary[key] || 0).toLocaleString(i18n.language)}</b><small>{t(key === 'received' ? 'wall.gift' : 'wall.dinar')}</small></div>)}</div>
    <nav aria-label={t('wall.history')} className="wall-history-tabs">{['all', 'purchase', 'sent', 'received'].map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(`wall.historyFilter.${value}`)}</button>)}</nav>
    <div className="wall-history-list">{!entries.length && <p className="wall-history-empty">{t('wall.noTransactions')}</p>}{entries.map(entry => {
      const kind = direction(entry), incoming = kind !== 'sent';
      const Icon = kind === 'purchase' ? Coins : kind === 'received' ? ArrowDownLeft : ArrowUpRight;
      return <article key={entry._id} className={`wall-history-entry transaction-${kind}`}>
        <span className="wall-history-icon" aria-hidden="true">{entry.type === 'GIFT' ? entry.giftEmoji || <Gift size={23} /> : <Icon size={23} />}</span>
        <div className="wall-history-description"><strong>{t(kind === 'purchase' ? 'wall.buy' : kind === 'received' ? 'wall.receivedGift' : 'wall.sentGift')}</strong>
          <p>{entry.type === 'GIFT' ? `${t(`wall.${entry.giftId === 'flag' ? 'flagGift' : entry.giftId}`)} · ${entry.peerName || t('wall.member')}` : t('wall.topUp')}</p>
          <time>{new Date(entry.createdAt).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
        <div className="wall-history-amount"><strong>{incoming ? '+' : '−'}{(kind === 'received' ? 1 : entry.quantity).toLocaleString(i18n.language)}</strong><small>{t(kind === 'received' ? 'wall.gift' : 'wall.dinar')}</small><span>{t('wall.completed')}</span></div>
      </article>;
    })}</div>
    {history.next && <button type="button" disabled={busy} className="wall-history-more" onClick={onMore}>{t('wall.more')}</button>}
    <p className="wall-history-footnote">{t('wall.appreciation')}</p>
  </section>;
}
