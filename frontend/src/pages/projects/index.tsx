import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import StatsCard from '../../components/common/StatsCard';
import { checkAndRedirectForInvoice } from '../../utils/invoiceValidation';
import { checkAndRedirectForNDA } from '../../utils/ndaValidation';

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
  // 企業情報
  client?: {
    companyName: string;
    contactName?: string;
  };
  // 企業が登録した詳細情報
  advertiserName?: string;
  brandName?: string;
  productName?: string;
  productUrl?: string;
  productPrice?: number;
  productFeatures?: string;
  campaignObjective?: string;
  campaignTarget?: string;
  postingPeriodStart?: string;
  postingPeriodEnd?: string;
  postingMedia?: string[];
  messageToConvey?: string;
  shootingAngle?: string;
  packagePhotography?: string;
  referenceUrl?: string;
  prohibitedMatters?: string;
  hashtagInstruction?: string;
  mentionInstruction?: string;
  remarks?: string;
}

const ProjectsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // 成約状態を判定する関数
  const isContractEstablished = (project: Project, currentUser: any): boolean => {
    if (!project || !currentUser) return false;
    
    // インフルエンサーの場合、自分がマッチングされており、かつプロジェクトが進行中以上の状態
    if (currentUser.role === 'INFLUENCER') {
      return project.matchedInfluencer?.id === currentUser.id && 
             (project.status === 'IN_PROGRESS' || project.status === 'COMPLETED');
    }
    
    // 企業の場合は常に表示
    return true;
  };

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
      const { getMyProjects } = await import('../../services/api');
      const result = await getMyProjects();
      setProjects(result.projects || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError('プロジェクトの取得に失敗しました。');
      setProjects([]);
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
      <DashboardLayout title="プロジェクト管理" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="プロジェクト管理"
      subtitle={user?.role === 'INFLUENCER' ? "参加中のプロジェクトを確認" : undefined}
    >
      {/* 統計情報 - ページ最上部 */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">総数</div>
            <div className="text-lg font-bold text-gray-900">{projects.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">募集中</div>
            <div className="text-lg font-bold text-gray-900">{projects.filter(p => p.status === 'PENDING').length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">進行中</div>
            <div className="text-lg font-bold text-gray-900">{projects.filter(p => p.status === 'IN_PROGRESS').length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">完了済み</div>
            <div className="text-lg font-bold text-gray-900">{projects.filter(p => p.status === 'COMPLETED').length}</div>
          </div>
        </div>
      </div>

      {user?.role !== 'INFLUENCER' && (
        <div className="mb-6 flex justify-end">
          <Button
            onClick={() => router.push('/projects/create')}
            variant="primary"
            size="sm"
            icon="+"
          >
            新規作成
          </Button>
        </div>
      )}
      {/* 検索・フィルター */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                statusFilter === option.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* プロジェクト一覧 */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">プロジェクトが見つかりません</p>
            {user?.role !== 'INFLUENCER' && (
              <button
                onClick={() => router.push('/projects/create')}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                新規作成 →
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id}>
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
                    
                    {/* 企業情報の表示制御 */}
                    {isContractEstablished(project, user) && project.client && (
                      <div className="mb-2">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                          <span className="text-blue-600 text-sm">🏢</span>
                          <span className="text-blue-700 text-sm font-medium">{project.client.companyName}</span>
                          {project.client.contactName && (
                            <span className="text-blue-600 text-sm">({project.client.contactName})</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!isContractEstablished(project, user) && user?.role === 'INFLUENCER' && (
                      <div className="mb-2">
                        <div className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                          <span className="text-gray-500 text-sm">🔒</span>
                          <span className="text-gray-600 text-sm">企業情報は成約後に表示されます</span>
                        </div>
                      </div>
                    )}
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
                      onClick={() => {
                        // NDAチェック（企業・インフルエンサー両方）
                        if (!checkAndRedirectForNDA(user, router)) {
                          return;
                        }
                        // インフルエンサーの場合はインボイス情報チェック
                        if (user?.role === 'INFLUENCER' && !checkAndRedirectForInvoice(user, router)) {
                          return;
                        }
                        router.push(`/project-chat/${project.id}`);
                      }}
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
                      onClick={() => {
                        // NDAチェック（企業・インフルエンサー両方）
                        if (!checkAndRedirectForNDA(user, router)) {
                          return;
                        }
                        router.push(`/project-detail?id=${project.id}`);
                      }}
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
                  // 企業が登録した詳細情報を表示
                  <div className="space-y-4">
                    {/* 基本情報 */}
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

                    {/* 企業が登録した詳細情報 */}
                    {(project.brandName || project.productName || project.campaignObjective) && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-3">📝 プロジェクト詳細情報</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {project.advertiserName && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">広告主名</p>
                              <p className="text-gray-900">{project.advertiserName}</p>
                            </div>
                          )}
                          {project.brandName && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">ブランド名</p>
                              <p className="text-gray-900">{project.brandName}</p>
                            </div>
                          )}
                          {project.productName && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">商品名</p>
                              <p className="text-gray-900">{project.productName}</p>
                            </div>
                          )}
                          {project.productPrice && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">商品価格</p>
                              <p className="text-gray-900">{formatPrice(project.productPrice)}</p>
                            </div>
                          )}
                          {project.campaignObjective && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-semibold text-gray-700">キャンペーン目的</p>
                              <p className="text-gray-900">{project.campaignObjective}</p>
                            </div>
                          )}
                          {project.campaignTarget && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-semibold text-gray-700">ターゲット</p>
                              <p className="text-gray-900">{project.campaignTarget}</p>
                            </div>
                          )}
                          {project.messageToConvey && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-semibold text-gray-700">伝えたいメッセージ</p>
                              <p className="text-gray-900">{project.messageToConvey}</p>
                            </div>
                          )}
                          {project.productUrl && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-semibold text-gray-700">商品URL</p>
                              <a href={project.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                {project.productUrl}
                              </a>
                            </div>
                          )}
                          {project.postingMedia && project.postingMedia.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">投稿媒体</p>
                              <p className="text-gray-900">{project.postingMedia.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;