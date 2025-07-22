import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DateRangeFilter from '../../components/DateRangeFilter';
import BackButton from '../../components/BackButton';

interface Transaction {
  id: string;
  amount: number;
  fee: number;
  status: 'completed' | 'failed' | 'refunded';
  createdAt: string;
  stripePaymentId: string;
  project: {
    id: string;
    title: string;
    client?: {
      companyName: string;
      contactName: string;
    };
    matchedInfluencer?: {
      displayName: string;
    };
  };
}

interface PaymentStats {
  totalSpent: number;
  totalEarned: number;
  completedTransactions: number;
}

const PaymentHistoryPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refunding, setRefunding] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      fetchPaymentHistory();
      fetchPaymentStats();
      fetchProjects();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // TODO: 実際のAPI実装
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/payments/history`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to fetch payment history');
      // }
      
      // const data = await response.json();
      // setTransactions(data);

      // 仮のデータ
      const mockTransactions: Transaction[] = [
        {
          id: 'txn1',
          amount: 300000,
          fee: 30000,
          status: 'completed',
          createdAt: '2024-01-20T10:30:00Z',
          stripePaymentId: 'pi_1234567890',
          project: {
            id: 'proj1',
            title: '新商品コスメのPRキャンペーン',
            client: {
              companyName: 'ビューティーコスメ株式会社',
              contactName: '田中太郎'
            },
            matchedInfluencer: {
              displayName: '田中美咲'
            }
          }
        },
        {
          id: 'txn2',
          amount: 150000,
          fee: 15000,
          status: 'completed',
          createdAt: '2024-01-15T14:20:00Z',
          stripePaymentId: 'pi_0987654321',
          project: {
            id: 'proj2',
            title: 'ライフスタイル商品のレビュー',
            client: {
              companyName: 'ライフスタイル株式会社',
              contactName: '佐藤花子'
            },
            matchedInfluencer: {
              displayName: '鈴木さやか'
            }
          }
        }
      ];

      setTransactions(mockTransactions);
    } catch (err: any) {
      console.error('Error fetching payment history:', err);
      setError('支払い履歴の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // TODO: 実際のAPI実装
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/payments/stats`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to fetch payment stats');
      // }
      
      // const data = await response.json();
      // setStats(data);

      // 仮のデータ
      const mockStats: PaymentStats = {
        totalSpent: user?.role === 'CLIENT' ? 480000 : 0,
        totalEarned: user?.role === 'INFLUENCER' ? 450000 : 0,
        completedTransactions: 2
      };

      setStats(mockStats);
    } catch (err: any) {
      console.error('Error fetching payment stats:', err);
    }
  };

  const handleRefund = async (transactionId: string) => {
    if (!confirm('この取引を返金しますか？この操作は取り消せません。')) {
      return;
    }

    setRefunding(transactionId);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/payments/refund/${transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      alert('返金処理が完了しました。');
      fetchPaymentHistory();
    } catch (err: any) {
      console.error('Refund error:', err);
      alert('返金処理に失敗しました。');
    } finally {
      setRefunding(null);
    }
  };

  const fetchProjects = async () => {
    try {
      const { getProjects } = await import('../../services/api');
      const result = await getProjects();
      setProjects(result?.projects || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    // プロジェクトフィルター
    if (projectFilter !== 'all' && transaction.project.id !== projectFilter) {
      return false;
    }
    
    // 日付フィルター
    if (startDate || endDate) {
      const transactionDate = new Date(transaction.createdAt);
      const transactionDateString = transactionDate.toISOString().split('T')[0];
      
      if (startDate && transactionDateString < startDate) {
        return false;
      }
      
      if (endDate && transactionDateString > endDate) {
        return false;
      }
    }
    
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: '完了', color: 'bg-green-100 text-green-800', icon: '✅' };
      case 'failed':
        return { label: '失敗', color: 'bg-red-100 text-red-800', icon: '❌' };
      case 'refunded':
        return { label: '返金済み', color: 'bg-yellow-100 text-yellow-800', icon: '↩️' };
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </Link>
            <BackButton text="ダッシュボードに戻る" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">支払い履歴</h1>
              <p className="text-sm text-gray-600">取引履歴と統計情報</p>
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

        {/* 統計情報 */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">支払い統計</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {user?.role === 'CLIENT' && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {formatPrice(stats.totalSpent)}
                  </div>
                  <div className="text-gray-600">総支払額</div>
                </div>
              )}
              {user?.role === 'INFLUENCER' && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatPrice(stats.totalEarned)}
                  </div>
                  <div className="text-gray-600">総収入</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.completedTransactions}
                </div>
                <div className="text-gray-600">完了した取引</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* フィルター */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8"
        >
          <div className="space-y-6">
            {/* プロジェクトフィルター */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">プロジェクト:</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">すべてのプロジェクト</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                {filteredTransactions.length}件の取引
              </span>
            </div>
            
            {/* 期間フィルター */}
            <div>
              <DateRangeFilter 
                onDateChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
                initialStartDate={startDate}
                initialEndDate={endDate}
              />
            </div>
          </div>
        </motion.div>

        {/* 取引履歴 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">取引履歴</h2>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">取引履歴がありません</h3>
              <p className="text-gray-600">{projectFilter === 'all' ? 'まだ支払いや収益がありません。' : '選択したプロジェクトに関する取引がありません。'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {transaction.project.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(transaction.status).color}`}>
                          {getStatusInfo(transaction.status).icon} {getStatusInfo(transaction.status).label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        {user?.role === 'CLIENT' && transaction.project.matchedInfluencer && (
                          <div>
                            <span className="font-medium">インフルエンサー:</span> {transaction.project.matchedInfluencer.displayName}
                          </div>
                        )}
                        {user?.role === 'INFLUENCER' && transaction.project.client && (
                          <div>
                            <span className="font-medium">企業:</span> {transaction.project.client.companyName}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">取引日:</span> {formatDate(transaction.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">取引ID:</span> {transaction.stripePaymentId}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">基本金額:</span>
                          <span className="font-bold text-gray-900 ml-1">{formatPrice(transaction.amount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">手数料:</span>
                          <span className="font-bold text-gray-900 ml-1">{formatPrice(transaction.fee)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">合計:</span>
                          <span className="font-bold text-green-600 ml-1">{formatPrice(transaction.amount + transaction.fee)}</span>
                        </div>
                      </div>
                    </div>

                    {user?.role === 'CLIENT' && transaction.status === 'completed' && (
                      <div className="mt-4 lg:mt-0 lg:ml-6">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRefund(transaction.id)}
                          disabled={refunding === transaction.id}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {refunding === transaction.id ? '処理中...' : '返金'}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 注意事項 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-blue-50/80 backdrop-blur-xl border border-blue-200 rounded-3xl p-6 shadow-xl mt-8"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">💡 支払いについて</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <p>プラットフォーム手数料として基本料金の10%が加算されます</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <p>返金処理には3-5営業日かかる場合があります</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <p>すべての取引はStripeによって安全に処理されます</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <p>領収書が必要な場合はサポートにお問い合わせください</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;