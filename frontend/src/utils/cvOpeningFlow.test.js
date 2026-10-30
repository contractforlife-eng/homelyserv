import test from 'node:test';
import assert from 'node:assert/strict';

test('1. Content-Disposition parsing extracts Arabic and standard filenames correctly', () => {
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

  const arabicDisposition = "attachment; filename=\"____.pdf\"; filename*=UTF-8''%D8%B3%D9%8A%D8%B1%D8%A9_%D8%B0%D8%A7%D8%AA%D9%8A%D8%A9.pdf";
  assert.equal(parseDisposition(arabicDisposition, 'default.pdf'), 'سيرة_ذاتية.pdf');

  const englishDisposition = 'attachment; filename="John_Doe_CV.pdf"';
  assert.equal(parseDisposition(englishDisposition, 'default.pdf'), 'John_Doe_CV.pdf');

  const emptyDisposition = '';
  assert.equal(parseDisposition(emptyDisposition, 'Worker_CV.pdf'), 'Worker_CV.pdf');
});

test('2. Error handling maps HTTP status codes and NO_VIEWER error code to localized keys', () => {
  const getErrorMessage = (err, t) => {
    let message = t('jobApplicants.cvDownloadError');
    const status = err.response?.status;
    if (status === 401) {
      message = t('jobApplicants.cvAuthExpired');
    } else if (status === 403) {
      message = t('jobApplicants.cvAccessDenied');
    } else if (status === 404) {
      message = t('jobApplicants.cvFileNotFound');
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
  assert.equal(getErrorMessage({ code: 'NO_VIEWER' }, fakeT), 'jobApplicants.cvNoViewer');
  assert.equal(getErrorMessage({ response: { status: 500, data: { message: 'Cloudinary error' } } }, fakeT), 'Cloudinary error');
  assert.equal(getErrorMessage(new Error('Network error'), fakeT), 'jobApplicants.cvDownloadError');
});
