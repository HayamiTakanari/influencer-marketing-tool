import React from 'react';
import Button from '../shared/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="text-center py-12" role="region" aria-label="空の状態">
      <div className="text-6xl mb-4" aria-hidden="true">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="lg" aria-label={actionLabel}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
