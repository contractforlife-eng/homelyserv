import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, DollarSign, User, 
  Briefcase, Calendar, MapPin, Phone, Mail,
  Search, Filter, ChevronDown, ChevronUp,
  Eye, MessageCircle, CreditCard, Wallet,
  AlertCircle, FileText, Download, Printer
} from 'lucide-react';

function EmployerPending() {
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

  // Sample pending applications data
  const applications = [
    {
      id: 1,
      workerName: 'Ahmed Ali',
      position: 'Nanny - Full Time',
      category: 'Babysitter',
      location: 'Cairo, Egypt',
      salary: 3500,
      fee: 350,
      status: 'pending_fee',
      date: '2026-06-20',
      phone: '+201234567890',
      email: 'ahmed@example.com',
      experience: 5,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      position: 'Elderly Caregiver',
      category: 'Caregiver',
      location: 'Alexandria, Egypt',
      salary: 4200,
      fee: 420,
      status: 'pending_approval',
      date: '2026-06-18',
      phone: '+201234567891',
      email: 'mona@example.com',
      experience: 7,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 3,
      workerName: 'Khaled Mostafa',
      position: 'Driver',
      category: 'Driver',
      location: 'Giza, Egypt',
      salary: 3800,
      fee: 380,
      status: 'pending_fee',
      date: '2026-06-15',
      phone: '+201234567892',
      email: 'khaled@example.com',
      experience: 10,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 4,
      workerName: 'Sara Mahmoud',
      position: 'Cook - Part Time',
      category: 'Cook',
      location: 'Cairo, Egypt',
      salary: 4000,
      fee: 400,
      status: 'pending_approval',
      date: '2026-06-12',
      phone: '+201234567893',
      email: 'sara@example.com',
      experience: 8,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=80&h=80&fit=crop&crop=face'
    }
  ];

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handlePayFee = (appId) => {
    navigate(`/payment/${appId}`);
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
            <h1 className="text-2xl font-bold text-gray-800">Pending Applications</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {applications.filter(a => a.status === 'pending_fee').length} pending fees
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Pending</p>
            <p className="text-2xl font-bold text-gray-800">{applications.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending Fee (10%)</p>
            <p className="text-2xl font-bold text-yellow-600">
              {applications.filter(a => a.status === 'pending_fee').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold text-blue-600">
              {applications.filter(a => a.status === 'pending_approval').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Fee Amount</p>
            <p className="text-2xl font-bold text-red-600">
              EGP {applications.reduce((sum, app) => sum + app.fee, 0).toLocaleString()}
            </p>
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
              <option value="pending_fee">Pending Fee</option>
              <option value="pending_approval">Pending Approval</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No pending applications</h3>
            <p className="text-gray-500">All applications are processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Worker Image & Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img src={app.image} alt={app.workerName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{app.workerName}</h3>
                      <p className="text-sm text-gray-500">{app.position}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{app.category}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} /> {app.location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Briefcase size={12} /> {app.experience} years
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          ⭐ {app.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Salary & Fee */}
                  <div className="flex flex-col items-end justify-center min-w-[150px]">
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-bold text-gray-800">EGP {app.salary.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Fee (10%)</p>
                    <p className="font-bold text-red-600">EGP {app.fee.toLocaleString()}</p>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end justify-center gap-2 min-w-[180px]">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      app.status === 'pending_fee' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {app.status === 'pending_fee' ? '⏳ Pending Fee' : '⏳ Pending Approval'}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                        <Eye size={18} />
                      </button>
                      <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition">
                        <MessageCircle size={18} />
                      </button>
                      {app.status === 'pending_fee' && (
                        <button 
                          onClick={() => handlePayFee(app.id)}
                          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1"
                        >
                          <CreditCard size={16} /> Pay Fee
                        </button>
                      )}
                    </div>
                    {app.status === 'pending_fee' && (
                      <p className="text-xs text-gray-400 mt-1">Pay 10% fee to proceed</p>
                    )}
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

export default EmployerPending;
