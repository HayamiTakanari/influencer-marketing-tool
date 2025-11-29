import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingState from '../../../components/common/LoadingState';
import EmptyState from '../../../components/common/EmptyState';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import api from '../../../services/api';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

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

const ProjectListPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
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
        const response = await api.get('/projects/my-projects');
        setProjects(response.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        handleError(error, 'プロジェクト一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isMounted]);

  const filteredProjects = selectedStatus
    ? projects.filter(p => p.status === selectedStatus)
    : projects;

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
    <DashboardLayout title="プロジェクト管理" subtitle="あなたのプロジェクト一覧">
      <div className="space-y-6">
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
      </div>
    </DashboardLayout>
  );
};

export default ProjectListPage;
