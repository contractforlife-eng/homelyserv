// frontend/src/components/PageMetadata.jsx
// Lightweight, dependency-free metadata manager for public pages.
// Handles title, meta description, canonical URL, and robots directives.
// Safety: automatically cleans up stale tags on unmount and avoids duplicates.

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl } from '../utils/canonicalUrl';

/**
 * Builds the canonical URL for a given path.
 * All public routes use https://www.homelyserv.com/ as the canonical domain.
 */
/**
 * Standard homepage metadata. Used as fallback when page-specific data is unavailable.
 */
const homepageMeta = {
  title: 'HomelyServ - Home Services & Work Opportunities',
  description: 'Connect with trusted home service professionals or discover flexible work opportunities with HomelyServ.',
  noindex: false,
};

/**
 * Generic page metadata builder for public pages without dynamic content.
 * Accepts title and description; generates canonical URL automatically.
 */
function PageMetadata({
  title,
  description,
  noindex = false,
  canonicalOverride,
  ogImage,
  ogImageWidth = '1200',
  ogImageHeight = '630',
  twitterCard = 'summary_large_image',
}) {
  const location = useLocation();
  const ownerId = useRef(`page-metadata-${Math.random().toString(36).slice(2)}`);
  const canonical = getCanonicalUrl(canonicalOverride ?? location.pathname);

  useEffect(() => {
    const cleanups = [];
    const setMeta = (nameOrProperty, content, attr = 'name') => {
      const existing = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
      if (existing) {
        const previous = existing.getAttribute('content');
        existing.setAttribute('content', content);
        cleanups.push(() => {
          if (existing.getAttribute('content') === content) existing.setAttribute('content', previous ?? '');
        });
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute(attr, nameOrProperty);
        meta.setAttribute('content', content);
        meta.setAttribute('data-page-metadata-owner', ownerId.current);
        document.head.appendChild(meta);
        cleanups.push(() => { if (meta.getAttribute('data-page-metadata-owner') === ownerId.current) meta.remove(); });
      }
    };

    // --- Title ---
    const previousTitle = document.title;
    document.title = title;
    cleanups.push(() => { if (document.title === title) document.title = previousTitle; });

    // --- Meta description ---
    setMeta('description', description);

    // --- Canonical URL ---
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      const previous = canonicalEl.getAttribute('href');
      canonicalEl.setAttribute('href', canonical);
      cleanups.push(() => { if (canonicalEl.getAttribute('href') === canonical) canonicalEl.setAttribute('href', previous ?? ''); });
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonical);
      link.setAttribute('data-page-metadata-owner', ownerId.current);
      document.head.appendChild(link);
      cleanups.push(() => { if (link.getAttribute('data-page-metadata-owner') === ownerId.current) link.remove(); });
    }

    // --- Robots directive ---
    const robots = noindex ? 'noindex, nofollow' : 'index, follow';
    setMeta('robots', robots, 'name');

    // --- Open Graph (persist existing og:title / og:description if dynamic) ---
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', canonical, 'property');

    if (ogImage) {
      setMeta('og:image', ogImage, 'property');
      setMeta('og:image:width', String(ogImageWidth), 'property');
      setMeta('og:image:height', String(ogImageHeight), 'property');
    }

    setMeta('twitter:card', twitterCard, 'name');
    setMeta('twitter:title', title, 'name');
    setMeta('twitter:description', description, 'name');
    if (ogImage) {
      setMeta('twitter:image', ogImage, 'name');
    }

    return () => cleanups.reverse().forEach((cleanup) => cleanup());
  }, [title, description, canonical, noindex, ogImage, ogImageWidth, ogImageHeight, twitterCard]);

  return null; // This is a head-only component
}

export default PageMetadata;
export { homepageMeta, getCanonicalUrl };
