import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  Briefcase,
  FileCheck,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  AlertTriangle,
  Search,
  DollarSign,
  Clock,
  Calendar,
  Star,
  MapPin,
  Phone,
  Mail,
  Users,
  Filter,
  FileText,
  Search as SearchIcon,
  UserCheck,
  Building2,
  MapPinned,
  Languages
} from 'lucide-react';

// Employer Sidebar Component - Teal Theme
const EmployerSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  user, 
  handleLogout 
}) => {
  const location = useLocation();

  const translations = {
    en: {
      dashboard: 'Dashboard',
      myProfile: 'My Profile',
      myHires: 'My Hires',
      search: 'Search Workers',
      messages: 'Messages',
      complaints: 'Complaints',
      settings: 'Settings',
      help: 'Help & Support',
      logout: 'Logout',
      overview: 'Overview'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      myProfile: 'ملفي الشخصي',
      myHires: 'توظيفاتي',
      search: 'البحث عن عمال',
      messages: 'الرسائل',
      complaints: 'الشكاوى',
      settings: 'الإعدادات',
      help: 'المساعدة والدعم',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/employer-profile' },
    { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
    { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <Link to="/employer-dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/employer-dashboard" className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">H</span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-teal-600" />
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || 'employer@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.overview}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-teal-600' : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-teal-600 rounded-full"></div>
              )}
            </Link>
          ))}

          <div className="border-t border-gray-200 my-3"></div>

          <Link
            to="/employer-settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Settings size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.settings}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.settings}
              </div>
            )}
          </Link>
          <Link
            to="/help"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <HelpCircle size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.help}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.help}
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-teal-600 hover:bg-teal-50 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.logout}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.logout}
              </div>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
};

// Main EmployerSearch Component
const EmployerSearch = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  // Search form fields
  const [searchParams, setSearchParams] = useState({
    languageGroup: '',
    country: '',
    city: '',
    jobType: '',
    jobTitle: ''
  });

  // Countries by language
  const languageGroups = [
    {
      id: 'arabic',
      name: 'Arabic',
      flag: '🇸🇦',
      countries: [
        'Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 
        'Iraq', 'Jordan', 'Kuwait', 'Lebanon', 'Libya', 
        'Mauritania', 'Morocco', 'Oman', 'Palestine', 'Qatar', 
        'Saudi Arabia', 'Somalia', 'Sudan', 'Syria', 'Tunisia', 
        'United Arab Emirates', 'Yemen'
      ]
    },
    {
      id: 'english',
      name: 'English',
      flag: '🇬🇧',
      countries: [
        'Australia', 'Bahamas', 'Barbados', 'Belize', 'Botswana', 
        'Canada', 'Gambia', 'Ghana', 'Guyana', 'India', 
        'Ireland', 'Jamaica', 'Kenya', 'Liberia', 'Malawi', 
        'Namibia', 'New Zealand', 'Nigeria', 'Pakistan', 'Philippines', 
        'Sierra Leone', 'Singapore', 'South Africa', 'Tanzania', 'Trinidad and Tobago', 
        'Uganda', 'United Kingdom', 'United States', 'Zambia', 'Zimbabwe'
      ]
    },
    {
      id: 'french',
      name: 'French',
      flag: '🇫🇷',
      countries: [
        'Belgium', 'Benin', 'Burkina Faso', 'Burundi', 'Cameroon', 
        'Canada', 'Central African Republic', 'Chad', 'Comoros', 'Congo', 
        'Democratic Republic of the Congo', 'Djibouti', 'Equatorial Guinea', 'France', 
        'Gabon', 'Guinea', 'Haiti', 'Ivory Coast', 'Luxembourg', 
        'Madagascar', 'Mali', 'Mauritius', 'Monaco', 'Niger', 
        'Rwanda', 'Senegal', 'Seychelles', 'Switzerland', 'Togo', 
        'Vanuatu'
      ]
    },
    {
      id: 'german',
      name: 'German',
      flag: '🇩🇪',
      countries: [
        'Austria', 'Belgium', 'Germany', 'Liechtenstein', 
        'Luxembourg', 'Switzerland'
      ]
    },
    {
      id: 'turkish',
      name: 'Turkish',
      flag: '🇹🇷',
      countries: [
        'Turkey', 'Northern Cyprus'
      ]
    },
    {
      id: 'spanish',
      name: 'Spanish',
      flag: '🇪🇸',
      countries: [
        'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 
        'Cuba', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Equatorial Guinea', 
        'Guatemala', 'Honduras', 'Mexico', 'Nicaragua', 'Panama', 
        'Paraguay', 'Peru', 'Puerto Rico', 'Spain', 'Uruguay', 
        'Venezuela'
      ]
    }
  ];

  // Cities by country
  const citiesByCountry = {
    'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Luxor', 'Aswan', 'Hurghada', 'Port Said', 'Suez'],
    'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Taif', 'Abha'],
    'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    'Kuwait': ['Kuwait City', 'Salmiya', 'Hawally', 'Farwaniya', 'Mubarak Al-Kabeer'],
    'Qatar': ['Doha', 'Al Wakrah', 'Al Rayyan', 'Lusail', 'Al Khor'],
    'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur'],
    'Bahrain': ['Manama', 'Muharraq', 'Riffa', 'Hamad Town', 'Isa Town'],
    'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba'],
    'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Jounieh'],
    'Morocco': ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir'],
    'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Gabès'],
    'Algeria': ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida'],
    'Libya': ['Tripoli', 'Benghazi', 'Misrata', 'Sabha', 'Tobruk'],
    'Sudan': ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala'],
    'Somalia': ['Mogadishu', 'Hargeisa', 'Kismayo', 'Baidoa'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Bordeaux', 'Lille', 'Strasbourg'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Quebec City', 'Winnipeg'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Hobart'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
    'Pakistan': ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'],
    'Philippines': ['Manila', 'Quezon City', 'Davao City', 'Cebu City', 'Makati', 'Taguig', 'Pasig'],
    'Singapore': ['Singapore'],
    'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
    'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'],
    'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Tema'],
    'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya'],
    'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Málaga', 'Bilbao', 'Zaragoza', 'Palma'],
    'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez'],
    'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata'],
    'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'],
    'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco'],
    'Peru': ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Piura', 'Chiclayo'],
    'Switzerland': ['Zurich', 'Geneva', 'Bern', 'Lausanne', 'Basel', 'Lucerne'],
    'Austria': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt'],
    'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liege', 'Charleroi'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen'],
    'Portugal': ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Faro'],
    'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna'],
    'Greece': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa'],
    'Poland': ['Warsaw', 'Krakow', 'Wroclaw', 'Poznan', 'Gdansk', 'Lodz'],
    'Czech Republic': ['Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec'],
    'Hungary': ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs'],
    'Romania': ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța'],
    'Bulgaria': ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse'],
    'Croatia': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar'],
    'Serbia': ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica'],
    'Slovakia': ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Nitra'],
    'Slovenia': ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Novo Mesto'],
    'Lithuania': ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys'],
    'Latvia': ['Riga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jūrmala'],
    'Estonia': ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve'],
    'Finland': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu'],
    'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'],
    'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen'],
    'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'],
    'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga'],
    'Malaysia': ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Petaling Jaya', 'Shah Alam'],
    'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Hat Yai'],
    'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'],
    'Japan': ['Tokyo', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka'],
    'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'],
    'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
    'Ireland': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford'],
    'Northern Cyprus': ['Nicosia', 'Famagusta', 'Kyrenia', 'Morphou', 'Trikomo']
  };

  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'fixed-hours', label: 'Fixed Hours' }
  ];

  const jobTitles = [
    'Nanny',
    'Baby Sitter',
    'Elderly Caregiver',
    'Driver',
    'Cook',
    'House Manager',
    'Gardener',
    'Nurse',
    'Tutor',
    'Housekeeper',
    'Personal Assistant',
    'Cleaner',
    'Security Guard',
    'Maintenance Worker',
    'Teacher'
  ];

  const translations = {
    en: {
      title: 'Search Workers',
      subtitle: 'Find the perfect worker for your needs',
      searchFields: 'Search Fields',
      language: 'Language',
      selectLanguage: 'Select Language',
      country: 'Country',
      selectCountry: 'Select Country',
      city: 'City',
      selectCity: 'Select City',
      jobType: 'Job Type',
      selectJobType: 'Select Job Type',
      jobTitle: 'Job Title',
      selectJobTitle: 'Select Job Title',
      searchNow: 'Search Now',
      results: 'Search Results',
      noResults: 'No workers found matching your criteria',
      tryAgain: 'Try adjusting your search filters',
      worker: 'Worker',
      location: 'Location',
      experience: 'Experience',
      rating: 'Rating',
      hourlyRate: 'Hourly Rate',
      viewProfile: 'View Profile',
      hire: 'Hire Now',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Searching for workers...',
      clearFilters: 'Clear Filters'
    },
    ar: {
      title: 'البحث عن عمال',
      subtitle: 'ابحث عن العامل المثالي لاحتياجاتك',
      searchFields: 'حقول البحث',
      language: 'اللغة',
      selectLanguage: 'اختر اللغة',
      country: 'الدولة',
      selectCountry: 'اختر الدولة',
      city: 'المدينة',
      selectCity: 'اختر المدينة',
      jobType: 'نوع الوظيفة',
      selectJobType: 'اختر نوع الوظيفة',
      jobTitle: 'المسمى الوظيفي',
      selectJobTitle: 'اختر المسمى الوظيفي',
      searchNow: 'بحث الآن',
      results: 'نتائج البحث',
      noResults: 'لا يوجد عمال مطابقين لمعايير البحث',
      tryAgain: 'حاول تعديل فلاتر البحث',
      worker: 'العامل',
      location: 'الموقع',
      experience: 'الخبرة',
      rating: 'التقييم',
      hourlyRate: 'السعر بالساعة',
      viewProfile: 'عرض الملف الشخصي',
      hire: 'توظيف الآن',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري البحث عن عمال...',
      clearFilters: 'مسح الفلاتر'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAvailableCountries = () => {
    if (!searchParams.languageGroup) return [];
    const group = languageGroups.find(g => g.id === searchParams.languageGroup);
    return group ? group.countries : [];
  };

  const getAvailableCities = () => {
    if (!searchParams.country) return [];
    return citiesByCountry[searchParams.country] || [];
  };

  const clearFilters = () => {
    setSearchParams({
      languageGroup: '',
      country: '',
      city: '',
      jobType: '',
      jobTitle: ''
    });
    setShowResults(false);
    setSearchResults([]);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(false);

    try {
      // This is where you would call your actual API
      // For now, we'll simulate a search with a message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would be an API call to your backend:
      // const response = await fetch('/api/workers/search', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(searchParams)
      // });
      // const data = await response.json();
      // setSearchResults(data.workers);
      
      // For demo, we'll show a message indicating search was performed
      setSearchResults([]);
      setShowResults(true);
      
      // The actual search would return real worker data from your database
      // Example success message
      alert(`Search performed with: 
        Language: ${searchParams.languageGroup || 'Any'}
        Country: ${searchParams.country || 'Any'}
        City: ${searchParams.city || 'Any'}
        Job Type: ${searchParams.jobType || 'Any'}
        Job Title: ${searchParams.jobTitle || 'Any'}`);
        
    } catch (error) {
      console.error('Error searching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <EmployerSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-600 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {/* Page Header - Teal Theme */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-teal-100 mt-1">{t.subtitle}</p>
            </div>
          </div>

          {/* Search Form - Teal Theme */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.searchFields}</h3>
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.language}
                  </label>
                  <select
                    name="languageGroup"
                    value={searchParams.languageGroup}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  >
                    <option value="">{t.selectLanguage}</option>
                    {languageGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.flag} {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.country}
                  </label>
                  <select
                    name="country"
                    value={searchParams.country}
                    onChange={handleInputChange}
                    disabled={!searchParams.languageGroup}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{t.selectCountry}</option>
                    {getAvailableCountries().map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.city}
                  </label>
                  <select
                    name="city"
                    value={searchParams.city}
                    onChange={handleInputChange}
                    disabled={!searchParams.country}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{t.selectCity}</option>
                    {getAvailableCities().map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.jobType}
                  </label>
                  <select
                    name="jobType"
                    value={searchParams.jobType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  >
                    <option value="">{t.selectJobType}</option>
                    {jobTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.jobTitle}
                  </label>
                  <select
                    name="jobTitle"
                    value={searchParams.jobTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  >
                    <option value="">{t.selectJobTitle}</option>
                    {jobTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search & Clear Buttons */}
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t.loading}
                      </>
                    ) : (
                      <>
                        <SearchIcon size={18} />
                        {t.searchNow}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Results Section */}
          {showResults && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.results}</h3>
              
              {/* No Results Message */}
              {searchResults.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noResults}</h3>
                  <p className="text-gray-500">{t.tryAgain}</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              )}

              {/* Results would be displayed here from your API */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {/* Worker cards would be rendered here */}
                  <p className="text-gray-500 text-center">Worker results will appear here after connecting to your backend API.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployerSearch;