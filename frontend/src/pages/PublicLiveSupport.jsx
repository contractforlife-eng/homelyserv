import React, { useEffect, useRef, useState } from 'react';
import { Clock, Headphones, Send, UserCheck, XCircle, Shield } from 'lucide-react';
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

const ROLE_THEMES = {
  ADMIN: {
    iconColor: 'text-amber-500',
    activeTab: 'bg-amber-500 text-white font-semibold shadow-sm',
    inactiveTab: 'text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400',
    itemHover: 'hover:bg-amber-50/80 dark:hover:bg-amber-950/20',
    itemActive: 'bg-amber-50 dark:bg-amber-950/30 border-l-4 border-l-amber-500',
    claimBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    sendBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    staffBubble: 'bg-amber-600 text-white',
    focusRing: 'focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
  },
  SUPPORT: {
    iconColor: 'text-green-500',
    activeTab: 'bg-green-600 text-white font-semibold shadow-sm',
    inactiveTab: 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400',
    itemHover: 'hover:bg-green-50/80 dark:hover:bg-green-950/20',
    itemActive: 'bg-green-50 dark:bg-green-950/30 border-l-4 border-l-green-500',
    claimBtn: 'bg-green-600 hover:bg-green-700 text-white',
    sendBtn: 'bg-green-600 hover:bg-green-700 text-white',
    staffBubble: 'bg-green-600 text-white',
    focusRing: 'focus:ring-2 focus:ring-green-500 focus:border-green-500',
  },
  SUPPORT_HELPER: {
    iconColor: 'text-red-500',
    activeTab: 'bg-red-600 text-white font-semibold shadow-sm',
    inactiveTab: 'text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400',
    itemHover: 'hover:bg-red-50/80 dark:hover:bg-red-950/20',
    itemActive: 'bg-red-50 dark:bg-red-950/30 border-l-4 border-l-red-500',
    claimBtn: 'bg-red-600 hover:bg-red-700 text-white',
    sendBtn: 'bg-red-600 hover:bg-red-700 text-white',
    staffBubble: 'bg-red-600 text-white',
    focusRing: 'focus:ring-2 focus:ring-red-500 focus:border-red-500',
  },
};

