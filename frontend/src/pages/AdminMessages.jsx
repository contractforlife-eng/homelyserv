// src/pages/AdminMessages.jsx - ARCHITECTURE REFACTOR
// ============================================================
// Admin messaging page redesigned with secure permission model.
//
// Admin does NOT have automatic access to private user chats.
// This page shows only:
//   1. Escalated Conversations (after support escalates)
//   2. Support Conversations (supervision)
//   3. Internal Staff Messages (Support <-> Admin)
//   4. System Notifications
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  Search,
  Send,
  RefreshCw,
  X,
  AlertTriangle,
  Shield,
  Users,
  Bell,
  ChevronRight,
  Plus,
  Briefcase,
  Wrench,
  Headphones,
  MessageSquare
} from 'lucide-react';
import {
  getEscalatedConversations,
  getAdminSupportConversations,
  getInternalMessages,
  getAdminConversationMessages,
  sendMessage,
  markMessagesAsRead,
  formatDisplayName,
  startAdminConversation
} from '../utils/chatService';
import { getRoleLabel, getRoleColor } from '../utils/userDisplay';
import { UserDisplayName } from '../components/users';
import api from '../utils/api';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/PageLoader';

// ============================================================
// SECTION TABS
// ============================================================
const SECTIONS = {
  ESCALATED: 'escalated',
  SUPPORT: 'support',
  INTERNAL: 'internal',
  NOTIFICATIONS: 'notifications'
};

