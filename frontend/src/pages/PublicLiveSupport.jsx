import React, { useEffect, useRef, useState } from 'react';
import { Clock, Headphones, Send, UserCheck, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import SupportLayout from '../layouts/SupportLayout';
import { connectStaffSupportSocket } from '../utils/publicSupportSocket';

const mergeMessage = (items, incoming) => {
  if (!incoming) return items;
  const filtered = incoming.clientMessageId ? items.filter((item) => item.clientMessageId !== incoming.clientMessageId || item.id === incoming.id) : items;
  return filtered.some((item) => item.id === incoming.id) ? filtered : [...filtered, incoming];
};

function LiveSupportContent() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState('WAITING_FOR_SUPPORT,ASSIGNED');
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const selectedRef = useRef(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  async function loadQueue(status = filter) {
    const { data } = await api.get('/api/public-support/staff/conversations', { params:{ status } });
    setConversations(data.conversations || []);
    setLoading(false);
  }
  async function openConversation(conversation) {
    const { data } = await api.get(`/api/public-support/staff/conversations/${conversation.id}`);
    setSelected(data.conversation);
    setMessages(data.messages || []);
  }
  useEffect(() => { loadQueue(); }, [filter]);
  useEffect(() => connectStaffSupportSocket({
    onQueue:(incoming) => {
      setConversations((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)].filter((item) => filter.split(',').includes(item.status)));
      if (selectedRef.current?.id === incoming.id) setSelected((current) => ({ ...current, ...incoming }));
    },
    onStaffMessage:({ conversationId, message }) => { if (selectedRef.current?.id === conversationId) setMessages((current) => mergeMessage(current, message)); },
    onReconnect:() => loadQueue(),
  }), [filter]);

  async function claim() {
    const { data } = await api.post(`/api/public-support/staff/conversations/${selected.id}/claim`);
    setSelected(data.conversation);
    setConversations((current) => current.map((item) => item.id === data.conversation.id ? data.conversation : item));
  }
  async function closeConversation() {
    const { data } = await api.post(`/api/public-support/staff/conversations/${selected.id}/close`);
    setSelected(data.conversation);
    setConversations((current) => current.filter((item) => item.id !== data.conversation.id));
  }
  async function send(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selected) return;
    const clientMessageId = `staff_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimistic = { id:clientMessageId, clientMessageId, senderType:'STAFF', senderRole:user?.role, body, createdAt:new Date().toISOString(), pending:true };
    setMessages((current) => [...current, optimistic]);
    setDraft('');
    try {
      const { data } = await api.post(`/api/public-support/staff/conversations/${selected.id}/messages`, { body, clientMessageId });
      setMessages((current) => mergeMessage(current, data.message));
      setSelected(data.conversation);
    } catch {
      setMessages((current) => current.map((message) => message.clientMessageId === clientMessageId ? { ...message, pending:false, failed:true } : message));
    }
  }

  const waitingLabel = (conversation) => new Intl.RelativeTimeFormat(i18n.language || 'en', { numeric:'auto' }).format(-Math.max(1, Math.floor((Date.now() - new Date(conversation.escalatedAt || conversation.updatedAt).getTime()) / 60000)), 'minute');

  return <div className="mx-auto max-w-7xl p-4 md:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white"><Headphones className="text-amber-500"/>{t('publicSupport.staffTitle')}</h1><p className="text-sm text-gray-500">{t('publicSupport.staffSubtitle')}</p></div><div className="flex rounded-lg border bg-white p-1">{[['WAITING_FOR_SUPPORT,ASSIGNED','active'],['WAITING_FOR_SUPPORT','waiting'],['ASSIGNED','assigned'],['CLOSED','closedTab']].map(([value,key])=><button key={value} onClick={()=>setFilter(value)} className={`rounded-md px-3 py-1.5 text-sm ${filter===value?'bg-amber-500 font-semibold':'text-gray-600'}`}>{t(`publicSupport.${key}`)}</button>)}</div></div>
    <div className="grid min-h-[620px] overflow-hidden rounded-2xl border bg-white shadow-sm lg:grid-cols-[340px_1fr]">
      <aside className="border-r"><div className="border-b p-3 text-sm font-semibold">{loading?t('publicSupport.loading'):t('publicSupport.conversationCount',{count:conversations.length})}</div><div className="max-h-[570px] overflow-y-auto">{conversations.map((conversation)=><button key={conversation.id} onClick={()=>openConversation(conversation)} className={`block w-full border-b p-3 text-left hover:bg-amber-50 ${selected?.id===conversation.id?'bg-amber-50':''}`}><div className="flex justify-between gap-2"><span className="truncate font-semibold">{conversation.visitorName || t('publicSupport.guest')}</span><span className="text-xs text-gray-400">{conversation.status==='WAITING_FOR_SUPPORT' ? waitingLabel(conversation) : new Date(conversation.lastMessageAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div><p className="truncate text-xs text-gray-500">{conversation.visitorEmail || conversation.language.toUpperCase()}</p><p className="mt-1 truncate text-sm text-gray-600">{conversation.lastMessage}</p><div className="mt-2 flex items-center gap-2 text-xs"><span className={`rounded-full px-2 py-0.5 ${conversation.status==='WAITING_FOR_SUPPORT'?'bg-orange-100 text-orange-700':conversation.status==='ASSIGNED'?'bg-green-100 text-green-700':'bg-gray-100'}`}>{t(`publicSupport.states.${conversation.status}`)}</span>{conversation.staffUnreadCount>0&&<span className="rounded-full bg-red-500 px-1.5 text-white">{conversation.staffUnreadCount}</span>}</div></button>)}</div></aside>
      <main className="flex min-w-0 flex-col">{selected ? <><header className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-bold">{selected.visitorName || t('publicSupport.guest')}</h2><p className="text-sm text-gray-500">{selected.visitorEmail} · {selected.language.toUpperCase()}</p></div><div className="flex gap-2">{selected.status==='WAITING_FOR_SUPPORT'&&<button onClick={claim} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white"><UserCheck size={16}/>{t('publicSupport.claim')}</button>}{selected.status!=='CLOSED'&&<button onClick={closeConversation} className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"><XCircle size={16}/>{t('publicSupport.closeConversation')}</button>}</div></header><div className="flex-1 overflow-y-auto bg-gray-50 p-4">{messages.map((message)=><div key={message.id} className={`mb-3 flex ${message.senderType==='STAFF'?'justify-end':'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.senderType==='STAFF'?'bg-green-600 text-white':message.senderType==='BOT'?'bg-amber-100':'bg-white border'}`}><p className="whitespace-pre-wrap break-words">{message.body}</p>{message.pending&&<small>{t('publicSupport.sending')}</small>}{message.failed&&<small className="text-red-200">{t('publicSupport.failed')}</small>}</div></div>)}</div>{selected.status!=='CLOSED'&&<form onSubmit={send} className="flex gap-2 border-t p-3"><input maxLength={2000} value={draft} onChange={(event)=>setDraft(event.target.value)} placeholder={t('publicSupport.staffPlaceholder')} className="min-w-0 flex-1 rounded-xl border px-3 py-2"/><button disabled={!draft.trim()} className="rounded-xl bg-green-600 p-3 text-white disabled:opacity-40"><Send size={18}/></button></form>}</> : <div className="flex flex-1 items-center justify-center text-center text-gray-500"><div><Clock className="mx-auto mb-2"/><p>{t('publicSupport.selectConversation')}</p></div></div>}</main>
    </div>
  </div>;
}

export default function PublicLiveSupport() {
  const role = useAuthStore((state) => state.user?.role);
  if (role === 'SUPPORT_HELPER') {
    return (
      <SupportLayout allowedRoles={['SUPPORT_HELPER', 'ADMIN']} role="SUPPORT_HELPER">
        <LiveSupportContent />
      </SupportLayout>
    );
  }
  return role === 'SUPPORT' ? (
    <SupportLayout>
      <LiveSupportContent />
    </SupportLayout>
  ) : (
    <DashboardLayout requiredRole="ADMIN">
      <LiveSupportContent />
    </DashboardLayout>
  );
}
