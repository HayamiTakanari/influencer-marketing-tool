import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingState from '../../components/common/LoadingState';
import Card from '../../components/shared/Card';
import StatsCard from '../../components/common/StatsCard';

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalInfluencers: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
}

interface RecentProject {
  id: string;
  title: string;
  company: string;
  influencer: string;
  status: string;
  budget: number;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Use mock data for now
      setTimeout(() => {
        setStats({
          totalUsers: 156,
          totalCompanies: 32,
          totalInfluencers: 124,
          activeProjects: 18,
          completedProjects: 45,
          totalRevenue: 28500000,
        });

        setRecentProjects([
          {
            id: '1',
            title: '美容商品キャンペーン',
            company: '株式会社サンプル',
            influencer: 'インフルエンサーA',
            status: 'active',
            budget: 500000,
          },
          {
            id: '2',
            title: 'ファッションPR',
            company: 'ファッション企業B',
            influencer: 'インフルエンサーB',
            status: 'completed',
            budget: 750000,
          },
          {
            id: '3',
            title: '食品紹介キャンペーン',
            company: '食品会社C',
            influencer: 'インフルエンサーC',
            status: 'active',
            budget: 600000,
          },
        ]);

        setLoading(false);
      }, 500);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('ダッシュボード データの取得に失敗しました。');
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <AdminLayout title="管理ダッシュボード" subtitle="システム概要">
        <LoadingState />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="管理ダッシュボード" subtitle="システム概要と統計情報">
      <div className="space-y-6">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="総ユーザー数" value={stats.totalUsers.toString()} />
            <StatsCard title="企業数" value={stats.totalCompanies.toString()} />
            <StatsCard title="インフルエンサー数" value={stats.totalInfluencers.toString()} />
            <StatsCard title="進行中プロジェクト" value={stats.activeProjects.toString()} />
          </div>
        )}

        {/* Second Row of Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="完了プロジェクト" value={stats.completedProjects.toString()} />
            <StatsCard title="総取引額" value={formatPrice(stats.totalRevenue)} />
            <StatsCard
              title="成功率"
              value={
                stats.activeProjects + stats.completedProjects > 0
                  ? `${Math.round(
                      (stats.completedProjects / (stats.activeProjects + stats.completedProjects)) * 100
                    )}%`
                  : 'N/A'
              }
            />
          </div>
        )}

        {/* Recent Projects */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近のプロジェクト</h2>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              プロジェクトがまだ登録されていません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">プロジェクト</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">企業</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">インフルエンサー</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">ステータス</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-700">予算</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((project) => (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{project.title}</td>
                      <td className="px-4 py-3 text-gray-600">{project.company}</td>
                      <td className="px-4 py-3 text-gray-600">{project.influencer}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            project.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : project.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.status === 'active' ? '進行中' : project.status === 'completed' ? '完了' : project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatPrice(project.budget)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
