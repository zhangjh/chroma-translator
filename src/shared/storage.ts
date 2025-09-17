// Chrome Storage API wrapper with error handling and type safety

/**
 * Chrome Storage wrapper with type safety and error handling
 */
export class StorageManager {
  /**
   * Get data from Chrome sync storage
   */
  public static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key] || null;
    } catch (error) {
      console.error(`Failed to get data for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Get multiple keys from Chrome sync storage
   */
  public static async getMultiple<T extends Record<string, any>>(keys: string[]): Promise<Partial<T>> {
    try {
      const result = await chrome.storage.sync.get(keys);
      return result as Partial<T>;
    } catch (error) {
      console.error('Failed to get multiple keys:', error);
      return {};
    }
  }

  /**
   * Set data in Chrome sync storage
   */
  public static async set(key: string, value: any): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error(`Failed to set data for key "${key}":`, error);
      throw new Error(`Storage operation failed: ${error}`);
    }
  }

  /**
   * Set multiple key-value pairs in Chrome sync storage
   */
  public static async setMultiple(data: Record<string, any>): Promise<void> {
    try {
      await chrome.storage.sync.set(data);
    } catch (error) {
      console.error('Failed to set multiple keys:', error);
      throw new Error(`Storage operation failed: ${error}`);
    }
  }

  /**
   * Remove data from Chrome sync storage
   */
  public static async remove(key: string): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.error(`Failed to remove data for key "${key}":`, error);
      throw new Error(`Storage operation failed: ${error}`);
    }
  }

  /**
   * Remove multiple keys from Chrome sync storage
   */
  public static async removeMultiple(keys: string[]): Promise<void> {
    try {
      await chrome.storage.sync.remove(keys);
    } catch (error) {
      console.error('Failed to remove multiple keys:', error);
      throw new Error(`Storage operation failed: ${error}`);
    }
  }

  /**
   * Clear all data from Chrome sync storage
   */
  public static async clear(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error(`Storage operation failed: ${error}`);
    }
  }

  /**
   * Get storage usage information
   */
  public static async getUsage(): Promise<{ bytesInUse: number; quotaBytes: number }> {
    try {
      const bytesInUse = await chrome.storage.sync.getBytesInUse();
      const quotaBytes = chrome.storage.sync.QUOTA_BYTES;
      return { bytesInUse, quotaBytes };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { bytesInUse: 0, quotaBytes: 0 };
    }
  }

  /**
   * Check if storage is available
   */
  public static isAvailable(): boolean {
    return !!(chrome && chrome.storage && chrome.storage.sync);
  }

  /**
   * Listen for storage changes
   */
  public static addChangeListener(callback: (changes: Record<string, chrome.storage.StorageChange>) => void): void {
    if (this.isAvailable()) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
          callback(changes);
        }
      });
    }
  }

  /**
   * Remove storage change listener
   */
  public static removeChangeListener(callback: (changes: Record<string, chrome.storage.StorageChange>) => void): void {
    if (this.isAvailable()) {
      chrome.storage.onChanged.removeListener(callback);
    }
  }
}

/**
 * Local storage wrapper for temporary data
 */
export class LocalStorageManager {
  /**
   * Get data from Chrome local storage
   */
  public static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      console.error(`Failed to get local data for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set data in Chrome local storage
   */
  public static async set(key: string, value: any): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Failed to set local data for key "${key}":`, error);
      throw new Error(`Local storage operation failed: ${error}`);
    }
  }

  /**
   * Remove data from Chrome local storage
   */
  public static async remove(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error(`Failed to remove local data for key "${key}":`, error);
      throw new Error(`Local storage operation failed: ${error}`);
    }
  }

  /**
   * Clear all local storage data
   */
  public static async clear(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Failed to clear local storage:', error);
      throw new Error(`Local storage operation failed: ${error}`);
    }
  }
}