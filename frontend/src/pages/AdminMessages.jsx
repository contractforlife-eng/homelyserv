import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Users, DollarSign, MessageCircle, Settings, 
  LogOut, Bell, Search, Filter, Reply, CheckCircle,
  XCircle, Clock, AlertCircle, ArrowLeft, Eye
} from 'lucide-react';

function AdminMessages() {
  const [searchTerm, setSearchTerm] = useState('');

  const messages = [
    {
      id: 1,
      from: 'Ahmed Ali',
      type: 'complaint',
      message: 'Employer not responding after hiring',
      date: '2026-06-20',
      status: 'pending'
    },
    {
      id: 2,
      from: 'Sara Mohamed',
      type: 'support',
      message: 'Need help with payment',
      date: '2026-06-18',
      status: 'resolved'
    },
    {
      id: 3,
      from: 'Khaled Mostafa',
      type: 'complaint',
      message: 'Worker did not show up',
      date: '2026-06-15',
      status: 'pending'
    }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1">
          <Clock size={12} /> Pending
        </span>;
      case 'resolved':
        return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
          <CheckCircle size={12} /> Resolved
        </span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              A
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Admin</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Users size={20} /> Users
          </Link>
          <Link to="/admin/payments" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <DollarSign size={20} /> Payments
          </Link>
          <Link to="/admin/messages" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
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
              <p className="text-gray-500 text-sm">View and manage all messages</p>
            </div>
            <button className="relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
                <Filter size={16} /> Filter
              </button>
            </div>

            {/* Messages List */}
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <div key={msg.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-800">{msg.from}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          msg.type === 'complaint' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {msg.type}
                        </span>
                        {getStatusBadge(msg.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{msg.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" title="View">
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition" title="Reply">
                        <Reply size={16} />
                      </button>
                      {msg.status === 'pending' && (
                        <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition" title="Resolve">
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMessages;