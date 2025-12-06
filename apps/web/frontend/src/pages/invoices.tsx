import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import StatsCard from '../components/common/StatsCard';
import Card from '../components/shared/Card';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  issueDate: string;
  influencerName: string;
  projectName: string;
  description: string;
}

const InvoicesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'INFLUENCER' && parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      setError('請求書APIは未実装です。');
      setInvoices([]);
      setLoading(false);
    } else {
      router.push('/login');
    }
  }, [router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: '支払い済み', color: 'bg-green-100 text-green-800' },
      pending: { label: '支払い待ち', color: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: '期限超過', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => 
    filter === 'all' || invoice.status === filter
  );

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, invoice) => sum + invoice.amount, 0);

  if (loading) {
    return (
      <DashboardLayout title="請求書管理" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="請求書管理"
      subtitle="インフルエンサーとの取引を管理しましょう"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

            {/* 概要セクション */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">請求書概要</h2>
                  <p className="text-gray-600">取引状況を一目で確認できます</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  className="relative bg-white border border-gray-200 p-6 transition-all overflow-hidden"
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
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{formatPrice(totalAmount)}</div>
                    <div className="text-gray-600 text-sm mt-1">総額</div>
                    <div className="text-xs text-gray-500 mt-2">{invoices.length}件の請求書</div>
                  </div>
                </div>

                <div 
                  className="relative bg-white border border-gray-200 p-6 transition-all overflow-hidden"
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
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{formatPrice(paidAmount)}</div>
                    <div className="text-gray-600 text-sm mt-1">支払い済み</div>
                    <div className="text-xs text-gray-500 mt-2">{invoices.filter(inv => inv.status === 'paid').length}件</div>
                  </div>
                </div>

                <div 
                  className="relative bg-white border border-gray-200 p-6 transition-all overflow-hidden"
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
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{formatPrice(pendingAmount)}</div>
                    <div className="text-gray-600 text-sm mt-1">支払い待ち</div>
                    <div className="text-xs text-gray-500 mt-2">{invoices.filter(inv => inv.status === 'pending').length}件</div>
                  </div>
                </div>
              </div>
            </div>

            {/* フィルターセクション */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🔍</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">フィルター</h3>
                  <p className="text-gray-600 text-sm">ステータス別に請求書を表示</p>
                </div>
              </div>

              <div className="flex space-x-4">
                {[
                  { key: 'all', label: 'すべて' },
                  { key: 'pending', label: '支払い待ち' },
                  { key: 'paid', label: '支払い済み' },
                  { key: 'overdue', label: '期限超過' }
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key as any)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      filter === filterOption.key
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 請求書リストセクション */}
            <div
              className="relative bg-white border border-gray-200 p-8 transition-all overflow-hidden"
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
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📊</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">請求書一覧</h3>
                  <p className="text-gray-600">取引の詳細を確認・管理できます</p>
                </div>
              </div>

              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                      <div className="lg:col-span-2">
                        <div className="font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-600">{invoice.influencerName}</div>
                        <div className="text-xs text-gray-500">{invoice.projectName}</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-gray-900">{formatPrice(invoice.amount)}</div>
                      </div>
                      <div>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>発行日: {formatDate(invoice.issueDate)}</div>
                        <div>期限: {formatDate(invoice.dueDate)}</div>
                      </div>
                      <div className="flex justify-end">
                        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                          詳細を見る
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{invoice.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredInvoices.length === 0 && (
                <EmptyState
                  icon="📋"
                  title="該当する請求書がありません"
                />
              )}
            </div>

            {/* ヒントセクション */}
            <div
              className="relative bg-blue-50 border border-blue-200 p-8 transition-all overflow-hidden mt-8"
              style={{
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">💡 請求書管理のコツ</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>定期的に請求書の状況を確認し、支払い期限を守りましょう</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>インフルエンサーとの良好な関係維持のため、迅速な支払いを心がけましょう</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>期限が近い請求書には優先的に対応し、遅延を防ぎましょう</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>請求書の詳細を確認し、プロジェクトの成果と照らし合わせましょう</p>
                </div>
              </div>
            </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoicesPage;