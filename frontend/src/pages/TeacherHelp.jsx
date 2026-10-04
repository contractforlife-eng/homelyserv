// frontend/src/pages/TeacherHelp.jsx
// ============================================================
// TEACHER HELP & SUPPORT PAGE
// ============================================================
// Dedicated Teacher Help page. Follows the existing Help architecture used by
// StudentHelp / DoctorHelp (shared DashboardLayout + DashboardHeader, a role
// themed banner, a searchable category filter and an FAQ accordion) but with
// Teacher-only content and the Teacher portal identity.
//
// The Worker Help page (/help) is intentionally left untouched.
// ============================================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  GraduationCap,
  Search,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Headphones,
  ChevronDown,
  ChevronUp,
  BookOpen,
  User,
  Users,
  Calendar,
  Wallet,
  TrendingUp,
  HeartPulse,
  Crown,
  FileQuestion,
  ArrowRight
} from 'lucide-react';

const TeacherHelp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Teacher tool shortcuts. Labels reuse the EXISTING teacherNav.* keys, so
  // this section introduces no new translation strings.
  const teacherTools = [
    { to: '/teacher-profile', label: t('teacherNav.myProfile'), icon: User },
    { to: '/teacher-students', label: t('teacherNav.students'), icon: Users },
    { to: '/teacher-groups', label: t('teacherNav.groups'), icon: BookOpen },
    { to: '/teacher-lessons', label: t('teacherNav.lessons'), icon: BookOpen },
    { to: '/teacher-schedule', label: t('teacherNav.schedule'), icon: Calendar },
    { to: '/teacher-progress', label: t('teacherNav.progress'), icon: TrendingUp },
    { to: '/teacher-promotion-history', label: t('teacherNav.history'), icon: TrendingUp },
    { to: '/teacher-accounts', label: t('teacherNav.accounts'), icon: Wallet },
    { to: '/medical-profile', label: t('teacherNav.medicalProfile'), icon: HeartPulse },
    { to: '/subscription', label: t('teacherNav.premium'), icon: Crown },
    { to: '/teacher-messages', label: t('teacherNav.messages'), icon: MessageSquare },
    { to: '/teacher-complaints', label: t('teacherNav.complaints'), icon: FileQuestion }
  ];

  const categories = [
    { id: 'ALL', label: t('teacherHelp.allCategories'), icon: BookOpen },
    { id: 'PROFILE', label: t('teacherHelp.catProfile'), icon: User },
    { id: 'STUDENTS', label: t('teacherHelp.catStudents'), icon: Users },
    { id: 'TEACHING', label: t('teacherHelp.catTeaching'), icon: GraduationCap },
    { id: 'ACCOUNTS', label: t('teacherHelp.catAccounts'), icon: Wallet },
    { id: 'SUPPORT', label: t('teacherHelp.catSupport'), icon: Headphones }
  ];

  const faqItems = [
    { id: 'faq1', category: 'PROFILE', question: t('teacherHelp.faq1Question'), answer: t('teacherHelp.faq1Answer') },
    { id: 'faq2', category: 'STUDENTS', question: t('teacherHelp.faq2Question'), answer: t('teacherHelp.faq2Answer') },
    { id: 'faq3', category: 'TEACHING', question: t('teacherHelp.faq3Question'), answer: t('teacherHelp.faq3Answer') },
    { id: 'faq4', category: 'ACCOUNTS', question: t('teacherHelp.faq4Question'), answer: t('teacherHelp.faq4Answer') },
    { id: 'faq5', category: 'SUPPORT', question: t('teacherHelp.faq5Question'), answer: t('teacherHelp.faq5Answer') },
    { id: 'faq6', category: 'TEACHING', question: t('teacherHelp.faq6Question'), answer: t('teacherHelp.faq6Answer') }
  ];

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
<DashboardLayout>
      <DashboardHeader
        title={t('teacherHelp.title')}
        badge={t('teacherNav.teacherPortal')}
        badgeColor="red"
      />

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Teacher Header Banner - Teacher portal red identity */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white p-6 sm:p-8 shadow-sm">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-wide">
                <GraduationCap size={14} />
                <span>{t('teacherNav.teacherPortal')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('teacherHelp.title')}</h1>
              <p className="text-red-100 text-sm sm:text-base max-w-2xl leading-relaxed">{t('teacherHelp.subtitle')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/teacher-messages')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 hover:bg-red-50 font-semibold text-sm transition-all shadow-sm"
              >
                <MessageSquare size={16} />
                <span>{t('teacherHelp.contactSupportBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('teacherHelp.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
        </div>
{/* Quick Contact & Support Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="mailto:support@homelyserv.com"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-all group no-underline"
          >
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover:bg-red-100">
              <Mail size={22} />
            </div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('teacherHelp.email')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">support@homelyserv.com</p>
          </a>

          <a
            href="tel:+201009189851"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-all group no-underline"
          >
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover:bg-red-100">
              <Phone size={22} />
            </div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('teacherHelp.phone')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+20 100 918 9851</p>
          </a>

          <div
            onClick={() => navigate('/teacher-messages')}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover:bg-red-100">
              <MessageSquare size={22} />
            </div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('teacherHelp.chat')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('teacherHelp.chatDesc')}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock size={22} />
            </div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('teacherHelp.supportHours')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('teacherHelp.supportHoursDesc')}</p>
          </div>
        </div>

        {/* Teacher Tools - reuses the existing teacherNav.* labels */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-red-600" />
            {t('teacherHelp.teacherTools')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {teacherTools.map((tool) => (
              <button
                key={tool.to}
                onClick={() => navigate(tool.to)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left group"
              >
                <tool.icon size={18} className="text-red-600 shrink-0" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-red-700 dark:group-hover:text-red-300">
                  {tool.label}
                </span>
              </button>
            ))}
          </div>
        </div>
{/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-red-300 hover:text-red-600'
                }`}
              >
                <cat.icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-red-600" />
              {t('teacherHelp.faqTitle')}
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {filteredFaqs.length} {t('teacherHelp.articleWord')}
            </span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">{t('teacherHelp.noResults')}</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">{t('teacherHelp.tryDifferent')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition text-left bg-white dark:bg-gray-800"
                    >
                      <span className="font-medium text-gray-800 dark:text-white text-sm sm:text-base">
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-red-600 shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct Assistance CTA Card */}
        <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Headphones size={20} />
              <span>{t('teacherHelp.contactSupportCardTitle')}</span>
            </h3>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              {t('teacherHelp.contactSupportCardDesc')}
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher-messages')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 hover:bg-red-50 font-semibold text-sm transition-all shadow-sm shrink-0"
          >
            <span>{t('teacherHelp.contactSupportBtn')}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherHelp;