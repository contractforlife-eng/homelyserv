import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Briefcase, User, Search, Clock, DollarSign,
  MessageCircle, Settings, LogOut, CheckCircle,
  XCircle, Eye, Calendar, MapPin, Star,
  FileText, AlertCircle, Download, Printer
} from 'lucide-react';

function EmployerPast() {
  const pastApplications = [
    {
      id: 1,
      workerName: 'Ahmed Ali',
      position: 'Nanny - Full Time',
      salary: 3500,
      status: 'completed',
      date: '2026-06-20',
      endDate: '2026-06-25',
      rating: 4.9,
      feedback: 'Excellent worker! Highly recommended.',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      position: 'Elderly Caregiver',
      salary: 4200,
      status: 'incomplete',
      date: '2026-06-18',
      endDate: '2026-06-22',
      rating: null,
      feedback: 'Worker did not complete the full duration.',
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face'
    }
  ];

  const stats = {
    total: pastApplications.length,
    completed: pastApplications.filter(a => a.status === 'completed').length,
    incomplete: pastApplications.filter(a => a.status === 'incomplete').length,
    completionRate: Math.round((pastApplications.filter(a => a.status === 'completed').length / pastApplications.length) * 100)
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Employer Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              E
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Employer</p>
              <p className="text-xs text-gray-500">Employer</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/employer-dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/employer-search" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Search size={20} /> Search
          </Link>
          <Link to="/employer-pending" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Clock size={20} /> Pending
          </Link>
          <Link to="/employer-past" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Briefcase size={20} /> Past
          </Link>
          <Link to="/employer-payments" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <DollarSign size={20} /> Payments
          </Link>
          <Link to="/employer-profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/employer-complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <AlertCircle size={20} /> Complaints
          </Link>
          <Link to="/employer-messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/employer-settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
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
              <h2 className="text-xl font-bold text-gray-800">Past Applications</h2>
              <p className="text-gray-500 text-sm">View your application history</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition flex items-center gap-1">
                <Download size={16} /> Export
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition flex items-center gap-1">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Incomplete</p>
              <p className="text-2xl font-bold text-red-600">{stats.incomplete}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completionRate}%</p>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {pastApplications.map((app) => (
              <div 
                key={app.id} 
                className={`rounded-xl shadow-sm border p-4 ${
                  app.status === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <img src={app.image} alt={app.workerName} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{app.workerName}</h3>
                      <p className="text-sm text-gray-600">{app.position}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} /> {app.date} - {app.endDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center min-w-[120px]">
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-bold text-gray-800">EGP {app.salary.toLocaleString()}</p>
                    {app.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{app.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-center gap-2 min-w-[140px]">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      app.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status === 'completed' ? '✅ Completed' : '⏳ Incomplete'}
                    </span>
                    {app.feedback && (
                      <p className="text-xs text-gray-600 text-right max-w-[200px]">
                        "{app.feedback}"
                      </p>
                    )}
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployerPast;