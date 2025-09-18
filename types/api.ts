// API interfaces for Chrome Translation Extension components

import { 
  Language, 
  Settings, 
  TranslationResult, 
  TranslationProgress, 
  BatchTranslationProgress,
  ShortcutSettings 
} from './interfaces';

/**
 * Popup component API interface
 */
export interface PopupAPI {
  translateText(text: string, targetLang: string): Promise<string>;
  detectLanguage(text: string): Promise<string>;
  getDefaultTargetLanguage(): Promise<string>;
  showLoadingState(): void;
  hideLoadingState(): void;
  updateTranslationProgress(progress: number): void;
}

/**
 * Content Script component API interface
 */
export interface ContentScriptAPI {
  getSelectedText(): string;
  showTranslationTooltip(text: string, position: {x: number, y: number}): void;
  translateFullPage(): Promise<void>;
  restoreOriginalPage(): void;
  highlightTranslatedElements(): void;
  showFullPageProgress(progress: TranslationProgress): void;
  streamTranslationUpdate(elementId: string, translatedText: string): void;
}

/**
 * Background Script component API interface
 */
export interface BackgroundAPI {
  translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>;
  translateBatch(
    texts: string[], 
    sourceLang: string, 
    targetLang: string, 
    onProgress?: (progress: BatchTranslationProgress) => void
  ): Promise<TranslationResult[]>;
  detectLanguage(text: string): Promise<string>;
  getSupportedLanguages(): Promise<Language[]>;
  saveSettings(settings: Settings): Promise<void>;
  getSettings(): Promise<Settings>;
}

/**
 * Options page component API interface
 */
export interface OptionsAPI {
  getAvailableLanguages(): Promise<Language[]>;
  saveDefaultLanguage(langCode: string): Promise<void>;
  getDefaultLanguage(): Promise<string>;
  saveShortcutSettings(shortcuts: ShortcutSettings): Promise<void>;
}

/**
 * Message types for inter-component communication
 */
export enum MessageType {
  TRANSLATE_TEXT = 'translate_text',
  TRANSLATE_BATCH = 'translate_batch',
  DETECT_LANGUAGE = 'detect_language',
  GET_SETTINGS = 'get_settings',
  SAVE_SETTINGS = 'save_settings',
  GET_SUPPORTED_LANGUAGES = 'get_supported_languages',
  TRANSLATE_SELECTED = 'translate_selected',
  TRANSLATE_FULL_PAGE = 'translate_full_page',
  RESTORE_ORIGINAL = 'restore_original',
  UPDATE_PROGRESS = 'update_progress',
  MODEL_DOWNLOAD_PROGRESS = 'model_download_progress'
}

/**
 * Message structure for inter-component communication
 */
export interface Message {
  type: MessageType;
  data?: any;
  requestId?: string;
}

/**
 * Message response structure
 */
export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}