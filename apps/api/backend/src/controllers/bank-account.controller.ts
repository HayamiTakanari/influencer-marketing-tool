import { Request, Response } from 'express';
import {
  saveBankAccount,
  getBankAccount,
  saveCompanyBankAccount,
  getCompanyBankAccount,
  deleteBankAccount,
  validateBankAccount,
  saveInvoiceInfo,
  getInvoiceInfo,
  deleteInvoiceInfo,
  validateInvoiceNumber,
} from '../services/bank-account.service';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

/**
 * Chapter 1-9: インフルエンサーの口座情報を保存
 */
export const saveBankAccountInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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

    const validationErrors = validateBankAccount(accountData);
    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors });
      return;
    }

    // インフルエンサープロフィールを取得
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    // 口座情報を保存
    const account = await saveBankAccount(influencer.id, accountData);

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
  } catch (error) {
    console.error('Error saving bank account:', error);
    res.status(500).json({ error: 'Failed to save bank account information' });
  }
};

/**
 * Chapter 1-9: インフルエンサーの口座情報を取得
 */
export const getBankAccountInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const account = await getBankAccount(influencer.id);

    res.status(200).json({
      isRegistered: account !== null,
      account: account || null,
    });
  } catch (error) {
    console.error('Error getting bank account:', error);
    res.status(500).json({ error: 'Failed to get bank account information' });
  }
};

/**
 * Chapter 1-9: インフルエンサーの口座情報を削除
 */
export const deleteBankAccountInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    await deleteBankAccount(influencer.id);

    res.status(200).json({
      message: 'Bank account information deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ error: 'Failed to delete bank account information' });
  }
};

/**
 * Chapter 1-10: インボイス情報を保存
 */
export const saveInvoiceRegistration = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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

    if (!validateInvoiceNumber(invoiceNumber)) {
      res.status(400).json({
        error: 'Invalid invoice number format. Must be T followed by 13 digits (e.g., T1234567890123)',
      });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    await saveInvoiceInfo(influencer.id, invoiceNumber);

    res.status(200).json({
      message: 'Invoice registration number saved successfully',
      invoiceNumber,
      registeredAt: new Date(),
    });
  } catch (error) {
    console.error('Error saving invoice info:', error);
    res.status(500).json({ error: 'Failed to save invoice information' });
  }
};

/**
 * Chapter 1-10: インボイス情報を取得
 */
export const getInvoiceRegistration = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const invoiceInfo = await getInvoiceInfo(influencer.id);

    res.status(200).json({
      isRegistered: invoiceInfo.invoiceNumber !== null,
      invoiceNumber: invoiceInfo.invoiceNumber,
      registeredAt: invoiceInfo.registeredAt,
    });
  } catch (error) {
    console.error('Error getting invoice info:', error);
    res.status(500).json({ error: 'Failed to get invoice information' });
  }
};

/**
 * Chapter 1-10: インボイス情報を削除
 */
export const deleteInvoiceRegistration = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    await deleteInvoiceInfo(influencer.id);

    res.status(200).json({
      message: 'Invoice registration information deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting invoice info:', error);
    res.status(500).json({ error: 'Failed to delete invoice information' });
  }
};

/**
 * Chapter 1-9: 企業の口座情報を保存
 */
export const saveCompanyBankAccountInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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

    const validationErrors = validateBankAccount(accountData);
    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      res.status(404).json({ error: 'Company profile not found' });
      return;
    }

    const account = await saveCompanyBankAccount(company.id, accountData);

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
  } catch (error) {
    console.error('Error saving company bank account:', error);
    res.status(500).json({ error: 'Failed to save company bank account information' });
  }
};

/**
 * Chapter 1-9: 企業の口座情報を取得
 */
export const getCompanyBankAccountInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      res.status(404).json({ error: 'Company profile not found' });
      return;
    }

    const account = await getCompanyBankAccount(company.id);

    res.status(200).json({
      isRegistered: account !== null,
      account: account || null,
    });
  } catch (error) {
    console.error('Error getting company bank account:', error);
    res.status(500).json({ error: 'Failed to get company bank account information' });
  }
};
