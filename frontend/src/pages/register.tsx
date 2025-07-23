import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';

const RegisterPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<'influencer' | 'client' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    category: '',
    company: '',
    plan: 'free', // デフォルトプラン
    phone: '',
    agreeTerms: false,
    agreePrivacy: false,
    subscribeNewsletter: false
  });
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const router = useRouter();

  // URLからメール認証トークンをチェック
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailToken = urlParams.get('emailToken');
    if (emailToken) {
      verifyEmailToken(emailToken);
    }
  }, []);

  const verifyEmailToken = async (token: string) => {
    try {
      const { verifyEmail } = await import('../services/api');
      await verifyEmail(token);
      setIsEmailVerified(true);
      alert('メール認証が完了しました！');
      // URLからトークンを削除
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      alert('メール認証に失敗しました: ' + error.message);
    }
  };

  const steps = [
    { title: 'ユーザータイプ選択', description: 'あなたの立場を選択してください' },
    { title: '基本情報入力', description: '必要な情報を入力してください' },
    { title: 'プラン選択', description: '最適なプランを選択してください' },
    { title: '登録完了', description: 'アカウントを作成します' },
    { title: 'メール認証', description: 'メール認証を完了してください' }
  ];

  const pricingPlans = [
    {
      id: 'free',
      name: 'Freeプラン',
      price: '0円',
      description: 'まずは0円で使ってみる！',
      features: ['検索機能のみ', '※無料紹介投稿は可能'],
      recommended: false
    },
    {
      id: 'standard',
      name: 'Standardプラン',
      price: '1マッチング3万円',
      description: '謝礼が発生するもの',
      features: ['全機能利用可能', 'マッチング機能', 'キャンペーン管理'],
      recommended: true
    },
    {
      id: 'pro',
      name: 'Proプラン',
      price: '月額35万円',
      description: '全機能',
      features: ['無制限マッチング', '専任サポート', '詳細分析レポート'],
      recommended: false
    }
  ];

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    const errors: {[key: string]: string} = {};
    
    if (currentStep === 1) {
      if (!formData.name.trim()) errors.name = '名前を入力してください';
      if (!formData.email.trim()) errors.email = 'メールアドレスを入力してください';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = '有効なメールアドレスを入力してください';
      }
      if (!formData.password) errors.password = 'パスワードを入力してください';
      else if (formData.password.length < 8) errors.password = 'パスワードは8文字以上で入力してください';
      
      if (userType === 'influencer' && !formData.category) {
        errors.category = 'カテゴリーを選択してください';
      }
      if (userType === 'client' && !formData.company.trim()) {
        errors.company = '会社名を入力してください';
      }
      if (!formData.agreeTerms) errors.agreeTerms = '利用規約に同意してください';
      if (!formData.agreePrivacy) errors.agreePrivacy = 'プライバシーポリシーに同意してください';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegistration = async () => {
    setRegistrationLoading(true);
    setRegistrationError('');
    
    try {
      const { register, sendEmailVerification } = await import('../services/api');
      
      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: userType === 'influencer' ? 'INFLUENCER' : 'CLIENT',
        displayName: userType === 'influencer' ? formData.name : undefined,
        companyName: userType === 'client' ? formData.company : undefined,
        contactName: userType === 'client' ? formData.name : undefined,
        plan: formData.plan,
        phone: formData.phone,
        subscribeNewsletter: formData.subscribeNewsletter
      };
      
      const response = await register(registrationData);
      
      // メール認証リンクを送信
      try {
        await sendEmailVerification(formData.email);
        setEmailVerificationSent(true);
        alert('アカウントが作成されました！\nメール認証リンクを送信しましたので、メールボックスを確認してください。');
      } catch (emailError) {
        console.warn('Email verification send failed:', emailError);
        alert('アカウントが作成されましたが、メール認証の送信に失敗しました。');
      }
      
      // メール認証待ち状態に移行（自動ログインは無し）
      // 本来はメール認証後にログインさせるべき
      // localStorage.setItem('token', response.token);
      // localStorage.setItem('user', JSON.stringify(response.user));
      
      // メール認証待ちページへリダイレクトしないで、このページで待つ
      setCurrentStep(4); // 新しいステップを追加する必要がある
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.error) {
        setRegistrationError(err.response.data.error);
      } else if (err.response?.data?.details) {
        const details = err.response.data.details;
        const messages = details.map((d: any) => {
          const fieldMap: { [key: string]: string } = {
            password: 'パスワード',
            email: 'メールアドレス',
            displayName: '表示名',
            companyName: '会社名',
            contactName: '担当者名'
          };
          const fieldName = fieldMap[d.path[0]] || d.path[0];
          
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
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden flex items-center justify-center px-4">
      {/* ランディングページと同じ背景デザイン */}
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
        
        {/* シンプルな波パターン */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.03) 31%, rgba(0,0,0,0.03) 32%, transparent 33%)
          `,
          backgroundSize: '200px 200px'
        }} />
        
        {/* アシンメトリックライン */}
        <svg className="absolute top-1/4 left-0 w-full h-px opacity-[0.05]" preserveAspectRatio="none">
          <path d="M0,0 Q400,0 800,0 T1600,0" stroke="#000000" strokeWidth="1" fill="none" />
        </svg>
        <svg className="absolute top-3/4 left-0 w-full h-px opacity-[0.05]" preserveAspectRatio="none">
          <path d="M0,0 Q600,0 1200,0 T2400,0" stroke="#000000" strokeWidth="1" fill="none" />
        </svg>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* プログレスバー */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    index <= currentStep 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-1 mx-4 ${
                      index < currentStep ? 'bg-emerald-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 relative">
                <span className="text-gray-900">
                  {steps[currentStep]?.title}
                </span>
                {/* アクセントライン */}
                <svg className="absolute -bottom-2 left-0 w-full" height="20" viewBox="0 0 300 20" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="accent-gradient-1-register" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="accent-gradient-2-register" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                  <path d="M0,10 Q150,0 300,10" stroke="url(#accent-gradient-1-register)" strokeWidth="2" fill="none"/>
                  <path d="M0,12 Q150,2 300,12" stroke="url(#accent-gradient-2-register)" strokeWidth="1" fill="none"/>
                </svg>
              </h1>
              <p className="text-xl text-gray-600">
                {steps[currentStep]?.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ステップコンテンツ */}
        <div className="max-w-4xl mx-auto">
          {/* ステップ1: ユーザータイプ選択 */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* インフルエンサー登録 */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="group relative"
                >
                  <div className="relative bg-white border border-gray-200 p-8 transition-all group overflow-hidden" style={{
                    background: `
                      linear-gradient(135deg, transparent 10px, white 10px),
                      linear-gradient(-135deg, transparent 10px, white 10px),
                      linear-gradient(45deg, transparent 10px, white 10px),
                      linear-gradient(-45deg, transparent 10px, white 10px)
                    `,
                    backgroundPosition: 'top left, top right, bottom right, bottom left',
                    backgroundSize: '50% 50%',
                    backgroundRepeat: 'no-repeat',
                    boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}>
                    {/* シンプルアーティスティックパターン */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05) 1px, transparent 1px),
                        radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: '60px 60px, 80px 80px'
                    }} />
                    {/* サブトルな内側シャドウ */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.03), inset -1px -1px 2px rgba(255,255,255,0.5)'
                    }} />
                    <div className="text-center relative z-10">
                      <div className="text-6xl mb-6">👑</div>
                      <h2 className="text-3xl font-bold mb-4 text-gray-900">
                        インフルエンサー登録
                      </h2>
                      <p className="text-gray-600 mb-6">
                        クリエイターとして収益化を始めましょう
                      </p>
                      <ul className="text-left space-y-2 mb-8">
                        <li className="flex items-center text-gray-700">
                          <span className="text-emerald-500 mr-2">✓</span>
                          ブランドからのオファー受信
                        </li>
                        <li className="flex items-center text-gray-700">
                          <span className="text-emerald-500 mr-2">✓</span>
                          収益分析機能
                        </li>
                        <li className="flex items-center text-gray-700">
                          <span className="text-emerald-500 mr-2">✓</span>
                          プロフィール管理
                        </li>
                        <li className="flex items-center text-gray-700">
                          <span className="text-emerald-500 mr-2">✓</span>
                          安全な決済システム
                        </li>
                      </ul>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setUserType('influencer'); nextStep(); }}
                        className="relative w-full text-white py-4 font-bold text-lg overflow-hidden group"
                        style={{
                          clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
                          background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                          boxShadow: '3px 3px 0 rgba(16, 185, 129, 0.25), 2px 2px 8px rgba(16, 185, 129, 0.12)'
                        }}
                      >
                        <span className="relative z-10">
                          インフルエンサーとして登録
                        </span>
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(135deg, #047857, #065f46, #064e3b)' }}
                          initial={{ x: "-100%" }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* クライアント登録 */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="group relative"
                >
                  <div className="relative bg-white border border-gray-200 p-8 transition-all group overflow-hidden" style={{
                    background: `
                      linear-gradient(135deg, transparent 10px, white 10px),
                      linear-gradient(-135deg, transparent 10px, white 10px),
                      linear-gradient(45deg, transparent 10px, white 10px),
                      linear-gradient(-45deg, transparent 10px, white 10px)
                    `,
                    backgroundPosition: 'top left, top right, bottom right, bottom left',
                    backgroundSize: '50% 50%',
                    backgroundRepeat: 'no-repeat',
                    boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
                  }}>
                    {/* シンプルアーティスティックパターン */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05) 1px, transparent 1px),
                        radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: '60px 60px, 80px 80px'
                    }} />
                    {/* サブトルな内側シャドウ */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.03), inset -1px -1px 2px rgba(255,255,255,0.5)'
                    }} />
                    <div className="text-center relative z-10">
                      <div className="text-6xl mb-6">🏢</div>
                      <h2 className="text-3xl font-bold mb-4 text-gray-900">
                        企業・ブランド登録
                      </h2>
                      <p className="text-gray-600 mb-6">
                        効果的なマーケティングを始めましょう
                      </p>
                      <ul className="text-left space-y-2 mb-8">
                        <li className="flex items-center text-gray-700">
                          <span className="text-emerald-500 mr-2">✓</span>
                          インフルエンサー検索
                        </li>
                        <li className="flex items-center text-gray-700">
                          <span className="text-emerald-500 mr-2">✓</span>
                          キャンペーン管理
                        </li>
                        <li className="flex items-center text-gray-700">
                          <span className="text-emerald-500 mr-2">✓</span>
                          効果測定・分析
                        </li>
                        <li className="flex items-center text-gray-700">
                          <span className="text-emerald-500 mr-2">✓</span>
                          契約・支払い管理
                        </li>
                      </ul>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setUserType('client'); nextStep(); }}
                        className="relative w-full text-white py-4 font-bold text-lg overflow-hidden group"
                        style={{
                          clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
                          background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                          boxShadow: '3px 3px 0 rgba(16, 185, 129, 0.25), 2px 2px 8px rgba(16, 185, 129, 0.12)'
                        }}
                      >
                        <span className="relative z-10">
                          企業・ブランドとして登録
                        </span>
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(135deg, #047857, #065f46, #064e3b)' }}
                          initial={{ x: "-100%" }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ステップ2: 基本情報入力 */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative bg-white border border-gray-200 p-8" style={{
                background: `
                  linear-gradient(135deg, transparent 10px, white 10px),
                  linear-gradient(-135deg, transparent 10px, white 10px),
                  linear-gradient(45deg, transparent 10px, white 10px),
                  linear-gradient(-45deg, transparent 10px, white 10px)
                `,
                backgroundPosition: 'top left, top right, bottom right, bottom left',
                backgroundSize: '50% 50%',
                backgroundRepeat: 'no-repeat',
                boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お名前 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="山田 太郎"
                    />
                    {fieldErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="example@email.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      パスワード *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={async (e) => {
                        const newPassword = e.target.value;
                        setFormData({...formData, password: newPassword});
                        
                        // パスワード強度をチェック
                        if (newPassword) {
                          const { checkPasswordStrength } = await import('../services/api');
                          setPasswordStrength(checkPasswordStrength(newPassword));
                        } else {
                          setPasswordStrength(null);
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="8文字以上で入力"
                    />
                    {fieldErrors.password && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
                    )}
                    
                    {/* パスワード強度インジケーター */}
                    {passwordStrength && formData.password && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">パスワード強度</span>
                          <span className={`text-sm font-medium ${
                            passwordStrength.score < 2 ? 'text-red-500' :
                            passwordStrength.score < 4 ? 'text-yellow-500' : 'text-green-500'
                          }`}>
                            {passwordStrength.score < 2 ? '弱い' :
                             passwordStrength.score < 4 ? '普通' : '強い'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score < 2 ? 'bg-red-500' :
                              passwordStrength.score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`flex items-center ${
                            passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <span className="mr-1">{passwordStrength.hasMinLength ? '✓' : '×'}</span>
                            8文字以上
                          </div>
                          <div className={`flex items-center ${
                            passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <span className="mr-1">{passwordStrength.hasLowercase ? '✓' : '×'}</span>
                            小文字
                          </div>
                          <div className={`flex items-center ${
                            passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <span className="mr-1">{passwordStrength.hasUppercase ? '✓' : '×'}</span>
                            大文字
                          </div>
                          <div className={`flex items-center ${
                            passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <span className="mr-1">{passwordStrength.hasNumber ? '✓' : '×'}</span>
                            数字
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="090-1234-5678"
                    />
                  </div>
                  
                  {userType === 'influencer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        カテゴリー *
                      </label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          fieldErrors.category ? 'border-red-500' : 'border-gray-300'
                        }`}
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
                      {fieldErrors.category && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.category}</p>
                      )}
                    </div>
                  )}
                  
                  {userType === 'client' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        会社名 *
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          fieldErrors.company ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="株式会社〇〇"
                      />
                      {fieldErrors.company && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.company}</p>
                      )}
                    </div>
                  )}

                  {/* 同意チェックボックス */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                        className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="agreeTerms" className="ml-2 text-sm text-gray-700">
                        <Link href="/terms" className="text-emerald-600 hover:underline">利用規約</Link>に同意します *
                      </label>
                    </div>
                    {fieldErrors.agreeTerms && (
                      <p className="text-red-500 text-sm">{fieldErrors.agreeTerms}</p>
                    )}

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="agreePrivacy"
                        checked={formData.agreePrivacy}
                        onChange={(e) => setFormData({...formData, agreePrivacy: e.target.checked})}
                        className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="agreePrivacy" className="ml-2 text-sm text-gray-700">
                        <Link href="/privacy" className="text-emerald-600 hover:underline">プライバシーポリシー</Link>に同意します *
                      </label>
                    </div>
                    {fieldErrors.agreePrivacy && (
                      <p className="text-red-500 text-sm">{fieldErrors.agreePrivacy}</p>
                    )}

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="subscribeNewsletter"
                        checked={formData.subscribeNewsletter}
                        onChange={(e) => setFormData({...formData, subscribeNewsletter: e.target.checked})}
                        className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="subscribeNewsletter" className="ml-2 text-sm text-gray-700">
                        メールマガジンを購読する（任意）
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ステップ3: プラン選択 */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pricingPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    whileHover={{ y: -4 }}
                    className={`relative cursor-pointer transition-all ${
                      formData.plan === plan.id ? 'ring-2 ring-emerald-500' : ''
                    }`}
                    onClick={() => setFormData({...formData, plan: plan.id})}
                  >
                    <div className="relative bg-white border border-gray-200 p-6 h-full" style={{
                      background: `
                        linear-gradient(135deg, transparent 10px, white 10px),
                        linear-gradient(-135deg, transparent 10px, white 10px),
                        linear-gradient(45deg, transparent 10px, white 10px),
                        linear-gradient(-45deg, transparent 10px, white 10px)
                      `,
                      backgroundPosition: 'top left, top right, bottom right, bottom left',
                      backgroundSize: '50% 50%',
                      backgroundRepeat: 'no-repeat',
                      boxShadow: plan.recommended 
                        ? '6px 6px 0 rgba(16, 185, 129, 0.2), 2px 2px 15px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                        : '3px 3px 0 rgba(0,0,0,0.1), 1px 1px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                    }}>
                      {plan.recommended && (
                        <div className="absolute -top-3 -right-3">
                          <div className="bg-emerald-600 text-white px-3 py-1 text-sm font-bold" 
                            style={{ 
                              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' 
                            }}
                          >
                            おすすめ
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {plan.price}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                        <ul className="text-left space-y-1 text-sm">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="text-gray-600">
                              • {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {formData.plan === plan.id && (
                        <div className="absolute top-3 left-3">
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ステップ4: 登録完了 */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="relative bg-white border border-gray-200 p-8" style={{
                background: `
                  linear-gradient(135deg, transparent 10px, white 10px),
                  linear-gradient(-135deg, transparent 10px, white 10px),
                  linear-gradient(45deg, transparent 10px, white 10px),
                  linear-gradient(-45deg, transparent 10px, white 10px)
                `,
                backgroundPosition: 'top left, top right, bottom right, bottom left',
                backgroundSize: '50% 50%',
                backgroundRepeat: 'no-repeat',
                boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}>
                <div className="text-6xl mb-6">🎉</div>
                <h3 className="text-2xl font-bold mb-4">登録内容の確認</h3>
                <div className="text-left space-y-3 mb-8">
                  <p><strong>ユーザータイプ:</strong> {userType === 'influencer' ? 'インフルエンサー' : '企業・ブランド'}</p>
                  <p><strong>お名前:</strong> {formData.name}</p>
                  <p><strong>メールアドレス:</strong> {formData.email}</p>
                  {formData.phone && <p><strong>電話番号:</strong> {formData.phone}</p>}
                  {userType === 'influencer' && formData.category && <p><strong>カテゴリー:</strong> {formData.category}</p>}
                  {userType === 'client' && formData.company && <p><strong>会社名:</strong> {formData.company}</p>}
                  <p><strong>選択プラン:</strong> {pricingPlans.find(p => p.id === formData.plan)?.name}</p>
                </div>

                {registrationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                    {registrationError}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRegistration}
                  disabled={registrationLoading}
                  className="relative w-full text-white py-4 font-bold text-lg overflow-hidden disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                    boxShadow: '3px 3px 0 rgba(16, 185, 129, 0.25), 2px 2px 8px rgba(16, 185, 129, 0.12)'
                  }}
                >
                  {registrationLoading ? 'アカウント作成中...' : 'アカウント作成'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ステップ5: メール認証待ち */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="relative bg-white border border-gray-200 p-8" style={{
                background: `
                  linear-gradient(135deg, transparent 10px, white 10px),
                  linear-gradient(-135deg, transparent 10px, white 10px),
                  linear-gradient(45deg, transparent 10px, white 10px),
                  linear-gradient(-45deg, transparent 10px, white 10px)
                `,
                backgroundPosition: 'top left, top right, bottom right, bottom left',
                backgroundSize: '50% 50%',
                backgroundRepeat: 'no-repeat',
                boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}>
                <div className="text-6xl mb-6">📧</div>
                <h3 className="text-2xl font-bold mb-4">メール認証をお待ちください</h3>
                <p className="text-gray-600 mb-6">
                  <strong>{formData.email}</strong> にメール認証リンクを送信しました。<br />
                  メールボックスを確認して、認証リンクをクリックしてください。
                </p>
                
                {isEmailVerified ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl mr-2">✅</span>
                      <span className="font-medium">メール認証が完了しました！</span>
                    </div>
                    <p className="mt-2">ダッシュボードにアクセスできます。</p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-xl mb-6">
                    <p className="text-sm">
                      メールが届かない場合は、迷惑メールフォルダもご確認ください。<br />
                      数分経ってもメールが届かない場合は、下記のボタンから再送信してください。
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {isEmailVerified ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/login')}
                      className="relative w-full text-white py-4 font-bold text-lg overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                        boxShadow: '3px 3px 0 rgba(16, 185, 129, 0.25), 2px 2px 8px rgba(16, 185, 129, 0.12)'
                      }}
                    >
                      ログインページへ
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          const { sendEmailVerification } = await import('../services/api');
                          await sendEmailVerification(formData.email);
                          alert('メール認証リンクを再送信しました。');
                        } catch (error) {
                          alert('メール再送信に失敗しました。しばらく後にお試しください。');
                        }
                      }}
                      className="relative w-full border-2 border-emerald-600 text-emerald-600 py-4 font-bold text-lg hover:bg-emerald-50 transition-colors"
                    >
                      メール認証リンクを再送信
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ナビゲーションボタン */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mt-12"
        >
          <div className="flex-1">
            {currentStep > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium hover:border-emerald-600 hover:text-emerald-600 transition-colors"
              >
                戻る
              </motion.button>
            )}
          </div>
          
          <div className="text-center flex-1">
            <p className="text-gray-600">
              すでにアカウントをお持ちですか？{' '}
              <Link href="/login" className="text-emerald-600 hover:underline font-semibold">
                ログイン
              </Link>
            </p>
          </div>
          
          <div className="flex-1 text-right">
            {currentStep < 3 && currentStep > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="relative px-8 py-3 text-white font-medium overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                  boxShadow: '3px 3px 0 rgba(16, 185, 129, 0.25), 2px 2px 8px rgba(16, 185, 129, 0.12)'
                }}
              >
                次へ
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;