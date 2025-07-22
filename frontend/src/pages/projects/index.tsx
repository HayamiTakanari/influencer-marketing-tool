import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BackButton from '../../components/BackButton';

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
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      fetchProjects();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchProjects = async () => {
    try {
      const { getMyProjects } = await import('../../services/api');
      const result = await getMyProjects();
      setProjects(result.projects || []);
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
            <BackButton text="ダッシュボードに戻る" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">プロジェクト管理</h1>
              <p className="text-sm text-gray-600">あなたのマーケティングプロジェクトを管理</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                console.log('Button clicked!');
                window.location.href = '/projects/create';
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              + 新規作成
            </button>
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="プロジェクト名、説明、カテゴリーで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
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

        {/* プロジェクト一覧 */}
        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">プロジェクトが見つかりません</h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === 'all' ? '新しいプロジェクトを作成してみましょう。' : '条件に合うプロジェクトがありません。'}
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Navigating to /projects/create from empty state');
                  router.push('/projects/create');
                }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                新しいプロジェクトを作成
              </button>
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
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
                  <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                    <button
                      onClick={() => {
                        console.log('Detail button clicked!');
                        router.push(`/project-detail?id=${project.id}`);
                      }}
                      className="px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors hover:scale-105"
                    >
                      詳細
                    </button>
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
              <div className="text-3xl font-bold text-green-600 mb-2">
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
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectsPage;