import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';

const RegisterPage: React.FC = () => {
  const [userType, setUserType] = useState<'influencer' | 'client' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    category: '',
    company: ''
  });
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const router = useRouter();
  
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationLoading(true);
    setRegistrationError('');
    
    // クライアントサイドバリデーション
    if (!formData.email || !formData.password || !formData.name) {
      setRegistrationError('必須項目をすべて入力してください。');
      setRegistrationLoading(false);
      return;
    }
    
    if (formData.password.length < 8) {
      setRegistrationError('パスワードは8文字以上で入力してください。');
      setRegistrationLoading(false);
      return;
    }
    
    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setRegistrationError('有効なメールアドレスを入力してください。');
      setRegistrationLoading(false);
      return;
    }
    
    // インフルエンサーの場合のカテゴリチェック
    if (userType === 'influencer' && !formData.category) {
      setRegistrationError('カテゴリーを選択してください。');
      setRegistrationLoading(false);
      return;
    }
    
    // 企業の場合の会社名チェック
    if (userType === 'client' && !formData.company) {
      setRegistrationError('会社名を入力してください。');
      setRegistrationLoading(false);
      return;
    }
    
    try {
      const { register } = await import('../services/api');
      
      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: userType === 'influencer' ? 'INFLUENCER' : 'CLIENT',
        displayName: userType === 'influencer' ? formData.name : undefined,
        companyName: userType === 'client' ? formData.company : undefined,
        contactName: userType === 'client' ? formData.name : undefined
      };
      
      const response = await register(registrationData);
      
      // 登録成功後、自動的にログイン
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      alert('アカウントが正常に作成されました！');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.error) {
        setRegistrationError(err.response.data.error);
      } else if (err.response?.data?.details) {
        // バリデーションエラーの詳細を表示
        const details = err.response.data.details;
        const messages = details.map((d: any) => {
          // フィールド名を日本語に変換
          const fieldMap: { [key: string]: string } = {
            password: 'パスワード',
            email: 'メールアドレス',
            displayName: '表示名',
            companyName: '会社名',
            contactName: '担当者名'
          };
          const fieldName = fieldMap[d.path[0]] || d.path[0];
          
          // エラーメッセージを日本語化
          if (d.code === 'too_small' && d.path[0] === 'password') {
            return `${fieldName}は${d.minimum}文字以上で入力してください。`;
          } else if (d.code === 'invalid_string' && d.validation === 'email') {
            return '有効なメールアドレスを入力してください。';
          }
          return d.message;
        }).join('、');
        setRegistrationError(messages);
      } else {
        setRegistrationError('アカウント作成に失敗しました。もう一度お試しください。');
      }
    } finally {
      setRegistrationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              アカウント作成
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            あなたの立場を選択してください
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* インフルエンサー登録 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -10 }}
            className="group relative"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="text-center">
                <div className="text-6xl mb-6">👑</div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">
                  インフルエンサー登録
                </h2>
                <p className="text-gray-600 mb-6">
                  クリエイターとして収益化を始めましょう
                </p>
                <ul className="text-left space-y-2 mb-8">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    ブランドからのオファー受信
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    収益分析機能
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    プロフィール管理
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    安全な決済システム
                  </li>
                </ul>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserType('influencer')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  インフルエンサーとして登録
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* クライアント登録 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -10 }}
            className="group relative"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="text-center">
                <div className="text-6xl mb-6">🏢</div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">
                  企業・ブランド登録
                </h2>
                <p className="text-gray-600 mb-6">
                  効果的なマーケティングを始めましょう
                </p>
                <ul className="text-left space-y-2 mb-8">
                  <li className="flex items-center text-gray-700">
                    <span className="text-blue-500 mr-2">✓</span>
                    インフルエンサー検索
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-blue-500 mr-2">✓</span>
                    キャンペーン管理
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-blue-500 mr-2">✓</span>
                    効果測定・分析
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-blue-500 mr-2">✓</span>
                    契約・支払い管理
                  </li>
                </ul>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserType('client')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  企業・ブランドとして登録
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-gray-600">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
              ログイン
            </Link>
          </p>
        </motion.div>
      </div>

      {/* 選択後のフォーム表示 */}
      {userType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full relative"
          >
            <button
              onClick={() => setUserType(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-center">
              {userType === 'influencer' ? 'インフルエンサー登録' : '企業・ブランド登録'}
            </h2>
            
            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="山田 太郎"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8文字以上で入力"
                />
              </div>
              
              {userType === 'influencer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリー
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    <option value="美容">美容</option>
                    <option value="ファッション">ファッション</option>
                    <option value="ライフスタイル">ライフスタイル</option>
                    <option value="料理">料理</option>
                    <option value="旅行">旅行</option>
                    <option value="フィットネス">フィットネス</option>
                    <option value="テクノロジー">テクノロジー</option>
                  </select>
                </div>
              )}
              
              {userType === 'client' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社名
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="株式会社〇〇"
                  />
                </div>
              )}
              
              {registrationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {registrationError}
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={registrationLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registrationLoading ? 'アカウント作成中...' : 'アカウント作成'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default RegisterPage;