import { Language, TranslationResult, TranslationStatus, TranslationErrorType } from '../../types/interfaces.js';
import { MessageType } from '../../types/api.js';
import { ErrorHandler } from '../shared/error-handler.js';
import { CacheManager } from '../shared/cache-manager.js';

/**
 * Chrome Translation Service
 * Encapsulates Chrome's local AI translation API calls
 */
export class TranslationService {
  private static instance: TranslationService;
  private isApiAvailable: boolean | null = null;
  private errorHandler: ErrorHandler;
  private cacheManager: CacheManager;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.cacheManager = CacheManager.getInstance();
  }

  /**
   * Get singleton instance of TranslationService
   */
  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Check if Chrome Translation API is available
   * 检查Chrome翻译API的可用性
   */
  public async isTranslationApiAvailable(): Promise<boolean> {
    if (this.isApiAvailable !== null) {
      return this.isApiAvailable;
    }

    const apiError = await this.errorHandler.checkApiAvailability();
    if (apiError) {
      this.isApiAvailable = false;
      console.error('Translation API not available:', apiError.message);
      return false;
    }

    this.isApiAvailable = true;
    return true;
  }

  /**
   * Detect the language of given text
   * 实现语言检测
   */
  public async detectLanguage(text: string): Promise<string> {
    // Validate text length
    const validationError = this.errorHandler.validateTextLength(text);
    if (validationError) {
      throw validationError;
    }

    const isAvailable = await this.isTranslationApiAvailable();
    if (!isAvailable) {
      throw this.errorHandler.createError(TranslationErrorType.API_UNAVAILABLE);
    }

    try {
      // Use Chrome's language detection API
      const detector = await LanguageDetector.create({
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e: any) => {
            const progress = Math.round(e.loaded * 100);
            console.log(`Downloaded ${progress}%`);
            this.notifyDownloadProgress('language_detector', progress);
          });
        },
      });
      const results = await detector.detect(text);

      if (results && results.length > 0) {
        return results[0].detectedLanguage;
      }

      // Fallback to 'auto' if detection fails
      return 'auto';
    } catch (error) {
      await this.errorHandler.handleError(error, 'language_detection');
      console.warn('Language detection failed, using fallback');
      return 'auto'; // Graceful fallback
    }
  }

  /**
   * Translate text from source language to target language
   * 翻译文本
   */
  public async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    // Validate text length
    const validationError = this.errorHandler.validateTextLength(text);
    if (validationError) {
      throw validationError;
    }

    // Check cache first
    const cachedResult = await this.cacheManager.get(text, sourceLang, targetLang);
    if (cachedResult) {
      console.log('Translation cache hit');
      return cachedResult;
    }

    const isAvailable = await this.isTranslationApiAvailable();
    if (!isAvailable) {
      throw this.errorHandler.createError(TranslationErrorType.API_UNAVAILABLE);
    }

    try {
      // Detect source language if not provided or is 'auto'
      let detectedSourceLang = sourceLang;
      if (!sourceLang || sourceLang === 'auto') {
        detectedSourceLang = await this.detectLanguage(text);
      }

      // Perform translation
      const translator = await Translator.create({
        sourceLanguage: detectedSourceLang,
        targetLanguage: targetLang,
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e: any) => {
            const progress = Math.round(e.loaded * 100);
            console.log(`Downloaded ${progress}%`);
            this.notifyDownloadProgress('translator', progress);
          });
        },
      });

      const translatedText = await translator.translate(text);

      const result: TranslationResult = {
        translatedText,
        detectedLanguage: detectedSourceLang,
        confidence: 0.9, // Chrome API doesn't provide confidence, use default
        status: TranslationStatus.COMPLETED
      };

      // Cache the result
      await this.cacheManager.set(text, sourceLang, targetLang, result);

      return result;
    } catch (error) {
      await this.errorHandler.handleError(error, 'translation');
      throw error;
    }
  }



  /**
   * Notify download progress to popup
   */
  private notifyDownloadProgress(modelType: string, progress: number): void {
    try {
      // Send progress update to all connected ports (popup)
      chrome.runtime.sendMessage({
        type: MessageType.MODEL_DOWNLOAD_PROGRESS,
        data: {
          modelType,
          progress,
          message: `正在下载${modelType === 'translator' ? '翻译' : '语言检测'}模型... ${progress}%`
        }
      }).catch(() => {
        // Ignore errors if no popup is listening
      });
    } catch (error) {
      // Ignore messaging errors
    }
  }

  /**
   * Get mock supported languages for fallback
   */
  public getSupportedLanguages(): Language[] {
    return [
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
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
    ];
  }
}