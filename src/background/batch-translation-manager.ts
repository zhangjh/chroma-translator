import { TranslationService } from './translation-service';
import { 
  TranslationResult, 
  BatchTranslationProgress, 
  TranslationStatus} from '../../types/interfaces';
import { DebounceManager, ErrorHandler, CacheManager } from '../shared/index.js';
import { CONFIG } from '../../types/constants.js';

/**
 * Batch Translation Manager
 * Handles multiple text translations with progress tracking and streaming updates
 */
export class BatchTranslationManager {
  private translationService: TranslationService;
  private activeTranslations = new Map<string, AbortController>();
  private translationQueue: TranslationTask[] = [];
  private isProcessing = false;
  private readonly MAX_CONCURRENT_TRANSLATIONS = CONFIG.MAX_BATCH_SIZE;

  
  // Performance optimization components
  private debounceManager: DebounceManager;
  private errorHandler: ErrorHandler;
  private cacheManager: CacheManager;
  private processingQueue: Map<string, Promise<TranslationResult>> = new Map();

  constructor() {
    this.translationService = TranslationService.getInstance();
    this.debounceManager = DebounceManager.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.cacheManager = CacheManager.getInstance();
    
    // Initialize intelligent queue
    this.initializeQueue();
  }

  /**
   * Initialize intelligent translation queue
   */
  private initializeQueue(): void {
    this.debounceManager.createQueue(
      'translation_batch',
      this.processTranslationItem.bind(this),
      {
        maxConcurrency: this.MAX_CONCURRENT_TRANSLATIONS,
        prioritySort: true,
        retryFailedItems: true
      }
    );
  }

  /**
   * Process individual translation item from queue
   */
  private async processTranslationItem(item: {
    text: string;
    sourceLang: string;
    targetLang: string;
    batchId: string;
    index: number;
    onResult: (result: TranslationResult, index: number) => void;
  }): Promise<void> {
    const { text, sourceLang, targetLang, batchId, index, onResult } = item;
    
    try {
      // Check if translation is already in progress
      const cacheKey = `${sourceLang}:${targetLang}:${text}`;
      const existingPromise = this.processingQueue.get(cacheKey);
      
      let result: TranslationResult;
      
      if (existingPromise) {
        // Reuse existing translation promise
        result = await existingPromise;
      } else {
        // Create new translation promise
        const translationPromise = this.translationService.translate(text, sourceLang, targetLang);
        this.processingQueue.set(cacheKey, translationPromise);
        
        try {
          result = await translationPromise;
        } finally {
          // Clean up after completion
          this.processingQueue.delete(cacheKey);
        }
      }
      
      onResult(result, index);
      
    } catch (error) {
      await this.errorHandler.handleError(error, `batch_translation_${batchId}`);
      
      // Create error result
      const errorResult: TranslationResult = {
        translatedText: '',
        status: TranslationStatus.ERROR,
        detectedLanguage: sourceLang
      };
      
      onResult(errorResult, index);
    }
  }

