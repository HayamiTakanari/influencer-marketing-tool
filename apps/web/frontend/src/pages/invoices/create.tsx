import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createInvoice, getMyProjects } from '../../services/api';
import { InvoiceCreateRequest, InvoiceItem } from '../../types';

const CreateInvoicePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const router = useRouter();

  // フォームデータ
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    dueDate: '',
    paymentMethod: '銀行振込',
    bankInfo: {
      bankName: '',
      branchName: '',
      accountType: '普通',
      accountNumber: '',
      accountName: '',
    }
  });

  // 明細項目
  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxRate: 10,
      taxAmount: 0,
      totalAmount: 0
    }
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role !== 'INFLUENCER') {
      router.push('/dashboard');
      return;
    }

    fetchProjects();
    
    // デフォルトの支払期限（30日後）を設定
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      dueDate: defaultDueDate.toISOString().split('T')[0]
    }));
  }, [router]);

  const fetchProjects = async () => {
    try {
      const result = await getMyProjects();
      setProjects(Array.isArray(result) ? result : result.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    }
  };

  const updateItemCalculation = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    // フィールドを更新
    (item as any)[field] = value;
    
    // 計算を更新
    if (field === 'quantity' || field === 'unitPrice') {
      item.amount = item.quantity * item.unitPrice;
    }
    
    if (field === 'amount' || field === 'taxRate') {
      item.taxAmount = Math.floor(item.amount * (item.taxRate / 100));
    }
    
    item.totalAmount = item.amount + item.taxAmount;
    
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        taxRate: 10,
        taxAmount: 0,
        totalAmount: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.projectId) {
      setError('プロジェクトを選択してください。');
      return;
    }

    if (!formData.title.trim()) {
      setError('請求書タイトルを入力してください。');
      return;
    }

    if (!formData.dueDate) {
      setError('支払期限を設定してください。');
      return;
    }

    const validItems = items.filter(item => item.description.trim() && item.unitPrice > 0);
    if (validItems.length === 0) {
      setError('少なくとも1つの有効な明細項目を入力してください。');
      return;
    }

    try {
      setLoading(true);
      
      const createData: InvoiceCreateRequest = {
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description || undefined,
        dueDate: formData.dueDate,
        items: validItems,
        paymentMethod: formData.paymentMethod || undefined,
        bankInfo: formData.bankInfo.bankName ? formData.bankInfo : undefined
      };

      const result = await createInvoice(createData);
      router.push(`/invoices/${result.id}`);
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setError('請求書の作成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;
    
    return { subtotal, taxAmount, totalAmount };
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.push('/invoices')}
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">請求書一覧に戻る</span>
          </button>
          <h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-500"
          >
            請求書作成
          </h1>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 transition-all duration-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* 基本情報 */}
            <div
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg transition-all duration-500"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">基本情報</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    関連プロジェクト *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">プロジェクトを選択してください</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    支払期限 *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    請求書タイトル *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: プロジェクト完了に伴う請求書"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明・備考
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請求内容の詳細説明..."
                  />
                </div>
              </div>
            </div>

            {/* 明細項目 */}
            <div


              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg transition-all duration-500"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">明細</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>項目を追加</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-semibold text-gray-900">項目</th>
                      <th className="text-right py-2 px-2 font-semibold text-gray-900">数量</th>
                      <th className="text-right py-2 px-2 font-semibold text-gray-900">単価</th>
                      <th className="text-right py-2 px-2 font-semibold text-gray-900">小計</th>
                      <th className="text-right py-2 px-2 font-semibold text-gray-900">税率</th>
                      <th className="text-right py-2 px-2 font-semibold text-gray-900">税額</th>
                      <th className="text-right py-2 px-2 font-semibold text-gray-900">合計</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItemCalculation(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="サービス内容"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemCalculation(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="1"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItemCalculation(index, 'unitPrice', parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                          />
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {formatPrice(item.amount)}
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={item.taxRate}
                            onChange={(e) => updateItemCalculation(index, 'taxRate', parseInt(e.target.value))}
                            className="w-16 px-1 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value={0}>0%</option>
                            <option value={8}>8%</option>
                            <option value={10}>10%</option>
                          </select>
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600">
                          {formatPrice(item.taxAmount)}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">
                          {formatPrice(item.totalAmount)}
                        </td>
                        <td className="py-3 px-2">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 合計 */}
              <div className="mt-6 flex justify-end">
                <div className="w-80">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">小計:</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">消費税:</span>
                      <span className="font-medium">{formatPrice(taxAmount)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>合計:</span>
                        <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 支払情報 */}
            <div


              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg transition-all duration-500"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">支払情報</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    支払方法
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="銀行振込">銀行振込</option>
                    <option value="現金">現金</option>
                    <option value="クレジットカード">クレジットカード</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>

              {formData.paymentMethod === '銀行振込' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">振込先情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        銀行名
                      </label>
                      <input
                        type="text"
                        value={formData.bankInfo.bankName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo, bankName: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="みずほ銀行"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        支店名
                      </label>
                      <input
                        type="text"
                        value={formData.bankInfo.branchName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo, branchName: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="渋谷支店"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        口座種別
                      </label>
                      <select
                        value={formData.bankInfo.accountType}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo, accountType: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        口座番号
                      </label>
                      <input
                        type="text"
                        value={formData.bankInfo.accountNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo, accountNumber: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1234567"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        口座名義
                      </label>
                      <input
                        type="text"
                        value={formData.bankInfo.accountName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankInfo: { ...formData.bankInfo, accountName: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="タナカ タロウ"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/invoices')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '作成中...' : '請求書を作成'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoicePage;