import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

interface Project {
  id: string;
  title: string;
  company: string;
  influencer: string;
  budget: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
}

const AdminProjects: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/projects`, {
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

      console.log('Admin projects API response:', result);

      // Handle both response formats
      const projectsData = result.success ? (result.data || []) : (result.projects || []);
      console.log('Data length:', projectsData.length);

      if (projectsData && projectsData.length >= 0) {
        console.log('Processing projects, count:', projectsData.length);
        const transformedProjects = projectsData.map((project: any) => {
          // Map database status to frontend status
          const statusMap: Record<string, 'planning' | 'active' | 'completed' | 'cancelled'> = {
            'PENDING': 'planning',
            'MATCHED': 'active',
            'IN_PROGRESS': 'active',
            'COMPLETED': 'completed',
            'CANCELLED': 'cancelled',
          };

          return {
            id: project.id,
            title: project.title,
            company: project.client || 'Unknown',
            influencer: project.influencer || 'Not assigned',
            budget: project.budget || 0,
            status: statusMap[project.status] || 'planning',
            progress:
              project.status === 'COMPLETED' ? 100 :
              project.status === 'IN_PROGRESS' || project.status === 'MATCHED' ? 60 :
              10,
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '未定',
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '未定',
          };
        });
        setProjects(transformedProjects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.influencer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return '計画中';
      case 'active':
        return '進行中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return '不明';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="プロジェクト管理" subtitle="全プロジェクトの管理と進捗確認">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="プロジェクト管理" subtitle={`全プロジェクト (${filteredProjects.length})`}>
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="プロジェクト名、企業、インフルエンサーで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">すべてのステータス</option>
            <option value="planning">計画中</option>
            <option value="active">進行中</option>
            <option value="completed">完了</option>
            <option value="cancelled">キャンセル</option>
          </select>
        </div>

        {/* Projects Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">プロジェクト</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">企業</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">インフルエンサー</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-700">予算</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">進捗</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">ステータス</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">期間</th>
                  <th className="text-center px-4 py-2 font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{project.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{project.company}</td>
                    <td className="px-4 py-3 text-gray-600">{project.influencer}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatPrice(project.budget)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {project.startDate} ~ {project.endDate}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <Link href={`/admin/projects/${project.id}`}>
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">詳細</button>
                      </Link>
                      <button className="text-orange-600 hover:text-orange-800 text-xs font-medium">編集</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminProjects;
