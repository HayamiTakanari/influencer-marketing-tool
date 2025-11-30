"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoiceInfo = exports.getInvoiceInfo = exports.saveInvoiceInfo = exports.validateInvoiceNumber = exports.validateBankAccount = exports.deleteBankAccount = exports.getCompanyBankAccount = exports.saveCompanyBankAccount = exports.getBankAccount = exports.saveBankAccount = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * インフルエンサーの銀行口座情報を保存
 */
const saveBankAccount = async (influencerId, accountData) => {
    try {
        // 既存の口座情報をチェック
        const existingAccount = await prisma.bankAccount.findFirst({
            where: { influencerId },
        });
        if (existingAccount) {
            // 既存口座を更新
            return await prisma.bankAccount.update({
                where: { id: existingAccount.id },
                data: {
                    accountHolder: accountData.accountHolder,
                    bankName: accountData.bankName,
                    branchName: accountData.branchName,
                    accountNumber: accountData.accountNumber,
                    accountType: accountData.accountType,
                },
            });
        }
        // 新規口座を作成
        return await prisma.bankAccount.create({
            data: {
                influencerId,
                accountHolder: accountData.accountHolder,
                bankName: accountData.bankName,
                branchName: accountData.branchName,
                accountNumber: accountData.accountNumber,
                accountType: accountData.accountType,
                isDefault: true,
            },
        });
    }
    catch (error) {
        console.error('Error saving bank account:', error);
        throw error;
    }
};
exports.saveBankAccount = saveBankAccount;
/**
 * インフルエンサーの銀行口座情報を取得
 */
const getBankAccount = async (influencerId) => {
    try {
        const account = await prisma.bankAccount.findFirst({
            where: { influencerId },
        });
        if (!account) {
            return null;
        }
        // レスポンスから機密情報をマスク
        return {
            id: account.id,
            accountHolder: account.accountHolder,
            bankName: account.bankName,
            branchName: account.branchName,
            accountType: account.accountType,
            accountNumber: account.accountNumber.slice(-4).padStart(account.accountNumber.length, '*'),
            isDefault: account.isDefault,
            updatedAt: account.updatedAt,
        };
    }
    catch (error) {
        console.error('Error getting bank account:', error);
        throw error;
    }
};
exports.getBankAccount = getBankAccount;
/**
 * 企業の銀行口座情報を保存
 */
const saveCompanyBankAccount = async (companyId, accountData) => {
    try {
        const existingAccount = await prisma.bankAccount.findFirst({
            where: { companyId },
        });
        if (existingAccount) {
            return await prisma.bankAccount.update({
                where: { id: existingAccount.id },
                data: {
                    accountHolder: accountData.accountHolder,
                    bankName: accountData.bankName,
                    branchName: accountData.branchName,
                    accountNumber: accountData.accountNumber,
                    accountType: accountData.accountType,
                },
            });
        }
        return await prisma.bankAccount.create({
            data: {
                companyId,
                accountHolder: accountData.accountHolder,
                bankName: accountData.bankName,
                branchName: accountData.branchName,
                accountNumber: accountData.accountNumber,
                accountType: accountData.accountType,
                isDefault: true,
            },
        });
    }
    catch (error) {
        console.error('Error saving company bank account:', error);
        throw error;
    }
};
exports.saveCompanyBankAccount = saveCompanyBankAccount;
/**
 * 企業の銀行口座情報を取得
 */
const getCompanyBankAccount = async (companyId) => {
    try {
        const account = await prisma.bankAccount.findFirst({
            where: { companyId },
        });
        if (!account) {
            return null;
        }
        return {
            id: account.id,
            accountHolder: account.accountHolder,
            bankName: account.bankName,
            branchName: account.branchName,
            accountType: account.accountType,
            accountNumber: account.accountNumber.slice(-4).padStart(account.accountNumber.length, '*'),
            isDefault: account.isDefault,
            updatedAt: account.updatedAt,
        };
    }
    catch (error) {
        console.error('Error getting company bank account:', error);
        throw error;
    }
};
exports.getCompanyBankAccount = getCompanyBankAccount;
/**
 * 銀行口座情報を削除（セキュリティ理由で履歴は残さない）
 */
