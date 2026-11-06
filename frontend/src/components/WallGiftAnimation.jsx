import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './wallGiftAnimation.css';

// Presentation only: balances and counts are changed by the confirmed API,
// never by an animation callback.
export default function WallGiftAnimation({ gift, recipient, destination, onComplete, queueCount = 0, onSkip }) {
  const { t } = useTranslation();
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => complete.current(), reduced ? 800 : 3200);
    return () => clearTimeout(timer);
  }, [gift.eventId]);
  const x = destination ? destination.x - window.innerWidth / 2 : 0;
  const y = destination ? destination.y - window.innerHeight / 2 : window.innerHeight * .3;
  return createPortal(<div className={`wall-gift-screen gift-${gift.id}`} style={{ '--gift-x': `${x}px`, '--gift-y': `${y}px`, '--gift-color': gift.color || '#f59e0b' }} role="status" aria-live="polite" aria-label={`${t('wall.gift')} · ${recipient}`}>
    {onSkip && <div className="wall-gift-queue"><span>{t('wall.giftQueue', { count: queueCount })}</span><button type="button" onClick={onSkip}>{t('wall.skipAnimations')}</button></div>}
    <div className="wall-gift-glow" />
    <div className="wall-gift-orbit" />
    <div className="wall-gift-orbit orbit-two" />
    <div className="wall-gift-particles" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i} style={{ '--i': i, '--angle': `${i * 15}deg`, '--delay': `${i % 5 * 70}ms` }}>{i % 3 ? '✦' : gift.emoji}</span>)}</div>
    <div className="wall-gift-flight"><div className="wall-gift-symbol" aria-hidden="true">{gift.emoji}</div></div>
    <div className="wall-gift-caption"><span>{t(`wall.${gift.id === 'flag' ? 'flagGift' : gift.id}`)}</span><strong>{recipient}</strong>{gift.senderName && <span>{t('wall.fromSender', { name: gift.senderName })}</span>}<span className="wall-gift-plus">+1 🎁</span></div>
  </div>, document.body);
}
