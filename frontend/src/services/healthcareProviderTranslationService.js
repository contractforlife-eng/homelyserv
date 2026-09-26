// src/services/healthcareProviderTranslationService.js
// Scalable translation cache service for Healthcare Provider names.
// Supports en, ar, fr, ru, tr, de.
// Strategy:
// 1. Explicit DB Arabic name precedence (when language === 'ar').
// 2. Verified taxonomy translations precedence (PROVIDER_NAME_TRANSLATIONS).
// 3. Persistent localStorage translation cache (LRU-bounded).
// 4. Clean translation provider interface ready for background translation.
// 5. Zero-blocking fallback to original canonical providerName.

import { PROVIDER_NAME_TRANSLATIONS } from '../i18n/healthcareTaxonomyTranslations.js';
import { translateHealthcareProviderName } from './healthcareService.js';

const CACHE_STORAGE_KEY = 'homelyserv_healthcare_provider_translations_v1';
const MAX_CACHE_ENTRIES = 1000;

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];

/**
 * Normalizes language code to standard 2-letter format.
 */
export const normalizeLanguage = (lang) => {
  if (!lang || typeof lang !== 'string') return 'en';
  const prefix = lang.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(prefix) ? prefix : 'en';
};

/**
 * Normalizes provider name for cache lookup:
 * - Trims leading/trailing whitespace
 * - Collapses repeated whitespace
 * - Case-insensitive
 * - Normalizes harmless punctuation differences (smart quotes, multiple periods, dashes)
 *
 * Does NOT alter the actual providerName for display or storage.
 */
export const normalizeProviderNameKey = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ');
};

/**
 * Build a structured cache key: <language>::<normalizedProviderName>
 */
export const buildCacheKey = (lang, name) => {
  const normLang = normalizeLanguage(lang);
  const normName = normalizeProviderNameKey(name);
  return `${normLang}::${normName}`;
};

/**
 * In-memory cache mirror for synchronous instant lookups.
 * Backed by localStorage with safe error handling and size bounds.
 */
class HealthcareProviderTranslationCache {
  constructor() {
    this.memoryCache = new Map();
    this.inFlightRequests = new Map(); // Deduplication for async requests
    this.translationProvider = null; // Clean pluggable provider interface
    this.loadFromStorage();
  }

