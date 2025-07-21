"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInquiryStats = exports.getBulkInquiryById = exports.updateInquiryResponse = exports.getMyInquiryResponses = exports.getMyBulkInquiries = exports.createBulkInquiry = void 0;
const client_1 = require("@prisma/client");
const bulkInquiry_1 = require("../schemas/bulkInquiry");
const prisma = new client_1.PrismaClient();
// v3.0 新機能: 一斉問い合わせコントローラー
const createBulkInquiry = async (req, res) => {
    try {
        const { user } = req;
        if (!user || (user.role !== 'CLIENT' && user.role !== 'COMPANY')) {
            return res.status(403).json({ error: 'クライアント・企業のみ問い合わせを作成できます' });
        }
        const validatedData = bulkInquiry_1.createBulkInquirySchema.parse(req.body);
        const client = await prisma.client.findUnique({
            where: { userId: user.userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'クライアント情報が見つかりません' });
        }
        // 対象インフルエンサーが存在するかチェック
        const influencers = await prisma.influencer.findMany({
            where: {
                id: { in: validatedData.targetInfluencers },
            },
        });
        if (influencers.length !== validatedData.targetInfluencers.length) {
            return res.status(400).json({ error: '一部のインフルエンサーが見つかりません' });
        }
        // 問い合わせ作成
        const bulkInquiry = await prisma.bulkInquiry.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                budget: validatedData.budget,
                deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
                requiredServices: validatedData.requiredServices,
                clientId: client.id,
            },
        });
        // 各インフルエンサーへの個別問い合わせレスポンスを作成
        const responses = await Promise.all(validatedData.targetInfluencers.map(influencerId => prisma.inquiryResponse.create({
            data: {
                inquiryId: bulkInquiry.id,
                influencerId,
                status: 'PENDING',
            },
        })));
        // 通知を送信（各インフルエンサーに）
        await Promise.all(influencers.map(influencer => prisma.notification.create({
            data: {
                userId: influencer.userId,
                type: 'APPLICATION_RECEIVED',
                title: '新しい問い合わせが届きました',
                message: `${client.companyName}から「${validatedData.title}」の問い合わせが届きました`,
                data: {
                    inquiryId: bulkInquiry.id,
                    clientId: client.id,
                },
            },
        })));
        res.status(201).json({
            message: '問い合わせを送信しました',
            inquiry: bulkInquiry,
            responseCount: responses.length,
        });
    }
    catch (error) {
        console.error('Create bulk inquiry error:', error);
        if (error instanceof Error && 'issues' in error) {
            return res.status(400).json({
                error: 'バリデーションエラー',
                details: error.issues
            });
        }
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.createBulkInquiry = createBulkInquiry;
const getMyBulkInquiries = async (req, res) => {
    try {
        const { user } = req;
        if (!user || (user.role !== 'CLIENT' && user.role !== 'COMPANY')) {
            return res.status(403).json({ error: 'クライアント・企業のみアクセスできます' });
        }
        const client = await prisma.client.findUnique({
            where: { userId: user.userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'クライアント情報が見つかりません' });
        }
        const inquiries = await prisma.bulkInquiry.findMany({
            where: { clientId: client.id },
            include: {
                responses: {
                    include: {
                        influencer: {
                            select: {
                                id: true,
                                displayName: true,
                                user: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        responses: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ inquiries });
    }
    catch (error) {
        console.error('Get bulk inquiries error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getMyBulkInquiries = getMyBulkInquiries;
const getMyInquiryResponses = async (req, res) => {
    try {
        const { user } = req;
        if (!user || user.role !== 'INFLUENCER') {
            return res.status(403).json({ error: 'インフルエンサーのみアクセスできます' });
        }
        const influencer = await prisma.influencer.findUnique({
            where: { userId: user.userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
        }
        const responses = await prisma.inquiryResponse.findMany({
            where: { influencerId: influencer.id },
            include: {
                inquiry: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                companyName: true,
                                contactName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ responses });
    }
    catch (error) {
        console.error('Get inquiry responses error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getMyInquiryResponses = getMyInquiryResponses;
const updateInquiryResponse = async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;
        if (!user || user.role !== 'INFLUENCER') {
            return res.status(403).json({ error: 'インフルエンサーのみ回答できます' });
        }
        const validatedData = bulkInquiry_1.updateInquiryResponseSchema.parse(req.body);
        const influencer = await prisma.influencer.findUnique({
            where: { userId: user.userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
        }
        // 回答の所有者確認
        const existingResponse = await prisma.inquiryResponse.findFirst({
            where: {
                id,
                influencerId: influencer.id,
            },
            include: {
                inquiry: {
                    include: {
                        client: {
                            select: {
                                userId: true,
                                companyName: true,
                            },
                        },
                    },
                },
            },
        });
        if (!existingResponse) {
            return res.status(404).json({ error: '問い合わせが見つかりません' });
        }
        const response = await prisma.inquiryResponse.update({
            where: { id },
            data: {
                ...validatedData,
                availableFrom: validatedData.availableFrom ? new Date(validatedData.availableFrom) : null,
                availableTo: validatedData.availableTo ? new Date(validatedData.availableTo) : null,
            },
        });
        // クライアントに通知
        await prisma.notification.create({
            data: {
                userId: existingResponse.inquiry.client.userId,
                type: validatedData.status === 'ACCEPTED' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
                title: '問い合わせに回答がありました',
                message: `${influencer.displayName}さんから「${existingResponse.inquiry.title}」の問い合わせに回答がありました`,
                data: {
                    inquiryId: existingResponse.inquiryId,
                    responseId: response.id,
                    influencerId: influencer.id,
                },
            },
        });
        res.json({
            message: '回答を更新しました',
            response,
        });
    }
    catch (error) {
        console.error('Update inquiry response error:', error);
        if (error instanceof Error && 'issues' in error) {
            return res.status(400).json({
                error: 'バリデーションエラー',
                details: error.issues
            });
        }
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.updateInquiryResponse = updateInquiryResponse;
const getBulkInquiryById = async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;
        const inquiry = await prisma.bulkInquiry.findUnique({
            where: { id },
            include: {
                client: {
                    select: {
                        id: true,
                        companyName: true,
                        contactName: true,
                    },
                },
                responses: {
                    include: {
                        influencer: {
                            select: {
                                id: true,
                                displayName: true,
                                user: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!inquiry) {
            return res.status(404).json({ error: '問い合わせが見つかりません' });
        }
        // アクセス権限チェック
        if (user?.role === 'CLIENT' || user?.role === 'COMPANY') {
            const client = await prisma.client.findUnique({
                where: { userId: user.userId },
            });
            if (!client || inquiry.clientId !== client.id) {
                return res.status(403).json({ error: 'アクセス権限がありません' });
            }
        }
        else if (user?.role === 'INFLUENCER') {
            const influencer = await prisma.influencer.findUnique({
                where: { userId: user.userId },
            });
            if (!influencer || !inquiry.responses.some(r => r.influencerId === influencer.id)) {
                return res.status(403).json({ error: 'アクセス権限がありません' });
            }
        }
        else {
            return res.status(403).json({ error: 'アクセス権限がありません' });
        }
        res.json({ inquiry });
    }
    catch (error) {
        console.error('Get bulk inquiry error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getBulkInquiryById = getBulkInquiryById;
const getInquiryStats = async (req, res) => {
    try {
        const { user } = req;
        if (!user || (user.role !== 'CLIENT' && user.role !== 'COMPANY')) {
            return res.status(403).json({ error: 'クライアント・企業のみアクセスできます' });
        }
        const client = await prisma.client.findUnique({
            where: { userId: user.userId },
        });
        if (!client) {
            return res.status(404).json({ error: 'クライアント情報が見つかりません' });
        }
        // 問い合わせ統計
        const totalInquiries = await prisma.bulkInquiry.count({
            where: { clientId: client.id },
        });
        const responseStats = await prisma.inquiryResponse.groupBy({
            by: ['status'],
            where: {
                inquiry: {
                    clientId: client.id,
                },
            },
            _count: {
                status: true,
            },
        });
        const totalResponses = responseStats.reduce((sum, stat) => sum + stat._count.status, 0);
        res.json({
            totalInquiries,
            totalResponses,
            responseStats,
        });
    }
    catch (error) {
        console.error('Get inquiry stats error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getInquiryStats = getInquiryStats;
