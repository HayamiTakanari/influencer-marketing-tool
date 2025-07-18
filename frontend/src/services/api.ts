import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

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
  const response = await api.get('/projects/applications');
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
  const response = await api.post('/projects', data);
  return response.data;
};

export const getMyProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProjectById = async (projectId: string) => {
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