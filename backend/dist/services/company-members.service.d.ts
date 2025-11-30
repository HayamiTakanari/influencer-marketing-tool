import { CompanyMemberRole } from '@prisma/client';
/**
 * Chapter 1-3: 企業の複数担当者設定
 */
export declare const inviteCompanyMember: (companyId: string, email: string, role: CompanyMemberRole, invitedByUserId: string) => Promise<any>;
/**
 * 招待を承認
 */
export declare const acceptInvitation: (memberId: string, userId: string) => Promise<any>;
/**
 * メンバーを削除
 */
export declare const removeCompanyMember: (memberId: string, companyId: string, removedByUserId: string) => Promise<void>;
/**
 * メンバーの役割を更新
 */
export declare const updateMemberRole: (memberId: string, companyId: string, newRole: CompanyMemberRole, updatedByUserId: string) => Promise<any>;
/**
 * 企業のメンバー一覧を取得
 */
export declare const getCompanyMembers: (companyId: string) => Promise<({
    user: {
        id: string;
        email: string;
        createdAt: Date;
    };
} & {
    id: string;
    role: import(".prisma/client").$Enums.CompanyMemberRole;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    companyId: string;
    acceptedAt: Date | null;
    invitedAt: Date;
})[]>;
/**
 * メンバーの権限を確認
 */
export declare const checkMemberPermission: (memberId: string, companyId: string, requiredRole: CompanyMemberRole) => Promise<boolean>;
/**
 * 監査ログを記録
 */
export declare const createAuditLog: (companyId: string, userId: string, action: string, entityType: string, entityId: string, details?: Record<string, any>) => Promise<void>;
/**
 * 監査ログを取得
 */
export declare const getAuditLogs: (companyId: string, limit?: number, offset?: number) => Promise<{
    logs: {
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        companyId: string;
        ipAddress: string | null;
        entityType: string;
        entityId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
    }[];
    total: number;
}>;
//# sourceMappingURL=company-members.service.d.ts.map