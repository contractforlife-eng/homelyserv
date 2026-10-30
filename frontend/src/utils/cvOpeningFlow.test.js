import test from 'node:test';
import assert from 'node:assert/strict';

test('1. Content-Disposition parsing extracts Arabic, Word, and Image filenames correctly', () => {
  const parseDisposition = (disposition, fallbackName) => {
    let filename = fallbackName || 'Applicant_CV.pdf';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const standardMatch = disposition.match(/filename="?([^";]+)"?/i);

    if (utf8Match && utf8Match[1]) {
      try { filename = decodeURIComponent(utf8Match[1]); } catch {}
    } else if (standardMatch && standardMatch[1]) {
      filename = standardMatch[1].trim();
    }
    return filename;
  };

  const arabicPdf = "attachment; filename=\"____.pdf\"; filename*=UTF-8''%D8%B3%D9%8A%D8%B1%D8%A9_%D8%B0%D8%A7%D8%AA%D9%8A%D8%A9.pdf";
  assert.equal(parseDisposition(arabicPdf, 'default.pdf'), 'سيرة_ذاتية.pdf');

  const arabicDocx = "attachment; filename=\"____.docx\"; filename*=UTF-8''%D8%B3%D9%8A%D8%B1%D8%A9_%D9%85%D9%87%D9%86%D9%8A%D8%A9.docx";
  assert.equal(parseDisposition(arabicDocx, 'default.docx'), 'سيرة_مهنية.docx');

  const englishDoc = 'attachment; filename="Candidate_Resume.doc"';
  assert.equal(parseDisposition(englishDoc, 'default.doc'), 'Candidate_Resume.doc');

  const pngImage = 'attachment; filename="CV_Scan.png"';
  assert.equal(parseDisposition(pngImage, 'default.png'), 'CV_Scan.png');
});

test('2. Error handling maps HTTP status codes, CANCELLED, and NO_VIEWER error code to localized keys', () => {
  const getErrorMessage = (err, t) => {
    let message = t('jobApplicants.cvDownloadError');
    const status = err.response?.status;
    if (status === 401) {
      message = t('jobApplicants.cvAuthExpired');
    } else if (status === 403) {
      message = t('jobApplicants.cvAccessDenied');
    } else if (status === 404) {
      message = t('jobApplicants.cvFileNotFound');
    } else if (err.code === 'CANCELLED' || err.message?.includes('CANCELLED')) {
      message = t('jobApplicants.cvSaveCancelled');
    } else if (err.code === 'NO_VIEWER' || err.message?.includes('NO_VIEWER')) {
      message = t('jobApplicants.cvNoViewer');
    } else if (err.response?.data?.message) {
      message = err.response.data.message;
    }
    return message;
  };

  const fakeT = (k) => k;

  assert.equal(getErrorMessage({ response: { status: 401 } }, fakeT), 'jobApplicants.cvAuthExpired');
  assert.equal(getErrorMessage({ response: { status: 403 } }, fakeT), 'jobApplicants.cvAccessDenied');
  assert.equal(getErrorMessage({ response: { status: 404 } }, fakeT), 'jobApplicants.cvFileNotFound');
  assert.equal(getErrorMessage({ code: 'CANCELLED' }, fakeT), 'jobApplicants.cvSaveCancelled');
  assert.equal(getErrorMessage({ code: 'NO_VIEWER' }, fakeT), 'jobApplicants.cvNoViewer');
  assert.equal(getErrorMessage({ response: { status: 500, data: { message: 'Storage error' } } }, fakeT), 'Storage error');
  assert.equal(getErrorMessage(new Error('Network error'), fakeT), 'jobApplicants.cvDownloadError');
});

test('3. MIME type resolver handles PDF, Word (DOC/DOCX), and Images (PNG/JPG/JPEG)', () => {
  const resolveMimeType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'webp': return 'image/webp';
      default: return 'application/octet-stream';
    }
  };

  assert.equal(resolveMimeType('resume.pdf'), 'application/pdf');
  assert.equal(resolveMimeType('cv.doc'), 'application/msword');
  assert.equal(resolveMimeType('profile.docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.equal(resolveMimeType('photo.jpg'), 'image/jpeg');
  assert.equal(resolveMimeType('scan.png'), 'image/png');
  assert.equal(resolveMimeType('document.webp'), 'image/webp');
});
