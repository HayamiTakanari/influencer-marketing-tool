import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { searchInfluencers } from '../services/api';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

const SearchPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [searchTime, setSearchTime] = useState<number>(0);
  const router = useRouter();

  // 検索フィルター
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    prefecture: '',
    platform: '',
    minFollowers: '',
    maxFollowers: '',
    sortBy: 'relevance',
    page: 1,
    limit: 20,
  });

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
  }, [router]);

  useEffect(() => {
    if (user) {
      handleSearch();
    }
  }, [user]);

  const handleSearch = async () => {
    const startTime = Date.now();
    setLoading(true);
    setError('');

    try {
      const searchParams = {
        ...filters,
        minFollowers: filters.minFollowers ? parseInt(filters.minFollowers) : undefined,
        maxFollowers: filters.maxFollowers ? parseInt(filters.maxFollowers) : undefined,
      };

      const result = await searchInfluencers(searchParams);
      const endTime = Date.now();
      
      setInfluencers(result.influencers || []);
      setPagination(result.pagination || null);
      setSearchTime(endTime - startTime);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('検索に失敗しました: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  if (!user) return null;

  return (
    <PageLayout
      title="インフルエンサー検索"
      subtitle="条件を指定して最適なインフルエンサーを見つけましょう"
      userEmail={user.email}
      onLogout={handleLogout}
    >
      {/* パフォーマンス情報 */}
      <Card className="mb-8" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-2">検索時間</p>
            <p className="text-2xl font-bold text-emerald-600">{searchTime.toFixed(0)}ms</p>
          </div>
          {pagination && (
            <div>
              <p className="text-sm text-gray-600 mb-2">総件数</p>
              <p className="text-2xl font-bold text-teal-600">{pagination.total.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-2">表示中</p>
            <p className="text-2xl font-bold text-gray-900">{influencers.length}</p>
          </div>
        </div>
      </Card>

      {/* 検索フィルター */}
      <Card className="mb-8" padding="lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-2xl mr-3">🔍</span>
          検索条件
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              キーワード
            </label>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="インフルエンサー名..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">全て</option>
              <option value="美容">美容</option>
              <option value="ライフスタイル">ライフスタイル</option>
              <option value="ファッション">ファッション</option>
              <option value="グルメ">グルメ</option>
              <option value="旅行">旅行</option>
              <option value="テック">テック</option>
              <option value="フィットネス">フィットネス</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              都道府県
            </label>
            <select
              value={filters.prefecture}
              onChange={(e) => handleFilterChange('prefecture', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SNSプラットフォーム
            </label>
            <select
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">全て</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="X">X (Twitter)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最小フォロワー数
            </label>
            <input
              type="number"
              value={filters.minFollowers}
              onChange={(e) => handleFilterChange('minFollowers', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="例: 1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              並び順
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="relevance">関連度</option>
              <option value="followers_desc">フォロワー数(多い順)</option>
              <option value="followers_asc">フォロワー数(少ない順)</option>
              <option value="engagement_desc">エンゲージメント率(高い順)</option>
              <option value="price_asc">料金(安い順)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleSearch}
            loading={loading}
            icon={<span>🔍</span>}
            size="lg"
            variant="primary"
          >
            検索実行
          </Button>
          
          <Button
            onClick={() => {
              setFilters({
                query: '',
                category: '',
                prefecture: '',
                platform: '',
                minFollowers: '',
                maxFollowers: '',
                sortBy: 'relevance',
                page: 1,
                limit: 20,
              });
              handleSearch();
            }}
            variant="secondary"
            size="lg"
            icon={<span>🔄</span>}
          >
            リセット
          </Button>
        </div>
      </Card>

      {/* エラーメッセージ */}
      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <div className="text-red-700 text-center">
            <span className="text-2xl mr-2">⚠️</span>
            {error}
          </div>
        </Card>
      )}

      {/* ローディング */}
      {loading && (
        <Card className="mb-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">検索中...</p>
          </div>
        </Card>
      )}

      {/* 検索結果 */}
      {!loading && influencers.length > 0 && (
        <>
          {/* 結果ヘッダー */}
          <div className="flex justify-between items-center mb-6">
            <div>
              {pagination && (
                <p className="text-gray-600 text-lg">
                  {pagination.total.toLocaleString()}件中 {((pagination.page - 1) * pagination.limit + 1).toLocaleString()}-{Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()}件を表示
                </p>
              )}
            </div>
          </div>

          {/* インフルエンサーリスト */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {influencers.map((influencer, index) => (
              <motion.div
                key={influencer.id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover={true} className="h-full">
                  <div className="flex items-start gap-4">
                    {/* アバター */}
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {influencer.displayName?.charAt(0) || 'U'}
                    </div>

                    {/* メイン情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {influencer.displayName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {influencer.prefecture}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">料金レンジ</div>
                          <div className="text-sm font-bold text-emerald-600">
                            ¥{influencer.priceMin?.toLocaleString()} - ¥{influencer.priceMax?.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* カテゴリー */}
                      <div className="flex gap-2 mb-3">
                        {influencer.categories?.map((category: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            {category}
                          </span>
                        ))}
                      </div>

                      {/* ハッシュタグ（使用頻度順に3つ） */}
                      {influencer.topHashtags && influencer.topHashtags.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {influencer.topHashtags.slice(0, 3).map((hashtag: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* SNS情報 */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                        {['Instagram', 'TikTok', 'YouTube', 'X'].map(platform => {
                          const account = influencer.socialAccounts?.find((acc: any) => acc.platform === platform);
                          
                          if (!account) return null;

                          return (
                            <div key={platform} className="flex items-center gap-2">
                              <span className="text-gray-500 w-20">{platform}:</span>
                              <span className="font-semibold text-gray-900">
                                {account.followerCount?.toLocaleString()}
                              </span>
                              {account.engagementRate && (
                                <span className="text-emerald-600">
                                  ({account.engagementRate}%)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* アクションボタン */}
                      <Button
                        onClick={() => router.push(`/influencer/${influencer.id}`)}
                        variant="primary"
                        size="sm"
                        className="w-full"
                      >
                        詳細を見る
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <Card>
              <div className="flex justify-center items-center space-x-2">
                <Button
                  onClick={() => setFilters(prev => ({ ...prev, page: pagination.page - 1 }))}
                  disabled={!pagination.hasPrev}
                  variant="outline"
                  size="sm"
                >
                  前へ
                </Button>
                
                <span className="mx-4 text-gray-600">
                  ページ {pagination.page} / {pagination.totalPages}
                </span>
                
                <Button
                  onClick={() => setFilters(prev => ({ ...prev, page: pagination.page + 1 }))}
                  disabled={!pagination.hasNext}
                  variant="outline"
                  size="sm"
                >
                  次へ
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* 検索結果なし */}
      {!loading && influencers.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">検索結果が見つかりません</h3>
            <p className="text-gray-600">検索条件を変更して再度お試しください。</p>
          </div>
        </Card>
      )}
    </PageLayout>
  );
};

export default SearchPage;