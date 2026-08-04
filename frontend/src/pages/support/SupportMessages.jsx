// Support Messages Page - Reuses existing chat system
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import { useDashboard } from '../../components/layout/DashboardContext';
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  RefreshCw,
  Shield
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getSupportUsers,
  ensureConversationExists,
  deleteConversation,
  formatDisplayName
} from '../../utils/chatService';
import api from '../../utils/api';

const SupportMessages = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const dashboard = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const dropdownRef = useRef(null);

  // ============================================================
  // loadConversations - EXACT SAME AS ADMIN
  // ============================================================
  const loadConversations = async () => {
    if (!authUser?.id) return;
    
    try {
      const userConversations = await getUserConversations(authUser.id);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };

  // ============================================================
  // useEffects - EXACT SAME AS ADMIN
  // ============================================================
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'SUPPORT' && authUser.role !== 'ADMIN') {
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

  // Auto-refresh
  useEffect(() => {
    if (!authUser) return;

    intervalRef.current = setInterval(async () => {
      const updatedConversations = await getUserConversations(authUser.id);
      setConversations(prevConversations => {
        if (JSON.stringify(prevConversations) !== JSON.stringify(updatedConversations)) {
          return updatedConversations;
        }
        return prevConversations;
      });

      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
            markMessagesAsRead(selectedConversationId, authUser.id);
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [authUser, selectedConversationId]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadMessagesForConversation = async (conversationId) => {
    console.log('🔵 selected conversation object:', conversations.find(c => c.id === selectedConversationId));
    console.log('🔵 conversationId sent to API:', conversationId);
    const conversationMessages = await getConversationMessages(conversationId);
    console.log('🔵 messages API response:', conversationMessages);
    console.log('🔵 messages count:', conversationMessages.length);
    setMessages(conversationMessages);
    
    const userId = authUser?.id;
    if (userId) {
      await markMessagesAsRead(conversationId, userId);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
    loadMessagesForConversation(conversationId);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversationId || !authUser) {
      return;
    }

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) {
      return;
    }

    const result = await sendMessage(
      authUser.id,
      authUser.fullName || 'Support',
      'SUPPORT',
      selectedConv.otherUserId,
      selectedConv.otherUserName,
      message
    );

    if (result) {
      await loadMessagesForConversation(selectedConversationId);
      setRefreshKey(prev => prev + 1);
      setMessage('');
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    if (authUser) {
      const userId = authUser.id;
      const updatedConversations = await getUserConversations(userId);
      setConversations(updatedConversations);
      
      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        setMessages(updatedMessages);
        await markMessagesAsRead(selectedConversationId, userId);
      }
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleStartNewConversation = async (userId, userName, userRole) => {
    // Create or find the conversation between SUPPORT and selected user
    const conversationId = await ensureConversationExists(
      authUser.id,
      authUser.fullName,
      'SUPPORT',
      userId,
      userName,
      userRole
    );

    // Build the conversation object and add it to the list
    const newConversation = {
      id: conversationId,
      otherUserId: String(userId),
      otherUserName: userName || 'User',
      lastMessage: 'Start your conversation here',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      role: userRole || 'USER',
      avatar: getAvatarForUser(userId, userName, userRole),
      updatedAt: new Date()
    };

    // Add to conversations list if not already there
    setConversations(prev => {
      const exists = prev.some(c => c.id === conversationId);
      if (exists) return prev;
      return [newConversation, ...prev];
    });

    // Set as selected conversation and load messages
    setSelectedConversationId(conversationId);
    setMessages([]);
    await loadMessagesForConversation(conversationId);
    setShowNewConversationModal(false);
  };

  const getAvatarForUser = (userId, userName, role) => {
    const bg = role === 'EMPLOYER' ? 'teal' : role === 'WORKER' ? 'red' : role === 'ADMIN' ? 'yellow' : 'green';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=${bg}&color=fff&size=100&bold=true`;
  };

  const userProfileImage = authUser?.profileImage || null;

  const translations = {
    en: {
      title: 'Messages',
      subtitle: 'Respond to user inquiries',
      searchPlaceholder: 'Search conversations...',
      typeMessage: 'Type a message...',
      send: 'Send',
      noConversations: 'No conversations yet',
      noConversationsDesc: 'Start helping users by creating a new conversation',
      online: 'Online',
      loading: 'Loading messages...',
      noMessages: 'No messages yet',
      startConversation: 'Start the conversation!',
      refresh: 'Refresh',
      newConversation: 'New Conversation',
      selectUser: 'Select a user to start a conversation'
    },
    ar: {
      title: 'الرسائل',
      subtitle: 'الرد على استفسارات المستخدمين',
      searchPlaceholder: 'البحث في المحادثات...',
      typeMessage: 'اكتب رسالة...',
      send: 'إرسال',
      noConversations: 'لا توجد محادثات بعد',
      noConversationsDesc: 'ابدأ في مساعدة المستخدمين بإنشاء محادثة جديدة',
      online: 'متصل',
      loading: 'جاري تحميل الرسائل...',
      noMessages: 'لا توجد رسائل بعد',
      startConversation: 'ابدأ المحادثة!',
      refresh: 'تحديث',
      newConversation: 'محادثة جديدة',
      selectUser: 'اختر مستخدم لبدء محادثة'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  return (
    <SupportLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-white/80 mt-1">{t.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Shield size={16} />
              {t.newConversation}
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Conversations List */}
            <div className="border-r border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(600px-73px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-gray-500 dark:text-gray-400">{t.noConversations}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t.noConversationsDesc}</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 ${
                        selectedConversationId === conv.id ? 'bg-green-50 dark:bg-green-900/30' : ''
                      }`}
                    >
                      <img
                        src={getAvatarForUser(conv.otherUserId, conv.otherUserName, conv.role)}
                        alt={conv.otherUserName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-800 dark:text-white truncate">
                            {formatDisplayName(conv.otherUserName, conv.role)}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0">{conv.time}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-green-500">{t.online}</span>
                          {conv.unread > 0 && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="col-span-2 flex flex-col h-[600px]">
              {selectedConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/30">
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatarForUser(
                          conversations.find(c => c.id === selectedConversationId)?.otherUserId,
                          conversations.find(c => c.id === selectedConversationId)?.otherUserName,
                          conversations.find(c => c.id === selectedConversationId)?.role
                        )}
                        alt="Chat"
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {formatDisplayName(
                            conversations.find(c => c.id === selectedConversationId)?.otherUserName,
                            conversations.find(c => c.id === selectedConversationId)?.role
                          )}
                        </p>
                        <p className="text-xs text-green-500">{t.online}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 relative" ref={dropdownRef}>
                      <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                      >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                          <button
                            onClick={async () => {
                              setDropdownOpen(false);
                              if (selectedConversationId) {
                                const success = await deleteConversation(selectedConversationId);
                                if (success) {
                                  setConversations(prev => prev.filter(c => c.id !== selectedConversationId));
                                  setSelectedConversationId(null);
                                  setMessages([]);
                                }
                              }
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                          >
                            Delete Conversation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/20">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <p>{t.noMessages}</p>
                        <p className="text-sm">{t.startConversation}</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isSupport = msg.senderRole === 'SUPPORT';
                        const showAvatar = index === 0 || 
                          (index > 0 && messages[index - 1]?.senderRole !== msg.senderRole);
                        
                        return (
                          <div
                            key={msg.id || index}
                            className={`flex ${isSupport ? 'justify-end' : 'justify-start'} items-end gap-2`}
                          >
                            {!isSupport && showAvatar && (
                              <img
                                src={getAvatarForUser(
                                  conversations.find(c => c.id === selectedConversationId)?.otherUserId,
                                  msg.senderName || 'User',
                                  msg.senderRole
                                )}
                                alt={msg.senderName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                              />
                            )}
                            {!isSupport && !showAvatar && (
                              <div className="w-8 flex-shrink-0"></div>
                            )}
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                isSupport
                                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-br-none'
                                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                              }`}
                            >
                              {!isSupport && (
                                <p className="text-xs font-medium text-green-600 mb-1">
                                  {formatDisplayName(msg.senderName, msg.senderRole)}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                              <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                                isSupport ? 'text-green-200' : 'text-gray-400'
                              }`}>
                                {msg.time}
                                {isSupport && (
                                  <CheckCheck size={14} className={msg.read ? 'text-green-300' : 'text-green-200'} />
                                )}
                              </p>
                            </div>
                            {isSupport && showAvatar && (
                              <img
                                src={userProfileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.fullName || 'Support')}&background=green&color=fff&size=100&bold=true`}
                                alt={authUser.fullName || 'Support'}
                                className="w-8 h-8 rounded-full object-cover border-2 border-green-200 flex-shrink-0"
                              />
                            )}
                            {isSupport && !showAvatar && (
                              <div className="w-8 flex-shrink-0"></div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t.typeMessage}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                        disabled={!message.trim()}
                      >
                        <Send size={18} />
                        {t.send}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Select a conversation</h3>
                    <p className="text-gray-500 dark:text-gray-400">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Conversation Modal */}
        {showNewConversationModal && (
          <NewConversationModal
            users={allUsers}
            onSelectUser={handleStartNewConversation}
            onClose={() => setShowNewConversationModal(false)}
            t={t}
          />
        )}
      </div>
    </SupportLayout>
  );
};

// New Conversation Modal Component
const NewConversationModal = ({ users, onSelectUser, onClose, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/support/users?limit=100');
      if (response.data?.success) {
        setUserList(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = userList.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t.newConversation}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t.noUsers}</p>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user.id, user.fullName, user.role)}
                  className="w-full p-3 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition text-left"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formatDisplayName(user.fullName, user.role))}&background=green&color=fff&size=100&bold=true`}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDisplayName(user.fullName, user.role)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportMessages;