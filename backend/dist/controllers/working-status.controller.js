"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusOptions = exports.getStatus = exports.updateStatus = void 0;
const working_status_service_1 = require("../services/working-status.service");
/**
 * Chapter 1-8: 稼働状況を更新
 */
const updateStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status, statusMessage, preferredMinPrice, preferredMaxPrice, preferredCategories, preferredPlatforms, preferredMinDays } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // バリデーション
        const errors = (0, working_status_service_1.validateWorkingStatusData)({
            status,
            statusMessage,
            preferredMinPrice,
            preferredMaxPrice,
            preferredCategories,
            preferredPlatforms,
            preferredMinDays,
        });
        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        const result = await (0, working_status_service_1.updateWorkingStatus)(influencer.id, {
            status,
            statusMessage,
            preferredMinPrice,
            preferredMaxPrice,
            preferredCategories,
            preferredPlatforms,
            preferredMinDays,
        });
        res.status(200).json({
            message: 'Working status updated successfully',
            ...result,
            description: (0, working_status_service_1.getStatusDescription)(status),
        });
    }
    catch (error) {
        console.error('Error updating working status:', error);
        res.status(500).json({ error: 'Failed to update working status' });
    }
};
exports.updateStatus = updateStatus;
/**
 * Chapter 1-8: 稼働状況を取得
 */
const getStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        const result = await (0, working_status_service_1.getWorkingStatus)(influencer.id);
        res.status(200).json({
            ...result,
            description: (0, working_status_service_1.getStatusDescription)(result.workingStatus),
        });
    }
    catch (error) {
        console.error('Error getting working status:', error);
        res.status(500).json({ error: 'Failed to get working status' });
    }
};
exports.getStatus = getStatus;
/**
 * 稼働状況の選択肢と説明を取得
 */
const getStatusOptions = async (req, res) => {
    try {
        const statuses = ['AVAILABLE', 'BUSY', 'UNAVAILABLE', 'BREAK'];
        const options = statuses.map((status) => ({
            value: status,
            label: {
                AVAILABLE: '積極的に受付中',
                BUSY: '選んで受付中',
                UNAVAILABLE: '現在多忙',
                BREAK: '長期休暇中',
            }[status],
            description: (0, working_status_service_1.getStatusDescription)(status),
        }));
        res.status(200).json({ statuses: options });
    }
    catch (error) {
        console.error('Error getting status options:', error);
        res.status(500).json({ error: 'Failed to get status options' });
    }
};
exports.getStatusOptions = getStatusOptions;
//# sourceMappingURL=working-status.controller.js.map