import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Briefcase,
  Heart,
  MessageCircle,
  User,
  LogIn,
  Menu,
  X,
  Globe
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('homelyserv_token');
    const userData = localStorage.getItem('homelyserv_user');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Translations
  const translations = {
    en: {
      title: 'Find Trusted',
      titleHighlight: 'Home Services',
      subtitle: 'Connect with verified professionals for your home care needs',
      searchPlaceholder: 'Search for a service or professional...',
      allCategories: 'All Categories',
      searchButton: 'Search',
      viewAll: 'View all',
      browseServices: 'Browse Services',
      topRated: 'Top Rated Professionals',
      seeAll: 'See all',
      viewProfile: 'View Profile',
      verified: 'Verified & Trusted',
      verifiedDesc: 'All professionals are identity verified, background checked, and reviewed by real employers.',
      identityVerified: 'Identity Verified',
      documentCheck: 'Document Check',
      ratingSystem: 'Rating System',
      howItWorks: 'How It Works',
      step1Title: 'Create Profile',
      step1Desc: 'Job seekers create detailed profiles with experience, documents, and availability.',
      step2Title: 'Search & Match',
      step2Desc: 'Employers find the perfect match based on category, location, salary, and ratings.',
      step3Title: 'Hire & Review',
      step3Desc: 'Connect, hire, and leave reviews. Commission is paid only on successful hire.',
      readyTitle: 'Ready to Find the Perfect Professional?',
      readyDesc: 'Join thousands of satisfied employers and professionals. Start your search today.',
      getStarted: 'Get Started Free',
      browseProfessionals: 'Browse Professionals',
      noFees: 'No registration fees. Pay commission only on successful hire.',
      stats: {
        verified: 'Verified Professionals',
        hires: 'Successful Hires',
        satisfaction: 'Satisfaction Rate'
      },
      login: 'Login',
      register: 'Register',
      dashboard: 'Dashboard',
      logout: 'Logout',
      languageToggle: 'العربية',
      home: 'Home',
      about: 'About',
      contact: 'Contact'
    },
    ar: {
      title: 'ابحث عن',
      titleHighlight: 'خدمات المنزل الموثوقة',
      subtitle: 'تواصل مع المهنيين الموثقين لاحتياجات منزلك',
      searchPlaceholder: 'ابحث عن خدمة أو متخصص...',
      allCategories: 'جميع الفئات',
      searchButton: 'بحث',
      viewAll: 'عرض الكل',
      browseServices: 'تصفح الخدمات',
      topRated: 'أفضل المتخصصين تقييماً',
      seeAll: 'عرض الكل',
      viewProfile: 'عرض الملف الشخصي',
      verified: 'موثق وموثوق',
      verifiedDesc: 'جميع المتخصصين موثقين الهوية، ومفحوصين خلفياً، ومراجعين من قبل أصحاب العمل الحقيقيين.',
      identityVerified: 'هوية موثقة',
      documentCheck: 'فحص المستندات',
      ratingSystem: 'نظام التقييم',
      howItWorks: 'كيف يعمل',
      step1Title: 'إنشاء ملف شخصي',
      step1Desc: 'يقوم الباحثون عن عمل بإنشاء ملفات شخصية مفصلة مع الخبرة والمستندات ومدى التوفر.',
      step2Title: 'البحث والمطابقة',
      step2Desc: 'يجد أصحاب العمل التطابق المثالي بناءً على الفئة والموقع والراتب والتقييمات.',
      step3Title: 'التوظيف والمراجعة',
      step3Desc: 'تواصل، وظف، واترك مراجعة. العمولة تدفع فقط عند التوظيف الناجح.',
      readyTitle: 'هل أنت مستعد للعثور على المتخصص المثالي؟',
      readyDesc: 'انضم إلى الآلاف من أصحاب العمل والمتخصصين الراضين. ابدأ بحثك اليوم.',
      getStarted: 'ابدأ مجاناً',
      browseProfessionals: 'تصفح المتخصصين',
      noFees: 'لا رسوم تسجيل. ادفع العمولة فقط عند التوظيف الناجح.',
      stats: {
        verified: 'متخصص موثق',
        hires: 'توظيف ناجح',
        satisfaction: 'معدل الرضا'
      },
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      dashboard: 'لوحة التحكم',
      logout: 'تسجيل الخروج',
      languageToggle: 'English',
      home: 'الرئيسية',
      about: 'عننا',
      contact: 'اتصل بنا'
    }
  };

  const t = translations[language] || translations.en;

  // Service categories
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

  // Sample top-rated workers
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
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (selectedCategory) params.append('category', selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/search?category=${categoryId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'EMPLOYER') return '/employer-dashboard';
    return '/worker-dashboard';
  };

  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-red-600 transition">{t.home}</Link>
              <Link to="/about" className="text-gray-600 hover:text-red-600 transition">{t.about}</Link>
              <Link to="/contact" className="text-gray-600 hover:text-red-600 transition">{t.contact}</Link>
              
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-gray-50 transition text-sm"
              >
                <Globe size={15} className="text-gray-500" />
                <span className="text-gray-600 text-xs font-medium">{t.languageToggle}</span>
              </button>

              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={getDashboardPath()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    {t.dashboard}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t.logout}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <LogIn size={16} />
                    {t.login}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    {t.register}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4">
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-gray-600 hover:text-red-600 transition py-2">{t.home}</Link>
              <Link to="/about" className="text-gray-600 hover:text-red-600 transition py-2">{t.about}</Link>
              <Link to="/contact" className="text-gray-600 hover:text-red-600 transition py-2">{t.contact}</Link>
              
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-gray-50 transition text-sm"
              >
                <Globe size={15} className="text-gray-500" />
                <span className="text-gray-600 text-sm font-medium">{t.languageToggle}</span>
              </button>

              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to={getDashboardPath()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition text-center"
                  >
                    {t.dashboard}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t.logout}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-center"
                  >
                    {t.login}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition text-center"
                  >
                    {t.register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {t.title} <br className="sm:hidden" />
              <span className="text-yellow-300">{t.titleHighlight}</span>
            </h1>
            <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-48 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800 appearance-none bg-white"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <option value="">{t.allCategories}</option>
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
                {t.searchButton}
              </button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-center">
            <div>
              <div className="text-2xl font-bold">2,500+</div>
              <div className="text-red-200 text-sm">{t.stats.verified}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">1,200+</div>
              <div className="text-red-200 text-sm">{t.stats.hires}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">98%</div>
              <div className="text-red-200 text-sm">{t.stats.satisfaction}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">{t.browseServices}</h2>
          <Link to="/search" className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
            {t.viewAll} <ArrowRight size={18} />
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
            <h2 className="text-2xl font-bold text-gray-800">{t.topRated}</h2>
            <Link to="/search" className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
              {t.seeAll} <ChevronRight size={18} />
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
                    to={`/job/${worker.id}`}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg block text-center transition-colors"
                  >
                    {t.viewProfile}
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
                  <h3 className="text-xl font-bold text-gray-800">{t.verified}</h3>
                </div>
                <p className="text-gray-600">
                  {t.verifiedDesc}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={18} className="text-green-500" />
                    <span className="text-sm text-gray-700">{t.identityVerified}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={18} className="text-green-500" />
                    <span className="text-sm text-gray-700">{t.documentCheck}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={18} className="text-green-500" />
                    <span className="text-sm text-gray-700">{t.ratingSystem}</span>
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
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-12">{t.howItWorks}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t.step1Title}</h3>
              <p className="text-gray-600 text-sm">
                {t.step1Desc}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t.step2Title}</h3>
              <p className="text-gray-600 text-sm">
                {t.step2Desc}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={28} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t.step3Title}</h3>
              <p className="text-gray-600 text-sm">
                {t.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.readyTitle}
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            {t.readyDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              {t.getStarted}
            </Link>
            <Link
              to="/search"
              className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              {t.browseProfessionals}
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            {t.noFees}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-white text-lg">HomelyServ</span>
            </div>
            <div className="flex gap-6">
              <Link to="/about" className="hover:text-white transition">{t.about}</Link>
              <Link to="/contact" className="hover:text-white transition">{t.contact}</Link>
              <Link to="/terms" className="hover:text-white transition">Terms</Link>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} HomelyServ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;