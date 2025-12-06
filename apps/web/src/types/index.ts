export enum UserRole {
  CLIENT = "COMPANY",
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
  hasAgreedToNDA: boolean;  // NDA同意状況
  ndaAgreedAt?: string;     // NDA同意日時
  ndaVersion?: string;      // 同意したNDAのバージョン
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
  favoriteInfluencers: string[];  // お気に入りインフルエンサーのIDリスト
  createdAt: string;
  updatedAt: string;
  user: User;
}

export enum WorkingStatus {
  AVAILABLE = 'AVAILABLE',           // 対応可能
  BUSY = 'BUSY',                     // 多忙
  UNAVAILABLE = 'UNAVAILABLE',       // 対応不可
  BREAK = 'BREAK',                   // 休暇中
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
  hasInvoiceInfo: boolean;  // インボイス情報登録状況
  workingStatus: WorkingStatus;     // 稼働状況
  workingStatusUpdatedAt?: string;  // 稼働状況更新日時
  workingStatusMessage?: string;    // 稼働状況メッセージ（任意）
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  socialAccounts: SocialAccount[];
  portfolio: Portfolio[];
  invoiceInfo?: {
    companyName?: string;    // 会社名/屋号
    registrationNumber?: string;  // 適格請求書発行事業者登録番号
    postalCode?: string;     // 郵便番号
    address?: string;        // 住所
    phoneNumber?: string;    // 電話番号
    bankInfo?: {
      bankName: string;      // 銀行名
      branchName: string;    // 支店名
      accountType: string;   // 口座種別
      accountNumber: string; // 口座番号
      accountName: string;   // 口座名義
    };
  };
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
  companyId: string;
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
  messageType?: 'text' | 'video' | 'file' | 'conte' | 'revised_conte' | 'initial_video' | 'revised_video' | 'conte_revision_request' | 'direct_comment';
  directCommentData?: {
    targetMessageId: string;
    targetType: 'theme' | 'scene' | 'keyMessage' | 'duration';
    targetId?: string;
    targetContent: string;
    comment: string;
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

// 請求書関連の型定義
export enum InvoiceStatus {
  DRAFT = 'DRAFT',          // 下書き
  SENT = 'SENT',            // 送信済み
  PAID = 'PAID',            // 支払い完了
  OVERDUE = 'OVERDUE',      // 期限超過
  CANCELLED = 'CANCELLED',   // キャンセル
}

export interface InvoiceItem {
  id: string;
  description: string;      // サービス内容
  quantity: number;         // 数量
  unitPrice: number;        // 単価
  amount: number;           // 小計 (quantity * unitPrice)
  taxRate: number;          // 税率 (%)
  taxAmount: number;        // 税額
  totalAmount: number;      // 合計 (amount + taxAmount)
}

export interface Invoice {
  id: string;
  invoiceNumber: string;    // 請求書番号 (例: INV-2024-001)
  projectId: string;        // 関連プロジェクトID
  influencerId: string;     // インフルエンサーID
  companyId: string;         // クライアントID
  
  // 基本情報
  title: string;            // 請求書タイトル
  description?: string;     // 説明・備考
  status: InvoiceStatus;
  
  // 日付関連
  issueDate: string;        // 発行日
  dueDate: string;          // 支払期限
  paidDate?: string;        // 支払日
  
  // 金額関連
  subtotal: number;         // 小計
  taxAmount: number;        // 消費税額
  totalAmount: number;      // 合計金額
  
  // 明細
  items: InvoiceItem[];
  
  // 支払い情報
  paymentMethod?: string;   // 支払い方法
  bankInfo?: {              // 振込先情報
    bankName: string;
    branchName: string;
    accountType: string;
    accountNumber: string;
    accountName: string;
  };
  
  // メタ情報
  createdAt: string;
  updatedAt: string;
  
  // リレーション
  project: Project;
  influencer: Influencer;
  client: Client;
}

export interface InvoiceCreateRequest {
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  items: Omit<InvoiceItem, 'id'>[];
  paymentMethod?: string;
  bankInfo?: Invoice['bankInfo'];
}

export interface InvoiceUpdateRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  items?: Omit<InvoiceItem, 'id'>[];
  paymentMethod?: string;
  bankInfo?: Invoice['bankInfo'];
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    overdueAmount: number;
  };
}

// お気に入り関連の型定義
export interface Favorite {
  id: string;
  companyId: string;
  influencerId: string;
  createdAt: string;
  influencer: Influencer;
}

export interface FavoriteListResponse {
  favorites: Favorite[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}