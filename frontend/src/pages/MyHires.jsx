import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Star,
  MapPin,
  Download,
  RefreshCw,
  Globe,
  Phone,
  Mail,
  User as UserIcon
} from 'lucide-react';

const MyHires = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [hires, setHires] = useState([]);
  const [filteredHires, setFilteredHires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedHire, setExpandedHire] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('worker');

  // Translations
  const translations = {
    en: {
      title: 'My Hires',
      subtitle: 'Track all your hiring activities and job offers',
      status: {
        all: 'All',
        offer_sent: 'Offer Sent',
        pending: 'Pending Payment',
        confirmed: 'Confirmed',
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled',
        rejected: 'Rejected'
      },
      stats: {
        total: 'Total Hires',
        active: 'Active',
        pending: 'Pending',
        completed: 'Completed'
      },
      table: {
        worker: 'Worker',
        employer: 'Employer',
        position: 'Position',
        salary: 'Salary',
        status: 'Status',
        date: 'Date',
        actions: 'Actions',
        noResults: 'No hires found',
        searchPlaceholder: 'Search by name, position, or ID...'
      },
      details: {
        title: 'Hire Details',
        salaryAgreed: 'Agreed Salary',
        commission: 'Commission (6.5%)',
        vat: 'VAT (14%)',
        totalDue: 'Total Due',
        paymentMethod: 'Payment Method',
        paymentStatus: 'Payment Status',
        reference: 'Reference',
        startDate: 'Start Date',
        createdAt: 'Created At',
        workerInfo: 'Worker Information',
        employerInfo: 'Employer Information',
        contact: 'Contact',
        location: 'Location',
        rating: 'Rating',
        documents: 'Documents',
        noDocuments: 'No documents uploaded',
        viewProfile: 'View Profile',
        sendMessage: 'Send Message',
        downloadDetails: 'Download Details',
        statusHistory: 'Status History',
        messages: 'Messages'
      },
      actions: {
        confirm: 'Confirm Hire',
        cancel: 'Cancel',
        view: 'View Details',
        message: 'Message',
        complete: 'Mark as Completed',
        reject: 'Reject',
        pay: 'Make Payment'
      },
      confirmDialog: {
        title: 'Confirm Hire',
        message: 'Are you sure you want to confirm this hire?',
        confirm: 'Confirm',
        cancel: 'Cancel'
      },
      cancelDialog: {
        title: 'Cancel Hire',
        message: 'Are you sure you want to cancel this hire?',
        confirm: 'Yes, Cancel',
        cancel: 'No, Keep'
      },
      loading: 'Loading your hires...',
      error: 'Error loading hires. Please try again.',
      retry: 'Retry',
      noHires: "You haven't made any hires yet.",
      startSearching: 'Start Searching',
      languageToggle: 'العربية'
    },
    ar: {
      title: 'التوظيفات الخاصة بي',
      subtitle: 'تتبع جميع أنشطة التوظيف والعروض الوظيفية',
      status: {
        all: 'الكل',
        offer_sent: 'تم إرسال العرض',
        pending: 'في انتظار الدفع',
        confirmed: 'مؤكد',
        active: 'نشط',
        completed: 'مكتمل',
        cancelled: 'ملغي',
        rejected: 'مرفوض'
      },
      stats: {
        total: 'إجمالي التوظيفات',
        active: 'نشط',
        pending: 'قيد الانتظار',
        completed: 'مكتمل'
      },
      table: {
        worker: 'العامل',
        employer: 'صاحب العمل',
        position: 'الوظيفة',
        salary: 'الراتب',
        status: 'الحالة',
        date: 'التاريخ',
        actions: 'الإجراءات',
        noResults: 'لا توجد توظيفات',
        searchPlaceholder: 'بحث بالاسم أو الوظيفة أو المعرف...'
      },
      details: {
        title: 'تفاصيل التوظيف',
        salaryAgreed: 'الراتب المتفق عليه',
        commission: 'العمولة (6.5%)',
        vat: 'ضريبة القيمة المضافة (14%)',
        totalDue: 'الإجمالي المستحق',
        paymentMethod: 'طريقة الدفع',
        paymentStatus: 'حالة الدفع',
        reference: 'المرجع',
        startDate: 'تاريخ البدء',
        createdAt: 'تاريخ الإنشاء',
        workerInfo: 'معلومات العامل',
        employerInfo: 'معلومات صاحب العمل',
        contact: 'اتصال',
        location: 'الموقع',
        rating: 'التقييم',
        documents: 'المستندات',
        noDocuments: 'لا توجد مستندات مرفوعة',
        viewProfile: 'عرض الملف الشخصي',
        sendMessage: 'إرسال رسالة',
        downloadDetails: 'تحميل التفاصيل',
        statusHistory: 'سجل الحالة',
        messages: 'الرسائل'
      },
      actions: {
        confirm: 'تأكيد التوظيف',
        cancel: 'إلغاء',
        view: 'عرض التفاصيل',
        message: 'رسالة',
        complete: 'تحديد كمكتمل',
        reject: 'رفض',
        pay: 'الدفع'
      },
      confirmDialog: {
        title: 'تأكيد التوظيف',
        message: 'هل أنت متأكد من رغبتك في تأكيد هذا التوظيف؟',
        confirm: 'تأكيد',
        cancel: 'إلغاء'
      },
      cancelDialog: {
        title: 'إلغاء التوظيف',
        message: 'هل أنت متأكد من رغبتك في إلغاء هذا التوظيف؟',
        confirm: 'نعم، إلغاء',
        cancel: 'لا، إبقاء'
      },
      loading: 'جاري تحميل التوظيفات...',
      error: 'حدث خطأ في تحميل التوظيفات. يرجى المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      noHires: 'لم تقم بأي توظيفات بعد.',
      startSearching: 'بدء البحث',
      languageToggle: 'English'
    }
  };

  const t = translations[language];

  // Check language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUserRole(parsedUser.role || 'worker');
    }
  }, []);

  // Toggle language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  // Simulate fetching hires data
  useEffect(() => {
    const fetchHires = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await fetch('/api/hires');
        // const data = await response.json();
        
        // Demo data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoHires = [
          {
            id: 'HS-2026-0001',
            worker: {
              id: 'w1',
              name: 'Ahmed Ali',
              category: 'Nanny',
              rating: 4.9,
              location: 'Cairo, Egypt',
              phone: '+201234567890',
              email: 'ahmed@example.com',
              image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=100&h=100&fit=crop&crop=face'
            },
            employer: {
              id: 'e1',
              name: 'Sara Mohamed',
              phone: '+201234567891',
              email: 'sara@example.com'
            },
            position: 'Nanny - Full Time',
            agreedSalary: 3500,
            commissionAmount: 227.50,
            vatAmount: 31.85,
            totalDue: 3759.35,
            paymentMethod: 'InstaPay',
            paymentStatus: 'confirmed',
            paymentReference: 'HS-2026-0001-IP',
            status: 'active',
            startDate: '2026-07-01',
            createdAt: '2026-06-15',
            documents: [
              { name: 'Contract.pdf', url: '#', size: '2.4 MB' },
              { name: 'ID_Copy.pdf', url: '#', size: '1.2 MB' }
            ],
            statusHistory: [
              { status: 'offer_sent', date: '2026-06-10', note: 'Offer sent to worker' },
              { status: 'confirmed', date: '2026-06-12', note: 'Worker accepted offer' },
              { status: 'active', date: '2026-06-15', note: 'Hire confirmed and active' }
            ],
            messages: [
              { sender: 'employer', content: 'Welcome to the team!', time: '10:30 AM' },
              { sender: 'worker', content: 'Thank you! Looking forward to working with you.', time: '10:35 AM' }
            ]
          },
          {
            id: 'HS-2026-0002',
            worker: {
              id: 'w2',
              name: 'Mona Hassan',
              category: 'Elderly Caregiver',
              rating: 4.8,
              location: 'Alexandria, Egypt',
              phone: '+201234567892',
              email: 'mona@example.com',
              image: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=100&h=100&fit=crop&crop=face'
            },
            employer: {
              id: 'e2',
              name: 'Khaled Mostafa',
              phone: '+201234567893',
              email: 'khaled@example.com'
            },
            position: 'Elderly Caregiver - Part Time',
            agreedSalary: 4200,
            commissionAmount: 273,
            vatAmount: 38.22,
            totalDue: 4511.22,
            paymentMethod: 'Vodafone Cash',
            paymentStatus: 'pending',
            paymentReference: 'HS-2026-0002-VC',
            status: 'pending',
            startDate: null,
            createdAt: '2026-06-18',
            documents: [],
            statusHistory: [
              { status: 'offer_sent', date: '2026-06-18', note: 'Offer sent to worker' }
            ],
            messages: [
              { sender: 'employer', content: 'We would like to offer you the position.', time: '2:00 PM' },
              { sender: 'worker', content: 'I am interested. Can we discuss the details?', time: '2:15 PM' }
            ]
          },
          {
            id: 'HS-2026-0003',
            worker: {
              id: 'w3',
              name: 'Khaled Mostafa',
              category: 'Driver',
              rating: 4.7,
              location: 'Giza, Egypt',
              phone: '+201234567894',
              email: 'khaled.driver@example.com',
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
            },
            employer: {
              id: 'e3',
              name: 'Nadia Ibrahim',
              phone: '+201234567895',
              email: 'nadia@example.com'
            },
            position: 'Driver - Full Time',
            agreedSalary: 3800,
            commissionAmount: 247,
            vatAmount: 34.58,
            totalDue: 4081.58,
            paymentMethod: 'Bank Transfer',
            paymentStatus: 'confirmed',
            paymentReference: 'HS-2026-0003-BT',
            status: 'completed',
            startDate: '2026-05-01',
            createdAt: '2026-04-25',
            documents: [
              { name: 'Driving_License.pdf', url: '#', size: '1.8 MB' },
              { name: 'Contract.pdf', url: '#', size: '2.1 MB' },
              { name: 'Insurance.pdf', url: '#', size: '3.2 MB' }
            ],
            statusHistory: [
              { status: 'offer_sent', date: '2026-04-20', note: 'Offer sent to worker' },
              { status: 'confirmed', date: '2026-04-22', note: 'Worker accepted offer' },
              { status: 'active', date: '2026-04-25', note: 'Hire confirmed and active' },
              { status: 'completed', date: '2026-06-20', note: 'Hire completed successfully' }
            ],
            messages: [
              { sender: 'employer', content: 'Great work this month!', time: 'Yesterday' },
              { sender: 'worker', content: 'Thank you! I enjoyed working with the family.', time: 'Yesterday' }
            ]
          }
        ];

        setHires(demoHires);
        setFilteredHires(demoHires);
      } catch (error) {
        console.error('Error fetching hires:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHires();
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = hires;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(h => h.status === statusFilter);
    }

    // Search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        h.worker.name.toLowerCase().includes(searchLower) ||
        h.employer.name.toLowerCase().includes(searchLower) ||
        h.position.toLowerCase().includes(searchLower) ||
        h.id.toLowerCase().includes(searchLower)
      );
    }

    setFilteredHires(filtered);
  }, [hires, statusFilter, searchTerm]);

  // Toggle expanded hire details
  const toggleExpand = (hireId) => {
    setExpandedHire(expandedHire === hireId ? null : hireId);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      offer_sent: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      active: 'bg-purple-100 text-purple-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status label
  const getStatusLabel = (status) => {
    return t.status[status] || status;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'offer_sent': return <Clock size={16} />;
      case 'pending': return <AlertCircle size={16} />;
      case 'confirmed': return <CheckCircle size={16} />;
      case 'active': return <Briefcase size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  // Handle confirm hire
  const handleConfirmHire = (hireId) => {
    if (window.confirm(t.confirmDialog.message)) {
      setHires(prev =>
        prev.map(h =>
          h.id === hireId
            ? {
                ...h,
                status: 'confirmed',
                paymentStatus: 'confirmed',
                statusHistory: [
                  ...h.statusHistory,
                  { status: 'confirmed', date: new Date().toISOString().split('T')[0], note: 'Hire confirmed by employer' }
                ]
              }
            : h
        )
      );
    }
  };

  // Handle cancel hire
  const handleCancelHire = (hireId) => {
    if (window.confirm(t.cancelDialog.message)) {
      setHires(prev =>
        prev.map(h =>
          h.id === hireId
            ? {
                ...h,
                status: 'cancelled',
                statusHistory: [
                  ...h.statusHistory,
                  { status: 'cancelled', date: new Date().toISOString().split('T')[0], note: 'Hire cancelled by employer' }
                ]
              }
            : h
        )
      );
    }
  };

  // Handle complete hire
  const handleCompleteHire = (hireId) => {
    if (window.confirm('Mark this hire as completed?')) {
      setHires(prev =>
        prev.map(h =>
          h.id === hireId
            ? {
                ...h,
                status: 'completed',
                statusHistory: [
                  ...h.statusHistory,
                  { status: 'completed', date: new Date().toISOString().split('T')[0], note: 'Hire completed successfully' }
                ]
              }
            : h
        )
      );
    }
  };

  // Calculate stats
  const stats = {
    total: hires.length,
    active: hires.filter(h => h.status === 'active' || h.status === 'confirmed').length,
    pending: hires.filter(h => h.status === 'pending' || h.status === 'offer_sent').length,
    completed: hires.filter(h => h.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t.title}</h1>
            <p className="text-gray-500 mt-1">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm bg-white"
            >
              <Globe size={16} className="text-gray-600" />
              <span className="font-medium">{t.languageToggle}</span>
            </button>
            <button
              onClick={() => navigate('/search')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
            >
              <Search size={18} />
              {t.startSearching}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{t.stats.total}</p>
              <Briefcase size={20} className="text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{t.stats.active}</p>
              <Users size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{t.stats.pending}</p>
              <Clock size={20} className="text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{t.stats.completed}</p>
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.table.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.status.all}
              </button>
              {Object.keys(t.status).filter(key => key !== 'all').map((key) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === key
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.status[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hires List */}
        {filteredHires.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.table.noResults}</h3>
            <p className="text-gray-500">{t.noHires}</p>
            <button
              onClick={() => navigate('/search')}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t.startSearching}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHires.map((hire) => (
              <div
                key={hire.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Summary Row */}
                <div className="p-4 cursor-pointer" onClick={() => toggleExpand(hire.id)}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={hire.worker.image}
                        alt={hire.worker.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">{hire.worker.name}</h3>
                        <p className="text-sm text-gray-500">{hire.position}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {hire.worker.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            {hire.worker.rating}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-800">
                          EGP {hire.agreedSalary.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(hire.status)}`}>
                          {getStatusIcon(hire.status)}
                          {getStatusLabel(hire.status)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(hire.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedHire === hire.id ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedHire === hire.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Details */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">{t.details.title}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.details.salaryAgreed}</span>
                            <span className="font-medium">EGP {hire.agreedSalary.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.details.commission}</span>
                            <span>EGP {hire.commissionAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.details.vat}</span>
                            <span>EGP {hire.vatAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-2">
                            <span className="font-semibold text-gray-700">{t.details.totalDue}</span>
                            <span className="font-bold text-red-600">EGP {hire.totalDue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.details.paymentMethod}</span>
                            <span>{hire.paymentMethod || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.details.paymentStatus}</span>
                            <span className={`font-medium ${
                              hire.paymentStatus === 'confirmed' ? 'text-green-600' :
                              hire.paymentStatus === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {hire.paymentStatus}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.details.reference}</span>
                            <span className="font-mono text-xs">{hire.paymentReference}</span>
                          </div>
                          {hire.startDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">{t.details.startDate}</span>
                              <span>{new Date(hire.startDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t.details.createdAt}</span>
                            <span>{new Date(hire.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Status History */}
                        <div className="mt-4">
                          <h5 className="font-semibold text-gray-700 mb-2">{t.details.statusHistory}</h5>
                          <div className="space-y-1.5">
                            {hire.statusHistory.map((entry, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                                <div>
                                  <span className="font-medium">{getStatusLabel(entry.status)}</span>
                                  <span className="text-gray-400 ml-2">{entry.date}</span>
                                  {entry.note && (
                                    <p className="text-gray-500 text-xs">{entry.note}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Info & Actions */}
                      <div>
                        {/* Worker/Employer Info */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                          <h5 className="font-semibold text-gray-700 mb-2">
                            {userRole === 'worker' ? t.details.employerInfo : t.details.workerInfo}
                          </h5>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2">
                              <UserIcon size={14} className="text-gray-400" />
                              <span>
                                {userRole === 'worker' ? hire.employer.name : hire.worker.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-400" />
                              <span>{userRole === 'worker' ? hire.employer.phone : hire.worker.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-gray-400" />
                              <span>{userRole === 'worker' ? hire.employer.email : hire.worker.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                          <h5 className="font-semibold text-gray-700 mb-2">{t.details.documents}</h5>
                          {hire.documents.length === 0 ? (
                            <p className="text-sm text-gray-500">{t.details.noDocuments}</p>
                          ) : (
                            <div className="space-y-1.5">
                              {hire.documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-gray-400" />
                                    <span>{doc.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{doc.size}</span>
                                    <a href={doc.url} className="text-red-600 hover:text-red-700">
                                      <Download size={14} />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Messages Preview */}
                        {hire.messages.length > 0 && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                            <h5 className="font-semibold text-gray-700 mb-2">{t.details.messages}</h5>
                            <div className="space-y-1.5">
                              {hire.messages.slice(-2).map((msg, index) => (
                                <div key={index} className={`text-sm ${msg.sender === 'employer' ? 'text-right' : ''}`}>
                                  <div className={`inline-block px-3 py-1.5 rounded-lg ${
                                    msg.sender === 'employer'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {msg.content}
                                  </div>
                                  <span className="text-xs text-gray-400 ml-2">{msg.time}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/worker/${hire.worker.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            <Eye size={16} />
                            {t.details.viewProfile}
                          </Link>
                          <Link
                            to={`/chat/${hire.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            <MessageCircle size={16} />
                            {t.details.sendMessage}
                          </Link>
                          <button
                            onClick={() => handleConfirmHire(hire.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            disabled={hire.status !== 'pending' && hire.status !== 'offer_sent'}
                          >
                            <CheckCircle size={16} />
                            {t.actions.confirm}
                          </button>
                          {hire.status === 'active' && (
                            <button
                              onClick={() => handleCompleteHire(hire.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                            >
                              <CheckCircle size={16} />
                              {t.actions.complete}
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelHire(hire.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            disabled={hire.status === 'completed' || hire.status === 'cancelled'}
                          >
                            <XCircle size={16} />
                            {t.actions.cancel}
                          </button>
                          {hire.status === 'pending' && (
                            <Link
                              to={`/payment/${hire.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              <DollarSign size={16} />
                              {t.actions.pay}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHires;