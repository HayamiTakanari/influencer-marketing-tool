import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import LoadingState from '../../../components/common/LoadingState';
import StatsCard from '../../../components/common/StatsCard';
import EmptyState from '../../../components/common/EmptyState';

interface Transaction {
  id: string;
  amount: number;
  fee: number;
  status: 'completed' | 'failed' | 'refunded' | 'pending';
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
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      fetchPaymentHistory();

      // Only fetch stats for roles that have access
      if (parsedUser.role === 'INFLUENCER' || parsedUser.role === "COMPANY" || parsedUser.role === 'COMPANY') {
        fetchPaymentStats();
      } else {
        setLoading(false);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/payments/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching payment history:', err);
      setError('支払い履歴の取得に失敗しました。');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
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
        setStats({
          totalSpent: 0,
          totalEarned: 0,
          completedTransactions: 0
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch payment stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      // Silently handle errors - do not log 403 errors
      setStats({
        totalSpent: 0,
        totalEarned: 0,
        completedTransactions: 0
      });
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: '完了', color: 'bg-green-100 text-green-800', icon: '✅' };
      case 'pending':
        return { label: '処理中', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
      case 'failed':
        return { label: '失敗', color: 'bg-red-100 text-red-800', icon: '❌' };
      case 'refunded':
        return { label: '返金済み', color: 'bg-gray-100 text-gray-800', icon: '↩️' };
      default:
        return { label: '不明', color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="支払い履歴" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="支払い履歴"
      subtitle="取引履歴と統計情報"
    >
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* 統計情報 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {user?.role === "COMPANY" || user?.role === 'COMPANY' ? (
            <StatsCard
              title="総支払額"
              value={formatPrice(stats.totalSpent)}
            />
          ) : (
            <StatsCard
              title="総収入"
              value={formatPrice(stats.totalEarned)}
            />
          )}
          <StatsCard
            title="完了した取引"
            value={stats.completedTransactions}
          />
          <StatsCard
            title="取引数"
            value={transactions.length}
          />
        </div>
      )}

      {/* 取引履歴 */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">取引履歴</h2>
        
        {transactions.length === 0 ? (
          <EmptyState
            icon="💳"
            title="取引履歴がありません"
            description="プロジェクトの支払いが完了すると、ここに表示されます。"
          />
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-gray-900">
                      {transaction.project.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(transaction.status).color}`}>
                      {getStatusInfo(transaction.status).icon} {getStatusInfo(transaction.status).label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {formatPrice(transaction.amount)}
                    </div>
                    {transaction.fee > 0 && (
                      <div className="text-sm text-gray-500">
                        手数料: {formatPrice(transaction.fee)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    {user?.role === "COMPANY" || user?.role === 'COMPANY' ? (
                      transaction.project.matchedInfluencer && (
                        <span>👤 {transaction.project.matchedInfluencer.displayName}</span>
                      )
                    ) : (
                      transaction.project.client && (
                        <span>🏢 {transaction.project.client.companyName}</span>
                      )
                    )}
                    <span>📅 {formatDate(transaction.createdAt)}</span>
                  </div>
                  <Link href={`/projects/${transaction.project.id}`}>
                    <Button size="sm" variant="secondary">
                      詳細を見る
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 戻るボタン */}
      <div className="mt-6">
        <Link href="/revenue">
          <Button variant="secondary">
            ← 収益ダッシュボードに戻る
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistoryPage;
