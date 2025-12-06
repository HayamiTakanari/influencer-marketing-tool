import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import StatsCard from '../../components/common/StatsCard';
import EmptyState from '../../components/common/EmptyState';
import Card from '../../components/shared/Card';
import ErrorState from '../../components/common/ErrorState';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface AnalyticsData {
  applicationCount: number;
  acceptedApplications: number;
  completedProjects: number;
  totalEarnings: number;
  averageRating: number;
  applicationSuccessRate: number;
  socialAccountsStats: {
    platform: string;
    followerCount: number;
    engagementRate: number;
  }[];
}

const AnalyticsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'week' | 'month' | '3months' | '6months' | 'year'>('month');
  const router = useRouter();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    if (parsedUser.role === 'INFLUENCER') {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [router, period]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/analytics/overview?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      
      const mappedData: AnalyticsData = {
        applicationCount: data.stats.applications.total,
        acceptedApplications: data.stats.applications.accepted,
        completedProjects: data.stats.projects.completed,
        totalEarnings: data.stats.earnings.total,
        averageRating: data.stats.rating.average,
        applicationSuccessRate: data.stats.applications.acceptanceRate,
        socialAccountsStats: data.stats.socialAccounts || []
      };
      
      setAnalytics(mappedData);
      setError('');
    } catch (err: any) {
      handleError(err, '分析データの取得');
      setError('アナリティクスデータの取得に失敗しました。');
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

  if (loading) {
    return (
      <DashboardLayout title="分析・統計" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="分析・統計"
      subtitle="あなたのパフォーマンスを可視化"
    >
      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={fetchAnalytics} />
        </div>
      )}

      {/* 期間選択 */}
      <div className="mb-4">
        <Card>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">期間:</span>
            {[
              { value: 'week', label: '今週' },
              { value: 'month', label: '今月' },
              { value: '3months', label: '3ヶ月' },
              { value: '6months', label: '6ヶ月' },
              { value: 'year', label: '1年' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  period === option.value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {user?.role !== 'INFLUENCER' ? (
        <Card>
          <EmptyState
            icon="📈"
            title="アナリティクスはインフルエンサー専用です"
            description="このページはインフルエンサーのパフォーマンスを表示します。"
          />
        </Card>
      ) : analytics ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              title="応募数"
              value={analytics.applicationCount}
            />
            
            <StatsCard
              title="承認率"
              value={`${Math.round(analytics.applicationSuccessRate)}%`}
            />
            
            <StatsCard
              title="完了プロジェクト"
              value={analytics.completedProjects}
            />
            
            <StatsCard
              title="平均評価"
              value={analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : '-'}
              badge={{ label: analytics.averageRating > 0 ? '5点満点' : '評価なし', color: 'gray' }}
            />
            
            <StatsCard
              title="総収益"
              value={formatPrice(analytics.totalEarnings)}
            />
            
            <StatsCard
              title="承認数"
              value={analytics.acceptedApplications}
            />
          </div>

          {/* SNS統計 */}
          {analytics.socialAccountsStats && analytics.socialAccountsStats.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SNSアカウント統計</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.socialAccountsStats.map((account, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">{account.platform}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">フォロワー:</span>
                        <span className="font-medium">{account.followerCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">エンゲージメント率:</span>
                        <span className="font-medium">{account.engagementRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="📈"
            title="データがまだありません"
            description="プロジェクトデータが蓄積されると、統計が表示されます。"
          />
        </Card>
      )}
    </DashboardLayout>
  );
};

export default AnalyticsPage;
