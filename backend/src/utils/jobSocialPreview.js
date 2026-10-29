// backend/src/utils/jobSocialPreview.js
// ============================================================
// Generates crawler-safe, Open Graph HTML responses for shared
// job posts across all 6 supported languages (ar, en, fr, de, ru, tr).
// Always outputs absolute URLs to https://www.homelyserv.com
// ============================================================

export const SUPPORTED_LANGUAGES = ['ar', 'en', 'fr', 'de', 'ru', 'tr'];
export const DEFAULT_LANGUAGE = 'ar';

export const SOCIAL_TEXTS = {
  ar: {
    dir: 'rtl',
    siteName: 'HomelyServ',
    tagline: 'منصة الخدمات المنزلية والتوظيف',
    freeApply: 'تقدّم إلى الوظيفة مجانًا الآن — بدون رسوم',
    shareTemplate: (title, employer) => `وظيفة شاغرة: ${title}${employer ? ` لدى ${employer}` : ''} — تقدّم إلى الوظيفة مجانًا الآن بدون أي رسوم عبر منصة HomelyServ.`,
    notFoundTitle: 'الوظيفة غير متوفرة | HomelyServ',
    notFoundDesc: 'هذه الوظيفة لم تعد متاحة أو تم إغلاقها. تصفح وظائف أخرى مجانًا على HomelyServ.',
    whatsappMessage: (title, employer, url) => `وظيفة شاغرة: ${title}${employer ? ` لدى ${employer}` : ''}\nتقدّم إلى الوظيفة مجانًا الآن — بدون رسوم\n${url}`,
  },
  en: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    tagline: 'Home Services & Job Marketplace',
    freeApply: 'Apply to this job for free now — No fees',
    shareTemplate: (title, employer) => `Job Opening: ${title}${employer ? ` at ${employer}` : ''} — Apply to this job for free now with no fees on HomelyServ.`,
    notFoundTitle: 'Job Unavailable | HomelyServ',
    notFoundDesc: 'This job post is no longer available or has closed. Explore more opportunities for free on HomelyServ.',
    whatsappMessage: (title, employer, url) => `Job Opening: ${title}${employer ? ` at ${employer}` : ''}\nApply to this job for free now — No fees\n${url}`,
  },
  fr: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    tagline: 'Services à domicile et opportunités d\'emploi',
    freeApply: 'Postulez à cette offre gratuitement dès maintenant — Sans frais',
    shareTemplate: (title, employer) => `Offre d'emploi : ${title}${employer ? ` chez ${employer}` : ''} — Postulez gratuitement dès maintenant sans frais sur HomelyServ.`,
    notFoundTitle: 'Offre non disponible | HomelyServ',
    notFoundDesc: 'Cette offre d\'emploi n\'est plus disponible ou est expirée. Découvrez d\'autres postes sans frais sur HomelyServ.',
    whatsappMessage: (title, employer, url) => `Offre d'emploi : ${title}${employer ? ` chez ${employer}` : ''}\nPostulez gratuitement dès maintenant — Sans frais\n${url}`,
  },
  de: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    tagline: 'Haushaltsdienste & Stellenangebote',
    freeApply: 'Jetzt kostenlos auf diesen Job bewerben — Keine Gebühren',
    shareTemplate: (title, employer) => `Stellenangebot: ${title}${employer ? ` bei ${employer}` : ''} — Jetzt kostenlos ohne Gebühren auf HomelyServ bewerben.`,
    notFoundTitle: 'Stelle nicht verfügbar | HomelyServ',
    notFoundDesc: 'Dieses Stellenangebot ist nicht mehr verfügbar oder wurde beendet. Finden Sie weitere Jobs kostenlos auf HomelyServ.',
    whatsappMessage: (title, employer, url) => `Stellenangebot: ${title}${employer ? ` bei ${employer}` : ''}\nJetzt kostenlos bewerben — Keine Gebühren\n${url}`,
  },
  ru: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    tagline: 'Бытовые услуги и возможности трудоустройства',
    freeApply: 'Откликнитесь на вакансию бесплатно прямо сейчас — Без комиссий',
    shareTemplate: (title, employer) => `Вакансия: ${title}${employer ? ` в ${employer}` : ''} — Откликнитесь бесплатно прямо сейчас без комиссий на платформе HomelyServ.`,
    notFoundTitle: 'Вакансия недоступна | HomelyServ',
    notFoundDesc: 'Данная вакансия больше не активна или закрыта. Найдите другие вакансии бесплатно на HomelyServ.',
    whatsappMessage: (title, employer, url) => `Вакансия: ${title}${employer ? ` в ${employer}` : ''}\nОткликнитесь бесплатно прямо сейчас — Без комиссий\n${url}`,
  },
  tr: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    tagline: 'Ev Hizmetleri ve İş Fırsatları',
    freeApply: 'Bu işe hemen ücretsiz başvurun — Hiçbir ücret yok',
    shareTemplate: (title, employer) => `İş İlanı: ${title}${employer ? ` - ${employer}` : ''} — HomelyServ üzerinden hiçbir ücret ödemeden hemen başvurun.`,
    notFoundTitle: 'İlan Mevcut Değil | HomelyServ',
    notFoundDesc: 'Bu iş ilanı artık aktif değil veya süresi dolmuş. HomelyServ üzerinde ücretsiz yeni fırsatları keşfedin.',
    whatsappMessage: (title, employer, url) => `İş İlanı: ${title}${employer ? ` - ${employer}` : ''}\nŞimdi ücretsiz başvurun — Hiçbir ücret yok\n${url}`,
  },
};

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const normalizeLang = (lang) => {
  if (typeof lang !== 'string') return DEFAULT_LANGUAGE;
  const clean = lang.trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(clean) ? clean : DEFAULT_LANGUAGE;
};

