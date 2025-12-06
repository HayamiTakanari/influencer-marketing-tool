import React from 'react';

interface SearchPaginationProps {
  pagination: {
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    total: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onExportCSV: () => void;
  onExportAllCSV: () => void;
  loading: boolean;
}

const SearchPagination: React.FC<SearchPaginationProps> = ({
  pagination,
  onPageChange,
  onExportCSV,
  onExportAllCSV,
  loading
}) => {
  return (
    <div className="space-y-6">
      {/* ページネーション情報とCSV抽出ボタン */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">
              {((pagination.page - 1) * pagination.limit + 1).toLocaleString()} - {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()}
            </span>
            {' '}件 / 全{' '}
            <span className="font-semibold">{pagination.total.toLocaleString()}</span>
            {' '}件
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <span>📊</span>
            <span>現在ページCSV抽出</span>
          </button>
          <button
            onClick={onExportAllCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            <span>📁</span>
            <span>全データCSV抽出</span>
          </button>
        </div>
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            前へ
          </button>
          
          {Array.from({ length: Math.min(10, pagination.totalPages) }, (_, i) => {
            const page = Math.max(1, pagination.page - 5) + i;
            if (page > pagination.totalPages) return null;
            
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 rounded-lg border ${
                  page === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPagination;