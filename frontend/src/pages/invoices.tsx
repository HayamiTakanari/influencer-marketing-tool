import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Sidebar from '../components/shared/Sidebar';
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

    // インフルエンサーと企業ユーザーのみアクセス可能
    if (parsedUser.role !== 'INFLUENCER' && parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
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
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -inset-[100%] opacity-60">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #d1fae5, #10b981, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #f3f4f6, #6b7280, transparent)' }} />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #6ee7b7, #059669, transparent)' }} />
          </div>
        </div>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="artistic-pattern-invoices" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern-invoices)" />
        </svg>
      </div>

      <Sidebar 
        user={user} 
        favoriteCount={0} 
        onLogout={handleLogout} 
      />

      <div className="ml-80 relative z-10">
        <nav className="fixed top-0 left-80 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-50" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">請求書管理</h1>
                <p className="text-sm text-gray-600">請求書の作成と管理</p>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-20 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-end mb-8">
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

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
              >
                {error}
              </motion.div>
            )}

            {summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white border border-gray-200 p-8 transition-all overflow-hidden mb-8"
                style={{
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">売上サマリー</h2>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-white border border-gray-200 p-6 transition-all overflow-hidden mb-8"
              style={{
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

            <div className="space-y-4">
              {invoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative bg-white border border-gray-200 p-6 transition-all hover:shadow-md"
                  style={{
                    boxShadow: '3px 3px 0 rgba(0,0,0,0.1), 1px 1px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                  }}
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
                      <button
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        詳細
                      </button>

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
      </div>
    </div>
  );
};

export default InvoicesPage;