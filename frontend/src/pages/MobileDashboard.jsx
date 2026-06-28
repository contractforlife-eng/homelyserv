import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Search, Briefcase, MessageCircle, User, LogOut, Home } from 'lucide-react';
import MobileBottomNav from '../components/MobileBottomNav';

function MobileDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{user.fullName}</p>
            <p className="text-xs text-gray-500">Welcome back!</p>
          </div>
        </div>
        <button className="relative p-2">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      <div className="mobile-container py-4">
        {/* Stats */}
        <div className="mobile-stats mb-4">
          <div className="mobile-card text-center">
            <p className="text-xs text-gray-500">Hires</p>
            <p className="text-xl font-bold text-gray-800">24</p>
          </div>
          <div className="mobile-card text-center">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-xl font-bold text-green-600">12</p>
          </div>
          <div className="mobile-card text-center">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-xl font-bold text-red-600">$48k</p>
          </div>
          <div className="mobile-card text-center">
            <p className="text-xs text-gray-500">Rating</p>
            <p className="text-xl font-bold text-yellow-500">4.9★</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mobile-grid mb-4">
          <Link to="/search" className="mobile-card bg-red-600 text-white border-none hover:bg-red-700">
            <Search size={24} className="mb-2" />
            <p className="font-semibold">Find Workers</p>
            <p className="text-xs text-red-200">Search for talent</p>
          </Link>
          <Link to="/my-hires" className="mobile-card hover:shadow-md">
            <Briefcase size={24} className="text-red-600 mb-2" />
            <p className="font-semibold text-gray-800">My Hires</p>
            <p className="text-xs text-gray-500">View all hires</p>
          </Link>
          <Link to="/messages" className="mobile-card hover:shadow-md">
            <MessageCircle size={24} className="text-blue-600 mb-2" />
            <p className="font-semibold text-gray-800">Messages</p>
            <p className="text-xs text-gray-500">Chat with workers</p>
          </Link>
          <Link to="/profile" className="mobile-card hover:shadow-md">
            <User size={24} className="text-green-600 mb-2" />
            <p className="font-semibold text-gray-800">Profile</p>
            <p className="text-xs text-gray-500">Manage your info</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mobile-card mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800 text-sm">Ahmed Ali</p>
                <p className="text-xs text-gray-500">Nanny - Full Time</p>
              </div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800 text-sm">Mona Hassan</p>
                <p className="text-xs text-gray-500">Caregiver</p>
              </div>
              <span className="text-xs text-yellow-600 font-medium">Pending</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mobile-card text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default MobileDashboard;