import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Sidebar from '../components/shared/Sidebar';

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

  // Mock data for demonstration
  const mockInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      amount: 500000,
      status: 'paid',
      dueDate: '2024-02-15',
      issueDate: '2024-01-15',
      influencerName: '田中花子',
      projectName: '春の新商品キャンペーン',
      description: 'Instagram投稿 × 3回、ストーリー × 5回'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      amount: 800000,
      status: 'pending',
      dueDate: '2024-02-28',
      issueDate: '2024-01-28',
      influencerName: '佐藤美咲',
      projectName: '美容製品レビュー',
      description: 'YouTube動画 × 1本、Instagram投稿 × 2回'
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-003',
      amount: 300000,
      status: 'overdue',
      dueDate: '2024-01-31',
      issueDate: '2024-01-01',
      influencerName: '山田太郎',
      projectName: 'グルメキャンペーン',
      description: 'TikTok動画 × 3本'
    }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'INFLUENCER' && parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      // Set mock data and loading state
      setTimeout(() => {
        setInvoices(mockInvoices);
        setLoading(false);
      }, 500);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
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
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -inset-[100%] opacity-60">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #ddd6fe, #8b5cf6, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #f3f4f6, #6b7280, transparent)' }} />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #c7d2fe, #4f46e5, transparent)' }} />
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
                <p className="text-sm text-gray-600">インフルエンサーとの取引を管理しましょう</p>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-20 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
              >
                {error}
              </motion.div>
            )}

            {/* 概要セクション */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
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
            </motion.div>

            {/* フィルターセクション */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-8"
            >
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
            </motion.div>

            {/* 請求書リストセクション */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
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
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
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
                  </motion.div>
                ))}
              </div>

              {filteredInvoices.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <p className="text-gray-600">該当する請求書がありません</p>
                </div>
              )}
            </motion.div>

            {/* ヒントセクション */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;