import React from 'react';
import Button from '../shared/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

const ErrorState: React.FC<ErrorStateProps> = React.memo(({
  title = 'エラーが発生しました',
  message,
  onRetry,
  retryLabel = '再試行'
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-red-700 mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary" size="md">
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

ErrorState.displayName = 'ErrorState';

export default ErrorState;
