import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PageLayout from '../../components/shared/PageLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetPlatforms: string[];
  targetPrefecture: string;
  targetCity: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  applications: any[];
}

const ProjectDetailPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      if (id) {
        // Temporary mock data
        setProject({
          id: id as string,
          title: '新商品コスメのPRキャンペーン',
          description: '新発売のファンデーションを使用した投稿をお願いします。',
          category: '美容・化粧品',
          budget: 300000,
          status: 'PENDING',
          targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
          targetPrefecture: '東京都',
          targetCity: '渋谷区、新宿区',
          targetGender: 'FEMALE',
          targetAgeMin: 20,
          targetAgeMax: 35,
          targetFollowerMin: 10000,
          targetFollowerMax: 100000,
          startDate: '2024-02-01',
          endDate: '2024-02-28',
          createdAt: '2024-01-15',
          applications: []
        });
        setLoading(false);
      }
    } else {
      router.push('/login');
    }
  }, [id, router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <PageLayout title="プロジェクト詳細" subtitle="読み込み中...">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout title="エラー" subtitle="プロジェクトの読み込みに失敗しました">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 mb-4">{error || 'プロジェクトが見つかりませんでした。'}</p>
          <Link href="/projects">
            <Button variant="primary" size="lg">
              プロジェクト一覧に戻る
            </Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: '募集中', color: 'bg-yellow-100 text-yellow-800' };
      case 'MATCHED': return { label: 'マッチング済み', color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS': return { label: '進行中', color: 'bg-green-100 text-green-800' };
      case 'COMPLETED': return { label: '完了', color: 'bg-purple-100 text-purple-800' };
      case 'CANCELLED': return { label: 'キャンセル', color: 'bg-red-100 text-red-800' };
      default: return { label: '不明', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <PageLayout
      title="プロジェクト詳細"
      subtitle={project.title}
      userEmail={user?.email}
      onLogout={handleLogout}
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="md">
              ← プロジェクト一覧に戻る
            </Button>
          </Link>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusInfo(project.status).color}`}>
            {getStatusInfo(project.status).label}
          </span>
        </div>
      </div>

      <Card className="mb-8" padding="xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {project.title}
          </h2>
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(project.budget)}
          </div>
        </div>
        
        <p className="text-gray-700 mb-6">{project.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{project.category}</div>
            <div className="text-gray-600 text-sm">カテゴリー</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{formatDate(project.startDate)}</div>
            <div className="text-gray-600 text-sm">プロジェクト開始日</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{formatDate(project.endDate)}</div>
            <div className="text-gray-600 text-sm">プロジェクト終了日</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{project.applications.length}件</div>
            <div className="text-gray-600 text-sm">応募数</div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">ターゲット情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">プラットフォーム</p>
              <p className="font-medium text-gray-900">{project.targetPlatforms.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">地域</p>
              <p className="font-medium text-gray-900">{project.targetPrefecture} {project.targetCity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">性別</p>
              <p className="font-medium text-gray-900">
                {project.targetGender === 'FEMALE' ? '女性' : project.targetGender === 'MALE' ? '男性' : '指定なし'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">年齢</p>
              <p className="font-medium text-gray-900">{project.targetAgeMin}歳 - {project.targetAgeMax}歳</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">フォロワー数</p>
              <p className="font-medium text-gray-900">
                {project.targetFollowerMin.toLocaleString()} - {project.targetFollowerMax.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
};

export async function getServerSideProps(context: { params: { id: string } }) {
  const { id } = context.params;
  
  return {
    props: {
      projectId: id,
    },
  };
}

export default ProjectDetailPage;