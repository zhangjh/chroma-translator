// Debounce and queue management utilities

import { CONFIG } from '../../types/constants.js';

/**
 * Debounce function type
 */
type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
};

/**
 * Queue item interface
 */
interface QueueItem<T> {
  id: string;
  data: T;
  priority: number;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

/**
 * Queue processor function type
 */
type QueueProcessor<T> = (item: T) => Promise<void>;

/**
 * Debounce and intelligent queue management
 */
export class DebounceManager {
  private static instance: DebounceManager;
  private debounceTimers: Map<string, any> = new Map();
  private queues: Map<string, QueueItem<any>[]> = new Map();
  private processors: Map<string, QueueProcessor<any>> = new Map();
  private processingQueues: Set<string> = new Set();

  private constructor() {}

  /**
   * Get singleton instance of DebounceManager
   */
  public static getInstance(): DebounceManager {
    if (!DebounceManager.instance) {
      DebounceManager.instance = new DebounceManager();
    }
    return DebounceManager.instance;
  }

  /**
   * Create a debounced function
   */
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = CONFIG.DEBOUNCE_DELAY,
    key?: string
  ): DebouncedFunction<T> {
    const debounceKey = key || `debounce_${Date.now()}_${Math.random()}`;
    
    const debouncedFn = (...args: Parameters<T>) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(debounceKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        this.debounceTimers.delete(debounceKey);
        func.apply(null, args);
      }, delay);

      this.debounceTimers.set(debounceKey, timer);
    };

    // Add cancel method
    debouncedFn.cancel = () => {
      const timer = this.debounceTimers.get(debounceKey);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(debounceKey);
      }
    };

    // Add flush method (execute immediately)
    debouncedFn.flush = () => {
      const timer = this.debounceTimers.get(debounceKey);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(debounceKey);
        // Note: We can't execute the function here without the args
        // This is a limitation of the flush implementation
      }
    };

    return debouncedFn;
  }

  /**
   * Create a debounced translation function
   */
  public createDebouncedTranslation(
    translationFn: (text: string, sourceLang: string, targetLang: string) => Promise<any>,
    delay: number = CONFIG.DEBOUNCE_DELAY
  ): (text: string, sourceLang: string, targetLang: string) => Promise<any> {
    const pendingTranslations = new Map<string, {
      resolve: (value: any) => void;
      reject: (error: any) => void;
    }>();

    const debouncedFn = this.debounce(async (text: string, sourceLang: string, targetLang: string) => {
      const key = `${sourceLang}:${targetLang}:${text}`;
      const pending = pendingTranslations.get(key);
      
      if (pending) {
        try {
          const result = await translationFn(text, sourceLang, targetLang);
          pending.resolve(result);
        } catch (error) {
          pending.reject(error);
        } finally {
          pendingTranslations.delete(key);
        }
      }
    }, delay, 'translation');

    return (text: string, sourceLang: string, targetLang: string): Promise<any> => {
      const key = `${sourceLang}:${targetLang}:${text}`;
      
      if (pendingTranslations.has(key)) {
        return new Promise((resolve, reject) => {
          pendingTranslations.set(key, { resolve, reject });
        });
      }
      
      return new Promise((resolve, reject) => {
        pendingTranslations.set(key, { resolve, reject });
        debouncedFn(text, sourceLang, targetLang);
      });
    };
  }

  /**
   * Create an intelligent queue for processing items
   */
  public createQueue<T>(
    queueName: string,
    processor: QueueProcessor<T>,
    options: {
      maxConcurrency?: number;
      prioritySort?: boolean;
      retryFailedItems?: boolean;
    } = {}
  ): void {
    // Store queue configuration for future use
    console.log(`Creating queue ${queueName} with options:`, options);
    this.queues.set(queueName, []);
    this.processors.set(queueName, processor);
  }

  /**
   * Add item to queue
   */
  public addToQueue<T>(
    queueName: string,
    data: T,
    options: {
      priority?: number;
      maxRetries?: number;
      id?: string;
    } = {}
  ): string {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" does not exist`);
    }

    const item: QueueItem<T> = {
      id: options.id || `${queueName}_${Date.now()}_${Math.random()}`,
      data,
      priority: options.priority || 0,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3
    };

    queue.push(item);

    // Sort by priority if needed
    queue.sort((a, b) => b.priority - a.priority);

    // Start processing if not already processing
    this.processQueue(queueName);

    return item.id;
  }

  /**
   * Remove item from queue
   */
  public removeFromQueue(queueName: string, itemId: string): boolean {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    const index = queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      queue.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get queue status
   */
  public getQueueStatus(queueName: string): {
    length: number;
    processing: boolean;
    oldestItem?: number;
  } {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return { length: 0, processing: false };
    }

    const oldestItem = queue.length > 0 ? 
      Math.min(...queue.map(item => item.timestamp)) : undefined;

    return {
      length: queue.length,
      processing: this.processingQueues.has(queueName),
      ...(oldestItem !== undefined && { oldestItem })
    };
  }

  /**
   * Clear all debounce timers
   */
  public clearAllDebounces(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Clear specific queue
   */
  public clearQueue(queueName: string): void {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.length = 0;
    }
  }

  /**
   * Get all active debounce keys
   */
  public getActiveDebounces(): string[] {
    return Array.from(this.debounceTimers.keys());
  }

  /**
   * Process queue items
   */
  private async processQueue(queueName: string): Promise<void> {
    if (this.processingQueues.has(queueName)) {
      return; // Already processing
    }

    const queue = this.queues.get(queueName);
    const processor = this.processors.get(queueName);

    if (!queue || !processor) {
      return;
    }

    this.processingQueues.add(queueName);

    try {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        try {
          await processor(item.data);
        } catch (error) {
          console.error(`Queue item processing failed:`, error);
          
          // Retry logic
          if (item.retryCount < item.maxRetries) {
            item.retryCount++;
            item.priority = Math.max(0, item.priority - 1); // Lower priority for retries
            queue.push(item);
            queue.sort((a, b) => b.priority - a.priority);
          } else {
            console.error(`Queue item ${item.id} failed after ${item.maxRetries} retries`);
          }
        }
      }
    } finally {
      this.processingQueues.delete(queueName);
    }
  }

  /**
   * Create a throttled function (different from debounce)
   */
  public throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Batch function calls within a time window
   */
  public batch<T>(
    batchProcessor: (items: T[]) => Promise<void>,
    windowMs: number = 100,
    maxBatchSize: number = 10
  ): (item: T) => void {
    let batch: T[] = [];
    let timer: any | null = null;

    const processBatch = async () => {
      if (batch.length === 0) return;
      
      const currentBatch = [...batch];
      batch = [];
      
      try {
        await batchProcessor(currentBatch);
      } catch (error) {
        console.error('Batch processing failed:', error);
      }
    };

    return (item: T) => {
      batch.push(item);

      // Process immediately if batch is full
      if (batch.length >= maxBatchSize) {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        processBatch();
        return;
      }

      // Set timer for batch processing
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          processBatch();
        }, windowMs);
      }
    };
  }
}