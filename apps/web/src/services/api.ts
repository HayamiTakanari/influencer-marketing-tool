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
    
    // If we're on Vercel (production), use the actual backend on Render
    if (hostname.includes('vercel.app')) {
      return 'https://influencer-marketing-tool.onrender.com';
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:3001/api';
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden - suppress error silently and continue
    // This happens when user role doesn't match the endpoint requirement
    if (error.response?.status === 403) {
      // Silently handle forbidden access
      // Don't log or redirect, just let the calling component handle it gracefully
    }

    // Handle 404 Not Found - suppress error silently
    // Allow calling components to handle gracefully
    if (error.response?.status === 404) {
      // Silently handle not found errors
    }

    return Promise.reject(error);
  }
);

// Password strength validation
export const checkPasswordStrength = (password: string) => {
  const strength = {
    score: 0,
    issues: [] as string[],
    hasMinLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  };

  // Check minimum length
  if (password.length >= 8) {
    strength.hasMinLength = true;
    strength.score += 1;
  } else {
    strength.issues.push('8文字以上である必要があります');
  }

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    strength.hasLowercase = true;
    strength.score += 1;
  } else {
    strength.issues.push('小文字を含む必要があります');
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    strength.hasUppercase = true;
    strength.score += 1;
  } else {
    strength.issues.push('大文字を含む必要があります');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    strength.hasNumber = true;
    strength.score += 1;
  } else {
    strength.issues.push('数字を含む必要があります');
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strength.hasSpecialChar = true;
    strength.score += 1;
  }

  return strength;
};

// Email verification
export const sendEmailVerification = async (email: string) => {
  console.log('Send email verification called for:', email);
  
  // Mock implementation - in production, this would send an actual email
  if (API_BASE_URL.includes('jsonplaceholder') || API_BASE_URL.includes('localhost')) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'メール認証リンクを送信しました。メールボックスを確認してください。'
        });
      }, 1000);
    });
  }

  try {
    const response = await api.post('/auth/send-verification', { email });
    return response.data;
  } catch (error) {
    console.error('Send email verification error:', error);
    throw error;
  }
};

export const verifyEmail = async (token: string) => {
  console.log('Verify email called with token:', token);
  
  // Mock implementation
  if (API_BASE_URL.includes('jsonplaceholder') || API_BASE_URL.includes('localhost')) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate success for valid-looking tokens
        if (token && token.length > 10) {
          resolve({
            success: true,
            message: 'メール認証が完了しました。'
          });
        } else {
          reject(new Error('無効な認証トークンです。'));
        }
      }, 1000);
    });
  }

  try {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

// Auth
export const getDashboardData = async () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    return null;
  }

  try {
    const response = await api.get('/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: function (status) {
        // Treat all status codes as success to prevent error console logs
        return true;
      }
    });

    // Check if response is successful
    if (response.status === 200 && response.data) {
      return response.data;
    }

    // Return null for any error status
    return null;
  } catch (error) {
    // Silently return null on any error
    // Calling components will handle null by showing default data
    return null;
  }
};

