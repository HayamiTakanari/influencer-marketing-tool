"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoiceSummary = exports.markAsPaid = exports.getInvoice = exports.getPendingInvoices = exports.createInvoice = void 0;
const client_1 = require("@prisma/client");
const billing_service_1 = require("../services/billing.service");
const prisma = new client_1.PrismaClient();
// Chapter 7: Create invoice
const createInvoice = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { projectId, influencerId, amount } = req.body;
        if (!projectId || !influencerId || !amount) {
            return res.status(400).json({ error: '必須項目が不足しています' });
        }
        // Get client info
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(403).json({ error: 'クライアント権限がありません' });
        }
        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true, title: true },
        });
        if (!project || project.clientId !== client.id) {
            return res.status(403).json({ error: 'プロジェクトの権限がありません' });
        }
        const invoice = await billing_service_1.BillingService.createInvoice(projectId, client.id, influencerId, amount);
        res.status(201).json({
            message: '請求書を作成しました',
            invoice,
        });
    }
    catch (error) {
        console.error('Invoice creation error:', error);
        res.status(500).json({ error: '請求書作成に失敗しました' });
    }
};
exports.createInvoice = createInvoice;
// Chapter 7: Get pending invoices
const getPendingInvoices = async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        if (!role) {
            return res.status(400).json({ error: 'ロール情報が必須です' });
        }
        const invoices = await billing_service_1.BillingService.getPendingInvoices(userId, role);
        res.json({ invoices });
    }
    catch (error) {
        console.error('Get pending invoices error:', error);
        res.status(500).json({ error: '請求書取得に失敗しました' });
    }
};
exports.getPendingInvoices = getPendingInvoices;
// Chapter 7: Get invoice details
const getInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.id;
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                project: { select: { title: true } },
                client: { select: { userId: true } },
                influencer: { select: { userId: true } },
            },
        });
        if (!invoice) {
            return res.status(404).json({ error: '請求書が見つかりません' });
        }
        // Verify access
        const hasAccess = invoice.client.userId === userId || invoice.influencer.userId === userId;
        if (!hasAccess) {
            return res.status(403).json({ error: '権限がありません' });
        }
        res.json({ invoice });
    }
    catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: '請求書取得に失敗しました' });
    }
};
exports.getInvoice = getInvoice;
// Chapter 7: Mark invoice as paid
const markAsPaid = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { invoiceId } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: { select: { userId: true } },
            },
        });
        if (!invoice) {
            return res.status(404).json({ error: '請求書が見つかりません' });
        }
        // Only client can mark as paid
        if (invoice.client.userId !== userId) {
            return res.status(403).json({ error: '権限がありません' });
        }
        const updated = await billing_service_1.BillingService.markAsPaid(invoiceId);
        res.json({
            message: '請求書を支払い済みにしました',
            invoice: updated,
        });
    }
    catch (error) {
        console.error('Mark as paid error:', error);
        res.status(500).json({ error: '支払い処理に失敗しました' });
    }
};
exports.markAsPaid = markAsPaid;
// Chapter 7: Get invoice summary
const getInvoiceSummary = async (req, res) => {
    try {
        const userId = req.user?.id;
        const summary = await billing_service_1.BillingService.getInvoiceSummary(userId);
        res.json({ summary });
    }
    catch (error) {
        console.error('Get invoice summary error:', error);
        res.status(500).json({ error: '請求書サマリー取得に失敗しました' });
    }
};
exports.getInvoiceSummary = getInvoiceSummary;
//# sourceMappingURL=invoice.controller.js.map