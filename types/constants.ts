// Constants and default values for Chrome Translation Extension

import { Settings, Language } from './interfaces';

/**
 * Default settings configuration
 */
export const DEFAULT_SETTINGS: Settings = {
  defaultTargetLanguage: 'en',
  autoDetectLanguage: true,
  showTranslationTooltip: true,
  enableFullPageTranslation: true,
  enableStreamingTranslation: true,
  translationDelay: 500, // 500ms debounce delay
  shortcuts: {
    translateSelected: 'Ctrl+Shift+T',
    translateFullPage: 'Ctrl+Shift+F'
  }
};

/**
 * Common supported languages
 */
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文(简体)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文(繁體)' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' }
];

/**
 * Configuration constants
 */
export const CONFIG = {
  MAX_TEXT_LENGTH: 5000, // Maximum characters per translation request
  MAX_BATCH_SIZE: 10,    // Maximum number of texts in batch translation
  RETRY_ATTEMPTS: 3,     // Number of retry attempts for failed requests
  RETRY_DELAY: 1000,     // Base delay between retries (ms)
  CACHE_EXPIRY: 3600000, // Cache expiry time (1 hour in ms)
  MAX_HISTORY_ITEMS: 100, // Maximum translation history items
  DEBOUNCE_DELAY: 500,   // Default debounce delay for input (ms)
  TOOLTIP_DELAY: 200,    // Delay before showing translation tooltip (ms)
  PROGRESS_UPDATE_INTERVAL: 100 // Progress update interval (ms)
};

/**
 * Storage keys for Chrome Storage API
 */
export const STORAGE_KEYS = {
  SETTINGS: 'translation_settings',
  HISTORY: 'translation_history',
  CACHE: 'translation_cache',
  LANGUAGE_CACHE: 'supported_languages_cache'
};

/**
 * CSS class names for styling
 */
export const CSS_CLASSES = {
  TRANSLATION_TOOLTIP: 'chrome-translation-tooltip',
  TRANSLATION_PROGRESS: 'chrome-translation-progress',
  TRANSLATED_ELEMENT: 'chrome-translated-element',
  TRANSLATING_ELEMENT: 'chrome-translating-element',
  LOADING_STATE: 'chrome-translation-loading',
  ERROR_STATE: 'chrome-translation-error'
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  API_UNAVAILABLE: 'Chrome Translation API is not available. Please check your Chrome version and network connection.',
  NETWORK_ERROR: 'Network error occurred. Please check your internet connection and try again.',
  INVALID_LANGUAGE: 'The selected language is not supported.',
  TEXT_TOO_LONG: 'Text is too long. Please try with shorter text.',
  QUOTA_EXCEEDED: 'Translation quota exceeded. Please try again later.',
  NO_TEXT_SELECTED: 'Please select some text to translate.',
  TRANSLATION_FAILED: 'Translation failed. Please try again.'
};