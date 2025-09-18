// Additional Chrome extension type definitions
// Chrome AI API types for translation

declare global {
  // Global LanguageDetector API (Chrome experimental feature)
  interface LanguageDetectorCreateOptions {
    monitor?: (monitor: any) => void;
  }

  interface LanguageDetectorResult {
    detectedLanguage: string;
    confidence: number;
  }

  interface LanguageDetectorInstance {
    detect(text: string): Promise<LanguageDetectorResult[]>;
    destroy(): void;
  }

  const LanguageDetector: {
    create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetectorInstance>;
  };

  // Global Translator API (Chrome experimental feature)
  interface TranslatorCreateOptions {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: any) => void;
  }

  interface TranslatorInstance {
    translate(text: string): Promise<string>;
    destroy(): void;
  }

  const Translator: {
    create(options: TranslatorCreateOptions): Promise<TranslatorInstance>;
  };

  namespace chrome {
    namespace ai {
      interface TranslatorCapabilities {
        available: 'readily' | 'after-download' | 'no';
        languagePairs: Array<{
          sourceLanguage: string;
          targetLanguage: string;
        }>;
      }

      interface TranslatorCreateOptions {
        sourceLanguage: string;
        targetLanguage: string;
      }

      interface Translator {
        translate(text: string): Promise<string>;
        destroy(): void;
      }

      interface LanguageDetector {
        detect(text: string): Promise<Array<{
          detectedLanguage: string;
          confidence: number;
        }>>;
        destroy(): void;
      }

      const translator: {
        capabilities(): Promise<TranslatorCapabilities>;
        create(options: TranslatorCreateOptions): Promise<Translator>;
      };

      const languageDetector: {
        create(): Promise<LanguageDetector>;
      };
    }
  }
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
  status: 'pending' | 'translating' | 'completed' | 'error';
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface Settings {
  defaultTargetLanguage: string;
  autoDetectLanguage: boolean;
  showTranslationTooltip: boolean;
  enableFullPageTranslation: boolean;
  enableStreamingTranslation: boolean;
  translationDelay: number;
  shortcuts: {
    translateSelected: string;
    translateFullPage: string;
  };
}