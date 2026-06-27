import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Briefcase, DollarSign, Star, MessageCircle, FileText, 
  Settings, HelpCircle, BarChart3, Home, Calendar, CheckCircle, 
  XCircle, Clock, AlertCircle, UserPlus, UserMinus, 
  TrendingUp, TrendingDown, Eye, Edit, Trash2, 
  Shield, Award, Zap, Activity, PieChart, LineChart, Bell, LogOut,
  Search, Filter, Plus, ChevronDown, MoreVertical
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

  // Sample data
  const users = [
    { id: 1, name: 'Ahmed Ali', email: 'ahmed@example.com', role: 'Worker', status: 'Active', joined: '2026-01-15' },
    { id: 2, name: 'Sara Mohamed', email: 'sara@example.com', role: 'Employer', status: 'Pending', joined: '2026-02-20' },
    { id: 3, name: 'Khaled Mostafa', email: 'khaled@example.com', role: 'Worker', status: 'Active', joined: '2026-03-10' },
    { id: 4, name: 'Nadia Ibrahim', email: 'nadia@example.com', role: 'Employer', status: 'Suspended', joined: '2026-04-05' }
  ];

  const workers = [
    { id: 1, name: 'Ahmed Ali', category: 'Nanny', rating: 4.9, status: 'Verified', jobs: 12 },
    { id: 2, name: 'Mona Hassan', category: 'Elderly Caregiver', rating: 4.8, status: 'Pending', jobs: 8 },
    { id: 3, name: 'Khaled Mostafa', category: 'Driver', rating: 4.7, status: 'Verified', jobs: 15 },
    { id: 4, name: 'Sara Mahmoud', category: 'Cook', rating: 4.9, status: 'Verified', jobs: 20 }
  ];

  const jobs = [
    { id: 1, title: 'Need a babysitter for 2 kids', location: 'New York, USA', status: 'Pending', date: '2026-06-20' },
    { id: 2, title: 'Elderly care for my father', location: 'Los Angeles, USA', status: 'Active', date: '2026-06-18' },
    { id: 3, title: 'Driver for daily office commute', location: 'Chicago, USA', status: 'Completed', date: '2026-06-15' },
    { id: 4, title: 'Part-time security guard', location: 'Houston, USA', status: 'Pending', date: '2026-06-12' }
  ];

  const payments = [
    { id: 1, user: 'Babysitter Service', amount: '$120', status: 'Paid', date: '2026-06-20' },
    { id: 2, user: 'Elderly Care', amount: '$200', status: 'Paid', date: '2026-06-18' },
    { id: 3, user: 'Driver Service', amount: '$80', status: 'Pending', date: '2026-06-15' },
    { id: 4, user: 'Security Service', amount: '$150', status: 'Failed', date: '2026-06-12' }
  ];

  const reviews = [
    { id: 1, user: 'Sara Mohamed', rating: 5, comment: 'Excellent nanny! Highly recommended.', date: '2026-06-20' },
    { id: 2, user: 'Khaled Rashed', rating: 4, comment: 'Great with children, very reliable.', date: '2026-06-18' },
    { id: 3, user: 'Nadia Ibrahim', rating: 5, comment: 'Wonderful experience. Highly professional.', date: '2026-06-15' }
  ];

  const stats = [
    { label: 'Total Users', value: '25,680', icon: <Users size={24} />, change: '+12%', color: 'blue' },
    { label: 'Total Workers', value: '8,432', icon: <Briefcase size={24} />, change: '+8%', color: 'green' },
    { label: 'Job Requests', value: '3,215', icon: <FileText size={24} />, change: '+15%', color: 'purple' },
    { label: 'Active Bookings', value: '2,845', icon: <Calendar size={24} />, change: '+5%', color: 'orange' },
    { label: 'Total Revenue', value: '$48,650', icon: <DollarSign size={24} />, change: '+18%', color: 'red' }
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

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Jobs</h3>
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex justify-between items-center border-b border-gray-100 py-2">
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

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Payments</h3>
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center border-b border-gray-100 py-2">
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
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{user.name}</td>
                      <td className="py-3 text-gray-600">{user.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'Worker' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'Employer' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === 'Active' ? 'bg-green-100 text-green-800' :
                          user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{user.joined}</td>
                      <td className="py-3 flex gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                        <button className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit size={16} /></button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'workers':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Worker Management</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                  <Filter size={18} /> Filter
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                  <Plus size={18} /> Add Worker
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((worker) => (
                <div key={worker.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                      {worker.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{worker.name}</p>
                      <p className="text-xs text-gray-500">{worker.category}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{worker.rating}</span>
                        <span className="text-xs text-gray-400">({worker.jobs} jobs)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      worker.status === 'Verified' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {worker.status}
                    </span>
                    <button className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition">Verify</button>
                    <button className="flex-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition">Suspend</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'jobs':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Job Management</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                  <Filter size={18} /> Filter
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                  <Plus size={18} /> Post Job
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition">
                  <div>
                    <p className="font-semibold text-gray-800">{job.title}</p>
                    <p className="text-sm text-gray-500">{job.location} • {job.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      job.status === 'Active' ? 'bg-green-100 text-green-800' :
                      job.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Payment Management</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Transaction</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{payment.user}</td>
                      <td className="py-3 font-semibold text-gray-800">{payment.amount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{payment.date}</td>
                      <td className="py-3">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reviews Management</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{review.user}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                        ))}
                        <span className="text-sm ml-1">{review.rating}.0</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">"{review.comment}"</p>
                    </div>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Admin Settings</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800">Commission Settings</h4>
                <p className="text-sm text-gray-500">Current commission rate: 6.5%</p>
                <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">Edit</button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800">Payment Methods</h4>
                <p className="text-sm text-gray-500">InstaPay, Vodafone Cash, Bank Transfer</p>
                <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">Manage</button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800">System Settings</h4>
                <p className="text-sm text-gray-500">Language: English • Currency: EGP</p>
                <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">Configure</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Page Not Found</h3>
            <p className="text-gray-500">The requested tab does not exist.</p>
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