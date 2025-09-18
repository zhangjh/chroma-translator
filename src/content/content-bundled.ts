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
  ERROR_STATE: 'chrome-translation-error'
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
 * Content Script for Chrome Translation Extension
 * Handles text selection detection and translation UI
 */
class ContentScript {
  private selectedText: string = '';
  private selectionPosition: { x: number; y: number; width?: number; height?: number } = { x: 0, y: 0 };
  private tooltip: HTMLElement | null = null;
  private repositionTimeout: number | null = null;

  constructor() {
    this.init();
    this.setupMessageListener();
  }

  /**
   * Initialize content script functionality
   */
  private init(): void {
    this.setupTextSelectionDetection();
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
   * Set up text selection detection
   */
  private setupTextSelectionDetection(): void {
    // Listen for mouseup events to detect text selection
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Listen for selection change events
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
  }

  /**
   * Handle mouse up events to detect text selection
   */
  private handleMouseUp(event: MouseEvent): void {
    // Small delay to ensure selection is complete
    console.log("mouseUp");
    console.log(this.selectedText);
    
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
    }
  }

  /**
   * Process text selection and validate it
   */
  private processTextSelection(x: number, y: number): void {
    const selection = window.getSelection();
    if(selection) {
      this.selectedText = selection.toString().trim();
    }
    if(!this.selectedText) {
      return;
    }
    
    // Get the actual selection bounds instead of just mouse position
    const selectionBounds = this.getSelectionBounds(selection);
    if (selectionBounds) {
      this.selectionPosition = selectionBounds;
    } else {
      // Fallback to mouse position
      this.selectionPosition = { x, y };
    }
       
    console.log('text selection detected:', {
      text: this.selectedText,
      position: this.selectionPosition,
      length: this.selectedText.length
    });
      
    // Show translation tooltip and start translation
    this.showTranslationTooltip(this.selectedText, this.selectionPosition);
    this.translateSelectedText(this.selectedText); 
  }

