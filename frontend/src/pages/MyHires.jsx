import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, MessageCircle, DollarSign, CheckCircle, XCircle, Clock, User, MapPin, Star, ChevronDown } from 'lucide-react';

function MyHires() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const hires = [
    {
      id: 1,
      worker: 'Ahmed Ali',
      position: 'Nanny - Full Time',
      salary: 3500,
      status: 'active',
      startDate: '2026-07-01',
      rating: 4.9,
      location: 'Cairo, Egypt',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 2,
      worker: 'Mona Hassan',
      position: 'Elderly Caregiver',
      salary: 4200,
      status: 'pending',
      startDate: null,
      rating: null,
      location: 'Alexandria, Egypt',
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 3,
      worker: 'Khaled Mostafa',
      position: 'Driver',
      salary: 3800,
      status: 'completed',
      startDate: '2026-05-01',
      rating: 4.7,
      location: 'Giza, Egypt',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-800">My Hires</h1>
          </div>
          <button onClick={() => navigate('/search')} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
            + New Hire
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Hires</p>
            <p className="text-2xl font-bold text-gray-800">{hires.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{hires.filter(h => h.status === 'active').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{hires.filter(h => h.status === 'pending').length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-blue-600">{hires.filter(h => h.status === 'completed').length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search hires by worker name or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
              <Filter size={18} /> Filter
            </button>
          </div>
        </div>

        {/* Hire Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hires.map((hire) => (
            <div key={hire.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <img src={hire.image} alt={hire.worker} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{hire.worker}</h3>
                  <p className="text-sm text-gray-500">{hire.position}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{hire.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Salary</p>
                  <p className="font-semibold text-gray-800">EGP {hire.salary.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(hire.status)}`}>
                    {getStatusIcon(hire.status)}
                    {hire.status.charAt(0).toUpperCase() + hire.status.slice(1)}
                  </span>
                </div>
              </div>

              {hire.rating && (
                <div className="mt-2 flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{hire.rating}</span>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
                  <Eye size={16} className="inline mr-1" /> Details
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                  <MessageCircle size={16} className="inline mr-1" /> Message
                </button>
                {hire.status === 'pending' && (
                  <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                    <DollarSign size={16} className="inline mr-1" /> Pay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyHires;