// Settings validation utilities

import { Settings, Language, SUPPORTED_LANGUAGES, DEFAULT_SETTINGS } from '../../types/index.js';

/**
 * Settings validation utilities
 */
export class SettingsValidator {
  /**
   * Validate a complete settings object
   */
  public static validateSettings(settings: any): Settings {
    if (!settings || typeof settings !== 'object') {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      defaultTargetLanguage: this.validateLanguageCode(settings.defaultTargetLanguage),
      autoDetectLanguage: this.validateBoolean(settings.autoDetectLanguage, DEFAULT_SETTINGS.autoDetectLanguage),
      showTranslationTooltip: this.validateBoolean(settings.showTranslationTooltip, DEFAULT_SETTINGS.showTranslationTooltip),
      enableFullPageTranslation: this.validateBoolean(settings.enableFullPageTranslation, DEFAULT_SETTINGS.enableFullPageTranslation),
      enableStreamingTranslation: this.validateBoolean(settings.enableStreamingTranslation, DEFAULT_SETTINGS.enableStreamingTranslation),
      translationDelay: this.validateDelay(settings.translationDelay),
      shortcuts: this.validateShortcuts(settings.shortcuts)
    };
  }

  /**
   * Validate language code against supported languages
   */
  public static validateLanguageCode(languageCode: any): string {
    if (typeof languageCode !== 'string') {
      return DEFAULT_SETTINGS.defaultTargetLanguage;
    }

    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
    return isSupported ? languageCode : DEFAULT_SETTINGS.defaultTargetLanguage;
  }

  /**
   * Validate boolean value with fallback
   */
  public static validateBoolean(value: any, defaultValue: boolean): boolean {
    return typeof value === 'boolean' ? value : defaultValue;
  }

  /**
   * Validate translation delay (must be non-negative number)
   */
  public static validateDelay(delay: any): number {
    if (typeof delay === 'number' && delay >= 0 && delay <= 10000) {
      return delay;
    }
    return DEFAULT_SETTINGS.translationDelay;
  }

  /**
   * Validate shortcuts configuration
   */
  public static validateShortcuts(shortcuts: any): Settings['shortcuts'] {
    if (!shortcuts || typeof shortcuts !== 'object') {
      return { ...DEFAULT_SETTINGS.shortcuts };
    }

    return {
      translateSelected: this.validateShortcut(shortcuts.translateSelected, DEFAULT_SETTINGS.shortcuts.translateSelected),
      translateFullPage: this.validateShortcut(shortcuts.translateFullPage, DEFAULT_SETTINGS.shortcuts.translateFullPage)
    };
  }

  /**
   * Validate individual shortcut string
   */
  public static validateShortcut(shortcut: any, defaultShortcut: string): string {
    if (typeof shortcut !== 'string' || !this.isValidShortcut(shortcut)) {
      return defaultShortcut;
    }
    return shortcut;
  }

  /**
   * Check if shortcut string is valid
   */
  public static isValidShortcut(shortcut: string): boolean {
    // Basic validation for keyboard shortcuts
    const shortcutPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta))*\+[A-Z0-9]$/i;
    return shortcutPattern.test(shortcut);
  }

  /**
   * Validate partial settings update
   */
  public static validatePartialSettings(partialSettings: Partial<Settings>): Partial<Settings> {
    const validated: Partial<Settings> = {};

    if (partialSettings.defaultTargetLanguage !== undefined) {
      validated.defaultTargetLanguage = this.validateLanguageCode(partialSettings.defaultTargetLanguage);
    }

    if (partialSettings.autoDetectLanguage !== undefined) {
      validated.autoDetectLanguage = this.validateBoolean(partialSettings.autoDetectLanguage, DEFAULT_SETTINGS.autoDetectLanguage);
    }

    if (partialSettings.showTranslationTooltip !== undefined) {
      validated.showTranslationTooltip = this.validateBoolean(partialSettings.showTranslationTooltip, DEFAULT_SETTINGS.showTranslationTooltip);
    }

    if (partialSettings.enableFullPageTranslation !== undefined) {
      validated.enableFullPageTranslation = this.validateBoolean(partialSettings.enableFullPageTranslation, DEFAULT_SETTINGS.enableFullPageTranslation);
    }

    if (partialSettings.enableStreamingTranslation !== undefined) {
      validated.enableStreamingTranslation = this.validateBoolean(partialSettings.enableStreamingTranslation, DEFAULT_SETTINGS.enableStreamingTranslation);
    }

    if (partialSettings.translationDelay !== undefined) {
      validated.translationDelay = this.validateDelay(partialSettings.translationDelay);
    }

    if (partialSettings.shortcuts !== undefined) {
      validated.shortcuts = this.validateShortcuts(partialSettings.shortcuts);
    }

    return validated;
  }

  /**
   * Check if language is supported
   */
  public static isLanguageSupported(languageCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }

  /**
   * Get language info by code
   */
  public static getLanguageInfo(languageCode: string): Language | null {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || null;
  }

  /**
   * Get all supported language codes
   */
  public static getSupportedLanguageCodes(): string[] {
    return SUPPORTED_LANGUAGES.map(lang => lang.code);
  }
}