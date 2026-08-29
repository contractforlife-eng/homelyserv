import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react';
import LegalFooter from '../components/common/LegalFooter';
import useAuthStore from '../store/authStore';
import { getMessagesRoute } from '../utils/supportRoutes';

function Contact() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const handleBack = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (location.key && location.key !== 'default') {
      navigate(-1);
      return;
    }

    if (authUser?.role === 'EMPLOYER') {
      navigate('/employer-dashboard');
    } else if (authUser?.role === 'WORKER') {
      navigate('/worker-dashboard');
    } else {
      navigate('/help');
    }
  };

  const handleStartChat = () => {
    if (isAuthenticated && authUser?.role) {
      navigate(getMessagesRoute(authUser.role));
    } else if (isAuthenticated) {
      navigate('/messages');
    } else {
      navigate('/login');
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError(t('contactPage.validation.requiredFields'));
      return;
    }
    setSubmitted(true);
    setError('');
  };

  const contactInfo = [
    { icon: <Mail size={20} />, label: t('contactPage.contactInfo.email'), value: 'support@homelyserv.com' },
    { icon: <Phone size={20} />, label: t('contactPage.contactInfo.phone'), value: '+20 100 918 9851' },
    { icon: <MapPin size={20} />, label: t('contactPage.contactInfo.address'), value: 'Cairo, Egypt' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleBack} className="text-gray-600 dark:text-gray-300 hover:text-red-600 transition">{t('back')}</button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('contactPage.title')}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('contactPage.getInTouch')}</h2>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mb-6">
                {t('contactPage.description')}
              </p>
              <div className="space-y-4">
                {contactInfo.map((info, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-600 flex-shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{info.label}</p>
                      <p className="font-medium text-gray-800 dark:text-white">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('contactPage.liveChat')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {t('contactPage.liveChatAvailability')}
                  {!isAuthenticated && t('contactPage.signInHint')}
                </p>
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <MessageCircle size={18} /> {t('contactPage.startChat')}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('contactPage.sendMessageTitle')}</h2>
              
              {submitted ? (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('contactPage.successTitle')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {t('contactPage.successDescription')}
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    {t('contactPage.sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                      <AlertCircle size={18} /> {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contactPage.fields.fullName')} *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder={t('contactPage.placeholders.name')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contactPage.fields.email')} *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder={t('contactPage.placeholders.email')}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contactPage.fields.subject')}</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder={t('contactPage.placeholders.subject')}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contactPage.fields.message')} *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      rows="5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                      placeholder={t('contactPage.placeholders.message')}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Send size={18} /> {t('contactPage.sendMessage')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <LegalFooter />
    </div>
  );
}

export default Contact;
