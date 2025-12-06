import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Select from 'react-select';
import InfiniteScroll from 'react-infinite-scroll-component';
import { searchInfluencers, getCategories, getPrefectures } from '../services/api';
import { Influencer, Platform, Gender, WorkingStatus } from '../types';

interface SearchFilters {
  query: string;
  categories: string[];
  platforms: Platform[];
  minFollowers?: number;
  maxFollowers?: number;
  minPrice?: number;
  maxPrice?: number;
  prefecture?: string;
  gender?: Gender;
  minEngagementRate?: number;
}

const InfluencerSearch: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    platforms: [],
  });
  const [page, setPage] = useState(1);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [favoriteInfluencers, setFavoriteInfluencers] = useState<string[]>([]);
  const [updatingFavorite, setUpdatingFavorite] = useState<string | null>(null);

  const getWorkingStatusInfo = (status?: WorkingStatus) => {
    const statusMap = {
      [WorkingStatus.AVAILABLE]: { label: '対応可能', color: 'bg-green-100 text-green-800', icon: '✅' },
      [WorkingStatus.BUSY]: { label: '多忙', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
      [WorkingStatus.UNAVAILABLE]: { label: '対応不可', color: 'bg-red-100 text-red-800', icon: '❌' },
      [WorkingStatus.BREAK]: { label: '休暇中', color: 'bg-blue-100 text-blue-800', icon: '🏖️' }
    };
    return statusMap[status || WorkingStatus.AVAILABLE] || statusMap[WorkingStatus.AVAILABLE];
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: prefectures = [] } = useQuery({
    queryKey: ['prefectures'],
    queryFn: getPrefectures,
  });

  const { data: searchResult, isLoading, refetch } = useQuery({
    queryKey: ['influencers', filters, page],
    queryFn: () => searchInfluencers({ ...filters, page }),
    enabled: true,
  });

  // ユーザー情報とお気に入りリストの取得
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーの場合のみお気に入りリストを取得
      if (parsedUser.role === "COMPANY" || parsedUser.role === 'COMPANY') {
        setFavoriteInfluencers(parsedUser.favoriteInfluencers || []);
      }
    }
  }, []);

  useEffect(() => {
    if (searchResult) {
      if (page === 1) {
        setInfluencers(searchResult.influencers);
      } else {
        setInfluencers(prev => [...prev, ...searchResult.influencers]);
      }
      setHasMore(page < searchResult.pagination.totalPages);
    }
  }, [searchResult, page]);

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const toggleFavorite = async (influencerId: string) => {
    if (!user || (user.role !== "COMPANY" && user.role !== 'COMPANY')) return;
    
    setUpdatingFavorite(influencerId);
    
    try {
      const isFavorited = favoriteInfluencers.includes(influencerId);
      let updatedFavorites;
      
      if (isFavorited) {
        // お気に入りから削除
        updatedFavorites = favoriteInfluencers.filter(id => id !== influencerId);
      } else {
        // お気に入りに追加
        updatedFavorites = [...favoriteInfluencers, influencerId];
      }
      
      // TODO: 実際のAPI呼び出し
      // const { updateFavorites } = await import('../services/api');
      // await updateFavorites(updatedFavorites);
      
      // モック処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ローカル状態を更新
      setFavoriteInfluencers(updatedFavorites);
      
      // ローカルストレージのユーザー情報も更新
      const updatedUser = {
        ...user,
        favoriteInfluencers: updatedFavorites
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
    } catch (error) {
      console.error('Error updating favorite:', error);
      alert('お気に入りの更新に失敗しました。');
    } finally {
      setUpdatingFavorite(null);
    }
  };

  const platformOptions = [
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'YOUTUBE', label: 'YouTube' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'TWITTER', label: 'Twitter' },
  ];

  const genderOptions = [
    { value: 'MALE', label: '男性' },
    { value: 'FEMALE', label: '女性' },
    { value: 'OTHER', label: 'その他' },
    { value: 'NOT_SPECIFIED', label: '指定なし' },
  ];

  const categoryOptions = categories.map((cat: string) => ({
    value: cat,
    label: cat,
  }));

  const prefectureOptions = prefectures.map((pref: string) => ({
    value: pref,
    label: pref,
  }));

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">インフルエンサー検索</h1>
        
        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Query */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="名前、プロフィールで検索"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー
              </label>
              <Select
                isMulti
                options={categoryOptions}
                value={categoryOptions.filter((opt: { value: string; label: string }) => filters.categories.includes(opt.value))}
                onChange={(selected) => setFilters(prev => ({
                  ...prev,
                  categories: selected ? selected.map(s => s.value) : []
                }))}
                className="text-sm"
                placeholder="カテゴリーを選択"
              />
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プラットフォーム
              </label>
              <Select
                isMulti
                options={platformOptions}
                value={platformOptions.filter((opt: { value: string; label: string }) => filters.platforms.includes(opt.value as Platform))}
                onChange={(selected) => setFilters(prev => ({
                  ...prev,
                  platforms: selected ? selected.map(s => s.value as Platform) : []
                }))}
                className="text-sm"
                placeholder="プラットフォームを選択"
              />
            </div>

            {/* Follower Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フォロワー数（最小）
              </label>
              <input
                type="number"
                value={filters.minFollowers || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  minFollowers: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フォロワー数（最大）
              </label>
              <input
                type="number"
                value={filters.maxFollowers || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  maxFollowers: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                単価（最小）
              </label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  minPrice: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                単価（最大）
              </label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  maxPrice: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
            </div>

            {/* Prefecture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                都道府県
              </label>
              <Select
                options={prefectureOptions}
                value={prefectureOptions.find((opt: { value: string; label: string }) => opt.value === filters.prefecture)}
                onChange={(selected) => setFilters(prev => ({
                  ...prev,
                  prefecture: selected?.value
                }))}
                className="text-sm"
                placeholder="都道府県を選択"
                isClearable
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別
              </label>
              <Select
                options={genderOptions}
                value={genderOptions.find(opt => opt.value === filters.gender)}
                onChange={(selected) => setFilters(prev => ({
                  ...prev,
                  gender: selected?.value as Gender
                }))}
                className="text-sm"
                placeholder="性別を選択"
                isClearable
              />
            </div>

            {/* Engagement Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                エンゲージメント率（最小%）
              </label>
              <input
                type="number"
                step="0.1"
                value={filters.minEngagementRate || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  minEngagementRate: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2.0"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '検索中...' : '検索'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              検索結果 ({searchResult?.pagination.total || 0}件)
            </h2>
          </div>
          
          <InfiniteScroll
            dataLength={influencers.length}
            next={loadMore}
            hasMore={hasMore}
            loader={<div className="text-center py-4">読み込み中...</div>}
            endMessage={
              <div className="text-center py-4 text-gray-500">
                すべての結果を表示しました
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {influencers.map((influencer) => (
                <InfluencerCard 
                  key={influencer.id} 
                  influencer={influencer}
                  isFavorited={favoriteInfluencers.includes(influencer.id)}
                  onToggleFavorite={toggleFavorite}
                  isUpdating={updatingFavorite === influencer.id}
                  showFavoriteButton={user?.role === "COMPANY" || user?.role === 'COMPANY'}
                />
              ))}
            </div>
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
};

const InfluencerCard: React.FC<{ 
  influencer: Influencer; 
  isFavorited: boolean; 
  onToggleFavorite: (id: string) => void; 
  isUpdating: boolean;
  showFavoriteButton: boolean;
}> = ({ influencer, isFavorited, onToggleFavorite, isUpdating, showFavoriteButton }) => {
  const router = useRouter();
  
  const getWorkingStatusInfo = (status?: WorkingStatus) => {
    const statusMap = {
      [WorkingStatus.AVAILABLE]: { label: '対応可能', color: 'bg-green-100 text-green-800', icon: '✅' },
      [WorkingStatus.BUSY]: { label: '多忙', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
      [WorkingStatus.UNAVAILABLE]: { label: '対応不可', color: 'bg-red-100 text-red-800', icon: '❌' },
      [WorkingStatus.BREAK]: { label: '休暇中', color: 'bg-blue-100 text-blue-800', icon: '🏖️' }
    };
    return statusMap[status || WorkingStatus.AVAILABLE] || statusMap[WorkingStatus.AVAILABLE];
  };
  
  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'INSTAGRAM':
        return '📷';
      case 'YOUTUBE':
        return '🎥';
      case 'TIKTOK':
        return '🎵';
      case 'TWITTER':
        return '🐦';
      default:
        return '🌐';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-gray-600">
            {influencer.displayName.charAt(0)}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {influencer.displayName}
            </h3>
            <div className="flex items-center space-x-2">
              {showFavoriteButton && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(influencer.id);
                  }}
                  disabled={isUpdating}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorited 
                      ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50' 
                      : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                  } ${isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  title={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
                >
                  {isUpdating ? '⏳' : (isFavorited ? '⭐' : '☆')}
                </button>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkingStatusInfo(influencer.workingStatus).color}`}>
                {getWorkingStatusInfo(influencer.workingStatus).icon} {getWorkingStatusInfo(influencer.workingStatus).label}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">{influencer.prefecture}</p>
          {influencer.workingStatusMessage && influencer.workingStatus !== WorkingStatus.AVAILABLE && (
            <p className="text-xs text-gray-500 mt-1 italic">
              {influencer.workingStatusMessage}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {influencer.bio}
      </p>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {influencer.categories.map((category) => (
            <span
              key={category}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {influencer.socialAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center space-x-1 text-sm text-gray-600"
            >
              <span>{getPlatformIcon(account.platform)}</span>
              <span>{account.followerCount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          ¥{influencer.priceMin?.toLocaleString()} - ¥{influencer.priceMax?.toLocaleString()}
        </div>
        <button 
          onClick={() => router.push(`/influencer/${influencer.id}`)}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            influencer.workingStatus === WorkingStatus.UNAVAILABLE || influencer.workingStatus === WorkingStatus.BREAK
              ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={influencer.workingStatus === WorkingStatus.UNAVAILABLE || influencer.workingStatus === WorkingStatus.BREAK}
          title={
            influencer.workingStatus === WorkingStatus.UNAVAILABLE || influencer.workingStatus === WorkingStatus.BREAK
              ? 'このインフルエンサーは現在対応不可です'
              : '詳細を見る'
          }
        >
          {influencer.workingStatus === WorkingStatus.UNAVAILABLE || influencer.workingStatus === WorkingStatus.BREAK
            ? '対応不可'
            : '詳細を見る'
          }
        </button>
      </div>
    </div>
  );
};

export default InfluencerSearch;