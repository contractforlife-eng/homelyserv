import { Link, useSearchParams } from 'react-router-dom';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Gift, Heart, MessageCircle, ImagePlus, X, Sparkles, Coins, Smartphone, Building2, Wallet, Landmark, ArrowLeft, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import SupportLayout from '../layouts/SupportLayout';
import { UserDisplayName } from '../components/users';
import ManualPaymentFlow from '../components/Payment/ManualPaymentFlow';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { countries } from '../utils/countries';
import { wallIdentity, wallIdentityStyle, wallAuthorIdentityStyle } from '../utils/wallIdentity';
import WallDinarHistory from '../components/WallDinarHistory';
import WallAvatar from '../components/WallAvatar';
import { getStaffIdentityTitle } from '../utils/staffIdentityPolicy';
import VerifiedBadge from '../components/verification/VerifiedBadge';

const flagEmoji = code => [...code].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
const giftKey = id => id === 'flag' ? 'flagGift' : id;
const requestKey = () => crypto.randomUUID();
const button = 'rounded-xl px-4 py-2 font-medium disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2';
const card = 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800';
const field = 'w-full rounded-xl border border-gray-300 bg-transparent p-3 dark:border-gray-600';

function Composer({ parentId, onDone, primary, act, busy }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const input = useRef(null);
  useEffect(() => {
    if (!image) { setPreview(''); return; }
    const url = URL.createObjectURL(image); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  return <form className="space-y-3" onSubmit={e => {
    e.preventDefault();
    act(async () => {
      if ((!text.trim() && !image) || text.trim().split(/\s+/u).length > 500 || (parentId && text.trim() && image)) throw new Error('INVALID_CONTENT');
      if (image && (image.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(image.type))) throw new Error('INVALID_CONTENT');
      const data = new FormData(); data.append('text', text); if (image) data.append('image', image);
      await api.post(parentId ? `/api/wall/posts/${parentId}/comments` : '/api/wall/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setText(''); setImage(null); if (input.current) input.current.value = ''; await onDone();
    });
  }}>
    <textarea aria-label={t(parentId ? 'wall.commentHint' : 'wall.write')} placeholder={t(parentId ? 'wall.commentHint' : 'wall.write')} className={field} maxLength={15000} rows={parentId ? 2 : 3} value={text} onChange={e => setText(e.target.value)} disabled={busy || (!!parentId && !!image)} />
    {preview && <div className="relative w-fit"><img src={preview} alt="" className="max-h-56 rounded-xl" /><button type="button" aria-label={t('wall.delete')} className="absolute end-1 top-1 rounded-full bg-white p-1 text-black" onClick={() => setImage(null)}><X size={18} /></button></div>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className={`${button} flex cursor-pointer items-center gap-2`}><ImagePlus size={20} /><span className="text-xs">{t('wall.commentHint')}</span><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy || (!!parentId && !!text.trim())} onChange={e => setImage(e.target.files?.[0] || null)} /></label>
      <button disabled={busy || (!text.trim() && !image)} className={`${button} ${primary}`} type="submit">{t(busy ? 'wall.working' : parentId ? 'wall.comment' : 'wall.publish')}</button>
    </div>
  </form>;
}

export default function Wall() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const wallView = searchParams.get('view') === 'mine' ? 'mine' : 'public';
  const currentUserId = String(user?.id || user?._id || '');
  const feedGeneration = useRef(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const focusedPost = searchParams.get('post');
  const focusedOnce = useRef(null);
  const role = user?.role;
  const support = ['SUPPORT', 'SUPPORT_HELPER'].includes(role);
  const moderator = ['ADMIN', 'SUPPORT'].includes(role);
  const primary = ({ WORKER: 'bg-red-600', EMPLOYER: 'bg-teal-600', DOCTOR: 'bg-red-600', TEACHER: 'bg-red-600', STUDENT: 'bg-red-600', ADMIN: 'bg-amber-600', SUPPORT: 'bg-green-600', SUPPORT_HELPER: 'bg-red-600' }[role] || 'bg-slate-700') + ' text-white';
  const [posts, setPosts] = useState([]);
  const [counterPop, setCounterPop] = useState(null);
  const giftCounters = useRef(new Map());
  const [next, setNext] = useState(null);
  const [store, setStore] = useState({ balance: 0, gifts: [] });
  const [panel, setPanel] = useState(null);
  const [target, setTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [flag, setFlag] = useState('EG');
  const [quantity, setQuantity] = useState(100);
  const [selectedMethodId, setSelectedMethodId] = useState('vodafone_cash');
  const [method, setMethod] = useState('');
  const [providers, setProviders] = useState(null);
  const [bank, setBank] = useState(null);
  const [reference, setReference] = useState('');
  const [history, setHistory] = useState({ entries: [], summary: {}, next: null });
  const [blocks, setBlocks] = useState([]);
  const [prices, setPrices] = useState({});
  const [comments, setComments] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const giftAttempt = useRef(null);
  const bankAttempt = useRef(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const load = useCallback(async (before = '') => {
    const generation = ++feedGeneration.current;
    const [feed, wallet] = await Promise.all([api.get('/api/wall/posts', { params: { scope: wallView, ...(before ? { before } : {}) } }), api.get('/api/wall/store')]);
    if (!before && focusedPost && !feed.data.posts.some(p => p.id === focusedPost)) {
      try { const focused = await api.get(`/api/wall/posts/${focusedPost}`); if (focused.data.post && (wallView === 'public' || String(focused.data.post.author?.id) === currentUserId)) feed.data.posts.unshift(focused.data.post); } catch {}
    }
    if (generation !== feedGeneration.current) return;
    setPosts(old => before ? [...old, ...feed.data.posts] : feed.data.posts); setNext(feed.data.next); setStore(wallet.data);
  }, [focusedPost, wallView, currentUserId]);
  const act = useCallback(async fn => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try { await fn(); } catch (e) {
      const code = e.response?.data?.code || e.message;
      setError(t(code === 'INSUFFICIENT_BALANCE' ? 'wall.insufficient' : code === 'INVALID_CONTENT' || code === 'TEXT_OR_IMAGE' ? 'wall.invalidContent' : 'wall.error'));
    } finally { inFlight.current = false; setBusy(false); }
  }, [t]);
  useEffect(() => {
    let active = true;
    setPosts([]); setComments({}); setNext(null); setFeedLoading(true);
    load().catch(() => { if (active) setError(t('wall.error')); }).finally(() => { if (active) setFeedLoading(false); });
    return () => { active = false; feedGeneration.current++; };
  }, [load, t]);
  useEffect(() => {
    if (!focusedPost || focusedOnce.current === focusedPost) return;
    const element = document.getElementById(`wall-post-${focusedPost}`);
    if (element) { focusedOnce.current = focusedPost; element.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (searchParams.get('comment')) loadComments(focusedPost).catch(() => {}); }
  }, [focusedPost, posts, searchParams]);
  useEffect(() => {
    const received = event => {
      setCounterPop(event.detail?.postId || null);
      load().then(() => setComments({})).catch(() => setError(t('wall.error')));
    };
    window.addEventListener('wall:gift:completed', received);
    return () => window.removeEventListener('wall:gift:completed', received);
  }, [load, t]);
  async function sendGift() {
    const result = await api.post(`/api/wall/posts/${target.id}/gifts`, { giftId: selected.id, flag }, { headers: { 'Idempotency-Key': giftAttempt.current } });
    setPanel(null);
    if (result.data.reused) { await load(); return; }
    window.dispatchEvent(new CustomEvent('wall:gift:sent', { detail: { eventId: result.data.receipt?.eventId || giftAttempt.current, postId: target.id,
      id: selected.id, emoji: selected.id === 'flag' ? flagEmoji(flag) : selected.emoji,
      recipient: target.author.displayName, color: wallIdentity(target.author.role).color, outgoing: true } }));
  }
  async function loadComments(postId, before = '') {
    const result = await api.get(`/api/wall/posts/${postId}/comments`, { params: before ? { before } : {} });
    setComments(old => ({ ...old, [postId]: { ...result.data, comments: before ? [...old[postId].comments, ...result.data.comments] : result.data.comments } }));
  }
  const identity = author => <span className="inline-flex items-center gap-3" style={wallAuthorIdentityStyle(author?.role)}>
    <WallAvatar author={author} />
    <span className="inline-flex flex-col gap-1"><span className="inline-flex items-center gap-1.5"><UserDisplayName user={{ id: author?.id, fullName: author?.displayName, role: author?.role }} isPremium={author?.isPremium === true} /><VerifiedBadge isVerified={author?.isVerified === true} size="sm" showLabel={false} /></span><span className="wall-role-tag">{getStaffIdentityTitle(author?.role) || t(`wall.roles.${author?.role || 'USER'}`)}</span></span>
    <span className="text-xs text-gray-500" title={t('wall.received')}>🎁 {author?.crown?.gifts || 0}</span>
    {!!author?.crown?.level && <span title={t('wall.crown', { count: author.crown.gifts, gems: author.crown.gems })} aria-label={t('wall.crown', { count: author.crown.gifts, gems: author.crown.gems })} className="inline-flex items-center gap-1 text-amber-500"><Crown size={16 + author.crown.level * 4} fill={author.crown.level === 4 ? 'currentColor' : 'none'} />{author.crown.gems > 0 && <span className="text-xs">💎 {author.crown.gems}</span>}</span>}
  </span>;
  const own = content => content.author?.id === String(user?.id || user?._id);
  const actions = content => <div className="flex flex-wrap gap-2 text-xs">
    {(own(content) || moderator) && <button disabled={busy} className={button} onClick={() => setConfirmDelete(content.id)}>{t('wall.delete')}</button>}
    {!own(content) && <>
      <button className={button} onClick={() => { setReportTarget(content.id); setReason(''); }}>{t('wall.report')}</button>
      <button disabled={busy} className={button} onClick={() => act(async () => { await api.put(`/api/wall/blocks/${content.author.id}`, { blocked: true }); await load(); setComments({}); setNotice(t('wall.blocked')); })}>{t('wall.block')}</button>
    </>}
  </div>;
  async function openStore() {
    setPanel('store'); setMethod(''); setBank(null); setProviders(null);
    const validQty = /^\d+$/.test(String(quantity)) && Number(quantity) >= 1 && Number(quantity) <= 1000000;
    const qtyToFetch = validQty ? quantity : 100;
    try {
      const result = await api.get('/api/payments/providers', { params: { purpose: 'DINAR_PURCHASE', dinarQuantity: qtyToFetch } });
      setProviders(result.data);
    } catch {}
  }
  const content = <>
    {!support && <DashboardHeader title={t('wall.nav')} notificationUserId={user?.id || user?._id} />}
    <main dir={i18n.dir()} style={wallIdentityStyle(role)} className="wall-page mx-auto space-y-5 text-gray-900 dark:text-gray-100">
      <header className="wall-hero">
        <div className="wall-hero-art" aria-hidden="true"><Sparkles /><span>✦</span><Heart /><Gift /></div>
        <div className="wall-hero-top"><span className="wall-hero-eyebrow"><Sparkles size={15} /> {t('wall.community')}</span><span className="wall-hero-role">{t(`wall.roles.${role || 'USER'}`)}</span></div>
        <div className="wall-hero-main"><div><h1>{t('wall.nav')}</h1><p>{t('wall.subtitle')}</p></div><button disabled={busy} className="wall-hero-store" onClick={() => act(openStore)}><Coins size={22} /><span>{t('wall.store')}<strong>{store.balance.toLocaleString(i18n.language)} ◈</strong></span><span aria-hidden="true">＋</span></button></div>
        <div className="wall-hero-bottom"><span><Gift size={17} />{t('wall.received')}<b>{(store.crown?.gifts || 0).toLocaleString(i18n.language)}</b></span><span><Crown size={17} />{t('wall.gems')}<b>{store.crown?.gems || 0}</b></span><span className="wall-hero-note">{t('wall.together')}</span></div>
      </header>
      <div className="wall-toolbar flex flex-wrap gap-2 text-sm">
        <button className={button} onClick={() => act(async () => { const r = await api.get('/api/wall/history'); setHistory(r.data); setPanel('history'); })}>{t('wall.history')}</button>
        <button className={button} onClick={() => act(async () => { const r = await api.get('/api/wall/blocks'); setBlocks(r.data.blocks); setPanel('blocks'); })}>{t('wall.blocks')}</button>
        {moderator && <button className={button} onClick={() => act(async () => { setPrices(Object.fromEntries(store.gifts.map(g => [g.id, g.price]))); setPanel('admin'); })}>{t('wall.admin')}</button>}
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-700">{notice}</p>}
      <section className={`${card} wall-composer-card`}><div className="wall-composer-intro"><WallAvatar author={{ ...user, displayName: user?.fullName }} /><div><strong>{t('wall.shareStory')}</strong><p>{t('wall.communityHint')}</p></div><Sparkles size={21} /></div><Composer primary={primary} act={act} busy={busy} onDone={load} /></section>
      <div role="tablist" aria-label={t('wall.nav')} className="wall-feed-tabs">{['public', 'mine'].map(view => <button key={view} id={`wall-tab-${view}`} role="tab" aria-selected={wallView === view} aria-controls="wall-feed" disabled={busy} onClick={() => { const params = new URLSearchParams(searchParams); params.set('view', view); params.delete('post'); params.delete('comment'); focusedOnce.current = null; setSearchParams(params); }}>{t(view === 'mine' ? 'wall.myWall' : 'wall.publicWall')}</button>)}</div>
      <section id="wall-feed" role="tabpanel" aria-labelledby={`wall-tab-${wallView}`} aria-busy={feedLoading} className="space-y-5">
      {!posts.length && <p className="py-8 text-center text-gray-500">{t(feedLoading ? 'wall.working' : wallView === 'mine' ? 'wall.myWallEmpty' : 'wall.empty')}</p>}
      {posts.map(post => <article id={`wall-post-${post.id}`} key={post.id} style={wallAuthorIdentityStyle(post.author?.role)} className={`${card} wall-person-card space-y-4`}>
        <header className="wall-person-header flex flex-wrap items-start justify-between gap-2"><div>{identity(post.author)}<p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString(i18n.language)}</p></div>{actions(post)}</header>
        {post.text && <p className="whitespace-pre-wrap break-words">{post.text}</p>}
        {post.image && <img src={post.image} alt="" loading="lazy" className="max-h-[550px] w-full rounded-xl object-contain" />}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
          <button disabled={busy} aria-pressed={post.liked} className={`${button} wall-author-action inline-flex items-center gap-2 ${post.liked ? 'text-red-600' : ''}`} onClick={() => act(async () => { await api.put(`/api/wall/posts/${post.id}/like`, { liked: !post.liked }); await load(); })}><Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />{t('wall.like')} {post.likes}</button>
          <button disabled={busy} className={`${button} wall-author-action inline-flex items-center gap-2`} onClick={() => act(() => loadComments(post.id))}><MessageCircle size={18} />{t('wall.comment')} {post.comments}</button>
          <button data-wall-gift-post={post.id} ref={element => { if (element) giftCounters.current.set(post.id, element); else giftCounters.current.delete(post.id); }} disabled={busy || own(post)} onAnimationEnd={() => setCounterPop(null)} className={`${button} wall-author-action inline-flex items-center gap-2 ${counterPop === post.id ? 'wall-counter-pop' : ''}`} onClick={() => { setTarget(post); setSelected(null); setPanel('gifts'); }}><Gift size={18} />{t('wall.gift')} {post.gifts}</button>
        </div>
        {comments[post.id] && <section className="space-y-3 border-t pt-3">
          <Composer parentId={post.id} primary={primary} act={act} busy={busy} onDone={async () => { await loadComments(post.id); await load(); }} />
          {comments[post.id].comments.map(c => <div key={c.id} style={wallAuthorIdentityStyle(c.author?.role)} className={`wall-person-card space-y-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-900 ${c.author?.isPremium ? 'wall-premium-comment' : ''}`}><div className="wall-person-header flex flex-wrap justify-between gap-2">{identity(c.author)}{c.author?.isPremium && <span className="wall-premium-label"><Crown size={13} />{t('wall.premiumComment')}</span>}{actions(c)}</div>{c.text && <p className="whitespace-pre-wrap break-words">{c.text}</p>}{c.image && <img src={c.image} alt="" loading="lazy" className="max-h-60 rounded-lg" />}</div>)}
          {comments[post.id].next && <button disabled={busy} className={button} onClick={() => act(() => loadComments(post.id, comments[post.id].next))}>{t('wall.more')}</button>}
        </section>}
      </article>)}
      {next && <button disabled={busy} className={`${button} ${primary}`} onClick={() => act(() => load(next))}>{t('wall.more')}</button>}
      </section>
      {(panel || reportTarget || confirmDelete) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget && !busy) { setPanel(null); setReportTarget(null); setConfirmDelete(null); } }}>
        <section role="dialog" aria-modal="true" aria-label={panel === 'store' ? t('wall.storeTitle') : t('wall.nav')} className={`${card} max-h-[90vh] w-full ${panel === 'history' || panel === 'store' ? 'max-w-[720px]' : 'max-w-lg'} space-y-4 overflow-y-auto`}>
          <button disabled={busy} className={`${button} float-end`} onClick={() => { setPanel(null); setReportTarget(null); setConfirmDelete(null); }} aria-label={t('wall.close')}><X /></button>
          {error && <p role="alert" className="text-red-600">{error}</p>}
          {confirmDelete && <><h2>{t('wall.delete')}?</h2><button disabled={busy} className={`${button} ${primary}`} onClick={() => act(async () => { await api.delete(`/api/wall/content/${confirmDelete}`); setConfirmDelete(null); setComments({}); await load(); })}>{t('wall.confirm')}</button></>}
          {reportTarget && <form className="space-y-3" onSubmit={e => { e.preventDefault(); act(async () => { const result = await api.post(`/api/wall/content/${reportTarget}/report`, { reason }); setReportTarget(null); setNotice(t(result.data.pending ? 'wall.reportQueued' : 'wall.reportInComplaints')); }); }}><h2>{t('wall.report')}</h2><textarea required maxLength={1000} aria-label={t('wall.reason')} placeholder={t('wall.reason')} className={field} value={reason} onChange={e => setReason(e.target.value)} /><button disabled={busy} className={`${button} ${primary}`}>{t('wall.submit')}</button></form>}
          {panel === 'gifts' && <><h2 className="text-xl font-bold">{t('wall.gift')}</h2><p>{t('wall.balance')}: {store.balance}</p><div className="wall-gift-picker grid grid-cols-2 gap-3 sm:grid-cols-3">{store.gifts.map(g => <button key={g.id} aria-pressed={selected?.id === g.id} disabled={busy} className={`rounded-xl border p-3 ${selected?.id === g.id ? 'border-amber-500 bg-amber-50 text-gray-900' : ''}`} onClick={() => { setSelected(g); giftAttempt.current = requestKey(); }}><span className="block text-4xl">{g.emoji}</span><span className="block text-sm">{t(`wall.${giftKey(g.id)}`)}</span><b>{g.price.toLocaleString(i18n.language)} ◈</b><span className="block text-xs text-gray-500">{(g.price / 10).toLocaleString(i18n.language, { style: 'currency', currency: 'EGP' })}</span></button>)}</div>
            {selected?.id === 'flag' && <select aria-label={t('wall.flag')} className={field} value={flag} onChange={e => { setFlag(e.target.value); giftAttempt.current = requestKey(); }}>{countries.map(c => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}</select>}
            {selected && <><p>{t('wall.confirmGift', { gift: t(`wall.${giftKey(selected.id)}`), price: selected.price })}</p><button disabled={busy} className={`${button} ${primary}`} onClick={() => act(sendGift)}>{t('wall.confirm')}</button></>}
            <p className="text-xs text-gray-500">{t('wall.appreciation')}</p></>}
          {panel === 'store' && (() => {
            const parsedQty = Number(quantity);
            const isValidQty = /^\d+$/.test(String(quantity).trim()) && Number.isSafeInteger(parsedQty) && parsedQty >= 1 && parsedQty <= 1000000;
            const amountEgp = isValidQty ? parsedQty * 0.10 : 0;
            const formattedTotal = isValidQty ? amountEgp.toLocaleString(i18n.language, { style: 'currency', currency: 'EGP' }) : '—';

            const isPaypalAvailable = Boolean(providers?.providers?.some(p => p.provider === 'paypal'));
            const isBankAvailable = Boolean(providers?.bankTransfer?.available);

            const methodCards = [
              {
                id: 'vodafone_cash',
                title: t('wall.methodVodafone'),
                desc: t('wall.methodVodafoneDesc'),
                icon: Smartphone,
                iconClass: 'wall-method-icon-vodafone',
                available: true,
              },
              {
                id: 'instapay',
                title: t('wall.methodInstapay'),
                desc: t('wall.methodInstapayDesc'),
                icon: Building2,
                iconClass: 'wall-method-icon-instapay',
                available: true,
              },
              {
                id: 'paypal',
                title: t('wall.methodPaypal'),
                desc: t('wall.methodPaypalDesc'),
                icon: Wallet,
                iconClass: 'wall-method-icon-paypal',
                available: isPaypalAvailable,
              },
              {
                id: 'bank_transfer',
                title: t('wall.methodBank'),
                desc: t('wall.methodBankDesc'),
                icon: Landmark,
                iconClass: 'wall-method-icon-bank',
                available: isBankAvailable,
              },
            ];

            const selectedMethodMeta = methodCards.find(m => m.id === selectedMethodId);
            const canContinue = isValidQty && !busy && selectedMethodMeta?.available;

            const handleContinue = () => {
              if (!canContinue) return;
              if (selectedMethodId === 'vodafone_cash' || selectedMethodId === 'instapay') {
                setMethod(selectedMethodId);
              } else if (selectedMethodId === 'paypal') {
                act(async () => {
                  const r = await api.post('/api/payments/create-payment-intent', {
                    purpose: 'DINAR_PURCHASE',
                    dinarQuantity: parsedQty,
                    paymentMethod: 'paypal'
                  });
                  if (r.data.previewOnly) {
                    setNotice(t('wall.paymentDemo'));
                    setPanel(null);
                    return;
                  }
                  if (!r.data.approvalUrl) throw new Error('PAYMENT_FAILED');
                  localStorage.setItem('homelyserv_dinar_paypal_order', r.data.orderId || '');
                  window.location.assign(r.data.approvalUrl);
                });
              } else if (selectedMethodId === 'bank_transfer') {
                act(async () => {
                  bankAttempt.current ||= requestKey();
                  const r = await api.post('/api/payments/bank-transfer/create', {
                    purpose: 'DINAR_PURCHASE',
                    dinarQuantity: parsedQty,
                    attemptKey: bankAttempt.current
                  });
                  setBank(r.data);
                });
              }
            };

            const presets = [
              { dinars: 100, egp: 10 },
              { dinars: 250, egp: 25 },
              { dinars: 500, egp: 50 },
              { dinars: 1000, egp: 100 },
            ];

            return (
              <div className="wall-store-container">
                <header className="wall-store-header">
                  <div className="wall-store-header-info">
                    <div className="wall-store-header-icon" aria-hidden="true">
                      <Coins size={26} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight">{t('wall.storeTitle')}</h2>
                      <p className="text-xs opacity-90">{t('wall.storeSubtitle')}</p>
                    </div>
                  </div>
                  <div className="wall-store-balance-badge">
                    <span>{t('wall.balance')}</span>
                    <strong>{store.balance.toLocaleString(i18n.language)} ◈</strong>
                  </div>
                </header>

                {/* Sub-flow active: Manual Payment (Vodafone/InstaPay) or Bank Transfer */}
                {method ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
                      <button
                        type="button"
                        className={`${button} inline-flex items-center gap-2 border border-gray-300 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700`}
                        onClick={() => setMethod('')}
                      >
                        <ArrowLeft size={16} className="rtl:rotate-180" />
                        {t('wall.backToStore')}
                      </button>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {parsedQty.toLocaleString(i18n.language)} ◈ ({formattedTotal})
                      </span>
                    </div>
                    <ManualPaymentFlow
                      key={`${method}:${parsedQty}`}
                      purpose="DINAR_PURCHASE"
                      dinarQuantity={parsedQty}
                      paymentMethod={method}
                      onCancel={() => setMethod('')}
                      onSubmitted={() => {
                        setNotice(t('wall.pending'));
                        setPanel(null);
                        setMethod('');
                      }}
                    />
                  </div>
                ) : bank ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
                      <button
                        type="button"
                        className={`${button} inline-flex items-center gap-2 border border-gray-300 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700`}
                        onClick={() => setBank(null)}
                      >
                        <ArrowLeft size={16} className="rtl:rotate-180" />
                        {t('wall.backToStore')}
                      </button>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {parsedQty.toLocaleString(i18n.language)} ◈ ({formattedTotal})
                      </span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{t('wall.methodBank')}</h3>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed dark:border-gray-700 dark:bg-gray-900">
                        <p className="whitespace-pre-wrap break-words font-mono" dir="ltr">
                          {Object.values(bank.transferInstructions || {}).join('\n')}
                        </p>
                      </div>
                      <form className="space-y-3" onSubmit={e => {
                        e.preventDefault();
                        act(async () => {
                          await api.post(`/api/payments/bank-transfer/${bank.payment.id}/submit-reference`, { externalTransactionReference: reference });
                          setNotice(t('wall.pending'));
                          setPanel(null);
                          setBank(null);
                        });
                      }}>
                        <label className="block text-sm font-medium">
                          {t('wall.reference')}
                          <input
                            required
                            minLength={3}
                            maxLength={100}
                            aria-label={t('wall.reference')}
                            placeholder={t('wall.reference')}
                            className={`${field} mt-1`}
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                          />
                        </label>
                        <button disabled={busy} className={`${button} ${primary} w-full py-3 text-base`}>
                          {t('wall.submit')}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  /* Main Store Selection Step */
                  <div className="space-y-5">
                    {/* Quantity Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('wall.choosePackage')}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">1 ◈ = 0.10 EGP</span>
                      </div>
                      <div className="wall-qty-grid">
                        {presets.map(pkg => {
                          const isSelected = isValidQty && parsedQty === pkg.dinars;
                          return (
                            <button
                              key={pkg.dinars}
                              type="button"
                              aria-pressed={isSelected}
                              disabled={busy}
                              className={`wall-qty-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setQuantity(pkg.dinars);
                                bankAttempt.current = null;
                              }}
                            >
                              <strong>{pkg.dinars.toLocaleString(i18n.language)} ◈</strong>
                              <span>{pkg.egp.toLocaleString(i18n.language, { style: 'currency', currency: 'EGP' })}</span>
                              {isSelected && (
                                <span className="absolute end-2 top-2 text-teal-600 dark:text-teal-400">
                                  <CheckCircle2 size={16} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom quantity input */}
                      <div className="pt-1">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {t('wall.customAmount')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="1000000"
                            step="1"
                            value={quantity}
                            aria-label={t('wall.quantity')}
                            placeholder={t('wall.customQuantityPlaceholder')}
                            className={`${field} ${!isValidQty ? 'border-red-500 focus:border-red-500' : ''}`}
                            onChange={e => {
                              setQuantity(e.target.value);
                              bankAttempt.current = null;
                            }}
                          />
                          <span className="pointer-events-none absolute end-3 top-3.5 text-sm font-bold text-gray-400">
                            ◈
                          </span>
                        </div>
                        {!isValidQty && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {t('wall.invalidQuantity')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order summary box */}
                    <div className="wall-summary-card flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">{t('wall.orderSummary')}</span>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                          {isValidQty ? `${parsedQty.toLocaleString(i18n.language)} ◈` : '—'}
                        </p>
                      </div>
                      <div className="text-end">
                        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">{t('wall.totalEgp')}</span>
                        <p className="text-2xl font-black text-teal-600 dark:text-teal-400">
                          {formattedTotal}
                        </p>
                      </div>
                    </div>

                    {/* Payment methods section */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('wall.paymentMethods')}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('wall.paymentMethodsSubtitle')}</p>
                      </div>
                      <div className="wall-method-grid">
                        {methodCards.map(m => {
                          const isSelected = selectedMethodId === m.id;
                          const Icon = m.icon;
                          const isCardDisabled = busy || !m.available;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              aria-pressed={isSelected}
                              aria-disabled={!m.available}
                              disabled={busy}
                              className={`wall-method-card ${isSelected ? 'selected' : ''} ${!m.available ? 'disabled' : ''}`}
                              onClick={() => {
                                if (m.available) {
                                  setSelectedMethodId(m.id);
                                }
                              }}
                            >
                              <div className={`wall-method-icon-wrap ${m.iconClass}`} aria-hidden="true">
                                <Icon size={22} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <strong className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.title}</strong>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                  {m.desc}
                                </p>
                                {!m.available && (
                                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                    <AlertCircle size={10} />
                                    {t('wall.unavailable')}
                                  </span>
                                )}
                              </div>
                              {isSelected && m.available && (
                                <div className="text-teal-600 dark:text-teal-400 flex-shrink-0">
                                  <CheckCircle2 size={18} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Primary Continue Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={!canContinue}
                        className={`${button} ${primary} w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-all`}
                        onClick={handleContinue}
                      >
                        {t('wall.continueToPayment', { amount: formattedTotal })}
                      </button>
                    </div>

                    {/* Currency rate notice, 1-month validity disclosure & non-cash disclaimer */}
                    <div className="space-y-1.5 text-center">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        ⏳ {t('wall.validityDisclosure')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('wall.rateNotice')}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {t('wall.appreciation')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          {panel === 'history' && <WallDinarHistory history={history} userId={String(user?.id || user?._id)} busy={busy} onMore={() => act(async () => { const r = await api.get('/api/wall/history', { params: { before: history.next } }); setHistory(previous => ({ ...r.data, entries: [...previous.entries, ...r.data.entries] })); })} />}
          {panel === 'blocks' && <><h2>{t('wall.blocks')}</h2>{blocks.map(b => <div key={b._id} className="flex items-center justify-between gap-2"><span className="truncate">{b.blockedId}</span><button disabled={busy} className={button} onClick={() => act(async () => { await api.put(`/api/wall/blocks/${b.blockedId}`, { blocked: false }); setBlocks(old => old.filter(v => v._id !== b._id)); await load(); })}>{t('wall.unblock')}</button></div>)}</>}
          {panel === 'admin' && <><h2>{t('wall.admin')}</h2><form className="space-y-2" onSubmit={e => { e.preventDefault(); act(async () => { await api.put('/api/wall/admin/gifts', { prices }); await load(); setNotice(t('wall.success')); }); }}><h3>{t('wall.prices')}</h3><p className="text-xs">{t('wall.priceReview')}</p>{store.gifts.map(g => <label key={g.id} className="flex items-center justify-between gap-3">{g.emoji} {t(`wall.${giftKey(g.id)}`)}<input className={`${field} max-w-28`} type="number" min="100" max="1000000" step="1" required value={prices[g.id] ?? g.price} onChange={e => setPrices(old => ({ ...old, [g.id]: Number(e.target.value) }))} /></label>)}<button disabled={busy} className={`${button} ${primary}`}>{t('wall.save')}</button></form><Link to={role === 'ADMIN' ? '/admin/complaints' : '/support-complaints'} className="block rounded-xl border border-amber-200 p-3 text-sm">{t('wall.reviewComplaints')}</Link></>}
        </section>
      </div>}

    </main>
  </>;
  return support ? <SupportLayout allowedRoles={['SUPPORT', 'SUPPORT_HELPER', 'ADMIN']} headerTitle="wall.nav">{content}</SupportLayout> : <DashboardLayout>{content}</DashboardLayout>;
}
