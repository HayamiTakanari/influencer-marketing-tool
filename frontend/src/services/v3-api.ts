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


// スケジュール管理
export const createProjectSchedule = async (data: any) => {
  // Vercel環境では一時的にモックデータを返す
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock data for project schedule creation');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
    return {
      message: 'スケジュールを作成しました',
      schedule: {
        id: 'mock-schedule-' + Date.now(),
        projectId: data.projectId,
        publishDate: data.publishDate,
        milestones: data.milestones.map((m: any, index: number) => ({
          id: 'mock-milestone-' + Date.now() + '-' + index,
          ...m,
          isCompleted: false,
          completedAt: null,
          notificationSent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }
  
  const response = await api.post('/schedules', data);
  return response.data;
};

export const getUpcomingMilestones = async (days?: number) => {
  // Vercel環境では一時的にモックデータを返す
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock data for upcoming milestones');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    return {
      milestones: [
        {
          id: 'mock-milestone-1',
          type: 'CONCEPT_APPROVAL',
          title: '構成案承認',
          description: '春のキャンペーン動画の構成案を承認いただく',
          dueDate: tomorrow.toISOString(),
          isCompleted: false,
          schedule: {
            project: {
              id: 'mock-project-1',
              title: '春のキャンペーン動画',
            }
          }
        },
        {
          id: 'mock-milestone-2',
          type: 'VIDEO_COMPLETION',
          title: '動画完成',
          description: '新商品紹介動画の制作完了',
          dueDate: dayAfterTomorrow.toISOString(),
          isCompleted: false,
          schedule: {
            project: {
              id: 'mock-project-2',
              title: '新商品紹介動画',
            }
          }
        }
      ]
    };
  }
  
  const response = await api.get('/schedules/upcoming', { params: { days } });
  return response.data;
};

export const getProjectSchedule = async (projectId: string) => {
  // Vercel環境では一時的にモックデータを返す
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock data for project schedule');
    const today = new Date();
    const publishDate = new Date(today);
    publishDate.setDate(today.getDate() + 10); // 10日後
    
    return {
      schedule: {
        id: 'mock-schedule-' + projectId,
        projectId: projectId,
        publishDate: publishDate.toISOString(),
        milestones: [
          {
            id: 'mock-milestone-1',
            type: 'CONCEPT_APPROVAL',
            title: '構成案承認',
            description: '企画内容の承認を得る',
            dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            completedAt: null,
            notificationSent: false,
          },
          {
            id: 'mock-milestone-2',
            type: 'VIDEO_COMPLETION',
            title: '動画完成',
            description: '動画制作を完了する',
            dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            completedAt: null,
            notificationSent: false,
          },
          {
            id: 'mock-milestone-3',
            type: 'FINAL_APPROVAL',
            title: '最終承認',
            description: '最終コンテンツの承認を得る',
            dueDate: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false,
            completedAt: null,
            notificationSent: false,
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
  }
  
  const response = await api.get(`/schedules/project/${projectId}`);
  return response.data;
};

export const updateMilestone = async (id: string, data: any) => {
  // Vercel環境では一時的にモックデータを返す
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('Using mock data for milestone update');
    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒待機
    return {
      message: 'マイルストーンを更新しました',
      milestone: {
        id: id,
        ...data,
        updatedAt: new Date().toISOString(),
      }
    };
  }
  
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