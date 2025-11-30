import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface Application {
  id: string;
  projectId: string;
  project: {
    id: string;
    title: string;
    category: string;
    budget: number;
    status: string;
    endDate: string;
    client: {
      companyName: string;
    };
  };
  message: string;
  proposedPrice: number;
  isAccepted: boolean;
  appliedAt: string;
}

const ApplicationsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'accepted'>('all');
  const router = useRouter();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchApplications = async () => {
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

      setUser(parsedUser);

      try {
        const response = await api.get('/projects/my-applications');
        setApplications(response.data || []);
      } catch (error) {
        handleError(error, '応募一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [isMounted, router]);

  const filteredApplications = applications.filter(app => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'pending') return !app.isAccepted;
    if (selectedStatus === 'accepted') return app.isAccepted;
    return true;
  });

  if (!isMounted || loading) {
    return (
      <DashboardLayout title="応募管理" subtitle="あなたの応募一覧">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="応募管理" subtitle="あなたの応募一覧">
      <div className="space-y-6">
        {/* ステータスフィルター */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">ステータスで絞り込み</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて ({applications.length})
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              待機中 ({applications.filter(a => !a.isAccepted).length})
            </button>
            <button
              onClick={() => setSelectedStatus('accepted')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === 'accepted'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              承認 ({applications.filter(a => a.isAccepted).length})
            </button>
          </div>
        </Card>

        {/* 応募一覧 */}
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <Card key={app.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{app.project.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        app.isAccepted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {app.isAccepted ? '承認済み' : '待機中'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{app.project.category}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500 text-xs">企業</p>
                        <p className="font-semibold text-gray-900">{app.project.client.companyName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">予算</p>
                        <p className="font-semibold text-gray-900">¥{app.project.budget?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">提案価格</p>
                        <p className="font-semibold text-gray-900">
                          {app.proposedPrice ? `¥${app.proposedPrice.toLocaleString()}` : '提案なし'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">期限</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(app.project.endDate).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>

                    {app.message && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700">
                        <p className="font-medium text-gray-900 mb-1">あなたのメッセージ:</p>
                        <p className="line-clamp-2">{app.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Link href={`/influencer/applications/${app.id}`}>
                      <Button>詳細</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📋"
            title={selectedStatus !== 'all' ? `${selectedStatus}の応募はありません` : '応募がありません'}
            description="新しい案件に応募してみましょう"
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsPage;
