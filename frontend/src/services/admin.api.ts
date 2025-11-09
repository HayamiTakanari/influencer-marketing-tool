import api from './api';

export const adminAPI = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getRecentProjects: async () => {
    try {
      const response = await api.get('/admin/dashboard/recent-projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent projects:', error);
      throw error;
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
      throw error;
    }
  },

  // Influencers
  getInfluencers: async (search?: string) => {
    try {
      const response = await api.get('/admin/influencers', {
        params: { search },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching influencers:', error);
      throw error;
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
      throw error;
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

  updateProjectProgress: async (id: string, data: { progress: number; status: string }) => {
    try {
      const response = await api.put(`/admin/projects/${id}/progress`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating project progress:', error);
      throw error;
    }
  },

  // Users
  getUsers: async (search?: string, role?: string, status?: string) => {
    try {
      const response = await api.get('/admin/users', {
        params: { search, role, status },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  updateUserStatus: async (id: string, status: string) => {
    try {
      const response = await api.put(`/admin/users/${id}/status`, { status });
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
