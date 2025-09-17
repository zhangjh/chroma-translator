// Options page functionality for Chrome Translation Extension

import { Settings } from '../../types/interfaces.js';
import { SUPPORTED_LANGUAGES, DEFAULT_SETTINGS } from '../../types/constants.js';
import { SettingsManager } from '../shared/settings.js';
import { SettingsValidator } from '../shared/settings-validator.js';

/**
 * Options page controller class
 */
class OptionsPage {
  private settingsManager: SettingsManager;
  private currentSettings: Settings;
  private isLoading: boolean = false;

  // DOM elements
  private elements!: {
    // Message display
    message: HTMLElement;
    loadingOverlay: HTMLElement;
    
    // Language settings
    defaultTargetLanguage: HTMLSelectElement;
    autoDetectLanguage: HTMLInputElement;
    
    // Translation behavior
    showTranslationTooltip: HTMLInputElement;
    enableFullPageTranslation: HTMLInputElement;
    enableStreamingTranslation: HTMLInputElement;
    translationDelay: HTMLInputElement;
    
    // Keyboard shortcuts
    translateSelectedShortcut: HTMLInputElement;
    translateFullPageShortcut: HTMLInputElement;
    
    // Action buttons
    saveSettings: HTMLButtonElement;
    resetSettings: HTMLButtonElement;
  };

  constructor() {
    this.settingsManager = SettingsManager.getInstance();
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
  }

