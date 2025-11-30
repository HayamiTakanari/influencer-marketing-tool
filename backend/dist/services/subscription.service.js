"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const prisma = new client_1.PrismaClient();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29',
});
// Chapter 11: Subscription Plans service
class SubscriptionService {
    // Get all active plans
    static async getActivePlans() {
        return await prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' },
        });
    }
    // Create subscription
    static async createSubscription(userId, planId, stripeSubscriptionId) {
        const subscription = await prisma.userSubscription.create({
            data: {
                userId,
                planId,
                status: 'ACTIVE',
                autoRenew: true,
                nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            include: { plan: true },
        });
        // Create notification
        await prisma.notification.create({
            data: {
                userId,
                type: 'PAYMENT_COMPLETED',
                title: 'サブスクリプション登録完了',
                message: `プランの登録が完了しました: ${subscription.plan.name}`,
                data: {
                    planId,
                    subscriptionId: subscription.id,
                },
            },
        });
        return subscription;
    }
    // Get user's active subscription
    static async getUserSubscription(userId) {
        return await prisma.userSubscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
            },
            include: { plan: true },
        });
    }
    // Cancel subscription
    static async cancelSubscription(subscriptionId) {
        const subscription = await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'CANCELLED',
                endDate: new Date(),
            },
        });
        // Notify user
        await prisma.notification.create({
            data: {
                userId: subscription.userId,
                type: 'PAYMENT_COMPLETED',
                title: 'サブスクリプション解約完了',
                message: 'サブスクリプションが解約されました',
                data: {
                    subscriptionId,
                },
            },
        });
        return subscription;
    }
    // Check if subscription is still valid
    static async isSubscriptionValid(userId) {
        const subscription = await this.getUserSubscription(userId);
        if (!subscription)
            return false;
        // Check if expired
        if (subscription.endDate && subscription.endDate < new Date()) {
            return false;
        }
        return true;
    }
    // Initialize default plans
    static async initializeDefaultPlans() {
        const plans = [
            {
                name: 'STARTER',
                description: '初心者向け',
                price: 2900,
                billingCycle: 'monthly',
                maxProjects: 5,
                maxTeamMembers: 1,
                features: ['基本機能', 'メール搸定', 'スケジュール管理'],
            },
            {
                name: 'PROFESSIONAL',
                description: 'プロフェッショナル向け',
                price: 9900,
                billingCycle: 'monthly',
                maxProjects: 20,
                maxTeamMembers: 5,
                features: ['全基本機能', '優先サポート', 'API アクセス', 'チームコラボレーション'],
            },
            {
                name: 'ENTERPRISE',
                description: 'エンタープライズ向け',
                price: 29900,
                billingCycle: 'monthly',
                maxProjects: 100,
                maxTeamMembers: 20,
                features: ['全機能', '24/7 サポート', 'カスタムイントグレーション', '専任アカウント担当者'],
            },
        ];
        for (const plan of plans) {
            const existing = await prisma.subscriptionPlan.findUnique({
                where: { name: plan.name },
            });
            if (!existing) {
                await prisma.subscriptionPlan.create({
                    data: plan,
                });
            }
        }
    }
}
exports.SubscriptionService = SubscriptionService;
//# sourceMappingURL=subscription.service.js.map