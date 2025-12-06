import { PrismaClient, BankAccount } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 銀行口座情報の暗号化・復号化ユーティリティ
 * Chapter 1-9: 口座情報の登録
 */
interface BankAccountData {
  accountHolder: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
}

/**
 * インフルエンサーの銀行口座情報を保存
 */
export const saveBankAccount = async (
  influencerId: string,
  accountData: BankAccountData
): Promise<BankAccount> => {
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
  } catch (error) {
    console.error('Error saving bank account:', error);
    throw error;
  }
};

/**
 * インフルエンサーの銀行口座情報を取得
 */
export const getBankAccount = async (
  influencerId: string
): Promise<Partial<BankAccount> | null> => {
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
  } catch (error) {
    console.error('Error getting bank account:', error);
    throw error;
  }
};

/**
 * 企業の銀行口座情報を保存
 */
export const saveCompanyBankAccount = async (
  companyId: string,
  accountData: BankAccountData
): Promise<BankAccount> => {
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
  } catch (error) {
    console.error('Error saving company bank account:', error);
    throw error;
  }
};

/**
 * 企業の銀行口座情報を取得
 */
export const getCompanyBankAccount = async (
  companyId: string
): Promise<Partial<BankAccount> | null> => {
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
  } catch (error) {
    console.error('Error getting company bank account:', error);
    throw error;
  }
};

/**
 * 銀行口座情報を削除（セキュリティ理由で履歴は残さない）
 */
export const deleteBankAccount = async (influencerId: string): Promise<void> => {
  try {
    await prisma.bankAccount.deleteMany({
      where: { influencerId },
    });

    console.log(`✓ Bank account deleted for influencer: ${influencerId}`);
  } catch (error) {
    console.error('Error deleting bank account:', error);
    throw error;
  }
};

/**
 * 銀行口座情報の検証
 */
export const validateBankAccount = (accountData: BankAccountData): string[] => {
  const errors: string[] = [];

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

/**
 * インボイス登録番号の検証
 * 形式: T + 13桁の数字
 */
export const validateInvoiceNumber = (invoiceNumber: string): boolean => {
  return /^T\d{13}$/.test(invoiceNumber);
};

/**
 * インフルエンサーのインボイス情報を保存
 */
export const saveInvoiceInfo = async (
  influencerId: string,
  invoiceNumber: string
): Promise<void> => {
  try {
    if (!validateInvoiceNumber(invoiceNumber)) {
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
  } catch (error) {
    console.error('Error saving invoice info:', error);
    throw error;
  }
};

/**
 * インフルエンサーのインボイス情報を取得
 */
export const getInvoiceInfo = async (
  influencerId: string
): Promise<{ invoiceNumber: string | null; registeredAt: Date | null }> => {
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
  } catch (error) {
    console.error('Error getting invoice info:', error);
    throw error;
  }
};

/**
 * インボイス情報を削除
 */
export const deleteInvoiceInfo = async (influencerId: string): Promise<void> => {
  try {
    await prisma.influencer.update({
      where: { id: influencerId },
      data: {
        invoiceRegistrationNumber: null,
        invoiceRegisteredAt: null,
      },
    });

    console.log(`✓ Invoice info deleted for influencer: ${influencerId}`);
  } catch (error) {
    console.error('Error deleting invoice info:', error);
    throw error;
  }
};
