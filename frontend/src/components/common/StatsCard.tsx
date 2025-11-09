import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  };
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = React.memo(({
  title,
  value,
  icon,
  badge,
  trend
}) => {
  const badgeColors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {badge && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${badgeColors[badge.color]}`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {trend && (
        <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  );
});

StatsCard.displayName = 'StatsCard';

export default StatsCard;
