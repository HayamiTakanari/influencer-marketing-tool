import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getDashboardData } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import StatsCard from '../../components/common/StatsCard';
import EmptyState from '../../components/common/EmptyState';
import ProfileCompletionCard from '../../components/common/ProfileCompletionCard';
import Card from '../../components/shared/Card';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const InfluencerDashboardPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchDashboard = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);

      // ロール確認：インフルエンサーのみアクセス可能
      if (parsedUser.role !== 'INFLUENCER') {
        router.push('/company/dashboard');
        return;
      }

      setUser(parsedUser);

      try {
        // Fetch dashboard data from backend API
        const data = await getDashboardData();

        // If API returns null, use default data
        if (data) {
          setDashboardData(data);
        } else {
          setDashboardData({
            user: parsedUser,
            stats: {
              newOffers: 0,
              totalProjects: 0,
              activeProjects: 0,
              totalAchievements: 0,
              totalFollowers: 0,
              monthlyRevenue: 0
            },
            recentActivities: [],
            recentProjects: []
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router, isMounted]);

  if (!isMounted || loading) {
    return (
      <DashboardLayout title="ダッシュボード" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (!user || !dashboardData) {
    return (
      <DashboardLayout title="ダッシュボード" subtitle="エラー">
        <EmptyState
          icon="⚠️"
          title="データの読み込みに失敗しました"
          description="ページをリロードしてください"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`ようこそ、${dashboardData?.user?.profile?.displayName || user.email}さん`}
      subtitle="インフルエンサーダッシュボード"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="新着オファー"
            value={dashboardData?.stats?.newOffers || 0}
            badge={{
              label: `+${dashboardData?.stats?.newOffers || 0}`,
              color: 'blue'
            }}
          />

          <StatsCard
            title="プロジェクト"
            value={dashboardData?.stats?.totalProjects || 0}
            badge={{
              label: `進行中: ${dashboardData?.stats?.activeProjects || 0}`,
              color: 'green'
            }}
          />

          <StatsCard
            title="今月の収益"
            value={`¥${dashboardData?.stats?.monthlyRevenue?.toLocaleString() || 0}`}
          />

          <StatsCard
            title="フォロワー総数"
            value={dashboardData?.stats?.totalFollowers?.toLocaleString() || 0}
          />
        </div>

        <ProfileCompletionCard onNavigateToProfile={() => router.push('/influencer/profile')} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">最近のプロジェクト</h3>
              <Link href="/influencer/applications" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                すべて見る →
              </Link>
            </div>
            {dashboardData?.recentProjects && dashboardData.recentProjects.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentProjects.map((project: any) => (
                  <Link key={project.id} href={`/influencer/applications/${project.id}`}>
                    <div className="p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{project.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{project.companyName}</p>
                        </div>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                          project.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
                          project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                          project.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status === 'IN_PROGRESS' ? '進行中' :
                           project.status === 'COMPLETED' ? '完了' :
                           project.status === 'PENDING' ? '募集中' : project.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>予算: ¥{project.budget?.toLocaleString()}</span>
                        {project.endDate && (
                          <span>期限: {new Date(project.endDate).toLocaleDateString('ja-JP')}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📁"
                title="プロジェクトがありません"
                description="新しい案件を探しましょう"
              />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">最近の活動</h3>
            </div>
            {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentActivities.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title || 'プロジェクト'}</p>
                        {activity.companyName && (
                          <p className="text-xs text-gray-600 mt-1">{activity.companyName}</p>
                        )}
                      </div>
                      <span className={`ml-2 text-xs px-2 py-1 rounded whitespace-nowrap ${
                        activity.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
                        activity.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.status === 'IN_PROGRESS' ? '進行中' :
                         activity.status === 'COMPLETED' ? '完了' :
                         activity.status === 'PENDING' ? '募集中' : activity.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {activity.date ? new Date(activity.date).toLocaleDateString('ja-JP') : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📝"
                title="活動履歴がありません"
                description="プロジェクトに参加すると、ここに活動履歴が表示されます"
              />
            )}
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">クイックアクション</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/influencer/opportunities">
              <div className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer">
                <svg className="w-6 h-6 text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h4 className="font-semibold text-gray-900 text-sm">プロジェクトを探す</h4>
                <p className="text-xs text-gray-600 mt-1">新しい案件を見つけましょう</p>
              </div>
            </Link>
            <Link href="/influencer/profile">
              <div className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                <svg className="w-6 h-6 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h4 className="font-semibold text-gray-900 text-sm">プロフィール更新</h4>
                <p className="text-xs text-gray-600 mt-1">情報を最新に保ちましょう</p>
              </div>
            </Link>
            <Link href="/influencer/analytics">
              <div className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer">
                <svg className="w-6 h-6 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <h4 className="font-semibold text-gray-900 text-sm">分析を見る</h4>
                <p className="text-xs text-gray-600 mt-1">パフォーマンスを確認</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InfluencerDashboardPage;
