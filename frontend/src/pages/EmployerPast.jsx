import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, User, Briefcase, 
  Calendar, MapPin, DollarSign, Star, Eye,
  MessageCircle, Download, Printer, Search,
  Filter, ChevronDown, ChevronUp, FileText,
  Award, AlertCircle, TrendingUp, TrendingDown
} from 'lucide-react';

function EmployerPast() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  // Sample past applications data
  const applications = [
    {
      id: 1,
      workerName: 'Ahmed Ali',
      position: 'Nanny - Full Time',
      category: 'Babysitter',
      location: 'Cairo, Egypt',
      salary: 3500,
      status: 'completed',
      date: '2026-06-20',
      endDate: '2026-06-25',
      rating: 4.9,
      feedback: 'Excellent worker! Highly recommended.',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      position: 'Elderly Caregiver',
      category: 'Caregiver',
      location: 'Alexandria, Egypt',
      salary: 4200,
      status: 'incomplete',
      date: '2026-06-18',
      endDate: '2026-06-22',
      rating: null,
      feedback: 'Worker did not complete the full duration.',
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 3,
      workerName: 'Khaled Mostafa',
      position: 'Driver',
      category: 'Driver',
      location: 'Giza, Egypt',
      salary: 3800,
      status: 'completed',
      date: '2026-06-15',
      endDate: '2026-06-20',
      rating: 4.7,
      feedback: 'Professional and punctual driver.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 4,
      workerName: 'Sara Mahmoud',
      position: 'Cook - Part Time',
      category: 'Cook',
      location: 'Cairo, Egypt',
      salary: 4000,
      status: 'completed',
      date: '2026-06-12',
      endDate: '2026-06-18',
      rating: 4.9,
      feedback: 'Amazing cook! Highly recommended.',
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 5,
      workerName: 'Youssef Ibrahim',
      position: 'Nurse - Part Time',
      category: 'Nurse',
      location: 'Alexandria, Egypt',
      salary: 4500,
      status: 'incomplete',
      date: '2026-06-10',
      endDate: '2026-06-14',
      rating: null,
      feedback: 'Worker resigned mid-contract.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face'
    }
  ];

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: applications.length,
    completed: applications.filter(a => a.status === 'completed').length,
    incomplete: applications.filter(a => a.status === 'incomplete').length,
    completionRate: Math.round((applications.filter(a => a.status === 'completed').length / applications.length) * 100)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/employer-dashboard" className="text-gray-600 hover:text-red-600 transition">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Past Applications</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Download size={16} /> Export
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Incomplete</p>
            <p className="text-2xl font-bold text-red-600">{stats.incomplete}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{stats.completionRate}%</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by worker name, position, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Status</option>
              <option value="completed">✅ Completed</option>
              <option value="incomplete">⏳ Incomplete</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No past applications</h3>
            <p className="text-gray-500">Your past applications will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div 
                key={app.id} 
                className={`rounded-xl shadow-sm border p-4 hover:shadow-md transition ${
                  app.status === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Worker Image & Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img src={app.image} alt={app.workerName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{app.workerName}</h3>
                      <p className="text-sm text-gray-600">{app.position}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{app.category}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} /> {app.location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} /> {app.date} - {app.endDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Salary & Rating */}
                  <div className="flex flex-col items-end justify-center min-w-[150px]">
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-bold text-gray-800">EGP {app.salary.toLocaleString()}</p>
                    {app.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={16} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{app.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end justify-center gap-2 min-w-[180px]">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      app.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status === 'completed' ? '✅ Completed' : '⏳ Incomplete'}
                    </span>
                    {app.feedback && (
                      <p className="text-xs text-gray-600 text-right max-w-[200px]">
                        "{app.feedback}"
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                        <Eye size={18} />
                      </button>
                      <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition">
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployerPast;
