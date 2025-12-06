export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
  UNAUTHORIZED: 'ログインセッションが期限切れです。再度ログインしてください。',
  FORBIDDEN: 'この操作を実行する権限がありません。',
  NOT_FOUND: '要求されたリソースが見つかりません。',
  SERVER_ERROR: 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。',
  VALIDATION_ERROR: '入力内容に誤りがあります。確認してください。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。',
  
  FETCH_FAILED: 'データの取得に失敗しました。',
  SAVE_FAILED: '保存に失敗しました。',
  DELETE_FAILED: '削除に失敗しました。',
  UPDATE_FAILED: '更新に失敗しました。',
  UPLOAD_FAILED: 'アップロードに失敗しました。',
  
  AUTH_FAILED: '認証に失敗しました。',
  LOGIN_FAILED: 'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
  REGISTER_FAILED: '登録に失敗しました。',
  
  PROJECT_FETCH_FAILED: 'プロジェクトの取得に失敗しました。',
  PROJECT_CREATE_FAILED: 'プロジェクトの作成に失敗しました。',
  APPLICATION_SUBMIT_FAILED: '応募の送信に失敗しました。',
  
  PROFILE_FETCH_FAILED: 'プロフィールの取得に失敗しました。',
  PROFILE_UPDATE_FAILED: 'プロフィールの更新に失敗しました。',
  
  SEARCH_FAILED: '検索に失敗しました。',
  MESSAGE_SEND_FAILED: 'メッセージの送信に失敗しました。',
  
  PAYMENT_FAILED: '決済処理に失敗しました。',
  INVOICE_CREATE_FAILED: '請求書の作成に失敗しました。',
};

export const getErrorMessage = (error: any, context?: string): string => {
  if (!error) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    switch (status) {
      case 400:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  if (error.request) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.message) {
    return error.message;
  }

  if (context) {
    const contextErrorKey = `${context.toUpperCase()}_FAILED` as keyof typeof ERROR_MESSAGES;
    if (ERROR_MESSAGES[contextErrorKey]) {
      return ERROR_MESSAGES[contextErrorKey];
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

export const getContextualErrorMessage = (error: any, action: string): string => {
  const baseMessage = getErrorMessage(error);
  return `${action}：${baseMessage}`;
};
