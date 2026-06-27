import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, Star, MapPin, DollarSign, Clock, CheckCircle, X, ChevronDown } from 'lucide-react';

function Search() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const workers = [
    {
      id: 1,
      name: 'Ahmed Ali',
      category: 'Nanny',
      rating: 4.9,
      reviewCount: 127,
      location: 'Cairo, Egypt',
      salary: 3500,
      availability: 'Available',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=100&h=100&fit=crop&crop=face',
      verified: true,
      skills: ['Childcare', 'First Aid', 'Teaching']
    },
    {
      id: 2,
      name: 'Mona Hassan',
      category: 'Elderly Caregiver',
      rating: 4.8,
      reviewCount: 89,
      location: 'Alexandria, Egypt',
      salary: 4200,
      availability: 'Available',
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=100&h=100&fit=crop&crop=face',
      verified: true,
      skills: ['Elderly Care', 'Medication', 'Companionship']
    },
    {
      id: 3,
      name: 'Khaled Mostafa',
      category: 'Driver',
      rating: 4.7,
      reviewCount: 156,
      location: 'Giza, Egypt',
      salary: 3800,
      availability: 'Part-Time',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      verified: true,
      skills: ['Driving', 'Navigation', 'Customer Service']
    },
    {
      id: 4,
      name: 'Sara Mahmoud',
      category: 'Cook',
      rating: 4.9,
      reviewCount: 203,
      location: 'Cairo, Egypt',
      salary: 4000,
      availability: 'Available',
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face',
      verified: true,
      skills: ['Cooking', 'Meal Planning', 'Food Safety']
    }
  ];

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Search Workers</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, category, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Filter size={18} />
              Filters
              {showFilters ? <ChevronDown size={18} className="rotate-180" /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option>All Categories</option>
                <option>Nanny</option>
                <option>Driver</option>
                <option>Cook</option>
                <option>Nurse</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option>All Locations</option>
                <option>Cairo</option>
                <option>Alexandria</option>
                <option>Giza</option>
              </select>
              <input
                type="number"
                placeholder="Min Salary"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <input
                type="number"
                placeholder="Max Salary"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">{filteredWorkers.length} workers found</p>
          <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500">
            <option>Sort by: Rating</option>
            <option>Sort by: Salary (Low to High)</option>
            <option>Sort by: Salary (High to Low)</option>
            <option>Sort by: Experience</option>
          </select>
        </div>

        {/* Workers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map((worker) => (
            <div key={worker.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition cursor-pointer">
              <div className="flex items-start gap-4">
                <img
                  src={worker.image}
                  alt={worker.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                    {worker.verified && <CheckCircle size={14} className="text-green-500" />}
                  </div>
                  <p className="text-sm text-gray-500">{worker.category}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{worker.rating}</span>
                    <span className="text-xs text-gray-400">({worker.reviewCount})</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} className="text-gray-400" />
                  {worker.location}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign size={14} className="text-gray-400" />
                  EGP {worker.salary.toLocaleString()}/month
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={14} className="text-gray-400" />
                  <span className={worker.availability === 'Available' ? 'text-green-600' : 'text-orange-500'}>
                    {worker.availability}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {worker.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(`/worker/${worker.id}`)}
                  className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                >
                  View Profile
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Search;