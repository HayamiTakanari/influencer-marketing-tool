import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DateRangeFilter from '../../components/DateRangeFilter';
import BackButton from '../../components/BackButton';
import Sidebar from '../../components/shared/Sidebar';

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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* 背景デザイン */}
      <div className="fixed inset-0 z-0">
        {/* ベースグラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        
        {/* メッシュグラデーション */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -inset-[100%] opacity-60">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #d1fae5, #10b981, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #f3f4f6, #6b7280, transparent)' }} />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #6ee7b7, #059669, transparent)' }} />
          </div>
        </div>
        
        {/* アーティスティックパターン */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="artistic-pattern-payment" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern-payment)" />
        </svg>
      </div>

      {/* サイドバー */}
      <Sidebar 
        user={user} 
        favoriteCount={0} 
        onLogout={handleLogout} 
      />

      {/* メインコンテンツエリア */}
      <div className="ml-80 relative z-10">
        {/* ナビゲーション */}
        <nav className="fixed top-0 left-80 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-50" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">支払い履歴</h1>
                <p className="text-sm text-gray-600">取引履歴と統計情報</p>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-20 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
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
            className="relative bg-white border border-gray-200 p-8 transition-all overflow-hidden mb-8" style={{
              background: `
                linear-gradient(135deg, transparent 10px, white 10px),
                linear-gradient(-135deg, transparent 10px, white 10px),
                linear-gradient(45deg, transparent 10px, white 10px),
                linear-gradient(-45deg, transparent 10px, white 10px)
              `,
              backgroundPosition: 'top left, top right, bottom right, bottom left',
              backgroundSize: '50% 50%',
              backgroundRepeat: 'no-repeat',
              boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
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
          className="relative bg-white border border-gray-200 p-6 transition-all overflow-hidden mb-8" style={{
            background: `
              linear-gradient(135deg, transparent 10px, white 10px),
              linear-gradient(-135deg, transparent 10px, white 10px),
              linear-gradient(45deg, transparent 10px, white 10px),
              linear-gradient(-45deg, transparent 10px, white 10px)
            `,
            backgroundPosition: 'top left, top right, bottom right, bottom left',
            backgroundSize: '50% 50%',
            backgroundRepeat: 'no-repeat',
            boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
          }}
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
          className="relative bg-white border border-gray-200 p-8 transition-all overflow-hidden" style={{
            background: `
              linear-gradient(135deg, transparent 10px, white 10px),
              linear-gradient(-135deg, transparent 10px, white 10px),
              linear-gradient(45deg, transparent 10px, white 10px),
              linear-gradient(-45deg, transparent 10px, white 10px)
            `,
            backgroundPosition: 'top left, top right, bottom right, bottom left',
            backgroundSize: '50% 50%',
            backgroundRepeat: 'no-repeat',
            boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
          }}
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
                  className="relative bg-white border border-gray-200 p-6 transition-all hover:shadow-md" style={{
                    boxShadow: '3px 3px 0 rgba(0,0,0,0.1), 1px 1px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                  }}
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
          className="relative bg-blue-50 border border-blue-200 p-6 transition-all overflow-hidden mt-8" style={{
            background: `
              linear-gradient(135deg, transparent 10px, #eff6ff 10px),
              linear-gradient(-135deg, transparent 10px, #eff6ff 10px),
              linear-gradient(45deg, transparent 10px, #eff6ff 10px),
              linear-gradient(-45deg, transparent 10px, #eff6ff 10px)
            `,
            backgroundPosition: 'top left, top right, bottom right, bottom left',
            backgroundSize: '50% 50%',
            backgroundRepeat: 'no-repeat',
            boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
          }}
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
      </div>
    </div>
  );
};

export default PaymentHistoryPage;