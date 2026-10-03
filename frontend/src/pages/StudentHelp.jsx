// frontend/src/pages/StudentHelp.jsx
// ============================================================
// STUDENT HELP & SUPPORT PAGE
// ============================================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import useAuthStore from '../store/authStore';
import {
  GraduationCap,
  Search,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Headphones,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  BookOpen,
  User,
  Users,
  Calendar,
  TrendingUp,
  HeartPulse,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const StudentHelp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { id: 'ALL', label: t('studentHelp.allCategories') || 'All Topics', icon: BookOpen },
    { id: 'ACCOUNT', label: t('studentHelp.catAccount') || 'Account & Profile', icon: User },
    { id: 'TEACHERS', label: t('studentHelp.catTeachers') || 'Teachers & Connections', icon: GraduationCap },
    { id: 'BOOKINGS', label: t('studentHelp.catBookings') || 'Lesson Bookings', icon: Calendar },
    { id: 'LESSONS', label: t('studentHelp.catLessons') || 'Lessons & Schedule', icon: BookOpen },
    { id: 'HOMEWORK', label: t('studentHelp.catHomework') || 'Homework & Progress', icon: TrendingUp },
    { id: 'FRIENDS', label: t('studentHelp.catFriends') || 'Friends & Messages', icon: Users },
    { id: 'PARENT', label: t('studentHelp.catParent') || 'Parent / Guardian', icon: Users },
    { id: 'MEDICAL', label: t('studentHelp.catMedical') || 'Medical & Premium', icon: HeartPulse }
  ];

  const faqItems = [
    {
      id: 'faq1',
      category: 'ACCOUNT',
      question: t('studentHelp.faq1Question') || 'How do I update my school, grade, and enrolled subjects?',
      answer: t('studentHelp.faq1Answer') || 'Navigate to "My Profile" from the sidebar. You can edit your school name, current grade or educational level, and select the subjects you are studying. Keeping this updated helps teachers understand your curriculum.'
    },
    {
      id: 'faq2',
      category: 'TEACHERS',
      question: t('studentHelp.faq2Question') || 'How do I find and connect with a teacher?',
      answer: t('studentHelp.faq2Answer') || 'Go to "Find a Teacher" to browse approved teachers by subject, grade level, and language. You can view teacher profiles and connect with them. Once connected, they will appear in your "My Teacher" dashboard.'
    },
    {
      id: 'faq3',
      category: 'BOOKINGS',
      question: t('studentHelp.faq3Question') || 'How does lesson booking work?',
      answer: t('studentHelp.faq3Answer') || 'Once you are connected with a teacher, you can request a lesson booking by choosing a subject, date, and preferred time. Your teacher will review and accept or adjust the booking.'
    },
    {
      id: 'faq4',
      category: 'LESSONS',
      question: t('studentHelp.faq4Question') || 'Where do I find my scheduled lessons and timetable?',
      answer: t('studentHelp.faq4Answer') || 'Your upcoming and past lessons are listed under "Lessons". You can also view your full weekly timetable and class schedule under "Schedule".'
    },
    {
      id: 'faq5',
      category: 'HOMEWORK',
      question: t('studentHelp.faq5Question') || 'How do I submit homework assignments and check grades?',
      answer: t('studentHelp.faq5Answer') || 'Homework assigned by your teachers appears within your Lessons details and on your Student Dashboard. You can view due dates, instructions, submit your work, and review teacher scores and feedback under "Progress".'
    },
    {
      id: 'faq6',
      category: 'FRIENDS',
      question: t('studentHelp.faq6Question') || 'How do I chat with classmates and friends?',
      answer: t('studentHelp.faq6Answer') || 'Under "Messages", you can chat privately with accepted student friends. To add classmates as friends, you can discover them through shared classes or groups and send a friendship request.'
    },
    {
      id: 'faq7',
      category: 'PARENT',
      question: t('studentHelp.faq7Question') || 'How does Parent / Child learning management work?',
      answer: t('studentHelp.faq7Answer') || 'If your parent or guardian has a HomelyServ account, they can send a link request to your student email. Once you approve the request, your parent can view your learning progress and help book lessons on your behalf.'
    },
    {
      id: 'faq8',
      category: 'MEDICAL',
      question: t('studentHelp.faq8Question') || 'What is My Medical Profile and who can see it?',
      answer: t('studentHelp.faq8Answer') || 'My Medical Profile is a secure, Premium feature allowing you to store important health conditions, allergies, and emergency contacts. Your medical information is completely private and is never visible to classmates, friends, or parents through the platform.'
    },
    {
      id: 'faq9',
      category: 'ACCOUNT',
      question: t('studentHelp.faq9Question') || 'What should I do if I experience a problem or harassment?',
      answer: t('studentHelp.faq9Answer') || 'Your safety is our top priority. You can immediately report issues or contact our dedicated Support team via Messages or email at support@homelyserv.com.'
    }
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
        title={t('studentHelp.title') || 'Student Help & Support'}
        badge={t('studentDashboard.studentPortalBadge') || 'Student Portal'}
        badgeColor="red"
      />

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Red Student Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8 shadow-lg shadow-red-500/10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-wide">
                <GraduationCap size={14} />
                <span>{t('studentDashboard.studentPortalBadge') || 'Student Portal'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {t('studentHelp.title') || 'Student Help & Support'}
              </h1>
              <p className="text-red-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                {t('studentHelp.subtitle') || 'Find guidance for your learning journey, teacher connections, lessons, homework, and account assistance.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/student-messages')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 hover:bg-red-50 font-semibold text-sm transition-all shadow-sm"
              >
                <MessageSquare size={16} />
                <span>{t('studentHelp.contactSupportBtn') || 'Message Support'}</span>
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
              placeholder={t('studentHelp.searchPlaceholder') || 'Search student help guides, topics, and FAQs...'}
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
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('studentHelp.email') || 'Email Support'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">support@homelyserv.com</p>
          </a>

          <a
            href="tel:+201009189851"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-all group no-underline"
          >
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover:bg-red-100">
              <Phone size={22} />
            </div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('studentHelp.phone') || 'Phone Support'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+20 100 918 9851</p>
          </a>

          <div
            onClick={() => navigate('/student-messages')}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-700 text-center hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover:bg-red-100">
              <MessageSquare size={22} />
            </div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('studentHelp.chat') || 'Messages / Support'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('studentHelp.chatDesc') || 'Contact staff or teachers directly'}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock size={22} />
            </div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('studentHelp.supportHours') || 'Support Hours'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('studentHelp.supportHoursDesc') || 'Sun - Thu: 9:00 AM - 9:00 PM'}</p>
          </div>
        </div>

        {/* Categories / Filter Pills */}
        <div>
          <h2 className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-3">
            {t('studentHelp.popularTopics') || 'Popular Student Topics'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQs List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileQuestion size={20} className="text-red-600" />
              <span>{t('studentHelp.faqTitle') || 'Frequently Asked Questions'}</span>
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {filteredFaqs.length} {filteredFaqs.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">{t('studentHelp.noResults') || 'No help articles found'}</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                {t('studentHelp.tryDifferent') || 'Try searching with different keywords like lessons, teacher, homework, or messages.'}
              </p>
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
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Headphones size={20} className="text-red-500" />
              <span>{t('studentHelp.contactSupportCardTitle') || 'Need Direct Assistance?'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              {t('studentHelp.contactSupportCardDesc') || 'If you encounter any issues or have questions regarding your studies, you can contact HomelyServ Support directly through messages or email.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/student-messages')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-sm shrink-0"
          >
            <span>{t('studentHelp.contactSupportBtn') || 'Message Support'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentHelp;
