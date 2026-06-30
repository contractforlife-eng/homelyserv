import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  MapPin,
  Star
} from 'lucide-react';

const AdminHires = () => {
  const [loading, setLoading] = useState(true);
  const [hires, setHires] = useState([]);
  const [filteredHires, setFilteredHires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedHire, setExpandedHire] = useState(null);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      const demoHires = [
        {
          id: 'HS-2026-001',
          worker: {
            name: 'Ahmed Ali',
            category: 'Nanny',
            rating: 4.9,
            location: 'Cairo, Egypt',
            phone: '+201234567890',
            email: 'ahmed@example.com'
          },
          employer: {
            name: 'Sara Mohamed',
            phone: '+201234567891',
            email: 'sara@example.com'
          },
          position: 'Nanny - Full Time',
          salary: 3500,
          status: 'active',
          startDate: '2026-07-01',
          createdAt: '2026-06-15',
          paymentStatus: 'confirmed'
        },
        {
          id: 'HS-2026-002',
          worker: {
            name: 'Mona Hassan',
            category: 'Elderly Caregiver',
            rating: 4.8,
            location: 'Alexandria, Egypt',
            phone: '+201234567892',
            email: 'mona@example.com'
          },
          employer: {
            name: 'Khaled Mostafa',
            phone: '+201234567893',
            email: 'khaled@example.com'
          },
          position: 'Elderly Caregiver - Part Time',
          salary: 4200,
          status: 'pending',
          startDate: null,
          createdAt: '2026-06-18',
          paymentStatus: 'pending'
        },
        {
          id: 'HS-2026-003',
          worker: {
            name: 'Khaled Mostafa',
            category: 'Driver',
            rating: 4.7,
            location: 'Giza, Egypt',
            phone: '+201234567894',
            email: 'khaled.driver@example.com'
          },
          employer: {
            name: 'Nadia Ibrahim',
            phone: '+201234567895',
            email: 'nadia@example.com'
          },
          position: 'Driver - Full Time',
          salary: 3800,
          status: 'completed',
          startDate: '2026-05-01',
          createdAt: '2026-04-25',
          paymentStatus: 'confirmed'
        }
      ];

      setHires(demoHires);
      setFilteredHires(demoHires);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = hires;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(h => h.status === statusFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        h.worker.name.toLowerCase().includes(searchLower) ||
        h.employer.name.toLowerCase().includes(searchLower) ||
        h.position.toLowerCase().includes(searchLower) ||
        h.id.toLowerCase().includes(searchLower)
      );
    }
    setFilteredHires(filtered);
  }, [hires, statusFilter, searchTerm]);

  const toggleExpand = (hireId) => {
    setExpandedHire(expandedHire === hireId ? null : hireId);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'active': return <CheckCircle size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Hire Management</h1>
          <p className="text-gray-500">Manage all hires across the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Hires</p>
            <p className="text-2xl font-bold text-gray-800">{hires.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {hires.filter(h => h.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {hires.filter(h => h.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-blue-600">
              {hires.filter(h => h.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search hires..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Hires List */}
        {filteredHires.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No hires found</h3>
            <p className="text-gray-500">No hires match your search criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHires.map((hire) => (
              <div
                key={hire.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-4 cursor-pointer" onClick={() => toggleExpand(hire.id)}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <User size={20} className="text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{hire.worker.name}</h3>
                          <p className="text-sm text-gray-500">{hire.position}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {hire.worker.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star size={12} className="fill-yellow-400 text-yellow-400" />
                              {hire.worker.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-800">
                          EGP {hire.salary.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(hire.status)}`}>
                          {getStatusIcon(hire.status)}
                          {hire.status.charAt(0).toUpperCase() + hire.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(hire.createdAt).toLocaleDateString()}
                      </div>
                      {expandedHire === hire.id ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedHire === hire.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Worker Details</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span>{hire.worker.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span>{hire.worker.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase size={14} className="text-gray-400" />
                            <span>{hire.worker.category}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Employer Details</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span>{hire.employer.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span>{hire.employer.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span>{hire.employer.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                        View Details
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                        Contact
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHires;