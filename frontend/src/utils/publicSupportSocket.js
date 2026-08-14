import { io } from 'socket.io-client';
import { API_BASE } from '../config/api';

export function connectGuestSupportSocket(session, handlers = {}) {
  const socket = io(API_BASE, { transports:['websocket','polling'], reconnection:true });
  let connectedOnce = false;
  const join = () => socket.emit('public-support:join-guest', session, ({ ok } = {}) => {
    if (ok && connectedOnce) handlers.onReconnect?.();
    connectedOnce = true;
  });
  socket.on('connect', join);
  if (handlers.onMessage) socket.on('public-support:message', handlers.onMessage);
  if (handlers.onStaffMessage) socket.on('public-support:staff-message', handlers.onStaffMessage);
  if (handlers.onConversation) socket.on('public-support:conversation', handlers.onConversation);
  return () => socket.disconnect();
}

export function connectStaffSupportSocket(handlers = {}) {
  const socket = io(API_BASE, { transports:['websocket','polling'], reconnection:true });
  let connectedOnce = false;
  const join = () => socket.emit('public-support:join-staff', { token:localStorage.getItem('homelyserv_token') }, ({ ok } = {}) => {
    if (ok && connectedOnce) handlers.onReconnect?.();
    connectedOnce = true;
  });
  socket.on('connect', join);
  if (handlers.onQueue) socket.on('public-support:queue', handlers.onQueue);
  if (handlers.onMessage) socket.on('public-support:message', handlers.onMessage);
  return () => socket.disconnect();
}
