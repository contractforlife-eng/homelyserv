import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Send, Paperclip, Phone, Video, MoreVertical, User, ArrowLeft } from 'lucide-react';

function Messages() {
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
    },
    {
      id: 2,
      name: 'Khaled Mostafa',
      lastMessage: 'I have sent you the offer details',
      time: 'Yesterday',
      unread: 0,
      online: false,
    },
    {
      id: 3,
      name: 'Nadia Ibrahim',
      lastMessage: 'Can we schedule an interview?',
      time: '2 days ago',
      unread: 0,
      online: true,
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Chat List */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 min-h-screen flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link to="/worker-dashboard" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          </div>
          <div className="relative mt-3">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
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
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  {selectedChat.name.charAt(0)}
                </div>
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
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="flex justify-start mb-4">
                <div className="max-w-[70%] p-3 rounded-xl bg-white border border-gray-200 text-gray-800">
                  <p>Hi Ahmed, we are interested in hiring you.</p>
                  <p className="text-xs text-gray-400 mt-1">2:15 PM</p>
                </div>
              </div>
              <div className="flex justify-end mb-4">
                <div className="max-w-[70%] p-3 rounded-xl bg-red-600 text-white">
                  <p>Hello Sara! I am available to start next week.</p>
                  <p className="text-xs text-red-200 mt-1">2:20 PM</p>
                </div>
              </div>
              <div className="flex justify-start mb-4">
                <div className="max-w-[70%] p-3 rounded-xl bg-white border border-gray-200 text-gray-800">
                  <p>When can you start working?</p>
                  <p className="text-xs text-gray-400 mt-1">2:30 PM</p>
                </div>
              </div>
            </div>

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
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-red-500"
                  onKeyPress={(e) => e.key === 'Enter' && setMessage('')}
                />
                <button 
                  onClick={() => setMessage('')}
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
              <User size={64} className="text-gray-300 mx-auto mb-4" />
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