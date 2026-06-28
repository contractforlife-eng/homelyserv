import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Users, DollarSign, MessageCircle, Settings, LogOut, 
  Bell, CheckCircle, XCircle, Clock, Star, UserCheck, UserX,
  TrendingUp, TrendingDown, Eye, Edit, Trash2, Plus,
  Search, Filter, Download, CreditCard, Wallet, Phone,
  Mail, MapPin, Shield, Award, AlertCircle, Activity,
  BarChart3, PieChart, LineChart, Calendar, FileText
} from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

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

  // Sample data
  const dashboardStats = {
    totalUsers: 25680,
    totalPayments: 48650,
    totalComplaints: 127,
    onlineWorkers: 342,
    offlineWorkers: 8090,
    onlineEmployers: 156,
    offlineEmployers: 1078
  };

  const users = [
    { id: 1, name: 'Ahmed Ali', email: 'ahmed@example.com', role: 'worker', status: 'active', phone: '+201234567890', idNumber: '12345678901234', country: 'Egypt', city: 'Cairo', transactions: 12 },
    { id: 2, name: 'Sara Mohamed', email: 'sara@example.com', role: 'employer', status: 'active', phone: '+201234567891', idNumber: '12345678901235', country: 'Egypt', city: 'Alexandria', transactions: 8 },
    { id: 3, name: 'Khaled Mostafa', email: 'khaled@example.com', role: 'worker', status: 'suspended', phone: '+201234567892', idNumber: '12345678901236', country: 'Egypt', city: 'Giza', transactions: 5 },
    { id: 4, name: 'Nadia Ibrahim', email: 'nadia@example.com', role: 'employer', status: 'pending', phone: '+201234567893', idNumber: '12345678901237', country: 'UAE', city: 'Dubai', transactions: 0 },
    { id: 5, name: 'Youssef Hassan', email: 'youssef@example.com', role: 'worker', status: 'active', phone: '+201234567894', idNumber: '12345678901238', country: 'Egypt', city: 'Cairo', transactions: 25 }
  ];

  const payments = [
    { id: 1, user: 'Ahmed Ali', amount: 3500, status: 'completed', method: 'InstaPay', date: '2026-06-20' },
    { id: 2, user: 'Sara Mohamed', amount: 4200, status: 'completed', method: 'Vodafone Cash', date: '2026-06-18' },
    { id: 3, user: 'Khaled Mostafa', amount: 3800, status: 'pending', method: 'Bank Transfer', date: '2026-06-15' },
    { id: 4, user: 'Nadia Ibrahim', amount: 4000, status: 'failed', method: 'InstaPay', date: '2026-06-12' },
    { id: 5, user: 'Youssef Hassan', amount: 4500, status: 'completed', method: 'Vodafone Cash', date: '2026-06-10' }
  ];

  const complaints = [
    { id: 1, from: 'Ahmed Ali', type: 'worker', message: 'Employer not responding after hiring', date: '2026-06-20', status: 'pending' },
    { id: 2, from: 'Sara Mohamed', type: 'employer', message: 'Worker did not show up for work', date: '2026-06-18', status: 'resolved' },
    { id: 3, from: 'Khaled Mostafa', type: 'worker', message: 'Payment delay from employer', date: '2026-06-15', status: 'pending' }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500">+12%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-800">${dashboardStats.totalPayments.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500">+18%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Complaints</p>
                    <p className="text-2xl font-bold text-red-600">{dashboardStats.totalComplaints}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertCircle size={20} className="text-red-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingDown size={14} className="text-red-500" />
                  <span className="text-red-500">-5%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Users</p>
                    <p className="text-2xl font-bold text-gray-800">2,845</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Activity size={20} className="text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500">+8%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>
            </div>

            {/* Online/Offline Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Workers Status</h4>
                <div className="flex gap-4">
                  <div className="flex-1 text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Online</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardStats.onlineWorkers}</p>
                  </div>
                  <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Offline</p>
                    <p className="text-2xl font-bold text-gray-600">{dashboardStats.offlineWorkers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Employers Status</h4>
                <div className="flex gap-4">
                  <div className="flex-1 text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-500">Online</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardStats.onlineEmployers}</p>
                  </div>
                  <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Offline</p>
                    <p className="text-2xl font-bold text-gray-600">{dashboardStats.offlineEmployers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Recent Users</h3>
                <button className="text-sm text-red-600 hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {users.slice(0, 3).map((user) => (
                  <div key={user.id} className="flex justify-between items-center border-b border-gray-100 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role} • {user.city}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'users':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-gray-800">User Management</h3>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                  <Plus size={18} /> Add User
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'worker' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'employer' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{user.phone}</td>
                      <td className="py-3 text-sm text-gray-600">{user.idNumber}</td>
                      <td className="py-3 text-sm text-gray-600">{user.city}, {user.country}</td>
                      <td className="py-3 text-sm text-gray-600">{user.transactions}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded"><Edit size={16} /></button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Payments Management</h3>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <Download size={18} /> Export
              </button>
            </div>

            {/* Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">InstaPay</h4>
                <p className="text-sm text-gray-600">Number: <span className="font-medium">01009189851</span></p>
                <button className="mt-2 text-xs text-red-600 hover:underline">Edit</button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Vodafone Cash</h4>
                <p className="text-sm text-gray-600">Number: <span className="font-medium">01009189851</span></p>
                <button className="mt-2 text-xs text-red-600 hover:underline">Edit</button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Bank Transfer</h4>
                <p className="text-sm text-gray-600">Account: <span className="font-medium">1002425938683</span></p>
                <p className="text-xs text-gray-500">IBAN: EG580037000908181002425938683</p>
                <button className="mt-2 text-xs text-red-600 hover:underline">Edit</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{payment.user}</td>
                      <td className="py-3 font-semibold text-gray-800">${payment.amount}</td>
                      <td className="py-3 text-sm text-gray-600">{payment.method}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{payment.date}</td>
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

      case 'messages':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Messages & Complaints</h3>
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className={`border rounded-lg p-4 ${
                  complaint.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-800">{complaint.from}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          complaint.type === 'worker' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {complaint.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{complaint.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{complaint.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {complaint.status}
                      </span>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                          Reply
                        </button>
                        {complaint.status === 'pending' && (
                          <button className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Site Settings</h3>
            
            <div className="space-y-6">
              {/* Payment Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Payment Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">InstaPay Number</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="01009189851" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Vodafone Cash Number</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="01009189851" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bank Account Number</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="1002425938683" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">IBAN</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="EG580037000908181002425938683" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">SWIFT Code</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="QNBAEGCXXXX" />
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Save Payment Settings</button>
                </div>
              </div>

              {/* Commission Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Commission Settings</h4>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Commission Rate (%)</label>
                  <input type="number" className="w-32 px-3 py-2 border border-gray-300 rounded-lg" defaultValue="6.5" />
                </div>
                <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Update Commission</button>
              </div>

              {/* Language Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Language Settings</h4>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Default Language</label>
                  <select className="w-48 px-3 py-2 border border-gray-300 rounded-lg">
                    <option>English</option>
                    <option>العربية</option>
                    <option>Français</option>
                    <option>Русский</option>
                    <option>Türkçe</option>
                    <option>Nederlands</option>
                  </select>
                </div>
              </div>

              {/* Site Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Site Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Site Name</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="HomelyServ" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Support Email</label>
                    <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="support@homelyserv.com" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Support Phone</label>
                    <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="+201009189851" />
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Save Site Settings</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
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
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'dashboard' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home size={20} /> Dashboard
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
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'payments' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign size={20} /> Payments
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'messages' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageCircle size={20} /> Messages
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
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
            <div className="flex items-center gap-3">
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