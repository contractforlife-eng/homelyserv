// src/pages/Help.jsx
// src/pages/Help.jsx - WITH PREMIUM BADGE FIX
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import LegalFooter from '../components/common/LegalFooter';
import { getMessagesRoute, getComplaintsRoute } from '../utils/supportRoutes';
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
  
  const { t } = useTranslation();

  const [userRole, setUserRole] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');


  useEffect(() => {
    // Get user role from authStore
    if (authUser) {
      setUserRole(authUser.role || null);
    }
  }, [authUser]);

  // Language toggle removed - using shared LanguageSwitcher component from DashboardLayout

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
      alert(t('helpPage.thankYou'));
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
    { question: t('helpPage.faq1'), answer: t('helpPage.faq1Answer') },
    { question: t('helpPage.faq2'), answer: t('helpPage.faq2Answer') },
    { question: t('helpPage.faq3'), answer: t('helpPage.faq3Answer') },
    { question: t('helpPage.faq4'), answer: t('helpPage.faq4Answer') },
    { question: t('helpPage.faq5'), answer: t('helpPage.faq5Answer') },
    { question: t('helpPage.faq6'), answer: t('helpPage.faq6Answer') },
    { question: t('helpPage.faq7'), answer: t('helpPage.faq7Answer') },
    { question: t('helpPage.faq8'), answer: t('helpPage.faq8Answer') }
  ].filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqItems = [
    { question: t('helpPage.faq1'), answer: t('helpPage.faq1Answer') },
    { question: t('helpPage.faq2'), answer: t('helpPage.faq2Answer') },
    { question: t('helpPage.faq3'), answer: t('helpPage.faq3Answer') },
    { question: t('helpPage.faq4'), answer: t('helpPage.faq4Answer') },
    { question: t('helpPage.faq5'), answer: t('helpPage.faq5Answer') },
    { question: t('helpPage.faq6'), answer: t('helpPage.faq6Answer') },
    { question: t('helpPage.faq7'), answer: t('helpPage.faq7Answer') },
    { question: t('helpPage.faq8'), answer: t('helpPage.faq8Answer') }
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
              <ChevronLeft size={16} /> {t('helpPage.back')}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 dark:text-white text-lg">HomelyServ</span>
            </Link>
            {/* Language switcher removed - using shared LanguageSwitcher component from DashboardLayout */}
          </div>
        </header>

        {/* Public content */}
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Hero */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
            <h1 className="text-2xl font-bold">{t('helpPage.title')}</h1>
            <p className="text-red-100 mt-1">{t('helpPage.subtitle')}</p>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('helpPage.searchPlaceholder')}
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
              <p className="font-medium text-gray-800 dark:text-white text-sm">{t('helpPage.email')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">support@homelyserv.com</p>
            </a>
            <a href="tel:+201029189851" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition no-underline">
              <Phone size={22} className="text-red-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800 dark:text-white text-sm">{t('helpPage.phone')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+20 100 918 9851</p>
            </a>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center">
              <Clock size={22} className="text-red-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800 dark:text-white text-sm">{t('helpPage.supportHours')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('helpPage.supportHoursDesc')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center">
              <Headphones size={22} className="text-red-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800 dark:text-white text-sm">{t('helpPage.responseTime')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('helpPage.responseTimeDesc')}</p>
            </div>
          </div>

          {/* Sign in CTA + legal links */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-4 py-3 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition text-left"
            >
              <Lock size={20} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 dark:text-white flex-1">{t('helpPage.signInRequired')}</span>
              <span className="text-sm font-semibold text-red-600 whitespace-nowrap">{t('helpPage.signIn')}</span>
            </button>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">{t('helpPage.connectLegal')}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-red-600 hover:underline">{t('helpPage.contactUs')}</Link>
                <Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-red-600 hover:underline">{t('helpPage.terms')}</Link>
                <Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-red-600 hover:underline">{t('helpPage.privacy')}</Link>
                <Link to="/refund-policy" className="text-gray-600 dark:text-gray-300 hover:text-red-600 hover:underline">{t('helpPage.refund')}</Link>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div id="faq-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('helpPage.faq')}</h3>
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 dark:text-gray-400">{t('helpPage.noResults')}</p>
                <p className="text-sm text-gray-400">{t('helpPage.tryDifferent')}</p>
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
        title={t('helpPage.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />

      <div className="p-4 md:p-6">
        <RolePageHeader title={t('helpPage.title')} subtitle={t('helpPage.subtitle')} />

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t('helpPage.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Popular Topics */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('helpPage.popularTopics')}</h3>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 rounded-full text-sm hover:bg-teal-100 transition">
                <Zap size={14} className="inline mr-1" />
                {t('helpPage.gettingStarted')}
              </button>
              <button className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition">
                <User size={14} className="inline mr-1" />
                {t('helpPage.accountManagement')}
              </button>
              <button className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 rounded-full text-sm hover:bg-green-100 transition">
                <Briefcase size={14} className="inline mr-1" />
                {t('helpPage.hiring')}
              </button>
              <button className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 rounded-full text-sm hover:bg-yellow-100 transition">
                <DollarSign size={14} className="inline mr-1" />
                {t('helpPage.payments')}
              </button>
              <button className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition">
                <Shield size={14} className="inline mr-1" />
                {t('helpPage.security')}
              </button>
              <button className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 rounded-full text-sm hover:bg-red-100 transition">
                <AlertCircle size={14} className="inline mr-1" />
                {t('helpPage.troubleshooting')}
              </button>
            </div>
          </div>

          {/* Quick Support Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <a href="mailto:support@homelyserv.com" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition group cursor-pointer no-underline">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100' : 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <Mail size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800 dark:text-white">{t('helpPage.email')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">support@homelyserv.com</p>
            </a>
            <a href="tel:+2010091789851" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition group cursor-pointer no-underline">
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100' : 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <Phone size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800 dark:text-white">{t('helpPage.phone')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">+20 100 918 9851</p>
            </a>
            <button
              onClick={() => handleSupportNavigate('messages')}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition group cursor-pointer"
            >
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100' : 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <MessageSquare size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800 dark:text-white">{t('helpPage.chat')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{t('helpPage.availableAlways')}</p>
            </button>
            <button
              onClick={scrollToFaq}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition group cursor-pointer"
            >
              <div className={`w-12 h-12 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100' : 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100'} rounded-xl flex items-center justify-center mx-auto mb-3 transition`}>
                <BookOpen size={24} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
              </div>
              <p className="font-medium text-gray-800 dark:text-white">{t('helpPage.documentation')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{t('helpPage.userGuide')}</p>
            </button>
          </div>

          {/* Role-aware Support Center + Legal links */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {isAuthenticated ? t('helpPage.supportCenter') : t('helpPage.connectLegal')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleSupportNavigate('messages')}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition text-left"
                  >
                    <MessageSquare size={20} className={`${isTeal ? 'text-teal-600' : 'text-red-600'} flex-shrink-0`} />
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{t('helpPage.messages')}</span>
                  </button>
                  <button
                    onClick={() => handleSupportNavigate('complaints')}
                    className="flex items-center gap-3 px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition text-left"
                  >
                    <AlertTriangle size={20} className={`${isTeal ? 'text-teal-600' : 'text-red-600'} flex-shrink-0`} />
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{t('helpPage.complaints')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="md:col-span-3 flex items-center gap-3 px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition text-left"
                >
                  <Lock size={20} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-white flex-1">{t('helpPage.signInRequired')}</span>
                  <span className={`text-sm font-semibold ${isTeal ? 'text-teal-600' : 'text-red-600'}`}>
                    {t('helpPage.signIn')}
                  </span>
                </button>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">{t('helpPage.connectLegal')}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:underline">{t('helpPage.contactUs')}</Link>
                <Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:underline">{t('helpPage.terms')}</Link>
                <Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:underline">{t('helpPage.privacy')}</Link>
                <Link to="/refund-policy" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:underline">{t('helpPage.refund')}</Link>
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
                  <p className="font-medium text-gray-800 dark:text-white">{t('helpPage.supportHours')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('helpPage.supportHoursDesc')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isTeal ? 'bg-teal-50 dark:bg-teal-900/30' : 'bg-red-50 dark:bg-red-900/30'} rounded-lg flex items-center justify-center`}>
                  <Headphones size={20} className={isTeal ? 'text-teal-600' : 'text-red-600'} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{t('helpPage.responseTime')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('helpPage.responseTimeDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div id="faq-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('helpPage.faq')}</h3>
            
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('helpPage.noResults')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('helpPage.tryDifferent')}</p>
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
                            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('helpPage.feedback')}</span>
                            <button
                              onClick={() => handleFeedback('yes')}
                              className="flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 rounded-lg hover:bg-green-100 transition text-sm"
                            >
                              <ThumbsUp size={14} />
                              {t('helpPage.yes')}
                            </button>
                            <button
                              onClick={() => handleFeedback('no')}
                              className="flex items-center gap-1 px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
                            >
                              <ThumbsUp size={14} className="rotate-180" />
                              {t('helpPage.no')}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle size={16} />
                              <span className="text-sm">{t('helpPage.thankYou')}</span>
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('helpPage.sendFeedback')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">{t('helpPage.feedbackDescription')}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t('helpPage.feedbackPlaceholder')}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows="2"
              />
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim()}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
                {t('helpPage.submit')}
              </button>
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default Help;
