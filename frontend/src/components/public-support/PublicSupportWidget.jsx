import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Bot, Headphones, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clearGuestSession, createClientMessageId, createGuestSession, escalateGuestSession, getStoredGuestSession, loadGuestSession, sendGuestMessage } from '../../services/publicSupportService';
import { connectGuestSupportSocket } from '../../utils/publicSupportSocket';

const mergeMessage = (items, incoming) => {
  if (!incoming) return items;
  const withoutTemporary = incoming.clientMessageId ? items.filter((item) => item.clientMessageId !== incoming.clientMessageId || item.id === incoming.id) : items;
  return withoutTemporary.some((item) => item.id === incoming.id) ? withoutTemporary : [...withoutTemporary, incoming];
};

export default function PublicSupportWidget() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(getStoredGuestSession);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsContact, setNeedsContact] = useState(false);
  const [contact, setContact] = useState({ name:'', email:'' });
  const [contactError, setContactError] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, open]);
  useEffect(() => {
    if (!session || !open) return undefined;
    return connectGuestSupportSocket(session, {
      onMessage:(message) => setMessages((current) => mergeMessage(current, message)),
      onConversation:setConversation,
      onReconnect:async () => {
        try {
          const current = await loadGuestSession(session);
          setConversation(current.conversation);
          setMessages(current.messages || []);
        } catch { /* Keep the locally rendered history and retry on the next reconnect. */ }
      },
    });
  }, [session, open]);

  async function ensureSession(forceReload = false) {
    if (conversation && !forceReload) return;
    setLoading(true);
    try {
      const current = session ? await loadGuestSession(session) : await createGuestSession(i18n.language);
      if (!session) setSession(current.session || getStoredGuestSession());
      setConversation(current.conversation);
      setMessages(current.messages || []);
    } catch {
      const fresh = await createGuestSession(i18n.language);
      setSession(fresh.session || getStoredGuestSession());
      setConversation(fresh.conversation);
      setMessages(fresh.messages || []);
    } finally { setLoading(false); }
  }

  async function toggle() { const next = !open; setOpen(next); if (next) await ensureSession(Boolean(conversation)); }

  async function startNewConversation() {
    setLoading(true);
    clearGuestSession();
    try {
      const fresh = await createGuestSession(i18n.language);
      setSession(fresh.session || getStoredGuestSession());
      setConversation(fresh.conversation);
      setMessages(fresh.messages || []);
      setNeedsContact(false);
      setContact({ name:'', email:'' });
      setContactError('');
      setDraft('');
    } finally { setLoading(false); }
  }

  async function send(text = draft) {
    const body = text.trim();
    if (!body || !session || conversation?.status === 'CLOSED') return;
    const clientMessageId = createClientMessageId();
    const optimistic = { id:clientMessageId, clientMessageId, senderType:'VISITOR', body, createdAt:new Date().toISOString(), pending:true };
    setMessages((current) => [...current, optimistic]);
    setDraft('');
    try {
      const result = await sendGuestMessage({ ...session, body, clientMessageId, language:i18n.language });
      setMessages((current) => mergeMessage(mergeMessage(current, result.message), result.botMessage));
      setConversation(result.conversation);
      if (result.requiresContact) setNeedsContact(true);
    } catch {
      setMessages((current) => current.map((message) => message.clientMessageId === clientMessageId ? { ...message, pending:false, failed:true } : message));
    }
  }

  async function escalate(event) {
    event.preventDefault();
    setContactError('');
    try {
      const result = await escalateGuestSession({ ...session, ...contact, language:i18n.language, reason:'Visitor requested human support' });
      setConversation(result.conversation);
      setMessages((current) => mergeMessage(current, result.message));
      setNeedsContact(false);
    } catch { setContactError(conversationT('publicSupport.invalidContact')); }
  }

  const quickActions = ['how','register','findWorker','workerRegistration','premium'];
  const humanOwned = ['WAITING_FOR_SUPPORT','ASSIGNED'].includes(conversation?.status);
  const conversationT = conversation?.language ? i18n.getFixedT(conversation.language) : t;

  return <div className="fixed bottom-5 right-5 z-[200] font-sans" dir="ltr">
    {open && <section className="mb-3 flex h-[min(620px,calc(100dvh-100px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl" aria-label={t('publicSupport.title')}>
      <header className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-3 text-gray-950">
        <div className="flex items-center gap-2"><Headphones size={22}/><div><h2 className="font-bold">{t('publicSupport.title')}</h2><p className="text-xs">{humanOwned ? t('publicSupport.humanStatus') : t('publicSupport.botStatus')}</p></div></div>
        <button onClick={() => setOpen(false)} aria-label={t('publicSupport.close')} className="rounded-full p-1 hover:bg-black/10"><X size={20}/></button>
      </header>
      <div className="flex-1 overflow-y-auto bg-amber-50/40 p-3">
        {loading ? <p className="py-8 text-center text-sm text-gray-500">{t('publicSupport.loading')}</p> : messages.map((message) => <div key={message.id} className={`mb-2 flex ${message.senderType === 'VISITOR' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.senderType === 'VISITOR' ? 'bg-amber-500 text-gray-950' : message.senderType === 'BOT' ? 'border border-gray-200 bg-white text-gray-800' : 'bg-green-100 text-green-950'}`}>
            {message.senderType !== 'VISITOR' && <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold"><Bot size={12}/>{message.senderType === 'BOT' ? t('publicSupport.assistant') : t('publicSupport.staff')}</div>}
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            {message.pending && <span className="text-[10px] opacity-70">{t('publicSupport.sending')}</span>}
            {message.failed && <span className="mt-1 flex items-center gap-1 text-[10px] text-red-700"><AlertCircle size={11}/>{t('publicSupport.failed')}</span>}
          </div>
        </div>)}
        {conversation?.status === 'CLOSED' && <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 text-center"><p className="text-sm font-medium text-gray-700">{conversation.closeReason === 'INACTIVITY_TIMEOUT' ? conversationT('publicSupport.closedInactivity') : conversationT('publicSupport.closed')}</p><button onClick={startNewConversation} className="mt-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-gray-950">{conversationT('publicSupport.startNewConversation')}</button></div>}
        {!humanOwned && !needsContact && conversation?.status !== 'CLOSED' && <div className="mt-3 flex flex-wrap gap-1.5">{quickActions.map((key) => <button key={key} onClick={() => send(t(`publicSupport.quick.${key}`))} className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-amber-50">{t(`publicSupport.quick.${key}`)}</button>)}<button onClick={() => setNeedsContact(true)} className="rounded-full bg-green-600 px-2.5 py-1 text-xs text-white">{t('publicSupport.quick.contact')}</button></div>}
        <div ref={endRef}/>
      </div>
      {needsContact && !humanOwned ? <form onSubmit={escalate} className="space-y-2 border-t bg-white p-3">
        <p className="text-sm font-semibold">{conversationT('publicSupport.contactIntro')}</p>
        <input required minLength={2} maxLength={100} value={contact.name} onChange={(e)=>setContact({...contact,name:e.target.value})} placeholder={conversationT('publicSupport.name')} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        <input required type="email" maxLength={254} value={contact.email} onChange={(e)=>setContact({...contact,email:e.target.value})} placeholder={conversationT('publicSupport.email')} className="w-full rounded-lg border px-3 py-2 text-sm"/>
        {contactError && <p className="text-xs text-red-600">{contactError}</p>}
        <div className="flex gap-2"><button type="button" onClick={()=>setNeedsContact(false)} className="flex-1 rounded-lg border py-2 text-sm">{conversationT('publicSupport.cancel')}</button><button className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white">{conversationT('publicSupport.transfer')}</button></div>
      </form> : <form onSubmit={(event)=>{event.preventDefault();send();}} className="flex gap-2 border-t bg-white p-3">
        <input maxLength={2000} disabled={conversation?.status === 'CLOSED'} value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder={conversation?.status === 'CLOSED' ? t('publicSupport.closed') : t('publicSupport.placeholder')} className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm"/>
        <button disabled={!draft.trim() || conversation?.status === 'CLOSED'} aria-label={t('publicSupport.send')} className="rounded-xl bg-amber-500 p-2.5 text-gray-950 disabled:opacity-40"><Send size={19}/></button>
      </form>}
    </section>}
    <button onClick={toggle} aria-expanded={open} aria-label={t('publicSupport.open')} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-gray-950 shadow-xl transition hover:scale-105 hover:bg-amber-400">{open ? <X/> : <MessageCircle/>}</button>
  </div>;
}
