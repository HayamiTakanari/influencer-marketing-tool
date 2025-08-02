import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { searchInfluencers } from '../services/api';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

const SearchPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [favoriteInfluencers, setFavoriteInfluencers] = useState<string[]>([]);
  const [updatingFavorite, setUpdatingFavorite] = useState<string | null>(null);
  const router = useRouter();

  // ナビゲーションアイテム
  const navigationItems: NavigationItem[] = [
    { name: 'インフルエンサー検索', href: '/search', icon: '🔍' },
    { name: 'プロジェクト', href: '/projects', icon: '📝', badge: 5 },
    { name: 'お気に入り', href: '/favorites', icon: '⭐', badge: favoriteInfluencers.length },
    { name: 'チャット', href: '/chat', icon: '💬' },
    { name: '支払い履歴', href: '/payments/history', icon: '💳' },
    { name: '請求書', href: '/invoices', icon: '📋' },
    { name: '会社プロフィール', href: '/company-profile', icon: '🏢' },
    { name: 'チーム管理', href: '/team-management', icon: '👥' }
  ];

  const quickActionsItems = [
    { name: 'プロジェクト作成', href: '/projects/create', icon: '➕' },
    { name: 'お知らせ', href: '/notifications', icon: '🔔' },
    { name: 'フィードバック', href: '/feedback', icon: '📝' },
    { name: 'FAQ', href: '/faq', icon: '❓' }
  ];

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

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* 背景デザイン */}
      <div className="fixed inset-0 z-0">
        {/* ベースグラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        
        {/* メッシュグラデーション */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -inset-[100%] opacity-60">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #d1fae5, #10b981, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #f3f4f6, #6b7280, transparent)' }} />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #6ee7b7, #059669, transparent)' }} />
          </div>
        </div>
        
        {/* アーティスティックパターン */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="artistic-pattern-search" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern-search)" />
        </svg>
      </div>

      {/* サイドバー */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}
        style={{ boxShadow: '4px 0 15px rgba(0,0,0,0.1)' }}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">IL</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">InfluenceLink</h1>
                  <p className="text-sm text-gray-600">企業ダッシュボード</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* ナビゲーション */}
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="space-y-1 px-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all hover:bg-emerald-50 hover:text-emerald-600 ${
                    router.pathname === item.href 
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-emerald-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </nav>

            {!sidebarCollapsed && (
              <>
                {/* セパレーター */}
                <div className="my-6 px-6">
                  <div className="border-t border-gray-200" />
                </div>

                {/* クイックアクション */}
                <div className="px-3">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    クイックアクション
                  </h3>
                  <nav className="space-y-1">
                    {quickActionsItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg transition-all hover:bg-gray-100 hover:text-gray-900"
                      >
                        <span className="text-lg mr-3">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </>
            )}
          </div>

          {/* ユーザー情報とログアウト */}
          <div className="border-t border-gray-200 p-6">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.companyName || user.email}
                  </p>
                  <p className="text-xs text-gray-500">企業アカウント</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`${sidebarCollapsed ? 'w-10 h-10' : 'w-full'} flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50`}
            >
              <span className="text-lg">{sidebarCollapsed ? '🚪' : '🚪'}</span>
              {!sidebarCollapsed && <span className="ml-2">ログアウト</span>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* メインコンテンツエリア */}
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-80'} transition-all duration-300 relative z-10`}>
        <PageLayout title="インフルエンサー検索" user={user} onLogout={handleLogout}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 検索フィルター */}
            <Card className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    キーワード
                  </label>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    placeholder="名前、カテゴリー、ハッシュタグなど"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリー
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">すべて</option>
                    <option value="ファッション">ファッション</option>
                    <option value="美容">美容</option>
                    <option value="グルメ">グルメ</option>
                    <option value="旅行">旅行</option>
                    <option value="ライフスタイル">ライフスタイル</option>
                    <option value="フィットネス">フィットネス</option>
                    <option value="テクノロジー">テクノロジー</option>
                    <option value="ビジネス">ビジネス</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    都道府県
                  </label>
                  <select
                    value={filters.prefecture}
                    onChange={(e) => handleFilterChange('prefecture', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">すべて</option>
                    <option value="東京都">東京都</option>
                    <option value="神奈川県">神奈川県</option>
                    <option value="千葉県">千葉県</option>
                    <option value="埼玉県">埼玉県</option>
                    <option value="大阪府">大阪府</option>
                    <option value="愛知県">愛知県</option>
                    <option value="福岡県">福岡県</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プラットフォーム
                  </label>
                  <select
                    value={filters.platform}
                    onChange={(e) => handleFilterChange('platform', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">すべて</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="X">X (Twitter)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最小フォロワー数
                  </label>
                  <input
                    type="number"
                    value={filters.minFollowers}
                    onChange={(e) => handleFilterChange('minFollowers', e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大フォロワー数
                  </label>
                  <input
                    type="number"
                    value={filters.maxFollowers}
                    onChange={(e) => handleFilterChange('maxFollowers', e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    並び順
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="relevance">関連度順</option>
                    <option value="followers">フォロワー数順</option>
                    <option value="engagement">エンゲージメント率順</option>
                    <option value="price">料金順</option>
                    <option value="recent">登録日順</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? '検索中...' : '検索'}
                </Button>

                {influencers.length > 0 && (
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    CSV出力
                  </Button>
                )}

                {searchTime > 0 && (
                  <span className="text-sm text-gray-500">
                    検索時間: {searchTime}ms
                  </span>
                )}
              </div>
            </Card>

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
                      <div className="p-6">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* プロフィール情報 */}
                          <div className="col-span-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-gray-600">
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
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {influencer.categories.slice(0, 2).map((category: string, index: number) => (
                                      <span
                                        key={index}
                                        className="inline-block px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full"
                                      >
                                        {category}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {influencer.topHashtags && influencer.topHashtags.length > 0 && (
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-500">
                                      {influencer.topHashtags.slice(0, 3).map((tag: string) => `#${tag}`).join(' ')}
                                    </p>
                                  </div>
                                )}
                                {(influencer.priceMin || influencer.priceMax) && (
                                  <div className="mt-1">
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
                            <div className="flex flex-col space-y-2">
                              <Button 
                                size="sm" 
                                className="text-xs px-2 py-1"
                                onClick={() => router.push(`/influencer/${influencer.id}`)}
                              >
                                詳細
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className={`text-xs px-2 py-1 ${
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

                        {/* 料金情報（下部に表示） */}
                        {(influencer.priceMin || influencer.priceMax) && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">料金目安:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {influencer.priceMin?.toLocaleString()}円 - {influencer.priceMax?.toLocaleString()}円
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ページネーション */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex space-x-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handleFilterChange('page', page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        filters.page === page
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* 検索結果なし */}
            {!loading && influencers.length === 0 && user && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  検索結果が見つかりませんでした
                </h3>
                <p className="text-gray-500">
                  検索条件を変更して再度お試しください
                </p>
              </div>
            )}

            {/* フッター */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-20 border-t border-gray-200 bg-gray-50 py-8"
            >
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-gray-600">
                    <button
                      onClick={() => router.push('/faq')}
                      className="hover:text-gray-800 transition-colors"
                    >
                      よくある質問
                    </button>
                    <button
                      onClick={() => router.push('/feedback')}
                      className="hover:text-gray-800 transition-colors"
                    >
                      ご要望・フィードバック
                    </button>
                    <button
                      onClick={() => router.push('/terms')}
                      className="hover:text-gray-800 transition-colors"
                    >
                      利用規約
                    </button>
                    <button
                      onClick={() => router.push('/privacy')}
                      className="hover:text-gray-800 transition-colors"
                    >
                      プライバシーポリシー
                    </button>
                    <button
                      onClick={() => router.push('/commercial-law')}
                      className="hover:text-gray-800 transition-colors"
                    >
                      特定商取引法
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Version 1.2.3
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                  © 2024 InfluenceLink. All rights reserved.
                </div>
              </div>
            </motion.footer>
          </div>
        </PageLayout>
      </div>

      {/* サイドバーオーバーレイ（モバイル用） */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default SearchPage;