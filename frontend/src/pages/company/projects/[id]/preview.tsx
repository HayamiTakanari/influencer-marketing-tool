import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import Card from '../../../../components/shared/Card';
import Button from '../../../../components/shared/Button';
import LoadingState from '../../../../components/common/LoadingState';
import api from '../../../../services/api';
import { useErrorHandler } from '../../../../hooks/useErrorHandler';

interface ProjectPreview {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  targetPlatforms: string[];
  targetPrefecture: string;
  targetCity?: string;
  targetGender?: string;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetFollowerMin?: number;
  targetFollowerMax?: number;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  status: string;
}

const ProjectPreviewPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<ProjectPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      try {
        const response = await api.get(`/projects/${id}`);
        // Handle both { project: {...} } and direct {...} response formats
        const projectData = response.data.project || response.data;
        setProject(projectData);
      } catch (error) {
        handleError(error, 'プロジェクト情報の取得に失敗しました');
        router.push('/company/projects/list');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, router]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // プロジェクトのステータスを「募集中」に更新
      await api.put(`/projects/${id}`, {
        status: 'PENDING'
      });

      handleSuccess('プロジェクトを公開しました！');

      // AI マッチングページにリダイレクト
      router.push(`/company/projects/${id}/ai-matching`);
    } catch (error) {
      handleError(error, 'プロジェクトの公開に失敗しました');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="プロジェクトプレビュー" subtitle="内容確認と公開">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="プロジェクトプレビュー" subtitle="内容確認と公開">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600">プロジェクト情報が見つかりません</p>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="プロジェクトプレビュー" subtitle="内容確認と公開">
      <div className="space-y-6">
        {/* 公開設定表示 */}
        <Card className={project.isPublic ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}>
          <div className="flex items-center gap-3">
            <div className={`text-2xl ${project.isPublic ? 'text-blue-600' : 'text-amber-600'}`}>
              {project.isPublic ? '🌐' : '🔒'}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${project.isPublic ? 'text-blue-900' : 'text-amber-900'}`}>
                {project.isPublic ? '公開' : '非公開（招待制）'}
              </h3>
              <p className={project.isPublic ? 'text-blue-700' : 'text-amber-700'}>
                {project.isPublic
                  ? '全ての認証済みインフルエンサーがこのプロジェクトを検索・応募できます'
                  : 'スカウトを送ったインフルエンサーのみがこのプロジェクトを閲覧・応募できます'}
              </p>
            </div>
          </div>
        </Card>

        {/* プロジェクト概要 */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{project.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 基本情報 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">基本情報</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">カテゴリー</label>
                  <p className="text-gray-900 font-medium">{project.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">予算</label>
                  <p className="text-gray-900 font-medium text-lg">
                    ¥{project.budget ? project.budget.toLocaleString('ja-JP') : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">対象プラットフォーム</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {project.targetPlatforms.map(platform => (
                      <span
                        key={platform}
                        className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 日程・対象地域 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">日程・対象地域</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">期間</label>
                  <p className="text-gray-900 font-medium">
                    {new Date(project.startDate).toLocaleDateString('ja-JP')} ～{' '}
                    {new Date(project.endDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">対象地域</label>
                  <p className="text-gray-900 font-medium">{project.targetPrefecture || '全国'}</p>
                </div>
                {project.targetCity && (
                  <div>
                    <label className="text-sm text-gray-600">対象市区町村</label>
                    <p className="text-gray-900 font-medium">{project.targetCity}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 説明 */}
          <div className="py-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">プロジェクト説明</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </div>

          {/* ターゲット情報 */}
          {(project.targetGender || project.targetAgeMin || project.targetFollowerMin) && (
            <div className="py-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">ターゲット情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.targetGender && (
                  <div>
                    <label className="text-sm text-gray-600">対象性別</label>
                    <p className="text-gray-900 font-medium">{project.targetGender}</p>
                  </div>
                )}
                {(project.targetAgeMin || project.targetAgeMax) && (
                  <div>
                    <label className="text-sm text-gray-600">対象年齢</label>
                    <p className="text-gray-900 font-medium">
                      {project.targetAgeMin}～{project.targetAgeMax}歳
                    </p>
                  </div>
                )}
                {(project.targetFollowerMin || project.targetFollowerMax) && (
                  <div>
                    <label className="text-sm text-gray-600">対象フォロワー数</label>
                    <p className="text-gray-900 font-medium">
                      {project.targetFollowerMin?.toLocaleString('ja-JP')}～
                      {project.targetFollowerMax?.toLocaleString('ja-JP')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 操作ボタン */}
        <div className="flex gap-4 justify-center pt-6">
          <Link href="/company/projects/list">
            <Button variant="secondary" size="lg">
              キャンセル
            </Button>
          </Link>
          <Button
            variant="primary"
            size="lg"
            onClick={handlePublish}
            loading={publishing}
            disabled={publishing}
          >
            プロジェクトを公開
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectPreviewPage;
