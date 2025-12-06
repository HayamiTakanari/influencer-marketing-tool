import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingState from '../../../components/common/LoadingState';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import api from '../../../services/api';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

interface Application {
  id: string;
  projectId: string;
  influencerId: string;
  message: string;
  proposedPrice: number;
  isAccepted: boolean;
  appliedAt: string;
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    status: string;
    targetPlatforms: string[];
    targetPrefecture: string;
    targetAgeMin?: number;
    targetAgeMax?: number;
    targetFollowerMin?: number;
    targetFollowerMax?: number;
    startDate: string;
    endDate: string;
    client: {
      companyName: string;
      user: {
        email: string;
      };
    };
  };
}

const ApplicationDetailPage: React.FC = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const { handleError } = useErrorHandler();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchApplication = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);

      if (parsedUser.role !== 'INFLUENCER') {
        router.push('/company/dashboard');
        return;
      }

      if (!id) {
        return;
      }

      try {
        // Get all applications and find the one with matching ID
        const response = await api.get('/projects/my-applications');
        const applications = response.data || [];
        const found = applications.find((app: Application) => app.id === id);

        if (!found) {
          router.push('/influencer/applications');
          return;
        }

        setApplication(found);
      } catch (error) {
        handleError(error, '応募詳細の取得に失敗しました');
        router.push('/influencer/applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [isMounted, id, router]);

  if (!isMounted || loading) {
    return (
      <DashboardLayout title="応募詳細" subtitle="応募の詳細情報">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout title="応募詳細" subtitle="応募の詳細情報">
        <Card>
          <p className="text-gray-600">応募が見つかりません</p>
          <Link href="/influencer/applications">
            <Button className="mt-4">応募管理に戻る</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="応募詳細" subtitle="応募の詳細情報">
      <div className="space-y-6">
        {/* ステータス */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{application.project.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{application.project.category}</p>
            </div>
            <span className={`px-4 py-2 text-sm font-medium rounded ${
              application.isAccepted
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {application.isAccepted ? '承認済み' : '待機中'}
            </span>
          </div>
        </Card>

        {/* プロジェクト情報 */}
        <Card>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">案件情報</h4>
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">説明</p>
              <p className="text-sm text-gray-700">{application.project.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">予算</p>
                <p className="font-semibold text-gray-900">¥{application.project.budget?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">企業</p>
                <p className="font-semibold text-gray-900">{application.project.client?.companyName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">対象プラットフォーム</p>
                <p className="font-semibold text-gray-900">{application.project.targetPlatforms?.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">期限</p>
                <p className="font-semibold text-gray-900">
                  {new Date(application.project.endDate).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>

            {/* ターゲット情報 */}
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
              <p className="mb-1">
                <span className="font-medium">対象地域:</span> {application.project.targetPrefecture || '全国'}
              </p>
              {application.project.targetAgeMin && application.project.targetAgeMax && (
                <p className="mb-1">
                  <span className="font-medium">年齢:</span> {application.project.targetAgeMin}～{application.project.targetAgeMax}歳
                </p>
              )}
              {application.project.targetFollowerMin && (
                <p>
                  <span className="font-medium">フォロワー数:</span> {application.project.targetFollowerMin?.toLocaleString()}～
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 応募情報 */}
        <Card>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">応募情報</h4>
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">応募日時</p>
              <p className="text-sm text-gray-700">{new Date(application.appliedAt).toLocaleString('ja-JP')}</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs mb-1">提案価格</p>
              <p className="font-semibold text-gray-900">
                {application.proposedPrice ? `¥${application.proposedPrice.toLocaleString()}` : '提案なし'}
              </p>
            </div>

            {application.message && (
              <div>
                <p className="text-gray-500 text-xs mb-1">メッセージ</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.message}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 企業連絡先 */}
        <Card>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">企業情報</h4>
          <div className="space-y-2">
            <div>
              <p className="text-gray-500 text-xs mb-1">企業名</p>
              <p className="text-sm text-gray-700">{application.project.client?.companyName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">メールアドレス</p>
              <p className="text-sm text-gray-700">{application.project.client?.user?.email}</p>
            </div>
          </div>
        </Card>

        {/* アクション */}
        <div className="flex gap-4">
          <Link href="/influencer/applications">
            <Button variant="secondary">応募管理に戻る</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetailPage;
