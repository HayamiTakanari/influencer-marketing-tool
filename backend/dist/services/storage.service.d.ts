export interface StorageQuota {
    userId: string;
    currentUsage: number;
    quota: number;
    available: number;
    fileCount: number;
}
export interface FileUploadInfo {
    id: string;
    userId: string;
    filename: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
}
export declare const STORAGE_QUOTAS: {
    readonly CLIENT: number;
    readonly INFLUENCER: number;
    readonly ADMIN: number;
};
export declare const FILE_COUNT_LIMITS: {
    readonly CLIENT: 50;
    readonly INFLUENCER: 200;
    readonly ADMIN: 1000;
};
/**
 * ユーザーの現在のストレージ使用量を取得
 */
export declare function getUserStorageUsage(userId: string): Promise<StorageQuota>;
/**
 * ファイルアップロード前の容量チェック
 */
export declare function checkStorageAvailability(userId: string, fileSize: number, additionalFiles?: number): Promise<{
    allowed: boolean;
    reason?: string;
    quota: StorageQuota;
}>;
/**
 * ファイルアップロード記録（実際のファイルストレージシステムと連携）
 */
export declare function recordFileUpload(fileInfo: Omit<FileUploadInfo, 'uploadedAt'>): Promise<FileUploadInfo>;
/**
 * 古いファイルの自動削除（管理者機能）
 */
export declare function cleanupOldFiles(daysOld?: number): Promise<number>;
/**
 * ストレージ統計取得（管理者向け）
 */
export declare function getStorageStatistics(): Promise<{
    totalUsers: number;
    totalStorageUsed: number;
    averageUsagePerUser: number;
    usersByRole: Record<string, {
        count: number;
        avgUsage: number;
    }>;
}>;
//# sourceMappingURL=storage.service.d.ts.map