import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

// 各項目の説明文
const fieldDescriptions: Record<string, string> = {
  title: 'プロジェクトのタイトルです。インフルエンサーが興味を持つような魅力的なタイトルを設定してください。',
  description: 'プロジェクトの詳細な説明です。目的、期待する成果、具体的な要望などを記載してください。',
  category: 'プロジェクトのカテゴリーです。適切なカテゴリーを選択することで、関連するインフルエンサーに見つけてもらいやすくなります。',
  budget: 'プロジェクトの総予算です。インフルエンサーへの報酬の目安となります。',
  targetPlatforms: '投稿してもらいたいSNSプラットフォームを選択してください。',
  targetPrefecture: 'ターゲットとする地域や、インフルエンサーの活動地域を指定できます。',
  targetCity: '特定の市区町村をターゲットにする場合は入力してください。',
  targetGender: 'ターゲットとする性別、またはインフルエンサーの性別を指定できます。',
  targetAge: 'ターゲット層の年齢範囲を設定してください。',
  targetFollower: 'インフルエンサーのフォロワー数の範囲を指定できます。',
  date: 'プロジェクトの実施期間です。投稿してもらいたい期間を設定してください。',
  deliverables: 'インフルエンサーに求める具体的な成果物（投稿回数、動画の長さなど）を記載してください。',
  requirements: '投稿内容に関する具体的な要求事項（ハッシュタグ、メンション、投稿時間など）を記載してください。',
  additionalInfo: '上記以外の補足情報や特記事項があれば記載してください。',
  advertiserName: '広告を出稿する企業・ブランドの正式名称です。',
  brandName: '宣伝したい商品やサービスのブランド名です。',
  productName: '具体的な商品・サービスの正式名称です。',
  productUrl: '商品の詳細情報が掲載されている公式ページのURLです。',
  productPrice: '商品の税込み価格です。フォロワーが購入を検討する際の参考になります。',
  productFeatures: '商品の特徴や魅力を250文字程度で説明します。インフルエンサーがコンテンツを作る際の参考になります。',
  campaignObjective: 'このキャンペーンで達成したい目標（認知拡大、売上向上、ブランドイメージ向上など）です。',
  campaignTarget: 'ターゲットとする顧客層（年齢、性別、興味関心など）です。',
  postingPeriod: 'インフルエンサーに投稿してもらいたい期間です。',
  postingMedia: '投稿してもらいたいSNSプラットフォーム（Instagram、TikTok、YouTubeなど）です。',
  messageToConvey: '投稿を通じてフォロワーに伝えたいメッセージや訴求ポイントです。最大3つまで記載できます。',
  shootingAngle: '人物を撮影する際の角度の指定です。商品との組み合わせや見せ方に影響します。',
  packagePhotography: '商品の外装やパッケージを撮影に含めるかどうかの指定です。',
  productOrientationSpecified: '商品の向きや角度について具体的な指定があるかどうかです。',
  musicUsage: 'BGMや効果音の使用について。著作権の関係で商用利用可能な音源のみ使用を推奨します。',
  brandContentSettings: 'SNSプラットフォームのブランドコンテンツ機能を使用するかどうかの設定です。',
  advertiserAccount: '広告主の公式SNSアカウント名です。タグ付けに使用されることがあります。',
  desiredHashtags: 'キャンペーンで使用してもらいたいハッシュタグです（最大5つまで）。',
  ngItems: 'コンテンツ制作時に避けてもらいたい内容や表現です。',
  legalRequirements: '薬機法など法的規制に基づいて必要な表現や注釈です。',
  notes: '上記以外で特に注意してもらいたい点や要望です。',
  secondaryUsage: 'インフルエンサーのコンテンツを広告主が二次利用（転載・再利用）できるかどうかです。',
  secondaryUsageScope: '二次利用が許可されている場合の使用範囲（公式サイト、広告など）です。',
  secondaryUsagePeriod: '二次利用が許可されている期間です。',
  insightDisclosure: '投稿のパフォーマンスデータ（いいね数、リーチ数など）の開示を求めるかどうかです。'
};

// ヘルプボタンコンポーネント
const HelpButton: React.FC<{ field: string }> = ({ field }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const description = fieldDescriptions[field];

  if (!description) return null;

  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
        aria-label="ヘルプを表示"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {showTooltip && (
        <div className="absolute z-50 w-64 p-3 mt-1 bg-gray-900 text-white text-sm rounded-lg shadow-lg left-6 top-0">
          <div className="absolute -left-2 top-2">
            <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
          </div>
          {description}
        </div>
      )}
    </div>
  );
};

const CreateProjectPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // カスタムフィールドの型定義
  interface CustomField {
    id: string;
    label: string;
    value: string;
    fieldType: 'text' | 'textarea' | 'number' | 'date';
  }

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
    additionalInfo: '',
    // 新しい詳細項目
    advertiserName: '',
    brandName: '',
    productName: '',
    productUrl: '',
    productPrice: 0,
    productFeatures: '',
    campaignObjective: '',
    campaignTarget: '',
    postingPeriodStart: '',
    postingPeriodEnd: '',
    postingMedia: [] as string[],
    messageToConvey: ['', '', ''],
    shootingAngle: '',
    packagePhotography: '',
    productOrientationSpecified: '',
    musicUsage: '',
    brandContentSettings: '',
    advertiserAccount: '',
    desiredHashtags: [] as string[],
    ngItems: '',
    legalRequirements: '',
    notes: '',
    secondaryUsage: '',
    secondaryUsageScope: '',
    secondaryUsagePeriod: '',
    insightDisclosure: '',
    // カスタムフィールド
    customFields: [] as CustomField[]
  });

  // カスタムフィールドの管理
  const [customFieldCount, setCustomFieldCount] = useState(0);

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

  const shootingAngles = [
    '指定なし', '正面', '斜め上', '斜め下', '横向き', '後ろ姿', 'アップ', '全身'
  ];

  const packagePhotographyOptions = [
    '不要', '外装のみ', 'パッケージのみ', '外装・パッケージ両方'
  ];

  const productOrientationOptions = [
    '指定なし', 'ラベル正面', '商品名が見えるように', 'ロゴが見えるように'
  ];

  const musicUsageOptions = [
    'なし', '商用利用フリー音源のみ', 'ブランド指定楽曲', '相談'
  ];

  const brandContentOptions = [
    '設定不要', '設定必要', '相談して決定'
  ];

  const secondaryUsageOptions = [
    '禁止', '許可（条件あり）', '許可（条件なし）'
  ];

  const insightDisclosureOptions = [
    '必要', '不要'
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

  const handlePostingMediaToggle = (media: string) => {
    setFormData(prev => ({
      ...prev,
      postingMedia: prev.postingMedia.includes(media)
        ? prev.postingMedia.filter(m => m !== media)
        : [...prev.postingMedia, media]
    }));
  };

  const handleHashtagChange = (index: number, value: string) => {
    const newHashtags = [...formData.desiredHashtags];
    newHashtags[index] = value;
    setFormData(prev => ({
      ...prev,
      desiredHashtags: newHashtags
    }));
  };

  const addHashtag = () => {
    if (formData.desiredHashtags.length < 5) {
      setFormData(prev => ({
        ...prev,
        desiredHashtags: [...prev.desiredHashtags, '']
      }));
    }
  };

  // カスタムフィールド管理関数
  const addCustomField = () => {
    if (formData.customFields.length < 10) {
      const newField: CustomField = {
        id: `custom-${Date.now()}`,
        label: '',
        value: '',
        fieldType: 'text'
      };
      setFormData(prev => ({
        ...prev,
        customFields: [...prev.customFields, newField]
      }));
      setCustomFieldCount(customFieldCount + 1);
    }
  };

  const removeCustomField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== id)
    }));
    setCustomFieldCount(customFieldCount - 1);
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    }));
  };

  const removeHashtag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      desiredHashtags: prev.desiredHashtags.filter((_, i) => i !== index)
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
      
      // プロジェクトデータを一時的に保存（AIマッチング用）
      const projectForAI = {
        id: result.project.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: formData.budget,
        targetPlatforms: formData.targetPlatforms,
        brandName: formData.brandName,
        productName: formData.productName,
        campaignObjective: formData.campaignObjective,
        campaignTarget: formData.campaignTarget,
        messageToConvey: formData.messageToConvey.filter(msg => msg.trim() !== '').join('\n')
      };
      localStorage.setItem('recentProject', JSON.stringify(projectForAI));
      
      // AIマッチングページにリダイレクト
      router.push(`/project-ai-matching?projectId=${result.project.id}`);
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
                    <span className="flex items-center">
                      プロジェクト名 <span className="text-red-500">*</span>
                      <HelpButton field="title" />
                    </span>
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
                    <span className="flex items-center">
                      カテゴリー <span className="text-red-500">*</span>
                      <HelpButton field="category" />
                    </span>
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
                    <span className="flex items-center">
                      プロジェクト詳細 <span className="text-red-500">*</span>
                      <HelpButton field="description" />
                    </span>
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
                    <span className="flex items-center">
                      予算 <span className="text-red-500">*</span>
                      <HelpButton field="budget" />
                    </span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                対象プラットフォーム
                <HelpButton field="targetPlatforms" />
              </h2>
              
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      対象地域
                      <HelpButton field="targetPrefecture" />
                    </span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      市区町村
                      <HelpButton field="targetCity" />
                    </span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      開始日
                      <HelpButton field="date" />
                    </span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      終了日
                      <HelpButton field="date" />
                    </span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      成果物・納品物
                      <HelpButton field="deliverables" />
                    </span>
                  </label>
                  <textarea
                    value={formData.deliverables}
                    onChange={(e) => setFormData({...formData, deliverables: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="投稿数、ストーリー数、レポート形式など..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      要求事項
                      <HelpButton field="requirements" />
                    </span>
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="投稿内容の方向性、使用ハッシュタグ、NGワードなど..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      その他の情報
                      <HelpButton field="additionalInfo" />
                    </span>
                  </label>
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

            {/* 商品・広告主情報 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">商品・広告主情報</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    広告主名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.advertiserName}
                    onChange={(e) => setFormData({...formData, advertiserName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="株式会社○○"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ブランド名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ブランド名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品正式名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="商品の正式名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品URL
                  </label>
                  <input
                    type="url"
                    value={formData.productUrl}
                    onChange={(e) => setFormData({...formData, productUrl: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/product"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品税込価格（円）
                  </label>
                  <input
                    type="number"
                    value={formData.productPrice || ''}
                    onChange={(e) => setFormData({...formData, productPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1980"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    広告主アカウント
                  </label>
                  <input
                    type="text"
                    value={formData.advertiserAccount}
                    onChange={(e) => setFormData({...formData, advertiserAccount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@advertiser_account"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品特徴（250文字程度）
                  </label>
                  <textarea
                    value={formData.productFeatures}
                    onChange={(e) => setFormData({...formData, productFeatures: e.target.value})}
                    rows={4}
                    maxLength={250}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="商品の特徴、効果、使用方法などを記載してください..."
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {formData.productFeatures.length}/250文字
                  </div>
                </div>
              </div>
            </div>

            {/* キャンペーン詳細 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">キャンペーン詳細</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    施策の目的 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.campaignObjective}
                    onChange={(e) => setFormData({...formData, campaignObjective: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="認知拡大、購入促進、ブランディングなど"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    施策ターゲット <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.campaignTarget}
                    onChange={(e) => setFormData({...formData, campaignTarget: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="20-30代女性、美容に関心がある方など"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    投稿期間（開始日） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.postingPeriodStart}
                    onChange={(e) => setFormData({...formData, postingPeriodStart: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    投稿期間（終了日） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.postingPeriodEnd}
                    onChange={(e) => setFormData({...formData, postingPeriodEnd: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    投稿メディア <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {platforms.map(platform => (
                      <motion.button
                        key={platform.value}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePostingMediaToggle(platform.value)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all ${
                          formData.postingMedia.includes(platform.value)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span>{platform.icon}</span>
                        <span>{platform.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    投稿を通じて伝えたいこと（最大3つまで） <span className="text-red-500">*</span>
                    <HelpButton field="messageToConvey" />
                  </label>
                  <div className="space-y-3">
                    {formData.messageToConvey.map((message, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 min-w-[20px]">{index + 1}.</span>
                        <input
                          type="text"
                          required={index === 0}
                          value={message}
                          onChange={(e) => {
                            const newMessages = [...formData.messageToConvey];
                            newMessages[index] = e.target.value;
                            setFormData({...formData, messageToConvey: newMessages});
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={index === 0 ? "商品の魅力、使用感、効果など" : `伝えたいこと${index + 1}（任意）`}
                        />
                        {index > 0 && message && (
                          <button
                            type="button"
                            onClick={() => {
                              const newMessages = [...formData.messageToConvey];
                              newMessages[index] = '';
                              setFormData({...formData, messageToConvey: newMessages});
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 撮影・制作仕様 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">撮影・制作仕様</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    人物の撮影アングル
                  </label>
                  <select
                    value={formData.shootingAngle}
                    onChange={(e) => setFormData({...formData, shootingAngle: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {shootingAngles.map(angle => (
                      <option key={angle} value={angle}>{angle}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    外装やパッケージ撮影の有無
                  </label>
                  <select
                    value={formData.packagePhotography}
                    onChange={(e) => setFormData({...formData, packagePhotography: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {packagePhotographyOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品の向きの撮影指定の有無
                  </label>
                  <select
                    value={formData.productOrientationSpecified}
                    onChange={(e) => setFormData({...formData, productOrientationSpecified: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {productOrientationOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    音楽使用
                  </label>
                  <select
                    value={formData.musicUsage}
                    onChange={(e) => setFormData({...formData, musicUsage: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {musicUsageOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ブランドコンテンツ設定
                  </label>
                  <select
                    value={formData.brandContentSettings}
                    onChange={(e) => setFormData({...formData, brandContentSettings: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {brandContentOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ハッシュタグ・制約事項 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">ハッシュタグ・制約事項</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    希望ハッシュタグ（5つまで）
                  </label>
                  <div className="space-y-3">
                    {formData.desiredHashtags.map((hashtag, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={hashtag}
                            onChange={(e) => handleHashtagChange(index, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="#ハッシュタグ"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeHashtag(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                    {formData.desiredHashtags.length < 5 && (
                      <button
                        type="button"
                        onClick={addHashtag}
                        className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        + ハッシュタグを追加
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NG項目
                  </label>
                  <textarea
                    value={formData.ngItems}
                    onChange={(e) => setFormData({...formData, ngItems: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="投稿で避けるべき表現、競合他社の言及、使用禁止ワードなど"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    薬機法に基づく表現や注釈が必要な表現
                  </label>
                  <textarea
                    value={formData.legalRequirements}
                    onChange={(e) => setFormData({...formData, legalRequirements: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="薬機法、景表法に関連する注意事項、必要な表記など"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    注意点
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="その他の注意点、特別な要望など"
                  />
                </div>
              </div>
            </div>

            {/* 二次利用・開示設定 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">二次利用・開示設定</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    二次利用有無 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.secondaryUsage}
                    onChange={(e) => setFormData({...formData, secondaryUsage: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {secondaryUsageOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      投稿のインサイト開示有無
                      <HelpButton field="insightDisclosure" />
                    </span>
                  </label>
                  <select
                    value={formData.insightDisclosure}
                    onChange={(e) => setFormData({...formData, insightDisclosure: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {insightDisclosureOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    二次利用範囲
                  </label>
                  <input
                    type="text"
                    value={formData.secondaryUsageScope}
                    onChange={(e) => setFormData({...formData, secondaryUsageScope: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="自社サイト、広告素材、SNS公式アカウントなど"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    二次利用期間
                  </label>
                  <input
                    type="text"
                    value={formData.secondaryUsagePeriod}
                    onChange={(e) => setFormData({...formData, secondaryUsagePeriod: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="6ヶ月、1年、無制限など"
                  />
                </div>
              </div>
            </div>

            {/* カスタム項目 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">カスタム項目</h2>
              
              <div className="space-y-4">
                {formData.customFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          項目名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={field.label !== ''}
                          value={field.label}
                          onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="項目名を入力してください"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          入力形式
                        </label>
                        <select
                          value={field.fieldType}
                          onChange={(e) => updateCustomField(field.id, { fieldType: e.target.value as 'text' | 'textarea' | 'number' | 'date' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="text">テキスト（1行）</option>
                          <option value="textarea">テキスト（複数行）</option>
                          <option value="number">数値</option>
                          <option value="date">日付</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        内容
                      </label>
                      {field.fieldType === 'textarea' ? (
                        <textarea
                          value={field.value}
                          onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="内容を入力してください"
                        />
                      ) : (
                        <input
                          type={field.fieldType}
                          value={field.value}
                          onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="内容を入力してください"
                        />
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        この項目を削除
                      </button>
                    </div>
                  </div>
                ))}
                
                {formData.customFields.length < 10 && (
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>カスタム項目を追加（{formData.customFields.length}/10）</span>
                  </button>
                )}
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