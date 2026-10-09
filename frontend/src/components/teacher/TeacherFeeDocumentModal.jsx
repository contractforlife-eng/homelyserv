import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  X,
  FileText,
  CheckCircle,
  Clock,
  User,
  Users,
  Calendar,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import { formatCurrencyAmount } from '../../utils/currencyPresentation';

const TeacherFeeDocumentModal = ({ document, onClose }) => {
  const { t, i18n } = useTranslation();
  const printRef = useRef(null);

  // Scoped body print state: add class when modal is open and cleanup on unmount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.document.body.classList.add('print-teacher-fee-document-active');
    return () => {
      window.document.body.classList.remove('print-teacher-fee-document-active');
    };
  }, []);

  if (!document) return null;

  const isRtl = i18n.language === 'ar';
  const isInvoice = document.documentType === 'INVOICE' || document.status === 'PENDING';

  const handlePrint = () => {
    window.print();
  };

  const docTitle = isInvoice
    ? (t('teacherAccounts.document.invoiceTitle') || 'Lesson Fee Invoice')
    : (t('teacherAccounts.document.receiptTitle') || 'Payment Receipt');

  const docSubtitle = isInvoice
    ? (t('teacherAccounts.document.invoiceSubtitle') || 'Statement of Due Lesson Fees')
    : (t('teacherAccounts.document.receiptSubtitle') || 'Proof of Payment Received');

  const statusLabel = isInvoice
    ? (t('teacherAccounts.document.statusUnpaid') || 'UNPAID / DUE')
    : (t('teacherAccounts.document.statusPaid') || 'PAID / RECEIVED');

  const formatDocDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      return Number.isNaN(d.getTime()) ? String(dateVal) : d.toISOString().split('T')[0];
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div
      className="teacher-fee-document-modal-portal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div
        ref={printRef}
        className="teacher-fee-printable-card bg-white dark:bg-gray-850 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-150 dark:border-gray-700/60 my-8 space-y-6 print:m-0 print:p-6 print:shadow-none print:border-none print:max-w-none print:w-full print:text-black"
      >
        {/* Modal Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-750 print:hidden">
          <div className="flex items-center gap-2.5 text-gray-900 dark:text-white">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isInvoice
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {docTitle}
              </h3>
              <p className="text-xs text-gray-500">
                {document.documentNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{t('teacherAccounts.document.printBtn') || 'Print / Save PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 print:space-y-4">
          {/* Header & HomelyServ Teacher Portal Branding */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-750 print:border-gray-300">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-red-600">
                  HomelyServ
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 print:border print:border-red-300">
                  Teacher Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 print:text-black">
                {docTitle}
              </h1>
              <p className="text-xs text-gray-500 print:text-gray-600">
                {docSubtitle}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider ${
                isInvoice
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 print:border print:border-amber-400'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 print:border print:border-emerald-400'
              }`}>
                {statusLabel}
              </span>
              <p className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                {document.documentNumber}
              </p>
              <p className="text-[11px] text-gray-400 print:text-gray-600">
                {t('teacherAccounts.document.issueDate') || 'Issue Date'}: {formatDocDate(document.issueDate)}
              </p>
            </div>
          </div>

          {/* Teacher & Participant Party Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Teacher Details */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700/60 print:border-gray-300 space-y-1.5">
              <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                {t('teacherAccounts.document.fromTeacher') || 'Teacher (Instructor)'}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
                {document.teacher?.fullName || 'Teacher'}
              </p>
              {document.teacher?.title && (
                <p className="text-gray-600 dark:text-gray-300 print:text-gray-700">
                  {document.teacher.title}
                </p>
              )}
              {document.teacher?.mainSubject && (
                <p className="text-gray-500 print:text-gray-600">
                  {t('teacherAccounts.document.subject') || 'Subject'}: {document.teacher.mainSubject}
                </p>
              )}
              {document.teacher?.email && (
                <p className="text-gray-500 print:text-gray-600 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span>{document.teacher.email}</span>
                </p>
              )}
              {document.teacher?.phone && (
                <p className="text-gray-500 print:text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>{document.teacher.phone}</span>
                </p>
              )}
            </div>

            {/* Student or Group Details */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-150 dark:border-gray-700/60 print:border-gray-300 space-y-1.5">
              <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                {document.group
                  ? (t('teacherAccounts.document.toGroup') || 'Billed To (Class / Group)')
                  : (t('teacherAccounts.document.toStudent') || 'Billed To (Student / Guardian)')}
              </p>
              {document.student ? (
                <>
                  <p className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
                    {document.student.fullName}
                  </p>
                  {document.student.gradeLevel && (
                    <p className="text-gray-600 dark:text-gray-300 print:text-gray-700">
                      {t('teacherAccounts.document.gradeLevel') || 'Grade'}: {document.student.gradeLevel}
                    </p>
                  )}
                  {document.student.school && (
                    <p className="text-gray-500 print:text-gray-600">
                      {document.student.school}
                    </p>
                  )}
                  {document.student.email && (
                    <p className="text-gray-500 print:text-gray-600 flex items-center gap-1.5 mt-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span>{document.student.email}</span>
                    </p>
                  )}
                </>
              ) : document.group ? (
                <>
                  <p className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
                    {document.group.name}
                  </p>
                  {document.group.subject && (
                    <p className="text-gray-600 dark:text-gray-300 print:text-gray-700">
                      {document.group.subject}
                    </p>
                  )}
                  {document.group.academicYear && (
                    <p className="text-gray-500 print:text-gray-600">
                      {document.group.academicYear}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 italic">
                  {t('teacherAccounts.document.unspecifiedRecipient') || 'Direct student / private lesson'}
                </p>
              )}
            </div>
          </div>

          {/* Line Item Table */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 print:border-gray-300 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-100 dark:bg-gray-800 print:bg-gray-100 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700 print:border-gray-300">
                <tr>
                  <th className="py-2.5 px-4">{t('teacherAccounts.document.colDescription') || 'Description'}</th>
                  <th className="py-2.5 px-4">{t('teacherAccounts.document.colDate') || 'Service Date'}</th>
                  <th className="py-2.5 px-4 text-right">{t('teacherAccounts.document.colAmount') || 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-750 print:divide-gray-200">
                <tr>
                  <td className="py-3.5 px-4 text-gray-900 dark:text-white print:text-black">
                    <p className="font-semibold">
                      {document.lesson?.subject
                        ? `${document.lesson.subject} Lesson`
                        : (document.source === 'LESSON_GROUP'
                            ? (t('teacherAccounts.income.sourceGroup') || 'Group Lesson')
                            : (t('teacherAccounts.income.sourceOneOnOne') || '1-on-1 Lesson'))}
                    </p>
                    {document.lesson && (
                      <p className="text-[11px] text-gray-500 print:text-gray-600 mt-0.5">
                        {document.lesson.startTime && document.lesson.endTime && (
                          <span>{document.lesson.startTime} - {document.lesson.endTime} &bull; </span>
                        )}
                        <span>{document.lesson.lessonType === 'GROUP' ? 'Group Session' : '1-on-1 Session'}</span>
                      </p>
                    )}
                    {document.notes && (
                      <p className="text-[11px] text-gray-400 print:text-gray-600 mt-1 italic">
                        "{document.notes}"
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 print:text-black whitespace-nowrap">
                    {formatDocDate(document.lesson?.date || document.incomeDate)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white print:text-black whitespace-nowrap">
                    {formatCurrencyAmount(document.amount, document.currency)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Summary Footer */}
            <div className="bg-gray-50 dark:bg-gray-800/40 print:bg-gray-50 p-4 border-t border-gray-200 dark:border-gray-700/60 print:border-gray-300 flex flex-col items-end space-y-1">
              <div className="flex items-center justify-between w-full sm:w-64 text-xs font-semibold text-gray-600 dark:text-gray-400 print:text-gray-700">
                <span>{t('teacherAccounts.document.totalDue') || 'Total Amount'}:</span>
                <span className="text-base font-black text-gray-900 dark:text-white print:text-black">
                  {formatCurrencyAmount(document.amount, document.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between w-full sm:w-64 text-[11px] text-gray-500 print:text-gray-600 pt-1 border-t border-gray-200 dark:border-gray-700/40 print:border-gray-300">
                <span>{t('teacherAccounts.document.status') || 'Status'}:</span>
                <span className="font-bold">
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Legal / Bookkeeping Notice */}
          <div className="pt-2 text-[10px] text-gray-400 dark:text-gray-500 print:text-gray-500 text-center space-y-0.5">
            <p>
              {isInvoice
                ? (t('teacherAccounts.document.invoiceNotice') || 'This is an internal instructor invoice issued for lesson services. Please settle with your teacher directly.')
                : (t('teacherAccounts.document.receiptNotice') || 'This receipt confirms that the specified lesson fees have been received in full by the instructor.')}
            </p>
            <p>
              HomelyServ Teacher Portal &bull; Multi-language verified document
            </p>
          </div>
        </div>

        {/* Modal Close Footer (Hidden when printing) */}
        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-750 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherFeeDocumentModal;
