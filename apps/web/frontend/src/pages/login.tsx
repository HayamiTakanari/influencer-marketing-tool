import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthLayout, AccountTypeSelector, FormInput, ErrorMessage, SubmitButton } from '../components/auth';
import { useErrorHandler } from '../hooks/useErrorHandler';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'influencer' | 'company'>('influencer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { handleSuccess } = useErrorHandler();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setLoading(false);
      return;
    }

    try {
      const { login } = await import('../services/api');
      const response = await login(email, password);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      handleSuccess('ログインに成功しました');
      router.push('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('メールアドレスまたはパスワードが間違っています');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('ログインに失敗しました。もう一度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (type: 'influencer' | "company") => {
    if (type === 'influencer') {
      setEmail('influencer1@example.com');
      setPassword('password123');
      setAccountType('influencer');
    } else {
      setEmail('client1@example.com');
      setPassword('password123');
      setAccountType('company');
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <AuthLayout title="ログイン" subtitle="アカウントにログインして続ける">
      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <AccountTypeSelector value={accountType} onChange={setAccountType} />

        <FormInput
          label="メールアドレス"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
        />

        <FormInput
          label="パスワード"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワードを入力"
          required
          showPasswordToggle
        />

        <SubmitButton loading={loading} loadingText="ログイン中...">
          ログイン
        </SubmitButton>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">テストアカウント</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fillTestAccount('influencer')}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            インフルエンサー
          </button>
          <button
            type="button"
            onClick={() => fillTestAccount("company")}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            企業
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
            こちらから登録
          </Link>
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-gray-500 text-xs mb-3">システム管理者向け</p>
        <Link
          href="/admin/login"
          className="block w-full text-center px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          管理者ログイン
        </Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
