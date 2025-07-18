import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

const CreateProjectPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: 0,
    targetPlatforms: [] as string[],
    targetPrefecture: '',
    targetCity: '',
    targetGender: '',
    targetAgeMin: 0,
    targetAgeMax: 0,
    targetFollowerMin: 0,
    targetFollowerMax: 0,
    startDate: '',
    endDate: '',
    deliverables: '',
    requirements: '',
    additionalInfo: ''
  });

  const categories = [
    '美容・化粧品', 'ファッション', 'フード・飲料', 'ライフスタイル', '旅行・観光',
    'テクノロジー', 'エンターテイメント', 'スポーツ・フィットネス', '教育',
    'ヘルスケア', '自動車', '金融', 'その他'
  ];

  const platforms = [
    { value: 'INSTAGRAM', label: 'Instagram', icon: '📸' },
    { value: 'YOUTUBE', label: 'YouTube', icon: '🎥' },
    { value: 'TIKTOK', label: 'TikTok', icon: '🎵' },
    { value: 'TWITTER', label: 'Twitter', icon: '🐦' }
  ];

  const prefectures = [
    '全国', '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('Project Create - userData:', userData);
    console.log('Project Create - token:', token);
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      console.log('Project Create - User data:', parsedUser);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        console.log('Access denied - User role:', parsedUser.role);
        router.push('/dashboard');
        return;
      }
      console.log('Access granted - User role:', parsedUser.role);
    } else {
      console.log('No user data or token - redirecting to login');
      router.push('/login');
    }
  }, [router]);

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      targetPlatforms: prev.targetPlatforms.includes(platform)
        ? prev.targetPlatforms.filter(p => p !== platform)
        : [...prev.targetPlatforms, platform]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { createProject } = await import('../../services/api');
      const result = await createProject(formData);
      console.log('Project created:', result);
      
      router.push(`/project-detail?id=${result.project.id}`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.error || 'プロジェクトの作成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/projects" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">←</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">新規プロジェクト作成</h1>
              <p className="text-sm text-gray-600">インフルエンサーマーケティングプロジェクトを作成</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/projects" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
              プロジェクト一覧
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
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

        {/* プロジェクト作成フォーム */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本情報 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">基本情報</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロジェクト名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="新商品のプロモーション企画"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリー <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロジェクト詳細 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="プロジェクトの目的、商品・サービスの詳細、期待する効果などを記載してください..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    予算 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value) || 0})}
                      required
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="500000"
                    />
                    <div className="absolute right-3 top-3 text-gray-500">円</div>
                  </div>
                  {formData.budget > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      予算: {formatPrice(formData.budget)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 対象プラットフォーム */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">対象プラットフォーム</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platforms.map(platform => (
                  <motion.div
                    key={platform.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlatformToggle(platform.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      formData.targetPlatforms.includes(platform.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{platform.icon}</div>
                    <div className="font-medium text-gray-900">{platform.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ターゲット設定 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">ターゲット設定</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">対象地域</label>
                  <select
                    value={formData.targetPrefecture}
                    onChange={(e) => setFormData({...formData, targetPrefecture: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {prefectures.map(prefecture => (
                      <option key={prefecture} value={prefecture}>{prefecture}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
                  <input
                    type="text"
                    value={formData.targetCity}
                    onChange={(e) => setFormData({...formData, targetCity: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="渋谷区、新宿区など"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
                  <select
                    value={formData.targetGender}
                    onChange={(e) => setFormData({...formData, targetGender: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">指定なし</option>
                    <option value="MALE">男性</option>
                    <option value="FEMALE">女性</option>
                    <option value="OTHER">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">年齢層</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.targetAgeMin || ''}
                      onChange={(e) => setFormData({...formData, targetAgeMin: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="20"
                      min="0"
                      max="100"
                    />
                    <span className="text-gray-500">〜</span>
                    <input
                      type="number"
                      value={formData.targetAgeMax || ''}
                      onChange={(e) => setFormData({...formData, targetAgeMax: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="35"
                      min="0"
                      max="100"
                    />
                    <span className="text-gray-500">歳</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最低フォロワー数</label>
                  <input
                    type="number"
                    value={formData.targetFollowerMin || ''}
                    onChange={(e) => setFormData({...formData, targetFollowerMin: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10000"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最高フォロワー数</label>
                  <input
                    type="number"
                    value={formData.targetFollowerMax || ''}
                    onChange={(e) => setFormData({...formData, targetFollowerMax: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100000"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* 期間設定 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">期間設定</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 詳細要件 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">詳細要件</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">成果物・納品物</label>
                  <textarea
                    value={formData.deliverables}
                    onChange={(e) => setFormData({...formData, deliverables: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="投稿数、ストーリー数、レポート形式など..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">要求事項</label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="投稿内容の方向性、使用ハッシュタグ、NGワードなど..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">その他の情報</label>
                  <textarea
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="商品サンプル提供、撮影場所、その他の特記事項など..."
                  />
                </div>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-center pt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'プロジェクト作成中...' : 'プロジェクトを作成'}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* 作成のコツ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-blue-50/80 backdrop-blur-xl border border-blue-200 rounded-3xl p-8 shadow-xl mt-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 効果的なプロジェクトを作るコツ</h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <p>明確な目標設定：具体的な数値目標（インプレッション数、エンゲージメント率など）を設定</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <p>詳細な商品説明：商品の特徴、使用方法、ターゲット層を詳しく記載</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <p>適切な予算設定：インフルエンサーのフォロワー数や影響力に見合った予算を設定</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <p>柔軟な条件設定：過度に厳しい条件はマッチング率を下げる可能性があります</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateProjectPage;