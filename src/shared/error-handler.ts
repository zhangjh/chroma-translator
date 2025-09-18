// Global error handling mechanism

import { TranslationError, TranslationErrorType } from '../../types/interfaces.js';
import { ERROR_MESSAGES, CONFIG } from '../../types/constants.js';

/**
 * Global error handler for translation operations
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private retryAttempts: Map<string, number> = new Map();
  private errorListeners: Set<(error: TranslationError) => void> = new Set();

  private constructor() {}

  /**
   * Get singleton instance of ErrorHandler
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle translation errors with retry logic
   */
  public async handleError(
    error: any, 
    context: string,
    retryCallback?: () => Promise<any>
  ): Promise<TranslationError> {
    const translationError = this.parseError(error, context);
    // Notify error listeners
    this.notifyErrorListeners(translationError);
    
    // Handle retry logic for retryable errors
    if (translationError.retryable && retryCallback) {
      const retryKey = `${context}_${Date.now()}`;
      const attempts = this.retryAttempts.get(retryKey) || 0;
      
      if (attempts < CONFIG.RETRY_ATTEMPTS) {
        this.retryAttempts.set(retryKey, attempts + 1);
        
        // Calculate exponential backoff delay
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempts);
        
        console.log(`Retrying ${context} (attempt ${attempts + 1}/${CONFIG.RETRY_ATTEMPTS}) after ${delay}ms`);
        
        try {
          await this.delay(delay);
          const result = await retryCallback();
          
          // Clear retry count on success
          this.retryAttempts.delete(retryKey);
          return result;
        } catch (retryError) {
          // If this was the last attempt, return the error
          if (attempts + 1 >= CONFIG.RETRY_ATTEMPTS) {
            this.retryAttempts.delete(retryKey);
            return this.parseError(retryError, context);
          }
          
          // Otherwise, try again
          return this.handleError(retryError, context, retryCallback);
        }
      }
    }
    
    return translationError;
  }

  /**
   * Parse generic error into TranslationError
   */
  public parseError(error: any, context: string): TranslationError {
    // If it's already a TranslationError, return as is
    if (this.isTranslationError(error)) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Determine error type based on error message
    let errorType: TranslationErrorType;
    let retryable = false;
    let message = ERROR_MESSAGES.TRANSLATION_FAILED;

    if (lowerMessage.includes('api') && lowerMessage.includes('unavailable')) {
      errorType = TranslationErrorType.API_UNAVAILABLE;
      message = ERROR_MESSAGES.API_UNAVAILABLE;
      retryable = false;
    } else if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      errorType = TranslationErrorType.NETWORK_ERROR;
      message = ERROR_MESSAGES.NETWORK_ERROR;
      retryable = true;
    } else if (lowerMessage.includes('quota') || lowerMessage.includes('limit')) {
      errorType = TranslationErrorType.QUOTA_EXCEEDED;
      message = ERROR_MESSAGES.QUOTA_EXCEEDED;
      retryable = true;
    } else if (lowerMessage.includes('language') || lowerMessage.includes('invalid')) {
      errorType = TranslationErrorType.INVALID_LANGUAGE;
      message = ERROR_MESSAGES.INVALID_LANGUAGE;
      retryable = false;
    } else if (lowerMessage.includes('too long') || lowerMessage.includes('length')) {
      errorType = TranslationErrorType.TEXT_TOO_LONG;
      message = ERROR_MESSAGES.TEXT_TOO_LONG;
      retryable = false;
    } else {
      // Default to network error for unknown errors (most likely to be retryable)
      errorType = TranslationErrorType.NETWORK_ERROR;
      message = `${ERROR_MESSAGES.TRANSLATION_FAILED} (${context})`;
      retryable = true;
    }

    return {
      type: errorType,
      message,
      retryable
    };
  }

  /**
   * Create a specific translation error
   */
  public createError(
    type: TranslationErrorType, 
    customMessage?: string
  ): TranslationError {
    const message = customMessage || this.getDefaultErrorMessage(type);
    const retryable = this.isErrorRetryable(type);

    return {
      type,
      message,
      retryable
    };
  }

  /**
   * Check if Chrome Translation API is available
   */
  public async checkApiAvailability(): Promise<TranslationError | null> {
    try {
      if (!('Translator' in self)) {
        // The Translator API is supported.
        return this.createError(
          TranslationErrorType.API_UNAVAILABLE,
          'Chrome AI Translation API is not available. Please ensure you are using Chrome 118+ with AI features enabled.'
        );
      }
      if(!('LanguageDetector' in self)) {
        return this.createError(
          TranslationErrorType.API_UNAVAILABLE,
          'Chrome AI Detect Language API is not available. Please ensure you are using Chrome 118+ with AI features enabled.'
        );
      }
      return null; // API is available
    } catch (error) {
      return this.createError(
        TranslationErrorType.API_UNAVAILABLE,
        'Failed to check Chrome Translation API availability.'
      );
    }
  }

  /**
   * Validate text length before translation
   */
  public validateTextLength(text: string): TranslationError | null {
    if (!text || text.trim().length === 0) {
      return this.createError(
        TranslationErrorType.INVALID_LANGUAGE,
        ERROR_MESSAGES.NO_TEXT_SELECTED
      );
    }

    if (text.length > CONFIG.MAX_TEXT_LENGTH) {
      return this.createError(
        TranslationErrorType.TEXT_TOO_LONG,
        `Text exceeds maximum length of ${CONFIG.MAX_TEXT_LENGTH} characters.`
      );
    }

    return null;
  }

  /**
   * Add error listener for global error handling
   */
  public addErrorListener(listener: (error: TranslationError) => void): void {
    this.errorListeners.add(listener);
  }

  /**
   * Remove error listener
   */
  public removeErrorListener(listener: (error: TranslationError) => void): void {
    this.errorListeners.delete(listener);
  }

  /**
   * Clear all retry attempts (useful for testing or reset)
   */
  public clearRetryAttempts(): void {
    this.retryAttempts.clear();
  }

  /**
   * Get retry count for a specific context
   */
  public getRetryCount(context: string): number {
    const keys = Array.from(this.retryAttempts.keys()).filter(key => key.startsWith(context));
    return keys.reduce((total, key) => total + (this.retryAttempts.get(key) || 0), 0);
  }

  /**
   * Check if error is a TranslationError
   */
  private isTranslationError(error: any): error is TranslationError {
    return error && 
           typeof error === 'object' && 
           'type' in error && 
           'message' in error && 
           'retryable' in error;
  }

  /**
   * Get default error message for error type
   */
  private getDefaultErrorMessage(type: TranslationErrorType): string {
    switch (type) {
      case TranslationErrorType.API_UNAVAILABLE:
        return ERROR_MESSAGES.API_UNAVAILABLE;
      case TranslationErrorType.NETWORK_ERROR:
        return ERROR_MESSAGES.NETWORK_ERROR;
      case TranslationErrorType.INVALID_LANGUAGE:
        return ERROR_MESSAGES.INVALID_LANGUAGE;
      case TranslationErrorType.TEXT_TOO_LONG:
        return ERROR_MESSAGES.TEXT_TOO_LONG;
      case TranslationErrorType.QUOTA_EXCEEDED:
        return ERROR_MESSAGES.QUOTA_EXCEEDED;
      default:
        return ERROR_MESSAGES.TRANSLATION_FAILED;
    }
  }

  /**
   * Check if error type is retryable
   */
  private isErrorRetryable(type: TranslationErrorType): boolean {
    return type === TranslationErrorType.NETWORK_ERROR || 
           type === TranslationErrorType.QUOTA_EXCEEDED;
  }

  /**
   * Notify all error listeners
   */
  private notifyErrorListeners(error: TranslationError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Utility method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}