import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchFields?: (keyof T)[];
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  loading?: boolean;
}

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export function DataTable<T extends { id?: string | number }>(
  {
    data,
    columns,
    pageSize = 10,
    searchable = true,
    searchFields = [],
    rowClassName,
    onRowClick,
    className = '',
    loading = false
  }: DataTableProps<T>
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);

  // フィルタリング
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchable) return data;

    return data.filter((item) => {
      const fields = searchFields.length > 0 ? searchFields : columns.map(col => col.key);
      return fields.some(field => {
        const value = String(item[field] || '').toLowerCase();
        return value.includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, searchable, searchFields, columns]);

  // ソート
  const sortedData = useMemo(() => {
    if (!sort) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sort.key as keyof T];
      const bVal = b[sort.key as keyof T];

      if (aVal === bVal) return 0;
      const comparison = aVal < bVal ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sort]);

  // ページネーション
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: string) => {
    if (sort?.key === key) {
      setSort({
        key,
        direction: sort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSort({ key, direction: 'asc' });
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sort?.key !== columnKey) return '⇅';
    return sort.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 検索バー */}
      {searchable && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              クリア
            </button>
          )}
        </div>
      )}

      {/* テーブル */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left font-semibold text-gray-700 ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      {column.label}
                      <span className="text-xs">{getSortIcon(String(column.key))}</span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  データがありません
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName?.(item, index) || ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 text-gray-700 ${column.className || ''}`}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm text-gray-600">
            {sortedData.length > 0 && (
              <span>
                {startIndex + 1}～{Math.min(startIndex + pageSize, sortedData.length)} / 全{sortedData.length}件
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              前へ
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
