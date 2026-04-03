/**
 * Utility functions
 */

import { useNotificationStore } from '../stores/useNotificationStore';

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

/**
 * Show error notification (replaces blocking alert())
 */
export function showError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  useNotificationStore.getState().addNotification(`${context}: ${message}`, 'error');
}
