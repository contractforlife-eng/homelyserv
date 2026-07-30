// src/pages/AdminMessages.jsx - MIGRATED TO COMMON CHAT ARCHITECTURE
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  MessageCircle,
  Search,
  Send,
  RefreshCw,
  X,
  Archive,
  MoreVertical,
  User,
  Trash2,
  Ban,
  Plus
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationId,
  deleteConversation,
  formatDisplayName
} from '../utils/chatService';
import api from '../utils/api';

// ============================================================
// NEW CHAT DRAWER COMPONENT
// ============================================================
const NewChatDrawer = ({ isOpen, onClose, onSelectUser, authUserId }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAllUsers = useCallback(async () => {
    if (!authUserId) return;
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      const users = response.data.users || [];
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
  }, [authUserId]);

  useEffect(() => {
    if (isOpen) {
      loadAllUsers();
      setSearchTerm('');
    }
  }, [isOpen, loadAllUsers]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(allUsers);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredUsers(
      allUsers.filter(u =>
        u.fullName?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, allUsers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-md bg-[#1a1a1a] border-l border-yellow-500/20 shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b border-yellow-500/20">
          <h2 className="text-lg font-semibold text-white">New Chat</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-yellow-500/10 text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-yellow-500/20">
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
        </div>

        {/* Users List */}
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 130px)' }}>
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
                  onClick={() => onSelectUser(userId, user.fullName || user.name)}
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
                    <span className="text-xs text-gray-500">
                      {user.role === 'EMPLOYER' ? '(Employer)' : user.role === 'WORKER' ? '(Worker)' : '(User)'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
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
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const dropdownRef = useRef(null);
  const messagesEndRef = useRef(null);

  const translations = {
    en: {
      title: 'Messages',
      subtitle: 'View and manage all platform messages',
      searchPlaceholder: 'Search conversations...',
      typeMessage: 'Type a message...',
      send: 'Send',
      close: 'Close',
      noConversations: 'No conversations yet',
      noMessages: 'No messages yet',
      loading: 'Loading messages...',
      refresh: 'Refresh',
      viewChat: 'View Chat',
      newChat: 'New Chat'
    },
    ar: {
      title: 'الرسائل',
      subtitle: 'عرض وإدارة جميع رسائل المنصة',
      searchPlaceholder: 'ابحث عن محادثات...',
      typeMessage: 'اكتب رسالة...',
      send: 'إرسال',
      close: 'إغلاق',
      noConversations: 'لا توجد محادثات حتى الآن',
      noMessages: 'لا توجد رسائل بعد',
      loading: 'جاري تحميل الرسائل...',
      refresh: 'تحديث',
      viewChat: 'عرض المحادثة',
      newChat: 'محادثة جديدة'
    }
  };

  const t = translations['en'];

  // ============================================================
  // loadConversations
  // ============================================================
  const loadConversations = async () => {
    if (!authUser?.id) return;
    
    try {
      const userConversations = await getUserConversations(authUser.id);
      console.log('📨 Loaded conversations:', userConversations.length);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };

  // ============================================================
  // loadMessages
  // ============================================================
  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const conversationMessages = await getConversationMessages(conversationId);
      console.log('📨 Loaded messages:', conversationMessages.length);
      setMessages(conversationMessages);
      
      // Mark messages as read
      await markMessagesAsRead(conversationId, authUser.id);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  // ============================================================
  // useEffects
  // ============================================================
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

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

    // Initial load - only conversations, NOT all users
    setLoading(true);
    loadConversations().finally(() => {
      setLoading(false);
    });
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // Polling for conversations (silent, no loading state)
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 3000);

    return () => clearInterval(interval);
  }, [authUser]);

  // Load messages when user selected
  useEffect(() => {
    if (selectedUserId) {
      const conversationId = getConversationId(authUser.id, selectedUserId);
      loadMessages(conversationId);
    }
  }, [selectedUserId]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter conversations based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredConversations(conversations);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredConversations(
      conversations.filter(c =>
        c.otherUserName?.toLowerCase().includes(lower)
      )
    );
  }, [conversations, searchTerm]);

  // ============================================================
  // UI Helpers
  // ============================================================
  const handleRefresh = () => {
    loadConversations();
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
  };

  const getRoleLabel = (role) => {
    const labels = {
      'ADMIN': '(Co-Admin)',
      'EMPLOYER': '(Employer)',
      'WORKER': '(Worker)',
      'USER': '(User)'
    };
    return labels[role] || '(User)';
  };

  const getSenderRoleLabel = (role) => {
    if (role === 'ADMIN') return 'Co-Admin';
    return role || 'User';
  };

  const formatSenderName = (senderName, senderRole, isCurrentUser) => {
    if (isCurrentUser) {
      // Current user: {User Name} (You)
      return `${senderName || 'User'} (You)`;
    }
    // Other users: use shared formatter
    return formatDisplayName(senderName, senderRole);
  };

  // Dropdown handlers
  const handleDropdownToggle = (e, userId) => {
    e.stopPropagation();
    setDropdownOpen(dropdownOpen === userId ? null : userId);
  };

  const handleDropdownClose = () => {
    setDropdownOpen(null);
  };

  // Action handlers
  const handleOpenChat = (userId) => {
    handleDropdownClose();
    handleSelectUser(userId);
  };

  const handleViewUserProfile = (userId) => {
    handleDropdownClose();
    const conv = conversations.find(c => c.otherUserId === userId);
    if (!conv) return;

    if (conv.otherUserRole === 'WORKER') {
      navigate(`/worker-profile/${userId}`);
    } else if (conv.otherUserRole === 'EMPLOYER') {
      navigate(`/employer-profile/${userId}`);
    } else {
      navigate(`/admin/users/${userId}`);
    }
  };

  const handleArchiveConversation = async (userId) => {
    handleDropdownClose();
    // TODO: Implement archive conversation
    // Backend endpoint required: POST /api/chat/archive
    // Request body: { conversationId, userId }
    console.log('Archive conversation:', userId);
    alert('Archive conversation feature coming soon. Backend endpoint: POST /api/chat/archive');
  };

  const handleDeleteConversation = async (userId) => {
    handleDropdownClose();
    
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const conversationId = getConversationId(authUser.id, userId);
      const success = await deleteConversation(conversationId);
      
      if (success) {
        // Remove from conversations list
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        
        // If deleted conversation is currently open, clear chat panel
        if (selectedUserId === userId) {
          setSelectedUserId(null);
          setMessages([]);
        }
        
        // Reload conversations to update UI
        loadConversations();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleBlockUser = async (userId) => {
    handleDropdownClose();
    
    if (!window.confirm('Are you sure you want to block this user? They will no longer be able to send you messages.')) {
      return;
    }

    // TODO: Implement block user
    // Backend endpoint required: POST /api/admin/users/:userId/block
    // Request body: { reason } (optional)
    console.log('Block user:', userId);
    alert('Block user feature coming soon. Backend endpoint: POST /api/admin/users/:userId/block');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleDropdownClose();
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleDropdownClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleDrawerSelectUser = (userId, userName) => {
    setDrawerOpen(false);
    setSelectedUserId(userId);
    setSelectedUserName(userName || '');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !authUser) return;
    
    setSendingMessage(true);
    
    try {
      const conv = conversations.find(c => c.otherUserId === selectedUserId);
      const recipientName = conv?.otherUserName || selectedUserName || 'User';

      const result = await sendMessage(
        authUser.id,
        authUser.fullName || 'Admin',
        'ADMIN',
        selectedUserId,
        recipientName,
        newMessage
      );

      if (result) {
        setNewMessage('');
        const conversationId = getConversationId(authUser.id, selectedUserId);
        loadMessages(conversationId);
        loadConversations();
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

  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
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
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-black/20 text-black rounded-lg hover:bg-black/30 transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {t.refresh}
            </button>
          </div>
        </div>

        {/* Split View Chat Interface */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[700px]">
            {/* LEFT PANEL - Conversations List */}
            <div className="border-r border-yellow-500/20 flex flex-col">
              {/* Search + New Chat Button */}
              <div className="p-4 border-b border-yellow-500/20 space-y-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="w-full px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={18} />
                  {t.newChat}
                </button>
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
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-gray-400">{t.noConversations}</p>
                    <p className="text-sm text-gray-500 mt-2">Click "New Chat" to start a conversation</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const userId = conv.otherUserId;
                    return (
                      <div key={conv.id || userId} className="relative">
                        <div
                          onClick={() => handleSelectUser(userId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleSelectUser(userId)}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-yellow-500/5 transition border-b border-yellow-500/10 ${
                            selectedUserId === userId ? 'bg-yellow-500/10' : ''
                          }`}
                        >
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formatDisplayName(conv.otherUserName, conv.otherUserRole || conv.role) || 'User')}&background=yellow&color=000&size=100&bold=true`}
                            alt={formatDisplayName(conv.otherUserName, conv.otherUserRole || conv.role)}
                            className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500/30 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-white truncate">{formatDisplayName(conv.otherUserName, conv.otherUserRole || conv.role)}</p>
                              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.time || ''}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-400 truncate">{conv.lastMessage || 'No messages yet'}</p>
                              <button
                                onClick={(e) => handleDropdownToggle(e, userId)}
                                className="p-1 rounded-lg hover:bg-yellow-500/10 transition-colors text-gray-400 hover:text-yellow-500 ml-2 flex-shrink-0"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{getRoleLabel(conv.otherUserRole)}</span>
                              {conv.unread > 0 && (
                                <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
                                  {conv.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Menu */}
                        {dropdownOpen === userId && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-4 top-16 z-50 w-48 bg-[#1a1a1a] border border-yellow-500/20 rounded-lg shadow-xl overflow-hidden"
                          >
                            <button
                              onClick={() => handleOpenChat(userId)}
                              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-yellow-500/10 transition flex items-center gap-2"
                            >
                              <MessageCircle size={16} />
                              Open Chat
                            </button>
                            <button
                              onClick={() => handleViewUserProfile(userId)}
                              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-yellow-500/10 transition flex items-center gap-2"
                            >
                              <User size={16} />
                              View User Profile
                            </button>
                            <button
                              onClick={() => handleArchiveConversation(userId)}
                              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-yellow-500/10 transition flex items-center gap-2"
                            >
                              <Archive size={16} />
                              Archive Conversation
                            </button>
                            <button
                              onClick={() => handleDeleteConversation(userId)}
                              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-yellow-500/10 transition flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Delete Conversation
                            </button>
                            <button
                              onClick={() => handleBlockUser(userId)}
                              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                            >
                              <Ban size={16} />
                              Block User
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANEL - Conversation View */}
            <div className="col-span-2 flex flex-col h-[700px]">
              {selectedUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-yellow-500/20 flex items-center justify-between bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formatDisplayName(conversations.find(c => c.otherUserId === selectedUserId)?.otherUserName, (conversations.find(c => c.otherUserId === selectedUserId)?.otherUserRole || conversations.find(c => c.otherUserId === selectedUserId)?.role)) || 'User')}&background=yellow&color=000&size=100&bold=true`}
                        alt="Chat"
                        className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/30"
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {formatDisplayName(conversations.find(c => c.otherUserId === selectedUserId)?.otherUserName, (conversations.find(c => c.otherUserId === selectedUserId)?.otherUserRole || conversations.find(c => c.otherUserId === selectedUserId)?.role))}
                        </p>
                        <p className="text-xs text-gray-400">{getRoleLabel(conversations.find(c => c.otherUserId === selectedUserId)?.otherUserRole)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3">💬</div>
                        <p className="text-gray-400">{t.noMessages}</p>
                        <p className="text-sm text-gray-500 mt-2">Start a conversation with this user</p>
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
                            <p className="text-xs font-medium mb-1">
                              {formatSenderName(msg.senderName, msg.senderRole, msg.senderId === authUser?.id)}
                            </p>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${
                              msg.senderId === authUser?.id
                                ? 'text-black/70'
                                : 'text-gray-400'
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
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Select a user to start chatting</h3>
                    <p className="text-gray-400">Choose a user from the left panel to view or start a conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Drawer */}
      <NewChatDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelectUser={handleDrawerSelectUser}
        authUserId={authUser?.id}
      />
    </DashboardLayout>
  );
};

export default AdminMessages;
