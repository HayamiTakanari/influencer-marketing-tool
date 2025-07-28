import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

// Chart.jsを動的インポートしてSSRエラーを回避
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">グラフを読み込み中...</div>
});

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">グラフを読み込み中...</div>
});

const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">グラフを読み込み中...</div>
});

interface AnalyticsData {
  period: string;
  startDate: string;
  endDate: string;
  stats: any;
}

interface PerformanceData {
  socialMetrics: any;
  projectMetrics: any;
  earnings: any[];
}

interface ComparisonData {
  yourStats: any;
  industryAverages: any;
  comparison: any;
  sampleSize: number;
}

const AnalyticsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedProject, setSelectedProject] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    // Chart.jsの動的登録を最小限に
    const registerChartJS = async () => {
      if (typeof window !== 'undefined') {
        try {
          await import('chart.js/auto');
        } catch (err) {
          console.error('Error loading Chart.js:', err);
        }
      }
    };

    registerChartJS();

    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchAnalyticsData();
      if (parsedUser.role === 'INFLUENCER') {
        fetchPerformanceData();
        fetchComparisonData();
      } else {
        fetchProjects();
      }
    } else {
      router.push('/login');
    }
  }, [router, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setError(''); // エラーをクリア
      const { getOverviewStats } = await import('../services/api');
      const data = await getOverviewStats(selectedPeriod);
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      // フォールバック用の基本データ
      const fallbackData = {
        period: selectedPeriod,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        stats: {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalBudget: 0,
          totalSpent: 0,
          averageProjectValue: 0,
          totalInfluencers: 0,
          totalReach: 0,
          totalEngagements: 0,
          averageEngagementRate: 0,
          monthlyTrends: [],
          platformBreakdown: [],
          topPerformingCategories: []
        }
      };
      setAnalyticsData(fallbackData);
      setError('データを読み込み中です...');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const { getPerformanceMetrics } = await import('../services/api');
      const data = await getPerformanceMetrics(selectedPeriod);
      setPerformanceData(data);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
    }
  };

  const fetchComparisonData = async () => {
    try {
      const { getComparisonData } = await import('../services/api');
      const data = await getComparisonData(selectedPeriod);
      setComparisonData(data);
    } catch (err: any) {
      console.error('Error fetching comparison data:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const { getProjects } = await import('../services/api');
      const result = await getProjects();
      setProjects(result?.projects || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
    });
  };

  const getPeriodText = (period: string) => {
    const texts = {
      week: '今週',
      month: '今月',
      '3months': '過去3ヶ月',
      '6months': '過去6ヶ月',
      year: '過去1年',
    };
    return texts[period as keyof typeof texts] || period;
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

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    const { stats } = analyticsData;

    if (user.role === 'INFLUENCER') {
      // For influencer view, use simplified data from the company mock structure
      // This is a temporary solution until proper influencer analytics are implemented
      const monthlyEarnings = stats.monthlyTrends || [];
      
      // Earnings chart data
      const earningsChartData = {
        labels: monthlyEarnings.map((item: any) => item.month),
        datasets: [
          {
            label: '収益',
            data: monthlyEarnings.map((item: any) => item.budget || 0),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          },
        ],
      };

      // Projects by category chart
      const categoryData = stats.topPerformingCategories || [];
      const categoryChartData = {
        labels: categoryData.map((item: any) => item.category),
        datasets: [
          {
            data: categoryData.map((item: any) => item.projects),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
          },
        ],
      };

      return (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hover={false} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">応募数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInfluencers || 0}</p>
                  <p className="text-green-600 text-sm">承認率 85%</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  📝
                </div>
              </div>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">完了プロジェクト</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedProjects || 0}</p>
                  <p className="text-blue-600 text-sm">承認済み {stats.activeProjects || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  ✅
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">総収益</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent || 0)}</p>
                  <p className="text-purple-600 text-sm">{getPeriodText(selectedPeriod)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  💰
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">平均評価</p>
                  <p className="text-2xl font-bold text-gray-900">4.7</p>
                  <p className="text-yellow-600 text-sm">⭐ 評価スコア</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  ⭐
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">収益推移</h3>
              {monthlyEarnings.length > 0 ? (
                <Line
                  data={earningsChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatCurrency(value as number);
                          },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  データがありません
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">カテゴリ別プロジェクト</h3>
              {categoryData.length > 0 ? (
                <Doughnut
                  data={categoryChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  データがありません
                </div>
              )}
            </motion.div>
          </div>

          {/* Social Accounts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">ソーシャルメディア</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.platformBreakdown && stats.platformBreakdown.map((platform: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{platform.platform}</span>
                    <span className="text-sm text-gray-500">
                      {platform.platform === 'Instagram' && '📷'}
                      {platform.platform === 'Twitter' && '🐦'}
                      {platform.platform === 'YouTube' && '📺'}
                      {platform.platform === 'TikTok' && '🎵'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    リーチ: {formatNumber(platform.reach || 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    エンゲージメント: {formatNumber(platform.engagement || 0)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      );
    } else {
      // Client/Company view - using the actual mock data structure from api.ts
      return (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">総プロジェクト数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects || 0}</p>
                  <p className="text-blue-600 text-sm">アクティブ: {stats.activeProjects || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  📂
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">完了プロジェクト</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedProjects || 0}</p>
                  <p className="text-green-600 text-sm">成功率 {stats.totalProjects > 0 ? Math.round(((stats.completedProjects || 0) / stats.totalProjects) * 100) : 0}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  ✅
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">総支出</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent || 0)}</p>
                  <p className="text-purple-600 text-sm">総予算: {formatCurrency(stats.totalBudget || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  💸
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">総リーチ</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalReach || 0)}</p>
                  <p className="text-indigo-600 text-sm">エンゲージメント: {formatNumber(stats.totalEngagements || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  📊
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts for Company view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            {stats.monthlyTrends && stats.monthlyTrends.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">月次トレンド</h3>
                <Line
                  data={{
                    labels: stats.monthlyTrends.map((item: any) => item.month),
                    datasets: [
                      {
                        label: 'プロジェクト数',
                        data: stats.monthlyTrends.map((item: any) => item.projects),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </motion.div>
            )}

            {/* Platform Breakdown */}
            {stats.platformBreakdown && stats.platformBreakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">プラットフォーム別</h3>
                <Doughnut
                  data={{
                    labels: stats.platformBreakdown.map((item: any) => item.platform),
                    datasets: [
                      {
                        data: stats.platformBreakdown.map((item: any) => item.projects),
                        backgroundColor: [
                          '#FF6384',
                          '#36A2EB',
                          '#FFCE56',
                          '#4BC0C0',
                          '#9966FF',
                          '#FF9F40',
                        ],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </motion.div>
            )}
          </div>

          {/* Top Performing Categories */}
          {stats.topPerformingCategories && stats.topPerformingCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">トップパフォーマンスカテゴリ</h3>
              <div className="space-y-4">
                {stats.topPerformingCategories.map((category: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div>
                      <h4 className="font-medium text-gray-900">{category.category}</h4>
                      <p className="text-sm text-gray-600">プロジェクト数: {category.projects}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">リーチ: {formatNumber(category.reach)}</p>
                      <p className="text-sm text-gray-600">エンゲージメント: {formatNumber(category.engagement)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      );
    }
  };

  const renderPerformanceTab = () => {
    if (!performanceData || user.role !== 'INFLUENCER') return null;

    const { socialMetrics, projectMetrics, earnings } = performanceData;

    // Earnings chart data
    const earningsChartData = {
      labels: earnings.map((item: any) => formatDate(item.month)),
      datasets: [
        {
          label: '収益',
          data: earnings.map((item: any) => item.amount),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">ソーシャルメトリクス</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">総フォロワー数</p>
                <p className="text-xl font-bold text-blue-600">{formatNumber(socialMetrics.totalFollowers)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">平均エンゲージメント率</p>
                <p className="text-xl font-bold text-green-600">{socialMetrics.avgEngagementRate}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">プロジェクトメトリクス</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">総プロジェクト数</p>
                <p className="text-xl font-bold text-purple-600">{projectMetrics.totalProjects}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">プロジェクト評価</p>
                <p className="text-xl font-bold text-green-600">{projectMetrics.avgProjectRating}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">収益データ</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">過去6ヶ月の収益</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(earnings.reduce((sum: number, item: any) => sum + item.amount, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">総収益</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(projectMetrics.totalEarnings)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">月別収益</h3>
            {earnings.length > 0 ? (
              <Bar
                data={earningsChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value as number);
                        },
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                データがありません
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">プラットフォーム別パフォーマンス</h3>
            <div className="space-y-4">
              {(socialMetrics.topPosts || []).map((platform: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{platform.platform}</span>
                    <span className="text-2xl">
                      {platform.platform === 'INSTAGRAM' && '📷'}
                      {platform.platform === 'TWITTER' && '🐦'}
                      {platform.platform === 'YOUTUBE' && '📺'}
                      {platform.platform === 'TIKTOK' && '🎵'}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">いいね</p>
                      <p className="font-semibold">{formatNumber(platform.likes)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">コメント</p>
                      <p className="font-semibold">{platform.comments}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  const renderComparisonTab = () => {
    if (!comparisonData || user.role !== 'INFLUENCER') return null;

    const { yourStats, industryAverages, comparison, sampleSize } = comparisonData;

    const getPercentileColor = (percentile: number) => {
      if (percentile >= 75) return 'text-green-600';
      if (percentile >= 50) return 'text-yellow-600';
      if (percentile >= 25) return 'text-orange-600';
      return 'text-red-600';
    };

    const getPercentileText = (percentile: number) => {
      if (percentile >= 90) return '優秀';
      if (percentile >= 75) return '良好';
      if (percentile >= 50) return '平均的';
      if (percentile >= 25) return '改善の余地あり';
      return '要改善';
    };

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            業界比較 <span className="text-sm font-normal text-gray-600">(サンプル数: {sampleSize})</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Followers Comparison */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">フォロワー数</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">あなた</p>
                  <p className="text-xl font-bold text-blue-600">{formatNumber(yourStats.avgEngagementRate * 1000)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">業界平均</p>
                  <p className="text-lg text-gray-900">{formatNumber(industryAverages.avgEngagementRate * 800)}</p>
                </div>
                <div className={`font-semibold ${getPercentileColor(comparison.engagementPerformance)}`}>
                  {comparison.engagementPerformance}パーセンタイル
                  <br />
                  <span className="text-sm">({getPercentileText(comparison.engagementPerformance)})</span>
                </div>
              </div>
            </div>

            {/* Engagement Comparison */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">エンゲージメント率</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">あなた</p>
                  <p className="text-xl font-bold text-green-600">{yourStats.avgEngagementRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">業界平均</p>
                  <p className="text-lg text-gray-900">{industryAverages.avgEngagementRate}%</p>
                </div>
                <div className={`font-semibold ${getPercentileColor(comparison.engagementPerformance)}`}>
                  {comparison.engagementPerformance}パーセンタイル
                  <br />
                  <span className="text-sm">({getPercentileText(comparison.engagementPerformance)})</span>
                </div>
              </div>
            </div>

            {/* Earnings Comparison */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">プロジェクト単価</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">あなた</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(yourStats.avgProjectValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">業界平均</p>
                  <p className="text-lg text-gray-900">{formatCurrency(industryAverages.avgProjectValue)}</p>
                </div>
                <div className={`font-semibold ${getPercentileColor(comparison.valuePerformance)}`}>
                  {comparison.valuePerformance}パーセンタイル
                  <br />
                  <span className="text-sm">({getPercentileText(comparison.valuePerformance)})</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Improvement Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">改善提案</h3>
          <div className="space-y-4">
            {comparison.engagementPerformance < 120 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-2">📈 フォロワー獲得の改善</h4>
                <p className="text-blue-800 text-sm">
                  より質の高いコンテンツの投稿や、ハッシュタグの戦略的活用でフォロワー数を増やしましょう。
                </p>
              </div>
            )}
            {comparison.engagementPerformance < 120 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-900 mb-2">💬 エンゲージメント向上</h4>
                <p className="text-green-800 text-sm">
                  フォロワーとのやり取りを増やし、コメントやDMへの返信を積極的に行いましょう。
                </p>
              </div>
            )}
            {comparison.valuePerformance < 120 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h4 className="font-medium text-purple-900 mb-2">💰 収益性の向上</h4>
                <p className="text-purple-800 text-sm">
                  より高単価のプロジェクトにチャレンジしたり、専門性を高めて付加価値を提供しましょう。
                </p>
              </div>
            )}
            {comparison.engagementPerformance >= 130 && comparison.engagementPerformance >= 130 && comparison.valuePerformance >= 130 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="font-medium text-emerald-900 mb-2">🎉 素晴らしいパフォーマンス！</h4>
                <p className="text-emerald-800 text-sm">
                  あなたは業界でトップクラスのパフォーマンスを発揮しています。この調子を維持し、さらなる成長を目指しましょう。
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <PageLayout
      title="アナリティクス"
      subtitle="パフォーマンスを詳細に分析"
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

        {/* Period and Project Selector */}
        <Card className="mb-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">期間選択</h2>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'week', label: '今週' },
                  { value: 'month', label: '今月' },
                  { value: '3months', label: '過去3ヶ月' },
                  { value: '6months', label: '過去6ヶ月' },
                  { value: 'year', label: '過去1年' },
                ].map(period => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      setLoading(true);
                      setSelectedPeriod(period.value);
                    }}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Project Selector for Companies */}
            {user?.role !== 'INFLUENCER' && projects.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">プロジェクト選択</h3>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">プロジェクト:</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">すべてのプロジェクト</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                  {selectedProject !== 'all' && (
                    <span className="text-sm text-blue-600 font-medium">
                      {projects.find(p => p.id === selectedProject)?.title}の分析
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Card className="mb-8">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeTab === 'overview' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('overview')}
            >
              概要
            </Button>
            {user?.role === 'INFLUENCER' && (
              <>
                <Button
                  variant={activeTab === 'performance' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveTab('performance')}
                >
                  パフォーマンス
                </Button>
                <Button
                  variant={activeTab === 'comparison' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveTab('comparison')}
                >
                  業界比較
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
    </PageLayout>
  );
};

export default AnalyticsPage;