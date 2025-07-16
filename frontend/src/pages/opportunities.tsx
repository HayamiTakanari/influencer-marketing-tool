import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface ProjectOpportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  targetPlatforms: string[];
  targetPrefecture: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  client: {
    companyName: string;
    industry: string;
  };
  isApplied: boolean;
  matchesProfile: boolean;
}

const OpportunitiesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<ProjectOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectOpportunity | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const categories = [
    { value: 'all', label: 'すべて' },
    { value: '美容・化粧品', label: '美容・化粧品' },
    { value: 'ファッション', label: 'ファッション' },
    { value: 'フード・飲料', label: 'フード・飲料' },
    { value: 'ライフスタイル', label: 'ライフスタイル' },
    { value: 'テクノロジー', label: 'テクノロジー' },
    { value: 'スポーツ・フィットネス', label: 'スポーツ・フィットネス' },
    { value: 'その他', label: 'その他' }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // インフルエンサーのみアクセス可能
      if (parsedUser.role !== 'INFLUENCER') {
        router.push('/dashboard');
        return;
      }
      
      fetchOpportunities();
    } else {
      router.push('/login');
    }
  }, [router]);

  // Re-fetch when category filter changes
  useEffect(() => {
    if (user) {
      fetchOpportunities();
    }
  }, [categoryFilter]);

  const fetchOpportunities = async () => {
    try {
      const { getAvailableProjects } = await import('../services/api');
      const result = await getAvailableProjects({
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      });
      setOpportunities(result.projects || []);
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      
      // Fallback to mock data if API fails
      // 仮のデータ
      const mockOpportunities: ProjectOpportunity[] = [
        {
          id: '1',
          title: '新商品コスメのPRキャンペーン',
          description: '新発売のファンデーションを使用した投稿をお願いします。自然な仕上がりが特徴で、20-30代女性向けです。',
          category: '美容・化粧品',
          budget: 300000,
          targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
          targetPrefecture: '東京都',
          targetAgeMin: 20,
          targetAgeMax: 35,
          targetFollowerMin: 10000,
          targetFollowerMax: 100000,
          startDate: '2024-02-01',
          endDate: '2024-02-28',
          createdAt: '2024-01-15',
          client: {
            companyName: 'ビューティーコスメ株式会社',
            industry: '美容・化粧品'
          },
          isApplied: false,
          matchesProfile: true
        },
        {
          id: '2',
          title: 'ヘルシーフードのレビュー企画',
          description: '栄養バランスの良いミールキットの紹介。健康志向の高い方におすすめです。',
          category: 'フード・飲料',
          budget: 150000,
          targetPlatforms: ['INSTAGRAM', 'YOUTUBE'],
          targetPrefecture: '全国',
          targetAgeMin: 25,
          targetAgeMax: 45,
          targetFollowerMin: 5000,
          targetFollowerMax: 50000,
          startDate: '2024-01-25',
          endDate: '2024-02-25',
          createdAt: '2024-01-12',
          client: {
            companyName: 'ヘルシーフード株式会社',
            industry: 'フード・飲料'
          },
          isApplied: true,
          matchesProfile: true
        },
        {
          id: '3',
          title: 'ファッションアイテムの着回し企画',
          description: '春夏の新作アイテムを使った着回しコーデを提案してください。',
          category: 'ファッション',
          budget: 200000,
          targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
          targetPrefecture: '関東',
          targetAgeMin: 18,
          targetAgeMax: 30,
          targetFollowerMin: 20000,
          targetFollowerMax: 200000,
          startDate: '2024-02-10',
          endDate: '2024-03-10',
          createdAt: '2024-01-20',
          client: {
            companyName: 'トレンドファッション株式会社',
            industry: 'ファッション'
          },
          isApplied: false,
          matchesProfile: false
        }
      ];
      
      setOpportunities(mockOpportunities);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    
    setSubmitting(true);
    
    try {
      const { applyToProject } = await import('../services/api');
      
      await applyToProject({
        projectId: selectedProject.id,
        message: applicationMessage,
        proposedPrice
      });
      
      alert('プロジェクトに応募しました！');
      setShowApplicationForm(false);
      setSelectedProject(null);
      setApplicationMessage('');
      setProposedPrice(0);
      await fetchOpportunities();
    } catch (err: any) {
      console.error('Error applying to project:', err);
      alert('応募に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesCategory = categoryFilter === 'all' || opportunity.category === categoryFilter;
    const matchesSearch = opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opportunity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opportunity.client.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProfile = !showOnlyMatches || opportunity.matchesProfile;
    
    return matchesCategory && matchesSearch && matchesProfile;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              <h1 className="text-xl font-bold text-gray-900">プロジェクト機会</h1>
              <p className="text-sm text-gray-600">参加可能なプロジェクトを探そう</p>
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
        {/* 検索・フィルター */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="プロジェクト名、説明、企業名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <motion.button
                  key={category.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(category.value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    categoryFilter === category.value
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showOnlyMatches"
              checked={showOnlyMatches}
              onChange={(e) => setShowOnlyMatches(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="showOnlyMatches" className="text-sm font-medium text-gray-700">
              プロフィールに合致するもののみ表示
            </label>
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

        {/* プロジェクト一覧 */}
        <div className="space-y-6">
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">プロジェクトが見つかりません</h3>
              <p className="text-gray-600">検索条件を変更してもう一度お試しください。</p>
            </div>
          ) : (
            filteredOpportunities.map((opportunity, index) => (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  opportunity.matchesProfile ? 'border-green-200 bg-green-50/50' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{opportunity.title}</h3>
                      {opportunity.matchesProfile && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          ✓ プロフィールに合致
                        </span>
                      )}
                      {opportunity.isApplied && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          応募済み
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{opportunity.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span>🏢 {opportunity.client.companyName}</span>
                      <span>📅 {formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}</span>
                      <span>🏷️ {opportunity.category}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                      {opportunity.targetPlatforms.map(platform => (
                        <span key={platform} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPlatformIcon(platform)} {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{formatPrice(opportunity.budget)}</div>
                      <div className="text-gray-500 text-sm">予算</div>
                    </div>
                    {!opportunity.isApplied && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedProject(opportunity);
                          setShowApplicationForm(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        応募する
                      </motion.button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">対象地域</h4>
                    <p className="text-gray-600">{opportunity.targetPrefecture}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">年齢層</h4>
                    <p className="text-gray-600">
                      {opportunity.targetAgeMin > 0 && opportunity.targetAgeMax > 0 
                        ? `${opportunity.targetAgeMin}-${opportunity.targetAgeMax}歳`
                        : '指定なし'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">フォロワー数</h4>
                    <p className="text-gray-600">
                      {opportunity.targetFollowerMin > 0 && opportunity.targetFollowerMax > 0 
                        ? `${formatNumber(opportunity.targetFollowerMin)} - ${formatNumber(opportunity.targetFollowerMax)}`
                        : '指定なし'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 統計情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mt-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">統計情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {opportunities.length}
              </div>
              <div className="text-gray-600">利用可能な機会</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {opportunities.filter(o => o.matchesProfile).length}
              </div>
              <div className="text-gray-600">プロフィールに合致</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {opportunities.filter(o => o.isApplied).length}
              </div>
              <div className="text-gray-600">応募済み</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {Math.round(opportunities.reduce((sum, o) => sum + o.budget, 0) / opportunities.length).toLocaleString()}
              </div>
              <div className="text-gray-600">平均予算（円）</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 応募フォーム */}
      {showApplicationForm && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setShowApplicationForm(false);
                setSelectedProject(null);
                setApplicationMessage('');
                setProposedPrice(0);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-center">プロジェクトに応募</h2>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedProject.title}</h3>
            <p className="text-gray-600 mb-6">{selectedProject.client.companyName}</p>
            
            <form onSubmit={handleApplyToProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提案料金 (円)
                </label>
                <input
                  type="number"
                  value={proposedPrice || ''}
                  onChange={(e) => setProposedPrice(parseInt(e.target.value) || 0)}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  応募メッセージ
                </label>
                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="このプロジェクトに応募する理由、あなたの強みや経験について記載してください..."
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '応募中...' : '応募する'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;