function LiveSupportContent() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const activeRole = user?.role === 'SUPPORT_HELPER' ? 'SUPPORT_HELPER' : user?.role === 'SUPPORT' ? 'SUPPORT' : 'ADMIN';
  const theme = ROLE_THEMES[activeRole] || ROLE_THEMES.ADMIN;

  const [filter, setFilter] = useState('WAITING_FOR_SUPPORT,ASSIGNED');
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const selectedRef = useRef(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const isMonitoringSession = activeRole === 'SUPPORT' && selected?.assignedHelper && selected?.assignedStaffId !== user?.id;

  async function loadQueue(status = filter) {
    try {
      const params = status === 'SUP_HELP' ? { status: 'ASSIGNED', view: 'sup_help' } : { status };
      const { data } = await api.get('/api/public-support/staff/conversations', { params });
      let list = data.conversations || [];
      if (status === 'SUP_HELP') {
        list = list.filter((item) => item.assignedHelper && item.assignedStaffId !== user?.id);
      }
      setConversations(list);
    } catch (e) {
      console.error('Failed to load live support queue', e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }
  async function openConversation(conversation) {
    const { data } = await api.get(`/api/public-support/staff/conversations/${conversation.id}`);
    setSelected(data.conversation);
    setMessages(data.messages || []);
  }
  useEffect(() => { loadQueue(); }, [filter]);
  useEffect(() => connectStaffSupportSocket({
    onQueue:(incoming) => {
      setConversations((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)].filter((item) => {
        if (filter === 'SUP_HELP') return incoming.assignedHelper && incoming.assignedStaffId !== user?.id;
        return filter.split(',').includes(item.status);
      }));
      if (selectedRef.current?.id === incoming.id) setSelected((current) => ({ ...current, ...incoming }));
    },
    onStaffMessage:({ conversationId, message }) => { if (selectedRef.current?.id === conversationId) setMessages((current) => mergeMessage(current, message)); },
    onReconnect:() => loadQueue(),
  }), [filter, user?.id]);

  async function claim() {
    if (isMonitoringSession) return;
    const { data } = await api.post(`/api/public-support/staff/conversations/${selected.id}/claim`);
    setSelected(data.conversation);
    setConversations((current) => current.map((item) => item.id === data.conversation.id ? data.conversation : item));
  }
  async function closeConversation() {
    if (isMonitoringSession) return;
    const { data } = await api.post(`/api/public-support/staff/conversations/${selected.id}/close`);
    setSelected(data.conversation);
    setConversations((current) => current.filter((item) => item.id !== data.conversation.id));
  }
  async function send(event) {
    event.preventDefault();
    if (isMonitoringSession) return;
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

  const filterTabs = [
    ['WAITING_FOR_SUPPORT,ASSIGNED', 'active'],
    ['WAITING_FOR_SUPPORT', 'waiting'],
    ['ASSIGNED', 'assigned'],
    ...(activeRole === 'SUPPORT' ? [['SUP_HELP', 'supHelpTab']] : []),
    ['CLOSED', 'closedTab']
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Headphones className={theme.iconColor} />
            {t('publicSupport.staffTitle')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('publicSupport.staffSubtitle')}</p>
        </div>
        <div className="flex flex-wrap rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
          {filterTabs.map(([value, key]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${filter === value ? theme.activeTab : theme.inactiveTab}`}
            >
              {t(`publicSupport.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className="border-r border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 p-3 text-sm font-semibold text-gray-900 dark:text-white">
            {loading ? t('publicSupport.loading') : t('publicSupport.conversationCount', { count: conversations.length })}
          </div>
          <div className="max-h-[570px] overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => openConversation(conversation)}
                className={`block w-full border-b border-gray-100 dark:border-gray-700/60 p-3 text-left transition-colors ${theme.itemHover} ${
                  selected?.id === conversation.id ? theme.itemActive : ''
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="truncate font-semibold text-gray-900 dark:text-white">
                    {conversation.visitorName || t('publicSupport.guest')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {conversation.status === 'WAITING_FOR_SUPPORT'
                      ? waitingLabel(conversation)
                      : new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {conversation.visitorEmail || conversation.language.toUpperCase()}
                </p>
                <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                  {conversation.lastMessage}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      conversation.status === 'WAITING_FOR_SUPPORT'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : conversation.status === 'ASSIGNED'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t(`publicSupport.states.${conversation.status}`)}
                  </span>
                  {conversation.assignedHelper && conversation.assignedStaffId !== user?.id && (
                    <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300">
                      Sup-Help: {conversation.assignedHelper.fullName}
                    </span>
                  )}
                  {conversation.staffUnreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 text-white">
                      {conversation.staffUnreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col bg-white dark:bg-gray-800">
          {selected ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 p-4">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    {selected.visitorName || t('publicSupport.guest')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selected.visitorEmail} · {selected.language.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isMonitoringSession ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                      <Shield size={14} className="text-blue-600 dark:text-blue-400" />
                      {t('publicSupport.monitoring')} — {selected.assignedHelper?.fullName || 'Sup-Help'}
                    </span>
                  ) : (
                    <>
                      {selected.status === 'WAITING_FOR_SUPPORT' && (
                        <button
                          onClick={claim}
                          className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${theme.claimBtn}`}
                        >
                          <UserCheck size={16} />
                          {t('publicSupport.claim')}
                        </button>
                      )}
                      {selected.status !== 'CLOSED' && (
                        <button
                          onClick={closeConversation}
                          className="flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800/60 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <XCircle size={16} />
                          {t('publicSupport.closeConversation')}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 flex ${message.senderType === 'STAFF' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        message.senderType === 'STAFF'
                          ? theme.staffBubble
                          : message.senderType === 'BOT'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      {message.pending && <small className="opacity-70 block text-xs mt-0.5">{t('publicSupport.sending')}</small>}
                      {message.failed && <small className="text-red-200 block text-xs mt-0.5">{t('publicSupport.failed')}</small>}
                    </div>
                  </div>
                ))}
              </div>

              {selected.status !== 'CLOSED' && (
                isMonitoringSession ? (
                  <div className="border-t border-blue-100 bg-blue-50/60 p-3 text-center text-xs font-medium text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300 flex items-center justify-center gap-2">
                    <Shield size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>{t('publicSupport.monitoringBanner', { name: selected.assignedHelper?.fullName || 'Sup-Help' })}</span>
                  </div>
                ) : (
                  <form onSubmit={send} className="flex gap-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <input
                      maxLength={2000}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={t('publicSupport.staffPlaceholder')}
                      className={`min-w-0 flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none ${theme.focusRing}`}
                    />
                    <button
                      disabled={!draft.trim()}
                      className={`rounded-xl p-3 text-white transition-colors disabled:opacity-40 ${theme.sendBtn}`}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                )
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-gray-400 dark:text-gray-500 p-6">
              <div>
                <Clock className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />
                <p>{t('publicSupport.selectConversation')}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
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
