/**
 * Content script i18n - matches main i18n system
 * This is a standalone version for content script since it can't import modules
 */
const CONTENT_I18N_TEXTS = {
  'zh-CN': {
    translating: '翻译中...',
    translatingText: '正在翻译...',
    translatingPage: '正在翻译页面',
    cancelTranslation: '取消翻译',
    translate: '翻译',
    close: '关闭',
    copy: '复制',
    copied: '已复制 ✓',
    copyFailed: '复制失败',
    copyTooltip: '复制翻译结果',
    preparing: '准备中...',
    completed: '翻译完成'
  },
  'zh-TW': {
    translating: '翻譯中...',
    translatingText: '正在翻譯...',
    translatingPage: '正在翻譯頁面',
    cancelTranslation: '取消翻譯',
    translate: '翻譯',
    close: '關閉',
    copy: '複製',
    copied: '已複製 ✓',
    copyFailed: '複製失敗',
    copyTooltip: '複製翻譯結果',
    preparing: '準備中...',
    completed: '翻譯完成'
  },
  'en': {
    translating: 'Translating...',
    translatingText: 'Translating...',
    translatingPage: 'Translating page',
    cancelTranslation: 'Cancel translation',
    translate: 'Translate',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied ✓',
    copyFailed: 'Copy failed',
    copyTooltip: 'Copy translation result',
    preparing: 'Preparing...',
    completed: 'Translation completed'
  },
  'ja': {
    translating: '翻訳中...',
    translatingText: '翻訳中...',
    translatingPage: 'ページを翻訳中',
    cancelTranslation: '翻訳をキャンセル',
    translate: '翻訳',
    close: '閉じる',
    copy: 'コピー',
    copied: 'コピー済み ✓',
    copyFailed: 'コピー失敗',
    copyTooltip: '翻訳結果をコピー',
    preparing: '準備中...',
    completed: '翻訳完了'
  },
  'ko': {
    translating: '번역 중...',
    translatingText: '번역 중...',
    translatingPage: '페이지 번역 중',
    cancelTranslation: '번역 취소',
    translate: '번역',
    close: '닫기',
    copy: '복사',
    copied: '복사됨 ✓',
    copyFailed: '복사 실패',
    copyTooltip: '번역 결과 복사',
    preparing: '준비 중...',
    completed: '번역 완료'
  },
  'es': {
    translating: 'Traduciendo...',
    translatingText: 'Traduciendo...',
    translatingPage: 'Traduciendo página',
    cancelTranslation: 'Cancelar traducción',
    translate: 'Traducir',
    close: 'Cerrar',
    copy: 'Copiar',
    copied: 'Copiado ✓',
    copyFailed: 'Error al copiar',
    copyTooltip: 'Copiar resultado de traducción',
    preparing: 'Preparando...',
    completed: 'Traducción completada'
  },
  'fr': {
    translating: 'Traduction...',
    translatingText: 'Traduction...',
    translatingPage: 'Traduction de la page',
    cancelTranslation: 'Annuler la traduction',
    translate: 'Traduire',
    close: 'Fermer',
    copy: 'Copier',
    copied: 'Copié ✓',
    copyFailed: 'Échec de la copie',
    copyTooltip: 'Copier le résultat de traduction',
    preparing: 'Préparation...',
    completed: 'Traduction terminée'
  },
  'de': {
    translating: 'Übersetzen...',
    translatingText: 'Übersetzen...',
    translatingPage: 'Seite übersetzen',
    cancelTranslation: 'Übersetzung abbrechen',
    translate: 'Übersetzen',
    close: 'Schließen',
    copy: 'Kopieren',
    copied: 'Kopiert ✓',
    copyFailed: 'Kopieren fehlgeschlagen',
    copyTooltip: 'Übersetzungsergebnis kopieren',
    preparing: 'Vorbereitung...',
    completed: 'Übersetzung abgeschlossen'
  },
  'ru': {
    translating: 'Перевод...',
    translatingText: 'Перевод...',
    translatingPage: 'Перевод страницы',
    cancelTranslation: 'Отменить перевод',
    translate: 'Перевести',
    close: 'Закрыть',
    copy: 'Копировать',
    copied: 'Скопировано ✓',
    copyFailed: 'Ошибка копирования',
    copyTooltip: 'Копировать результат перевода',
    preparing: 'Подготовка...',
    completed: 'Перевод завершен'
  }
};

/**
 * Current UI language for content script
 * Will be set based on user's target language selection
 */
let currentContentUILanguage = 'zh-CN';

/**
 * Set UI language for content script
 */
function setContentUILanguage(targetLang: string): void {
  // Map target language to UI language (same logic as main i18n)
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
    'ru': 'ru'
  };
  
  currentContentUILanguage = languageMap[targetLang] || 'en';
}

/**
 * Get internationalized text for content script
 * Uses current UI language with fallback to Chinese
 */
function getI18nText(key: string): string {
  // Get texts for the current language, fallback to Chinese
  const texts = CONTENT_I18N_TEXTS[currentContentUILanguage as keyof typeof CONTENT_I18N_TEXTS] || CONTENT_I18N_TEXTS['zh-CN'];
  return texts[key as keyof typeof texts] || key;
}

/**
 * Translation error types
 */
enum TranslationErrorType {
  API_UNAVAILABLE = 'api_unavailable',
  NETWORK_ERROR = 'network_error',
  INVALID_LANGUAGE = 'invalid_language',
  TEXT_TOO_LONG = 'text_too_long',
  QUOTA_EXCEEDED = 'quota_exceeded'
}

/**
 * Translation error interface
 */
interface TranslationError {
  type: TranslationErrorType;
  message: string;
}

/**
 * Translation progress interface
 */
interface TranslationProgress {
  totalElements: number;
  translatedElements: number;
  currentElement: string;
  percentage: number;
}

/**
 * Message types for communication
 */
enum MessageType {
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
 * Message interface
 */
interface Message {
  type: MessageType;
  data?: any;
  requestId?: string;
}

/**
 * Message response interface
 */
interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}

/**
 * Configuration constants
 */
const CONFIG = {
  MAX_TEXT_LENGTH: 5000,
  MAX_BATCH_SIZE: 10,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_EXPIRY: 3600000,
  MAX_HISTORY_ITEMS: 100,
  DEBOUNCE_DELAY: 500,
  TOOLTIP_DELAY: 200,
  PROGRESS_UPDATE_INTERVAL: 100
};

/**
 * CSS class names
 */
const CSS_CLASSES = {
  TRANSLATION_TOOLTIP: 'chrome-translation-tooltip',
  TRANSLATION_PROGRESS: 'chrome-translation-progress',
  TRANSLATED_ELEMENT: 'chrome-translated-element',
  TRANSLATING_ELEMENT: 'chrome-translating-element',
  LOADING_STATE: 'chrome-translation-loading',
};

/**
 * Error messages
 */
const ERROR_MESSAGES = {
  API_UNAVAILABLE: 'Chrome Translation API is not available. Please check your Chrome version and network connection.',
  NETWORK_ERROR: 'Network error occurred. Please check your internet connection and try again.',
  INVALID_LANGUAGE: 'The selected language is not supported.',
  TEXT_TOO_LONG: 'Text is too long. Please try with shorter text.',
  QUOTA_EXCEEDED: 'Translation quota exceeded. Please try again later.',
  NO_TEXT_SELECTED: 'Please select some text to translate.',
  TRANSLATION_FAILED: 'Translation failed. Please try again.'
};

