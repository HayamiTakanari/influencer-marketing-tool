import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  getInvoices, 
  deleteInvoice, 
  sendInvoice, 
  markInvoiceAsPaid 
} from '../services/api';
import { 
  Invoice, 
  InvoiceStatus, 
  InvoiceListResponse 
} from '../types';

const InvoicesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | ''>('');
  const [pagination, setPagination] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const router = useRouter();

  const statusLabels = {
    [InvoiceStatus.DRAFT]: '下書き',
    [InvoiceStatus.SENT]: '送信済み',
    [InvoiceStatus.PAID]: '支払済み',
    [InvoiceStatus.OVERDUE]: '期限超過',
    [InvoiceStatus.CANCELLED]: 'キャンセル',
  };

  const statusColors = {
    [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [InvoiceStatus.SENT]: 'bg-blue-100 text-blue-800',
    [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
    [InvoiceStatus.OVERDUE]: 'bg-red-100 text-red-800',
    [InvoiceStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // インフルエンサーのみアクセス可能
    if (parsedUser.role !== 'INFLUENCER') {
      router.push('/dashboard');
      return;
    }

    fetchInvoices();
  }, [router, selectedStatus]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, limit: 20 };
      if (selectedStatus) params.status = selectedStatus;

      const result: InvoiceListResponse = await getInvoices(params);
      setInvoices(result.invoices);
      setPagination(result.pagination);
      setSummary(result.summary);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError('請求書の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (id: string) => {
    if (!confirm('この請求書を送信しますか？')) return;

    try {
      await sendInvoice(id);
      fetchInvoices();
      alert('請求書を送信しました。');
    } catch (err: any) {
      console.error('Error sending invoice:', err);
      alert('請求書の送信に失敗しました。');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('この請求書を支払済みにマークしますか？')) return;

    try {
      await markInvoiceAsPaid(id);
      fetchInvoices();
      alert('請求書を支払済みにしました。');
    } catch (err: any) {
      console.error('Error marking invoice as paid:', err);
      alert('支払済みマークに失敗しました。');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('この請求書を削除しますか？')) return;

    try {
      await deleteInvoice(id);
      fetchInvoices();
      alert('請求書を削除しました。');
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      alert('請求書の削除に失敗しました。');
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
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
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              請求書管理
            </motion.h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/invoices/create')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規作成</span>
          </motion.button>
        </div>

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

        {/* サマリーカード */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-8"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">売上サマリー</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatPrice(summary.totalAmount)}</div>
                <div className="text-gray-600 text-sm">総売上</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatPrice(summary.paidAmount)}</div>
                <div className="text-gray-600 text-sm">入金済み</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{formatPrice(summary.unpaidAmount)}</div>
                <div className="text-gray-600 text-sm">未入金</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatPrice(summary.overdueAmount)}</div>
                <div className="text-gray-600 text-sm">期限超過</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* フィルター */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedStatus('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            {Object.entries(statusLabels).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status as InvoiceStatus)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 請求書一覧 */}
        <div className="space-y-4">
          {invoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{invoice.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </span>
                    <span className="text-sm text-gray-500">#{invoice.invoiceNumber}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">クライアント:</span> {invoice.client.companyName}
                    </div>
                    <div>
                      <span className="font-medium">発行日:</span> {formatDate(invoice.issueDate)}
                    </div>
                    <div>
                      <span className="font-medium">支払期限:</span> {formatDate(invoice.dueDate)}
                    </div>
                    <div>
                      <span className="font-medium">金額:</span> 
                      <span className="text-lg font-bold text-green-600 ml-1">
                        {formatPrice(invoice.totalAmount)}
                      </span>
                    </div>
                  </div>
                  {invoice.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{invoice.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* 詳細ボタン */}
                  <button
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    詳細
                  </button>

                  {/* アクション */}
                  {invoice.status === InvoiceStatus.DRAFT && (
                    <>
                      <button
                        onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleSendInvoice(invoice.id)}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        送信
                      </button>
                    </>
                  )}

                  {invoice.status === InvoiceStatus.SENT && (
                    <button
                      onClick={() => handleMarkAsPaid(invoice.id)}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      支払済み
                    </button>
                  )}

                  {(invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.CANCELLED) && (
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {invoices.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">請求書がありません</h3>
              <p className="text-gray-600 mb-4">
                {selectedStatus 
                  ? `${statusLabels[selectedStatus as InvoiceStatus]}の請求書はありません。`
                  : '新しい請求書を作成してください。'
                }
              </p>
              {!selectedStatus && (
                <button
                  onClick={() => router.push('/invoices/create')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  請求書を作成
                </button>
              )}
            </div>
          )}
        </div>

        {/* ページネーション */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              disabled={!pagination.hasPrev}
              className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              前へ
            </button>
            
            {Array.from({ length: Math.min(10, pagination.totalPages) }, (_, i) => {
              const page = Math.max(1, pagination.page - 5) + i;
              if (page > pagination.totalPages) return null;
              
              return (
                <button
                  key={page}
                  className={`px-4 py-2 rounded-lg border ${
                    page === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              disabled={!pagination.hasNext}
              className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;