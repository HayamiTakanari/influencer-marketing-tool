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
  icon = '−',
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="text-center py-12" role="region" aria-label="空の状態">
      <div className="text-3xl mb-3 text-gray-400" aria-hidden="true">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
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