export const login = async (email: string, password: string) => {
  console.log('Login API called with:', { email, baseURL: API_BASE_URL });
  
  // Vercel環境やローカルでバックエンドが利用できない場合のモックデータ
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || !window.navigator.onLine)) {
    console.log('Using mock data for login');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // ローディング演出
    
    // テストアカウントのバリデーション
    const mockUsers = [
      { email: 'company@test.com', password: 'test123', role: 'COMPANY', id: '1' },
      { email: 'client@test.com', password: 'test123', role: "COMPANY", id: '2' },
      { email: 'influencer@test.com', password: 'test123', role: 'INFLUENCER', id: '3' }
    ];
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('メールアドレスまたはパスワードが間違っています。');
    }
    
    return {
      token: 'mock-jwt-token-' + user.id,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }
  
  
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const register = async (userData: any) => {
  console.log('Registering user with data:', { ...userData, password: '[HIDDEN]' });
  console.log('API URL:', API_BASE_URL);
  
  try {
    const response = await api.post('/auth/register', userData);
    console.log('Registration successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

// Influencer Search
// パフォーマンス最適化：キャッシュとページネーション対応
const influencerCache = new Map();

export const searchInfluencers = async (filters: any = {}) => {
  try {
    const response = await api.get('/influencers/search', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error searching influencers:', error);
    throw error;
  }
};

// AIによるインフルエンサーレコメンド機能
export const getAIRecommendedInfluencers = async (inquiryData: {
  title: string;
  description: string;
  requiredServices: string[];
  budget?: number;
}) => {
  const response = await api.post('/ai/recommend-influencers', inquiryData);
  return response.data;
};

// プロジェクト情報に基づくAIインフルエンサーレコメンド機能
export const getAIRecommendedInfluencersForProject = async (projectData: {
  title: string;
  description: string;
  category: string;
  budget: number;
  targetPlatforms: string[];
  brandName?: string;
  productName?: string;
  campaignObjective?: string;
  campaignTarget?: string;
  messageToConvey?: string;
}) => {
  const response = await api.post('/ai/recommend-influencers-for-project', projectData);
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
  // Vercel環境やローカルでバックエンドが利用できない場合のモックデータ
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || !window.navigator.onLine)) {
    console.log('Using mock data for profile');
    
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : {};
    
    // 保存されたプロフィールデータがあるかチェック
    const profileKey = 'mock_profile_data';
    const existingProfile = localStorage.getItem(profileKey);
    if (existingProfile) {
      return JSON.parse(existingProfile);
    }
    
    // ユーザーの役割に応じてモックプロフィールを生成
    if (user.role === "COMPANY" || user.role === 'COMPANY') {
      return {
        id: user.id || '1',
        companyName: '株式会社サンプル',
        industry: '美容・化粧品',
        contactName: '田中太郎',
        contactPhone: '03-1234-5678',
        address: '東京都渋谷区青山1-1-1',
        website: 'https://example.com',
        description: 'サンプル企業の概要です。美容・化粧品を中心とした事業を展開しています。',
        budget: 1000000,
        targetAudience: '20-30代女性',
        location: '東京都',
        // 口座情報（デフォルト値）
        bankName: '',
        branchName: '',
        accountType: '',
        accountNumber: '',
        accountName: ''
      };
    } else {
      return {
        id: user.id || '1',
        displayName: 'サンプルインフルエンサー',
        bio: 'ライフスタイルについて発信しています',
        categories: ['美容', 'ライフスタイル'],
        prefecture: '東京都',
        city: '渋谷区',
        priceMin: 50000,
        priceMax: 200000,
        gender: '女性',
        birthDate: '1995-05-15'
      };
    }
  }

  try {
    const response = await api.get('/profile/me');
    return response.data;
  } catch (error: any) {
    // Suppress 403 errors (access denied) - expected for unauthenticated users
    if (error.response?.status !== 403) {
      console.error('Error fetching profile, falling back to mock data:', error);
    }
    
    // バックエンドエラーの場合もモックデータを返す
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : {};
    
    // 保存されたプロフィールデータがあるかチェック
    const profileKey = 'mock_profile_data';
    const existingProfile = localStorage.getItem(profileKey);
    if (existingProfile) {
      return JSON.parse(existingProfile);
    }
    
    if (user.role === "COMPANY" || user.role === 'COMPANY') {
      return {
        id: user.id || '1',
        companyName: '株式会社サンプル',
        industry: '美容・化粧品',
        contactName: '田中太郎',
        contactPhone: '03-1234-5678',
        address: '東京都渋谷区青山1-1-1',
        website: 'https://example.com',
        description: 'サンプル企業の概要です。美容・化粧品を中心とした事業を展開しています。',
        budget: 1000000,
        targetAudience: '20-30代女性',
        location: '東京都',
        // 口座情報（デフォルト値）
        bankName: '',
        branchName: '',
        accountType: '',
        accountNumber: '',
        accountName: ''
      };
    } else {
      return {
        id: user.id || '1',
        displayName: 'サンプルインフルエンサー',
        bio: 'ライフスタイルについて発信しています',
        categories: ['美容', 'ライフスタイル'],
        prefecture: '東京都',
        city: '渋谷区',
        priceMin: 50000,
        priceMax: 200000,
        gender: '女性',
        birthDate: '1995-05-15'
      };
    }
  }
};

export const updateProfile = async (data: any) => {
  // Vercel環境やローカルでバックエンドが利用できない場合のモックデータ
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || !window.navigator.onLine)) {
    console.log('Using mock data for profile update');
    
    // LocalStorageに更新データを保存（モック用）
    const profileKey = 'mock_profile_data';
    const existingProfile = localStorage.getItem(profileKey);
    const currentProfile = existingProfile ? JSON.parse(existingProfile) : {};
    
    const updatedProfile = { ...currentProfile, ...data, id: currentProfile.id || '1' };
    localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
    
    return { success: true, profile: updatedProfile };
  }

  try {
    const response = await api.put('/profile/me', data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile, using mock response:', error);
    
    // エラー時もモック応答を返す
    const profileKey = 'mock_profile_data';
    const existingProfile = localStorage.getItem(profileKey);
    const currentProfile = existingProfile ? JSON.parse(existingProfile) : {};
    
    const updatedProfile = { ...currentProfile, ...data, id: currentProfile.id || '1' };
    localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
    
    return { success: true, profile: updatedProfile };
  }
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

export const getProjectMessages = async (projectId: string, page = 1, limit = 50) => {
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
  try {
    const response = await api.get('/payments/stats');
    return response.data;
  } catch (error: any) {
    // Suppress 403 errors (access denied) - expected for unauthenticated users or wrong role
    // Return empty stats instead of throwing error
    if (error.response?.status === 403) {
      return { totalRevenue: 0, totalPayments: 0, pendingAmount: 0, completedPayments: [] };
    }
    throw error;
  }
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

export const rejectProject = async (data: { projectId: string; reason: string }) => {
  const response = await api.post('/projects/reject', data);
  return response.data;
};

// プロジェクトスケジュール関連API
export const getProjectSchedule = async (projectId: string) => {
  const response = await api.get(`/projects/${projectId}/schedule`);
  return response.data;
};

export const createProjectSchedule = async (projectId: string, scheduleData: any) => {
  const response = await api.post(`/projects/${projectId}/schedule`, scheduleData);
  return response.data;
};

export const updateProjectSchedule = async (projectId: string, scheduleData: any) => {
  const response = await api.put(`/projects/${projectId}/schedule`, scheduleData);
  return response.data;
};

export const getMyApplications = async () => {
  const response = await api.get('/projects/my-applications');
  return response.data;
};

export const getApplicationsForMyProjects = async () => {
  // Mock response for Vercel environment
  
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
  
  const response = await api.post('/projects', data);
  return response.data;
};

export const getMyProjects = async () => {
  console.log('getMyProjects called');

  try {
    console.log('Attempting to fetch projects from API...');
    const response = await api.get('/projects/my-projects');
    console.log('API response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    // API が使用できない場合は空配列を返す
    return { projects: [] };
  }
};

export const getProjectById = async (projectId: string) => {
  console.log('Attempting to fetch project:', projectId);
  
  try {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  } catch (error: any) {
    console.error('Backend failed for getProjectById, using mock data:', error);
    
    // バックエンドが利用できない場合のモックデータ
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
        // 新しい詳細項目
        advertiserName: '株式会社BeautyCosmetics',
        brandName: 'BeautyPerfect',
        productName: 'ナチュラルグロウファンデーション',
        productUrl: 'https://beautyperfect.com/foundation',
        productPrice: 3980,
        productFeatures: '自然なツヤ感を演出するリキッドファンデーション。SPF30PA++で日常使いに最適。軽いテクスチャーで長時間崩れにくく、敏感肌でも安心して使用できる美容成分配合。',
        campaignObjective: '新商品の認知拡大とブランドイメージ向上',
        campaignTarget: '20-30代の美容に関心の高い女性',
        postingPeriodStart: '2024-02-01',
        postingPeriodEnd: '2024-02-28',
        postingMedia: ['INSTAGRAM', 'TIKTOK'],
        messageToConvey: 'ナチュラルで美しい仕上がりと、肌に優しい処方の魅力',
        shootingAngle: '正面',
        packagePhotography: '外装・パッケージ両方',
        productOrientationSpecified: 'ブランド名が見えるように',
        musicUsage: '商用利用フリー音源のみ',
        brandContentSettings: '設定必要',
        advertiserAccount: '@beautyperfect_official',
        desiredHashtags: ['#新商品コスメ', '#ナチュラルメイク', '#ファンデーション', '#BeautyPerfect', '#美容'],
        ngItems: '競合他社（特にカバーマーク、資生堂）への言及禁止、過度な加工禁止',
        legalRequirements: '「個人の感想です」の記載必須、効果効能に関する断定的表現禁止',
        notes: '撮影は自然光での撮影を推奨、Before/Afterの比較投稿歓迎',
        secondaryUsage: '許可（条件あり）',
        secondaryUsageScope: '自社公式サイト、自社SNSアカウント、店舗ディスプレイ',
        secondaryUsagePeriod: '1年間',
        insightDisclosure: '必要',
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
        insightDisclosure: '不要',
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

  const params: any = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await api.get('/analytics/overview', { params });
  return response.data;
};

export const getPerformanceMetrics = async (period: string = 'month') => {
  // Mock response for Vercel environment

  const response = await api.get('/analytics/performance');
  return response.data;
};

export const getComparisonData = async (period: string = 'month') => {
  // Mock response for Vercel environment

  const response = await api.get('/analytics/comparison');
  return response.data;
};


// 請求書関連のAPI関数
import { Invoice, InvoiceCreateRequest, InvoiceUpdateRequest, InvoiceListResponse, InvoiceStatus } from '../types';

export const getInvoices = async (params: {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  projectId?: string;
  type?: 'sent' | 'received';  // 送信済み or 受信済み
} = {}) => {
  console.log('Fetching invoices with params:', params);
  
  // Vercel環境またはlocalhost環境ではモックデータを使用
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1')) {
    console.log('Using mock invoice data');
    
    const { page = 1, limit = 20, status, type = 'sent' } = params;
    
    // モック請求書データ
    const mockInvoices: Invoice[] = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-001',
        projectId: '1',
        influencerId: 'inf-1',
        companyId: 'client-1',
        title: '新商品コスメのPRキャンペーン - 請求書',
        description: 'Instagram投稿2回、ストーリー投稿3回、TikTok動画1本の制作費用',
        status: InvoiceStatus.PAID,
        issueDate: '2024-01-20',
        dueDate: '2024-02-19',
        paidDate: '2024-02-10',
        subtotal: 150000,
        taxAmount: 15000,
        totalAmount: 165000,
        items: [
          {
            id: 'item-1',
            description: 'Instagram投稿制作',
            quantity: 2,
            unitPrice: 50000,
            amount: 100000,
            taxRate: 10,
            taxAmount: 10000,
            totalAmount: 110000
          },
          {
            id: 'item-2',
            description: 'ストーリー投稿制作',
            quantity: 3,
            unitPrice: 10000,
            amount: 30000,
            taxRate: 10,
            taxAmount: 3000,
            totalAmount: 33000
          },
          {
            id: 'item-3',
            description: 'TikTok動画制作',
            quantity: 1,
            unitPrice: 20000,
            amount: 20000,
            taxRate: 10,
            taxAmount: 2000,
            totalAmount: 22000
          }
        ],
        paymentMethod: '銀行振込',
        bankInfo: {
          bankName: 'みずほ銀行',
          branchName: '渋谷支店',
          accountType: '普通',
          accountNumber: '1234567',
          accountName: 'タナカ ミサキ'
        },
        createdAt: '2024-01-20T09:00:00Z',
        updatedAt: '2024-02-10T15:30:00Z',
        project: {
          id: '1',
          title: '新商品コスメのPRキャンペーン'
        } as any,
        influencer: {
          id: 'inf-1',
          displayName: '田中美咲'
        } as any,
        client: {
          id: 'client-1',
          companyName: 'コスメブランド株式会社'
        } as any
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-2024-002',
        projectId: '2',
        influencerId: 'inf-2',
        companyId: 'client-2',
        title: 'ライフスタイル商品のレビュー - 請求書',
        description: 'YouTube動画1本、Instagram投稿1回の制作費用',
        status: InvoiceStatus.SENT,
        issueDate: '2024-01-25',
        dueDate: '2024-02-24',
        subtotal: 120000,
        taxAmount: 12000,
        totalAmount: 132000,
        items: [
          {
            id: 'item-4',
            description: 'YouTube動画制作',
            quantity: 1,
            unitPrice: 80000,
            amount: 80000,
            taxRate: 10,
            taxAmount: 8000,
            totalAmount: 88000
          },
          {
            id: 'item-5',
            description: 'Instagram投稿制作',
            quantity: 1,
            unitPrice: 40000,
            amount: 40000,
            taxRate: 10,
            taxAmount: 4000,
            totalAmount: 44000
          }
        ],
        paymentMethod: '銀行振込',
        bankInfo: {
          bankName: 'りそな銀行',
          branchName: '大阪本店',
          accountType: '普通',
          accountNumber: '9876543',
          accountName: 'スズキ サヤカ'
        },
        createdAt: '2024-01-25T10:00:00Z',
        updatedAt: '2024-01-25T10:00:00Z',
        project: {
          id: '2',
          title: 'ライフスタイル商品のレビュー'
        } as any,
        influencer: {
          id: 'inf-2',
          displayName: '鈴木さやか'
        } as any,
        client: {
          id: 'client-2',
          companyName: 'ライフスタイル商品株式会社'
        } as any
      }
    ];
    
    // ユーザー情報を取得してフィルタリング
    let filteredByType = mockInvoices;
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userData) {
      const user = JSON.parse(userData);
      if (type === 'received' && (user.role === "COMPANY" || user.role === 'COMPANY')) {
        // 企業が受け取った請求書のみ表示（実際はcompanyIdでフィルタリング）
        filteredByType = mockInvoices.filter(invoice => 
          invoice.status !== InvoiceStatus.DRAFT // 下書き以外
        );
      } else if (type === 'sent' && user.role === 'INFLUENCER') {
        // インフルエンサーが送信した請求書のみ表示
        filteredByType = mockInvoices;
      }
    }
    
    // ステータスフィルタリング
    const filteredInvoices = status 
      ? filteredByType.filter(invoice => invoice.status === status)
      : filteredByType;
    
    // ページネーション
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
    
    const response: InvoiceListResponse = {
      invoices: paginatedInvoices,
      pagination: {
        page,
        limit,
        total: filteredInvoices.length,
        totalPages: Math.ceil(filteredInvoices.length / limit),
      },
      summary: {
        totalAmount: mockInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        paidAmount: mockInvoices
          .filter(inv => inv.status === InvoiceStatus.PAID)
          .reduce((sum, inv) => sum + inv.totalAmount, 0),
        unpaidAmount: mockInvoices
          .filter(inv => inv.status === InvoiceStatus.SENT)
          .reduce((sum, inv) => sum + inv.totalAmount, 0),
        overdueAmount: mockInvoices
          .filter(inv => inv.status === InvoiceStatus.OVERDUE)
          .reduce((sum, inv) => sum + inv.totalAmount, 0),
      }
    };
    
    return response;
  }
  
  try {
    const response = await api.get('/invoices', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices, using fallback data:', error);
    // API失敗時のフォールバック
    return {
      invoices: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      summary: { totalAmount: 0, paidAmount: 0, unpaidAmount: 0, overdueAmount: 0 }
    };
  }
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  console.log('Fetching invoice by id:', id);
  
  // Vercel環境またはlocalhost環境ではモックデータを使用
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1')) {
    console.log('Using mock invoice detail data');
    
    // モック請求書詳細データ
    const mockInvoice: Invoice = {
      id,
      invoiceNumber: 'INV-2024-001',
      projectId: '1',
      influencerId: 'inf-1',
      companyId: 'client-1',
      title: '新商品コスメのPRキャンペーン - 請求書',
      description: 'Instagram投稿2回、ストーリー投稿3回、TikTok動画1本の制作費用',
      status: InvoiceStatus.SENT,
      issueDate: '2024-01-20',
      dueDate: '2024-02-19',
      subtotal: 150000,
      taxAmount: 15000,
      totalAmount: 165000,
      items: [
        {
          id: 'item-1',
          description: 'Instagram投稿制作',
          quantity: 2,
          unitPrice: 50000,
          amount: 100000,
          taxRate: 10,
          taxAmount: 10000,
          totalAmount: 110000
        },
        {
          id: 'item-2',
          description: 'ストーリー投稿制作',
          quantity: 3,
          unitPrice: 10000,
          amount: 30000,
          taxRate: 10,
          taxAmount: 3000,
          totalAmount: 33000
        },
        {
          id: 'item-3',
          description: 'TikTok動画制作',
          quantity: 1,
          unitPrice: 20000,
          amount: 20000,
          taxRate: 10,
          taxAmount: 2000,
          totalAmount: 22000
        }
      ],
      paymentMethod: '銀行振込',
      bankInfo: {
        bankName: 'みずほ銀行',
        branchName: '渋谷支店',
        accountType: '普通',
        accountNumber: '1234567',
        accountName: 'タナカ ミサキ'
      },
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-01-20T09:00:00Z',
      project: {
        id: '1',
        title: '新商品コスメのPRキャンペーン',
        description: '新発売のファンデーションを使用した投稿をお願いします。',
        budget: 300000
      } as any,
      influencer: {
        id: 'inf-1',
        displayName: '田中美咲',
        bio: '美容・ファッション系インフルエンサー。20代女性向けコンテンツ発信中。'
      } as any,
      client: {
        id: 'client-1',
        companyName: 'コスメブランド株式会社',
        contactName: '山田太郎'
      } as any
    };
    
    return mockInvoice;
  }
  
  try {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice detail:', error);
    throw error;
  }
};

export const createInvoice = async (data: InvoiceCreateRequest): Promise<Invoice> => {
  console.log('Creating invoice:', data);
  
  // Vercel環境またはlocalhost環境ではモックレスポンス
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1')) {
    console.log('Using mock invoice creation');
    
    // 計算ロジック
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = data.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;
    
    const mockInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      projectId: data.projectId,
      influencerId: 'current-user-id',
      companyId: 'project-client-id',
      title: data.title,
      description: data.description,
      status: InvoiceStatus.DRAFT,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate,
      subtotal,
      taxAmount,
      totalAmount,
      items: data.items.map((item, index) => ({
        ...item,
        id: `item-${index + 1}`
      })),
      paymentMethod: data.paymentMethod,
      bankInfo: data.bankInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: { id: data.projectId, title: 'プロジェクト' } as any,
      influencer: { id: 'current-user-id', displayName: 'ユーザー名' } as any,
      client: { id: 'client-id', companyName: '企業名' } as any
    };
    
    return mockInvoice;
  }
  
  try {
    const response = await api.post('/invoices', data);
    return response.data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const updateInvoice = async (id: string, data: InvoiceUpdateRequest): Promise<Invoice> => {
  console.log('Updating invoice:', id, data);
  
  try {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  console.log('Deleting invoice:', id);
  
  try {
    await api.delete(`/invoices/${id}`);
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

export const sendInvoice = async (id: string): Promise<Invoice> => {
  console.log('Sending invoice:', id);
  
  try {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  } catch (error) {
    console.error('Error sending invoice:', error);
    throw error;
  }
};

export const markInvoiceAsPaid = async (id: string, paidDate?: string): Promise<Invoice> => {
  console.log('Marking invoice as paid:', id);
  
  try {
    const response = await api.post(`/invoices/${id}/mark-paid`, { paidDate });
    return response.data;
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    throw error;
  }
};

// プロジェクト完了時の自動請求書生成
export const generateInvoiceFromProject = async (projectId: string): Promise<Invoice> => {
  console.log('Generating invoice from project:', projectId);
  
  // Vercel環境またはlocalhost環境ではモック生成
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1')) {
    console.log('Using mock invoice generation from project');
    
    // プロジェクト情報に基づいた自動請求書生成のモック
    const mockInvoice: Invoice = {
      id: `inv-auto-${Date.now()}`,
      invoiceNumber: `INV-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      projectId,
      influencerId: 'current-user-id',
      companyId: 'project-client-id',
      title: `プロジェクト完了 - 請求書`,
      description: 'プロジェクト完了による自動生成請求書',
      status: InvoiceStatus.DRAFT,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30日後
      subtotal: 200000,
      taxAmount: 20000,
      totalAmount: 220000,
      items: [
        {
          id: 'auto-item-1',
          description: 'プロジェクト制作費用',
          quantity: 1,
          unitPrice: 200000,
          amount: 200000,
          taxRate: 10,
          taxAmount: 20000,
          totalAmount: 220000
        }
      ],
      paymentMethod: '銀行振込',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: { id: projectId, title: 'プロジェクト' } as any,
      influencer: { id: 'current-user-id', displayName: 'ユーザー名' } as any,
      client: { id: 'client-id', companyName: '企業名' } as any
    };
    
    return mockInvoice;
  }
  
  try {
    const response = await api.post(`/projects/${projectId}/generate-invoice`);
    return response.data;
  } catch (error) {
    console.error('Error generating invoice from project:', error);
    throw error;
  }
};

// アナリティクス用プロジェクト一覧取得
export const getProjects = async () => {
  console.log('getProjects called for analytics');
  
  // アナリティクス用のモックプロジェクトデータ
  const mockProjects = {
    projects: [
      {
        id: 'project-1',
        title: '新商品コスメPRキャンペーン',
        category: '美容・化粧品',
        status: 'ACTIVE',
        budget: 300000,
        startDate: '2024-01-15',
        endDate: '2024-02-15',
        reach: 450000,
        engagement: 35000,
        conversions: 1250,
        roi: 220
      },
      {
        id: 'project-2', 
        title: 'カフェ新店舗オープン告知',
        category: 'グルメ',
        status: 'COMPLETED',
        budget: 150000,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reach: 280000,
        engagement: 22000,
        conversions: 890,
        roi: 180
      },
      {
        id: 'project-3',
        title: 'フィットネスアプリ体験キャンペーン',
        category: 'フィットネス',
        status: 'ACTIVE',
        budget: 500000,
        startDate: '2024-01-20',
        endDate: '2024-03-20',
        reach: 620000,
        engagement: 48000,
        conversions: 2100,
        roi: 350
      },
      {
        id: 'project-4',
        title: '旅行サービス春のキャンペーン',
        category: '旅行・観光',
        status: 'PLANNING',
        budget: 800000,
        startDate: '2024-03-01',
        endDate: '2024-04-30',
        reach: 0,
        engagement: 0,
        conversions: 0,
        roi: 0
      },
      {
        id: 'project-5',
        title: 'ファッションブランド新作発表',
        category: 'ファッション',
        status: 'ACTIVE',
        budget: 600000,
        startDate: '2024-01-10',
        endDate: '2024-02-28',
        reach: 720000,
        engagement: 54000,
        conversions: 1800,
        roi: 280
      }
    ]
  };

  return mockProjects;
};

// FAQ API
export const getFAQs = async () => {
  try {
    const response = await api.get('/faqs');
    return response.data;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    throw error;
  }
};

// Favorite Influencers API
export const getFavoriteInfluencers = async (influencerIds: string[]) => {
  try {
    const response = await api.post('/influencers/favorites', {
      ids: influencerIds
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching favorite influencers:', error);
    throw error;
  }
};

// Update Favorite Influencers API
export const updateFavorites = async (favoriteIds: string[]) => {
  try {
    const response = await api.post('/user/favorites', {
      favoriteInfluencers: favoriteIds
    });
    return response.data;
  } catch (error) {
    console.error('Error updating favorites:', error);
    throw error;
  }
};

export default api;