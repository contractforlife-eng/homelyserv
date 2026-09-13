// frontend/src/components/verification/TrustVerificationSection.jsx
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail,
  FileCheck,
  Award,
  Briefcase,
  AlertCircle,
  Send,
  Sparkles,
  UploadCloud,
  FileText,
  Eye,
  Trash2,
  Lock,
  Loader2,
  Check,
  X
} from 'lucide-react';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

const TrustVerificationSection = ({
  verification,
  userId,
  userRole,
  role,
  isOwnProfile = false,
  isAdmin = false,
  onVerificationUpdated,
  className = ''
}) => {
  const { t } = useTranslation();
  const authUser = useAuthStore((state) => state.user);
  const fileInputRef = useRef(null);

  const effectiveRole = String(
    userRole || role || verification?.role || verification?.userRole || (isOwnProfile ? authUser?.role : '') || ''
  ).toUpperCase();
  const isEmployer = effectiveRole === 'EMPLOYER';

  const [submittingType, setSubmittingType] = useState(null);
  const [requestNote, setRequestNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [activeRequestModal, setActiveRequestModal] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [viewingDocType, setViewingDocType] = useState(null);

  const v = verification || {};
  const items = v.items || {};

  const phoneItem = items.phone || v.phone || {
    status: v.phoneVerified ? 'VERIFIED' : 'UNVERIFIED',
    verified: Boolean(v.phoneVerified || v.phone?.verified),
    verifiedAt: v.phoneVerifiedAt || v.phone?.verifiedAt || null
  };

  const emailItem = items.email || v.email || {
    status: v.emailVerified ? 'VERIFIED' : 'UNVERIFIED',
    verified: Boolean(v.emailVerified || v.email?.verified),
    verifiedAt: v.emailVerifiedAt || v.email?.verifiedAt || null
  };

  const identityItem = items.identity || v.identity || {
    status: v.identityVerificationStatus || v.identity?.status || 'UNVERIFIED',
    verified: v.identityVerificationStatus === 'VERIFIED' || v.identity?.status === 'VERIFIED',
    verifiedAt: v.identityVerifiedAt || v.identity?.verifiedAt || null,
    hasDocument: Boolean(v.hasIdentityDocument || items.identity?.hasDocument || v.identity?.hasDocument)
  };

  const experienceItem = items.experience || v.experience || {
    status: v.experienceVerificationStatus || v.experience?.status || 'UNVERIFIED',
    verified: v.experienceVerificationStatus === 'VERIFIED' || v.experience?.status === 'VERIFIED',
    verifiedAt: v.experienceVerifiedAt || v.experience?.verifiedAt || null,
    hasDocument: Boolean(v.hasExperienceDocument || items.experience?.hasDocument || v.experience?.hasDocument)
  };

  const certificatesItem = items.certificates || v.certificates || {
    status: v.certificatesVerificationStatus || v.certificates?.status || 'UNVERIFIED',
    verified: v.certificatesVerificationStatus === 'VERIFIED' || v.certificates?.status === 'VERIFIED',
    verifiedAt: v.certificatesVerifiedAt || v.certificates?.verifiedAt || null,
    hasDocument: Boolean(v.hasCertificatesDocument || items.certificates?.hasDocument || v.certificates?.hasDocument)
  };

  const isOverallVerified = Boolean(
    v.isVerified === true ||
    v.verifiedProfileStatus === 'VERIFIED' ||
    v.profile?.status === 'VERIFIED'
  );

  const checkList = [
    {
      key: 'phone',
      title: t('verification.phone', 'Phone Number'),
      descVerified: t('verification.phoneDesc', 'Phone number has been confirmed.'),
      descUnverified: t('verification.phoneDescUnverified', 'Phone number has not been confirmed yet.'),
      item: phoneItem,
      icon: Phone,
      canRequest: false
    },
    {
      key: 'email',
      title: t('verification.email', 'Email Address'),
      descVerified: t('verification.emailDesc', 'Email address has been confirmed.'),
      descUnverified: t('verification.emailDescUnverified', 'Email address has not been confirmed yet.'),
      item: emailItem,
      icon: Mail,
      canRequest: false
    },
    {
      key: 'identity',
      title: t('verification.identity', 'Identity Document'),
      descVerified: t('verification.identityDesc', 'Government-issued ID reviewed and verified.'),
      descPending: t('verification.identityDescPending', 'Government ID verification is pending review.'),
      descUnverified: t('verification.identityDescUnverified', 'Government ID has not been verified.'),
      item: identityItem,
      icon: FileCheck,
      canRequest: true,
      requiresUpload: true,
      modalTitle: t('verification.uploadGovernmentId', 'Upload Government ID'),
      modalDesc: t('verification.identityModalDesc', 'Upload a clear photo or PDF document of your official government-issued ID (Passport, National ID, or Driver’s License).'),
      uploadPrompt: t('verification.clickToUpload', 'Click to upload your Government ID')
    },
    ...(!isEmployer ? [
      {
        key: 'experience',
        title: t('verification.experience', 'Work Experience'),
        descVerified: t('verification.experienceDesc', 'Past work history and references verified.'),
        descPending: t('verification.experienceDescPending', 'Experience details submitted and awaiting admin review.'),
        descUnverified: t('verification.experienceDescUnverified', 'Experience has not been independently verified.'),
        item: experienceItem,
        icon: Briefcase,
        canRequest: true,
        requiresUpload: true,
        modalTitle: t('verification.uploadExperience', 'Upload Work Experience Proof'),
        modalDesc: t('verification.experienceModalDesc', 'Upload employment contracts, recommendation letters, client references, or work history documentation.'),
        uploadPrompt: t('verification.clickToUploadExperience', 'Click to upload Work Experience Proof')
      },
      {
        key: 'certificates',
        title: t('verification.certificates', 'Certifications & Licenses'),
        descVerified: t('verification.certificatesDesc', 'Professional training and certificates verified.'),
        descPending: t('verification.certificatesDescPending', 'Certificates submitted and awaiting admin review.'),
        descUnverified: t('verification.certificatesDescUnverified', 'Certificates have not been uploaded or verified.'),
        item: certificatesItem,
        icon: Award,
        canRequest: true,
        requiresUpload: true,
        modalTitle: t('verification.uploadCertificates', 'Upload Certificate or License'),
        modalDesc: t('verification.certificatesModalDesc', 'Upload professional certifications, training diplomas, trade licenses, or relevant accreditations.'),
        uploadPrompt: t('verification.clickToUploadCertificates', 'Click to upload Certificate or License')
      }
    ] : [])
  ];

  const handleFileChange = (e) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type.toLowerCase())) {
      setFileError(t('verification.invalidFileType', 'Invalid file type. Only JPG, PNG, WebP, or PDF files are accepted.'));
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(t('verification.fileTooLarge', 'File is too large. Maximum allowed size is 10 MB.'));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSendVerificationRequest = async (type) => {
    try {
      setSubmittingType(type);
      setFeedback(null);

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type', type);
        if (requestNote.trim()) {
          formData.append('notes', requestNote.trim());
        }

        const res = await api.post('/api/verification/upload-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: res.data.message || t('verification.documentUploadSuccess', 'Document submitted successfully. It is now pending review.')
          });
          closeModal();
          if (onVerificationUpdated) onVerificationUpdated(res.data.verification);
        }
      } else {
        const res = await api.post('/api/verification/request', {
          type,
          notes: requestNote
        });
        if (res.data?.success) {
          setFeedback({
            type: 'success',
            message: t('verification.requestSuccess', 'Verification request submitted successfully.')
          });
          closeModal();
          if (onVerificationUpdated) onVerificationUpdated(res.data.verification);
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || t('verification.requestError', 'Failed to submit verification request.')
      });
    } finally {
      setSubmittingType(null);
    }
  };

  const handleAdminUpdateVerification = async (type, status) => {
    try {
      setSubmittingType(type);
      const payload = { type, status };
      const endpoint = isAdmin ? `/api/admin/users/${userId}/verification` : `/api/support/users/${userId}/verification`;

      const res = await api.patch(endpoint, payload);
      if (res.data?.success) {
        setFeedback({ type: 'success', message: 'Verification status updated successfully.' });
        if (onVerificationUpdated) onVerificationUpdated(res.data.verification);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update verification' });
    } finally {
      setSubmittingType(null);
    }
  };

  const handleAdminViewDocument = async (type) => {
    try {
      setViewingDocType(type);
      const endpoint = isAdmin
        ? `/api/admin/verification/user/${userId}/document?type=${type}`
        : `/api/support/verification/user/${userId}/document?type=${type}`;

      const res = await api.get(endpoint);
      if (res.data?.success && res.data.signedUrl) {
        window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert(res.data?.message || 'Document could not be retrieved.');
      }
    } catch (err) {
      console.error('Admin view document error:', err);
      alert(err.response?.data?.message || 'Failed to load document preview');
    } finally {
      setViewingDocType(null);
    }
  };

  const closeModal = () => {
    setActiveRequestModal(null);
    setRequestNote('');
    setSelectedFile(null);
    setFileError(null);
  };

  const renderBadge = (status) => {
    const norm = String(status || '').toUpperCase();
    if (norm === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
          {t('verification.statusVerified', 'Verified')}
        </span>
      );
    }
    if (norm === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Clock size={12} className="text-amber-600 dark:text-amber-400" />
          {t('verification.statusPending', 'Pending Review')}
        </span>
      );
    }
    if (norm === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
          <XCircle size={12} className="text-red-600 dark:text-red-400" />
          {t('verification.statusRejected', 'Rejected')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        {t('verification.statusUnverified', 'Unverified')}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const activeModalConfig = checkList.find(c => c.key === activeRequestModal);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {t('verification.trustSectionTitle', 'Trust & Verification')}
              <Sparkles size={14} className="text-emerald-500" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('verification.trustSectionSubtitle', 'Verification of identity and credentials to ensure trusted interactions.')}
            </p>
          </div>
        </div>

        {/* Global profile status pill */}
        <div className="self-start sm:self-center">
          {isOverallVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck size={14} />
              {t('verification.profileVerified', 'Verified Profile')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <ShieldAlert size={14} />
              {t('verification.profileNotVerified', 'Unverified Profile')}
            </span>
          )}
        </div>
      </div>

      {/* Admin Overall Verified Profile Approval Panel */}
      {isAdmin && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600" />
              {t('verification.adminVerifiedProfileTitle', 'Authoritative Verified Profile Status')}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('verification.adminVerifiedProfileDesc', 'Explicit administrator decision. Email and phone verifications alone do not grant this status.')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOverallVerified ? (
              <button
                type="button"
                onClick={() => handleAdminUpdateVerification('profile', 'NOT_VERIFIED')}
                disabled={submittingType === 'profile'}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 transition disabled:opacity-50"
              >
                {submittingType === 'profile' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                <span>{t('verification.revokeVerifiedProfile', 'Revoke Verified Status')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAdminUpdateVerification('profile', 'VERIFIED')}
                disabled={submittingType === 'profile'}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 shadow-sm"
              >
                {submittingType === 'profile' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                <span>{t('verification.approveVerifiedProfile', 'Approve Verified Profile')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs ${
          feedback.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
        }`}>
          <AlertCircle size={14} className="shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Verification Checklist */}
      <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800/60">
        {checkList.map(({ key, title, descVerified, descPending, descUnverified, item, icon: Icon, canRequest, requiresUpload, uploadPrompt }) => {
          const status = item?.status || 'UNVERIFIED';
          const isVerified = status === 'VERIFIED';
          const isPending = status === 'PENDING';
          const description = isVerified ? descVerified : isPending && descPending ? descPending : descUnverified;

          return (
            <div key={key} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : isPending
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                      {title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                {renderBadge(status)}

                {/* Admin / Staff: View submitted document */}
                {isAdmin && requiresUpload && (
                  <button
                    type="button"
                    onClick={() => handleAdminViewDocument(key)}
                    disabled={viewingDocType === key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 dark:text-teal-300 dark:bg-teal-950 dark:hover:bg-teal-900 rounded-lg border border-teal-200 dark:border-teal-800 transition disabled:opacity-50"
                    title={`View submitted ${title}`}
                  >
                    {viewingDocType === key ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                    <span>{t('verification.viewDoc', 'View Doc')}</span>
                  </button>
                )}

                {/* Own Profile: Request verification button */}
                {isOwnProfile && canRequest && status !== 'VERIFIED' && status !== 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRequestModal(key);
                      setFileError(null);
                      setSelectedFile(null);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950 dark:hover:bg-emerald-900 rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
                  >
                    {requiresUpload ? uploadPrompt || t('verification.uploadDoc', 'Upload Document') : t('verification.requestVerification', 'Request Verification')}
                  </button>
                )}

                {/* Admin Mode: Live Status Selector */}
                {isAdmin && (
                  <select
                    value={status}
                    onChange={(e) => handleAdminUpdateVerification(key, e.target.value)}
                    disabled={submittingType === key}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="UNVERIFIED">UNVERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification Document Upload & Request Modal */}
      {activeRequestModal && activeModalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="text-emerald-600" size={18} />
                {activeModalConfig.modalTitle}
              </h4>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {activeModalConfig.modalDesc}
            </p>

            {/* Document Upload Control */}
            {activeModalConfig.requiresUpload && (
              <div className="mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <UploadCloud className="mx-auto text-slate-400 dark:text-slate-500 mb-2" size={32} />
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {activeModalConfig.uploadPrompt}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {t('verification.acceptedFormats', 'Accepted: JPG, PNG, WebP, or PDF (Max 10 MB)')}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="text-emerald-600 shrink-0" size={20} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition shrink-0"
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                {fileError && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {fileError}
                  </p>
                )}

                {/* Privacy and Security Notice */}
                <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2">
                  <Lock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                    {t('verification.privacyNotice', 'Your document is private, encrypted, and will only be reviewed by HomelyServ verification staff. It is never displayed publicly or shared with other users.')}
                  </p>
                </div>
              </div>
            )}

            {/* Notes / Details field */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('verification.optionalNotes', 'Notes / Context (Optional)')}
              </label>
              <textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder={
                  activeRequestModal === 'identity'
                    ? 'e.g., National ID issued in Cairo, Egypt...'
                    : activeRequestModal === 'experience'
                    ? 'e.g., Worked as senior electrician at Nile Engineering 2020-2024...'
                    : 'e.g., Certified Caregiver license issued in 2023...'
                }
                rows={2}
                className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={submittingType === activeRequestModal || (activeModalConfig.requiresUpload && !selectedFile)}
                onClick={() => handleSendVerificationRequest(activeRequestModal)}
                className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {submittingType === activeRequestModal ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{t('common.submitting', 'Submitting...')}</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>{t('verification.submitRequest', 'Submit Request')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustVerificationSection;
