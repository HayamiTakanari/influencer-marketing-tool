import { PrismaClient, CompanyMemberRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Chapter 1-3: 企業の複数担当者設定
 */
export const inviteCompanyMember = async (
  companyId: string,
  email: string,
  role: CompanyMemberRole,
  invitedByUserId: string
): Promise<any> => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // メールアドレスで既存ユーザーをチェック
    let targetUser = await prisma.user.findUnique({
      where: { email },
    });

    // ユーザーが存在しない場合、仮登録状態で作成
    if (!targetUser) {
      // 仮ユーザー作成（別フローで招待メール送信）
      throw new Error('User must first sign up independently');
    }

    // メンバーが既に存在するかチェック
    const existingMember = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this company');
    }

    // 新しいメンバーを追加
    const member = await prisma.companyMember.create({
      data: {
        companyId,
        userId: targetUser.id,
        role,
        status: 'PENDING',
      },
    });

    // 監査ログを記録
    await createAuditLog(companyId, invitedByUserId, 'INVITE', 'CompanyMember', member.id, {
      email,
      role,
    });

    console.log(`✓ Company member invited: ${email} as ${role}`);
    return member;
  } catch (error) {
    console.error('Error inviting company member:', error);
    throw error;
  }
};

/**
 * 招待を承認
 */
export const acceptInvitation = async (
  memberId: string,
  userId: string
): Promise<any> => {
  try {
    const member = await prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.userId !== userId) {
      throw new Error('Invalid member invitation');
    }

    const updated = await prisma.companyMember.update({
      where: { id: memberId },
      data: {
        status: 'ACTIVE',
        acceptedAt: new Date(),
      },
    });

    // 監査ログ
    await createAuditLog(member.companyId, userId, 'UPDATE', 'CompanyMember', memberId, {
      action: 'accepted_invitation',
    });

    console.log(`✓ Company member invitation accepted: ${memberId}`);
    return updated;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
};

/**
 * メンバーを削除
 */
export const removeCompanyMember = async (
  memberId: string,
  companyId: string,
  removedByUserId: string
): Promise<void> => {
  try {
    const member = await prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.companyId !== companyId) {
      throw new Error('Member not found');
    }

    // メンバーを削除
    await prisma.companyMember.delete({
      where: { id: memberId },
    });

    // 監査ログ
    await createAuditLog(companyId, removedByUserId, 'DELETE', 'CompanyMember', memberId, {
      removedUserId: member.userId,
      role: member.role,
    });

    console.log(`✓ Company member removed: ${memberId}`);
  } catch (error) {
    console.error('Error removing company member:', error);
    throw error;
  }
};

/**
 * メンバーの役割を更新
 */
export const updateMemberRole = async (
  memberId: string,
  companyId: string,
  newRole: CompanyMemberRole,
  updatedByUserId: string
): Promise<any> => {
  try {
    const member = await prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.companyId !== companyId) {
      throw new Error('Member not found');
    }

    const updated = await prisma.companyMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    // 監査ログ
    await createAuditLog(companyId, updatedByUserId, 'UPDATE', 'CompanyMember', memberId, {
      oldRole: member.role,
      newRole,
    });

    console.log(`✓ Member role updated: ${memberId}`);
    return updated;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
};

/**
 * 企業のメンバー一覧を取得
 */
export const getCompanyMembers = async (companyId: string) => {
  try {
    const members = await prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members;
  } catch (error) {
    console.error('Error getting company members:', error);
    throw error;
  }
};

/**
 * メンバーの権限を確認
 */
export const checkMemberPermission = async (
  memberId: string,
  companyId: string,
  requiredRole: CompanyMemberRole
): Promise<boolean> => {
  try {
    const member = await prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.companyId !== companyId || member.status !== 'ACTIVE') {
      return false;
    }

    // 権限階層: ADMIN > PROJECT_MANAGER > ACCOUNTING > VIEWER
    const roleHierarchy: Record<CompanyMemberRole, number> = {
      ADMIN: 4,
      PROJECT_MANAGER: 3,
      ACCOUNTING: 2,
      VIEWER: 1,
    };

    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  } catch (error) {
    console.error('Error checking member permission:', error);
    return false;
  }
};

/**
 * 監査ログを記録
 */
export const createAuditLog = async (
  companyId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        entityType,
        entityId,
        details: details || {},
      },
    });

    console.log(`✓ Audit log created: ${action} on ${entityType}`);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // ロギングエラーはサイレントに処理
  }
};

/**
 * 監査ログを取得
 */
export const getAuditLogs = async (companyId: string, limit = 50, offset = 0) => {
  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where: { companyId } }),
    ]);

    return { logs, total };
  } catch (error) {
    console.error('Error getting audit logs:', error);
    throw error;
  }
};
