import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getAIRecommendedInfluencersForProject } from '../services/api';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  targetPlatforms: string[];
  brandName?: string;
  productName?: string;
  campaignObjective?: string;
  campaignTarget?: string;
  messageToConvey?: string;
}

interface AIRecommendedInfluencer {
  id: string;
  displayName: string;
  bio: string;
  categories: string[];
  prefecture: string;
  socialAccounts: {
    id: string;
    platform: string;
    followerCount: number;
    engagementRate: number;
    isVerified: boolean;
  }[];
  aiScore: number;
  matchReasons: string[];
  isRecommended: boolean;
}

const ProjectAIMatchingPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [recommendedInfluencers, setRecommendedInfluencers] = useState<AIRecommendedInfluencer[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    minFollowers: 0,
    maxFollowers: 1000000,
    minEngagement: 0,
    maxEngagement: 10,
    minViews: 0,
    maxViews: 1000000,
    platforms: [] as string[],
    sortBy: 'aiScore' // 'aiScore', 'followers', 'engagement'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { projectId } = router.query;

  useEffect(() => {
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

    if (projectId) {
      fetchProjectAndGetRecommendations();
    }
  }, [router, projectId]);

  const fetchProjectAndGetRecommendations = async () => {
    try {
      setLoading(true);
      setAiLoading(true);
      setError('');

      // プロジェクト情報を取得（localStorage から一時的に取得、本来はAPIから）
      const projectData = localStorage.getItem('recentProject');
      if (projectData) {
        const parsedProject = JSON.parse(projectData);
        setProject(parsedProject);
        
        // AIレコメンデーションを取得
        await getAIRecommendations(parsedProject);
      } else {
        setError('プロジェクト情報が見つかりません。');
      }
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError('プロジェクト情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const getAIRecommendations = async (projectData: Project) => {
    try {
      setAiLoading(true);
      
      const aiData = await getAIRecommendedInfluencersForProject({
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        budget: projectData.budget,
        targetPlatforms: projectData.targetPlatforms,
        brandName: projectData.brandName,
        productName: projectData.productName,
        campaignObjective: projectData.campaignObjective,
        campaignTarget: projectData.campaignTarget,
        messageToConvey: projectData.messageToConvey
      });

      setRecommendedInfluencers(aiData.influencers || []);
      setAiAnalysis(aiData.analysis || null);
      
    } catch (err: any) {
      console.error('Error getting AI recommendations:', err);
      setError('AIレコメンデーションの取得に失敗しました。');
    } finally {
      setAiLoading(false);
    }
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

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  const applyFilters = (influencers: AIRecommendedInfluencer[]) => {
    return influencers.filter(influencer => {
      const totalFollowers = influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
      const avgEngagement = influencer.socialAccounts.length > 0 
        ? influencer.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / influencer.socialAccounts.length
        : 0;
      
      // 平均再生数を算出
      let avgViews = 0;
      if (influencer.socialAccounts.length > 0) {
        const youtubeAcc = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube');
        if (youtubeAcc) {
          avgViews = Math.round(youtubeAcc.followerCount * 0.1);
        } else {
          avgViews = Math.round(totalFollowers * (avgEngagement / 100));
        }
      }
      
      // フォロワー数フィルター
      if (totalFollowers < filters.minFollowers || totalFollowers > filters.maxFollowers) {
        return false;
      }
      
      // エンゲージメント率フィルター
      if (avgEngagement < filters.minEngagement || avgEngagement > filters.maxEngagement) {
        return false;
      }
      
      // 平均再生数フィルター
      if (avgViews < filters.minViews || avgViews > filters.maxViews) {
        return false;
      }
      
      // プラットフォームフィルター
      if (filters.platforms.length > 0) {
        const hasMatchingPlatform = influencer.socialAccounts.some(acc => 
          filters.platforms.includes(acc.platform.toUpperCase())
        );
        if (!hasMatchingPlatform) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'followers':
          const aFollowers = a.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
          const bFollowers = b.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
          return bFollowers - aFollowers;
        case 'engagement':
          const aEngagement = a.socialAccounts.length > 0 
            ? a.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / a.socialAccounts.length
            : 0;
          const bEngagement = b.socialAccounts.length > 0 
            ? b.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / b.socialAccounts.length
            : 0;
          return bEngagement - aEngagement;
        default: // aiScore
          return b.aiScore - a.aiScore;
      }
    });
  };

  const resetFilters = () => {
    setFilters({
      minFollowers: 0,
      maxFollowers: 1000000,
      minEngagement: 0,
      maxEngagement: 10,
      minViews: 0,
      maxViews: 1000000,
      platforms: [],
      sortBy: 'aiScore'
    });
  };

  const handleSelectInfluencer = (influencerId: string) => {
    const newSelected = new Set(selectedInfluencers);
    if (newSelected.has(influencerId)) {
      newSelected.delete(influencerId);
    } else {
      newSelected.add(influencerId);
    }
    setSelectedInfluencers(newSelected);
  };

  const handleSelectAll = () => {
    const filteredInfluencers = applyFilters(recommendedInfluencers);
    if (selectedInfluencers.size === filteredInfluencers.length) {
      // 全て選択されている場合は全て解除
      setSelectedInfluencers(new Set());
    } else {
      // 一部または何も選択されていない場合は全て選択
      setSelectedInfluencers(new Set(filteredInfluencers.map(inf => inf.id)));
    }
  };

  const exportToCSV = () => {
    const selectedData = recommendedInfluencers.filter(inf => selectedInfluencers.has(inf.id));
    
    if (selectedData.length === 0) {
      alert('エクスポートするインフルエンサーを選択してください。');
      return;
    }

    // CSVヘッダー
    const headers = [
      'ID',
      'アカウント名',
      '自己紹介',
      'カテゴリ',
      '都道府県',
      'AIスコア',
      'おすすめ',
      'Instagram_フォロワー数',
      'Instagram_エンゲージメント率',
      'Instagram_認証',
      'YouTube_登録者数',
      'YouTube_エンゲージメント率',
      'YouTube_認証',
      'TikTok_フォロワー数',
      'TikTok_エンゲージメント率',
      'TikTok_認証',
      'Twitter_フォロワー数',
      'Twitter_エンゲージメント率',
      'Twitter_認証',
      'マッチング理由'
    ];

    // CSVデータ
    const csvData = selectedData.map(influencer => {
      const instagram = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'instagram');
      const youtube = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube');
      const tiktok = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'tiktok');
      const twitter = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'twitter');

      return [
        influencer.id,
        influencer.displayName,
        `"${influencer.bio.replace(/"/g, '""')}"`, // CSVエスケープ
        influencer.categories.join('・'),
        influencer.prefecture,
        influencer.aiScore,
        influencer.isRecommended ? 'はい' : 'いいえ',
        instagram?.followerCount || '',
        instagram?.engagementRate || '',
        instagram?.isVerified ? 'はい' : 'いいえ',
        youtube?.followerCount || '',
        youtube?.engagementRate || '',
        youtube?.isVerified ? 'はい' : 'いいえ',
        tiktok?.followerCount || '',
        tiktok?.engagementRate || '',
        tiktok?.isVerified ? 'はい' : 'いいえ',
        twitter?.followerCount || '',
        twitter?.engagementRate || '',
        twitter?.isVerified ? 'はい' : 'いいえ',
        `"${influencer.matchReasons.join(' / ').replace(/"/g, '""')}"` // CSVエスケープ
      ];
    });

    // CSV文字列を作成
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    // BOM付きUTF-8でダウンロード
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ファイル名を生成
    const now = new Date();
    const dateStr = now.getFullYear() + 
      String(now.getMonth() + 1).padStart(2, '0') + 
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') + 
      String(now.getMinutes()).padStart(2, '0');
    
    const filename = `AI_recommended_influencers_${project?.title || 'project'}_${dateStr}.csv`;
    
    // ダウンロード
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="AI インフルエンサーマッチング">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">プロジェクト情報を読み込み中...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AI インフルエンサーマッチング">
      <div className="mb-6">
        <Link href="/projects">
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            ← プロジェクト管理に戻る
          </button>
        </Link>
      </div>

      <div>
        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* プロジェクト情報 */}
        {project && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{project.title}</h2>
                <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {project.category}
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    ¥{project.budget.toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    {project.targetPlatforms.map(platform => (
                      <span key={platform} className="text-sm">
                        {getPlatformIcon(platform)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold hover:bg-emerald-200 transition-colors flex-shrink-0"
              >
                編集
              </button>
            </div>
          </div>
        )}

        {/* AI分析結果 */}
        {aiAnalysis && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-bold text-emerald-900 mb-2">マッチング分析</h3>
            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
              <div className="text-xs text-emerald-700 space-y-1">
                {aiAnalysis.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AIレコメンド結果 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">
              おすすめインフルエンサー ({applyFilters(recommendedInfluencers).length}/{recommendedInfluencers.length}人)
            </h3>
            <div className="flex items-center space-x-3">
              {aiLoading && (
                <div className="flex items-center space-x-2 text-emerald-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  <span className="text-sm">分析中...</span>
                </div>
              )}
              {!aiLoading && recommendedInfluencers.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-700 font-medium">
                      {selectedInfluencers.size}人選択
                    </span>
                    {selectedInfluencers.size > 0 && (
                      <button
                        onClick={exportToCSV}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition-colors"
                      >
                        📊 CSV
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold hover:bg-emerald-200 transition-all"
                  >
                    {selectedInfluencers.size === applyFilters(recommendedInfluencers).length ? '解除' : '全選'}
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                      showFilters
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    フィルター
                  </button>
                  <button
                    onClick={resetFilters}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200 transition-all"
                  >
                    リセット
                  </button>
                </>
              )}
            </div>
          </div>

          {/* フィルターセクション */}
          {showFilters && !aiLoading && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {/* フォロワー数フィルター */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">フォロワー数</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="最小"
                      value={filters.minFollowers || ''}
                      onChange={(e) => setFilters({...filters, minFollowers: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="最大"
                      value={filters.maxFollowers || ''}
                      onChange={(e) => setFilters({...filters, maxFollowers: parseInt(e.target.value) || 1000000})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* エンゲージメント率フィルター */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">エンゲージメント率(%)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="最小"
                      value={filters.minEngagement || ''}
                      onChange={(e) => setFilters({...filters, minEngagement: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="最大"
                      value={filters.maxEngagement || ''}
                      onChange={(e) => setFilters({...filters, maxEngagement: parseFloat(e.target.value) || 10})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 平均再生数フィルター */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">平均再生数</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="最小"
                      value={filters.minViews || ''}
                      onChange={(e) => setFilters({...filters, minViews: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="最大"
                      value={filters.maxViews || ''}
                      onChange={(e) => setFilters({...filters, maxViews: parseInt(e.target.value) || 1000000})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* ソートフィルター */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">並び順</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="aiScore">AIスコア順</option>
                    <option value="followers">フォロワー数順</option>
                    <option value="engagement">エンゲージメント順</option>
                  </select>
                </div>
              </div>

              {/* プラットフォームフィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">プラットフォーム</label>
                <div className="flex flex-wrap gap-2">
                  {['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'].map(platform => (
                    <button
                      key={platform}
                      onClick={() => {
                        const newPlatforms = filters.platforms.includes(platform)
                          ? filters.platforms.filter(p => p !== platform)
                          : [...filters.platforms, platform];
                        setFilters({...filters, platforms: newPlatforms});
                      }}
                      className={`px-3 py-1 text-sm rounded-full font-medium transition-all ${
                        filters.platforms.includes(platform)
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {getPlatformIcon(platform)} {platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!aiLoading && recommendedInfluencers.length > 0 && (
            <div className="hidden lg:flex items-center px-3 pb-2 text-xs text-gray-500 font-medium border-b border-gray-200 mb-2">
              <div className="w-8 text-center mr-2">
                <input
                  type="checkbox"
                  checked={selectedInfluencers.size === applyFilters(recommendedInfluencers).length && applyFilters(recommendedInfluencers).length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>
              <div className="w-14 text-center mr-2">スコア</div>
              <div className="w-40 mr-3">アカウント名</div>
              <div className="flex-1 mr-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="space-y-1">
                    <div>Instagram</div>
                    <div className="text-[10px] text-gray-400">ﾌｫﾛﾜｰ/Eng%/再生</div>
                  </div>
                  <div className="space-y-1">
                    <div>YouTube</div>
                    <div className="text-[10px] text-gray-400">登録者/Eng%/再生</div>
                  </div>
                  <div className="space-y-1">
                    <div>TikTok</div>
                    <div className="text-[10px] text-gray-400">ﾌｫﾛﾜｰ/Eng%/再生</div>
                  </div>
                  <div className="space-y-1">
                    <div>Twitter</div>
                    <div className="text-[10px] text-gray-400">ﾌｫﾛﾜｰ/Eng%/再生</div>
                  </div>
                </div>
              </div>
              <div className="flex-[2] mr-3">紹介文</div>
              <div className="w-32">アクション</div>
            </div>
          )}

          {aiLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {applyFilters(recommendedInfluencers).map((influencer, index) => {
                // 平均エンゲージメント率を計算
                const avgEngagement = influencer.socialAccounts.length > 0 
                  ? (influencer.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / influencer.socialAccounts.length).toFixed(1)
                  : '0.0';
                
                // 推定平均再生数（YouTubeの場合は再生数、その他はフォロワー数×エンゲージメント率）
                const avgViews = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube')
                  ? Math.round(influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube')!.followerCount * 0.1) // YouTubeは登録者数の10%を仮定
                  : Math.round(influencer.socialAccounts[0]?.followerCount * (influencer.socialAccounts[0]?.engagementRate / 100) || 0);

                return (
                  <div
                    key={influencer.id}
                    className={`bg-white border rounded hover:shadow transition-all p-3 ${
                      influencer.isRecommended ? 'border-green-400' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* チェックボックス */}
                      <input
                        type="checkbox"
                        checked={selectedInfluencers.has(influencer.id)}
                        onChange={() => handleSelectInfluencer(influencer.id)}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      />

                      {/* AIスコア */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                        influencer.aiScore >= 70 ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}>
                        {influencer.aiScore}
                      </div>

                      {/* インフルエンサー情報 */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{influencer.displayName}</h4>
                        <p className="text-xs text-gray-500 truncate">{influencer.prefecture}</p>
                      </div>

                      {/* フォロワー数 */}
                      <div className="text-right text-xs flex-shrink-0">
                        <div className="font-semibold text-gray-900">{formatNumber(influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0))}</div>
                      </div>

                      {/* アクション */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => router.push(`/project-detail?id=${projectId}`)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          詳細
                        </button>
                      </div>
                    </div>

                    {/* マッチング理由 */}
                    {influencer.matchReasons && influencer.matchReasons.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          {influencer.matchReasons.slice(0, 2).map((reason, idx) => (
                            <span key={idx} className="inline-block mr-2">
                              • {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 空の状態 */}
          {!aiLoading && recommendedInfluencers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">インフルエンサーが見つかりません</p>
            </div>
          )}
        </div>
      </div>

      {/* 下部ボタン */}
      {project && (
        <div className="flex gap-2 justify-end mt-4">
          <button
            onClick={() => router.push(`/projects`)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => getAIRecommendations(project)}
            disabled={!project || aiLoading}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {aiLoading ? '分析中...' : '再分析'}
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProjectAIMatchingPage;