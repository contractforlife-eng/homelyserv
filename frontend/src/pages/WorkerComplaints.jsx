import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Briefcase, User, AlertCircle, MessageCircle, 
  Settings, LogOut, Send, Phone, Mail, FileText, CheckCircle } from 'lucide-react';

function WorkerComplaints() {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const [formData, setFormData] = useState({
    employeeName: userData.fullName || '',
    employeePhone: userData.phone || '',
    complainantName: '',
    employerPhone: '',
    employerId: '',
    complaintText: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Complaint submitted successfully!');
    setFormData({
      ...formData,
      complainantName: '',
      employerPhone: '',
      employerId: '',
      complaintText: ''
    });
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
              {userData.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{userData.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">Worker</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/worker-dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/worker-offers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Offers
          </Link>
          <Link to="/worker-profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/worker-complaints" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
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
              <h2 className="text-xl font-bold text-gray-800">Complaints</h2>
              <p className="text-gray-500 text-sm">Submit and track your complaints</p>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-3xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit a Complaint</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Phone</label>
                <input
                  type="tel"
                  value={formData.employeePhone}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complainant Name</label>
                <input
                  type="text"
                  value={formData.complainantName}
                  onChange={(e) => setFormData({...formData, complainantName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer Phone Number</label>
                <input
                  type="tel"
                  value={formData.employerPhone}
                  onChange={(e) => setFormData({...formData, employerPhone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Employer's phone number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer ID Number</label>
                <input
                  type="text"
                  value={formData.employerId}
                  onChange={(e) => setFormData({...formData, employerId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Employer's ID number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Text</label>
                <textarea
                  value={formData.complaintText}
                  onChange={(e) => setFormData({...formData, complaintText: e.target.value})}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Describe your complaint in detail..."
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Send size={18} /> Submit Complaint
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerComplaints;