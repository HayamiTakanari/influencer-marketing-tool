import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import { NDA_CONTENT, CURRENT_NDA_VERSION } from '../utils/ndaValidation';

const NDAConsentPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [hasRead, setHasRead] = useState(false);
  const [isAgreeing, setIsAgreeing] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string>('/dashboard');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 既にNDAに同意済みの場合はダッシュボードにリダイレクト
      if (parsedUser.hasAgreedToNDA) {
        router.push('/dashboard');
        return;
      }
    } else {
      router.push('/login');
    }
    
    // リダイレクト元のURLを保存
    const { from } = router.query;
    if (from && typeof from === 'string') {
      setReturnUrl(from);
    }
  }, [router]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
    
    // 90%以上スクロールしたら「読了」とみなす
    if (scrollPercentage >= 90) {
      setHasRead(true);
    }
  };

  const handleAgree = async () => {
    if (!hasRead) {
      alert('契約書を最後までお読みください。');
      return;
    }

    setIsAgreeing(true);

    try {
      // API call to record NDA agreement
      const api = await import('../services/api');
      const response = await api.default.post('/nda/agree', {
        hasAgreedToNDA: true,
      });

      // ユーザー情報を更新
      const updatedUser = {
        ...user,
        hasAgreedToNDA: true,
        ndaAgreedAt: new Date().toISOString(),
        ndaVersion: CURRENT_NDA_VERSION
      };

      // localStorageとstateを更新
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert('NDA（秘密保持契約）への同意が完了しました。');

      // 元のページまたはダッシュボードにリダイレクト
      router.push(returnUrl);

    } catch (err: any) {
      console.error('Error agreeing to NDA:', err);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsAgreeing(false);
    }
  };

  const handleDecline = () => {
    if (confirm('NDAに同意しない場合、本サービスをご利用いただけません。\nログアウトしてもよろしいですか？')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <DashboardLayout title="読み込み中..." subtitle="">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="秘密保持契約（NDA）への同意"
      subtitle="本サービスの利用には、秘密保持契約への同意が必要です"
    >
      <div>
        <Card padding="xl">
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">重要なお知らせ</h3>
                  <p className="text-yellow-700 text-sm">
                    以下の秘密保持契約書を最後までお読みいただき、内容に同意いただく必要があります。
                    同意いただけない場合は、本サービスをご利用いただけません。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">秘密保持契約書</h2>
              <span className="text-sm text-gray-500">バージョン: {CURRENT_NDA_VERSION}</span>
            </div>
            
            <div 
              className="bg-gray-50 border border-gray-300 rounded-lg p-6 h-96 overflow-y-auto"
              onScroll={handleScroll}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {NDA_CONTENT}
              </pre>
            </div>
            
            {!hasRead && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                ↓ 契約書を最後までスクロールしてお読みください ↓
              </p>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="mb-6">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={hasRead}
                  readOnly
                  className="mt-1"
                />
                <span className={`text-sm ${hasRead ? 'text-gray-900' : 'text-gray-400'}`}>
                  上記の秘密保持契約書を読み、内容を理解しました
                </span>
              </label>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handleAgree}
                variant="primary"
                size="lg"
                disabled={!hasRead || isAgreeing}
                loading={isAgreeing}
                className="flex-1"
              >
                同意して続ける
              </Button>
              <Button
                onClick={handleDecline}
                variant="outline"
                size="lg"
                disabled={isAgreeing}
                className="flex-1"
              >
                同意しない
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              同意日時と同意したNDAのバージョンは記録されます。<br />
              NDAの内容は予告なく変更される場合があります。
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NDAConsentPage;