const deleteBankAccount = async (influencerId) => {
    try {
        await prisma.bankAccount.deleteMany({
            where: { influencerId },
        });
        console.log(`✓ Bank account deleted for influencer: ${influencerId}`);
    }
    catch (error) {
        console.error('Error deleting bank account:', error);
        throw error;
    }
};
exports.deleteBankAccount = deleteBankAccount;
/**
 * 銀行口座情報の検証
 */
const validateBankAccount = (accountData) => {
    const errors = [];
    // 口座名義人の検証（全角カタカナ）
    if (!accountData.accountHolder.match(/^[\u30A0-\u30FF\s]+$/)) {
        errors.push('口座名義人は全角カタカナで入力してください');
    }
    // 銀行名の検証
    if (!accountData.bankName || accountData.bankName.length < 2) {
        errors.push('銀行名を正しく入力してください');
    }
    // 支店名の検証
    if (!accountData.branchName || accountData.branchName.length < 1) {
        errors.push('支店名を正しく入力してください');
    }
    // 口座番号の検証（7桁または8桁の数字）
    if (!/^\d{7,8}$/.test(accountData.accountNumber)) {
        errors.push('口座番号は7〜8桁の数字で入力してください');
    }
    // 口座種別の検証
    if (!['CHECKING', 'SAVINGS'].includes(accountData.accountType)) {
        errors.push('口座種別が不正です');
    }
    return errors;
};
exports.validateBankAccount = validateBankAccount;
/**
 * インボイス登録番号の検証
 * 形式: T + 13桁の数字
 */
const validateInvoiceNumber = (invoiceNumber) => {
    return /^T\d{13}$/.test(invoiceNumber);
};
exports.validateInvoiceNumber = validateInvoiceNumber;
/**
 * インフルエンサーのインボイス情報を保存
 */
const saveInvoiceInfo = async (influencerId, invoiceNumber) => {
    try {
        if (!(0, exports.validateInvoiceNumber)(invoiceNumber)) {
            throw new Error('Invalid invoice registration number format');
        }
        await prisma.influencer.update({
            where: { id: influencerId },
            data: {
                invoiceRegistrationNumber: invoiceNumber,
                invoiceRegisteredAt: new Date(),
            },
        });
        console.log(`✓ Invoice info saved for influencer: ${influencerId}`);
    }
    catch (error) {
        console.error('Error saving invoice info:', error);
        throw error;
    }
};
exports.saveInvoiceInfo = saveInvoiceInfo;
/**
 * インフルエンサーのインボイス情報を取得
 */
const getInvoiceInfo = async (influencerId) => {
    try {
        const influencer = await prisma.influencer.findUnique({
            where: { id: influencerId },
            select: {
                invoiceRegistrationNumber: true,
                invoiceRegisteredAt: true,
            },
        });
        if (!influencer) {
            throw new Error('Influencer not found');
        }
        return {
            invoiceNumber: influencer.invoiceRegistrationNumber,
            registeredAt: influencer.invoiceRegisteredAt,
        };
    }
    catch (error) {
        console.error('Error getting invoice info:', error);
        throw error;
    }
};
exports.getInvoiceInfo = getInvoiceInfo;
/**
 * インボイス情報を削除
 */
const deleteInvoiceInfo = async (influencerId) => {
    try {
        await prisma.influencer.update({
            where: { id: influencerId },
            data: {
                invoiceRegistrationNumber: null,
                invoiceRegisteredAt: null,
            },
        });
        console.log(`✓ Invoice info deleted for influencer: ${influencerId}`);
    }
    catch (error) {
        console.error('Error deleting invoice info:', error);
        throw error;
    }
};
exports.deleteInvoiceInfo = deleteInvoiceInfo;
//# sourceMappingURL=bank-account.service.js.map