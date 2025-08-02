import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // マウント状態を設定
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Login form submitted');
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
    console.log('Fill test account clicked:', type);
    if (type === 'influencer') {
      setEmail('influencer@test.com');
      setPassword('test123');
    } else {
      setEmail('company@test.com');
      setPassword('test123');
    }
  };

  const testDirectAPI = async () => {
    try {
      console.log('Testing direct API call...');
      const response = await fetch('http://localhost:5002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'company@test.com',
          password: 'test123'
        })
      });
      const data = await response.json();
      console.log('Direct API response:', data);
      alert('Direct API test successful! Check console for details.');
    } catch (error) {
      console.error('Direct API test failed:', error);
      alert('Direct API test failed! Check console for details.');
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* デザイン性の高い背景 - SimpleLandingPageと同様 */}
      <div className="fixed inset-0 z-0">
        {/* ベースグラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        
        {/* メッシュグラデーション */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -inset-[100%] opacity-60">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #d1fae5, #10b981, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #f3f4f6, #6b7280, transparent)' }} />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #6ee7b7, #059669, transparent)' }} />
          </div>
        </div>
        
        {/* アーティスティックパターン */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="artistic-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern)" />
        </svg>
      </div>

      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-50" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold text-gray-900 relative cursor-pointer"
              >
                <span className="relative z-10">
                  InfluenceLink
                </span>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
              </motion.div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative text-white px-6 py-2.5 font-medium overflow-hidden group"
                  style={{ 
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%)',
                    background: 'linear-gradient(135deg, #10b981, #059669, #047857)'
                  }}
                >
                  <span className="relative z-10">アカウント作成</span>
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, #047857, #065f46, #064e3b)' }}
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative z-10">
        <div className="max-w-md w-full">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative bg-white border-2 border-gray-900 p-10 transition-all"
            style={{ 
              boxShadow: '10px 10px 0 rgba(0,0,0,0.12), 5px 5px 25px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.9)',
              background: 'linear-gradient(45deg, #f9fafb 25%, transparent 25%), linear-gradient(-45deg, #f9fafb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f9fafb 75%), linear-gradient(-45deg, transparent 75%, #f9fafb 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          >
            {/* ヘッダー */}
            <div className="text-center mb-8">
              <motion.div
                initial={false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative w-20 h-20 mx-auto mb-6"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 transform rotate-45" 
                  style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)' }} 
                />
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl z-10">IL</span>
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
              <p className="text-gray-600">アカウントにログインしてください</p>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 mb-6"
                style={{ boxShadow: '3px 3px 0 rgba(239, 68, 68, 0.3)' }}
              >
                {error}
              </motion.div>
            )}

            {/* ログインフォーム */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 bg-white focus:outline-none focus:border-emerald-600 transition-all"
                  placeholder="example@email.com"
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 bg-white focus:outline-none focus:border-emerald-600 transition-all"
                  placeholder="パスワードを入力"
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="relative w-full text-white py-4 font-bold text-lg overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
                  background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                  boxShadow: '5px 5px 0 rgba(16, 185, 129, 0.4), 3px 3px 15px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                  textShadow: 'none'
                }}
              >
                <span className="relative z-10">{loading ? 'ログイン中...' : 'ログイン'}</span>
                <motion.div 
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, #047857, #065f46, #064e3b)' }}
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </form>

            {/* テストアカウント */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <p className="text-sm font-bold text-gray-900 text-center mb-4">テスト用アカウント</p>
              
              {/* 直接的なテストボタン */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    console.log('Direct test: Setting influencer email');
                    setEmail('influencer@test.com');
                    setPassword('test123');
                    console.log('Set email to:', 'influencer@test.com');
                  }}
                  className="relative bg-white border-2 border-purple-600 text-purple-700 px-4 py-2 font-bold transition-all overflow-hidden group"
                  style={{ boxShadow: '3px 3px 0 rgba(147, 51, 234, 0.3)' }}
                >
                  <span className="relative z-10">👑 インフルエンサー</span>
                  <motion.div 
                    className="absolute inset-0 bg-purple-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.span 
                    className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    👑 インフルエンサー
                  </motion.span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    console.log('Direct test: Setting client email');
                    setEmail('company@test.com');
                    setPassword('test123');
                    console.log('Set email to:', 'company@test.com');
                  }}
                  className="relative bg-white border-2 border-blue-600 text-blue-700 px-4 py-2 font-bold transition-all overflow-hidden group"
                  style={{ boxShadow: '3px 3px 0 rgba(59, 130, 246, 0.3)' }}
                >
                  <span className="relative z-10">🏢 企業</span>
                  <motion.div 
                    className="absolute inset-0 bg-blue-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.span 
                    className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    🏢 企業
                  </motion.span>
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Influencer test account clicked');
                    fillTestAccount('influencer');
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    console.log('Influencer test account mouse down');
                  }}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  👑 インフルエンサー
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Client test account clicked');
                    fillTestAccount('client');
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    console.log('Client test account mouse down');
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  🏢 企業
                </button>
              </div>
              
              {/* API テストボタン */}
              <div className="mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={testDirectAPI}
                  className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 border-2 border-yellow-400 text-sm font-bold hover:bg-yellow-200 transition-all"
                  style={{ boxShadow: '3px 3px 0 rgba(251, 191, 36, 0.3)' }}
                >
                  🔧 API接続テスト
                </motion.button>
              </div>
            </div>

            {/* リンク */}
            <div className="mt-8 text-center space-y-4">
              <p className="text-gray-700 font-medium">
                アカウントをお持ちでない方は{' '}
                <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
                  こちらから登録
                </Link>
              </p>
              <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                ← トップページに戻る
              </Link>
            </div>
          </motion.div>

          {/* 利用可能なテストアカウント一覧 */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 relative bg-white border border-gray-300 p-6"
            style={{ 
              boxShadow: '6px 6px 0 rgba(0,0,0,0.1), 3px 3px 15px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 relative">
              利用可能なテストアカウント
              <div className="absolute -bottom-1 left-0 w-8 h-0.5 opacity-80" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
            </h3>
            <div className="space-y-3 text-sm">
              <div className="bg-purple-50 border border-purple-200 p-3" style={{ boxShadow: '2px 2px 0 rgba(147, 51, 234, 0.1)' }}>
                <p className="font-bold text-purple-900">👑 インフルエンサー</p>
                <p className="text-purple-700">influencer@test.com / test123</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3" style={{ boxShadow: '2px 2px 0 rgba(59, 130, 246, 0.1)' }}>
                <p className="font-bold text-blue-900">🏢 企業</p>
                <p className="text-blue-700">company@test.com / test123</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;