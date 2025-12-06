/**
 * API リクエスト/レスポンス型定義
 */

// ============================================
// 認証関連
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'INFLUENCER' | 'COMPANY';
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

// ============================================
// ユーザー
// ============================================
export interface UserDTO {
  id: string;
  email: string;
  role: 'INFLUENCER' | 'COMPANY' | 'ADMIN';
  isVerified: boolean;
}

export interface InfluencerProfileDTO {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  categories: string[];
  prefecture: string;
  city?: string;
  priceMin: number;
  priceMax: number;
  socialAccounts: SocialAccountDTO[];
  portfolio: PortfolioDTO[];
}

export interface CompanyProfileDTO {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  contactName: string;
  contactPhone: string;
  address: string;
  website?: string;
  description?: string;
}

// ============================================
// SNS アカウント
// ============================================
export interface SocialAccountDTO {
  id: string;
  platform: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'TWITTER';
  username: string;
  profileUrl: string;
  followerCount?: number;
  engagementRate?: number;
}

// ============================================
// ポートフォリオ
// ============================================
export interface PortfolioDTO {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  platform?: string;
}

// ============================================
// プロジェクト
// ============================================
export interface ProjectDTO {
  id: string;
  companyId: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  startDate: Date;
  endDate: Date;
  targetPlatforms: string[];
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetFollowerMin?: number;
  targetFollowerMax?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  category: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetPlatforms: string[];
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetFollowerMin?: number;
  targetFollowerMax?: number;
}

// ============================================
// API レスポンス
// ============================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// エラー
// ============================================
export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
  timestamp: string;
}
