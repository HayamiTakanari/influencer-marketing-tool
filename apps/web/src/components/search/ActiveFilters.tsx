import React from 'react';

interface ActiveFiltersProps {
  filters: {
    query: string;
    category: string;
    prefecture: string;
    platform: string;
    minFollowers: string;
    maxFollowers: string;
  };
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters }) => {
  const hasActiveFilters = filters.query || filters.category || filters.prefecture || 
                          filters.platform || filters.minFollowers || filters.maxFollowers;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <h3 className="font-semibold text-blue-900 mb-2">現在の検索条件</h3>
      <div className="flex flex-wrap gap-2">
        {filters.query && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            キーワード: {filters.query}
          </span>
        )}
        {filters.category && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            カテゴリ: {filters.category}
          </span>
        )}
        {filters.prefecture && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            都道府県: {filters.prefecture}
          </span>
        )}
        {filters.platform && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
            📱 {filters.platform}専門
          </span>
        )}
        {filters.minFollowers && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            最小フォロワー: {parseInt(filters.minFollowers).toLocaleString()}
          </span>
        )}
        {filters.maxFollowers && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            最大フォロワー: {parseInt(filters.maxFollowers).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;