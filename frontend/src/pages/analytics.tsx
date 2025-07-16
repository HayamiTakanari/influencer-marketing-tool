import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchAnalyticsData();
      if (parsedUser.role === 'INFLUENCER') {
        fetchPerformanceData();
        fetchComparisonData();
      }
    } else {
      router.push('/login');
    }
  }, [router, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      const { getOverviewStats } = await import('../services/api');
      const data = await getOverviewStats(selectedPeriod);
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError('アナリティクスデータの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const { getPerformanceMetrics } = await import('../services/api');
      const data = await getPerformanceMetrics();
      setPerformanceData(data);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
    }
  };

  const fetchComparisonData = async () => {
    try {
      const { getComparisonData } = await import('../services/api');
      const data = await getComparisonData();
      setComparisonData(data);
    } catch (err: any) {
      console.error('Error fetching comparison data:', err);
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
      // Earnings chart data
      const earningsChartData = {
        labels: stats.earnings.monthly.map((item: any) => formatDate(item.month)),
        datasets: [
          {
            label: '収益',
            data: stats.earnings.monthly.map((item: any) => item.earnings),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          },
        ],
      };

      // Projects by category chart
      const categoryChartData = {
        labels: stats.projects.byCategory.map((item: any) => item.category),
        datasets: [
          {
            data: stats.projects.byCategory.map((item: any) => item._count.id),
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">応募数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.applications.total}</p>
                  <p className="text-green-600 text-sm">承認率 {stats.applications.acceptanceRate}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  📝
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
                  <p className="text-2xl font-bold text-gray-900">{stats.projects.completed}</p>
                  <p className="text-blue-600 text-sm">承認済み {stats.applications.accepted}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.earnings.total)}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.rating.average}</p>
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
              {stats.earnings.monthly.length > 0 ? (
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
              {stats.projects.byCategory.length > 0 ? (
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
              {stats.socialAccounts.map((account: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{account.platform}</span>
                    <span className="text-sm text-gray-500">
                      {account.platform === 'INSTAGRAM' && '📷'}
                      {account.platform === 'TWITTER' && '🐦'}
                      {account.platform === 'YOUTUBE' && '📺'}
                      {account.platform === 'TIKTOK' && '🎵'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    フォロワー: {formatNumber(account.followerCount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    エンゲージメント率: {account.engagementRate}%
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      );
    } else {
      // Client view
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
                  <p className="text-gray-600 text-sm">作成プロジェクト</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.projects.created}</p>
                  <p className="text-blue-600 text-sm">{getPeriodText(selectedPeriod)}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.projects.completed}</p>
                  <p className="text-green-600 text-sm">成功率 {stats.projects.created > 0 ? Math.round((stats.projects.completed / stats.projects.created) * 100) : 0}%</p>
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
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.spending.total)}</p>
                  <p className="text-purple-600 text-sm">{getPeriodText(selectedPeriod)}</p>
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
                  <p className="text-gray-600 text-sm">受信応募数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.applications.received}</p>
                  <p className="text-indigo-600 text-sm">応募者からの反応</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  📬
                </div>
              </div>
            </motion.div>
          </div>
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
                <p className="text-xl font-bold text-green-600">{socialMetrics.averageEngagement}%</p>
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
                <p className="text-sm text-gray-600">完了率</p>
                <p className="text-xl font-bold text-green-600">{projectMetrics.completionRate}%</p>
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
                <p className="text-sm text-gray-600">プロジェクト数</p>
                <p className="text-xl font-bold text-blue-600">
                  {earnings.reduce((sum: number, item: any) => sum + item.project_count, 0)}
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
              {socialMetrics.platforms.map((platform: any, index: number) => (
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
                      <p className="text-gray-600">フォロワー</p>
                      <p className="font-semibold">{formatNumber(platform.followerCount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">エンゲージメント</p>
                      <p className="font-semibold">{platform.engagementRate}%</p>
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
                  <p className="text-xl font-bold text-blue-600">{formatNumber(yourStats.totalFollowers)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">業界平均</p>
                  <p className="text-lg text-gray-900">{formatNumber(industryAverages.averageFollowers)}</p>
                </div>
                <div className={`font-semibold ${getPercentileColor(comparison.followersPercentile)}`}>
                  {comparison.followersPercentile}パーセンタイル
                  <br />
                  <span className="text-sm">({getPercentileText(comparison.followersPercentile)})</span>
                </div>
              </div>
            </div>

            {/* Engagement Comparison */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">エンゲージメント率</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">あなた</p>
                  <p className="text-xl font-bold text-green-600">{yourStats.averageEngagement}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">業界平均</p>
                  <p className="text-lg text-gray-900">{industryAverages.averageEngagement}%</p>
                </div>
                <div className={`font-semibold ${getPercentileColor(comparison.engagementPercentile)}`}>
                  {comparison.engagementPercentile}パーセンタイル
                  <br />
                  <span className="text-sm">({getPercentileText(comparison.engagementPercentile)})</span>
                </div>
              </div>
            </div>

            {/* Earnings Comparison */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">プロジェクト単価</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">あなた</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(yourStats.averageEarningsPerProject)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">業界平均</p>
                  <p className="text-lg text-gray-900">{formatCurrency(industryAverages.averageEarningsPerProject)}</p>
                </div>
                <div className={`font-semibold ${getPercentileColor(comparison.earningsPercentile)}`}>
                  {comparison.earningsPercentile}パーセンタイル
                  <br />
                  <span className="text-sm">({getPercentileText(comparison.earningsPercentile)})</span>
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
            {comparison.followersPercentile < 50 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-2">📈 フォロワー獲得の改善</h4>
                <p className="text-blue-800 text-sm">
                  より質の高いコンテンツの投稿や、ハッシュタグの戦略的活用でフォロワー数を増やしましょう。
                </p>
              </div>
            )}
            {comparison.engagementPercentile < 50 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-900 mb-2">💬 エンゲージメント向上</h4>
                <p className="text-green-800 text-sm">
                  フォロワーとのやり取りを増やし、コメントやDMへの返信を積極的に行いましょう。
                </p>
              </div>
            )}
            {comparison.earningsPercentile < 50 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h4 className="font-medium text-purple-900 mb-2">💰 収益性の向上</h4>
                <p className="text-purple-800 text-sm">
                  より高単価のプロジェクトにチャレンジしたり、専門性を高めて付加価値を提供しましょう。
                </p>
              </div>
            )}
            {comparison.followersPercentile >= 75 && comparison.engagementPercentile >= 75 && comparison.earningsPercentile >= 75 && (
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">アナリティクス</h1>
              <p className="text-sm text-gray-600">パフォーマンスを分析</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.email}</span>
            <Link href="/dashboard" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
              ダッシュボード
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* エラーメッセージ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">期間選択</h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'week', label: '今週' },
              { value: 'month', label: '今月' },
              { value: '3months', label: '過去3ヶ月' },
              { value: '6months', label: '過去6ヶ月' },
              { value: 'year', label: '過去1年' },
            ].map(period => (
              <motion.button
                key={period.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8"
        >
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              概要
            </motion.button>
            {user?.role === 'INFLUENCER' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('performance')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === 'performance'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  パフォーマンス
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('comparison')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === 'comparison'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  業界比較
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
      </div>
    </div>
  );
};

export default AnalyticsPage;