import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('Admin dashboard API response:', result);

      if (result.success && result.data) {
        const data = result.data;
        console.log('Dashboard recentProjects:', data.recentProjects);
        setStats({
          totalUsers: data.totalUsers || 0,
          totalCompanies: data.totalClients || 0,
          totalInfluencers: data.totalInfluencers || 0,
          activeProjects: (data.totalProjects - data.completedProjects) || 0,
          completedProjects: data.completedProjects || 0,
          totalRevenue: data.totalRevenue || 0,
        });

        // Transform API response to match component interface
        setRecentProjects(
          data.recentProjects?.map((project: any) => ({
            id: project.id,
            title: project.title,
            company: project.client || 'Unknown',
            influencer: project.influencer || 'Not assigned',
            status: project.status?.toLowerCase() || 'pending',
            budget: project.budget || 0,
          })) || []
        );
      } else {
        setError(result.error?.message || 'ダッシュボード データの取得に失敗しました。');
      }

      setLoading(false);
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
      <DashboardLayout title="管理ダッシュボード" subtitle="システム概要">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="管理ダッシュボード" subtitle="システム概要と統計情報">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">最近のプロジェクト</h3>
          </div>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              プロジェクトがまだ登録されていません
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="p-3 border border-gray-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{project.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{project.company}</p>
                    </div>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                        project.status === 'active' || project.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : project.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status === 'active' || project.status === 'in_progress'
                        ? '進行中'
                        : project.status === 'completed'
                        ? '完了'
                        : project.status === 'pending'
                        ? '募集中'
                        : project.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>インフルエンサー: {project.influencer}</span>
                    <span>予算: {formatPrice(project.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
