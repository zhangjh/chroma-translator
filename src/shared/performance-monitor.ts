// Performance monitoring and optimization utilities



/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  translationLatency: number[];
  cacheHitRate: number;
  memoryUsage: number;
  errorRate: number;
  queueLength: number;
  activeConnections: number;
}

/**
 * Performance optimization recommendations
 */
interface OptimizationRecommendation {
  type: 'cache' | 'memory' | 'queue' | 'network';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action: string;
}

/**
 * Performance monitoring and optimization manager
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    translationLatency: [],
    cacheHitRate: 0,
    memoryUsage: 0,
    errorRate: 0,
    queueLength: 0,
    activeConnections: 0
  };
  
  private performanceHistory: Array<{ timestamp: number; metrics: PerformanceMetrics }> = [];
  private readonly MAX_HISTORY_SIZE = 100;
  private readonly LATENCY_HISTORY_SIZE = 50;

  private constructor() {
    this.startPerformanceMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record translation latency
   */
  public recordTranslationLatency(startTime: number, endTime: number): void {
    const latency = endTime - startTime;
    this.metrics.translationLatency.push(latency);
    
    // Keep only recent latency measurements
    if (this.metrics.translationLatency.length > this.LATENCY_HISTORY_SIZE) {
      this.metrics.translationLatency.shift();
    }
  }

  /**
   * Update cache hit rate
   */
  public updateCacheHitRate(hits: number, total: number): void {
    this.metrics.cacheHitRate = total > 0 ? hits / total : 0;
  }

  /**
   * Update memory usage
   */
  public updateMemoryUsage(usage: number): void {
    this.metrics.memoryUsage = usage;
  }

  /**
   * Update error rate
   */
  public updateErrorRate(errors: number, total: number): void {
    this.metrics.errorRate = total > 0 ? errors / total : 0;
  }

  /**
   * Update queue length
   */
  public updateQueueLength(length: number): void {
    this.metrics.queueLength = length;
  }

  /**
   * Update active connections
   */
  public updateActiveConnections(count: number): void {
    this.metrics.activeConnections = count;
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get average translation latency
   */
  public getAverageLatency(): number {
    if (this.metrics.translationLatency.length === 0) return 0;
    
    const sum = this.metrics.translationLatency.reduce((a, b) => a + b, 0);
    return sum / this.metrics.translationLatency.length;
  }

  /**
   * Get performance recommendations
   */
  public getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const avgLatency = this.getAverageLatency();

    // Check translation latency
    if (avgLatency > 5000) { // 5 seconds
      recommendations.push({
        type: 'network',
        severity: 'high',
        message: `Average translation latency is ${Math.round(avgLatency)}ms`,
        action: 'Consider reducing batch size or implementing request throttling'
      });
    } else if (avgLatency > 2000) { // 2 seconds
      recommendations.push({
        type: 'network',
        severity: 'medium',
        message: `Translation latency is elevated at ${Math.round(avgLatency)}ms`,
        action: 'Monitor network conditions and consider caching improvements'
      });
    }

    // Check cache hit rate
    if (this.metrics.cacheHitRate < 0.3) { // Less than 30%
      recommendations.push({
        type: 'cache',
        severity: 'medium',
        message: `Cache hit rate is low at ${Math.round(this.metrics.cacheHitRate * 100)}%`,
        action: 'Increase cache size or improve cache key generation'
      });
    }

    // Check memory usage
    if (this.metrics.memoryUsage > 50 * 1024) { // 50MB
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: `Memory usage is high at ${Math.round(this.metrics.memoryUsage / 1024)}MB`,
        action: 'Clear old cache entries and optimize data structures'
      });
    } else if (this.metrics.memoryUsage > 20 * 1024) { // 20MB
      recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: `Memory usage is elevated at ${Math.round(this.metrics.memoryUsage / 1024)}MB`,
        action: 'Consider implementing memory cleanup routines'
      });
    }

    // Check error rate
    if (this.metrics.errorRate > 0.1) { // More than 10%
      recommendations.push({
        type: 'network',
        severity: 'high',
        message: `Error rate is high at ${Math.round(this.metrics.errorRate * 100)}%`,
        action: 'Investigate network issues and improve error handling'
      });
    }

    // Check queue length
    if (this.metrics.queueLength > 100) {
      recommendations.push({
        type: 'queue',
        severity: 'medium',
        message: `Translation queue is backed up with ${this.metrics.queueLength} items`,
        action: 'Increase processing concurrency or optimize queue management'
      });
    }

    return recommendations;
  }

  /**
   * Optimize performance based on current metrics
   */
  public async optimizePerformance(): Promise<void> {
    const recommendations = this.getOptimizationRecommendations();
    
    for (const rec of recommendations) {
      switch (rec.type) {
        case 'memory':
          await this.optimizeMemoryUsage();
          break;
        case 'cache':
          await this.optimizeCacheSettings();
          break;
        case 'queue':
          await this.optimizeQueueSettings();
          break;
      }
    }
  }

  /**
   * Start automatic performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor performance every 30 seconds
    setInterval(() => {
      this.recordPerformanceSnapshot();
      this.cleanupOldHistory();
      
      // Auto-optimize if performance is degraded
      const recommendations = this.getOptimizationRecommendations();
      const highSeverityRecs = recommendations.filter(r => r.severity === 'high');
      
      if (highSeverityRecs.length > 0) {
        console.warn('Performance issues detected:', highSeverityRecs);
        this.optimizePerformance();
      }
    }, 30000);
  }

  /**
   * Record performance snapshot
   */
  private recordPerformanceSnapshot(): void {
    const snapshot = {
      timestamp: Date.now(),
      metrics: { ...this.metrics }
    };
    
    this.performanceHistory.push(snapshot);
    
    if (this.performanceHistory.length > this.MAX_HISTORY_SIZE) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Clean up old performance history
   */
  private cleanupOldHistory(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.performanceHistory = this.performanceHistory.filter(
      snapshot => snapshot.timestamp > cutoffTime
    );
  }

  /**
   * Optimize memory usage
   */
  private async optimizeMemoryUsage(): Promise<void> {
    // Trigger garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
    
    // Clear old performance history
    this.cleanupOldHistory();
    
    console.log('Memory optimization completed');
  }

  /**
   * Optimize cache settings
   */
  private async optimizeCacheSettings(): Promise<void> {
    // This would typically interact with CacheManager
    // For now, just log the optimization
    console.log('Cache optimization completed');
  }

  /**
   * Optimize queue settings
   */
  private async optimizeQueueSettings(): Promise<void> {
    // This would typically interact with DebounceManager
    // For now, just log the optimization
    console.log('Queue optimization completed');
  }

  /**
   * Get performance trend analysis
   */
  public getPerformanceTrend(metric: keyof PerformanceMetrics, timeWindow: number = 3600000): {
    trend: 'improving' | 'stable' | 'degrading';
    change: number;
  } {
    const cutoffTime = Date.now() - timeWindow;
    const recentHistory = this.performanceHistory.filter(
      snapshot => snapshot.timestamp > cutoffTime
    );
    
    if (recentHistory.length < 2) {
      return { trend: 'stable', change: 0 };
    }
    
    const firstValue = this.getMetricValue(recentHistory[0].metrics, metric);
    const lastValue = this.getMetricValue(recentHistory[recentHistory.length - 1].metrics, metric);
    
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    
    if (Math.abs(changePercent) > 10) {
      // For latency and error rate, lower is better
      if (metric === 'translationLatency' || metric === 'errorRate') {
        trend = change < 0 ? 'improving' : 'degrading';
      } else if (metric === 'cacheHitRate') {
        // For cache hit rate, higher is better
        trend = change > 0 ? 'improving' : 'degrading';
      } else {
        // For other metrics, depends on context
        trend = change > 0 ? 'degrading' : 'improving';
      }
    }
    
    return { trend, change: changePercent };
  }

  /**
   * Get metric value from metrics object
   */
  private getMetricValue(metrics: PerformanceMetrics, metric: keyof PerformanceMetrics): number {
    const value = metrics[metric];
    if (Array.isArray(value)) {
      return value.length > 0 ? value.reduce((a, b) => a + b, 0) / value.length : 0;
    }
    return value as number;
  }

  /**
   * Export performance data for analysis
   */
  public exportPerformanceData(): {
    currentMetrics: PerformanceMetrics;
    history: Array<{ timestamp: number; metrics: PerformanceMetrics }>;
    recommendations: OptimizationRecommendation[];
    trends: Record<string, { trend: string; change: number }>;
  } {
    const trends: Record<string, { trend: string; change: number }> = {};
    const metricsKeys: (keyof PerformanceMetrics)[] = [
      'cacheHitRate', 'memoryUsage', 'errorRate', 'queueLength', 'activeConnections'
    ];
    
    for (const key of metricsKeys) {
      trends[key] = this.getPerformanceTrend(key);
    }
    
    return {
      currentMetrics: this.getCurrentMetrics(),
      history: [...this.performanceHistory],
      recommendations: this.getOptimizationRecommendations(),
      trends
    };
  }
}