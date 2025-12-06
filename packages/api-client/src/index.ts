/**
 * Typed API Client for Frontend
 * Centralized API communication with full type safety
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ProjectDTO,
  CreateProjectRequest,
  PaginatedResponse,
} from '@influencer-tool/shared-types';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // Auth Endpoints
  // ============================================

  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(
      '/auth/login',
      request
    );
    this.setToken(response.data.token);
    return response.data;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(
      '/auth/register',
      request
    );
    this.setToken(response.data.token);
    return response.data;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // ============================================
  // Project Endpoints
  // ============================================

  async getProjects(): Promise<ProjectDTO[]> {
    const response = await this.axiosInstance.get<ProjectDTO[]>(
      '/projects'
    );
    return response.data;
  }

  async getProject(id: string): Promise<ProjectDTO> {
    const response = await this.axiosInstance.get<ProjectDTO>(
      `/projects/${id}`
    );
    return response.data;
  }

  async createProject(request: CreateProjectRequest): Promise<ProjectDTO> {
    const response = await this.axiosInstance.post<ProjectDTO>(
      '/projects',
      request
    );
    return response.data;
  }

  async updateProject(
    id: string,
    request: Partial<CreateProjectRequest>
  ): Promise<ProjectDTO> {
    const response = await this.axiosInstance.put<ProjectDTO>(
      `/projects/${id}`,
      request
    );
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.axiosInstance.delete(`/projects/${id}`);
  }

  // ============================================
  // Token Management
  // ============================================

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // ============================================
  // Generic Methods
  // ============================================

  async get<T = any>(endpoint: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint);
    return response.data;
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data);
    return response.data;
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data);
    return response.data;
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint);
    return response.data;
  }
}

export default ApiClient;
