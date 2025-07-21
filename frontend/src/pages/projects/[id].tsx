import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Application {
  id: string;
  influencer: {
    id: string;
    displayName: string;
    bio: string;
    categories: string[];
    prefecture: string;
    priceMin: number;
    priceMax: number;
    socialAccounts: {
      platform: string;
      followerCount: number;
      engagementRate: number;
    }[];
  };
  message: string;
  proposedPrice: number;
  appliedAt: string;
  isAccepted: boolean;
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetPlatforms: string[];
  targetPrefecture: string;
  targetCity: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  deliverables: string;
  requirements: string;
  additionalInfo: string;
  createdAt: string;
  applications: Application[];
  // 新しい詳細項目
  advertiserName?: string;
  brandName?: string;
  productName?: string;
  productUrl?: string;
  productPrice?: number;
  productFeatures?: string;
  campaignObjective?: string;
  campaignTarget?: string;
  postingPeriodStart?: string;
  postingPeriodEnd?: string;
  postingMedia?: string[];
  messageToConvey?: string;
  shootingAngle?: string;
  packagePhotography?: string;
  productOrientationSpecified?: string;
  musicUsage?: string;
  brandContentSettings?: string;
  advertiserAccount?: string;
  desiredHashtags?: string[];
  ngItems?: string;
  legalRequirements?: string;
  notes?: string;
  secondaryUsage?: string;
  secondaryUsageScope?: string;
  secondaryUsagePeriod?: string;
  insightDisclosure?: string;
  matchedInfluencer?: {
    id: string;
    displayName: string;
  };
}

interface Props {
  projectId: string;
}

