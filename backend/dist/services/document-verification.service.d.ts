import { DocumentType } from '@prisma/client';
interface UploadResult {
    documentId: string;
    documentUrl: string;
    status: string;
}
/**
 * 書類をアップロード（企業：登記簿謄本、インフルエンサー：身分証明書）
 * Chapter 1-2: 本人確認書類の提出
 */
export declare const uploadVerificationDocument: (userId: string, documentType: DocumentType, fileBuffer: Buffer, fileName: string, fileSize: number) => Promise<UploadResult>;
/**
 * ドキュメント認証状態を取得
 * Chapter 1-2: 本人確認状態の確認
 */
export declare const getVerificationDocumentStatus: (userId: string, documentType?: DocumentType) => Promise<any>;
/**
 * ドキュメント認証を承認（管理者機能）
 * Chapter 1-2: 本人確認の承認
 */
export declare const approveVerificationDocument: (documentId: string, adminId: string) => Promise<void>;
/**
 * ドキュメント認証を却下（管理者機能）
 * Chapter 1-2: 本人確認の却下・再提出
 */
export declare const rejectVerificationDocument: (documentId: string, rejectionReason: string, adminId: string) => Promise<void>;
export {};
//# sourceMappingURL=document-verification.service.d.ts.map