export enum UserRole {
  CLIENT = 'CLIENT',
  INFLUENCER = 'INFLUENCER',
  ADMIN = 'ADMIN',
}

export enum Platform {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  TWITTER = 'TWITTER',
}

export enum ProjectStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  NOT_SPECIFIED = 'NOT_SPECIFIED',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  userId: string;
  companyName: string;
  industry?: string;
  contactName: string;
  contactPhone?: string;
  address?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Influencer {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  gender: Gender;
  birthDate?: string;
  phoneNumber?: string;
  address?: string;
  prefecture?: string;
  city?: string;
  categories: string[];
  priceMin?: number;
  priceMax?: number;
  isRegistered: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  socialAccounts: SocialAccount[];
  portfolio: Portfolio[];
}

export interface SocialAccount {
  id: string;
  influencerId: string;
  platform: Platform;
  username: string;
  profileUrl: string;
  followerCount: number;
  engagementRate?: number;
  isVerified: boolean;
  lastSynced: string;
  createdAt: string;
  updatedAt: string;
}

export interface Portfolio {
  id: string;
  influencerId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  platform?: Platform;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  targetPlatforms: Platform[];
  targetPrefecture?: string;
  targetCity?: string;
  targetGender?: Gender;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetFollowerMin?: number;
  targetFollowerMax?: number;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  client: Client;
  matchedInfluencer?: Influencer;
  matchedInfluencerId?: string;
  messages: Message[];
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    role: UserRole;
  };
}

export interface Transaction {
  id: string;
  projectId: string;
  amount: number;
  fee: number;
  stripePaymentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  project: Project;
}

export interface Chat {
  id: string;
  title: string;
  client?: Client;
  matchedInfluencer?: Influencer;
  messages: Message[];
  unreadCount: number;
}

export interface SearchFilters {
  query?: string;
  categories?: string[];
  platforms?: Platform[];
  minFollowers?: number;
  maxFollowers?: number;
  minPrice?: number;
  maxPrice?: number;
  prefecture?: string;
  city?: string;
  gender?: Gender;
  minEngagementRate?: number;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  influencers: Influencer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentStats {
  totalSpent: number;
  totalEarned: number;
  completedTransactions: number;
}

export interface SNSSyncResult {
  total: number;
  successful: number;
  failed: number;
  results: any[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}