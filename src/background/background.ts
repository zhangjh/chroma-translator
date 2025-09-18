import { MessageRouter } from './message-router.js';
import { PerformanceMonitor, CacheManager } from '../shared/index.js';

/**
 * ChromaTranslator Background Script
 * Main entry point for background functionality
 */
class BackgroundScript {
  private messageRouter: MessageRouter;
  private performanceMonitor: PerformanceMonitor;
  private cacheManager: CacheManager;

  constructor() {
    this.messageRouter = new MessageRouter();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.cacheManager = CacheManager.getInstance();
    this.initialize();
    
    // Keep references to prevent garbage collection
    console.log('Background script components initialized:', {
      messageRouter: !!this.messageRouter,
      performanceMonitor: !!this.performanceMonitor,
      cacheManager: !!this.cacheManager
    });
  }

  /**
   * Initialize background script
   */
  private initialize(): void {
    console.log('ChromaTranslator Background Script loaded');
    
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Extension installed:', details.reason);
      
      if (details.reason === 'install') {
        this.handleFirstInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
    });

    // Handle extension startup
    chrome.runtime.onStartup.addListener(() => {
      console.log('Extension started');
      this.startPerformanceOptimization();
    });

    // Handle tab updates for content script injection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        // Content script will be injected automatically via manifest
        console.log('Tab updated:', tabId, tab.url);
      }
    });

    // Start performance optimization
    this.startPerformanceOptimization();
  }

  /**
   * Start performance optimization routines
   */
  private startPerformanceOptimization(): void {
    // Clean up cache periodically (every 10 minutes)
    setInterval(async () => {
      const removedCount = await this.cacheManager.cleanup();
      if (removedCount > 0) {
        console.log(`Cache cleanup removed ${removedCount} expired entries`);
      }
    }, 10 * 60 * 1000);

    // Monitor performance and optimize (every 5 minutes)
    setInterval(async () => {
      const recommendations = this.performanceMonitor.getOptimizationRecommendations();
      const highPriorityRecs = recommendations.filter(r => r.severity === 'high');
      
      if (highPriorityRecs.length > 0) {
        console.warn('High priority performance issues detected:', highPriorityRecs);
        await this.performanceMonitor.optimizePerformance();
      }
    }, 5 * 60 * 1000);

    console.log('Performance optimization routines started');
  }

  /**
   * Handle first installation
   */
  private handleFirstInstall(): void {
    console.log('First installation detected');
    
    // Set default settings
    const defaultSettings = {
      defaultTargetLanguage: 'en',
      autoDetectLanguage: true,
      showTranslationTooltip: true,
      enableFullPageTranslation: true,
      enableStreamingTranslation: true,
      translationDelay: 300,
    };

    chrome.storage.sync.set(defaultSettings, () => {
      console.log('Default settings saved');
    });
  }

  /**
   * Handle extension update
   */
  private handleUpdate(previousVersion?: string): void {
    console.log('Extension updated from version:', previousVersion);
    // Handle any migration logic here if needed
  }
}

// Initialize background script
new BackgroundScript();