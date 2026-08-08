// src/pages/WorkerProfileView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import api from '../utils/api';
import employerService from '../services/employerService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Star,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  Award,
  MessageCircle,
  UserCheck,
  Globe,
  X,
  FileCheck,
  Search,
  AlertTriangle,
  Home,
  Send,
  Copy,
  Check,
  Lock
} from 'lucide-react';

// Main WorkerProfileView Component
const WorkerProfileView = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const fetchedRef = React.useRef(false);
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);

  const dashboard = useDashboard();

  const isBase64Image = (str) => typeof str === 'string' && str.startsWith('data:image/');

  const translations = {
    en: {
      title: 'Worker Profile',
      back: 'Back to Search',
      contact: 'Contact Worker',
      hire: 'Hire Now',
      about: 'About',
      skills: 'Skills',
      experience: 'Experience',
      location: 'Location',
      hourlyRate: 'Hourly Rate',
      rating: 'Rating',
      jobsCompleted: 'Jobs Completed',
      memberSince: 'Member Since',
      availability: 'Availability',
      available: 'Available',
      notAvailable: 'Not Available',
      contactInfo: 'Contact Information',
      email: 'Email',
      phone: 'Phone',
      noBio: 'No bio provided',
      noSkills: 'No skills listed',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading worker profile...',
      noWorkerData: 'No worker data found',
      contactOptions: 'Contact Options',
      sendEmail: 'Send Email',
      callPhone: 'Call Phone',
      startChat: 'Start Chat',
      copyEmail: 'Copy Email',
      emailCopied: 'Email copied!',
      phoneCopied: 'Phone copied!',
      close: 'Close',
      contactLocked: 'Contact information locked. Complete payment to unlock contact details and messaging.',
      paymentRequired: 'Payment required'
    },
    ar: {
      title: 'الملف الشخصي للعامل',
      back: 'العودة إلى البحث',
      contact: 'تواصل مع العامل',
      hire: 'توظيف الآن',
      about: 'عن',
      skills: 'المهارات',
      experience: 'الخبرة',
      location: 'الموقع',
      hourlyRate: 'السعر بالساعة',
      rating: 'التقييم',
      jobsCompleted: 'الوظائف المكتملة',
      memberSince: 'عضو منذ',
      availability: 'التوفر',
      available: 'متاح',
      notAvailable: 'غير متاح',
      contactInfo: 'معلومات الاتصال',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      noBio: 'لا توجد سيرة ذاتية',
      noSkills: 'لا توجد مهارات',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الملف الشخصي...',
      noWorkerData: 'لا توجد بيانات للعامل',
      contactOptions: 'خيارات التواصل',
      sendEmail: 'إرسال بريد إلكتروني',
      callPhone: 'اتصال هاتفي',
      startChat: 'بدء محادثة',
      copyEmail: 'نسخ البريد الإلكتروني',
      emailCopied: 'تم نسخ البريد الإلكتروني!',
      phoneCopied: 'تم نسخ رقم الهاتف!',
      close: 'إغلاق',
      contactLocked: 'معلومات الاتصال مقفلة. أكمل الدفع لفتح تفاصيل الاتصال والمراسلة.',
      paymentRequired: 'مطلوب دفع'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authUser) {
      navigate('/login');
      return;
    }

    setUser(authUser);

    // Try to get worker data from location state first
    const workerData = location.state?.worker;
    
    if (workerData) {
      setWorker({
        ...workerData,
        profileImage: isBase64Image(workerData.profileImage) ? '' : workerData.profileImage
      });
    } else {
      // No worker data in navigation state
      navigate('/employer-search');
    }

    setLoading(false);
  }, [navigate, authLoading, authUser, location.state]);

  useEffect(() => {
    fetchedRef.current = false;
  }, [worker?.id, user?.id]);

  useEffect(() => {
    const fetchContactStatus = async () => {
      if (!worker || !user) return;
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      try {
        const profileData = await employerService.getWorkerProfile(worker.id || worker._id);
        setContactUnlocked(profileData.contactUnlocked || false);
        if (profileData.user) {
          setWorker(prev => ({ ...prev, ...profileData.user }));
        } else if (!profileData.contactUnlocked) {
          setWorker(prev => ({ ...prev, email: '', phone: '' }));
        }
      } catch (e) {
        console.error('Failed to fetch contact status:', e);
      }
    };
    fetchContactStatus();
  }, [worker?.id, user?.id]);

  const handleBack = () => {
    navigate('/employer-search');
  };

  const handleHireNow = () => {
    if (!worker || !user) return;

    // Sanitize worker data and pass via React Router state
    const sanitizedWorker = { 
      ...worker, 
      profileImage: isBase64Image(worker.profileImage) ? '' : worker.profileImage 
    };

    // Navigate to the offer creation form with worker data in state
    navigate('/employer-create-offer', { state: { worker: sanitizedWorker } });
  };

  // Contact Worker Functionality
  const handleContactWorker = () => {
    setShowContactOptions(true);
  };

  const handleSendEmail = () => {
    if (worker?.email) {
      window.location.href = `mailto:${worker.email}?subject=Job Opportunity on HomelyServ&body=Hello ${worker.fullName || 'Worker'},%0D%0A%0D%0AI came across your profile on HomelyServ and I'm interested in discussing a potential opportunity.%0D%0A%0D%0APlease let me know if you're available.%0D%0A%0D%0AThank you.`;
    }
    setShowContactOptions(false);
  };

  const handleCallPhone = () => {
    if (worker?.phone) {
      window.location.href = `tel:${worker.phone}`;
    } else {
      alert('Phone number not available');
    }
    setShowContactOptions(false);
  };

  const handleStartChat = () => {
    // Save conversation data and navigate to messages
    if (worker) {
      const conversationData = {
        workerId: worker.id || worker.email,
        workerName: worker.fullName,
        workerEmail: worker.email,
        employerId: user?.id || user?.email,
        employerName: user?.fullName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('homelyserv_active_conversation', JSON.stringify(conversationData));

      // Navigate to messages page
      if (user?.role === 'EMPLOYER') {
        navigate('/employer-messages');
      } else {
        navigate('/messages');
      }
    }
    setShowContactOptions(false);
  };

  const handleCopyEmail = () => {
    if (worker?.email) {
      navigator.clipboard.writeText(worker.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyPhone = () => {
    if (worker?.phone) {
      navigator.clipboard.writeText(worker.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const getJobLabel = (value) => {
    const jobMap = {
      'nanny': 'Nanny',
      'elderly_care': 'Elderly Caregiver',
      'housekeeper': 'Housekeeper',
      'cook': 'Cook',
      'driver': 'Driver',
      'gardener': 'Gardener',
      'house_manager': 'House Manager',
      'tutor': 'Tutor',
      'pet_care': 'Pet Care',
      'maintenance': 'Maintenance',
      'security': 'Security Guard',
      'personal_assistant': 'Personal Assistant',
      'event_planner': 'Event Planner',
      'fitness_trainer': 'Fitness Trainer',
      'nurse': 'Nurse',
      'therapist': 'Therapist',
      'cleaner': 'Cleaner',
      'other': 'Other'
    };
    return jobMap[value] || value || 'Not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <DashboardLayout requiredRole="EMPLOYER">
        <DashboardHeader
          title={t.title}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <div className="p-4 md:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.noWorkerData}</h3>
            <button
              onClick={handleBack}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              {t.back}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isUserPremium(authUser?.id || authUser?.email)}
      />

        <div className="p-4 md:p-6">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-teal-600 transition mb-4"
          >
            <ArrowLeft size={18} />
            {t.back}
          </button>

          {/* Profile Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800/20 flex items-center justify-center flex-shrink-0">
                {worker?.profileImage ? (
                  <img
                    src={worker.profileImage}
                    alt={worker.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-white" />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold">{worker.fullName}</h1>
                <p className="text-teal-100">{getJobLabel(worker.desiredJob)}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-teal-100">
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {worker.location || 'Not specified'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" />
                    {worker.rating || '4.5'} ★
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={16} />
                    {worker.jobsCompleted || 0} jobs completed
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleHireNow}
                  className="px-6 py-2 bg-white dark:bg-gray-800 text-teal-700 rounded-lg font-medium hover:bg-teal-50 dark:bg-teal-900/30 transition flex items-center gap-2"
                >
                  <UserCheck size={18} />
                  {t.hire}
                </button>
                <button
                  onClick={handleContactWorker}
                  className="px-6 py-2 border border-white/30 text-white rounded-lg font-medium hover:bg-white dark:bg-gray-800/10 transition flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  {t.contact}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - About & Skills */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t.about}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {worker.bio || t.noBio}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t.skills}</h3>
                {worker.skills && worker.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">{t.noSkills}</p>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t.experience}</span>
                    <span className="font-medium">{worker.experience || '0 years'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t.hourlyRate}</span>
                    <span className="font-medium text-teal-600">EGP {worker.hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t.availability}</span>
                    <span className="font-medium text-green-600">{t.available}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t.memberSince}</span>
                    <span className="font-medium">June 2025</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.contactInfo}</h3>
                {contactUnlocked ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">{worker.email}</span>
                      </div>
                      <button
                        onClick={handleCopyEmail}
                        className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded transition"
                        title={t.copyEmail}
                      >
                        {copied ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} className="text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">{worker.phone || 'Not provided'}</span>
                      </div>
                      {worker.phone && (
                        <button
                          onClick={handleCopyPhone}
                          className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded transition"
                          title={t.copyEmail}
                        >
                          {copied ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} className="text-gray-400 dark:text-gray-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lock size={20} className="text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t.paymentRequired}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{t.contactLocked}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Contact Options Modal */}
      {showContactOptions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[85dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t.contactOptions}</h3>
              <button
                onClick={() => setShowContactOptions(false)}
                className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              {contactUnlocked && worker?.email && (
                <button
                  onClick={handleSendEmail}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-teal-50 dark:bg-teal-900/30 hover:border-teal-300 transition flex items-center gap-3"
                >
                  <Mail size={20} className="text-teal-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800 dark:text-white">{t.sendEmail}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{worker.email}</p>
                  </div>
                </button>
              )}
              {contactUnlocked && worker?.phone && (
                <button
                  onClick={handleCallPhone}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-teal-50 dark:bg-teal-900/30 hover:border-teal-300 transition flex items-center gap-3"
                >
                  <Phone size={20} className="text-teal-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800 dark:text-white">{t.callPhone}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{worker.phone}</p>
                  </div>
                </button>
              )}
              <button
                onClick={handleStartChat}
                disabled={!contactUnlocked}
                className={`w-full p-3 border rounded-lg transition flex items-center gap-3 ${
                  contactUnlocked
                    ? 'border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:bg-teal-900/30 hover:border-teal-300'
                    : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }`}
                title={contactUnlocked ? t.startChat : t.contactLocked}
              >
                <MessageCircle size={20} className={contactUnlocked ? 'text-teal-600' : 'text-gray-400'} />
                <div className="text-left">
                  <p className={`font-medium ${contactUnlocked ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{t.startChat}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contactUnlocked ? `Start a conversation with ${worker.fullName}` : t.contactLocked}
                  </p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowContactOptions(false)}
              className="w-full mt-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkerProfileView;
