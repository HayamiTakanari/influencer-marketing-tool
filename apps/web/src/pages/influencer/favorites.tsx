import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { Influencer, WorkingStatus } from '../../types';

const FavoritesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [favoriteInfluencers, setFavoriteInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingFavorite, setUpdatingFavorite] = useState<string | null>(null);
  const router = useRouter();

  const workingStatusOptions = {
    [WorkingStatus.AVAILABLE]: { label: '対応可能', color: 'bg-green-100 text-green-800', icon: '✅' },
    [WorkingStatus.BUSY]: { label: '多忙', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
    [WorkingStatus.UNAVAILABLE]: { label: '対応不可', color: 'bg-red-100 text-red-800', icon: '❌' },
    [WorkingStatus.BREAK]: { label: '休暇中', color: 'bg-blue-100 text-blue-800', icon: '🏖️' }
  };

  const getWorkingStatusInfo = (status?: WorkingStatus) => {
    return workingStatusOptions[status || WorkingStatus.AVAILABLE] || workingStatusOptions[WorkingStatus.AVAILABLE];
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
        router.push('/influencer/dashboard');
        return;
      }
      
      fetchFavorites(parsedUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchFavorites = async (currentUser?: any) => {
    try {
      const userToCheck = currentUser || user;
      const favoriteIds = userToCheck?.favoriteInfluencers || [];
      
      if (favoriteIds.length === 0) {
        setFavoriteInfluencers([]);
        setLoading(false);
        return;
      }

      const { getFavoriteInfluencers } = await import('../../services/api');
      const result = await getFavoriteInfluencers(favoriteIds);
      setFavoriteInfluencers(result || []);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (influencerId: string) => {
    if (!user) return;
    
    setUpdatingFavorite(influencerId);
    
    try {
      const updatedFavorites = user.favoriteInfluencers.filter((id: string) => id !== influencerId);

      const { updateFavorites } = await import('../../services/api');
      await updateFavorites(updatedFavorites);
      
      // ローカル状態を更新
      setFavoriteInfluencers(prev => prev.filter(inf => inf.id !== influencerId));
      
      // ローカルストレージのユーザー情報も更新
      const updatedUser = {
        ...user,
        favoriteInfluencers: updatedFavorites
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('お気に入りの削除に失敗しました。');
    } finally {
      setUpdatingFavorite(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM': return '📸';
      case 'YOUTUBE': return '🎥';
      case 'TIKTOK': return '🎵';
      case 'TWITTER': return '🐦';
      default: return '📱';
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '¥0';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        {favoriteInfluencers.length === 0 ? (
          <Card>
            <EmptyState
              icon="⭐"
              title="お気に入りインフルエンサーがありません"
              description="インフルエンサー検索から気になるクリエイターをお気に入りに追加してみましょう。"
              actionLabel="インフルエンサーを探す"
              onAction={() => router.push('/search')}
            />
          </Card>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {favoriteInfluencers.length}件のお気に入り
              </div>
              <Button
                onClick={() => router.push('/search')}
                variant="outline"
                size="md"
                icon="+"
              >
                新しく追加
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteInfluencers.map((influencer, index) => (
                <div key={influencer.id}>
                  <Card hover={true} padding="lg" className="relative">
                    {/* お気に入り削除ボタン */}
                    <button
                      onClick={() => removeFavorite(influencer.id)}
                      disabled={updatingFavorite === influencer.id}
                      className="absolute top-4 right-4 p-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                      title="お気に入りから削除"
                    >
                      {updatingFavorite === influencer.id ? '⏳' : '⭐'}
                    </button>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {influencer.displayName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between pr-8">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {influencer.displayName}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">{influencer.prefecture}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getWorkingStatusInfo(influencer.workingStatus).color}`}>
                          {getWorkingStatusInfo(influencer.workingStatus).icon} {getWorkingStatusInfo(influencer.workingStatus).label}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {influencer.bio}
                    </p>

                    {influencer.workingStatusMessage && influencer.workingStatus !== WorkingStatus.AVAILABLE && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-xs text-yellow-700">
                          💬 {influencer.workingStatusMessage}
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {influencer.categories.map(category => (
                          <span key={category} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {category}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {influencer.socialAccounts.map(account => (
                          <div key={account.id} className="flex items-center space-x-1">
                            <span>{getPlatformIcon(account.platform)}</span>
                            <span>{account.followerCount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {formatPrice(influencer.priceMin)} - {formatPrice(influencer.priceMax)}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => router.push(`/project-chat/new?influencer=${influencer.id}`)}
                          variant="secondary"
                          size="sm"
                          disabled={influencer.workingStatus === WorkingStatus.UNAVAILABLE || influencer.workingStatus === WorkingStatus.BREAK}
                        >
                          💬 連絡
                        </Button>
                        <Button
                          onClick={() => router.push(`/influencers/${influencer.id}`)}
                          variant="primary"
                          size="sm"
                        >
                          詳細
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;