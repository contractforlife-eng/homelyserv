import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  DollarSign,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  Award,
  Shield,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Globe,
  Copy,
  Check,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Printer,
  TrendingUp,
  Users,
  Building,
  Home,
  ExternalLink,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Map,
  PhoneCall,
  MailOpen,
  UserCheck,
  UserX,
  FileCheck,
  FileX,
  BadgeCheck,
  Trophy,
  Target,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

const WorkerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('about'); // about, experience, reviews, documents
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortReviews, setSortReviews] = useState('recent');

  // Translations
  const translations = {
    en: {
      title: 'Worker Profile',
      back: 'Back to Search',
      contact: 'Contact Worker',
      save: 'Save Profile',
      saved: 'Saved',
      share: 'Share Profile',
      report: 'Report Profile',
      about: 'About',
      experience: 'Experience',
      reviews: 'Reviews',
      documents: 'Documents',
      contactInfo: 'Contact Information',
      workDetails: 'Work Details',
      skills: 'Skills',
      availability: 'Availability',
      workType: 'Work Type',
      salary: 'Expected Salary',
      category: 'Category',
      experienceYears: 'Years of Experience',
      verified: 'Verified',
      pending: 'Pending Verification',
      notVerified: 'Not Verified',
      location: 'Location',
      phone: 'Phone',
      email: 'Email',
      rating: 'Rating',
      reviewCount: 'Reviews',
      noReviews: 'No reviews yet',
      noExperience: 'No experience listed',
      noDocuments: 'No documents uploaded',
      sendMessage: 'Send Message',
      messagePlaceholder: 'Write your message here...',
      messageSuccess: 'Message sent successfully!',
      reportTitle: 'Report Profile',
      reportReason: 'Reason for reporting',
      reportPlaceholder: 'Please describe the issue...',
      reportSubmit: 'Submit Report',
      reportSuccess: 'Report submitted successfully!',
      editProfile: 'Edit Profile',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      hireNow: 'Hire Now',
      viewProfile: 'View Full Profile',
      documentsVerified: 'Documents Verified',
      identityVerified: 'Identity Verified',
      backgroundCheck: 'Background Check',
      years: 'years',
      month: '/month',
      fullTime: 'Full-Time',
      partTime: 'Part-Time',
      contract: 'Contract',
      temporary: 'Temporary',
      available: 'Available',
      notAvailable: 'Not Available',
      reviewSort: {
        recent: 'Most Recent',
        highest: 'Highest Rating',
        lowest: 'Lowest Rating'
      },
      filterRatings: 'Filter by Rating',
      allRatings: 'All Ratings',
      languageToggle: 'العربية'
    },
    ar: {
      title: 'الملف الشخصي للعامل',
      back: 'العودة إلى البحث',
      contact: 'اتصال بالعامل',
      save: 'حفظ الملف الشخصي',
      saved: 'تم الحفظ',
      share: 'مشاركة الملف الشخصي',
      report: 'الإبلاغ عن الملف',
      about: 'نبذة',
      experience: 'الخبرات',
      reviews: 'التقييمات',
      documents: 'المستندات',
      contactInfo: 'معلومات الاتصال',
      workDetails: 'تفاصيل العمل',
      skills: 'المهارات',
      availability: 'التوفر',
      workType: 'نوع العمل',
      salary: 'الراتب المتوقع',
      category: 'الفئة',
      experienceYears: 'سنوات الخبرة',
      verified: 'موثق',
      pending: 'قيد التحقق',
      notVerified: 'غير موثق',
      location: 'الموقع',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      rating: 'التقييم',
      reviewCount: 'تقييمات',
      noReviews: 'لا توجد تقييمات بعد',
      noExperience: 'لا توجد خبرات مسجلة',
      noDocuments: 'لا توجد مستندات مرفوعة',
      sendMessage: 'إرسال رسالة',
      messagePlaceholder: 'اكتب رسالتك هنا...',
      messageSuccess: 'تم إرسال الرسالة بنجاح!',
      reportTitle: 'الإبلاغ عن الملف',
      reportReason: 'سبب الإبلاغ',
      reportPlaceholder: 'يرجى وصف المشكلة...',
      reportSubmit: 'إرسال التقرير',
      reportSuccess: 'تم إرسال التقرير بنجاح!',
      editProfile: 'تعديل الملف الشخصي',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      hireNow: 'توظيف الآن',
      viewProfile: 'عرض الملف الشخصي الكامل',
      documentsVerified: 'المستندات موثقة',
      identityVerified: 'الهوية موثقة',
      backgroundCheck: 'فحص الخلفية',
      years: 'سنوات',
      month: '/شهر',
      fullTime: 'دوام كامل',
      partTime: 'دوام جزئي',
      contract: 'عقد',
      temporary: 'مؤقت',
      available: 'متاح',
      notAvailable: 'غير متاح',
      reviewSort: {
        recent: 'الأحدث',
        highest: 'أعلى تقييم',
        lowest: 'أقل تقييم'
      },
      filterRatings: 'تصفية حسب التقييم',
      allRatings: 'جميع التقييمات',
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
    const fetchWorker = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await fetch(`/api/workers/${id}`);
        // const data = await response.json();
        
        // Demo data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const demoWorker = {
          id: id || 'w1',
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
          documentsVerified: true,
          identityVerified: true,
          backgroundCheck: true,
          image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=400&h=400&fit=crop&crop=face',
          skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking', 'Swimming', 'Driving'],
          bio: 'Experienced nanny with 5 years of experience. Passionate about childcare and child development. I have worked with children of all ages from newborns to teenagers. I believe in creating a safe, nurturing, and educational environment for children to thrive.',
          bioAr: 'مربية أطفال ذات خبرة 5 سنوات. شغوفة برعاية الأطفال وتنمية مهاراتهم. عملت مع أطفال من جميع الأعمار من حديثي الولادة إلى المراهقين. أؤمن بخلق بيئة آمنة ومغذية وتعليمية للأطفال للنمو والازدهار.',
          documents: [
            { name: 'ID Card.pdf', type: 'Identity', size: '2.4 MB', verified: true },
            { name: 'Childcare Certificate.pdf', type: 'Certificate', size: '1.8 MB', verified: true },
            { name: 'First Aid Certification.pdf', type: 'Certificate', size: '3.2 MB', verified: true },
            { name: 'Reference Letter.pdf', type: 'Reference', size: '1.1 MB', verified: false }
          ],
          experiences: [
            {
              employerName: 'Smith Family',
              role: 'Full-Time Nanny',
              startDate: '2019-01',
              endDate: '2021-06',
              description: 'Cared for two children aged 2 and 5. Managed daily routines, meal preparation, educational activities, and school drop-offs.'
            },
            {
              employerName: 'Johnson Family',
              role: 'Live-in Nanny',
              startDate: '2021-08',
              endDate: '2024-03',
              description: 'Cared for newborn twins. Handled all aspects of infant care including feeding, bathing, sleep training, and developmental activities.'
            }
          ],
          reviews: [
            {
              user: 'Sara Mohamed',
              rating: 5,
              comment: 'Excellent nanny! Highly recommended. Ahmed was professional, caring, and great with our children. He always went above and beyond.',
              date: '2026-05-15'
            },
            {
              user: 'Khaled Rashed',
              rating: 4,
              comment: 'Great with children, very reliable. Punctual and always prepared with activities. Our kids loved him.',
              date: '2026-04-20'
            },
            {
              user: 'Nadia Ibrahim',
              rating: 5,
              comment: 'Ahmed is a fantastic nanny. He taught our daughter to read and she loves him. Very dedicated professional.',
              date: '2026-03-10'
            },
            {
              user: 'Hassan Ali',
              rating: 5,
              comment: 'Wonderful experience. Ahmed integrated well with our family and became like a big brother to our kids.',
              date: '2026-02-05'
            }
          ],
          stats: {
            totalHires: 12,
            completedHires: 10,
            onTimeRate: 98,
            responseRate: 95,
            averageDuration: '8 months'
          }
        };
        
        setWorker(demoWorker);
        setEditForm(demoWorker);
        
        // Check if worker is saved
        const savedWorkers = JSON.parse(localStorage.getItem('savedWorkers') || '[]');
        setIsSaved(savedWorkers.includes(id));
        
      } catch (error) {
        console.error('Error fetching worker:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWorker();
    }
  }, [id]);

  // Handle save profile
  const handleSaveProfile = () => {
    const savedWorkers = JSON.parse(localStorage.getItem('savedWorkers') || '[]');
    if (isSaved) {
      const updated = savedWorkers.filter(w => w !== id);
      localStorage.setItem('savedWorkers', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedWorkers.push(id);
      localStorage.setItem('savedWorkers', JSON.stringify(savedWorkers));
      setIsSaved(true);
    }
  };

  // Handle share profile
  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${worker.name} - HomelyServ`,
        text: `Check out ${worker.name}'s profile on HomelyServ`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  // Handle contact message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    
    try {
      // In production, this would be an API call
      // await fetch('/api/messages', {
      //   method: 'POST',
      //   body: JSON.stringify({ workerId: id, message: contactMessage })
      // });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setContactMessage('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle report submission
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    
    try {
      // In production, this would be an API call
      // await fetch('/api/reports', {
      //   method: 'POST',
      //   body: JSON.stringify({ workerId: id, reason: reportReason })
      // });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowReportModal(false);
      setReportReason('');
      alert(t.reportSuccess);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  // Handle edit profile
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setWorker(editForm);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setEditForm(worker);
    setIsEditing(false);
  };

  // Get availability color
  const getAvailabilityColor = (availability) => {
    const colors = {
      available: 'text-green-600 bg-green-100',
      'part-time': 'text-orange-600 bg-orange-100',
      'full-time': 'text-blue-600 bg-blue-100',
      'not-available': 'text-red-600 bg-red-100',
      contract: 'text-purple-600 bg-purple-100',
      temporary: 'text-yellow-600 bg-yellow-100'
    };
    return colors[availability] || 'text-gray-600 bg-gray-100';
  };

  // Get availability label
  const getAvailabilityLabel = (availability) => {
    const labels = {
      available: t.available,
      'part-time': t.partTime,
      'full-time': t.fullTime,
      'not-available': t.notAvailable,
      contract: t.contract,
      temporary: t.temporary
    };
    return labels[availability] || availability;
  };

  // Get work type label
  const getWorkTypeLabel = (workType) => {
    const labels = {
      'full-time': t.fullTime,
      'part-time': t.partTime,
      contract: t.contract,
      temporary: t.temporary
    };
    return labels[workType] || workType;
  };

  // Filter reviews
  const getFilteredReviews = () => {
    if (!worker) return [];
    let reviews = [...worker.reviews];
    
    if (ratingFilter > 0) {
      reviews = reviews.filter(r => r.rating >= ratingFilter);
    }
    
    if (sortReviews === 'highest') {
      reviews.sort((a, b) => b.rating - a.rating);
    } else if (sortReviews === 'lowest') {
      reviews.sort((a, b) => a.rating - b.rating);
    } else {
      reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    return reviews;
  };

  const isRTL = language === 'ar';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Worker Not Found</h2>
          <p className="text-gray-500 mb-4">The worker you're looking for doesn't exist.</p>
          <Link to="/search" className="text-red-600 hover:text-red-700 font-medium">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/search"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t.title}</h1>
              <p className="text-gray-500">{worker.categoryLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm bg-white"
            >
              <Globe size={16} className="text-gray-600" />
              <span className="font-medium">{t.languageToggle}</span>
            </button>
            <button
              onClick={handleSaveProfile}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                isSaved
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              {isSaved ? t.saved : t.save}
            </button>
            <button
              onClick={handleShareProfile}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Share2 size={18} />
              {t.share}
            </button>
          </div>
        </div>

        {/* Main Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={worker.image}
                  alt={worker.name}
                  className="w-full rounded-lg object-cover aspect-square"
                />
                {worker.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* Name & Rating */}
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-800">{worker.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm px-3 py-1 rounded-full ${getAvailabilityColor(worker.availability)}`}>
                    {getAvailabilityLabel(worker.availability)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{worker.rating}</span>
                    <span className="text-sm text-gray-400">({worker.reviewCount})</span>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{worker.location}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <DollarSign size={16} className="text-gray-400" />
                  <span>{worker.salary.toLocaleString()} EGP {t.month}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Briefcase size={16} className="text-gray-400" />
                  <span>{worker.experienceYears} {t.years} {t.experienceYears}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock size={16} className="text-gray-400" />
                  <span>{getWorkTypeLabel(worker.workType)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span>{worker.categoryLabel}</span>
                </div>
              </div>

              {/* Verification Badges */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <BadgeCheck size={16} className="text-green-500" />
                  <span className="text-gray-700">{t.identityVerified}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileCheck size={16} className="text-green-500" />
                  <span className="text-gray-700">{t.documentsVerified}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield size={16} className="text-green-500" />
                  <span className="text-gray-700">{t.backgroundCheck}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-800">{worker.stats.totalHires}</p>
                  <p className="text-xs text-gray-500">Total Hires</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{worker.stats.completedHires}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{worker.stats.onTimeRate}%</p>
                  <p className="text-xs text-gray-500">On Time</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => navigate(`/hire/${worker.id}`)}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Target size={18} />
                  {t.hireNow}
                </button>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  {t.contact}
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full px-4 py-2 text-sm text-gray-400 hover:text-red-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Flag size={14} />
                  {t.report}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-100">
                <div className="flex overflow-x-auto">
                  {['about', 'experience', 'reviews', 'documents'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'text-red-600 border-b-2 border-red-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t[tab]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">{t.about}</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {isRTL ? worker.bioAr || worker.bio : worker.bio}
                      </p>
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">{t.skills}</h3>
                      <div className="flex flex-wrap gap-2">
                        {worker.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">{t.contactInfo}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Phone size={16} className="text-gray-400" />
                          <span>{worker.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <Mail size={16} className="text-gray-400" />
                          <span>{worker.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">{t.experience}</h3>
                    {worker.experiences.length > 0 ? (
                      <div className="space-y-4">
                        {worker.experiences.map((exp, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-gray-800">{exp.role}</h4>
                                <p className="text-sm text-gray-600">{exp.employerName}</p>
                              </div>
                              <span className="text-sm text-gray-400">
                                {exp.startDate} - {exp.endDate || 'Present'}
                              </span>
                            </div>
                            {exp.description && (
                              <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">{t.noExperience}</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <h3 className="font-semibold text-gray-800">{t.reviews}</h3>
                      <div className="flex flex-wrap gap-3">
                        <select
                          value={ratingFilter}
                          onChange={(e) => setRatingFilter(Number(e.target.value))}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="0">{t.allRatings}</option>
                          <option value="1">1+ {t.rating}</option>
                          <option value="2">2+ {t.rating}</option>
                          <option value="3">3+ {t.rating}</option>
                          <option value="4">4+ {t.rating}</option>
                          <option value="5">5 {t.rating}</option>
                        </select>
                        <select
                          value={sortReviews}
                          onChange={(e) => setSortReviews(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="recent">{t.reviewSort.recent}</option>
                          <option value="highest">{t.reviewSort.highest}</option>
                          <option value="lowest">{t.reviewSort.lowest}</option>
                        </select>
                      </div>
                    </div>

                    {getFilteredReviews().length > 0 ? (
                      <div className="space-y-4">
                        {getFilteredReviews().map((review, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">{review.user}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{review.rating}</span>
                                </div>
                              </div>
                              <span className="text-xs text-gray-400">{review.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">{t.noReviews}</p>
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">{t.documents}</h3>
                    {worker.documents.length > 0 ? (
                      <div className="space-y-3">
                        {worker.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-red-600" />
                              <div>
                                <p className="font-medium text-gray-800">{doc.name}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <span>{doc.type}</span>
                                  <span>{doc.size}</span>
                                  {doc.verified ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <CheckCircle size={12} />
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="text-yellow-600 flex items-center gap-1">
                                      <Clock size={12} />
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                              <Download size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">{t.noDocuments}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{t.contact}</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSendMessage}>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows="5"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder={t.messagePlaceholder}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
              {showSuccess && (
                <div className="mt-2 p-2 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  {t.messageSuccess}
                </div>
              )}
              <button
                type="submit"
                className="mt-4 w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {t.sendMessage}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{t.reportTitle}</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleReportSubmit}>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                                rows="4"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder={t.reportPlaceholder}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
              <button
                type="submit"
                className="mt-4 w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {t.reportSubmit}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{t.editProfile}</h3>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Salary (EGP/month)
                </label>
                <input
                  type="number"
                  value={editForm.salary}
                  onChange={(e) => setEditForm(prev => ({ ...prev, salary: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
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
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {t.saveChanges}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerProfile;