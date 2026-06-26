import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <button 
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">25,680</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Workers</p>
            <p className="text-2xl font-bold text-gray-800">8,432</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Job Requests</p>
            <p className="text-2xl font-bold text-gray-800">3,215</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Active Bookings</p>
            <p className="text-2xl font-bold text-gray-800">2,845</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/search" className="bg-red-600 p-6 rounded-xl shadow-sm hover:bg-red-700 transition text-white">
            <h3 className="text-xl font-semibold">🔍 Search Workers</h3>
            <p className="text-red-100 mt-2">Find the perfect worker for your needs</p>
          </Link>
          
          <Link to="/my-hires" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-xl font-semibold text-gray-800">📋 My Hires</h3>
            <p className="text-gray-600 mt-2">View all your hired workers</p>
          </Link>
          
          <Link to="/worker-dashboard" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-xl font-semibold text-gray-800">👤 Worker View</h3>
            <p className="text-gray-600 mt-2">Switch to worker perspective</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Job Requests</h3>
            <div className="space-y-3">
              <div className="border-b border-gray-100 pb-3">
                <p className="font-medium text-gray-800">Need a babysitter for 2 kids</p>
                <p className="text-sm text-gray-500">New York, USA</p>
              </div>
              <div className="border-b border-gray-100 pb-3">
                <p className="font-medium text-gray-800">Elderly care for my father</p>
                <p className="text-sm text-gray-500">Los Angeles, USA</p>
              </div>
              <div className="border-b border-gray-100 pb-3">
                <p className="font-medium text-gray-800">Driver for daily office commute</p>
                <p className="text-sm text-gray-500">Chicago, USA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Payments</h3>
            <div className="space-y-3">
              <div className="border-b border-gray-100 pb-3 flex justify-between">
                <span className="text-gray-800">Babysitter Service</span>
                <span className="text-green-600 font-medium">$120</span>
              </div>
              <div className="border-b border-gray-100 pb-3 flex justify-between">
                <span className="text-gray-800">Elderly Care</span>
                <span className="text-green-600 font-medium">$200</span>
              </div>
              <div className="border-b border-gray-100 pb-3 flex justify-between">
                <span className="text-gray-800">Driver Service</span>
                <span className="text-green-600 font-medium">$80</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;