  /**
   * Get the bounds of the current text selection
   */
  private getSelectionBounds(selection: Selection | null): { x: number; y: number; width: number; height: number } | null {
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    try {
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      
      if (rects.length === 0) {
        // Fallback to range bounding rect
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          return null;
        }
        return {
          x: rect.left + rect.width / 2,
          y: rect.top,
          width: rect.width,
          height: rect.height
        };
      }

      // For multi-line selections, use the first line for positioning
      const firstRect = rects[0];
      const lastRect = rects[rects.length - 1];
      
      // Calculate the overall bounds
      const left = Math.min(firstRect.left, lastRect.left);
      const right = Math.max(firstRect.right, lastRect.right);
      const top = firstRect.top;
      const bottom = lastRect.bottom;
      
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
    
    tooltip.innerHTML = `
      <div class="chrome-translate-tooltip-header">
        <span class="chrome-translate-tooltip-title">翻译</span>
        <button class="chrome-translate-tooltip-close" title="关闭" aria-label="关闭翻译弹框">×</button>
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
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

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

    // Calculate available space in all directions
    const spaceAbove = position.y - scrollY;
    const spaceBelow = scrollY + viewportHeight - (position.y + selectionHeight);
    const spaceLeft = position.x - scrollX;
    const spaceRight = scrollX + viewportWidth - position.x;

    let left: number = position.x - tooltipWidth / 2; // Initialize with default value
    let top: number;
    let placement = 'above'; // 'above', 'below', 'left', 'right'

    // Determine the best placement based on available space
    const needsHeight = tooltipHeight + offset + margin;
    const needsWidth = tooltipWidth + margin * 2;

    if (spaceBelow >= needsHeight) {
      // Prefer below if there's enough space
      placement = 'below';
      top = position.y + selectionHeight + offset;
    } else if (spaceAbove >= needsHeight) {
      // Use above if there's enough space
      placement = 'above';
      top = position.y - tooltipHeight - offset;
    } else if (spaceRight >= needsWidth && spaceRight > spaceLeft) {
      // Try right side
      placement = 'right';
      left = position.x + selectionWidth / 2 + offset;
      top = position.y + selectionHeight / 2 - tooltipHeight / 2;
    } else if (spaceLeft >= needsWidth) {
      // Try left side
      placement = 'left';
      left = position.x - selectionWidth / 2 - tooltipWidth - offset;
      top = position.y + selectionHeight / 2 - tooltipHeight / 2;
    } else {
      // Fallback: use the side with more space, but constrain to viewport
      if (spaceBelow > spaceAbove) {
        placement = 'below';
        top = Math.min(position.y + selectionHeight + offset, scrollY + viewportHeight - tooltipHeight - margin);
      } else {
        placement = 'above';
        top = Math.max(position.y - tooltipHeight - offset, scrollY + margin);
      }
    }

    // Calculate horizontal position for above/below placements
    if (placement === 'above' || placement === 'below') {
      left = position.x - tooltipWidth / 2;
      
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

    // Apply positioning
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;

    // Update tooltip classes based on placement
    tooltip.classList.remove('below-selection', 'above-selection', 'left-selection', 'right-selection');
    tooltip.classList.add(`${placement}-selection`);

    // Calculate arrow position for above/below placements
    if (placement === 'above' || placement === 'below') {
      const arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, position.x - left));
      tooltip.style.setProperty('--arrow-offset', `${arrowLeft}px`);
    } else {
      // For side placements, center the arrow vertically
      const arrowTop = Math.max(20, Math.min(tooltipHeight - 20, (position.y + selectionHeight / 2) - top));
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
    if (this.tooltip && this.tooltip.parentNode) {
      // Add fade-out animation
      this.tooltip.style.opacity = '0';
      this.tooltip.style.transform = 'translateY(-8px) scale(0.95)';
      
      // Remove after animation completes
      setTimeout(() => {
        if (this.tooltip && this.tooltip.parentNode) {
          this.tooltip.parentNode.removeChild(this.tooltip);
          this.tooltip = null;
        }
      }, 250);
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

      // Add scroll detection for visual feedback
      setTimeout(() => {
        this.setupScrollDetection();
      }, 50);
    }

    if (actions) {
      actions.innerHTML = `
        <button class="chrome-translate-tooltip-button secondary" title="复制翻译结果">复制</button>
      `;

      // Add event listeners for action buttons
      const copyButton = actions.querySelector('.chrome-translate-tooltip-button.secondary');

      if (copyButton) {
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(translatedText).then(() => {
            const originalText = (copyButton as HTMLElement).textContent;
            (copyButton as HTMLElement).textContent = '已复制 ✓';
            (copyButton as HTMLElement).style.background = 'linear-gradient(135deg, #34a853 0%, #137333 100%)';
            setTimeout(() => {
              (copyButton as HTMLElement).textContent = originalText;
              (copyButton as HTMLElement).style.background = '';
            }, 1500);
          }).catch(() => {
            (copyButton as HTMLElement).textContent = '复制失败';
            setTimeout(() => {
              (copyButton as HTMLElement).textContent = '复制';
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

    const content = this.tooltip.querySelector('.chrome-translate-tooltip-content');
    const actions = this.tooltip.querySelector('.chrome-translate-tooltip-actions');
    
    if (content) {
      content.innerHTML = `
        <div class="chrome-translate-tooltip-original">${this.escapeHtml(this.selectedText)}</div>
        <div class="chrome-translate-tooltip-error">${this.escapeHtml(errorMessage)}</div>
      `;

      // Add scroll detection for visual feedback
      setTimeout(() => {
        this.setupScrollDetection();
      }, 50);
    }

    if (actions) {
      actions.innerHTML = `
        <button class="chrome-translate-tooltip-button close-button" title="关闭">关闭</button>
      `;

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

    // Re-position tooltip after content update
    this.scheduleRepositioning();
  }

  /**
   * Translate selected text
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
  // (Simplified version for bundled script)

  /**
   * Translate full page
   */
  public async translateFullPage(): Promise<void> {
    console.log('Full page translation not implemented in bundled version');
    // This would be implemented similar to the original but simplified
  }

  /**
   * Restore original page content
   */
  public restoreOriginalPage(): void {
    console.log('Restore original page not implemented in bundled version');
    // This would be implemented similar to the original but simplified
  }

  /**
   * Show full page translation progress
   */
  public showFullPageProgress(progress: TranslationProgress): void {
    console.log('Progress display not implemented in bundled version', progress);
    // This would be implemented similar to the original but simplified
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