import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Briefcase, DollarSign, Star, MessageCircle, FileText, Settings, HelpCircle, BarChart3, Home, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { label: 'Total Users', value: '25,680', icon: <Users size={24} />, color: 'blue' },
    { label: 'Total Workers', value: '8,432', icon: <Briefcase size={24} />, color: 'green' },
    { label: 'Job Requests', value: '3,215', icon: <FileText size={24} />, color: 'purple' },
    { label: 'Active Bookings', value: '2,845', icon: <Calendar size={24} />, color: 'orange' },
    { label: 'Total Revenue', value: '$48,650', icon: <DollarSign size={24} />, color: 'red' }
  ];

  const recentJobs = [
    'Need a babysitter for 2 kids - New York, USA',
    'Elderly care for my father - Los Angeles, USA',
    'Driver for daily office commute - Chicago, USA',
    'Part-time security guard - Houston, USA',
    'Housekeeping for 3 days/week - Miami, USA'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
        </div>
        <nav className="px-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Home size={20} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Users size={20} /> Users
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Workers
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <FileText size={20} /> Job Requests
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Calendar size={20} /> Bookings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <BarChart3 size={20} /> Categories
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <DollarSign size={20} /> Payments
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Star size={20} /> Reviews
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <FileText size={20} /> Reports
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <HelpCircle size={20} /> Support
          </button>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={() => navigate('/login')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition">
            <span>🚪 Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Welcome back, Admin</h2>
              <p className="text-gray-500 text-sm">Here's what's happening with your platform today.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative"><Bell size={20} className="text-gray-600" /></button>
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">A</div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Job Requests</h3>
              <div className="space-y-3">
                {recentJobs.map((job, i) => (
                  <div key={i} className="border-b border-gray-100 pb-2">
                    <p className="font-medium text-gray-800">{job}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Payments</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-800">Babysitter Service</span>
                  <span className="text-green-600 font-medium">$120</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-800">Elderly Care</span>
                  <span className="text-green-600 font-medium">$200</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-800">Driver Service</span>
                  <span className="text-green-600 font-medium">$80</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-800">Security Service</span>
                  <span className="text-green-600 font-medium">$150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Housekeeping</span>
                  <span className="text-green-600 font-medium">$90</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;