import { DocumentType } from '@prisma/client';
/**
 * Chapter 1-2: 企業の本人確認・審査
 */
export declare const submitVerificationDocuments: (companyId: string, documents: Array<{
    documentType: DocumentType;
    documentUrl: string;
    fileName?: string;
    fileSize?: number;
}>) => Promise<any>;
/**
 * Chapter 1-2: 企業の審査ステータスを取得
 */
export declare const getVerificationStatus: (companyId: string) => Promise<{
    isVerified: boolean;
    documents: {
        id: string;
        status: import(".prisma/client").$Enums.VerificationStatus;
        createdAt: Date;
        updatedAt: Date;
        influencerId: string | null;
        companyId: string | null;
        documentType: import(".prisma/client").$Enums.DocumentType;
        documentUrl: string;
        fileName: string | null;
        fileSize: number | null;
        rejectionReason: string | null;
        uploadedAt: Date;
        reviewedAt: Date | null;
    }[];
    verifiedAt: Date;
    status: import(".prisma/client").$Enums.UserStatus;
}>;
/**
 * Chapter 1-2: 管理者向け - 企業を承認
 */
export declare const approveCompanyVerification: (companyId: string) => Promise<void>;
/**
 * Chapter 1-2: 管理者向け - 企業を却下
 */
export declare const rejectCompanyVerification: (companyId: string, rejectionReason: string) => Promise<void>;
/**
 * 企業一覧を取得（検証待ち）
 */
export declare const getPendingVerifications: (limit?: number, offset?: number) => Promise<{
    companies: ({
        verificationDocuments: {
            id: string;
            status: import(".prisma/client").$Enums.VerificationStatus;
            createdAt: Date;
            updatedAt: Date;
            influencerId: string | null;
            companyId: string | null;
            documentType: import(".prisma/client").$Enums.DocumentType;
            documentUrl: string;
            fileName: string | null;
            fileSize: number | null;
            rejectionReason: string | null;
            uploadedAt: Date;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
        industry: string | null;
        address: string | null;
        phoneNumber: string | null;
        legalNumber: string | null;
        representativeName: string | null;
        logoUrl: string | null;
        verifiedAt: Date | null;
    })[];
    total: number;
}>;
//# sourceMappingURL=company-verification.service.d.ts.map