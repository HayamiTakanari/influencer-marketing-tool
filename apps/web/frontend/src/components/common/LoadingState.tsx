import React from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingState: React.FC<LoadingStateProps> = React.memo(({ 
  message = '読み込み中...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
      <div className="text-center">
        <div 
          className={`animate-spin rounded-full border-b-2 border-emerald-500 mx-auto mb-4 ${sizeClasses[size]}`}
          aria-hidden="true"
        ></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

export default LoadingState;
