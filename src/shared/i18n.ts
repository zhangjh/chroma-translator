// Internationalization module for Chrome Translation Extension

/**
 * Interface for UI text translations
 */
export interface UITexts {
  extensionName: string;
  detectedLabel: string;
  autoDetect: string;
  inputPlaceholder: string;
  translateTo: string;
  translateButton: string;
  translatePageButton: string;
  translating: string;
  translationResult: string;
  copy: string;
  retry: string;
  settings: string;
}

/**
 * Supported UI languages with their translations
 */
export const UI_TRANSLATIONS: Record<string, UITexts> = {
  'zh-CN': {
    extensionName: '翻译助手',
    detectedLabel: '检测到:',
    autoDetect: '自动检测',
    inputPlaceholder: '输入要翻译的文本...',
    translateTo: '翻译到:',
    translateButton: '翻译',
    translatePageButton: '翻译整页',
    translating: '翻译中...',
    translationResult: '翻译结果:',
    copy: '复制',
    retry: '重试',
    settings: '设置'
  },
  'zh-TW': {
    extensionName: '翻譯助手',
    detectedLabel: '檢測到:',
    autoDetect: '自動檢測',
    inputPlaceholder: '輸入要翻譯的文本...',
    translateTo: '翻譯到:',
    translateButton: '翻譯',
    translatePageButton: '翻譯整頁',
    translating: '翻譯中...',
    translationResult: '翻譯結果:',
    copy: '複製',
    retry: '重試',
    settings: '設置'
  },
  'en': {
    extensionName: 'Translator',
    detectedLabel: 'Detected:',
    autoDetect: 'Auto Detect',
    inputPlaceholder: 'Enter text to translate...',
    translateTo: 'Translate to:',
    translateButton: 'Translate',
    translatePageButton: 'Translate Page',
    translating: 'Translating...',
    translationResult: 'Translation Result:',
    copy: 'Copy',
    retry: 'Retry',
    settings: 'Settings'
  },
  'ja': {
    extensionName: '翻訳アシスタント',
    detectedLabel: '検出:',
    autoDetect: '自動検出',
    inputPlaceholder: '翻訳するテキストを入力...',
    translateTo: '翻訳先:',
    translateButton: '翻訳',
    translatePageButton: 'ページ翻訳',
    translating: '翻訳中...',
    translationResult: '翻訳結果:',
    copy: 'コピー',
    retry: '再試行',
    settings: '設定'
  },
  'ko': {
    extensionName: '번역 도우미',
    detectedLabel: '감지됨:',
    autoDetect: '자동 감지',
    inputPlaceholder: '번역할 텍스트를 입력하세요...',
    translateTo: '번역 대상:',
    translateButton: '번역',
    translatePageButton: '페이지 번역',
    translating: '번역 중...',
    translationResult: '번역 결과:',
    copy: '복사',
    retry: '다시 시도',
    settings: '설정'
  },
  'es': {
    extensionName: 'Traductor',
    detectedLabel: 'Detectado:',
    autoDetect: 'Detección Automática',
    inputPlaceholder: 'Ingrese el texto a traducir...',
    translateTo: 'Traducir a:',
    translateButton: 'Traducir',
    translatePageButton: 'Traducir Página',
    translating: 'Traduciendo...',
    translationResult: 'Resultado de Traducción:',
    copy: 'Copiar',
    retry: 'Reintentar',
    settings: 'Configuración'
  },
  'fr': {
    extensionName: 'Traducteur',
    detectedLabel: 'Détecté:',
    autoDetect: 'Détection Automatique',
    inputPlaceholder: 'Saisissez le texte à traduire...',
    translateTo: 'Traduire vers:',
    translateButton: 'Traduire',
    translatePageButton: 'Traduire la Page',
    translating: 'Traduction...',
    translationResult: 'Résultat de Traduction:',
    copy: 'Copier',
    retry: 'Réessayer',
    settings: 'Paramètres'
  },
  'de': {
    extensionName: 'Übersetzer',
    detectedLabel: 'Erkannt:',
    autoDetect: 'Automatische Erkennung',
    inputPlaceholder: 'Text zum Übersetzen eingeben...',
    translateTo: 'Übersetzen nach:',
    translateButton: 'Übersetzen',
    translatePageButton: 'Seite Übersetzen',
    translating: 'Übersetzen...',
    translationResult: 'Übersetzungsergebnis:',
    copy: 'Kopieren',
    retry: 'Wiederholen',
    settings: 'Einstellungen'
  },
  'ru': {
    extensionName: 'Переводчик',
    detectedLabel: 'Обнаружено:',
    autoDetect: 'Автоопределение',
    inputPlaceholder: 'Введите текст для перевода...',
    translateTo: 'Перевести на:',
    translateButton: 'Перевести',
    translatePageButton: 'Перевести Страницу',
    translating: 'Перевод...',
    translationResult: 'Результат Перевода:',
    copy: 'Копировать',
    retry: 'Повторить',
    settings: 'Настройки'
  },
  'it': {
    extensionName: 'Traduttore',
    detectedLabel: 'Rilevato:',
    autoDetect: 'Rilevamento Automatico',
    inputPlaceholder: 'Inserisci il testo da tradurre...',
    translateTo: 'Traduci in:',
    translateButton: 'Traduci',
    translatePageButton: 'Traduci Pagina',
    translating: 'Traduzione...',
    translationResult: 'Risultato Traduzione:',
    copy: 'Copia',
    retry: 'Riprova',
    settings: 'Impostazioni'
  },
  'pt': {
    extensionName: 'Tradutor',
    detectedLabel: 'Detectado:',
    autoDetect: 'Detecção Automática',
    inputPlaceholder: 'Digite o texto para traduzir...',
    translateTo: 'Traduzir para:',
    translateButton: 'Traduzir',
    translatePageButton: 'Traduzir Página',
    translating: 'Traduzindo...',
    translationResult: 'Resultado da Tradução:',
    copy: 'Copiar',
    retry: 'Tentar Novamente',
    settings: 'Configurações'
  },
  'ar': {
    extensionName: 'مساعد الترجمة',
    detectedLabel: 'تم اكتشاف:',
    autoDetect: 'اكتشاف تلقائي',
    inputPlaceholder: 'أدخل النص المراد ترجمته...',
    translateTo: 'ترجمة إلى:',
    translateButton: 'ترجمة',
    translatePageButton: 'ترجمة الصفحة',
    translating: 'جاري الترجمة...',
    translationResult: 'نتيجة الترجمة:',
    copy: 'نسخ',
    retry: 'إعادة المحاولة',
    settings: 'الإعدادات'
  }
};

/**
 * I18n Manager class for handling UI translations
 */
export class I18nManager {
  private static instance: I18nManager;
  private currentLanguage: string = 'zh-CN';
  private currentTexts: UITexts = UI_TRANSLATIONS['zh-CN'];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /**
   * Set UI language based on target language
   */
  public setLanguage(targetLanguage: string): void {
    // Map target language to UI language
    const uiLanguage = this.mapTargetToUILanguage(targetLanguage);
    
    if (UI_TRANSLATIONS[uiLanguage]) {
      this.currentLanguage = uiLanguage;
      this.currentTexts = UI_TRANSLATIONS[uiLanguage];
    } else {
      // Fallback to Chinese if language not supported
      this.currentLanguage = 'zh-CN';
      this.currentTexts = UI_TRANSLATIONS['zh-CN'];
    }
  }

  /**
   * Get current UI texts
   */
  public getTexts(): UITexts {
    return this.currentTexts;
  }

  /**
   * Get current language code
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Map target language to UI language
   * If target is Chinese, use Chinese UI; otherwise use English UI
   */
  private mapTargetToUILanguage(targetLanguage: string): string {
    // If target language has UI translation, use it
    if (UI_TRANSLATIONS[targetLanguage]) {
      return targetLanguage;
    }

    // Language family mapping
    const languageMap: Record<string, string> = {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'zh': 'zh-CN',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'ru': 'ru',
      'it': 'it',
      'pt': 'pt',
      'ar': 'ar'
    };

    return languageMap[targetLanguage] || 'en';
  }
}