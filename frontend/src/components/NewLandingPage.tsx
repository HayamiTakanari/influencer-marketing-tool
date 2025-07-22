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

  // SVGアイコンコンポーネント
  const SearchIcon = () => (
    <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const ConnectIcon = () => (
    <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const RocketIcon = () => (
    <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const features = [
    {
      icon: <SearchIcon />,
      title: "インフルエンサー検索",
      description: "AIが最適なインフルエンサーを自動でマッチング。あなたのブランドに最適な人材を見つけます。"
    },
    {
      icon: <ConnectIcon />,
      title: "簡単コラボレーション",
      description: "プラットフォーム上で直接コミュニケーション。契約から支払いまで一括管理できます。"
    },
    {
      icon: <RocketIcon />,
      title: "効果測定・分析",
      description: "リアルタイムでキャンペーン効果を測定。ROIを最大化する戦略をご提案します。"
    }
  ];

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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-blue-50" />
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-gradient-to-r from-orange-400/5 via-blue-400/5 to-purple-400/5"
        />
        {/* 装飾的な円形背景 */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-orange-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* ヘッダー */}
      <header className="relative z-10 px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">IM</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ツール名
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              ログイン
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-orange-500 to-blue-500 text-white px-8 py-3 rounded-full hover:shadow-lg transition-all font-semibold">
              無料で始める
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* ヒーローセクション */}
        <section className="px-6 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 左側：テキストコンテンツ */}
              <div className="text-left">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -50 }}
                  transition={{ duration: 0.8 }}
                  className="mb-6"
                >
                  <span className="inline-block bg-gradient-to-r from-orange-100 to-blue-100 text-orange-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    AI搭載インフルエンサーマーケティング
                  </span>
                  <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    <span className="bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                      ツール名
                    </span>
                    <br />
                    で始める<br />
                    新しい<br />
                    マーケティング
                  </h1>
                  <p className="text-xl text-gray-600 mb-8 max-w-lg">
                    AIが最適なインフルエンサーを見つけ、効果的なキャンペーンを実現。
                    <span className="font-semibold text-gray-800">ROI向上</span>と
                    <span className="font-semibold text-gray-800">工数削減</span>を両立します。
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link href="/register">
                    <button className="bg-gradient-to-r from-orange-500 to-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105">
                      無料で始める
                    </button>
                  </Link>
                  <Link href="/demo">
                    <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-gray-400 transition-all">
                      デモを見る
                    </button>
                  </Link>
                </motion.div>

                {/* 実績数値 */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="mt-12 grid grid-cols-3 gap-8"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">10,000+</div>
                    <div className="text-sm text-gray-600">登録インフルエンサー</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">500+</div>
                    <div className="text-sm text-gray-600">導入企業</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">98%</div>
                    <div className="text-sm text-gray-600">満足度</div>
                  </div>
                </motion.div>
              </div>

              {/* 右側：イラスト */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 50 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative bg-gradient-to-br from-orange-100 to-blue-100 rounded-3xl p-8 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">AI マッチング</h3>
                    <p className="text-gray-600">最適な組み合わせを自動提案</p>
                  </div>
                  {/* 装飾的な要素 */}
                  <div className="absolute top-4 left-4 w-12 h-12 bg-orange-200 rounded-full opacity-60"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-200 rounded-full opacity-60"></div>
                  <div className="absolute top-1/2 left-0 w-6 h-6 bg-purple-200 rounded-full opacity-60 transform -translate-x-3"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* お悩みセクション */}
        <section className="px-6 py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">こんなお悩みありませんか？</h2>
              <p className="text-lg text-gray-600">多くの企業が抱えるインフルエンサーマーケティングの課題</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
              >
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  インフルエンサーの探し方がわからない
                </h3>
                <p className="text-gray-600">
                  自社に合うインフルエンサーが見つからない。どこで探せばいいかわからない。
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  インフルエンサーマーケティングの進め方がわからない
                </h3>
                <p className="text-gray-600">
                  効率化したい。どのように進めればよいか分からない。
                </p>
              </motion.div>
            </div>

            {/* 解決宣言 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-16 bg-gradient-to-r from-orange-500 to-blue-500 rounded-3xl p-8 text-white"
            >
              <h2 className="text-3xl font-bold mb-4">
                そのお悩み、すべて解決します！
              </h2>
              <p className="text-xl text-orange-100">
                AIを活用した次世代インフルエンサーマーケティングプラットフォーム
              </p>
            </motion.div>
          </div>
        </section>

        {/* 機能紹介セクション */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">選ばれる3つの理由</h2>
              <p className="text-lg text-gray-600">AIが実現する、次世代インフルエンサーマーケティング</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-center"
                >
                  <div className="flex justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* AI機能ハイライト */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-20 bg-gradient-to-br from-orange-50 to-blue-50 rounded-3xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-6 text-gray-900">
                ご予算や条件に合ったインフルエンサーを<br />
                <span className="bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                  AIが分析し、ご提案します！
                </span>
              </h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                最新のAI技術により、あなたのブランドに最適なインフルエンサーを見つけ出し、
                効果的なマーケティング戦略をご提案いたします。薬機法チェック機能も搭載。
              </p>
            </motion.div>
          </div>
        </section>

        {/* 料金プラン */}
        <section className="px-6 py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">料金プラン</h2>
              <p className="text-lg text-gray-600">シンプルで分かりやすい料金体系</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  className={`bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden hover:shadow-xl transition-all
                    ${plan.popular ? 'transform scale-105 border-orange-300' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-blue-500 text-white text-center py-3 text-sm font-semibold">
                      ⭐ 最も人気
                    </div>
                  )}
                  
                  <div className={`${plan.popular ? 'mt-8' : ''}`}>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-4 text-gray-900">{plan.name}</h3>
                      <div className="mb-2">
                        <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      </div>
                      <p className="text-lg font-semibold text-orange-600 mb-2">{plan.subtitle}</p>
                      {plan.description && (
                        <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                      )}
                    </div>
                    
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start text-gray-700">
                          <svg className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button className={`w-full py-4 px-6 rounded-full font-semibold text-lg transition-all transform hover:scale-105 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-blue-500 text-white hover:shadow-lg' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-2 border-gray-200'
                    }`}>
                      {plan.buttonText}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 注釈と保証 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-center mt-12"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto">
                <p className="text-sm text-gray-600 mb-3">
                  ✅ クレジットカード決済のみ　✅ いつでもキャンセル可能　✅ 30日間返金保証
                </p>
                <p className="text-xs text-gray-500">
                  ※Freeプランは永久無料でご利用いただけます
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 bg-gradient-to-r from-orange-500 to-blue-500">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                今すぐ始めて、成果を実感
              </h2>
              <p className="text-xl text-orange-100 mb-12 max-w-2xl mx-auto">
                アカウント作成は30秒で完了。すぐにAIマッチング機能をお試しいただけます。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-orange-600 px-12 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    まずは無料で始める
                  </motion.button>
                </Link>
                <Link href="/demo">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-white text-white px-12 py-4 rounded-full text-xl font-bold hover:bg-white hover:text-orange-600 transition-all"
                  >
                    デモを見る
                  </motion.button>
                </Link>
              </div>
              
              {/* 信頼性アイコン */}
              <div className="mt-12 flex justify-center items-center space-x-8 text-orange-100">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">SSL暗号化</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">30日返金保証</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">24時間サポート</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="relative z-10 bg-gray-900 text-white px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">IM</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  ツール名
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                AIを活用した次世代インフルエンサーマーケティングプラットフォーム。
                効果的なキャンペーンで、あなたのビジネスを成長させます。
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">サービス</h3>
              <ul className="space-y-3">
                <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">機能一覧</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">料金プラン</Link></li>
                <li><Link href="/demo" className="text-gray-400 hover:text-white transition-colors">デモ</Link></li>
                <li><Link href="/case-studies" className="text-gray-400 hover:text-white transition-colors">導入事例</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">サポート</h3>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">ヘルプセンター</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">お問い合わせ</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">利用規約</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">プライバシーポリシー</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2024 ツール名. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>🇯🇵 日本語</span>
              <span>•</span>
              <span>SSL証明書取得済み</span>
              <span>•</span>
              <span>ISO 27001準拠</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;