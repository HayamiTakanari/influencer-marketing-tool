import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthLayout, FormInput, ErrorMessage, SubmitButton } from '../../components/auth';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const AdminRegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    adminCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { handleSuccess } = useErrorHandler();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.passwordConfirm) {
      setError('全てのフィールドを入力してください');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      return false;
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return false;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('パスワードが一致しません');
      return false;
    }

    if (!formData.adminCode) {
      setError('管理者コードを入力してください');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { register } = await import('../../services/api');
      await register({
        email: formData.email,
        password: formData.password,
        role: 'ADMIN',
        adminCode: formData.adminCode,
      });

      setSuccess('登録完了しました。確認メールを送信しました。');

      setTimeout(() => {
        router.push('/admin/login');
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('登録に失敗しました。もう一度お試しください');
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
    <AuthLayout title="管理者登録" subtitle="システム管理者アカウントを作成">
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          <strong>重要：</strong> 管理者登録には管理者コードが必要です。不正なアクセスを防ぐため、コードは厳密に管理されています。
        </p>
      </div>

      <ErrorMessage message={error} />

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="メールアドレス"
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="admin@example.com"
          required
        />

        <FormInput
          label="パスワード"
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="8文字以上のパスワード"
          required
          showPasswordToggle
        />

        <FormInput
          label="パスワード（確認）"
          id="passwordConfirm"
          type="password"
          name="passwordConfirm"
          value={formData.passwordConfirm}
          onChange={handleChange}
          placeholder="パスワードを再度入力"
          required
          showPasswordToggle
        />

        <div className="relative">
          <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 mb-2">
            管理者コード <span className="text-red-500">*</span>
          </label>
          <input
            id="adminCode"
            type="password"
            name="adminCode"
            value={formData.adminCode}
            onChange={handleChange}
            placeholder="管理者コードを入力"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            管理者コードは別途提供されます
          </p>
        </div>

        <SubmitButton loading={loading} loadingText="登録中...">
          管理者アカウントを作成
        </SubmitButton>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600 mb-2">
          既に管理者アカウントをお持ちですか？
        </p>
        <Link
          href="/admin/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          管理者ログインはこちら
        </Link>
      </div>
    </AuthLayout>
  );
};

export default AdminRegisterPage;
