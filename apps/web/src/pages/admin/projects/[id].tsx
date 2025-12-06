import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingState from '../../../components/common/LoadingState';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  company: {
    id: string;
    name: string;
    industry: string;
    contact: string;
  };
  influencer: {
    id: string;
    name: string;
    category: string;
    followers: number;
  };
  budget: number;
  spent: number;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  deliverables: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string;
  }>;
  timeline: Array<{
    id: string;
    title: string;
    date: string;
    status: string;
  }>;
}

const AdminProjectDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectDetail | null>(null);

  const fetchProjectDetail = async (projectId: string, token: string) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiBaseUrl}/admin/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }

      const data = await response.json();
      const projectData = data.success ? data.data : data;
      setProject(projectData || null);
    } catch (error) {
      console.error('Error fetching project details:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

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

    if (!id) return;

    fetchProjectDetail(id as string, token);
  }, [id, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '完了':
        return 'bg-green-100 text-green-800';
      case '進行中':
        return 'bg-blue-100 text-blue-800';
      case '予定':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !project) {
    return (
      <DashboardLayout title="プロジェクト詳細" subtitle="進捗確認と情報管理">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={project.title} subtitle="プロジェクト詳細と進捗確認">
      <div className="space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">進捗</p>
              <p className="text-3xl font-bold text-emerald-600">{project.progress}%</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">予算</p>
              <p className="text-lg font-bold text-gray-900">{formatPrice(project.budget)}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">使用済み</p>
              <p className="text-lg font-bold text-gray-900">{formatPrice(project.spent)}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">残額</p>
              <p className="text-lg font-bold text-gray-900">{formatPrice(project.budget - project.spent)}</p>
            </div>
          </Card>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Info */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">企業情報</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase mb-1">企業名</p>
                <p className="font-medium text-gray-900">{project.company.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase mb-1">業界</p>
                <p className="font-medium text-gray-900">{project.company.industry}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase mb-1">担当者</p>
                <p className="font-medium text-gray-900">{project.company.contact}</p>
              </div>
            </div>
          </Card>

          {/* Influencer Info */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">インフルエンサー情報</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase mb-1">名前</p>
                <p className="font-medium text-gray-900">{project.influencer.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase mb-1">カテゴリー</p>
                <p className="font-medium text-gray-900">{project.influencer.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase mb-1">フォロワー数</p>
                <p className="font-medium text-gray-900">{(project.influencer.followers ? project.influencer.followers / 1000 : 0).toFixed(0)}K</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Deliverables */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">成果物</h3>
          <div className="space-y-3">
            {project.deliverables.map((deliverable) => (
              <div key={deliverable.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{deliverable.title}</p>
                  <p className="text-xs text-gray-600">期限: {deliverable.dueDate}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deliverable.status)}`}>
                  {deliverable.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Timeline */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">タイムライン</h3>
          <div className="space-y-4">
            {project.timeline.map((item, index) => (
              <div key={item.id} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-4 h-4 rounded-full ${
                    item.status === '完了' ? 'bg-green-600' : 'bg-gray-300'
                  }`}></div>
                  {index < project.timeline.length - 1 && (
                    <div className="w-1 h-12 bg-gray-300 my-2"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-600">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex space-x-4">
          <Button>編集</Button>
          <Button variant="secondary">進捗更新</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProjectDetail;
