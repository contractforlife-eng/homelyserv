import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Briefcase, User, FileText, Search, MessageCircle, 
  Settings, LogOut, Bell, Clock, CheckCircle, XCircle,
  TrendingUp, Award, Shield, Star, Calendar, Users,
  DollarSign, MapPin, Phone, Mail, AlertCircle
} from 'lucide-react';

function WorkerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setLoading(false);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Sample stats for dashboard
  const stats = {
    totalTasks: 45,
    completedTasks: 28,
    receivedTasks: 12,
    declinedTasks: 5,
    completionRate: 62
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
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">Worker</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/worker-dashboard" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/worker-offers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Offers
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">2</span>
          </Link>
          <Link to="/worker-profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/worker-complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <AlertCircle size={20} /> Complaints
          </Link>
          <Link to="/worker-messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/worker-settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Worker Dashboard</h2>
              <p className="text-gray-500 text-sm">Welcome back, {user?.fullName || 'User'}!</p>
            </div>
            <button className="relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Received</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.receivedTasks}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Declined</p>
                  <p className="text-2xl font-bold text-red-600">{stats.declinedTasks}</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <XCircle size={20} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Task Completion Rate</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#dc2626" strokeWidth="12" 
                    strokeDasharray={`${stats.completionRate * 3.52} 352`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">{stats.completionRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">You have completed <strong>{stats.completedTasks}</strong> out of <strong>{stats.totalTasks}</strong> tasks</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Completed: {stats.completedTasks}</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-yellow-500" /> Received: {stats.receivedTasks}</span>
                  <span className="flex items-center gap-1"><XCircle size={14} className="text-red-500" /> Declined: {stats.declinedTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Applications</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-800">Nanny - Full Time</p>
                    <p className="text-sm text-gray-500">Sara Mohamed</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-800">Elderly Caregiver</p>
                    <p className="text-sm text-gray-500">Khaled Mostafa</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Interview</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">Driver</p>
                    <p className="text-sm text-gray-500">Nadia Ibrahim</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Offer</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Messages</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3">
                  <p className="font-medium text-gray-800">Sara Mohamed</p>
                  <p className="text-sm text-gray-500">When can you start working?</p>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="font-medium text-gray-800">Khaled Rashed</p>
                  <p className="text-sm text-gray-500">I'm interested in your profile</p>
                  <span className="text-xs text-gray-400">5 hours ago</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Nadia Ibrahim</p>
                  <p className="text-sm text-gray-500">Thank you for your application</p>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;