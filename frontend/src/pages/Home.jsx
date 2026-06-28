<<<<<<< HEAD
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Star, 
  Users, 
  CheckCircle, 
  Shield,
  Clock,
  MapPin,
  DollarSign,
  Award,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
=======
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4

const Home = () => {
  const navigate = useNavigate();
<<<<<<< HEAD
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Service categories from the spec
  const categories = [
    { id: 'nanny', label: 'Nanny', icon: '👶' },
    { id: 'baby-sitter', label: 'Baby-Sitter', icon: '🧒' },
    { id: 'elderly-caregiver', label: 'Elderly Caregiver', icon: '👴' },
    { id: 'driver', label: 'Driver', icon: '🚗' },
    { id: 'cook', label: 'Cook', icon: '🍳' },
    { id: 'house-manager', label: 'House Manager', icon: '🏠' },
    { id: 'gardener', label: 'Gardener', icon: '🌿' },
    { id: 'nurse', label: 'Nurse', icon: '💉' }
  ];

  // Sample top-rated workers (would be fetched from API in production)
  const topWorkers = [
    {
      id: 1,
      name: 'Ahmed Ali',
      category: 'Nanny',
      rating: 4.9,
      location: 'Cairo, Egypt',
      salary: 3500,
      availability: 'Available',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Mona Hassan',
      category: 'Elderly Caregiver',
      rating: 4.8,
      location: 'Alexandria, Egypt',
      salary: 4200,
      availability: 'Available',
      image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 3,
      name: 'Khaled Mostafa',
      category: 'Driver',
      rating: 4.7,
      location: 'Giza, Egypt',
      salary: 3800,
      availability: 'Part-time',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 4,
      name: 'Sara Mahmoud',
      category: 'Cook',
      rating: 4.9,
      location: 'Cairo, Egypt',
      salary: 4000,
      availability: 'Available',
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face'
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to search results with query params
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (selectedCategory) params.append('category', selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    navigate(`/search?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Find Trusted <br className="sm:hidden" />
              <span className="text-yellow-300">Home Services</span>
            </h1>
            <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto">
              Connect with verified professionals for your home care needs
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search for a service or professional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                />
              </div>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-48 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800 appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Search size={20} />
                Search
              </button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-center">
            <div>
              <div className="text-2xl font-bold">2,500+</div>
              <div className="text-red-200 text-sm">Verified Professionals</div>
            </div>
            <div>
              <div className="text-2xl font-bold">1,200+</div>
              <div className="text-red-200 text-sm">Successful Hires</div>
            </div>
            <div>
              <div className="text-2xl font-bold">98%</div>
              <div className="text-red-200 text-sm">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Browse Services</h2>
          <Link to="/search" className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
            View all <ArrowRight size={18} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl p-4 text-center transition-all duration-200 group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                {category.label}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Top Rated Workers */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Top Rated Professionals</h2>
            <Link to="/search" className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
              See all <ChevronRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topWorkers.map((worker) => (
              <div
                key={worker.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-100"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={worker.image}
                      alt={worker.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{worker.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{worker.category}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{worker.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} className="text-gray-400" />
                      <span>{worker.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign size={14} className="text-gray-400" />
                      <span>EGP {worker.salary.toLocaleString()}/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className={`font-medium ${worker.availability === 'Available' ? 'text-green-600' : 'text-orange-500'}`}>
                        {worker.availability}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/worker/${worker.id}`}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg block text-center transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Verification Banner */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <Shield size={28} className="text-red-600" />
                  <h3 className="text-xl font-bold text-gray-800">Verified & Trusted</h3>
                </div>
                <p className="text-gray-600">
                  All professionals are identity verified, background checked, and reviewed by real employers.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={18} className="text-green-500" />
                    <span className="text-sm text-gray-700">Identity Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={18} className="text-green-500" />
                    <span className="text-sm text-gray-700">Document Check</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={18} className="text-green-500" />
                    <span className="text-sm text-gray-700">Rating System</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-white rounded-full p-4 shadow-md">
                  <Users size={48} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Create Profile</h3>
              <p className="text-gray-600 text-sm">
                Job seekers create detailed profiles with experience, documents, and availability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">2. Search & Match</h3>
              <p className="text-gray-600 text-sm">
                Employers find the perfect match based on category, location, salary, and ratings.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={28} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">3. Hire & Review</h3>
              <p className="text-gray-600 text-sm">
                Connect, hire, and leave reviews. Commission is paid only on successful hire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find the Perfect Professional?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied employers and professionals. Start your search today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/search"
              className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Browse Professionals
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            No registration fees. Pay commission only on successful hire.
          </p>
        </div>
      </section>
=======

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const switchRole = async () => {
    const newRole = user?.role === 'WORKER' ? 'EMPLOYER' : 'WORKER';
    const confirm = window.confirm(`Switch your account to ${newRole}?`);
    if (!confirm) return;

    try {
      const res = await api.put('/auth/switch-role', { role: newRole });
      const updatedUser = { ...user, role: newRole };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
      toast.success(`Switched to ${newRole} successfully!`);
    } catch (err) {
      toast.error('Failed to switch role');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <div style={{ background: '#C0392B', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>HomelyServ</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#ffcdd2', fontSize: '14px' }}>{user?.fullName}</span>
          <button onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '6px' }}>
          Welcome, {user?.fullName}!
        </h2>
        <p style={{ color: '#888', marginBottom: '24px' }}>What would you like to do today?</p>

        {user?.role === 'WORKER' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/worker-profile')}
              style={{ background: '#fff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#FDECEA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div>
              <div>
                <div style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '2px' }}>My Profile</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Update your skills, salary and availability</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#C0392B', fontSize: '20px' }}>›</span>
            </div>

            <div onClick={() => navigate('/my-hires')}
              style={{ background: '#fff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#FDECEA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📋</div>
              <div>
                <div style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '2px' }}>My Job Offers</div>
                <div style={{ fontSize: '13px', color: '#888' }}>View offers from employers</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#C0392B', fontSize: '20px' }}>›</span>
            </div>
          </div>
        )}

        {user?.role === 'EMPLOYER' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/search')}
              style={{ background: '#C0392B', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔍</div>
              <div>
                <div style={{ fontWeight: '600', color: '#fff', marginBottom: '2px' }}>Find Workers</div>
                <div style={{ fontSize: '13px', color: '#ffcdd2' }}>Search nannies, drivers, cooks and more</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#fff', fontSize: '20px' }}>›</span>
            </div>

            <div onClick={() => navigate('/my-hires')}
              style={{ background: '#fff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#FDECEA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📋</div>
              <div>
                <div style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '2px' }}>My Hires</div>
                <div style={{ fontSize: '13px', color: '#888' }}>View your hiring history and payments</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#C0392B', fontSize: '20px' }}>›</span>
            </div>
          </div>
        )}

        {user?.role === 'ADMIN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/admin')}
              style={{ background: '#2C3E50', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📊</div>
              <div>
                <div style={{ fontWeight: '600', color: '#fff', marginBottom: '2px' }}>Admin Dashboard</div>
                <div style={{ fontSize: '13px', color: '#bdc3c7' }}>Manage hires, payments and users</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#fff', fontSize: '20px' }}>›</span>
            </div>
          </div>
        )}

        {/* Switch Role - only for WORKER and EMPLOYER */}
        {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
          <div style={{ marginTop: '24px', borderTop: '1px solid #E0E0E0', paddingTop: '20px' }}>
            <div onClick={switchRole}
              style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#F0F0F0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔄</div>
              <div>
                <div style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '2px' }}>
                  Switch to {user?.role === 'WORKER' ? 'Employer' : 'Worker'} account
                </div>
                <div style={{ fontSize: '13px', color: '#888' }}>
                  {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
                </div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#888', fontSize: '20px' }}>›</span>
            </div>
          </div>
        )}
      </div>
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
    </div>
  );
};

export default Home;
