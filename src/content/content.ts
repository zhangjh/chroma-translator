import { TranslationProgress, TranslationError, TranslationErrorType } from '../../types/interfaces.js';
import { ContentScriptAPI } from '../../types/api.js';
import { Message, MessageType, MessageResponse } from '../../types/api.js';
import { ERROR_MESSAGES, CONFIG, CSS_CLASSES } from '../../types/constants.js';

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
 * Content Script for Chrome Translation Extension
 * Handles text selection detection and translation UI
 */
class ContentScript implements Partial<ContentScriptAPI> {
  private selectedText: string = '';
  private selectionPosition: { x: number; y: number } = { x: 0, y: 0 };
  private isSelectionValid: boolean = false;
  private tooltip: HTMLElement | null = null;
  private tooltipVisible: boolean = false;
  
  // Full page translation properties
  private translatableElements: TranslatableElement[] = [];
  private originalTexts: Map<string, string> = new Map();
  private isFullPageTranslationActive: boolean = false;
  
  // Error handling properties

  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = CONFIG.RETRY_ATTEMPTS;

  constructor() {
    this.init();
    this.setupMessageListener();
  }

  /**
   * Initialize content script functionality
   */
  private init(): void {
    this.setupTextSelectionDetection();
    this.injectStyles();
    console.log('Content script loaded and initialized');
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
    switch (message.type as string) {
      case 'TRANSLATION_RESULT':
        this.handleTranslationResult(message.data);
        break;
      case 'TRANSLATION_ERROR':
        this.handleTranslationError(message.data);
        break;
      case 'TRANSLATE_FULL_PAGE':
        if (message.data?.action === 'start') {
          await this.translateFullPage();
        }
        break;
      case 'RESTORE_ORIGINAL':
        this.restoreOriginalPage();
        break;
      case 'UPDATE_PROGRESS':
        if (message.data?.progress) {
          this.showFullPageProgress(message.data.progress);
        }
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Inject CSS styles for the tooltip
   */
  private injectStyles(): void {
    // Check if styles are already injected
    if (document.getElementById('chrome-translate-styles')) {
      return;
    }

    const link = document.createElement('link');
    link.id = 'chrome-translate-styles';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('content/content.css');
    document.head.appendChild(link);
  }

  /**
   * Set up text selection detection
   * Implements requirement 2.1: WHEN 用户在网页上选中文本 THEN 系统 SHALL 显示翻译按钮或快捷操作
   */
  private setupTextSelectionDetection(): void {
    // Listen for mouseup events to detect text selection
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Listen for selection change events
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
    
    // Listen for keyup events to handle keyboard selection
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  /**
   * Handle mouse up events to detect text selection
   */
  private handleMouseUp(event: MouseEvent): void {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      this.processTextSelection(event.clientX, event.clientY);
    }, 10);
  }

  /**
   * Handle selection change events
   */
  private handleSelectionChange(): void {
    // Process selection change with current cursor position
    // We'll use the last known mouse position or center of selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      this.processTextSelection(rect.left + rect.width / 2, rect.top);
    }
  }

