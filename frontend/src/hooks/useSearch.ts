import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

interface UseSearchOptions<T> {
  initialFilters?: Record<string, any>;
  searchFunction: (params: any) => Promise<{ data: T[]; pagination?: any }>;
  onSuccess?: (data: T[]) => void;
  onError?: (error: any) => void;
}

interface UseSearchReturn<T> {
  data: T[];
  loading: boolean;
  error: string;
  pagination: any;
  filters: Record<string, any>;
  search: () => Promise<void>;
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
}

export function useSearch<T = any>({
  initialFilters = {},
  searchFunction,
  onSuccess,
  onError,
}: UseSearchOptions<T>): UseSearchReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [filters, setFilters] = useState<Record<string, any>>({
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  const { handleError: showError } = useErrorHandler();

  const search = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await searchFunction(filters);
      setData(result.data || []);
      setPagination(result.pagination || null);
      
      if (onSuccess) {
        onSuccess(result.data || []);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || '検索に失敗しました';
      setError(errorMessage);
      showError(err, '検索');
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, searchFunction, onSuccess, onError, showError]);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: filters.limit || 20,
      ...initialFilters,
    });
  }, [initialFilters, filters.limit]);

  const setPage = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);

  return {
    data,
    loading,
    error,
    pagination,
    filters,
    search,
    updateFilter,
    resetFilters,
    setPage,
  };
}
