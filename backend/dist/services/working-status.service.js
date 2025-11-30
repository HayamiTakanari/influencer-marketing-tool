"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkingStatusForDisplay = exports.getStatusDescription = exports.validateWorkingStatusData = exports.getWorkingStatus = exports.updateWorkingStatus = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * 稼働状況を更新
 */
const updateWorkingStatus = async (influencerId, statusData) => {
    try {
        // インフルエンサーの存在確認
        const influencer = await prisma.influencer.findUnique({
            where: { id: influencerId },
        });
        if (!influencer) {
            throw new Error('Influencer not found');
        }
        // 稼働状況を更新
        const updated = await prisma.influencer.update({
            where: { id: influencerId },
            data: {
                workingStatus: statusData.status,
                workingStatusMessage: statusData.statusMessage || null,
                workingStatusUpdatedAt: new Date(),
                preferredMinPrice: statusData.preferredMinPrice || null,
                preferredMaxPrice: statusData.preferredMaxPrice || null,
                preferredCategories: statusData.preferredCategories || [],
                preferredPlatforms: statusData.preferredPlatforms || [],
                preferredMinDays: statusData.preferredMinDays || null,
                preferredMessageUpdated: new Date(),
            },
        });
        console.log(`✓ Working status updated for influencer: ${influencerId}`);
        return {
            workingStatus: updated.workingStatus,
            statusMessage: updated.workingStatusMessage,
            preferences: {
                minPrice: updated.preferredMinPrice,
                maxPrice: updated.preferredMaxPrice,
                categories: updated.preferredCategories,
                platforms: updated.preferredPlatforms,
                minDays: updated.preferredMinDays,
            },
            updatedAt: updated.workingStatusUpdatedAt,
        };
    }
    catch (error) {
        console.error('Error updating working status:', error);
        throw error;
    }
};
exports.updateWorkingStatus = updateWorkingStatus;
/**
 * 稼働状況を取得
 */
const getWorkingStatus = async (influencerId) => {
    try {
        const influencer = await prisma.influencer.findUnique({
            where: { id: influencerId },
            select: {
                workingStatus: true,
                workingStatusMessage: true,
                workingStatusUpdatedAt: true,
                preferredMinPrice: true,
                preferredMaxPrice: true,
                preferredCategories: true,
                preferredPlatforms: true,
                preferredMinDays: true,
                preferredMessageUpdated: true,
            },
        });
        if (!influencer) {
            throw new Error('Influencer not found');
        }
        return {
            workingStatus: influencer.workingStatus,
            statusMessage: influencer.workingStatusMessage,
            preferences: {
                minPrice: influencer.preferredMinPrice,
                maxPrice: influencer.preferredMaxPrice,
                categories: influencer.preferredCategories,
                platforms: influencer.preferredPlatforms,
                minDays: influencer.preferredMinDays,
            },
            updatedAt: influencer.workingStatusUpdatedAt,
        };
    }
    catch (error) {
        console.error('Error getting working status:', error);
        throw error;
    }
};
exports.getWorkingStatus = getWorkingStatus;
/**
 * 稼働状況のバリデーション
 */
const validateWorkingStatusData = (statusData) => {
    const errors = [];
    // ステータスの検証
    const validStatuses = ['AVAILABLE', 'BUSY', 'UNAVAILABLE', 'BREAK'];
    if (!validStatuses.includes(statusData.status)) {
        errors.push('不正な稼働状況です');
    }
    // 最低報酬と最高報酬の検証
    if (statusData.preferredMinPrice && statusData.preferredMaxPrice) {
        if (statusData.preferredMinPrice > statusData.preferredMaxPrice) {
            errors.push('最低報酬は最高報酬以下である必要があります');
        }
    }
    if (statusData.preferredMinPrice && statusData.preferredMinPrice < 0) {
        errors.push('報酬額は0以上である必要があります');
    }
    // 最短対応日数の検証
    if (statusData.preferredMinDays && statusData.preferredMinDays < 0) {
        errors.push('対応日数は0以上である必要があります');
    }
    return errors;
};
exports.validateWorkingStatusData = validateWorkingStatusData;
/**
 * 稼働状況の説明を取得
 */
const getStatusDescription = (status) => {
    const descriptions = {
        AVAILABLE: '積極的に受付中 - 新規案件を積極的に探している状態です。検索結果で上位に表示されやすくなり、スカウトを受けやすくなります。',
        BUSY: '選んで受付中 - 条件が合えば新規案件を受け付ける状態です。通常の表示順位でスカウトを受けることができます。',
        UNAVAILABLE: '現在多忙 - 進行中の案件が多く、新規案件の受付を一時的に停止している状態です。検索結果には表示されますが、「多忙」のラベルが付きます。',
        BREAK: '長期休暇中 - 休暇や活動休止中で、一切の新規案件を受け付けない状態です。検索結果には表示されません。',
    };
    return descriptions[status];
};
exports.getStatusDescription = getStatusDescription;
/**
 * 稼働状況を取得（検索用）
 * プロフィール閲覧時に使用
 */
const getWorkingStatusForDisplay = async (influencerId) => {
    try {
        const influencer = await prisma.influencer.findUnique({
            where: { id: influencerId },
            select: {
                displayName: true,
                workingStatus: true,
                workingStatusMessage: true,
            },
        });
        if (!influencer) {
            return null;
        }
        return {
            displayName: influencer.displayName,
            status: influencer.workingStatus,
            message: influencer.workingStatusMessage,
            description: (0, exports.getStatusDescription)(influencer.workingStatus),
        };
    }
    catch (error) {
        console.error('Error getting working status for display:', error);
        throw error;
    }
};
exports.getWorkingStatusForDisplay = getWorkingStatusForDisplay;
//# sourceMappingURL=working-status.service.js.map