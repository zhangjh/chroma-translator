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
  downloadingTranslationModel: string;
  downloadingDetectionModel: string;
  startingTranslation: string;
  // Error messages
  pleaseSelectTargetLanguage: string;
  initializationFailed: string;
  copyFailed: string;
  translationStarted: string;
  startTranslationFailed: string;
  fullPageTranslationFailed: string;
  pageNotSupported: string;
  apiNotAvailable: string;
  translationFailed: string;
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
    settings: '设置',
    downloadingTranslationModel: '正在下载翻译模型...',
    downloadingDetectionModel: '正在下载语言检测模型...',
    startingTranslation: '正在启动翻译...',
    // Error messages
    pleaseSelectTargetLanguage: '请选择目标语言',
    initializationFailed: '初始化失败，请刷新重试',
    copyFailed: '复制失败',
    translationStarted: '翻译已启动 ✓',
    startTranslationFailed: '启动翻译失败',
    fullPageTranslationFailed: '全页翻译失败',
    pageNotSupported: '页面不支持翻译，请刷新页面后重试',
    apiNotAvailable: '翻译API不可用，请检查Chrome版本',
    translationFailed: '翻译失败，请重试'
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
    settings: '設置',
    downloadingTranslationModel: '正在下載翻譯模型...',
    downloadingDetectionModel: '正在下載語言檢測模型...',
    startingTranslation: '正在啟動翻譯...',
    // Error messages
    pleaseSelectTargetLanguage: '請選擇目標語言',
    initializationFailed: '初始化失敗，請刷新重試',
    copyFailed: '複製失敗',
    translationStarted: '翻譯已啟動 ✓',
    startTranslationFailed: '啟動翻譯失敗',
    fullPageTranslationFailed: '全頁翻譯失敗',
    pageNotSupported: '頁面不支持翻譯，請刷新頁面後重試',
    apiNotAvailable: '翻譯API不可用，請檢查Chrome版本',
    translationFailed: '翻譯失敗，請重試'
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
    settings: 'Settings',
    downloadingTranslationModel: 'Downloading translation model...',
    downloadingDetectionModel: 'Downloading language detection model...',
    startingTranslation: 'Starting translation...',
    // Error messages
    pleaseSelectTargetLanguage: 'Please select target language',
    initializationFailed: 'Initialization failed, please refresh and try again',
    copyFailed: 'Copy failed',
    translationStarted: 'Translation started ✓',
    startTranslationFailed: 'Failed to start translation',
    fullPageTranslationFailed: 'Full page translation failed',
    pageNotSupported: 'Page does not support translation, please refresh and try again',
    apiNotAvailable: 'Translation API not available, please check Chrome version',
    translationFailed: 'Translation failed, please try again'
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
    settings: '設定',
    downloadingTranslationModel: '翻訳モデルをダウンロード中...',
    downloadingDetectionModel: '言語検出モデルをダウンロード中...',
    startingTranslation: '翻訳を開始中...',
    // Error messages
    pleaseSelectTargetLanguage: '対象言語を選択してください',
    initializationFailed: '初期化に失敗しました。ページを更新して再試行してください',
    copyFailed: 'コピーに失敗しました',
    translationStarted: '翻訳を開始しました ✓',
    startTranslationFailed: '翻訳の開始に失敗しました',
    fullPageTranslationFailed: 'ページ全体の翻訳に失敗しました',
    pageNotSupported: 'このページは翻訳をサポートしていません。ページを更新して再試行してください',
    apiNotAvailable: '翻訳APIが利用できません。Chromeのバージョンを確認してください',
    translationFailed: '翻訳に失敗しました。再試行してください'
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
    settings: '설정',
    downloadingTranslationModel: '번역 모델 다운로드 중...',
    downloadingDetectionModel: '언어 감지 모델 다운로드 중...',
    startingTranslation: '번역 시작 중...',
    // Error messages
    pleaseSelectTargetLanguage: '대상 언어를 선택하세요',
    initializationFailed: '초기화 실패, 페이지를 새로고침하고 다시 시도하세요',
    copyFailed: '복사 실패',
    translationStarted: '번역 시작됨 ✓',
    startTranslationFailed: '번역 시작 실패',
    fullPageTranslationFailed: '전체 페이지 번역 실패',
    pageNotSupported: '페이지가 번역을 지원하지 않습니다. 페이지를 새로고침하고 다시 시도하세요',
    apiNotAvailable: '번역 API를 사용할 수 없습니다. Chrome 버전을 확인하세요',
    translationFailed: '번역 실패, 다시 시도하세요'
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
    settings: 'Configuración',
    downloadingTranslationModel: 'Descargando modelo de traducción...',
    downloadingDetectionModel: 'Descargando modelo de detección de idioma...',
    startingTranslation: 'Iniciando traducción...',
    // Error messages
    pleaseSelectTargetLanguage: 'Por favor seleccione el idioma de destino',
    initializationFailed: 'Error de inicialización, actualice la página e intente de nuevo',
    copyFailed: 'Error al copiar',
    translationStarted: 'Traducción iniciada ✓',
    startTranslationFailed: 'Error al iniciar la traducción',
    fullPageTranslationFailed: 'Error en la traducción de página completa',
    pageNotSupported: 'La página no admite traducción, actualice e intente de nuevo',
    apiNotAvailable: 'API de traducción no disponible, verifique la versión de Chrome',
    translationFailed: 'Error de traducción, intente de nuevo'
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
    settings: 'Paramètres',
    downloadingTranslationModel: 'Téléchargement du modèle de traduction...',
    downloadingDetectionModel: 'Téléchargement du modèle de détection de langue...',
    startingTranslation: 'Démarrage de la traduction...',
    // Error messages
    pleaseSelectTargetLanguage: 'Veuillez sélectionner la langue cible',
    initializationFailed: 'Échec de l\'initialisation, actualisez et réessayez',
    copyFailed: 'Échec de la copie',
    translationStarted: 'Traduction démarrée ✓',
    startTranslationFailed: 'Échec du démarrage de la traduction',
    fullPageTranslationFailed: 'Échec de la traduction de la page complète',
    pageNotSupported: 'La page ne prend pas en charge la traduction, actualisez et réessayez',
    apiNotAvailable: 'API de traduction non disponible, vérifiez la version de Chrome',
    translationFailed: 'Échec de la traduction, réessayez'
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
    settings: 'Einstellungen',
    downloadingTranslationModel: 'Übersetzungsmodell wird heruntergeladen...',
    downloadingDetectionModel: 'Spracherkennungsmodell wird heruntergeladen...',
    startingTranslation: 'Übersetzung wird gestartet...',
    // Error messages
    pleaseSelectTargetLanguage: 'Bitte Zielsprache auswählen',
    initializationFailed: 'Initialisierung fehlgeschlagen, Seite aktualisieren und erneut versuchen',
    copyFailed: 'Kopieren fehlgeschlagen',
    translationStarted: 'Übersetzung gestartet ✓',
    startTranslationFailed: 'Übersetzung konnte nicht gestartet werden',
    fullPageTranslationFailed: 'Vollständige Seitenübersetzung fehlgeschlagen',
    pageNotSupported: 'Seite unterstützt keine Übersetzung, aktualisieren und erneut versuchen',
    apiNotAvailable: 'Übersetzungs-API nicht verfügbar, Chrome-Version prüfen',
    translationFailed: 'Übersetzung fehlgeschlagen, erneut versuchen'
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
    settings: 'Настройки',
    downloadingTranslationModel: 'Загрузка модели перевода...',
    downloadingDetectionModel: 'Загрузка модели определения языка...',
    startingTranslation: 'Запуск перевода...',
    // Error messages
    pleaseSelectTargetLanguage: 'Пожалуйста, выберите целевой язык',
    initializationFailed: 'Ошибка инициализации, обновите страницу и попробуйте снова',
    copyFailed: 'Ошибка копирования',
    translationStarted: 'Перевод запущен ✓',
    startTranslationFailed: 'Не удалось запустить перевод',
    fullPageTranslationFailed: 'Ошибка перевода всей страницы',
    pageNotSupported: 'Страница не поддерживает перевод, обновите и попробуйте снова',
    apiNotAvailable: 'API перевода недоступен, проверьте версию Chrome',
    translationFailed: 'Ошибка перевода, попробуйте снова'
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
    settings: 'Impostazioni',
    downloadingTranslationModel: 'Download modello di traduzione...',
    downloadingDetectionModel: 'Download modello di rilevamento lingua...',
    startingTranslation: 'Avvio traduzione...',
    // Error messages
    pleaseSelectTargetLanguage: 'Seleziona la lingua di destinazione',
    initializationFailed: 'Inizializzazione fallita, aggiorna e riprova',
    copyFailed: 'Copia fallita',
    translationStarted: 'Traduzione avviata ✓',
    startTranslationFailed: 'Avvio traduzione fallito',
    fullPageTranslationFailed: 'Traduzione pagina completa fallita',
    pageNotSupported: 'La pagina non supporta la traduzione, aggiorna e riprova',
    apiNotAvailable: 'API di traduzione non disponibile, controlla la versione di Chrome',
    translationFailed: 'Traduzione fallita, riprova'
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
    settings: 'Configurações',
    downloadingTranslationModel: 'Baixando modelo de tradução...',
    downloadingDetectionModel: 'Baixando modelo de detecção de idioma...',
    startingTranslation: 'Iniciando tradução...',
    // Error messages
    pleaseSelectTargetLanguage: 'Por favor, selecione o idioma de destino',
    initializationFailed: 'Falha na inicialização, atualize e tente novamente',
    copyFailed: 'Falha ao copiar',
    translationStarted: 'Tradução iniciada ✓',
    startTranslationFailed: 'Falha ao iniciar tradução',
    fullPageTranslationFailed: 'Falha na tradução da página completa',
    pageNotSupported: 'A página não suporta tradução, atualize e tente novamente',
    apiNotAvailable: 'API de tradução não disponível, verifique a versão do Chrome',
    translationFailed: 'Falha na tradução, tente novamente'
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
    settings: 'الإعدادات',
    downloadingTranslationModel: 'جاري تحميل نموذج الترجمة...',
    downloadingDetectionModel: 'جاري تحميل نموذج اكتشاف اللغة...',
    startingTranslation: 'جاري بدء الترجمة...',
    // Error messages
    pleaseSelectTargetLanguage: 'يرجى اختيار اللغة المستهدفة',
    initializationFailed: 'فشل في التهيئة، يرجى تحديث الصفحة والمحاولة مرة أخرى',
    copyFailed: 'فشل في النسخ',
    translationStarted: 'تم بدء الترجمة ✓',
    startTranslationFailed: 'فشل في بدء الترجمة',
    fullPageTranslationFailed: 'فشل في ترجمة الصفحة كاملة',
    pageNotSupported: 'الصفحة لا تدعم الترجمة، يرجى التحديث والمحاولة مرة أخرى',
    apiNotAvailable: 'واجهة برمجة الترجمة غير متاحة، يرجى التحقق من إصدار Chrome',
    translationFailed: 'فشل في الترجمة، يرجى المحاولة مرة أخرى'
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