import { useState, useCallback } from 'react';

interface SearchFilters {
  query: string;
  category: string;
  prefecture: string;
  platform: string;
  minFollowers: string;
  maxFollowers: string;
  page: number;
  limit: number;
  testLargeData: boolean;
}

const initialFilters: SearchFilters = {
  query: '',
  category: '',
  prefecture: '',
  platform: '',
  minFollowers: '',
  maxFollowers: '',
  page: 1,
  limit: 20,
  testLargeData: false,
};

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(prev => ({
      ...initialFilters,
      testLargeData: prev.testLargeData, // テストモードの状態は保持
    }));
  }, []);

  const updatePage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const toggleTestMode = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      testLargeData: !prev.testLargeData,
      page: 1
    }));
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    updatePage,
    toggleTestMode
  };
};