import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import LoadingState from '../../../components/common/LoadingState';
import EmptyState from '../../../components/common/EmptyState';
import api from '../../../services/api';

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetPlatforms: string[];
  targetPrefecture: string;
  targetCity: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  applications: any[];
}

const ProjectDetailPage: React.FC = () => {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (id && typeof id === 'string') {
      fetchProjectDetails(id);
    }
  }, [id, router]);

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data.project || response.data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError('プロジェクトの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      MATCHED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout title="プロジェクト詳細" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout title="エラー" subtitle="プロジェクトが見つかりません">
        <Card className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{error || 'プロジェクトが見つかりませんでした。'}</h3>
          <Link href="/company/projects/list">
            <Button variant="primary">プロジェクト一覧に戻る</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={project.title} subtitle="プロジェクト詳細">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 基本情報 */}
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusBadge(project.status)}`}>
              {project.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">予算</p>
              <p className="text-lg font-semibold text-gray-900">¥{project.budget?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">カテゴリー</p>
              <p className="text-lg font-semibold text-gray-900">{project.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">開始日</p>
              <p className="text-lg font-semibold text-gray-900">{new Date(project.startDate).toLocaleDateString('ja-JP')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">終了日</p>
              <p className="text-lg font-semibold text-gray-900">{new Date(project.endDate).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
        </Card>

        {/* ターゲット情報 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">ターゲット情報</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">都道府県</p>
              <p className="font-semibold text-gray-900">{project.targetPrefecture}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">市区町村</p>
              <p className="font-semibold text-gray-900">{project.targetCity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">性別</p>
              <p className="font-semibold text-gray-900">{project.targetGender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">年齢範囲</p>
              <p className="font-semibold text-gray-900">{project.targetAgeMin}~{project.targetAgeMax}才</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">フォロワー数範囲</p>
              <p className="font-semibold text-gray-900">{project.targetFollowerMin?.toLocaleString()}~{project.targetFollowerMax?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">プラットフォーム</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.targetPlatforms?.map(platform => (
                  <span key={platform} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* アクション */}
        <div className="flex gap-3">
          <Link href="/company/projects/list">
            <Button variant="secondary">一覧に戻る</Button>
          </Link>
          {project.status === 'PENDING' && (
            <Link href={`/company/projects/${project.id}/ai-matching`}>
              <Button variant="primary">AI マッチング</Button>
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
