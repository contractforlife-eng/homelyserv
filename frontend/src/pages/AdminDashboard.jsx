import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Star,
  MessageCircle,
  FileText,
  Settings,
  HelpCircle,
  BarChart3,
  Home
} from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
        </div>
        <nav className="px-4 space-y-1">
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Users size={20} /> Users
          </Link>
          <Link to="/admin/workers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Workers
          </Link>
          <Link to="/admin/jobs" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <FileText size={20} /> Job Requests
          </Link>
          <Link to="/admin/bookings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Calendar size={20} /> Bookings
          </Link>
          <Link to="/admin/categories" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <BarChart3 size={20} /> Categories
          </Link>
          <Link to="/admin/payments" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <DollarSign size={20} /> Payments
          </Link>
          <Link to="/admin/reviews" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Star size={20} /> Reviews
          </Link>
          <Link to="/admin/messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/admin/reports" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <FileText size={20} /> Reports
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </Link>
          <Link to="/admin/support" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <HelpCircle size={20} /> Support
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Welcome back, Admin</h2>
            <button 
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 transition"
            >
              Logout
            </button>
          </div>
          <p className="text-gray-500 text-sm">Here's what's happening with your platform today.</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">25,680</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Workers</p>
            <p className="text-2xl font-bold text-gray-800">8,432</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Job Requests</p>
            <p className="text-2xl font-bold text-gray-800">3,215</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Active Bookings</p>
            <p className="text-2xl font-bold text-gray-800">2,845</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-800">$48,650</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Job Requests</h3>
            <div className="space-y-3">
              <div className="border-b border-gray-100 pb-2">
                <p className="font-medium text-gray-800">Need a babysitter for 2 kids</p>
                <p className="text-sm text-gray-500">New York, USA</p>
              </div>
              <div className="border-b border-gray-100 pb-2">
                <p className="font-medium text-gray-800">Elderly care for my father</p>
                <p className="text-sm text-gray-500">Los Angeles, USA</p>
              </div>
              <div className="border-b border-gray-100 pb-2">
                <p className="font-medium text-gray-800">Driver for daily office commute</p>
                <p className="text-sm text-gray-500">Chicago, USA</p>
              </div>
              <div className="border-b border-gray-100 pb-2">
                <p className="font-medium text-gray-800">Part-time security guard</p>
                <p className="text-sm text-gray-500">Houston, USA</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Housekeeping for 3 days/week</p>
                <p className="text-sm text-gray-500">Miami, USA</p>
              </div>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Reviews</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-800">Baby sitter</span>
                <span className="text-gray-600">1,256 (39%)</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-800">Elderly Care</span>
                <span className="text-gray-600">842 (26%)</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-800">Drivers</span>
                <span className="text-gray-600">612 (19%)</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-800">Security</span>
                <span className="text-gray-600">285 (9%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-800">Housekeeping</span>
                <span className="text-gray-600">220 (7%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;