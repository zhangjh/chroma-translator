// Core interfaces for Chrome Translation Extension

/**
 * Language model representing supported languages
 */
export interface Language {
  code: string;        // 'en', 'zh-CN', 'ja'
  name: string;        // 'English', '中文(简体)', '日本語'
  nativeName: string;  // 'English', '中文', '日本語'
}

/**
 * Settings model for extension configuration
 */
export interface Settings {
  defaultTargetLanguage: string;
  autoDetectLanguage: boolean;
  showTranslationTooltip: boolean;
  enableFullPageTranslation: boolean;
  enableStreamingTranslation: boolean;
  translationDelay: number; // 防抖延迟时间(ms)
  shortcuts: {
    translateSelected: string;
    translateFullPage: string;
  };
}

/**
 * Translation result with status and metadata
 */
export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
  status: TranslationStatus;
}

/**
 * Translation status enumeration
 */
export enum TranslationStatus {
  PENDING = 'pending',
  TRANSLATING = 'translating',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Progress tracking for single translation operations
 */
export interface TranslationProgress {
  totalElements: number;
  translatedElements: number;
  currentElement: string;
  percentage: number;
}

/**
 * Progress tracking for batch translation operations
 */
export interface BatchTranslationProgress {
  total: number;
  completed: number;
  current: string;
  percentage: number;
  results: TranslationResult[];
}

/**
 * Translation history record
 */
export interface TranslationHistory {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  url?: string;
}

/**
 * Error types for translation operations
 */
export enum TranslationErrorType {
  API_UNAVAILABLE = 'api_unavailable',
  NETWORK_ERROR = 'network_error',
  INVALID_LANGUAGE = 'invalid_language',
  TEXT_TOO_LONG = 'text_too_long',
  QUOTA_EXCEEDED = 'quota_exceeded'
}

/**
 * Translation error with retry information
 */
export interface TranslationError {
  type: TranslationErrorType;
  message: string;
  retryable: boolean;
}

/**
 * Shortcut settings for keyboard shortcuts
 */
export interface ShortcutSettings {
  translateSelected: string;
  translateFullPage: string;
}