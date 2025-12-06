import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthLayout, AccountTypeSelector, FormInput, ErrorMessage, SubmitButton, TermsCheckbox, DuplicateAccountMessage } from '../components/auth';
import { useErrorHandler } from '../hooks/useErrorHandler';

const RegisterPage: React.FC = () => {
  const [userType, setUserType] = useState<'influencer' | 'company'>('influencer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Registration form submitted');
    setLoading(true);
    setError('');
    setIsDuplicateEmail(false);

    console.log('📋 Form data:', { email, name, userType, hasPassword: !!password, agreeTerms });

    if (!email || !password || !name) {
      console.log('❌ Validation failed: Missing required fields');
      setError('すべての必須項目を入力してください');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Validation failed: Passwords do not match');
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      console.log('❌ Validation failed: Password too short');
      setError('パスワードは8文字以上で入力してください');
      setLoading(false);
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      console.log('❌ Validation failed: Password strength requirements not met');
      setError('パスワードには大文字、小文字、数字を含める必要があります');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      console.log('❌ Validation failed: Terms not agreed');
      setError('利用規約に同意してください');
      setLoading(false);
      return;
    }

    console.log('✅ All validations passed, calling API...');

    try {
      const { register } = await import('../services/api');
      const response = await register({
        email,
        password,
        role: userType === 'influencer' ? 'INFLUENCER' : "COMPANY",
        displayName: userType === 'influencer' ? name : undefined,
        contactName: userType === 'company' ? name : undefined,
        companyName: userType === 'company' ? company : undefined
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      handleSuccess('登録が完了しました！');
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || '';
      
      if (
        err.response?.status === 409 || 
        err.response?.status === 400 && (
          errorMessage.includes('既に登録') || 
          errorMessage.includes('already registered') ||
          errorMessage.toLowerCase().includes('email already')
        )
      ) {
        setIsDuplicateEmail(true);
      } else {
        handleError(err, '登録');
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else if (err.response?.data?.details) {
          const details = err.response.data.details;
          const messages = details.map((d: any) => d.message).join('、');
          setError(messages);
        } else {
          setError('登録に失敗しました。もう一度お試しください');
        }
      }
    } finally {
      setLoading(false);
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
    <AuthLayout title="新規登録" subtitle="アカウントを作成して始めましょう">
      {isDuplicateEmail && (
        <DuplicateAccountMessage 
          email={email} 
          onClose={() => setIsDuplicateEmail(false)} 
        />
      )}
      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <AccountTypeSelector value={userType} onChange={setUserType} />

        <FormInput
          label={userType === 'influencer' ? '名前' : '担当者名'}
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={userType === 'influencer' ? '山田 太郎' : '担当者名'}
          required
        />

        {userType === 'company' && (
          <FormInput
            label="会社名"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="株式会社〇〇"
          />
        )}

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
          placeholder="8文字以上（大文字・小文字・数字を含む）"
          required
          showPasswordToggle
          showTooltip
          tooltipContent={
            <div className="text-gray-700">
              <p className="font-medium mb-2">パスワードの条件：</p>
              <ul className="space-y-1">
                <li className={password.length >= 8 ? 'text-emerald-600 font-medium' : 'text-gray-600'}>
                  • 8文字以上
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-emerald-600 font-medium' : 'text-gray-600'}>
                  • 大文字を含む (A-Z)
                </li>
                <li className={/[a-z]/.test(password) ? 'text-emerald-600 font-medium' : 'text-gray-600'}>
                  • 小文字を含む (a-z)
                </li>
                <li className={/\d/.test(password) ? 'text-emerald-600 font-medium' : 'text-gray-600'}>
                  • 数字を含む (0-9)
                </li>
              </ul>
            </div>
          }
        />

        <FormInput
          label="パスワード確認"
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="パスワードを再入力"
          required
          showPasswordToggle
        />

        <TermsCheckbox checked={agreeTerms} onChange={setAgreeTerms} />

        <SubmitButton loading={loading} loadingText="登録中...">
          アカウント登録
        </SubmitButton>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          既にアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
