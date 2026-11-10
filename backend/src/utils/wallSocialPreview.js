const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[char]));

export const SUPPORTED_LANGUAGES = ['ar', 'en', 'fr', 'de', 'ru', 'tr'];
export const DEFAULT_LANGUAGE = 'ar';

export const WALL_SOCIAL_TEXTS = {
  ar: {
    dir: 'rtl',
    siteName: 'HomelyServ',
    defaultTitle: 'منشور على حائط HomelyServ',
    defaultDesc: 'قصص، تجارب وتقدير في مجتمع HomelyServ.',
    unavailableTitle: 'المنشور غير متوفر | HomelyServ',
    unavailableDesc: 'هذا المنشور لم يعد متاحاً أو تم حذفه.',
  },
  en: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    defaultTitle: 'Post on HomelyServ Wall',
    defaultDesc: 'Stories, experiences and appreciation on HomelyServ.',
    unavailableTitle: 'Post Unavailable | HomelyServ',
    unavailableDesc: 'This post is no longer available or has been deleted.',
  },
  fr: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    defaultTitle: 'Publication sur le Mur HomelyServ',
    defaultDesc: 'Histoires, expériences et reconnaissance sur HomelyServ.',
    unavailableTitle: 'Publication non disponible | HomelyServ',
    unavailableDesc: 'Cette publication n’est plus disponible ou a été supprimée.',
  },
  de: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    defaultTitle: 'Beitrag an der HomelyServ-Pinnwand',
    defaultDesc: 'Geschichten, Erfahrungen und Wertschätzung auf HomelyServ.',
    unavailableTitle: 'Beitrag nicht verfügbar | HomelyServ',
    unavailableDesc: 'Dieser Beitrag ist nicht mehr verfügbar oder wurde gelöscht.',
  },
  ru: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    defaultTitle: 'Публикация на стене HomelyServ',
    defaultDesc: 'Истории, опыт и признательность в сообществе HomelyServ.',
    unavailableTitle: 'Публикация недоступна | HomelyServ',
    unavailableDesc: 'Эта публикация больше не доступна или была удалена.',
  },
  tr: {
    dir: 'ltr',
    siteName: 'HomelyServ',
    defaultTitle: 'HomelyServ Duvarı Gönderisi',
    defaultDesc: 'HomelyServ topluluğunda hikâyeler, deneyimler ve takdir.',
    unavailableTitle: 'Gönderi Mevcut Değil | HomelyServ',
    unavailableDesc: 'Bu gönderi artık mevcut değil veya silinmiş.',
  },
};

export const renderWallPreviewHtml = ({
  post = null,
  author = null,
  lang = 'ar',
  canonicalBase = 'https://www.homelyserv.com'
} = {}) => {
  const activeLang = SUPPORTED_LANGUAGES.includes(String(lang).toLowerCase())
    ? String(lang).toLowerCase()
    : DEFAULT_LANGUAGE;
  const copy = WALL_SOCIAL_TEXTS[activeLang] || WALL_SOCIAL_TEXTS.ar;

  // Enforce visibility: only active, top-level, non-hidden, non-deleted posts
  const isAvailable = Boolean(post && !post.postId && !post.deleted && !post.hidden);

  if (!isAvailable) {
    const title = copy.unavailableTitle;
    const description = copy.unavailableDesc;
    const canonicalUrl = `${canonicalBase}/wall?lang=${activeLang}`;
    const imageUrl = `${canonicalBase}/social-preview.png`;

    return `<!doctype html>
<html lang="${activeLang}" dir="${copy.dir}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(copy.siteName)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
</body>
</html>`;
  }

  const authorName = author?.displayName || author?.fullName || '';
  const postSnippet = post.text ? String(post.text).trim().slice(0, 200) : '';

  let title = copy.defaultTitle;
  if (authorName && postSnippet) {
    title = `${authorName}: "${postSnippet.slice(0, 60)}${postSnippet.length > 60 ? '…' : ''}" | HomelyServ`;
  } else if (authorName) {
    title = `${authorName} | HomelyServ`;
  } else if (postSnippet) {
    title = `"${postSnippet.slice(0, 60)}${postSnippet.length > 60 ? '…' : ''}" | HomelyServ`;
  }

  const description = postSnippet || copy.defaultDesc;
  const canonicalUrl = `${canonicalBase}/wall?post=${post._id}&lang=${activeLang}`;
  const imageUrl = post.image?.url || `${canonicalBase}/social-preview.png`;

  return `<!doctype html>
<html lang="${activeLang}" dir="${copy.dir}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escapeHtml(copy.siteName)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:card" content="${post.image?.url ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
</body>
</html>`;
};