// ============================================================
// START CONVERSATION MODAL
// ============================================================
const StartConversationModal = ({ isOpen, onClose, onSelectUser }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      const users = response.data?.users || [];
      // Exclude admins from the list (admin cannot start conversation with self)
      const nonAdminUsers = users.filter(u => u.role !== 'ADMIN');
      setAllUsers(nonAdminUsers);
      setFilteredUsers(nonAdminUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setAllUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
      filtered = filtered.filter(u => u.role === roleFilter);
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
              Start Conversation
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Official HomelyServ administrative conversation
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500"
              autoFocus
            />
          </div>

          {/* Role Filters */}
          <div className="flex gap-2">
            {['ALL', 'WORKER', 'EMPLOYER', 'SUPPORT'].map((role) => (
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
                {role === 'ALL' ? 'All' : getRoleLabel(role)}
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
              <p className="text-gray-400">No users found</p>
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
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.name || 'User')}&background=yellow&color=000&size=100&bold=true`}
                    alt={user.fullName || user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500/30 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{user.fullName || user.name}</p>
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
            Conversations are created as official HomelyServ administrative chats (SUPPORT or INTERNAL). Private user chats remain isolated.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN ADMIN MESSAGES COMPONENT
// ============================================================
const AdminMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  const [activeSection, setActiveSection] = useState(SECTIONS.ESCALATED);
  const [escalatedConversations, setEscalatedConversations] = useState([]);
  const [supportConversations, setSupportConversations] = useState([]);
  const [internalConversations, setInternalConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Chat panel state
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showStartConversation, setShowStartConversation] = useState(false);
  const messagesEndRef = useRef(null);
  const autoOpenDoneRef = useRef(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const translations = {
    en: {
      title: 'Messages',
      subtitle: 'Secure messaging center',
      searchPlaceholder: 'Search conversations...',
      typeMessage: 'Type a message...',
      send: 'Send',
      noConversations: 'No conversations yet',
      noMessages: 'No messages yet',
      loading: 'Loading messages...',
      refresh: 'Refresh',
      escalated: 'Escalated Conversations',
      escalatedDesc: 'Conversations escalated to Admin by Support',
      support: 'Support Conversations',
      supportDesc: 'User support conversations (supervision)',
      internal: 'Internal Staff Messages',
      internalDesc: 'Support <-> Admin internal communication',
      notifications: 'System Notifications',
      notificationsDesc: 'Platform system notifications',
      escalatedBy: 'Escalated by',
      reason: 'Reason',
      complaint: 'Complaint',
      selectConversation: 'Select a conversation to view messages',
      back: 'Back',
      noEscalated: 'No escalated conversations',
      noSupport: 'No support conversations',
      noInternal: 'No internal messages',
      noNotifications: 'No system notifications',
      viewConversation: 'View Conversation',
      user: 'User',
      supportAgent: 'Support Agent',
      staff: 'Staff',
      empty: 'Nothing here yet'
    },
    ar: {
      title: 'الرسائل',
      subtitle: 'مركز الرسائل الآمن',
      searchPlaceholder: 'ابحث عن محادثات...',
      typeMessage: 'اكتب رسالة...',
      send: 'إرسال',
      noConversations: 'لا توجد محادثات بعد',
      noMessages: 'لا توجد رسائل بعد',
      loading: 'جاري تحميل الرسائل...',
      refresh: 'تحديث',
      escalated: 'المحادثات المرفوعة',
      escalatedDesc: 'المحادثات المرفوعة إلى الأدمن بواسطة الدعم',
      support: 'محادثات الدعم',
      supportDesc: 'محادثات دعم المستخدمين (إشراف)',
      internal: 'رسائل الموظفين الداخلية',
      internalDesc: 'تواصل داخلي بين الدعم والأدمن',
      notifications: 'إشعارات النظام',
      notificationsDesc: 'إشعارات منصة النظام',
      escalatedBy: 'تم الرفع بواسطة',
      reason: 'السبب',
      complaint: 'شكوى',
      selectConversation: 'اختر محادثة لعرض الرسائل',
      back: 'رجوع',
      noEscalated: 'لا توجد محادثات مرفوعة',
      noSupport: 'لا توجد محادثات دعم',
      noInternal: 'لا توجد رسائل داخلية',
      noNotifications: 'لا توجد إشعارات نظام',
      viewConversation: 'عرض المحادثة',
      user: 'المستخدم',
      supportAgent: 'وكيل الدعم',
      staff: 'الموظف',
      empty: 'لا يوجد شيء هنا بعد'
    }
  };

  const t = translations['en'];

  // ============================================================
  // LOAD DATA
  // ============================================================
  const loadAllData = useCallback(async () => {
    if (!authUser?.id) return;

    try {
      const [escalated, support, internal] = await Promise.all([
        getEscalatedConversations(),
        getAdminSupportConversations(),
        getInternalMessages()
      ]);

      setEscalatedConversations(escalated);
      setSupportConversations(support);
      setInternalConversations(internal);
    } catch (error) {
      console.error('Error loading admin conversations:', error);
      setEscalatedConversations([]);
      setSupportConversations([]);
      setInternalConversations([]);
    }
  }, [authUser]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(Array.isArray(response.data) ? response.data : response.data?.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  }, []);

  // ============================================================
  // LOAD MESSAGES FOR SELECTED CONVERSATION
  // ============================================================
  const loadConversationMessages = async (conversation) => {
    if (!conversation?.id) return;

    setChatLoading(true);
    setSelectedConversation(conversation);
    setMessages([]);

    try {
      const result = await getAdminConversationMessages(conversation.id);
      setMessages(result.messages || []);

      // Mark as read
      if (authUser?.id) {
        await markMessagesAsRead(conversation.id, authUser.id);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
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
    Promise.all([loadAllData(), loadNotifications()]).finally(() => {
      setLoading(false);
      setDataLoaded(true);
    });
  }, [authUser, isAuthenticated, authLoading, navigate, loadAllData, loadNotifications]);

  // Polling for conversations (silent)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadAllData]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRefresh = () => {
    loadAllData();
    loadNotifications();
  };

  // ============================================================
  // START CONVERSATION
  // ============================================================
  const handleStartConversation = async (userId) => {
    if (!userId || !authUser) return;

    try {
      const result = await startAdminConversation(userId);
      if (!result?.conversationId) {
        alert('Failed to start conversation');
        return;
      }

      // Close modal
      setShowStartConversation(false);

      // Build conversation object and open it
      const conv = result.conversation || {};
      const targetUser = await api.get(`/api/admin/users/${userId}`).then(r => r.data?.user).catch(() => null);

      const conversation = {
        id: result.conversationId,
        type: conv.type || 'SUPPORT',
        participantIds: conv.participantIds || [],
        supportAgentId: conv.supportAgentId || null,
        user: targetUser ? {
          id: targetUser._id || targetUser.id,
          fullName: targetUser.fullName || 'User',
          role: targetUser.role || 'USER'
        } : null,
        lastMessage: result.existing ? 'Existing conversation' : 'Official HomelyServ administrative conversation',
        lastMessageTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Refresh data to include the new conversation
      await loadAllData();

      // Open the conversation
      await loadConversationMessages(conversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  // ============================================================
  // AUTO-OPEN CONVERSATION FROM NAVIGATION (e.g. Admin Hires)
  // Waits for initial data load, then creates/opens the correct
  // admin conversation via the same handler used elsewhere.
  // ============================================================
  useEffect(() => {
    if (!authUser || !dataLoaded || autoOpenDoneRef.current) return;

    const targetUserId = location.state?.targetUserId;
    if (!targetUserId) return;

    autoOpenDoneRef.current = true;

    // Show the Support section so the opened conversation is visible in context
    setActiveSection(SECTIONS.SUPPORT);

    // Reuse the existing start/open flow (creates if missing, refreshes, opens)
    handleStartConversation(targetUserId);

    // Clear the navigation state so it doesn't re-trigger on refresh/back
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, dataLoaded]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !authUser) return;

    setSendingMessage(true);

    try {
      // Determine recipient from conversation
      let recipientId = null;
      let recipientName = 'User';

      if (selectedConversation.type === 'INTERNAL') {
        recipientId = selectedConversation.otherStaffId;
        recipientName = selectedConversation.otherStaff?.fullName || 'Staff';
      } else if (selectedConversation.type === 'SUPPORT') {
        // For SUPPORT conversations, the recipient is the user participant
        // (not the support agent, which may be the admin themselves)
        const userParticipant = (selectedConversation.participantIds || [])
          .find(id => id !== String(authUser.id));
        recipientId = userParticipant || selectedConversation.user?.id || null;
        recipientName = selectedConversation.user?.fullName || 'User';
      } else if (selectedConversation.type === 'ESCALATED') {
        // For escalated conversations, reply to the support agent
        recipientId = selectedConversation.supportAgentId;
        recipientName = selectedConversation.supportAgent?.fullName || 'Support';
      }

      if (!recipientId) {
        alert('Cannot determine recipient for this conversation');
        return;
      }

      const result = await sendMessage(
        authUser.id,
        authUser.fullName || 'Admin',
        'ADMIN',
        recipientId,
        recipientName,
        newMessage
      );

      if (result) {
        setNewMessage('');
        await loadConversationMessages(selectedConversation);
        loadAllData();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
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

  const getAvatarUrl = (name, role) => {
    const bg = role === 'EMPLOYER' ? 'teal' : role === 'WORKER' ? 'red' : role === 'ADMIN' ? 'yellow' : role === 'SUPPORT' ? 'purple' : 'gray';
    const color = role === 'ADMIN' ? '000' : 'fff';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${bg}&color=${color}&size=100&bold=true`;
  };

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

  const filteredEscalated = filterConversations(escalatedConversations);
  const filteredSupport = filterConversations(supportConversations);
  const filteredInternal = filterConversations(internalConversations);

  // ============================================================
  // SECTION NAVIGATION
  // ============================================================
  const sections = [
    {
      id: SECTIONS.ESCALATED,
      label: t.escalated,
      desc: t.escalatedDesc,
      icon: AlertTriangle,
      count: escalatedConversations.length,
      color: 'red'
    },
    {
      id: SECTIONS.SUPPORT,
      label: t.support,
      desc: t.supportDesc,
      icon: Shield,
      count: supportConversations.length,
      color: 'green'
    },
    {
      id: SECTIONS.INTERNAL,
      label: t.internal,
      desc: t.internalDesc,
      icon: Users,
      count: internalConversations.length,
      color: 'yellow'
    },
    {
      id: SECTIONS.NOTIFICATIONS,
      label: t.notifications,
      desc: t.notificationsDesc,
      icon: Bell,
      count: notifications.length,
      color: 'blue'
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
    let avatarName = 'User';
    let avatarRole = 'USER';

    if (type === 'ESCALATED') {
      title = conv.user?.fullName || 'User';
      subtitle = conv.complaint?.subject || conv.escalationReason || conv.lastMessage || '';
      avatarName = conv.user?.fullName || 'User';
      avatarRole = conv.user?.role || 'USER';
    } else if (type === 'SUPPORT') {
      title = conv.user?.fullName || 'User';
      subtitle = conv.lastMessage || '';
      avatarName = conv.user?.fullName || 'User';
      avatarRole = conv.user?.role || 'USER';
    } else if (type === 'INTERNAL') {
      title = conv.otherStaff?.fullName || 'Staff';
      subtitle = conv.lastMessage || '';
      avatarName = conv.otherStaff?.fullName || 'Staff';
      avatarRole = conv.otherStaff?.role || 'SUPPORT';
    }

    return (
      <button
        key={conv.id}
        onClick={() => loadConversationMessages(conv)}
        className={`w-full p-4 flex items-center gap-3 hover:bg-yellow-500/5 transition border-b border-yellow-500/10 text-left ${
          selectedConversation?.id === conv.id ? 'bg-yellow-500/10' : ''
        }`}
      >
        <img
          src={getAvatarUrl(avatarName, avatarRole)}
          alt={title}
          className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500/30 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="font-semibold text-white truncate">{formatDisplayName(title, avatarRole)}</p>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDate(conv.lastMessageTime || conv.updatedAt)}</span>
          </div>
          <p className="text-sm text-gray-400 truncate">{subtitle}</p>
          <div className="flex items-center gap-2 mt-1">
            {type === 'ESCALATED' && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                {t.escalatedBy}: {conv.escalatedBy ? 'Support' : 'System'}
              </span>
            )}
            {type === 'SUPPORT' && conv.supportAgent && (
              <span className="text-xs text-gray-500">
                {t.supportAgent}: {conv.supportAgent.fullName}
              </span>
            )}
            {conv.unread > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
                {conv.unread}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />
      </button>
    );
  };

  // ============================================================
  // RENDER EMPTY STATE
  // ============================================================
  const renderEmptyState = (message) => (
    <EmptyState
      icon={MessageSquare}
      title={message}
      description="No conversations are currently available"
    />
  );

  // ============================================================
  // RENDER SECTION CONTENT
  // ============================================================
  const renderSectionContent = () => {
    switch (activeSection) {
      case SECTIONS.ESCALATED:
        return filteredEscalated.length === 0
          ? renderEmptyState(t.noEscalated)
          : filteredEscalated.map(conv => renderConversationItem(conv, 'ESCALATED'));

      case SECTIONS.SUPPORT:
        return filteredSupport.length === 0
          ? renderEmptyState(t.noSupport)
          : filteredSupport.map(conv => renderConversationItem(conv, 'SUPPORT'));

      case SECTIONS.INTERNAL:
        return filteredInternal.length === 0
          ? renderEmptyState(t.noInternal)
          : filteredInternal.map(conv => renderConversationItem(conv, 'INTERNAL'));

      case SECTIONS.NOTIFICATIONS:
        return notifications.length === 0
          ? renderEmptyState(t.noNotifications)
          : notifications.map((notif) => (
              <div
                key={notif._id || notif.id}
                className="p-4 flex items-start gap-3 hover:bg-yellow-500/5 transition border-b border-yellow-500/10"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Bell size={18} className="text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-white text-sm">{notif.title || 'Notification'}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatFullDate(notif.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{notif.body || notif.message || ''}</p>
                  {notif.type && (
                    <span className="text-xs text-gray-500 mt-1 inline-block">{notif.type}</span>
                  )}
                </div>
              </div>
            ));

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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t.selectConversation}</h3>
            <p className="text-gray-400">Choose a conversation from the list to view messages</p>
          </div>
        </div>
      );
    }

    // Determine chat header info
    let chatTitle = 'Conversation';
    let chatSubtitle = '';
    let chatAvatarName = 'User';
    let chatAvatarRole = 'USER';

    if (selectedConversation.type === 'ESCALATED') {
      chatTitle = selectedConversation.user?.fullName || 'User';
      chatSubtitle = selectedConversation.complaint?.subject || t.escalated;
      chatAvatarName = selectedConversation.user?.fullName || 'User';
      chatAvatarRole = selectedConversation.user?.role || 'USER';
    } else if (selectedConversation.type === 'SUPPORT') {
      chatTitle = selectedConversation.user?.fullName || 'User';
      chatSubtitle = selectedConversation.supportAgent?.fullName
        ? `${t.supportAgent}: ${selectedConversation.supportAgent.fullName}`
        : t.support;
      chatAvatarName = selectedConversation.user?.fullName || 'User';
      chatAvatarRole = selectedConversation.user?.role || 'USER';
    } else if (selectedConversation.type === 'INTERNAL') {
      chatTitle = selectedConversation.otherStaff?.fullName || 'Staff';
      chatSubtitle = t.internal;
      chatAvatarName = selectedConversation.otherStaff?.fullName || 'Staff';
      chatAvatarRole = selectedConversation.otherStaff?.role || 'SUPPORT';
    }

    return (
      <>
        {/* Chat Header */}
        <div className="p-4 border-b border-yellow-500/20 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="p-2 rounded-lg hover:bg-yellow-500/10 text-gray-400 hover:text-white transition mr-1"
            >
              <X size={18} />
            </button>
            <img
              src={getAvatarUrl(chatAvatarName, chatAvatarRole)}
              alt={chatTitle}
              className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/30"
            />
            <div>
              <p className="font-semibold text-white">{formatDisplayName(chatTitle, chatAvatarRole)}</p>
              <p className="text-xs text-gray-400">{chatSubtitle}</p>
            </div>
          </div>
          {selectedConversation.type === 'ESCALATED' && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg flex items-center gap-1">
                <AlertTriangle size={12} />
                {t.escalated}
              </span>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-400">{t.noMessages}</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.senderId === authUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-lg p-3 ${
                  msg.senderId === authUser?.id
                    ? 'bg-yellow-500 text-black'
                    : 'bg-[#0a0a0a] text-white border border-yellow-500/20'
                }`}>
                  <div className="mb-1">
                    {msg.senderId === authUser?.id ? (
                      <span className="text-xs font-medium text-black/80">
                        {msg.senderName || 'Admin'} (You)
                      </span>
                    ) : (
                      <UserDisplayName
                        name={msg.senderName}
                        role={msg.senderRole}
                        size="sm"
                        className="text-white"
                      />
                    )}
                  </div>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.senderId === authUser?.id ? 'text-black/70' : 'text-gray-400'
                  }`}>
                    {formatDate(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
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
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              className="px-6 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 flex items-center gap-2"
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
  if (!authUser) {
    return <PageLoader text="Loading..." fullScreen />;
  }

  if (loading) {
    return <PageLoader text={t.loading} fullScreen />;
  }

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">{t.title}</h1>
              <p className="text-black/70 mt-1">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStartConversation(true)}
                className="px-4 py-2 bg-black/20 text-black rounded-lg hover:bg-black/30 transition flex items-center gap-2"
              >
                <Plus size={16} />
                Start Conversation
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-black/20 text-black rounded-lg hover:bg-black/30 transition flex items-center gap-2"
              >
                <RefreshCw size={16} />
                {t.refresh}
              </button>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                className={`p-4 rounded-xl border transition text-left ${
                  isActive
                    ? 'bg-[#1a1a1a] border-yellow-500/40 shadow-lg'
                    : 'bg-[#1a1a1a]/50 border-yellow-500/10 hover:border-yellow-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSectionIconBg(section.color)}`}>
                    <Icon size={20} />
                  </div>
                  {section.count > 0 && (
                    <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full font-medium">
                      {section.count}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-white text-sm">{section.label}</p>
                <p className="text-xs text-gray-400 mt-1">{section.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Split View Chat Interface */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[700px]">
            {/* LEFT PANEL - Conversation List */}
            <div className="border-r border-yellow-500/20 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-yellow-500/20">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {renderSectionContent()}
              </div>
            </div>

            {/* RIGHT PANEL - Conversation View */}
            <div className="col-span-2 flex flex-col h-[700px]">
              {renderChatPanel()}
            </div>
          </div>
        </div>
      </div>

      {/* Start Conversation Modal */}
      <StartConversationModal
        isOpen={showStartConversation}
        onClose={() => setShowStartConversation(false)}
        onSelectUser={handleStartConversation}
      />
    </DashboardLayout>
  );
};

export default AdminMessages;
