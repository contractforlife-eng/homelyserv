// src/pages/AdminMessages.jsx - MIGRATED TO DASHBOARD LAYOUT
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  Bell,
  Globe,
  X,
  CreditCard,
  Search,
  Mail,
  Phone,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  User as UserIcon,
  Shield,
  Briefcase,
  UserCheck,
  RefreshCw,
  Send,
  Trash2,
  Archive,
  Crown,
  UserPlus
} from 'lucide-react';

// ============================================================
// MAIN ADMIN MESSAGES COMPONENT
// ============================================================
const AdminMessages = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const translations = {
    en: {
      title: 'Messages',
      subtitle: 'View and manage all platform messages',
      stats: {
        total: 'Total Conversations',
        active: 'Active',
        archived: 'Archived',
        flagged: 'Flagged'
      },
      filters: {
        all: 'All Conversations',
        active: 'Active',
        archived: 'Archived',
        flagged: 'Flagged'
      },
      table: {
        participants: 'Participants',
        lastMessage: 'Last Message',
        date: 'Date',
        status: 'Status',
        actions: 'Actions',
        noResults: 'No conversations found',
        searchPlaceholder: 'Search conversations...'
      },
      actions: {
        view: 'View Chat',
        archive: 'Archive',
        unarchive: 'Unarchive',
        flag: 'Flag',
        refresh: 'Refresh'
      },
      status: {
        active: 'Active',
        archived: 'Archived',
        flagged: 'Flagged'
      },
      modal: {
        title: 'Conversation',
        participants: 'Participants',
        messages: 'Messages',
        typeMessage: 'Type a message...',
        send: 'Send',
        close: 'Close',
        noMessages: 'No messages yet',
        from: 'From',
        to: 'To',
        date: 'Date'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading messages...',
      noConversations: 'No conversations yet'
    },
    ar: {
      title: 'الرسائل',
      subtitle: 'عرض وإدارة جميع رسائل المنصة',
      stats: {
        total: 'إجمالي المحادثات',
        active: 'نشطة',
        archived: 'مؤرشفة',
        flagged: 'مflagged'
      },
      filters: {
        all: 'جميع المحادثات',
        active: 'نشطة',
        archived: 'مؤرشفة',
        flagged: 'مflagged'
      },
      table: {
        participants: 'المشاركون',
        lastMessage: 'آخر رسالة',
        date: 'التاريخ',
        status: 'الحالة',
        actions: 'الإجراءات',
        noResults: 'لا توجد محادثات',
        searchPlaceholder: 'ابحث عن محادثات...'
      },
      actions: {
        view: 'عرض المحادثة',
        archive: 'أرشف',
        unarchive: 'إلغاء الأرشفة',
        flag: 'علم',
        refresh: 'تحديث'
      },
      status: {
        active: 'نشطة',
        archived: 'مؤرشفة',
        flagged: 'مflagged'
      },
      modal: {
        title: 'المحادثة',
        participants: 'المشاركون',
        messages: 'الرسائل',
        typeMessage: 'اكتب رسالة...',
        send: 'إرسال',
        close: 'إغلاق',
        noMessages: 'لا توجد رسائل بعد',
        from: 'من',
        to: 'إلى',
        date: 'التاريخ'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الرسائل...',
      noConversations: 'لا توجد محادثات حتى الآن'
    }
  };

  const t = translations[language] || translations.en;

  // ============================================================
  // loadConversations
  // ============================================================
  const loadConversations = () => {
    setLoading(true);
    
    try {
      // Load from chat_messages
      const chatMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
      
      // Group messages by conversation
      const conversationMap = new Map();
      
      chatMessages.forEach(msg => {
        const conversationId = msg.conversationId || 
          [msg.senderId, msg.receiverId].sort().join('_');
        
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: conversationId,
            messages: [],
            participants: [],
            lastMessage: null,
            lastMessageDate: null,
            status: 'active'
          });
        }
        
        const conversation = conversationMap.get(conversationId);
        conversation.messages.push(msg);
        
        if (!conversation.participants.find(p => p.id === msg.senderId)) {
          conversation.participants.push({
            id: msg.senderId,
            name: msg.senderName || 'User',
            email: msg.senderEmail || '',
            role: msg.senderRole || 'USER'
          });
        }
        if (!conversation.participants.find(p => p.id === msg.receiverId)) {
          conversation.participants.push({
            id: msg.receiverId,
            name: msg.receiverName || 'User',
            email: msg.receiverEmail || '',
            role: msg.receiverRole || 'USER'
          });
        }
        
        if (!conversation.lastMessageDate || new Date(msg.timestamp) > new Date(conversation.lastMessageDate)) {
          conversation.lastMessage = msg.text || msg.content || 'Media message';
          conversation.lastMessageDate = msg.timestamp || msg.createdAt;
        }
      });
      
      // Convert to array and sort
      const conversationsArray = Array.from(conversationMap.values());
      conversationsArray.sort((a, b) => {
        const dateA = new Date(a.lastMessageDate || 0);
        const dateB = new Date(b.lastMessageDate || 0);
        return dateB - dateA;
      });
      
      console.log(`📨 Loaded ${conversationsArray.length} conversations`);
      
      setConversations(conversationsArray);
      setFilteredConversations(conversationsArray);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
      setFilteredConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // useEffects
  // ============================================================
  // Use authStore as single source of truth
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

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

    setUser(authUser);
    loadConversations();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Filter conversations
  useEffect(() => {
    let filtered = conversations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.participants.some(p => 
          p.name?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower)
        ) ||
        c.lastMessage?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredConversations(filtered);
  }, [conversations, statusFilter, searchTerm]);

  // ============================================================
  // UI Helpers
  // ============================================================
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    loadConversations();
  };

  const handleViewChat = (conversation) => {
    setSelectedConversation(conversation);
    setShowChatModal(true);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setSendingMessage(true);
    
    try {
      const message = {
        id: 'msg_' + Date.now(),
        conversationId: selectedConversation.id,
        senderId: user?.id,
        senderName: user?.fullName || 'Admin',
        senderEmail: user?.email || '',
        senderRole: 'ADMIN',
        receiverId: selectedConversation.participants[0]?.id,
        receiverName: selectedConversation.participants[0]?.name,
        receiverEmail: selectedConversation.participants[0]?.email,
        receiverRole: selectedConversation.participants[0]?.role,
        text: newMessage,
        content: newMessage,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        read: false
      };
      
      // Save to chat_messages
      const chatMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
      chatMessages.push(message);
      localStorage.setItem('chat_messages', JSON.stringify(chatMessages));
      
      // Update conversation
      const updatedConversation = {
        ...selectedConversation,
        lastMessage: newMessage,
        lastMessageDate: new Date().toISOString()
      };
      
      setSelectedConversation(updatedConversation);
      setNewMessage('');
      
      // Reload conversations
      loadConversations();
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      archived: 'bg-gray-500/20 text-gray-400 dark:text-gray-500',
      flagged: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    archived: conversations.filter(c => c.status === 'archived').length,
    flagged: conversations.filter(c => c.status === 'flagged').length
  };

  if (!user) {
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
        language={language}
        onToggleLanguage={toggleLanguage}
        notificationUserId={user?.id || user?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">{t.title}</h1>
            <p className="text-black/70 mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.total}</p>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageCircle size={20} className="text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.active}</p>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.archived}</p>
              <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <Archive size={20} className="text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.archived}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.flagged}</p>
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.flagged}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t.table.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
              >
                <option value="all">{t.filters.all}</option>
                <option value="active">{t.filters.active}</option>
                <option value="archived">{t.filters.archived}</option>
                <option value="flagged">{t.filters.flagged}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Showing <span className="font-semibold text-white">{filteredConversations.length}</span> conversations
          </p>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t.noConversations}</h3>
            <p className="text-gray-400 dark:text-gray-500">Conversations will appear here</p>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a0a0a] border-b border-yellow-500/20">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Participants</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Last Message</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10">
                  {filteredConversations.map((conversation) => (
                    <tr key={conversation.id} className="hover:bg-yellow-500/5 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <MessageCircle size={16} className="text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">
                              {conversation.participants.map(p => p.name).join(', ')}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {conversation.participants.map(p => p.role).join(', ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                        {conversation.lastMessage}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                        {formatDate(conversation.lastMessageDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleViewChat(conversation)}
                            className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition flex items-center gap-1"
                          >
                            <Eye size={12} />
                            {t.actions.view}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChatModal && selectedConversation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-yellow-500/20 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <div>
                <h2 className="text-xl font-semibold text-white">{t.modal.title}</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {selectedConversation.participants.map(p => p.name).join(', ')}
                </p>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors text-gray-400 dark:text-gray-500 hover:text-yellow-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.senderId === user?.id || msg.senderId === user?.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      msg.senderId === user?.id || msg.senderId === user?.email
                        ? 'bg-yellow-500 text-black'
                        : 'bg-[#0a0a0a] text-white border border-yellow-500/20'
                    }`}>
                      <p className="text-sm">{msg.text || msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.senderId === user?.id || msg.senderId === user?.email
                          ? 'text-black/70'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {formatDate(msg.timestamp || msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 dark:text-gray-500">{t.modal.noMessages}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-yellow-500/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.modal.typeMessage}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-6 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={16} />
                  {t.modal.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminMessages;