import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import Card from '../../components/shared/Card';
import StatsCard from '../../components/common/StatsCard';
import { supabase } from '../../lib/supabase';

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

      // Fetch total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true });

      // Fetch total companies
      const { count: totalCompanies, error: companiesError } = await supabase
        .from('Company')
        .select('*', { count: 'exact', head: true });

      // Fetch total influencers
      const { count: totalInfluencers, error: influencersError } = await supabase
        .from('Influencer')
        .select('*', { count: 'exact', head: true });

      // Fetch projects by status
      const { data: projects, error: projectsError } = await supabase
        .from('Project')
        .select('id, title, budget, status, clientId, matchedInfluencerId, createdAt')
        .order('createdAt', { ascending: false })
        .limit(10);

      // Count active and completed projects
      const activeProjects = projects?.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'COMPLETED').length || 0;

      // Calculate total revenue from transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('Transaction')
        .select('amount');

      const totalRevenue = transactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      // Fetch influencer names for recent projects
      const projectsWithDetails = await Promise.all(
        (projects || []).slice(0, 5).map(async (project) => {
          let company = 'Unknown';
          let influencer = 'Not assigned';

          if (project.clientId) {
            const { data: clientData } = await supabase
              .from('Client')
              .select('companyName')
              .eq('id', project.clientId)
              .single();
            company = clientData?.companyName || 'Unknown';
          }

          if (project.matchedInfluencerId) {
            const { data: influencerData } = await supabase
              .from('Influencer')
              .select('displayName')
              .eq('id', project.matchedInfluencerId)
              .single();
            influencer = influencerData?.displayName || 'Not assigned';
          }

          return {
            id: project.id,
            title: project.title,
            company,
            influencer,
            status: project.status?.toLowerCase() || 'pending',
            budget: project.budget || 0,
          };
        })
      );

      setStats({
        totalUsers: totalUsers || 0,
        totalCompanies: totalCompanies || 0,
        totalInfluencers: totalInfluencers || 0,
        activeProjects,
        completedProjects,
        totalRevenue,
      });

      setRecentProjects(projectsWithDetails);
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
