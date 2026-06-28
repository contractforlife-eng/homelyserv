import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Briefcase, User, Search, Clock, DollarSign,
  MessageCircle, Settings, LogOut, AlertCircle,
  CheckCircle, XCircle, Eye, CreditCard, Calendar,
  MapPin, Phone, Mail, FileText, UserCheck
} from 'lucide-react';

function EmployerPending() {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  const pendingApplications = [
    {
      id: 1,
      workerName: 'Ahmed Ali',
      position: 'Nanny - Full Time',
      category: 'Babysitter',
      location: 'Cairo, Egypt',
      salary: 3500,
      fee: 350,
      status: 'pending_fee',
      date: '2026-06-20',
      phone: '+201234567890',
      email: 'ahmed@example.com',
      experience: 5,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      position: 'Elderly Caregiver',
      category: 'Caregiver',
      location: 'Alexandria, Egypt',
      salary: 4200,
      fee: 420,
      status: 'pending_approval',
      date: '2026-06-18',
      phone: '+201234567891',
      email: 'mona@example.com',
      experience: 7,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face'
    }
  ];

  const handlePayFee = (id) => {
    alert(`Processing payment for application #${id}`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending_fee':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending Fee (10%)</span>;
      case 'pending_approval':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Pending Approval</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
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
              {userData.fullName?.charAt(0) || 'E'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{userData.fullName || 'Employer'}</p>
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
          <Link to="/employer-pending" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Clock size={20} /> Pending
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">2</span>
          </Link>
          <Link to="/employer-past" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
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
              <h2 className="text-xl font-bold text-gray-800">Pending Applications</h2>
              <p className="text-gray-500 text-sm">Review and manage pending requests</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Pending</p>
              <p className="text-2xl font-bold text-gray-800">{pendingApplications.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Pending Fee</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingApplications.filter(a => a.status === 'pending_fee').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Fee Amount</p>
              <p className="text-2xl font-bold text-red-600">
                EGP {pendingApplications.reduce((sum, a) => sum + a.fee, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {pendingApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <img src={app.image} alt={app.workerName} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{app.workerName}</h3>
                      <p className="text-sm text-gray-500">{app.position}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{app.category}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} /> {app.location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          ⭐ {app.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center min-w-[150px]">
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-bold text-gray-800">EGP {app.salary.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Fee (10%)</p>
                    <p className="font-bold text-red-600">EGP {app.fee.toLocaleString()}</p>
                  </div>

                  <div className="flex flex-col items-end justify-center gap-2 min-w-[160px]">
                    {getStatusBadge(app.status)}
                    <div className="flex gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                        <Eye size={18} />
                      </button>
                      {app.status === 'pending_fee' && (
                        <button 
                          onClick={() => handlePayFee(app.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1"
                        >
                          <CreditCard size={16} /> Pay Fee
                        </button>
                      )}
                    </div>
                    {app.status === 'pending_fee' && (
                      <p className="text-xs text-yellow-600">Pay 10% fee to proceed</p>
                    )}
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

export default EmployerPending;