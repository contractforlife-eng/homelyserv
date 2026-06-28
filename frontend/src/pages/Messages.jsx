import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Search, Send, Paperclip, Phone, Video, 
  MoreVertical, User, ArrowLeft, Check, CheckCheck, 
  Clock, Smile, Image, File, Mic, Camera, Trash2,
  Reply, Star, Flag, UserPlus, Bell, Settings
} from 'lucide-react';

function Messages() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  // Sample chat data
  const chats = [
    {
      id: 1,
      name: 'Admin Support',
      lastMessage: 'Your complaint has been received and is being reviewed.',
      time: '2:30 PM',
      unread: 2,
      online: true,
      type: 'admin',
      messages: [
        { id: 1, sender: 'admin', text: 'Hello Ahmed, how can we help you today?', time: '2:00 PM' },
        { id: 2, sender: 'me', text: 'I have a complaint about an employer.', time: '2:10 PM' },
        { id: 3, sender: 'admin', text: 'Your complaint has been received and is being reviewed.', time: '2:30 PM' }
      ]
    },
    {
      id: 2,
      name: 'Sara Mohamed',
      lastMessage: 'When can you start working?',
      time: 'Yesterday',
      unread: 0,
      online: true,
      type: 'employer',
      messages: [
        { id: 1, sender: 'them', text: 'Hi Ahmed, we are interested in hiring you.', time: 'Yesterday' },
        { id: 2, sender: 'me', text: 'Hello Sara! I am available to start next week.', time: 'Yesterday' },
        { id: 3, sender: 'them', text: 'When can you start working?', time: 'Yesterday' }
      ]
    },
    {
      id: 3,
      name: 'Khaled Mostafa',
      lastMessage: 'I have sent you the offer details',
      time: '2 days ago',
      unread: 0,
      online: false,
      type: 'employer',
      messages: [
        { id: 1, sender: 'them', text: 'Thank you for applying.', time: '2 days ago' },
        { id: 2, sender: 'me', text: 'I am very interested in the position.', time: '2 days ago' },
        { id: 3, sender: 'them', text: 'I have sent you the offer details', time: '2 days ago' }
      ]
    },
    {
      id: 4,
      name: 'Nadia Ibrahim',
      lastMessage: 'Can we schedule an interview?',
      time: '3 days ago',
      unread: 0,
      online: true,
      type: 'employer',
      messages: [
        { id: 1, sender: 'them', text: 'Hello! I saw your application.', time: '3 days ago' },
        { id: 2, sender: 'me', text: 'Hi Nadia, thank you for reaching out.', time: '3 days ago' },
        { id: 3, sender: 'them', text: 'Can we schedule an interview?', time: '3 days ago' }
      ]
    }
  ];

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = () => {
    if (message.trim()) {
      // In production, send to backend
      setMessage('');
    }
  };

  const getSenderName = (sender) => {
    switch(sender) {
      case 'me': return 'You';
      case 'admin': return 'Admin Support';
      case 'them': return selectedChat?.name || 'Them';
      default: return sender;
    }
  };

  const getSenderColor = (sender) => {
    switch(sender) {
      case 'me': return 'bg-red-600 text-white';
      case 'admin': return 'bg-blue-600 text-white';
      default: return 'bg-white border border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">
                <ArrowLeft size={20} />
              </Link>
              <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            </div>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <Bell size={18} className="text-gray-500" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <Settings size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No conversations found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                  selectedChat?.id === chat.id ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      chat.type === 'admin' ? 'bg-blue-600' : 'bg-red-600'
                    }`}>
                      {chat.name.charAt(0)}
                    </div>
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-800 truncate">{chat.name}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{chat.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <span className="bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  selectedChat.type === 'admin' ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  {selectedChat.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selectedChat.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">
                      {selectedChat.online ? '🟢 Online' : '⚫ Offline'}
                    </p>
                    {selectedChat.type === 'admin' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition"><Phone size={18} className="text-gray-600" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition"><Video size={18} className="text-gray-600" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition"><MoreVertical size={18} className="text-gray-600" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {selectedChat.messages.map((msg) => (
                <div key={msg.id} className={`mb-4 flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div>
                    <div className={`max-w-md p-3 rounded-xl ${getSenderColor(msg.sender)}`}>
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'me' ? 'text-red-200' : 
                        msg.sender === 'admin' ? 'text-blue-200' :
                        'text-gray-400'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                    {msg.sender === 'me' && (
                      <div className="flex justify-end mt-1">
                        <CheckCheck size={14} className="text-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Paperclip size={20} className="text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Smile size={20} className="text-gray-500" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Press Enter to send</span>
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">Select a conversation</h3>
              <p className="text-gray-400 text-sm mt-2">Choose a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;