import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ErrorMessage {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  duration?: number;
}

interface ErrorContextType {
  errors: ErrorMessage[];
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorMessage[]>([]);

  const addError = useCallback((type: ErrorMessage['type'], message: string, duration = 5000) => {
    const id = `${Date.now()}-${Math.random()}`;
    const error: ErrorMessage = { id, type, message, duration };
    
    setErrors(prev => [...prev, error]);

    if (duration > 0) {
      setTimeout(() => {
        setErrors(prev => prev.filter(e => e.id !== id));
      }, duration);
    }
  }, []);

  const showError = useCallback((message: string, duration = 5000) => {
    addError('error', message, duration);
  }, [addError]);

  const showWarning = useCallback((message: string, duration = 5000) => {
    addError('warning', message, duration);
  }, [addError]);

  const showInfo = useCallback((message: string, duration = 5000) => {
    addError('info', message, duration);
  }, [addError]);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    addError('success', message, duration);
  }, [addError]);

  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        showError,
        showWarning,
        showInfo,
        showSuccess,
        clearError,
        clearAllErrors,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};
