import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getInvoices, markInvoiceAsPaid } from '../../services/api';
import { Invoice } from '../../types';
import DateRangeFilter from '../../components/DateRangeFilter';

// Define InvoiceStatus locally to avoid import issues
enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT', 
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

const ReceivedInvoicesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const router = useRouter();

  const statusLabels = {
    [InvoiceStatus.DRAFT]: '下書き',
    [InvoiceStatus.SENT]: '未払い',
    [InvoiceStatus.PAID]: '支払済み',
    [InvoiceStatus.OVERDUE]: '期限超過',
    [InvoiceStatus.CANCELLED]: 'キャンセル',
  };

  const statusColors = {
    [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [InvoiceStatus.SENT]: 'bg-yellow-100 text-yellow-800',
    [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
    [InvoiceStatus.OVERDUE]: 'bg-red-100 text-red-800',
    [InvoiceStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
      router.push('/dashboard');
      return;
    }

    fetchInvoices();
  }, [router, currentPage, selectedStatus, startDate, endDate, selectedPeriod]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
        type: 'received'
      };

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      // 期間フィルタリングのパラメータを追加
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      if (selectedPeriod && selectedPeriod !== 'all') {
        params.period = selectedPeriod;
      }

      const result = await getInvoices(params);
      setInvoices(Array.isArray(result) ? result : result.invoices || []);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError('請求書の取得に失敗しました。');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!confirm('この請求書を支払済みにマークしますか？')) return;

    try {
      await markInvoiceAsPaid(invoiceId);
      fetchInvoices();
      alert('請求書を支払済みにしました。');
    } catch (err: any) {
      console.error('Error marking invoice as paid:', err);
      alert('支払済みマークに失敗しました。');
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
    return new Date(dateString).toLocaleDateString('ja-JP');
  };


  const resetFilters = () => {
    setSelectedPeriod('all');
    setStartDate('');
    setEndDate('');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  // 統計情報の計算
  const calculateStats = () => {
    const total = invoices.length;
    const unpaid = invoices.filter(inv => inv.status === InvoiceStatus.SENT).length;
    const paid = invoices.filter(inv => inv.status === InvoiceStatus.PAID).length;
    const overdue = invoices.filter(inv => inv.status === InvoiceStatus.OVERDUE).length;
    
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const unpaidAmount = invoices
      .filter(inv => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    return { total, unpaid, paid, overdue, totalAmount, unpaidAmount };
  };

  const stats = calculateStats();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">ダッシュボードに戻る</span>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all">
              受取請求書
            </h1>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-lg transition-all">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600">総請求書数</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-lg transition-all">
            <div className="text-3xl font-bold text-yellow-600">{stats.unpaid}</div>
            <div className="text-gray-600">未払い</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-lg transition-all">
            <div className="text-3xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-gray-600">支払済み</div>
          </div>

          <div
                                                className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-lg transition-all"
          >
            <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-gray-600">期限超過</div>
          </div>

          <div
                                                className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-lg transition-all"
          >
            <div className="text-2xl font-bold text-blue-600">{formatPrice(stats.unpaidAmount)}</div>
            <div className="text-gray-600">未払い金額</div>
          </div>
        </div>

        {/* フィルター */}
        <div
                                        className="bg-white/80 backdrop-blur-xl rounded-xl p-6 shadow-lg mb-6 transition-all"
        >
          <div className="space-y-6">
            {/* ステータスフィルター */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-gray-700 font-medium">ステータス:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setSelectedStatus(InvoiceStatus.SENT)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedStatus === InvoiceStatus.SENT
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                未払い
              </button>
              <button
                onClick={() => setSelectedStatus(InvoiceStatus.PAID)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedStatus === InvoiceStatus.PAID
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                支払済み
              </button>
              <button
                onClick={() => setSelectedStatus(InvoiceStatus.OVERDUE)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedStatus === InvoiceStatus.OVERDUE
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                期限超過
              </button>
            </div>
            </div>

            {/* 期間フィルター */}
            <div>
              <DateRangeFilter 
                onDateChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                  setSelectedPeriod(start || end ? 'custom' : 'all');
                  setCurrentPage(1);
                }}
                initialStartDate={startDate}
                initialEndDate={endDate}
              />
            </div>
            
            {/* リセットボタン */}
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                すべてのフィルターをリセット
              </button>
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div
                                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </div>
        )}

        {/* 請求書リスト */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div
                                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 text-center shadow-lg transition-all"
          >
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">請求書がありません</h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? '受け取った請求書がまだありません。'
                : `${statusLabels[selectedStatus as InvoiceStatus]}の請求書はありません。`
              }
            </p>
          </div>
        ) : (
          <div
                                                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden transition-all"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">請求書番号</th>
                    <th className="text-left p-4 font-semibold text-gray-900">インフルエンサー</th>
                    <th className="text-left p-4 font-semibold text-gray-900">プロジェクト</th>
                    <th className="text-left p-4 font-semibold text-gray-900">発行日</th>
                    <th className="text-left p-4 font-semibold text-gray-900">支払期限</th>
                    <th className="text-right p-4 font-semibold text-gray-900">金額</th>
                    <th className="text-center p-4 font-semibold text-gray-900">ステータス</th>
                    <th className="text-center p-4 font-semibold text-gray-900">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <Link href={`/invoices/received/${invoice.id}`} className="text-blue-600 hover:underline font-medium">
                          #{invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="p-4">{invoice.influencer.displayName}</td>
                      <td className="p-4">{invoice.project.title}</td>
                      <td className="p-4">{formatDate(invoice.issueDate)}</td>
                      <td className="p-4">
                        <span className={invoice.status === InvoiceStatus.OVERDUE ? 'text-red-600 font-semibold' : ''}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold">{formatPrice(invoice.totalAmount)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[invoice.status]}`}>
                          {statusLabels[invoice.status]}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <Link href={`/invoices/received/${invoice.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                            詳細
                          </Link>
                          {(invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE) && (
                            <button
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              支払済み
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 p-4 border-t">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <span className="text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivedInvoicesPage;