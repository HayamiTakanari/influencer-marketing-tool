import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

const SimpleLandingPage: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  const concerns = [
    {
      icon: '🔍',
      title: 'インフルエンサーの探し方がわからない',
      subtitle: '誰をアサインすればいいかわからない'
    },
    {
      icon: '📈',
      title: 'インフルエンサーマーケの進め方がわからない、効率化したい',
      subtitle: 'キャスティングにおける注意点がわからない'
    }
  ];

  const pricingPlans = [
    {
      name: 'Freeプラン',
      price: '0円',
      description: 'まずは0円で使ってみる！',
      features: [
        '検索機能のみ',
        '※無料紹介投稿は可能'
      ],
      buttonText: 'まずは無料で始める',
      highlighted: false,
      color: 'from-gray-500 to-gray-600'
    },
    {
      name: 'Standardプラン',
      price: '1マッチング3万円',
      description: '謝礼が発生するもの',
      features: [],
      buttonText: '今すぐ始める',
      highlighted: true,
      color: 'from-blue-500 to-purple-500'
    },
    {
      name: 'Proプラン',
      price: '月額35万円',
      description: '全機能',
      features: [],
      buttonText: '今すぐ始める',
      highlighted: false,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 relative overflow-hidden">
      {/* 背景アニメーション */}
      <div className="fixed inset-0 z-0">
        {/* グラデーションメッシュ */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20" />
        
        {/* アニメーションパターン */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* フローティングオーブ */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl"
            style={{
              width: Math.random() * 400 + 200,
              height: Math.random() * 400 + 200,
            }}
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* マウス追従グロウ */}
        <motion.div
          className="pointer-events-none absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-300/20 to-purple-300/20 blur-3xl"
          animate={{
            x: mousePosition.x - 192,
            y: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>
      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm"
            >
              ツール名
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <span className="text-gray-700 hover:text-gray-900 font-medium cursor-pointer">
                  ログイン
                </span>
              </Link>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
                >
                  まずは無料で始める
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="pt-32 pb-20 px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl md:text-7xl font-bold mb-12 relative"
          >
            <motion.span 
              className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: '200% 200%' }}
            >
              ツール名
            </motion.span>
            {/* 装飾的なスパークル */}
            <motion.div
              className="absolute -top-8 -right-8"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              ✨
            </motion.div>
          </motion.h1>

          {/* お悩みセクション */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
              {concerns.map((concern, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -8, rotateY: 5 }}
                  initial={{ opacity: 0, y: 50, rotateX: -20 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group"
                >
                  <motion.div 
                    className="text-4xl mb-4"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: index }}
                  >
                    {concern.icon}
                  </motion.div>
                  {/* ホバー時の背景エフェクト */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {concern.title}
                  </h3>
                  <p className="text-gray-600">
                    {concern.subtitle}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* そのお悩みを解決します */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold relative"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">
                そのお悩みを解決します！
              </span>
              <motion.span
                className="absolute -top-4 -right-4 text-2xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨
              </motion.span>
            </motion.h2>
          </motion.div>

          {/* Freeプラン登録CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <Link href="/register">
              <motion.button
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)',
                  y: -5
                }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-bold shadow-xl relative overflow-hidden group"
              >
                <span className="relative z-10">無料プランで今すぐ始める</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </Link>
            <p className="text-sm text-gray-600 mt-3">
              クレジットカード不要・即日利用可能
            </p>
          </motion.div>

          {/* ツールの特徴 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-20 max-w-3xl mx-auto shadow-xl relative overflow-hidden"
          >
            {/* 装飾的なグラデーション */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 opacity-50" />
            <h3 className="text-2xl font-bold mb-4 text-gray-800 relative z-10">
              ツールの特徴
            </h3>
            <p className="text-xl text-gray-700 relative z-10">
              ご予算や条件に合ったインフルエンサーを<br />
              <motion.span 
                className="font-bold text-blue-600 inline-block"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                AIが分析し、ご提案します！
              </motion.span>
            </p>
            {/* AIアイコン */}
            <motion.div
              className="absolute -bottom-4 -right-4 text-6xl opacity-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              🤖
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="py-20 px-4 bg-gray-50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            料金プラン
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: -20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`bg-white/95 backdrop-blur-sm rounded-2xl ${
                  plan.highlighted ? 'border-2 border-blue-500 shadow-2xl' : 'border border-gray-200 shadow-lg'
                } p-8 relative overflow-hidden group`}
              >
                {plan.highlighted && (
                  <motion.div 
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                      おすすめ
                    </span>
                  </motion.div>
                )}
                {/* ホバー時のグラデーション */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className={`text-3xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                    {plan.price}
                  </div>
                  {plan.description && (
                    <p className="text-gray-600 mt-2">{plan.description}</p>
                  )}
                </div>

                {plan.features.length > 0 && (
                  <ul className="mb-8 space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="text-gray-600">
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3 rounded-lg font-medium transition-all relative overflow-hidden ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {plan.buttonText}
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center text-gray-600 mt-8"
          >
            ※ 支払い方法はクレジットカードのみ
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="/register">
              <motion.button
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: '0 25px 50px rgba(59, 130, 246, 0.4)',
                  y: -5
                }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  boxShadow: [
                    '0 10px 20px rgba(59, 130, 246, 0.3)',
                    '0 15px 30px rgba(59, 130, 246, 0.4)',
                    '0 10px 20px rgba(59, 130, 246, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-5 rounded-xl text-xl font-bold shadow-2xl relative overflow-hidden group"
              >
                <span className="relative z-10">まずは無料で始める</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SimpleLandingPage;