  /**
   * Initialize DOM element references
   */
  private initializeElements(): void {
    this.elements = {
      message: document.getElementById('message') as HTMLElement,
      loadingOverlay: document.getElementById('loadingOverlay') as HTMLElement,
      defaultTargetLanguage: document.getElementById('defaultTargetLanguage') as HTMLSelectElement,
      autoDetectLanguage: document.getElementById('autoDetectLanguage') as HTMLInputElement,
      showTranslationTooltip: document.getElementById('showTranslationTooltip') as HTMLInputElement,
      enableFullPageTranslation: document.getElementById('enableFullPageTranslation') as HTMLInputElement,
      enableStreamingTranslation: document.getElementById('enableStreamingTranslation') as HTMLInputElement,
      translationDelay: document.getElementById('translationDelay') as HTMLInputElement,
      translateSelectedShortcut: document.getElementById('translateSelectedShortcut') as HTMLInputElement,
      translateFullPageShortcut: document.getElementById('translateFullPageShortcut') as HTMLInputElement,
      saveSettings: document.getElementById('saveSettings') as HTMLButtonElement,
      resetSettings: document.getElementById('resetSettings') as HTMLButtonElement
    };

    // Validate all elements exist
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        console.error(`Element not found: ${key}`);
      }
    }
  }

  /**
   * Setup event listeners for form interactions
   */
  private setupEventListeners(): void {
    // Save settings button
    this.elements.saveSettings.addEventListener('click', () => {
      this.saveSettings();
    });

    // Reset settings button
    this.elements.resetSettings.addEventListener('click', () => {
      this.resetSettings();
    });

    // Form change detection for unsaved changes warning
    const formElements = [
      this.elements.defaultTargetLanguage,
      this.elements.autoDetectLanguage,
      this.elements.showTranslationTooltip,
      this.elements.enableFullPageTranslation,
      this.elements.enableStreamingTranslation,
      this.elements.translationDelay,
      this.elements.translateSelectedShortcut,
      this.elements.translateFullPageShortcut
    ];

    formElements.forEach(element => {
      element.addEventListener('change', () => {
        this.onFormChange();
      });
    });

    // Keyboard shortcut validation
    this.elements.translateSelectedShortcut.addEventListener('blur', () => {
      this.validateShortcut(this.elements.translateSelectedShortcut);
    });

    this.elements.translateFullPageShortcut.addEventListener('blur', () => {
      this.validateShortcut(this.elements.translateFullPageShortcut);
    });

    // Translation delay validation
    this.elements.translationDelay.addEventListener('input', () => {
      this.validateDelay();
    });
  }

  /**
   * Load current settings and populate form
   */
  private async loadSettings(): Promise<void> {
    try {
      this.showLoading(true);
      
      // Load supported languages first
      await this.populateLanguageOptions();
      
      // Load current settings
      this.currentSettings = await this.settingsManager.getSettings();
      
      // Populate form with current settings
      this.populateForm();
      
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showMessage('Failed to load settings. Please refresh the page.', 'error');
      this.showLoading(false);
    }
  }

  /**
   * Populate language dropdown options
   */
  private async populateLanguageOptions(): Promise<void> {
    const select = this.elements.defaultTargetLanguage;
    
    // Clear existing options
    select.innerHTML = '';
    
    // Add supported languages
    SUPPORTED_LANGUAGES.forEach(language => {
      const option = document.createElement('option');
      option.value = language.code;
      option.textContent = `${language.name} (${language.nativeName})`;
      select.appendChild(option);
    });
  }

  /**
   * Populate form fields with current settings
   */
  private populateForm(): void {
    this.elements.defaultTargetLanguage.value = this.currentSettings.defaultTargetLanguage;
    this.elements.autoDetectLanguage.checked = this.currentSettings.autoDetectLanguage;
    this.elements.showTranslationTooltip.checked = this.currentSettings.showTranslationTooltip;
    this.elements.enableFullPageTranslation.checked = this.currentSettings.enableFullPageTranslation;
    this.elements.enableStreamingTranslation.checked = this.currentSettings.enableStreamingTranslation;
    this.elements.translationDelay.value = this.currentSettings.translationDelay.toString();
    this.elements.translateSelectedShortcut.value = this.currentSettings.shortcuts.translateSelected;
    this.elements.translateFullPageShortcut.value = this.currentSettings.shortcuts.translateFullPage;
  }

  /**
   * Collect form data and create settings object
   */
  private collectFormData(): Settings {
    return {
      defaultTargetLanguage: this.elements.defaultTargetLanguage.value,
      autoDetectLanguage: this.elements.autoDetectLanguage.checked,
      showTranslationTooltip: this.elements.showTranslationTooltip.checked,
      enableFullPageTranslation: this.elements.enableFullPageTranslation.checked,
      enableStreamingTranslation: this.elements.enableStreamingTranslation.checked,
      translationDelay: parseInt(this.elements.translationDelay.value, 10),
      shortcuts: {
        translateSelected: this.elements.translateSelectedShortcut.value,
        translateFullPage: this.elements.translateFullPageShortcut.value
      }
    };
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      this.setButtonsEnabled(false);

      // Collect and validate form data
      const formData = this.collectFormData();
      const validatedSettings = SettingsValidator.validateSettings(formData);

      // Save to storage
      await this.settingsManager.saveSettings(validatedSettings);
      
      // Update current settings
      this.currentSettings = validatedSettings;
      
      // Update form with validated values (in case any were corrected)
      this.populateForm();
      
      this.showMessage('Settings saved successfully!', 'success');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showMessage('Failed to save settings. Please try again.', 'error');
    } finally {
      this.isLoading = false;
      this.setButtonsEnabled(true);
    }
  }

  /**
   * Reset settings to defaults
   */
  private async resetSettings(): Promise<void> {
    if (this.isLoading) return;

    const confirmed = confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.');
    if (!confirmed) return;

    try {
      this.isLoading = true;
      this.setButtonsEnabled(false);

      // Reset to defaults
      await this.settingsManager.resetSettings();
      
      // Update current settings
      this.currentSettings = { ...DEFAULT_SETTINGS };
      
      // Repopulate form
      this.populateForm();
      
      this.showMessage('Settings reset to defaults successfully!', 'success');
      
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showMessage('Failed to reset settings. Please try again.', 'error');
    } finally {
      this.isLoading = false;
      this.setButtonsEnabled(true);
    }
  }

  /**
   * Handle form changes
   */
  private onFormChange(): void {
    // Could add unsaved changes indicator here
    // For now, just ensure buttons are enabled
    if (!this.isLoading) {
      this.setButtonsEnabled(true);
    }
  }

  /**
   * Validate keyboard shortcut input
   */
  private validateShortcut(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !SettingsValidator.isValidShortcut(value)) {
      input.setCustomValidity('Invalid shortcut format. Use format like "Ctrl+Shift+T"');
      input.reportValidity();
    } else {
      input.setCustomValidity('');
    }
  }

  /**
   * Validate translation delay input
   */
  private validateDelay(): void {
    const value = parseInt(this.elements.translationDelay.value, 10);
    if (isNaN(value) || value < 0 || value > 5000) {
      this.elements.translationDelay.setCustomValidity('Delay must be between 0 and 5000 milliseconds');
      this.elements.translationDelay.reportValidity();
    } else {
      this.elements.translationDelay.setCustomValidity('');
    }
  }

  /**
   * Show loading overlay
   */
  private showLoading(show: boolean): void {
    if (show) {
      this.elements.loadingOverlay.classList.remove('hidden');
    } else {
      this.elements.loadingOverlay.classList.add('hidden');
    }
  }

  /**
   * Show message to user
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.elements.message.textContent = message;
    this.elements.message.className = `message ${type}`;
    this.elements.message.classList.remove('hidden');

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.hideMessage();
      }, 3000);
    }
  }

  /**
   * Hide message
   */
  private hideMessage(): void {
    this.elements.message.classList.add('hidden');
  }

  /**
   * Enable/disable action buttons
   */
  private setButtonsEnabled(enabled: boolean): void {
    this.elements.saveSettings.disabled = !enabled;
    this.elements.resetSettings.disabled = !enabled;
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});