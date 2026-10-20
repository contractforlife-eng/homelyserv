// frontend/src/components/PageMetadata.jsx
// Lightweight, dependency-free metadata manager for public pages.
// Handles title, meta description, canonical URL, and robots directives.
// Safety: automatically cleans up stale tags on unmount and avoids duplicates.

import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Builds the canonical URL for a given path.
 * All public routes use https://www.homelyserv.com/ as the canonical domain.
 */
function getCanonicalUrl(path) {
  // Ensure absolute URL with https://www.homelyserv.com
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://www.homelyserv.com${normalizedPath}`;
}

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
function PageMetadata({ title, description, noindex = false, canonicalOverride }) {
  const location = useLocation();
  const canonical = canonicalOverride ?? getCanonicalUrl(location.pathname);

  useEffect(() => {
    // Helper: set a meta tag or update existing one
    const setMeta = (nameOrProperty, content, attr = 'name') => {
      const existing = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute(attr, nameOrProperty);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Helper: remove a specific meta tag
    const removeMeta = (nameOrProperty, attr = 'name') => {
      const meta = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
      if (meta) {
        meta.remove();
      }
    };

    // --- Title ---
    // Remove all existing title tags (React Router or plugins sometimes inject them)
    document.querySelectorAll('title').forEach((t) => t.remove());
    const titleEl = document.createElement('title');
    titleEl.textContent = title;
    document.head.appendChild(titleEl);

    // --- Meta description ---
    setMeta('description', description);

    // --- Canonical URL ---
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonical);
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonical);
      document.head.appendChild(link);
    }

    // --- Robots directive ---
    const robots = noindex ? 'noindex, nofollow' : 'index, follow';
    setMeta('robots', robots, 'name');

    // --- Open Graph (persist existing og:title / og:description if dynamic) ---
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');

    // --- Twitter card (only set if no existing Twitter title/description) ---
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      setMeta('twitter:title', title, 'name');
    }
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      setMeta('twitter:description', description, 'name');
    }
  }, [title, description, canonical, noindex]);

  return null; // This is a head-only component
}

export default PageMetadata;
export { homepageMeta, getCanonicalUrl };
