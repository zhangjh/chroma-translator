import { Language, TranslationResult, TranslationStatus, TranslationErrorType } from '../../types/interfaces.js';
import { ErrorHandler } from '../shared/error-handler.js';
import { CacheManager } from '../shared/cache-manager.js';

/**
 * Chrome Translation Service
 * Encapsulates Chrome's local AI translation API calls
 */
export class TranslationService {
  private static instance: TranslationService;
  private isApiAvailable: boolean | null = null;
  private supportedLanguages: Language[] | null = null;
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

    const detectWithRetry = async (): Promise<string> => {
      // Use Chrome's language detection API
      const detector = await chrome.ai.languageDetector.create();
      const results = await detector.detect(text);
      
      if (results && results.length > 0) {
        return results[0].detectedLanguage;
      }
      
      // Fallback to 'auto' if detection fails
      return 'auto';
    };

    try {
      return await detectWithRetry();
    } catch (error) {
      await this.errorHandler.handleError(error, 'language_detection');
      console.warn('Language detection failed, using fallback');
      return 'auto'; // Graceful fallback
    }
  }

  /**
   * Get list of supported languages
   * 获取支持语言列表
   */
  public async getSupportedLanguages(): Promise<Language[]> {
    if (this.supportedLanguages) {
      return this.supportedLanguages;
    }

    const isAvailable = await this.isTranslationApiAvailable();
    if (!isAvailable) {
      // Return mock data when API is not available
      return this.getMockSupportedLanguages();
    }

    try {
      const capabilities = await chrome.ai.translator.capabilities();
      const languagePairs = capabilities.languagePairs || [];
      
      // Extract unique languages from language pairs
      const languageSet = new Set<string>();
      languagePairs.forEach(pair => {
        languageSet.add(pair.sourceLanguage);
        languageSet.add(pair.targetLanguage);
      });

      this.supportedLanguages = Array.from(languageSet).map(code => ({
        code,
        name: this.getLanguageName(code),
        nativeName: this.getLanguageNativeName(code)
      }));

      return this.supportedLanguages;
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      return this.getMockSupportedLanguages();
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
      // Return mock translation when API is not available
      return this.getMockTranslation(text, sourceLang, targetLang);
    }

    const translateWithRetry = async (): Promise<TranslationResult> => {
      // Detect source language if not provided or is 'auto'
      let detectedSourceLang = sourceLang;
      if (!sourceLang || sourceLang === 'auto') {
        detectedSourceLang = await this.detectLanguage(text);
      }

      // Create translator instance
      const translator = await chrome.ai.translator.create({
        sourceLanguage: detectedSourceLang,
        targetLanguage: targetLang
      });

      // Perform translation
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
    };

    try {
      return await translateWithRetry();
    } catch (error) {
      await this.errorHandler.handleError(error, 'translation');
      throw error;
    }
  }



  /**
   * Get mock supported languages for fallback
   */
  private getMockSupportedLanguages(): Language[] {
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

  /**
   * Get mock translation for fallback
   */
  private getMockTranslation(text: string, sourceLang: string, targetLang: string): TranslationResult {
    return {
      translatedText: `[Mock Translation] ${text} (${sourceLang} -> ${targetLang})`,
      detectedLanguage: sourceLang === 'auto' ? 'en' : sourceLang,
      confidence: 0.8,
      status: TranslationStatus.COMPLETED
    };
  }

  /**
   * Get language name from language code
   */
  private getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ja': 'Japanese',
      'ko': 'Korean',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic'
    };
    return languageNames[code] || code;
  }

  /**
   * Get native language name from language code
   */
  private getLanguageNativeName(code: string): string {
    const nativeNames: Record<string, string> = {
      'en': 'English',
      'zh-CN': '中文(简体)',
      'zh-TW': '中文(繁體)',
      'ja': '日本語',
      'ko': '한국어',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ar': 'العربية'
    };
    return nativeNames[code] || code;
  }
}