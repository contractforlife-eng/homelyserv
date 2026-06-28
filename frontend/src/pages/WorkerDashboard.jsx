import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hop as Home, Briefcase, User, FileText, MessageCircle, Settings, LogOut, Bell, CircleCheck as CheckCircle, Circle as XCircle, Clock, TrendingUp, Award, Star, ChartPie as PieChart, ChartBar as BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

function WorkerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksReceived: 0,
    tasksDeclined: 0,
    completionRate: 0,
    pendingOffers: 0,
    rating: 0
  });
  const [recentOffers, setRecentOffers] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      fetchDashboardData(parsed.id);
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch worker profile stats
      const { data: profile } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        const completionRate = profile.tasks_received > 0
          ? Math.round((profile.tasks_completed / profile.tasks_received) * 100)
          : 0;
        setStats({
          tasksCompleted: profile.tasks_completed || 0,
          tasksReceived: profile.tasks_received || 0,
          tasksDeclined: profile.tasks_declined || 0,
          completionRate,
          pendingOffers: 0,
          rating: profile.rating_avg || 0
        });
      }

      // Fetch pending offers
      const { data: workerProfile } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (workerProfile) {
        const { data: offers } = await supabase
          .from('hires')
          .select(`
            *,
            employer:employer_id(full_name, email)
          `)
          .eq('worker_id', workerProfile.id)
          .in('status', ['offer_sent', 'pending_approval'])
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentOffers(offers || []);
      }

      // Fetch recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name)
        `)
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentMessages(messages || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{user.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">Service Provider</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/worker-offers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Offers
            {stats.pendingOffers > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingOffers}</span>
            )}
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <FileText size={20} /> Complaints
          </Link>
          <Link to="/messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
            {recentMessages.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{recentMessages.length}</span>
            )}
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Worker Dashboard</h2>
              <p className="text-gray-500 text-sm">Welcome back, {user.fullName || 'User'}!</p>
            </div>
            <button className="relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Task Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tasks Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.tasksCompleted}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tasks Received</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.tasksReceived}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <TrendingUp size={20} className="text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tasks Declined</p>
                    <p className="text-2xl font-bold text-red-600">{stats.tasksDeclined}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <XCircle size={20} className="text-red-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.completionRate}%</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <PieChart size={20} className="text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-red-600" /> Performance Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Rating</span>
                    <span className="font-semibold text-gray-800">{stats.rating.toFixed(1)}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 rounded-full h-2"
                      style={{ width: `${(stats.rating / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2">
                    <Award size={24} className="text-yellow-500" />
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-800">{stats.rating.toFixed(1)}</p>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= Math.round(stats.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <User size={20} className="text-red-600" />
                  <span className="text-gray-700">Update Profile</span>
                </Link>
                <Link
                  to="/worker-offers"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Briefcase size={20} className="text-green-600" />
                  <span className="text-gray-700">View Offers</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Settings size={20} className="text-blue-600" />
                  <span className="text-gray-700">Update Availability</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Recent Offers</h3>
                <Link to="/worker-offers" className="text-sm text-red-600 hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                {recentOffers.length > 0 ? recentOffers.map((offer) => (
                  <div key={offer.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <p className="font-medium text-gray-800">{offer.employer?.full_name || 'Employer'}</p>
                      <p className="text-sm text-gray-500">EGP {offer.agreed_salary}/month</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      offer.status === 'offer_sent' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {offer.status === 'offer_sent' ? 'New Offer' : 'Pending'}
                    </span>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm text-center py-4">No pending offers</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Recent Messages</h3>
                <Link to="/messages" className="text-sm text-red-600 hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                {recentMessages.length > 0 ? recentMessages.map((msg) => (
                  <div key={msg.id} className="border-b border-gray-100 pb-3">
                    <p className="font-medium text-gray-800">{msg.sender?.full_name || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm text-center py-4">No new messages</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;
