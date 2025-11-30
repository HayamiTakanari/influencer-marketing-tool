import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingState from '../../../components/common/LoadingState';
import EmptyState from '../../../components/common/EmptyState';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import { getMyProjects } from '../../../services/api';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import api from '../../../services/api';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetPlatforms: string[];
  targetPrefecture: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface Application {
  id: string;
  projectId: string;
  project: {
    id: string;
    title: string;
    category: string;
  };
  influencer: {
    id: string;
    displayName: string;
    user: {
      email: string;
    };
    socialAccounts: Array<{
      platform: string;
      followerCount: number;
      isVerified: boolean;
    }>;
  };
  message: string;
  proposedPrice: number;
  isAccepted: boolean;
  appliedAt: string;
}

const ProjectListPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'projects' | 'applications'>('projects');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedAppStatus, setSelectedAppStatus] = useState<'all' | 'pending' | 'accepted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [minBudget, setMinBudget] = useState<number | null>(null);
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const router = useRouter();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchProjects = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(userData);

      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/influencer/dashboard');
        setLoading(false);
        return;
      }

      setUser(parsedUser);

      try {
        // Fetch projects and applications
        const [projectsData, applicationsData] = await Promise.all([
          getMyProjects(),
          (async () => {
            try {
              const response = await (await import('../../../services/api')).default.get('/projects/applications');
              return (response.data || []).sort((a: Application, b: Application) =>
                new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
              );
            } catch (error) {
              console.error('Error fetching applications:', error);
              return [];
            }
          })()
        ]);
        setProjects(projectsData || []);
        setApplications(applicationsData || []);

        // Extract unique categories and platforms from projects
        const uniqueCategories = [...new Set((projectsData || []).map(p => p.category))];
        const uniquePlatforms = [...new Set((projectsData || []).flatMap(p => p.targetPlatforms))];
        setCategories(uniqueCategories);
        setPlatforms(uniquePlatforms);
      } catch (error) {
        console.error('Error fetching data:', error);
        handleError(error, 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isMounted]);

  const handleAccept = async (applicationId: string) => {
    try {
      await api.put(`/projects/applications/${applicationId}/accept`);
      // Update local state
      setApplications(apps =>
        apps.map(app =>
          app.id === applicationId ? { ...app, isAccepted: true } : app
        )
      );
    } catch (error) {
      handleError(error, '応募の承認に失敗しました');
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      await api.delete(`/projects/applications/${applicationId}/reject`);
      // Remove from local state
      setApplications(apps => apps.filter(app => app.id !== applicationId));
    } catch (error) {
      handleError(error, '応募の却下に失敗しました');
    }
  };

  const handleCopyProject = async (projectId: string, projectTitle: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/copy`);
      if (response.data.success) {
        // Add the copied project to the list
        setProjects([response.data.data, ...projects]);
        handleError(null, `「${projectTitle}」をコピーしました`);
      }
    } catch (error) {
      handleError(error, 'プロジェクトのコピーに失敗しました');
    }
  };

  const filteredProjects = projects.filter(p => {
    // Status filter
    if (selectedStatus && p.status !== selectedStatus) return false;

    // Search query filter (title, description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(query);
      const matchesDescription = p.description.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) return false;
    }

    // Category filter
    if (selectedCategory && p.category !== selectedCategory) return false;

    // Platform filter
    if (selectedPlatform && !p.targetPlatforms.includes(selectedPlatform)) return false;

    // Budget filter
    if (minBudget !== null && p.budget < minBudget) return false;
    if (maxBudget !== null && p.budget > maxBudget) return false;

    return true;
  });

  const statusCounts = {
    PENDING: projects.filter(p => p.status === 'PENDING').length,
    MATCHED: projects.filter(p => p.status === 'MATCHED').length,
    IN_PROGRESS: projects.filter(p => p.status === 'IN_PROGRESS').length,
    COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
    CANCELLED: projects.filter(p => p.status === 'CANCELLED').length,
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '募集中' },
      MATCHED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'マッチ済み' },
      IN_PROGRESS: { bg: 'bg-green-100', text: 'text-green-700', label: '進行中' },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700', label: '完了' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'キャンセル' },
    };

    const s = statusMap[status] || statusMap.PENDING;
    return { ...s };
  };

  if (!isMounted || loading) {
    return (
      <DashboardLayout title="プロジェクト管理" subtitle="あなたのプロジェクト一覧">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="プロジェクト管理" subtitle="プロジェクトと応募を一元管理">
      <div className="space-y-6">
        {/* タブ */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => {
              setSelectedTab('projects');
              setSelectedStatus(null);
            }}
            className={`pb-3 px-2 font-medium transition-colors ${
              selectedTab === 'projects'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            プロジェクト ({projects.length})
          </button>
          <button
            onClick={() => {
              setSelectedTab('applications');
              setSelectedAppStatus('all');
            }}
            className={`pb-3 px-2 font-medium transition-colors ${
              selectedTab === 'applications'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            応募 ({applications.length})
          </button>
        </div>

        {selectedTab === 'projects' && (
          <>
            {/* アクション */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">プロジェクト一覧</h3>
                <p className="text-sm text-gray-600 mt-1">全 {projects.length} 件</p>
              </div>
              <Link href="/company/projects/create">
                <Button>＋ 新しいプロジェクトを作成</Button>
              </Link>
            </div>

        {/* 検索フィルター */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">検索・絞り込み</h3>
          <div className="space-y-4">
            {/* キーワード検索 */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">キーワード検索</label>
              <input
                type="text"
                placeholder="プロジェクト名や説明から検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* フィルター行 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* カテゴリー */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">カテゴリー</label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">すべて</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* プラットフォーム */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">プラットフォーム</label>
                <select
                  value={selectedPlatform || ''}
                  onChange={(e) => setSelectedPlatform(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">すべて</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              {/* 最小予算 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">最小予算 (円)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minBudget ?? ''}
                  onChange={(e) => setMinBudget(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 最大予算 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">最大予算 (円)</label>
                <input
                  type="number"
                  placeholder="無制限"
                  value={maxBudget ?? ''}
                  onChange={(e) => setMaxBudget(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* リセットボタン */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedPlatform(null);
                  setMinBudget(null);
                  setMaxBudget(null);
                }}
              >
                フィルターをリセット
              </Button>
            </div>
          </div>
        </Card>

        {/* ステータスフィルター */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">ステータスで絞り込み</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === null
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて ({projects.length})
            </button>
            <button
              onClick={() => setSelectedStatus('PENDING')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              募集中 ({statusCounts.PENDING})
            </button>
            <button
              onClick={() => setSelectedStatus('MATCHED')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === 'MATCHED'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              マッチ済み ({statusCounts.MATCHED})
            </button>
            <button
              onClick={() => setSelectedStatus('IN_PROGRESS')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === 'IN_PROGRESS'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              進行中 ({statusCounts.IN_PROGRESS})
            </button>
            <button
              onClick={() => setSelectedStatus('COMPLETED')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === 'COMPLETED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              完了 ({statusCounts.COMPLETED})
            </button>
          </div>
        </Card>

        {/* プロジェクトテーブル */}
        {filteredProjects.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">プロジェクト</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">ステータス</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">マッチング</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">予算</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">カテゴリー</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">プラットフォーム</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">期限</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => {
                    const status = getStatusBadge(project.status);
                    const isMatched = project.status === 'MATCHED' || project.status === 'IN_PROGRESS' || project.status === 'COMPLETED';
                    return (
                      <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <p className="font-medium text-gray-900 line-clamp-1">{project.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-3 py-1 ${status.bg} ${status.text} text-xs font-medium rounded-full`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isMatched
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isMatched ? '✓ マッチング済み' : '未マッチング'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-900">¥{project.budget?.toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-700">{project.category}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {project.targetPlatforms?.slice(0, 2).map(platform => (
                              <span key={platform} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                {platform}
                              </span>
                            ))}
                            {project.targetPlatforms?.length > 2 && (
                              <span className="text-xs text-gray-500">+{project.targetPlatforms.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-700 text-sm">{new Date(project.endDate).toLocaleDateString('ja-JP')}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-center">
                            <Link href={`/company/projects/${project.id}`}>
                              <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">詳細</button>
                            </Link>
                            {project.status === 'PENDING' && (
                              <Link href={`/company/projects/${project.id}/ai-matching`}>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">AI</button>
                              </Link>
                            )}
                            <button
                              onClick={() => handleCopyProject(project.id, project.title)}
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              コピー
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon="📁"
            title={selectedStatus ? `${selectedStatus} のプロジェクトがありません` : 'プロジェクトがありません'}
            description="新しいプロジェクトを作成して始めましょう"
          />
        )}
          </>
        )}

        {selectedTab === 'applications' && (
          <>
            {/* 応募一覧タイトル */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">応募一覧</h3>
              <p className="text-sm text-gray-600 mt-1">全 {applications.length} 件</p>
            </div>

            {/* ステータスフィルター */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">ステータスで絞り込み</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedAppStatus('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedAppStatus === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  すべて ({applications.length})
                </button>
                <button
                  onClick={() => setSelectedAppStatus('pending')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedAppStatus === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  待機中 ({applications.filter(a => !a.isAccepted).length})
                </button>
                <button
                  onClick={() => setSelectedAppStatus('accepted')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedAppStatus === 'accepted'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  承認済み ({applications.filter(a => a.isAccepted).length})
                </button>
              </div>
            </Card>

            {/* 応募テーブル */}
            {applications.filter(app => {
              if (selectedAppStatus === 'all') return true;
              if (selectedAppStatus === 'pending') return !app.isAccepted;
              if (selectedAppStatus === 'accepted') return app.isAccepted;
              return true;
            }).length > 0 ? (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">インフルエンサー</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">プロジェクト</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">ステータス</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">フォロワー数</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">提案価格</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">応募日</th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-900">アクション</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.filter(app => {
                        if (selectedAppStatus === 'all') return true;
                        if (selectedAppStatus === 'pending') return !app.isAccepted;
                        if (selectedAppStatus === 'accepted') return app.isAccepted;
                        return true;
                      }).map(app => {
                        const totalFollowers = app.influencer.socialAccounts.reduce(
                          (sum, acc) => sum + acc.followerCount,
                          0
                        );

                        return (
                          <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <p className="font-medium text-gray-900">{app.influencer.displayName}</p>
                                <p className="text-xs text-gray-500 mt-1">{app.influencer.user.email}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-medium text-gray-900 line-clamp-1">{app.project.title}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-block px-3 py-1 ${
                                app.isAccepted
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              } text-xs font-medium rounded-full`}>
                                {app.isAccepted ? '承認済み' : '待機中'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-semibold text-gray-900">{totalFollowers?.toLocaleString()}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-semibold text-gray-900">
                                {app.proposedPrice ? `¥${app.proposedPrice.toLocaleString()}` : '-'}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-gray-700">{new Date(app.appliedAt).toLocaleDateString('ja-JP')}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2 justify-center">
                                {!app.isAccepted && (
                                  <>
                                    <button
                                      onClick={() => handleAccept(app.id)}
                                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                                    >
                                      承認
                                    </button>
                                    <button
                                      onClick={() => handleReject(app.id)}
                                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                      却下
                                    </button>
                                  </>
                                )}
                                <Link href={`/company/influencers/${app.influencer.id}`}>
                                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">詳細</button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <EmptyState
                icon="📋"
                title={selectedAppStatus !== 'all' ? `${selectedAppStatus}の応募はありません` : '応募がありません'}
                description="インフルエンサーからの応募をお待ちしています"
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectListPage;
