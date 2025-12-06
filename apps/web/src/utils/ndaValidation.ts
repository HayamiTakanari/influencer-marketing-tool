// NDA（秘密保持契約）同意の検証とチェック機能

export interface NDAValidationResult {
  hasAgreed: boolean;
  agreedAt?: string;
  version?: string;
  message: string;
}

/**
 * ユーザーのNDA同意状況をチェック
 */
export const validateNDAAgrement = (user: any): NDAValidationResult => {
  // ユーザーが存在しない場合
  if (!user) {
    return {
      hasAgreed: false,
      message: 'ユーザー情報が見つかりません'
    };
  }

  // NDA同意フラグをチェック
  if (!user.hasAgreedToNDA) {
    return {
      hasAgreed: false,
      message: 'NDA（秘密保持契約）への同意が必要です。'
    };
  }

  // NDA同意済み
  return {
    hasAgreed: true,
    agreedAt: user.ndaAgreedAt,
    version: user.ndaVersion || '1.0',
    message: 'NDAに同意済みです'
  };
};

/**
 * NDA同意画面へのリダイレクト用URL生成
 */
export const getNDAConsentUrl = (): string => {
  return '/nda-consent';
};

/**
 * NDA必須チェック用の共通処理
 * インフルエンサーのみNDA同意が必須。企業（CLIENT）はプロジェクトに自動的にアクセス可能
 */
export const checkAndRedirectForNDA = (user: any, router: any): boolean => {
  // 企業の場合はNDA同意不要
  if (user && user.role === "COMPANY") {
    return true;
  }

  // インフルエンサーの場合はNDA同意をチェック
  const validation = validateNDAAgrement(user);

  if (!validation.hasAgreed) {
    // アラートで案内
    alert(`${validation.message}\n\nプロジェクトへのアクセスには、NDA（秘密保持契約）への同意が必要です。\n同意画面に移動します。`);

    // NDA同意ページにリダイレクト
    router.push(getNDAConsentUrl());
    return false;
  }

  return true;
};

/**
 * 現在のNDAバージョン
 */
export const CURRENT_NDA_VERSION = '1.0';

/**
 * NDA内容
 */
export const NDA_CONTENT = `
秘密保持契約書（NDA）

本秘密保持契約書（以下「本契約」といいます）は、本サービスを利用する全てのユーザー（企業およびインフルエンサー）と、本サービス運営者との間で締結されるものです。

第1条（目的）
本契約は、本サービスの利用に際して知り得た秘密情報の取り扱いについて定めることを目的とします。

第2条（秘密情報の定義）
本契約において「秘密情報」とは、以下の情報を指します：
1. プロジェクトの詳細内容（商品情報、キャンペーン内容、予算等）
2. 他のユーザーの個人情報・企業情報
3. チャット内でやり取りされる全ての情報
4. 未公開の商品・サービスに関する情報
5. その他、秘密である旨を明示された情報

第3条（秘密保持義務）
1. ユーザーは、秘密情報を第三者に開示、漏洩してはならない
2. 秘密情報は本サービスの利用目的以外に使用してはならない
3. 秘密情報の管理には最大限の注意を払うものとする

第4条（例外）
以下の情報は秘密情報から除外されます：
1. 既に公知となっている情報
2. 正当な権限を有する第三者から秘密保持義務を負わずに取得した情報
3. 法令により開示が義務付けられた情報

第5条（損害賠償）
本契約に違反し、相手方に損害を与えた場合は、その損害を賠償する責任を負います。

第6条（有効期間）
本契約は、同意日から効力を生じ、本サービスの利用終了後も3年間有効とします。

第7条（その他）
1. 本契約に関する紛争は、東京地方裁判所を専属的合意管轄裁判所とします
2. 本契約は日本法に準拠します

以上の内容を十分に理解し、同意した上で本サービスを利用してください。
`;