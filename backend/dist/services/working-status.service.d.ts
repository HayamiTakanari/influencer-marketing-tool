import { WorkingStatus, Platform } from '@prisma/client';
/**
 * 稼働状況の設定データ
 * Chapter 1-8: インフルエンサーの稼働状況設定
 */
export interface WorkingStatusData {
    status: WorkingStatus;
    statusMessage?: string;
    preferredMinPrice?: number;
    preferredMaxPrice?: number;
    preferredCategories?: string[];
    preferredPlatforms?: Platform[];
    preferredMinDays?: number;
}
/**
 * 稼働状況を更新
 */
export declare const updateWorkingStatus: (influencerId: string, statusData: WorkingStatusData) => Promise<any>;
/**
 * 稼働状況を取得
 */
export declare const getWorkingStatus: (influencerId: string) => Promise<{
    workingStatus: import(".prisma/client").$Enums.WorkingStatus;
    statusMessage: string;
    preferences: {
        minPrice: number;
        maxPrice: number;
        categories: string[];
        platforms: import(".prisma/client").$Enums.Platform[];
        minDays: number;
    };
    updatedAt: Date;
}>;
/**
 * 稼働状況のバリデーション
 */
export declare const validateWorkingStatusData: (statusData: WorkingStatusData) => string[];
/**
 * 稼働状況の説明を取得
 */
export declare const getStatusDescription: (status: WorkingStatus) => string;
/**
 * 稼働状況を取得（検索用）
 * プロフィール閲覧時に使用
 */
export declare const getWorkingStatusForDisplay: (influencerId: string) => Promise<{
    displayName: string;
    status: import(".prisma/client").$Enums.WorkingStatus;
    message: string;
    description: string;
}>;
//# sourceMappingURL=working-status.service.d.ts.map