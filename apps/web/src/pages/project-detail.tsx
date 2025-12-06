import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { checkAndRedirectForInvoice } from '../utils/invoiceValidation';
import { checkAndRedirectForNDA } from '../utils/ndaValidation';

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

  // 成約状態を判定する関数
  const isContractEstablished = (project: ProjectDetails, currentUser: any): boolean => {
    if (!project || !currentUser) return false;
    
    // インフルエンサーの場合、自分がマッチングされており、かつプロジェクトが進行中以上の状態
    if (currentUser.role === 'INFLUENCER') {
      return project.matchedInfluencer?.id === currentUser.id && 
             (project.status === 'IN_PROGRESS' || project.status === 'COMPLETED');
    }
    
    // 企業の場合は常に表示
    return true;
  };
  const [filters, setFilters] = useState({
    minFollowers: 0,
    maxFollowers: 1000000,
    minEngagement: 0,
    maxEngagement: 10,
    minViews: 0,
    maxViews: 1000000,
    platforms: [] as string[],
    sortBy: 'aiScore' // 'aiScore', 'followers', 'engagement', 'price'
  });
  const [showFilters, setShowFilters] = useState(false);
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
      
      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
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
      setError('プロジェクト詳細の取得に失敗しました。');
      setProject(null);
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

  const applyFilters = (applications: Application[]) => {
    return applications.filter(application => {
      const totalFollowers = application.influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
      const avgEngagement = application.influencer.socialAccounts.length > 0 
        ? application.influencer.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / application.influencer.socialAccounts.length
        : 0;
      
      // 平均再生数を算出
      let avgViews = 0;
      if (application.influencer.socialAccounts.length > 0) {
        const youtubeAcc = application.influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube');
        if (youtubeAcc) {
          avgViews = Math.round(youtubeAcc.followerCount * 0.1);
        } else {
          avgViews = Math.round(totalFollowers * (avgEngagement / 100));
        }
      }
      
      // フォロワー数フィルター
      if (totalFollowers < filters.minFollowers || totalFollowers > filters.maxFollowers) {
        return false;
      }
      
      // エンゲージメント率フィルター
      if (avgEngagement < filters.minEngagement || avgEngagement > filters.maxEngagement) {
        return false;
      }
      
      // 平均再生数フィルター
      if (avgViews < filters.minViews || avgViews > filters.maxViews) {
        return false;
      }
      
      // プラットフォームフィルター
      if (filters.platforms.length > 0) {
        const hasMatchingPlatform = application.influencer.socialAccounts.some(acc => 
          filters.platforms.includes(acc.platform.toUpperCase())
        );
        if (!hasMatchingPlatform) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'followers':
          const aFollowers = a.influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
          const bFollowers = b.influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
          return bFollowers - aFollowers;
        case 'engagement':
          const aEngagement = a.influencer.socialAccounts.length > 0 
            ? a.influencer.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / a.influencer.socialAccounts.length
            : 0;
          const bEngagement = b.influencer.socialAccounts.length > 0 
            ? b.influencer.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / b.influencer.socialAccounts.length
            : 0;
          return bEngagement - aEngagement;
        case 'price':
          return a.proposedPrice - b.proposedPrice;
        default: // aiScore
          const aScore = Math.floor(Math.random() * 30 + 70);
          const bScore = Math.floor(Math.random() * 30 + 70);
          return bScore - aScore;
      }
    });
  };

  const resetFilters = () => {
    setFilters({
      minFollowers: 0,
      maxFollowers: 1000000,
      minEngagement: 0,
      maxEngagement: 10,
      minViews: 0,
      maxViews: 1000000,
      platforms: [],
      sortBy: 'aiScore'
    });
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
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8 transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{project.title}</h2>
            <div className="flex items-center space-x-4">
              {/* マッチング成立時のメッセージボタン */}
              {(project.status === 'MATCHED' || project.status === 'IN_PROGRESS' || project.status === 'COMPLETED') && project.matchedInfluencer && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // NDAチェック（企業・インフルエンサー両方）
                      if (!checkAndRedirectForNDA(user, router)) {
                        return;
                      }
                      // インフルエンサーの場合はインボイス情報チェック
                      if (user?.role === 'INFLUENCER' && !checkAndRedirectForInvoice(user, router)) {
                        return;
                      }
                      router.push(`/project-chat/${project.id}`);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 hover:scale-105 transition-all shadow-lg flex items-center space-x-2"
                  >
                    <span>💬</span>
                    <span>チャット</span>
                  </button>
                </div>
              )}
              <div className="text-2xl font-bold text-green-600">{formatPrice(project.budget)}</div>
            </div>
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
              <div className="text-lg font-bold text-gray-900">
                {project.matchedInfluencer ? 'マッチング成立' : `${project.applications.length}件`}
              </div>
              <div className="text-gray-600 text-sm">
                {project.matchedInfluencer ? 'ステータス' : '応募数'}
              </div>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            {project.targetPlatforms.map(platform => (
              <span key={platform} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {getPlatformIcon(platform)} {platform}
              </span>
            ))}
          </div>
          
          {/* マッチング情報 */}
          {project.matchedInfluencer && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{project.matchedInfluencer.displayName.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      ✅ {project.matchedInfluencer.displayName} とマッチング成立
                    </div>
                    <div className="text-sm text-gray-600">
                      ステータス: <span className={`font-medium ${
                        project.status === 'MATCHED' ? 'text-blue-600' :
                        project.status === 'IN_PROGRESS' ? 'text-green-600' :
                        project.status === 'COMPLETED' ? 'text-purple-600' : 'text-gray-600'
                      }`}>
                        {project.status === 'MATCHED' ? 'マッチング済み' :
                         project.status === 'IN_PROGRESS' ? '進行中' :
                         project.status === 'COMPLETED' ? '完了' : project.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      // NDAチェック（企業・インフルエンサー両方）
                      if (!checkAndRedirectForNDA(user, router)) {
                        return;
                      }
                      // インフルエンサーの場合はインボイス情報チェック
                      if (user?.role === 'INFLUENCER' && !checkAndRedirectForInvoice(user, router)) {
                        return;
                      }
                      router.push(`/project-chat/${project.id}`);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    💬 チャット
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-2 shadow-xl mb-8 transition-all duration-500">
          <div className="flex space-x-2">
            {[
              { key: 'overview', label: '詳細情報', icon: '📋' },
              { key: 'applications', label: '応募一覧', icon: '📝' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 詳細情報タブ */}
        {activeTab === 'overview' && (
          <div className="space-y-6 transition-all duration-500">
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

            {/* 広告主・ブランド情報 - 成約後のみ表示 */}
            {!isContractEstablished(project, user) && user?.role === 'INFLUENCER' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8 shadow-xl">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">広告主情報</h3>
                  <p className="text-yellow-700">
                    広告主・ブランドの詳細情報は、プロジェクト成約後に表示されます。<br />
                    まずは案件内容をご確認いただき、ご興味があれば応募してください。
                  </p>
                </div>
              </div>
            )}
            
            {isContractEstablished(project, user) && (project.advertiserName || project.brandName || project.productName) && (
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
          </div>
        )}

        {/* 応募一覧タブ */}
        {activeTab === 'applications' && (
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                応募一覧 ({applyFilters(project.applications).length}/{project.applications.length}人)
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    showFilters 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">🔍</span>
                  フィルター
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  リセット
                </button>
              </div>
            </div>

            {/* フィルターセクション */}
            {showFilters && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6 transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* フォロワー数フィルター */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">フォロワー数</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="最小"
                        value={filters.minFollowers || ''}
                        onChange={(e) => setFilters({...filters, minFollowers: parseInt(e.target.value) || 0})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="最大"
                        value={filters.maxFollowers || ''}
                        onChange={(e) => setFilters({...filters, maxFollowers: parseInt(e.target.value) || 1000000})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* エンゲージメント率フィルター */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">エンゲージメント率(%)</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="最小"
                        value={filters.minEngagement || ''}
                        onChange={(e) => setFilters({...filters, minEngagement: parseFloat(e.target.value) || 0})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="最大"
                        value={filters.maxEngagement || ''}
                        onChange={(e) => setFilters({...filters, maxEngagement: parseFloat(e.target.value) || 10})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 平均再生数フィルター */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">平均再生数</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="最小"
                        value={filters.minViews || ''}
                        onChange={(e) => setFilters({...filters, minViews: parseInt(e.target.value) || 0})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="最大"
                        value={filters.maxViews || ''}
                        onChange={(e) => setFilters({...filters, maxViews: parseInt(e.target.value) || 1000000})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* ソートフィルター */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">並び順</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="aiScore">AIスコア順</option>
                      <option value="followers">フォロワー数順</option>
                      <option value="engagement">エンゲージメント順</option>
                      <option value="price">料金順</option>
                    </select>
                  </div>
                </div>

                {/* プラットフォームフィルター */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">プラットフォーム</label>
                  <div className="flex flex-wrap gap-2">
                    {['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'].map(platform => (
                      <button
                        key={platform}
                        onClick={() => {
                          const newPlatforms = filters.platforms.includes(platform)
                            ? filters.platforms.filter(p => p !== platform)
                            : [...filters.platforms, platform];
                          setFilters({...filters, platforms: newPlatforms});
                        }}
                        className={`px-3 py-1 text-sm rounded-full font-medium transition-all ${
                          filters.platforms.includes(platform)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {getPlatformIcon(platform)} {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
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
                
                {applyFilters(project.applications).map((application, index) => {
                  // AIスコアを仮想的に計算（実際にはAIが算出）
                  const aiScore = Math.floor(Math.random() * 30 + 70); // 70-100のスコア
                  
                  return (
                    <div
                      key={application.id}
                      className="bg-white border rounded-lg hover:shadow-md transition-all duration-300"
                      style={{ animationDelay: `${index * 0.05}s` }}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;