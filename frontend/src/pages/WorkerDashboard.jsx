import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, Users, Search, MessageCircle, Bell, User, Settings, LogOut, 
  Home, Calendar, DollarSign, Star, MapPin, Clock, CheckCircle, XCircle,
  FileText, Award, Shield, TrendingUp, Heart, Bookmark
} from 'lucide-react';

function WorkerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get user image with fallback
  const getUserImage = () => {
    return user?.image || 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=40&h=40&fit=crop&crop=face';
  };

  const getUserName = () => {
    return user?.fullName || 'User';
  };

  const stats = {
    applications: 24,
    interviews: 3,
    offers: 2,
    rating: 4.9
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Worker Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img 
              src={getUserImage()} 
              alt={getUserName()} 
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=40&h=40&fit=crop&crop=face';
              }}
            />
            <div>
              <p className="font-semibold text-gray-800 text-sm">{getUserName()}</p>
              <p className="text-xs text-gray-500">Worker</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'overview' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home size={20} /> Dashboard
          </button>
          <Link 
            to="/worker-offers"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            <Briefcase size={20} /> Offers
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">2</span>
          </Link>
          <Link 
            to="/profile"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            <User size={20} /> My Profile
          </Link>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'applications' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={20} /> Applications
          </button>
          <Link to="/search" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <Search size={20} /> Find Jobs
          </Link>
          <Link to="/messages" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/settings" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Worker Dashboard</h2>
              <p className="text-gray-500 text-sm">Welcome back, {getUserName()}!</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Applications</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.applications}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Interviews</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.interviews}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Offers</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.offers}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.rating} ★</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/search" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Search size={20} className="text-red-600" /></div>
                  <div><p className="font-semibold text-gray-800">Find Jobs</p><p className="text-xs text-gray-500">Search for new opportunities</p></div>
                </Link>
                <Link 
                  to="/profile"
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><User size={20} className="text-blue-600" /></div>
                  <div><p className="font-semibold text-gray-800">My Profile</p><p className="text-xs text-gray-500">View and edit your profile</p></div>
                </Link>
                <button 
                  onClick={() => setActiveTab('applications')}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-3 text-left w-full"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><FileText size={20} className="text-green-600" /></div>
                  <div><p className="font-semibold text-gray-800">Applications</p><p className="text-xs text-gray-500">Track your applications</p></div>
                </button>
              </div>
            </>
          )}

          {activeTab === 'applications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">My Applications</h3>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">Nanny - Full Time</h4>
                      <p className="text-sm text-gray-600">Sara Mohamed</p>
                      <p className="text-sm text-gray-500">Applied: 2026-06-20</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">Elderly Caregiver</h4>
                      <p className="text-sm text-gray-600">Khaled Mostafa</p>
                      <p className="text-sm text-gray-500">Applied: 2026-06-18</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Interview</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">Driver</h4>
                      <p className="text-sm text-gray-600">Nadia Ibrahim</p>
                      <p className="text-sm text-gray-500">Applied: 2026-06-15</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Offer Received</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;