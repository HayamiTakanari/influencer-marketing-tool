import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒タイムアウト
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data
      }
    });
    return Promise.reject(error);
  }
);

// v3.0 新機能API

// ヘルスチェック（デバッグ用）
export const healthCheck = async () => {
  try {
    // ヘルスチェックはAPIベースに含まれないため、別のaxiosインスタンスを使用
    const baseUrl = API_BASE_URL.replace('/api', '');
    const response = await axios.get(`${baseUrl}/health`);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// 実績管理
export const createAchievement = async (data: any) => {
  const response = await api.post('/achievements', data);
  return response.data;
};

export const getMyAchievements = async () => {
  const response = await api.get('/achievements/my-achievements');
  return response.data;
};

export const getAchievementStats = async () => {
  const response = await api.get('/achievements/stats');
  return response.data;
};

export const getAchievementsByInfluencer = async (influencerId: string, params?: any) => {
  const response = await api.get(`/achievements/influencer/${influencerId}`, { params });
  return response.data;
};

export const updateAchievement = async (id: string, data: any) => {
  const response = await api.put(`/achievements/${id}`, data);
  return response.data;
};

export const deleteAchievement = async (id: string) => {
  const response = await api.delete(`/achievements/${id}`);
  return response.data;
};

// 料金体系管理
export const createServicePricing = async (data: any) => {
  const response = await api.post('/service-pricing', data);
  return response.data;
};

export const bulkCreateServicePricing = async (data: any[]) => {
  const response = await api.post('/service-pricing/bulk', data);
  return response.data;
};

export const getMyServicePricing = async () => {
  const response = await api.get('/service-pricing/my-pricing');
  return response.data;
};

export const validateServicePricing = async () => {
  const response = await api.get('/service-pricing/validate');
  return response.data;
};

export const getServicePricingByInfluencer = async (influencerId: string, params?: any) => {
  const response = await api.get(`/service-pricing/influencer/${influencerId}`, { params });
  return response.data;
};

export const updateServicePricing = async (id: string, data: any) => {
  const response = await api.put(`/service-pricing/${id}`, data);
  return response.data;
};

export const deleteServicePricing = async (id: string) => {
  const response = await api.delete(`/service-pricing/${id}`);
  return response.data;
};

// 一斉問い合わせ
export const createBulkInquiry = async (data: any) => {
  // Vercel環境では一時的にモックデータを返す
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock data for bulk inquiry creation');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
    return {
      message: '問い合わせを送信しました',
      inquiry: {
        id: 'mock-inquiry-' + Date.now(),
        title: data.title,
        description: data.description,
        budget: data.budget,
        requiredServices: data.requiredServices,
        createdAt: new Date().toISOString(),
      },
      responseCount: data.targetInfluencers.length,
    };
  }
  
  const response = await api.post('/bulk-inquiries', data);
  return response.data;
};

export const getMyBulkInquiries = async () => {
  // Vercel環境では一時的にモックデータを返す
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock data for bulk inquiries');
    return {
      inquiries: [
        {
          id: 'mock-inquiry-1',
          title: 'テスト問い合わせ1',
          description: 'これはテスト用の問い合わせです',
          budget: 100000,
          requiredServices: ['PHOTOGRAPHY', 'POSTING'],
          createdAt: new Date().toISOString(),
          responses: [],
        }
      ]
    };
  }
  
  const response = await api.get('/bulk-inquiries/my-inquiries');
  return response.data;
};

export const getMyInquiryResponses = async () => {
  const response = await api.get('/bulk-inquiries/my-responses');
  return response.data;
};

export const getInquiryStats = async () => {
  // Vercel環境では一時的にモックデータを返す
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock data for inquiry stats');
    return {
      totalInquiries: 5,
      totalResponses: 12,
      responseStats: [
        { status: 'PENDING', _count: { status: 8 } },
        { status: 'ACCEPTED', _count: { status: 3 } },
        { status: 'DECLINED', _count: { status: 1 } },
      ]
    };
  }
  
  const response = await api.get('/bulk-inquiries/stats');
  return response.data;
};

export const getBulkInquiryById = async (id: string) => {
  const response = await api.get(`/bulk-inquiries/${id}`);
  return response.data;
};

export const updateInquiryResponse = async (id: string, data: any) => {
  const response = await api.put(`/bulk-inquiries/response/${id}`, data);
  return response.data;
};

// スケジュール管理
export const createProjectSchedule = async (data: any) => {
  const response = await api.post('/schedules', data);
  return response.data;
};

export const getUpcomingMilestones = async (days?: number) => {
  const response = await api.get('/schedules/upcoming', { params: { days } });
  return response.data;
};

export const getProjectSchedule = async (projectId: string) => {
  const response = await api.get(`/schedules/project/${projectId}`);
  return response.data;
};

export const updateMilestone = async (id: string, data: any) => {
  const response = await api.put(`/schedules/milestone/${id}`, data);
  return response.data;
};

export const sendMilestoneNotifications = async () => {
  const response = await api.post('/schedules/notifications');
  return response.data;
};

// 型定義
export interface Achievement {
  id: string;
  projectName: string;
  brandName: string;
  purpose: 'SALES' | 'LEAD_GEN' | 'AWARENESS' | 'BRAND_IMAGE' | 'ENGAGEMENT';
  platform: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'TWITTER';
  description?: string;
  metrics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    conversions?: number;
    reach?: number;
    impressions?: number;
  };
  budget?: number;
  duration?: string;
  imageUrl?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePricing {
  id: string;
  serviceType: 'PHOTOGRAPHY' | 'VIDEO_EDITING' | 'CONTENT_CREATION' | 'POSTING' | 'STORY_CREATION' | 'CONSULTATION' | 'LIVE_STREAMING' | 'EVENT_APPEARANCE';
  price: number;
  unit: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BulkInquiry {
  id: string;
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  requiredServices: string[];
  responses: InquiryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface InquiryResponse {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  proposedPrice?: number;
  message?: string;
  availableFrom?: string;
  availableTo?: string;
  influencer: {
    id: string;
    displayName: string;
    user: {
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSchedule {
  id: string;
  projectId: string;
  publishDate: string;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  type: 'CONCEPT_APPROVAL' | 'VIDEO_COMPLETION' | 'FINAL_APPROVAL' | 'PUBLISH_DATE';
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export default api;