import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { searchInfluencers } from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import SearchFilters, { FilterConfig } from '../components/search/SearchFilters';
import Pagination from '../components/search/Pagination';


const SearchPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [favoriteInfluencers, setFavoriteInfluencers] = useState<string[]>([]);
  const [updatingFavorite, setUpdatingFavorite] = useState<string | null>(null);
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

    if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
      router.push('/dashboard');
      return;
    }

    // お気に入りデータを読み込み
    const favoritesData = localStorage.getItem(`favorites_${parsedUser.id}`);
    if (favoritesData) {
      setFavoriteInfluencers(JSON.parse(favoritesData));
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

  const handleClearFilters = () => {
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
  };

  const filterConfig: FilterConfig[] = [
    { key: 'query', label: 'キーワード', type: 'text', placeholder: '名前、カテゴリー、ハッシュタグなど' },
    {
      key: 'category',
      label: 'カテゴリー',
      type: 'select',
      options: [
        { label: 'ファッション', value: 'ファッション' },
        { label: '美容', value: '美容' },
        { label: 'グルメ', value: 'グルメ' },
        { label: '旅行', value: '旅行' },
        { label: 'ライフスタイル', value: 'ライフスタイル' },
        { label: 'フィットネス', value: 'フィットネス' },
        { label: 'テクノロジー', value: 'テクノロジー' },
        { label: 'ビジネス', value: 'ビジネス' },
      ]
    },
    {
      key: 'prefecture',
      label: '都道府県',
      type: 'select',
      options: [
        { label: '東京都', value: '東京都' },
        { label: '神奈川県', value: '神奈川県' },
        { label: '千葉県', value: '千葉県' },
        { label: '埼玉県', value: '埼玉県' },
        { label: '大阪府', value: '大阪府' },
        { label: '愛知県', value: '愛知県' },
        { label: '福岡県', value: '福岡県' },
      ]
    },
    {
      key: 'platform',
      label: 'プラットフォーム',
      type: 'select',
      options: [
        { label: 'Instagram', value: 'Instagram' },
        { label: 'TikTok', value: 'TikTok' },
        { label: 'YouTube', value: 'YouTube' },
        { label: 'X (Twitter)', value: 'X' },
      ]
    },
    { key: 'followers', label: 'フォロワー数', type: 'range' },
    {
      key: 'sortBy',
      label: '並び順',
      type: 'select',
      options: [
        { label: '関連度順', value: 'relevance' },
        { label: 'フォロワー数順', value: 'followers' },
        { label: 'エンゲージメント率順', value: 'engagement' },
        { label: '料金順', value: 'price' },
        { label: '登録日順', value: 'recent' },
      ]
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleToggleFavorite = async (influencerId: string) => {
    if (!user) return;
    
    setUpdatingFavorite(influencerId);
    
    try {
      const isFavorite = favoriteInfluencers.includes(influencerId);
      let updatedFavorites;
      
      if (isFavorite) {
        // お気に入りから削除
        updatedFavorites = favoriteInfluencers.filter(id => id !== influencerId);
      } else {
        // お気に入りに追加
        updatedFavorites = [...favoriteInfluencers, influencerId];
      }
      
      // 状態を更新
      setFavoriteInfluencers(updatedFavorites);
      
      // localStorageに保存
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));
      
      // ユーザーデータも更新
      const updatedUser = {
        ...user,
        favoriteInfluencers: updatedFavorites
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
    } catch (error) {
      console.error('Error updating favorites:', error);
      alert('お気に入りの更新に失敗しました。');
    } finally {
      setUpdatingFavorite(null);
    }
  };

  const handleExportCSV = () => {
    if (influencers.length === 0) {
      alert('出力するデータがありません');
      return;
    }

    // CSVヘッダー
    const headers = [
      'ID',
      'インフルエンサー名',
      '都道府県',
      'カテゴリー',
      'ハッシュタグ',
      'Instagram',
      'TikTok',
      'YouTube',
      'X',
      '最低料金',
      '最高料金'
    ];

    // CSVデータを生成
    const csvData = influencers.map(influencer => {
      const instagramAccount = influencer.socialAccounts?.find((acc: any) => acc.platform === 'Instagram');
      const tiktokAccount = influencer.socialAccounts?.find((acc: any) => acc.platform === 'TikTok');
      const youtubeAccount = influencer.socialAccounts?.find((acc: any) => acc.platform === 'YouTube');
      const xAccount = influencer.socialAccounts?.find((acc: any) => acc.platform === 'X');

      return [
        influencer.id,
        `"${influencer.displayName || ''}"`,
        `"${influencer.prefecture || ''}"`,
        `"${influencer.categories?.join(', ') || ''}"`,
        `"${influencer.topHashtags?.slice(0, 3).map((tag: string) => `#${tag}`).join(', ') || ''}"`,
        instagramAccount ? `${instagramAccount.followerCount?.toLocaleString()}(${instagramAccount.engagementRate || 0}%)` : '-',
        tiktokAccount ? `${tiktokAccount.followerCount?.toLocaleString()}(${tiktokAccount.engagementRate || 0}%)` : '-',
        youtubeAccount ? `${youtubeAccount.followerCount?.toLocaleString()}(${youtubeAccount.engagementRate || 0}%)` : '-',
        xAccount ? `${xAccount.followerCount?.toLocaleString()}(${xAccount.engagementRate || 0}%)` : '-',
        influencer.priceMin?.toLocaleString() || '',
        influencer.priceMax?.toLocaleString() || ''
      ];
    });

    // CSV文字列を作成
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    
    // BOMを追加してExcelで文字化けを防ぐ
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ファイルをダウンロード
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `influencers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  if (loading && influencers.length === 0) {
    return (
      <DashboardLayout title="インフルエンサー検索" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="インフルエンサー検索"
      subtitle="あなたにぴったりのインフルエンサーを見つけましょう"
    >
      <div className="space-y-4">
            <SearchFilters
              filters={filters}
              config={filterConfig}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
              onSearch={handleSearch}
              loading={loading}
            />

            {influencers.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  CSV出力
                </Button>

                {searchTime > 0 && (
                  <span className="text-sm text-gray-500">
                    検索時間: {searchTime}ms
                  </span>
                )}
              </div>
            )}

            {/* エラー表示 */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* 検索結果 */}
            {influencers.length > 0 && (
              <div className="space-y-4">
                {/* ヘッダー */}
                <Card className="bg-gray-50">
                  <div className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <h4 className="text-sm font-semibold text-gray-700">インフルエンサー</h4>
                      </div>
                      <div className="col-span-2 text-center">
                        <h4 className="text-sm font-semibold text-gray-700">Instagram</h4>
                        <p className="text-xs text-gray-500">フォロワー / エンゲージメント</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <h4 className="text-sm font-semibold text-gray-700">TikTok</h4>
                        <p className="text-xs text-gray-500">フォロワー / エンゲージメント</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <h4 className="text-sm font-semibold text-gray-700">YouTube</h4>
                        <p className="text-xs text-gray-500">フォロワー / エンゲージメント</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <h4 className="text-sm font-semibold text-gray-700">X</h4>
                        <p className="text-xs text-gray-500">フォロワー / エンゲージメント</p>
                      </div>
                      <div className="col-span-1 text-center">
                        <h4 className="text-sm font-semibold text-gray-700">アクション</h4>
                      </div>
                    </div>
                  </div>
                </Card>

                {influencers.map((influencer) => {
                  const instagramAccount = influencer.socialAccounts?.find((acc: any) => acc.platform === 'Instagram');
                  const tiktokAccount = influencer.socialAccounts?.find((acc: any) => acc.platform === 'TikTok');
                  const youtubeAccount = influencer.socialAccounts?.find((acc: any) => acc.platform === 'YouTube');
                  const xAccount = influencer.socialAccounts?.find((acc: any) => acc.platform === 'X');

                  return (
                    <Card key={influencer.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* プロフィール情報 */}
                          <div className="col-span-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-gray-600">
                                  {influencer.displayName?.charAt(0) || '?'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                  {influencer.displayName || 'Unknown'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {influencer.prefecture}
                                </p>
                                {influencer.categories && influencer.categories.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {influencer.categories.slice(0, 2).map((category: string, index: number) => (
                                      <span
                                        key={index}
                                        className="inline-block px-1 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full"
                                      >
                                        {category}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {influencer.topHashtags && influencer.topHashtags.length > 0 && (
                                  <div className="mt-0.5">
                                    <p className="text-xs text-gray-500">
                                      {influencer.topHashtags.slice(0, 3).map((tag: string) => `#${tag}`).join(' ')}
                                    </p>
                                  </div>
                                )}
                                {(influencer.priceMin || influencer.priceMax) && (
                                  <div className="mt-0.5">
                                    <p className="text-xs text-blue-600 font-medium">
                                      {influencer.priceMin?.toLocaleString()}円 - {influencer.priceMax?.toLocaleString()}円
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Instagram */}
                          <div className="col-span-2 text-center">
                            {instagramAccount ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {instagramAccount.followerCount?.toLocaleString() || '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {instagramAccount.engagementRate ? `${instagramAccount.engagementRate}%` : '-'}
                                </div>
                                <div className="text-xs text-gray-400">Instagram</div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </div>

                          {/* TikTok */}
                          <div className="col-span-2 text-center">
                            {tiktokAccount ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {tiktokAccount.followerCount?.toLocaleString() || '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {tiktokAccount.engagementRate ? `${tiktokAccount.engagementRate}%` : '-'}
                                </div>
                                <div className="text-xs text-gray-400">TikTok</div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </div>

                          {/* YouTube */}
                          <div className="col-span-2 text-center">
                            {youtubeAccount ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {youtubeAccount.followerCount?.toLocaleString() || '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {youtubeAccount.engagementRate ? `${youtubeAccount.engagementRate}%` : '-'}
                                </div>
                                <div className="text-xs text-gray-400">YouTube</div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </div>

                          {/* X (Twitter) */}
                          <div className="col-span-2 text-center">
                            {xAccount ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {xAccount.followerCount?.toLocaleString() || '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {xAccount.engagementRate ? `${xAccount.engagementRate}%` : '-'}
                                </div>
                                <div className="text-xs text-gray-400">X</div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </div>

                          {/* アクション */}
                          <div className="col-span-1 text-right">
                            <div className="flex flex-col space-y-1">
                              <Button 
                                size="sm" 
                                className="text-xs px-2 py-1 h-7"
                                onClick={() => router.push(`/influencer/${influencer.id}`)}
                              >
                                詳細
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className={`text-xs px-2 py-1 h-7 ${
                                  favoriteInfluencers.includes(influencer.id) 
                                    ? 'bg-yellow-100 text-yellow-600 border-yellow-300' 
                                    : ''
                                }`}
                                onClick={() => handleToggleFavorite(influencer.id)}
                                disabled={updatingFavorite === influencer.id}
                              >
                                {updatingFavorite === influencer.id ? '...' : favoriteInfluencers.includes(influencer.id) ? '★' : '☆'}
                              </Button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={filters.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={(page) => handleFilterChange('page', page)}
                itemsPerPage={filters.limit}
              />
            )}

            {!loading && influencers.length === 0 && user && (
              <EmptyState
                icon="🔍"
                title="検索結果が見つかりませんでした"
                description="検索条件を変更して再度お試しください"
              />
            )}
      </div>
    </DashboardLayout>
  );
};

export default SearchPage;