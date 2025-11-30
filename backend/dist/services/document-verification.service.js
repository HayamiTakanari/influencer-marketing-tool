"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectVerificationDocument = exports.approveVerificationDocument = exports.getVerificationDocumentStatus = exports.uploadVerificationDocument = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
// AWS S3クライアント初期化
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'ap-northeast-1',
});
/**
 * 書類をアップロード（企業：登記簿謄本、インフルエンサー：身分証明書）
 * Chapter 1-2: 本人確認書類の提出
 */
const uploadVerificationDocument = async (userId, documentType, fileBuffer, fileName, fileSize) => {
    try {
        // ファイルサイズのバリデーション（10MB以下）
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (fileSize > MAX_FILE_SIZE) {
            throw new Error('File size exceeds maximum limit of 10MB');
        }
        // ファイルタイプのバリデーション（PDF, JPG, PNG）
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const mimeType = getMimeType(fileName);
        if (!allowedMimeTypes.includes(mimeType)) {
            throw new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.');
        }
        // ユーザータイプ判定
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // S3キーを生成（ユーザーID + タイムスタンプ + 乱数）
        const timestamp = Date.now();
        const randomString = crypto_1.default.randomBytes(8).toString('hex');
        const s3Key = `documents/${userId}/${documentType}/${timestamp}-${randomString}-${fileName}`;
        // S3にアップロード
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || 'influencer-marketing-documents',
            Key: s3Key,
            Body: fileBuffer,
            ContentType: mimeType,
            ServerSideEncryption: 'AES256', // サーバーサイド暗号化
            Metadata: {
                userId,
                uploadedAt: new Date().toISOString(),
            },
        });
        await s3Client.send(uploadCommand);
        const documentUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        // トランザクション内でドキュメントレコードを作成
        const document = await prisma.$transaction(async (tx) => {
            if (user.role === 'COMPANY') {
                // 企業プロフィールを取得
                const company = await tx.company.findUnique({
                    where: { userId },
                });
                if (!company) {
                    throw new Error('Company profile not found');
                }
                // ドキュメントレコードを作成
                return await tx.verificationDocument.create({
                    data: {
                        companyId: company.id,
                        documentType,
                        documentUrl,
                        fileName,
                        fileSize,
                        status: 'PENDING',
                    },
                });
            }
            else if (user.role === 'INFLUENCER') {
                // インフルエンサープロフィールを取得
                const influencer = await tx.influencer.findUnique({
                    where: { userId },
                });
                if (!influencer) {
                    throw new Error('Influencer profile not found');
                }
                // ドキュメントレコードを作成
                return await tx.verificationDocument.create({
                    data: {
                        influencerId: influencer.id,
                        documentType,
                        documentUrl,
                        fileName,
                        fileSize,
                        status: 'PENDING',
                    },
                });
            }
            else {
                throw new Error('Invalid user role for document verification');
            }
        });
        console.log(`Document uploaded: ${document.id} for user ${userId}`);
        return {
            documentId: document.id,
            documentUrl,
            status: document.status,
        };
    }
    catch (error) {
        console.error('Error uploading verification document:', error);
        throw error;
    }
};
exports.uploadVerificationDocument = uploadVerificationDocument;
/**
 * ドキュメント認証状態を取得
 * Chapter 1-2: 本人確認状態の確認
 */
