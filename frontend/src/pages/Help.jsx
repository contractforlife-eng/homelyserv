// src/pages/Help.jsx
// src/pages/Help.jsx - WITH PREMIUM BADGE FIX
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import LegalFooter from '../components/common/LegalFooter';
import { getMessagesRoute, getComplaintsRoute } from '../utils/supportRoutes';
import { changeLanguageGlobal } from '../i18n';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import {
  Home,
  User,
  Briefcase,
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
  Mail,
  Phone,
  MessageSquare,
  FileQuestion,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Headphones,
  Clock,
  CreditCard,
  FileCheck,
  Send,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  ThumbsUp,
  Shield,
  Lock,
  UserCheck,
  Zap,
  DollarSign,
  Crown
} from 'lucide-react';

// Main Help Component - ENHANCED
const Help = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const { i18n } = useTranslation();
  const language = i18n.language === 'ar' ? 'ar' : 'en';

  const [userRole, setUserRole] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const translations = {
    en: {
      title: 'Help & Support',
      subtitle: 'Find answers to your questions and get support',
      quickSupport: 'Quick Support',
      faq: 'Frequently Asked Questions',
      contact: 'Contact Support',
      email: 'Email Us',
      phone: 'Call Us',
      chat: 'Live Chat',
      documentation: 'Documentation',
      faq1: 'How do I apply for a job?',
      faq1Answer: 'Browse available offers and click "Apply Now" on any position that matches your skills. Your application will be sent to the employer for review.',
      faq2: 'How do I update my profile?',
      faq2Answer: 'Go to "My Profile" in the sidebar and click "Edit Profile" to update your personal information, skills, and experience.',
      faq3: 'How do I contact an employer?',
      faq3Answer: 'Use the "Messages" section to communicate with employers directly. You can also contact them through job postings.',
      faq4: 'How do I report a problem?',
      faq4Answer: 'Go to "Complaints" in the sidebar to submit a report. Our support team will review and respond to your complaint.',
      faq5: 'How do I hire a worker?',
      faq5Answer: 'Use the "Search Workers" page to find qualified candidates. You can view their profiles and send them a hire request.',
      faq6: 'How do I make a payment?',
      faq6Answer: 'Payments can be made securely through the platform using various payment methods including credit cards and bank transfers.',
      faq7: 'What is the commission rate?',
      faq7Answer: 'The platform charges a 15% commission on successful hires. This covers payment processing, support, and platform maintenance.',
      faq8: 'How do I cancel a contract?',
      faq8Answer: 'You can cancel a contract from the "My Hires" page. Select the worker and click "Cancel Contract". Please review the terms and conditions first.',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      supportHours: 'Support Hours',
      supportHoursDesc: '24/7 available',
      responseTime: 'Average Response Time',
      responseTimeDesc: 'Within 24 hours',
      searchPlaceholder: 'Search help articles...',
      noResults: 'No results found',
      tryDifferent: 'Try using different keywords',
      feedback: 'Was this helpful?',
      yes: 'Yes',
      no: 'No',
      thankYou: 'Thank you for your feedback!',
      sendFeedback: 'Send Feedback',
      feedbackPlaceholder: 'Tell us how we can improve...',
      submit: 'Submit',
      popularTopics: 'Popular Topics',
      gettingStarted: 'Getting Started',
      accountManagement: 'Account Management',
      hiring: 'Hiring & Jobs',
      payments: 'Payments & Billing',
      security: 'Security & Privacy',
      troubleshooting: 'Troubleshooting',
      supportCenter: 'Your Support Center',
      connectLegal: 'Contact & Legal',
      signInRequired: 'Sign in to access Messages & Complaints',
      signIn: 'Sign in',
      messages: 'Messages',
      complaints: 'Complaints',
      back: 'Back',
      terms: 'Terms & Conditions',
      privacy: 'Privacy Policy',
      refund: 'Refund Policy',
      contactUs: 'Contact Us'
    },
    ar: {
      title: 'المساعدة والدعم',
      subtitle: 'ابحث عن إجابات لأسئلتك واحصل على الدعم',
      quickSupport: 'الدعم السريع',
      faq: 'الأسئلة الشائعة',
      contact: 'اتصل بالدعم',
      email: 'راسلنا عبر البريد الإلكتروني',
      phone: 'اتصل بنا',
      chat: 'الدردشة المباشرة',
      documentation: 'التوثيق',
      faq1: 'كيف يمكنني التقديم على وظيفة؟',
      faq1Answer: 'تصفح العروض المتاحة وانقر على "تقديم الآن" لأي منصب يناسب مهاراتك. سيتم إرسال طلبك إلى صاحب العمل للمراجعة.',
      faq2: 'كيف يمكنني تحديث ملفي الشخصي؟',
      faq2Answer: 'اذهب إلى "ملفي الشخصي" في الشريط الجانبي وانقر على "تعديل الملف" لتحديث معلوماتك الشخصية ومهاراتك وخبراتك.',
      faq3: 'كيف يمكنني التواصل مع صاحب العمل؟',
      faq3Answer: 'استخدم قسم "الرسائل" للتواصل مباشرة مع أصحاب العمل. يمكنك أيضاً التواصل معهم من خلال إعلانات الوظائف.',
      faq4: 'كيف يمكنني الإبلاغ عن مشكلة؟',
      faq4Answer: 'اذهب إلى "الشكاوى" في الشريط الجانبي لتقديم بلاغ. سيقوم فريق الدعم بمراجعة شكواك والرد عليها.',
      faq5: 'كيف يمكنني توظيف عامل؟',
      faq5Answer: 'استخدم صفحة "البحث عن عمال" للعثور على مرشحين مؤهلين. يمكنك عرض ملفاتهم الشخصية وإرسال طلب توظيف.',
      faq6: 'كيف يمكنني إجراء دفعة؟',
      faq6Answer: 'يمكن إجراء الدفعات بشكل آمن من خلال المنصة باستخدام طرق دفع متنوعة بما في ذلك بطاقات الائتمان والتحويلات المصرفية.',
      faq7: 'ما هي نسبة العمولة؟',
      faq7Answer: 'تفرض المنصة عمولة 15% على التوظيفات الناجحة. تغطي هذه العمولة معالجة المدفوعات والدعم وصيانة المنصة.',
      faq8: 'كيف يمكنني إلغاء عقد؟',
      faq8Answer: 'يمكنك إلغاء العقد من صفحة "توظيفاتي". اختر العامل وانقر على "إلغاء العقد". يرجى مراجعة الشروط والأحكام أولاً.',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      supportHours: 'ساعات الدعم',
      supportHoursDesc: 'متاح 24/7',
      responseTime: 'متوسط وقت الرد',
      responseTimeDesc: 'خلال 24 ساعة',
      searchPlaceholder: 'ابحث في مقالات المساعدة...',
      noResults: 'لا توجد نتائج',
      tryDifferent: 'حاول استخدام كلمات مختلفة',
      feedback: 'هل كان هذا مفيداً؟',
      yes: 'نعم',
      no: 'لا',
      thankYou: 'شكراً لملاحظاتك!',
      sendFeedback: 'إرسال ملاحظات',
      feedbackPlaceholder: 'أخبرنا كيف يمكننا تحسين...',
      submit: 'إرسال',
      popularTopics: 'مواضيع شائعة',
      gettingStarted: 'بدء الاستخدام',
      accountManagement: 'إدارة الحساب',
      hiring: 'التوظيف والوظائف',
      payments: 'المدفوعات والفواتير',
      security: 'الأمان والخصوصية',
      troubleshooting: 'استكشاف الأخطاء',
      supportCenter: 'مركز الدعم الخاص بك',
      connectLegal: 'التواصل والقوانين',
      signInRequired: 'سجل الدخول للوصول إلى الرسائل والشكاوى',
      signIn: 'تسجيل الدخول',
      messages: 'الرسائل',
      complaints: 'الشكاوى',
      back: 'رجوع',
      terms: 'الشروط والأحكام',
      privacy: 'سياسة الخصوصية',
      refund: 'سياسة الاسترداد',
      contactUs: 'اتصل بنا'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    // Get user role from authStore
    if (authUser) {
      setUserRole(authUser.role || null);
    }
  }, [authUser]);

  const toggleLanguage = () => {
    changeLanguageGlobal(language === 'en' ? 'ar' : 'en');
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleFeedback = (type) => {
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
    }, 3000);
  };

  const handleFeedbackSubmit = () => {
    if (feedbackText.trim()) {
      alert(t.thankYou);
      setFeedbackText('');
    }
  };

  const handleSupportNavigate = (type) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (type === 'messages') {
      navigate(getMessagesRoute(userRole));
    } else if (type === 'complaints') {
      navigate(getComplaintsRoute(userRole));
    }
  };

  const scrollToFaq = () => {
    document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  const isEmployer = userRole === 'EMPLOYER';

  // Filter FAQ based on search
  const filteredFaqs = [
    { question: t.faq1, answer: t.faq1Answer },
    { question: t.faq2, answer: t.faq2Answer },
    { question: t.faq3, answer: t.faq3Answer },
    { question: t.faq4, answer: t.faq4Answer },
    { question: t.faq5, answer: t.faq5Answer },
    { question: t.faq6, answer: t.faq6Answer },
    { question: t.faq7, answer: t.faq7Answer },
    { question: t.faq8, answer: t.faq8Answer }
  ].filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqItems = [
    { question: t.faq1, answer: t.faq1Answer },
    { question: t.faq2, answer: t.faq2Answer },
    { question: t.faq3, answer: t.faq3Answer },
    { question: t.faq4, answer: t.faq4Answer },
    { question: t.faq5, answer: t.faq5Answer },
    { question: t.faq6, answer: t.faq6Answer },
    { question: t.faq7, answer: t.faq7Answer },
    { question: t.faq8, answer: t.faq8Answer }
  ];

  const isTeal = isEmployer;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Public header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 transition text-sm"
            >
              <ChevronLeft size={16} /> {t.back}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 dark:text-white text-lg">HomelyServ</span>
            </Link>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <Globe size={16} />
              {t.languageToggle}
            </button>
          </div>
        </header>

        {/* Public content */}
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Hero */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-red-100 mt-1">{t.subtitle}</p>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Contact channels */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <a href="mailto:support@homelyserv.com" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition no-underline">
              <Mail size={22} className="text-red-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800 dark:text-white text-sm">{t.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">support@homelyserv.com</p>
            </a>
            <a href="tel:+201029189851" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition no-underline">
              <Phone size={22} className="text-red-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800 dark:text-white text-sm">{t.phone}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+20 100 918 9851</p>
            </a>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center">
              <Clock size={22} className="text-red-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800 dark:text-white text-sm">{t.supportHours}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.supportHoursDesc}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center">
              <Headphones size={22} className="text-red-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800 dark:text-white text-sm">{t.responseTime}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.responseTimeDesc}</p>
            </div>
          </div>

          {/* Sign in CTA + legal links */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-4 py-3 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition text-left"
            >
              <Lock size={20} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 dark:text-white flex-1">{t.signInRequired}</span>
              <span className="text-sm font-semibold text-red-600 whitespace-nowrap">{t.signIn}</span>
            </button>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">{t.connectLegal}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-red-600 hover:underline">{t.contactUs}</Link>
                <Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-red-600 hover:underline">{t.terms}</Link>
                <Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-red-600 hover:underline">{t.privacy}</Link>
                <Link to="/refund-policy" className="text-gray-600 dark:text-gray-300 hover:text-red-600 hover:underline">{t.refund}</Link>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div id="faq-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.faq}</h3>
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 dark:text-gray-400">{t.noResults}</p>
                <p className="text-sm text-gray-400">{t.tryDifferent}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition bg-white dark:bg-gray-800 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <FileQuestion size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="font-medium text-gray-800 dark:text-white">{faq.question}</span>
                      </div>
                      {expandedFaq === index ? (
                        <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <LegalFooter />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <RolePageHeader title={t.title} subtitle={t.subtitle} />

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Popular Topics */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.popularTopics}</h3>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 rounded-full text-sm hover:bg-teal-100 transition">
                <Zap size={14} className="inline mr-1" />
                {t.gettingStarted}
              </button>
              <button className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition">
                <User size={14} className="inline mr-1" />
                {t.accountManagement}
              </button>
              <button className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 rounded-full text-sm hover:bg-green-100 transition">
                <Briefcase size={14} className="inline mr-1" />
                {t.hiring}
              </button>
              <button className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 rounded-full text-sm hover:bg-yellow-100 transition">
                <DollarSign size={14} className="inline mr-1" />
                {t.payments}
              </button>
              <button className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition">
                <Shield size={14} className="inline mr-1" />
                {t.security}
              </button>
              <button className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 rounded-full text-sm hover:bg-red-100 transition">
                <AlertCircle size={14} className="inline mr-1" />
                {t.troubleshooting}
              </button>
            </div>
          </div>

          {/* Quick Support Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <a href="mailto:support@homelyserv.com" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition group cursor-pointer no-underline">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100' : 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <Mail size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800 dark:text-white">{t.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">support@homelyserv.com</p>
            </a>
            <a href="tel:+2010091789851" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition group cursor-pointer no-underline">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100' : 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <Phone size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800 dark:text-white">{t.phone}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">+20 100 918 9851</p>
            </a>
            <button
              onClick={() => handleSupportNavigate('messages')}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition group cursor-pointer"
            >
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100' : 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <MessageSquare size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800 dark:text-white">{t.chat}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Available 24/7</p>
            </button>
            <button
              onClick={scrollToFaq}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition group cursor-pointer"
            >
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100' : 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <BookOpen size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800 dark:text-white">{t.documentation}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">User Guide</p>
            </button>
          </div>

          {/* Role-aware Support Center + Legal links */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {isAuthenticated ? t.supportCenter : t.connectLegal}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleSupportNavigate('messages')}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition text-left"
                  >
                    <MessageSquare size={20} className={`${isTeal ? 'text-teal-600' : 'text-red-600'} flex-shrink-0`} />
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{t.messages}</span>
                  </button>
                  <button
                    onClick={() => handleSupportNavigate('complaints')}
                    className="flex items-center gap-3 px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition text-left"
                  >
                    <AlertTriangle size={20} className={`${isTeal ? 'text-teal-600' : 'text-red-600'} flex-shrink-0`} />
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{t.complaints}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="md:col-span-3 flex items-center gap-3 px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition text-left"
                >
                  <Lock size={20} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-white flex-1">{t.signInRequired}</span>
                  <span className={`text-sm font-semibold ${isTeal ? 'text-teal-600' : 'text-red-600'}`}>
                    {t.signIn}
                  </span>
                </button>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">{t.connectLegal}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:underline">{t.contactUs}</Link>
                <Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:underline">{t.terms}</Link>
                <Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:underline">{t.privacy}</Link>
                <Link to="/refund-policy" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:underline">{t.refund}</Link>
              </div>
            </div>
          </div>

          {/* Support Stats */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30' : 'bg-red-50 dark:bg-red-900/30'} rounded-lg flex items-center justify-center`}>
                  <Clock size={20} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{t.supportHours}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.supportHoursDesc}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30' : 'bg-red-50 dark:bg-red-900/30'} rounded-lg flex items-center justify-center`}>
                  <Headphones size={20} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{t.responseTime}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.responseTimeDesc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div id="faq-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.faq}</h3>
            
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.noResults}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.tryDifferent}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:bg-gray-900 transition ${
                        expandedFaq === index ? (isTeal ? 'bg-teal-50 dark:bg-teal-900/30' : 'bg-red-50 dark:bg-red-900/30') : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileQuestion size={18} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
                        <span className="font-medium text-gray-800 dark:text-white">{faq.question}</span>
                      </div>
                      {expandedFaq === index ? (
                        <ChevronUp size={18} className="text-gray-400 dark:text-gray-500" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{faq.answer}</p>
                        
                        {/* Feedback Section */}
                        {!feedbackSubmitted ? (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.feedback}</span>
                            <button
                              onClick={() => handleFeedback('yes')}
                              className="flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 rounded-lg hover:bg-green-100 transition text-sm"
                            >
                              <ThumbsUp size={14} />
                              {t.yes}
                            </button>
                            <button
                              onClick={() => handleFeedback('no')}
                              className="flex items-center gap-1 px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
                            >
                              <ThumbsUp size={14} className="rotate-180" />
                              {t.no}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle size={16} />
                              <span className="text-sm">{t.thankYou}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t.sendFeedback}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">We value your feedback to improve our support</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t.feedbackPlaceholder}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows="2"
              />
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim()}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
                {t.submit}
              </button>
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default Help;
