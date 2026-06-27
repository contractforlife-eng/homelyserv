import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, Users, Search, MessageCircle, Bell, User, Settings, LogOut, 
  Home, Calendar, DollarSign, Star, MapPin, Clock, CheckCircle, XCircle,
  Plus, Filter, Eye, FileText, BarChart3, TrendingUp, Award, Shield
} from 'lucide-react';

function EmployerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'Active Hires', value: '12', icon: <Briefcase size={20} />, color: 'blue' },
    { label: 'Pending Requests', value: '3', icon: <Clock size={20} />, color: 'yellow' },
    { label: 'Completed Jobs', value: '45', icon: <CheckCircle size={20} />, color: 'green' },
    { label: 'Total Spent', value: '$4,850', icon: <DollarSign size={20} />, color: 'red' }
  ];

  const recentHires = [
    { name: 'Ahmed Ali', position: 'Nanny', status: 'Active', date: '2026-06-20', rating: 4.9 },
    { name: 'Mona Hassan', position: 'Elderly Care', status: 'Pending', date: '2026-06-18', rating: null },
    { name: 'Khaled Mostafa', position: 'Driver', status: 'Completed', date: '2026-06-15', rating: 4.7 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
        </div>
        <div className="px-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">S</div>
            <div>
              <p className="font-semibold text-gray-800">Sara Mohamed</p>
              <p className="text-xs text-gray-500">Employer</p>
            </div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Home size={20} /> Overview
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Users size={20} /> My Hires
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Search size={20} /> Find Workers
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </button>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={() => navigate('/login')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Employer Dashboard</h2>
              <p className="text-gray-500 text-sm">Manage your hires and find new workers</p>
            </div>
            <button onClick={() => navigate('/search')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
              <Plus size={18} /> New Hire
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 bg-${stat.color}-50 rounded-lg flex items-center justify-center text-${stat.color}-600`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Link to="/search" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Search size={20} className="text-red-600" /></div>
              <div><p className="font-semibold text-gray-800">Find Workers</p><p className="text-xs text-gray-500">Search for new talent</p></div>
            </Link>
            <Link to="/my-hires" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Briefcase size={20} className="text-blue-600" /></div>
              <div><p className="font-semibold text-gray-800">My Hires</p><p className="text-xs text-gray-500">View all your hires</p></div>
            </Link>
            <Link to="/profile" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><User size={20} className="text-green-600" /></div>
              <div><p className="font-semibold text-gray-800">My Profile</p><p className="text-xs text-gray-500">Update your information</p></div>
            </Link>
          </div>

          {/* Recent Hires */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Recent Hires</h3>
              <Link to="/my-hires" className="text-red-600 text-sm hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {recentHires.map((hire, i) => (
                <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-800">{hire.name}</p>
                    <p className="text-sm text-gray-500">{hire.position} • {hire.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {hire.rating && (
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{hire.rating}</span>
                      </div>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      hire.status === 'Active' ? 'bg-green-100 text-green-800' :
                      hire.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {hire.status}
                    </span>
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

export default EmployerDashboard;