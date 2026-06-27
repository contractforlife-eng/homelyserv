<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Grid,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  MessageCircle,
  Eye,
  Share2,
  Shield,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  TrendingUp,
  UserCheck,
  Building,
  Home,
  Plus,
  Minus,
  FileText
} from 'lucide-react';

const Search = () => {
=======
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

const CATEGORIES = ['All', 'Nanny', 'Baby-Sitter', 'Elderly Caregiver', 'Driver', 'Cook', 'House Manager', 'Gardener', 'Nurse'];

const COLORS = ['#C0392B', '#2C3E50', '#8E44AD', '#16A085', '#E67E22', '#2980B9', '#27AE60', '#D35400'];

export default function Search() {
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [savedWorkers, setSavedWorkers] = useState([]);
  
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: '',
    location: '',
    minSalary: '',
    maxSalary: '',
    minRating: 0,
    availability: 'all',
    workType: 'all',
    experienceMin: 0,
    experienceMax: 20,
    sortBy: 'rating',
    sortOrder: 'desc'
  });
=======
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('');
  const [availability, setAvailability] = useState('');
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4

  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  // Translations
  const translations = {
    en: {
      title: 'Find Professionals',
      subtitle: 'Search for the perfect worker for your needs',
      searchPlaceholder: 'Search by name, category, or location...',
      searchButton: 'Search',
      clearFilters: 'Clear Filters',
      showFilters: 'Show Filters',
      hideFilters: 'Hide Filters',
      results: 'Results',
      workersFound: 'workers found',
      noResults: 'No workers found matching your criteria',
      noResultsDesc: 'Try adjusting your search filters or check back later',
      view: 'View',
      grid: 'Grid',
      list: 'List',
      sortBy: 'Sort By',
      sortOptions: {
        rating: 'Rating',
        salary: 'Salary (Low to High)',
        salaryDesc: 'Salary (High to Low)',
        experience: 'Experience',
        relevance: 'Relevance'
      },
      filters: {
        category: 'Category',
        location: 'Location',
        salary: 'Salary Range',
        minSalary: 'Min Salary',
        maxSalary: 'Max Salary',
        rating: 'Minimum Rating',
        availability: 'Availability',
        workType: 'Work Type',
        experience: 'Experience Range',
        minExperience: 'Min Years',
        maxExperience: 'Max Years',
        all: 'All',
        available: 'Available',
        partTime: 'Part-Time',
        fullTime: 'Full-Time',
        contract: 'Contract',
        temporary: 'Temporary',
        notAvailable: 'Not Available'
      },
      workerCard: {
        viewProfile: 'View Profile',
        message: 'Message',
        save: 'Save',
        saved: 'Saved',
        share: 'Share',
        experience: 'Experience',
        salary: 'EGP/month',
        available: 'Available',
        partTime: 'Part-Time',
        fullTime: 'Full-Time',
        notAvailable: 'Not Available',
        rating: 'Rating',
        reviews: 'reviews',
        skills: 'Skills',
        verified: 'Verified',
        pending: 'Pending Verification',
        documents: 'Documents',
        hire: 'Hire Now'
      },
      languageToggle: 'العربية'
    },
    ar: {
      title: 'البحث عن محترفين',
      subtitle: 'ابحث عن العامل المثالي لاحتياجاتك',
      searchPlaceholder: 'بحث بالاسم أو الفئة أو الموقع...',
      searchButton: 'بحث',
      clearFilters: 'مسح الفلاتر',
      showFilters: 'إظهار الفلاتر',
      hideFilters: 'إخفاء الفلاتر',
      results: 'النتائج',
      workersFound: 'عاملاً',
      noResults: 'لا يوجد عمال مطابقين لمعايير البحث',
      noResultsDesc: 'حاول تعديل فلاتر البحث أو تحقق لاحقاً',
      view: 'عرض',
      grid: 'شبكة',
      list: 'قائمة',
      sortBy: 'ترتيب حسب',
      sortOptions: {
        rating: 'التقييم',
        salary: 'الراتب (من الأقل)',
        salaryDesc: 'الراتب (من الأعلى)',
        experience: 'الخبرة',
        relevance: 'الصلة'
      },
      filters: {
        category: 'الفئة',
        location: 'الموقع',
        salary: 'نطاق الراتب',
        minSalary: 'الحد الأدنى',
        maxSalary: 'الحد الأقصى',
        rating: 'الحد الأدنى للتقييم',
        availability: 'التوفر',
        workType: 'نوع العمل',
        experience: 'نطاق الخبرة',
        minExperience: 'الحد الأدنى للخبرة',
        maxExperience: 'الحد الأقصى للخبرة',
        all: 'الكل',
        available: 'متاح',
        partTime: 'دوام جزئي',
        fullTime: 'دوام كامل',
        contract: 'عقد',
        temporary: 'مؤقت',
        notAvailable: 'غير متاح'
      },
      workerCard: {
        viewProfile: 'عرض الملف الشخصي',
        message: 'رسالة',
        save: 'حفظ',
        saved: 'تم الحفظ',
        share: 'مشاركة',
        experience: 'خبرة',
        salary: 'جنيه/شهر',
        available: 'متاح',
        partTime: 'دوام جزئي',
        fullTime: 'دوام كامل',
        notAvailable: 'غير متاح',
        rating: 'التقييم',
        reviews: 'تقييمات',
        skills: 'المهارات',
        verified: 'موثق',
        pending: 'قيد التحقق',
        documents: 'مستندات',
        hire: 'توظيف الآن'
      },
      languageToggle: 'English'
    }
  };

  const t = translations[language];

<<<<<<< HEAD
  // Check language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  // Get query params from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    const category = params.get('category') || '';
    
    setSearchParams(prev => ({
      ...prev,
      query,
      category
    }));
  }, [location.search]);

  // Fetch workers data
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        // Demo data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const demoWorkers = [
          {
            id: 'w1',
            name: 'Ahmed Ali',
            category: 'nanny',
            categoryLabel: 'Nanny',
            rating: 4.9,
            reviewCount: 127,
            location: 'Cairo, Egypt',
            phone: '+201234567890',
            email: 'ahmed@example.com',
            salary: 3500,
            availability: 'available',
            workType: 'full-time',
            experienceYears: 5,
            verified: true,
            image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=400&h=400&fit=crop&crop=face',
            skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking'],
            bio: 'Experienced nanny with 5 years of experience.',
            documents: ['ID Card', 'Certificate'],
            experiences: [
              { employer: 'Smith Family', role: 'Nanny', duration: '2019-2021' }
            ],
            reviews: [
              { user: 'Sara M.', rating: 5, comment: 'Excellent nanny!', date: '2026-05-15' }
            ]
          },
          {
            id: 'w2',
            name: 'Mona Hassan',
            category: 'elderly-caregiver',
            categoryLabel: 'Elderly Caregiver',
            rating: 4.8,
            reviewCount: 89,
            location: 'Alexandria, Egypt',
            phone: '+201234567891',
            email: 'mona@example.com',
            salary: 4200,
            availability: 'available',
            workType: 'full-time',
            experienceYears: 7,
            verified: true,
            image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=400&h=400&fit=crop&crop=face',
            skills: ['Elderly Care', 'Medication Management'],
            bio: 'Dedicated elderly caregiver with 7 years of experience.',
            documents: ['ID Card', 'Caregiver License'],
            experiences: [
              { employer: 'Care Center', role: 'Caregiver', duration: '2017-2020' }
            ],
            reviews: [
              { user: 'Nadia I.', rating: 5, comment: 'Wonderful caregiver.', date: '2026-06-01' }
            ]
          }
        ];

        setWorkers(demoWorkers);
        setFilteredWorkers(demoWorkers);
        
        const uniqueCategories = [...new Set(demoWorkers.map(w => w.category))];
        const categoryLabels = uniqueCategories.map(cat => ({
          id: cat,
          label: categories.find(c => c.id === cat)?.label || cat
        }));
        setCategories(categoryLabels);
        
        const uniqueLocations = [...new Set(demoWorkers.map(w => w.location))];
        setLocations(uniqueLocations);
        
      } catch (error) {
        console.error('Error fetching workers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  // Filter and sort workers
  useEffect(() => {
    let filtered = [...workers];

    if (searchParams.query) {
      const queryLower = searchParams.query.toLowerCase();
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(queryLower) ||
        w.categoryLabel.toLowerCase().includes(queryLower) ||
        w.location.toLowerCase().includes(queryLower) ||
        w.skills.some(s => s.toLowerCase().includes(queryLower))
      );
    }

    if (searchParams.category) {
      filtered = filtered.filter(w => w.category === searchParams.category);
    }

    if (searchParams.location) {
      filtered = filtered.filter(w => w.location.toLowerCase().includes(searchParams.location.toLowerCase()));
    }

    if (searchParams.minSalary) {
      filtered = filtered.filter(w => w.salary >= parseInt(searchParams.minSalary));
    }
    if (searchParams.maxSalary) {
      filtered = filtered.filter(w => w.salary <= parseInt(searchParams.maxSalary));
    }

    if (searchParams.minRating > 0) {
      filtered = filtered.filter(w => w.rating >= searchParams.minRating);
    }

    if (searchParams.availability !== 'all') {
      filtered = filtered.filter(w => w.availability === searchParams.availability);
    }

    if (searchParams.workType !== 'all') {
      filtered = filtered.filter(w => w.workType === searchParams.workType);
    }

    setFilteredWorkers(filtered);
  }, [workers, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchParams.query) params.append('q', searchParams.query);
    if (searchParams.category) params.append('category', searchParams.category);
    navigate(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchParams({
      query: '',
      category: '',
      location: '',
      minSalary: '',
      maxSalary: '',
      minRating: 0,
      availability: 'all',
      workType: 'all',
      experienceMin: 0,
      experienceMax: 20,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  };

  const toggleSaveWorker = (workerId) => {
    setSavedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const getAvailabilityLabel = (availability) => {
    const labels = {
      available: t.workerCard.available,
      'part-time': t.workerCard.partTime,
      'full-time': t.workerCard.fullTime,
      'not-available': t.workerCard.notAvailable
    };
    return labels[availability] || availability;
  };

  const getAvailabilityColor = (availability) => {
    const colors = {
      available: 'text-green-600 bg-green-100',
      'part-time': 'text-orange-600 bg-orange-100',
      'full-time': 'text-blue-600 bg-blue-100',
      'not-available': 'text-red-600 bg-red-100'
    };
    return colors[availability] || 'text-gray-600 bg-gray-100';
  };

  const isRTL = language === 'ar';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workers...</p>
        </div>
      </div>
    );
  }

=======
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm bg-white"
            >
              <Globe size={16} className="text-gray-600" />
              <span className="font-medium">{t.languageToggle}</span>
            </button>
            <span className="text-sm text-gray-500">
              {filteredWorkers.length} {t.workersFound}
            </span>
          </div>
        </div>

<<<<<<< HEAD
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchParams.query}
                onChange={(e) => setSearchParams(prev => ({ ...prev, query: e.target.value }))}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {t.searchButton}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter size={18} />
              {showFilters ? t.hideFilters : t.showFilters}
            </button>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.category}
                </label>
                <select
                  value={searchParams.category}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.location}
                </label>
                <select
                  value={searchParams.location}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.minSalary}
                </label>
                <input
                  type="number"
                  value={searchParams.minSalary}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, minSalary: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="EGP"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.maxSalary}
                </label>
                <input
                  type="number"
                  value={searchParams.maxSalary}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, maxSalary: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="EGP"
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t.clearFilters}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {filteredWorkers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noResults}</h3>
            <p className="text-gray-500">{t.noResultsDesc}</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t.clearFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <div key={worker.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-4">
                <div className="relative">
                  <img
                    src={worker.image}
                    alt={worker.name}
                    className="w-full h-48 rounded-lg object-cover"
                  />
                  {worker.verified && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <CheckCircle size={14} className="text-white" />
                    </div>
=======
      {/* Search bar */}
      <div style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid #E0E0E0', display: 'flex', gap: '8px' }}>
        <input
          value={city} onChange={e => setCity(e.target.value)}
          placeholder="Search by city..."
          style={{ flex: 1, padding: '9px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
        />
        <button onClick={fetchWorkers}
          style={{ padding: '9px 18px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          Search
        </button>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              background: category === cat ? '#C0392B' : '#fff',
              color: category === cat ? '#fff' : '#444',
              border: category === cat ? '1px solid #C0392B' : '1px solid #E0E0E0'
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Availability filter */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>Availability:</span>
        {['', 'available', 'busy'].map(a => (
          <button key={a} onClick={() => setAvailability(a)}
            style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
              background: availability === a ? '#1A1A1A' : '#fff',
              color: availability === a ? '#fff' : '#444',
              border: availability === a ? '1px solid #1A1A1A' : '1px solid #E0E0E0'
            }}>
            {a === '' ? 'All' : a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding: '0 16px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading workers...</div>
        ) : workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No workers found. Try different filters.</div>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{workers.length} workers found</div>
            {workers.map(worker => (
              <div key={worker.id} onClick={() => navigate(`/worker/${worker.id}`)}
                style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '10px', cursor: 'pointer', border: '1px solid #E0E0E0', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: getColor(worker.user?.fullName), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                  {getInitials(worker.user?.fullName)}
                </div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1A1A1A', fontSize: '15px' }}>{worker.user?.fullName}</div>
                  <div style={{ fontSize: '12px', color: '#888', margin: '2px 0 6px' }}>{worker.category} · {worker.experienceYears} yrs exp · {worker.user?.city}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {worker.skills?.slice(0, 3).map(skill => (
                      <span key={skill} style={{ background: '#F5F5F5', color: '#444', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{skill}</span>
                    ))}
                  </div>
                </div>
                {/* Right */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: '700', color: '#C0392B', fontSize: '14px' }}>EGP {worker.expectedSalary?.toLocaleString()}/mo</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', color: worker.availability === 'available' ? '#27AE60' : '#E67E22', fontWeight: '500' }}>
                    ● {worker.availability}
                  </div>
                  {worker.ratingAvg > 0 && (
                    <div style={{ fontSize: '11px', color: '#F39C12', marginTop: '2px' }}>★ {worker.ratingAvg.toFixed(1)}</div>
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
                  )}
                </div>
                <div className="mt-3">
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
                      {worker.salary.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getAvailabilityColor(worker.availability)}`}>
                      {getAvailabilityLabel(worker.availability)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Link
                      to={`/worker/${worker.id}`}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors text-center"
                    >
                      {t.workerCard.viewProfile}
                    </Link>
                    <button
                      onClick={() => toggleSaveWorker(worker.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
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
};

export default Search;
