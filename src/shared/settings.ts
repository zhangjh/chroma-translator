// Settings data management module with Chrome Storage API integration

import { Settings, DEFAULT_SETTINGS, STORAGE_KEYS } from '../../types/index.js';

/**
 * Settings manager class for handling extension configuration
 */
export class SettingsManager {
  private static instance: SettingsManager;
  private cachedSettings: Settings | null = null;

  private constructor() {}

  /**
   * Get singleton instance of SettingsManager
   */
  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Get current settings, with fallback to defaults
   */
  public async getSettings(): Promise<Settings> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
      const storedSettings = result[STORAGE_KEYS.SETTINGS];
      
      // Merge with defaults to ensure all properties exist
      this.cachedSettings = this.mergeWithDefaults(storedSettings);
      return this.cachedSettings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to Chrome storage
   */
  public async saveSettings(settings: Partial<Settings>): Promise<void> {
    try {
      // Get current settings and merge with new ones
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      // Validate settings before saving
      const validatedSettings = this.validateSettings(updatedSettings);
      
      // Save to Chrome storage
      await chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: validatedSettings
      });
      
      // Update cache
      this.cachedSettings = validatedSettings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Get default target language
   */
  public async getDefaultTargetLanguage(): Promise<string> {
    const settings = await this.getSettings();
    return settings.defaultTargetLanguage;
  }

  /**
   * Set default target language
   */
  public async setDefaultTargetLanguage(languageCode: string): Promise<void> {
    await this.saveSettings({ defaultTargetLanguage: languageCode });
  }

  /**
   * Reset settings to defaults
   */
  public async resetSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
      });
      this.cachedSettings = DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw new Error('Failed to reset settings');
    }
  }

  /**
   * Clear settings cache (useful for testing or forced refresh)
   */
  public clearCache(): void {
    this.cachedSettings = null;
  }

  /**
   * Merge stored settings with defaults to ensure all properties exist
   */
  private mergeWithDefaults(storedSettings: any): Settings {
    if (!storedSettings || typeof storedSettings !== 'object') {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      defaultTargetLanguage: storedSettings.defaultTargetLanguage || DEFAULT_SETTINGS.defaultTargetLanguage,
      autoDetectLanguage: storedSettings.autoDetectLanguage ?? DEFAULT_SETTINGS.autoDetectLanguage,
      showTranslationTooltip: storedSettings.showTranslationTooltip ?? DEFAULT_SETTINGS.showTranslationTooltip,
      enableFullPageTranslation: storedSettings.enableFullPageTranslation ?? DEFAULT_SETTINGS.enableFullPageTranslation,
      enableStreamingTranslation: storedSettings.enableStreamingTranslation ?? DEFAULT_SETTINGS.enableStreamingTranslation,
      translationDelay: storedSettings.translationDelay || DEFAULT_SETTINGS.translationDelay,
      shortcuts: {
        translateSelected: storedSettings.shortcuts?.translateSelected || DEFAULT_SETTINGS.shortcuts.translateSelected,
        translateFullPage: storedSettings.shortcuts?.translateFullPage || DEFAULT_SETTINGS.shortcuts.translateFullPage
      }
    };
  }

  /**
   * Validate settings data
   */
  private validateSettings(settings: Settings): Settings {
    const validated: Settings = { ...settings };

    // Validate defaultTargetLanguage
    if (!validated.defaultTargetLanguage || typeof validated.defaultTargetLanguage !== 'string') {
      validated.defaultTargetLanguage = DEFAULT_SETTINGS.defaultTargetLanguage;
    }

    // Validate boolean fields
    validated.autoDetectLanguage = Boolean(validated.autoDetectLanguage);
    validated.showTranslationTooltip = Boolean(validated.showTranslationTooltip);
    validated.enableFullPageTranslation = Boolean(validated.enableFullPageTranslation);
    validated.enableStreamingTranslation = Boolean(validated.enableStreamingTranslation);

    // Validate translationDelay
    if (typeof validated.translationDelay !== 'number' || validated.translationDelay < 0) {
      validated.translationDelay = DEFAULT_SETTINGS.translationDelay;
    }

    // Validate shortcuts
    if (!validated.shortcuts || typeof validated.shortcuts !== 'object') {
      validated.shortcuts = { ...DEFAULT_SETTINGS.shortcuts };
    } else {
      validated.shortcuts.translateSelected = validated.shortcuts.translateSelected || DEFAULT_SETTINGS.shortcuts.translateSelected;
      validated.shortcuts.translateFullPage = validated.shortcuts.translateFullPage || DEFAULT_SETTINGS.shortcuts.translateFullPage;
    }

    return validated;
  }
}