import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PageLayout from '../../components/shared/PageLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

interface AssignedInfluencer {
  id: string;
  displayName: string;
  platform: string;
  followerCount: number;
  contractPrice: number;
}

interface ProjectDetails {
  listupCount: number;
  assignedCount: number;
  publishDate: string;
  manager: string;
  assignedInfluencers: AssignedInfluencer[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetPlatforms: string[];
  targetPrefecture: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  applicationsCount: number;
  matchedInfluencer?: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  projectDetails?: ProjectDetails;
}

const ProjectsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const statusOptions = [
    { value: 'all', label: 'すべて', color: 'bg-gray-100 text-gray-800' },
    { value: 'PENDING', label: '募集中', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'MATCHED', label: 'マッチング済み', color: 'bg-blue-100 text-blue-800' },
    { value: 'IN_PROGRESS', label: '進行中', color: 'bg-green-100 text-green-800' },
    { value: 'COMPLETED', label: '完了', color: 'bg-purple-100 text-purple-800' },
    { value: 'CANCELLED', label: 'キャンセル', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーとインフルエンサーの両方がアクセス可能
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY' && parsedUser.role !== 'INFLUENCER') {
        router.push('/dashboard');
        return;
      }
      
      if (parsedUser) {
        fetchProjects(parsedUser);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchProjects = async (currentUser?: any) => {
    try {
      const userToCheck = currentUser || user;
      if (userToCheck?.role === 'INFLUENCER') {
        // インフルエンサー用のモックデータ
        const mockInfluencerProjects: Project[] = [
          {
            id: '1',
            title: '新商品コスメのPRキャンペーン',
            description: '春の新作コスメを紹介していただけるインフルエンサーを募集しています',
            category: '美容',
            budget: 500000,
            status: 'IN_PROGRESS',
            targetPlatforms: ['Instagram', 'YouTube'],
            targetPrefecture: '東京都',
            targetAgeMin: 20,
            targetAgeMax: 35,
            targetFollowerMin: 10000,
            targetFollowerMax: 100000,
            startDate: '2024-03-01',
            endDate: '2024-04-30',
            createdAt: '2024-02-15T10:00:00Z',
            applicationsCount: 0,
            matchedInfluencer: {
              id: 'influencer1',
              displayName: 'あなた',
            },
          },
          {
            id: '2',
            title: 'ファッションブランド春コレクション',
            description: '春の新作ファッションアイテムを着用していただける方を募集',
            category: 'ファッション',
            budget: 300000,
            status: 'IN_PROGRESS',
            targetPlatforms: ['Instagram', 'TikTok'],
            targetPrefecture: '全国',
            targetAgeMin: 18,
            targetAgeMax: 30,
            targetFollowerMin: 5000,
            targetFollowerMax: 50000,
            startDate: '2024-03-15',
            endDate: '2024-05-15',
            createdAt: '2024-02-20T10:00:00Z',
            applicationsCount: 0,
            matchedInfluencer: {
              id: 'influencer1',
              displayName: 'あなた',
            },
          },
        ];
        setProjects(mockInfluencerProjects);
      } else {
        const { getMyProjects } = await import('../../services/api');
        const result = await getMyProjects();
        setProjects(result.projects || []);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError('プロジェクトの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusInfo = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

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

  if (loading) {
    return (
      <PageLayout title="プロジェクト管理" subtitle="読み込み中...">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </PageLayout>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <PageLayout
      title={user?.role === 'INFLUENCER' ? "進行中のプロジェクト" : "プロジェクト管理"}
      subtitle={user?.role === 'INFLUENCER' ? "参加中のプロジェクトを確認" : "あなたのインフルエンサーマーケティングプロジェクトを一元管理"}
      userEmail={user?.email}
      onLogout={handleLogout}
    >
      {user?.role !== 'INFLUENCER' && (
        <div className="mb-8 flex justify-end">
          <Button
            onClick={() => router.push('/projects/create')}
            variant="primary"
            size="lg"
            icon="+"
          >
            新規プロジェクト作成
          </Button>
        </div>
      )}
      {/* 検索・フィルター */}
      <Card className="mb-8" padding="lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="プロジェクト名、説明、カテゴリーで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(option => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statusFilter === option.value
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>
      </Card>

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
        {filteredProjects.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">プロジェクトが見つかりません</h3>
            <p className="text-gray-600 mb-4">
              {user?.role === 'INFLUENCER' 
                ? '現在進行中のプロジェクトはありません。' 
                : (statusFilter === 'all' ? '新しいプロジェクトを作成してみましょう。' : '条件に合うプロジェクトがありません。')}
            </p>
            {user?.role !== 'INFLUENCER' && (
              <Button
                onClick={() => router.push('/projects/create')}
                variant="primary"
                size="lg"
              >
                新しいプロジェクトを作成
              </Button>
            )}
          </Card>
        ) : (
          filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover={true} padding="lg">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(project.status).color}`}>
                        {getStatusInfo(project.status).label}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{project.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                      <span>💰 {formatPrice(project.budget)}</span>
                      <span>🏷️ {project.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                    {/* アクションボタン */}
                    
                    {/* チャットボタン - 全プロジェクトで表示 */}
                    <Button
                      onClick={() => router.push(`/project-chat/${project.id}`)}
                      variant="secondary"
                      size="md"
                      icon="💬"
                      className="relative"
                    >
                      <span className="hidden md:inline">チャット</span>
                      {/* 未読バッジ - アクティブなプロジェクトのみ */}
                      {(project.status === 'MATCHED' || project.status === 'IN_PROGRESS') && Math.random() > 0.7 && (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {Math.floor(Math.random() * 5) + 1}
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={() => router.push(`/project-detail?id=${project.id}`)}
                      variant="primary"
                      size="md"
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>

                {/* 進行中プロジェクトの詳細情報 */}
                {project.status === 'IN_PROGRESS' && project.projectDetails ? (
                  <div className="space-y-4">
                    {/* プロジェクト進行状況 */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                      <h4 className="font-bold text-green-800 mb-3 flex items-center">
                        <span className="mr-2">🚀</span>
                        プロジェクト進行状況
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{project.projectDetails.listupCount}</div>
                          <div className="text-sm text-gray-600">リストアップ数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{project.projectDetails.assignedCount}</div>
                          <div className="text-sm text-gray-600">アサイン数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{formatDate(project.projectDetails.publishDate)}</div>
                          <div className="text-sm text-gray-600">投稿予定日</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{project.projectDetails.manager}</div>
                          <div className="text-sm text-gray-600">担当者</div>
                        </div>
                      </div>
                    </div>

                    {/* アサイン済みインフルエンサー */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">👥</span>
                        アサイン済みインフルエンサー
                      </h4>
                      <div className="space-y-3">
                        {project.projectDetails.assignedInfluencers.map((influencer: AssignedInfluencer, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-md transition-all"
                                onClick={() => router.push(`/influencer/${influencer.id}`)}
                                title={`${influencer.displayName}の詳細を見る`}
                              >
                                {influencer.displayName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{influencer.displayName}</div>
                                <div className="text-sm text-gray-600">
                                  {getPlatformIcon(influencer.platform)} {influencer.platform} • {influencer.followerCount.toLocaleString()}フォロワー
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">{formatPrice(influencer.contractPrice)}</div>
                              <div className="text-xs text-gray-500">契約金額</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // 通常のプロジェクト情報表示
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">対象プラットフォーム</h4>
                      <div className="flex space-x-2">
                        {project.targetPlatforms.map(platform => (
                          <span key={platform} className="text-lg">
                            {getPlatformIcon(platform)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">対象地域</h4>
                      <p className="text-gray-600">{project.targetPrefecture}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">年齢層</h4>
                      <p className="text-gray-600">
                        {project.targetAgeMin > 0 && project.targetAgeMax > 0 
                          ? `${project.targetAgeMin}-${project.targetAgeMax}歳`
                          : '指定なし'
                        }
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">応募状況</h4>
                      <p className="text-gray-600">
                        {project.matchedInfluencer 
                          ? `${project.matchedInfluencer.displayName}とマッチング`
                          : `${project.applicationsCount}件の応募`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 統計情報 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-8"
      >
        <Card padding="xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">プロジェクト統計</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {projects.length}
              </div>
              <div className="text-gray-600">総プロジェクト数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {projects.filter(p => p.status === 'PENDING').length}
              </div>
              <div className="text-gray-600">募集中</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">
                {projects.filter(p => p.status === 'IN_PROGRESS').length}
              </div>
              <div className="text-gray-600">進行中</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {projects.filter(p => p.status === 'COMPLETED').length}
              </div>
              <div className="text-gray-600">完了済み</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </PageLayout>
  );
};

export default ProjectsPage;