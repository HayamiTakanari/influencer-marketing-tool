import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  createBulkInquiry,
  getMyBulkInquiries,
  getMyInquiryResponses,
  updateInquiryResponse,
  getBulkInquiryById,
  getInquiryStats,
  BulkInquiry,
  InquiryResponse
} from '../services/v3-api';
import { searchInfluencers, getAIRecommendedInfluencers } from '../services/api';

const BulkInquiryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'sent' | 'received'>('create');
  const [inquiries, setInquiries] = useState<BulkInquiry[]>([]);
  const [responses, setResponses] = useState<InquiryResponse[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<InquiryResponse | null>(null);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [recommendedInfluencers, setRecommendedInfluencers] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAIMode, setIsAIMode] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const [inquiryForm, setInquiryForm] = useState({
    title: '',
    description: '',
    budget: 0,
    deadline: '',
    requiredServices: [] as string[],
  });

  const [responseForm, setResponseForm] = useState({
    status: 'PENDING' as const,
    proposedPrice: 0,
    message: '',
    availableFrom: '',
    availableTo: '',
  });

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

  const statusLabels = {
    PENDING: '返答待ち',
    ACCEPTED: '承諾',
    DECLINED: '辞退',
    EXPIRED: '期限切れ',
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    DECLINED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role === 'CLIENT' || parsedUser.role === 'COMPANY') {
      setActiveTab('create');
    } else if (parsedUser.role === 'INFLUENCER') {
      setActiveTab('received');
    } else {
      router.push('/dashboard');
      return;
    }

    fetchData();
    if (parsedUser.role === 'CLIENT' || parsedUser.role === 'COMPANY') {
      fetchInfluencers();
    }
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (userData.role === 'CLIENT' || userData.role === 'COMPANY') {
        const [inquiriesData, statsData] = await Promise.all([
          getMyBulkInquiries(),
          getInquiryStats()
        ]);
        setInquiries(inquiriesData.inquiries || []);
        setStats(statsData);
      } else if (userData.role === 'INFLUENCER') {
        const responsesData = await getMyInquiryResponses();
        setResponses(responsesData.responses || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchInfluencers = async () => {
    try {
      const data = await searchInfluencers({});
      setInfluencers(data.influencers || []);
    } catch (err: any) {
      console.error('Error fetching influencers:', err);
    }
  };

  const getAIRecommendations = async () => {
    if (!inquiryForm.title || !inquiryForm.description) {
      setError('タイトルと説明を入力してからAIレコメンドを実行してください。');
      return;
    }

    try {
      setAiLoading(true);
      setError('');
      
      const aiData = await getAIRecommendedInfluencers({
        title: inquiryForm.title,
        description: inquiryForm.description,
        requiredServices: inquiryForm.requiredServices,
        budget: inquiryForm.budget > 0 ? inquiryForm.budget : undefined
      });

      setRecommendedInfluencers(aiData.influencers || []);
      setAiAnalysis(aiData.analysis || null);
      
      // 高スコアのインフルエンサーを自動選択
      const highScoreInfluencers = aiData.influencers
        .filter((inf: any) => inf.aiScore >= 80)
        .map((inf: any) => inf.id);
      setSelectedInfluencers(highScoreInfluencers);
      
    } catch (err: any) {
      console.error('Error getting AI recommendations:', err);
      setError('AIレコメンドの取得に失敗しました。');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInfluencers.length === 0) {
      setError('問い合わせ対象のインフルエンサーを選択してください。');
      return;
    }

    try {
      const submitData = {
        ...inquiryForm,
        targetInfluencers: selectedInfluencers,
        budget: inquiryForm.budget > 0 ? inquiryForm.budget : undefined,
        deadline: inquiryForm.deadline || undefined,
      };

      await createBulkInquiry(submitData);
      
      // フォームリセット
      setInquiryForm({
        title: '',
        description: '',
        budget: 0,
        deadline: '',
        requiredServices: [],
      });
      setSelectedInfluencers([]);
      
      setActiveTab('sent');
      fetchData();
    } catch (err: any) {
      console.error('Error creating inquiry:', err);
      setError('問い合わせの送信に失敗しました。');
    }
  };

  const handleUpdateResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResponse) return;

    try {
      const submitData = {
        ...responseForm,
        proposedPrice: responseForm.proposedPrice > 0 ? responseForm.proposedPrice : undefined,
        availableFrom: responseForm.availableFrom || undefined,
        availableTo: responseForm.availableTo || undefined,
      };

      await updateInquiryResponse(selectedResponse.id, submitData);
      setShowResponseModal(false);
      setSelectedResponse(null);
      fetchData();
    } catch (err: any) {
      console.error('Error updating response:', err);
      setError('回答の更新に失敗しました。');
    }
  };

  const openResponseModal = (response: InquiryResponse) => {
    setSelectedResponse(response);
    setResponseForm({
      status: response.status,
      proposedPrice: response.proposedPrice || 0,
      message: response.message || '',
      availableFrom: response.availableFrom ? response.availableFrom.split('T')[0] : '',
      availableTo: response.availableTo ? response.availableTo.split('T')[0] : '',
    });
    setShowResponseModal(true);
  };

  const toggleInfluencer = (influencerId: string) => {
    setSelectedInfluencers(prev => 
      prev.includes(influencerId) 
        ? prev.filter(id => id !== influencerId)
        : [...prev, influencerId]
    );
  };

  const toggleService = (service: string) => {
    setInquiryForm(prev => ({
      ...prev,
      requiredServices: prev.requiredServices.includes(service)
        ? prev.requiredServices.filter(s => s !== service)
        : [...prev.requiredServices, service]
    }));
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
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8"
        >
          一斉問い合わせ
        </motion.h1>

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

        {/* タブ */}
        <div className="flex space-x-4 mb-8">
          {(user?.role === 'CLIENT' || user?.role === 'COMPANY') && (
            <>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'create'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                問い合わせ作成
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'sent'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                送信済み
              </button>
            </>
          )}
          {user?.role === 'INFLUENCER' && (
            <button
              onClick={() => setActiveTab('received')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'received'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              受信済み
            </button>
          )}
        </div>

        {/* 問い合わせ作成タブ */}
        {activeTab === 'create' && (user?.role === 'CLIENT' || user?.role === 'COMPANY') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">新しい問い合わせを作成</h2>
            
            <form onSubmit={handleCreateInquiry} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル *
                  </label>
                  <input
                    type="text"
                    value={inquiryForm.title}
                    onChange={(e) => setInquiryForm({...inquiryForm, title: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="春の新商品プロモーション"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    予算（円）
                  </label>
                  <input
                    type="number"
                    value={inquiryForm.budget}
                    onChange={(e) => setInquiryForm({...inquiryForm, budget: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明 *
                </label>
                <textarea
                  value={inquiryForm.description}
                  onChange={(e) => setInquiryForm({...inquiryForm, description: e.target.value})}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="プロジェクトの詳細説明..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回答期限
                </label>
                <input
                  type="datetime-local"
                  value={inquiryForm.deadline}
                  onChange={(e) => setInquiryForm({...inquiryForm, deadline: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  必要なサービス *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(serviceTypeLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inquiryForm.requiredServices.includes(key)}
                        onChange={() => toggleService(key)}
                        className="rounded"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    問い合わせ対象インフルエンサー * ({selectedInfluencers.length}人選択中)
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={getAIRecommendations}
                      disabled={aiLoading || !inquiryForm.title || !inquiryForm.description}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>分析中...</span>
                        </>
                      ) : (
                        <>
                          <span>🤖</span>
                          <span>AIレコメンド</span>
                        </>
                      )}
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAIMode(true)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          isAIMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        AIモード
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAIMode(false)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          !isAIMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        手動選択
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI分析結果 */}
                {aiAnalysis && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <h4 className="font-semibold text-purple-900">AI分析結果</h4>
                    </div>
                    <p className="text-sm text-purple-800 mb-3">{aiAnalysis.recommendationSummary}</p>
                    {aiAnalysis.detectedKeywords && aiAnalysis.detectedKeywords.length > 0 && (
                      <div>
                        <p className="text-xs text-purple-700 mb-2">検出されたキーワード:</p>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.detectedKeywords.map((keyword: any, index: number) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              {keyword.category} ({keyword.score})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto border border-gray-300 rounded-xl p-4">
                  {(isAIMode ? recommendedInfluencers : influencers).map((influencer) => (
                    <label key={influencer.id} className={`flex items-center space-x-3 py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 border-l-4 ${
                      influencer.isRecommended ? 'border-l-green-500 bg-green-50' : 'border-l-transparent'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedInfluencers.includes(influencer.id)}
                        onChange={() => toggleInfluencer(influencer.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{influencer.displayName}</p>
                          {influencer.aiScore && (
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              influencer.aiScore >= 90 ? 'bg-green-100 text-green-800' :
                              influencer.aiScore >= 80 ? 'bg-blue-100 text-blue-800' :
                              influencer.aiScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              マッチ度: {influencer.aiScore}%
                            </div>
                          )}
                          {influencer.isRecommended && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              🌟 おすすめ
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{influencer.bio}</p>
                        <p className="text-xs text-gray-500">{influencer.categories?.join(', ')} | {influencer.prefecture}</p>
                        
                        {/* AIマッチング理由 */}
                        {influencer.matchReasons && influencer.matchReasons.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">マッチング理由:</p>
                            <div className="flex flex-wrap gap-1">
                              {influencer.matchReasons.map((reason: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* ソーシャルメディア情報 */}
                        {influencer.socialAccounts && influencer.socialAccounts.length > 0 && (
                          <div className="flex space-x-3 mt-2">
                            {influencer.socialAccounts.map((account: any, index: number) => (
                              <div key={index} className="text-xs text-gray-500">
                                {account.platform}: {account.followerCount?.toLocaleString()}人
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                  
                  {isAIMode && recommendedInfluencers.length === 0 && !aiLoading && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg mb-2">🤖</p>
                      <p>「AIレコメンド」ボタンをクリックして、最適なインフルエンサーを見つけましょう</p>
                      <p className="text-sm mt-1">タイトルと説明を入力後にご利用ください</p>
                    </div>
                  )}
                  
                  {!isAIMode && influencers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>インフルエンサーが見つかりませんでした</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  問い合わせを送信
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* 送信済みタブ */}
        {activeTab === 'sent' && (user?.role === 'CLIENT' || user?.role === 'COMPANY') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 統計情報 */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">総問い合わせ数</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalInquiries}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">総回答数</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.totalResponses}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">回答状況</h3>
                  <div className="space-y-1 text-sm">
                    {stats.responseStats?.map((stat: any) => (
                      <div key={stat.status} className="flex justify-between">
                        <span>{statusLabels[stat.status as keyof typeof statusLabels]}</span>
                        <span className="font-semibold">{stat._count.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 問い合わせ一覧 */}
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{inquiry.title}</h3>
                      <p className="text-gray-600">{inquiry.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </p>
                      {inquiry.budget && (
                        <p className="text-sm text-gray-600">
                          予算: ¥{inquiry.budget.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">必要なサービス:</p>
                    <div className="flex flex-wrap gap-2">
                      {inquiry.requiredServices.map((service) => (
                        <span key={service} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {serviceTypeLabels[service as keyof typeof serviceTypeLabels]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      回答状況 ({inquiry.responses.length}件)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {inquiry.responses.map((response) => (
                        <div key={response.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">{response.influencer.displayName}</p>
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[response.status]}`}>
                              {statusLabels[response.status]}
                            </span>
                          </div>
                          {response.proposedPrice && (
                            <p className="text-sm text-gray-600">
                              提案価格: ¥{response.proposedPrice.toLocaleString()}
                            </p>
                          )}
                          {response.message && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {response.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {inquiries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">まだ問い合わせを送信していません。</p>
                <p className="text-gray-500 mt-2">「問い合わせ作成」タブから新しい問い合わせを作成してください。</p>
              </div>
            )}
          </motion.div>
        )}

        {/* 受信済みタブ */}
        {activeTab === 'received' && user?.role === 'INFLUENCER' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {responses.map((response) => (
              <div key={response.id} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{response.inquiry.title}</h3>
                    <p className="text-gray-600">{response.inquiry.client.companyName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${statusColors[response.status]}`}>
                      {statusLabels[response.status]}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(response.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{response.inquiry.description}</p>

                {response.inquiry.budget && (
                  <p className="text-sm text-gray-600 mb-2">
                    予算: ¥{response.inquiry.budget.toLocaleString()}
                  </p>
                )}

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">必要なサービス:</p>
                  <div className="flex flex-wrap gap-2">
                    {response.inquiry.requiredServices.map((service) => (
                      <span key={service} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {serviceTypeLabels[service as keyof typeof serviceTypeLabels]}
                      </span>
                    ))}
                  </div>
                </div>

                {response.status === 'PENDING' && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => openResponseModal(response)}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      回答する
                    </button>
                  </div>
                )}

                {response.status !== 'PENDING' && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <p className="font-medium text-sm text-gray-700 mb-2">あなたの回答:</p>
                    {response.proposedPrice && (
                      <p className="text-sm text-gray-600">
                        提案価格: ¥{response.proposedPrice.toLocaleString()}
                      </p>
                    )}
                    {response.message && (
                      <p className="text-sm text-gray-700 mt-1">{response.message}</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {responses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">まだ問い合わせを受信していません。</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* 回答モーダル */}
      {showResponseModal && selectedResponse && (
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
              <h2 className="text-2xl font-bold text-gray-800">問い合わせに回答</h2>
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedResponse(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-lg mb-2">{selectedResponse.inquiry.title}</h3>
              <p className="text-gray-600 mb-2">{selectedResponse.inquiry.description}</p>
              <p className="text-sm text-gray-500">
                {selectedResponse.inquiry.client.companyName}
              </p>
            </div>

            <form onSubmit={handleUpdateResponse} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回答 *
                </label>
                <select
                  value={responseForm.status}
                  onChange={(e) => setResponseForm({...responseForm, status: e.target.value as any})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">検討中</option>
                  <option value="ACCEPTED">承諾</option>
                  <option value="DECLINED">辞退</option>
                </select>
              </div>

              {responseForm.status === 'ACCEPTED' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提案価格（円）
                    </label>
                    <input
                      type="number"
                      value={responseForm.proposedPrice}
                      onChange={(e) => setResponseForm({...responseForm, proposedPrice: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100000"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        対応可能開始日
                      </label>
                      <input
                        type="date"
                        value={responseForm.availableFrom}
                        onChange={(e) => setResponseForm({...responseForm, availableFrom: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        対応可能終了日
                      </label>
                      <input
                        type="date"
                        value={responseForm.availableTo}
                        onChange={(e) => setResponseForm({...responseForm, availableTo: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ
                </label>
                <textarea
                  value={responseForm.message}
                  onChange={(e) => setResponseForm({...responseForm, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="詳細なメッセージ..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedResponse(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  回答を送信
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default BulkInquiryPage;