  /**
   * Translate multiple texts with progress tracking and optimization
   */
  public async translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    onProgress?: (progress: BatchTranslationProgress) => void
  ): Promise<TranslationResult[]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    const batchId = this.generateBatchId();
    const abortController = new AbortController();
    this.activeTranslations.set(batchId, abortController);

    try {
      const results: TranslationResult[] = new Array(texts.length);
      const progress: BatchTranslationProgress = {
        total: texts.length,
        completed: 0,
        current: '',
        percentage: 0,
        results: []
      };

      // Initialize all results as pending
      for (let i = 0; i < texts.length; i++) {
        results[i] = {
          translatedText: '',
          status: TranslationStatus.PENDING
        };
      }

      // Check cache first for all texts
      const cacheHits = new Map<number, TranslationResult>();
      const textsToTranslate: Array<{ text: string; index: number; priority: number }> = [];

      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const cachedResult = await this.cacheManager.get(text, sourceLang, targetLang);
        
        if (cachedResult) {
          cacheHits.set(i, cachedResult);
          results[i] = cachedResult;
          progress.completed++;
        } else {
          // Assign priority based on text characteristics
          const priority = this.calculateTextPriority(text, i);
          textsToTranslate.push({ text, index: i, priority });
        }
      }

      // Update progress for cache hits
      if (cacheHits.size > 0) {
        progress.percentage = Math.round((progress.completed / progress.total) * 100);
        onProgress?.(progress);
      }

      // Process remaining texts through intelligent queue
      if (textsToTranslate.length > 0) {
        await this.processTextsWithQueue(
          textsToTranslate,
          sourceLang,
          targetLang,
          batchId,
          results,
          progress,
          onProgress,
          abortController
        );
      }

      return results;

    } catch (error) {
      throw error;
    } finally {
      this.activeTranslations.delete(batchId);
    }
  }

  /**
   * Process texts using intelligent queue management
   */
  private async processTextsWithQueue(
    textsToTranslate: Array<{ text: string; index: number; priority: number }>,
    sourceLang: string,
    targetLang: string,
    batchId: string,
    results: TranslationResult[],
    progress: BatchTranslationProgress,
    onProgress?: (progress: BatchTranslationProgress) => void,
    abortController?: AbortController
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      let completedCount = 0;
      const totalToProcess = textsToTranslate.length;

      const onResult = (result: TranslationResult, index: number) => {
        if (abortController?.signal.aborted) {
          return;
        }

        results[index] = result;
        progress.completed++;
        progress.percentage = Math.round((progress.completed / progress.total) * 100);
        progress.results = results.filter(r => r.status === TranslationStatus.COMPLETED);

        onProgress?.(progress);

        completedCount++;
        if (completedCount >= totalToProcess) {
          resolve();
        }
      };

      // Add all texts to queue with priority
      for (const { text, index, priority } of textsToTranslate) {
        if (abortController?.signal.aborted) {
          break;
        }

        progress.current = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        
        this.debounceManager.addToQueue(
          'translation_batch',
          {
            text,
            sourceLang,
            targetLang,
            batchId,
            index,
            onResult
          },
          {
            priority,
            maxRetries: CONFIG.RETRY_ATTEMPTS,
            id: `${batchId}_${index}`
          }
        );
      }
    });
  }

  /**
   * Calculate text priority for queue processing
   */
  private calculateTextPriority(text: string, index: number): number {
    let priority = 0;

    // Higher priority for shorter texts (faster to process)
    if (text.length < 100) priority += 3;
    else if (text.length < 500) priority += 2;
    else priority += 1;

    // Higher priority for earlier elements (visible first)
    priority += Math.max(0, 10 - Math.floor(index / 10));

    // Higher priority for headings and important content
    if (this.isImportantContent(text)) {
      priority += 5;
    }

    return priority;
  }

  /**
   * Check if text content is important (headings, titles, etc.)
   */
  private isImportantContent(text: string): boolean {
    const trimmed = text.trim();
    
    // Short texts that might be headings
    if (trimmed.length < 100 && trimmed.length > 5) {
      return true;
    }

    // Text that looks like headings (all caps, title case, etc.)
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 50) {
      return true;
    }

    return false;
  }



  /**
   * Queue translation task for processing
   */
  public queueTranslation(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    priority: number = 0,
    onProgress?: (progress: BatchTranslationProgress) => void
  ): string {
    const taskId = this.generateTaskId();
    const task: TranslationTask = {
      id: taskId,
      texts,
      sourceLang,
      targetLang,
      priority,
      onProgress,
      status: 'queued',
      createdAt: Date.now()
    };

    this.translationQueue.push(task);
    this.translationQueue.sort((a, b) => b.priority - a.priority);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * Cancel a batch translation
   */
  public cancelTranslation(batchId: string): boolean {
    const controller = this.activeTranslations.get(batchId);
    if (controller) {
      controller.abort();
      this.activeTranslations.delete(batchId);
      return true;
    }

    // Also remove from queue if not started
    const queueIndex = this.translationQueue.findIndex(task => task.id === batchId);
    if (queueIndex !== -1) {
      this.translationQueue.splice(queueIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * Get translation queue status
   */
  public getQueueStatus(): QueueStatus {
    return {
      queueLength: this.translationQueue.length,
      activeTranslations: this.activeTranslations.size,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Process the translation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.translationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.translationQueue.length > 0) {
        const task = this.translationQueue.shift();
        if (!task) continue;

        task.status = 'processing';
        
        try {
          await this.translateBatch(
            task.texts,
            task.sourceLang,
            task.targetLang,
            task.onProgress
          );
          task.status = 'completed';
        } catch (error) {
          task.status = 'error';
          console.error(`Translation task ${task.id} failed:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }



  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Optimize DOM operations by batching updates
   */
  public createDOMUpdateBatcher(): (elementId: string, translatedText: string) => void {
    const batchedUpdater = this.debounceManager.batch(
      async (updates: Array<{ elementId: string; translatedText: string }>) => {
        // Batch DOM updates to improve performance
        for (const { elementId, translatedText } of updates) {
          const element = document.getElementById(elementId);
          if (element) {
            element.textContent = translatedText;
            element.classList.add('chrome-translated-element');
          }
        }
      },
      CONFIG.PROGRESS_UPDATE_INTERVAL,
      20 // Max batch size for DOM updates
    );

    return (elementId: string, translatedText: string) => {
      batchedUpdater({ elementId, translatedText });
    };
  }

  /**
   * Memory optimization: Clean up completed translations
   */
  public cleanupCompletedTranslations(): void {
    // Clean up old processing promises
    for (const [key] of this.processingQueue.entries()) {
      // Check if promise is old (this is a simplified check)
      // In a real implementation, you'd track creation time
      if (this.processingQueue.size > 50) {
        this.processingQueue.delete(key);
      }
    }

    // Clean up old active translations
    for (const [batchId, controller] of this.activeTranslations.entries()) {
      // Clean up aborted or old controllers
      if (controller.signal.aborted) {
        this.activeTranslations.delete(batchId);
      }
    }
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    activeTranslations: number;
    queueLength: number;
    cacheStats: any;
    memoryUsage: number;
  } {
    const queueStatus = this.debounceManager.getQueueStatus('translation_batch');
    const cacheStats = this.cacheManager.getStats();

    return {
      activeTranslations: this.activeTranslations.size,
      queueLength: queueStatus.length,
      cacheStats,
      memoryUsage: this.processingQueue.size
    };
  }
}


/**
 * Translation task interface
 */
interface TranslationTask {
  id: string;
  texts: string[];
  sourceLang: string;
  targetLang: string;
  priority: number;
  onProgress: ((progress: BatchTranslationProgress) => void) | undefined;
  status: 'queued' | 'processing' | 'completed' | 'error';
  createdAt: number;
}

/**
 * Queue status interface
 */
export interface QueueStatus {
  queueLength: number;
  activeTranslations: number;
  isProcessing: boolean;
}