import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

const NewLandingPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-50%']);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const pricingPlans = [
    {
      name: 'Free',
      price: '0円',
      subtitle: 'まずは0円で使ってみる！',
      features: ['検索機能のみ', '※無料紹介投稿は可能'],
      buttonText: '無料で始める',
      popular: false,
      color: 'bg-white border-gray-200'
    },
    {
      name: 'Standard',
      price: '3万円',
      subtitle: '1マッチング',
      description: '（謝礼が発生するもの）',
      features: ['検索機能', 'マッチング機能', 'チャット機能', 'プロジェクト管理'],
      buttonText: 'Standardを始める',
      popular: true,
      color: 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
    },
    {
      name: 'Pro',
      price: '35万円',
      subtitle: '月額',
      description: '（全機能）',
      features: ['全ての機能', 'AI分析', '薬機法チェック', '優先サポート', '詳細レポート'],
      buttonText: 'Proを始める',
      popular: false,
      color: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 背景 */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10"
        />
      </div>

      {/* ヘッダー */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ツール名
          </div>
          <div className="space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              ログイン
            </Link>
            <Link href="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              新規登録
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* ファーストビュー */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8 }}
              className="text-6xl md:text-7xl font-bold mb-8"
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ツール名
              </span>
            </motion.h1>

            {/* お悩み */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-8">抱えるお悩み</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
                  <div className="text-4xl mb-4">😕</div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    インフルエンサーの探し方がわからない
                  </h3>
                  <p className="text-gray-600">
                    誰をアサインすればいいかわからない
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
                  <div className="text-4xl mb-4">🤔</div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    インフルエンサーマーケの進め方がわからない
                  </h3>
                  <p className="text-gray-600">
                    効率化したい方（キャスティングにおける注意点がわからない）
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 解決宣言 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                そのお悩みを
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  解決します！
                </span>
              </h2>
              <p className="text-xl text-gray-700">
                私たちがあなたのインフルエンサーマーケティングを全面的に支援いたします
              </p>
            </motion.div>
          </div>
        </section>

        {/* ツールの特徴 */}
        <section className="px-6 py-20 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-8 text-gray-900">ツールの特徴</h2>
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-200">
                <div className="text-6xl mb-6">🤖</div>
                <h3 className="text-2xl font-bold mb-6 text-gray-900">
                  ご予算や条件に合ったインフルエンサーを<br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AIが分析し、ご提案します！
                  </span>
                </h3>
                <p className="text-lg text-gray-600">
                  最新のAI技術により、あなたのブランドに最適なインフルエンサーを見つけ出し、
                  効果的なマーケティング戦略をご提案いたします。
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 料金プラン */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4 text-gray-900">料金プラン</h2>
              <p className="text-lg text-gray-600">あなたに最適なプランをお選びください</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
                  transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                  className={`${plan.color} rounded-3xl p-8 shadow-xl border-2 relative overflow-hidden
                    ${plan.popular ? 'scale-105 z-10' : 'z-0'}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-2 text-sm font-semibold">
                      おすすめ
                    </div>
                  )}
                  
                  <div className={`${plan.popular ? 'mt-6' : ''}`}>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">{plan.subtitle}</p>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                    )}
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}>
                      {plan.buttonText}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 注釈 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="text-center mt-8"
            >
              <p className="text-sm text-gray-500">※支払い方法はクレジットカードのみ</p>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 1.6 }}
            >
              <h2 className="text-4xl font-bold text-white mb-8">
                まずは無料で始めてみませんか？
              </h2>
              <p className="text-xl text-blue-100 mb-12">
                登録はたった1分で完了。今すぐインフルエンサーマーケティングを始めましょう。
              </p>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-blue-600 px-12 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  まずは無料で始める
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="relative z-10 bg-gray-900 text-white px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ツール名
          </div>
          <p className="text-gray-400 mb-8">
            インフルエンサーマーケティングの新しいスタンダード
          </p>
          <div className="flex justify-center space-x-8">
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
              サービスについて
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              お問い合わせ
            </Link>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-gray-500 text-sm">
            © 2024 ツール名. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;