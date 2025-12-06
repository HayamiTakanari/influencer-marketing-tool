import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { captureError } from '../../utils/error-tracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

/**
 * React Error Boundary with Sentry integration
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Sentryにエラーを報告
    const captureResult = captureError(error, {
      component: 'ErrorBoundary',
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }
    });
    const errorId: string | undefined = (typeof captureResult === 'string' ? captureResult : undefined) || undefined;

    this.setState({ errorId });

    // カスタムエラーハンドラがあれば実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  handleReportProblem = () => {
    if (this.state.errorId) {
      // Sentryのユーザーフィードバック機能を使用
      Sentry.showReportDialog({
        eventId: this.state.errorId,
        title: 'エラーが発生しました',
        subtitle: 'このエラーについて詳細を教えてください',
        subtitle2: 'お客様のフィードバックは改善に役立ちます',
        labelName: 'お名前',
        labelEmail: 'メールアドレス',
        labelComments: 'エラーが発生した際の詳細を教えてください',
        labelClose: '閉じる',
        labelSubmit: '送信',
        errorGeneric: '不明なエラーが発生しました。',
        errorFormEntry: '一部のフィールドが無効です。修正してから再度お試しください。',
        successMessage: 'フィードバックをありがとうございます！',
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックUIが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              {/* エラーアイコン */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* エラーメッセージ */}
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                申し訳ございません
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                予期しないエラーが発生しました。しばらく待ってから再度お試しください。
              </p>

              {/* エラーID（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-left">
                  <p className="font-medium text-gray-700 mb-1">エラー詳細:</p>
                  <p className="text-gray-600 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-gray-500 mt-1">
                      ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  再試行
                </button>
                
                <button
                  onClick={this.handleReportProblem}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  問題を報告
                </button>
              </div>

              {/* ホームに戻るリンク */}
              <div className="mt-4">
                <a
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  ← ホームに戻る
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;