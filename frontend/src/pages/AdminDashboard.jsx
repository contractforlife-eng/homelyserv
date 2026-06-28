import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Users, Briefcase, DollarSign, Star, MessageCircle, 
  FileText, Settings, HelpCircle, BarChart3, Calendar, 
  CheckCircle, XCircle, Clock, AlertCircle, UserPlus, 
  UserMinus, TrendingUp, TrendingDown, Eye, Edit, 
  Trash2, Shield, Award, Zap, Activity, PieChart, 
  LineChart, Bell, LogOut, Search, Filter, Download,
  CreditCard, Wallet, Phone, Mail, MapPin, Globe, Plus
} from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

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
  const stats = [
    { label: 'Total Users', value: '25,680', icon: <Users size={24} />, change: '+12%', color: 'blue' },
    { label: 'Total Workers', value: '8,432', icon: <Briefcase size={24} />, change: '+8%', color: 'green' },
    { label: 'Job Requests', value: '3,215', icon: <FileText size={24} />, change: '+15%', color: 'purple' },
    { label: 'Active Bookings', value: '2,845', icon: <Calendar size={24} />, change: '+5%', color: 'orange' },
    { label: 'Total Revenue', value: '$48,650', icon: <DollarSign size={24} />, change: '+18%', color: 'red' }
  ];

  const users = [
    { id: 1, name: 'Ahmed Ali', email: 'ahmed@example.com', role: 'worker', status: 'active', phone: '+201234567890', idNumber: '12345678901234', country: 'Egypt', city: 'Cairo', transactions: 12, joined: '2026-01-15' },
    { id: 2, name: 'Sara Mohamed', email: 'sara@example.com', role: 'employer', status: 'active', phone: '+201234567891', idNumber: '12345678901235', country: 'Egypt', city: 'Alexandria', transactions: 8, joined: '2026-02-20' },
    { id: 3, name: 'Khaled Mostafa', email: 'khaled@example.com', role: 'worker', status: 'suspended', phone: '+201234567892', idNumber: '12345678901236', country: 'Egypt', city: 'Giza', transactions: 5, joined: '2026-03-10' },
    { id: 4, name: 'Nadia Ibrahim', email: 'nadia@example.com', role: 'employer', status: 'pending', phone: '+201234567893', idNumber: '12345678901237', country: 'UAE', city: 'Dubai', transactions: 0, joined: '2026-04-05' },
    { id: 5, name: 'Youssef Hassan', email: 'youssef@example.com', role: 'worker', status: 'active', phone: '+201234567894', idNumber: '12345678901238', country: 'Egypt', city: 'Cairo', transactions: 25, joined: '2026-05-12' }
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-red-600" /> Recent Job Requests
                </h3>
                <div className="space-y-3">
                  {complaints.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{item.from}</p>
                        <p className="text-xs text-gray-500">{item.message.substring(0, 40)}...</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.status}
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
                  {payments.slice(0, 3).map((payment, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-sm text-gray-800">{payment.user}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">${payment.amount}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
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
                      <td className="py-3 text-sm text-gray-600">{user.joined}</td>
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

            {/* Payment Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Wallet size={18} className="text-blue-600" /> InstaPay
                </h4>
                <p className="text-sm text-gray-600">Number: <span className="font-medium">01009189851</span></p>
                <button className="mt-2 text-xs text-red-600 hover:underline">Edit</button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone size={18} className="text-green-600" /> Vodafone Cash
                </h4>
                <p className="text-sm text-gray-600">Number: <span className="font-medium">01009189851</span></p>
                <button className="mt-2 text-xs text-red-600 hover:underline">Edit</button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CreditCard size={18} className="text-purple-600" /> Bank Transfer
                </h4>
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

      case 'complaints':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Complaints Management</h3>
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

      case 'messages':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Messages & Responses</h3>
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">Admin Response</p>
                    <p className="text-sm text-gray-600">Your complaint has been received and is being reviewed.</p>
                    <p className="text-xs text-gray-400 mt-1">2026-06-25 14:30</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Read</span>
                </div>
              </div>
              <div className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">Worker: Ahmed Ali</p>
                    <p className="text-sm text-gray-600">I am interested in the position. When can I start?</p>
                    <p className="text-xs text-gray-400 mt-1">2026-06-24 09:15</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Unread</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Admin Settings</h3>
            
            <div className="space-y-6">
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
          {['overview', 'users', 'payments', 'complaints', 'messages', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === tab ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'overview' && <BarChart3 size={20} />}
              {tab === 'users' && <Users size={20} />}
              {tab === 'payments' && <DollarSign size={20} />}
              {tab === 'complaints' && <AlertCircle size={20} />}
              {tab === 'messages' && <MessageCircle size={20} />}
              {tab === 'settings' && <Settings size={20} />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
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