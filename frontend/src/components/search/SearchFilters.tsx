import React from 'react';

interface SearchFiltersProps {
  filters: {
    query: string;
    category: string;
    prefecture: string;
    platform: string;
    minFollowers: string;
    maxFollowers: string;
    limit: number;
  };
  loading: boolean;
  onFilterChange: (key: string, value: any) => void;
  onSearch: () => void;
  onReset: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  loading,
  onFilterChange,
  onSearch,
  onReset
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">キーワード</label>
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onFilterChange('query', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="インフルエンサー名..."
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全て</option>
            <option value="美容">美容</option>
            <option value="ライフスタイル">ライフスタイル</option>
            <option value="ファッション">ファッション</option>
            <option value="グルメ">グルメ</option>
            <option value="旅行">旅行</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
          <select
            value={filters.prefecture}
            onChange={(e) => onFilterChange('prefecture', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全て</option>
            <option value="東京都">東京都</option>
            <option value="大阪府">大阪府</option>
            <option value="神奈川県">神奈川県</option>
            <option value="愛知県">愛知県</option>
            <option value="福岡県">福岡県</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SNSプラットフォーム</label>
          <select
            value={filters.platform}
            onChange={(e) => onFilterChange('platform', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全て</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="X">X (Twitter)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">最小フォロワー数</label>
          <input
            type="number"
            value={filters.minFollowers}
            onChange={(e) => onFilterChange('minFollowers', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1000"
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">最大フォロワー数</label>
          <input
            type="number"
            value={filters.maxFollowers}
            onChange={(e) => onFilterChange('maxFollowers', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="100000"
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">表示件数</label>
          <select
            value={filters.limit}
            onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10件</option>
            <option value={20}>20件</option>
            <option value={50}>50件</option>
            <option value={100}>100件</option>
          </select>
        </div>
      </div>

      {/* 検索ボタンエリア */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            onSearch();
          }}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>検索中...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>検索実行</span>
            </>
          )}
        </button>
        
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
        >
          リセット
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;