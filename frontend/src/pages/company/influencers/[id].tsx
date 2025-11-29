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
      <div className="max-w-7xl mx-auto">
        {/* ヘロー背景 */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-3xl h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-2xl">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            </div>
          </div>
        </div>

        {/* プロフィール概要 */}
        <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-2xl mb-8 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-8">
            {/* プロフィール画像とSNS */}
            <div className="flex flex-col items-center md:items-start">
              <div className="w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-white">
                <span className="text-white font-bold text-6xl">
                  {influencer.displayName.charAt(0)}
                </span>
              </div>
              {/* SNSリンク */}
              <div className="flex justify-center md:justify-start gap-3 flex-wrap">
                {influencer.socialAccounts.map(account => (
                  <a
                    key={account.id}
                    href={account.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300"
                  >
                    <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                    <div className="text-left">
                      <div className="text-xs text-gray-500 font-medium">{account.platform}</div>
                      <div className="font-bold text-gray-900">{formatNumber(account.followerCount)}</div>
                    </div>
                    {account.isVerified && <span className="ml-1 text-blue-500 font-bold">✓</span>}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex-1 mt-8 md:mt-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{influencer.displayName}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="text-gray-600">{influencer.prefecture}{influencer.city && `, ${influencer.city}`}</p>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{influencer.gender === '男性' ? '👨' : influencer.gender === '女性' ? '👩' : '👤'}</span>
                  <span className="text-gray-600 font-medium">{influencer.gender}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {influencer.categories.map(category => (
                  <span
                    key={category}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 mb-8 leading-relaxed">{influencer.bio}</p>

              {/* キーメトリクス */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="group relative p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-blue-200 cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity"></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{formatNumber(getTotalFollowers(influencer.socialAccounts))}</div>
                    <div className="text-gray-600 text-sm font-medium">合計フォロワー</div>
                  </div>
                </div>
                <div className="group relative p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-purple-200 cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity"></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{getAverageEngagement(influencer.socialAccounts)}%</div>
                    <div className="text-gray-600 text-sm font-medium">平均エンゲージメント</div>
                  </div>
                </div>
                <div className="group relative p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-green-200 cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity"></div>
                  <div className="relative">
                    <div className="text-2xl font-bold text-green-600 mb-1">{formatPrice(influencer.priceMin)}</div>
                    <div className="text-gray-600 text-sm font-medium">最低料金</div>
                  </div>
                </div>
                <div className="group relative p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-amber-200 cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity"></div>
                  <div className="relative">
                    <div className="text-2xl font-bold text-amber-600 mb-1">{formatPrice(influencer.priceMax)}</div>
                    <div className="text-gray-600 text-sm font-medium">最高料金</div>
                  </div>
                </div>
              </div>

              {/* 詳細分析データ */}
              <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 rounded-2xl p-8 mb-8 shadow-md">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <span className="text-3xl mr-3">📊</span>
                  詳細分析データ
                </h3>

                {/* オーディエンス分析とエンゲージメント */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-gray-900 mb-5 text-lg flex items-center">
                      <span className="text-2xl mr-2">👥</span>
                      オーディエンス分析
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border-l-4 border-blue-400">
                        <span className="text-gray-700 font-medium">男性フォロワー</span>
                        <span className="font-bold text-blue-600 text-lg">42%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-transparent rounded-xl border-l-4 border-pink-400">
                        <span className="text-gray-700 font-medium">女性フォロワー</span>
                        <span className="font-bold text-pink-600 text-lg">58%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-xl border-l-4 border-purple-400">
                        <span className="text-gray-700 font-medium">主要年齢層</span>
                        <span className="font-bold text-purple-600 text-lg">25-34歳 (45%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-gray-900 mb-5 text-lg flex items-center">
                      <span className="text-2xl mr-2">📈</span>
                      エンゲージメント詳細
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-transparent rounded-xl border-l-4 border-red-400">
                        <span className="text-gray-700 font-medium">平均いいね数</span>
                        <span className="font-bold text-red-600 text-lg">2,450</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-transparent rounded-xl border-l-4 border-cyan-400">
                        <span className="text-gray-700 font-medium">平均コメント数</span>
                        <span className="font-bold text-cyan-600 text-lg">185</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border-l-4 border-green-400">
                        <span className="text-gray-700 font-medium">ベストポスト時間</span>
                        <span className="font-bold text-green-600 text-lg">19:00-21:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ブランド親和性とインタレスト */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-gray-900 mb-5 text-lg flex items-center">
                      <span className="text-2xl mr-2">🏷️</span>
                      ブランド親和性
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border-l-4 border-blue-500">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">ファッション・アパレル</span>
                        </div>
                        <span className="font-bold text-blue-600 ml-2">85%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border-l-4 border-green-500">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">美容・コスメ</span>
                        </div>
                        <span className="font-bold text-green-600 ml-2">78%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-xl border-l-4 border-purple-500">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">ライフスタイル</span>
                        </div>
                        <span className="font-bold text-purple-600 ml-2">71%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-gray-900 mb-5 text-lg flex items-center">
                      <span className="text-2xl mr-2">🎯</span>
                      興味・関心
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-transparent rounded-xl border-l-4 border-pink-500">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">ファッション</span>
                        </div>
                        <span className="font-bold text-pink-600 ml-2">92%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border-l-4 border-orange-500">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">旅行・観光</span>
                        </div>
                        <span className="font-bold text-orange-600 ml-2">74%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-transparent rounded-xl border-l-4 border-cyan-500">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">グルメ・料理</span>
                        </div>
                        <span className="font-bold text-cyan-600 ml-2">68%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* パフォーマンス予測 */}
              <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border border-orange-200 rounded-2xl p-8 mb-8 shadow-md">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <span className="text-3xl mr-3">🔮</span>
                  パフォーマンス予測
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-blue-600 mb-2">1.8K</div>
                    <div className="text-gray-600 font-medium mb-3">予想リーチ</div>
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">信頼度: 89%</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-green-600 mb-2">4.2%</div>
                    <div className="text-gray-600 font-medium mb-3">予想エンゲージ率</div>
                    <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">+0.3% 向上</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-purple-600 mb-2">72</div>
                    <div className="text-gray-600 font-medium mb-3">予想CV数</div>
                    <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">業界平均1.4倍</div>
                  </div>
                </div>
              </div>

              {/* コンタクト方法について */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-2xl p-8 shadow-md">
                <h3 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                  <span className="text-3xl mr-3">💡</span>
                  このインフルエンサーとのコンタクト方法
                </h3>
                <div className="space-y-4 text-blue-800">
                  <p className="text-base leading-relaxed font-medium">
                    インフルエンサーとの直接的なチャット・コンタクトは、プロジェクトベースでのみ可能です。以下のステップに従ってください：
                  </p>
                  <ol className="list-decimal list-inside text-base space-y-3 ml-4 bg-white bg-opacity-50 p-4 rounded-xl border-l-4 border-blue-400">
                    <li className="font-medium">まずプロジェクトを作成してください</li>
                    <li className="font-medium">作成したプロジェクトに適したインフルエンサーをリストアップ</li>
                    <li className="font-medium">インフルエンサーが新着オファーから応募</li>
                    <li className="font-medium">応募があった時点でチャット機能が利用可能になります</li>
                  </ol>
                  <div className="mt-6 pt-4 border-t-2 border-blue-200">
                    <button
                      onClick={() => router.push('/company/projects/create')}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
                    >
                      <span>プロジェクトを作成する</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SNSアカウント詳細 */}
        <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="text-4xl mr-3">📱</span>
            SNSアカウント
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {influencer.socialAccounts.map(account => (
              <div key={account.id} className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-default">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-xl text-white">
                        {getPlatformIcon(account.platform)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{account.platform}</h3>
                        <p className="text-gray-600 text-sm font-medium">@{account.username}</p>
                      </div>
                    </div>
                    {account.isVerified && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">認証済み ✓</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{formatNumber(account.followerCount)}</div>
                      <div className="text-gray-600 text-sm font-medium mt-1">フォロワー</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">{account.engagementRate}%</div>
                      <div className="text-gray-600 text-sm font-medium mt-1">エンゲージメント</div>
                    </div>
                  </div>
                  <a
                    href={account.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 text-center hover:translate-y-[-2px] inline-block"
                  >
                    プロフィールを見る →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* コンタクトフォームは削除されました */}
    </DashboardLayout>
  );
};

export default InfluencerDetailPage;
