import { MessageType, Message, MessageResponse } from '../../types/api.js';
import { TranslationService } from './translation-service.js';
import { BatchTranslationManager } from './batch-translation-manager.js';
import { Settings } from '../../types/interfaces.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../../types/constants.js';

/**
 * Message Router
 * Handles communication between Background Script and other components
 */
export class MessageRouter {
  private translationService: TranslationService;
  private batchTranslationManager: BatchTranslationManager;
  private messageHandlers: Map<MessageType, (data: any, sender: chrome.runtime.MessageSender) => Promise<any>>;

  constructor() {
    this.translationService = TranslationService.getInstance();
    this.batchTranslationManager = new BatchTranslationManager();
    this.messageHandlers = new Map();
    this.initializeHandlers();
    this.setupMessageListener();
  }

  /**
   * Initialize message handlers
   * 实现Background Script与其他组件的消息通信
   */
  private initializeHandlers(): void {
    // Translation handlers
    this.messageHandlers.set(MessageType.TRANSLATE_TEXT, this.handleTranslateText.bind(this));
    this.messageHandlers.set(MessageType.TRANSLATE_BATCH, this.handleTranslateBatch.bind(this));
    this.messageHandlers.set(MessageType.DETECT_LANGUAGE, this.handleDetectLanguage.bind(this));
    this.messageHandlers.set(MessageType.GET_SUPPORTED_LANGUAGES, this.handleGetSupportedLanguages.bind(this));
    
    // Settings handlers
    this.messageHandlers.set(MessageType.GET_SETTINGS, this.handleGetSettings.bind(this));
    this.messageHandlers.set(MessageType.SAVE_SETTINGS, this.handleSaveSettings.bind(this));
    
    // Content script handlers
    this.messageHandlers.set(MessageType.TRANSLATE_SELECTED, this.handleTranslateSelected.bind(this));
    this.messageHandlers.set(MessageType.TRANSLATE_FULL_PAGE, this.handleTranslateFullPage.bind(this));
    this.messageHandlers.set(MessageType.RESTORE_ORIGINAL, this.handleRestoreOriginal.bind(this));
  }

  /**
   * Setup Chrome runtime message listener
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
        this.handleMessage(message, sender)
          .then(data => {
            sendResponse({
              success: true,
              data,
              requestId: message.requestId || ''
            });
          })
          .catch(error => {
            console.error('Message handling error:', error);
            sendResponse({
              success: false,
              error: error.message || 'Unknown error occurred',
              requestId: message.requestId || ''
            });
          });
        
        // Return true to indicate we will send a response asynchronously
        return true;
      }
    );
  }

  /**
   * Handle incoming messages
   * 处理来自Popup和Content Script的翻译请求
   */
  private async handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<any> {
    const handler = this.messageHandlers.get(message.type);
    
    if (!handler) {
      throw new Error(`Unknown message type: ${message.type}`);
    }

    try {
      return await handler(message.data, sender);
    } catch (error) {
      // 添加消息类型定义和错误处理
      console.error(`Error handling message type ${message.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle single text translation request
   */
  private async handleTranslateText(data: {
    text: string;
    sourceLang: string;
    targetLang: string;
  }): Promise<any> {
    const { text, sourceLang, targetLang } = data;
    return await this.translationService.translate(text, sourceLang, targetLang);
  }

  /**
   * Handle batch translation request
   */
  private async handleTranslateBatch(data: {
    texts: string[];
    sourceLang: string;
    targetLang: string;
    tabId?: number;
  }): Promise<any> {
    const { texts, sourceLang, targetLang, tabId } = data;
    
    // Create progress callback to send updates to content script
    const onProgress = tabId ? (progress: any) => {
      chrome.tabs.sendMessage(tabId, {
        type: MessageType.UPDATE_PROGRESS,
        data: progress
      }).catch(error => {
        console.error('Failed to send progress update:', error);
      });
    } : undefined;

    return await this.batchTranslationManager.translateBatch(
      texts,
      sourceLang,
      targetLang,
      onProgress
    );
  }

  /**
   * Handle language detection request
   */
  private async handleDetectLanguage(data: { text: string }): Promise<string> {
    return await this.translationService.detectLanguage(data.text);
  }

  /**
   * Handle get supported languages request
   */
  private async handleGetSupportedLanguages(): Promise<any> {
    return await this.translationService.getSupportedLanguages();
  }

  /**
   * Handle get settings request
   */
  private async handleGetSettings(): Promise<Settings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(STORAGE_KEYS.SETTINGS, (items) => {
        const storedSettings = items[STORAGE_KEYS.SETTINGS];
        if (storedSettings) {
          resolve({ ...DEFAULT_SETTINGS, ...storedSettings });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      });
    });
  }

  /**
   * Handle save settings request
   */
  private async handleSaveSettings(data: { settings: Settings }): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: data.settings }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Handle selected text translation request
   */
  private async handleTranslateSelected(data: {
    text: string;
    targetLang?: string;
  }, sender: chrome.runtime.MessageSender): Promise<any> {
    const settings = await this.handleGetSettings();
    const targetLang = data.targetLang || settings.defaultTargetLanguage;
    
    const result = await this.translationService.translate(data.text, 'auto', targetLang);
    
    // Send result back to content script
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'TRANSLATION_RESULT',
        data: result
      }).catch(error => {
        console.error('Failed to send translation result:', error);
      });
    }
    
    return result;
  }

  /**
   * Handle full page translation request
   */
  private async handleTranslateFullPage(data: {
    texts: string[];
    targetLang?: string;
  }, sender: chrome.runtime.MessageSender): Promise<any> {
    const settings = await this.handleGetSettings();
    const targetLang = data.targetLang || settings.defaultTargetLanguage;
    
    // Use batch translation for full page
    const tabId = sender.tab?.id;
    return await this.handleTranslateBatch({
      texts: data.texts,
      sourceLang: 'auto',
      targetLang,
      ...(tabId && { tabId })
    });
  }

  /**
   * Handle restore original page request
   */
  private async handleRestoreOriginal(_data: any, sender: chrome.runtime.MessageSender): Promise<void> {
    // Send restore command to content script
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'RESTORE_ORIGINAL_PAGE',
        data: {}
      }).catch(error => {
        console.error('Failed to send restore command:', error);
      });
    }
  }

  /**
   * Send message to specific tab
   */
  public async sendMessageToTab(tabId: number, message: Message): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response: MessageResponse) => {
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

  /**
   * Broadcast message to all tabs
   */
  public async broadcastMessage(message: Message): Promise<void> {
    const tabs = await chrome.tabs.query({});
    
    const promises = tabs.map(tab => {
      if (tab.id) {
        return this.sendMessageToTab(tab.id, message).catch(error => {
          // Ignore errors for tabs that don't have content script
          console.debug(`Failed to send message to tab ${tab.id}:`, error);
        });
      }
      return Promise.resolve();
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get translation queue status
   */
  public getQueueStatus() {
    return this.batchTranslationManager.getQueueStatus();
  }

  /**
   * Cancel translation by ID
   */
  public cancelTranslation(translationId: string): boolean {
    return this.batchTranslationManager.cancelTranslation(translationId);
  }
}