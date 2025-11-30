import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeSecurityMonitoring, monitorDOMChanges } from '../utils/security-monitor';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ErrorProvider } from '../contexts/ErrorContext';
import ErrorToast from '../components/common/ErrorToast';
import { setUserContext, trackPageView } from '../utils/error-tracking';
import { errorLogger } from '../utils/errorLogger';


export default function App({ Component, pageProps, router }: AppProps & { router: any }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry on 404s
          if (error && 'status' in error && error.status === 404) {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  }));

  // ページ変遷の追跡
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      trackPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    // Remove any server-side styling
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }

    // XSS対策: セキュリティ監視の初期化
    initializeSecurityMonitoring();
    
    // DOM変更の監視を開始
    monitorDOMChanges();
    
    // 初期ページビューを追跡
    trackPageView(router.pathname);
  }, [router.pathname]);

  // グローバルエラーハンドラ
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      errorLogger.log(event.error, 'GLOBAL_ERROR', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorLogger.log(event.reason, 'UNHANDLED_PROMISE_REJECTION');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Console警告は1回のみ表示（マウント時のみ）
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.sessionStorage.getItem('consoleWarningShown')) {
      console.warn(
        '%c⚠️ 警告: Developer Console Attack対策',
        'color: red; font-size: 16px; font-weight: bold;',
        '\n悪意のあるコードをここに貼り付けないでください。\nアカウントが乗っ取られる可能性があります。'
      );
      window.sessionStorage.setItem('consoleWarningShown', 'true');

      // エラーロガーの初期化
      console.log('%c📊 エラーロギングシステムを初期化しました', 'color: blue; font-weight: bold;');

      // 開発環境でエラーサマリーを表示するための window オブジェクトに追加
      if (typeof window !== 'undefined') {
        (window as any).__errorLogger = {
          getLogs: () => errorLogger.getAllLogs(),
          printSummary: () => errorLogger.printSummary(),
          clear: () => errorLogger.clearLogs()
        };
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>インフルエンサーマーケティングツール</title>
        <meta name="description" content="インフルエンサーとクライアントをつなぐマーケティングプラットフォーム" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        
        {/* セキュリティメタタグ（metaタグで設定可能なもののみ） */}
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </Head>
      <ErrorBoundary>
        <ErrorProvider>
          <QueryClientProvider client={queryClient}>
            <ErrorToast />
            <Component {...pageProps} />
          </QueryClientProvider>
        </ErrorProvider>
      </ErrorBoundary>
    </>
  );
}