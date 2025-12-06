import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-red-900 mb-2">エラーが発生しました</h3>
      <p className="text-red-700 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          再試行
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;