export const isSocialCrawler = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') return false;
  const ua = userAgent.toLowerCase();
  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('whatsapp') ||
    ua.includes('twitterbot') ||
    ua.includes('linkedinbot') ||
    ua.includes('telegrambot') ||
    ua.includes('pinterest') ||
    ua.includes('slackbot') ||
    ua.includes('discordbot') ||
    ua.includes('skypeuripreview') ||
    ua.includes('google-read-aloud') ||
    ua.includes('viber')
  );
};

export const renderJobPreviewHtml = ({ job, employer, lang = DEFAULT_LANGUAGE, canonicalBase = 'https://www.homelyserv.com' }) => {
  const activeLang = normalizeLang(lang);
  const localized = SOCIAL_TEXTS[activeLang];

  if (!job) {
    const title = localized.notFoundTitle;
    const desc = localized.notFoundDesc;
    const fallbackImage = `${canonicalBase}/social/job-share-${activeLang}.png`;
    const targetUrl = `${canonicalBase}/?lang=${activeLang}`;

    return `<!DOCTYPE html>
<html lang="${activeLang}" dir="${localized.dir}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(localized.siteName)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${fallbackImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${targetUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${fallbackImage}">
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
</head>
<body>
  <p>Redirecting to HomelyServ...</p>
</body>
</html>`;
  }

  const employerName = employer?.displayName || employer?.companyName || employer?.fullName || employer?.name || '';
  const jobTitle = job.jobTitle || 'Job Opening';
  const pageTitle = employerName ? `${jobTitle} - ${employerName} | HomelyServ` : `${jobTitle} | HomelyServ`;
  const description = localized.shareTemplate(jobTitle, employerName);
  const imageUrl = `${canonicalBase}/social/job-share-${activeLang}.png`;
  const jobUrl = `${canonicalBase}/job/${job.id}?lang=${activeLang}`;

  return `<!DOCTYPE html>
<html lang="${activeLang}" dir="${localized.dir}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(localized.siteName)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:url" content="${jobUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta http-equiv="refresh" content="0;url=${jobUrl}">
</head>
<body>
  <h1>${escapeHtml(pageTitle)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${jobUrl}">Click here to view this job opening and apply</a></p>
</body>
</html>`;
};
