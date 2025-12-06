import api from './api';

export const adminAPI = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalUsers: 0,
        totalClients: 0,
        totalInfluencers: 0,
        totalProjects: 0,
        completedProjects: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        recentProjects: [],
      };
    }
  },

  // Companies
  getCompanies: async (search?: string) => {
    try {
      const response = await api.get('/admin/companies', {
        params: { search },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      return { companies: [] };
    }
  },

  // Influencers
  getInfluencers: async (search?: string, category?: string, prefecture?: string) => {
    try {
      const response = await api.get('/admin/influencers', {
        params: { search, category, prefecture },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching influencers:', error);
      return { influencers: [] };
    }
  },

  // Projects
  getProjects: async (search?: string, status?: string) => {
    try {
      const response = await api.get('/admin/projects', {
        params: { search, status },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { projects: [] };
    }
  },

  getProjectDetail: async (id: string) => {
    try {
      const response = await api.get(`/admin/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project detail:', error);
      throw error;
    }
  },

  updateProjectProgress: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/admin/projects/${id}/progress`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating project progress:', error);
      throw error;
    }
  },

  // Users
  getUsers: async (search?: string, role?: string) => {
    try {
      const response = await api.get('/admin/users', {
        params: { search, role },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return { users: [] };
    }
  },

  updateUserStatus: async (id: string, isVerified: boolean) => {
    try {
      const response = await api.patch(`/admin/users/${id}/status`, { isVerified });
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};
