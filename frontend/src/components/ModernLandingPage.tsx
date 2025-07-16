import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

const ModernLandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);

  useEffect(() => {
    setIsLoaded(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: '🧠',
      title: 'AI マッチング',
      description: '機械学習による最適なインフルエンサーとブランドのマッチング',
      color: 'from-blue-500 to-purple-500',
      delay: 0.1
    },
    {
      icon: '💬',
      title: 'リアルタイムチャット',
      description: '即座にコミュニケーションを開始できる環境',
      color: 'from-pink-500 to-rose-500',
      delay: 0.2
    },
    {
      icon: '📊',
      title: '詳細分析',
      description: 'パフォーマンスを詳細に分析できる機能',
      color: 'from-emerald-500 to-teal-500',
      delay: 0.3
    },
    {
      icon: '🔐',
      title: '安全な決済',
      description: 'Stripe統合による信頼性の高い決済システム',
      color: 'from-orange-500 to-red-500',
      delay: 0.4
    }
  ];

  const testimonials = [
    {
      name: '田中 美咲',
      role: '美容系インフルエンサー',
      content: 'このプラットフォームのおかげで、理想的なブランドとのコラボが実現できました。',
      avatar: '👩‍🦰',
      rating: 5,
      followers: '23万人'
    },
    {
      name: '佐藤 健太',
      role: '株式会社ABC マーケティング部長',
      content: 'ROIが大幅に改善され、効果的なマーケティングができています。',
      avatar: '👨‍💼',
      rating: 5,
      company: '株式会社ABC'
    },
    {
      name: '鈴木 さやか',
      role: 'ライフスタイル系クリエイター',
      content: '使いやすいインターフェースで、分析機能も充実していて満足です。',
      avatar: '👩‍🎨',
      rating: 5,
      followers: '8.9万人'
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* 美しい背景 */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
        
        {/* アニメーションメッシュグラデーション */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* フローティングオーブ */}
        {isLoaded && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
            }}
            animate={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
            }}
            transition={{
              duration: Math.random() * 30 + 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* 装飾的なグリッド */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-gray-400 to-transparent transform -skew-y-12 h-px" />
          <div className="w-full h-full bg-gradient-to-b from-transparent via-gray-400 to-transparent transform -skew-x-12 w-px" />
        </div>
      </div>

      {/* マウスカーソル追従効果 */}
      <motion.div
        className="fixed w-96 h-96 pointer-events-none z-10"
        animate={{
          x: mousePosition.x - 192,
          y: mousePosition.y - 192,
        }}
        transition={{ type: "spring", damping: 40, stiffness: 300 }}
      >
        <div className="w-full h-full bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
      </motion.div>

      {/* モダンナビゲーション */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl px-8 py-4 shadow-xl">
          <div className="flex items-center space-x-8">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg"
            >
              <span className="text-white font-bold text-lg">IM</span>
            </motion.div>
            
            <div className="flex items-center space-x-6">
              {['機能', '料金', 'サポート'].map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  {item}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-4 py-2 rounded-lg"
                >
                  ログイン
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-semibold shadow-lg"
                >
                  登録
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ヒーローセクション */}
      <motion.section
        style={{ opacity, scale, rotateX: rotate }}
        className="relative z-20 min-h-screen flex items-center justify-center px-4"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.h1
              className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-tight"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <motion.span
                className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ backgroundSize: '200% 200%' }}
              >
                次世代の
              </motion.span>
              <br />
              <span className="text-gray-900">インフルエンサー</span>
              <br />
              <span className="text-gray-900">マッチングツール</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto"
            >
              AIを活用した最適なマッチングで、ブランドとインフルエンサーを繋ぐ革新的なプラットフォーム
              <br />
              <span className="text-blue-600 font-semibold">効果的なマーケティングを実現します</span>
            </motion.p>

            {/* CTAボタン */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link href="/register">
                <motion.button
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
                    y: -5
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-12 py-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl text-xl font-bold overflow-hidden shadow-xl"
                >
                  <span className="relative z-10">無料で始める</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </Link>

              <Link href="/demo">
                <motion.button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-5 border-2 border-gray-300 rounded-2xl text-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all backdrop-blur-sm"
                >
                  デモを見る
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* 統計情報 */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: '10,000+', label: 'インフルエンサー', color: 'from-blue-500 to-purple-500' },
              { number: '500+', label: 'ブランド', color: 'from-purple-500 to-pink-500' },
              { number: '50億+', label: 'インプレッション', color: 'from-pink-500 to-rose-500' },
              { number: '98%', label: '満足度', color: 'from-emerald-500 to-teal-500' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.1, rotate: 2 }}
                className="text-center"
              >
                <div className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* 機能セクション */}
      <section className="relative z-20 py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-center mb-20"
          >
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              主要機能
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: 45 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: feature.delay }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -20, 
                  rotateY: 10,
                  scale: 1.05
                }}
                className="group relative perspective-1000"
              >
                <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 h-full transform-gpu transition-all duration-500 group-hover:border-gray-300 group-hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${feature.color.replace('from-', '').replace('to-', ', ')})`,
                    }}
                  />
                  
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      delay: index * 0.5 
                    }}
                    className="text-6xl mb-6 filter drop-shadow-lg"
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>

                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 利用者の声 */}
      <section className="relative z-20 py-32 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-center mb-20"
          >
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              利用者の声
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4">{testimonial.avatar}</div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{testimonial.name}</h3>
                      <p className="text-gray-600">{testimonial.role}</p>
                      {testimonial.followers && (
                        <p className="text-blue-600 text-sm">{testimonial.followers}フォロワー</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-yellow-400 text-xl"
                      >
                        ⭐
                      </motion.span>
                    ))}
                  </div>
                  
                  <p className="text-gray-700 italic">「{testimonial.content}」</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 最終CTA */}
      <section className="relative z-20 py-32 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-3xl p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-6xl md:text-8xl font-black mb-8">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  今すぐ始めよう
                </span>
              </h2>
              
              <p className="text-2xl text-gray-600 mb-12">
                インフルエンサーマーケティングの新しい体験をお試しください
              </p>
              
              <Link href="/register">
                <motion.button
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)",
                    y: -10
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-16 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl text-2xl font-black relative overflow-hidden shadow-xl"
                >
                  <span className="relative z-10">無料で始める</span>
                  <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity" />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ModernLandingPage;