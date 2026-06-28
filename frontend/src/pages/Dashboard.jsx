import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Briefcase, Search, MessageCircle, Bell, 
  User, Settings, LogOut, DollarSign, Star,
  Calendar, TrendingUp, Award, Shield, Home
} from 'lucide-react';

function Dashboard() {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.fullName}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/search" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Search size={20} /> Search
          </Link>
          <Link to="/my-hires" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> My Hires
          </Link>
          <Link to="/messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
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
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-gray-500">Welcome back, {user.fullName}!</p>
            </div>
            <button className="relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Workers</p>
                  <p className="text-2xl font-bold text-gray-800">2,547</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users size={24} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Hires</p>
                  <p className="text-2xl font-bold text-gray-800">342</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Briefcase size={24} className="text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800">$48,650</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <DollarSign size={24} className="text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="text-2xl font-bold text-gray-800">4.9 ★</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link to="/search" className="bg-red-600 p-6 rounded-xl shadow-sm hover:bg-red-700 transition text-white">
              <Search size={24} className="mb-3" />
              <h3 className="text-xl font-semibold">Find Workers</h3>
              <p className="text-red-100 text-sm mt-1">Search for the perfect worker</p>
            </Link>
            <Link to="/my-hires" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <Briefcase size={24} className="text-red-600 mb-3" />
              <h3 className="text-xl font-semibold text-gray-800">My Hires</h3>
              <p className="text-gray-500 text-sm mt-1">View all your hired workers</p>
            </Link>
            <Link to="/profile" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <User size={24} className="text-red-600 mb-3" />
              <h3 className="text-xl font-semibold text-gray-800">My Profile</h3>
              <p className="text-gray-500 text-sm mt-1">View and edit your profile</p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Hires</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-800">Ahmed Ali</p>
                    <p className="text-sm text-gray-500">Nanny - Full Time</p>
                  </div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-800">Mona Hassan</p>
                    <p className="text-sm text-gray-500">Elderly Caregiver</p>
                  </div>
                  <span className="text-sm text-yellow-600">Pending</span>
                </div>
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <p className="font-medium text-gray-800">Khaled Mostafa</p>
                    <p className="text-sm text-gray-500">Driver</p>
                  </div>
                  <span className="text-sm text-gray-500">Completed</span>
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

export default Dashboard;