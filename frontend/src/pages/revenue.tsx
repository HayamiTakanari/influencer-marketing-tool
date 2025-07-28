import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

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
        router.push('/dashboard');
        return;
      }
      
      fetchRevenueData();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchRevenueData = async () => {
    try {
      // TODO: 実際のAPI実装
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/payments/stats`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to fetch revenue data');
      // }
      
      // const data = await response.json();

      // 仮のデータ
      const mockRevenueData: RevenueData = {
        totalEarnings: 1250000,
        currentMonthEarnings: 180000,
        completedProjects: 8,
        pendingPayments: 0,
        averageProjectValue: 156250
      };

      const mockProjects: Project[] = [
        {
          id: 'proj1',
          title: '新商品コスメのPRキャンペーン',
          amount: 300000,
          status: 'completed',
          completedAt: '2024-01-20T10:30:00Z',
          client: {
            companyName: 'ビューティーコスメ株式会社'
          }
        },
        {
          id: 'proj2',
          title: 'ライフスタイル商品のレビュー',
          amount: 150000,
          status: 'completed',
          completedAt: '2024-01-15T14:20:00Z',
          client: {
            companyName: 'ライフスタイル株式会社'
          }
        },
        {
          id: 'proj3',
          title: 'フィットネスアプリのプロモーション',
          amount: 250000,
          status: 'pending',
          client: {
            companyName: 'フィットネス株式会社'
          }
        }
      ];

      setRevenueData(mockRevenueData);
      setRecentProjects(mockProjects);
    } catch (err: any) {
      console.error('Error fetching revenue data:', err);
      setError('収益データの取得に失敗しました。');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="収益ダッシュボード"
      subtitle="あなたの収益状況と実績"
      userEmail={user?.email}
      onLogout={() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
      }}
    >
        {/* エラーメッセージ */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <div className="text-red-700">
              {error}
            </div>
          </Card>
        )}

        {/* 収益サマリー */}
        {revenueData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatPrice(revenueData.totalEarnings)}
              </div>
              <div className="text-gray-600">総収益</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatPrice(revenueData.currentMonthEarnings)}
              </div>
              <div className="text-gray-600">今月の収益</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {revenueData.completedProjects}
              </div>
              <div className="text-gray-600">完了プロジェクト</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {formatPrice(revenueData.averageProjectValue)}
              </div>
              <div className="text-gray-600">平均単価</div>
            </div>
          </motion.div>
        )}

        {/* 最近のプロジェクト */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">最近のプロジェクト</h2>
          
          {recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">プロジェクトがありません</h3>
              <p className="text-gray-600">プロジェクトが完了すると、ここに表示されます。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
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
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* アクションボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link href="/opportunities">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              新しい機会を探す
            </motion.button>
          </Link>
          
          <Link href="/payments/history">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              詳細な支払い履歴
            </motion.button>
          </Link>
        </motion.div>

        {/* 収益のコツ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-green-50/80 backdrop-blur-xl border border-green-200 rounded-3xl p-8 shadow-xl mt-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 収益を増やすコツ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 font-bold">•</span>
                <p>プロフィールを充実させて、マッチング率を向上させましょう</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-600 font-bold">•</span>
                <p>過去の実績をポートフォリオに追加して信頼性を向上</p>
              </div>
            </div>
            <div className="space-y-3">
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
        </motion.div>
    </PageLayout>
  );
};

export default RevenuePage;