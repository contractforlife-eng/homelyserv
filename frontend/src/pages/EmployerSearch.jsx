import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Star, MapPin, DollarSign, Clock, 
  CheckCircle, XCircle, Eye, MessageCircle, Heart,
  Share2, Award, Shield, Briefcase, Calendar, User,
  Phone, Mail, Bookmark, BookmarkCheck, ChevronDown,
  ChevronUp, Sliders, Grid, List, Users, Building,
  Home, Car, Utensils, Heart as HeartIcon, Shield as ShieldIcon,
  Sprout, Activity, Lock, Plus, Minus, X
} from 'lucide-react';

function EmployerSearch() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [filters, setFilters] = useState({
    minSalary: '',
    maxSalary: '',
    minRating: 0,
    availability: 'all',
    experience: 'all'
  });

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

  // Worker categories with icons
  const categories = [
    { id: 'all', label: 'All', icon: <Users size={20} />, color: 'gray' },
    { id: 'babysitter', label: 'Babysitter', icon: <User size={20} />, color: 'pink' },
    { id: 'caregiver', label: 'Caregiver', icon: <HeartIcon size={20} />, color: 'blue' },
    { id: 'driver', label: 'Driver', icon: <Car size={20} />, color: 'green' },
    { id: 'cook', label: 'Cook', icon: <Utensils size={20} />, color: 'orange' },
    { id: 'house-manager', label: 'House Manager', icon: <Home size={20} />, color: 'purple' },
    { id: 'gardener', label: 'Gardener', icon: <Sprout size={20} />, color: 'green' },
    { id: 'nurse', label: 'Nurse', icon: <Activity size={20} />, color: 'blue' },
    { id: 'bodyguard', label: 'Bodyguard', icon: <ShieldIcon size={20} />, color: 'red' },
    { id: 'security', label: 'Security Guard', icon: <Lock size={20} />, color: 'gray' }
  ];

  // Sample workers data - real accurate information
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
      email: 'ahmed.ali@homelyserv.com',
      salary: 3500,
      availability: 'Available',
      experience: 5,
      verified: true,
      age: 28,
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=200&h=200&fit=crop&crop=face',
      skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking'],
      bio: 'Experienced nanny with 5 years of experience. Passionate about childcare and child development.',
      languages: ['English', 'Arabic'],
      education: 'Bachelor Degree in Early Childhood Education',
      documents: ['ID Card', 'Certificate', 'First Aid']
    },
    {
      id: 2,
      name: 'Mona Hassan',
      category: 'caregiver',
      categoryLabel: 'Caregiver',
      rating: 4.8,
      reviewCount: 89,
      location: 'Alexandria, Egypt',
      phone: '+201234567891',
      email: 'mona.hassan@homelyserv.com',
      salary: 4200,
      availability: 'Available',
      experience: 7,
      verified: true,
      age: 45,
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=200&h=200&fit=crop&crop=face',
      skills: ['Elderly Care', 'Medication Management', 'Companionship', 'Physiotherapy'],
      bio: 'Dedicated elderly caregiver with 7 years of experience. Specialized in dementia and Alzheimer\'s care.',
      languages: ['English', 'Arabic'],
      education: 'Nursing Diploma',
      documents: ['ID Card', 'License', 'Certificate']
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
      email: 'khaled.mostafa@homelyserv.com',
      salary: 3800,
      availability: 'Part-Time',
      experience: 10,
      verified: true,
      age: 35,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      skills: ['Driving', 'Navigation', 'Car Maintenance', 'Customer Service'],
      bio: 'Professional driver with 10 years of experience. Safe and reliable transportation services.',
      languages: ['English', 'Arabic'],
      education: 'High School',
      documents: ['ID Card', 'License', 'Certificate']
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
      email: 'sara.mahmoud@homelyserv.com',
      salary: 4000,
      availability: 'Available',
      experience: 8,
      verified: true,
      age: 32,
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop&crop=face',
      skills: ['International Cuisine', 'Meal Planning', 'Dietary Restrictions', 'Food Safety'],
      bio: 'Professional cook specializing in international cuisine. Can accommodate dietary restrictions.',
      languages: ['English', 'Arabic', 'French'],
      education: 'Culinary Arts Degree',
      documents: ['ID Card', 'Certificate', 'Food Safety']
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
      
      const matchesMinSalary = !filters.minSalary || worker.salary >= parseInt(filters.minSalary);
      const matchesMaxSalary = !filters.maxSalary || worker.salary <= parseInt(filters.maxSalary);
      const matchesRating = !filters.minRating || worker.rating >= filters.minRating;
      const matchesAvailability = filters.availability === 'all' || worker.availability === filters.availability;
      const matchesExperience = filters.experience === 'all' || 
        (filters.experience === '0-2' && worker.experience <= 2) ||
        (filters.experience === '3-5' && worker.experience >= 3 && worker.experience <= 5) ||
        (filters.experience === '6-10' && worker.experience >= 6 && worker.experience <= 10) ||
        (filters.experience === '10+' && worker.experience > 10);
      
      return matchesSearch && matchesCategory && matchesMinSalary && 
        matchesMaxSalary && matchesRating && matchesAvailability && matchesExperience;
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

  const handleWorkerClick = (worker) => {
    setSelectedWorker(worker);
    setShowWorkerModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/employer-dashboard" className="text-gray-600 hover:text-red-600 transition">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Find Workers</h1>
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
            <span className="text-sm text-gray-500">{filteredWorkers.length} workers found</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, category, location, or skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Sliders size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="rating">Sort by Rating</option>
              <option value="salary-low">Salary: Low to High</option>
              <option value="salary-high">Salary: High to Low</option>
              <option value="experience">Sort by Experience</option>
            </select>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                <input
                  type="number"
                  placeholder="EGP"
                  value={filters.minSalary}
                  onChange={(e) => setFilters({...filters, minSalary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                <input
                  type="number"
                  placeholder="EGP"
                  value={filters.maxSalary}
                  onChange={(e) => setFilters({...filters, maxSalary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({...filters, minRating: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="0">Any</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All</option>
                  <option value="Available">Available</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Full-Time">Full-Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                <select
                  value={filters.experience}
                  onChange={(e) => setFilters({...filters, experience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
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
              {cat.icon}
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
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
                className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer ${
                  viewMode === 'list' ? 'flex flex-col sm:flex-row p-4' : 'p-4'
                }`}
                onClick={() => handleWorkerClick(worker)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkerClick(worker);
                      }}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/worker/${worker.id}`);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition"
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(worker.id);
                      }}
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

      {/* Worker Detail Modal */}
      {showWorkerModal && selectedWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Worker Profile</h2>
              <button onClick={() => setShowWorkerModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Worker Info */}
            <div className="flex items-start gap-4 mb-4">
              <img src={selectedWorker.image} alt={selectedWorker.name} className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800">{selectedWorker.name}</h3>
                <p className="text-gray-500">{selectedWorker.categoryLabel} • {selectedWorker.age} years old</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{selectedWorker.rating}</span>
                  <span className="text-xs text-gray-400">({selectedWorker.reviewCount} reviews)</span>
                  {selectedWorker.verified && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" /> {selectedWorker.location}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <DollarSign size={14} className="text-gray-400" /> EGP {selectedWorker.salary.toLocaleString()}/month
                  </span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Briefcase size={14} className="text-gray-400" /> {selectedWorker.experience} years
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">{selectedWorker.phone}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{selectedWorker.email}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Languages</p>
                <p className="font-medium text-gray-800">{selectedWorker.languages.join(', ')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Education</p>
                <p className="font-medium text-gray-800">{selectedWorker.education}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Bio</p>
              <p className="text-gray-700">{selectedWorker.bio}</p>
            </div>

            {/* Skills */}
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Skills</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedWorker.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Documents</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedWorker.documents.map((doc, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2">
                <Briefcase size={18} /> Hire Now
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <MessageCircle size={18} /> Message
              </button>
              <button 
                onClick={() => {
                  const phone = selectedWorker.phone.replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${phone}`, '_blank');
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <span>💬</span> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployerSearch;