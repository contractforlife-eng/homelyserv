import React, { useState, useEffect, useCallback } from 'react';
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
  Sliders,
  Grid,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Phone,
  Mail,
  MessageCircle,
  Eye,
  Heart,
  Share2,
  Award,
  Shield,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  UserCheck,
  Clock as ClockIcon,
  Building,
  Home,
  Menu,
  Plus,
  Minus
} from 'lucide-react';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [savedWorkers, setSavedWorkers] = useState([]);
  
  // Search state
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
      workerModal: {
        close: 'Close',
        contact: 'Contact',
        sendMessage: 'Send Message',
        hireNow: 'Hire Now',
        saveProfile: 'Save Profile',
        shareProfile: 'Share Profile',
        personalInfo: 'Personal Information',
        workDetails: 'Work Details',
        experience: 'Experience',
        skills: 'Skills',
        documents: 'Documents',
        reviews: 'Reviews',
        about: 'About',
        location: 'Location',
        phone: 'Phone',
        email: 'Email',
        availability: 'Availability',
        workType: 'Work Type',
        salary: 'Expected Salary',
        category: 'Category',
        yearsExperience: 'Years of Experience',
        verifiedStatus: 'Verification Status',
        noReviews: 'No reviews yet',
        noDocuments: 'No documents uploaded',
        noExperience: 'No experience listed',
        report: 'Report Profile'
      },
      noCategory: 'All Categories',
      noLocation: 'All Locations',
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
      workerModal: {
        close: 'إغلاق',
        contact: 'اتصال',
        sendMessage: 'إرسال رسالة',
        hireNow: 'توظيف الآن',
        saveProfile: 'حفظ الملف الشخصي',
        shareProfile: 'مشاركة الملف الشخصي',
        personalInfo: 'معلومات شخصية',
        workDetails: 'تفاصيل العمل',
        experience: 'الخبرات',
        skills: 'المهارات',
        documents: 'المستندات',
        reviews: 'التقييمات',
        about: 'نبذة',
        location: 'الموقع',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        availability: 'التوفر',
        workType: 'نوع العمل',
        salary: 'الراتب المتوقع',
        category: 'الفئة',
        yearsExperience: 'سنوات الخبرة',
        verifiedStatus: 'حالة التحقق',
        noReviews: 'لا توجد تقييمات بعد',
        noDocuments: 'لا توجد مستندات مرفوعة',
        noExperience: 'لا توجد خبرات مسجلة',
        report: 'الإبلاغ عن الملف'
      },
      noCategory: 'جميع الفئات',
      noLocation: 'جميع المواقع',
      languageToggle: 'English'
    }
  };

  const t = translations[language];

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

  // Check language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Toggle language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  // Fetch workers data
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await fetch('/api/workers?' + new URLSearchParams(searchParams));
        // const data = await response.json();
        
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
            bio: 'Experienced nanny with 5 years of experience. Passionate about childcare and child development.',
            documents: ['ID Card', 'Certificate', 'First Aid'],
            experiences: [
              { employer: 'Smith Family', role: 'Nanny', duration: '2019-2021' },
              { employer: 'Johnson Family', role: 'Nanny', duration: '2021-2024' }
            ],
            reviews: [
              { user: 'Sara M.', rating: 5, comment: 'Excellent nanny! Highly recommended.', date: '2026-05-15' },
              { user: 'Khaled R.', rating: 4, comment: 'Great with children, very reliable.', date: '2026-04-20' }
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
            skills: ['Elderly Care', 'Medication Management', 'Companionship', 'Physiotherapy'],
            bio: 'Dedicated elderly caregiver with 7 years of experience. Specialized in dementia and Alzheimer\'s care.',
            documents: ['ID Card', 'Caregiver License', 'Medical Certificate'],
            experiences: [
              { employer: 'Alzheimer\'s Care Center', role: 'Caregiver', duration: '2017-2020' },
              { employer: 'Home Care Agency', role: 'Senior Caregiver', duration: '2020-2024' }
            ],
            reviews: [
              { user: 'Nadia I.', rating: 5, comment: 'Wonderful caregiver, very patient and kind.', date: '2026-06-01' }
            ]
          },
          {
            id: 'w3',
            name: 'Khaled Mostafa',
            category: 'driver',
            categoryLabel: 'Driver',
            rating: 4.7,
            reviewCount: 156,
            location: 'Giza, Egypt',
            phone: '+201234567892',
            email: 'khaled@example.com',
            salary: 3800,
            availability: 'part-time',
            workType: 'part-time',
            experienceYears: 10,
            verified: true,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            skills: ['Driving', 'Navigation', 'Car Maintenance', 'Customer Service'],
            bio: 'Professional driver with 10 years of experience. Safe and reliable transportation services.',
            documents: ['ID Card', 'Driver License', 'Vehicle Registration'],
            experiences: [
              { employer: 'Uber Egypt', role: 'Driver', duration: '2014-2018' },
              { employer: 'Private Family', role: 'Personal Driver', duration: '2018-2024' }
            ],
            reviews: [
              { user: 'Omar K.', rating: 5, comment: 'Always on time, very professional.', date: '2026-05-28' },
              { user: 'Layla A.', rating: 4, comment: 'Good driver, knows the city well.', date: '2026-05-10' }
            ]
          },
          {
            id: 'w4',
            name: 'Sara Mahmoud',
            category: 'cook',
            categoryLabel: 'Cook',
            rating: 4.9,
            reviewCount: 203,
            location: 'Cairo, Egypt',
            phone: '+201234567893',
            email: 'sara@example.com',
            salary: 4000,
            availability: 'available',
            workType: 'full-time',
            experienceYears: 8,
            verified: true,
            image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
            skills: ['International Cuisine', 'Meal Planning', 'Dietary Restrictions', 'Food Safety'],
            bio: 'Professional cook specializing in international cuisine. Can accommodate dietary restrictions.',
            documents: ['ID Card', 'Culinary Certificate', 'Food Safety'],
            experiences: [
              { employer: 'Fine Dining Restaurant', role: 'Head Cook', duration: '2016-2019' },
              { employer: 'Private Chef', role: 'Personal Chef', duration: '2019-2024' }
            ],
            reviews: [
              { user: 'Hassan M.', rating: 5, comment: 'Amazing cook! Every meal was delicious.', date: '2026-06-10' },
              { user: 'Yasmin R.', rating: 5, comment: 'Professional and creative in the kitchen.', date: '2026-05-25' }
            ]
          },
          {
            id: 'w5',
            name: 'Youssef Ibrahim',
            category: 'nurse',
            categoryLabel: 'Nurse',
            rating: 4.6,
            reviewCount: 67,
            location: 'Alexandria, Egypt',
            phone: '+201234567894',
            email: 'youssef@example.com',
            salary: 4500,
            availability: 'available',
            workType: 'contract',
            experienceYears: 6,
            verified: false,
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
            skills: ['Patient Care', 'Vital Signs', 'Medication Administration', 'Emergency Response'],
            bio: 'Registered nurse with 6 years of experience in home care and hospital settings.',
            documents: ['ID Card', 'Nursing License', 'BLS Certification'],
            experiences: [
              { employer: 'Alexandria Hospital', role: 'Staff Nurse', duration: '2018-2021' },
              { employer: 'Home Health Care', role: 'Nurse', duration: '2021-2024' }
            ],
            reviews: [
              { user: 'Ahmed H.', rating: 5, comment: 'Professional and caring nurse.', date: '2026-06-05' },
              { user: 'Mona S.', rating: 4, comment: 'Good care and attention to detail.', date: '2026-05-15' }
            ]
          },
          {
            id: 'w6',
            name: 'Nadia Ibrahim',
            category: 'house-manager',
            categoryLabel: 'House Manager',
            rating: 4.8,
            reviewCount: 112,
            location: 'Cairo, Egypt',
            phone: '+201234567895',
            email: 'nadia@example.com',
            salary: 5000,
            availability: 'not-available',
            workType: 'full-time',
            experienceYears: 12,
            verified: true,
            image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
            skills: ['House Management', 'Staff Supervision', 'Budgeting', 'Event Planning'],
            bio: 'Experienced house manager with 12 years of experience managing large households.',
            documents: ['ID Card', 'Management Certificate'],
            experiences: [
              { employer: 'Private Estate', role: 'House Manager', duration: '2012-2018' },
              { employer: 'VIP Family', role: 'Senior House Manager', duration: '2018-2024' }
            ],
            reviews: [
              { user: 'Sultan A.', rating: 5, comment: 'Exceptional management skills.', date: '2026-05-30' }
            ]
          }
        ];

        setWorkers(demoWorkers);
        setFilteredWorkers(demoWorkers);
        
        // Extract categories and locations
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

    // Search query
    if (searchParams.query) {
      const queryLower = searchParams.query.toLowerCase();
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(queryLower) ||
        w.categoryLabel.toLowerCase().includes(queryLower) ||
        w.location.toLowerCase().includes(queryLower) ||
        w.skills.some(s => s.toLowerCase().includes(queryLower))
      );
    }

    // Category
    if (searchParams.category) {
      filtered = filtered.filter(w => w.category === searchParams.category);
    }

    // Location
    if (searchParams.location) {
      filtered = filtered.filter(w => w.location.toLowerCase().includes(searchParams.location.toLowerCase()));
    }

    // Salary range
    if (searchParams.minSalary) {
      filtered = filtered.filter(w => w.salary >= parseInt(searchParams.minSalary));
    }
    if (searchParams.maxSalary) {
      filtered = filtered.filter(w => w.salary <= parseInt(searchParams.maxSalary));
    }

    // Rating
    if (searchParams.minRating > 0) {
      filtered = filtered.filter(w => w.rating >= searchParams.minRating);
    }

    // Availability
    if (searchParams.availability !== 'all') {
      filtered = filtered.filter(w => w.availability === searchParams.availability);
    }

    // Work type
    if (searchParams.workType !== 'all') {
      filtered = filtered.filter(w => w.workType === searchParams.workType);
    }

    // Experience range
    if (searchParams.experienceMin > 0) {
      filtered = filtered.filter(w => w.experienceYears >= searchParams.experienceMin);
    }
    if (searchParams.experienceMax < 20) {
      filtered = filtered.filter(w => w.experienceYears <= searchParams.experienceMax);
    }

    // Sort
    switch (searchParams.sortBy) {
      case 'rating':
        filtered.sort((a, b) => searchParams.sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating);
        break;
      case 'salary':
        filtered.sort((a, b) => a.salary - b.salary);
        break;
      case 'salaryDesc':
        filtered.sort((a, b) => b.salary - a.salary);
        break;
      case 'experience':
        filtered.sort((a, b) => b.experienceYears - a.experienceYears);
        break;
      default:
        break;
    }

    setFilteredWorkers(filtered);
  }, [workers, searchParams]);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    // Update URL with search params
    const params = new URLSearchParams();
    if (searchParams.query) params.append('q', searchParams.query);
    if (searchParams.category) params.append('category', searchParams.category);
    navigate(`/search?${params.toString()}`);
  };

  // Clear all filters
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

  // Handle worker save
  const toggleSaveWorker = (workerId) => {
    setSavedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  // Handle worker click
  const handleWorkerClick = (worker) => {
    setSelectedWorker(worker);
    setShowWorkerModal(true);
  };

  // Get availability label
  const getAvailabilityLabel = (availability) => {
    const labels = {
      available: t.workerCard.available,
      'part-time': t.workerCard.partTime,
      'full-time': t.workerCard.fullTime,
      'not-available': t.workerCard.notAvailable
    };
    return labels[availability] || availability;
  };

  // Get availability color
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
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.category}
                </label>
                <select
                  value={searchParams.category}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">{t.noCategory}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.location}
                </label>
                <select
                  value={searchParams.location}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">{t.noLocation}</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Min Salary */}
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

              {/* Max Salary */}
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

              {/* Min Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.rating}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={searchParams.minRating}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium min-w-[40px]">
                    {searchParams.minRating}+
                  </span>
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.availability}
                </label>
                <select
                  value={searchParams.availability}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="available">{t.filters.available}</option>
                  <option value="part-time">{t.filters.partTime}</option>
                  <option value="full-time">{t.filters.fullTime}</option>
                  <option value="not-available">{t.filters.notAvailable}</option>
                </select>
              </div>

              {/* Work Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.workType}
                </label>
                <select
                  value={searchParams.workType}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, workType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="full-time">{t.filters.fullTime}</option>
                  <option value="part-time">{t.filters.partTime}</option>
                  <option value="contract">{t.filters.contract}</option>
                  <option value="temporary">{t.filters.temporary}</option>
                </select>
              </div>

              {/* Experience Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.filters.experience}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={searchParams.experienceMin}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, experienceMin: parseInt(e.target.value) || 0 }))}
                    className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={t.filters.minExperience}
                    min="0"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={searchParams.experienceMax}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, experienceMax: parseInt(e.target.value) || 20 }))}
                    className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={t.filters.maxExperience}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
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

        {/* Sort and View Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">{t.sortBy}:</label>
            <select
              value={searchParams.sortBy}
              onChange={(e) => setSearchParams(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="rating">{t.sortOptions.rating}</option>
              <option value="salary">{t.sortOptions.salary}</option>
              <option value="salaryDesc">{t.sortOptions.salaryDesc}</option>
              <option value="experience">{t.sortOptions.experience}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={t.grid}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={t.list}
            >
              <List size={18} />
            </button>
          </div>
        </div>

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
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredWorkers.map((worker) => (
              <div
                key={worker.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex flex-col sm:flex-row p-4' : 'p-4'
                }`}
              >
                {/* Image */}
                <div className={`${viewMode === 'list' ? 'sm:w-32 sm:flex-shrink-0' : ''}`}>
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
                      {worker.salary.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getAvailabilityColor(worker.availability)}`}>
                      {getAvailabilityLabel(worker.availability)}
                    </span>
                  </div>

                  {viewMode === 'grid' && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {worker.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {skill}
                        </span>
                      ))}
                      {worker.skills.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-400">
                          +{worker.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleWorkerClick(worker)}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      {t.workerCard.viewProfile}
                    </button>
                    <button
                      onClick={() => toggleSaveWorker(worker.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      {savedWorkers.includes(worker.id) ? (
                        <BookmarkCheck size={18} className="text-red-600" />
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

        {/* Worker Detail Modal */}
        {showWorkerModal && selectedWorker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{selectedWorker.name}</h2>
                <button
                  onClick={() => setShowWorkerModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column - Image & Basic Info */}
                  <div className="md:col-span-1">
                    <img
                      src={selectedWorker.image}
                      alt={selectedWorker.name}
                      className="w-full rounded-lg mb-4"
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm px-3 py-1 rounded-full ${getAvailabilityColor(selectedWorker.availability)}`}>
                        {getAvailabilityLabel(selectedWorker.availability)}
                      </span>
                      {selectedWorker.verified && (
                        <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-600 flex items-center gap-1">
                          <CheckCircle size={14} />
                          {t.workerCard.verified}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-gray-400" />
                        {selectedWorker.location}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign size={16} className="text-gray-400" />
                        {selectedWorker.salary.toLocaleString()} {t.workerCard.salary}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase size={16} className="text-gray-400" />
                        {selectedWorker.experienceYears} {t.workerCard.experience}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Star size={16} className="text-yellow-400" />
                        {selectedWorker.rating} ({selectedWorker.reviewCount} {t.workerCard.reviews})
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => navigate(`/hire/${selectedWorker.id}`)}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        {t.workerModal.hireNow}
                      </button>
                      <button
                        onClick={() => navigate(`/chat/${selectedWorker.id}`)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={18} />
                        {t.workerModal.sendMessage}
                      </button>
                      <button
                        onClick={() => toggleSaveWorker(selectedWorker.id)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {savedWorkers.includes(selectedWorker.id) ? (
                          <>
                            <BookmarkCheck size={18} className="text-red-600" />
                            {t.workerCard.saved}
                          </>
                        ) : (
                          <>
                            <Bookmark size={18} />
                            {t.workerCard.save}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Details */}
                  <div className="md:col-span-2">
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">{t.workerModal.about}</h3>
                      <p className="text-sm text-gray-600">{selectedWorker.bio}</p>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">{t.workerModal.skills}</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorker.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">{t.workerModal.experience}</h3>
                      <div className="space-y-2">
                        {selectedWorker.experiences.map((exp, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-800">{exp.role}</p>
                            <p className="text-sm text-gray-600">{exp.employer}</p>
                            <p className="text-xs text-gray-400">{exp.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">{t.workerModal.documents}</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorker.documents.map((doc, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1">
                            <FileText size={14} />
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">{t.workerModal.reviews}</h3>
                      {selectedWorker.reviews.length > 0 ? (
                        <div className="space-y-3">
                          {selectedWorker.reviews.map((review, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-800">{review.user}</p>
                                  <div className="flex items-center gap-1">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">{review.rating}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400">{review.date}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">{t.workerModal.noReviews}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;