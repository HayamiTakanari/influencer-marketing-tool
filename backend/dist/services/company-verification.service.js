"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingVerifications = exports.rejectCompanyVerification = exports.approveCompanyVerification = exports.getVerificationStatus = exports.submitVerificationDocuments = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Chapter 1-2: 企業の本人確認・審査
 */
const submitVerificationDocuments = async (companyId, documents) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new Error('Company not found');
        }
        const results = [];
        for (const doc of documents) {
            const verificationDoc = await prisma.verificationDocument.create({
                data: {
                    companyId,
                    documentType: doc.documentType,
                    documentUrl: doc.documentUrl,
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    status: 'PENDING',
                },
            });
            results.push(verificationDoc);
        }
        // ユーザーステータスを更新
        await prisma.user.update({
            where: { id: company.userId },
            data: {
                status: 'VERIFICATION_PENDING',
            },
        });
        console.log(`✓ Verification documents submitted for company: ${companyId}`);
        return results;
    }
    catch (error) {
        console.error('Error submitting verification documents:', error);
        throw error;
    }
};
exports.submitVerificationDocuments = submitVerificationDocuments;
/**
 * Chapter 1-2: 企業の審査ステータスを取得
 */
const getVerificationStatus = async (companyId) => {
    try {
        const documents = await prisma.verificationDocument.findMany({
            where: {
                companyId,
                documentType: {
                    in: ['BUSINESS_REGISTRATION', 'ID_DOCUMENT'],
                },
            },
            orderBy: { uploadedAt: 'desc' },
        });
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new Error('Company not found');
        }
        return {
            isVerified: company.isVerified,
            documents,
            verifiedAt: company.verifiedAt,
            status: company.status,
        };
    }
    catch (error) {
        console.error('Error getting verification status:', error);
        throw error;
    }
};
exports.getVerificationStatus = getVerificationStatus;
/**
 * Chapter 1-2: 管理者向け - 企業を承認
 */
const approveCompanyVerification = async (companyId) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { user: true },
        });
        if (!company) {
            throw new Error('Company not found');
        }
        // 企業を承認状態に更新
        await prisma.company.update({
            where: { id: companyId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
                status: 'VERIFIED',
            },
        });
        // ユーザーステータスを更新
        await prisma.user.update({
            where: { id: company.userId },
            data: {
                status: 'VERIFIED',
            },
        });
        // ドキュメントを承認
        await prisma.verificationDocument.updateMany({
            where: { companyId },
            data: {
                status: 'APPROVED',
                reviewedAt: new Date(),
            },
        });
        // 認証バッジの記録
        await prisma.verificationRecord.upsert({
            where: {
                userId_type: {
                    userId: company.userId,
                    type: 'BUSINESS',
                },
            },
            create: {
                userId: company.userId,
                type: 'BUSINESS',
                status: 'APPROVED',
                verifiedAt: new Date(),
            },
            update: {
                status: 'APPROVED',
                verifiedAt: new Date(),
            },
        });
        console.log(`✓ Company verified: ${companyId}`);
    }
    catch (error) {
        console.error('Error approving company verification:', error);
        throw error;
    }
};
exports.approveCompanyVerification = approveCompanyVerification;
/**
 * Chapter 1-2: 管理者向け - 企業を却下
 */
const rejectCompanyVerification = async (companyId, rejectionReason) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new Error('Company not found');
        }
        // ドキュメントを却下
        await prisma.verificationDocument.updateMany({
            where: { companyId },
            data: {
                status: 'REJECTED',
                rejectionReason,
                reviewedAt: new Date(),
            },
        });
        // ユーザーステータスをプロビジョナルに戻す
        await prisma.user.update({
            where: { id: company.userId },
            data: {
                status: 'PROVISIONAL',
            },
        });
        console.log(`✓ Company verification rejected: ${companyId}`);
    }
    catch (error) {
        console.error('Error rejecting company verification:', error);
        throw error;
    }
};
exports.rejectCompanyVerification = rejectCompanyVerification;
/**
 * 企業一覧を取得（検証待ち）
 */
const getPendingVerifications = async (limit = 20, offset = 0) => {
    try {
        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where: {
                    isVerified: false,
                },
                include: {
                    verificationDocuments: true,
                },
                orderBy: { createdAt: 'asc' },
                take: limit,
                skip: offset,
            }),
            prisma.company.count({
                where: { isVerified: false },
            }),
        ]);
        return { companies, total };
    }
    catch (error) {
        console.error('Error getting pending verifications:', error);
        throw error;
    }
};
exports.getPendingVerifications = getPendingVerifications;
//# sourceMappingURL=company-verification.service.js.map