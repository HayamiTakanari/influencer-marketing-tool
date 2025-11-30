import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: {
    text?: string;
    label?: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  };
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = React.memo(({
  title,
  value,
  icon,
  badge,
  trend,
  onClick,
  className = ''
}) => {
  const badgeColors = {
    blue: 'bg-blue-100 text-blue-700 border border-blue-200',
    green: 'bg-green-100 text-green-700 border border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    red: 'bg-red-100 text-red-700 border border-red-200',
    gray: 'bg-gray-100 text-gray-700 border border-gray-200'
  };

  const iconBgColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  const badgeColor = badge?.color || 'gray';

  return (
    <div
      className={`bg-white rounded-lg p-4 md:p-6 border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {icon && (
            <div className={`p-2 md:p-3 rounded-lg ${iconBgColors[badgeColor]} flex-shrink-0`}>
              <span className="text-lg md:text-xl">{icon}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs md:text-sm font-medium text-gray-600 truncate">{title}</h3>
          </div>
        </div>
        {badge && (
          <span className={`ml-2 px-2 md:px-3 py-1 rounded text-xs font-semibold flex-shrink-0 ${badgeColors[badgeColor]}`}>
            {badge.text || badge.label}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {trend && (
          <div className={`flex items-center gap-1 text-xs md:text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-lg">{trend.isPositive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';

export default StatsCard;
