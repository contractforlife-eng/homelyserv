import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Briefcase, User, FileText, MessageCircle, Settings, LogOut,
  Bell, CheckCircle, XCircle, Clock, Star, MapPin, DollarSign,
  Award, Shield, TrendingUp, Users, Calendar, Phone, Mail,
  AlertCircle, Plus, Minus, Edit, Save, Trash2, Eye
} from 'lucide-react';

function WorkerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);

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

  // Sample data for dashboard
  const stats = {
    totalTasks: 45,
    completedTasks: 28,
    receivedTasks: 12,
    declinedTasks: 5,
    completionRate: 62
  };

  const offers = [
    { id: 1, employer: 'Sara Mohamed', position: 'Nanny - Full Time', salary: 4000, status: 'pending', date: '2026-06-20' },
    { id: 2, employer: 'Khaled Mostafa', position: 'Elderly Caregiver', salary: 4200, status: 'accepted', date: '2026-06-18' },
    { id: 3, employer: 'Nadia Ibrahim', position: 'Driver', salary: 3800, status: 'declined', date: '2026-06-15', reason: 'Salary too low' },
    { id: 4, employer: 'Ahmed Hassan', position: 'Cook - Part Time', salary: 3500, status: 'pending', date: '2026-06-10' }
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
                    <p className="text-sm text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Briefcase size={20} className="text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Received</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.receivedTasks}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Clock size={20} className="text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${(stats.receivedTasks / stats.totalTasks) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Declined</p>
                    <p className="text-2xl font-bold text-red-600">{stats.declinedTasks}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <XCircle size={20} className="text-red-600" />
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: `${(stats.declinedTasks / stats.totalTasks) * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Task Completion Rate</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#dc2626" strokeWidth="12" 
                      strokeDasharray={`${stats.completionRate * 3.52} 352`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{stats.completionRate}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">You have completed <strong>{stats.completedTasks}</strong> out of <strong>{stats.totalTasks}</strong> tasks</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Completed: {stats.completedTasks}</span>
                    <span className="flex items-center gap-1"><Clock size={14} className="text-yellow-500" /> Received: {stats.receivedTasks}</span>
                    <span className="flex items-center gap-1"><XCircle size={14} className="text-red-500" /> Declined: {stats.declinedTasks}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'offers':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Job Offers</h3>
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{offer.position}</h4>
                      <p className="text-sm text-gray-600">{offer.employer}</p>
                      <p className="text-sm text-gray-500">Date: {offer.date}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">EGP {offer.salary.toLocaleString()}/month</p>
                      {offer.reason && (
                        <p className="text-sm text-red-600 mt-1">Reason: {offer.reason}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </span>
                      {offer.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button className="px-4 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                            Accept
                          </button>
                          <button className="px-4 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">My Profile</h3>
            
            {/* Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Performance</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star size={20} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">4.8</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Trustworthiness</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Shield size={20} className="text-green-500" />
                  <span className="text-2xl font-bold">98%</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Speed & Accuracy</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Award size={20} className="text-blue-500" />
                  <span className="text-2xl font-bold">4.9</span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center text-6xl font-bold text-red-600">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
                <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
                  Edit Photo
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">{user.fullName || 'User'}</h2>
                <p className="text-gray-500">{user.role} • {user.category || 'No category'}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div><span className="text-sm text-gray-500">Email</span><p className="font-medium">{user.email}</p></div>
                  <div><span className="text-sm text-gray-500">Phone</span><p className="font-medium">{user.phone || 'Not set'}</p></div>
                  <div><span className="text-sm text-gray-500">City</span><p className="font-medium">{user.city || 'Not set'}</p></div>
                  <div><span className="text-sm text-gray-500">Country</span><p className="font-medium">{user.country || 'Not set'}</p></div>
                  <div><span className="text-sm text-gray-500">Experience</span><p className="font-medium">{user.experience || '0'} years</p></div>
                  <div><span className="text-sm text-gray-500">Expected Salary</span><p className="font-medium">EGP {user.expectedSalary || '0'}</p></div>
                </div>

                {/* Documents */}
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                      <CheckCircle size={14} /> ID Card (Verified)
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                      <Clock size={14} /> Certificate (Pending)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complaints':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Complaints</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue={user.fullName || ''} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Phone</label>
                <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" defaultValue={user.phone || ''} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Complainant Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Enter your full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employer Phone Number</label>
                <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Enter employer's phone" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employer ID Number</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Enter employer's ID" />
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
                    <p className="font-semibold text-gray-800">Employer: Sara Mohamed</p>
                    <p className="text-sm text-gray-600">I am interested in your profile. When can you start?</p>
                    <p className="text-xs text-gray-400 mt-1">2026-06-24 09:15</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Unread</span>
                </div>
              </div>
              <div className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">Admin Response</p>
                    <p className="text-sm text-gray-600">Your document has been verified successfully.</p>
                    <p className="text-xs text-gray-400 mt-1">2026-06-23 11:00</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Read</span>
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
          <p className="text-xs text-gray-500 mt-1">Worker Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{user.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">{user.category || 'Worker'}</p>
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
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'offers' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Briefcase size={20} /> Offers
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">2</span>
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
              <h2 className="text-xl font-bold text-gray-800">Worker Dashboard</h2>
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

export default WorkerDashboard;