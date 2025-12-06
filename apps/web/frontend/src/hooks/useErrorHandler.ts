import { useCallback } from 'react';
import { useErrorContext } from '../contexts/ErrorContext';
import { getErrorMessage } from '../utils/errorMessages';

export const useErrorHandler = () => {
  const { showError, showWarning, showSuccess } = useErrorContext();

  const handleError = useCallback((error: any, context?: string) => {
    const message = getErrorMessage(error, context);
    showError(message);
    console.error(`Error in ${context || 'unknown context'}:`, error);
  }, [showError]);

  const handleWarning = useCallback((message: string) => {
    showWarning(message);
  }, [showWarning]);

  const handleSuccess = useCallback((message: string) => {
    showSuccess(message);
  }, [showSuccess]);

  const asyncHandler = useCallback(<T,>(
    fn: () => Promise<T>,
    context?: string,
    successMessage?: string
  ) => {
    return async (): Promise<T | undefined> => {
      try {
        const result = await fn();
        if (successMessage) {
          showSuccess(successMessage);
        }
        return result;
      } catch (error) {
        handleError(error, context);
        return undefined;
      }
    };
  }, [handleError, showSuccess]);

  return {
    handleError,
    handleWarning,
    handleSuccess,
    asyncHandler,
  };
};
