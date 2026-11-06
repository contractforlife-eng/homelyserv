import React, { useEffect, useRef, useState } from 'react';
import useAuthStore from '../store/authStore';
import { onSocketEvent } from '../utils/socket';
import { wallIdentity } from '../utils/wallIdentity';
import { mergeWallGiftQueue } from '../utils/wallGiftQueue';
import api from '../utils/api';
import WallGiftAnimation from './WallGiftAnimation';

export default function WallIncomingGifts() {
  const user = useAuthStore(state => state.user);
  const userId = user?.id || user?._id;
  const [queue, setQueue] = useState([]);
  const [visible, setVisible] = useState(() => !document.hidden);
  const completed = useRef(new Set());
  const pendingAck = useRef(new Set());
  const refresh = useRef(() => {});
  useEffect(() => {
    setQueue([]); completed.current.clear(); pendingAck.current.clear();
    if (!userId) return;
    let stopped = false, loading = false;
    const enrich = event => ({ ...event, recipient: user.fullName || '', color: wallIdentity(user.role).color });
    const update = async () => {
      if (stopped || loading) return;
      loading = true;
      try {
        const ids = [...pendingAck.current].slice(0, 50);
        if (ids.length) { await api.post('/api/wall/gifts/ack', { ids }); if (stopped) return; ids.forEach(id => pendingAck.current.delete(id)); }
        const result = await api.get('/api/wall/gifts/inbox');
        if (!stopped) setQueue(previous => mergeWallGiftQueue(previous, (result.data.gifts || []).map(enrich), completed.current));
      } catch { /* Retry persisted inbox and acknowledgments after reconnect. */ }
      finally { loading = false; }
    };
    refresh.current = update;
    const unsubscribe = onSocketEvent(userId, 'wall:gift', event => {
      if (!stopped) setQueue(previous => mergeWallGiftQueue(previous, [enrich(event)], completed.current));
    });
    const changed = () => { setVisible(!document.hidden); if (!document.hidden) update(); };
    const sent = event => { if (!stopped) setQueue(previous => mergeWallGiftQueue(previous, [event.detail], completed.current)); };
    window.addEventListener('wall:gift:sent', sent);
    document.addEventListener('visibilitychange', changed); window.addEventListener('online', update);
    update(); const timer = setInterval(update, 15000);
    return () => { stopped = true; clearInterval(timer); unsubscribe(); document.removeEventListener('visibilitychange', changed); window.removeEventListener('online', update); window.removeEventListener('wall:gift:sent', sent); refresh.current = () => {}; };
  }, [userId, user?.fullName, user?.role]);
  const gift = queue[0];
  if (!gift || !visible) return null;
  const counter = [...document.querySelectorAll('[data-wall-gift-post]')].find(element => element.dataset.wallGiftPost === gift.postId);
  const rect = counter?.getBoundingClientRect();
  const finish = (all = false) => {
    const finished = all ? queue : [gift];
    for (const event of finished) { completed.current.add(event.eventId); if (!event.outgoing) pendingAck.current.add(event.eventId); }
    setQueue(previous => previous.filter(event => !completed.current.has(event.eventId)));
    window.dispatchEvent(new CustomEvent('wall:gift:completed', { detail: gift }));
    const ids = finished.filter(event => !event.outgoing).map(event => event.eventId).slice(0, 50);
    if (ids.length) api.post('/api/wall/gifts/ack', { ids }).then(() => { ids.forEach(id => pendingAck.current.delete(id)); refresh.current(); }).catch(() => {});
    else refresh.current();
  };
  return <WallGiftAnimation key={gift.eventId} gift={gift} recipient={gift.recipient} queueCount={queue.length}
    destination={rect ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } : null}
    onComplete={() => finish()} onSkip={() => finish(true)} />;
}
