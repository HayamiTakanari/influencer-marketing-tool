import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface MyApplication {
  id: string;
  message: string;
  proposedPrice: number;
  isAccepted: boolean;
  appliedAt: string;
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    status: string;
    targetPlatforms: string[];
    startDate: string;
    endDate: string;
    client: {
      companyName: string;
      industry: string;
      user: {
        email: string;
      };
    };
  };
}

const MyApplicationsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      
      fetchMyApplications();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchMyApplications = async () => {
    try {
      const { getMyApplications } = await import('../services/api');
      const result = await getMyApplications();
      setApplications(result || []);
    } catch (err: any) {
      console.error('Error fetching my applications:', err);
      setError('応募履歴の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(application => {
    if (statusFilter === 'pending') return !application.isAccepted && application.project.status === 'PENDING';
    if (statusFilter === 'accepted') return application.isAccepted;
    if (statusFilter === 'active') return application.isAccepted && ['MATCHED', 'IN_PROGRESS'].includes(application.project.status);
    if (statusFilter === 'completed') return application.project.status === 'COMPLETED';
    return true;
  });

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📸';
      case 'youtube': return '🎥';
      case 'tiktok': return '🎵';
      case 'twitter': return '🐦';
      default: return '📱';
    }
  };

  const getStatusBadge = (application: MyApplication) => {
    if (application.project.status === 'COMPLETED') {
      return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">完了</span>;
    }
    if (application.project.status === 'CANCELLED') {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">キャンセル</span>;
    }
    if (application.isAccepted) {
      if (application.project.status === 'MATCHED') {
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">マッチング済み</span>;
      }
      if (application.project.status === 'IN_PROGRESS') {
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">進行中</span>;
      }
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">✓ 承認済み</span>;
    }
    if (application.project.status === 'PENDING') {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">審査中</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">未定</span>;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">応募履歴</h1>
              <p className="text-sm text-gray-600">あなたの応募状況を確認</p>
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
        {/* フィルター */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">応募履歴</h2>
              <p className="text-gray-600">プロジェクトへの応募状況と進捗を確認できます</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'すべて' },
                { value: 'pending', label: '審査中' },
                { value: 'accepted', label: '承認済み' },
                { value: 'active', label: '進行中' },
                { value: 'completed', label: '完了' }
              ].map(filter => (
                <motion.button
                  key={filter.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    statusFilter === filter.value
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

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

        {/* 応募履歴一覧 */}
        <div className="space-y-6">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">応募がありません</h3>
              <p className="text-gray-600">
                まだプロジェクトに応募していません。
                <Link href="/opportunities" className="text-blue-600 hover:underline ml-1">
                  プロジェクトを探す
                </Link>
              </p>
            </div>
          ) : (
            filteredApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* プロジェクト情報 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{application.project.title}</h3>
                      {getStatusBadge(application)}
                    </div>
                    <p className="text-gray-600 mb-3">{application.project.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span>🏢 {application.project.client.companyName}</span>
                      <span>📅 応募: {formatDate(application.appliedAt)}</span>
                      <span>🏷️ {application.project.category}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      {application.project.targetPlatforms.map(platform => (
                        <span key={platform} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPlatformIcon(platform)} {platform}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">プロジェクト予算</h4>
                        <p className="text-green-600 font-bold">{formatPrice(application.project.budget)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">提案料金</h4>
                        <p className="text-blue-600 font-bold">{formatPrice(application.proposedPrice)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">プロジェクト期間</h4>
                        <p className="text-gray-600 text-sm">
                          {new Date(application.project.startDate).toLocaleDateString('ja-JP')} - {new Date(application.project.endDate).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 応募メッセージ */}
                  <div className="lg:w-96 bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">応募メッセージ</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{application.message}</p>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex justify-end mt-4 pt-4 border-t space-x-3">
                  {application.isAccepted && ['MATCHED', 'IN_PROGRESS'].includes(application.project.status) && (
                    <>
                      <Link href={`/chat?project=${application.project.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 border-2 border-blue-300 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                        >
                          💬 チャット
                        </motion.button>
                      </Link>
                      <Link href={`/payments/${application.project.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                          💰 決済確認
                        </motion.button>
                      </Link>
                    </>
                  )}
                  <Link href={`/projects/${application.project.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      📋 詳細
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 統計情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mt-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">応募統計</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {applications.length}
              </div>
              <div className="text-gray-600">総応募数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {applications.filter(a => a.isAccepted).length}
              </div>
              <div className="text-gray-600">承認済み</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {applications.filter(a => a.project.status === 'COMPLETED').length}
              </div>
              <div className="text-gray-600">完了済み</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {applications.filter(a => a.isAccepted).reduce((sum, a) => sum + a.proposedPrice, 0).toLocaleString()}
              </div>
              <div className="text-gray-600">総獲得予定額（円）</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MyApplicationsPage;