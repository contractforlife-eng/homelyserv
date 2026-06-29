import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Briefcase, User, FileText, Search, MessageCircle, 
  Settings, LogOut, Bell, Clock, CheckCircle, XCircle,
  TrendingUp, Award, Shield, Star, Calendar, Users,
  DollarSign, MapPin, Phone, Mail, AlertCircle,
  Activity, PieChart, BarChart3, Sparkles, Zap,
  ThumbsUp, ThumbsDown, Heart, Share2, Bookmark,
  ChevronRight
} from 'lucide-react';

function WorkerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setLoading(false);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Stats data
  const stats = {
    applications: 24,
    interviews: 3,
    offers: 2,
    rating: 4.9,
    completionRate: 78,
    totalTasks: 45,
    completedTasks: 35,
    pendingTasks: 8,
    rejectedTasks: 2
  };

  // Recent activity data
  const recentActivities = [
    { id: 1, type: 'offer', title: 'New Job Offer', description: 'Sara Mohamed sent you a job offer', time: '2 hours ago', icon: <Briefcase size={16} />, color: 'green' },
    { id: 2, type: 'message', title: 'New Message', description: 'Khaled Mostafa replied to your application', time: '5 hours ago', icon: <MessageCircle size={16} />, color: 'blue' },
    { id: 3, type: 'interview', title: 'Interview Scheduled', description: 'Interview with Nadia Ibrahim tomorrow', time: '1 day ago', icon: <Calendar size={16} />, color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <h1 className="text-xl font-bold text-red-600">HomelyServ</h1>
        </div>
        <button className="relative">
          <Bell size={22} className="text-gray-600" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:block w-72 bg-white/80 backdrop-blur-xl shadow-lg border-r border-gray-100 min-h-screen fixed">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium">Worker Panel</p>
          </div>
          
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-white rounded-xl">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/20">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  Online
                </p>
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-gray-700">{stats.rating}</span>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <Link to="/worker-dashboard" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-xl font-medium transition-all shadow-sm">
              <Home size={20} /> Dashboard
              <span className="ml-auto bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">New</span>
            </Link>
            <Link to="/worker-offers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all group">
              <Briefcase size={20} className="group-hover:text-red-600 transition-colors" /> Offers
              <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">2</span>
            </Link>
            <Link to="/worker-profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all group">
              <User size={20} className="group-hover:text-red-600 transition-colors" /> Profile
            </Link>
            <Link to="/worker-complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all group">
              <AlertCircle size={20} className="group-hover:text-red-600 transition-colors" /> Complaints
            </Link>
            <Link to="/worker-messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all group">
              <MessageCircle size={20} className="group-hover:text-red-600 transition-colors" /> Messages
              <span className="ml-auto bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">3</span>
            </Link>
            <Link to="/worker-settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all group">
              <Settings size={20} className="group-hover:text-red-600 transition-colors" /> Settings
            </Link>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all group">
              <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-300" /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-72">
          {/* Desktop Header */}
          <header className="hidden md:flex bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 px-8 py-4 justify-between items-center sticky top-0 z-30">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                Welcome back, {user?.fullName || 'User'}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-all">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/20">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Applications</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.applications}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={24} className="text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500 font-medium">+12%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Interviews</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.interviews}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar size={24} className="text-purple-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500 font-medium">+5%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Offers</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.offers}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award size={24} className="text-green-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500 font-medium">+8%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Rating</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.rating} ★</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star size={24} className="text-yellow-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500 font-medium">+0.2</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>
            </div>

            {/* Completion Rate Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#dc2626" strokeWidth="12" 
                      strokeDasharray={`${stats.completionRate * 3.52} 352`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800">{stats.completionRate}%</span>
                    <span className="text-xs text-gray-500">Completion</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-semibold text-gray-800 text-lg">Task Completion Rate</h3>
                  <p className="text-gray-500 text-sm mt-1">You have completed <strong className="text-gray-800">{stats.completedTasks}</strong> out of <strong className="text-gray-800">{stats.totalTasks}</strong> tasks</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                    <span className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1.5 rounded-full">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-gray-700">{stats.completedTasks} Completed</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm bg-yellow-50 px-3 py-1.5 rounded-full">
                      <Clock size={14} className="text-yellow-500" />
                      <span className="text-gray-700">{stats.pendingTasks} Pending</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm bg-red-50 px-3 py-1.5 rounded-full">
                      <XCircle size={14} className="text-red-500" />
                      <span className="text-gray-700">{stats.rejectedTasks} Rejected</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link to="/search" className="group bg-gradient-to-r from-red-600 to-red-700 p-5 rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Search size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Find Jobs</h3>
                    <p className="text-red-200 text-sm">Search for new opportunities</p>
                  </div>
                </div>
              </Link>

              <Link to="/worker-profile" className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-semibold text-lg">My Profile</h3>
                    <p className="text-gray-500 text-sm">View and edit your profile</p>
                  </div>
                </div>
              </Link>

              <Link to="/worker-offers" className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-semibold text-lg">My Offers</h3>
                    <p className="text-gray-500 text-sm">View and manage offers</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Activity size={18} className="text-red-600" />
                    Recent Activity
                  </h3>
                  <button className="text-sm text-red-600 hover:underline font-medium">View All</button>
                </div>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        activity.color === 'green' ? 'bg-green-100 text-green-600' :
                        activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{activity.title}</p>
                        <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                      </div>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-all">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <MessageCircle size={18} className="text-blue-600" />
                    Recent Messages
                  </h3>
                  <Link to="/worker-messages" className="text-sm text-red-600 hover:underline font-medium">View All</Link>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                        S
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">Sara Mohamed</p>
                        <p className="text-sm text-gray-500 truncate">When can you start working?</p>
                      </div>
                      <span className="text-xs text-gray-400">2h ago</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                        K
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">Khaled Mostafa</p>
                        <p className="text-sm text-gray-500 truncate">I'm interested in your profile</p>
                      </div>
                      <span className="text-xs text-gray-400">5h ago</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/20">
                        N
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">Nadia Ibrahim</p>
                        <p className="text-sm text-gray-500 truncate">Thank you for your application</p>
                      </div>
                      <span className="text-xs text-gray-400">1d ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;