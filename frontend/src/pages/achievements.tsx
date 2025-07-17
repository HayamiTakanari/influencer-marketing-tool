import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  getMyAchievements, 
  getAchievementStats, 
  createAchievement, 
  updateAchievement, 
  deleteAchievement,
  Achievement 
} from '../services/v3-api';

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    projectName: '',
    brandName: '',
    purpose: 'SALES' as const,
    platform: 'INSTAGRAM' as const,
    description: '',
    metrics: {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      conversions: 0,
      reach: 0,
      impressions: 0,
    },
    budget: 0,
    duration: '',
    imageUrl: '',
    link: '',
  });

  const purposeLabels = {
    SALES: '売上目的',
    LEAD_GEN: '集客目的',
    AWARENESS: '認知拡大目的',
    BRAND_IMAGE: 'ブランドイメージ向上',
    ENGAGEMENT: 'エンゲージメント向上',
  };

  const platformLabels = {
    INSTAGRAM: 'Instagram',
    YOUTUBE: 'YouTube',
    TIKTOK: 'TikTok',
    TWITTER: 'Twitter',
  };

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
      const [achievementsData, statsData] = await Promise.all([
        getMyAchievements(),
        getAchievementStats()
      ]);
      
      setAchievements(achievementsData.achievements || []);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error fetching achievements:', err);
      setError('実績データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        metrics: Object.fromEntries(
          Object.entries(formData.metrics).filter(([_, value]) => value > 0)
        ),
        budget: formData.budget > 0 ? formData.budget : undefined,
        duration: formData.duration || undefined,
        imageUrl: formData.imageUrl || undefined,
        link: formData.link || undefined,
      };

      if (editingAchievement) {
        await updateAchievement(editingAchievement.id, submitData);
      } else {
        await createAchievement(submitData);
      }

      setShowModal(false);
      setEditingAchievement(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Error saving achievement:', err);
      setError('実績の保存に失敗しました。');
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      projectName: achievement.projectName,
      brandName: achievement.brandName,
      purpose: achievement.purpose,
      platform: achievement.platform,
      description: achievement.description || '',
      metrics: {
        views: achievement.metrics?.views || 0,
        likes: achievement.metrics?.likes || 0,
        shares: achievement.metrics?.shares || 0,
        comments: achievement.metrics?.comments || 0,
        conversions: achievement.metrics?.conversions || 0,
        reach: achievement.metrics?.reach || 0,
        impressions: achievement.metrics?.impressions || 0,
      },
      budget: achievement.budget || 0,
      duration: achievement.duration || '',
      imageUrl: achievement.imageUrl || '',
      link: achievement.link || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('この実績を削除しますか？')) {
      try {
        await deleteAchievement(id);
        fetchData();
      } catch (err: any) {
        console.error('Error deleting achievement:', err);
        setError('実績の削除に失敗しました。');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      projectName: '',
      brandName: '',
      purpose: 'SALES',
      platform: 'INSTAGRAM',
      description: '',
      metrics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        conversions: 0,
        reach: 0,
        impressions: 0,
      },
      budget: 0,
      duration: '',
      imageUrl: '',
      link: '',
    });
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            実績管理
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            新しい実績を追加
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

        {/* 統計情報 */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">総実績数</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">目的別実績</h3>
              <div className="space-y-1">
                {stats.byPurpose?.map((item: any) => (
                  <div key={item.purpose} className="flex justify-between text-sm">
                    <span>{purposeLabels[item.purpose as keyof typeof purposeLabels]}</span>
                    <span className="font-semibold">{item._count.purpose}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">プラットフォーム別</h3>
              <div className="space-y-1">
                {stats.byPlatform?.map((item: any) => (
                  <div key={item.platform} className="flex justify-between text-sm">
                    <span>{platformLabels[item.platform as keyof typeof platformLabels]}</span>
                    <span className="font-semibold">{item._count.platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 実績一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{achievement.projectName}</h3>
                  <p className="text-gray-600">{achievement.brandName}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(achievement)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(achievement.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {purposeLabels[achievement.purpose]}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {platformLabels[achievement.platform]}
                </span>
              </div>

              {achievement.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{achievement.description}</p>
              )}

              {achievement.metrics && Object.keys(achievement.metrics).length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {Object.entries(achievement.metrics).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-gray-500 capitalize">{key}:</span>
                      <span className="font-semibold ml-1">{value?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {achievement.budget && (
                <p className="text-sm text-gray-600 mb-2">
                  予算: ¥{achievement.budget.toLocaleString()}
                </p>
              )}

              {achievement.duration && (
                <p className="text-sm text-gray-600 mb-2">
                  期間: {achievement.duration}
                </p>
              )}

              {achievement.link && (
                <a
                  href={achievement.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  詳細を見る
                </a>
              )}
            </motion.div>
          ))}
        </div>

        {achievements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">まだ実績が登録されていません。</p>
            <p className="text-gray-500 mt-2">「新しい実績を追加」ボタンから実績を登録してください。</p>
          </div>
        )}
      </div>

      {/* モーダル */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingAchievement ? '実績を編集' : '新しい実績を追加'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingAchievement(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    プロジェクト名 *
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="サマーキャンペーン2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ブランド名 *
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="株式会社サンプル"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目的 *
                  </label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(purposeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    プラットフォーム *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(platformLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="プロジェクトの詳細説明..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  成果指標
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(formData.metrics).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-600 mb-1 capitalize">
                        {key}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          metrics: {
                            ...formData.metrics,
                            [key]: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予算（円）
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    実施期間
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2024年7月1日〜7月31日"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    画像URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    参考URL
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/project"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAchievement(null);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  {editingAchievement ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AchievementsPage;