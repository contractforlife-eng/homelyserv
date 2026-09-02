// src/pages/AdminMessages.jsx - VISUAL ALIGNMENT WITH SUPPORT MESSAGES
// ============================================================
// Admin messaging page with secure permission model.
// Admin does NOT have automatic access to private user chats.
// This page shows only:
//   1. Escalated Conversations (after support escalates)
//   2. Support Conversations (supervision)
//   3. Internal Staff Messages (Support <-> Admin)
//   4. System Notifications
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  Search,
  Send,
  RefreshCw,
  X,
  Shield,
  Users,
  ChevronRight,
  Plus,
  Briefcase,
  Wrench,
  Headphones,
  MessageSquare,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import {
  getInternalMessages,
  getAdminUserConversations,
  getAdminConversationMessages,
  sendMessage,
  markMessagesAsRead,
  formatDisplayName,
  startAdminConversation,
  closeConversation,
  createOptimisticMessage,
  reconcileOptimisticMessage,
  markOptimisticMessageFailed
} from '../utils/chatService';
import { getRoleColor } from '../utils/userDisplay';
import { onSocketEvent, getSocket } from '../utils/socket';
import { UserAvatar, UserDisplayName } from '../components/users';
import usePresence from '../hooks/usePresence';
import api from '../utils/api';
import PageLoader from '../components/common/PageLoader';

// ============================================================
// SECTION TABS
// ============================================================
const SECTIONS = {
  SUPPORT: 'support',
  USERS: 'users'
};
const STAFF_TARGET_ROLES = ['SUPPORT'];
const USER_TARGET_ROLES = ['EMPLOYER', 'WORKER'];

// ============================================================
// START CONVERSATION MODAL
// ============================================================
const StartConversationModal = ({ isOpen, onClose, onSelectUser, allowedRoles = [] }) => {
  const { t } = useTranslation();
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const getRoleLabel = (role) => t(`userProfileView.roles.${String(role || '').toUpperCase()}`, {
    defaultValue: t('adminMessagesPage.user')
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      const users = response.data?.users || [];
      // Exclude admins from the list (admin cannot start conversation with self)
      const eligibleUsers = users.filter(u => allowedRoles.includes(String(u.role || '').toUpperCase()));
      setAllUsers(eligibleUsers);
      setFilteredUsers(eligibleUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setAllUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, [allowedRoles]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSearchTerm('');
      setRoleFilter('ALL');
    }
  }, [isOpen, loadUsers]);

  useEffect(() => {
    let filtered = allUsers;
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => String(u.role || '').toUpperCase() === roleFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower)
      );
    }
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, allUsers]);

  if (!isOpen) return null;

  const getRoleIcon = (role) => {
    if (role === 'WORKER') return <Wrench size={16} />;
    if (role === 'EMPLOYER') return <Briefcase size={16} />;
    if (role === 'SUPPORT') return <Headphones size={16} />;
    return <Users size={16} />;
  };

  const getRoleColorClass = (role) => {
    const color = getRoleColor(role);
    const colors = {
      purple: 'bg-purple-500/10 text-purple-400',
      green: 'bg-green-500/10 text-green-400',
      blue: 'bg-blue-500/10 text-blue-400',
      orange: 'bg-orange-500/10 text-orange-400',
      gray: 'bg-gray-500/10 text-gray-400'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-yellow-500/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-yellow-500/20">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus size={18} className="text-yellow-500" />
              {t('adminMessagesPage.startConversation')}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {t('adminMessagesPage.officialDescription')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-yellow-500/10 text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="p-4 border-b border-yellow-500/20 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder={t('adminMessagesExtra.searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500"
              autoFocus
            />
          </div>

          {/* Role Filters */}
          <div className="flex gap-2">
            {['ALL', ...allowedRoles].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  roleFilter === role
                    ? 'bg-yellow-500 text-black'
                    : 'bg-[#0a0a0a] text-gray-400 border border-gray-700 hover:border-yellow-500/30'
                }`}
              >
                {role === 'ALL' ? <Users size={12} /> : getRoleIcon(role)}
                {role === 'ALL' ? t('adminMessagesPage.all') : getRoleLabel(role)}
              </button>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 300px)', maxHeight: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-400">{t('adminMessagesExtra.noUsers')}</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const userId = user._id || user.id;
              return (
                <button
                  key={userId}
                  onClick={() => onSelectUser(userId)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-yellow-500/5 transition border-b border-yellow-500/10 text-left"
                >
                  <UserAvatar
                    name={user.fullName || user.name || t('adminMessagesPage.user')}
                    image={user.profileImage || user.image || null}
                    role={user.role}
                    size="md"
                    className="border-2 border-yellow-500/30 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <UserDisplayName
                      user={user}
                      size="sm"
                      defaultNameClassName="font-semibold text-white"
                    />
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${getRoleColorClass(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer note */}
        <div className="p-3 border-t border-yellow-500/20 bg-[#0a0a0a]">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Shield size={12} className="text-yellow-500" />
          {t('adminMessagesPage.modalDescription')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN ADMIN MESSAGES COMPONENT
// ============================================================
const normalizeParticipant = (participant) => {
  if (!participant) return participant;
  return {
    ...participant,
    isPremium: participant.isPremium === true,
  };
};

const normalizeConversation = (conversation) => ({
  ...conversation,
  inboxScope: conversation.inboxScope || (conversation.otherStaffId ? 'STAFF' : undefined),
  user: normalizeParticipant(conversation.user),
  otherStaff: normalizeParticipant(conversation.otherStaff),
});

const AdminMessages = () => {
  const { t: i18nT, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  const [activeSection, setActiveSection] = useState(SECTIONS.SUPPORT);
  const [supportConversations, setSupportConversations] = useState([]);
  const [userConversations, setUserConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Chat panel state
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const autoOpenDoneRef = useRef(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingStartTimerRef = useRef(null);
  const typingStaleTimerRef = useRef(null);
  const typingStartEmittedRef = useRef(false);
  const typingContextRef = useRef(null);
  const authUserIdRef = useRef(authUser?.id);

  // Keep authUserIdRef in sync with the latest authUser id
  useEffect(() => {
    authUserIdRef.current = authUser?.id;
  });

  const t = i18nT('adminMessagesPage', { returnObjects: true });


  // ============================================================
  // LOAD DATA
  // ============================================================
  const loadAllData = useCallback(async () => {
    if (!authUser?.id) return;

    try {
      const [internalResult, usersResult] = await Promise.allSettled([
        getInternalMessages(),
        getAdminUserConversations()
      ]);

      const internal = internalResult.status === 'fulfilled' ? internalResult.value : [];
      const users = usersResult.status === 'fulfilled' ? usersResult.value : [];

      if (internalResult.status === 'rejected') {
        console.error('Error loading Admin Support conversations:', internalResult.reason);
      }
      if (usersResult.status === 'rejected') {
        console.error('Error loading Admin Users conversations:', usersResult.reason);
      }

      const normalizedInternal = internal.map((conversation) => normalizeConversation({
        ...conversation,
        inboxScope: 'STAFF'
      }));
      const normalizedUsers = users.map(normalizeConversation);

      setSupportConversations(normalizedInternal);
      setUserConversations(normalizedUsers);
    } catch (error) {
      console.error('Error loading admin conversations:', error);
      setSupportConversations([]);
      setUserConversations([]);
    }
  }, [authUser]);

  // ============================================================
  // LOAD MESSAGES FOR SELECTED CONVERSATION
  // ============================================================
  const loadConversationMessages = async (conversation) => {
    console.log('[ADMIN-MSG-AUTOOPEN] loadConversationMessages called with:', conversation);
    console.log('[ADMIN-MSG-AUTOOPEN] conversation.id:', conversation?.id);
    if (!conversation?.id) return;

    setChatLoading(true);
    setSelectedConversation(conversation);
    setMessages([]);

    try {
      const result = await getAdminConversationMessages(conversation.id);
      setMessages(result.messages || []);

      // Mark as read without keeping the message panel behind its loading state.
      if (authUser?.id) {
        markMessagesAsRead(conversation.id, authUser.id).then((marked) => {
          if (!marked) return;
          if (conversation.type === 'INTERNAL') {
            setSupportConversations(prev =>
              prev.map(c => c.id === conversation.id ? { ...c, unread: 0 } : c)
            );
          } else if (conversation.type === 'USERS') {
            setUserConversations(prev =>
              prev.map(c => c.id === conversation.id ? { ...c, unread: 0 } : c)
            );
          }
        }).catch((error) => console.error('Error marking messages as read:', error));
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const getOtherUserId = () => {
    if (!selectedConversation) return null;
    if (selectedConversation.type === 'INTERNAL') {
      return selectedConversation.otherStaffId || null;
    }
    const userParticipant = (selectedConversation.participantIds || [])
      .find(id => id !== String(authUser?.id));
    return userParticipant || selectedConversation.user?.id || null;
  };

  // Derive the counterpart user ID for any conversation (used for presence in list rows).
  const getCounterpartUserId = (conv, type) => {
    if (type === 'INTERNAL') {
      return conv.otherStaffId || null;
    }
    const userParticipant = (conv.participantIds || [])
      .find(id => id !== String(authUser?.id));
    return userParticipant || conv.user?.id || null;
  };

  // Real-time presence for counterpart users (additive; does not touch chat logic).
  const counterpartUserIds = [
    ...supportConversations.map((c) => getCounterpartUserId(c, 'INTERNAL')),
    ...userConversations.map((c) => getCounterpartUserId(c, 'USERS')),
  ].filter(Boolean);
  const presence = usePresence(counterpartUserIds, authUser?.id);

  const emitTypingEvent = (isTyping) => {
    const recipientId = getOtherUserId();
    if (!recipientId || !selectedConversation?.id || !authUser?.id) return;
    const socket = getSocket(authUser.id);
    if (!socket) return;
    if (isTyping) {
      typingContextRef.current = { conversationId: selectedConversation.id, recipientId };
    } else {
      typingContextRef.current = null;
    }
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      conversationId: selectedConversation.id,
      recipientId
    });
  };

  const handleNewMessageChange = (e) => {
    setNewMessage(e.target.value);

    if (!typingStartEmittedRef.current && e.target.value.trim()) {
      typingStartEmittedRef.current = true;
      emitTypingEvent(true);
    }

    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    typingStartTimerRef.current = setTimeout(() => {
      typingStartEmittedRef.current = false;
      emitTypingEvent(false);
    }, 3000);
  };

  // ============================================================
  // USE EFFECTS
  // ============================================================
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    setLoading(true);
    loadAllData().finally(() => {
      setLoading(false);
      setDataLoaded(true);
    });
  }, [authUser, isAuthenticated, authLoading, navigate, loadAllData]);

  // Polling for conversations (silent)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAllData]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || !selectedConversation?.id) return;

    const unsubscribe = onSocketEvent(userId, 'message:new', (payload) => {
      if (String(payload.conversationId) !== String(selectedConversation.id)) return;
      setMessages(prev => {
        if (prev.some(msg => String(msg.id) === String(payload.id))) return prev;
        return [...prev, payload];
      });
    });

    return unsubscribe;
  }, [authUser?.id, selectedConversation?.id]);

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || !selectedConversation?.id) return;

    const unsubscribe = onSocketEvent(userId, 'typing:update', (payload) => {
      if (String(payload.conversationId) !== String(selectedConversation.id)) return;
      if (String(payload.userId) === String(userId)) return;

      if (payload.isTyping) {
        setOtherUserTyping(true);
        if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
        typingStaleTimerRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 4500);
      } else {
        setOtherUserTyping(false);
        if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
      }
    });

    return () => {
      unsubscribe();
      if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    };
  }, [authUser?.id, selectedConversation?.id]);

  useEffect(() => {
    // Emit typing:stop for the OLD conversation before switching
    if (typingStartEmittedRef.current && typingContextRef.current) {
      const socket = getSocket(authUserIdRef.current);
      if (socket) {
        socket.emit('typing:stop', {
          conversationId: typingContextRef.current.conversationId,
          recipientId: typingContextRef.current.recipientId
        });
      }
      typingContextRef.current = null;
    }
    setOtherUserTyping(false);
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    typingStartEmittedRef.current = false;
  }, [selectedConversation?.id]);

  // On unmount: emit typing:stop if currently typing, then clear timers
  useEffect(() => {
    return () => {
      if (typingStartEmittedRef.current && typingContextRef.current) {
        const socket = getSocket(authUserIdRef.current);
        if (socket) {
          socket.emit('typing:stop', {
            conversationId: typingContextRef.current.conversationId,
            recipientId: typingContextRef.current.recipientId
          });
        }
      }
      if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
      if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    };
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      // Reload conversation lists
      await loadAllData();

      // Reload the currently open conversation messages (if any)
      // while keeping the conversation selected and messages intact
      if (selectedConversation?.id) {
        try {
          const result = await getAdminConversationMessages(selectedConversation.id);
          setMessages(result.messages || []);
          if (authUser?.id) {
            const marked = await markMessagesAsRead(selectedConversation.id, authUser.id);
            if (marked) {
              // Immediately update local unread state without waiting for polling
              if (selectedConversation.type === 'INTERNAL') {
                setSupportConversations(prev =>
                  prev.map(c => c.id === selectedConversation.id ? { ...c, unread: 0 } : c)
                );
              } else if (selectedConversation.type === 'USERS') {
                setUserConversations(prev =>
                  prev.map(c => c.id === selectedConversation.id ? { ...c, unread: 0 } : c)
                );
              }
            }
          }
        } catch (error) {
          console.error('Error reloading open conversation messages:', error);
        }
      }
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================
  // START CONVERSATION
  // ============================================================
  const handleStartConversation = async (userId, requestedScope = null) => {
    if (!userId || !authUser) return;

    try {
    const scope = requestedScope || (activeSection === SECTIONS.SUPPORT ? 'STAFF' : 'USERS');
    const result = await startAdminConversation(userId, scope);
      if (!result?.conversationId) {
        alert(t.errors.start);
        return;
      }

      setShowStartConversation(false);

      const conv = result.conversation || {};
      const targetUser = await api.get(`/api/admin/users/${userId}`).then(r => r.data?.user).catch(() => null);

      const conversation = {
        id: result.conversationId,
        type: scope === 'USERS' ? 'USERS' : (conv.type || 'INTERNAL'),
        inboxScope: scope === 'STAFF' ? 'STAFF' : 'USERS',
        participantIds: conv.participantIds || [],
        supportAgentId: conv.supportAgentId || null,
        otherStaffId: scope === 'STAFF'
          ? (conv.staffIds || []).find(id => id !== String(authUser.id)) || String(userId)
          : null,
        user: targetUser ? {
          id: targetUser._id || targetUser.id,
          fullName: targetUser.fullName || t.user,
          role: targetUser.role || 'USER',
          image: targetUser.profileImage || targetUser.image || null,
          isPremium: targetUser.isPremium === true
        } : null,
        otherStaff: targetUser && scope === 'STAFF' ? {
          id: targetUser._id || targetUser.id,
          fullName: targetUser.fullName || t.staff,
          role: targetUser.role || 'SUPPORT',
          image: targetUser.profileImage || targetUser.image || null,
          isPremium: false
        } : null,
        lastMessage: result.existing ? t.existingConversation : t.officialConversation,
        lastMessageTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (conversation.type === 'INTERNAL') {
        setSupportConversations(prev => {
          const exists = prev.some(c => c.id === conversation.id);
          return exists ? prev : [conversation, ...prev];
        });
      } else if (conversation.type === 'USERS') {
        setUserConversations(prev => {
          const exists = prev.some(c => c.id === conversation.id);
          return exists ? prev : [conversation, ...prev];
        });
      }

      await loadConversationMessages(conversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(t.errors.startRetry);
    }
  };

  // ============================================================
  // AUTO-OPEN CONVERSATION FROM NAVIGATION (e.g. Admin Hires)
  // ============================================================
  useEffect(() => {
    if (!authUser || !dataLoaded || autoOpenDoneRef.current) return;

    const targetUserId = location.state?.targetUserId;
    if (!targetUserId) return;

    autoOpenDoneRef.current = true;

    api.get(`/api/admin/users/${targetUserId}`).then((response) => {
      const role = response.data?.user?.role;
      const scope = USER_TARGET_ROLES.includes(role) ? 'USERS' : 'STAFF';
      setActiveSection(scope === 'USERS' ? SECTIONS.USERS : SECTIONS.SUPPORT);
      handleStartConversation(targetUserId, scope);
    }).catch(() => {
      handleStartConversation(targetUserId, 'USERS');
    });

    // Clear the navigation state so it doesn't re-trigger on refresh/back
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, dataLoaded]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !authUser) return;

    const draft = newMessage.trim();
    let optimistic = null;

    try {
      // Determine recipient from conversation
      let recipientId = null;
      let recipientName = 'User';

      if (selectedConversation.inboxScope === 'STAFF') {
        recipientId = selectedConversation.otherStaffId || null;
        recipientName = selectedConversation.otherStaff?.fullName || 'Staff';
      } else if (selectedConversation.type === 'USERS') {
        // For SUPPORT conversations, the recipient is the user participant
        // (not the support agent, which may be the admin themselves)
        const userParticipant = (selectedConversation.participantIds || [])
          .find(id => id !== String(authUser.id));
        recipientId = userParticipant || selectedConversation.user?.id || null;
        recipientName = selectedConversation.user?.fullName || 'User';
      }

      if (!recipientId) {
        alert(t.errors.recipient);
        return;
      }

      optimistic = createOptimisticMessage({
        conversationId: selectedConversation.id,
        senderId: authUser.id,
        senderName: authUser.fullName || 'Admin',
        senderRole: 'ADMIN',
        recipientId,
        recipientName,
        text: draft,
      });
      setMessages((current) => [
        ...current.filter((item) => !(item.sendFailed && item.senderId === String(authUser.id) && item.text === draft)),
        optimistic,
      ]);
      setNewMessage('');
      if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
      typingStartEmittedRef.current = false;
      emitTypingEvent(false);
      setSendingMessage(true);

      const result = await sendMessage(
        authUser.id,
        authUser.fullName || 'Admin',
        'ADMIN',
        recipientId,
        recipientName,
        draft
      );

      if (result) {
        setMessages((current) => reconcileOptimisticMessage(current, optimistic.id, result));
        loadAllData();
      } else {
        setMessages((current) => markOptimisticMessageFailed(current, optimistic.id));
        setNewMessage((current) => current || draft);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (optimistic) {
        setMessages((current) => markOptimisticMessageFailed(current, optimistic.id));
        setNewMessage((current) => current || draft);
      }
      alert(t.errors.send);
    } finally {
      setSendingMessage(false);
    }
  };

  // ============================================================
  // CLOSE CONVERSATION (soft-close)
  // ============================================================
  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    try {
      const success = await closeConversation(selectedConversation.id);
      if (success) {
        // Remove from local list immediately (unread badge updates automatically)
        if (selectedConversation.type === 'INTERNAL') {
          setSupportConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
        } else if (selectedConversation.type === 'USERS') {
          setUserConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
        }
        // Clear selected conversation and messages
        setSelectedConversation(null);
        setMessages([]);
        setShowCloseConfirm(false);
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert(t.errors.close);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locales = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR', ru: 'ru-RU', tr: 'tr-TR', de: 'de-DE' };
    return date.toLocaleTimeString(locales[i18n.resolvedLanguage] || locales.en, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Real profile image from the already-returned API payload.
  // UserAvatar handles the initials fallback when no image exists.
  const getUserImage = (user) => (user?.profileImage || user?.image || null);

  // Filter conversations based on search
  const filterConversations = (conversations) => {
    if (!searchTerm) return conversations;
    const lower = searchTerm.toLowerCase();
    return conversations.filter(c => {
      const name = c.user?.fullName || c.otherStaff?.fullName || c.supportAgent?.fullName || '';
      const subject = c.complaint?.subject || '';
      return name.toLowerCase().includes(lower) || subject.toLowerCase().includes(lower);
    });
  };

  const filteredSupport = filterConversations(supportConversations);
  const filteredUsers = filterConversations(userConversations);

  // ============================================================
  // SECTION NAVIGATION
  // ============================================================
  const sections = [
    {
      id: SECTIONS.SUPPORT,
      label: i18nT('adminMessagesPage.support'),
      desc: i18nT('adminMessagesPage.internalDesc'),
      icon: Shield,
      count: supportConversations.reduce((sum, c) => sum + (c.unread || 0), 0),
      color: 'green'
    },
    {
      id: SECTIONS.USERS,
      label: i18nT('adminSidebar.users'),
      desc: i18nT('adminMessagesPage.user'),
      icon: Users,
      count: userConversations.reduce((sum, c) => sum + (c.unread || 0), 0),
      color: 'yellow'
    }
  ];

  const getSectionIconBg = (color) => {
    const colors = {
      red: 'bg-red-500/10 text-red-500',
      green: 'bg-green-500/10 text-green-500',
      yellow: 'bg-yellow-500/10 text-yellow-500',
      blue: 'bg-blue-500/10 text-blue-500'
    };
    return colors[color] || colors.yellow;
  };

  // ============================================================
  // RENDER CONVERSATION LIST ITEM
  // ============================================================
  const renderConversationItem = (conv, type) => {
    let title = '';
    let subtitle = '';
    let avatarName = t.user;
    let avatarRole = 'USER';
    let avatarImage = null;

    if (type === 'USERS') {
      title = conv.user?.fullName || t.user;
      subtitle = conv.lastMessage || '';
      avatarName = conv.user?.fullName || t.user;
      avatarRole = conv.user?.role || 'USER';
      avatarImage = getUserImage(conv.user);
    } else if (type === 'INTERNAL') {
      title = conv.otherStaff?.fullName || t.staff;
      subtitle = conv.lastMessage || '';
      avatarName = conv.otherStaff?.fullName || t.staff;
      avatarRole = conv.otherStaff?.role || 'SUPPORT';
      avatarImage = getUserImage(conv.otherStaff);
    }

    return (
      <button
        key={conv.id}
        onClick={() => {
          loadConversationMessages(conv);
          if (window.innerWidth < 768) {
            setShowConversationList(false);
          }
        }}
        className={`w-full p-3 flex items-center gap-3 hover:bg-yellow-500/5 transition border-b border-yellow-500/10 text-left ${
          selectedConversation?.id === conv.id ? 'bg-yellow-500/10 border-l-2 border-l-yellow-500' : ''
        }`}
      >
        <UserAvatar
          name={avatarName}
          image={avatarImage}
          role={avatarRole}
          size="md"
          className="border-2 border-yellow-500/30 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <UserDisplayName
              user={type === 'USERS' ? conv.user : conv.otherStaff}
              name={title}
              role={avatarRole}
              isPremium={(type === 'USERS' ? conv.user : conv.otherStaff)?.isPremium === true}
              size="sm"
              defaultNameClassName="font-medium text-white"
            />
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatDate(conv.lastMessageTime || conv.updatedAt)}</span>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</p>
          <div className="flex items-center gap-2 mt-1">
            {presence[String(getCounterpartUserId(conv, type))] === true ? (
              <span className="text-xs text-green-500">{t.online}</span>
            ) : (
              <span className="text-xs text-gray-400">{t.offline}</span>
            )}
            {conv.unread > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-500 text-black text-xs rounded-full font-medium">
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  // ============================================================
  // RENDER EMPTY STATE
  // ============================================================
  const renderEmptyState = (message) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 mb-3 rounded-full bg-yellow-500/10 flex items-center justify-center">
        <MessageSquare size={24} className="text-yellow-500" />
      </div>
      <p className="text-sm text-gray-400 text-center">{message}</p>
    </div>
  );

  // ============================================================
  // RENDER SECTION CONTENT
  // ============================================================
  const renderSectionContent = () => {
    // Initial load: show inline skeleton in the conversation list area only
    if (loading && !dataLoaded) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-3"></div>
          <p className="text-sm text-gray-400">{t.loading}</p>
        </div>
      );
    }

    switch (activeSection) {
      case SECTIONS.SUPPORT:
        return filteredSupport.length === 0
          ? renderEmptyState(t.noInternal)
          : filteredSupport.map(conv => renderConversationItem(conv, 'INTERNAL'));

      case SECTIONS.USERS:
        return filteredUsers.length === 0
          ? renderEmptyState(t.noConversations)
          : filteredUsers.map(conv => renderConversationItem(conv, 'USERS'));

      default:
        return null;
    }
  };

  // ============================================================
  // RENDER CHAT PANEL
  // ============================================================
  const renderChatPanel = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <MessageSquare size={32} className="text-yellow-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">{t.selectConversation}</h3>
            <p className="text-sm text-gray-400">{t.selectConversation}</p>
          </div>
        </div>
      );
    }

    // Determine chat header info
    let chatTitle = 'Conversation';
    let chatSubtitle = '';
    let chatAvatarName = t.user;
    let chatAvatarRole = 'USER';
    let chatAvatarImage = null;

    if (selectedConversation.type === 'USERS') {
      chatTitle = selectedConversation.user?.fullName || t.user;
      chatSubtitle = i18nT('adminSidebar.users');
      chatAvatarName = selectedConversation.user?.fullName || t.user;
      chatAvatarRole = selectedConversation.user?.role || 'USER';
      chatAvatarImage = getUserImage(selectedConversation.user);
    } else if (selectedConversation.type === 'INTERNAL') {
      chatTitle = selectedConversation.otherStaff?.fullName || t.staff;
      chatSubtitle = t.internal;
      chatAvatarName = selectedConversation.otherStaff?.fullName || t.staff;
      chatAvatarRole = selectedConversation.otherStaff?.role || 'SUPPORT';
      chatAvatarImage = getUserImage(selectedConversation.otherStaff);
    }

    return (
      <>
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={chatAvatarName}
              image={chatAvatarImage}
              role={chatAvatarRole}
              size="md"
              className="border-2 border-yellow-500/30 flex-shrink-0"
            />
            <div>
              <UserDisplayName
                user={selectedConversation.type === 'USERS' ? selectedConversation.user : selectedConversation.otherStaff}
                name={chatTitle}
                role={chatAvatarRole}
                isPremium={(selectedConversation.type === 'USERS'
                  ? selectedConversation.user
                  : selectedConversation.otherStaff)?.isPremium === true}
                size="sm"
                defaultNameClassName="font-medium text-white"
              />
              <p className="text-xs text-gray-400">{chatSubtitle}</p>
              {presence[String(getOtherUserId())] === true ? (
                <p className="text-xs text-green-500">{t.online}</p>
              ) : (
                <p className="text-xs text-gray-400">{t.offline}</p>
              )}
              {otherUserTyping && (
                <p className="text-xs font-medium text-yellow-500">{i18nT('typingIndicator')}</p>
              )}
            </div>
          </div>
          {/* Three-dot menu: Close Conversation */}
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-gray-400 hover:text-white transition"
            title={t.moreActions}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0a0a]">
          {chatLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm text-gray-400">{t.noMessages}</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSelf = msg.senderId === authUser?.id;
              const prev = messages[idx - 1];
              const isFirstInGroup = idx === 0 || prev?.senderId !== msg.senderId;
              const senderImage = msg.sender?.image || msg.sender?.profileImage || null;
              const senderName = msg.senderName || msg.sender?.name || t.user;
              const senderRole = msg.senderRole || msg.sender?.role || 'USER';

              return (
                <div
                  key={msg.id || idx}
                  className={`flex ${isSelf ? 'justify-end' : 'justify-start'} items-end gap-2`}
                >
                  {!isSelf && (
                    isFirstInGroup ? (
                      <UserAvatar
                        name={senderName}
                        image={senderImage}
                        role={senderRole}
                        size="sm"
                        className="flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )
                  )}
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    isSelf
                      ? 'bg-yellow-500 text-black'
                      : 'bg-[#1a1a1a] text-white border border-yellow-500/20'
                  }`}>
                    <div className="mb-1">
                      {isSelf ? (
                        <span className="text-xs font-medium text-black/70">
                          {t.you}
                        </span>
                      ) : (
                        <UserDisplayName
                          name={senderName}
                          role={senderRole}
                          isPremium={msg.senderIsPremium || msg.sender?.isPremium}
                          size="sm"
                          className="text-white"
                        />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 ${
                      isSelf ? 'text-black/60' : 'text-gray-500'
                    }`}>
                      {formatDate(msg.timestamp)}
                      {msg.sendFailed && (
                        <AlertTriangle size={13} className="inline ml-1 text-red-500" title={t.errors.send} />
                      )}
                    </p>
                  </div>
                  {isSelf && (
                    isFirstInGroup ? (
                      <UserAvatar
                        name={authUser?.fullName || t.you}
                        image={authUser?.profileImage || authUser?.image || null}
                        role="ADMIN"
                        size="sm"
                        className="flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-yellow-500/20 bg-[#0a0a0a]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t.typeMessage}
              value={newMessage}
              onChange={handleNewMessageChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 min-w-0 px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500 text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              className="px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 flex items-center gap-2 text-sm font-medium flex-shrink-0"
            >
              <Send size={16} />
              {t.send}
            </button>
          </div>
        </div>
      </>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  // Only block during initial unresolved authentication
  // After auth resolves, render the page shell immediately
  if (authLoading && !authUser) {
    return <PageLoader text="Loading..." fullScreen />;
  }

  if (!authUser) return null;

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Compact Header */}
        <div className="px-6 py-4 border-b border-yellow-500/20 bg-[#0a0a0a]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">{t.title}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStartConversation(true)}
                className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={16} />
                {t.startConversation}
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-[#1a1a1a] border border-yellow-500/30 text-white rounded-lg hover:bg-yellow-500/10 transition flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? t.refreshing : t.refresh}
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-yellow-500/20 bg-[#0a0a0a]">
          <div className="flex gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setSelectedConversation(null);
                    setMessages([]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm ${
                    isActive
                      ? 'bg-yellow-500 text-black font-medium'
                      : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-yellow-500/10'
                  }`}
                >
                  <Icon size={16} />
                  <span>{section.label}</span>
                  {section.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-black/20' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {section.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split View Chat Interface */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL - Conversation List */}
          <div className={`${showConversationList ? 'w-80' : 'hidden'} md:w-80 md:flex border-r border-yellow-500/20 flex-col bg-[#0a0a0a]`}>
            {/* Search */}
            <div className="p-3 border-b border-yellow-500/20">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500 text-sm"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {renderSectionContent()}
            </div>
          </div>

          {/* RIGHT PANEL - Conversation View */}
          <div className="flex-1 flex flex-col bg-[#0a0a0a]">
            {selectedConversation && (
              <button
                onClick={() => setShowConversationList(true)}
                className="md:hidden p-3 border-b border-yellow-500/20 flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <ChevronRight size={16} className="rotate-180" />
                <span className="text-sm">{t.back}</span>
              </button>
            )}
            {renderChatPanel()}
          </div>
        </div>
      </div>

      {/* Start Conversation Modal */}
      <StartConversationModal
        isOpen={showStartConversation}
        onClose={() => setShowStartConversation(false)}
        onSelectUser={handleStartConversation}
        allowedRoles={activeSection === SECTIONS.SUPPORT ? STAFF_TARGET_ROLES : USER_TARGET_ROLES}
      />

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCloseConfirm(false)} />
          <div className="relative w-full max-w-md bg-[#1a1a1a] border border-yellow-500/20 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">{t.closeConversation}</h3>
            <p className="text-sm text-gray-400 mb-5">
              {t.closeDescription}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-white rounded-lg hover:bg-yellow-500/10 transition text-sm"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCloseConversation}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition text-sm font-medium"
              >
                {t.closeConversation}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminMessages;