// ========== CONTENT SCRIPT IMPLEMENTATION ==========

/**
 * Translatable element information
 */
interface TranslatableElement {
  element: HTMLElement;
  originalText: string;
  priority: number;
  elementId: string;
  tagName: string;
  isVisible: boolean;
}

/**
 * Element priority mapping for translation ordering
 */
enum ElementPriority {
  TITLE = 1,      // h1, h2, h3, h4, h5, h6, title
  HEADING = 2,    // header elements, nav titles
  PARAGRAPH = 3,  // p, div with substantial text
  LIST = 4,       // li, ul, ol
  LINK = 5,       // a
  BUTTON = 6,     // button, input[type="button"]
  LABEL = 7,      // label, span, small
  OTHER = 8       // other text elements
}

/**
 * Handles text selection detection and translation UI
 */
class ContentScript {
  private selectedText: string = '';
  private selectionPosition: { x: number; y: number; width?: number; height?: number } = { x: 0, y: 0 };
  private tooltip: HTMLElement | null = null;
  private translateButton: HTMLElement | null = null;
  private repositionTimeout: number | null = null;
  private isButtonInteraction: boolean = false;
  private buttonShowTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.init();
    this.setupMessageListener();
  }

  /**
   * Initialize content script functionality
   */
  private init(): void {
    this.setupTextSelectionDetection();
    console.log('ChromaTranslator content script initialized');
  }

  /**
   * Setup message listener for background script communication
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, _sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
        this.handleMessage(message)
          .then(data => {
            sendResponse({
              success: true,
              data,
              requestId: message.requestId || ''
            });
          })
          .catch(error => {
            console.error('Content script message handling error:', error);
            sendResponse({
              success: false,
              error: error.message || 'Unknown error occurred',
              requestId: message.requestId || ''
            });
          });

        return true; // Indicate async response
      }
    );
  }

  /**
   * Handle messages from background script
   */
  private async handleMessage(message: Message): Promise<any> {
    switch (message.type) {
      case MessageType.TRANSLATE_FULL_PAGE:
        const targetLang = message.data?.targetLang;
        await this.translateFullPage(targetLang);
        return { success: true };

      case MessageType.RESTORE_ORIGINAL:
        this.restoreOriginalPage();
        return { success: true };

      case MessageType.UPDATE_PROGRESS:
        if (message.data?.progress) {
          this.showFullPageProgress(message.data.progress);
        }
        return { success: true };

      default:
        // Handle string-based message types for backward compatibility
        const messageTypeStr = message.type as string;
        switch (messageTypeStr) {
          case 'GET_SELECTED_TEXT':
            return { text: this.selectedText };

          case 'TRANSLATION_RESULT':
            this.handleTranslationResult(message.data);
            return { success: true };

          case 'TRANSLATION_ERROR':
            this.handleTranslationError(message.data);
            return { success: true };

          default:
            console.warn('Unknown message type:', message.type);
            return { success: false, error: 'Unknown message type' };
        }
    }
  }

  /**
   * Set up text selection detection
   */
  private setupTextSelectionDetection(): void {
    // Primary event listeners
    document.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: true });
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this), { passive: true });

    // Handle dynamic content changes
    if (window.MutationObserver) {
      const observer = new MutationObserver(() => {
        // Re-check selection after DOM changes
        setTimeout(() => {
          this.handleSelectionChange();
        }, 100);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
      });
    }
  }

  /**
   * Handle mouse up events to detect text selection
   */
  private handleMouseUp(event: MouseEvent): void {
    // Small delay to ensure selection is complete
    this.processTextSelection(event.clientX, event.clientY);
  }

  /**
   * Handle selection change events
   */
  private handleSelectionChange(): void {
    // Process selection change with current cursor position
    console.log("selectionChange");
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.selectedText = selection.toString().trim();
    } else {
      this.selectedText = '';
    }

    // Only hide button if no text is selected and we're not in the middle of a button interaction
    if (!this.selectedText) {
      // Add a small delay to prevent flickering during button interactions
      setTimeout(() => {
        if (!this.selectedText && !this.isButtonInteraction) {
          this.hideTranslateButton();
        }
      }, 100);
    }
  }

  /**
   * Process text selection and validate it
   */
  private processTextSelection(x: number, y: number): void {
    try {
      // Clear any pending button show timeout
      if (this.buttonShowTimeout) {
        clearTimeout(this.buttonShowTimeout);
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        this.hideTranslateButton();
        return;
      }

      const selectedText = selection.toString().trim();

      // Validate selected text
      if (!this.isValidTextSelection(selectedText)) {
        this.hideTranslateButton();
        return;
      }

      this.selectedText = selectedText;

      // Always use mouse position for button positioning to ensure it appears near the cursor
      this.selectionPosition = { x, y };

      // Get selection bounds for tooltip positioning later, but keep button at mouse position
      const selectionBounds = this.getSelectionBounds(selection);
      if (selectionBounds) {
        this.selectionPosition.width = selectionBounds.width;
        this.selectionPosition.height = selectionBounds.height;
        // Note: We intentionally don't override x,y coordinates to keep button at mouse position
      }

      // Add a small delay to stabilize button showing
      this.buttonShowTimeout = setTimeout(() => {
        if (this.selectedText && this.isValidTextSelection(this.selectedText)) {
          this.showTranslateButton(this.selectedText, this.selectionPosition);
        }
      }, 150);
    } catch (error) {
      console.warn('Text selection processing failed:', error);
      this.hideTranslateButton();
    }
  }

  /**
   * Validate if the selected text is worth translating
   */
  private isValidTextSelection(text: string): boolean {
    if (!text || text.length < 2) {
      return false;
    }

    // Skip if text is too long
    if (text.length > CONFIG.MAX_TEXT_LENGTH) {
      return false;
    }

    // Skip if text is only whitespace, numbers, or special characters
    if (!/[a-zA-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0400-\u04ff\u0100-\u017f\u1e00-\u1eff]/.test(text)) {
      return false;
    }

    // Skip if text looks like a URL
    if (/^https?:\/\//.test(text) || /^www\./.test(text)) {
      return false;
    }

    // Skip if text looks like an email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      return false;
    }

    // Skip if text is only punctuation
    if (/^[^\w\s]+$/.test(text)) {
      return false;
    }

    return true;
  }

  /**
   * Get the bounds of the current text selection with enhanced error handling
   */
  private getSelectionBounds(selection: Selection | null): { x: number; y: number; width: number; height: number } | null {
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    try {
      const range = selection.getRangeAt(0);

      // Check if range is valid
      if (!range || !range.startContainer || !range.endContainer) {
        return null;
      }

      const rects = range.getClientRects();

      if (rects.length === 0) {
        // Fallback to range bounding rect
        const rect = range.getBoundingClientRect();
        if (!rect || rect.width === 0 && rect.height === 0) {
          return null;
        }
        // getBoundingClientRect() returns viewport coordinates, which is what we want
        return {
          x: rect.left + rect.width / 2,
          y: rect.top,
          width: rect.width,
          height: rect.height
        };
      }

      // Filter out invalid rects
      const validRects = Array.from(rects).filter(rect =>
        rect && rect.width > 0 && rect.height > 0 &&
        rect.left >= -window.innerWidth && rect.top >= -window.innerHeight &&
        rect.right <= window.innerWidth * 2 && rect.bottom <= window.innerHeight * 2
      );

      if (validRects.length === 0) {
        return null;
      }

      // For multi-line selections, use the first valid line for positioning
      const firstRect = validRects[0];
      const lastRect = validRects[validRects.length - 1];

      // Calculate the overall bounds
      const left = Math.min(firstRect.left, lastRect.left);
      const right = Math.max(firstRect.right, lastRect.right);
      const top = firstRect.top;
      const bottom = lastRect.bottom;

      // Don't clamp to viewport here since we want to preserve the actual selection position
      // The positioning logic will handle viewport constraints
      return {
        x: left + (right - left) / 2, // Center horizontally
        y: top, // Use top of first line
        width: right - left,
        height: bottom - top
      };
    } catch (error) {
      console.warn('Failed to get selection bounds:', error);
      return null;
    }
  }

  /**
   * Show translate button at specified position
   */
  private showTranslateButton(text: string, position: { x: number; y: number; width?: number; height?: number }): void {

    // Hide existing button if visible
    this.hideTranslateButton();

    // Create translate button element
    this.translateButton = this.createTranslateButtonElement(text);

    // Add button to document
    document.body.appendChild(this.translateButton);

    // Position button
    this.positionTranslateButton(position);

    // Show button with animation
    setTimeout(() => {
      if (this.translateButton) {
        this.translateButton.style.opacity = '1';
        this.translateButton.style.transform = 'scale(1)';
        this.translateButton.classList.add('visible', 'bounce');
      }
    }, 10);

    // Set up click outside handler to hide button
    setTimeout(() => {
      document.addEventListener('click', this.handleTranslateButtonClickOutside.bind(this), { once: true });
    }, 100);
  }

  /**
   * Create translate button HTML element
   */
  private createTranslateButtonElement(selectedText: string): HTMLElement {
    const button = document.createElement('div');
    button.className = 'chrome-translate-button';

    // Store the selected text in the button element
    button.setAttribute('data-selected-text', selectedText);

    // Use the extension's icon - try different paths for dev and release
    let iconUrl = '';

    const manifest = chrome.runtime.getManifest();
    if (manifest.icons && manifest.icons['16']) {
      iconUrl = chrome.runtime.getURL(manifest.icons['16']);
    }

    button.innerHTML = `
      <div class="chrome-translate-button-logo">
        <img src="${iconUrl}" alt="Translate" />
      </div>
    `;

    // Add tooltip
    button.title = getI18nText('translate');

    // Add click event listener
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const textToTranslate = button.getAttribute('data-selected-text') || '';
      this.handleTranslateButtonClick(textToTranslate);
    });

    return button;
  }

  /**
   * Position translate button near mouse cursor with smart edge detection
   */
  private positionTranslateButton(position: { x: number; y: number; width?: number; height?: number }): void {
    if (!this.translateButton) return;

    const button = this.translateButton;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get scroll position - use multiple methods for better compatibility
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    const buttonSize = 28; // Button is 28x28px
    const offset = 8; // Distance from cursor
    const margin = 12; // Margin from viewport edges

    // position.x and position.y are viewport coordinates from mouse event
    // For absolute positioning, we need page coordinates (viewport + scroll)
    const mousePageX = position.x + scrollX;
    const mousePageY = position.y + scrollY;

    let left: number;
    let top: number;

    // Calculate available space in all directions from mouse position (in viewport coordinates)
    const spaceRight = viewportWidth - position.x;
    const spaceLeft = position.x;
    const spaceBelow = viewportHeight - position.y;
    const spaceAbove = position.y;

    // Determine best position based on available space
    // Priority: bottom-right, bottom-left, top-right, top-left
    if (spaceRight >= buttonSize + margin && spaceBelow >= buttonSize + margin) {
      // Bottom-right of cursor
      left = mousePageX + offset;
      top = mousePageY + offset;
    } else if (spaceLeft >= buttonSize + margin && spaceBelow >= buttonSize + margin) {
      // Bottom-left of cursor
      left = mousePageX - buttonSize - offset;
      top = mousePageY + offset;
    } else if (spaceRight >= buttonSize + margin && spaceAbove >= buttonSize + margin) {
      // Top-right of cursor
      left = mousePageX + offset;
      top = mousePageY - buttonSize - offset;
    } else if (spaceLeft >= buttonSize + margin && spaceAbove >= buttonSize + margin) {
      // Top-left of cursor
      left = mousePageX - buttonSize - offset;
      top = mousePageY - buttonSize - offset;
    } else {
      // Fallback: position at cursor with boundary constraints
      left = mousePageX;
      top = mousePageY - buttonSize - offset;
    }

    // Apply viewport boundary constraints (in page coordinates)
    const minLeft = scrollX + margin;
    const maxLeft = scrollX + viewportWidth - buttonSize - margin;
    const minTop = scrollY + margin;
    const maxTop = scrollY + viewportHeight - buttonSize - margin;

    left = Math.max(minLeft, Math.min(left, maxLeft));
    top = Math.max(minTop, Math.min(top, maxTop));

    // Ensure the button uses absolute positioning relative to the document
    button.style.position = 'absolute';
    button.style.left = `${Math.round(left)}px`;
    button.style.top = `${Math.round(top)}px`;
    button.style.zIndex = '2147483647'; // Maximum z-index

    console.log('Button positioned at:', {
      finalPosition: { left: Math.round(left), top: Math.round(top) },
      mouseViewport: { x: position.x, y: position.y },
      mousePage: { x: mousePageX, y: mousePageY },
      scroll: { x: scrollX, y: scrollY },
      spaces: { right: spaceRight, left: spaceLeft, below: spaceBelow, above: spaceAbove },
      constraints: { minLeft, maxLeft, minTop, maxTop }
    });
  }

  /**
   * Handle translate button click
   */
  private handleTranslateButtonClick(textToTranslate: string): void {
    console.log('Translate button clicked! Text to translate:', textToTranslate);

    // Set interaction flag to prevent button flickering
    this.isButtonInteraction = true;

    if (!textToTranslate) {
      console.warn('No text available for translation');
      this.isButtonInteraction = false;
      return;
    }

    // Hide the button
    this.hideTranslateButton();

    // Show translation tooltip and start translation
    this.showTranslationTooltip(textToTranslate, this.selectionPosition);
    this.translateSelectedText(textToTranslate);

    // Reset interaction flag after a delay
    setTimeout(() => {
      this.isButtonInteraction = false;
    }, 500);
  }

  /**
   * Handle click outside translate button to hide it
   */
  private handleTranslateButtonClickOutside(event: Event): void {
    const target = event.target as Element;

    // Don't hide if clicking on the button itself
    if (this.translateButton && this.translateButton.contains(target)) {
      // Re-add the click outside listener
      setTimeout(() => {
        document.addEventListener('click', this.handleTranslateButtonClickOutside.bind(this), { once: true });
      }, 100);
      return;
    }

    // Hide button
    this.hideTranslateButton();
  }

  /**
   * Hide translate button with animation
   */
  private hideTranslateButton(): void {
    if (this.translateButton) {
      this.translateButton.style.opacity = '0';
      this.translateButton.style.transform = 'scale(0.8)';

      setTimeout(() => {
        if (this.translateButton && this.translateButton.parentNode) {
          this.translateButton.parentNode.removeChild(this.translateButton);
        }
        this.translateButton = null;
      }, 200);
    }
  }

  /**
   * Show translation tooltip at specified position
   */
  public showTranslationTooltip(text: string, position: { x: number; y: number; width?: number; height?: number }): void {
    // Hide existing tooltip if visible
    this.hideTooltip();

    // Create tooltip element
    this.tooltip = this.createTooltipElement(text);

    // Add tooltip to document
    document.body.appendChild(this.tooltip);

    // Position tooltip
    this.positionTooltip(position);

    // Show tooltip with animation
    setTimeout(() => {
      if (this.tooltip) {
        this.tooltip.classList.add('visible');
      }
    }, 10);

    // Set up click outside handler to hide tooltip
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside.bind(this), { once: true });
    }, 100);
  }

  /**
   * Create tooltip HTML element
   */
  private createTooltipElement(text: string): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.className = 'chrome-translate-tooltip';

    // Store the original text in the tooltip element
    tooltip.setAttribute('data-original-text', text);

    tooltip.innerHTML = `
      <div class="chrome-translate-tooltip-header">
        <span class="chrome-translate-tooltip-title">${getI18nText('translate')}</span>
        <button class="chrome-translate-tooltip-close" title="${getI18nText('close')}" aria-label="${getI18nText('close')}">×</button>
      </div>
      <div class="chrome-translate-tooltip-content">
        <div class="chrome-translate-tooltip-original">${this.escapeHtml(text)}</div>
        <div class="chrome-translate-tooltip-loading">
          <div class="chrome-translate-tooltip-spinner"></div>
          <span>${getI18nText('translatingText')}</span>
        </div>
      </div>
      <div class="chrome-translate-tooltip-actions">
        <button class="chrome-translate-tooltip-button" disabled>${getI18nText('translating')}</button>
      </div>
    `;

    // Add event listeners
    const closeButton = tooltip.querySelector('.chrome-translate-tooltip-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hideTooltip());
    }

    // Prevent tooltip from closing when clicking inside it
    tooltip.addEventListener('click', (e) => e.stopPropagation());

    // Setup initial scroll detection
    setTimeout(() => {
      this.setupScrollDetection();
    }, 50);

    return tooltip;
  }

  /**
   * Position tooltip relative to selection with smart positioning
   */
  private positionTooltip(position: { x: number; y: number; width?: number; height?: number }): void {
    if (!this.tooltip) return;

    const tooltip = this.tooltip;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Force a layout to get accurate dimensions
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'block';
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || 320;
    const tooltipHeight = tooltipRect.height || 180;
    tooltip.style.visibility = '';
    tooltip.style.display = '';

    const selectionWidth = position.width || 0;
    const selectionHeight = position.height || 20;
    const offset = 16; // Offset from selection
    const margin = 20; // Margin from viewport edges

    // Convert viewport coordinates to page coordinates
    const selectionPageX = position.x + scrollX;
    const selectionPageY = position.y + scrollY;

    // Calculate available space in all directions (in viewport coordinates)
    const spaceAbove = position.y;
    const spaceBelow = viewportHeight - (position.y + selectionHeight);
    const spaceLeft = position.x;
    const spaceRight = viewportWidth - position.x;

    let left: number;
    let top: number;
    let placement = 'above'; // 'above', 'below', 'left', 'right'

    // Determine the best placement based on available space
    const needsHeight = tooltipHeight + offset + margin;
    const needsWidth = tooltipWidth + margin * 2;

    if (spaceBelow >= needsHeight) {
      // Prefer below if there's enough space
      placement = 'below';
      top = selectionPageY + selectionHeight + offset;
      left = selectionPageX - tooltipWidth / 2; // Initialize left for above/below placements
    } else if (spaceAbove >= needsHeight) {
      // Use above if there's enough space
      placement = 'above';
      top = selectionPageY - tooltipHeight - offset;
      left = selectionPageX - tooltipWidth / 2; // Initialize left for above/below placements
    } else if (spaceRight >= needsWidth && spaceRight > spaceLeft) {
      // Try right side
      placement = 'right';
      left = selectionPageX + selectionWidth / 2 + offset;
      top = selectionPageY + selectionHeight / 2 - tooltipHeight / 2;
    } else if (spaceLeft >= needsWidth) {
      // Try left side
      placement = 'left';
      left = selectionPageX - selectionWidth / 2 - tooltipWidth - offset;
      top = selectionPageY + selectionHeight / 2 - tooltipHeight / 2;
    } else {
      // Fallback: use the side with more space, but constrain to viewport
      if (spaceBelow > spaceAbove) {
        placement = 'below';
        top = Math.min(selectionPageY + selectionHeight + offset, scrollY + viewportHeight - tooltipHeight - margin);
        left = selectionPageX - tooltipWidth / 2; // Initialize left for fallback
      } else {
        placement = 'above';
        top = Math.max(selectionPageY - tooltipHeight - offset, scrollY + margin);
        left = selectionPageX - tooltipWidth / 2; // Initialize left for fallback
      }
    }

    // Calculate horizontal position for above/below placements
    if (placement === 'above' || placement === 'below') {
      left = selectionPageX - tooltipWidth / 2;

      // Adjust horizontal position if tooltip goes outside viewport
      if (left < scrollX + margin) {
        left = scrollX + margin;
      } else if (left + tooltipWidth > scrollX + viewportWidth - margin) {
        left = scrollX + viewportWidth - tooltipWidth - margin;
      }
    }

    // Ensure vertical position is within viewport for side placements
    if (placement === 'left' || placement === 'right') {
      if (top < scrollY + margin) {
        top = scrollY + margin;
      } else if (top + tooltipHeight > scrollY + viewportHeight - margin) {
        top = scrollY + viewportHeight - tooltipHeight - margin;
      }
    }

    // Apply positioning using page coordinates
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;

    // Update tooltip classes based on placement
    tooltip.classList.remove('below-selection', 'above-selection', 'left-selection', 'right-selection');
    tooltip.classList.add(`${placement}-selection`);

    // Calculate arrow position for above/below placements
    if (placement === 'above' || placement === 'below') {
      const arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, selectionPageX - left));
      tooltip.style.setProperty('--arrow-offset', `${arrowLeft}px`);
    } else {
      // For side placements, center the arrow vertically
      const arrowTop = Math.max(20, Math.min(tooltipHeight - 20, (selectionPageY + selectionHeight / 2) - top));
      tooltip.style.setProperty('--arrow-offset', `${arrowTop}px`);
    }

    console.log('Tooltip positioned:', {
      placement,
      left: Math.round(left),
      top: Math.round(top),
      spaceAbove,
      spaceBelow,
      spaceLeft,
      spaceRight,
      tooltipSize: { width: tooltipWidth, height: tooltipHeight }
    });
  }

  /**
   * Hide tooltip with animation
   */
  private hideTooltip(): void {
    // Remove all existing tooltip elements
    const existingTooltips = document.querySelectorAll('.chrome-translate-tooltip');
    existingTooltips.forEach(tooltip => {
      if (tooltip.parentNode) {
        // Add fade-out animation
        (tooltip as HTMLElement).style.opacity = '0';
        (tooltip as HTMLElement).style.transform = 'translateY(-8px) scale(0.95)';
        // Remove after animation completes
        setTimeout(() => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        }, 250);
      }
    });

    // Clear the current tooltip reference
    this.tooltip = null;
  }

  /**
   * Handle click outside tooltip to hide it
   */
  private handleClickOutside(event: Event): void {
    const target = event.target as Element;

    // Don't hide if clicking on the tooltip itself
    if (this.tooltip && this.tooltip.contains(target)) {
      // Re-add the click outside listener
      setTimeout(() => {
        document.addEventListener('click', this.handleClickOutside.bind(this), { once: true });
      }, 100);
      return;
    }

    // Hide tooltip
    this.hideTooltip();
  }

  /**
   * Update tooltip with translation result
   */
  public updateTooltipWithResult(translatedText: string): void {
    if (!this.tooltip) return;

    // Get the original text from the tooltip element
    const originalText = this.tooltip.getAttribute('data-original-text') || '';

    const content = this.tooltip.querySelector('.chrome-translate-tooltip-content');
    const actions = this.tooltip.querySelector('.chrome-translate-tooltip-actions');

    if (content) {
      content.innerHTML = `
        <div class="chrome-translate-tooltip-original">${this.escapeHtml(originalText)}</div>
        <div class="chrome-translate-tooltip-result">${this.escapeHtml(translatedText)}</div>
      `;

      // Add scroll detection for visual feedback
      setTimeout(() => {
        this.setupScrollDetection();
      }, 50);
    }

    if (actions) {
      actions.innerHTML = `
        <button class="chrome-translate-tooltip-button secondary" title="${getI18nText('copyTooltip')}">${getI18nText('copy')}</button>
      `;

      // Add event listeners for action buttons
      const copyButton = actions.querySelector('.chrome-translate-tooltip-button.secondary');

      if (copyButton) {
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(translatedText).then(() => {
            const originalText = (copyButton as HTMLElement).textContent;
            (copyButton as HTMLElement).textContent = getI18nText('copied');
            (copyButton as HTMLElement).style.background = 'linear-gradient(135deg, #34a853 0%, #137333 100%)';
            setTimeout(() => {
              (copyButton as HTMLElement).textContent = originalText;
              (copyButton as HTMLElement).style.background = '';
            }, 1500);
          }).catch(() => {
            (copyButton as HTMLElement).textContent = getI18nText('copyFailed');
            setTimeout(() => {
              (copyButton as HTMLElement).textContent = getI18nText('copy');
            }, 1500);
          });
        });
      }
    }

    // Re-position tooltip after content update since height may have changed
    this.scheduleRepositioning();
  }

  /**
   * Update tooltip with error message
   */
  public updateTooltipWithError(errorMessage: string): void {
    if (!this.tooltip) return;

    // Get the original text from the tooltip element
    const originalText = this.tooltip.getAttribute('data-original-text') || '';

    const content = this.tooltip.querySelector('.chrome-translate-tooltip-content');
    const actions = this.tooltip.querySelector('.chrome-translate-tooltip-actions');

    if (content) {
      content.innerHTML = `
        <div class="chrome-translate-tooltip-original">${this.escapeHtml(originalText)}</div>
        <div class="chrome-translate-tooltip-error">⚠️ ${this.escapeHtml(errorMessage)}</div>
      `;

      // Add scroll detection for visual feedback
      setTimeout(() => {
        this.setupScrollDetection();
      }, 50);
    }

    if (actions) {
      actions.innerHTML = `
        <button class="chrome-translate-tooltip-button secondary" title="${getI18nText('close')}">${getI18nText('close')}</button>
      `;

      // Add close button event listener
      const closeButton = actions.querySelector('.chrome-translate-tooltip-button.secondary');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.hideTooltip();
        });
      }
    }

    // Re-position tooltip after content update
    this.scheduleRepositioning();
  }

  /**
   * Translate selected text
   */
  private async translateSelectedText(text: string): Promise<void> {
    try {
      // Get user settings to determine target language and set UI language
      const settingsMessage: Message = {
        type: MessageType.GET_SETTINGS,
        requestId: this.generateRequestId()
      };
      
      const settingsResponse = await this.sendMessageToBackground(settingsMessage);
      if (settingsResponse.success && settingsResponse.data?.defaultTargetLanguage) {
        setContentUILanguage(settingsResponse.data.defaultTargetLanguage);
      }
      
      // Send translation request to background script
      const message: Message = {
        type: MessageType.TRANSLATE_SELECTED,
        data: { text },
        requestId: this.generateRequestId()
      };

      const response = await this.sendMessageToBackground(message);

      if (response.success && response.data) {
        this.handleTranslationResult(response.data);
      } else {
        this.handleTranslationError(response.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      this.handleTranslationError(error instanceof Error ? error.message : 'Translation failed');
    }
  }

  /**
   * Send message to background script
   */
  private async sendMessageToBackground(message: Message): Promise<MessageResponse> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response: MessageResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Handle translation result from background script
   */
  private handleTranslationResult(result: any): void {
    if (result && result.translatedText) {
      this.updateTooltipWithResult(result.translatedText);
    } else {
      this.handleTranslationError('Invalid translation result');
    }
  }

  /**
   * Handle translation error with retry logic
   */
  private handleTranslationError(error: string | TranslationError): void {
    const translationError = this.parseError(error);

    // Show final error message
    this.updateTooltipWithError(translationError.message);
  }

  /**
   * Parse error into TranslationError format
   */
  private parseError(error: string | TranslationError): TranslationError {
    if (typeof error === 'object' && error.type) {
      return error;
    }

    const errorString = typeof error === 'string' ? error : String(error);
    const lowerError = errorString.toLowerCase();

    if (lowerError.includes('api_unavailable') || lowerError.includes('api') && lowerError.includes('unavailable')) {
      return {
        type: TranslationErrorType.API_UNAVAILABLE,
        message: ERROR_MESSAGES.API_UNAVAILABLE,
      };
    }

    if (lowerError.includes('network_error') || lowerError.includes('network')) {
      return {
        type: TranslationErrorType.NETWORK_ERROR,
        message: ERROR_MESSAGES.NETWORK_ERROR,
      };
    }

    if (lowerError.includes('text_too_long') || lowerError.includes('too long')) {
      return {
        type: TranslationErrorType.TEXT_TOO_LONG,
        message: ERROR_MESSAGES.TEXT_TOO_LONG,
      };
    }

    if (lowerError.includes('quota_exceeded') || lowerError.includes('quota')) {
      return {
        type: TranslationErrorType.QUOTA_EXCEEDED,
        message: ERROR_MESSAGES.QUOTA_EXCEEDED,
      };
    }

    if (lowerError.includes('invalid_language') || lowerError.includes('language')) {
      return {
        type: TranslationErrorType.INVALID_LANGUAGE,
        message: ERROR_MESSAGES.INVALID_LANGUAGE,
      };
    }

    // Default to network error (retryable)
    return {
      type: TranslationErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES.TRANSLATION_FAILED,
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Schedule tooltip repositioning with debouncing
   */
  private scheduleRepositioning(): void {
    if (this.repositionTimeout) {
      clearTimeout(this.repositionTimeout);
    }

    this.repositionTimeout = window.setTimeout(() => {
      if (this.tooltip) {
        this.positionTooltip(this.selectionPosition);
      }
      this.repositionTimeout = null;
    }, 50);
  }

  /**
   * Setup scroll detection for content areas
   */
  private setupScrollDetection(): void {
    if (!this.tooltip) return;

    const originalElement = this.tooltip.querySelector('.chrome-translate-tooltip-original') as HTMLElement;
    const resultElement = this.tooltip.querySelector('.chrome-translate-tooltip-result') as HTMLElement;
    const errorElement = this.tooltip.querySelector('.chrome-translate-tooltip-error') as HTMLElement;

    // Check and setup scroll detection for each element
    [originalElement, resultElement, errorElement].forEach(element => {
      if (element) {
        this.checkScrollable(element);

        // Add scroll event listener to update fade effect
        element.addEventListener('scroll', () => {
          this.updateScrollFade(element);
        });
      }
    });
  }

  /**
   * Check if element is scrollable and add appropriate class
   */
  private checkScrollable(element: HTMLElement): void {
    if (element.scrollHeight > element.clientHeight) {
      element.classList.add('has-scroll');
      this.updateScrollFade(element);
    } else {
      element.classList.remove('has-scroll');
    }
  }

  /**
   * Update scroll fade effect based on scroll position
   */
  private updateScrollFade(element: HTMLElement): void {
    const isScrolledToBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 2;

    if (isScrolledToBottom) {
      element.classList.remove('has-scroll');
    } else {
      element.classList.add('has-scroll');
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== Full Page Translation Methods ==========

  private translatableElements: TranslatableElement[] = [];
  private originalTexts: Map<string, string> = new Map();
  private progressOverlay: HTMLElement | null = null;
  private isTranslating: boolean = false;
  private currentTargetLanguage: string = 'en';

  /**
   * Translate full page
   */
  public async translateFullPage(targetLang?: string): Promise<void> {
    if (this.isTranslating) {
      console.log('Translation already in progress');
      return;
    }

    try {
      this.isTranslating = true;
      this.currentTargetLanguage = targetLang || 'en';
      
      // Set UI language based on target language
      setContentUILanguage(this.currentTargetLanguage);

      // Find all translatable elements
      this.findTranslatableElements();

      if (this.translatableElements.length === 0) {
        console.log('No translatable elements found');
        return;
      }

      // Show floating progress indicator instead of overlay
      this.showFloatingProgress();

      // Translate elements one by one with real-time updates
      await this.translateElementsRealtime();

      // Hide floating progress indicator
      this.hideFloatingProgress();

      console.log(`Full page translation completed: ${this.translatableElements.length} elements translated`);

    } catch (error) {
      console.error('Full page translation failed:', error);
      this.hideFloatingProgress();
      this.showTranslationError('Failed to translate full page');
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Find all translatable elements on the page
   */
  private findTranslatableElements(): void {
    this.translatableElements = [];
    this.originalTexts.clear();

    // Define selectors for translatable elements
    const selectors = [
      'h1, h2, h3, h4, h5, h6',           // Headings
      'p',                                 // Paragraphs
      'li',                               // List items
      'a[href]:not([href^="javascript:"])', // Links (excluding javascript links)
      'button:not([aria-hidden="true"])',  // Buttons
      'label',                            // Labels
      'span:not([class*="icon"]):not([aria-hidden="true"])', // Spans (excluding icons)
      'div:not([class*="icon"]):not([aria-hidden="true"])',  // Divs (excluding icons)
      '[title]',                          // Elements with title attributes
      '[placeholder]',                    // Elements with placeholder attributes
      '[alt]'                            // Elements with alt attributes
    ];

    const elements = document.querySelectorAll(selectors.join(', '));

    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;

      // Skip if element is not visible or has no meaningful text
      if (!this.isElementTranslatable(htmlElement)) {
        return;
      }

      const text = this.extractTextContent(htmlElement);
      if (!text || text.length < 2) {
        return;
      }

      // Skip if text is too long for single translation
      if (text.length > CONFIG.MAX_TEXT_LENGTH) {
        return;
      }

      const elementId = `translatable-${index}-${Date.now()}`;
      htmlElement.setAttribute('data-translation-id', elementId);

      const translatableElement: TranslatableElement = {
        element: htmlElement,
        originalText: text,
        priority: this.getElementPriority(htmlElement),
        elementId,
        tagName: htmlElement.tagName.toLowerCase(),
        isVisible: this.isElementVisible(htmlElement)
      };

      this.translatableElements.push(translatableElement);
      this.originalTexts.set(elementId, text);
    });

    // Sort by priority (higher priority first)
    this.translatableElements.sort((a, b) => a.priority - b.priority);

    console.log(`Found ${this.translatableElements.length} translatable elements`);
  }

  /**
   * Check if element is translatable
   */
  private isElementTranslatable(element: HTMLElement): boolean {
    // Skip hidden elements
    if (element.style.display === 'none' || element.style.visibility === 'hidden') {
      return false;
    }

    // Skip elements that are likely decorative
    if (element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    // Skip script and style elements
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) {
      return false;
    }

    // Skip elements that are likely icons or decorative
    const className = element.className.toLowerCase();
    if (className.includes('icon') || className.includes('svg') || className.includes('emoji')) {
      return false;
    }

    // Skip elements already translated
    if (element.hasAttribute('data-translation-id')) {
      return false;
    }

    return true;
  }

  /**
   * Extract meaningful text content from element
   */
  private extractTextContent(element: HTMLElement): string {
    let text = '';

    // Handle different element types
    switch (element.tagName.toLowerCase()) {
      case 'input':
        const input = element as HTMLInputElement;
        text = input.placeholder || input.value || input.title || '';
        break;
      case 'textarea':
        const textarea = element as HTMLTextAreaElement;
        text = textarea.placeholder || textarea.value || '';
        break;
      case 'img':
        const img = element as HTMLImageElement;
        text = img.alt || img.title || '';
        break;
      default:
        // Get direct text content, excluding nested elements
        text = this.getDirectTextContent(element);

        // Fallback to title or other attributes
        if (!text) {
          text = element.title || element.getAttribute('aria-label') || '';
        }
        break;
    }

    return text.trim();
  }

  /**
   * Get direct text content of element (excluding nested elements)
   */
  private getDirectTextContent(element: HTMLElement): string {
    let text = '';

    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      }
    }

    return text.trim();
  }

  /**
   * Get element priority for translation ordering
   */
  private getElementPriority(element: HTMLElement): number {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'title':
      case 'h1':
        return ElementPriority.TITLE;
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return ElementPriority.HEADING;
      case 'p':
      case 'div':
        return ElementPriority.PARAGRAPH;
      case 'li':
      case 'ul':
      case 'ol':
        return ElementPriority.LIST;
      case 'a':
        return ElementPriority.LINK;
      case 'button':
      case 'input':
        return ElementPriority.BUTTON;
      case 'label':
      case 'span':
      case 'small':
        return ElementPriority.LABEL;
      default:
        return ElementPriority.OTHER;
    }
  }

  /**
   * Check if element is visible in viewport
   */
  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
      rect.top < window.innerHeight && rect.bottom > 0;
  }

  /**
   * Translate elements in real-time with visual feedback
   */
  private async translateElementsRealtime(): Promise<void> {
    let translatedCount = 0;

    for (let i = 0; i < this.translatableElements.length; i++) {
      if (!this.isTranslating) {
        break; // Translation was cancelled
      }

      const element = this.translatableElements[i];

      // Highlight current element being translated
      this.highlightTranslatingElement(element.element);

      // Update progress
      const progress: TranslationProgress = {
        totalElements: this.translatableElements.length,
        translatedElements: translatedCount,
        currentElement: this.truncateText(element.originalText, 50),
        percentage: Math.round((translatedCount / this.translatableElements.length) * 100)
      };
      this.updateFloatingProgress(progress);

      try {
        // Translate single element
        const result = await this.translateSingleElement(element);

        if (result && result.translatedText) {
          // Apply translation immediately
          this.applyTranslationToElement(element, result.translatedText);
          translatedCount++;

          // Show translation animation
          this.showTranslationAnimation(element.element);
        }
      } catch (error) {
        console.error('Failed to translate element:', error);
        // Continue with next element
      }

      // Remove highlight
      this.removeTranslatingHighlight(element.element);

      // Small delay to make the process visible
      await this.delay(50);
    }

    // Final progress update
    const finalProgress: TranslationProgress = {
      totalElements: this.translatableElements.length,
      translatedElements: translatedCount,
      currentElement: getI18nText('completed'),
      percentage: 100
    };
    this.updateFloatingProgress(finalProgress);
  }

  /**
   * Apply translation to a specific element
   */
  private applyTranslationToElement(item: TranslatableElement, translatedText: string): void {
    const { element, originalText } = item;

    try {
      // Store original text if not already stored
      if (!this.originalTexts.has(item.elementId)) {
        this.originalTexts.set(item.elementId, originalText);
      }

      // Apply translation based on element type
      switch (element.tagName.toLowerCase()) {
        case 'input':
          const input = element as HTMLInputElement;
          if (input.placeholder === originalText) {
            input.placeholder = `${originalText} | ${translatedText}`;
          } else if (input.value === originalText) {
            input.value = `${originalText} | ${translatedText}`;
          } else if (input.title === originalText) {
            input.title = `${originalText} | ${translatedText}`;
          }
          break;

        case 'textarea':
          const textarea = element as HTMLTextAreaElement;
          if (textarea.placeholder === originalText) {
            textarea.placeholder = `${originalText} | ${translatedText}`;
          } else if (textarea.value === originalText) {
            textarea.value = `${originalText} | ${translatedText}`;
          }
          break;

        case 'img':
          const img = element as HTMLImageElement;
          if (img.alt === originalText) {
            img.alt = `${originalText} | ${translatedText}`;
          } else if (img.title === originalText) {
            img.title = `${originalText} | ${translatedText}`;
          }
          break;

        default:
          // For text content elements, append translation after original text
          this.appendTranslationToElement(element, originalText, translatedText);
          break;
      }

      // Mark element as translated
      element.classList.add(CSS_CLASSES.TRANSLATED_ELEMENT);
      element.setAttribute('data-original-text', originalText);
      element.setAttribute('data-translated-text', translatedText);

    } catch (error) {
      console.error('Failed to apply translation to element:', error);
    }
  }

  /**
   * Append translation to element while preserving original text
   */
  private appendTranslationToElement(element: HTMLElement, originalText: string, translatedText: string): void {
    try {
      // Create a translation container to hold both original and translated text
      const translationContainer = document.createElement('span');
      translationContainer.className = 'chrome-translation-container';
      
      // Create original text span
      const originalSpan = document.createElement('span');
      originalSpan.className = 'chrome-translation-original';
      originalSpan.textContent = originalText;
      
      // Create separator
      const separator = document.createElement('span');
      separator.className = 'chrome-translation-separator';
      separator.textContent = ' | ';
      
      // Create translated text span
      const translatedSpan = document.createElement('span');
      translatedSpan.className = 'chrome-translation-translated';
      translatedSpan.textContent = translatedText;
      
      // Assemble the container
      translationContainer.appendChild(originalSpan);
      translationContainer.appendChild(separator);
      translationContainer.appendChild(translatedSpan);
      
      // Find and replace the original text content
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node as Text);
      }

      // For simple cases with single text node
      if (textNodes.length === 1 && textNodes[0].textContent?.trim() === originalText) {
        const parentNode = textNodes[0].parentNode;
        if (parentNode) {
          parentNode.replaceChild(translationContainer, textNodes[0]);
        }
        return;
      }

      // For more complex cases, try to find the best text node to replace
      let bestMatch: Text | null = null;
      let bestMatchScore = 0;

      for (const textNode of textNodes) {
        const nodeText = textNode.textContent?.trim() || '';
        if (nodeText && originalText.includes(nodeText)) {
          const score = nodeText.length / originalText.length;
          if (score > bestMatchScore) {
            bestMatch = textNode;
            bestMatchScore = score;
          }
        }
      }

      if (bestMatch && bestMatch.parentNode) {
        bestMatch.parentNode.replaceChild(translationContainer, bestMatch);
      } else {
        // Fallback: append to the element
        element.appendChild(translationContainer);
      }

    } catch (error) {
      console.error('Failed to append translation to element:', error);
      // Fallback to simple text replacement
      element.textContent = `${originalText} | ${translatedText}`;
    }
  }

  /**
   * Restore original page content
   */
  public restoreOriginalPage(): void {
    console.log('Restoring original page content');

    // Restore all translated elements
    this.translatableElements.forEach(item => {
      const { element, elementId } = item;
      const originalText = this.originalTexts.get(elementId);

      if (originalText) {
        try {
          // Restore based on element type
          switch (element.tagName.toLowerCase()) {
            case 'input':
              const input = element as HTMLInputElement;
              if (input.placeholder && input.placeholder.includes(' | ')) {
                input.placeholder = originalText;
              } else if (input.value && input.value.includes(' | ')) {
                input.value = originalText;
              } else if (input.title && input.title.includes(' | ')) {
                input.title = originalText;
              }
              break;

            case 'textarea':
              const textarea = element as HTMLTextAreaElement;
              if (textarea.placeholder && textarea.placeholder.includes(' | ')) {
                textarea.placeholder = originalText;
              } else if (textarea.value && textarea.value.includes(' | ')) {
                textarea.value = originalText;
              }
              break;

            case 'img':
              const img = element as HTMLImageElement;
              if (img.alt && img.alt.includes(' | ')) {
                img.alt = originalText;
              } else if (img.title && img.title.includes(' | ')) {
                img.title = originalText;
              }
              break;

            default:
              // Restore text content by removing translation containers
              this.restoreTextContent(element, originalText);
              break;
          }

          // Remove translation markers
          element.classList.remove(CSS_CLASSES.TRANSLATED_ELEMENT);
          element.removeAttribute('data-original-text');
          element.removeAttribute('data-translated-text');
          element.removeAttribute('data-translation-id');

        } catch (error) {
          console.error('Failed to restore element:', error);
        }
      }
    });

    // Clear data
    this.translatableElements = [];
    this.originalTexts.clear();
    this.isTranslating = false;

    console.log('Original page content restored');
  }

  /**
   * Restore text content of element
   */
  private restoreTextContent(element: HTMLElement, originalText: string): void {
    try {
      // Look for translation containers and replace them with original text
      const translationContainers = element.querySelectorAll('.chrome-translation-container');
      
      if (translationContainers.length > 0) {
        // Replace each translation container with original text
        translationContainers.forEach(container => {
          const textNode = document.createTextNode(originalText);
          if (container.parentNode) {
            container.parentNode.replaceChild(textNode, container);
          }
        });
      } else {
        // Fallback: check if the element contains the combined text pattern
        const currentText = element.textContent?.trim() || '';
        if (currentText.includes(' | ')) {
          // Try to extract original text from the combined format
          const parts = currentText.split(' | ');
          if (parts.length >= 2 && parts[0].trim() === originalText) {
            element.textContent = originalText;
          }
        } else if (currentText !== originalText) {
          // If text doesn't match and no translation container found, restore original
          element.textContent = originalText;
        }
      }
    } catch (error) {
      console.error('Failed to restore text content:', error);
      // Fallback: simply set the original text
      element.textContent = originalText;
    }
  }

  /**
   * Show floating progress indicator
   */
  private showFloatingProgress(): void {
    this.hideFloatingProgress(); // Remove any existing indicator

    this.progressOverlay = document.createElement('div');
    this.progressOverlay.className = 'chrome-translation-floating-progress';
    this.progressOverlay.innerHTML = `
      <div class="chrome-translation-floating-content">
        <div class="chrome-translation-floating-header">
          <span class="chrome-translation-floating-icon">🌐</span>
          <span class="chrome-translation-floating-title">${getI18nText('translating')}</span>
          <button class="chrome-translation-floating-close" title="${getI18nText('cancelTranslation')}">×</button>
        </div>
        <div class="chrome-translation-floating-progress">
          <div class="chrome-translation-floating-bar">
            <div class="chrome-translation-floating-fill"></div>
          </div>
          <div class="chrome-translation-floating-text">${getI18nText('preparing')}</div>
          <div class="chrome-translation-floating-stats">
            <span class="chrome-translation-floating-current">0</span> / 
            <span class="chrome-translation-floating-total">0</span>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = this.progressOverlay.querySelector('.chrome-translation-floating-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.cancelTranslation();
      });
    }

    // Make it draggable
    this.makeFloatingProgressDraggable();

    document.body.appendChild(this.progressOverlay);

    // Show with animation
    setTimeout(() => {
      if (this.progressOverlay) {
        this.progressOverlay.classList.add('visible');
      }
    }, 10);
  }

  /**
   * Hide floating progress indicator
   */
  private hideFloatingProgress(): void {
    if (this.progressOverlay) {
      this.progressOverlay.classList.remove('visible');
      setTimeout(() => {
        if (this.progressOverlay && this.progressOverlay.parentNode) {
          this.progressOverlay.parentNode.removeChild(this.progressOverlay);
          this.progressOverlay = null;
        }
      }, 300);
    }
  }

  /**
   * Update floating progress display
   */
  private updateFloatingProgress(progress: TranslationProgress): void {
    if (!this.progressOverlay) return;

    const progressFill = this.progressOverlay.querySelector('.chrome-translation-floating-fill') as HTMLElement;
    const progressText = this.progressOverlay.querySelector('.chrome-translation-floating-text') as HTMLElement;
    const currentSpan = this.progressOverlay.querySelector('.chrome-translation-floating-current') as HTMLElement;
    const totalSpan = this.progressOverlay.querySelector('.chrome-translation-floating-total') as HTMLElement;

    if (progressFill) {
      progressFill.style.width = `${progress.percentage}%`;
    }

    if (progressText) {
      progressText.textContent = progress.currentElement;
    }

    if (currentSpan) {
      currentSpan.textContent = progress.translatedElements.toString();
    }

    if (totalSpan) {
      totalSpan.textContent = progress.totalElements.toString();
    }
  }

  /**
   * Cancel ongoing translation
   */
  private cancelTranslation(): void {
    this.isTranslating = false;
    this.hideFloatingProgress();
    console.log('Translation cancelled by user');
  }

  /**
   * Show full page translation progress
   */
  public showFullPageProgress(progress: TranslationProgress): void {
    this.updateFloatingProgress(progress);
  }

  /**
   * Show translation error
   */
  private showTranslationError(message: string): void {
    // Create error notification
    const errorNotification = document.createElement('div');
    errorNotification.className = 'chrome-translation-error-notification';
    errorNotification.innerHTML = `
      <div class="chrome-translation-error-content">
        <span class="chrome-translation-error-icon">⚠️</span>
        <span class="chrome-translation-error-message">${this.escapeHtml(message)}</span>
        <button class="chrome-translation-error-close">×</button>
      </div>
    `;

    // Add close functionality
    const closeBtn = errorNotification.querySelector('.chrome-translation-error-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (errorNotification.parentNode) {
          errorNotification.parentNode.removeChild(errorNotification);
        }
      });
    }

    document.body.appendChild(errorNotification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorNotification.parentNode) {
        errorNotification.parentNode.removeChild(errorNotification);
      }
    }, 5000);
  }

  /**
   * Translate single element
   */
  private async translateSingleElement(element: TranslatableElement): Promise<any> {
    try {
      const message: Message = {
        type: MessageType.TRANSLATE_TEXT,
        data: {
          text: element.originalText,
          targetLang: this.currentTargetLanguage
        },
        requestId: this.generateRequestId()
      };

      const response = await this.sendMessageToBackground(message);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Single element translation error:', error);
      return null;
    }
  }

  /**
   * Highlight element being translated
   */
  private highlightTranslatingElement(element: HTMLElement): void {
    element.classList.add(CSS_CLASSES.TRANSLATING_ELEMENT);
    element.style.setProperty('--translation-highlight', 'rgba(66, 133, 244, 0.2)');
  }

  /**
   * Remove translating highlight
   */
  private removeTranslatingHighlight(element: HTMLElement): void {
    element.classList.remove(CSS_CLASSES.TRANSLATING_ELEMENT);
    element.style.removeProperty('--translation-highlight');
  }

  /**
   * Show translation animation
   */
  private showTranslationAnimation(element: HTMLElement): void {
    element.classList.add('chrome-translation-animated');
    setTimeout(() => {
      element.classList.remove('chrome-translation-animated');
    }, 600);
  }



  /**
   * Make floating progress draggable
   */
  private makeFloatingProgressDraggable(): void {
    if (!this.progressOverlay) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const header = this.progressOverlay.querySelector('.chrome-translation-floating-header') as HTMLElement;
    if (!header) return;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = this.progressOverlay!.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !this.progressOverlay) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newX = initialX + deltaX;
      const newY = initialY + deltaY;

      // Keep within viewport bounds
      const maxX = window.innerWidth - this.progressOverlay.offsetWidth;
      const maxY = window.innerHeight - this.progressOverlay.offsetHeight;

      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      this.progressOverlay.style.left = `${clampedX}px`;
      this.progressOverlay.style.top = `${clampedY}px`;
      this.progressOverlay.style.right = 'auto';
      this.progressOverlay.style.bottom = 'auto';
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  /**
   * Truncate text for display
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Enhanced initialization with multiple fallbacks
let contentScriptInstance: ContentScript | null = null;

function initializeContentScript() {
  // Prevent multiple instances
  if (contentScriptInstance) {
    return;
  }

  try {
    // Check if we're in a valid context
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Skip initialization in certain contexts
    if (window.location.protocol === 'chrome-extension:' ||
      window.location.protocol === 'moz-extension:' ||
      window.location.protocol === 'chrome:' ||
      window.location.protocol === 'about:') {
      return;
    }

    // Skip if document is not available or is in an invalid state
    if (!document.documentElement || document.documentElement.tagName !== 'HTML') {
      return;
    }

    contentScriptInstance = new ContentScript();
    console.log('Content script initialized successfully');
  } catch (error) {
    console.error('Content script initialization failed:', error);
    // Retry after a delay
    setTimeout(() => {
      contentScriptInstance = null;
      initializeContentScript();
    }, 1000);
  }
}

// Multiple initialization strategies for better compatibility
function setupInitialization() {
  // Strategy 1: Immediate initialization if DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeContentScript, 100);
  }

  // Strategy 2: DOMContentLoaded event
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript, { once: true });
  }

  // Strategy 3: Window load event as fallback
  window.addEventListener('load', initializeContentScript, { once: true });

  // Strategy 4: Delayed initialization for dynamic content
  setTimeout(initializeContentScript, 500);
  setTimeout(initializeContentScript, 2000);
}

// Start initialization
setupInitialization();