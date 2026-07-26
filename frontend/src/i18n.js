// frontend/src/i18n.js
// Re-export everything from the consolidated i18n config (i18n/index.js).
// This file exists for backward compatibility so that imports like
// `import { SUPPORTED_LANGUAGES } from '../i18n'` resolve correctly
// regardless of whether the caller expects i18n.js or i18n/index.js.
export {
  default,
  SUPPORTED_LANGUAGES,
  LANGUAGE_CODES,
  LANGUAGE_STORAGE_KEY,
  applyDocumentDirection,
  changeLanguageGlobal
} from './i18n/index.js';