  /**
   * Safely load cache from localStorage on startup.
   */
  loadFromStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([key, val]) => {
          if (typeof val === 'string' && val.trim()) {
            this.memoryCache.set(key, val.trim());
          }
        });
      }
    } catch (err) {
      console.warn('Failed to load healthcare provider translation cache from localStorage:', err);
    }
  }

  /**
   * Safely save cache to localStorage with size pruning if exceeded.
   */
  persistToStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      // Bound cache size using simple FIFO/LRU truncation if necessary
      if (this.memoryCache.size > MAX_CACHE_ENTRIES) {
        const excess = this.memoryCache.size - MAX_CACHE_ENTRIES;
        const keys = Array.from(this.memoryCache.keys());
        for (let i = 0; i < excess; i++) {
          this.memoryCache.delete(keys[i]);
        }
      }

      const obj = Object.fromEntries(this.memoryCache);
      window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch (err) {
      console.warn('Failed to save healthcare provider translation cache to localStorage:', err);
    }
  }

  /**
   * Register a background translation provider.
   * Signature: (rawProviderName, targetLanguage) => Promise<string | null>
   */
  setTranslationProvider(providerFn) {
    if (typeof providerFn === 'function') {
      this.translationProvider = providerFn;
    }
  }

  /**
   * Synchronous cache retrieval.
   */
  getCached(lang, rawName) {
    const key = buildCacheKey(lang, rawName);
    return this.memoryCache.get(key) || null;
  }

  /**
   * Store translation in memory and schedule persistence.
   */
  setCached(lang, rawName, translatedText) {
    if (!translatedText || typeof translatedText !== 'string' || !translatedText.trim()) return;
    const key = buildCacheKey(lang, rawName);
    this.memoryCache.set(key, translatedText.trim());
    this.persistToStorage();
  }

  /**
   * Resolve translation synchronously with verified fallbacks.
   *
   * Flow:
   * 1. If language is 'en', return original immediately.
   * 2. If language is 'ar' and explicit Arabic name is provided, return explicit name immediately.
   * 3. Check verified translations in taxonomy (highest precedence over automated translations).
   * 4. Check dynamic translation cache (memory & localStorage).
   * 5. If unmapped:
   *    - Return original name immediately (NEVER blocks UI).
   *    - If translation provider is configured and not already requested, trigger non-blocking background translation.
   */
  resolveProviderName(rawProviderName, lang = 'en', explicitArabicName = '', onUpdateCallback = null) {
    if (!rawProviderName || typeof rawProviderName !== 'string') return '';
    const trimmed = rawProviderName.trim();
    const normalizedLang = normalizeLanguage(lang);

    // 1. English always returns the canonical original name
    if (normalizedLang === 'en') {
      return trimmed;
    }

    // 2. Explicit database Arabic name takes precedence for Arabic
    if (normalizedLang === 'ar' && explicitArabicName && typeof explicitArabicName === 'string' && explicitArabicName.trim()) {
      return explicitArabicName.trim();
    }

    // 3. Check verified translations dictionary
    const verifiedTranslation = this.getVerifiedTranslation(trimmed, normalizedLang);
    if (verifiedTranslation) {
      return verifiedTranslation;
    }

    // 4. Check dynamic translation cache
    const cached = this.getCached(normalizedLang, trimmed);
    if (cached) {
      return cached;
    }

    // 5. Trigger non-blocking background translation if a provider is configured
    if (this.translationProvider) {
      this.queueBackgroundTranslation(trimmed, normalizedLang, onUpdateCallback);
    }

    // 6. Return original providerName immediately (zero UI latency)
    return trimmed;
  }

  /**
   * Checks the static verified PROVIDER_NAME_TRANSLATIONS dictionary.
   */
  getVerifiedTranslation(trimmedName, lang) {
    // Exact match
    const directEntry = PROVIDER_NAME_TRANSLATIONS[trimmedName];
    if (directEntry && directEntry[lang]) {
      return directEntry[lang];
    }

    // Normalized match
    const normKey = normalizeProviderNameKey(trimmedName);
    const foundKey = Object.keys(PROVIDER_NAME_TRANSLATIONS).find(
      k => normalizeProviderNameKey(k) === normKey
    );
    if (foundKey && PROVIDER_NAME_TRANSLATIONS[foundKey]?.[lang]) {
      return PROVIDER_NAME_TRANSLATIONS[foundKey][lang];
    }

    return null;
  }

  /**
   * Queues an asynchronous background translation request.
   * Deduplicates simultaneous requests for the same name and language.
   */
  queueBackgroundTranslation(trimmedName, lang, onUpdateCallback) {
    const key = buildCacheKey(lang, trimmedName);
    if (this.inFlightRequests.has(key)) {
      return;
    }

    const promise = (async () => {
      try {
        const translated = await this.translationProvider(trimmedName, lang);
        if (translated && typeof translated === 'string' && translated.trim()) {
          this.setCached(lang, trimmedName, translated);
          if (typeof onUpdateCallback === 'function') {
            onUpdateCallback(translated.trim());
          }
        }
      } catch (err) {
        console.warn(`Background translation failed for "${trimmedName}" (${lang}):`, err);
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
  }
}

// Singleton translation service instance
export const healthcareProviderTranslationService = new HealthcareProviderTranslationCache();

// Register the backend-bridged LibreTranslate provider as default
healthcareProviderTranslationService.setTranslationProvider(async (rawName, targetLang) => {
  return await translateHealthcareProviderName(rawName, targetLang, 'en');
});

/**
 * Public helper function for component consumption.
 * Respects explicit DB Arabic name, verified taxonomy, cache, and safe fallback.
 */
export const getCachedProviderName = (rawProviderName, lang = 'en', explicitArabicName = '', onUpdate = null) => {
  return healthcareProviderTranslationService.resolveProviderName(
    rawProviderName,
    lang,
    explicitArabicName,
    onUpdate
  );
};
