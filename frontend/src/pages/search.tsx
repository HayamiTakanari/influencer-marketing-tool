import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Influencer {
  id: string;
  user: {
    id: string;
    email: string;
  };
  displayName: string;
  bio: string;
  categories: string[];
  prefecture: string;
  priceMin: number;
  priceMax: number;
  socialAccounts: {
    id: string;
    platform: string;
    username: string;
    followerCount: number;
    engagementRate: number;
    isVerified: boolean;
  }[];
}

interface SearchFilters {
  query: string;
  categories: string[];
  prefecture: string;
  minFollowers: number;
  maxFollowers: number;
  minEngagementRate: number;
  maxEngagementRate: number;
  minPrice: number;
  maxPrice: number;
  platforms: string[];
  isVerified: boolean | null;
  gender: string;
  minAge: number;
  maxAge: number;
}

interface SortOption {
  field: 'followers' | 'engagement' | 'price' | 'name' | 'recent';
  direction: 'asc' | 'desc';
  label: string;
}

const SearchPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    prefecture: '',
    minFollowers: 0,
    maxFollowers: 1000000,
    minEngagementRate: 0,
    maxEngagementRate: 100,
    minPrice: 0,
    maxPrice: 1000000,
    platforms: [],
    isVerified: null,
    gender: '',
    minAge: 18,
    maxAge: 65
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>({
    field: 'followers',
    direction: 'desc',
    label: 'フォロワー数（多い順）'
  });
  const [filteredInfluencers, setFilteredInfluencers] = useState<Influencer[]>([]);
  const router = useRouter();

  const categories = [
    '美容', 'ファッション', 'ライフスタイル', '料理', '旅行', 
    'フィットネス', 'テクノロジー', 'エンタメ', 'ビジネス', 'その他'
  ];

  const platforms = [
    { value: 'INSTAGRAM', label: 'Instagram', icon: '📸' },
    { value: 'YOUTUBE', label: 'YouTube', icon: '🎥' },
    { value: 'TIKTOK', label: 'TikTok', icon: '🎵' },
    { value: 'TWITTER', label: 'Twitter', icon: '🐦' }
  ];

  const sortOptions: SortOption[] = [
    { field: 'followers', direction: 'desc', label: 'フォロワー数（多い順）' },
    { field: 'followers', direction: 'asc', label: 'フォロワー数（少ない順）' },
    { field: 'engagement', direction: 'desc', label: 'エンゲージメント率（高い順）' },
    { field: 'engagement', direction: 'asc', label: 'エンゲージメント率（低い順）' },
    { field: 'price', direction: 'asc', label: '料金（安い順）' },
    { field: 'price', direction: 'desc', label: '料金（高い順）' },
    { field: 'name', direction: 'asc', label: '名前（あいうえお順）' },
    { field: 'recent', direction: 'desc', label: '登録日（新しい順）' }
  ];

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== 'CLIENT') {
        router.push('/dashboard');
        return;
      }
      
      // 初期検索実行
      handleSearch();
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { searchInfluencers } = await import('../services/api');
      
      const searchParams = {
        query: searchFilters.query || undefined,
        categories: searchFilters.categories.length > 0 ? searchFilters.categories : undefined,
        prefecture: searchFilters.prefecture || undefined,
        minFollowers: searchFilters.minFollowers > 0 ? searchFilters.minFollowers : undefined,
        maxFollowers: searchFilters.maxFollowers < 1000000 ? searchFilters.maxFollowers : undefined,
        minEngagementRate: searchFilters.minEngagementRate > 0 ? searchFilters.minEngagementRate : undefined,
        maxEngagementRate: searchFilters.maxEngagementRate < 100 ? searchFilters.maxEngagementRate : undefined,
        minPrice: searchFilters.minPrice > 0 ? searchFilters.minPrice : undefined,
        maxPrice: searchFilters.maxPrice < 1000000 ? searchFilters.maxPrice : undefined,
        platforms: searchFilters.platforms.length > 0 ? searchFilters.platforms : undefined,
        isVerified: searchFilters.isVerified !== null ? searchFilters.isVerified : undefined,
      };
      
      const result = await searchInfluencers(searchParams);
      setInfluencers(result.influencers || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('検索に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSearchFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setSearchFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const applyFiltersAndSort = () => {
    let filtered = [...influencers];

    // プラットフォームフィルタ
    if (searchFilters.platforms.length > 0) {
      filtered = filtered.filter(influencer =>
        influencer.socialAccounts.some(account =>
          searchFilters.platforms.includes(account.platform)
        )
      );
    }

    // 認証バッジフィルタ
    if (searchFilters.isVerified !== null) {
      filtered = filtered.filter(influencer =>
        influencer.socialAccounts.some(account => account.isVerified === searchFilters.isVerified)
      );
    }

    // ソート処理
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy.field) {
        case 'followers':
          aValue = Math.max(...a.socialAccounts.map(acc => acc.followerCount));
          bValue = Math.max(...b.socialAccounts.map(acc => acc.followerCount));
          break;
        case 'engagement':
          aValue = Math.max(...a.socialAccounts.map(acc => acc.engagementRate || 0));
          bValue = Math.max(...b.socialAccounts.map(acc => acc.engagementRate || 0));
          break;
        case 'price':
          aValue = a.priceMin || 0;
          bValue = b.priceMin || 0;
          break;
        case 'name':
          aValue = a.displayName;
          bValue = b.displayName;
          break;
        case 'recent':
          aValue = new Date().getTime(); // 仮の値（実際にはcreatedAtを使用）
          bValue = new Date().getTime();
          break;
        default:
          return 0;
      }

      if (sortBy.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredInfluencers(filtered);
  };

  // influencersまたはフィルタ、ソート条件が変更されたときに実行
  useEffect(() => {
    applyFiltersAndSort();
  }, [influencers, searchFilters.platforms, searchFilters.isVerified, sortBy]);

  const clearFilters = () => {
    setSearchFilters({
      query: '',
      categories: [],
      prefecture: '',
      minFollowers: 0,
      maxFollowers: 1000000,
      minEngagementRate: 0,
      maxEngagementRate: 100,
      minPrice: 0,
      maxPrice: 1000000,
      platforms: [],
      isVerified: null,
      gender: '',
      minAge: 18,
      maxAge: 65
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </Link>
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
                placeholder="インフルエンサーの名前、カテゴリー、キーワードで検索..."
                value={searchFilters.query}
                onChange={(e) => setSearchFilters({...searchFilters, query: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                🔍 フィルター
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '検索中...' : '検索'}
              </motion.button>
            </div>
          </div>

          {/* フィルター */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* カテゴリー */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          searchFilters.categories.includes(category)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 都道府県 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
                  <select
                    value={searchFilters.prefecture}
                    onChange={(e) => setSearchFilters({...searchFilters, prefecture: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全国</option>
                    {prefectures.map(prefecture => (
                      <option key={prefecture} value={prefecture}>{prefecture}</option>
                    ))}
                  </select>
                </div>

                {/* フォロワー数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">フォロワー数</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="最小"
                      value={searchFilters.minFollowers || ''}
                      onChange={(e) => setSearchFilters({...searchFilters, minFollowers: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">〜</span>
                    <input
                      type="number"
                      placeholder="最大"
                      value={searchFilters.maxFollowers === 1000000 ? '' : searchFilters.maxFollowers}
                      onChange={(e) => setSearchFilters({...searchFilters, maxFollowers: parseInt(e.target.value) || 1000000})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* エンゲージメント率 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">エンゲージメント率 (%)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="最小"
                      step="0.1"
                      value={searchFilters.minEngagementRate || ''}
                      onChange={(e) => setSearchFilters({...searchFilters, minEngagementRate: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">〜</span>
                    <input
                      type="number"
                      placeholder="最大"
                      step="0.1"
                      value={searchFilters.maxEngagementRate === 100 ? '' : searchFilters.maxEngagementRate}
                      onChange={(e) => setSearchFilters({...searchFilters, maxEngagementRate: parseFloat(e.target.value) || 100})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 料金 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">料金 (円)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="最小"
                      value={searchFilters.minPrice || ''}
                      onChange={(e) => setSearchFilters({...searchFilters, minPrice: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">〜</span>
                    <input
                      type="number"
                      placeholder="最大"
                      value={searchFilters.maxPrice === 1000000 ? '' : searchFilters.maxPrice}
                      onChange={(e) => setSearchFilters({...searchFilters, maxPrice: parseInt(e.target.value) || 1000000})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* プラットフォーム */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">プラットフォーム</label>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map(platform => (
                      <button
                        key={platform.value}
                        onClick={() => handlePlatformToggle(platform.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                          searchFilters.platforms.includes(platform.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <span>{platform.icon}</span>
                        <span>{platform.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 認証バッジ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">認証バッジ</label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSearchFilters({...searchFilters, isVerified: null})}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        searchFilters.isVerified === null
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      すべて
                    </button>
                    <button
                      onClick={() => setSearchFilters({...searchFilters, isVerified: true})}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                        searchFilters.isVerified === true
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <span>✓</span>
                      <span>認証済みのみ</span>
                    </button>
                    <button
                      onClick={() => setSearchFilters({...searchFilters, isVerified: false})}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        searchFilters.isVerified === false
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      認証なし
                    </button>
                  </div>
                </div>

                {/* フィルタークリア */}
                <div className="col-span-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearFilters}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    🗑️ フィルターをクリア
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
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

        {/* ソートと結果数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between"
        >
          <div className="text-gray-700">
            {loading ? (
              <span>検索中...</span>
            ) : (
              <span>
                {filteredInfluencers.length}件のインフルエンサーが見つかりました
                {influencers.length !== filteredInfluencers.length && (
                  <span className="text-gray-500 ml-2">（全{influencers.length}件中）</span>
                )}
              </span>
            )}
          </div>
          
          {!loading && influencers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">並び替え:</span>
              <select
                value={sortOptions.findIndex(option => 
                  option.field === sortBy.field && option.direction === sortBy.direction
                )}
                onChange={(e) => {
                  const selectedSort = sortOptions[parseInt(e.target.value)];
                  setSortBy(selectedSort);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option, index) => (
                  <option key={index} value={index}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </motion.div>

        {/* 検索結果 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">検索中...</p>
            </div>
          ) : filteredInfluencers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">インフルエンサーが見つかりません</h3>
              <p className="text-gray-600">検索条件を変更してもう一度お試しください。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInfluencers.map((influencer, index) => (
                <motion.div
                  key={influencer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/influencer/${influencer.id}`)}
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-xl">
                        {influencer.displayName.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{influencer.displayName}</h3>
                    <p className="text-gray-600 text-sm">{influencer.prefecture}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 text-sm line-clamp-2">{influencer.bio}</p>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {influencer.categories.map(category => (
                      <span
                        key={category}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">合計フォロワー</span>
                      <span className="font-semibold">{formatNumber(getTotalFollowers(influencer.socialAccounts))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">平均エンゲージメント</span>
                      <span className="font-semibold">{getAverageEngagement(influencer.socialAccounts)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">料金</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(influencer.priceMin)} - {formatPrice(influencer.priceMax)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-2">
                    {influencer.socialAccounts.map(account => (
                      <div
                        key={account.id}
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg text-xs"
                      >
                        <span>{getPlatformIcon(account.platform)}</span>
                        <span className="font-medium">{formatNumber(account.followerCount)}</span>
                        {account.isVerified && <span className="text-blue-500">✓</span>}
                      </div>
                    ))}
                  </div>
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