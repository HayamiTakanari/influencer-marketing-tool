"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMilestoneNotifications = exports.getUpcomingMilestones = exports.updateMilestone = exports.getProjectSchedule = exports.createProjectSchedule = void 0;
const client_1 = require("@prisma/client");
const schedule_1 = require("../schemas/schedule");
// フェーズの色とアイコンのマッピング
const getPhaseColor = (type) => {
    const colorMap = {
        FORMAL_REQUEST: 'bg-blue-500',
        PRODUCT_RECEIPT: 'bg-green-500',
        DRAFT_CREATION: 'bg-purple-500',
        DRAFT_SUBMISSION: 'bg-indigo-500',
        SCRIPT_FEEDBACK: 'bg-yellow-500',
        SCRIPT_REVISION: 'bg-orange-500',
        SCRIPT_FINALIZE: 'bg-red-500',
        SHOOTING_PERIOD: 'bg-pink-500',
        VIDEO_DRAFT_SUBMIT: 'bg-teal-500',
        VIDEO_FEEDBACK: 'bg-cyan-500',
        VIDEO_REVISION: 'bg-emerald-500',
        VIDEO_FINAL_SUBMIT: 'bg-lime-500',
        VIDEO_FINALIZE: 'bg-amber-500',
        POSTING_PERIOD: 'bg-rose-500',
        INSIGHT_SUBMIT: 'bg-violet-500'
    };
    return colorMap[type] || 'bg-gray-500';
};
const getPhaseIcon = (type) => {
    const iconMap = {
        FORMAL_REQUEST: '📄',
        PRODUCT_RECEIPT: '📦',
        DRAFT_CREATION: '✏️',
        DRAFT_SUBMISSION: '📝',
        SCRIPT_FEEDBACK: '💬',
        SCRIPT_REVISION: '🔄',
        SCRIPT_FINALIZE: '✅',
        SHOOTING_PERIOD: '🎥',
        VIDEO_DRAFT_SUBMIT: '🎬',
        VIDEO_FEEDBACK: '📹',
        VIDEO_REVISION: '🎞️',
        VIDEO_FINAL_SUBMIT: '💾',
        VIDEO_FINALIZE: '🎯',
        POSTING_PERIOD: '📱',
        INSIGHT_SUBMIT: '📊'
    };
    return iconMap[type] || '📋';
};
const prisma = new client_1.PrismaClient();
// v3.0 新機能: スケジュール管理コントローラー
const createProjectSchedule = async (req, res) => {
    try {
        const { user } = req;
        if (!user || user.role !== 'CLIENT') {
            return res.status(403).json({ error: 'クライアントのみスケジュールを作成できます' });
        }
        const validatedData = schedule_1.createProjectScheduleSchema.parse(req.body);
        const client = await prisma.client.findUnique({
            where: { userId: user.userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'クライアント情報が見つかりません' });
        }
        // プロジェクトの存在確認と所有者チェック
        const project = await prisma.project.findFirst({
            where: {
                id: validatedData.projectId,
                clientId: client.id,
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'プロジェクトが見つかりません' });
        }
        // 既存のスケジュールがあるかチェック
        const existingSchedule = await prisma.projectSchedule.findUnique({
            where: { projectId: validatedData.projectId },
        });
        if (existingSchedule) {
            return res.status(409).json({ error: '既にスケジュールが作成されています' });
        }
        // スケジュール作成
        const schedule = await prisma.projectSchedule.create({
            data: {
                projectId: validatedData.projectId,
                publishDate: new Date(validatedData.publishDate),
            },
        });
        // マイルストーン作成
        const milestones = await Promise.all(validatedData.milestones.map(milestone => prisma.milestone.create({
            data: {
                scheduleId: schedule.id,
                type: milestone.type,
                title: milestone.title,
                description: milestone.description,
                dueDate: new Date(milestone.dueDate),
            },
        })));
        res.status(201).json({
            message: 'スケジュールを作成しました',
            schedule: {
                ...schedule,
                milestones,
            },
        });
    }
    catch (error) {
        console.error('Create project schedule error:', error);
        if (error instanceof Error && 'issues' in error) {
            return res.status(400).json({
                error: 'バリデーションエラー',
                details: error.issues
            });
        }
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.createProjectSchedule = createProjectSchedule;
const getProjectSchedule = async (req, res) => {
    try {
        const { user } = req;
        const { projectId } = req.params;
        if (!user) {
            return res.status(401).json({ error: '認証が必要です' });
        }
        // プロジェクトの存在確認とアクセス権限チェック
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: { select: { userId: true } },
                matchedInfluencer: { select: { userId: true } },
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'プロジェクトが見つかりません' });
        }
        // アクセス権限チェック
        const hasAccess = project.client.userId === user.userId ||
            project.matchedInfluencer?.userId === user.userId;
        if (!hasAccess) {
            return res.status(403).json({ error: 'アクセス権限がありません' });
        }
        const schedule = await prisma.projectSchedule.findUnique({
            where: { projectId },
            include: {
                milestones: {
                    orderBy: { dueDate: 'asc' },
                },
            },
        });
        if (!schedule) {
            return res.status(404).json({ error: 'スケジュールが見つかりません' });
        }
        // フロントエンド用のフォーマットに変換
        const phases = schedule.milestones.map(milestone => ({
            id: milestone.id,
            type: milestone.type,
            title: milestone.title,
            description: milestone.description,
            startDate: milestone.dueDate?.toISOString(),
            endDate: milestone.dueDate?.toISOString(),
            status: milestone.isCompleted ? 'completed' : 'pending',
            isDateRange: false,
            color: getPhaseColor(milestone.type),
            icon: getPhaseIcon(milestone.type),
        }));
        res.json({
            phases,
            createdAt: schedule.createdAt.toISOString(),
            updatedAt: schedule.updatedAt.toISOString()
        });
    }
    catch (error) {
        console.error('Get project schedule error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getProjectSchedule = getProjectSchedule;
const updateMilestone = async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;
        if (!user) {
            return res.status(401).json({ error: '認証が必要です' });
        }
        const validatedData = schedule_1.updateMilestoneSchemaExport.parse(req.body);
        // マイルストーンの存在確認とアクセス権限チェック
        const milestone = await prisma.milestone.findUnique({
            where: { id },
            include: {
                schedule: {
                    include: {
                        project: {
                            include: {
                                client: { select: { userId: true } },
                                matchedInfluencer: { select: { userId: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!milestone) {
            return res.status(404).json({ error: 'マイルストーンが見つかりません' });
        }
        // アクセス権限チェック
        const hasAccess = milestone.schedule.project.client.userId === user.userId ||
            milestone.schedule.project.matchedInfluencer?.userId === user.userId;
        if (!hasAccess) {
            return res.status(403).json({ error: 'アクセス権限がありません' });
        }
        const updatedMilestone = await prisma.milestone.update({
            where: { id },
            data: {
                ...validatedData,
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
                completedAt: validatedData.isCompleted ? new Date() : null,
            },
        });
        res.json({
            message: 'マイルストーンを更新しました',
            milestone: updatedMilestone,
        });
    }
    catch (error) {
        console.error('Update milestone error:', error);
        if (error instanceof Error && 'issues' in error) {
            return res.status(400).json({
                error: 'バリデーションエラー',
                details: error.issues
            });
        }
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.updateMilestone = updateMilestone;
const getUpcomingMilestones = async (req, res) => {
    try {
        const { user } = req;
        const { days = 7 } = req.query;
        if (!user) {
            return res.status(401).json({ error: '認証が必要です' });
        }
        const daysInt = parseInt(days);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysInt);
        let projectCondition = {};
        if (user.role === 'CLIENT') {
            const client = await prisma.client.findUnique({
                where: { userId: user.userId },
            });
            if (!client) {
                return res.status(404).json({ error: 'クライアント情報が見つかりません' });
            }
            projectCondition = { clientId: client.id };
        }
        else if (user.role === 'INFLUENCER') {
            const influencer = await prisma.influencer.findUnique({
                where: { userId: user.userId },
            });
            if (!influencer) {
                return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
            }
            projectCondition = { matchedInfluencerId: influencer.id };
        }
        const milestones = await prisma.milestone.findMany({
            where: {
                dueDate: {
                    gte: new Date(),
                    lte: endDate,
                },
                isCompleted: false,
                schedule: {
                    project: projectCondition,
                },
            },
            include: {
                schedule: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                title: true,
                                client: {
                                    select: {
                                        companyName: true,
                                    },
                                },
                                matchedInfluencer: {
                                    select: {
                                        displayName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        res.json({ milestones });
    }
    catch (error) {
        console.error('Get upcoming milestones error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getUpcomingMilestones = getUpcomingMilestones;
const sendMilestoneNotifications = async (req, res) => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        // 明日が期限のマイルストーンを取得
        const milestones = await prisma.milestone.findMany({
            where: {
                dueDate: {
                    gte: tomorrow,
                    lte: endOfTomorrow,
                },
                isCompleted: false,
                notificationSent: false,
            },
            include: {
                schedule: {
                    include: {
                        project: {
                            include: {
                                client: { select: { userId: true } },
                                matchedInfluencer: { select: { userId: true } },
                            },
                        },
                    },
                },
            },
        });
        const notifications = [];
        for (const milestone of milestones) {
            const project = milestone.schedule.project;
            // クライアントに通知
            if (project.client.userId) {
                notifications.push(prisma.notification.create({
                    data: {
                        userId: project.client.userId,
                        type: 'PROJECT_STATUS_CHANGED',
                        title: 'マイルストーン期限のお知らせ',
                        message: `「${project.title}」の「${milestone.title}」が明日期限です`,
                        data: {
                            projectId: project.id,
                            milestoneId: milestone.id,
                            scheduleId: milestone.scheduleId,
                        },
                    },
                }));
            }
            // インフルエンサーに通知
            if (project.matchedInfluencer?.userId) {
                notifications.push(prisma.notification.create({
                    data: {
                        userId: project.matchedInfluencer.userId,
                        type: 'PROJECT_STATUS_CHANGED',
                        title: 'マイルストーン期限のお知らせ',
                        message: `「${project.title}」の「${milestone.title}」が明日期限です`,
                        data: {
                            projectId: project.id,
                            milestoneId: milestone.id,
                            scheduleId: milestone.scheduleId,
                        },
                    },
                }));
            }
            // 通知送信フラグを更新
            notifications.push(prisma.milestone.update({
                where: { id: milestone.id },
                data: { notificationSent: true },
            }));
        }
        await Promise.all(notifications);
        res.json({
            message: `${milestones.length}件のマイルストーン通知を送信しました`,
            count: milestones.length,
        });
    }
    catch (error) {
        console.error('Send milestone notifications error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.sendMilestoneNotifications = sendMilestoneNotifications;
