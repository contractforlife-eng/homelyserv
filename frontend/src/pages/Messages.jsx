import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Send, Paperclip, Phone, Video, MoreVertical, 
  Check, CheckCheck, Clock, User, Users, ArrowLeft,
  Smile, Image, File, Mic, Camera
} from 'lucide-react';

function Messages() {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');

  const chats = [
    {
      id: 1,
      name: 'Sara Mohamed',
      lastMessage: 'When can you start working?',
      time: '2:30 PM',
      unread: 2,
      online: true,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face',
      messages: [
        { id: 1, sender: 'them', text: 'Hi Ahmed, we are interested in hiring you.', time: '2:15 PM' },
        { id: 2, sender: 'me', text: 'Hello Sara! I am available to start next week.', time: '2:20 PM' },
        { id: 3, sender: 'them', text: 'When can you start working?', time: '2:30 PM' }
      ]
    },
    {
      id: 2,
      name: 'Khaled Mostafa',
      lastMessage: 'I have sent you the offer details',
      time: 'Yesterday',
      unread: 0,
      online: false,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      messages: [
        { id: 1, sender: 'them', text: 'Thank you for applying.', time: 'Yesterday' },
        { id: 2, sender: 'me', text: 'I am very interested in the position.', time: 'Yesterday' },
        { id: 3, sender: 'them', text: 'I have sent you the offer details', time: 'Yesterday' }
      ]
    },
    {
      id: 3,
      name: 'Nadia Ibrahim',
      lastMessage: 'Can we schedule an interview?',
      time: '2 days ago',
      unread: 0,
      online: true,
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=50&h=50&fit=crop&crop=face',
      messages: [
        { id: 1, sender: 'them', text: 'Hello! I saw your application.', time: '2 days ago' },
        { id: 2, sender: 'me', text: 'Hi Nadia, thank you for reaching out.', time: '2 days ago' },
        { id: 3, sender: 'them', text: 'Can we schedule an interview?', time: '2 days ago' }
      ]
    }
  ];

  const handleSend = () => {
    if (message.trim()) {
      // In real app, send message to backend
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 min-h-screen flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">
              ← Back
            </Link>
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          </div>
          <div className="relative mt-3">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                selectedChat?.id === chat.id ? 'bg-red-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={chat.image} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
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
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{chat.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <img src={selectedChat.image} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-gray-800">{selectedChat.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedChat.online ? '🟢 Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition"><Phone size={18} className="text-gray-600" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition"><Video size={18} className="text-gray-600" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition"><MoreVertical size={18} className="text-gray-600" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {selectedChat.messages.map((msg) => (
                <div key={msg.id} className={`mb-4 flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl ${
                    msg.sender === 'me' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-red-200' : 'text-gray-400'}`}>
                      {msg.time}
                    </p>
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
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Users size={64} className="text-gray-300 mx-auto mb-4" />
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