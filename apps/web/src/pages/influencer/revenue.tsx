import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingState from '../../components/common/LoadingState';
import StatsCard from '../../components/common/StatsCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

interface RevenueData {
  totalEarnings: number;
  currentMonthEarnings: number;
  completedProjects: number;
  pendingPayments: number;
  averageProjectValue: number;
}

interface Project {
  id: string;
  title: string;
  amount: number;
  status: 'completed' | 'pending' | 'in_progress';
  completedAt?: string;
  client: {
    companyName: string;
  };
}

const RevenuePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // インフルエンサーのみアクセス可能
      if (parsedUser.role !== 'INFLUENCER') {
        router.push('/influencer/dashboard');
        return;
      }
      
      fetchRevenueData();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchRevenueData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/payments/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle 403 Forbidden (role mismatch) gracefully - suppress error
      if (response.status === 403) {
        setRevenueData({
          totalEarnings: 0,
          currentMonthEarnings: 0,
          completedProjects: 0,
          pendingPayments: 0,
          averageProjectValue: 0,
        });
        setRecentProjects([]);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }

      const data = await response.json();

      setRevenueData({
        totalEarnings: data.totalEarnings,
        currentMonthEarnings: data.currentMonthEarnings,
        completedProjects: data.completedProjects,
        pendingPayments: data.pendingPayments,
        averageProjectValue: data.averageProjectValue,
      });
      setRecentProjects(data.recentProjects || []);
      setError('');
    } catch (err: any) {
      // Silently handle errors - do not log 403 errors
      // setError is not set to avoid showing error message for 403
    } finally {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: '完了', color: 'bg-green-100 text-green-800', icon: '✅' };
      case 'pending':
        return { label: '支払い待ち', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
      case 'in_progress':
        return { label: '進行中', color: 'bg-blue-100 text-blue-800', icon: '🔄' };
      default:
        return { label: '不明', color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="収益ダッシュボード" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="収益ダッシュボード"
      subtitle="あなたの収益状況と実績"
    >
        {error && (
          <div className="mb-4">
            <ErrorState message={error} onRetry={fetchRevenueData} />
          </div>
        )}

        {revenueData && (
          <div



            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
          >
            <StatsCard
              title="総収益"
              value={formatPrice(revenueData.totalEarnings)}
            />
            
            <StatsCard
              title="今月の収益"
              value={formatPrice(revenueData.currentMonthEarnings)}
            />
            
            <StatsCard
              title="完了プロジェクト"
              value={revenueData.completedProjects}
            />
            
            <StatsCard
              title="平均単価"
              value={formatPrice(revenueData.averageProjectValue)}
            />
          </div>
        )}

        {/* 最近のプロジェクト */}
        <div



          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-4"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近のプロジェクト</h2>
          
          {recentProjects.length === 0 ? (
            <EmptyState
              icon="📊"
              title="プロジェクトがありません"
              description="プロジェクトが完了すると、ここに表示されます。"
            />
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div
                  key={project.id}



                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-bold text-gray-900">{project.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(project.status).color}`}>
                        {getStatusInfo(project.status).icon} {getStatusInfo(project.status).label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>🏢 {project.client.companyName}</span>
                      {project.completedAt && (
                        <span>📅 {formatDate(project.completedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {formatPrice(project.amount)}
                    </div>
                    <div className="text-sm text-gray-500">収益</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div



          className="flex flex-wrap gap-4 justify-center"
        >
          <Link href="/opportunities">
            <button


              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              新しい機会を探す
            </button>
          </Link>
          
          <Link href="/payments/history">
            <button


              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              詳細な支払い履歴
            </button>
          </Link>
        </div>

        {/* 収益のコツ */}
        <div



          className="bg-green-50/80 backdrop-blur-xl border border-green-200 rounded-3xl p-6 shadow-xl mt-4"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 収益を増やすコツ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 font-bold">•</span>
                <p>プロフィールを充実させて、マッチング率を向上させましょう</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-600 font-bold">•</span>
                <p>過去の実績をポートフォリオに追加して信頼性を向上</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 font-bold">•</span>
                <p>迅速なコミュニケーションで企業との関係を良好に保つ</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-600 font-bold">•</span>
                <p>複数のプラットフォームで活動してより多くの機会を獲得</p>
              </div>
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default RevenuePage;