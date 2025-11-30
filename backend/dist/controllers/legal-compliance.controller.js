"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLegalDocument = exports.getComplianceReport = exports.getUserConsentStatus = exports.acceptLegalDocument = exports.getLegalDocument = exports.getLegalDocuments = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Chapter 14: Get legal documents
const getLegalDocuments = async (req, res) => {
    try {
        const documents = await prisma.legalDocument.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                documentType: true,
                version: true,
                effectiveDate: true,
                createdAt: true,
            },
        });
        res.json({ documents });
    }
    catch (error) {
        console.error('Get legal documents error:', error);
        res.status(500).json({ error: '法的文書取得に失敗しました' });
    }
};
exports.getLegalDocuments = getLegalDocuments;
// Chapter 14: Get specific document
const getLegalDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const document = await prisma.legalDocument.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({ error: '文書が見つかりません' });
        }
        res.json({ document });
    }
    catch (error) {
        console.error('Get legal document error:', error);
        res.status(500).json({ error: '文書取得に失敗しました' });
    }
};
exports.getLegalDocument = getLegalDocument;
// Chapter 14: Accept legal document
const acceptLegalDocument = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { documentId } = req.params;
        const { ipAddress } = req.body;
        const document = await prisma.legalDocument.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({ error: '文書が見つかりません' });
        }
        // Check if already accepted
        const existing = await prisma.documentConsent.findUnique({
            where: {
                userId_documentId: {
                    userId,
                    documentId,
                },
            },
        });
        if (existing) {
            return res.status(400).json({ error: 'すでに同意済みです' });
        }
        // Create consent record
        const consent = await prisma.documentConsent.create({
            data: {
                userId,
                documentId,
                consentedAt: new Date(),
                ipAddress: ipAddress || req.ip,
                userAgent: req.get('user-agent'),
            },
        });
        // Log compliance event
        await prisma.systemLog.create({
            data: {
                userId,
                action: 'DOCUMENT_ACCEPTED',
                entityType: 'LegalDocument',
                entityId: documentId,
                details: {
                    documentTitle: document.title,
                    version: document.version,
                },
            },
        });
        res.status(201).json({
            message: '同意を記録しました',
            consent,
        });
    }
    catch (error) {
        console.error('Accept legal document error:', error);
        res.status(500).json({ error: '同意記録に失敗しました' });
    }
};
exports.acceptLegalDocument = acceptLegalDocument;
// Chapter 14: Get user consent status
const getUserConsentStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Get all active legal documents
        const allDocuments = await prisma.legalDocument.findMany({
            where: { isActive: true },
            select: { id: true, title: true, documentType: true },
        });
        // Get user's consents
        const userConsents = await prisma.documentConsent.findMany({
            where: { userId },
            select: { documentId: true, consentedAt: true },
        });
        const consentMap = new Map(userConsents.map(c => [c.documentId, c.consentedAt]));
        const status = allDocuments.map(doc => ({
            documentId: doc.id,
            title: doc.title,
            documentType: doc.documentType,
            accepted: consentMap.has(doc.id),
            acceptedAt: consentMap.get(doc.id) || null,
        }));
        // Check if all required documents are accepted
        const allAccepted = status.every(s => s.accepted);
        res.json({
            status,
            allAccepted,
            pendingCount: status.filter(s => !s.accepted).length,
        });
    }
    catch (error) {
        console.error('Get user consent status error:', error);
        res.status(500).json({ error: '同意状態取得に失敗しました' });
    }
};
exports.getUserConsentStatus = getUserConsentStatus;
// Chapter 14: Get compliance report (admin)
const getComplianceReport = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        // Get documents
        const documents = await prisma.legalDocument.findMany({
            where: { isActive: true },
        });
        // Calculate consent statistics
        const stats = await Promise.all(documents.map(async (doc) => {
            const consentCount = await prisma.documentConsent.count({
                where: { documentId: doc.id },
            });
            const userCount = await prisma.user.count();
            const acceptanceRate = userCount > 0 ? (consentCount / userCount) * 100 : 0;
            return {
                documentId: doc.id,
                title: doc.title,
                documentType: doc.documentType,
                version: doc.version,
                totalUsers: userCount,
                usersAccepted: consentCount,
                acceptanceRate: parseFloat(acceptanceRate.toFixed(2)),
                effectiveDate: doc.effectiveDate,
            };
        }));
        res.json({ complianceReport: stats });
    }
    catch (error) {
        console.error('Get compliance report error:', error);
        res.status(500).json({ error: 'コンプライアンスレポート取得に失敗しました' });
    }
};
exports.getComplianceReport = getComplianceReport;
// Chapter 14: Create legal document (admin)
const createLegalDocument = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const { title, documentType, content, version } = req.body;
        if (!title || !documentType || !content || !version) {
            return res.status(400).json({ error: '必須項目が不足しています' });
        }
        // Deactivate previous versions
        await prisma.legalDocument.updateMany({
            where: { documentType },
            data: { isActive: false },
        });
        const document = await prisma.legalDocument.create({
            data: {
                title,
                documentType,
                content,
                version,
                isActive: true,
                effectiveDate: new Date(),
            },
        });
        // Log creation
        await prisma.systemLog.create({
            data: {
                userId: req.user?.id,
                action: 'DOCUMENT_CREATED',
                entityType: 'LegalDocument',
                entityId: document.id,
                details: { title, documentType, version },
            },
        });
        res.status(201).json({
            message: '法的文書を作成しました',
            document,
        });
    }
    catch (error) {
        console.error('Create legal document error:', error);
        res.status(500).json({ error: '法的文書作成に失敗しました' });
    }
};
exports.createLegalDocument = createLegalDocument;
//# sourceMappingURL=legal-compliance.controller.js.map