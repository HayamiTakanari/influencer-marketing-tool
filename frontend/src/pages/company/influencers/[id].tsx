import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface SNSAnalytics {
  // 性別割合
  maleFollowerPercentage: number;
  femaleFollowerPercentage: number;

  // エンゲージメント指標
  prEngagement: number;
  generalEngagement: number;
  averageComments: number;
  averageLikes: number;

  // 年齢・性別別割合
  age35to44FemalePercentage: number;
  age35to44MalePercentage: number;
  age45to64MalePercentage: number;
  age45to64FemalePercentage: number;

  // ブランド属性・興味
  topBrandAffinity: string;
  secondBrandAffinity: string;
  topInterest: string;
  secondInterest: string;
}

interface InfluencerDetails {
  id: string;
  user: {
    id: string;
    email: string;
  };
  displayName: string;
  bio: string;
  categories: string[];
  prefecture: string;
  city: string;
  priceMin: number;
  priceMax: number;
  gender: string;
  birthDate: string;
  socialAccounts: {
    id: string;
    platform: string;
    username: string;
    profileUrl: string;
    followerCount: number;
    engagementRate: number;
    isVerified: boolean;
    analytics?: SNSAnalytics; // SNS API から取得するデータ
  }[];
  portfolio: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    link: string;
    platform: string;
  }[];
}

const InfluencerDetailPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencer, setInfluencer] = useState<InfluencerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // コンタクト機能は削除されました
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadData = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }

      if (id) {
        unsubscribe = await fetchInfluencerDetails();
      }
    };

    loadData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id, router]);

  const fetchInfluencerDetails = async (): Promise<(() => void) | undefined> => {
    try {
      // Fetch initial data from Backend API
      const response = await api.get(`/influencers/${id}`);
      if (response.data) {
        setInfluencer(response.data as InfluencerDetails);
      } else {
        setError('インフルエンサーが見つかりませんでした。');
      }
    } catch (err: any) {
      console.error('Error fetching influencer details:', err);
      setError('インフルエンサーの詳細を取得できませんでした。');
    } finally {
      setLoading(false);
    }
    // Return undefined as we're not using realtime subscriptions anymore
    return undefined;
  };

  // handleContactSubmit 関数は削除されました

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📸';
      case 'youtube': return '🎥';
      case 'tiktok': return '🎵';
      case 'twitter': return '🐦';
      default: return '📱';
    }
  };

  const getTotalFollowers = (socialAccounts: any[]) => {
    return socialAccounts.reduce((total, account) => total + account.followerCount, 0);
  };

  const getAverageEngagement = (socialAccounts: any[]) => {
    if (socialAccounts.length === 0) return 0;
    const total = socialAccounts.reduce((sum, account) => sum + account.engagementRate, 0);
    return (total / socialAccounts.length).toFixed(1);
  };

  if (loading) {
    return (
      <DashboardLayout title="インフルエンサー詳細" subtitle="読み込み中...">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !influencer) {
    return (
      <DashboardLayout title="インフルエンサー詳細" subtitle="エラー">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h3>
            <p className="text-gray-600 mb-4">{error || 'インフルエンサーが見つかりませんでした。'}</p>
            <Link href="/company/influencers/search" className="text-blue-600 hover:underline">
              検索ページに戻る
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="インフルエンサー詳細"
      subtitle={`${influencer.displayName}のプロフィール`}
    >
      <div className="max-w-4xl mx-auto">
        {/* プロフィール */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* 画像 */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                {influencer.displayName.charAt(0)}
              </div>
            </div>

            {/* 基本情報 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{influencer.displayName}</h1>
              <p className="text-sm text-gray-600 mb-3">{influencer.prefecture}{influencer.city && `, ${influencer.city}`} • {influencer.gender}</p>
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{influencer.bio}</p>

              {/* カテゴリー */}
              <div className="flex flex-wrap gap-2 mb-3">
                {influencer.categories.slice(0, 3).map(category => (
                  <span key={category} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {category}
                  </span>
                ))}
              </div>

              {/* キーメトリクス */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(getTotalFollowers(influencer.socialAccounts))}</div>
                  <div className="text-xs text-gray-600">フォロワー</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{getAverageEngagement(influencer.socialAccounts)}%</div>
                  <div className="text-xs text-gray-600">エンゲージ</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{formatPrice(influencer.priceMin).replace('¥', '')}</div>
                  <div className="text-xs text-gray-600">最低料金</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{formatPrice(influencer.priceMax).replace('¥', '')}</div>
                  <div className="text-xs text-gray-600">最高料金</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SNSアカウント */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">SNSアカウント</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {influencer.socialAccounts.map(account => (
              <a
                key={account.id}
                href={account.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                  <div className="text-xs">
                    <div className="font-medium text-gray-900">{account.platform}</div>
                    <div className="text-gray-600">{formatNumber(account.followerCount)}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{account.engagementRate}%</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* コンタクトフォームは削除されました */}
    </DashboardLayout>
  );
};

export default InfluencerDetailPage;
