import { Link, useSearchParams } from 'react-router-dom';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Gift, Heart, MessageCircle, ImagePlus, Video, Edit2, CornerDownRight, X, Sparkles, Coins, Smartphone, Building2, Wallet, Landmark, ArrowLeft, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import SupportLayout from '../layouts/SupportLayout';
import { UserDisplayName } from '../components/users';
import ManualPaymentFlow from '../components/Payment/ManualPaymentFlow';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { countries } from '../utils/countries';
import { wallIdentity, wallIdentityStyle, wallAuthorIdentityStyle } from '../utils/wallIdentity';
import {
  applyOptimisticLike,
  reconcileLikeFailure,
  mergeFeedWithOptimisticLikes,
  addPendingComment,
  replacePendingComment,
  markCommentFailed,
  removePendingComment,
} from '../utils/wallFeedbackState';
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

function Composer({ parentId, isReply = false, onDone, onSubmitComment, primary, act, busy }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState('');
  const postDraftKey = useRef(parentId ? null : 'wall_post_draft_key_' + Math.random().toString(36).slice(2));
  const imageInput = useRef(null);
  const videoInput = useRef(null);

  useEffect(() => {
    if (!image) { setPreview(''); return; }
    const url = URL.createObjectURL(image); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!video) { setVideoPreview(''); return; }
    const url = URL.createObjectURL(video); setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  const handleVideoSelect = (file) => {
    setLocalError('');
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setLocalError(t('wall.videoTooLarge') || 'Video exceeds 50MB limit');
      return;
    }
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
      setLocalError(t('wall.invalidVideoFormat') || 'Unsupported video format. Use MP4, WebM, or MOV.');
      return;
    }
    setVideo(file);
    setImage(null);
    setPreview('');
  };

  const handleImageSelect = (file) => {
    setLocalError('');
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setLocalError(t('wall.invalidContent'));
      return;
    }
    setImage(file);
    setVideo(null);
    setVideoPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const hasMedia = !!(image || video);
    if ((!text.trim() && !hasMedia) || text.trim().split(/\s+/u).length > 500) return;
    if (parentId && text.trim() && image) return;

    if (parentId && typeof onSubmitComment === 'function') {
      const currentText = text;
      const currentImage = image;
      const currentPreview = preview;
      setText('');
      setImage(null);
      setPreview('');
      if (imageInput.current) imageInput.current.value = '';
      await onSubmitComment(parentId, currentText, currentImage, currentPreview);
      return;
    }

    if (!postDraftKey.current) {
      postDraftKey.current = 'wall_post_draft_key_' + Math.random().toString(36).slice(2);
    }
    const mutationId = postDraftKey.current;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const data = new FormData();
      data.append('text', text);
      if (image) data.append('image', image);
      if (video) data.append('video', video);
      data.append('clientMutationId', mutationId);

      await api.post('/api/wall/posts', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': mutationId,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });

      // Clear draft on success
      postDraftKey.current = null;
      setText('');
      setImage(null);
      setVideo(null);
      setPreview('');
      setVideoPreview('');
      setUploadProgress(0);
      if (imageInput.current) imageInput.current.value = '';
      if (videoInput.current) videoInput.current.value = '';
      await onDone();
    } catch (err) {
      const code = err.response?.data?.code || err.message;
      setLocalError(t(code === 'LIMIT_FILE_SIZE' || code === 'FILE_TOO_LARGE' ? 'wall.videoTooLarge' : code === 'INVALID_VIDEO' ? 'wall.invalidVideoFormat' : 'wall.error'));
      // Keep draft text and media intact on failure for safe retry
    } finally {
      setIsUploading(false);
    }
  };

  const placeholderKey = isReply ? 'wall.replyHint' : parentId ? 'wall.commentHint' : 'wall.write';

  return <form className="space-y-3" onSubmit={handleSubmit}>
    <textarea
      aria-label={t(placeholderKey)}
      placeholder={t(placeholderKey)}
      className={field}
      maxLength={15000}
      rows={parentId ? 2 : 3}
      value={text}
      onChange={e => setText(e.target.value)}
      disabled={busy || isUploading || (!!parentId && !!image)}
    />
    {preview && (
      <div className="relative w-fit">
        <img src={preview} alt="" className="max-h-56 rounded-xl" />
        <button type="button" aria-label={t('wall.delete')} className="absolute end-1 top-1 rounded-full bg-white p-1 text-black shadow" onClick={() => { setImage(null); if (imageInput.current) imageInput.current.value = ''; }}><X size={18} /></button>
      </div>
    )}
    {videoPreview && (
      <div className="relative w-fit max-w-full">
        <video src={videoPreview} controls playsInline className="max-h-64 rounded-xl bg-black" />
        <button type="button" aria-label={t('wall.delete')} className="absolute end-1 top-1 rounded-full bg-white p-1 text-black shadow" onClick={() => { setVideo(null); if (videoInput.current) videoInput.current.value = ''; }}><X size={18} /></button>
      </div>
    )}
    {isUploading && (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{video ? t('wall.uploadingVideo') : t('wall.working')}</span>
          <span>{uploadProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
          <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      </div>
    )}
    {localError && <p role="alert" className="text-xs text-red-600 font-medium">{localError}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <label className={`${button} flex cursor-pointer items-center gap-2`} title={t('wall.commentHint')}>
          <ImagePlus size={20} />
          <span className="text-xs hidden sm:inline">{t('wall.commentHint')}</span>
          <input
            ref={imageInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy || isUploading || !!video || (!!parentId && !!text.trim())}
            onChange={e => handleImageSelect(e.target.files?.[0] || null)}
          />
        </label>
        {!parentId && (
          <label className={`${button} flex cursor-pointer items-center gap-2`} title={t('wall.video')}>
            <Video size={20} />
            <span className="text-xs hidden sm:inline">{t('wall.video')}</span>
            <input
              ref={videoInput}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="sr-only"
              disabled={busy || isUploading || !!image}
              onChange={e => handleVideoSelect(e.target.files?.[0] || null)}
            />
          </label>
        )}
      </div>
      <button
        disabled={busy || isUploading || (!text.trim() && !image && !video)}
        className={`${button} ${primary}`}
        type="submit"
      >
        {t(isUploading || busy ? 'wall.working' : isReply ? 'wall.reply' : parentId ? 'wall.comment' : 'wall.publish')}
      </button>
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
  const [likePending, setLikePending] = useState({});
  const likeSeqMap = useRef(new Map());
  const likeQueueRef = useRef(new Map()); // postId -> Promise queue for coalescing rapid clicks
  const [commentsLoading, setCommentsLoading] = useState({});
  const inFlight = useRef(false);
  const giftAttempt = useRef(null);
  const isSendingGiftRef = useRef(false);
  const [isSendingGift, setIsSendingGift] = useState(false);
  const bankAttempt = useRef(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [editText, setEditText] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replies, setReplies] = useState({});
  const [repliesLoading, setRepliesLoading] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const load = useCallback(async (before = '') => {
    const generation = ++feedGeneration.current;
    const [feed, wallet] = await Promise.all([api.get('/api/wall/posts', { params: { scope: wallView, ...(before ? { before } : {}) } }), api.get('/api/wall/store')]);
    if (!before && focusedPost && !feed.data.posts.some(p => p.id === focusedPost)) {
      try { const focused = await api.get(`/api/wall/posts/${focusedPost}`); if (focused.data.post && (wallView === 'public' || String(focused.data.post.author?.id) === currentUserId)) feed.data.posts.unshift(focused.data.post); } catch {}
    }
    if (generation !== feedGeneration.current) return;
    setPosts(old => {
      const mergedIncoming = mergeFeedWithOptimisticLikes(old, feed.data.posts, likeSeqMap.current);
      return before ? [...old, ...mergedIncoming] : mergedIncoming;
    });
    setNext(feed.data.next);
    setStore(wallet.data);
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
  async function toggleLike(post) {
    const postId = String(post.id);
    const previousLiked = post.liked;
    const currentSeq = likeSeqMap.current.get(postId) || 0;

    // 1. Immediate optimistic UI feedback
    const { updatedPosts, newLiked, targetSeq } = applyOptimisticLike(posts, postId, currentSeq);
    likeSeqMap.current.set(postId, targetSeq);
    setPosts(updatedPosts);
    setLikePending(prev => ({ ...prev, [postId]: true }));

    // 2. Coalesced serialized queue per post: requests execute strictly in order
    const previousTask = likeQueueRef.current.get(postId) || Promise.resolve();
    const currentTask = previousTask.then(async () => {
      // Check if user has toggled again while queued; only sync latest intent
      const activeSeq = likeSeqMap.current.get(postId);
      try {
        const res = await api.put(`/api/wall/posts/${postId}/like`, { liked: newLiked });
        // If server returns latest state and sequence matches active, reconcile cleanly
        if (activeSeq === targetSeq && res.data && typeof res.data.liked === 'boolean') {
          setPosts(current => current.map(p => {
            if (p.id !== postId) return p;
            return { ...p, liked: res.data.liked };
          }));
        }
      } catch (err) {
        // Roll back if this response matches the user's latest sequence
        setPosts(current => reconcileLikeFailure(current, postId, targetSeq, previousLiked));
        setError(t('wall.error'));
      } finally {
        if (likeSeqMap.current.get(postId) === targetSeq) {
          likeSeqMap.current.delete(postId);
          setLikePending(prev => {
            const next = { ...prev };
            delete next[postId];
            return next;
          });
        }
      }
    });

    likeQueueRef.current.set(postId, currentTask.catch(() => {}));
  }

  async function sendGift() {
    if (isSendingGiftRef.current || !selected || !target) return;
    isSendingGiftRef.current = true;
    setIsSendingGift(true);
    setError('');

    if (!giftAttempt.current) {
      giftAttempt.current = requestKey();
    }
    const attemptKey = giftAttempt.current;
    const targetPost = target;
    const selectedGift = selected;
    const selectedFlag = flag;

    try {
      const result = await api.post(
        `/api/wall/posts/${targetPost.id}/gifts`,
        { giftId: selectedGift.id, flag: selectedFlag },
        { headers: { 'Idempotency-Key': attemptKey } }
      );

      // Successfully sent or reused: update local store balance directly
      if (typeof result.data.balance === 'number') {
        setStore(prev => ({ ...prev, balance: result.data.balance }));
      } else {
        setStore(prev => ({ ...prev, balance: Math.max(0, prev.balance - selectedGift.price) }));
      }

      // Update post gift counter optimistically without full feed reload only if not already counted (not reused)
      if (!result.data.reused) {
        setPosts(prev => prev.map(p => p.id === targetPost.id ? { ...p, gifts: (p.gifts || 0) + 1 } : p));
      }

      setPanel(null);
      giftAttempt.current = null; // Clear key on completed transaction

      // Trigger animation event for gift queue only if this was an initial delivery, not a duplicate retry replay
      if (!result.data.reused) {
        window.dispatchEvent(new CustomEvent('wall:gift:sent', {
          detail: {
            eventId: result.data.receipt?.eventId || attemptKey,
            postId: targetPost.id,
            id: selectedGift.id,
            emoji: selectedGift.id === 'flag' ? flagEmoji(selectedFlag) : selectedGift.emoji,
            recipient: targetPost.author.displayName,
            color: wallIdentity(targetPost.author.role).color,
            outgoing: true,
          }
        }));
      }
    } catch (err) {
      const code = err.response?.data?.code || err.message;
      setError(t(code === 'INSUFFICIENT_BALANCE' ? 'wall.insufficient' : 'wall.error'));
      // Keep same giftAttempt.current so user retry of ambiguous network error is safe and idempotent
    } finally {
      isSendingGiftRef.current = false;
      setIsSendingGift(false);
    }
  }

  async function loadReplies(commentId, after = '') {
    setRepliesLoading(prev => ({ ...prev, [commentId]: true }));
    try {
      const res = await api.get(`/api/wall/comments/${commentId}/replies`, { params: after ? { after } : {} });
      setReplies(old => {
        const existing = old[commentId]?.replies || [];
        const incoming = res.data.replies || [];
        // Append incoming results to existing list while ensuring deduplication
        const seenIds = new Set(existing.map(r => r.id));
        const filteredIncoming = incoming.filter(r => !seenIds.has(r.id));
        return {
          ...old,
          [commentId]: {
            ...res.data,
            replies: after ? [...existing, ...filteredIncoming] : incoming
          }
        };
      });
      setExpandedReplies(old => ({ ...old, [commentId]: true }));
    } catch {
      setError(t('wall.error'));
    } finally {
      setRepliesLoading(prev => ({ ...prev, [commentId]: false }));
    }
  }

  async function submitReply(commentId, text, image, previewUrl) {
    const clientMutationId = requestKey();
    const data = new FormData();
    if (text) data.append('text', text);
    if (image) data.append('image', image);
    data.append('clientMutationId', clientMutationId);

    try {
      const res = await api.post(`/api/wall/comments/${commentId}/replies`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': clientMutationId,
        }
      });
      const newReply = res.data.content;
      setReplies(prev => ({
        ...prev,
        [commentId]: {
          replies: [...(prev[commentId]?.replies || []), newReply]
        }
      }));
      setExpandedReplies(old => ({ ...old, [commentId]: true }));
      setReplyingCommentId(null);
      // Update comment repliesCount
      setComments(prev => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          if (next[pid]?.comments) {
            next[pid] = {
              ...next[pid],
              comments: next[pid].comments.map(c => c.id === commentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c)
            };
          }
        }
        return next;
      });
    } catch (err) {
      setError(t('wall.error'));
    }
  }

  function startEditing(content) {
    setEditingContent(content);
    setEditText(content.text || '');
    setEditError('');
  }

  function cancelEditing() {
    setEditingContent(null);
    setEditText('');
    setEditError('');
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editingContent) return;
    setEditBusy(true);
    setEditError('');
    try {
      const res = await api.put(`/api/wall/content/${editingContent.id}`, { text: editText });
      const updated = res.data.content;
      // Update in posts
      setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, text: updated.text, isEdited: true, editedAt: updated.editedAt } : p));
      // Update in comments
      setComments(prev => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          if (next[pid]?.comments) {
            next[pid] = {
              ...next[pid],
              comments: next[pid].comments.map(c => c.id === updated.id ? { ...c, text: updated.text, isEdited: true, editedAt: updated.editedAt } : c)
            };
          }
        }
        return next;
      });
      // Update in replies
      setReplies(prev => {
        const next = { ...prev };
        for (const cid of Object.keys(next)) {
          if (next[cid]?.replies) {
            next[cid] = {
              ...next[cid],
              replies: next[cid].replies.map(r => r.id === updated.id ? { ...r, text: updated.text, isEdited: true, editedAt: updated.editedAt } : r)
            };
          }
        }
        return next;
      });
      cancelEditing();
      setNotice(t('wall.success'));
    } catch (err) {
      const code = err.response?.data?.code || err.message;
      setEditError(t(code === 'INVALID_CONTENT' ? 'wall.invalidContent' : 'wall.error'));
    } finally {
      setEditBusy(false);
    }
  }

  async function loadComments(postId, before = '') {
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const result = await api.get(`/api/wall/posts/${postId}/comments`, { params: before ? { before } : {} });
      setComments(old => ({
        ...old,
        [postId]: {
          ...result.data,
          comments: before ? [...(old[postId]?.comments || []), ...result.data.comments] : result.data.comments
        }
      }));
    } catch {
      setError(t('wall.error'));
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  }

  async function submitComment(postId, text, image, previewUrl) {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const clientMutationId = requestKey();

    // 1. Immediate pending comment in state with real user identity
    const pendingComment = {
      id: tempId,
      postId,
      text,
      image: previewUrl ? previewUrl : null,
      _previewUrl: previewUrl,
      author: {
        id: currentUserId,
        displayName: user?.fullName || 'You',
        role: user?.role || 'USER',
        isPremium: user?.isPremium === true,
        isVerified: user?.isVerified === true,
        crown: store.crown || { gifts: 0, gems: 0, level: 0 },
      },
      createdAt: new Date().toISOString(),
      _pending: true,
      _clientMutationId: clientMutationId,
    };

    setComments(prev => addPendingComment(prev, postId, pendingComment));
    // Immediately increment post comments counter
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p));

    // 2. Dispatch server creation with Idempotency-Key
    try {
      const data = new FormData();
      if (text) data.append('text', text);
      if (image) data.append('image', image);
      data.append('clientMutationId', clientMutationId);

      const res = await api.post(`/api/wall/posts/${postId}/comments`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': clientMutationId,
        }
      });

      const serverComment = res.data.content;
      setComments(prev => replacePendingComment(prev, postId, tempId, serverComment));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } catch (err) {
      setComments(prev => markCommentFailed(prev, postId, tempId, t('wall.error')));
      // Rollback post comments counter
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: Math.max(0, (p.comments || 1) - 1) } : p));
      setError(t('wall.error'));
    }
  }

  async function retryFailedComment(postId, failedComment) {
    const tempId = failedComment.id;
    const clientMutationId = failedComment._clientMutationId || requestKey();

    // Reset failed state
    setComments(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        comments: prev[postId].comments.map(c => c.id === tempId ? { ...c, _failed: false, _error: null } : c),
      }
    }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p));

    try {
      const data = new FormData();
      if (failedComment.text) data.append('text', failedComment.text);
      data.append('clientMutationId', clientMutationId);

      const res = await api.post(`/api/wall/posts/${postId}/comments`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': clientMutationId,
        }
      });

      const serverComment = res.data.content;
      setComments(prev => replacePendingComment(prev, postId, tempId, serverComment));
      if (failedComment._previewUrl) URL.revokeObjectURL(failedComment._previewUrl);
    } catch (err) {
      setComments(prev => markCommentFailed(prev, postId, tempId, t('wall.error')));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: Math.max(0, (p.comments || 1) - 1) } : p));
      setError(t('wall.error'));
    }
  }
  const identity = author => <span className="inline-flex items-center gap-3" style={wallAuthorIdentityStyle(author?.role)}>
    <WallAvatar author={author} />
    <span className="inline-flex flex-col gap-1"><span className="inline-flex items-center gap-1.5"><UserDisplayName user={{ id: author?.id, fullName: author?.displayName, role: author?.role }} isPremium={author?.isPremium === true} /><VerifiedBadge isVerified={author?.isVerified === true} size="sm" showLabel={false} /></span><span className="wall-role-tag">{getStaffIdentityTitle(author?.role) || t(`wall.roles.${author?.role || 'USER'}`)}</span></span>
    <span className="text-xs text-gray-500" title={t('wall.received')}>🎁 {author?.crown?.gifts || 0}</span>
    {!!author?.crown?.level && <span title={t('wall.crown', { count: author.crown.gifts, gems: author.crown.gems })} aria-label={t('wall.crown', { count: author.crown.gifts, gems: author.crown.gems })} className="inline-flex items-center gap-1 text-amber-500"><Crown size={16 + author.crown.level * 4} fill={author.crown.level === 4 ? 'currentColor' : 'none'} />{author.crown.gems > 0 && <span className="text-xs">💎 {author.crown.gems}</span>}</span>}
  </span>;
  const own = content => content.author?.id === String(user?.id || user?._id);
  const actions = content => <div className="flex flex-wrap gap-2 text-xs">
    {own(content) && <button disabled={busy} className={button} onClick={() => startEditing(content)}>{t('wall.edit')}</button>}
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
        <header className="wall-person-header flex flex-wrap items-start justify-between gap-2">
          <div>
            {identity(post.author)}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{new Date(post.createdAt).toLocaleString(i18n.language)}</span>
              {post.isEdited && <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">({t('wall.edited')})</span>}
            </div>
          </div>
          {actions(post)}
        </header>
        {post.text && <p className="whitespace-pre-wrap break-words">{post.text}</p>}
        {post.image && <img src={post.image} alt="" loading="lazy" className="max-h-[550px] w-full rounded-xl object-contain" />}
        {post.video && (
          <div className="w-full overflow-hidden rounded-xl bg-black">
            <video src={post.video} controls playsInline preload="metadata" className="max-h-[550px] w-full object-contain" />
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
          <button
            aria-pressed={post.liked}
            disabled={likePending[post.id]}
            className={`${button} wall-author-action inline-flex items-center gap-2 transition-transform active:scale-95 ${post.liked ? 'text-red-600 font-bold' : ''}`}
            onClick={() => toggleLike(post)}
          >
            <Heart size={18} fill={post.liked ? 'currentColor' : 'none'} className={post.liked ? 'animate-in zoom-in-50 duration-150' : ''} />
            {t('wall.like')} {post.likes}
          </button>
          <button
            className={`${button} wall-author-action inline-flex items-center gap-2`}
            onClick={() => loadComments(post.id)}
          >
            <MessageCircle size={18} />
            {t('wall.comment')} {post.comments}
            {commentsLoading[post.id] && <span className="inline-block h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />}
          </button>
          <button data-wall-gift-post={post.id} ref={element => { if (element) giftCounters.current.set(post.id, element); else giftCounters.current.delete(post.id); }} disabled={own(post)} onAnimationEnd={() => setCounterPop(null)} className={`${button} wall-author-action inline-flex items-center gap-2 ${counterPop === post.id ? 'wall-counter-pop' : ''}`} onClick={() => { setTarget(post); setSelected(null); setPanel('gifts'); }}><Gift size={18} />{t('wall.gift')} {post.gifts}</button>
        </div>
        {comments[post.id] && <section className="space-y-3 border-t pt-3">
          <Composer parentId={post.id} primary={primary} act={act} busy={busy} onSubmitComment={submitComment} onDone={async () => { await loadComments(post.id); }} />
          {comments[post.id].comments.map(c => (
            <div
              key={c.id}
              style={wallAuthorIdentityStyle(c.author?.role)}
              className={`wall-person-card space-y-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-900 transition-opacity ${c._pending ? 'opacity-70 border border-dashed border-gray-300 dark:border-gray-600' : ''} ${c.author?.isPremium ? 'wall-premium-comment' : ''}`}
            >
              <div className="wall-person-header flex flex-wrap justify-between gap-2">
                <div>
                  {identity(c.author)}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{new Date(c.createdAt).toLocaleString(i18n.language)}</span>
                    {c.isEdited && <span className="inline-flex items-center gap-1 rounded bg-gray-200/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">({t('wall.edited')})</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c._pending && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">{t('wall.working')}</span>}
                  {c._failed && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600">
                      <span>⚠️ {c._error || t('wall.error')}</span>
                      <button type="button" className="underline font-bold" onClick={() => retryFailedComment(post.id, c)}>
                        {t('wall.retry') || 'Retry'}
                      </button>
                      <span>·</span>
                      <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setComments(prev => removePendingComment(prev, post.id, c.id))}>
                        {t('wall.delete')}
                      </button>
                    </div>
                  )}
                  {c.author?.isPremium && <span className="wall-premium-label"><Crown size={13} />{t('wall.premiumComment')}</span>}
                  {!c._pending && actions(c)}
                </div>
              </div>
              {c.text && <p className="whitespace-pre-wrap break-words">{c.text}</p>}
              {c.image && <img src={typeof c.image === 'string' ? c.image : c.image.url} alt="" loading="lazy" className="max-h-60 rounded-lg" />}

              {/* Comment bottom actions: Reply and View Replies */}
              {!c._pending && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400"
                    onClick={() => setReplyingCommentId(replyingCommentId === c.id ? null : c.id)}
                  >
                    <CornerDownRight size={13} />
                    {t('wall.reply')}
                  </button>
                  {((c.repliesCount || 0) > 0 || (replies[c.id]?.replies?.length || 0) > 0) && (
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 font-medium"
                      onClick={() => {
                        if (expandedReplies[c.id]) {
                          setExpandedReplies(old => ({ ...old, [c.id]: false }));
                        } else {
                          loadReplies(c.id);
                        }
                      }}
                    >
                      {expandedReplies[c.id]
                        ? t('wall.hideReplies')
                        : t('wall.showReplies', { count: Math.max(c.repliesCount || 0, replies[c.id]?.replies?.length || 0) })}
                      {repliesLoading[c.id] && <span className="inline-block ms-1 h-2.5 w-2.5 animate-spin rounded-full border border-gray-400 border-t-transparent" />}
                    </button>
                  )}
                </div>
              )}

              {/* Inline Reply Composer */}
              {replyingCommentId === c.id && (
                <div className="ps-4 sm:ps-6 border-s-2 border-teal-500/40 mt-2">
                  <Composer
                    parentId={c.id}
                    isReply={true}
                    primary={primary}
                    act={act}
                    busy={busy}
                    onSubmitComment={submitReply}
                    onDone={async () => {
                      await loadReplies(c.id);
                      setReplyingCommentId(null);
                    }}
                  />
                </div>
              )}

              {/* Nested Replies List */}
              {expandedReplies[c.id] && replies[c.id]?.replies && (
                <div className="ps-4 sm:ps-6 border-s-2 border-gray-200 dark:border-gray-700 space-y-2 mt-2">
                  {replies[c.id].replies.map(r => (
                    <div
                      key={r.id}
                      style={wallAuthorIdentityStyle(r.author?.role)}
                      className="rounded-lg bg-white/70 dark:bg-gray-800/70 p-2.5 space-y-1.5 border border-gray-100 dark:border-gray-700/60"
                    >
                      <div className="flex flex-wrap justify-between gap-1 items-start">
                        <div>
                          {identity(r.author)}
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            <span>{new Date(r.createdAt).toLocaleString(i18n.language)}</span>
                            {r.isEdited && <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1 py-0.2 text-[9px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">({t('wall.edited')})</span>}
                          </div>
                        </div>
                        {actions(r)}
                      </div>
                      {r.text && <p className="text-xs whitespace-pre-wrap break-words">{r.text}</p>}
                      {r.image && <img src={typeof r.image === 'string' ? r.image : r.image.url} alt="" loading="lazy" className="max-h-48 rounded-lg" />}
                    </div>
                  ))}
                  {replies[c.id].next && (
                    <button
                      disabled={repliesLoading[c.id]}
                      className="text-xs text-teal-600 font-medium hover:underline"
                      onClick={() => loadReplies(c.id, replies[c.id].next)}
                    >
                      {t('wall.more')}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {comments[post.id].next && <button disabled={commentsLoading[post.id]} className={button} onClick={() => loadComments(post.id, comments[post.id].next)}>{t('wall.more')}</button>}
        </section>}
      </article>)}
      {next && <button disabled={busy} className={`${button} ${primary}`} onClick={() => act(() => load(next))}>{t('wall.more')}</button>}
      </section>
      {(panel || reportTarget || confirmDelete || editingContent) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget && !busy && !editBusy) { setPanel(null); setReportTarget(null); setConfirmDelete(null); cancelEditing(); } }}>
        <section role="dialog" aria-modal="true" aria-label={panel === 'store' ? t('wall.storeTitle') : t('wall.nav')} className={`${card} max-h-[90vh] w-full ${panel === 'history' || panel === 'store' ? 'max-w-[720px]' : 'max-w-lg'} space-y-4 overflow-y-auto`}>
          <button disabled={busy || editBusy} className={`${button} float-end`} onClick={() => { setPanel(null); setReportTarget(null); setConfirmDelete(null); cancelEditing(); }} aria-label={t('wall.close')}><X /></button>
          {error && <p role="alert" className="text-red-600">{error}</p>}
          {editingContent && (
            <form className="space-y-4" onSubmit={submitEdit}>
              <h2 className="text-lg font-bold">{t('wall.edit')}</h2>
              {editError && <p role="alert" className="text-xs text-red-600">{editError}</p>}
              <textarea
                aria-label={t('wall.edit')}
                className={field}
                rows={4}
                maxLength={15000}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                disabled={editBusy}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={editBusy}
                  className={button}
                  onClick={cancelEditing}
                >
                  {t('wall.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={editBusy || (!editText.trim() && !editingContent.image && !editingContent.video)}
                  className={`${button} ${primary} inline-flex items-center gap-2`}
                >
                  {editBusy && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  {t(editBusy ? 'wall.working' : 'wall.saveChanges')}
                </button>
              </div>
            </form>
          )}
          {confirmDelete && <><h2>{t('wall.delete')}?</h2><button disabled={busy} className={`${button} ${primary}`} onClick={() => act(async () => { await api.delete(`/api/wall/content/${confirmDelete}`); setConfirmDelete(null); setComments({}); await load(); })}>{t('wall.confirm')}</button></>}
          {reportTarget && <form className="space-y-3" onSubmit={e => { e.preventDefault(); act(async () => { const result = await api.post(`/api/wall/content/${reportTarget}/report`, { reason }); setReportTarget(null); setNotice(t(result.data.pending ? 'wall.reportQueued' : 'wall.reportInComplaints')); }); }}><h2>{t('wall.report')}</h2><textarea required maxLength={1000} aria-label={t('wall.reason')} placeholder={t('wall.reason')} className={field} value={reason} onChange={e => setReason(e.target.value)} /><button disabled={busy} className={`${button} ${primary}`}>{t('wall.submit')}</button></form>}
          {panel === 'gifts' && <><h2 className="text-xl font-bold">{t('wall.gift')}</h2><p>{t('wall.balance')}: {store.balance}</p><div className="wall-gift-picker grid grid-cols-2 gap-3 sm:grid-cols-3">{store.gifts.map(g => <button key={g.id} aria-pressed={selected?.id === g.id} disabled={busy || isSendingGift} className={`rounded-xl border p-3 ${selected?.id === g.id ? 'border-amber-500 bg-amber-50 text-gray-900' : ''}`} onClick={() => { setSelected(g); giftAttempt.current = requestKey(); }}><span className="block text-4xl">{g.emoji}</span><span className="block text-sm">{t(`wall.${giftKey(g.id)}`)}</span><b>{g.price.toLocaleString(i18n.language)} ◈</b><span className="block text-xs text-gray-500">{(g.price / 10).toLocaleString(i18n.language, { style: 'currency', currency: 'EGP' })}</span></button>)}</div>
            {selected?.id === 'flag' && <select aria-label={t('wall.flag')} disabled={busy || isSendingGift} className={field} value={flag} onChange={e => { setFlag(e.target.value); giftAttempt.current = requestKey(); }}>{countries.map(c => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}</select>}
            {selected && <><p>{t('wall.confirmGift', { gift: t(`wall.${giftKey(selected.id)}`), price: selected.price })}</p><button disabled={busy || isSendingGift} className={`${button} ${primary} inline-flex items-center gap-2`} onClick={sendGift}>{isSendingGift && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}{t(isSendingGift ? 'wall.working' : 'wall.confirm')}</button></>}
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
