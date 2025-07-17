import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // クライアントサイドバリデーション
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      setLoading(false);
      return;
    }
    
    // テスト環境のため、パスワードバリデーションを緩和
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      setLoading(false);
      return;
    }

    try {
      const { login } = await import('../services/api');
      const response = await login(email, password);
      
      // JWTトークンとユーザー情報を保存
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // ダッシュボードに遷移
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('メールアドレスまたはパスワードが間違っています。');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.details) {
        // バリデーションエラーの詳細を表示
        const details = err.response.data.details;
        const messages = details.map((d: any) => d.message).join('、');
        setError(messages);
      } else {
        setError('ログインに失敗しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (type: 'influencer' | 'client') => {
    if (type === 'influencer') {
      setEmail('influencer@test.com');
      setPassword('test123');
    } else {
      setEmail('company@test.com');
      setPassword('test123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
        >
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <span className="text-white font-bold text-xl">IM</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
            <p className="text-gray-600">アカウントにログインしてください</p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="パスワードを入力"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </motion.button>
          </form>

          {/* テストアカウント */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">テスト用アカウント</p>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fillTestAccount('influencer')}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                👑 インフルエンサー
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fillTestAccount('client')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                🏢 企業
              </motion.button>
            </div>
          </div>

          {/* リンク */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-semibold">
                こちらから登録
              </Link>
            </p>
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← トップページに戻る
            </Link>
          </div>
        </motion.div>

        {/* 利用可能なテストアカウント一覧 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 bg-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">利用可能なテストアカウント</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="font-medium text-purple-900">👑 インフルエンサー</p>
              <p className="text-purple-700">influencer@test.com / test123</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-900">🏢 企業</p>
              <p className="text-blue-700">company@test.com / test123</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;