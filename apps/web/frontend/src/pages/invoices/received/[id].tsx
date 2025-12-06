import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getInvoiceById, markInvoiceAsPaid } from '../../../services/api';
import { Invoice } from '../../../types';

// Define InvoiceStatus locally to avoid import issues
enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT', 
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

const ReceivedInvoiceDetailPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;

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

    if (id) {
      fetchInvoice();
    }
  }, [id, router]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const result = await getInvoiceById(id as string);
      setInvoice(result);
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError('請求書の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice || !confirm('この請求書を支払済みにマークしますか？')) return;

    try {
      await markInvoiceAsPaid(invoice.id);
      fetchInvoice();
      alert('請求書を支払済みにしました。');
    } catch (err: any) {
      console.error('Error marking invoice as paid:', err);
      alert('支払済みマークに失敗しました。');
    }
  };

  const handlePrint = () => {
    window.print();
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

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 mb-4">{error || '請求書が見つかりませんでした。'}</p>
          <button
            onClick={() => router.push('/invoices/received')}
            className="text-blue-600 hover:underline"
          >
            受取請求書一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/invoices/received')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">受取請求書一覧に戻る</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">受取請求書詳細</h1>
              <p className="text-gray-600">#{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[invoice.status]}`}>
              {statusLabels[invoice.status]}
            </span>
            
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              印刷
            </button>

            {(invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE) && (
              <button
                onClick={handleMarkAsPaid}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                支払済みにする
              </button>
            )}
          </div>
        </div>

        {/* 請求書本文 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 請求書ヘッダー */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold mb-2">請求書</h2>
                <p className="text-blue-100">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{formatPrice(invoice.totalAmount)}</div>
                <div className="text-blue-100">総額（税込）</div>
                {invoice.status === InvoiceStatus.OVERDUE && (
                  <div className="mt-2 px-3 py-1 bg-red-500 rounded-full text-sm">
                    支払い期限を過ぎています
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 請求書情報 */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* 請求元 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">請求元</h3>
                <div className="space-y-2">
                  <div className="font-semibold text-gray-800">{invoice.influencer.displayName}</div>
                  <div className="text-gray-600">{invoice.influencer.bio}</div>
                  {invoice.bankInfo && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">振込先情報</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>{invoice.bankInfo.bankName} {invoice.bankInfo.branchName}</div>
                        <div>{invoice.bankInfo.accountType} {invoice.bankInfo.accountNumber}</div>
                        <div>{invoice.bankInfo.accountName}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 請求先 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">請求先</h3>
                <div className="space-y-2">
                  <div className="font-semibold text-gray-800">{invoice.client.companyName}</div>
                  <div className="text-gray-600">{invoice.client.contactName}</div>
                </div>

                {/* 日付情報 */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">発行日:</span>
                    <span className="font-medium">{formatDate(invoice.issueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">支払期限:</span>
                    <span className={`font-medium ${invoice.status === InvoiceStatus.OVERDUE ? 'text-red-600' : ''}`}>
                      {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  {invoice.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">支払日:</span>
                      <span className="font-medium text-green-600">{formatDate(invoice.paidDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* プロジェクト情報 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">関連プロジェクト</h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">{invoice.project.title}</div>
                <div className="text-blue-700 text-sm mt-1">{invoice.project.description}</div>
              </div>
            </div>

            {/* 請求書タイトルと説明 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{invoice.title}</h3>
              {invoice.description && (
                <p className="text-gray-600">{invoice.description}</p>
              )}
            </div>

            {/* 明細 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">明細</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-900">項目</th>
                      <th className="text-right p-4 font-semibold text-gray-900">数量</th>
                      <th className="text-right p-4 font-semibold text-gray-900">単価</th>
                      <th className="text-right p-4 font-semibold text-gray-900">小計</th>
                      <th className="text-right p-4 font-semibold text-gray-900">税率</th>
                      <th className="text-right p-4 font-semibold text-gray-900">税額</th>
                      <th className="text-right p-4 font-semibold text-gray-900">合計</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-4 font-medium text-gray-900">{item.description}</td>
                        <td className="p-4 text-right text-gray-600">{item.quantity}</td>
                        <td className="p-4 text-right text-gray-600">{formatPrice(item.unitPrice)}</td>
                        <td className="p-4 text-right text-gray-600">{formatPrice(item.amount)}</td>
                        <td className="p-4 text-right text-gray-600">{item.taxRate}%</td>
                        <td className="p-4 text-right text-gray-600">{formatPrice(item.taxAmount)}</td>
                        <td className="p-4 text-right font-semibold text-gray-900">{formatPrice(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 合計金額 */}
            <div className="flex justify-end">
              <div className="w-80">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">小計:</span>
                    <span className="font-medium">{formatPrice(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">消費税:</span>
                    <span className="font-medium">{formatPrice(invoice.taxAmount)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>合計:</span>
                      <span className="text-blue-600">{formatPrice(invoice.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 支払方法 */}
            {invoice.paymentMethod && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">お支払い方法</h4>
                <p className="text-gray-600">{invoice.paymentMethod}</p>
                {invoice.bankInfo && invoice.paymentMethod === '銀行振込' && (
                  <div className="mt-2 text-sm text-gray-500">
                    上記振込先情報をご確認の上、お振込みください。
                  </div>
                )}
              </div>
            )}

            {/* 支払い状況メッセージ */}
            {invoice.status === InvoiceStatus.SENT && (
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-yellow-800 font-semibold">支払いをお待ちしております</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  支払期限: {formatDate(invoice.dueDate)}
                </p>
              </div>
            )}

            {invoice.status === InvoiceStatus.OVERDUE && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 font-semibold">支払期限を過ぎています</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  至急お支払いをお願いいたします。
                </p>
              </div>
            )}

            {invoice.status === InvoiceStatus.PAID && (
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 font-semibold">お支払いありがとうございました</span>
                </div>
                {invoice.paidDate && (
                  <p className="text-green-700 text-sm mt-1">
                    支払日: {formatDate(invoice.paidDate)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivedInvoiceDetailPage;