import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Briefcase, User, Search, Clock, DollarSign,
  MessageCircle, Settings, LogOut, Star, MapPin,
  Filter, Grid, List, Bookmark, CheckCircle,
  XCircle, Users, Building, Home as HomeIcon,
  Car, Utensils, Heart, Shield, Sprout, Activity, Lock
} from 'lucide-react';

function EmployerSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: <Users size={20} /> },
    { id: 'babysitter', label: 'Babysitter', icon: <Users size={20} /> },
    { id: 'caregiver', label: 'Caregiver', icon: <Heart size={20} /> },
    { id: 'driver', label: 'Driver', icon: <Car size={20} /> },
    { id: 'cook', label: 'Cook', icon: <Utensils size={20} /> },
    { id: 'house-manager', label: 'House Manager', icon: <HomeIcon size={20} /> },
    { id: 'gardener', label: 'Gardener', icon: <Sprout size={20} /> },
    { id: 'nurse', label: 'Nurse', icon: <Activity size={20} /> },
    { id: 'bodyguard', label: 'Bodyguard', icon: <Shield size={20} /> },
    { id: 'security', label: 'Security Guard', icon: <Lock size={20} /> }
  ];

  const workers = [
    {
      id: 1,
      name: 'Ahmed Ali',
      category: 'babysitter',
      categoryLabel: 'Babysitter',
      rating: 4.9,
      location: 'Cairo, Egypt',
      salary: 3500,
      availability: 'Available',
      verified: true,
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=100&h=100&fit=crop&crop=face',
      skills: ['Childcare', 'First Aid', 'Teaching']
    },
    {
      id: 2,
      name: 'Mona Hassan',
      category: 'caregiver',
      categoryLabel: 'Caregiver',
      rating: 4.8,
      location: 'Alexandria, Egypt',
      salary: 4200,
      availability: 'Available',
      verified: true,
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=100&h=100&fit=crop&crop=face',
      skills: ['Elderly Care', 'Medication', 'Companionship']
    }
  ];

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Employer Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              E
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Employer</p>
              <p className="text-xs text-gray-500">Employer</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/employer-dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/employer-search" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Search size={20} /> Search
          </Link>
          <Link to="/employer-pending" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Clock size={20} /> Pending
          </Link>
          <Link to="/employer-past" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Past
          </Link>
          <Link to="/employer-payments" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <DollarSign size={20} /> Payments
          </Link>
          <Link to="/employer-profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/employer-complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <AlertCircle size={20} /> Complaints
          </Link>
          <Link to="/employer-messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/employer-settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Search Workers</h2>
              <p className="text-gray-500 text-sm">Find the perfect worker for your needs</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, category, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <Filter size={18} /> Filter
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full border transition flex items-center gap-2 ${
                  selectedCategory === cat.id 
                    ? 'border-red-500 bg-red-50 text-red-600' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                {cat.icon}
                <span className="text-sm">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Workers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkers.map((worker) => (
              <div key={worker.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <img src={worker.image} alt={worker.name} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                      {worker.verified && <CheckCircle size={14} className="text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-500">{worker.categoryLabel}</p>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{worker.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} className="text-gray-400" /> {worker.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={14} className="text-gray-400" /> EGP {worker.salary.toLocaleString()}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {worker.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                      {skill}
                    </span>
                  ))}
                </div>
                <button className="mt-3 w-full px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployerSearch;