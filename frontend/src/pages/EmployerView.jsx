import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Search,
  MessageCircle,
  Bell,
  DollarSign,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  LogOut,
  Home,
  BarChart3,
  User,
  Calendar,
  FileText,
  TrendingUp,
  Globe,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  Building,
  Award,
  Shield,
  Bookmark,
  
  Share2,
  Download,
  Printer,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  PieChart,
  Activity,
  Zap,
  Coins,
  Users as UsersIcon,
  Briefcase as BriefcaseIcon
} from 'lucide-react';

const EmployerView = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [employer, setEmployer] = useState(null);
  const [hires, setHires] = useState([]);
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Translations
  const translations = {
    en: {
      title: 'Employer Dashboard',
      welcome: 'Welcome back,',
      overview: 'Overview',
      profile: 'Profile',
      hires: 'My Hires',
      savedWorkers: 'Saved Workers',
      messages: 'Messages',
      notifications: 'Notifications',
      settings: 'Settings',
      logout: 'Log Out',
      searchWorkers: 'Search Workers',
      stats: {
        totalHires: 'Total Hires',
        activeHires: 'Active Hires',
        completedHires: 'Completed Hires',
        totalSpent: 'Total Spent',
        pendingApplications: 'Pending Applications',
        interviews: 'Interviews',
        responseRate: 'Response Rate'
      },
      languageToggle: 'العربية'
    },
    ar: {
      title: 'لوحة تحكم صاحب العمل',
      welcome: 'مرحباً بعودتك،',
      overview: 'نظرة عامة',
      profile: 'الملف الشخصي',
      hires: 'توظيفاتي',
      savedWorkers: 'العمال المحفوظون',
      messages: 'الرسائل',
      notifications: 'الإشعارات',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      searchWorkers: 'البحث عن عمال',
      stats: {
        totalHires: 'إجمالي التوظيفات',
        activeHires: 'توظيفات نشطة',
        completedHires: 'توظيفات مكتملة',
        totalSpent: 'إجمالي المصروفات',
        pendingApplications: 'طلبات معلقة',
        interviews: 'مقابلات',
        responseRate: 'معدل الاستجابة'
      },
      languageToggle: 'English'
    }
  };

  const t = translations[language];

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

  useEffect(() => {
    const fetchEmployerData = async () => {
      setLoading(true);
      try {
        // Demo data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoEmployer = {
          id: 'e1',
          name: 'Sara Mohamed',
          email: 'sara@example.com',
          phone: '+201234567891',
          companyName: 'Sara\'s Family Services',
          companyType: 'family',
          location: 'Cairo, Egypt',
          verified: true,
          image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
          stats: {
            totalHires: 12,
            activeHires: 3,
            completedHires: 9,
            totalSpent: 45000,
            pendingApplications: 2,
            interviews: 4,
            responseRate: 95
          }
        };
        
        const demoHires = [
          {
            id: 'HS-2026-0001',
            worker: 'Ahmed Ali',
            position: 'Nanny - Full Time',
            salary: 3500,
            status: 'active',
            startDate: '2026-07-01',
            endDate: null,
            rating: 4.9
          },
          {
            id: 'HS-2026-0002',
            worker: 'Mona Hassan',
            position: 'Elderly Caregiver',
            salary: 4200,
            status: 'pending',
            startDate: null,
            endDate: null,
            rating: null
          },
          {
            id: 'HS-2026-0003',
            worker: 'Khaled Mostafa',
            position: 'Driver',
            salary: 3800,
            status: 'completed',
            startDate: '2026-05-01',
            endDate: '2026-06-30',
            rating: 4.7
          }
        ];
        
        const demoSavedWorkers = [
          {
            id: 'w2',
            name: 'Mona Hassan',
            category: 'Elderly Caregiver',
            rating: 4.8,
            location: 'Alexandria, Egypt',
            salary: 4200,
            availability: 'available'
          },
          {
            id: 'w4',
            name: 'Sara Mahmoud',
            category: 'Cook',
            rating: 4.9,
            location: 'Cairo, Egypt',
            salary: 4000,
            availability: 'available'
          }
        ];
        
        setEmployer(demoEmployer);
        setEditForm(demoEmployer);
        setHires(demoHires);
        setSavedWorkers(demoSavedWorkers);
        
      } catch (error) {
        console.error('Error fetching employer data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployerData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto z-50">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">HomelyServ</span>
          </div>
          
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={employer?.image}
                alt={employer?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
              <div>
                <p className="font-semibold text-gray-800">{employer?.name}</p>
                <p className="text-xs text-gray-500">{employer?.companyName}</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={20} />
              <span>{t.overview}</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User size={20} />
              <span>{t.profile}</span>
            </button>
            <button
              onClick={() => setActiveTab('hires')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'hires' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={20} />
              <span>{t.hires}</span>
              <span className="ml-auto bg-yellow-100 text-yellow-600 text-xs px-2 py-0.5 rounded-full">
                {hires.filter(h => h.status === 'pending').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('savedWorkers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'savedWorkers' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bookmark size={20} />
              <span>{t.savedWorkers}</span>
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {savedWorkers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'messages' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageCircle size={20} />
              <span>{t.messages}</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'notifications' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bell size={20} />
              <span>{t.notifications}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings size={20} />
              <span>{t.settings}</span>
            </button>
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              localStorage.removeItem('homelyserv_token');
              localStorage.removeItem('homelyserv_user');
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
              <p className="text-gray-500 text-sm">{t.welcome} {employer?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm"
              >
                <Globe size={16} className="text-gray-600" />
                <span className="font-medium">{t.languageToggle}</span>
              </button>
              <Link
                to="/search"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Search size={16} />
                {t.searchWorkers}
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalHires}</p>
                      <p className="text-2xl font-bold text-gray-800">{employer?.stats.totalHires}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Briefcase size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.activeHires}</p>
                      <p className="text-2xl font-bold text-gray-800">{employer?.stats.activeHires}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalSpent}</p>
                      <p className="text-2xl font-bold text-gray-800">EGP {employer?.stats.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                      <DollarSign size={24} className="text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.responseRate}</p>
                      <p className="text-2xl font-bold text-gray-800">{employer?.stats.responseRate}%</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Users size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Hires</h3>
                  <div className="space-y-3">
                    {hires.slice(0, 3).map((hire) => (
                      <div key={hire.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{hire.worker}</p>
                          <p className="text-sm text-gray-500">{hire.position}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          hire.status === 'active' ? 'bg-green-100 text-green-800' :
                          hire.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {hire.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Saved Workers</h3>
                  <div className="space-y-3">
                    {savedWorkers.slice(0, 3).map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{worker.name}</p>
                          <p className="text-sm text-gray-500">{worker.category}</p>
                        </div>
                        <span className="text-xs text-green-600">Available</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs - simplified for brevity */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Profile</h2>
              <p className="text-gray-500">Profile management coming soon...</p>
            </div>
          )}

          {activeTab === 'hires' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">My Hires</h2>
              <div className="space-y-4">
                {hires.map((hire) => (
                  <div key={hire.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{hire.worker}</h3>
                        <p className="text-sm text-gray-600">{hire.position}</p>
                        <p className="text-sm text-gray-500">EGP {hire.salary.toLocaleString()}/month</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full ${
                        hire.status === 'active' ? 'bg-green-100 text-green-800' :
                        hire.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {hire.status}
                      </span>
                    </div>
                    {hire.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{hire.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'savedWorkers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Saved Workers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedWorkers.map((worker) => (
                  <div key={worker.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                        <p className="text-sm text-gray-600">{worker.category}</p>
                        <p className="text-sm text-gray-500">{worker.location}</p>
                        <p className="text-sm font-medium text-gray-800">EGP {worker.salary.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{worker.rating}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                        Hire
                      </button>
                      <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Settings</h2>
              <p className="text-gray-500">Settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerView;
