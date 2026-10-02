// frontend/src/components/teacher/HomelyStudentBadge.jsx
// ============================================================
// HOMELY STUDENT BADGE
//
// Displayed next to a student's name if and ONLY if they are linked
// to a real HomelyServ user account (isHomelyStudent === true).
//
// IMPORTANT DISTINCTIONS:
// - This badge means ONLY: "This student is a real HomelyServ user account".
// - It does NOT mean Verified, Premium, Identity Verified, or Teacher Verified.
// - External students (unlinked / account-less) have NO badge.
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

const HomelyStudentBadge = ({ className = '', size = 'md' }) => {
  const { t } = useTranslation();

  const label = t('teacherStudents.homelyStudentBadge') || 'Homely Student';

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5 gap-1'
      : 'text-xs px-2.5 py-0.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50 shrink-0 ${sizeClasses} ${className}`}
      title={label}
    >
      <Sparkles className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      <span>{label}</span>
    </span>
  );
};

export default HomelyStudentBadge;
