import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Briefcase, User, Search, FileText, DollarSign, MessageCircle, 
  Settings, LogOut, Bell, CheckCircle, XCircle, Clock, Star, 
  MapPin, Phone, Mail, AlertCircle, Users, Calendar, Plus,
  Eye, Edit, Trash2, Filter, Download, CreditCard, Wallet
} from 'lucide-react';

function EmployerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
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

  // Categories for search
  const categories = [
    { id: 'all', label: 'All', icon: '👥' },
    { id: 'babysitter', label: 'Babysitter', icon: '👶' },
    { id: 'caregiver', label: 'Adult Caregiver', icon: '👴' },
    { id: 'driver', label: 'Driver', icon: '🚗' },
    { id: 'cook', label: 'Cook', icon: '🍳' },
    { id: 'house-manager', label: 'House Manager', icon: '🏠' },
    { id: 'gardener', label: 'Gardener', icon: '🌿' },
    { id: 'nurse', label: 'Nurse', icon: '💉' },
    { id: 'bodyguard', label: 'Bodyguard', icon: '🛡️' },
    { id: 'security', label: 'Security Guard', icon: '🔒' }
  ];

  // Sample data
  const pendingApplications = [
    { id: 1, worker: 'Ahmed Ali', position: 'Nanny', salary: 3500, date: '2026-06-20', status: 'pending_fee' },
    { id: 2, worker: 'Mona Hassan', position: 'Elderly Caregiver', salary: 4200, date: '2026-06-18', status: 'pending_approval' }
  ];

  const pastApplications = [
    { id: 3, worker: 'Khaled Mostafa', position: 'Driver', salary: 3800, date: '2026-06-15', status: 'completed' },
    { id: 4, worker: 'Sara Mahmoud', position: 'Cook', salary: 4000, date: '2026-06-10', status: 'incomplete' },
    { id: 5, worker: 'Youssef Ibrahim', position: 'Nurse', salary: 4500, date: '2026-06-05', status: 'completed' }
  ];

  const payments = [
    { id: 1, worker: 'Ahmed Ali', amount: 3500, status: 'pending', date: '2026-06-20' },
    { id: 2, worker: 'Mona Hassan', amount: 4200, status: 'paid', date: '2026-06-18' },
    { id: 3, worker: 'Khaled Mostafa', amount: 3800, status: 'pending', date: '2026-06-15' },
    { id: 4, worker: 'Sara Mahmoud', amount: 4000, status: 'paid', date: '2026-06-10' }
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
                    <p className="text-sm text-gray-500">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-800">24</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Clock size={20} className="text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">15</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold text-red-600">$48,650</p>
                  </div>
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <DollarSign size={20} className="text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Pending Applications</h3>
                {pendingApplications.map((app) => (
                  <div key={app.id} className="flex justify-between items-center border-b border-gray-100 py-2">
                    <div>
                      <p className="font-medium text-gray-800">{app.worker}</p>
                      <p className="text-sm text-gray-500">{app.position} • EGP {app.salary}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                      {app.status === 'pending_fee' ? 'Pending Fee (10%)' : 'Pending Approval'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Payments</h3>
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center border-b border-gray-100 py-2">
                    <div>
                      <p className="font-medium text-gray-800">{payment.worker}</p>
                      <p className="text-sm text-gray-500">{payment.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">EGP {payment.amount}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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

      case 'profile':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">My Profile</h3>
            
            {/* Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Employer Rating</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star size={20} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">4.7</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Total Hires</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Users size={20} className="text-blue-500" />
                  <span className="text-2xl font-bold">24</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Response Rate</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-2xl font-bold">95%</span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-6xl font-bold text-blue-600">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                  Edit Photo
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">{user.fullName || 'User'}</h2>
                <p className="text-gray-500">Employer</p>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div><span className="text-sm text-gray-500">Email</span><p className="font-medium">{user.email}</p></div>
                  <div><span className="text-sm text-gray-500">Phone</span><p className="font-medium">{user.phone || 'Not set'}</p></div>
                  <div><span className="text-sm text-gray-500">City</span><p className="font-medium">{user.city || 'Not set'}</p></div>
                  <div><span className="text-sm text-gray-500">Company</span><p className="font-medium">{user.company || 'Individual'}</p></div>
                </div>

                {/* Documents */}
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                      <CheckCircle size={14} /> ID Card (Verified)
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                      <Clock size={14} /> Business License (Pending)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Search Workers</h3>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by worker name..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    selectedCategory === cat.id 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl">{cat.icon}</div>
                  <p className="text-xs mt-1 font-medium text-gray-700">{cat.label}</p>
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                      A
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Ahmed Ali</h4>
                      <p className="text-sm text-gray-500">Nanny • 5 years exp</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">4.9</span>
                        <span className="text-xs text-gray-400">(127 reviews)</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1">EGP 3,500/month</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                    View Profile
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                      M
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Mona Hassan</h4>
                      <p className="text-sm text-gray-500">Elderly Caregiver • 7 years exp</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">4.8</span>
                        <span className="text-xs text-gray-400">(89 reviews)</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1">EGP 4,200/month</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Pending Applications</h3>
            <div className="space-y-4">
              {pendingApplications.map((app) => (
                <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{app.worker}</h4>
                      <p className="text-sm text-gray-600">{app.position}</p>
                      <p className="text-sm text-gray-500">Applied: {app.date}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">EGP {app.salary}/month</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        app.status === 'pending_fee' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {app.status === 'pending_fee' ? 'Pending Fee (10%)' : 'Pending Approval'}
                      </span>
                      {app.status === 'pending_fee' && (
                        <button className="block mt-2 px-4 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                          Pay 10% Fee
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'past':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Past Applications</h3>
            <div className="space-y-4">
              {pastApplications.map((app) => (
                <div key={app.id} className={`border rounded-lg p-4 ${
                  app.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{app.worker}</h4>
                      <p className="text-sm text-gray-600">{app.position}</p>
                      <p className="text-sm text-gray-500">Date: {app.date}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">EGP {app.salary}/month</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        app.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status === 'completed' ? '✅ Completed' : '⏳ Incomplete'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Payments</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Worker</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{payment.worker}</td>
                      <td className="py-3 font-semibold text-gray-800">EGP {payment.amount}</td>
                      <td className="py-3 text-gray-600">{payment.date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {payment.status === 'pending' && (
                          <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
                            Pay Now
                          </button>
                        )}
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
            <h3 className="text-xl font-bold text-gray-800 mb-6">Complaints</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employer Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue={user.fullName || ''} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employer Phone</label>
                <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue={user.phone || ''} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Enter employee's name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Phone</label>
                <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Enter employee's phone" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID Number</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Enter employee's ID" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Complaint Text</label>
                <textarea rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none" placeholder="Describe your complaint..."></textarea>
              </div>
              <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Submit Complaint
              </button>
            </form>
          </div>
        );

      case 'messages':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Messages</h3>
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
            <h3 className="text-xl font-bold text-gray-800 mb-6">Settings</h3>
            
            <div className="space-y-6">
              {/* Countries & Cities */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Preferred Locations</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Countries</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Egypt</option>
                      <option>UAE</option>
                      <option>Saudi Arabia</option>
                      <option>Kuwait</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Cities</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option>Cairo</option>
                      <option>Alexandria</option>
                      <option>Giza</option>
                      <option>Sharm El-Sheikh</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Language Settings</h4>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">English</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">العربية</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Français</button>
                </div>
              </div>

              {/* Account Actions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Account Settings</h4>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                    Temporarily Lock Profile
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    Permanently Disable Profile
                  </button>
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
          <p className="text-xs text-gray-500 mt-1">Employer Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{user.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">Employer</p>
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
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'profile' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User size={20} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'search' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Search size={20} /> Search
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'pending' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock size={20} /> Pending
            <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">2</span>
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'past' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={20} /> Past Applications
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
            onClick={() => setActiveTab('complaints')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'complaints' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <AlertCircle size={20} /> Complaints
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'messages' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageCircle size={20} /> Messages
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">1</span>
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
              <h2 className="text-xl font-bold text-gray-800">Employer Dashboard</h2>
              <p className="text-gray-500 text-sm">Welcome back, {user.fullName || 'User'}!</p>
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

export default EmployerDashboard;