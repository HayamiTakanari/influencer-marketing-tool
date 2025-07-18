import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      if (id) {
        fetchInfluencerDetails();
      }
    } else {
      router.push('/login');
    }
  }, [id, router]);

  const fetchInfluencerDetails = async () => {
    try {
      const { getInfluencerById } = await import('../../services/api');
      const result = await getInfluencerById(id as string);
      setInfluencer(result);
    } catch (err: any) {
      console.error('Error fetching influencer details:', err);
      setError('インフルエンサーの詳細を取得できませんでした。');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    
    try {
      // TODO: 本来はこのインフルエンサーとのチャットルームを作成してメッセージを送信する
      // 今回は簡単にチャットページに移動してコンタクトを促す
      localStorage.setItem('pendingContactMessage', JSON.stringify({
        influencerId: influencer?.id,
        message: contactMessage
      }));
      
      router.push('/chat');
    } catch (err: any) {
      console.error('Contact error:', err);
      alert('メッセージの送信に失敗しました。');
    } finally {
      setContactLoading(false);
    }
  };

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
        >
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
              <p className="text-gray-600 mb-4">{influencer.prefecture}{influencer.city && `, ${influencer.city}`}</p>
              
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(getTotalFollowers(influencer.socialAccounts))}</div>
                  <div className="text-gray-600 text-sm">合計フォロワー</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{getAverageEngagement(influencer.socialAccounts)}%</div>
                  <div className="text-gray-600 text-sm">平均エンゲージメント</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatPrice(influencer.priceMin)}</div>
                  <div className="text-gray-600 text-sm">最低料金</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatPrice(influencer.priceMax)}</div>
                  <div className="text-gray-600 text-sm">最高料金</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/chat')}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  💬 チャットする
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowContactForm(true)}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  📧 コンタクトフォーム
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SNSアカウント詳細 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
        >
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
        </motion.div>

        {/* ポートフォリオ */}
        {influencer.portfolio && influencer.portfolio.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
          >
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
          </motion.div>
        )}
      </div>

      {/* コンタクトフォーム */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full relative"
          >
            <button
              onClick={() => setShowContactForm(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-center">コンタクトメッセージ</h2>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {influencer.displayName}さんへのメッセージ
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="コラボレーションの内容や期待する成果について詳しく記載してください..."
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={contactLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {contactLoading ? 'メッセージ送信中...' : 'メッセージを送信'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InfluencerDetailPage;