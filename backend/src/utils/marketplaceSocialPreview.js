const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

export const renderMarketplacePreviewHtml = ({ listing, canonicalBase = 'https://www.homelyserv.com' }) => {
  const available = listing && listing.status === 'ACTIVE' && !listing.deletedAt;
  const title = available ? `${listing.title} | HomelyServ` : 'Listing unavailable | HomelyServ';
  const description = available ? String(listing.description || '').slice(0, 200) : 'This marketplace listing is no longer available.';
  const canonicalUrl = available ? `${canonicalBase}/marketplace/${listing._id}` : `${canonicalBase}/marketplace`;
  const image = available ? listing.image?.url : `${canonicalBase}/social-preview.png`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonicalUrl)}"><meta property="og:type" content="product"><meta property="og:site_name" content="HomelyServ"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:url" content="${escapeHtml(canonicalUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}"><meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}"></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></body></html>`;
};
