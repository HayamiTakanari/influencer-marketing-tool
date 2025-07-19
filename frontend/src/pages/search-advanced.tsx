import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { searchInfluencers } from '../services/api';

const SearchAdvancedPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const router = useRouter();

  // 検索フィルター
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    prefecture: '',
    minFollowers: '',
    maxFollowers: '',
    page: 1,
    limit: 20,
    testLargeData: false, // パフォーマンステスト用
  });

  // パフォーマンス測定
  const [searchTime, setSearchTime] = useState<number>(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
      router.push('/dashboard');
      return;
    }

    // 初期検索実行
    handleSearch();
  }, [router]);

  const handleSearch = useCallback(async () => {
    const startTime = performance.now();
    setLoading(true);
    setError('');

    try {
      const searchParams = {
        ...filters,
        minFollowers: filters.minFollowers ? parseInt(filters.minFollowers) : undefined,
        maxFollowers: filters.maxFollowers ? parseInt(filters.maxFollowers) : undefined,
      };

      const result = await searchInfluencers(searchParams);
      const endTime = performance.now();
      
      setInfluencers(result.influencers || []);
      setPagination(result.pagination || null);
      setPerformance(result.performance || null);
      setSearchTime(endTime - startTime);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('検索に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // パフォーマンステストモードの切り替え
  const togglePerformanceTest = () => {
    setFilters(prev => ({ 
      ...prev, 
      testLargeData: !prev.testLargeData,
      page: 1 
    }));
  };

  // 自動検索を無効化し、手動検索ボタンを使用
  // useEffect(() => {
  //   const timeoutId = setTimeout(handleSearch, 500);
  //   return () => clearTimeout(timeoutId);
  // }, [filters]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8"
        >
          インフルエンサー検索（高度版）
        </motion.h1>

        {/* パフォーマンス情報 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">検索時間</p>
              <p className="text-lg font-bold text-blue-600">{searchTime.toFixed(0)}ms</p>
            </div>
            {pagination && (
              <div className="text-center">
                <p className="text-sm text-gray-600">総件数</p>
                <p className="text-lg font-bold text-green-600">{pagination.total.toLocaleString()}</p>
              </div>
            )}
            {performance && (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-600">サーバー応答時間</p>
                  <p className="text-lg font-bold text-purple-600">{performance.responseTime}ms</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">キャッシュ</p>
                  <p className={`text-lg font-bold ${performance.cacheHit ? 'text-green-600' : 'text-gray-600'}`}>
                    {performance.cacheHit ? 'HIT' : 'MISS'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* パフォーマンステストモード */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-yellow-800">パフォーマンステストモード</h3>
              <p className="text-sm text-yellow-700">
                {filters.testLargeData ? '10,000件のデータでテスト中' : '通常モード（50件）'}
              </p>
            </div>
            <button
              onClick={togglePerformanceTest}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filters.testLargeData 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-200 text-yellow-800'
              }`}
            >
              {filters.testLargeData ? '通常モードに切り替え' : 'テストモードに切り替え'}
            </button>
          </div>
        </div>

        {/* 検索フィルター */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">キーワード</label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="インフルエンサー名..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
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
                onChange={(e) => handleFilterChange('prefecture', e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">最小フォロワー数</label>
              <input
                type="number"
                value={filters.minFollowers}
                onChange={(e) => handleFilterChange('minFollowers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">表示件数</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
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
              onClick={handleSearch}
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
              onClick={() => {
                setFilters({
                  query: '',
                  category: '',
                  prefecture: '',
                  minFollowers: '',
                  maxFollowers: '',
                  page: 1,
                  limit: 20,
                  testLargeData: filters.testLargeData,
                });
                handleSearch();
              }}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              リセット
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">検索中...</p>
          </div>
        )}

        {/* 検索結果 */}
        {!loading && influencers.length > 0 && (
          <>
            {/* ページネーション情報 */}
            {pagination && (
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  {pagination.total.toLocaleString()}件中 {((pagination.page - 1) * pagination.limit + 1).toLocaleString()}-{Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()}件を表示
                </p>
                <p className="text-gray-600">
                  ページ {pagination.page} / {pagination.totalPages}
                </p>
              </div>
            )}

            {/* インフルエンサーリスト */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {influencers.map((influencer) => (
                <motion.div
                  key={influencer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{influencer.displayName}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{influencer.bio}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {influencer.categories?.map((category: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{influencer.prefecture}</span>
                    {influencer.socialAccounts && influencer.socialAccounts[0] && (
                      <span>
                        {influencer.socialAccounts[0].followerCount?.toLocaleString()}人
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    ¥{influencer.priceMin?.toLocaleString()} - ¥{influencer.priceMax?.toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ページネーション */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
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
                      onClick={() => handlePageChange(page)}
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
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}

        {/* 検索結果なし */}
        {!loading && influencers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">検索条件に一致するインフルエンサーが見つかりませんでした。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAdvancedPage;