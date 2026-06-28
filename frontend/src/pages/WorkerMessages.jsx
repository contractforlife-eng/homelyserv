import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Briefcase, User, AlertCircle, MessageCircle, 
  Settings, LogOut, Search, Send, Phone, Mail,
  Clock, CheckCircle, XCircle, ArrowLeft, Reply
} from 'lucide-react';

function WorkerMessages() {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(null);

  const chats = [
    {
      id: 1,
      name: 'Admin Support',
      messages: [
        { sender: 'admin', text: 'Your complaint has been received and is being reviewed.', time: '2:30 PM' },
        { sender: 'me', text: 'Thank you for the update.', time: '2:35 PM' },
      ],
      unread: 0
    },
    {
      id: 2,
      name: 'Sara Mohamed',
      messages: [
        { sender: 'employer', text: 'When can you start working?', time: '2:00 PM' },
        { sender: 'me', text: 'I can start next week.', time: '2:15 PM' },
      ],
      unread: 1
    }
  ];

  const handleSend = () => {
    if (message.trim()) {
      alert('Message sent!');
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Worker Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              {userData.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{userData.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">Worker</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/worker-dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/worker-offers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Offers
          </Link>
          <Link to="/worker-profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/worker-complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <AlertCircle size={20} /> Complaints
          </Link>
          <Link to="/worker-messages" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/worker-settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Messages</h2>
              <p className="text-gray-500 text-sm">View and reply to messages</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chat List */}
            <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[600px]">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                      activeChat?.id === chat.id ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">{chat.name}</p>
                      {chat.unread > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{chat.unread}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.messages[chat.messages.length - 1].text}
                    </p>
                    <p className="text-xs text-gray-400">{chat.messages[chat.messages.length - 1].time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
              {activeChat ? (
                <div className="flex flex-col h-[600px]">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                      {activeChat.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{activeChat.name}</p>
                      <p className="text-xs text-gray-500">Online</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {activeChat.messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.sender === 'me'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-red-200' : 'text-gray-400'}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      />
                      <button
                        onClick={handleSend}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] text-gray-400">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerMessages;