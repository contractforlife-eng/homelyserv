import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, Users, Search, MessageCircle, Bell, User, Settings, LogOut, 
  Home, Calendar, DollarSign, Star, MapPin, Clock, CheckCircle, XCircle,
  FileText, Award, Shield, TrendingUp, Heart, Bookmark
} from 'lucide-react';

function WorkerDashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Applications', value: '24', icon: <FileText size={20} />, color: 'blue' },
    { label: 'Interviews', value: '3', icon: <Calendar size={20} />, color: 'purple' },
    { label: 'Offers', value: '2', icon: <Award size={20} />, color: 'green' },
    { label: 'Rating', value: '4.9 ★', icon: <Star size={20} />, color: 'yellow' }
  ];

  const applications = [
    { position: 'Nanny - Full Time', employer: 'Sara Mohamed', status: 'Interview', date: '2026-06-20' },
    { position: 'Elderly Caregiver', employer: 'Khaled Mostafa', status: 'Offer', date: '2026-06-18' },
    { position: 'Driver', employer: 'Nadia Ibrahim', status: 'Pending', date: '2026-06-15' }
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
            <img src="https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=40&h=40&fit=crop&crop=face" alt="Worker" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
            <div>
              <p className="font-semibold text-gray-800">Ahmed Ali</p>
              <p className="text-xs text-gray-500">Worker • Nanny</p>
            </div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Home size={20} /> Overview
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> My Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Applications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Search size={20} /> Find Jobs
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Bookmark size={20} /> Saved Jobs
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
              <h2 className="text-xl font-bold text-gray-800">Worker Dashboard</h2>
              <p className="text-gray-500 text-sm">Manage your job applications and profile</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Welcome back, Ahmed!</span>
              <button className="relative"><Bell size={20} className="text-gray-600" /></button>
            </div>
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
              <div><p className="font-semibold text-gray-800">Find Jobs</p><p className="text-xs text-gray-500">Search for new opportunities</p></div>
            </Link>
            <Link to="/profile" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><User size={20} className="text-blue-600" /></div>
              <div><p className="font-semibold text-gray-800">My Profile</p><p className="text-xs text-gray-500">Update your information</p></div>
            </Link>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><FileText size={20} className="text-green-600" /></div>
              <div><p className="font-semibold text-gray-800">Applications</p><p className="text-xs text-gray-500">Track your applications</p></div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Recent Applications</h3>
              <button className="text-red-600 text-sm hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {applications.map((app, i) => (
                <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-800">{app.position}</p>
                    <p className="text-sm text-gray-500">{app.employer} • {app.date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    app.status === 'Interview' ? 'bg-purple-100 text-purple-800' :
                    app.status === 'Offer' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;