// 各項目の説明文
const fieldDescriptions: Record<string, string> = {
  advertiserName: '広告を出稿する企業・ブランドの正式名称です。',
  brandName: '宣伝したい商品やサービスのブランド名です。',
  productName: '具体的な商品・サービスの正式名称です。',
  productUrl: '商品の詳細情報が掲載されている公式ページのURLです。',
  productPrice: '商品の税込み価格です。フォロワーが購入を検討する際の参考になります。',
  productFeatures: '商品の特徴や魅力を250文字程度で説明します。インフルエンサーがコンテンツを作る際の参考になります。',
  campaignObjective: 'このキャンペーンで達成したい目標（認知拡大、売上向上、ブランドイメージ向上など）です。',
  campaignTarget: 'ターゲットとする顧客層（年齢、性別、興味関心など）です。',
  postingPeriodStart: 'インフルエンサーに投稿してもらいたい期間の開始日です。',
  postingPeriodEnd: 'インフルエンサーに投稿してもらいたい期間の終了日です。',
  postingMedia: '投稿してもらいたいSNSプラットフォーム（Instagram、TikTok、YouTubeなど）です。',
  messageToConvey: '投稿を通じてフォロワーに伝えたいメッセージや訴求ポイントです。',
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

const ProjectDetailPage: React.FC<Props> = ({ projectId }) => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'applications'>('overview');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const currentId = id || projectId;
    console.log('Project Detail - useEffect triggered, id:', currentId, 'projectId:', projectId);
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('Project Detail - userData:', userData);
    console.log('Project Detail - token:', token);
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      console.log('Project Detail - User data:', parsedUser);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        console.log('Access denied - User role:', parsedUser.role);
        router.push('/dashboard');
        return;
      }
      
      console.log('Access granted - User role:', parsedUser.role);
      
      if (currentId) {
        console.log('Fetching project details for id:', currentId);
        fetchProjectDetails(currentId);
      } else {
        console.log('No project id available yet');
      }
    } else {
      console.log('No user data or token - redirecting to login');
      router.push('/login');
    }
  }, [id, projectId, router]);

  const fetchProjectDetails = async (currentId?: string | string[]) => {
    try {
      const projectIdToUse = currentId || id || projectId;
      console.log('Calling getProjectById with id:', projectIdToUse);
      const { getProjectById } = await import('../../services/api');
      const result = await getProjectById(projectIdToUse as string);
      console.log('Project details received:', result);
      setProject(result);
    } catch (err: any) {
      console.error('Error fetching project details:', err);
      console.log('Using fallback mock data');
      // フォールバック用のモックデータ
      const projectIdToUse = currentId || id || projectId;
      const mockProject: ProjectDetails = {
        id: (projectIdToUse || '1') as string,
        title: '新商品コスメのPRキャンペーン',
        description: '新発売のファンデーションを使用した投稿をお願いします。自然な仕上がりが特徴の商品で、20-30代の女性をターゲットにしています。',
        category: '美容・化粧品',
        budget: 300000,
        status: 'PENDING',
        targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
        targetPrefecture: '東京都',
        targetCity: '渋谷区、新宿区',
        targetGender: 'FEMALE',
        targetAgeMin: 20,
        targetAgeMax: 35,
        targetFollowerMin: 10000,
        targetFollowerMax: 100000,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        deliverables: 'Instagram投稿2回、ストーリー投稿3回、TikTok動画1本',
        requirements: 'ナチュラルメイクでの使用感を重視、#新商品コスメ #ナチュラルメイク のハッシュタグ必須',
        additionalInfo: '商品サンプル提供、撮影用メイク道具一式貸出可能',
        createdAt: '2024-01-15',
        applications: [
          {
            id: 'app1',
            influencer: {
              id: 'inf1',
              displayName: '田中美咲',
              bio: '美容・ファッション系インフルエンサー。20代女性向けコンテンツ発信中。',
              categories: ['美容', 'ファッション'],
              prefecture: '東京都',
              priceMin: 50000,
              priceMax: 200000,
              socialAccounts: [
                { platform: 'INSTAGRAM', followerCount: 35000, engagementRate: 3.5 },
                { platform: 'YOUTUBE', followerCount: 15000, engagementRate: 2.8 }
              ]
            },
            message: 'この商品にとても興味があります。ナチュラルメイクが得意で、同世代の女性に向けた発信を心がけています。',
            proposedPrice: 150000,
            appliedAt: '2024-01-16',
            isAccepted: false
          },
          {
            id: 'app2',
            influencer: {
              id: 'inf2',
              displayName: '鈴木さやか',
              bio: 'ライフスタイル系クリエイター。料理、旅行、美容など幅広く発信。',
              categories: ['ライフスタイル', '美容', '料理'],
              prefecture: '大阪府',
              priceMin: 80000,
              priceMax: 300000,
              socialAccounts: [
                { platform: 'INSTAGRAM', followerCount: 60000, engagementRate: 4.2 },
                { platform: 'TIKTOK', followerCount: 29000, engagementRate: 5.1 }
              ]
            },
            message: 'ナチュラルメイクの動画コンテンツを得意としています。TikTokでのメイクアップ動画は特に反響が良いです。',
            proposedPrice: 200000,
            appliedAt: '2024-01-17',
            isAccepted: false
          }
        ]
      };
      
      setProject(mockProject);
      setError('プロジェクト詳細の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      // TODO: API実装
      console.log('Accepting application:', applicationId);
      alert('応募を承諾しました！');
      await fetchProjectDetails();
    } catch (err) {
      console.error('Error accepting application:', err);
      alert('応募承諾に失敗しました。');
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    if (confirm('この応募を却下しますか？')) {
      try {
        // TODO: API実装
        console.log('Rejecting application:', applicationId);
        alert('応募を却下しました。');
        await fetchProjectDetails();
      } catch (err) {
        console.error('Error rejecting application:', err);
        alert('応募却下に失敗しました。');
      }
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: '募集中', color: 'bg-yellow-100 text-yellow-800' };
      case 'MATCHED': return { label: 'マッチング済み', color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS': return { label: '進行中', color: 'bg-green-100 text-green-800' };
      case 'COMPLETED': return { label: '完了', color: 'bg-purple-100 text-purple-800' };
      case 'CANCELLED': return { label: 'キャンセル', color: 'bg-red-100 text-red-800' };
      default: return { label: '不明', color: 'bg-gray-100 text-gray-800' };
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
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📸';
      case 'youtube': return '🎥';
      case 'tiktok': return '🎵';
      case 'twitter': return '🐦';
      default: return '📱';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
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

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 mb-4">{error || 'プロジェクトが見つかりませんでした。'}</p>
          <Link href="/projects" className="text-blue-600 hover:underline">
            プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-gray-900">プロジェクト詳細</h1>
              <p className="text-sm text-gray-600">{project.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(project.status).color}`}>
              {getStatusInfo(project.status).label}
            </span>
            <Link href="/projects" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
              一覧に戻る
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* プロジェクト概要 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              {project.title}
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold hover:bg-blue-600 cursor-pointer" title="プロジェクトのタイトル">
                ?
              </span>
            </h2>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-green-600">{formatPrice(project.budget)}</div>
              <div className="ml-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer" title="プロジェクトの予算">?</div>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">{project.description}</p>
          
          {/* アクションボタン */}
          <div className="flex flex-wrap gap-3 mb-6">
            {project.status === 'IN_PROGRESS' && (
              <Link href={`/payments/${project.id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  💳 支払いを行う
                </motion.button>
              </Link>
            )}
            <Link href="/chat">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                💬 チャット
              </motion.button>
            </Link>
            <Link href="/payments/history">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                📊 支払い履歴
              </motion.button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{project.category}</div>
              <div className="text-gray-600 text-sm">カテゴリー</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{formatDate(project.startDate)}</div>
              <div className="text-gray-600 text-sm">開始日</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{formatDate(project.endDate)}</div>
              <div className="text-gray-600 text-sm">終了日</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{project.applications.length}件</div>
              <div className="text-gray-600 text-sm">応募数</div>
            </div>
          </div>

          <div className="flex space-x-2 mb-4">
            {project.targetPlatforms.map(platform => (
              <span key={platform} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {getPlatformIcon(platform)} {platform}
              </span>
            ))}
          </div>
        </motion.div>

        {/* タブナビゲーション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-2 shadow-xl mb-8"
        >
          <div className="flex space-x-2">
            {[
              { key: 'overview', label: '詳細情報', icon: '📋' },
              { key: 'applications', label: '応募一覧', icon: '📝' }
            ].map(tab => (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 詳細情報タブ */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* ターゲット設定 */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">ターゲット設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">地域</h4>
                  <p className="text-gray-600">{project.targetPrefecture}</p>
                  {project.targetCity && (
                    <p className="text-gray-500 text-sm">{project.targetCity}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">性別</h4>
                  <p className="text-gray-600">
                    {project.targetGender === 'MALE' ? '男性' : 
                     project.targetGender === 'FEMALE' ? '女性' : 
                     project.targetGender === 'OTHER' ? 'その他' : '指定なし'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">年齢層</h4>
                  <p className="text-gray-600">
                    {project.targetAgeMin > 0 && project.targetAgeMax > 0 
                      ? `${project.targetAgeMin}-${project.targetAgeMax}歳`
                      : '指定なし'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">フォロワー数</h4>
                  <p className="text-gray-600">
                    {project.targetFollowerMin > 0 && project.targetFollowerMax > 0 
                      ? `${formatNumber(project.targetFollowerMin)} - ${formatNumber(project.targetFollowerMax)}`
                      : '指定なし'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* 要件詳細 */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">要件詳細</h3>
              <div className="space-y-6">
                {project.deliverables && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">成果物・納品物</h4>
                    <p className="text-gray-700">{project.deliverables}</p>
                  </div>
                )}
                {project.requirements && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">要求事項</h4>
                    <p className="text-gray-700">{project.requirements}</p>
                  </div>
                )}
                {project.additionalInfo && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">その他の情報</h4>
                    <p className="text-gray-700">{project.additionalInfo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 商品・広告主情報 */}
            {(project.advertiserName || project.brandName || project.productName) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">商品・広告主情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.advertiserName && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        広告主名
                        <HelpButton field="advertiserName" />
                      </h4>
                      <p className="text-gray-700">{project.advertiserName}</p>
                    </div>
                  )}
                  {project.brandName && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        ブランド名
                        <HelpButton field="brandName" />
                      </h4>
                      <p className="text-gray-700">{project.brandName}</p>
                    </div>
                  )}
                  {project.productName && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        商品正式名称
                        <HelpButton field="productName" />
                      </h4>
                      <p className="text-gray-700">{project.productName}</p>
                    </div>
                  )}
                  {project.productUrl && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        商品URL
                        <HelpButton field="productUrl" />
                      </h4>
                      <a href={project.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {project.productUrl}
                      </a>
                    </div>
                  )}
                  {project.productPrice && project.productPrice > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        商品税込価格
                        <HelpButton field="productPrice" />
                      </h4>
                      <p className="text-gray-700">{formatPrice(project.productPrice)}</p>
                    </div>
                  )}
                  {project.advertiserAccount && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        広告主アカウント
                        <HelpButton field="advertiserAccount" />
                      </h4>
                      <p className="text-gray-700 font-mono">{project.advertiserAccount}</p>
                    </div>
                  )}
                  {project.productFeatures && (
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        商品特徴
                        <HelpButton field="productFeatures" />
                      </h4>
                      <p className="text-gray-700">{project.productFeatures}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* キャンペーン詳細 */}
            {(project.campaignObjective || project.campaignTarget || project.messageToConvey) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">キャンペーン詳細</h3>
                <div className="space-y-6">
                  {project.campaignObjective && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        施策の目的
                        <HelpButton field="campaignObjective" />
                      </h4>
                      <p className="text-gray-700">{project.campaignObjective}</p>
                    </div>
                  )}
                  {project.campaignTarget && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        施策ターゲット
                        <HelpButton field="campaignTarget" />
                      </h4>
                      <p className="text-gray-700">{project.campaignTarget}</p>
                    </div>
                  )}
                  {(project.postingPeriodStart || project.postingPeriodEnd) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        投稿期間
                        <HelpButton field="postingPeriodStart" />
                      </h4>
                      <p className="text-gray-700">
                        {project.postingPeriodStart && project.postingPeriodEnd
                          ? `${project.postingPeriodStart} 〜 ${project.postingPeriodEnd}`
                          : project.postingPeriodStart || project.postingPeriodEnd
                        }
                      </p>
                    </div>
                  )}
                  {project.postingMedia && project.postingMedia.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        投稿メディア
                        <HelpButton field="postingMedia" />
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.postingMedia.map(media => (
                          <span key={media} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {media === 'INSTAGRAM' ? '📸 Instagram' :
                             media === 'YOUTUBE' ? '🎥 YouTube' :
                             media === 'TIKTOK' ? '🎵 TikTok' :
                             media === 'TWITTER' ? '🐦 Twitter' : media}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.messageToConvey && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        投稿を通じて伝えたいこと
                        <HelpButton field="messageToConvey" />
                      </h4>
                      <p className="text-gray-700">{project.messageToConvey}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 撮影・制作仕様 */}
            {(project.shootingAngle || project.packagePhotography || project.productOrientationSpecified || 
              project.musicUsage || project.brandContentSettings) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">撮影・制作仕様</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.shootingAngle && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        人物の撮影アングル
                        <HelpButton field="shootingAngle" />
                      </h4>
                      <p className="text-gray-700">{project.shootingAngle}</p>
                    </div>
                  )}
                  {project.packagePhotography && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        外装やパッケージ撮影
                        <HelpButton field="packagePhotography" />
                      </h4>
                      <p className="text-gray-700">{project.packagePhotography}</p>
                    </div>
                  )}
                  {project.productOrientationSpecified && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        商品の向きの撮影指定
                        <HelpButton field="productOrientationSpecified" />
                      </h4>
                      <p className="text-gray-700">{project.productOrientationSpecified}</p>
                    </div>
                  )}
                  {project.musicUsage && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        音楽使用
                        <HelpButton field="musicUsage" />
                      </h4>
                      <p className="text-gray-700">{project.musicUsage}</p>
                    </div>
                  )}
                  {project.brandContentSettings && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        ブランドコンテンツ設定
                        <HelpButton field="brandContentSettings" />
                      </h4>
                      <p className="text-gray-700">{project.brandContentSettings}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ハッシュタグ・制約事項 */}
            {(project.desiredHashtags?.length || project.ngItems || project.legalRequirements || project.notes) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">ハッシュタグ・制約事項</h3>
                <div className="space-y-6">
                  {project.desiredHashtags && project.desiredHashtags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        希望ハッシュタグ
                        <HelpButton field="desiredHashtags" />
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.desiredHashtags.filter(tag => tag).map((hashtag, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-mono">
                            {hashtag.startsWith('#') ? hashtag : `#${hashtag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.ngItems && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        NG項目
                        <HelpButton field="ngItems" />
                      </h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{project.ngItems}</p>
                      </div>
                    </div>
                  )}
                  {project.legalRequirements && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        薬機法に基づく表現や注釈が必要な表現
                        <HelpButton field="legalRequirements" />
                      </h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">{project.legalRequirements}</p>
                      </div>
                    </div>
                  )}
                  {project.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        注意点
                        <HelpButton field="notes" />
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">{project.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 二次利用・開示設定 */}
            {(project.secondaryUsage || project.secondaryUsageScope || project.secondaryUsagePeriod || project.insightDisclosure) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">二次利用・開示設定</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.secondaryUsage && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        二次利用有無
                        <HelpButton field="secondaryUsage" />
                      </h4>
                      <p className={`text-sm px-3 py-1 rounded-full inline-block font-medium ${
                        project.secondaryUsage === '許可（条件なし）' 
                          ? 'bg-green-100 text-green-800' 
                          : project.secondaryUsage === '許可（条件あり）'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.secondaryUsage}
                      </p>
                    </div>
                  )}
                  {project.insightDisclosure && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        投稿のインサイト開示
                        <HelpButton field="insightDisclosure" />
                      </h4>
                      <p className={`text-sm px-3 py-1 rounded-full inline-block font-medium ${
                        project.insightDisclosure === '必要' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.insightDisclosure}
                      </p>
                    </div>
                  )}
                  {project.secondaryUsageScope && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        二次利用範囲
                        <HelpButton field="secondaryUsageScope" />
                      </h4>
                      <p className="text-gray-700">{project.secondaryUsageScope}</p>
                    </div>
                  )}
                  {project.secondaryUsagePeriod && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        二次利用期間
                        <HelpButton field="secondaryUsagePeriod" />
                      </h4>
                      <p className="text-gray-700">{project.secondaryUsagePeriod}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 応募一覧タブ */}
        {activeTab === 'applications' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">応募一覧</h3>
            
            {project.applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">まだ応募がありません</h4>
                <p className="text-gray-600">インフルエンサーからの応募をお待ちください。</p>
              </div>
            ) : (
              <div className="space-y-6">
                {project.applications.map((application, index) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-2xl p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {application.influencer.displayName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{application.influencer.displayName}</h4>
                          <p className="text-gray-600">{application.influencer.prefecture}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{formatPrice(application.proposedPrice)}</div>
                          <div className="text-gray-500 text-sm">提案料金</div>
                        </div>
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAcceptApplication(application.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          >
                            承諾
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRejectApplication(application.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                          >
                            却下
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700">{application.influencer.bio}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {application.influencer.categories.map(category => (
                        <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {category}
                        </span>
                      ))}
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-900 mb-2">メッセージ</h5>
                      <p className="text-gray-700 bg-white p-3 rounded-lg">{application.message}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4">
                        {application.influencer.socialAccounts.map(account => (
                          <div key={account.platform} className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {getPlatformIcon(account.platform)} {formatNumber(account.followerCount)}
                            </div>
                            <div className="text-xs text-gray-500">{account.engagementRate}%</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        応募日: {formatDate(application.appliedAt)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Use server-side rendering for reliable dynamic routing on Vercel
export async function getServerSideProps(context: { params: { id: string } }) {
  const { id } = context.params;
  
  return {
    props: {
      projectId: id,
    },
  };
}

export default ProjectDetailPage;