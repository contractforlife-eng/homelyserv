import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Copy, Check, MessageCircle, Facebook, X } from 'lucide-react';

export default function JobShareModal({ job, isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !job) return null;

  // Requirement: Always use production domain for sharing, never localhost.
  const origin = 'https://www.homelyserv.com';
  const activeLang = i18n.language ? i18n.language.slice(0, 2) : 'ar';
  const shareUrl = `${origin}/job/${job.id}?lang=${activeLang}`;
  const jobTitle = job.jobTitle || 'Job Opening';
  const employerName = job.employer?.displayName || job.employer?.name || '';
  const employerText = employerName ? ` (${employerName})` : '';

  const shareTitle = `${jobTitle}${employerText} | HomelyServ`;
  const shareText = t('jobShare.whatsappText', {
    title: jobTitle,
    employer: employerText,
    defaultValue: `${jobTitle}${employerText} - ${t('jobShare.freeBadge', { defaultValue: 'Apply to this job for free now — No fees' })} on HomelyServ`,
  });

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Native share failed:', err);
        }
      }
    }
  };

  const handleWhatsAppShare = () => {
    const message = `${shareText}\n${shareUrl}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    // Facebook sharer crawls the canonical Open Graph meta tags of the passed URL
    const encoded = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-lg">
              <Share2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {t('jobShare.title', { defaultValue: 'Share Job Post' })}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('jobShare.description', {
              defaultValue: 'Share this public link so candidates can view job details and apply directly without needing an existing account.',
            })}
          </p>

          {/* Social share options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
            >
              <MessageCircle size={18} />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleFacebookShare}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2] text-white rounded-xl font-medium hover:bg-[#166fe5] transition"
            >
              <Facebook size={18} />
              <span>Facebook</span>
            </button>
          </div>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-medium transition"
            >
              <Share2 size={18} />
              <span>{t('jobShare.moreOptions', { defaultValue: 'More share options' })}</span>
            </button>
          )}

          {/* Copy link input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('jobShare.publicLink', { defaultValue: 'Public Link' })}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-700 dark:text-gray-300 select-all font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? t('jobShare.copied', { defaultValue: 'Copied!' }) : t('jobShare.copy', { defaultValue: 'Copy' })}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
