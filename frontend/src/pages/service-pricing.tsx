import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  getMyServicePricing, 
  validateServicePricing, 
  bulkCreateServicePricing,
  updateServicePricing,
  deleteServicePricing,
  ServicePricing 
} from '../services/v3-api';

const ServicePricingPage: React.FC = () => {
  const [servicePricings, setServicePricings] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingService, setEditingService] = useState<ServicePricing | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

  const serviceTypeLabels = {
    PHOTOGRAPHY: '撮影',
    VIDEO_EDITING: '動画編集',
    CONTENT_CREATION: 'コンテンツ制作',
    POSTING: '投稿',
    STORY_CREATION: 'ストーリー制作',
    CONSULTATION: 'コンサルティング',
    LIVE_STREAMING: 'ライブ配信',
    EVENT_APPEARANCE: 'イベント出演',
  };

  const unitLabels = {
    per_post: '投稿あたり',
    per_hour: '時間あたり',
    per_day: '日あたり',
    per_project: 'プロジェクトあたり',
  };

  const [bulkPricingData, setBulkPricingData] = useState(
    Object.keys(serviceTypeLabels).map(serviceType => ({
      serviceType,
      price: 0,
      unit: 'per_post',
      description: '',
      isActive: true,
    }))
  );

  const [editFormData, setEditFormData] = useState({
    price: 0,
    unit: 'per_post',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'INFLUENCER') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pricingData, validationData] = await Promise.all([
        getMyServicePricing(),
        validateServicePricing()
      ]);
      
      setServicePricings(pricingData.servicePricings || []);
      setValidation(validationData);
    } catch (err: any) {
      console.error('Error fetching service pricing:', err);
      setError('料金データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validPricings = bulkPricingData.filter(item => item.price > 0);
      
      if (validPricings.length === 0) {
        setError('少なくとも1つの料金を設定してください。');
        return;
      }

      await bulkCreateServicePricing(validPricings);
      setShowBulkModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving bulk pricing:', err);
      setError('料金の保存に失敗しました。');
    }
  };

  const handleEdit = (service: ServicePricing) => {
    setEditingService(service);
    setEditFormData({
      price: service.price,
      unit: service.unit,
      description: service.description || '',
      isActive: service.isActive,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      await updateServicePricing(editingService.id, editFormData);
      setShowEditModal(false);
      setEditingService(null);
      fetchData();
    } catch (err: any) {
      console.error('Error updating service pricing:', err);
      setError('料金の更新に失敗しました。');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('この料金設定を削除しますか？')) {
      try {
        await deleteServicePricing(id);
        fetchData();
      } catch (err: any) {
        console.error('Error deleting service pricing:', err);
        setError('料金の削除に失敗しました。');
      }
    }
  };

  const updateBulkPricing = (index: number, field: string, value: any) => {
    const updated = [...bulkPricingData];
    updated[index] = { ...updated[index], [field]: value };
    setBulkPricingData(updated);
  };

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
      <div className="max-w-6xl mx-auto px-4 py-8">
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
              料金設定
            </motion.h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBulkModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            一括設定
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

        {/* バリデーション結果 */}
        {validation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl mb-8 ${
              validation.isValid 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">
                {validation.isValid ? '✅' : '⚠️'}
              </span>
              <h2 className="text-xl font-bold">
                {validation.isValid 
                  ? '料金設定が完了しています' 
                  : '料金設定が不完全です'
                }
              </h2>
            </div>
            
            {!validation.isValid && validation.missingServices && (
              <div>
                <p className="text-gray-700 mb-2">以下のサービスの料金設定が必要です：</p>
                <ul className="list-disc list-inside space-y-1">
                  {validation.missingServices.map((service: string) => (
                    <li key={service} className="text-red-600">
                      {serviceTypeLabels[service as keyof typeof serviceTypeLabels]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* 料金設定一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicePricings.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {serviceTypeLabels[service.serviceType as keyof typeof serviceTypeLabels]}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ¥{service.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {unitLabels[service.unit as keyof typeof unitLabels]}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {service.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  service.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.isActive ? '有効' : '無効'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(service.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {servicePricings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">まだ料金設定がありません。</p>
            <p className="text-gray-500 mt-2">「一括設定」ボタンから料金を設定してください。</p>
          </div>
        )}
      </div>

      {/* 一括設定モーダル */}
      {showBulkModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">料金一括設定</h2>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bulkPricingData.map((item, index) => (
                  <div key={item.serviceType} className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      {serviceTypeLabels[item.serviceType as keyof typeof serviceTypeLabels]}
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          料金（円）
                        </label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateBulkPricing(index, 'price', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="10000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          単位
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => updateBulkPricing(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.entries(unitLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateBulkPricing(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="詳細説明..."
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) => updateBulkPricing(index, 'isActive', e.target.checked)}
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">有効</label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  一括保存
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* 編集モーダル */}
      {showEditModal && editingService && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {serviceTypeLabels[editingService.serviceType as keyof typeof serviceTypeLabels]}の編集
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingService(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  料金（円）
                </label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({...editFormData, price: parseInt(e.target.value) || 0})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  単位
                </label>
                <select
                  value={editFormData.unit}
                  onChange={(e) => setEditFormData({...editFormData, unit: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(unitLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="詳細説明..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({...editFormData, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">有効</label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingService(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  更新
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ServicePricingPage;