import { MessageType, Message, MessageResponse } from '../../types/api.js';
import { Settings, TranslationResult, Language, TranslationError, TranslationErrorType } from '../../types/interfaces.js';
import { ERROR_MESSAGES, CONFIG } from '../../types/constants.js';

/**
 * Popup Controller
 * Handles popup UI interactions and communication with background script
 */
class PopupController {
  private elements: {
    inputText: HTMLTextAreaElement;
    targetLanguage: HTMLSelectElement;
    translateBtn: HTMLButtonElement;
    detectedLanguage: HTMLSpanElement;
    progressSection: HTMLDivElement;
    progressFill: HTMLDivElement;
    progressText: HTMLSpanElement;
    resultSection: HTMLDivElement;
    resultText: HTMLDivElement;
    errorSection: HTMLDivElement;
    errorMessage: HTMLDivElement;
    copyBtn: HTMLButtonElement;
    retryBtn: HTMLButtonElement;
    settingsBtn: HTMLButtonElement;
    translatePageBtn: HTMLButtonElement;
  };

  private currentTranslation: {
    text: string;
    targetLang: string;
  } | null = null;

  private settings: Settings | null = null;
  private debouncedLanguageDetection: ((text: string) => void) | null = null;

  constructor() {
    this.elements = this.initializeElements();
    this.setupEventListeners();
    this.setupMessageListener();
    this.loadInitialData();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements() {
    return {
      inputText: document.getElementById('inputText') as HTMLTextAreaElement,
      targetLanguage: document.getElementById('targetLanguage') as HTMLSelectElement,
      translateBtn: document.getElementById('translateBtn') as HTMLButtonElement,
      detectedLanguage: document.getElementById('detectedLanguage') as HTMLSpanElement,
      progressSection: document.getElementById('progressSection') as HTMLDivElement,
      progressFill: document.getElementById('progressFill') as HTMLDivElement,
      progressText: document.getElementById('progressText') as HTMLSpanElement,
      resultSection: document.getElementById('resultSection') as HTMLDivElement,
      resultText: document.getElementById('resultText') as HTMLDivElement,
      errorSection: document.getElementById('errorSection') as HTMLDivElement,
      errorMessage: document.getElementById('errorMessage') as HTMLDivElement,
      copyBtn: document.getElementById('copyBtn') as HTMLButtonElement,
      retryBtn: document.getElementById('retryBtn') as HTMLButtonElement,
      settingsBtn: document.getElementById('settingsBtn') as HTMLButtonElement,
      translatePageBtn: document.getElementById('translatePageBtn') as HTMLButtonElement,
    };
  }

  /**
   * Setup message listener for background script communications
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === MessageType.MODEL_DOWNLOAD_PROGRESS) {
        this.handleModelDownloadProgress(message.data);
      }
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // 翻译按钮点击处理
    this.elements.translateBtn.addEventListener('click', () => {
      this.handleTranslate();
    });

    // 输入框变化处理（防抖）
    this.elements.inputText.addEventListener('input', () => {
      this.handleInputChange();
    });

    // 回车键翻译
    this.elements.inputText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleTranslate();
      }
    });

    // 复制按钮
    this.elements.copyBtn.addEventListener('click', () => {
      this.handleCopy();
    });

    // 重试按钮
    this.elements.retryBtn.addEventListener('click', () => {
      this.handleRetry();
    });

    // 设置按钮
    this.elements.settingsBtn.addEventListener('click', () => {
      this.openOptionsPage();
    });

    // 翻译整页按钮
    this.elements.translatePageBtn.addEventListener('click', () => {
      this.handleTranslatePage();
    });

    // 目标语言变化
    this.elements.targetLanguage.addEventListener('change', () => {
      this.saveTargetLanguagePreference();
    });
  }

  /**
   * Load initial data
   */
  private async loadInitialData(): Promise<void> {
    try {
      // 加载设置
      this.settings = await this.sendMessage(MessageType.GET_SETTINGS);

      // 初始化防抖函数
      this.initializeDebouncedFunctions();

      // 加载支持的语言列表
      const languages = await this.sendMessage(MessageType.GET_SUPPORTED_LANGUAGES);
      this.populateLanguageOptions(languages);

      // 设置默认目标语言
      if (this.settings) {
        this.elements.targetLanguage.value = this.settings.defaultTargetLanguage;
      }

      // 检查是否有选中的文本
      await this.checkSelectedText();

    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.showError('初始化失败，请刷新重试');
    }
  }

  /**
   * Populate language options
   */
  private populateLanguageOptions(languages: Language[]): void {
    // 清空现有选项
    this.elements.targetLanguage.innerHTML = '';

    // 添加语言选项
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.nativeName;
      this.elements.targetLanguage.appendChild(option);
    });
  }

  /**
   * Check for selected text in current tab
   */
  private async checkSelectedText(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      const result = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_SELECTED_TEXT'
      });

      if (result && result.text && result.text.trim()) {
        this.elements.inputText.value = result.text.trim();
        this.elements.inputText.focus();
        this.elements.inputText.select();
      }
    } catch (error) {
      // 忽略错误，可能是页面不支持content script
      console.debug('No selected text or content script not available');
    }
  }

  /**
   * Handle input text change with debouncing
   */
  private handleInputChange(): void {
    const text = this.elements.inputText.value.trim();

    // 隐藏结果和错误
    this.hideResult();
    this.hideError();

    if (!text) {
      this.elements.detectedLanguage.textContent = '自动检测';
      return;
    }

    // 使用防抖处理语言检测
    if (this.debouncedLanguageDetection) {
      this.debouncedLanguageDetection(text);
    }
  }

  /**
   * Initialize debounced language detection
   */
  private initializeDebouncedFunctions(): void {
    // 使用设置中的防抖延迟或默认值
    const debounceDelay = this.settings?.translationDelay || CONFIG.DEBOUNCE_DELAY;

    // 创建防抖的语言检测函数
    this.debouncedLanguageDetection = this.createDebouncedFunction(
      async (text: string) => {
        try {
          const detectedLang = await this.sendMessage(MessageType.DETECT_LANGUAGE, { text });
          this.updateDetectedLanguage(detectedLang);
        } catch (error) {
          console.error('Language detection failed:', error);
          // 不显示语言检测错误，保持用户体验流畅
        }
      },
      debounceDelay
    );
  }

  /**
   * Create a debounced function
   */
  private createDebouncedFunction<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        func.apply(null, args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Handle translate button click
   */
  private async handleTranslate(): Promise<void> {
    const text = this.elements.inputText.value.trim();
    const targetLang = this.elements.targetLanguage.value;

    // 验证输入
    const validationError = this.validateInput(text, targetLang);
    if (validationError) {
      this.showError(validationError);
      return;
    }

    // 保存当前翻译请求
    this.currentTranslation = { text, targetLang };

    await this.performTranslation();
  }

  /**
   * Perform translation with retry logic
   */
  private async performTranslation(): Promise<void> {
    if (!this.currentTranslation) return;

    const { text, targetLang } = this.currentTranslation;

    try {
      this.showLoading();
      this.hideError();
      this.hideResult();

      const result: TranslationResult = await this.sendMessage(MessageType.TRANSLATE_TEXT, {
        text,
        sourceLang: 'auto',
        targetLang
      });

      this.showResult(result.translatedText);

      if (result.detectedLanguage) {
        this.updateDetectedLanguage(result.detectedLanguage);
      }

    } catch (error) {
      console.error('Translation failed:', error);
      await this.handleTranslationError(error);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle translation errors with retry logic
   */
  private async handleTranslationError(error: any): Promise<void> {
    const translationError = this.parseError(error);

    // 如果是API不可用错误，直接显示错误，不进行重试
    if (translationError.type === TranslationErrorType.API_UNAVAILABLE) {
      this.showError(translationError.message, false);
      return;
    }
  }

  /**
   * Validate input before translation
   */
  private validateInput(text: string, targetLang: string): string | null {
    if (!text) {
      return ERROR_MESSAGES.NO_TEXT_SELECTED;
    }

    if (text.length > CONFIG.MAX_TEXT_LENGTH) {
      return ERROR_MESSAGES.TEXT_TOO_LONG;
    }

    if (!targetLang) {
      return '请选择目标语言';
    }

    return null;
  }

  /**
   * Parse error into user-friendly format
   */
  private parseError(error: any): TranslationError {
    if (error && typeof error === 'object' && 'type' in error) {
      return error as TranslationError;
    }

    const message = error?.message || String(error);
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('api') && lowerMessage.includes('unavailable')) {
      return {
        type: TranslationErrorType.API_UNAVAILABLE,
        message: ERROR_MESSAGES.API_UNAVAILABLE,
        retryable: false
      };
    }

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return {
        type: TranslationErrorType.NETWORK_ERROR,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        retryable: true
      };
    }

    if (lowerMessage.includes('quota') || lowerMessage.includes('limit')) {
      return {
        type: TranslationErrorType.QUOTA_EXCEEDED,
        message: ERROR_MESSAGES.QUOTA_EXCEEDED,
        retryable: true
      };
    }

    if (lowerMessage.includes('too long') || lowerMessage.includes('length')) {
      return {
        type: TranslationErrorType.TEXT_TOO_LONG,
        message: ERROR_MESSAGES.TEXT_TOO_LONG,
        retryable: false
      };
    }

    return {
      type: TranslationErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES.TRANSLATION_FAILED,
      retryable: true
    };
  }

  /**
   * Handle copy result
   */
  private async handleCopy(): Promise<void> {
    const resultText = this.elements.resultText.textContent;
    if (!resultText) return;

    try {
      await navigator.clipboard.writeText(resultText);

      // 显示复制成功提示
      const originalText = this.elements.copyBtn.innerHTML;
      this.elements.copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      `;

      setTimeout(() => {
        this.elements.copyBtn.innerHTML = originalText;
      }, 1000);

    } catch (error) {
      console.error('Copy failed:', error);
      this.showError('复制失败');
    }
  }

  /**
   * Handle retry translation
   */
  private handleRetry(): void {
    if (this.currentTranslation) {
      this.elements.inputText.value = this.currentTranslation.text;
      this.elements.targetLanguage.value = this.currentTranslation.targetLang;
      this.performTranslation();
    }
  }

  /**
   * Handle translate full page
   */
  private async handleTranslatePage(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      const targetLang = this.elements.targetLanguage.value;

      // 发送全文翻译消息到content script
      await chrome.tabs.sendMessage(tab.id, {
        type: MessageType.TRANSLATE_FULL_PAGE,
        data: { targetLang }
      });

      // 关闭popup
      window.close();

    } catch (error) {
      console.error('Full page translation failed:', error);
      this.showError('全文翻译失败，请确保页面支持翻译');
    }
  }

  /**
   * Open options page
   */
  private openOptionsPage(): void {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  /**
   * Save target language preference
   */
  private async saveTargetLanguagePreference(): Promise<void> {
    if (!this.settings) return;

    try {
      this.settings.defaultTargetLanguage = this.elements.targetLanguage.value;
      await this.sendMessage(MessageType.SAVE_SETTINGS, { settings: this.settings });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }

  /**
   * Update detected language display
   */
  private updateDetectedLanguage(langCode: string): void {
    // 简单的语言代码到名称映射
    const langNames: { [key: string]: string } = {
      'en': 'English',
      'zh-CN': '中文(简体)',
      'zh-TW': '中文(繁體)',
      'ja': '日本語',
      'ko': '한국어',
      'fr': 'Français',
      'de': 'Deutsch',
      'es': 'Español',
      'ru': 'Русский',
      'auto': '自动检测'
    };

    this.elements.detectedLanguage.textContent = langNames[langCode] || langCode;
  }

  /**
   * Handle model download progress updates
   */
  private handleModelDownloadProgress(data: { modelType: string; progress: number; message: string }): void {
    if (this.elements.progressSection.classList.contains('visible')) {
      this.elements.progressFill.style.width = `${data.progress}%`;
      this.elements.progressText.textContent = data.message;
      
      // 清除模拟进度动画，使用真实进度
      const progressInterval = (this.elements.translateBtn as any).progressInterval;
      if (progressInterval) {
        clearInterval(progressInterval);
        delete (this.elements.translateBtn as any).progressInterval;
      }
    }
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    this.elements.translateBtn.disabled = true;
    this.elements.translateBtn.classList.add('loading');
    this.elements.progressSection.classList.add('visible');
    this.elements.progressFill.style.width = '0%';
    this.elements.progressText.textContent = '翻译中...';

    // 模拟进度（如果没有真实进度更新会被替换）
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress > 90) progress = 90;
      this.elements.progressFill.style.width = `${progress}%`;
    }, 100);

    // 保存interval ID以便清除
    (this.elements.translateBtn as any).progressInterval = progressInterval;
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    this.elements.translateBtn.disabled = false;
    this.elements.translateBtn.classList.remove('loading');
    this.elements.progressSection.classList.remove('visible');

    // 清除进度动画
    const progressInterval = (this.elements.translateBtn as any).progressInterval;
    if (progressInterval) {
      clearInterval(progressInterval);
      delete (this.elements.translateBtn as any).progressInterval;
    }
  }

  /**
   * Show translation result
   */
  private showResult(text: string): void {
    this.elements.resultText.textContent = text;
    this.elements.resultSection.classList.add('visible');
  }

  /**
   * Hide translation result
   */
  private hideResult(): void {
    this.elements.resultSection.classList.remove('visible');
  }

  /**
   * Show error message
   */
  private showError(message: string, showRetry: boolean = false): void {
    this.elements.errorMessage.textContent = message;
    this.elements.errorSection.classList.add('visible');

    // 显示或隐藏重试按钮
    if (showRetry && this.currentTranslation) {
      this.elements.retryBtn.style.display = 'inline-block';
    } else {
      this.elements.retryBtn.style.display = 'none';
    }
  }

  /**
   * Hide error message
   */
  private hideError(): void {
    this.elements.errorSection.classList.remove('visible');
  }



  /**
   * Send message to background script
   */
  private async sendMessage(type: MessageType, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const message: Message = {
        type,
        data,
        requestId: Date.now().toString()
      };

      chrome.runtime.sendMessage(message, (response: MessageResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && !response.success) {
          reject(new Error(response.error || 'Unknown error'));
        } else {
          resolve(response?.data);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});