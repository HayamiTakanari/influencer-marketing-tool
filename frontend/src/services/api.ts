import axios from 'axios';

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // If explicitly set via environment variable, use that
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If we're on Vercel (production), use a mock API service
    if (hostname.includes('vercel.app')) {
      // For now, use a mock backend service
      return 'https://jsonplaceholder.typicode.com'; // Temporary fallback
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:10000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL:', API_BASE_URL);
console.log('process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Window hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = async (email: string, password: string) => {
  console.log('Login API called with:', { email, baseURL: API_BASE_URL });
  
  // Check if we're in Vercel production environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock authentication for Vercel environment');
    
    // Mock authentication for demo purposes
    const validCredentials = [
      { email: 'company@test.com', password: 'test123', role: 'COMPANY', id: '1', name: 'テスト企業' },
      { email: 'test.company2@example.com', password: 'test123', role: 'CLIENT', id: '3', name: 'テスト企業2' },
      { email: 'influencer@test.com', password: 'test123', role: 'INFLUENCER', id: '2', name: 'テストインフルエンサー' }
    ];
    
    const user = validCredentials.find(cred => cred.email === email && cred.password === password);
    
    if (user) {
      const mockResponse = {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        token: 'mock-jwt-token-vercel'
      };
      console.log('Mock login successful:', mockResponse);
      return mockResponse;
    } else {
      const error = new Error('認証に失敗しました');
      (error as any).response = {
        status: 401,
        data: { error: 'メールアドレスまたはパスワードが間違っています。' }
      };
      throw error;
    }
  }
  
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Influencer Search
// パフォーマンス最適化：キャッシュとページネーション対応
const influencerCache = new Map();

export const searchInfluencers = async (filters: any = {}) => {
  // キャッシュキーを生成
  const cacheKey = JSON.stringify(filters);
  
  // キャッシュから取得（5分間有効）
  if (influencerCache.has(cacheKey)) {
    const cached = influencerCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      console.log('Using cached influencer data');
      return cached.data;
    }
  }
  
  // Vercel環境ではパフォーマンステスト用のモックデータ
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock data for influencer search with pagination');
    
    // パフォーマンステスト用設定
    const totalCount = filters.testLargeData ? 10000 : 50;
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalCount);
    
    // 大量データのシミュレーション
    const mockInfluencers = Array.from({ length: endIndex - startIndex }, (_, index) => {
      const actualIndex = startIndex + index;
      return {
        id: `mock-influencer-${actualIndex}`,
        displayName: `テストインフルエンサー${actualIndex + 1}`,
        bio: `プロフィール${actualIndex + 1}：美容・ライフスタイル系インフルエンサーです。`,
        categories: ['美容', 'ライフスタイル', 'ファッション'][actualIndex % 3] ? ['美容', 'ライフスタイル', 'ファッション'] : ['グルメ', '旅行'],
        prefecture: ['東京都', '大阪府', '神奈川県', '愛知県', '福岡県'][actualIndex % 5],
        priceMin: (actualIndex % 10 + 1) * 10000,
        priceMax: (actualIndex % 10 + 1) * 50000,
        socialAccounts: [
          {
            platform: 'INSTAGRAM',
            followerCount: Math.floor(Math.random() * 100000) + 1000,
          }
        ],
      };
    });
    
    const result = {
      influencers: mockInfluencers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
      performance: {
        responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
        cacheHit: false,
      }
    };
    
    // キャッシュに保存
    influencerCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  const response = await api.get('/influencers/search', { params: filters });
  
  // キャッシュに保存
  influencerCache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data;
};

