import React from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiSelect' | 'number' | 'range';
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

interface SearchFiltersProps {
  filters: Record<string, any>;
  config: FilterConfig[];
  onFilterChange: (key: string, value: any) => void;
  onClear: () => void;
  onSearch?: () => void;
  loading?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  config,
  onFilterChange,
  onClear,
  onSearch,
  loading = false,
}) => {
  const renderFilter = (filterConfig: FilterConfig) => {
    const { key, label, type, options, placeholder, min, max } = filterConfig;

    switch (type) {
      case 'text':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <input
              type="text"
              value={filters[key] || ''}
              onChange={(e) => onFilterChange(key, e.target.value)}
              placeholder={placeholder}
              onKeyPress={(e) => e.key === 'Enter' && onSearch?.()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        );

      case 'select':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <select
              value={filters[key] || ''}
              onChange={(e) => onFilterChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">すべて</option>
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiSelect':
        return (
          <div key={key} className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <div className="flex flex-wrap gap-2">
              {options?.map((opt) => {
                const selected = filters[key]?.includes(opt.value) || false;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const current = filters[key] || [];
                      const newValue = selected
                        ? current.filter((v: string) => v !== opt.value)
                        : [...current, opt.value];
                      onFilterChange(key, newValue);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <input
              type="number"
              value={filters[key] || ''}
              onChange={(e) => onFilterChange(key, e.target.value)}
              placeholder={placeholder}
              min={min}
              max={max}
              onKeyPress={(e) => e.key === 'Enter' && onSearch?.()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        );

      case 'range':
        const minKey = `${key}Min`;
        const maxKey = `${key}Max`;
        return (
          <div key={key} className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters[minKey] || ''}
                onChange={(e) => onFilterChange(minKey, e.target.value)}
                placeholder="最小値"
                min={min}
                onKeyPress={(e) => e.key === 'Enter' && onSearch?.()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="number"
                value={filters[maxKey] || ''}
                onChange={(e) => onFilterChange(maxKey, e.target.value)}
                placeholder="最大値"
                max={max}
                onKeyPress={(e) => e.key === 'Enter' && onSearch?.()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">検索フィルター</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.map((filterConfig) => renderFilter(filterConfig))}
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="secondary" size="sm" onClick={onClear}>
          フィルターをクリア
        </Button>
        {onSearch && (
          <Button variant="primary" size="sm" onClick={onSearch} disabled={loading}>
            {loading ? '検索中...' : '検索'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SearchFilters;