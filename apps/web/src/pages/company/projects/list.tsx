import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingState from '../../../components/common/LoadingState';
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
  updatedAt?: string;
  matchedInfluencerId?: string;
  matchedInfluencer?: {
    displayName: string;
  };
  applicationCount?: number;
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
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedAppStatus, setSelectedAppStatus] = useState<'all' | 'pending' | 'accepted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [minBudget, setMinBudget] = useState<number | null>(null);
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { handleError, handleSuccess } = useErrorHandler();

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

      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
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
        // Handle both array and object responses
        const projectsArray = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
        setProjects(projectsArray);
        setApplications(applicationsData || []);

        // Extract unique categories and platforms from projects
        const uniqueCategories = [...new Set(projectsArray.map(p => p.category))] as string[];
        const uniquePlatforms = [...new Set(projectsArray.flatMap(p => p.targetPlatforms))] as string[];
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

  const handleCopyProject = async (projectId: string, projectTitle: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/copy`);
      if (response.data.success) {
        // Add the copied project to the list
        setProjects([response.data.data, ...projects]);
        handleSuccess(`「${projectTitle}」をコピーしました`);
      }
    } catch (error) {
      handleError(error, 'プロジェクトのコピーに失敗しました');
    }
  };

  const handleSelectProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleSelectAllProjects = () => {
    if (selectedProjects.size === filteredProjects.length && filteredProjects.length > 0) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProjects.size === 0) {
      handleError(new Error('削除するプロジェクトを選択してください'), '削除');
      return;
    }

    const deleteCount = selectedProjects.size;
    const confirmed = confirm(`${deleteCount}件のプロジェクトを削除してもよろしいですか？`);
    if (!confirmed) return;

    try {
      setDeleting(true);

      // Delete each selected project
      await Promise.all(
        Array.from(selectedProjects).map(projectId =>
          api.delete(`/projects/${projectId}`)
        )
      );

      // Remove deleted projects from the list
      setProjects(projects.filter(p => !selectedProjects.has(p.id)));
      setSelectedProjects(new Set());

      // Show success message
      handleSuccess(`${deleteCount}件のプロジェクトを削除しました`);
    } catch (error) {
      handleError(error, 'プロジェクトの削除に失敗しました');
    } finally {
      setDeleting(false);
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

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: '募集中',
      MATCHED: 'マッチ済み',
      IN_PROGRESS: '進行中',
      COMPLETED: '完了',
      CANCELLED: 'キャンセル',
    };
    return statusMap[status] || status;
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
      <div className="space-y-3">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">プロジェクト一覧</h3>
          <Link href="/company/projects/create">
            <Button size="sm">＋ 新規作成</Button>
          </Link>
        </div>

        {/* インラインフィルターと操作ボタン */}
        <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
          <input
            type="text"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 w-32"
          />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">カテゴリー</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={selectedPlatform || ''}
            onChange={(e) => setSelectedPlatform(e.target.value || null)}
            className="px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">プラットフォーム</option>
            {platforms.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
          <select
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
            className="px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">ステータス</option>
            <option value="PENDING">募集中</option>
            <option value="MATCHED">マッチ済み</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="COMPLETED">完了</option>
          </select>
          {(searchQuery || selectedCategory || selectedPlatform || selectedStatus) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedPlatform(null);
                setSelectedStatus(null);
                setMinBudget(null);
                setMaxBudget(null);
              }}
              className="px-2.5 py-1.5 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              リセット
            </button>
          )}
          {/* 操作ボタン（フィルターの右側） */}
          <div className="flex gap-1.5 ml-auto">
            {selectedProjects.size > 0 && (
              <>
                <button
                  onClick={() => {
                    const firstSelected = Array.from(selectedProjects)[0];
                    const project = projects.find(p => p.id === firstSelected);
                    if (project) handleCopyProject(firstSelected, project.title);
                  }}
                  disabled={selectedProjects.size !== 1}
                  className="px-2.5 py-1.5 bg-blue-500 text-white text-xs rounded font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={selectedProjects.size === 1 ? '選択したプロジェクトを複製' : '1つのプロジェクトのみ複製可能'}
                >
                  複製 ({selectedProjects.size})
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="px-2.5 py-1.5 bg-red-500 text-white text-xs rounded font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {deleting ? '削除中...' : `削除 (${selectedProjects.size})`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* プロジェクトテーブル */}
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedProjects.size > 0 && selectedProjects.size === filteredProjects.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedProjects.size > 0 && selectedProjects.size < filteredProjects.length;
                        }
                      }}
                      onChange={handleSelectAllProjects}
                      className="w-4 h-4 rounded cursor-pointer"
                      disabled={filteredProjects.length === 0}
                    />
                  </th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs">プロジェクト</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs">ステータス</th>
                  <th className="text-center py-1.5 px-2 font-semibold text-gray-900 text-xs">応募件数</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs">マッチしたインフルエンサー</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-gray-900 text-xs">予算</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs">カテゴリー</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs">プラットフォーム</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs">期限</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs">作成日</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs">更新日</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map(project => {
                    const status = getStatusBadge(project.status);
                    const isMatched = project.status === 'MATCHED' || project.status === 'IN_PROGRESS' || project.status === 'COMPLETED';
                    return (
                      <tr key={project.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedProjects.has(project.id) ? 'bg-blue-50' : ''}`}>
                        <td className="py-1.5 px-2">
                          <input
                            type="checkbox"
                            checked={selectedProjects.has(project.id)}
                            onChange={() => handleSelectProject(project.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <Link href={`/company/projects/${project.id}`}>
                            <p className="font-medium text-emerald-600 line-clamp-1 cursor-pointer hover:opacity-80 transition-opacity">{project.title}</p>
                          </Link>
                        </td>
                        <td className="py-1.5 px-2">
                          <span className={`inline-block px-2 py-0.5 ${status.bg} ${status.text} text-xs font-medium rounded-full whitespace-nowrap`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <p className="text-gray-700 text-xs font-semibold">{project.applicationCount ?? 0}</p>
                        </td>
                        <td className="py-1.5 px-2">
                          <p className={`text-xs ${project.matchedInfluencer?.displayName ? 'text-gray-700' : 'text-gray-400'}`}>
                            {project.matchedInfluencer?.displayName || '未マッチ'}
                          </p>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <p className="font-semibold text-gray-900">¥{project.budget?.toLocaleString()}</p>
                        </td>
                        <td className="py-1.5 px-2">
                          <p className="text-gray-700 line-clamp-1 text-xs">{project.category}</p>
                        </td>
                        <td className="py-1.5 px-2">
                          <div className="flex flex-wrap gap-0.5">
                            {project.targetPlatforms?.slice(0, 1).map(platform => (
                              <span key={platform} className="inline-block bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded whitespace-nowrap">
                                {platform}
                              </span>
                            ))}
                            {project.targetPlatforms?.length > 1 && (
                              <span className="text-xs text-gray-500">+{project.targetPlatforms.length - 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap">
                          <p className="text-gray-700 text-xs">{new Date(project.endDate).toLocaleDateString('ja-JP')}</p>
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap">
                          <p className="text-gray-700 text-xs">{new Date(project.createdAt).toLocaleDateString('ja-JP')}</p>
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap">
                          <p className="text-gray-700 text-xs">{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('ja-JP') : '-'}</p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="py-6 px-2 text-center">
                      <p className="text-xs text-gray-500">{selectedStatus ? `${getStatusLabel(selectedStatus)}のプロジェクトはありません` : 'プロジェクトはまだありません'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProjectListPage;
