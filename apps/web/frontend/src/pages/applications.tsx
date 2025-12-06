import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface Application {
  id: string;
  message: string;
  proposedPrice: number;
  isAccepted: boolean;
  isRejected?: boolean;
  rejectReason?: string;
  rejectedAt?: string;
  appliedAt: string;
  influencer: {
    id: string;
    displayName: string;
    bio: string;
    categories: string[];
    prefecture: string;
    user: {
      email: string;
    };
    socialAccounts: {
      id: string;
      platform: string;
      username: string;
      followerCount: number;
      engagementRate: number;
      isVerified: boolean;
    }[];
  };
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    status: string;
  };
}

const ApplicationsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const router = useRouter();
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      fetchApplications();
      fetchProjects();
    } else {
      router.push('/login');
    }
  }, [router]);

  // 自動更新
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchApplications();
    }, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchApplications = async () => {
    try {
      const { getApplicationsForMyProjects } = await import('../services/api');
      const result = await getApplicationsForMyProjects();
      setApplications(result || []);
      setError('');
    } catch (err: any) {
      handleError(err, '応募の取得');
      setError('応募の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    if (!confirm('この応募を承認しますか？')) return;
    
    setProcessing(applicationId);
    try {
      const { acceptApplication } = await import('../services/api');
      await acceptApplication(applicationId);
      await fetchApplications();
      handleSuccess('応募を承認しました！');
    } catch (err: any) {
      handleError(err, '応募の承認');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    if (!confirm('この応募を拒否しますか？')) return;
    
    setProcessing(applicationId);
    try {
      const { rejectApplication } = await import('../services/api');
      await rejectApplication(applicationId);
      await fetchApplications();
      handleSuccess('応募を拒否しました');
    } catch (err: any) {
      handleError(err, '応募の拒否');
    } finally {
      setProcessing(null);
    }
  };

  const fetchProjects = async () => {
    try {
      const { getProjects } = await import('../services/api');
      const result = await getProjects();
      setProjects(result?.projects || []);
    } catch (err: any) {
      handleError(err, 'プロジェクトの取得');
    }
  };

  const filteredApplications = applications
    .filter(application => {
      let matchesStatus = true;
      let matchesProject = true;
      let matchesSearch = true;

      // Status filter
      if (statusFilter === 'pending') matchesStatus = !application.isAccepted && !application.isRejected && application.project.status === 'PENDING';
      else if (statusFilter === 'accepted') matchesStatus = application.isAccepted;
      else if (statusFilter === 'rejected') matchesStatus = application.isRejected === true;

      // Project filter
      if (projectFilter !== 'all') matchesProject = application.project.id === projectFilter;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matchesSearch = 
          application.influencer.displayName.toLowerCase().includes(query) ||
          application.influencer.categories.some(cat => cat.toLowerCase().includes(query)) ||
          application.project.title.toLowerCase().includes(query);
      }

      return matchesStatus && matchesProject && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case 'followers':
          return getTotalFollowers(b.influencer.socialAccounts) - getTotalFollowers(a.influencer.socialAccounts);
        case 'engagement':
          return parseFloat(String(getAverageEngagement(b.influencer.socialAccounts))) - parseFloat(String(getAverageEngagement(a.influencer.socialAccounts)));
        case 'price':
          return b.proposedPrice - a.proposedPrice;
        default:
          return 0;
      }
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <LoadingState />
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
              <h1 className="text-xl font-bold text-gray-900">応募管理</h1>
              <p className="text-sm text-gray-600">プロジェクトへの応募を管理</p>
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
        {/* フィルター */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">応募一覧</h2>
                <p className="text-gray-600">あなたのプロジェクトへの応募を確認・管理できます</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 検索 */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="インフルエンサー、カテゴリー、プロジェクトで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">並び替え:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="date">日付順</option>
                  <option value="followers">フォロワー数</option>
                  <option value="engagement">エンゲージメント</option>
                  <option value="price">提案料金</option>
                </select>
              </div>

              {/* Auto Refresh */}
              <div className="flex items-center gap-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">自動更新</span>
                </label>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'すべて' },
                  { value: 'pending', label: '審査中' },
                  { value: 'accepted', label: '承認済み' },
                  { value: 'rejected', label: '却下済み' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      statusFilter === filter.value
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Project Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">プロジェクト:</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">すべてのプロジェクト</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* 応募一覧 */}
        <div className="space-y-6">
          {filteredApplications.length === 0 ? (
            <EmptyState
              icon="📝"
              title="応募がありません"
              description="まだプロジェクトへの応募がありません。"
            />
          ) : (
            filteredApplications.map((application, index) => (
              <div
                key={application.id}
                className={`bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  application.isAccepted ? 'border-green-200 bg-green-50/50' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* プロジェクト情報 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{application.project.title}</h3>
                      {application.isAccepted && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          ✓ 承認済み
                        </span>
                      )}
                      {application.isRejected && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          ✕ 却下済み
                        </span>
                      )}
                      {application.project.status === 'MATCHED' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          マッチング済み
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{application.project.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span>📅 {formatDate(application.appliedAt)}</span>
                      <span>🏷️ {application.project.category}</span>
                      <span>💰 予算: {formatPrice(application.project.budget)}</span>
                    </div>
                  </div>

                  {/* インフルエンサー情報 */}
                  <div className="lg:w-96 bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {application.influencer.displayName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{application.influencer.displayName}</h4>
                        <p className="text-gray-600 text-sm">{application.influencer.prefecture}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-700 text-sm line-clamp-2">{application.influencer.bio}</p>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {application.influencer.categories.map(category => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{formatNumber(getTotalFollowers(application.influencer.socialAccounts))}</div>
                        <div className="text-gray-500">フォロワー</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{getAverageEngagement(application.influencer.socialAccounts)}%</div>
                        <div className="text-gray-500">エンゲージメント</div>
                      </div>
                    </div>

                    <div className="flex justify-center space-x-2 mb-4">
                      {application.influencer.socialAccounts.map(account => (
                        <div
                          key={account.id}
                          className="flex items-center space-x-1 px-2 py-1 bg-white rounded-lg text-xs"
                        >
                          <span>{getPlatformIcon(account.platform)}</span>
                          <span className="font-medium">{formatNumber(account.followerCount)}</span>
                          {account.isVerified && <span className="text-blue-500">✓</span>}
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">提案料金</span>
                        <span className="text-lg font-bold text-green-600">{formatPrice(application.proposedPrice)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>応募メッセージ:</strong>
                        <p className="mt-1">{application.message}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 却下理由 */}
                {application.isRejected && application.rejectReason && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h4 className="font-bold text-red-800 mb-2 flex items-center">
                      <span className="mr-2">⚠️</span>
                      却下理由
                    </h4>
                    <p className="text-red-700">{application.rejectReason}</p>
                    {application.rejectedAt && (
                      <p className="text-sm text-red-600 mt-2">
                        却下日時: {formatDate(application.rejectedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* 操作ボタン */}
                {!application.isAccepted && !application.isRejected && application.project.status === 'PENDING' && (
                  <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleRejectApplication(application.id)}
                      disabled={processing === application.id}
                      className="px-6 py-2 border-2 border-red-300 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {processing === application.id ? '処理中...' : '拒否'}
                    </button>
                    <button
                      onClick={() => handleAcceptApplication(application.id)}
                      disabled={processing === application.id}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {processing === application.id ? '処理中...' : '承認'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 統計情報 */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">応募統計</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {applications.length}
              </div>
              <div className="text-gray-600">総応募数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {applications.filter(a => !a.isAccepted && a.project.status === 'PENDING').length}
              </div>
              <div className="text-gray-600">審査中</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {applications.filter(a => a.isAccepted).length}
              </div>
              <div className="text-gray-600">承認済み</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {applications.length > 0 ? Math.round(applications.reduce((sum, a) => sum + a.proposedPrice, 0) / applications.length).toLocaleString() : 0}
              </div>
              <div className="text-gray-600">平均提案料金（円）</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;