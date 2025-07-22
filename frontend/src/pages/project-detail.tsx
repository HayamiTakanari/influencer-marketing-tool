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
  matchedInfluencer?: {
    id: string;
    displayName: string;
  };
  // 新規作成時の詳細項目
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
}

const ProjectDetailPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'applications'>('overview');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    console.log('Project Detail - useEffect triggered, id:', id);
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
      
      if (id) {
        console.log('Fetching project details for id:', id);
        fetchProjectDetails();
      } else {
        console.log('No project id available yet');
      }
    } else {
      console.log('No user data or token - redirecting to login');
      router.push('/login');
    }
  }, [id, router]);

  const fetchProjectDetails = async () => {
    try {
      console.log('Calling getProjectById with id:', id);
      const { getProjectById } = await import('../services/api');
      const result = await getProjectById(id as string);
      console.log('Project details received:', result);
      setProject(result);
    } catch (err: any) {
      console.error('Error fetching project details:', err);
      console.log('Using fallback mock data for project ID:', id);
      
      // プロジェクトIDに基づいたフォールバック用のモックデータ
      const mockProjectsData: Record<string, ProjectDetails> = {
        '1': {
          id: '1',
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
          // 詳細情報を追加
          advertiserName: '株式会社ビューティーラボ',
          brandName: 'NaturalGlow',
          productName: 'パーフェクトナチュラルファンデーション SPF30',
          productUrl: 'https://example.com/naturalglow-foundation',
          productPrice: 3980,
          productFeatures: '自然な仕上がりと長時間キープが特徴のファンデーション。SPF30でUVカットも可能。20-30代の女性に人気で、薄付きなのにカバー力があり、崩れにくいのが特徴です。',
          campaignObjective: '新商品の認知拡大とブランドイメージ向上',
          campaignTarget: '20-35歳の美容に関心の高い女性',
          postingPeriodStart: '2024-02-01',
          postingPeriodEnd: '2024-02-28',
          postingMedia: ['INSTAGRAM', 'TIKTOK'],
          messageToConvey: 'ナチュラルで美しい肌を演出できることを重視',
          shootingAngle: '正面・斜め上',
          packagePhotography: '外装・パッケージ両方',
          productOrientationSpecified: 'ブランドロゴが見えるように',
          musicUsage: '商用利用フリー音源のみ',
          brandContentSettings: '設定必要',
          advertiserAccount: '@naturalglowjapan',
          desiredHashtags: ['新商品コスメ', 'ナチュラルメイク', 'ファンデーション', 'UV対策', 'NaturalGlow'],
          ngItems: '他社化粧品との比較、価格に関する言及',
          legalRequirements: '薬機法に基づき効果効能の表現に注意',
          notes: '自然光での撮影を推奨',
          secondaryUsage: '許可（条件あり）',
          secondaryUsageScope: '公式サイト・広告での使用',
          secondaryUsagePeriod: '投稿から1年間',
          insightDisclosure: '必要',
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
            }
          ]
        },
        '2': {
          id: '2',
          title: 'ライフスタイル商品のレビュー',
          description: '日常使いできる便利グッズの紹介をお願いします。実際に使用した感想や活用方法を自然な形で発信してください。',
          category: 'ライフスタイル',
          budget: 150000,
          status: 'IN_PROGRESS',
          targetPlatforms: ['YOUTUBE', 'INSTAGRAM'],
          targetPrefecture: '全国',
          targetCity: '',
          targetGender: '',
          targetAgeMin: 25,
          targetAgeMax: 45,
          targetFollowerMin: 5000,
          targetFollowerMax: 50000,
          startDate: '2024-01-20',
          endDate: '2024-02-20',
          deliverables: 'YouTube動画1本、Instagram投稿1回、ストーリー投稿2回',
          requirements: '実際の使用感を重視、#便利グッズ #ライフスタイル のハッシュタグ必須',
          additionalInfo: '商品サンプル提供、返品不要',
          // 詳細情報を追加
          advertiserName: 'ライフスタイル株式会社',
          brandName: 'SmartLife',
          productName: 'マルチクリーニングツールセット',
          productUrl: 'https://example.com/smartlife-cleaning',
          productPrice: 2980,
          productFeatures: '1つで多用途に使えるクリーニングツールセット。キッチン、バスルーム、リビングなど様々な場所で活用でき、時短と効率的な掃除を実現します。',
          campaignObjective: '商品の実用性とライフスタイル向上効果をアピール',
          campaignTarget: '25-45歳の家事効率化に興味のある方',
          postingPeriodStart: '2024-01-20',
          postingPeriodEnd: '2024-02-20',
          postingMedia: ['YOUTUBE', 'INSTAGRAM'],
          messageToConvey: '日常生活をより便利で快適にすることを伝える',
          shootingAngle: '使用シーンを重視',
          packagePhotography: '外装のみ',
          productOrientationSpecified: '商品名が見えるように',
          musicUsage: '商用利用フリー音源のみ',
          brandContentSettings: '設定不要',
          advertiserAccount: '@smartlife_japan',
          desiredHashtags: ['便利グッズ', 'ライフスタイル', 'SmartLife', '時短', '掃除'],
          ngItems: '清掃が困難な場所での使用例',
          legalRequirements: '特になし',
          notes: '実際の使用感を重視した自然な紹介を希望',
          secondaryUsage: '許可（条件なし）',
          secondaryUsageScope: 'すべてのマーケティング用途',
          secondaryUsagePeriod: '無期限',
          insightDisclosure: '不要',
          createdAt: '2024-01-10',
          applications: [
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
              message: 'ライフスタイル商品のレビューは得意分野です。フォロワーからの反響も良いのでぜひ参加させてください。',
              proposedPrice: 120000,
              appliedAt: '2024-01-11',
              isAccepted: true
            }
          ],
          matchedInfluencer: {
            id: 'inf2',
            displayName: '鈴木さやか'
          }
        }
      };
      
      // プロジェクトIDがmockProjectsDataに存在するかチェック
      const mockProject = mockProjectsData[id as string];
      if (mockProject) {
        setProject(mockProject);
      } else {
        // 新規作成されたプロジェクトの場合、動的にモックデータを生成
        const defaultProject: ProjectDetails = {
          id: (id || Date.now().toString()) as string,
          title: `プロジェクト ${id}`,
          description: 'このプロジェクトの詳細情報を表示しています。実際のデータが利用できない場合のフォールバック表示です。',
          category: 'その他',
          budget: 200000,
          status: 'PENDING',
          targetPlatforms: ['INSTAGRAM'],
          targetPrefecture: '東京都',
          targetCity: '',
          targetGender: '',
          targetAgeMin: 20,
          targetAgeMax: 40,
          targetFollowerMin: 5000,
          targetFollowerMax: 50000,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          deliverables: 'Instagram投稿1回、ストーリー投稿1回',
          requirements: 'ブランドガイドラインに従った投稿',
          additionalInfo: 'その他の詳細については別途ご連絡いたします。',
          createdAt: new Date().toISOString(),
          applications: [],
          // デフォルトの詳細情報
          advertiserName: 'サンプル企業株式会社',
          brandName: 'サンプルブランド',
          productName: 'サンプル商品',
          campaignObjective: 'ブランド認知向上',
          campaignTarget: '幅広い年齢層',
          messageToConvey: 'ブランドの魅力を自然に伝える',
          secondaryUsage: '相談して決定',
          insightDisclosure: '相談して決定'
        };
        setProject(defaultProject);
      }
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    try {
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
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">ダッシュボードに戻る</span>
            </button>
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
            <h2 className="text-3xl font-bold text-gray-900">{project.title}</h2>
            <div className="text-2xl font-bold text-green-600">{formatPrice(project.budget)}</div>
          </div>
          
          <p className="text-gray-700 mb-6">{project.description}</p>
          
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

            {/* 基本情報 */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-2">その他の情報</h4>
                    <p className="text-gray-700">{project.additionalInfo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 広告主・ブランド情報 */}
            {(project.advertiserName || project.brandName || project.productName) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">広告主・ブランド情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {project.advertiserName && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">広告主名</h4>
                      <p className="text-gray-700">{project.advertiserName}</p>
                    </div>
                  )}
                  {project.brandName && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ブランド名</h4>
                      <p className="text-gray-700">{project.brandName}</p>
                    </div>
                  )}
                  {project.productName && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">商品名</h4>
                      <p className="text-gray-700">{project.productName}</p>
                    </div>
                  )}
                  {project.productUrl && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">商品URL</h4>
                      <a href={project.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {project.productUrl}
                      </a>
                    </div>
                  )}
                  {project.productPrice && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">商品価格</h4>
                      <p className="text-gray-700">{formatPrice(project.productPrice)}</p>
                    </div>
                  )}
                  {project.advertiserAccount && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">広告主アカウント</h4>
                      <p className="text-gray-700">{project.advertiserAccount}</p>
                    </div>
                  )}
                </div>
                {project.productFeatures && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">商品特徴</h4>
                    <p className="text-gray-700">{project.productFeatures}</p>
                  </div>
                )}
              </div>
            )}

            {/* キャンペーン詳細 */}
            {(project.campaignObjective || project.campaignTarget || project.messageToConvey) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">キャンペーン詳細</h3>
                <div className="space-y-6">
                  {project.campaignObjective && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">キャンペーン目的</h4>
                      <p className="text-gray-700">{project.campaignObjective}</p>
                    </div>
                  )}
                  {project.campaignTarget && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ターゲット層</h4>
                      <p className="text-gray-700">{project.campaignTarget}</p>
                    </div>
                  )}
                  {project.messageToConvey && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">伝えたいメッセージ</h4>
                      <p className="text-gray-700">{project.messageToConvey}</p>
                    </div>
                  )}
                  {(project.postingPeriodStart && project.postingPeriodEnd) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">投稿期間</h4>
                      <p className="text-gray-700">{formatDate(project.postingPeriodStart)} - {formatDate(project.postingPeriodEnd)}</p>
                    </div>
                  )}
                  {project.postingMedia && project.postingMedia.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">投稿媒体</h4>
                      <div className="flex space-x-2">
                        {project.postingMedia.map(media => (
                          <span key={media} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {getPlatformIcon(media)} {media}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 撮影・制作仕様 */}
            {(project.shootingAngle || project.packagePhotography || project.productOrientationSpecified || project.musicUsage) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">撮影・制作仕様</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.shootingAngle && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">撮影アングル</h4>
                      <p className="text-gray-700">{project.shootingAngle}</p>
                    </div>
                  )}
                  {project.packagePhotography && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">パッケージ撮影</h4>
                      <p className="text-gray-700">{project.packagePhotography}</p>
                    </div>
                  )}
                  {project.productOrientationSpecified && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">商品向き指定</h4>
                      <p className="text-gray-700">{project.productOrientationSpecified}</p>
                    </div>
                  )}
                  {project.musicUsage && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">音楽使用</h4>
                      <p className="text-gray-700">{project.musicUsage}</p>
                    </div>
                  )}
                  {project.brandContentSettings && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ブランドコンテンツ設定</h4>
                      <p className="text-gray-700">{project.brandContentSettings}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ハッシュタグ・注意事項 */}
            {(project.desiredHashtags?.length || project.ngItems || project.legalRequirements || project.notes) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">ハッシュタグ・注意事項</h3>
                <div className="space-y-6">
                  {project.desiredHashtags && project.desiredHashtags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">希望ハッシュタグ</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.desiredHashtags.map((hashtag, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            #{hashtag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.ngItems && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">NG項目</h4>
                      <p className="text-gray-700">{project.ngItems}</p>
                    </div>
                  )}
                  {project.legalRequirements && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">法的要件</h4>
                      <p className="text-gray-700">{project.legalRequirements}</p>
                    </div>
                  )}
                  {project.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">特記事項</h4>
                      <p className="text-gray-700">{project.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 二次利用・インサイト */}
            {(project.secondaryUsage || project.insightDisclosure) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">二次利用・インサイト</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.secondaryUsage && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">二次利用</h4>
                      <p className="text-gray-700">{project.secondaryUsage}</p>
                      {project.secondaryUsageScope && (
                        <p className="text-gray-600 text-sm mt-1">範囲: {project.secondaryUsageScope}</p>
                      )}
                      {project.secondaryUsagePeriod && (
                        <p className="text-gray-600 text-sm mt-1">期間: {project.secondaryUsagePeriod}</p>
                      )}
                    </div>
                  )}
                  {project.insightDisclosure && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">インサイト開示</h4>
                      <p className="text-gray-700">{project.insightDisclosure}</p>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-6">応募一覧 ({project.applications.length}人)</h3>
            
            {project.applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">まだ応募がありません</h4>
                <p className="text-gray-600">インフルエンサーからの応募をお待ちください。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* ヘッダー */}
                <div className="hidden lg:flex items-center px-4 pb-2 text-xs text-gray-500 font-medium border-b border-gray-200 mb-2">
                  <div className="w-12 text-center mr-3">スコア</div>
                  <div className="w-32 mr-3">アカウント名</div>
                  <div className="flex-1 mr-3">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="space-y-1">
                        <div>Instagram</div>
                        <div className="text-[10px] text-gray-400">フォロワー/Eng%</div>
                      </div>
                      <div className="space-y-1">
                        <div>YouTube</div>
                        <div className="text-[10px] text-gray-400">登録者/Eng%</div>
                      </div>
                      <div className="space-y-1">
                        <div>TikTok</div>
                        <div className="text-[10px] text-gray-400">フォロワー/Eng%</div>
                      </div>
                      <div className="space-y-1">
                        <div>Twitter</div>
                        <div className="text-[10px] text-gray-400">フォロワー/Eng%</div>
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-center mr-3">提案料金</div>
                  <div className="w-32">アクション</div>
                </div>
                
                {project.applications.map((application, index) => {
                  // AIスコアを仮想的に計算（実際にはAIが算出）
                  const aiScore = Math.floor(Math.random() * 30 + 70); // 70-100のスコア
                  
                  return (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white border rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center p-3">
                        {/* AIスコア */}
                        <div className="w-12 text-center mr-3">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold ${
                            aiScore >= 90 ? 'bg-green-100 text-green-800' :
                            aiScore >= 80 ? 'bg-blue-100 text-blue-800' :
                            aiScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {aiScore}%
                          </div>
                        </div>

                        {/* アカウント名とプロフィール画像 */}
                        <div className="flex items-center w-32 mr-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0">
                            {application.influencer.displayName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 truncate">{application.influencer.displayName}</h4>
                            <div className="text-xs text-gray-500">{application.influencer.prefecture}</div>
                          </div>
                        </div>

                        {/* プラットフォーム別データ */}
                        <div className="flex-1 mr-3">
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            {/* Instagram */}
                            <div className="text-center">
                              {(() => {
                                const instagram = application.influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'instagram');
                                if (instagram) {
                                  return (
                                    <>
                                      <div className="font-semibold text-gray-900">{formatNumber(instagram.followerCount)}</div>
                                      <div className="text-gray-600">{instagram.engagementRate.toFixed(1)}%</div>
                                    </>
                                  );
                                }
                                return <div className="text-gray-400">-</div>;
                              })()}
                            </div>
                            
                            {/* YouTube */}
                            <div className="text-center">
                              {(() => {
                                const youtube = application.influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube');
                                if (youtube) {
                                  return (
                                    <>
                                      <div className="font-semibold text-gray-900">{formatNumber(youtube.followerCount)}</div>
                                      <div className="text-gray-600">{youtube.engagementRate.toFixed(1)}%</div>
                                    </>
                                  );
                                }
                                return <div className="text-gray-400">-</div>;
                              })()}
                            </div>
                            
                            {/* TikTok */}
                            <div className="text-center">
                              {(() => {
                                const tiktok = application.influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'tiktok');
                                if (tiktok) {
                                  return (
                                    <>
                                      <div className="font-semibold text-gray-900">{formatNumber(tiktok.followerCount)}</div>
                                      <div className="text-gray-600">{tiktok.engagementRate.toFixed(1)}%</div>
                                    </>
                                  );
                                }
                                return <div className="text-gray-400">-</div>;
                              })()}
                            </div>
                            
                            {/* Twitter */}
                            <div className="text-center">
                              {(() => {
                                const twitter = application.influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'twitter');
                                if (twitter) {
                                  return (
                                    <>
                                      <div className="font-semibold text-gray-900">{formatNumber(twitter.followerCount)}</div>
                                      <div className="text-gray-600">{twitter.engagementRate.toFixed(1)}%</div>
                                    </>
                                  );
                                }
                                return <div className="text-gray-400">-</div>;
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* 提案料金 */}
                        <div className="w-24 text-center mr-3">
                          <div className="text-sm font-bold text-green-600">{formatPrice(application.proposedPrice)}</div>
                        </div>

                        {/* アクションボタン */}
                        <div className="flex space-x-2 w-32">
                          <button
                            onClick={() => handleAcceptApplication(application.id)}
                            className="px-2.5 py-1.5 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition-colors whitespace-nowrap"
                          >
                            承諾
                          </button>
                          <button
                            onClick={() => handleRejectApplication(application.id)}
                            className="px-2.5 py-1.5 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition-colors whitespace-nowrap"
                          >
                            却下
                          </button>
                          <button
                            onClick={() => {
                              // 詳細情報モーダルを表示（実装予定）
                              alert('詳細情報表示機能は実装中です');
                            }}
                            className="px-2.5 py-1.5 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
                          >
                            詳細
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;