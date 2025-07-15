import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  const response = await api.post('/auth/login', { email, password });
  return response.data;
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

export default api;