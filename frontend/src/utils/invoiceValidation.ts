// インボイス情報の検証とチェック機能

export interface InvoiceValidationResult {
  isValid: boolean;
  missingFields: string[];
  message: string;
}

/**
 * インフルエンサーのインボイス情報が完全に登録されているかチェック
 */
export const validateInfluencerInvoiceInfo = (user: any): InvoiceValidationResult => {
  const missingFields: string[] = [];
  
  // ユーザーがインフルエンサーでない場合は検証不要
  if (user?.role !== 'INFLUENCER') {
    return {
      isValid: true,
      missingFields: [],
      message: 'インフルエンサー以外のユーザーです'
    };
  }

  // hasInvoiceInfoフラグをチェック
  if (!user.hasInvoiceInfo) {
    return {
      isValid: false,
      missingFields: ['all'],
      message: 'インボイス情報が未登録です。プロフィールページで登録してください。'
    };
  }

  // 詳細なインボイス情報をチェック
  if (!user.invoiceInfo) {
    missingFields.push('インボイス情報');
  } else {
    const { invoiceInfo } = user;
    
    if (!invoiceInfo.companyName?.trim()) {
      missingFields.push('会社名/屋号');
    }
    
    if (!invoiceInfo.address?.trim()) {
      missingFields.push('住所');
    }
    
    if (!invoiceInfo.phoneNumber?.trim()) {
      missingFields.push('電話番号');
    }
    
    // 銀行情報のチェック
    if (!invoiceInfo.bankInfo) {
      missingFields.push('銀行情報');
    } else {
      const { bankInfo } = invoiceInfo;
      
      if (!bankInfo.bankName?.trim()) {
        missingFields.push('銀行名');
      }
      
      if (!bankInfo.branchName?.trim()) {
        missingFields.push('支店名');
      }
      
      if (!bankInfo.accountType?.trim()) {
        missingFields.push('口座種別');
      }
      
      if (!bankInfo.accountNumber?.trim()) {
        missingFields.push('口座番号');
      }
      
      if (!bankInfo.accountName?.trim()) {
        missingFields.push('口座名義');
      }
    }
  }

  const isValid = missingFields.length === 0;
  const message = isValid 
    ? 'インボイス情報が正常に登録されています'
    : `以下の項目が未登録です: ${missingFields.join(', ')}`;

  return {
    isValid,
    missingFields,
    message
  };
};

/**
 * インボイス情報登録へのリダイレクト用URL生成
 */
export const getInvoiceRegistrationUrl = (): string => {
  return '/profile?tab=invoice';
};

/**
 * インボイス必須チェック用のコンポーネントやページでの共通処理
 */
export const checkAndRedirectForInvoice = (user: any, router: any): boolean => {
  const validation = validateInfluencerInvoiceInfo(user);
  
  if (!validation.isValid) {
    // アラートで案内
    alert(`${validation.message}\n\nプロフィールページのインボイス情報登録画面に移動します。`);
    
    // インボイス登録ページにリダイレクト
    router.push(getInvoiceRegistrationUrl());
    return false;
  }
  
  return true;
};