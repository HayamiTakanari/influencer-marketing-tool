import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { searchInfluencers } from '../services/api';

const SearchAdvancedPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const router = useRouter();

  // 検索フィルター
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    prefecture: '',
    platform: '', // SNSプラットフォーム選択
    minFollowers: '',
    maxFollowers: '',
    page: 1,
    limit: 20,
    testLargeData: false, // パフォーマンステスト用
  });

  // パフォーマンス測定
  const [searchTime, setSearchTime] = useState<number>(0);

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
  }, [router]);

  // 初期検索実行のための別のuseEffect
  useEffect(() => {
    if (user) {
      handleSearch();
    }
  }, [user]);

  const handleSearch = async () => {
    console.log('Search button clicked!'); // デバッグログ
    console.log('Current filters:', filters); // フィルター状態を確認
    
    const startTime = Date.now();
    setLoading(true);
    setError('');

    try {
      const searchParams = {
        ...filters,
        minFollowers: filters.minFollowers ? parseInt(filters.minFollowers) : undefined,
        maxFollowers: filters.maxFollowers ? parseInt(filters.maxFollowers) : undefined,
      };

      console.log('Search params:', searchParams); // 検索パラメータを確認
      
      const result = await searchInfluencers(searchParams);
      const endTime = Date.now();
      
      console.log('Search result:', result); // 検索結果を確認
      
      setInfluencers(result.influencers || []);
      setPagination(result.pagination || null);
      setPerformance(result.performance || null);
      setSearchTime(endTime - startTime);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('検索に失敗しました: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    
    // 更新されたフィルターで検索を実行
    console.log('Page changed to:', newPage);
    const startTime = Date.now();
    setLoading(true);
    setError('');

    try {
      const searchParams = {
        ...newFilters,
        minFollowers: newFilters.minFollowers ? parseInt(newFilters.minFollowers) : undefined,
        maxFollowers: newFilters.maxFollowers ? parseInt(newFilters.maxFollowers) : undefined,
      };

      const result = await searchInfluencers(searchParams);
      const endTime = Date.now();
      
      setInfluencers(result.influencers || []);
      setPagination(result.pagination || null);
      setPerformance(result.performance || null);
      setSearchTime(endTime - startTime);
    } catch (err: any) {
      console.error('Page change search error:', err);
      setError('検索に失敗しました: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // CSV抽出機能（現在のページのみ）
  const exportToCSV = () => {
    if (!influencers || influencers.length === 0) {
      alert('抽出するデータがありません');
      return;
    }

    // CSVヘッダー（複数SNS対応）
    const headers = [
      '名前',
      '都道府県',
      'カテゴリー',
      'Instagramフォロワー数',
      'Instagramエンゲージメント率',
      'TikTokフォロワー数',
      'TikTokエンゲージメント率',
      'YouTubeフォロワー数',
      'YouTubeエンゲージメント率',
      'Xフォロワー数',
      'Xエンゲージメント率',
      '最低料金',
      '最高料金',
      'プロフィール'
    ];

    // CSVデータを作成
    const csvData = influencers.map(influencer => {
      const getAccountData = (platform: string) => {
        const account = influencer.socialAccounts?.find((acc: any) => acc.platform === platform);
        return account ? [account.followerCount || 0, account.engagementRate || ''] : [0, ''];
      };

      const [instagramFollowers, instagramEngagement] = getAccountData('Instagram');
      const [tiktokFollowers, tiktokEngagement] = getAccountData('TikTok');
      const [youtubeFollowers, youtubeEngagement] = getAccountData('YouTube');
      const [xFollowers, xEngagement] = getAccountData('X');

      return [
        influencer.displayName || '',
        influencer.prefecture || '',
        influencer.categories?.join(';') || '',
        instagramFollowers,
        instagramEngagement,
        tiktokFollowers,
        tiktokEngagement,
        youtubeFollowers,
        youtubeEngagement,
        xFollowers,
        xEngagement,
        influencer.priceMin || '',
        influencer.priceMax || '',
        (influencer.bio || '').replace(/"/g, '""')
      ];
    });

    // CSVコンテンツを作成
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field}"` 
            : field
        ).join(',')
      )
    ].join('\n');

    // BOMを追加してExcelでの文字化けを防ぐ
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // ファイル名を生成（現在の日時を含む）
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
    link.setAttribute('download', `influencers_${timestamp}.csv`);
    
    // ダウンロードを実行
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 全データのCSV抽出機能
  const exportAllToCSV = async () => {
    if (!pagination) {
      alert('検索を実行してからCSV抽出してください');
      return;
    }

    setLoading(true);
    try {
      // 全データを取得するため、limit を大きく設定
      const allDataParams = {
        ...filters,
        page: 1,
        limit: pagination.total, // 全件取得
        minFollowers: filters.minFollowers ? parseInt(filters.minFollowers) : undefined,
        maxFollowers: filters.maxFollowers ? parseInt(filters.maxFollowers) : undefined,
      };

      const result = await searchInfluencers(allDataParams);
      const allInfluencers = result.influencers || [];

      if (allInfluencers.length === 0) {
        alert('抽出するデータがありません');
        return;
      }

      // CSVヘッダー（複数SNS対応）
      const headers = [
        '名前',
        '都道府県',
        'カテゴリー',
        'Instagramフォロワー数',
        'Instagramエンゲージメント率',
        'TikTokフォロワー数',
        'TikTokエンゲージメント率',
        'YouTubeフォロワー数',
        'YouTubeエンゲージメント率',
        'Xフォロワー数',
        'Xエンゲージメント率',
        '最低料金',
        '最高料金',
        'プロフィール'
      ];

      // CSVデータを作成
      const csvData = allInfluencers.map(influencer => {
        const getAccountData = (platform: string) => {
          const account = influencer.socialAccounts?.find((acc: any) => acc.platform === platform);
          return account ? [account.followerCount || 0, account.engagementRate || ''] : [0, ''];
        };

        const [instagramFollowers, instagramEngagement] = getAccountData('Instagram');
        const [tiktokFollowers, tiktokEngagement] = getAccountData('TikTok');
        const [youtubeFollowers, youtubeEngagement] = getAccountData('YouTube');
        const [xFollowers, xEngagement] = getAccountData('X');

        return [
          influencer.displayName || '',
          influencer.prefecture || '',
          influencer.categories?.join(';') || '',
          instagramFollowers,
          instagramEngagement,
          tiktokFollowers,
          tiktokEngagement,
          youtubeFollowers,
          youtubeEngagement,
          xFollowers,
          xEngagement,
          influencer.priceMin || '',
          influencer.priceMax || '',
          (influencer.bio || '').replace(/"/g, '""')
        ];
      });

      // CSVコンテンツを作成
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(field => 
            typeof field === 'string' && field.includes(',') 
              ? `"${field}"` 
              : field
          ).join(',')
        )
      ].join('\n');

      // BOMを追加してExcelでの文字化けを防ぐ
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // ダウンロードリンクを作成
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // ファイル名を生成
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
      link.setAttribute('download', `influencers_all_${timestamp}.csv`);
      
      // ダウンロードを実行
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`${allInfluencers.length}件のデータを抽出しました`);
    } catch (error) {
      console.error('CSV抽出エラー:', error);
      alert('CSV抽出に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // パフォーマンステストモードの切り替え
  const togglePerformanceTest = () => {
    setFilters(prev => ({ 
      ...prev, 
      testLargeData: !prev.testLargeData,
      page: 1 
    }));
  };

  // 自動検索を無効化し、手動検索ボタンを使用
  // useEffect(() => {
  //   const timeoutId = setTimeout(handleSearch, 500);
  //   return () => clearTimeout(timeoutId);
  // }, [filters]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">ダッシュボードに戻る</span>
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            インフルエンサー検索（高度版）
          </h1>
        </div>

        {/* パフォーマンス情報 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">検索時間</p>
              <p className="text-lg font-bold text-blue-600">{searchTime.toFixed(0)}ms</p>
            </div>
            {pagination && (
              <div className="text-center">
                <p className="text-sm text-gray-600">総件数</p>
                <p className="text-lg font-bold text-green-600">{pagination.total.toLocaleString()}</p>
              </div>
            )}
            {performance && (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-600">サーバー応答時間</p>
                  <p className="text-lg font-bold text-purple-600">{performance.responseTime}ms</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">キャッシュ</p>
                  <p className={`text-lg font-bold ${performance.cacheHit ? 'text-green-600' : 'text-gray-600'}`}>
                    {performance.cacheHit ? 'HIT' : 'MISS'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* パフォーマンステストモード */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-yellow-800">パフォーマンステストモード</h3>
              <p className="text-sm text-yellow-700">
                {filters.testLargeData ? '10,000件のデータでテスト中' : '通常モード（50件）'}
              </p>
            </div>
            <button
              onClick={togglePerformanceTest}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filters.testLargeData 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-200 text-yellow-800'
              }`}
            >
              {filters.testLargeData ? '通常モードに切り替え' : 'テストモードに切り替え'}
            </button>
          </div>
        </div>

        {/* 検索フィルター */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">キーワード</label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="インフルエンサー名..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全て</option>
                <option value="美容">美容</option>
                <option value="ライフスタイル">ライフスタイル</option>
                <option value="ファッション">ファッション</option>
                <option value="グルメ">グルメ</option>
                <option value="旅行">旅行</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
              <select
                value={filters.prefecture}
                onChange={(e) => handleFilterChange('prefecture', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全て</option>
                <option value="東京都">東京都</option>
                <option value="大阪府">大阪府</option>
                <option value="神奈川県">神奈川県</option>
                <option value="愛知県">愛知県</option>
                <option value="福岡県">福岡県</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SNSプラットフォーム</label>
              <select
                value={filters.platform}
                onChange={(e) => handleFilterChange('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全て</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="X">X (Twitter)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最小フォロワー数</label>
              <input
                type="number"
                value={filters.minFollowers}
                onChange={(e) => handleFilterChange('minFollowers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最大フォロワー数</label>
              <input
                type="number"
                value={filters.maxFollowers}
                onChange={(e) => handleFilterChange('maxFollowers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">表示件数</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10件</option>
                <option value={20}>20件</option>
                <option value={50}>50件</option>
                <option value={100}>100件</option>
              </select>
            </div>
          </div>

          {/* 検索ボタンエリア */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('Button clicked!');
                handleSearch();
              }}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>検索中...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>検索実行</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setFilters({
                  query: '',
                  category: '',
                  prefecture: '',
                  platform: '',
                  minFollowers: '',
                  maxFollowers: '',
                  page: 1,
                  limit: 20,
                  testLargeData: filters.testLargeData,
                });
                handleSearch();
              }}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              リセット
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">検索中...</p>
          </div>
        )}

        {/* アクティブフィルター表示 */}
        {(filters.query || filters.category || filters.prefecture || filters.platform || filters.minFollowers || filters.maxFollowers) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">現在の検索条件</h3>
            <div className="flex flex-wrap gap-2">
              {filters.query && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  キーワード: {filters.query}
                </span>
              )}
              {filters.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  カテゴリ: {filters.category}
                </span>
              )}
              {filters.prefecture && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  都道府県: {filters.prefecture}
                </span>
              )}
              {filters.platform && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                  📱 {filters.platform}専門
                </span>
              )}
              {filters.minFollowers && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  最小フォロワー: {parseInt(filters.minFollowers).toLocaleString()}
                </span>
              )}
              {filters.maxFollowers && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  最大フォロワー: {parseInt(filters.maxFollowers).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 検索結果 */}
        {!loading && influencers.length > 0 && (
          <>
            {/* ページネーション情報とCSV抽出ボタン */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                {pagination && (
                  <>
                    <p className="text-gray-600">
                      {pagination.total.toLocaleString()}件中 {((pagination.page - 1) * pagination.limit + 1).toLocaleString()}-{Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()}件を表示
                    </p>
                    <span className="text-gray-400">|</span>
                    <p className="text-gray-600">
                      ページ {pagination.page} / {pagination.totalPages}
                    </p>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <span>📊</span>
                  <span>現在ページCSV抽出</span>
                </button>
                <button
                  onClick={exportAllToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  <span>📁</span>
                  <span>全データCSV抽出</span>
                </button>
              </div>
            </div>

            {/* インフルエンサーリスト表示（コンパクト版） */}
            <div className="space-y-3 mb-8">
              {influencers.map((influencer, index) => (
                <div
                  key={influencer.id}
                  className="bg-white/90 backdrop-blur-xl rounded-lg shadow hover:shadow-md transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* アイコン */}
                      <div 
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                        onClick={() => router.push(`/influencer/${influencer.id}`)}
                        title={`${influencer.displayName}の詳細を見る`}
                      >
                        {influencer.displayName?.charAt(0) || 'U'}
                      </div>
                      
                      {/* メイン情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-bold text-gray-900 truncate">{influencer.displayName}</h3>
                              <span className="text-sm text-gray-500">({influencer.prefecture})</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1 mb-2">{influencer.bio}</p>
                            <div className="flex items-center gap-4 text-sm">
                              {/* カテゴリー */}
                              <div className="flex gap-2">
                                {influencer.categories?.map((category: string, index: number) => (
                                  <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    {category}
                                  </span>
                                ))}
                              </div>
                              {/* SNS情報（プラットフォーム別） */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {['Instagram', 'TikTok', 'YouTube', 'X'].map(platform => {
                                  const account = influencer.socialAccounts?.find((acc: any) => acc.platform === platform);
                                  const isSelectedPlatform = filters.platform === platform;
                                  
                                  if (!account) {
                                    return (
                                      <div key={platform} className={`flex items-center gap-1 ${isSelectedPlatform ? 'text-gray-600' : 'text-gray-400'}`}>
                                        <span className={`w-16 ${isSelectedPlatform ? 'font-semibold' : ''}`}>
                                          {platform}{isSelectedPlatform ? '*' : ''}:
                                        </span>
                                        <span>-</span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={platform} className={`flex items-center gap-1 ${isSelectedPlatform ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                                      <span className={`${isSelectedPlatform ? 'text-blue-700 font-semibold' : 'text-gray-500'} w-16`}>
                                        {platform}{isSelectedPlatform ? '*' : ''}:
                                      </span>
                                      <span className={`font-semibold ${isSelectedPlatform ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {account.followerCount?.toLocaleString()}
                                      </span>
                                      {account.engagementRate && (
                                        <span className={isSelectedPlatform ? 'text-blue-600' : 'text-green-600'}>
                                          ({account.engagementRate}%)
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          
                          {/* 右側の情報 */}
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-xs text-gray-500">料金レンジ</div>
                              <div className="text-sm font-bold text-gray-900">
                                ¥{influencer.priceMin?.toLocaleString()} - ¥{influencer.priceMax?.toLocaleString()}
                              </div>
                            </div>
                            <button 
                              onClick={() => router.push(`/influencer/${influencer.id}`)}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md text-sm font-medium hover:shadow-md transition-all"
                            >
                              詳細
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ページネーション */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  前へ
                </button>
                
                {Array.from({ length: Math.min(10, pagination.totalPages) }, (_, i) => {
                  const page = Math.max(1, pagination.page - 5) + i;
                  if (page > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg border ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}

        {/* 検索結果なし */}
        {!loading && influencers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">検索条件に一致するインフルエンサーが見つかりませんでした。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAdvancedPage;