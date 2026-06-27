import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Briefcase, DollarSign, Star, MessageCircle, FileText, 
  Settings, HelpCircle, BarChart3, Home, Calendar, CheckCircle, 
  XCircle, Clock, AlertCircle, UserPlus, UserMinus, 
  TrendingUp, TrendingDown, Eye, Edit, Trash2, 
  Shield, Award, Zap, Activity, PieChart, LineChart, Bell, LogOut
} from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      // Check if user is admin
      if (parsed.role !== 'ADMIN') {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const stats = [
    { label: 'Total Users', value: '25,680', icon: <Users size={24} />, change: '+12%', color: 'blue' },
    { label: 'Total Workers', value: '8,432', icon: <Briefcase size={24} />, change: '+8%', color: 'green' },
    { label: 'Job Requests', value: '3,215', icon: <FileText size={24} />, change: '+15%', color: 'purple' },
    { label: 'Active Bookings', value: '2,845', icon: <Calendar size={24} />, change: '+5%', color: 'orange' },
    { label: 'Total Revenue', value: '$48,650', icon: <DollarSign size={24} />, change: '+18%', color: 'red' }
  ];

  const recentJobs = [
    { title: 'Need a babysitter for 2 kids', location: 'New York, USA', status: 'Pending' },
    { title: 'Elderly care for my father', location: 'Los Angeles, USA', status: 'Active' },
    { title: 'Driver for daily office commute', location: 'Chicago, USA', status: 'Completed' },
    { title: 'Part-time security guard', location: 'Houston, USA', status: 'Pending' },
    { title: 'Housekeeping for 3 days/week', location: 'Miami, USA', status: 'Active' }
  ];

  const recentPayments = [
    { user: 'Babysitter Service', amount: '$120', status: 'Paid' },
    { user: 'Elderly Care', amount: '$200', status: 'Paid' },
    { user: 'Driver Service', amount: '$80', status: 'Pending' },
    { user: 'Security Service', amount: '$150', status: 'Paid' },
    { user: 'Housekeeping', amount: '$90', status: 'Failed' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  // Render different content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 bg-${stat.color}-50 rounded-lg flex items-center justify-center text-${stat.color}-600`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">{stat.change}</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center gap-3">
                <UserPlus size={24} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-800">Add New User</p>
                  <p className="text-xs text-gray-500">Create new account</p>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-3">
                <Shield size={24} className="text-green-600" />
                <div>
                  <p className="font-semibold text-gray-800">Verify Workers</p>
                  <p className="text-xs text-gray-500">Pending: 45</p>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-center gap-3">
                <DollarSign size={24} className="text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-800">Process Payments</p>
                  <p className="text-xs text-gray-500">Pending: 28</p>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 flex items-center gap-3">
                <FileText size={24} className="text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-800">Generate Report</p>
                  <p className="text-xs text-gray-500">Monthly summary</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-red-600" /> Recent Job Requests
                </h3>
                <div className="space-y-3">
                  {recentJobs.map((job, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.location}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        job.status === 'Active' ? 'bg-green-100 text-green-800' :
                        job.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600" /> Recent Payments
                </h3>
                <div className="space-y-3">
                  {recentPayments.map((payment, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-800">{payment.user}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{payment.amount}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Star size={18} className="text-yellow-600" /> Top Categories
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-800">Baby sitter</span>
                    <span className="text-sm font-medium">1,256 (39%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '39%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-800">Elderly Care</span>
                    <span className="text-sm font-medium">842 (26%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '26%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-800">Drivers</span>
                    <span className="text-sm font-medium">612 (19%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '19%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'users':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">User Management</h3>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                <UserPlus size={18} /> Add User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-800">Ahmed Ali</td>
                    <td className="py-3 text-gray-600">ahmed@example.com</td>
                    <td className="py-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Worker</span></td>
                    <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                    <td className="py-3 flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit size={16} /></button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-800">Sara Mohamed</td>
                    <td className="py-3 text-gray-600">sara@example.com</td>
                    <td className="py-3"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Employer</span></td>
                    <td className="py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span></td>
                    <td className="py-3 flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit size={16} /></button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h3>
            <p className="text-gray-500">Content for {activeTab} section coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              {user.fullName?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{user.fullName || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
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
            <BarChart3 size={20} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'users' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={20} /> Users
          </button>
          <button 
            onClick={() => setActiveTab('workers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'workers' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Briefcase size={20} /> Workers
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'jobs' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={20} /> Jobs
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'payments' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign size={20} /> Payments
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'reviews' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star size={20} /> Reviews
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'settings' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings size={20} /> Settings
          </button>
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
              <h2 className="text-xl font-bold text-gray-800">Welcome back, {user.fullName || 'Admin'}!</h2>
              <p className="text-gray-500 text-sm">Here's what's happening with your platform today.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;