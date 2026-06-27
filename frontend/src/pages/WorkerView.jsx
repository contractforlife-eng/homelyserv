<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Briefcase,
  Bell,
  MessageCircle,
  Star,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Eye,
  TrendingUp,
  Users,
  Building,
  Home,
  Settings,
  LogOut,
  Globe,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  Shield,
  Bookmark,
  
  MapPin,
  Phone,
  Mail,
  Heart,
  Share2,
  ExternalLink,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  UserCheck,
  UserX,
  FileCheck,
  FileX,
  BadgeCheck,
  Trophy,
  Target,
  Sparkles,
  HeartHandshake,
  Wallet,
  CreditCard,
  Banknote,
  Receipt,
  Archive,
  RefreshCw,
  Copy,
  Check,
  Printer,
  Trash2,
  Pencil,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  PieChart,
  BarChart3,
  LineChart,
  Activity,
  Zap,
  Coins,
  Gift,
  Users as UsersIcon,
  Briefcase as BriefcaseIcon
} from 'lucide-react';

const WorkerView = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [worker, setWorker] = useState(null);
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Translations
  const translations = {
    en: {
      title: 'Worker Dashboard',
      welcome: 'Welcome back,',
      profile: 'Profile',
      applications: 'Applications',
      messages: 'Messages',
      notifications: 'Notifications',
      earnings: 'Earnings',
      settings: 'Settings',
      logout: 'Log Out',
      overview: 'Overview',
      stats: {
        totalApplications: 'Total Applications',
        activeApplications: 'Active',
        completedHires: 'Completed Hires',
        totalEarnings: 'Total Earnings',
        pendingApplications: 'Pending',
        interviews: 'Interviews',
        responseRate: 'Response Rate'
      },
      profileSection: {
        title: 'My Profile',
        editProfile: 'Edit Profile',
        personalInfo: 'Personal Information',
        workInfo: 'Work Information',
        skills: 'Skills',
        experience: 'Experience',
        documents: 'Documents',
        availability: 'Availability',
        workType: 'Work Type',
        salary: 'Expected Salary',
        category: 'Category',
        experienceYears: 'Years of Experience',
        location: 'Location',
        phone: 'Phone',
        email: 'Email',
        bio: 'About Me',
        verified: 'Verified',
        pending: 'Pending Verification',
        notVerified: 'Not Verified',
        saveChanges: 'Save Changes',
        cancel: 'Cancel',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        passwordUpdated: 'Password updated successfully!'
      },
      applicationsSection: {
        title: 'My Applications',
        noApplications: 'No applications yet',
        startSearching: 'Start Searching',
        status: {
          pending: 'Pending',
          review: 'Under Review',
          interview: 'Interview Scheduled',
          offered: 'Offer Received',
          hired: 'Hired',
          completed: 'Completed',
          rejected: 'Rejected',
          cancelled: 'Cancelled'
        },
        details: {
          position: 'Position',
          employer: 'Employer',
          salary: 'Offered Salary',
          date: 'Date Applied',
          status: 'Status',
          viewDetails: 'View Details',
          withdraw: 'Withdraw Application',
          accept: 'Accept Offer',
          decline: 'Decline Offer'
        }
      },
      messagesSection: {
        title: 'Messages',
        noMessages: 'No messages yet',
        searchPlaceholder: 'Search messages...',
        sendMessage: 'Send Message',
        reply: 'Reply',
        read: 'Read',
        unread: 'Unread'
      },
      notificationsSection: {
        title: 'Notifications',
        noNotifications: 'No notifications yet',
        markAllRead: 'Mark All Read',
        read: 'Read',
        unread: 'Unread'
      },
      earningsSection: {
        title: 'Earnings Overview',
        totalEarnings: 'Total Earnings',
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
        pendingPayment: 'Pending Payment',
        paid: 'Paid',
        totalJobs: 'Total Jobs',
        averagePerJob: 'Average Per Job',
        transactions: 'Transactions',
        noTransactions: 'No transactions yet',
        date: 'Date',
        amount: 'Amount',
        status: 'Status',
        reference: 'Reference'
      },
      settingsSection: {
        title: 'Settings',
        language: 'Language',
        notifications: 'Notification Settings',
        emailNotifications: 'Email Notifications',
        pushNotifications: 'Push Notifications',
        smsNotifications: 'SMS Notifications',
        privacy: 'Privacy Settings',
        profileVisibility: 'Profile Visibility',
        public: 'Public',
        private: 'Private',
        showEmail: 'Show Email',
        showPhone: 'Show Phone',
        account: 'Account Settings',
        deactivateAccount: 'Deactivate Account',
        deleteAccount: 'Delete Account'
      },
      errors: {
        required: 'This field is required',
        passwordMismatch: 'Passwords do not match',
        currentPasswordWrong: 'Current password is incorrect',
        fileSize: 'File size must be less than 5MB',
        fileType: 'Please upload a valid file'
      },
      success: {
        profileUpdated: 'Profile updated successfully!',
        applicationWithdrawn: 'Application withdrawn successfully!',
        offerAccepted: 'Offer accepted successfully!',
        offerDeclined: 'Offer declined'
      },
      loading: 'Loading dashboard...',
      languageToggle: 'العربية'
    },
    ar: {
      title: 'لوحة تحكم العامل',
      welcome: 'مرحباً بعودتك،',
      profile: 'الملف الشخصي',
      applications: 'الطلبات',
      messages: 'الرسائل',
      notifications: 'الإشعارات',
      earnings: 'الأرباح',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة',
      stats: {
        totalApplications: 'إجمالي الطلبات',
        activeApplications: 'نشط',
        completedHires: 'توظيفات مكتملة',
        totalEarnings: 'إجمالي الأرباح',
        pendingApplications: 'قيد الانتظار',
        interviews: 'مقابلات',
        responseRate: 'معدل الاستجابة'
      },
      profileSection: {
        title: 'ملفي الشخصي',
        editProfile: 'تعديل الملف الشخصي',
        personalInfo: 'معلومات شخصية',
        workInfo: 'معلومات العمل',
        skills: 'المهارات',
        experience: 'الخبرات',
        documents: 'المستندات',
        availability: 'التوفر',
        workType: 'نوع العمل',
        salary: 'الراتب المتوقع',
        category: 'الفئة',
        experienceYears: 'سنوات الخبرة',
        location: 'الموقع',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        bio: 'نبذة عني',
        verified: 'موثق',
        pending: 'قيد التحقق',
        notVerified: 'غير موثق',
        saveChanges: 'حفظ التغييرات',
        cancel: 'إلغاء',
        changePassword: 'تغيير كلمة المرور',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور',
        passwordUpdated: 'تم تحديث كلمة المرور بنجاح!'
      },
      applicationsSection: {
        title: 'طلباتي',
        noApplications: 'لا توجد طلبات بعد',
        startSearching: 'بدء البحث',
        status: {
          pending: 'قيد الانتظار',
          review: 'قيد المراجعة',
          interview: 'مقابلة مجدولة',
          offered: 'تم استلام عرض',
          hired: 'تم التوظيف',
          completed: 'مكتمل',
          rejected: 'مرفوض',
          cancelled: 'ملغي'
        },
        details: {
          position: 'الوظيفة',
          employer: 'صاحب العمل',
          salary: 'الراتب المعروض',
          date: 'تاريخ التقديم',
          status: 'الحالة',
          viewDetails: 'عرض التفاصيل',
          withdraw: 'سحب الطلب',
          accept: 'قبول العرض',
          decline: 'رفض العرض'
        }
      },
      messagesSection: {
        title: 'الرسائل',
        noMessages: 'لا توجد رسائل بعد',
        searchPlaceholder: 'بحث في الرسائل...',
        sendMessage: 'إرسال رسالة',
        reply: 'رد',
        read: 'مقروء',
        unread: 'غير مقروء'
      },
      notificationsSection: {
        title: 'الإشعارات',
        noNotifications: 'لا توجد إشعارات بعد',
        markAllRead: 'تحديد الكل كمقروء',
        read: 'مقروء',
        unread: 'غير مقروء'
      },
      earningsSection: {
        title: 'نظرة عامة على الأرباح',
        totalEarnings: 'إجمالي الأرباح',
        thisMonth: 'هذا الشهر',
        lastMonth: 'الشهر الماضي',
        pendingPayment: 'مدفوعات معلقة',
        paid: 'مدفوع',
        totalJobs: 'إجمالي الوظائف',
        averagePerJob: 'المتوسط لكل وظيفة',
        transactions: 'المعاملات',
        noTransactions: 'لا توجد معاملات بعد',
        date: 'التاريخ',
        amount: 'المبلغ',
        status: 'الحالة',
        reference: 'المرجع'
      },
      settingsSection: {
        title: 'الإعدادات',
        language: 'اللغة',
        notifications: 'إعدادات الإشعارات',
        emailNotifications: 'إشعارات البريد الإلكتروني',
        pushNotifications: 'إشعارات التطبيق',
        smsNotifications: 'إشعارات الرسائل النصية',
        privacy: 'إعدادات الخصوصية',
        profileVisibility: 'ظهور الملف الشخصي',
        public: 'عام',
        private: 'خاص',
        showEmail: 'إظهار البريد الإلكتروني',
        showPhone: 'إظهار رقم الهاتف',
        account: 'إعدادات الحساب',
        deactivateAccount: 'إلغاء تنشيط الحساب',
        deleteAccount: 'حذف الحساب'
      },
      errors: {
        required: 'هذا الحقل مطلوب',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        currentPasswordWrong: 'كلمة المرور الحالية غير صحيحة',
        fileSize: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت',
        fileType: 'يرجى تحميل ملف صحيح'
      },
      success: {
        profileUpdated: 'تم تحديث الملف الشخصي بنجاح!',
        applicationWithdrawn: 'تم سحب الطلب بنجاح!',
        offerAccepted: 'تم قبول العرض بنجاح!',
        offerDeclined: 'تم رفض العرض'
      },
      loading: 'جاري تحميل لوحة التحكم...',
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
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Toggle language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  // Fetch worker data
  useEffect(() => {
    const fetchWorkerData = async () => {
      setLoading(true);
      try {
        // In production, this would be API calls
        // const workerRes = await fetch('/api/worker/profile');
        // const applicationsRes = await fetch('/api/worker/applications');
        // const messagesRes = await fetch('/api/worker/messages');
        // const notificationsRes = await fetch('/api/worker/notifications');
        
        // Demo data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoWorker = {
          id: 'w1',
          name: 'Ahmed Ali',
          email: 'ahmed@example.com',
          phone: '+201234567890',
          location: 'Cairo, Egypt',
          category: 'nanny',
          categoryLabel: 'Nanny',
          rating: 4.9,
          reviewCount: 127,
          salary: 3500,
          availability: 'available',
          workType: 'full-time',
          experienceYears: 5,
          verified: true,
          documentsVerified: true,
          identityVerified: true,
          backgroundCheck: true,
          image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=400&h=400&fit=crop&crop=face',
          skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking', 'Swimming'],
          bio: 'Experienced nanny with 5 years of experience. Passionate about childcare and child development.',
          bioAr: 'مربية أطفال ذات خبرة 5 سنوات. شغوفة برعاية الأطفال وتنمية مهاراتهم.',
          stats: {
            totalEarnings: 156000,
            totalApplications: 24,
            activeApplications: 3,
            completedHires: 12,
            pendingApplications: 4,
            interviews: 3,
            responseRate: 95
          }
        };
        
        const demoApplications = [
          {
            id: 'app1',
            position: 'Nanny - Full Time',
            employer: 'Sara Mohamed',
            salary: 4000,
            date: '2026-06-15',
            status: 'hired',
            startDate: '2026-07-01'
          },
          {
            id: 'app2',
            position: 'Nanny - Part Time',
            employer: 'Khaled Mostafa',
            salary: 3500,
            date: '2026-06-10',
            status: 'interview'
          },
          {
            id: 'app3',
            position: 'Live-in Nanny',
            employer: 'Nadia Ibrahim',
            salary: 4500,
            date: '2026-06-05',
            status: 'offered'
          },
          {
            id: 'app4',
            position: 'Nanny - Full Time',
            employer: 'Hassan Ali',
            salary: 3800,
            date: '2026-05-28',
            status: 'pending'
          },
          {
            id: 'app5',
            position: 'Nanny - Contract',
            employer: 'Mona Hassan',
            salary: 4200,
            date: '2026-05-20',
            status: 'completed'
          }
        ];
        
        const demoMessages = [
          {
            id: 'msg1',
            from: 'Sara Mohamed',
            message: 'We are interested in hiring you. When can you start?',
            time: '2 hours ago',
            read: false
          },
          {
            id: 'msg2',
            from: 'Khaled Mostafa',
            message: 'Can we schedule an interview tomorrow?',
            time: '5 hours ago',
            read: true
          },
          {
            id: 'msg3',
            from: 'Nadia Ibrahim',
            message: 'Thank you for your application. We will be in touch.',
            time: '1 day ago',
            read: true
          }
        ];
        
        const demoNotifications = [
          {
            id: 'not1',
            title: 'New Offer',
            message: 'Nadia Ibrahim has sent you a job offer',
            time: '2 hours ago',
            read: false
          },
          {
            id: 'not2',
            title: 'Application Status',
            message: 'Your application for Nanny at Khaled Mostafa has been updated',
            time: '5 hours ago',
            read: false
          },
          {
            id: 'not3',
            title: 'Interview Scheduled',
            message: 'Interview for Nanny position with Sara Mohamed is scheduled',
            time: '1 day ago',
            read: true
          },
          {
            id: 'not4',
            title: 'Profile Verification',
            message: 'Your profile has been verified successfully',
            time: '2 days ago',
            read: true
          }
        ];
        
        setWorker(demoWorker);
        setEditForm(demoWorker);
        setApplications(demoApplications);
        setMessages(demoMessages);
        setNotifications(demoNotifications);
        
      } catch (error) {
        console.error('Error fetching worker data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkerData();
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // In production: API call to update profile
      // await fetch('/api/worker/profile', {
      //   method: 'PUT',
      //   body: JSON.stringify(editForm)
      // });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWorker(editForm);
      setShowEditProfile(false);
      alert(t.success.profileUpdated);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(t.errors.passwordMismatch);
      return;
    }
    try {
      // In production: API call to change password
      // await fetch('/api/worker/change-password', {
      //   method: 'POST',
      //   body: JSON.stringify(passwordForm)
      // });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert(t.profileSection.passwordUpdated);
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  // Handle application actions
  const handleWithdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      // In production: API call to withdraw application
      // await fetch(`/api/worker/applications/${applicationId}/withdraw`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 500));
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: 'cancelled' } : app
      ));
      alert(t.success.applicationWithdrawn);
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  const handleAcceptOffer = async (applicationId) => {
    if (!window.confirm('Are you sure you want to accept this offer?')) return;
    try {
      // In production: API call to accept offer
      // await fetch(`/api/worker/applications/${applicationId}/accept`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 500));
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: 'hired' } : app
      ));
      alert(t.success.offerAccepted);
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handleDeclineOffer = async (applicationId) => {
    if (!window.confirm('Are you sure you want to decline this offer?')) return;
    try {
      // In production: API call to decline offer
      // await fetch(`/api/worker/applications/${applicationId}/decline`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 500));
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: 'rejected' } : app
      ));
      alert(t.success.offerDeclined);
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      review: 'bg-blue-100 text-blue-800',
      interview: 'bg-purple-100 text-purple-800',
      offered: 'bg-orange-100 text-orange-800',
      hired: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status label
  const getStatusLabel = (status) => {
    return t.applicationsSection.status[status] || status;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'review': return <Eye size={14} />;
      case 'interview': return <Calendar size={14} />;
      case 'offered': return <Award size={14} />;
      case 'hired': return <UserCheck size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      case 'cancelled': return <AlertCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const isRTL = language === 'ar';

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

  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-500">Unable to load your profile.</p>
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
          
          {/* User Profile */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={worker.image}
                alt={worker.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
              <div>
                <p className="font-semibold text-gray-800">{worker.name}</p>
                <p className="text-xs text-gray-500">{worker.categoryLabel}</p>
              </div>
            </div>
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
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User size={20} />
              <span>{t.profile}</span>
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'applications'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={20} />
              <span>{t.applications}</span>
              {applications.filter(a => a.status === 'pending' || a.status === 'offered').length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {applications.filter(a => a.status === 'pending' || a.status === 'offered').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'messages'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageCircle size={20} />
              <span>{t.messages}</span>
              {messages.filter(m => !m.read).length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {messages.filter(m => !m.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bell size={20} />
              <span>{t.notifications}</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'earnings'
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign size={20} />
              <span>{t.earnings}</span>
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
=======
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Briefcase,
  FileText,
  MessageCircle,
  Settings,
  LogOut,
  Home,
  Bell,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Award
} from 'lucide-react';

function WorkerView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    navigate('/login');
  };

  // Worker data
  const worker = {
    name: 'Ahmed Mohamed',
    email: 'ahmed@homelyserv.com',
    phone: '+201234567890',
    location: 'Cairo, Egypt',
    category: 'Nanny',
    rating: 4.9,
    reviewCount: 127,
    image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face',
    experience: 5,
    salary: 3500,
    availability: 'Available',
    verified: true,
    skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking'],
    offers: [
      { id: 1, employer: 'Sara Mohamed', position: 'Nanny - Full Time', salary: 4000, status: 'pending', date: '2026-06-20' },
      { id: 2, employer: 'Khaled Mostafa', position: 'Nanny - Part Time', salary: 3500, status: 'accepted', date: '2026-06-15' },
      { id: 3, employer: 'Nadia Ibrahim', position: 'Live-in Nanny', salary: 4500, status: 'rejected', date: '2026-06-10' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
        </div>
        <div className="px-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={worker.image} alt={worker.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
            <div>
              <p className="font-semibold text-gray-800">{worker.name}</p>
              <p className="text-xs text-gray-500">{worker.category}</p>
            </div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Home size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'profile' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <User size={20} /> Profile
          </button>
          <button onClick={() => setActiveTab('offers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'offers' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Briefcase size={20} /> Offers
          </button>
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'messages' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <MessageCircle size={20} /> Messages
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'settings' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Settings size={20} /> Settings
          </button>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition">
            <LogOut size={20} /> Logout
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
          </button>
        </div>
      </div>

      {/* Main Content */}
<<<<<<< HEAD
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
              <p className="text-gray-500 text-sm">{t.welcome} {worker.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm"
              >
                <Globe size={16} className="text-gray-600" />
                <span className="font-medium">{t.languageToggle}</span>
              </button>
              <button
                onClick={() => navigate('/search')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Search size={16} />
                Find Jobs
              </button>
=======
      <div className="flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Worker Dashboard</h2>
            <div className="flex items-center gap-4">
              <button className="relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <span className="text-sm text-gray-500">{worker.name}</span>
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
            </div>
          </div>
        </header>

<<<<<<< HEAD
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
                      <p className="text-sm text-gray-500">{t.stats.totalApplications}</p>
                      <p className="text-2xl font-bold text-gray-800">{worker.stats.totalApplications}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Briefcase size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span className="text-gray-400">{worker.stats.activeApplications} active</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400">{worker.stats.pendingApplications} pending</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.completedHires}</p>
                      <p className="text-2xl font-bold text-gray-800">{worker.stats.completedHires}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span className="text-gray-400">{worker.stats.interviews} interviews</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t.stats.totalEarnings}</p>
                      <p className="text-2xl font-bold text-gray-800">EGP {worker.stats.totalEarnings.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                      <DollarSign size={24} className="text-red-600" />
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
                      <p className="text-sm text-gray-500">{t.stats.responseRate}</p>
                      <p className="text-2xl font-bold text-gray-800">{worker.stats.responseRate}%</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Users size={24} className="text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span className="text-gray-400">Excellent response rate</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Applications</h3>
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{app.position}</p>
                          <p className="text-sm text-gray-500">{app.employer}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {getStatusLabel(app.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Messages</h3>
                  <div className="space-y-3">
                    {messages.slice(0, 3).map((msg) => (
                      <div key={msg.id} className={`p-3 rounded-lg ${!msg.read ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-800">{msg.from}</p>
                          <span className="text-xs text-gray-400">{msg.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t.profileSection.title}</h2>
                  <p className="text-gray-500 text-sm">Manage your personal and professional information</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    {t.profileSection.changePassword}
                  </button>
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <Edit size={16} />
                    {t.profileSection.editProfile}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Image & Basic Info */}
                <div className="md:col-span-1">
                  <img
                    src={worker.image}
                    alt={worker.name}
                    className="w-full rounded-lg object-cover aspect-square"
                  />
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-bold text-gray-800">{worker.name}</h3>
                    <p className="text-gray-500">{worker.categoryLabel}</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{worker.rating}</span>
                      <span className="text-sm text-gray-400">({worker.reviewCount} reviews)</span>
                    </div>
                    {worker.verified && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-sm text-green-600">
                        <BadgeCheck size={16} />
                        {t.profileSection.verified}
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">{t.profileSection.personalInfo}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={16} className="text-gray-400" />
                          {worker.email}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone size={16} className="text-gray-400" />
                          {worker.phone}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} className="text-gray-400" />
                          {worker.location}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">{t.profileSection.workInfo}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase size={16} className="text-gray-400" />
                          {worker.categoryLabel}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={16} className="text-gray-400" />
                          {worker.experienceYears} years experience
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign size={16} className="text-gray-400" />
                          EGP {worker.salary.toLocaleString()}/month
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={16} className="text-gray-400" />
                          {worker.workType.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">{t.profileSection.bio}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {isRTL ? worker.bioAr || worker.bio : worker.bio}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">{t.profileSection.skills}</h4>
                    <div className="flex flex-wrap gap-2">
                      {worker.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Verification Status</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {worker.identityVerified ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Clock size={16} className="text-yellow-500" />
                        )}
                        <span>Identity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {worker.documentsVerified ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Clock size={16} className="text-yellow-500" />
                        )}
                        <span>Documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {worker.backgroundCheck ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Clock size={16} className="text-yellow-500" />
                        )}
                        <span>Background Check</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t.applicationsSection.title}</h2>
                  <p className="text-gray-500 text-sm">Track all your job applications</p>
                </div>
                <Link
                  to="/search"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                >
                  <Search size={16} />
                  Find Jobs
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.applicationsSection.noApplications}</h3>
                  <p className="text-gray-500">Start applying for jobs today</p>
                  <Link
                    to="/search"
                    className="mt-4 inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t.applicationsSection.startSearching}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-800">{app.position}</h3>
                          <p className="text-sm text-gray-600">{app.employer}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <DollarSign size={14} />
                              EGP {app.salary.toLocaleString()}/month
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {app.date}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            {getStatusLabel(app.status)}
                          </span>
                          <div className="flex gap-2">
                            {app.status === 'pending' && (
                              <button
                                onClick={() => handleWithdrawApplication(app.id)}
                                className="text-xs text-red-600 hover:text-red-700 transition-colors"
                              >
                                {t.applicationsSection.details.withdraw}
                              </button>
                            )}
                            {app.status === 'offered' && (
                              <>
                                <button
                                  onClick={() => handleAcceptOffer(app.id)}
                                  className="text-xs text-green-600 hover:text-green-700 transition-colors"
                                >
                                  {t.applicationsSection.details.accept}
                                </button>
                                <button
                                  onClick={() => handleDeclineOffer(app.id)}
                                  className="text-xs text-red-600 hover:text-red-700 transition-colors"
                                >
                                  {t.applicationsSection.details.decline}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t.messagesSection.title}</h2>
                  <p className="text-gray-500 text-sm">View and manage your messages</p>
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.messagesSection.noMessages}</h3>
                  <p className="text-gray-500">Your messages will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        !msg.read ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                      } hover:shadow-sm`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{msg.from}</p>
                          <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{msg.time}</span>
                      </div>
                      {!msg.read && (
                        <div className="mt-2">
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {t.messagesSection.unread}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t.notificationsSection.title}</h2>
                  <p className="text-gray-500 text-sm">Stay updated with your latest activity</p>
                </div>
                <button className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors">
                  {t.notificationsSection.markAllRead}
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔔</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.notificationsSection.noNotifications}</h3>
                  <p className="text-gray-500">Your notifications will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-lg border transition-all ${
                        !notif.read ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm text-gray-500">{t.earningsSection.totalEarnings}</p>
                  <p className="text-2xl font-bold text-gray-800">EGP {worker.stats.totalEarnings.toLocaleString()}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-green-500">+12%</span>
                    <span className="text-gray-400">vs last month</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm text-gray-500">{t.earningsSection.thisMonth}</p>
                  <p className="text-2xl font-bold text-gray-800">EGP 8,500</p>
                  <p className="text-xs text-gray-400 mt-2">5 jobs completed</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm text-gray-500">{t.earningsSection.averagePerJob}</p>
                  <p className="text-2xl font-bold text-gray-800">EGP 3,850</p>
                  <p className="text-xs text-gray-400 mt-2">Based on {worker.stats.completedHires} jobs</p>
=======
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total Offers</p>
                  <p className="text-2xl font-bold text-gray-800">{worker.offers.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-800">{worker.offers.filter(o => o.status === 'pending').length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Accepted</p>
                  <p className="text-2xl font-bold text-gray-800">{worker.offers.filter(o => o.status === 'accepted').length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="text-2xl font-bold text-gray-800">{worker.rating} ★</p>
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
<<<<<<< HEAD
                <h3 className="font-semibold text-gray-800 mb-4">{t.earningsSection.transactions}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Date</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Reference</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Amount</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-3 text-sm text-gray-600">2026-06-15</td>
                        <td className="py-3 text-sm text-gray-600">HS-2026-0001</td>
                        <td className="py-3 text-sm font-medium text-gray-800">EGP 4,000</td>
                        <td className="py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                            {t.earningsSection.paid}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 text-sm text-gray-600">2026-06-10</td>
                        <td className="py-3 text-sm text-gray-600">HS-2026-0002</td>
                        <td className="py-3 text-sm font-medium text-gray-800">EGP 3,500</td>
                        <td className="py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
                            {t.earningsSection.pendingPayment}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 text-sm text-gray-600">2026-06-05</td>
                        <td className="py-3 text-sm text-gray-600">HS-2026-0003</td>
                        <td className="py-3 text-sm font-medium text-gray-800">EGP 4,500</td>
                        <td className="py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                            {t.earningsSection.paid}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
=======
                <h3 className="font-semibold text-gray-800 mb-4">Recent Offers</h3>
                <div className="space-y-3">
                  {worker.offers.map((offer) => (
                    <div key={offer.id} className="flex justify-between items-center p-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800">{offer.position}</p>
                        <p className="text-sm text-gray-500">{offer.employer} • {offer.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-800">EGP {offer.salary}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">My Profile</h3>
              <div className="flex items-start gap-6">
                <img src={worker.image} alt={worker.name} className="w-32 h-32 rounded-full object-cover border-4 border-gray-200" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">{worker.name}</h2>
                    {worker.verified && <CheckCircle size={20} className="text-green-500" />}
                  </div>
                  <p className="text-gray-500">{worker.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{worker.rating}</span>
                    <span className="text-gray-400">({worker.reviewCount} reviews)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} /> {worker.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign size={16} /> EGP {worker.salary.toLocaleString()}/month
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} /> {worker.experience} years experience
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} /> {worker.availability}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {worker.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">{skill}</span>
                      ))}
                    </div>
                  </div>
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
                </div>
              </div>
            </div>
          )}

<<<<<<< HEAD
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">{t.settingsSection.title}</h2>
              
              <div className="space-y-6">
                {/* Language Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">{t.settingsSection.language}</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        localStorage.setItem('homelyserv_language', 'en');
                      }}
                      className={`px-4 py-2 rounded-lg border ${
                        language === 'en' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('ar');
                        localStorage.setItem('homelyserv_language', 'ar');
                      }}
                      className={`px-4 py-2 rounded-lg border ${
                        language === 'ar' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      العربية
                    </button>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">{t.settingsSection.notifications}</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                      <span className="text-sm text-gray-700">{t.settingsSection.emailNotifications}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                      <span className="text-sm text-gray-700">{t.settingsSection.pushNotifications}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                      <span className="text-sm text-gray-700">{t.settingsSection.smsNotifications}</span>
                    </label>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">{t.settingsSection.privacy}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t.settingsSection.profileVisibility}</label>
                      <select className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="public">{t.settingsSection.public}</option>
                        <option value="private">{t.settingsSection.private}</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                      <span className="text-sm text-gray-700">{t.settingsSection.showEmail}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                      <span className="text-sm text-gray-700">{t.settingsSection.showPhone}</span>
                    </label>
                  </div>
                </div>

                {/* Account Settings */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">{t.settingsSection.account}</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors text-sm">
                      {t.settingsSection.deactivateAccount}
                    </button>
                    <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm">
                      {t.settingsSection.deleteAccount}
                    </button>
                  </div>
                </div>
=======
          {activeTab === 'offers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">My Offers</h3>
              <div className="space-y-4">
                {worker.offers.map((offer) => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{offer.position}</h4>
                        <p className="text-sm text-gray-600">{offer.employer}</p>
                        <p className="text-sm text-gray-500">{offer.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">EGP {offer.salary.toLocaleString()}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
              </div>
            </div>
          )}
        </div>
      </div>
<<<<<<< HEAD

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{t.profileSection.editProfile}</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary (EGP/month)</label>
                  <input
                    type="number"
                    value={editForm.salary}
                    onChange={(e) => setEditForm(prev => ({ ...prev, salary: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.skills?.join(', ')}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Childcare, First Aid, Cooking"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {t.profileSection.saveChanges}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  {t.profileSection.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{t.profileSection.changePassword}</h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.profileSection.currentPassword}</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.profileSection.newPassword}</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.profileSection.confirmPassword}</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t.profileSection.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerView;
=======
    </div>
  );
}

export default WorkerView;
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
