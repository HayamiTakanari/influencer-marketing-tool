import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }

      if (id) {
        await fetchInfluencerDetails();
      }
    };

    loadData();


  }, [id, router]);

  const fetchInfluencerDetails = async () => {
    try {
      const { getInfluencerById } = await import('../../services/api');

      // Fetch initial data from backend API
      const result = await getInfluencerById(id as string);
      if (result) {
        setInfluencer(result as InfluencerDetails);
      } else {
        setError('インフルエンサーが見つかりませんでした。');
      }
    } catch (err: any) {
      console.error('Error fetching influencer details:', err);
      setError('インフルエンサーの詳細を取得できませんでした。');
    } finally {
      setLoading(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 mb-4">{error || 'インフルエンサーが見つかりませんでした。'}</p>
          <Link href="/search" className="text-blue-600 hover:underline">
            検索ページに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/search" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">←</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">インフルエンサー詳細</h1>
              <p className="text-sm text-gray-600">{influencer.displayName}のプロフィール</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/search" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
              検索に戻る
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* プロフィール概要 */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="text-center md:text-left">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-4">
                <span className="text-white font-bold text-4xl">
                  {influencer.displayName.charAt(0)}
                </span>
              </div>
              <div className="flex justify-center md:justify-start space-x-2 mb-4">
                {influencer.socialAccounts.map(account => (
                  <a
                    key={account.id}
                    href={account.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    <span>{getPlatformIcon(account.platform)}</span>
                    <span className="font-medium">{formatNumber(account.followerCount)}</span>
                    {account.isVerified && <span className="text-blue-500">✓</span>}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex-1">
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

              <p className="text-gray-700 mb-6">{influencer.bio}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(getTotalFollowers(influencer.socialAccounts))}</div>
                  <div className="text-gray-600 text-sm">合計フォロワー</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{getAverageEngagement(influencer.socialAccounts)}%</div>
                  <div className="text-gray-600 text-sm">平均エンゲージメント</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{formatPrice(influencer.priceMin)}</div>
                  <div className="text-gray-600 text-sm">最低料金</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{formatPrice(influencer.priceMax)}</div>
                  <div className="text-gray-600 text-sm">最高料金</div>
                </div>
              </div>

              {/* 詳細分析データ */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  📊 詳細分析データ
                </h3>
                
                {/* オーディエンス分析 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">👥 オーディエンス分析</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">男性フォロワー</span>
                        <span className="font-semibold text-blue-600">42%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">女性フォロワー</span>
                        <span className="font-semibold text-pink-600">58%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">主要年齢層</span>
                        <span className="font-semibold text-purple-600">25-34歳 (45%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">📈 エンゲージメント詳細</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">平均いいね数</span>
                        <span className="font-semibold text-red-600">2,450</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">平均コメント数</span>
                        <span className="font-semibold text-blue-600">185</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">ベストポスト時間</span>
                        <span className="font-semibold text-green-600">19:00-21:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ブランド親和性とインタレスト */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🏷️ ブランド親和性</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">ファッション・アパレル</span>
                        <span className="ml-auto text-sm font-semibold text-blue-600">85%</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">美容・コスメ</span>
                        <span className="ml-auto text-sm font-semibold text-green-600">78%</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700">ライフスタイル</span>
                        <span className="ml-auto text-sm font-semibold text-purple-600">71%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🎯 興味・関心</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span className="text-gray-700">ファッション</span>
                        <span className="ml-auto text-sm font-semibold text-pink-600">92%</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-700">旅行・観光</span>
                        <span className="ml-auto text-sm font-semibold text-orange-600">74%</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        <span className="text-gray-700">グルメ・料理</span>
                        <span className="ml-auto text-sm font-semibold text-cyan-600">68%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* パフォーマンス予測 */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  🔮 パフォーマンス予測
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-xl font-bold text-blue-600">1.8K</div>
                    <div className="text-sm text-gray-600">予想リーチ</div>
                    <div className="text-xs text-blue-600 mt-1">信頼度: 89%</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-xl font-bold text-green-600">4.2%</div>
                    <div className="text-sm text-gray-600">予想エンゲージ率</div>
                    <div className="text-xs text-green-600 mt-1">過去平均より+0.3%</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-xl font-bold text-purple-600">72</div>
                    <div className="text-sm text-gray-600">予想CV数</div>
                    <div className="text-xs text-purple-600 mt-1">業界平均の1.4倍</div>
                  </div>
                </div>
              </div>

              {/* コンタクト方法について */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">💡</span>
                  このインフルエンサーとのコンタクト方法
                </h3>
                <div className="space-y-3 text-blue-800">
                  <p className="text-sm">
                    インフルエンサーとの直接的なチャット・コンタクトは、プロジェクトベースでのみ可能です。
                  </p>
                  <ol className="list-decimal list-inside text-sm space-y-2 ml-4">
                    <li>まずプロジェクトを作成してください</li>
                    <li>作成したプロジェクトに適したインフルエンサーをリストアップ</li>
                    <li>インフルエンサーが新着オファーから応募</li>
                    <li>応募があった時点でチャット機能が利用可能になります</li>
                  </ol>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/projects/create')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      プロジェクトを作成する →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SNSアカウント詳細 */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">SNSアカウント</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {influencer.socialAccounts.map(account => (
              <div key={account.id} className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{account.platform}</h3>
                      <p className="text-gray-600 text-sm">@{account.username}</p>
                    </div>
                  </div>
                  {account.isVerified && (
                    <span className="text-blue-500 font-bold">認証済み ✓</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{formatNumber(account.followerCount)}</div>
                    <div className="text-gray-600 text-sm">フォロワー</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{account.engagementRate}%</div>
                    <div className="text-gray-600 text-sm">エンゲージメント</div>
                  </div>
                </div>
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  プロフィールを見る
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* SNS API分析データ */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 SNS分析データ</h2>
          
          {/* 性別分布 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 フォロワー性別分布</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-pink-600 mb-2">
                    {influencer.socialAccounts[0]?.analytics?.femaleFollowerPercentage ? 
                      `${influencer.socialAccounts[0].analytics.femaleFollowerPercentage}%` : '--%'
                    }
                  </div>
                  <div className="text-gray-700 font-medium">女性フォロワー</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {influencer.socialAccounts[0]?.analytics?.femaleFollowerPercentage ? 
                      'Instagram分析データ' : 'データ取得予定'
                    }
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {influencer.socialAccounts[0]?.analytics?.maleFollowerPercentage ? 
                      `${influencer.socialAccounts[0].analytics.maleFollowerPercentage}%` : '--%'
                    }
                  </div>
                  <div className="text-gray-700 font-medium">男性フォロワー</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {influencer.socialAccounts[0]?.analytics?.maleFollowerPercentage ? 
                      'Instagram分析データ' : 'データ取得予定'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* エンゲージメント指標 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 エンゲージメント指標</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {influencer.socialAccounts[0]?.analytics?.prEngagement ? 
                    `${influencer.socialAccounts[0].analytics.prEngagement}%` : '--%'
                  }
                </div>
                <div className="text-sm text-gray-700 font-medium">PRエンゲージメント</div>
                <div className="text-xs text-gray-500 mt-1">
                  {influencer.socialAccounts[0]?.analytics?.prEngagement ? 
                    'Instagram分析データ' : 'データ取得予定'
                  }
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {influencer.socialAccounts[0]?.analytics?.generalEngagement ? 
                    `${influencer.socialAccounts[0].analytics.generalEngagement}%` : '--%'
                  }
                </div>
                <div className="text-sm text-gray-700 font-medium">通常エンゲージメント</div>
                <div className="text-xs text-gray-500 mt-1">
                  {influencer.socialAccounts[0]?.analytics?.generalEngagement ? 
                    'Instagram分析データ' : 'データ取得予定'
                  }
                </div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {influencer.socialAccounts[0]?.analytics?.averageComments ? 
                    influencer.socialAccounts[0].analytics.averageComments.toLocaleString() : '--'
                  }
                </div>
                <div className="text-sm text-gray-700 font-medium">平均コメント数</div>
                <div className="text-xs text-gray-500 mt-1">
                  {influencer.socialAccounts[0]?.analytics?.averageComments ? 
                    'Instagram分析データ' : 'データ取得予定'
                  }
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {influencer.socialAccounts[0]?.analytics?.averageLikes ? 
                    influencer.socialAccounts[0].analytics.averageLikes.toLocaleString() : '--'
                  }
                </div>
                <div className="text-sm text-gray-700 font-medium">平均いいね数</div>
                <div className="text-xs text-gray-500 mt-1">
                  {influencer.socialAccounts[0]?.analytics?.averageLikes ? 
                    'Instagram分析データ' : 'データ取得予定'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 年齢・性別分布 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎂 年齢層別フォロワー分布</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600 mb-1">
                    {influencer.socialAccounts[0]?.analytics?.age35to44FemalePercentage ? 
                      `${influencer.socialAccounts[0].analytics.age35to44FemalePercentage}%` : '--%'
                    }
                  </div>
                  <div className="text-sm text-gray-700 font-medium">35-44歳 女性</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {influencer.socialAccounts[0]?.analytics?.age35to44FemalePercentage ? 
                      'Instagram分析データ' : 'データ取得予定'
                    }
                  </div>
                </div>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-600 mb-1">
                    {influencer.socialAccounts[0]?.analytics?.age35to44MalePercentage ? 
                      `${influencer.socialAccounts[0].analytics.age35to44MalePercentage}%` : '--%'
                    }
                  </div>
                  <div className="text-sm text-gray-700 font-medium">35-44歳 男性</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {influencer.socialAccounts[0]?.analytics?.age35to44MalePercentage ? 
                      'Instagram分析データ' : 'データ取得予定'
                    }
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <div className="text-center">
                  <div className="text-xl font-bold text-indigo-600 mb-1">
                    {influencer.socialAccounts[0]?.analytics?.age45to64MalePercentage ? 
                      `${influencer.socialAccounts[0].analytics.age45to64MalePercentage}%` : '--%'
                    }
                  </div>
                  <div className="text-sm text-gray-700 font-medium">45-64歳 男性</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {influencer.socialAccounts[0]?.analytics?.age45to64MalePercentage ? 
                      'Instagram分析データ' : 'データ取得予定'
                    }
                  </div>
                </div>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                <div className="text-center">
                  <div className="text-xl font-bold text-rose-600 mb-1">
                    {influencer.socialAccounts[0]?.analytics?.age45to64FemalePercentage ? 
                      `${influencer.socialAccounts[0].analytics.age45to64FemalePercentage}%` : '--%'
                    }
                  </div>
                  <div className="text-sm text-gray-700 font-medium">45-64歳 女性</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {influencer.socialAccounts[0]?.analytics?.age45to64FemalePercentage ? 
                      'Instagram分析データ' : 'データ取得予定'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ブランド属性・興味 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">🏷️ ブランド属性（フォロワー）</h4>
              <div className="space-y-3">
                <div className="bg-white/80 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">1位</span>
                    <span className="text-purple-600 font-bold">
                      {influencer.socialAccounts[0]?.analytics?.topBrandAffinity || 'データ取得予定'}
                    </span>
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">2位</span>
                    <span className="text-purple-600 font-bold">
                      {influencer.socialAccounts[0]?.analytics?.secondBrandAffinity || 'データ取得予定'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">❤️ 興味・関心（フォロワー）</h4>
              <div className="space-y-3">
                <div className="bg-white/80 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">1位</span>
                    <span className="text-green-600 font-bold">
                      {influencer.socialAccounts[0]?.analytics?.topInterest || 'データ取得予定'}
                    </span>
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">2位</span>
                    <span className="text-green-600 font-bold">
                      {influencer.socialAccounts[0]?.analytics?.secondInterest || 'データ取得予定'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 注意書き */}
          <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">ℹ️</span>
              <p className="text-sm text-yellow-800">
                SNS API連携により、これらの分析データが自動で更新される予定です。現在は表示フレームワークのみ実装済みです。
              </p>
            </div>
          </div>
        </div>

        {/* ポートフォリオ */}
        {influencer.portfolio && influencer.portfolio.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">ポートフォリオ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {influencer.portfolio.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-2xl p-6">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      詳細を見る →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* コンタクトフォームは削除されました */}
    </div>
  );
};

export default InfluencerDetailPage;