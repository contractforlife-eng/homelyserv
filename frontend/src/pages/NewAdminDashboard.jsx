import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Eye,
  MessageCircle,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  BarChart3,
  Activity,
  RefreshCw,
  Globe,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Check,
  X,
  Plus,
  Settings,
  Bell,
  LogOut,
  Home,
  Star,
  MapPin,
  Phone,
  Mail,
  Shield,
  Award,
  PieChart,
  LineChart,
  Users as UsersIcon,
  Building,
  CreditCard,
  Wallet,
  Banknote
} from 'lucide-react';

const NewAdminDashboard = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [user, setUser] = useState(null);

  // Translations
  const translations = {
    en: {
      dashboard: 'Dashboard',
      overview: 'Overview',
      workers: 'Workers',
      employers: 'Employers',
      hires: 'Hires',
      payments: 'Payments',
      verifications: 'Verifications',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout',
      welcome: 'Welcome back, Admin',
      stats: {
        totalWorkers: 'Total Workers',
        totalEmployers: 'Total Employers',
        totalHires: 'Total Hires',
        totalRevenue: 'Total Revenue',
        pendingVerifications: 'Pending Verifications',
        activeHires: 'Active Hires',
        pendingPayments: 'Pending Payments',
        monthlyGrowth: 'Monthly Growth'
      },
      workersList: {
        title: 'Worker Management',
        searchPlaceholder: 'Search workers by name, email, or ID...',
        name: 'Name',
        email: 'Email',
        category: 'Category',
        rating: 'Rating',
        status: 'Status',
        documents: 'Documents',
        actions: 'Actions',
        verified: 'Verified',
        pending: 'Pending',
        suspended: 'Suspended',
        viewProfile: 'View Profile',
        verify: 'Verify',
        suspend: 'Suspend',
        activate: 'Activate'
      },
      employersList: {
        title: 'Employer Management',
        searchPlaceholder: 'Search employers by name, email, or ID...',
        name: 'Name',
        email: 'Email',
        hires: 'Hires',
        status: 'Status',
        joined: 'Joined',
        actions: 'Actions'
      },
      hiresList: {
        title: 'Hire Management',
        searchPlaceholder: 'Search hires by ID, worker, or employer...',
        id: 'Hire ID',
        worker: 'Worker',
        employer: 'Employer',
        salary: 'Salary',
        commission: 'Commission',
        status: 'Status',
        date: 'Date',
        actions: 'Actions',
        details: 'Details'
      },
      paymentsList: {
        title: 'Payment Management',
        searchPlaceholder: 'Search payments by reference, worker, or employer...',
        reference: 'Reference',
        worker: 'Worker',
        employer: 'Employer',
        amount: 'Amount',
        method: 'Method',
        status: 'Status',
        date: 'Date',
        actions: 'Actions',
        confirm: 'Confirm',
        reject: 'Reject',
        pending: 'Pending',
        confirmed: 'Confirmed',
        rejected: 'Rejected',
        instapay: 'InstaPay',
        vodafone: 'Vodafone Cash',
        bank: 'Bank Transfer'
      },
      verificationsList: {
        title: 'Verification Requests',
        searchPlaceholder: 'Search by worker name or ID...',
        worker: 'Worker',
        document: 'Document',
        type: 'Type',
        submitted: 'Submitted',
        status: 'Status',
        actions: 'Actions',
        approve: 'Approve',
        reject: 'Reject',
        review: 'Review'
      },
      reportsSection: {
        title: 'Reports & Analytics',
        revenue: 'Revenue Overview',
        hires: 'Hires Overview',
        workers: 'Workers Overview',
        monthlyRevenue: 'Monthly Revenue',
        monthlyHires: 'Monthly Hires',
        categories: 'Categories Distribution',
        downloadReport: 'Download Report'
      },
      actions: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        approve: 'Approve',
        reject: 'Reject',
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
        suspend: 'Suspend',
        activate: 'Activate',
        verify: 'Verify',
        download: 'Download'
      },
      confirmDialog: {
        title: 'Confirm Action',
        message: 'Are you sure you want to perform this action?',
        confirm: 'Yes, Proceed',
        cancel: 'Cancel'
      },
      loading: 'Loading dashboard...',
      error: 'Error loading data. Please try again.',
      retry: 'Retry',
      languageToggle: 'العربية',
      noResults: 'No results found',
      filterAll: 'All',
      filterVerified: 'Verified',
      filterPending: 'Pending',
      filterSuspended: 'Suspended',
      filterConfirmed: 'Confirmed',
      filterRejected: 'Rejected'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      overview: 'نظرة عامة',
      workers: 'العمال',
      employers: 'أصحاب العمل',
      hires: 'التوظيفات',
      payments: 'المدفوعات',
      verifications: 'التحقق',
      reports: 'التقارير',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      welcome: 'مرحباً بعودتك، مشرف',
      stats: {
        totalWorkers: 'إجمالي العمال',
        totalEmployers: 'إجمالي أصحاب العمل',
        totalHires: 'إجمالي التوظيفات',
        totalRevenue: 'إجمالي الإيرادات',
        pendingVerifications: 'طلبات التحقق المعلقة',
        activeHires: 'التوظيفات النشطة',
        pendingPayments: 'المدفوعات المعلقة',
        monthlyGrowth: 'النمو الشهري'
      },
      workersList: {
        title: 'إدارة العمال',
        searchPlaceholder: 'بحث عن عامل بالاسم أو البريد الإلكتروني أو المعرف...',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        category: 'الفئة',
        rating: 'التقييم',
        status: 'الحالة',
        documents: 'المستندات',
        actions: 'الإجراءات',
        verified: 'موثق',
        pending: 'قيد الانتظار',
        suspended: 'معلق',
        viewProfile: 'عرض الملف الشخصي',
        verify: 'توثيق',
        suspend: 'تعليق',
        activate: 'تفعيل'
      },
      employersList: {
        title: 'إدارة أصحاب العمل',
        searchPlaceholder: 'بحث عن صاحب عمل بالاسم أو البريد الإلكتروني أو المعرف...',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        hires: 'التوظيفات',
        status: 'الحالة',
        joined: 'تاريخ الانضمام',
        actions: 'الإجراءات'
      },
      hiresList: {
        title: 'إدارة التوظيفات',
        searchPlaceholder: 'بحث عن توظيف بالمعرف أو العامل أو صاحب العمل...',
        id: 'معرف التوظيف',
        worker: 'العامل',
        employer: 'صاحب العمل',
        salary: 'الراتب',
        commission: 'العمولة',
        status: 'الحالة',
        date: 'التاريخ',
        actions: 'الإجراءات',
        details: 'التفاصيل'
      },
      paymentsList: {
        title: 'إدارة المدفوعات',
        searchPlaceholder: 'بحث عن دفعة بالمرجع أو العامل أو صاحب العمل...',
        reference: 'المرجع',
        worker: 'العامل',
        employer: 'صاحب العمل',
        amount: 'المبلغ',
        method: 'الطريقة',
        status: 'الحالة',
        date: 'التاريخ',
        actions: 'الإجراءات',
        confirm: 'تأكيد',
        reject: 'رفض',
        pending: 'قيد الانتظار',
        confirmed: 'مؤكد',
        rejected: 'مرفوض',
        instapay: 'إنستا باي',
        vodafone: 'فودافون كاش',
        bank: 'تحويل بنكي'
      },
      verificationsList: {
        title: 'طلبات التحقق',
        searchPlaceholder: 'بحث عن عامل بالاسم أو المعرف...',
        worker: 'العامل',
        document: 'المستند',
        type: 'النوع',
        submitted: 'تاريخ التقديم',
        status: 'الحالة',
        actions: 'الإجراءات',
        approve: 'موافقة',
        reject: 'رفض',
        review: 'مراجعة'
      },
      reportsSection: {
        title: 'التقارير والتحليلات',
        revenue: 'نظرة عامة على الإيرادات',
        hires: 'نظرة عامة على التوظيفات',
        workers: 'نظرة عامة على العمال',
        monthlyRevenue: 'الإيرادات الشهرية',
        monthlyHires: 'التوظيفات الشهرية',
        categories: 'توزيع الفئات',
        downloadReport: 'تحميل التقرير'
      },
      actions: {
        confirm: 'تأكيد',
        cancel: 'إلغاء',
        approve: 'موافقة',
        reject: 'رفض',
        view: 'عرض',
        edit: 'تعديل',
        delete: 'حذف',
        suspend: 'تعليق',
        activate: 'تفعيل',
        verify: 'توثيق',
        download: 'تحميل'
      },
      confirmDialog: {
        title: 'تأكيد الإجراء',
        message: 'هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟',
        confirm: 'نعم، استمر',
        cancel: 'إلغاء'
      },
      loading: 'جاري تحميل لوحة التحكم...',
      error: 'حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      languageToggle: 'English',
      noResults: 'لا توجد نتائج',
      filterAll: 'الكل',
      filterVerified: 'موثق',
      filterPending: 'قيد الانتظار',
      filterSuspended: 'معلق',
      filterConfirmed: 'مؤكد',
      filterRejected: 'مرفوض'
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
      setUser(JSON.parse(userData));
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

  // Demo data
  const [data, setData] = useState({
    stats: {
      totalWorkers: 2547,
      totalEmployers: 1234,
      totalHires: 895,
      totalRevenue: 187500,
      pendingVerifications: 45,
      activeHires: 342,
      pendingPayments: 28,
      monthlyGrowth: 12.5
    },
    workers: [
      {
        id: 'w1',
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        category: 'Nanny',
        rating: 4.9,
        status: 'verified',
        documents: ['ID', 'Certificate'],
        joined: '2026-01-15'
      },
      {
        id: 'w2',
        name: 'Mona Hassan',
        email: 'mona@example.com',
        category: 'Elderly Caregiver',
        rating: 4.8,
        status: 'pending',
        documents: ['ID'],
        joined: '2026-02-20'
      },
      {
        id: 'w3',
        name: 'Khaled Mostafa',
        email: 'khaled@example.com',
        category: 'Driver',
        rating: 4.7,
        status: 'verified',
        documents: ['ID', 'License', 'Certificate'],
        joined: '2026-03-10'
      },
      {
        id: 'w4',
        name: 'Sara Mahmoud',
        email: 'sara@example.com',
        category: 'Cook',
        rating: 4.9,
        status: 'suspended',
        documents: ['ID', 'Certificate'],
        joined: '2026-04-05'
      },
      {
        id: 'w5',
        name: 'Youssef Ibrahim',
        email: 'youssef@example.com',
        category: 'Nurse',
        rating: 4.6,
        status: 'pending',
        documents: ['ID', 'License'],
        joined: '2026-05-12'
      }
    ],
    employers: [
      {
        id: 'e1',
        name: 'Sara Mohamed',
        email: 'sara@example.com',
        hires: 5,
        status: 'active',
        joined: '2026-01-10'
      },
      {
        id: 'e2',
        name: 'Khaled Mostafa',
        email: 'khaled@example.com',
        hires: 3,
        status: 'active',
        joined: '2026-02-15'
      },
      {
        id: 'e3',
        name: 'Nadia Ibrahim',
        email: 'nadia@example.com',
        hires: 2,
        status: 'suspended',
        joined: '2026-03-20'
      }
    ],
    hires: [
      {
        id: 'HS-2026-0001',
        worker: 'Ahmed Ali',
        employer: 'Sara Mohamed',
        salary: 3500,
        commission: 227.50,
        status: 'active',
        date: '2026-06-15'
      },
      {
        id: 'HS-2026-0002',
        worker: 'Mona Hassan',
        employer: 'Khaled Mostafa',
        salary: 4200,
        commission: 273,
        status: 'pending',
        date: '2026-06-18'
      },
      {
        id: 'HS-2026-0003',
        worker: 'Khaled Mostafa',
        employer: 'Nadia Ibrahim',
        salary: 3800,
        commission: 247,
        status: 'completed',
        date: '2026-05-01'
      }
    ],
    payments: [
      {
        id: 'p1',
        reference: 'HS-2026-0001-IP',
        worker: 'Ahmed Ali',
        employer: 'Sara Mohamed',
        amount: 3759.35,
        method: 'InstaPay',
        status: 'confirmed',
        date: '2026-06-16'
      },
      {
        id: 'p2',
        reference: 'HS-2026-0002-VC',
        worker: 'Mona Hassan',
        employer: 'Khaled Mostafa',
        amount: 4511.22,
        method: 'Vodafone Cash',
        status: 'pending',
        date: '2026-06-18'
      },
      {
        id: 'p3',
        reference: 'HS-2026-0003-BT',
        worker: 'Khaled Mostafa',
        employer: 'Nadia Ibrahim',
        amount: 4081.58,
        method: 'Bank Transfer',
        status: 'confirmed',
        date: '2026-05-02'
      },
      {
        id: 'p4',
        reference: 'HS-2026-0004-IP',
        worker: 'Sara Mahmoud',
        employer: 'Ahmed Hassan',
        amount: 4295.80,
        method: 'InstaPay',
        status: 'pending',
        date: '2026-06-20'
      }
    ],
    verifications: [
      {
        id: 'v1',
        worker: 'Mona Hassan',
        document: 'ID Card',
        type: 'Identity',
        submitted: '2026-06-18',
        status: 'pending'
      },
      {
        id: 'v2',
        worker: 'Youssef Ibrahim',
        document: 'License',
        type: 'Professional',
        submitted: '2026-06-19',
        status: 'pending'
      },
      {
        id: 'v3',
        worker: 'Ahmed Ali',
        document: 'Certificate',
        type: 'Professional',
        submitted: '2026-06-10',
        status: 'approved'
      }
    ]
  });

  // Simulate loading
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Handle confirm action
  const handleConfirmAction = (id, action) => {
    setSelectedItemId(id);
    setSelectedAction(action);
    setShowConfirmDialog(true);
  };

  // Execute action after confirmation
  const executeAction = () => {
    // Update data based on action
    if (selectedAction === 'verify_worker') {
      setData(prev => ({
        ...prev,
        workers: prev.workers.map(w =>
          w.id === selectedItemId ? { ...w, status: 'verified' } : w
        ),
        verifications: prev.verifications.filter(v => v.worker !== prev.workers.find(w => w.id === selectedItemId)?.name)
      }));
    } else if (selectedAction === 'suspend_worker') {
      setData(prev => ({
        ...prev,
        workers: prev.workers.map(w =>
          w.id === selectedItemId ? { ...w, status: 'suspended' } : w
        )
      }));
    } else if (selectedAction === 'activate_worker') {
      setData(prev => ({
        ...prev,
        workers: prev.workers.map(w =>
          w.id === selectedItemId ? { ...w, status: 'verified' } : w
        )
      }));
    } else if (selectedAction === 'confirm_payment') {
      setData(prev => ({
        ...prev,
        payments: prev.payments.map(p =>
          p.id === selectedItemId ? { ...p, status: 'confirmed' } : p
        )
      }));
    } else if (selectedAction === 'reject_payment') {
      setData(prev => ({
        ...prev,
        payments: prev.payments.map(p =>
          p.id === selectedItemId ? { ...p, status: 'rejected' } : p
        )
      }));
    } else if (selectedAction === 'approve_verification') {
      setData(prev => ({
        ...prev,
        verifications: prev.verifications.map(v =>
          v.id === selectedItemId ? { ...v, status: 'approved' } : v
        )
      }));
    } else if (selectedAction === 'reject_verification') {
      setData(prev => ({
        ...prev,
        verifications: prev.verifications.map(v =>
          v.id === selectedItemId ? { ...v, status: 'rejected' } : v
        )
      }));
    }
    setShowConfirmDialog(false);
    setSelectedItemId(null);
    setSelectedAction('');
  };

  // Get filtered data
  const getFilteredData = () => {
    const searchLower = searchTerm.toLowerCase();

    switch (activeTab) {
      case 'workers':
        return data.workers.filter(w =>
          w.name.toLowerCase().includes(searchLower) ||
          w.email.toLowerCase().includes(searchLower) ||
          w.id.toLowerCase().includes(searchLower)
        );
      case 'employers':
        return data.employers.filter(e =>
          e.name.toLowerCase().includes(searchLower) ||
          e.email.toLowerCase().includes(searchLower) ||
          e.id.toLowerCase().includes(searchLower)
        );
      case 'hires':
        return data.hires.filter(h =>
          h.id.toLowerCase().includes(searchLower) ||
          h.worker.toLowerCase().includes(searchLower) ||
          h.employer.toLowerCase().includes(searchLower)
        );
      case 'payments':
        let filtered = data.payments;
        if (selectedStatus !== 'all') {
          filtered = filtered.filter(p => p.status === selectedStatus);
        }
        if (selectedPaymentMethod !== 'all') {
          filtered = filtered.filter(p => p.method.toLowerCase() === selectedPaymentMethod);
        }
        return filtered.filter(p =>
          p.reference.toLowerCase().includes(searchLower) ||
          p.worker.toLowerCase().includes(searchLower) ||
          p.employer.toLowerCase().includes(searchLower)
        );
      case 'verifications':
        return data.verifications.filter(v =>
          v.worker.toLowerCase().includes(searchLower) ||
          v.id.toLowerCase().includes(searchLower)
        );
      default:
        return [];
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      confirmed: 'bg-green-100 text-green-800',
      rejected: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
      case 'confirmed':
      case 'approved':
      case 'active':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'suspended':
      case 'rejected':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      verified: t.filterVerified,
      pending: t.filterPending,
      suspended: t.filterSuspended,
      confirmed: t.filterConfirmed,
      rejected: t.filterRejected,
      active: 'Active',
      completed: 'Completed',
      approved: 'Approved'
    };
    return labels[status] || status;
  };

  const filteredData = getFilteredData();

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">HomelyServ</span>
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={20} />
              <span>{t.overview}</span>
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'workers'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              <span>{t.workers}</span>
              <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {data.workers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('employers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'employers'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building size={20} />
              <span>{t.employers}</span>
              <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {data.employers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('hires')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'hires'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={20} />
              <span>{t.hires}</span>
              <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {data.hires.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'payments'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign size={20} />
              <span>{t.payments}</span>
              <span className="ml-auto bg-yellow-100 text-yellow-600 text-xs px-2 py-0.5 rounded-full">
                {data.payments.filter(p => p.status === 'pending').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'verifications'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shield size={20} />
              <span>{t.verifications}</span>
              <span className="ml-auto bg-yellow-100 text-yellow-600 text-xs px-2 py-0.5 rounded-full">
                {data.verifications.filter(v => v.status === 'pending').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'reports'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <PieChart size={20} />
              <span>{t.reports}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
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
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t.dashboard}</h1>
              <p className="text-gray-500 text-sm">{t.welcome}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm"
              >
                <Globe size={16} className="text-gray-600" />
                <span className="font-medium">{t.languageToggle}</span>
              </button>
              <div className="flex items-center gap-3 ml-4">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Admin User</p>
                  <p className="text-xs text-gray-500">admin@homelyserv.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalWorkers}</p>
                      <p className="text-2xl font-bold text-gray-800">{data.stats.totalWorkers.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Users size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+12%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalEmployers}</p>
                      <p className="text-2xl font-bold text-gray-800">{data.stats.totalEmployers.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <Building size={24} className="text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+8%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalHires}</p>
                      <p className="text-2xl font-bold text-gray-800">{data.stats.totalHires.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Briefcase size={24} className="text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+15%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalRevenue}</p>
                      <p className="text-2xl font-bold text-gray-800">EGP {data.stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                      <DollarSign size={24} className="text-red-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+18%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.pendingVerifications}</p>
                      <p className="text-xl font-bold text-gray-800">{data.stats.pendingVerifications}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.activeHires}</p>
                      <p className="text-xl font-bold text-gray-800">{data.stats.activeHires}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <AlertCircle size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.pendingPayments}</p>
                      <p className="text-xl font-bold text-gray-800">{data.stats.pendingPayments}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '8%' }}></div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm"><span className="font-medium">Ahmed Ali</span> verified successfully</p>
                      <p className="text-xs text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm">New hire <span className="font-medium">HS-2026-0002</span> pending payment</p>
                      <p className="text-xs text-gray-400">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <DollarSign size={16} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm">Payment <span className="font-medium">EGP 4,511.22</span> received via Vodafone Cash</p>
                      <p className="text-xs text-gray-400">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm">New employer <span className="font-medium">Nadia Ibrahim</span> registered</p>
                      <p className="text-xs text-gray-400">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workers Tab */}
          {activeTab === 'workers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-800">{t.workersList.title}</h2>
                  <div className="flex gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t.workersList.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm">
                      <Plus size={18} className="inline mr-1" />
                      Add Worker
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.workersList.name}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.workersList.email}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.workersList.category}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.workersList.rating}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.workersList.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.workersList.documents}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.workersList.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">{t.noResults}</td>
                      </tr>
                    ) : (
                      filteredData.map((worker) => (
                        <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                                {worker.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-800">{worker.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{worker.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{worker.category}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Star size={14} className="fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{worker.rating}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(worker.status)}`}>
                              {getStatusIcon(worker.status)}
                              {getStatusLabel(worker.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{worker.documents.length} files</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                                <Eye size={16} />
                              </button>
                              {worker.status === 'pending' && (
                                <button
                                  onClick={() => handleConfirmAction(worker.id, 'verify_worker')}
                                  className="p-1.5 text-green-500 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                                  title={t.actions.verify}
                                >
                                  <Check size={16} />
                                </button>
                              )}
                              {worker.status === 'verified' && (
                                <button
                                  onClick={() => handleConfirmAction(worker.id, 'suspend_worker')}
                                  className="p-1.5 text-red-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                  title={t.actions.suspend}
                                >
                                  <UserX size={16} />
                                </button>
                              )}
                              {worker.status === 'suspended' && (
                                <button
                                  onClick={() => handleConfirmAction(worker.id, 'activate_worker')}
                                  className="p-1.5 text-green-500 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                                  title={t.actions.activate}
                                >
                                  <UserCheck size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Employers Tab */}
          {activeTab === 'employers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-800">{t.employersList.title}</h2>
                  <div className="relative flex-1 md:flex-none">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.employersList.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.employersList.name}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.employersList.email}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.employersList.hires}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.employersList.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.employersList.joined}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.employersList.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">{t.noResults}</td>
                      </tr>
                    ) : (
                      filteredData.map((employer) => (
                        <tr key={employer.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                                {employer.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-800">{employer.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{employer.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{employer.hires}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(employer.status)}`}>
                              {getStatusIcon(employer.status)}
                              {getStatusLabel(employer.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{employer.joined}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                                <Eye size={16} />
                              </button>
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                                <MessageCircle size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Hires Tab */}
          {activeTab === 'hires' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-800">{t.hiresList.title}</h2>
                  <div className="relative flex-1 md:flex-none">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.hiresList.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.hiresList.id}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.hiresList.worker}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.hiresList.employer}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.hiresList.salary}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.hiresList.commission}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.hiresList.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.hiresList.date}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.hiresList.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">{t.noResults}</td>
                      </tr>
                    ) : (
                      filteredData.map((hire) => (
                        <tr key={hire.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">{hire.id}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">{hire.worker}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{hire.employer}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">EGP {hire.salary.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">EGP {hire.commission.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(hire.status)}`}>
                              {getStatusIcon(hire.status)}
                              {getStatusLabel(hire.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{hire.date}</td>
                          <td className="px-6 py-4">
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-800">{t.paymentsList.title}</h2>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t.paymentsList.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      />
                    </div>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      <option value="all">{t.filterAll}</option>
                      <option value="pending">{t.filterPending}</option>
                      <option value="confirmed">{t.filterConfirmed}</option>
                      <option value="rejected">{t.filterRejected}</option>
                    </select>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      <option value="all">All Methods</option>
                      <option value="instapay">{t.paymentsList.instapay}</option>
                      <option value="vodafone cash">{t.paymentsList.vodafone}</option>
                      <option value="bank transfer">{t.paymentsList.bank}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.paymentsList.reference}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.paymentsList.worker}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.paymentsList.employer}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.paymentsList.amount}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.paymentsList.method}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.paymentsList.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.paymentsList.date}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.paymentsList.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">{t.noResults}</td>
                      </tr>
                    ) : (
                      filteredData.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">{payment.reference}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">{payment.worker}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.employer}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800">EGP {payment.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              payment.method === 'InstaPay' ? 'bg-blue-100 text-blue-800' :
                              payment.method === 'Vodafone Cash' ? 'bg-orange-100 text-orange-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {payment.method === 'InstaPay' && <Wallet size={12} />}
                              {payment.method === 'Vodafone Cash' && <Phone size={12} />}
                              {payment.method === 'Bank Transfer' && <Banknote size={12} />}
                              {payment.method}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              {getStatusLabel(payment.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.date}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {payment.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmAction(payment.id, 'confirm_payment')}
                                    className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 transition-colors rounded-lg"
                                    title={t.paymentsList.confirm}
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleConfirmAction(payment.id, 'reject_payment')}
                                    className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 transition-colors rounded-lg"
                                    title={t.paymentsList.reject}
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Verifications Tab */}
          {activeTab === 'verifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-800">{t.verificationsList.title}</h2>
                  <div className="relative flex-1 md:flex-none">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.verificationsList.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.verificationsList.worker}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.verificationsList.document}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.verificationsList.type}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.verificationsList.submitted}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.verificationsList.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.verificationsList.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">{t.noResults}</td>
                      </tr>
                    ) : (
                      filteredData.map((verification) => (
                        <tr key={verification.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-800">{verification.worker}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{verification.document}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{verification.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{verification.submitted}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(verification.status)}`}>
                              {getStatusIcon(verification.status)}
                              {getStatusLabel(verification.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {verification.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmAction(verification.id, 'approve_verification')}
                                    className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 transition-colors rounded-lg"
                                    title={t.verificationsList.approve}
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleConfirmAction(verification.id, 'reject_verification')}
                                    className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 transition-colors rounded-lg"
                                    title={t.verificationsList.reject}
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                                <FileText size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">{t.reportsSection.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">{t.reportsSection.revenue}</h3>
                  <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <LineChart size={48} className="mx-auto mb-2" />
                      <p className="text-sm">Revenue Chart</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">This Month</p>
                      <p className="text-lg font-bold text-gray-800">EGP 18,750</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Month</p>
                      <p className="text-lg font-bold text-gray-800">EGP 15,200</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Growth</p>
                      <p className="text-lg font-bold text-green-600">+23%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">{t.reportsSection.hires}</h3>
                  <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <BarChart3 size={48} className="mx-auto mb-2" />
                      <p className="text-sm">Hires Chart</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-lg font-bold text-gray-800">{data.stats.totalHires}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Active</p>
                      <p className="text-lg font-bold text-gray-800">{data.stats.activeHires}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Completed</p>
                      <p className="text-lg font-bold text-gray-800">553</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">{t.reportsSection.categories}</h3>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      <Download size={16} />
                      {t.reportsSection.downloadReport}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Nanny</p>
                      <p className="text-xl font-bold text-gray-800">342</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-red-600 h-1.5 rounded-full" style={{ width: '34%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Elderly Care</p>
                      <p className="text-xl font-bold text-gray-800">215</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '21%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Driver</p>
                      <p className="text-xl font-bold text-gray-800">178</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '18%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Other</p>
                      <p className="text-xl font-bold text-gray-800">160</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '16%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">{t.settings}</h2>
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Commission Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Commission Rate (%)</label>
                      <input
                        type="number"
                        defaultValue="6.5"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">VAT Rate (%)</label>
                      <input
                        type="number"
                        defaultValue="14"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Payment Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Recipient Phone (InstaPay/Vodafone Cash)</label>
                      <input
                        type="text"
                        defaultValue="01009189851"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        defaultValue="1002425938683"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">IBAN</label>
                      <input
                        type="text"
                        defaultValue="EG580037000908181002425938683"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">SWIFT Code</label>
                      <input
                        type="text"
                        defaultValue="QNBAEGCXXXX"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">System Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Default Language</label>
                      <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Currency</label>
                      <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="EGP">EGP</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <button className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t.confirmDialog.title}</h3>
            <p className="text-gray-600 mb-6">{t.confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedItemId(null);
                  setSelectedAction('');
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t.confirmDialog.cancel}
              </button>
              <button
                onClick={executeAction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.confirmDialog.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAdminDashboard;