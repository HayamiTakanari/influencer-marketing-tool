import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SimpleInfluencer {
  id: string;
  name: string;
  category: string;
  followerCount: number;
  engagementRate: number;
  platform: string;
  location: string;
  age: number;
  bio: string;
  gender: string;
}

const SearchPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<SimpleInfluencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== 'COMPANY' && parsedUser.role !== 'CLIENT') {
        router.push('/dashboard');
        return;
      }
      
      // 初期検索実行
      handleSearch();
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleSearch = async (query?: string) => {
    setLoading(true);
    setError('');
    
    try {
      const { searchInfluencers } = await import('../services/api');
      
      const searchParams = {
        category: query || undefined,
      };
      
      const result = await searchInfluencers(searchParams);
      console.log('Search result:', result);
      setInfluencers(result.influencers || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('検索に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </Link>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">ダッシュボードに戻る</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">インフルエンサー検索</h1>
              <p className="text-sm text-gray-600">あなたのブランドに最適なインフルエンサーを見つけよう</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.email}</span>
            <Link href="/dashboard" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
              ダッシュボード
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 検索バー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="カテゴリーで検索（美容、フィットネスなど）..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSearch(searchQuery)}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '検索中...' : '検索'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* エラーメッセージ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* 結果数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 mb-6"
        >
          <div className="text-gray-700">
            {loading ? (
              <span>検索中...</span>
            ) : (
              <span>{influencers.length}件のインフルエンサーが見つかりました</span>
            )}
          </div>
        </motion.div>

        {/* 検索結果 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">検索中...</p>
            </div>
          ) : influencers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">インフルエンサーが見つかりません</h3>
              <p className="text-gray-600">検索条件を変更してもう一度お試しください。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {influencers.map((influencer, index) => (
                <motion.div
                  key={influencer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <div className="text-center mb-4">
                    <div 
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                      onClick={() => router.push(`/influencer/${influencer.id}`)}
                      title={`${influencer.name}の詳細を見る`}
                    >
                      <span className="text-white font-bold text-xl">
                        {influencer.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{influencer.name}</h3>
                    <p className="text-gray-600 text-sm">{influencer.location}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 text-sm line-clamp-2">{influencer.bio}</p>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {influencer.category}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">フォロワー数</span>
                      <span className="font-semibold">{formatNumber(influencer.followerCount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">エンゲージメント率</span>
                      <span className="font-semibold">{influencer.engagementRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">プラットフォーム</span>
                      <span className="font-semibold">{influencer.platform}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">年齢</span>
                      <span className="font-semibold">{influencer.age}歳</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">性別</span>
                      <span className="font-semibold">{influencer.gender}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push(`/influencer/${influencer.id}`)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-xl font-semibold hover:shadow-lg transition-all">
                    詳細を見る
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;