  /**
   * Handle keyboard events for text selection
   */
  private handleKeyUp(event: KeyboardEvent): void {
    // Handle keyboard selection (Shift + Arrow keys, Ctrl+A, etc.)
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          this.processTextSelection(rect.left + rect.width / 2, rect.top);
        }
      }, 10);
    }
  }

  /**
   * Process text selection and validate it
   */
  private processTextSelection(x: number, y: number): void {
    const selection = window.getSelection();
    const selectedText = this.getSelectedText();
    
    // Update selection position
    this.selectionPosition = { x, y };
    
    // Validate selection
    this.isSelectionValid = this.validateSelection(selectedText, selection);
    
    if (this.isSelectionValid) {
      this.selectedText = selectedText;
      console.log('Valid text selection detected:', {
        text: selectedText,
        position: this.selectionPosition,
        length: selectedText.length
      });
      
      // Show translation tooltip and start translation
      this.showTranslationTooltip(selectedText, this.selectionPosition);
      this.translateSelectedText(selectedText);
    } else {
      this.selectedText = '';
      // Hide translation tooltip if visible
      this.hideTooltip();
    }
  }

  /**
   * Get selected text from the current selection
   * Implements requirement 2.2: WHEN 用户触发选中文本翻译 THEN 系统 SHALL 获取选中的文本内容
   */
  public getSelectedText(): string {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return '';
    }
    
    return selection.toString().trim();
  }

  /**
   * Validate text selection to filter invalid selections
   * Filters: empty text, non-text elements, code blocks, etc.
   */
  private validateSelection(text: string, selection: Selection | null): boolean {
    // Check if text is empty or only whitespace
    if (!text || text.length === 0) {
      return false;
    }
    
    // Check minimum text length (at least 1 character)
    if (text.length < 1) {
      return false;
    }
    
    // Check maximum text length (avoid very long selections)
    if (text.length > 5000) {
      return false;
    }
    
    // Check if selection exists and has ranges
    if (!selection || selection.rangeCount === 0) {
      return false;
    }
    
    // Check if selection is within valid elements
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Get the element containing the selection
    const element = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container as Element;
    
    if (!element) {
      return false;
    }
    
    // Filter out selections from code elements, scripts, styles, etc.
    const excludedTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT'];
    const excludedClasses = ['code', 'highlight', 'syntax', 'no-translate'];
    
    // Check if element or its parents are excluded
    let currentElement: Element | null = element;
    while (currentElement) {
      // Check tag name
      if (excludedTags.includes(currentElement.tagName)) {
        return false;
      }
      
      // Check class names
      if (currentElement.className) {
        const classes = currentElement.className.split(' ');
        if (excludedClasses.some(excludedClass => 
          classes.some(cls => cls.toLowerCase().includes(excludedClass))
        )) {
          return false;
        }
      }
      
      // Check data attributes that indicate non-translatable content
      if (currentElement.hasAttribute('data-no-translate') || 
          currentElement.hasAttribute('translate') && 
          currentElement.getAttribute('translate') === 'no') {
        return false;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    // Check if text contains mostly non-alphabetic characters (likely not natural language)
    const alphabeticChars = text.match(/[a-zA-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g);
    const alphabeticRatio = alphabeticChars ? alphabeticChars.length / text.length : 0;
    
    // Require at least 30% alphabetic characters for natural language text
    if (alphabeticRatio < 0.3) {
      return false;
    }
    
    return true;
  }

  /**
   * Get current selection information
   */
  public getSelectionInfo(): { text: string; position: { x: number; y: number }; isValid: boolean } {
    return {
      text: this.selectedText,
      position: this.selectionPosition,
      isValid: this.isSelectionValid
    };
  }

  /**
   * Show translation tooltip at specified position
   * Implements requirement 2.4: WHEN 翻译完成 THEN 系统 SHALL 在合适位置显示翻译结果（如悬浮窗或侧边栏）
   */
  public showTranslationTooltip(text: string, position: { x: number; y: number }): void {
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
        this.tooltipVisible = true;
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
    
    tooltip.innerHTML = `
      <div class="chrome-translate-tooltip-header">
        <span class="chrome-translate-tooltip-title">翻译</span>
        <button class="chrome-translate-tooltip-close" title="关闭">×</button>
      </div>
      <div class="chrome-translate-tooltip-content">
        <div class="chrome-translate-tooltip-original">${this.escapeHtml(text)}</div>
        <div class="chrome-translate-tooltip-loading">
          <div class="chrome-translate-tooltip-spinner"></div>
          <span>正在翻译...</span>
        </div>
      </div>
      <div class="chrome-translate-tooltip-actions">
        <button class="chrome-translate-tooltip-button" disabled>翻译中...</button>
      </div>
    `;

    // Add event listeners
    const closeButton = tooltip.querySelector('.chrome-translate-tooltip-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hideTooltip());
    }

    // Prevent tooltip from closing when clicking inside it
    tooltip.addEventListener('click', (e) => e.stopPropagation());

    return tooltip;
  }

  /**
   * Position tooltip relative to selection
   */
  private positionTooltip(position: { x: number; y: number }): void {
    if (!this.tooltip) return;

    const tooltip = this.tooltip;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    // Get tooltip dimensions (approximate)
    const tooltipWidth = 250; // Approximate width
    const tooltipHeight = 120; // Approximate height
    const offset = 10; // Offset from selection

    let left = position.x - tooltipWidth / 2;
    let top = position.y - tooltipHeight - offset;

    // Adjust horizontal position if tooltip goes outside viewport
    if (left < scrollX + 10) {
      left = scrollX + 10;
    } else if (left + tooltipWidth > scrollX + viewportWidth - 10) {
      left = scrollX + viewportWidth - tooltipWidth - 10;
    }

    // Adjust vertical position if tooltip goes outside viewport
    if (top < scrollY + 10) {
      // Show below selection instead
      top = position.y + offset;
      // Add class to flip arrow
      tooltip.classList.add('below-selection');
    }

    // Ensure tooltip doesn't go below viewport
    if (top + tooltipHeight > scrollY + viewportHeight - 10) {
      top = scrollY + viewportHeight - tooltipHeight - 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    if (this.tooltip && this.tooltipVisible) {
      this.tooltip.classList.remove('visible');
      
      setTimeout(() => {
        if (this.tooltip && this.tooltip.parentNode) {
          this.tooltip.parentNode.removeChild(this.tooltip);
        }
        this.tooltip = null;
        this.tooltipVisible = false;
      }, 200); // Wait for animation to complete
    }
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

    const content = this.tooltip.querySelector('.chrome-translate-tooltip-content');
    const actions = this.tooltip.querySelector('.chrome-translate-tooltip-actions');
    
    if (content) {
      content.innerHTML = `
        <div class="chrome-translate-tooltip-original">${this.escapeHtml(this.selectedText)}</div>
        <div class="chrome-translate-tooltip-result">${this.escapeHtml(translatedText)}</div>
      `;
    }

    if (actions) {
      actions.innerHTML = `
        <button class="chrome-translate-tooltip-button secondary">复制</button>
        <button class="chrome-translate-tooltip-button">重新翻译</button>
      `;

      // Add event listeners for action buttons
      const copyButton = actions.querySelector('.chrome-translate-tooltip-button.secondary');
      const retryButton = actions.querySelector('.chrome-translate-tooltip-button:not(.secondary)');

      if (copyButton) {
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(translatedText).then(() => {
            (copyButton as HTMLElement).textContent = '已复制';
            setTimeout(() => {
              (copyButton as HTMLElement).textContent = '复制';
            }, 1000);
          });
        });
      }

      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this.showTranslationTooltip(this.selectedText, this.selectionPosition);
          this.translateSelectedText(this.selectedText);
        });
      }
    }
  }

  /**
   * Update tooltip with error message
   */
  public updateTooltipWithError(errorMessage: string, showRetry: boolean = false): void {
    if (!this.tooltip) return;

    const content = this.tooltip.querySelector('.chrome-translate-tooltip-content');
    const actions = this.tooltip.querySelector('.chrome-translate-tooltip-actions');
    
    if (content) {
      content.innerHTML = `
        <div class="chrome-translate-tooltip-original">${this.escapeHtml(this.selectedText)}</div>
        <div class="chrome-translate-tooltip-error">${this.escapeHtml(errorMessage)}</div>
      `;
    }

    if (actions) {
      let actionsHTML = '';
      
      if (showRetry) {
        actionsHTML += `<button class="chrome-translate-tooltip-button retry-button">重试</button>`;
      }
      
      actionsHTML += `<button class="chrome-translate-tooltip-button close-button">关闭</button>`;
      
      actions.innerHTML = actionsHTML;

      // Add retry button event listener
      const retryButton = actions.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this.retryTranslation();
        });
      }

      // Add close button event listener
      const closeButton = actions.querySelector('.close-button');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.hideTooltip();
        });
      }
    }

    // Add error styling
    this.tooltip.classList.add(CSS_CLASSES.ERROR_STATE);
  }

  /**
   * Translate selected text
   * Implements requirement 2.2: WHEN 用户触发选中文本翻译 THEN 系统 SHALL 获取选中的文本内容
   * Implements requirement 2.3: WHEN 获取到选中文本 THEN 系统 SHALL 使用默认目标语种进行翻译
   */
  private async translateSelectedText(text: string): Promise<void> {
    try {
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
    const requestKey = `${this.selectedText}_${Date.now()}`;
    
    // Check if we should retry
    if (translationError.retryable) {
      const attempts = this.retryAttempts.get(requestKey) || 0;
      
      if (attempts < this.maxRetries) {
        this.retryAttempts.set(requestKey, attempts + 1);
        
        // Show retry message
        const retryMessage = `${translationError.message} (重试 ${attempts + 1}/${this.maxRetries})`;
        this.updateTooltipWithError(retryMessage, true);
        
        // Retry after delay
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempts);
        setTimeout(() => {
          this.retryTranslation();
        }, delay);
        
        return;
      } else {
        // Max retries reached
        this.retryAttempts.delete(requestKey);
      }
    }

    // Show final error message
    this.updateTooltipWithError(translationError.message, translationError.retryable);
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
        retryable: false
      };
    }

    if (lowerError.includes('network_error') || lowerError.includes('network')) {
      return {
        type: TranslationErrorType.NETWORK_ERROR,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        retryable: true
      };
    }

    if (lowerError.includes('text_too_long') || lowerError.includes('too long')) {
      return {
        type: TranslationErrorType.TEXT_TOO_LONG,
        message: ERROR_MESSAGES.TEXT_TOO_LONG,
        retryable: false
      };
    }

    if (lowerError.includes('quota_exceeded') || lowerError.includes('quota')) {
      return {
        type: TranslationErrorType.QUOTA_EXCEEDED,
        message: ERROR_MESSAGES.QUOTA_EXCEEDED,
        retryable: true
      };
    }

    if (lowerError.includes('invalid_language') || lowerError.includes('language')) {
      return {
        type: TranslationErrorType.INVALID_LANGUAGE,
        message: ERROR_MESSAGES.INVALID_LANGUAGE,
        retryable: false
      };
    }

    // Default to network error (retryable)
    return {
      type: TranslationErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES.TRANSLATION_FAILED,
      retryable: true
    };
  }

  /**
   * Retry the last translation
   */
  private retryTranslation(): void {
    if (this.selectedText && this.isSelectionValid) {
      this.translateSelectedText(this.selectedText);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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

  /**
   * Analyze page and identify translatable text elements
   * Implements requirement 3.1: WHEN 用户点击全文翻译按钮 THEN 系统 SHALL 提取当前页面的所有文本内容
   */
  public analyzePageElements(): TranslatableElement[] {
    console.log('Starting page element analysis...');
    
    this.translatableElements = [];
    this.originalTexts.clear();
    
    // Get all text-containing elements from the page
    const allElements = this.getAllTextElements();
    
    // Filter and process elements
    const validElements = allElements.filter(element => this.isElementTranslatable(element));
    
    // Convert to TranslatableElement objects with priority and metadata
    validElements.forEach((element, index) => {
      const text = this.extractElementText(element);
      if (text && text.trim().length > 0) {
        const elementId = this.generateElementId(element, index);
        const priority = this.getElementPriority(element);
        const isVisible = this.isElementVisible(element);
        
        const translatableElement: TranslatableElement = {
          element: element as HTMLElement,
          originalText: text,
          priority,
          elementId,
          tagName: element.tagName.toLowerCase(),
          isVisible
        };
        
        this.translatableElements.push(translatableElement);
        this.originalTexts.set(elementId, text);
        
        // Add data attribute for tracking
        (element as HTMLElement).setAttribute('data-translate-id', elementId);
      }
    });
    
    // Sort by priority (lower number = higher priority) and visibility
    this.translatableElements.sort((a, b) => {
      // Visible elements first
      if (a.isVisible !== b.isVisible) {
        return a.isVisible ? -1 : 1;
      }
      // Then by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Then by text length (longer text first for important content)
      return b.originalText.length - a.originalText.length;
    });
    
    console.log(`Found ${this.translatableElements.length} translatable elements:`, {
      byPriority: this.groupElementsByPriority(),
      visible: this.translatableElements.filter(el => el.isVisible).length,
      hidden: this.translatableElements.filter(el => !el.isVisible).length
    });
    
    return this.translatableElements;
  }

  /**
   * Get all elements that potentially contain text
   */
  private getAllTextElements(): Element[] {
    // Define text-containing element selectors
    const textSelectors = [
      'h1, h2, h3, h4, h5, h6',           // Headings
      'p',                                 // Paragraphs
      'div',                              // Divs (will be filtered for text content)
      'span',                             // Spans
      'a',                                // Links
      'li',                               // List items
      'td, th',                           // Table cells
      'button',                           // Buttons
      'label',                            // Labels
      'legend',                           // Form legends
      'caption',                          // Table captions
      'figcaption',                       // Figure captions
      'blockquote',                       // Quotes
      'cite',                             // Citations
      'em, strong, b, i',                 // Emphasis elements
      'small',                            // Small text
      'mark',                             // Highlighted text
      'time',                             // Time elements
      'address',                          // Address elements
      '[title]',                          // Elements with title attributes
      '[alt]',                            // Elements with alt attributes (images)
      'option'                            // Select options
    ].join(', ');
    
    return Array.from(document.querySelectorAll(textSelectors));
  }

  /**
   * Check if an element should be translated
   */
  private isElementTranslatable(element: Element): boolean {
    // Skip if element is not an HTMLElement
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    
    // Skip excluded tags
    const excludedTags = [
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED',
      'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SELECT', 'CANVAS', 'SVG'
    ];
    
    if (excludedTags.includes(element.tagName)) {
      return false;
    }
    
    // Skip elements with excluded classes
    const excludedClasses = [
      'code', 'highlight', 'syntax', 'no-translate', 'notranslate',
      'prettyprint', 'hljs', 'language-', 'prism', 'ace_editor'
    ];
    
    const className = element.className.toLowerCase();
    if (excludedClasses.some(cls => className.includes(cls))) {
      return false;
    }
    
    // Skip elements with translate="no" attribute
    if (element.hasAttribute('translate') && element.getAttribute('translate') === 'no') {
      return false;
    }
    
    // Skip elements with data-no-translate attribute
    if (element.hasAttribute('data-no-translate')) {
      return false;
    }
    
    // Skip elements that are part of the extension UI
    if (element.closest('.chrome-translate-tooltip') || 
        element.classList.contains('chrome-translate-progress') ||
        element.hasAttribute('data-chrome-translate')) {
      return false;
    }
    
    // Skip hidden elements (but allow elements that might become visible)
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      return false;
    }
    
    // Skip elements with very small dimensions (likely decorative)
    const rect = element.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      return false;
    }
    
    // Check if element has meaningful text content
    const text = this.extractElementText(element);
    if (!text || text.trim().length < 2) {
      return false;
    }
    
    // Skip elements that contain mostly non-alphabetic characters
    const alphabeticChars = text.match(/[a-zA-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0400-\u04ff]/g);
    const alphabeticRatio = alphabeticChars ? alphabeticChars.length / text.length : 0;
    
    if (alphabeticRatio < 0.3) {
      return false;
    }
    
    // Skip elements that are likely navigation or UI elements with very short text
    if (text.length < 5 && (
      element.tagName === 'A' || 
      element.tagName === 'BUTTON' ||
      element.classList.contains('nav') ||
      element.classList.contains('menu') ||
      element.closest('nav')
    )) {
      return false;
    }
    
    return true;
  }

  /**
   * Extract clean text content from an element
   */
  private extractElementText(element: Element): string {
    // For images with alt text
    if (element.tagName === 'IMG') {
      return element.getAttribute('alt') || '';
    }
    
    // For elements with title attribute
    if (element.hasAttribute('title')) {
      const titleText = element.getAttribute('title') || '';
      if (titleText.length > 10) { // Only use substantial title text
        return titleText;
      }
    }
    
    // For input elements with placeholder
    if (element.tagName === 'INPUT') {
      return element.getAttribute('placeholder') || '';
    }
    
    // Get direct text content, excluding nested elements that will be processed separately
    let text = '';
    
    // For most elements, get the direct text content
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as Element;
        // Include text from inline elements that won't be processed separately
        if (this.isInlineElement(childElement) && !this.isElementTranslatable(childElement)) {
          text += childElement.textContent || '';
        }
      }
    }
    
    // Clean up the text
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if an element is an inline element
   */
  private isInlineElement(element: Element): boolean {
    const inlineTags = [
      'SPAN', 'A', 'EM', 'STRONG', 'B', 'I', 'U', 'SMALL', 'SUB', 'SUP',
      'MARK', 'DEL', 'INS', 'CODE', 'KBD', 'SAMP', 'VAR', 'TIME', 'ABBR'
    ];
    
    return inlineTags.includes(element.tagName);
  }

  /**
   * Generate unique ID for an element
   */
  private generateElementId(element: Element, index: number): string {
    // Try to use existing ID
    if (element.id) {
      return `translate_${element.id}`;
    }
    
    // Generate ID based on tag name, class, and position
    const tagName = element.tagName.toLowerCase();
    const className = element.className ? element.className.split(' ')[0] : '';
    const textPreview = this.extractElementText(element).substring(0, 20).replace(/\W/g, '');
    
    return `translate_${tagName}_${className}_${textPreview}_${index}`;
  }

  /**
   * Determine element priority for translation ordering
   */
  private getElementPriority(element: Element): ElementPriority {
    const tagName = element.tagName.toLowerCase();
    
    // Title elements (highest priority)
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title'].includes(tagName)) {
      return ElementPriority.TITLE;
    }
    
    // Heading-like elements
    if (element.closest('header') || element.classList.contains('title') || 
        element.classList.contains('heading')) {
      return ElementPriority.HEADING;
    }
    
    // Paragraph elements
    if (['p', 'div'].includes(tagName)) {
      // Large text blocks get paragraph priority
      const text = this.extractElementText(element);
      if (text.length > 50) {
        return ElementPriority.PARAGRAPH;
      }
    }
    
    // List elements
    if (['li', 'ul', 'ol', 'dl', 'dt', 'dd'].includes(tagName)) {
      return ElementPriority.LIST;
    }
    
    // Links
    if (tagName === 'a') {
      return ElementPriority.LINK;
    }
    
    // Buttons and interactive elements
    if (['button', 'input'].includes(tagName)) {
      return ElementPriority.BUTTON;
    }
    
    // Labels and small text
    if (['label', 'span', 'small', 'caption', 'legend'].includes(tagName)) {
      return ElementPriority.LABEL;
    }
    
    // Everything else
    return ElementPriority.OTHER;
  }

  /**
   * Check if an element is currently visible in the viewport
   */
  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top < viewportHeight &&
      rect.bottom > 0 &&
      rect.left < viewportWidth &&
      rect.right > 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Group elements by priority for analysis
   */
  private groupElementsByPriority(): Record<string, number> {
    const groups: Record<string, number> = {};
    
    this.translatableElements.forEach(element => {
      const priorityName = ElementPriority[element.priority];
      groups[priorityName] = (groups[priorityName] || 0) + 1;
    });
    
    return groups;
  }

  /**
   * Get translatable elements (public method for external access)
   */
  public getTranslatableElements(): TranslatableElement[] {
    return this.translatableElements;
  }

  /**
   * Get original text for an element by ID
   */
  public getOriginalText(elementId: string): string | undefined {
    return this.originalTexts.get(elementId);
  }

  /**
   * Translate full page with streaming updates
   * Implements requirement 3.2: WHEN 提取完成 THEN 系统 SHALL 使用默认目标语种翻译页面内容
   * Implements requirement 3.4: WHEN 翻译完成 THEN 系统 SHALL 替换页面原文本为翻译后的文本
   */
  public async translateFullPage(): Promise<void> {
    console.log('Starting full page translation...');
    
    if (this.isFullPageTranslationActive) {
      console.log('Full page translation already in progress');
      return;
    }
    
    try {
      this.isFullPageTranslationActive = true;
      
      // Analyze page elements if not already done
      if (this.translatableElements.length === 0) {
        this.analyzePageElements();
      }
      
      if (this.translatableElements.length === 0) {
        console.log('No translatable elements found on page');
        return;
      }
      
      // Prepare elements for batch translation
      const elementsToTranslate = this.translatableElements.filter(el => 
        el.originalText.trim().length > 0
      );
      
      console.log(`Starting translation of ${elementsToTranslate.length} elements`);
      
      // Process elements in batches for better performance
      const batchSize = 5; // Process 5 elements at a time
      const batches = this.createTranslationBatches(elementsToTranslate, batchSize);
      
      let totalProcessed = 0;
      
      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} elements`);
        
        // Send batch translation request to background script
        await this.processBatch(batch, totalProcessed, elementsToTranslate.length);
        
        totalProcessed += batch.length;
        
        // Small delay between batches to prevent overwhelming the API
        if (batchIndex < batches.length - 1) {
          await this.delay(100);
        }
      }
      
      console.log('Full page translation completed');
      
    } catch (error) {
      console.error('Full page translation error:', error);
      // Handle error - could show error message to user
    } finally {
      this.isFullPageTranslationActive = false;
    }
  }

  /**
   * Create batches of elements for translation
   */
  private createTranslationBatches(elements: TranslatableElement[], batchSize: number): TranslatableElement[][] {
    const batches: TranslatableElement[][] = [];
    
    for (let i = 0; i < elements.length; i += batchSize) {
      batches.push(elements.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Process a batch of elements for translation
   */
  private async processBatch(
    batch: TranslatableElement[], 
    processedSoFar: number, 
    totalElements: number
  ): Promise<void> {
    // Prepare batch data for background script
    const batchData = {
      elements: batch.map(el => ({
        elementId: el.elementId,
        text: el.originalText,
        tagName: el.tagName,
        priority: el.priority
      })),
      processedSoFar,
      totalElements
    };
    
    try {
      // Send batch translation request
      const message: Message = {
        type: MessageType.TRANSLATE_BATCH,
        data: batchData,
        requestId: this.generateRequestId()
      };
      
      const response = await this.sendMessageToBackground(message);
      
      if (response.success && response.data) {
        // Process translation results
        this.handleBatchTranslationResults(response.data, batch);
      } else {
        console.error('Batch translation failed:', response.error);
        // Mark elements as failed but continue with other batches
        this.handleBatchTranslationError(batch, response.error || 'Translation failed');
      }
      
    } catch (error) {
      console.error('Batch processing error:', error);
      this.handleBatchTranslationError(batch, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Handle successful batch translation results
   */
  private handleBatchTranslationResults(results: any, batch: TranslatableElement[]): void {
    if (!results.translations || !Array.isArray(results.translations)) {
      console.error('Invalid batch translation results format');
      return;
    }
    
    // Apply translations to elements
    results.translations.forEach((result: any, index: number) => {
      if (index < batch.length) {
        const element = batch[index];
        
        if (result.success && result.translatedText) {
          // Stream update the element with translated text
          this.streamTranslationUpdate(element.elementId, result.translatedText);
        } else {
          console.warn(`Translation failed for element ${element.elementId}:`, result.error);
          // Keep original text but mark as processed
          this.markElementAsProcessed(element.elementId);
        }
      }
    });
  }

  /**
   * Handle batch translation errors
   */
  private handleBatchTranslationError(batch: TranslatableElement[], error: string): void {
    console.error('Batch translation error:', error);
    
    // Mark all elements in the batch as processed (keeping original text)
    batch.forEach(element => {
      this.markElementAsProcessed(element.elementId);
    });
  }

  /**
   * Stream translation update for a specific element
   * Implements requirement 3.4: 逐个更新已翻译的元素内容，实现流式输出效果
   */
  public streamTranslationUpdate(elementId: string, translatedText: string): void {
    const element = document.querySelector(`[data-translate-id="${elementId}"]`) as HTMLElement;
    
    if (!element) {
      console.warn(`Element with ID ${elementId} not found for translation update`);
      return;
    }
    
    // Store original text if not already stored
    if (!this.originalTexts.has(elementId)) {
      this.originalTexts.set(elementId, element.textContent || '');
    }
    
    // Apply translation with smooth transition
    this.applyTranslationToElement(element, translatedText);
    
    // Mark element as translated
    element.setAttribute('data-translated', 'true');
    element.setAttribute('data-original-text', this.originalTexts.get(elementId) || '');
    
    console.log(`Updated element ${elementId} with translation:`, {
      original: this.originalTexts.get(elementId),
      translated: translatedText
    });
  }

  /**
   * Apply translation to an element with visual feedback
   */
  private applyTranslationToElement(element: HTMLElement, translatedText: string): void {
    // Add visual indication that element is being updated
    element.classList.add('chrome-translate-updating');
    
    // For different element types, apply translation appropriately
    if (element.tagName === 'IMG') {
      // For images, update alt text
      element.setAttribute('alt', translatedText);
    } else if (element.tagName === 'INPUT') {
      // For inputs, update placeholder
      element.setAttribute('placeholder', translatedText);
    } else if (element.hasAttribute('title')) {
      // For elements with title, update title attribute
      element.setAttribute('title', translatedText);
    } else {
      // For text elements, update text content
      // Preserve HTML structure by only updating text nodes
      this.updateElementTextContent(element, translatedText);
    }
    
    // Remove updating class after a short delay
    setTimeout(() => {
      element.classList.remove('chrome-translate-updating');
      element.classList.add('chrome-translate-translated');
    }, 200);
  }

  /**
   * Update element text content while preserving HTML structure
   */
  private updateElementTextContent(element: HTMLElement, newText: string): void {
    // For simple elements with only text content
    if (element.children.length === 0) {
      element.textContent = newText;
      return;
    }
    
    // For complex elements, try to replace the main text content
    // while preserving child elements
    const textNodes = this.getDirectTextNodes(element);
    
    if (textNodes.length === 1) {
      // Single text node - replace it
      textNodes[0].textContent = newText;
    } else if (textNodes.length > 1) {
      // Multiple text nodes - replace the longest one (likely the main content)
      const longestTextNode = textNodes.reduce((longest, current) => 
        (current.textContent?.length || 0) > (longest.textContent?.length || 0) ? current : longest
      );
      longestTextNode.textContent = newText;
      
      // Clear other text nodes to avoid duplication
      textNodes.forEach(node => {
        if (node !== longestTextNode && (node.textContent?.trim().length || 0) > 0) {
          node.textContent = '';
        }
      });
    } else {
      // No direct text nodes - add text at the beginning
      element.insertBefore(document.createTextNode(newText), element.firstChild);
    }
  }

  /**
   * Get direct text nodes of an element (not from child elements)
   */
  private getDirectTextNodes(element: HTMLElement): Text[] {
    const textNodes: Text[] = [];
    
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        textNodes.push(node as Text);
      }
    }
    
    return textNodes;
  }

  /**
   * Mark element as processed (for error cases)
   */
  private markElementAsProcessed(elementId: string): void {
    const element = document.querySelector(`[data-translate-id="${elementId}"]`) as HTMLElement;
    
    if (element) {
      element.setAttribute('data-processed', 'true');
      element.classList.add('chrome-translate-processed');
    }
  }

  /**
   * Restore original page content
   * Implements requirement 3.6: WHEN 用户想要恢复原文 THEN 系统 SHALL 提供恢复原文的选项
   */
  public restoreOriginalPage(): void {
    console.log('Restoring original page content...');
    
    // Find all translated elements
    const translatedElements = document.querySelectorAll('[data-translated="true"]');
    
    translatedElements.forEach(element => {
      const elementId = element.getAttribute('data-translate-id');
      const originalText = element.getAttribute('data-original-text');
      
      if (elementId && originalText) {
        // Restore original text
        if (element.tagName === 'IMG') {
          element.setAttribute('alt', originalText);
        } else if (element.tagName === 'INPUT') {
          element.setAttribute('placeholder', originalText);
        } else if (element.hasAttribute('title')) {
          element.setAttribute('title', originalText);
        } else {
          (element as HTMLElement).textContent = originalText;
        }
        
        // Remove translation attributes and classes
        element.removeAttribute('data-translated');
        element.removeAttribute('data-original-text');
        element.classList.remove('chrome-translate-translated', 'chrome-translate-updating');
      }
    });
    
    // Clear processed elements
    const processedElements = document.querySelectorAll('[data-processed="true"]');
    processedElements.forEach(element => {
      element.removeAttribute('data-processed');
      element.classList.remove('chrome-translate-processed');
    });
    
    console.log(`Restored ${translatedElements.length} elements to original text`);
    
    // Reset translation state
    this.isFullPageTranslationActive = false;
  }

  /**
   * Utility method to create delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========== Progress Display Methods ==========

  private progressBar: HTMLElement | null = null;
  private currentHighlightedElement: HTMLElement | null = null;

  /**
   * Show full page translation progress
   * Implements requirement 3.3: WHEN 翻译进行中 THEN 系统 SHALL 显示翻译进度指示器
   * Implements requirement 5.2: 实时更新翻译进度百分比和状态信息
   */
  public showFullPageProgress(progress: TranslationProgress): void {
    // Create progress bar if it doesn't exist
    if (!this.progressBar) {
      this.createProgressBar();
    }
    
    if (!this.progressBar) {
      console.error('Failed to create progress bar');
      return;
    }
    
    // Update progress information
    this.updateProgressBar(progress);
    
    // Highlight current element being translated
    if (progress.currentElement) {
      this.highlightCurrentElement(progress.currentElement);
    }
    
    // Show progress bar if not visible
    if (!this.progressBar.classList.contains('visible')) {
      this.progressBar.classList.add('visible');
    }
  }

  /**
   * Create the progress bar UI
   */
  private createProgressBar(): void {
    // Remove existing progress bar if any
    this.removeProgressBar();
    
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'chrome-translate-progress';
    this.progressBar.setAttribute('data-chrome-translate', 'true');
    
    this.progressBar.innerHTML = `
      <div class="chrome-translate-progress-header">
        <div class="chrome-translate-progress-title">正在翻译页面...</div>
        <div class="chrome-translate-progress-controls">
          <button class="chrome-translate-progress-button" data-action="pause">暂停</button>
          <button class="chrome-translate-progress-button danger" data-action="cancel">取消</button>
        </div>
      </div>
      <div class="chrome-translate-progress-bar">
        <div class="chrome-translate-progress-fill"></div>
      </div>
      <div class="chrome-translate-progress-info">
        <div class="chrome-translate-progress-stats">
          <span class="chrome-translate-progress-current">正在准备...</span>
          <span class="chrome-translate-progress-count">0 / 0</span>
        </div>
        <div class="chrome-translate-progress-percentage">0%</div>
      </div>
    `;
    
    // Add event listeners for control buttons
    this.setupProgressBarControls();
    
    // Add to document
    document.body.appendChild(this.progressBar);
    
    console.log('Progress bar created and added to page');
  }

  /**
   * Setup event listeners for progress bar controls
   */
  private setupProgressBarControls(): void {
    if (!this.progressBar) return;
    
    const pauseButton = this.progressBar.querySelector('[data-action="pause"]') as HTMLButtonElement;
    const cancelButton = this.progressBar.querySelector('[data-action="cancel"]') as HTMLButtonElement;
    
    if (pauseButton) {
      pauseButton.addEventListener('click', () => {
        this.handleProgressBarAction('pause');
      });
    }
    
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.handleProgressBarAction('cancel');
      });
    }
  }

  /**
   * Handle progress bar control actions
   */
  private handleProgressBarAction(action: string): void {
    console.log(`Progress bar action: ${action}`);
    
    // Send message to background script to handle the action
    const message: Message = {
      type: MessageType.UPDATE_PROGRESS,
      data: { action },
      requestId: this.generateRequestId()
    };
    
    this.sendMessageToBackground(message).catch(error => {
      console.error('Failed to send progress action:', error);
    });
    
    if (action === 'cancel') {
      // Immediately hide progress bar and restore page
      this.hideProgressBar();
      this.restoreOriginalPage();
    }
  }

  /**
   * Update progress bar with current progress
   */
  private updateProgressBar(progress: TranslationProgress): void {
    if (!this.progressBar) return;
    
    const fillElement = this.progressBar.querySelector('.chrome-translate-progress-fill') as HTMLElement;
    const currentElement = this.progressBar.querySelector('.chrome-translate-progress-current') as HTMLElement;
    const countElement = this.progressBar.querySelector('.chrome-translate-progress-count') as HTMLElement;
    const percentageElement = this.progressBar.querySelector('.chrome-translate-progress-percentage') as HTMLElement;
    
    if (fillElement) {
      fillElement.style.width = `${progress.percentage}%`;
    }
    
    if (currentElement) {
      const currentText = progress.currentElement || '正在处理...';
      // Truncate long text for display
      const displayText = currentText.length > 50 
        ? currentText.substring(0, 47) + '...' 
        : currentText;
      currentElement.textContent = `正在翻译: ${displayText}`;
    }
    
    if (countElement) {
      countElement.textContent = `${progress.translatedElements} / ${progress.totalElements}`;
    }
    
    if (percentageElement) {
      percentageElement.textContent = `${Math.round(progress.percentage)}%`;
    }
    
    // Update title based on progress
    const titleElement = this.progressBar.querySelector('.chrome-translate-progress-title') as HTMLElement;
    if (titleElement) {
      if (progress.percentage >= 100) {
        titleElement.textContent = '翻译完成！';
        this.updateProgressBarForCompletion();
      } else {
        titleElement.textContent = '正在翻译页面...';
      }
    }
  }

  /**
   * Update progress bar UI when translation is complete
   */
  private updateProgressBarForCompletion(): void {
    if (!this.progressBar) return;
    
    const controlsElement = this.progressBar.querySelector('.chrome-translate-progress-controls') as HTMLElement;
    if (controlsElement) {
      controlsElement.innerHTML = `
        <button class="chrome-translate-progress-button" data-action="restore">恢复原文</button>
        <button class="chrome-translate-progress-button primary" data-action="close">关闭</button>
      `;
      
      // Re-setup event listeners for new buttons
      const restoreButton = controlsElement.querySelector('[data-action="restore"]') as HTMLButtonElement;
      const closeButton = controlsElement.querySelector('[data-action="close"]') as HTMLButtonElement;
      
      if (restoreButton) {
        restoreButton.addEventListener('click', () => {
          this.restoreOriginalPage();
          this.hideProgressBar();
        });
      }
      
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.hideProgressBar();
        });
      }
    }
    
    // Auto-hide progress bar after 5 seconds
    setTimeout(() => {
      if (this.progressBar && this.progressBar.classList.contains('visible')) {
        this.hideProgressBar();
      }
    }, 5000);
  }

  /**
   * Hide progress bar
   */
  private hideProgressBar(): void {
    if (this.progressBar) {
      this.progressBar.classList.remove('visible');
      
      // Remove from DOM after animation
      setTimeout(() => {
        this.removeProgressBar();
      }, 300);
    }
  }

  /**
   * Remove progress bar from DOM
   */
  private removeProgressBar(): void {
    if (this.progressBar && this.progressBar.parentNode) {
      this.progressBar.parentNode.removeChild(this.progressBar);
      this.progressBar = null;
    }
  }

  /**
   * Highlight current element being translated
   * Implements requirement 5.2: 高亮当前正在翻译的元素
   */
  public highlightTranslatedElements(): void {
    // Remove previous highlights
    const previousHighlights = document.querySelectorAll('.chrome-translate-current');
    previousHighlights.forEach(element => {
      element.classList.remove('chrome-translate-current');
    });
    
    // Highlight all translated elements
    const translatedElements = document.querySelectorAll('[data-translated="true"]');
    translatedElements.forEach(element => {
      element.classList.add('chrome-translate-translated');
    });
  }

  /**
   * Highlight the current element being translated
   */
  private highlightCurrentElement(elementText: string): void {
    // Remove previous highlight
    if (this.currentHighlightedElement) {
      this.currentHighlightedElement.classList.remove('chrome-translate-current');
      this.currentHighlightedElement = null;
    }
    
    // Find element by text content (approximate matching)
    const elements = document.querySelectorAll('[data-translate-id]');
    
    for (const element of Array.from(elements)) {
      const originalText = element.getAttribute('data-original-text') || 
                          this.originalTexts.get(element.getAttribute('data-translate-id') || '') ||
                          element.textContent || '';
      
      // Check if this element contains the current text being translated
      if (originalText.includes(elementText.substring(0, 30)) || 
          elementText.includes(originalText.substring(0, 30))) {
        
        this.currentHighlightedElement = element as HTMLElement;
        this.currentHighlightedElement.classList.add('chrome-translate-current');
        
        // Scroll element into view if it's not visible
        this.scrollElementIntoView(this.currentHighlightedElement);
        break;
      }
    }
  }

  /**
   * Scroll element into view smoothly
   */
  private scrollElementIntoView(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    
    if (!isVisible) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  /**
   * Update progress during translation (called from background script)
   */
  public updateTranslationProgress(
    translatedElements: number, 
    totalElements: number, 
    currentElement: string
  ): void {
    const percentage = totalElements > 0 ? (translatedElements / totalElements) * 100 : 0;
    
    const progress: TranslationProgress = {
      totalElements,
      translatedElements,
      currentElement,
      percentage
    };
    
    this.showFullPageProgress(progress);
  }

  // ========== Translation Control Methods ==========

  private translationPaused: boolean = false;
  private translationCancelled: boolean = false;

  /**
   * Pause full page translation
   * Implements requirement 3.5: 提供暂停、继续、取消翻译的按钮
   */
  public pauseTranslation(): void {
    console.log('Pausing translation...');
    this.translationPaused = true;
    
    // Update progress bar to show paused state
    if (this.progressBar) {
      const titleElement = this.progressBar.querySelector('.chrome-translate-progress-title') as HTMLElement;
      if (titleElement) {
        titleElement.textContent = '翻译已暂停';
      }
      
      const controlsElement = this.progressBar.querySelector('.chrome-translate-progress-controls') as HTMLElement;
      if (controlsElement) {
        controlsElement.innerHTML = `
          <button class="chrome-translate-progress-button primary" data-action="resume">继续</button>
          <button class="chrome-translate-progress-button danger" data-action="cancel">取消</button>
        `;
        
        // Re-setup event listeners
        this.setupProgressBarControls();
      }
    }
  }

  /**
   * Resume full page translation
   * Implements requirement 3.5: 提供暂停、继续、取消翻译的按钮
   */
  public resumeTranslation(): void {
    console.log('Resuming translation...');
    this.translationPaused = false;
    
    // Update progress bar to show active state
    if (this.progressBar) {
      const titleElement = this.progressBar.querySelector('.chrome-translate-progress-title') as HTMLElement;
      if (titleElement) {
        titleElement.textContent = '正在翻译页面...';
      }
      
      const controlsElement = this.progressBar.querySelector('.chrome-translate-progress-controls') as HTMLElement;
      if (controlsElement) {
        controlsElement.innerHTML = `
          <button class="chrome-translate-progress-button" data-action="pause">暂停</button>
          <button class="chrome-translate-progress-button danger" data-action="cancel">取消</button>
        `;
        
        // Re-setup event listeners
        this.setupProgressBarControls();
      }
    }
    
    // Continue with translation - this would typically trigger the background script
    // to continue processing the remaining elements
    const message: Message = {
      type: MessageType.TRANSLATE_FULL_PAGE,
      data: { action: 'resume' },
      requestId: this.generateRequestId()
    };
    
    this.sendMessageToBackground(message).catch(error => {
      console.error('Failed to resume translation:', error);
    });
  }

  /**
   * Cancel full page translation
   * Implements requirement 3.5: 提供暂停、继续、取消翻译的按钮
   */
  public cancelTranslation(): void {
    console.log('Cancelling translation...');
    this.translationCancelled = true;
    this.translationPaused = false;
    this.isFullPageTranslationActive = false;
    
    // Hide progress bar
    this.hideProgressBar();
    
    // Restore original page content
    this.restoreOriginalPage();
    
    // Send cancellation message to background script
    const message: Message = {
      type: MessageType.TRANSLATE_FULL_PAGE,
      data: { action: 'cancel' },
      requestId: this.generateRequestId()
    };
    
    this.sendMessageToBackground(message).catch(error => {
      console.error('Failed to cancel translation:', error);
    });
  }

  /**
   * Check if translation is paused
   */
  public isTranslationPaused(): boolean {
    return this.translationPaused;
  }

  /**
   * Check if translation is cancelled
   */
  public isTranslationCancelled(): boolean {
    return this.translationCancelled;
  }

  /**
   * Reset translation state
   */
  public resetTranslationState(): void {
    this.translationPaused = false;
    this.translationCancelled = false;
    this.isFullPageTranslationActive = false;
    
    // Clear element tracking
    this.translatableElements = [];
    this.originalTexts.clear();
    
    // Remove progress bar
    this.removeProgressBar();
    
    // Remove current element highlight
    if (this.currentHighlightedElement) {
      this.currentHighlightedElement.classList.remove('chrome-translate-current');
      this.currentHighlightedElement = null;
    }
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript();
  });
} else {
  new ContentScript();
}