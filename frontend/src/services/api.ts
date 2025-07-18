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
export const searchInfluencers = async (filters: any) => {
  const response = await api.get('/influencers/search', { params: filters });
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
  const params: any = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await api.get('/analytics/overview', { params });
  return response.data;
};

export const getPerformanceMetrics = async () => {
  const response = await api.get('/analytics/performance');
  return response.data;
};

export const getComparisonData = async () => {
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