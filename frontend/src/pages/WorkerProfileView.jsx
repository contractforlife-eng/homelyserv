// src/pages/WorkerProfileView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import employerService from '../services/employerService';
import { PremiumBadge, ActivelyLookingBadge } from '../components/PremiumBadge';
import { UserDisplayName } from '../components/users';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { formatWorkerRate } from '../utils/workerRateDisplay';
import { formatExperienceDisplay } from '../utils/experienceDisplay';
import { getTutorSpecializationLabel } from '../constants/tutorSpecializations';
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
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const fetchedRef = React.useRef(false);
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);

  const { t } = useTranslation();

  const isBase64Image = (str) => typeof str === 'string' && str.startsWith('data:image/');

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
    // Return to the Employer Search page. Carry the previous search snapshot
    // (if any) so the search page restores its results instead of showing an
    // empty list after this profile page unmounted it.
    navigate('/employer-search', {
      state: location.state?.search ? { search: location.state.search } : undefined
    });
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
      window.location.href = `mailto:${worker.email}?subject=${t('workerProfile.emailSubject')}&body=${t('workerProfile.emailBody', { worker: worker.fullName || t('workerProfile.worker') })}`;
    }
    setShowContactOptions(false);
  };

  const handleCallPhone = () => {
    if (worker?.phone) {
      window.location.href = `tel:${worker.phone}`;
    } else {
      alert(t('workerProfile.phoneUnavailable'));
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
      'nanny': t('workerProfile.jobs.nanny'),
      'elderly_caregiver': t('workerProfile.jobs.elderly_caregiver'),
      'nurse': t('workerProfile.jobs.nurse'),
      'driver': t('workerProfile.jobs.driver'),
      'security_guard': t('workerProfile.jobs.security_guard'),
      'bodyguard': t('workerProfile.jobs.bodyguard'),
      'plumber': t('workerProfile.jobs.plumber'),
      'carpenter': t('workerProfile.jobs.carpenter'),
      'electrician': t('workerProfile.jobs.electrician'),
      'cleaner': t('workerProfile.jobs.cleaner'),
      'cook': t('workerProfile.jobs.cook'),
      'tutor': t('workerProfile.jobs.tutor'),
      'gardener': t('workerProfile.jobs.gardener'),
      'portrait_painter': t('workerProfile.jobs.portrait_painter'),
      'interior_designer': t('workerProfile.jobs.interior_designer'),
      'dog_trainer': t('workerProfile.jobs.dog_trainer'),
      'cat_trainer': t('workerProfile.jobs.cat_trainer'),
      'housekeeping': t('workerProfile.jobs.housekeeping'),
      'personal_assistant': t('workerProfile.jobs.personal_assistant'),
      'event_planner': t('workerProfile.jobs.event_planner'),
      'fitness_trainer': t('workerProfile.jobs.fitness_trainer'),
      'psychotherapist': t('workerProfile.jobs.psychotherapist'),
      'other': t('workerProfile.jobs.other'),
      // Legacy values for backward compatibility
      'elderly_care': t('workerProfile.jobs.elderly_care'),
      'housekeeper': t('workerProfile.jobs.housekeeper'),
      'house_manager': t('workerProfile.jobs.house_manager'),
      'pet_care': t('workerProfile.jobs.pet_care'),
      'maintenance': t('workerProfile.jobs.maintenance'),
      'security': t('workerProfile.jobs.security'),
      'therapist': t('workerProfile.jobs.therapist'),
      'maid': t('workerProfile.jobs.maid'),
      'child_care': t('workerProfile.jobs.child_care'),
      'handyman': t('workerProfile.jobs.handyman'),
      'painter': t('workerProfile.jobs.painter')
    };
    return jobMap[value] || value || t('workerProfile.notSpecified');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('workerProfile.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('workerProfile.loading')}</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <DashboardLayout requiredRole="EMPLOYER">
        <DashboardHeader
          title={t('workerProfile.title')}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <div className="p-4 md:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('workerProfile.noWorkerData')}</h3>
            <button
              onClick={handleBack}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              {t('workerProfile.back')}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t('workerProfile.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />

        <div className="p-4 md:p-6">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-teal-600 transition mb-4"
          >
            <ArrowLeft size={18} />
            {t('workerProfile.back')}
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
                  <span className={`inline-flex items-baseline min-w-0 ${worker?.isPremium ? 'text-purple-900 dark:text-purple-200' : ''}`}>
                  <span className={`truncate text-lg ${worker?.isPremium ? 'font-bold' : 'font-medium text-gray-900 dark:text-white'}`}>
                    {worker?.fullName || worker?.name || t('sharedUserDisplay.fallbacks.user')}
                  </span>
                </span>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-1">
                  {worker.isPremium && <PremiumBadge label={t('workerProfile.premiumLabel')} size="md" />}
                  {worker.activelyLooking && <ActivelyLookingBadge label={t('workerProfile.activelyLooking')} size="md" />}
                </div>
                <p className="text-teal-100">
                  {getJobLabel(worker.desiredJob)}
                  {worker.desiredJob === 'tutor' && worker.tutorSpecialization ? (
                    <> — {getTutorSpecializationLabel(worker.tutorSpecialization, t)}</>
                  ) : null}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-teal-100">
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {worker.location || t('workerProfile.notSpecified')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" />
                    {worker.ratingAvg || worker.rating || '-'} ★
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={16} />
                    {t('workerProfile.jobsCompletedCount', { count: worker.jobsCompleted || 0 })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleHireNow}
                  className="px-6 py-2 bg-white dark:bg-gray-800 text-teal-700 rounded-lg font-medium hover:bg-teal-50 dark:bg-teal-900/30 transition flex items-center gap-2"
                >
                  <UserCheck size={18} />
                  {t('workerProfile.hire')}
                </button>
                <button
                  onClick={handleContactWorker}
                  className="px-6 py-2 border border-white/30 text-white rounded-lg font-medium hover:bg-white dark:bg-gray-800/10 transition flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  {t('workerProfile.contact')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - About & Skills */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t('workerProfile.about')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {worker.bio || t('workerProfile.noBio')}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t('workerProfile.skills')}</h3>
                {worker.skills && worker.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">{t('workerProfile.noSkills')}</p>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('workerProfile.details')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('workerProfile.experience')}</span>
                    <span className="font-medium">{formatExperienceDisplay(worker.experience) || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('workerProfile.hourlyRate')}</span>
                    <span className="font-medium text-teal-600">{formatWorkerRate(worker, t, 'workerProfile.notSpecified')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('workerProfile.availability')}</span>
                    <span className={`font-medium ${worker.availability === 'available' ? 'text-green-600' : 'text-gray-500'}`}>
                      {worker.availability === 'available' ? t('workerProfile.available') : t('workerProfile.notAvailable')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('workerProfile.memberSince')}</span>
                    <span className="font-medium">{t('workerProfile.memberSinceValue')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('workerProfile.contactInfo')}</h3>
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
                        title={t('workerProfile.copyEmail')}
                        aria-label={t('workerProfile.copyEmail')}
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
                        <span className="text-gray-600 dark:text-gray-300">{worker.phone || t('workerProfile.notProvided')}</span>
                      </div>
                      {worker.phone && (
                        <button
                          onClick={handleCopyPhone}
                          className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded transition"
                          title={t('workerProfile.copyPhone')}
                          aria-label={t('workerProfile.copyPhone')}
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
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('workerProfile.paymentRequired')}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{t('workerProfile.contactLocked')}</p>
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
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t('workerProfile.contactOptions')}</h3>
              <button
                onClick={() => setShowContactOptions(false)}
                className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition"
                aria-label={t('workerProfile.close')}
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
                    <p className="font-medium text-gray-800 dark:text-white">{t('workerProfile.sendEmail')}</p>
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
                    <p className="font-medium text-gray-800 dark:text-white">{t('workerProfile.callPhone')}</p>
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
                title={contactUnlocked ? t('workerProfile.startChat') : t('workerProfile.contactLocked')}
              >
                <MessageCircle size={20} className={contactUnlocked ? 'text-teal-600' : 'text-gray-400'} />
                <div className="text-left">
                  <p className={`font-medium ${contactUnlocked ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{t('workerProfile.startChat')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contactUnlocked ? t('workerProfile.startConversation', { worker: worker.fullName }) : t('workerProfile.contactLocked')}
                  </p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowContactOptions(false)}
              className="w-full mt-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition"
            >
              {t('workerProfile.close')}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkerProfileView;
