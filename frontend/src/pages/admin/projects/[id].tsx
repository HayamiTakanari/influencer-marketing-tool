import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
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

    // Simulate fetching project details
    setTimeout(() => {
      setProject({
        id: id as string,
        title: '美容商品キャンペーン',
        description: '人気美容商品のSNS広告キャンペーン。インフルエンサーによるレビューと紹介動画を制作。',
        company: {
          id: '1',
          name: '株式会社サンプル',
          industry: '美容・化粧品',
          contact: '田中太郎 (03-1234-5678)',
        },
        influencer: {
          id: '1',
          name: 'インフルエンサーA',
          category: '美容・コスメ',
          followers: 150000,
        },
        budget: 500000,
        spent: 325000,
        status: '進行中',
        progress: 65,
        startDate: '2024-03-01',
        endDate: '2024-05-31',
        deliverables: [
          {
            id: '1',
            title: 'Instagramフィード投稿（3枚）',
            status: '完了',
            dueDate: '2024-03-20',
          },
          {
            id: '2',
            title: '動画レビュー（15秒）',
            status: '進行中',
            dueDate: '2024-04-10',
          },
          {
            id: '3',
            title: 'ストーリーズ投稿（5日間）',
            status: '予定',
            dueDate: '2024-05-01',
          },
        ],
        timeline: [
          {
            id: '1',
            title: 'プロジェクト開始',
            date: '2024-03-01',
            status: '完了',
          },
          {
            id: '2',
            title: '資料提供',
            date: '2024-03-10',
            status: '完了',
          },
          {
            id: '3',
            title: 'コンテンツ制作',
            date: '2024-03-20',
            status: '進行中',
          },
          {
            id: '4',
            title: 'コンテンツ承認',
            date: '2024-04-15',
            status: '予定',
          },
          {
            id: '5',
            title: 'コンテンツ配信',
            date: '2024-05-01',
            status: '予定',
          },
          {
            id: '6',
            title: 'プロジェクト終了',
            date: '2024-05-31',
            status: '予定',
          },
        ],
      });
      setLoading(false);
    }, 500);
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
      <AdminLayout title="プロジェクト詳細" subtitle="進捗確認と情報管理">
        <LoadingState />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={project.title} subtitle="プロジェクト詳細と進捗確認">
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
                <p className="font-medium text-gray-900">{(project.influencer.followers / 1000).toFixed(0)}K</p>
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
    </AdminLayout>
  );
};

export default AdminProjectDetail;
