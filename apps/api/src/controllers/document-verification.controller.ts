import { Request, Response } from 'express';
import { DocumentType } from '@prisma/client';
import {
  uploadVerificationDocument,
  getVerificationDocumentStatus,
  approveVerificationDocument,
  rejectVerificationDocument,
} from '../services/document-verification.service';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
  file?: Express.Multer.File;
}

/**
 * Chapter 1-2: 本人確認書類のアップロード
 * 企業：登記簿謄本、インフルエンサー：身分証明書
 */
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const result = await uploadVerificationDocument(
      userId,
      documentType as DocumentType,
      file.buffer,
      file.originalname,
      file.size
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: result,
      nextStep: 'Await admin review for document approval',
    });
  } catch (error) {
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

/**
 * Chapter 1-2: 本人確認書類の状態確認
 */
export const getDocumentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { documentType } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // ドキュメント状態を取得
    const documents = await getVerificationDocumentStatus(
      userId,
      documentType as DocumentType | undefined
    );

    res.json({
      documents,
      summary: {
        total: documents.length,
        approved: documents.filter((d: any) => d.status === 'APPROVED').length,
        pending: documents.filter((d: any) => d.status === 'PENDING').length,
        rejected: documents.filter((d: any) => d.status === 'RESUBMIT_REQUIRED').length,
      },
    });
  } catch (error) {
    console.error('Error getting document status:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Chapter 1-2: 本人確認書類の承認（管理者機能）
 */
export const approveDocument = async (req: AuthRequest, res: Response): Promise<void> => {
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
    await approveVerificationDocument(documentId, adminId);

    res.json({
      message: 'Document approved successfully',
      documentId,
    });
  } catch (error) {
    console.error('Document approval error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Chapter 1-2: 本人確認書類の却下・再提出要求（管理者機能）
 */
export const rejectDocument = async (req: AuthRequest, res: Response): Promise<void> => {
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
    await rejectVerificationDocument(documentId, rejectionReason, adminId);

    res.json({
      message: 'Document rejected. User has been notified to resubmit.',
      documentId,
      rejectionReason,
    });
  } catch (error) {
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