const getVerificationDocumentStatus = async (userId, documentType) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        let documents;
        if (user.role === 'COMPANY') {
            const company = await prisma.company.findUnique({
                where: { userId },
                select: { id: true },
            });
            if (!company) {
                throw new Error('Company profile not found');
            }
            documents = await prisma.verificationDocument.findMany({
                where: {
                    companyId: company.id,
                    ...(documentType && { documentType }),
                },
                select: {
                    id: true,
                    documentType: true,
                    status: true,
                    uploadedAt: true,
                    reviewedAt: true,
                    rejectionReason: true,
                },
            });
        }
        else if (user.role === 'INFLUENCER') {
            const influencer = await prisma.influencer.findUnique({
                where: { userId },
                select: { id: true },
            });
            if (!influencer) {
                throw new Error('Influencer profile not found');
            }
            documents = await prisma.verificationDocument.findMany({
                where: {
                    influencerId: influencer.id,
                    ...(documentType && { documentType }),
                },
                select: {
                    id: true,
                    documentType: true,
                    status: true,
                    uploadedAt: true,
                    reviewedAt: true,
                    rejectionReason: true,
                },
            });
        }
        return documents || [];
    }
    catch (error) {
        console.error('Error getting verification document status:', error);
        throw error;
    }
};
exports.getVerificationDocumentStatus = getVerificationDocumentStatus;
/**
 * ドキュメント認証を承認（管理者機能）
 * Chapter 1-2: 本人確認の承認
 */
const approveVerificationDocument = async (documentId, adminId) => {
    try {
        const document = await prisma.verificationDocument.findUnique({
            where: { id: documentId },
            include: {
                company: { select: { userId: true } },
                influencer: { select: { userId: true } },
            },
        });
        if (!document) {
            throw new Error('Document not found');
        }
        const userId = document.company?.userId || document.influencer?.userId;
        if (!userId) {
            throw new Error('Associated user not found');
        }
        // トランザクション内で承認処理を実行
        await prisma.$transaction(async (tx) => {
            // ドキュメントを承認
            await tx.verificationDocument.update({
                where: { id: documentId },
                data: {
                    status: 'APPROVED',
                    reviewedAt: new Date(),
                },
            });
            // ユーザーの本人確認状態を更新（すべてのドキュメントが承認されたかチェック）
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            if (user?.role === 'COMPANY') {
                const company = await tx.company.findUnique({
                    where: { userId },
                    include: {
                        verificationDocuments: {
                            where: { status: { not: 'APPROVED' } },
                        },
                    },
                });
                // すべてのドキュメントが承認されたら、企業を認証状態に更新
                if (company && company.verificationDocuments.length === 0) {
                    await tx.company.update({
                        where: { id: company.id },
                        data: {
                            isVerified: true,
                            verifiedAt: new Date(),
                            status: 'VERIFIED',
                        },
                    });
                    await tx.user.update({
                        where: { id: userId },
                        data: { status: 'VERIFIED' },
                    });
                }
            }
            else if (user?.role === 'INFLUENCER') {
                const influencer = await tx.influencer.findUnique({
                    where: { userId },
                    include: {
                        verificationDocuments: {
                            where: { status: { not: 'APPROVED' } },
                        },
                    },
                });
                // すべてのドキュメントが承認されたら、インフルエンサーを認証状態に更新
                if (influencer && influencer.verificationDocuments.length === 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { status: 'VERIFIED' },
                    });
                }
            }
        });
        console.log(`Document ${documentId} approved by admin ${adminId}`);
    }
    catch (error) {
        console.error('Error approving verification document:', error);
        throw error;
    }
};
exports.approveVerificationDocument = approveVerificationDocument;
/**
 * ドキュメント認証を却下（管理者機能）
 * Chapter 1-2: 本人確認の却下・再提出
 */
const rejectVerificationDocument = async (documentId, rejectionReason, adminId) => {
    try {
        if (!rejectionReason || rejectionReason.trim().length === 0) {
            throw new Error('Rejection reason is required');
        }
        await prisma.verificationDocument.update({
            where: { id: documentId },
            data: {
                status: 'RESUBMIT_REQUIRED',
                rejectionReason: rejectionReason.trim(),
                reviewedAt: new Date(),
            },
        });
        console.log(`Document ${documentId} rejected by admin ${adminId}`);
    }
    catch (error) {
        console.error('Error rejecting verification document:', error);
        throw error;
    }
};
exports.rejectVerificationDocument = rejectVerificationDocument;
/**
 * ファイル拡張子からMIMEタイプを判定
 */
function getMimeType(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
}
//# sourceMappingURL=document-verification.service.js.map