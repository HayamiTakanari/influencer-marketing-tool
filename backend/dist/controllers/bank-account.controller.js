"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyBankAccountInfo = exports.saveCompanyBankAccountInfo = exports.deleteInvoiceRegistration = exports.getInvoiceRegistration = exports.saveInvoiceRegistration = exports.deleteBankAccountInfo = exports.getBankAccountInfo = exports.saveBankAccountInfo = void 0;
const bank_account_service_1 = require("../services/bank-account.service");
/**
 * Chapter 1-9: インフルエンサーの口座情報を保存
 */
const saveBankAccountInfo = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { accountHolder, bankName, branchName, accountNumber, accountType } = req.body;
        // バリデーション
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const accountData = {
            accountHolder,
            bankName,
            branchName,
            accountNumber,
            accountType,
        };
        const validationErrors = (0, bank_account_service_1.validateBankAccount)(accountData);
        if (validationErrors.length > 0) {
            res.status(400).json({ errors: validationErrors });
            return;
        }
        // インフルエンサープロフィールを取得
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        // 口座情報を保存
        const account = await (0, bank_account_service_1.saveBankAccount)(influencer.id, accountData);
        res.status(200).json({
            message: 'Bank account information saved successfully',
            account: {
                id: account.id,
                accountHolder: account.accountHolder,
                bankName: account.bankName,
                branchName: account.branchName,
                accountType: account.accountType,
                accountNumber: account.accountNumber.slice(-4),
                registeredAt: account.updatedAt,
            },
        });
    }
    catch (error) {
        console.error('Error saving bank account:', error);
        res.status(500).json({ error: 'Failed to save bank account information' });
    }
};
exports.saveBankAccountInfo = saveBankAccountInfo;
/**
 * Chapter 1-9: インフルエンサーの口座情報を取得
 */
const getBankAccountInfo = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        const account = await (0, bank_account_service_1.getBankAccount)(influencer.id);
        res.status(200).json({
            isRegistered: account !== null,
            account: account || null,
        });
    }
    catch (error) {
        console.error('Error getting bank account:', error);
        res.status(500).json({ error: 'Failed to get bank account information' });
    }
};
exports.getBankAccountInfo = getBankAccountInfo;
/**
 * Chapter 1-9: インフルエンサーの口座情報を削除
 */
const deleteBankAccountInfo = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        await (0, bank_account_service_1.deleteBankAccount)(influencer.id);
        res.status(200).json({
            message: 'Bank account information deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting bank account:', error);
        res.status(500).json({ error: 'Failed to delete bank account information' });
    }
};
exports.deleteBankAccountInfo = deleteBankAccountInfo;
/**
 * Chapter 1-10: インボイス情報を保存
 */
const saveInvoiceRegistration = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { invoiceNumber } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!invoiceNumber) {
            res.status(400).json({ error: 'Invoice registration number is required' });
            return;
        }
        if (!(0, bank_account_service_1.validateInvoiceNumber)(invoiceNumber)) {
            res.status(400).json({
                error: 'Invalid invoice number format. Must be T followed by 13 digits (e.g., T1234567890123)',
            });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        await (0, bank_account_service_1.saveInvoiceInfo)(influencer.id, invoiceNumber);
        res.status(200).json({
            message: 'Invoice registration number saved successfully',
            invoiceNumber,
            registeredAt: new Date(),
        });
    }
    catch (error) {
        console.error('Error saving invoice info:', error);
        res.status(500).json({ error: 'Failed to save invoice information' });
    }
};
exports.saveInvoiceRegistration = saveInvoiceRegistration;
/**
 * Chapter 1-10: インボイス情報を取得
 */
const getInvoiceRegistration = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        const invoiceInfo = await (0, bank_account_service_1.getInvoiceInfo)(influencer.id);
        res.status(200).json({
            isRegistered: invoiceInfo.invoiceNumber !== null,
            invoiceNumber: invoiceInfo.invoiceNumber,
            registeredAt: invoiceInfo.registeredAt,
        });
    }
    catch (error) {
        console.error('Error getting invoice info:', error);
        res.status(500).json({ error: 'Failed to get invoice information' });
    }
};
exports.getInvoiceRegistration = getInvoiceRegistration;
/**
 * Chapter 1-10: インボイス情報を削除
 */
const deleteInvoiceRegistration = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        await (0, bank_account_service_1.deleteInvoiceInfo)(influencer.id);
        res.status(200).json({
            message: 'Invoice registration information deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting invoice info:', error);
        res.status(500).json({ error: 'Failed to delete invoice information' });
    }
};
exports.deleteInvoiceRegistration = deleteInvoiceRegistration;
/**
 * Chapter 1-9: 企業の口座情報を保存
 */
const saveCompanyBankAccountInfo = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { accountHolder, bankName, branchName, accountNumber, accountType } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const accountData = {
            accountHolder,
            bankName,
            branchName,
            accountNumber,
            accountType,
        };
        const validationErrors = (0, bank_account_service_1.validateBankAccount)(accountData);
        if (validationErrors.length > 0) {
            res.status(400).json({ errors: validationErrors });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const company = await prisma.company.findUnique({
            where: { userId },
        });
        if (!company) {
            res.status(404).json({ error: 'Company profile not found' });
            return;
        }
        const account = await (0, bank_account_service_1.saveCompanyBankAccount)(company.id, accountData);
        res.status(200).json({
            message: 'Company bank account information saved successfully',
            account: {
                id: account.id,
                accountHolder: account.accountHolder,
                bankName: account.bankName,
                branchName: account.branchName,
                accountType: account.accountType,
                accountNumber: account.accountNumber.slice(-4),
                registeredAt: account.updatedAt,
            },
        });
    }
    catch (error) {
        console.error('Error saving company bank account:', error);
        res.status(500).json({ error: 'Failed to save company bank account information' });
    }
};
exports.saveCompanyBankAccountInfo = saveCompanyBankAccountInfo;
/**
 * Chapter 1-9: 企業の口座情報を取得
 */
const getCompanyBankAccountInfo = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const company = await prisma.company.findUnique({
            where: { userId },
        });
        if (!company) {
            res.status(404).json({ error: 'Company profile not found' });
            return;
        }
        const account = await (0, bank_account_service_1.getCompanyBankAccount)(company.id);
        res.status(200).json({
            isRegistered: account !== null,
            account: account || null,
        });
    }
    catch (error) {
        console.error('Error getting company bank account:', error);
        res.status(500).json({ error: 'Failed to get company bank account information' });
    }
};
exports.getCompanyBankAccountInfo = getCompanyBankAccountInfo;
//# sourceMappingURL=bank-account.controller.js.map