// AIによるインフルエンサーレコメンド機能
export const getAIRecommendedInfluencers = async (inquiryData: {
  title: string;
  description: string;
  requiredServices: string[];
  budget?: number;
}) => {
  // Mock response for Vercel environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock AI recommendations for Vercel environment');
    
    // 問い合わせ内容を分析してマッチング
    const analysisKeywords = {
      beauty: ['美容', 'コスメ', '化粧品', 'スキンケア', 'メイク', 'beauty', 'cosmetic'],
      lifestyle: ['ライフスタイル', '日常', '暮らし', 'lifestyle', '生活'],
      fashion: ['ファッション', '服装', 'おしゃれ', 'fashion', 'style'],
      fitness: ['フィットネス', '運動', 'ダイエット', '健康', 'fitness', 'workout'],
      food: ['料理', '食べ物', 'グルメ', 'レシピ', 'food', 'cooking'],
      travel: ['旅行', '観光', 'travel', '旅'],
      tech: ['テクノロジー', 'ガジェット', 'tech', 'IT', 'デバイス']
    };

    const searchText = `${inquiryData.title} ${inquiryData.description}`.toLowerCase();
    
    // カテゴリ別のマッチングスコア算出
    const categoryScores: Record<string, number> = {};
    for (const [category, keywords] of Object.entries(analysisKeywords)) {
      categoryScores[category] = keywords.reduce((score, keyword) => {
        return score + (searchText.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);
    }

    // 最も関連性の高いカテゴリを特定
    const primaryCategory = Object.entries(categoryScores).reduce((a, b) => 
      categoryScores[a[0]] > categoryScores[b[0]] ? a : b
    )[0];

    const mockInfluencers = [
      {
        id: '1',
        displayName: '田中美咲',
        bio: '美容・ファッション系インフルエンサー。20代女性向けコンテンツ発信中。',
        categories: ['美容', 'ファッション'],
        prefecture: '東京都',
        priceMin: 50000,
        priceMax: 200000,
        user: { email: 'tanaka@example.com' },
        socialAccounts: [
          { platform: 'INSTAGRAM', followerCount: 35000, engagementRate: 3.5 },
          { platform: 'YOUTUBE', followerCount: 15000, engagementRate: 2.8 }
        ],
        aiScore: primaryCategory === 'beauty' || primaryCategory === 'fashion' ? 95 : 65,
        matchReasons: primaryCategory === 'beauty' || primaryCategory === 'fashion' 
          ? ['美容・ファッション分野の専門知識', '同世代女性への高い影響力', '高いエンゲージメント率']
          : ['多様なコンテンツ制作経験', '安定したフォロワー数']
      },
      {
        id: '2',
        displayName: '鈴木さやか',
        bio: 'ライフスタイル系クリエイター。料理、旅行、美容など幅広く発信。',
        categories: ['ライフスタイル', '美容', '料理'],
        prefecture: '大阪府',
        priceMin: 80000,
        priceMax: 300000,
        user: { email: 'suzuki@example.com' },
        socialAccounts: [
          { platform: 'INSTAGRAM', followerCount: 60000, engagementRate: 4.2 },
          { platform: 'TIKTOK', followerCount: 29000, engagementRate: 5.1 }
        ],
        aiScore: primaryCategory === 'lifestyle' || primaryCategory === 'food' ? 92 : 78,
        matchReasons: primaryCategory === 'lifestyle' || primaryCategory === 'food'
          ? ['ライフスタイル分野での豊富な実績', '複数プラットフォームでの影響力', '幅広い年齢層への訴求力']
          : ['幅広いカテゴリでの発信経験', '高いエンゲージメント率', '関西圏での影響力']
      },
      {
        id: '3',
        displayName: '佐藤健太',
        bio: 'フィットネス・健康系インフルエンサー。筋トレ、栄養指導を専門とする。',
        categories: ['フィットネス', '健康'],
        prefecture: '神奈川県',
        priceMin: 60000,
        priceMax: 250000,
        user: { email: 'sato@example.com' },
        socialAccounts: [
          { platform: 'YOUTUBE', followerCount: 85000, engagementRate: 6.2 },
          { platform: 'INSTAGRAM', followerCount: 42000, engagementRate: 4.8 }
        ],
        aiScore: primaryCategory === 'fitness' ? 98 : 45,
        matchReasons: primaryCategory === 'fitness'
          ? ['フィットネス分野の専門資格保有', 'YouTubeでの高い影響力', '男性ターゲットへの訴求力']
          : ['特定分野での専門性', 'YouTube動画制作スキル']
      },
      {
        id: '4',
        displayName: '山田あかり',
        bio: 'テクノロジー・ガジェット系レビュアー。最新デバイスの紹介が得意。',
        categories: ['テクノロジー', 'ガジェット'],
        prefecture: '東京都',
        priceMin: 70000,
        priceMax: 350000,
        user: { email: 'yamada@example.com' },
        socialAccounts: [
          { platform: 'YOUTUBE', followerCount: 120000, engagementRate: 3.9 },
          { platform: 'TWITTER', followerCount: 35000, engagementRate: 2.1 }
        ],
        aiScore: primaryCategory === 'tech' ? 94 : 38,
        matchReasons: primaryCategory === 'tech'
          ? ['最新テクノロジーへの深い知識', '詳細なレビュー動画制作スキル', 'IT業界での認知度']
          : ['動画制作の技術スキル', 'SNS運用経験']
      },
      {
        id: '5',
        displayName: '中村麻衣',
        bio: '旅行・グルメ系インフルエンサー。日本全国の観光地やグルメスポットを紹介。',
        categories: ['旅行', 'グルメ'],
        prefecture: '京都府',
        priceMin: 40000,
        priceMax: 180000,
        user: { email: 'nakamura@example.com' },
        socialAccounts: [
          { platform: 'INSTAGRAM', followerCount: 28000, engagementRate: 5.3 },
          { platform: 'TIKTOK', followerCount: 15000, engagementRate: 7.1 }
        ],
        aiScore: primaryCategory === 'travel' || primaryCategory === 'food' ? 89 : 52,
        matchReasons: primaryCategory === 'travel' || primaryCategory === 'food'
          ? ['全国の観光地での撮影経験', '地域密着型のコンテンツ制作', '高いエンゲージメント率']
          : ['地域性を活かしたコンテンツ', '写真撮影スキル']
      }
    ];

    // スコア順でソート
    const sortedInfluencers = mockInfluencers
      .sort((a, b) => b.aiScore - a.aiScore)
      .map(influencer => ({
        ...influencer,
        isRecommended: influencer.aiScore >= 80
      }));

    return {
      influencers: sortedInfluencers,
      analysis: {
        primaryCategory,
        detectedKeywords: Object.entries(categoryScores)
          .filter(([_, score]) => score > 0)
          .map(([category, score]) => ({ category, score })),
        recommendationSummary: `問い合わせ内容を分析した結果、「${primaryCategory}」分野に最も適したインフルエンサーをレコメンドしました。`
      }
    };
  }

  const response = await api.post('/ai/recommend-influencers', inquiryData);
  return response.data;
};

export const getInfluencerById = async (id: string) => {
  const response = await api.get(`/influencers/${id}`);
  return response.data;
};

export const getInfluencerStats = async (id: string) => {
  const response = await api.get(`/influencers/${id}/stats`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/influencers/categories');
  return response.data;
};

export const getPrefectures = async () => {
  const response = await api.get('/influencers/prefectures');
  return response.data;
};

// Profile Management
export const getMyProfile = async () => {
  const response = await api.get('/profile/me');
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.put('/profile/me', data);
  return response.data;
};

export const completeRegistration = async () => {
  const response = await api.post('/profile/me/complete-registration');
  return response.data;
};

// Social Accounts
export const addSocialAccount = async (data: any) => {
  const response = await api.post('/profile/social-accounts', data);
  return response.data;
};

export const updateSocialAccount = async (id: string, data: any) => {
  const response = await api.put(`/profile/social-accounts/${id}`, data);
  return response.data;
};

export const deleteSocialAccount = async (id: string) => {
  const response = await api.delete(`/profile/social-accounts/${id}`);
  return response.data;
};

// Portfolio
export const addPortfolio = async (data: any) => {
  const response = await api.post('/profile/portfolio', data);
  return response.data;
};

export const updatePortfolio = async (id: string, data: any) => {
  const response = await api.put(`/profile/portfolio/${id}`, data);
  return response.data;
};

export const deletePortfolio = async (id: string) => {
  const response = await api.delete(`/profile/portfolio/${id}`);
  return response.data;
};

export const uploadPortfolioImage = async (portfolioId: string, file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post(`/profile/portfolio/${portfolioId}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Chat
export const getChatList = async () => {
  const response = await api.get('/chat/chats');
  return response.data;
};

export const getMessages = async (projectId: string, page = 1, limit = 50) => {
  const response = await api.get(`/chat/messages/${projectId}`, {
    params: { page, limit },
  });
  return response.data;
};

export const sendMessage = async (projectId: string, content: string) => {
  const response = await api.post('/chat/messages', { projectId, content });
  return response.data;
};

export const markMessagesAsRead = async (projectId: string) => {
  const response = await api.put(`/chat/messages/${projectId}/read`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/chat/unread-count');
  return response.data;
};

// Payments
export const createPaymentIntent = async (data: { projectId: string; amount: number }) => {
  const response = await api.post('/payments/create-payment-intent', data);
  return response.data;
};

export const confirmPayment = async (data: { paymentIntentId: string; projectId: string }) => {
  const response = await api.post('/payments/confirm-payment', data);
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await api.get('/payments/history');
  return response.data;
};

export const refundPayment = async (transactionId: string) => {
  const response = await api.post(`/payments/refund/${transactionId}`);
  return response.data;
};

export const getPaymentStats = async () => {
  const response = await api.get('/payments/stats');
  return response.data;
};

// SNS
export const syncSocialAccount = async (socialAccountId: string) => {
  const response = await api.post(`/sns/sync/${socialAccountId}`);
  return response.data;
};

export const syncAllMyAccounts = async () => {
  const response = await api.post('/sns/sync-all');
  return response.data;
};

export const getSyncStatus = async () => {
  const response = await api.get('/sns/sync-status');
  return response.data;
};

// Projects
export const getAvailableProjects = async (filters: any = {}) => {
  const response = await api.get('/projects/available', { params: filters });
  return response.data;
};

export const applyToProject = async (data: { projectId: string; message: string; proposedPrice: number }) => {
  const response = await api.post('/projects/apply', data);
  return response.data;
};

export const getMyApplications = async () => {
  const response = await api.get('/projects/my-applications');
  return response.data;
};

export const getApplicationsForMyProjects = async () => {
  // Mock response for Vercel environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock getApplicationsForMyProjects for Vercel environment');
    const mockApplications = [
      {
        id: 'app1',
        message: 'この商品にとても興味があります。ナチュラルメイクが得意で、同世代の女性に向けた発信を心がけています。',
        proposedPrice: 150000,
        isAccepted: false,
        appliedAt: '2024-01-16',
        influencer: {
          id: 'inf1',
          displayName: '田中美咲',
          bio: '美容・ファッション系インフルエンサー。20代女性向けコンテンツ発信中。',
          categories: ['美容', 'ファッション'],
          prefecture: '東京都',
          user: {
            email: 'tanaka@example.com'
          },
          socialAccounts: [
            {
              id: 'sa1',
              platform: 'INSTAGRAM',
              username: 'tanaka_misaki',
              followerCount: 35000,
              engagementRate: 3.5,
              isVerified: true
            }
          ]
        },
        project: {
          id: '1',
          title: '新商品コスメのPRキャンペーン',
          description: '新発売のファンデーションを使用した投稿をお願いします。',
          category: '美容・化粧品',
          budget: 300000,
          status: 'PENDING'
        }
      },
      {
        id: 'app2',
        message: 'ライフスタイル商品のレビューは得意分野です。フォロワーからの反響も良いのでぜひ参加させてください。',
        proposedPrice: 120000,
        isAccepted: true,
        appliedAt: '2024-01-11',
        influencer: {
          id: 'inf2',
          displayName: '鈴木さやか',
          bio: 'ライフスタイル系クリエイター。料理、旅行、美容など幅広く発信。',
          categories: ['ライフスタイル', '美容', '料理'],
          prefecture: '大阪府',
          user: {
            email: 'suzuki@example.com'
          },
          socialAccounts: [
            {
              id: 'sa2',
              platform: 'INSTAGRAM',
              username: 'suzuki_sayaka',
              followerCount: 60000,
              engagementRate: 4.2,
              isVerified: true
            },
            {
              id: 'sa3',
              platform: 'TIKTOK',
              username: 'sayaka_lifestyle',
              followerCount: 29000,
              engagementRate: 5.1,
              isVerified: false
            }
          ]
        },
        project: {
          id: '2',
          title: 'ライフスタイル商品のレビュー',
          description: '日常使いできる便利グッズの紹介をお願いします。',
          category: 'ライフスタイル',
          budget: 150000,
          status: 'IN_PROGRESS'
        }
      }
    ];
    return mockApplications;
  }
  
  const response = await api.get('/applications/my-projects');
  return response.data;
};

export const acceptApplication = async (applicationId: string) => {
  const response = await api.put(`/projects/applications/${applicationId}/accept`);
  return response.data;
};

export const rejectApplication = async (applicationId: string) => {
  const response = await api.delete(`/projects/applications/${applicationId}/reject`);
  return response.data;
};

export const getProjectCategories = async () => {
  const response = await api.get('/projects/categories');
  return response.data;
};

// Project CRUD operations
export const createProject = async (data: any) => {
  // Mock response for Vercel environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock createProject for Vercel environment');
    const mockProject = {
      project: {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        applicationsCount: 0,
        clientId: 'current-user'
      }
    };
    return mockProject;
  }
  
  const response = await api.post('/projects', data);
  return response.data;
};

export const getMyProjects = async () => {
  // Mock response for Vercel environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock getMyProjects for Vercel environment');
    const mockProjects = {
      projects: [
        {
          id: '1',
          title: '新商品コスメのPRキャンペーン',
          description: '新発売のファンデーションを使用した投稿をお願いします。',
          category: '美容・化粧品',
          budget: 300000,
          status: 'PENDING',
          targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
          targetPrefecture: '東京都',
          targetAgeMin: 20,
          targetAgeMax: 35,
          targetFollowerMin: 10000,
          targetFollowerMax: 100000,
          startDate: '2024-02-01',
          endDate: '2024-02-28',
          createdAt: '2024-01-15',
          applicationsCount: 12,
          clientId: 'current-user'
        },
        {
          id: '2',
          title: 'ライフスタイル商品のレビュー',
          description: '日常使いできる便利グッズの紹介をお願いします。',
          category: 'ライフスタイル',
          budget: 150000,
          status: 'IN_PROGRESS',
          targetPlatforms: ['YOUTUBE', 'INSTAGRAM'],
          targetPrefecture: '全国',
          targetAgeMin: 25,
          targetAgeMax: 45,
          targetFollowerMin: 5000,
          targetFollowerMax: 50000,
          startDate: '2024-01-20',
          endDate: '2024-02-20',
          createdAt: '2024-01-10',
          applicationsCount: 8,
          clientId: 'current-user',
          matchedInfluencer: {
            id: 'inf1',
            displayName: '鈴木さやか'
          }
        }
      ]
    };
    return mockProjects;
  }
  
  const response = await api.get('/projects');
  return response.data;
};

export const getProjectById = async (projectId: string) => {
  // Mock response for Vercel environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock getProjectById for Vercel environment, projectId:', projectId);
    
    const mockProjectsData: Record<string, any> = {
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
    
    const mockProject = mockProjectsData[projectId];
    if (mockProject) {
      return mockProject;
    }
    
    // 新規作成プロジェクトなど、存在しないIDの場合はデフォルトプロジェクトを返す
    return {
      id: projectId,
      title: `プロジェクト ${projectId}`,
      description: 'このプロジェクトの詳細情報を表示しています。',
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
      applications: []
    };
  }
  
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const updateProject = async (projectId: string, data: any) => {
  const response = await api.put(`/projects/${projectId}`, data);
  return response.data;
};

export const updateProjectStatus = async (projectId: string, status: string) => {
  const response = await api.put(`/projects/${projectId}/status`, { status });
  return response.data;
};

export const deleteProject = async (projectId: string) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

// Teams
export const createTeam = async (data: { name: string }) => {
  const response = await api.post('/teams', data);
  return response.data;
};

export const getMyTeam = async () => {
  const response = await api.get('/teams/my-team');
  return response.data;
};

export const updateTeam = async (teamId: string, data: { name: string }) => {
  const response = await api.put(`/teams/${teamId}`, data);
  return response.data;
};

export const addTeamMember = async (teamId: string, data: { email: string; isOwner: boolean }) => {
  const response = await api.post(`/teams/${teamId}/members`, data);
  return response.data;
};

export const removeTeamMember = async (teamId: string, memberId: string) => {
  const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
  return response.data;
};

export const updateMemberRole = async (teamId: string, memberId: string, data: { isOwner: boolean }) => {
  const response = await api.put(`/teams/${teamId}/members/${memberId}/role`, data);
  return response.data;
};

export const deleteTeam = async (teamId: string) => {
  const response = await api.delete(`/teams/${teamId}`);
  return response.data;
};

// Notifications
export const getNotifications = async (page: number = 1, limit: number = 20, unreadOnly: boolean = false) => {
  const response = await api.get('/notifications', { 
    params: { page, limit, unreadOnly } 
  });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/notifications/mark-all-read');
  return response.data;
};

export const deleteNotification = async (notificationId: string) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const createSystemAnnouncement = async (data: { title: string; message: string; userIds?: string[]; data?: any }) => {
  const response = await api.post('/notifications/system-announcement', data);
  return response.data;
};

// Analytics
export const getOverviewStats = async (period: string = 'month', startDate?: string, endDate?: string) => {
  // Mock response for Vercel environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock getOverviewStats for Vercel environment, period:', period);
    
    // 期間に応じて異なるデータを生成
    const generatePeriodData = (period: string) => {
      const baseMultiplier = {
        'week': 0.25,
        'month': 1,
        '3months': 2.5,
        '6months': 5,
        'year': 10
      }[period] || 1;

      const monthlyLabels = {
        'week': ['月', '火', '水', '木', '金', '土', '日'],
        'month': ['1週', '2週', '3週', '4週'],
        '3months': ['1月前', '2月前', '3月前'],
        '6months': ['6月前', '5月前', '4月前', '3月前', '2月前', '1月前'],
        'year': ['12月前', '10月前', '8月前', '6月前', '4月前', '2月前', '現在']
      }[period] || ['1月', '2月', '3月', '4月'];

      return {
        totalProjects: Math.round(8 * baseMultiplier),
        activeProjects: Math.round(3 * baseMultiplier),
        completedProjects: Math.round(5 * baseMultiplier),
        totalBudget: Math.round(1250000 * baseMultiplier),
        totalSpent: Math.round(980000 * baseMultiplier),
        averageProjectValue: Math.round(156250 * (0.8 + baseMultiplier * 0.2)),
        totalInfluencers: Math.round(12 * baseMultiplier),
        totalReach: Math.round(450000 * baseMultiplier),
        totalEngagements: Math.round(32400 * baseMultiplier),
        averageEngagementRate: Math.round((7.2 + Math.random() * 2 - 1) * 10) / 10,
        clickThroughRate: Math.round((2.8 + Math.random() * 1 - 0.5) * 10) / 10,
        conversionRate: Math.round((1.4 + Math.random() * 0.6 - 0.3) * 10) / 10,
        roi: Math.round(245 * (0.7 + baseMultiplier * 0.3)),
        cpm: Math.round(1200 * (1.2 - baseMultiplier * 0.1)),
        costPerEngagement: Math.round(30 * (1.1 - baseMultiplier * 0.05)),
        topPerformingCategories: [
          { 
            category: '美容・化粧品', 
            projects: Math.round(3 * baseMultiplier), 
            engagement: Math.round(12500 * baseMultiplier), 
            reach: Math.round(180000 * baseMultiplier) 
          },
          { 
            category: 'ライフスタイル', 
            projects: Math.round(2 * baseMultiplier), 
            engagement: Math.round(8900 * baseMultiplier), 
            reach: Math.round(150000 * baseMultiplier) 
          },
          { 
            category: 'フィットネス', 
            projects: Math.round(1 * baseMultiplier), 
            engagement: Math.round(5200 * baseMultiplier), 
            reach: Math.round(80000 * baseMultiplier) 
          }
        ],
        monthlyTrends: monthlyLabels.map((label, index) => ({
          month: label,
          projects: Math.round((2 + Math.random() * 2) * (baseMultiplier / monthlyLabels.length)),
          budget: Math.round((200000 + Math.random() * 300000) * (baseMultiplier / monthlyLabels.length)),
          reach: Math.round((80000 + Math.random() * 100000) * (baseMultiplier / monthlyLabels.length)),
          engagement: Math.round((5600 + Math.random() * 7000) * (baseMultiplier / monthlyLabels.length))
        })),
        platformBreakdown: [
          { 
            platform: 'Instagram', 
            projects: Math.round(6 * baseMultiplier), 
            reach: Math.round(280000 * baseMultiplier), 
            engagement: Math.round(22400 * baseMultiplier) 
          },
          { 
            platform: 'TikTok', 
            projects: Math.round(3 * baseMultiplier), 
            reach: Math.round(120000 * baseMultiplier), 
            engagement: Math.round(7200 * baseMultiplier) 
          },
          { 
            platform: 'YouTube', 
            projects: Math.round(2 * baseMultiplier), 
            reach: Math.round(50000 * baseMultiplier), 
            engagement: Math.round(2800 * baseMultiplier) 
          }
        ]
      };
    };

    const periodData = generatePeriodData(period);
    
    const mockAnalyticsData = {
      period: period,
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      stats: periodData
    };
    return mockAnalyticsData;
  }

  const params: any = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await api.get('/analytics/overview', { params });
  return response.data;
};

export const getPerformanceMetrics = async (period: string = 'month') => {
  // Mock response for Vercel environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock getPerformanceMetrics for Vercel environment, period:', period);
    
    const baseMultiplier = {
      'week': 0.25,
      'month': 1,
      '3months': 2.5,
      '6months': 5,
      'year': 10
    }[period] || 1;

    const mockPerformanceData = {
      socialMetrics: {
        totalFollowers: Math.round(125000 * (0.8 + baseMultiplier * 0.2)),
        avgEngagementRate: Math.round((4.2 + Math.random() * 1 - 0.5) * 10) / 10,
        topPosts: [
          { 
            id: 1, 
            platform: 'Instagram', 
            likes: Math.round(2500 * baseMultiplier), 
            comments: Math.round(180 * baseMultiplier), 
            shares: Math.round(45 * baseMultiplier) 
          },
          { 
            id: 2, 
            platform: 'TikTok', 
            likes: Math.round(3200 * baseMultiplier), 
            comments: Math.round(250 * baseMultiplier), 
            shares: Math.round(120 * baseMultiplier) 
          }
        ]
      },
      projectMetrics: {
        totalProjects: Math.round(8 * baseMultiplier),
        completedProjects: Math.round(5 * baseMultiplier),
        avgProjectRating: Math.round((4.7 + Math.random() * 0.3 - 0.15) * 10) / 10,
        totalEarnings: Math.round(980000 * baseMultiplier)
      },
      earnings: [
        { month: '1月', amount: Math.round(180000 * baseMultiplier) },
        { month: '2月', amount: Math.round(320000 * baseMultiplier) },
        { month: '3月', amount: Math.round(280000 * baseMultiplier) },
        { month: '4月', amount: Math.round(200000 * baseMultiplier) }
      ]
    };
    return mockPerformanceData;
  }

  const response = await api.get('/analytics/performance');
  return response.data;
};

export const getComparisonData = async (period: string = 'month') => {
  // Mock response for Vercel environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock getComparisonData for Vercel environment, period:', period);
    
    const baseMultiplier = {
      'week': 0.25,
      'month': 1,
      '3months': 2.5,
      '6months': 5,
      'year': 10
    }[period] || 1;

    const mockComparisonData = {
      yourStats: {
        avgEngagementRate: Math.round((4.2 + Math.random() * 1 - 0.5) * 10) / 10,
        avgProjectValue: Math.round(156250 * (0.8 + baseMultiplier * 0.2)),
        completionRate: Math.round((95 + Math.random() * 10 - 5))
      },
      industryAverages: {
        avgEngagementRate: Math.round((3.1 + Math.random() * 0.5 - 0.25) * 10) / 10,
        avgProjectValue: Math.round(120000 * (0.9 + baseMultiplier * 0.1)),
        completionRate: 85
      },
      comparison: {
        engagementPerformance: Math.round(135 + Math.random() * 20 - 10), // 35% better +/- variation
        valuePerformance: Math.round(130 + Math.random() * 15 - 7), // 30% better +/- variation
        completionPerformance: Math.round(112 + Math.random() * 10 - 5) // 12% better +/- variation
      },
      sampleSize: Math.round(500 + Math.random() * 300)
    };
    return mockComparisonData;
  }

  const response = await api.get('/analytics/comparison');
  return response.data;
};

// Reviews
export const createReview = async (data: { projectId: string; rating: number; comment?: string; isPublic?: boolean }) => {
  const response = await api.post('/reviews', data);
  return response.data;
};

export const getReviewsForUser = async (userId: string, page: number = 1, limit: number = 20, rating?: number) => {
  const params: any = { page, limit };
  if (rating) params.rating = rating;
  
  const response = await api.get(`/reviews/user/${userId}`, { params });
  return response.data;
};

export const getMyReviews = async (type: 'given' | 'received' = 'received', page: number = 1, limit: number = 20) => {
  const response = await api.get('/reviews/my-reviews', { 
    params: { type, page, limit } 
  });
  return response.data;
};

export const getReviewableProjects = async () => {
  const response = await api.get('/reviews/reviewable-projects');
  return response.data;
};

export const updateReview = async (reviewId: string, data: { rating?: number; comment?: string; isPublic?: boolean }) => {
  const response = await api.put(`/reviews/${reviewId}`, data);
  return response.data;
};

export const deleteReview = async (reviewId: string) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

export const getRatingStats = async (userId: string) => {
  const response = await api.get(`/reviews/user/${userId}/stats`);
  return response.data;
};

export default api;