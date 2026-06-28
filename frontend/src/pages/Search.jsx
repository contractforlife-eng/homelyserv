import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, Filter, Star, MapPin, DollarSign, 
  Clock, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Sliders, Grid, List, Eye, MessageCircle, Heart,
  Share2, Award, Shield, Calendar, UserCheck,
  Briefcase, Users, Phone, Mail, Globe, Bookmark
} from 'lucide-react';

function Search() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Worker categories with icons
  const categories = [
    { id: 'all', label: 'All', icon: '👥', color: 'gray' },
    { id: 'babysitter', label: 'Babysitter', icon: '👶', color: 'pink' },
    { id: 'caregiver', label: 'Adult Caregiver', icon: '👴', color: 'blue' },
    { id: 'driver', label: 'Driver', icon: '🚗', color: 'green' },
    { id: 'cook', label: 'Cook', icon: '🍳', color: 'orange' },
    { id: 'house-manager', label: 'House Manager', icon: '🏠', color: 'purple' },
    { id: 'gardener', label: 'Gardener', icon: '🌿', color: 'green' },
    { id: 'nurse', label: 'Nurse', icon: '💉', color: 'blue' },
    { id: 'bodyguard', label: 'Bodyguard', icon: '🛡️', color: 'red' },
    { id: 'security', label: 'Security Guard', icon: '🔒', color: 'gray' }
  ];

  // Sample workers data
  const workers = [
    {
      id: 1,
      name: 'Ahmed Ali',
      category: 'babysitter',
      categoryLabel: 'Babysitter',
      rating: 4.9,
      reviewCount: 127,
      location: 'Cairo, Egypt',
      phone: '+201234567890',
      email: 'ahmed@example.com',
      salary: 3500,
      availability: 'Available',
      experience: 5,
      verified: true,
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=200&h=200&fit=crop&crop=face',
      skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking'],
      bio: 'Experienced nanny with 5 years of experience. Passionate about childcare and child development.'
    },
    {
      id: 2,
      name: 'Mona Hassan',
      category: 'caregiver',
      categoryLabel: 'Adult Caregiver',
      rating: 4.8,
      reviewCount: 89,
      location: 'Alexandria, Egypt',
      phone: '+201234567891',
      email: 'mona@example.com',
      salary: 4200,
      availability: 'Available',
      experience: 7,
      verified: true,
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=200&h=200&fit=crop&crop=face',
      skills: ['Elderly Care', 'Medication Management', 'Companionship', 'Physiotherapy'],
      bio: 'Dedicated elderly caregiver with 7 years of experience. Specialized in dementia and Alzheimer\'s care.'
    },
    {
      id: 3,
      name: 'Khaled Mostafa',
      category: 'driver',
      categoryLabel: 'Driver',
      rating: 4.7,
      reviewCount: 156,
      location: 'Giza, Egypt',
      phone: '+201234567892',
      email: 'khaled@example.com',
      salary: 3800,
      availability: 'Part-Time',
      experience: 10,
      verified: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      skills: ['Driving', 'Navigation', 'Car Maintenance', 'Customer Service'],
      bio: 'Professional driver with 10 years of experience. Safe and reliable transportation services.'
    },
    {
      id: 4,
      name: 'Sara Mahmoud',
      category: 'cook',
      categoryLabel: 'Cook',
      rating: 4.9,
      reviewCount: 203,
      location: 'Cairo, Egypt',
      phone: '+201234567893',
      email: 'sara@example.com',
      salary: 4000,
      availability: 'Available',
      experience: 8,
      verified: true,
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop&crop=face',
      skills: ['International Cuisine', 'Meal Planning', 'Dietary Restrictions', 'Food Safety'],
      bio: 'Professional cook specializing in international cuisine. Can accommodate dietary restrictions.'
    },
    {
      id: 5,
      name: 'Youssef Ibrahim',
      category: 'nurse',
      categoryLabel: 'Nurse',
      rating: 4.6,
      reviewCount: 67,
      location: 'Alexandria, Egypt',
      phone: '+201234567894',
      email: 'youssef@example.com',
      salary: 4500,
      availability: 'Available',
      experience: 6,
      verified: false,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
      skills: ['Patient Care', 'Vital Signs', 'Medication Administration', 'Emergency Response'],
      bio: 'Registered nurse with 6 years of experience in home care and hospital settings.'
    }
  ];

  // Filter and sort workers
  const filteredWorkers = workers
    .filter(worker => {
      const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || worker.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'salary-low':
          return a.salary - b.salary;
        case 'salary-high':
          return b.salary - a.salary;
        case 'experience':
          return b.experience - a.experience;
        default:
          return 0;
      }
    });

  const toggleSave = (workerId) => {
    setSavedWorkers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
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
              <Sliders size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                <input type="number" placeholder="EGP" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                <input type="number" placeholder="EGP" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option value="0">Any</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="part-time">Part-Time</option>
                  <option value="full-time">Full-Time</option>
                </select>
              </div>
            </div>
          )}
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
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Results Count & Sort */}
        <div className="flex flex-wrap justify-between items-center mb-4">
          <p className="text-gray-600">{filteredWorkers.length} workers found</p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500">Sort by:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="rating">Rating</option>
              <option value="salary-low">Salary (Low to High)</option>
              <option value="salary-high">Salary (High to Low)</option>
              <option value="experience">Experience</option>
            </select>
          </div>
        </div>

        {/* Workers Grid */}
        {filteredWorkers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No workers found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredWorkers.map((worker) => (
              <div 
                key={worker.id} 
                className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition ${
                  viewMode === 'list' ? 'flex flex-col sm:flex-row p-4' : 'p-4'
                }`}
              >
                {/* Image */}
                <div className={viewMode === 'list' ? 'sm:w-32 sm:flex-shrink-0' : ''}>
                  <div className="relative">
                    <img
                      src={worker.image}
                      alt={worker.name}
                      className={`rounded-lg object-cover ${
                        viewMode === 'list' ? 'w-full h-32' : 'w-full h-48'
                      }`}
                    />
                    {worker.verified && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 ${viewMode === 'list' ? 'sm:ml-4 mt-3 sm:mt-0' : 'mt-3'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{worker.name}</h3>
                      <p className="text-sm text-gray-500">{worker.categoryLabel}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{worker.rating}</span>
                      <span className="text-xs text-gray-400">({worker.reviewCount})</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin size={14} className="text-gray-400" />
                      {worker.location}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <DollarSign size={14} className="text-gray-400" />
                      EGP {worker.salary.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      worker.availability === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {worker.availability}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {worker.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                        {skill}
                      </span>
                    ))}
                    {worker.skills.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-400">
                        +{worker.skills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/worker/${worker.id}`)}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                    >
                      View Profile
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 transition">
                      <MessageCircle size={18} />
                    </button>
                    <button 
                      onClick={() => toggleSave(worker.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition"
                    >
                      {savedWorkers.includes(worker.id) ? (
                        <Bookmark size={18} className="text-red-600 fill-red-600" />
                      ) : (
                        <Bookmark size={18} />
                      )}
                    </button>
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

export default Search;
