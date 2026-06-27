import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Briefcase, Search, MessageCircle, Bell, User, Settings, LogOut, Home, Calendar, DollarSign, Star } from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // If no user, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.fullName || 'User'}!</span>
            <button className="relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-600 transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.fullName || 'User'}! 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your account today.</p>
        </div>

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
            <div className="flex items-center gap-3">
              <Search size={24} />
              <div>
                <h3 className="text-xl font-semibold">Search Workers</h3>
                <p className="text-red-100 text-sm mt-1">Find the perfect worker for your needs</p>
              </div>
            </div>
          </Link>
          
          <Link to="/my-hires" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <Briefcase size={24} className="text-red-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">My Hires</h3>
                <p className="text-gray-500 text-sm mt-1">View all your hired workers</p>
              </div>
            </div>
          </Link>
          
          <Link to="/profile" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <User size={24} className="text-red-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">My Profile</h3>
                <p className="text-gray-500 text-sm mt-1">View and edit your profile</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Hires</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <p className="font-medium text-gray-800">Ahmed Ali</p>
                  <p className="text-sm text-gray-500">Nanny - Full Time</p>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <p className="font-medium text-gray-800">Mona Hassan</p>
                  <p className="text-sm text-gray-500">Elderly Caregiver</p>
                </div>
                <span className="text-sm text-yellow-600 font-medium">Pending</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">Khaled Mostafa</p>
                  <p className="text-sm text-gray-500">Driver</p>
                </div>
                <span className="text-sm text-gray-500 font-medium">Completed</span>
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
  );
}

export default Dashboard;