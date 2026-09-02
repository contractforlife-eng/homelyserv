// src/pages/WorkerMessages.jsx - WITH WORKING NOTIFICATIONS AND FIXED TOGGLES
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { UserAvatar, UserDisplayName } from '../components/users';
import ReportModal from '../components/messages/ReportModal';
import complaintService from '../services/complaintService';
import {
  User,
  X,
  AlertTriangle,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Clock,
  CreditCard,
  Shield,
  RefreshCw,
  Crown,
  Trash2,
  Mail,
  User as UserIcon,
  Bell,
  ChevronLeft
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationId,
  ensureConversationExists,
  deleteConversation,
  getBlockStatus,
  blockUser,
  unblockUser,
  formatDisplayName,
  getSupportUsers,
  createOptimisticMessage,
  reconcileOptimisticMessage,
  markOptimisticMessageFailed
} from '../utils/chatService';
import { onSocketEvent, getSocket } from '../utils/socket';
import api from '../utils/api';
import usePresence from '../hooks/usePresence';

// Main WorkerMessages Component - RED THEME WITH WORKING NOTIFICATIONS
const WorkerMessages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [supportUsers, setSupportUsers] = useState([]);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [blockStatus, setBlockStatus] = useState({ blockedByMe: false, blockedMe: false });
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const dropdownRef = useRef(null);
  const refreshEffectReadyRef = useRef(false);
  const selectedConversationIdRef = useRef(null);
  const conversationSelectionSeqRef = useRef(0);
  const employerAutoOpenInFlightRef = useRef(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);
  const autoOpenDoneRef = useRef(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingStartTimerRef = useRef(null);
  const typingStaleTimerRef = useRef(null);
  const typingStartEmittedRef = useRef(false);
  const typingContextRef = useRef(null);
  const authUserIdRef = useRef(authUser?.id);

  // Real-time presence for counterpart users (additive; does not touch chat logic)
  const counterpartUserIds = conversations.map((c) => c.otherUserId).filter(Boolean);
  const presence = usePresence(counterpartUserIds, authUser?.id);

  // Keep authUserIdRef in sync with the latest authUser id
  useEffect(() => {
    authUserIdRef.current = authUser?.id;
  });

  // ============================================================
  // IS PREMIUM CHECK
  // ============================================================

  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  const resolveMessagePremium = (msg) => {
    if (typeof msg?.senderIsPremium === 'boolean') return msg.senderIsPremium;
    if (typeof msg?.sender?.isPremium === 'boolean') return msg.sender.isPremium;

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);
    const senderId = msg?.senderId == null ? null : String(msg.senderId);

    if (senderId && String(selectedConversation?.otherUserId) === senderId) {
      return typeof selectedConversation?.isPremium === 'boolean'
        ? selectedConversation.isPremium
        : undefined;
    }

    if (senderId && String(authUser?.id) === senderId) {
      return typeof authUser?.isPremium === 'boolean' ? authUser.isPremium : userIsPremium;
    }

    return undefined;
  };

  const formatSenderName = (senderName, senderRole) => {
    return formatDisplayName(senderName, senderRole);
  };

  // Auth check and loading
  useEffect(() => {
     if (authLoading) return;

     if (!isAuthenticated || !authUser) {
       return;
     }

     if (authUser.role !== 'WORKER') {
       return;
     }

      const userId = authUser.id;

      const loadInitialData = async () => {
        if (!userId) {
          return;
        }

        const userConversations = await getUserConversations(userId);
        console.log('📋 Initial load - worker conversations:', userConversations);
        setConversations(userConversations);
        setConversationsLoaded(true);
      };

      loadInitialData();
    }, [authUser, isAuthenticated, authLoading]);

   // ============================================================
   // AUTO-OPEN CONVERSATION FROM PUSH NOTIFICATION
   // ============================================================
   useEffect(() => {
     if (!authUser || !conversationsLoaded || autoOpenDoneRef.current) return;

     const stateConvId = location.state?.conversationId;
     const stateEmployerId = location.state?.employerId;
     if (!stateConvId && !stateEmployerId) return;

     autoOpenDoneRef.current = true;

     const target = conversations.find(c => String(c.id) === String(stateConvId));
     if (target) {
       console.log('✅ Auto-opening existing conversation:', target.id);
       selectConversation(target.id);
     }
     if (!stateConvId) {
       const employerId = String(stateEmployerId).trim();
       if (!employerId || employerAutoOpenInFlightRef.current === employerId) return;
       employerAutoOpenInFlightRef.current = employerId;

       let active = true;
       const openEmployerConversation = async () => {
         const existing = conversations.find(
           conversation => String(conversation.otherUserId) === employerId
         );

         if (existing) {
           console.log('Auto-opening existing employer conversation:', existing.id);
           if (active) selectConversation(existing.id);
           return;
         }

         try {
           const conversationId = await ensureConversationExists(
             authUser.id,
             authUser.fullName || authUser.name || 'Worker',
             authUser.role,
             employerId,
             'Employer',
             'EMPLOYER'
           );

           const updatedConversations = await getUserConversations(authUser.id);
           if (!active) return;

           setConversations(updatedConversations);
           const ensured = updatedConversations.find(
             conversation => String(conversation.id) === String(conversationId)
           ) || updatedConversations.find(
             conversation => String(conversation.otherUserId) === employerId
           );

           if (ensured) {
             console.log('Auto-opening ensured employer conversation:', ensured.id);
             selectConversation(ensured.id);
           }
         } catch (error) {
           // The existing server authorization/error UX remains authoritative.
           console.error('Error opening employer conversation from offer:', error);
         }
       };

       openEmployerConversation();
       return () => {
         active = false;
       };
     }
   }, [authUser, conversationsLoaded, location.state?.conversationId, location.state?.employerId]);

   // Refresh conversations when refreshKey changes
  useEffect(() => {
    if (!refreshEffectReadyRef.current) {
      refreshEffectReadyRef.current = true;
      return;
    }
    if (!authUser) return;
    
    const userId = authUser.id;
    if (!userId) return;
    
    (async () => {
      const userConversations = await getUserConversations(userId);
      console.log('🔄 Refresh load - worker conversations:', userConversations);
      setConversations(userConversations);
    })();
  }, [authUser, refreshKey]);

  // ============================================================
  // AUTO-REFRESH FROM SERVER
  // ============================================================
  useEffect(() => {
    if (!authUser) return;
    const userId = authUser.id;
    if (!userId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const pollSelectionSeq = conversationSelectionSeqRef.current;
    intervalRef.current = setInterval(async () => {
      const updatedConversations = await getUserConversations(userId);
      setConversations(prevConversations => {
        if (JSON.stringify(prevConversations) !== JSON.stringify(updatedConversations)) {
          console.log('🔄 Auto-refresh: Worker conversations updated');
          return updatedConversations;
        }
        return prevConversations;
      });

      if (selectedConversationId) {
        const updatedMessages = await getConversationMessages(selectedConversationId);
        if (
          selectedConversationIdRef.current !== selectedConversationId
          || pollSelectionSeq !== conversationSelectionSeqRef.current
        ) return;
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
            console.log('🔄 Auto-refresh: Worker messages updated for conversation:', selectedConversationId);
            markMessagesAsRead(selectedConversationId, userId);
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [authUser, selectedConversationId]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || !selectedConversationId) return;

    const unsubscribe = onSocketEvent(userId, 'message:new', (payload) => {
      if (String(payload.conversationId) !== String(selectedConversationId)) return;
      setMessages(prev => {
        if (prev.some(msg => String(msg.id) === String(payload.id))) return prev;
        return [...prev, payload];
      });
    });

    return unsubscribe;
  }, [authUser?.id, selectedConversationId]);

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId || !selectedConversationId) return;

    const unsubscribe = onSocketEvent(userId, 'typing:update', (payload) => {
      if (String(payload.conversationId) !== String(selectedConversationId)) return;
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
  }, [authUser?.id, selectedConversationId]);

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
  }, [selectedConversationId]);

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

  const loadMessagesForConversation = async (conversationId, selectionSeq = conversationSelectionSeqRef.current) => {
    const isCurrentSelection = () => (
      selectedConversationIdRef.current === conversationId
      && conversationSelectionSeqRef.current === selectionSeq
    );

    console.log('📨 Loading messages for conversation:', conversationId);
    let conversationMessages;
    try {
      conversationMessages = await getConversationMessages(conversationId);
    } catch (error) {
      if (isCurrentSelection()) setMessagesLoading(false);
      throw error;
    }
    console.log('📋 Messages found:', conversationMessages);
    if (isCurrentSelection()) {
      setMessages(conversationMessages);
      setMessagesLoading(false);
    }
    
    const userId = authUser?.id;
    if (userId) {
      try {
        const marked = await markMessagesAsRead(conversationId, userId);
        if (marked) {
          setConversations(prevConversations => prevConversations.map(conversation =>
            conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation
          ));
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const selectConversation = (conversationId) => {
    const selectionSeq = conversationSelectionSeqRef.current + 1;
    conversationSelectionSeqRef.current = selectionSeq;
    selectedConversationIdRef.current = conversationId;
    setSelectedConversationId(conversationId);
    setMessages([]);
    setMessagesLoading(true);
    setOtherUserTyping(false);
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
    loadMessagesForConversation(conversationId, selectionSeq);
  };

  const handleMarkConversationAsRead = async () => {
    setDropdownOpen(false);
    if (!selectedConversationId || !authUser?.id) return;

    try {
      const marked = await markMessagesAsRead(selectedConversationId, authUser.id);
      if (marked) {
        setConversations(prevConversations => prevConversations.map(conversation =>
          conversation.id === selectedConversationId ? { ...conversation, unread: 0 } : conversation
        ));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleViewEmployerProfile = async () => {
    setDropdownOpen(false);
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);
    const employerId = selectedConversation?.otherUserId;
    if (!employerId || selectedConversation?.role !== 'EMPLOYER') return;

    try {
      const response = await api.get(`/api/employers/profile/${encodeURIComponent(employerId)}`);
      navigate(`/employer-profile-view/${encodeURIComponent(employerId)}`, {
        state: { employer: response.data?.user || null, from: 'messages' },
      });
    } catch (error) {
      console.error('Error loading employer profile:', error);
      const status = error?.response?.status;
      const message = status === 403
        ? t('messagesProfile.accessDenied')
        : status === 404
          ? t('messagesProfile.notFound')
          : t('messagesProfile.loadFailed');
      window.alert(message);
    }
  };

  useEffect(() => {
    let active = true;
    if (!selectedConversationId) {
      setBlockStatus({ blockedByMe: false, blockedMe: false });
      return undefined;
    }
    getBlockStatus(selectedConversationId)
      .then((status) => { if (active) setBlockStatus(status); })
      .catch((error) => {
        console.error('Error loading block status:', error);
        if (active) setBlockStatus({ blockedByMe: false, blockedMe: false });
      });
    return () => { active = false; };
  }, [selectedConversationId]);

  const handleToggleBlock = async () => {
    setDropdownOpen(false);
    if (!selectedConversationId) return;
    const isBlockedByMe = blockStatus.blockedByMe;
    const confirmed = window.confirm(t(isBlockedByMe ? 'messagesBlocking.unblockConfirmation' : 'messagesBlocking.confirmation'));
    if (!confirmed) return;
    try {
      const result = isBlockedByMe
        ? await unblockUser(selectedConversationId)
        : await blockUser(selectedConversationId);
      setBlockStatus({ blockedByMe: Boolean(result?.blockedByMe), blockedMe: Boolean(result?.blockedMe) });
      window.alert(t(isBlockedByMe ? 'messagesBlocking.unblockSuccess' : 'messagesBlocking.blockSuccess'));
    } catch (error) {
      console.error('Error updating block status:', error);
      window.alert(t('messagesBlocking.failed'));
    }
  };

  const openReportUser = () => {
    setDropdownOpen(false);
    const conversation = conversations.find(c => c.id === selectedConversationId);
    if (conversation?.role === 'EMPLOYER' && conversation.otherUserId) {
      setReportTarget({ type: 'user', reportedUserId: conversation.otherUserId });
    }
  };

  const openReportMessage = (msg) => {
    if (msg?.senderRole === 'EMPLOYER' && msg.id && selectedConversationId) {
      setReportTarget({ type: 'message', messageId: msg.id });
    }
  };

  const submitReport = async (data) => {
    const payload = { conversationId: selectedConversationId, ...data };
    if (reportTarget?.type === 'user') {
      await complaintService.reportUser({ ...payload, reportedUserId: reportTarget.reportedUserId });
    } else if (reportTarget?.type === 'message') {
      await complaintService.reportMessage({ ...payload, messageId: reportTarget.messageId });
    }
    setReportTarget(null);
    window.alert(t('messagesReporting.submitted'));
  };

  // Close dropdown when selected conversation changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [selectedConversationId]);

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

  // Load support users when modal opens
  useEffect(() => {
    if (showSupportModal) {
      getSupportUsers().then(users => {
        setSupportUsers(users);
      });
    }
  }, [showSupportModal]);

  const handleSelectConversation = (conversationId) => {
    console.log('📨 Selecting conversation:', conversationId);
    selectConversation(conversationId);
  };

  const getOtherUserId = () => {
    const c = conversations.find(c => c.id === selectedConversationId);
    return c?.otherUserId || null;
  };

  const emitTypingEvent = (isTyping) => {
    const recipientId = getOtherUserId();
    if (!recipientId || !selectedConversationId || !authUser?.id) return;
    if (blockStatus.blockedByMe || blockStatus.blockedMe) {
      typingContextRef.current = null;
      typingStartEmittedRef.current = false;
      return;
    }
    const socket = getSocket(authUser.id);
    if (!socket) return;
    if (isTyping) {
      typingContextRef.current = { conversationId: selectedConversationId, recipientId };
    } else {
      typingContextRef.current = null;
    }
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      conversationId: selectedConversationId,
      recipientId
    });
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);

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

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversationId || !authUser) {
      console.log('❌ Cannot send message: missing data');
      return;
    }

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) {
      console.log('❌ Conversation not found');
      return;
    }

    console.log('📤 [Worker] Sending message');
    console.log('  senderId:', authUser.id);
    console.log('  senderName:', authUser.fullName);
    console.log('  recipientId:', selectedConv.otherUserId);
    console.log('  recipientName:', selectedConv.otherUserName);
    console.log('  conversationId:', selectedConversationId);
    console.log('  text:', message);

    const draft = message.trim();
    const optimistic = createOptimisticMessage({
      conversationId: selectedConversationId,
      senderId: authUser.id,
      senderName: authUser.fullName || 'Worker',
      senderRole: 'WORKER',
      recipientId: selectedConv.otherUserId,
      recipientName: selectedConv.otherUserName,
      text: draft,
    });
    setMessages((current) => [
      ...current.filter((item) => !(item.sendFailed && item.senderId === String(authUser.id) && item.text === draft)),
      optimistic,
    ]);
    setMessage('');
    if (typingStartTimerRef.current) clearTimeout(typingStartTimerRef.current);
    typingStartEmittedRef.current = false;
    emitTypingEvent(false);

    let result = null;
    let sendError = null;
    try {
      result = await sendMessage(
        authUser.id,
        authUser.fullName || 'Worker',
        'WORKER',
        selectedConv.otherUserId,
        selectedConv.otherUserName,
        draft
      );
    } catch (error) {
      sendError = error;
      console.error('Failed to send message:', error);
    }

    console.log('📥 [Worker] sendMessage response:', result);

    if (result) {
      console.log('✅ Message sent successfully, reloading messages...');
      setMessages((current) => reconcileOptimisticMessage(current, optimistic.id, result));
      setRefreshKey(prev => prev + 1);
    } else {
      const blocked = sendError?.response?.data?.code === 'CHAT_BLOCKED';
      if (blocked) {
        setMessages((current) => current.filter((item) => item.id !== optimistic.id));
        getBlockStatus(selectedConversationId).then(setBlockStatus).catch(() => {});
        window.alert(t('messagesBlocking.sendBlocked'));
      } else {
        setMessages((current) => markOptimisticMessageFailed(current, optimistic.id));
      }
      setMessage((current) => current || draft);
      console.log('❌ Failed to send message');
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
    
    setIsRefreshing(false);
  };

  const userProfileImage = authUser?.profileImage || null;

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t('workerMessages.title')}
        notificationUserId={authUser?.id}
        isPremium={userIsPremium}
      />

      <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
                      alt={authUser.fullName || t('workerMessages.worker')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-white m-3" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{t('workerMessages.title')}</h1>
                    {userIsPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                        <Crown size={12} className="text-yellow-300" />
                        {t('workerMessages.premiumBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 mt-1">{t('workerMessages.subtitle')}</p>
                </div>
              </div>
                <div className="flex items-center gap-2">
                <span className="text-sm text-white/90">
                  {authUser?.fullName || t('workerMessages.worker')}
                </span>
                <span className="px-2 py-1 bg-green-500/30 text-white text-xs rounded-full">
                  {t('workerMessages.chatCount', { count: conversations.length })}
                </span>
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="bg-purple-500/30 hover:bg-purple-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 backdrop-blur-sm border border-purple-400/30"
                >
                  <Shield size={12} />
                  {t('workerMessages.contactSupport')}
                </button>
                {!userIsPremium && (
                  <Link
                    to="/subscription"
                    className="bg-yellow-500/30 hover:bg-yellow-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 backdrop-blur-sm border border-yellow-400/30"
                  >
                    <Crown size={12} />
                    {t('workerMessages.getPremium')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              <div className={`border-r border-gray-200 dark:border-gray-700 ${selectedConversationId ? 'hidden md:block' : ''}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder={t('workerMessages.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto h-[calc(600px-73px)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerMessages.noConversations')}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t('workerMessages.noConversationsDesc')}</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:bg-gray-900 transition border-b border-gray-100 dark:border-gray-700 ${
                          selectedConversationId === conv.id ? 'bg-red-50 dark:bg-red-900/30' : ''
                        }`}
                      >
                        <UserAvatar
                          name={conv.otherUserName}
                          image={conv.avatar || null}
                          role={conv.role}
                          size="md"
                          className="border-2 border-red-200"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-start">
                            <div className="truncate">
                              <UserDisplayName
                                name={conv.otherUserName}
                                role={conv.role}
                                isPremium={conv.isPremium}
                                size="sm"
                                className="text-gray-800 dark:text-white"
                              />
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{conv.time}</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 truncate">{conv.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {presence[String(conv.otherUserId)] === true ? (
                              <span className="text-xs text-green-500">{t('workerMessages.online')}</span>
                            ) : (
                              <span className="text-xs text-gray-400">{t('workerMessages.offline')}</span>
                            )}
                            {conv.unread > 0 && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
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

              <div className={`md:col-span-2 flex flex-col h-[600px] ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversationId ? (
                  <>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedConversationId(null)}
                          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                        >
                          <ChevronLeft size={18} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <UserAvatar
                          name={conversations.find(c => c.id === selectedConversationId)?.otherUserName || t('workerMessages.employer')}
                          image={conversations.find(c => c.id === selectedConversationId)?.avatar || null}
                          role={conversations.find(c => c.id === selectedConversationId)?.role}
                          size="md"
                          className="border-2 border-red-200"
                        />
                        <div>
                          <UserDisplayName
                            name={conversations.find(c => c.id === selectedConversationId)?.otherUserName}
                            role={conversations.find(c => c.id === selectedConversationId)?.role}
                            isPremium={conversations.find(c => c.id === selectedConversationId)?.isPremium}
                            size="sm"
                            className="text-gray-800 dark:text-white"
                          />
                          {presence[String(selectedConversation?.otherUserId)] === true ? (
                      <p className="text-xs text-green-500">{t('workerMessages.online')}</p>
                    ) : (
                      <p className="text-xs text-gray-400">{t('workerMessages.offline')}</p>
                    )}
                          {otherUserTyping && (
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">{t('typingIndicator')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 relative" ref={dropdownRef}>
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition">
                          <Phone size={18} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition">
                          <Video size={18} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition"
                        >
                          <MoreVertical size={18} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        {dropdownOpen && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                            <button
                              onClick={async () => {
                                setDropdownOpen(false);
                                if (selectedConversationId) {
                                  const success = await deleteConversation(selectedConversationId);
                                  if (success) {
                                    console.log('🗑️ Deleted conversation:', selectedConversationId);
                                    const userId = authUser?.id || authUser?.email;
                                    if (userId) {
                                      const updated = await getUserConversations(userId);
                                      setConversations(updated);
                                    }
                                    setSelectedConversationId(null);
                                    setMessages([]);
                                  }
                                }
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:bg-red-900/30 flex items-center gap-2 transition"
                            >
                              <Trash2 size={16} />
                              {t('workerMessages.deleteConversation')}
                            </button>
                            <button
                              onClick={handleMarkConversationAsRead}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Mail size={16} />
                              {t('workerMessages.markAsRead')}
                            </button>
                            <button
                              onClick={handleViewEmployerProfile}
                              disabled={conversations.find(c => c.id === selectedConversationId)?.role !== 'EMPLOYER'}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <UserIcon size={16} />
                              {t('workerMessages.viewEmployerProfile')}
                            </button>
                            <button
                              onClick={openReportUser}
                              disabled={conversations.find(c => c.id === selectedConversationId)?.role !== 'EMPLOYER'}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <AlertTriangle size={16} />
                              {t('messagesReporting.reportUser')}
                            </button>
                            <button
                              onClick={handleToggleBlock}
                              disabled={conversations.find(c => c.id === selectedConversationId)?.role !== 'EMPLOYER'}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <Shield size={16} />
                              {t(blockStatus.blockedByMe ? 'messagesBlocking.unblockUser' : 'messagesBlocking.blockUser')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/20">
                      {messagesLoading && messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
                          <RefreshCw size={28} className="animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                          <p>{t('workerMessages.noMessages')}</p>
                          <p className="text-sm">{t('workerMessages.startConversation')}</p>
                        </div>
                      ) : (
                        messages.map((msg, index) => {
                          const isWorker = msg.senderRole === 'WORKER';
                          const showAvatar = index === 0 || 
                            (index > 0 && messages[index - 1]?.senderRole !== msg.senderRole);
                          
                          return (
                            <div
                              key={msg.id || index}
                              className={`flex ${isWorker ? 'justify-end' : 'justify-start'} items-end gap-2`}
                            >
                              {!isWorker && showAvatar && (
                                <UserAvatar
                                  name={msg.senderName || t('workerMessages.user')}
                                  image={msg.sender?.image || msg.sender?.profileImage || conversations.find(c => c.id === selectedConversationId)?.avatar || null}
                                  role={msg.senderRole}
                                  size="sm"
                                  className="border border-gray-200 dark:border-gray-700"
                                />
                              )}
                              {!isWorker && !showAvatar && (
                                <div className="w-8 flex-shrink-0"></div>
                              )}
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  isWorker
                                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                                }`}
                              >
                                {!isWorker && (
                                  <div className="mb-1">
                                    <UserDisplayName
                                      name={msg.senderName}
                                      role={msg.senderRole}
                                      isPremium={resolveMessagePremium(msg)}
                                      size="sm"
                                      className="text-red-600"
                                    />
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                                  isWorker ? 'text-red-200' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {msg.time}
                                  {msg.sendFailed && (
                                    <AlertTriangle size={13} className="text-red-500" title={t('adminMessagesPage.errors.send')} />
                                  )}
                                  {isWorker && (
                                    <CheckCheck size={14} className={msg.read ? 'text-green-300' : 'text-red-200'} />
                                  )}
                                </p>
                                {!isWorker && msg.id && (
                                  <button
                                    type="button"
                                    onClick={() => openReportMessage(msg)}
                                    className="mt-2 text-[11px] text-gray-400 hover:text-red-500"
                                  >
                                    {t('messagesReporting.reportMessage')}
                                  </button>
                                )}
                              </div>
                              {isWorker && showAvatar && (
                                <UserAvatar
                                  name={authUser?.fullName || t('workerMessages.worker')}
                                  image={authUser?.profileImage || null}
                                  role="WORKER"
                                  size="sm"
                                  className="border-2 border-red-200"
                                />
                              )}
                              {isWorker && !showAvatar && (
                                <div className="w-8 flex-shrink-0"></div>
                              )}
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {blockStatus.blockedByMe || blockStatus.blockedMe ? (
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {t(blockStatus.blockedByMe ? 'messagesBlocking.blockedByMeNotice' : 'messagesBlocking.blockedNotice')}
                        </p>
                      ) : <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={message}
                          onChange={handleMessageChange}
                          placeholder={t('workerMessages.typeMessage')}
                          className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                          disabled={!message.trim()}
                        >
                          <Send size={18} />
                          {t('workerMessages.send')}
                        </button>
                      </form>}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('workerMessages.selectConversation')}</h3>
                      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerMessages.selectConversationDesc')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Report and Support Modals */}
          {reportTarget && (
            <ReportModal
              t={t}
              title={reportTarget.type === 'user' ? t('messagesReporting.reportUser') : t('messagesReporting.reportMessage')}
              note={t('messagesReporting.safetyNote')}
              onClose={() => setReportTarget(null)}
              onSubmit={submitReport}
              accentClass="text-red-600"
              buttonClass="bg-red-600 hover:bg-red-700"
            />
          )}
          {showSupportModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t('workerMessages.contactSupport')}</h3>
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('workerMessages.selectSupportAgent')}</p>
                <div className="space-y-2">
                  {supportUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={async () => {
                        setShowSupportModal(false);
                        const conversationId = await ensureConversationExists(
                          authUser.id,
                          authUser.fullName,
                          authUser.role,
                          user.id,
                          user.fullName,
                          user.role
                        );
                        selectConversation(conversationId);
                      }}
                      className="w-full p-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
                    >
                      <UserAvatar
                        name={user.fullName}
                        image={user.profileImage || user.image || null}
                        role={user.role}
                        size="md"
                        className="border-2 border-purple-300"
                      />
                      <div className="text-left">
                        <UserDisplayName
                          user={user}
                          size="sm"
                          className="text-gray-800 dark:text-white"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
</div>
    </DashboardLayout>
  );
};

export default WorkerMessages;
