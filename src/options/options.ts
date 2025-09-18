// Options page functionality

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
      this.elements.defaultTargetLanguage
    ];

    formElements.forEach(element => {
      element.addEventListener('change', () => {
        this.onFormChange();
      });
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
  }

  /**
   * Collect form data and create settings object
   */
  private collectFormData(): Settings {
    return {
      ...this.currentSettings,
      defaultTargetLanguage: this.elements.defaultTargetLanguage.value
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