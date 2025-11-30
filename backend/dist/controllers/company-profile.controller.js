"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompanyProfile = exports.getCompanyProfile = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const updateCompanyProfileSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1).max(255).optional(),
    industry: zod_1.z.string().max(100).optional(),
    contactName: zod_1.z.string().max(100).optional(),
    contactPhone: zod_1.z.string().max(20).optional(),
    address: zod_1.z.string().max(500).optional(),
    website: zod_1.z.string().url().optional(),
    description: zod_1.z.string().max(2000).optional(),
    budget: zod_1.z.number().min(0).optional(),
    targetAudience: zod_1.z.string().max(500).optional(),
    location: zod_1.z.string().max(100).optional(),
    bankName: zod_1.z.string().max(100).optional(),
    branchName: zod_1.z.string().max(100).optional(),
    accountType: zod_1.z.string().max(50).optional(),
    accountNumber: zod_1.z.string().max(20).optional(),
    accountName: zod_1.z.string().max(100).optional(),
});
// 企業プロフィール取得
const getCompanyProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const company = await prisma.company.findUnique({
            where: { userId },
            include: {
                bankAccounts: true,
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        if (!company) {
            return res.status(404).json({ error: 'Company profile not found' });
        }
        res.json({
            success: true,
            data: company,
        });
    }
    catch (error) {
        console.error('Get company profile error:', error);
        res.status(500).json({ error: 'Failed to get company profile' });
    }
};
exports.getCompanyProfile = getCompanyProfile;
// 企業プロフィール更新
const updateCompanyProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const data = updateCompanyProfileSchema.parse(req.body);
        // 企業プロフィールの更新（ない場合は作成）
        const company = await prisma.company.upsert({
            where: { userId },
            update: {
                companyName: data.companyName,
                industry: data.industry,
                address: data.address,
                phoneNumber: data.contactPhone,
                updatedAt: new Date(),
            },
            create: {
                userId,
                companyName: data.companyName || 'New Company',
                industry: data.industry,
                address: data.address,
                phoneNumber: data.contactPhone,
            },
            include: {
                bankAccounts: true,
            },
        });
        // 銀行口座情報がある場合は更新または作成
        if (data.bankName ||
            data.branchName ||
            data.accountNumber ||
            data.accountName) {
            const existingBankAccount = await prisma.bankAccount.findFirst({
                where: { companyId: company.id },
            });
            if (existingBankAccount) {
                // 既存の銀行口座を更新
                await prisma.bankAccount.update({
                    where: { id: existingBankAccount.id },
                    data: {
                        accountHolder: data.accountName || existingBankAccount.accountHolder,
                        bankName: data.bankName || existingBankAccount.bankName,
                        branchName: data.branchName || existingBankAccount.branchName,
                        accountNumber: data.accountNumber || existingBankAccount.accountNumber,
                        accountType: data.accountType || existingBankAccount.accountType,
                    },
                });
            }
            else {
                // 新しい銀行口座を作成
                if (data.bankName && data.accountNumber && data.accountName) {
                    await prisma.bankAccount.create({
                        data: {
                            companyId: company.id,
                            accountHolder: data.accountName,
                            bankName: data.bankName,
                            branchName: data.branchName || '',
                            accountNumber: data.accountNumber,
                            accountType: data.accountType || '普通',
                            isDefault: true,
                        },
                    });
                }
            }
        }
        // 更新後のデータを取得して返す
        const updatedCompany = await prisma.company.findUnique({
            where: { userId },
            include: {
                bankAccounts: true,
            },
        });
        res.json({
            success: true,
            data: updatedCompany,
            message: '企業プロフィールが保存されました',
        });
    }
    catch (error) {
        console.error('Update company profile error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Invalid input',
                details: error.errors
            });
        }
        res.status(500).json({ error: 'Failed to update company profile' });
    }
};
exports.updateCompanyProfile = updateCompanyProfile;
//# sourceMappingURL=company-profile.controller.js.map