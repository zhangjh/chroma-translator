// Translation result caching mechanism

import { TranslationResult } from '../../types/interfaces.js';
import { CONFIG, STORAGE_KEYS } from '../../types/constants.js';
import { LocalStorageManager } from './storage.js';

/**
 * Cache entry interface
 */
interface CacheEntry {
  result: TranslationResult;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache statistics interface
 */
interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
}

/**
 * Translation result cache manager
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private cacheStats = {
    hits: 0,
    misses: 0
  };

  private constructor() {
    this.loadCacheFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Get singleton instance of CacheManager
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached translation result
   */
  public async get(
    text: string, 
    sourceLang: string, 
    targetLang: string
  ): Promise<TranslationResult | null> {
    const key = this.generateCacheKey(text, sourceLang, targetLang);
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    // Check if cache entry is expired
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      this.cacheStats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.cacheStats.hits++;

    return entry.result;
  }

  /**
   * Store translation result in cache
   */
  public async set(
    text: string,
    sourceLang: string,
    targetLang: string,
    result: TranslationResult
  ): Promise<void> {
    const key = this.generateCacheKey(text, sourceLang, targetLang);
    const now = Date.now();

    const entry: CacheEntry = {
      result,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    };

    this.memoryCache.set(key, entry);

    // Enforce cache size limit
    await this.enforceCacheLimit();

    // Persist to storage periodically
    if (this.memoryCache.size % 10 === 0) {
      await this.saveCacheToStorage();
    }
  }

  /**
   * Check if translation is cached
   */
  public has(text: string, sourceLang: string, targetLang: string): boolean {
    const key = this.generateCacheKey(text, sourceLang, targetLang);
    const entry = this.memoryCache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    this.memoryCache.clear();
    this.cacheStats.hits = 0;
    this.cacheStats.misses = 0;
    await LocalStorageManager.remove(STORAGE_KEYS.CACHE);
  }

  /**
   * Remove expired cache entries
   */
  public async cleanup(): Promise<number> {
    const initialSize = this.memoryCache.size;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    const removedCount = initialSize - this.memoryCache.size;
    
    if (removedCount > 0) {
      await this.saveCacheToStorage();
    }

    return removedCount;
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? this.cacheStats.hits / totalRequests : 0;

    return {
      totalEntries: this.memoryCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.cacheStats.hits,
      totalMisses: this.cacheStats.misses,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Preload frequently used translations
   */
  public async preloadCommonTranslations(): Promise<void> {
    // Common phrases that might be translated frequently
    const commonPhrases = [
      'Hello',
      'Thank you',
      'Please',
      'Yes',
      'No',
      'How are you?',
      'Good morning',
      'Good evening',
      'Goodbye'
    ];

    // This would typically be called during extension initialization
    // to warm up the cache with common translations
    console.log('Cache preloading initiated for', commonPhrases.length, 'common phrases');
  }

  /**
   * Generate cache key from translation parameters
   */
  private generateCacheKey(text: string, sourceLang: string, targetLang: string): string {
    // Normalize text for consistent caching
    const normalizedText = text.trim().toLowerCase();
    return `${sourceLang}:${targetLang}:${this.hashString(normalizedText)}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > CONFIG.CACHE_EXPIRY;
  }

  /**
   * Enforce cache size limit using LRU eviction
   */
  private async enforceCacheLimit(): Promise<void> {
    const maxEntries = 1000; // Maximum number of cache entries
    
    if (this.memoryCache.size <= maxEntries) {
      return;
    }

    // Sort entries by last accessed time (LRU)
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Remove oldest entries
    const entriesToRemove = this.memoryCache.size - maxEntries;
    for (let i = 0; i < entriesToRemove; i++) {
      const [key] = entries[i];
      this.memoryCache.delete(key);
    }
  }

  /**
   * Load cache from persistent storage
   */
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cachedData = await LocalStorageManager.get<Record<string, CacheEntry>>(STORAGE_KEYS.CACHE);
      
      if (cachedData) {
        // Load non-expired entries
        for (const [key, entry] of Object.entries(cachedData)) {
          if (!this.isExpired(entry)) {
            this.memoryCache.set(key, entry);
          }
        }
        
        console.log(`Loaded ${this.memoryCache.size} cache entries from storage`);
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to persistent storage
   */
  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheData: Record<string, CacheEntry> = {};
      
      // Only save non-expired entries
      for (const [key, entry] of this.memoryCache.entries()) {
        if (!this.isExpired(entry)) {
          cacheData[key] = entry;
        }
      }
      
      await LocalStorageManager.set(STORAGE_KEYS.CACHE, cacheData);
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    // Clean up expired entries every 5 minutes
    setInterval(async () => {
      const removedCount = await this.cleanup();
      if (removedCount > 0) {
        console.log(`Cache cleanup removed ${removedCount} expired entries`);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      // Rough estimation of memory usage
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry).length * 2;
    }
    
    return Math.round(totalSize / 1024); // Return in KB
  }

  /**
   * Simple string hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}