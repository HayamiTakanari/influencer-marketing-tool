"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectDocument = exports.approveDocument = exports.getDocumentStatus = exports.uploadDocument = void 0;
const document_verification_service_1 = require("../services/document-verification.service");
/**
 * Chapter 1-2: 本人確認書類のアップロード
 * 企業：登記簿謄本、インフルエンサー：身分証明書
 */
const uploadDocument = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { documentType } = req.body;
        const file = req.file;
        // バリデーション
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!file) {
            res.status(400).json({ error: 'File is required' });
            return;
        }
        if (!documentType) {
            res.status(400).json({ error: 'Document type is required' });
            return;
        }
        // ドキュメントタイプの検証
        const validTypes = ['BUSINESS_REGISTRATION', 'ID_DOCUMENT', 'INVOICE_DOCUMENT'];
        if (!validTypes.includes(documentType)) {
            res.status(400).json({
                error: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
            });
            return;
        }
        // ドキュメントをアップロード
        const result = await (0, document_verification_service_1.uploadVerificationDocument)(userId, documentType, file.buffer, file.originalname, file.size);
        res.status(201).json({
            message: 'Document uploaded successfully',
            document: result,
            nextStep: 'Await admin review for document approval',
        });
    }
    catch (error) {
        console.error('Document upload error:', error);
        if (error instanceof Error) {
            if (error.message.includes('exceeds maximum') || error.message.includes('Invalid file')) {
                res.status(400).json({ error: error.message });
                return;
            }
            if (error.message.includes('not found')) {
                res.status(404).json({ error: error.message });
                return;
            }
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.uploadDocument = uploadDocument;
/**
 * Chapter 1-2: 本人確認書類の状態確認
 */
const getDocumentStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { documentType } = req.query;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // ドキュメント状態を取得
        const documents = await (0, document_verification_service_1.getVerificationDocumentStatus)(userId, documentType);
        res.json({
            documents,
            summary: {
                total: documents.length,
                approved: documents.filter((d) => d.status === 'APPROVED').length,
                pending: documents.filter((d) => d.status === 'PENDING').length,
                rejected: documents.filter((d) => d.status === 'RESUBMIT_REQUIRED').length,
            },
        });
    }
    catch (error) {
        console.error('Error getting document status:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDocumentStatus = getDocumentStatus;
/**
 * Chapter 1-2: 本人確認書類の承認（管理者機能）
 */
const approveDocument = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { documentId } = req.params;
        // バリデーション
        if (!adminId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!documentId) {
            res.status(400).json({ error: 'Document ID is required' });
            return;
        }
        // 管理者権限をチェック
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Only admins can approve documents' });
            return;
        }
        // ドキュメントを承認
        await (0, document_verification_service_1.approveVerificationDocument)(documentId, adminId);
        res.json({
            message: 'Document approved successfully',
            documentId,
        });
    }
    catch (error) {
        console.error('Document approval error:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.approveDocument = approveDocument;
/**
 * Chapter 1-2: 本人確認書類の却下・再提出要求（管理者機能）
 */
const rejectDocument = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { documentId } = req.params;
        const { rejectionReason } = req.body;
        // バリデーション
        if (!adminId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!documentId) {
            res.status(400).json({ error: 'Document ID is required' });
            return;
        }
        if (!rejectionReason || rejectionReason.trim().length === 0) {
            res.status(400).json({ error: 'Rejection reason is required' });
            return;
        }
        // 管理者権限をチェック
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Only admins can reject documents' });
            return;
        }
        // ドキュメントを却下
        await (0, document_verification_service_1.rejectVerificationDocument)(documentId, rejectionReason, adminId);
        res.json({
            message: 'Document rejected. User has been notified to resubmit.',
            documentId,
            rejectionReason,
        });
    }
    catch (error) {
        console.error('Document rejection error:', error);
        if (error instanceof Error) {
            if (error.message.includes('required')) {
                res.status(400).json({ error: error.message });
                return;
            }
            if (error.message.includes('not found')) {
                res.status(404).json({ error: error.message });
                return;
            }
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.rejectDocument = rejectDocument;
//# sourceMappingURL=document-verification.controller.js.map