import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// ユーザーロール別の容量制限設定
export const STORAGE_QUOTAS = {
  CLIENT: 100 * 1024 * 1024, // 100MB
  INFLUENCER: 500 * 1024 * 1024, // 500MB
  ADMIN: 2 * 1024 * 1024 * 1024, // 2GB
} as const;

// ファイル数制限
export const FILE_COUNT_LIMITS = {
  CLIENT: 50,
  INFLUENCER: 200,
  ADMIN: 1000,
} as const;

/**
 * ユーザーの現在のストレージ使用量を取得
 */
export async function getUserStorageUsage(userId: string): Promise<StorageQuota> {
  try {
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // ユーザーの全ファイルサイズを集計
    // 実際の実装では、Portfolio、Achievement、その他のファイルアップロードテーブルを集計
    const portfolioFiles = await prisma.portfolio.findMany({
      where: { influencerId: userId },
      select: { imageUrl: true }
    });

    const achievementFiles = await prisma.achievement.findMany({
      where: { influencerId: userId },
      select: { imageUrl: true }
    });

    // 実際のファイルサイズを計算（簡易実装）
    let totalSize = 0;
    let fileCount = 0;

    // ここでは仮のサイズを設定（実際の実装では実際のファイルサイズを取得）
    portfolioFiles.forEach(file => {
      if (file.imageUrl) {
        totalSize += 1024 * 1024; // 1MBと仮定
        fileCount++;
      }
    });

    achievementFiles.forEach(file => {
      if (file.imageUrl) {
        totalSize += 1024 * 1024; // 1MBと仮定
        fileCount++;
      }
    });

    const quota = STORAGE_QUOTAS[user.role as keyof typeof STORAGE_QUOTAS] || STORAGE_QUOTAS.CLIENT;
    const available = Math.max(0, quota - totalSize);

    return {
      userId,
      currentUsage: totalSize,
      quota,
      available,
      fileCount
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    throw error;
  }
}

/**
 * ファイルアップロード前の容量チェック
 */
export async function checkStorageAvailability(
  userId: string,
  fileSize: number,
  additionalFiles: number = 1
): Promise<{ allowed: boolean; reason?: string; quota: StorageQuota }> {
  try {
    const storageInfo = await getUserStorageUsage(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return {
        allowed: false,
        reason: 'User not found',
        quota: storageInfo
      };
    }

    // 容量制限チェック
    if (storageInfo.currentUsage + fileSize > storageInfo.quota) {
      return {
        allowed: false,
        reason: `Storage quota exceeded. Available: ${Math.round(storageInfo.available / 1024 / 1024)}MB, Required: ${Math.round(fileSize / 1024 / 1024)}MB`,
        quota: storageInfo
      };
    }

    // ファイル数制限チェック
    const fileCountLimit = FILE_COUNT_LIMITS[user.role as keyof typeof FILE_COUNT_LIMITS] || FILE_COUNT_LIMITS.CLIENT;
    if (storageInfo.fileCount + additionalFiles > fileCountLimit) {
      return {
        allowed: false,
        reason: `File count limit exceeded. Current: ${storageInfo.fileCount}, Limit: ${fileCountLimit}`,
        quota: storageInfo
      };
    }

    return {
      allowed: true,
      quota: storageInfo
    };
  } catch (error) {
    console.error('Error checking storage availability:', error);
    return {
      allowed: false,
      reason: 'Internal error checking storage',
      quota: {
        userId,
        currentUsage: 0,
        quota: 0,
        available: 0,
        fileCount: 0
      }
    };
  }
}

/**
 * ファイルアップロード記録（実際のファイルストレージシステムと連携）
 */
export async function recordFileUpload(fileInfo: Omit<FileUploadInfo, 'uploadedAt'>): Promise<FileUploadInfo> {
  // 実際の実装では、ファイルメタデータをデータベースに保存
  // ここでは簡易実装として、Portfolioテーブルに記録する例
  
  const uploadedFile: FileUploadInfo = {
    ...fileInfo,
    uploadedAt: new Date()
  };

  // ログ記録
  console.log(`File uploaded: ${fileInfo.filename} (${Math.round(fileInfo.size / 1024)}KB) by user ${fileInfo.userId}`);

  return uploadedFile;
}

/**
 * 古いファイルの自動削除（管理者機能）
 */
export async function cleanupOldFiles(daysOld: number = 365): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // 古いポートフォリオファイルを削除
    const deletedPortfolios = await prisma.portfolio.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        // 追加の条件: 関連するInfluencerが非アクティブなど
      }
    });

    console.log(`Cleaned up ${deletedPortfolios.count} old portfolio files`);
    return deletedPortfolios.count;
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    throw error;
  }
}

/**
 * ストレージ統計取得（管理者向け）
 */
export async function getStorageStatistics(): Promise<{
  totalUsers: number;
  totalStorageUsed: number;
  averageUsagePerUser: number;
  usersByRole: Record<string, { count: number; avgUsage: number }>;
}> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, role: true }
    });

    const stats = {
      totalUsers: users.length,
      totalStorageUsed: 0,
      averageUsagePerUser: 0,
      usersByRole: {} as Record<string, { count: number; avgUsage: number }>
    };

    const roleStats: Record<string, { count: number; totalUsage: number }> = {};

    for (const user of users) {
      const usage = await getUserStorageUsage(user.id);
      stats.totalStorageUsed += usage.currentUsage;

      if (!roleStats[user.role]) {
        roleStats[user.role] = { count: 0, totalUsage: 0 };
      }
      roleStats[user.role].count++;
      roleStats[user.role].totalUsage += usage.currentUsage;
    }

    stats.averageUsagePerUser = stats.totalUsers > 0 ? stats.totalStorageUsed / stats.totalUsers : 0;

    // ロール別統計の計算
    for (const [role, data] of Object.entries(roleStats)) {
      stats.usersByRole[role] = {
        count: data.count,
        avgUsage: data.count > 0 ? data.totalUsage / data.count : 0
      };
    }

    return stats;
  } catch (error) {
    console.error('Error getting storage statistics:', error);
    throw error;
  }
}