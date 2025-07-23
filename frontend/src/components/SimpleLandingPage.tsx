import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const SimpleLandingPage: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  まずは無料で始める
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl md:text-7xl font-bold mb-12"
          >
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ツール名
            </span>
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
                  whileHover={{ scale: 1.03 }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{concern.icon}</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {concern.title}
                  </h3>
                  <p className="text-gray-600">
                    {concern.subtitle}
                  </p>
                </motion.div>
              ))}
            </div>
            
            {/* Freeプラン登録CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8"
            >
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 15px 30px rgba(59, 130, 246, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-bold shadow-lg"
                >
                  無料プランで今すぐ始める
                </motion.button>
              </Link>
              <p className="text-sm text-gray-600 mt-3">
                クレジットカード不要・即日利用可能
              </p>
            </motion.div>
          </motion.div>

          {/* そのお悩みを解決します */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                そのお悩みを解決します！
              </span>
            </h2>
          </motion.div>

          {/* ツールの特徴 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-20 max-w-3xl mx-auto"
          >
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              ツールの特徴
            </h3>
            <p className="text-xl text-gray-700">
              ご予算や条件に合ったインフルエンサーを<br />
              <span className="font-bold text-blue-600">AIが分析し、ご提案します！</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="py-20 px-4 bg-gray-50">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className={`bg-white rounded-2xl ${
                  plan.highlighted ? 'border-2 border-blue-500 shadow-xl' : 'border border-gray-200 shadow-sm'
                } p-8 relative`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      おすすめ
                    </span>
                  </div>
                )}

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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
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
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-5 rounded-xl text-xl font-bold shadow-lg"
              >
                まずは無料で始める
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SimpleLandingPage;