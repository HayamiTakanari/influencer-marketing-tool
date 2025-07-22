import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<{ email: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser({
        email: parsedUser.email,
        type: parsedUser.role === 'INFLUENCER' ? 'influencer' : 'client'
      });
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path);
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="text-sm text-gray-600">
                {user.type === 'influencer' ? 'インフルエンサー' : '企業'}アカウント
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 重要な情報とクイックアクション */}
        {user.type === 'influencer' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {/* 新着オファー */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📬</div>
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">新着オファー</h3>
              <p className="text-blue-100 text-sm mb-4">未確認のプロジェクト機会</p>
              <Link href="/opportunities">
                <a className="inline-flex items-center text-white hover:text-blue-100 transition-colors">
                  確認する →
                </a>
              </Link>
            </div>

            {/* 今月の収益 */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">💰</div>
                <span className="text-2xl font-bold">¥850,000</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">今月の収益</h3>
              <p className="text-green-100 text-sm mb-4">前月比 +12%</p>
              <Link href="/revenue">
                <a className="inline-flex items-center text-white hover:text-green-100 transition-colors">
                  詳細を見る →
                </a>
              </Link>
            </div>

            {/* 未対応タスク */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">⚡</div>
                <span className="text-2xl font-bold">5</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">要対応</h3>
              <p className="text-purple-100 text-sm mb-4">返信待ちメッセージ</p>
              <Link href="/chat">
                <a className="inline-flex items-center text-white hover:text-purple-100 transition-colors">
                  対応する →
                </a>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {/* アクティブプロジェクト */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📝</div>
                <span className="text-2xl font-bold">5</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">進行中のプロジェクト</h3>
              <p className="text-blue-100 text-sm mb-4">アクティブなキャンペーン</p>
              <Link href="/projects">
                <a className="inline-flex items-center text-white hover:text-blue-100 transition-colors">
                  管理する →
                </a>
              </Link>
            </div>

            {/* 新規応募 */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">👥</div>
                <span className="text-2xl font-bold">12</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">新規応募</h3>
              <p className="text-green-100 text-sm mb-4">未確認の応募者</p>
              <Link href="/applications">
                <a className="inline-flex items-center text-white hover:text-green-100 transition-colors">
                  確認する →
                </a>
              </Link>
            </div>

            {/* 支払い待ち */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📄</div>
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">未払い請求書</h3>
              <p className="text-orange-100 text-sm mb-4">支払い待ちの請求</p>
              <Link href="/invoices/received">
                <a className="inline-flex items-center text-white hover:text-orange-100 transition-colors">
                  確認する →
                </a>
              </Link>
            </div>
          </motion.div>
        )}

        {/* ウェルカムメッセージ（小さく） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 mb-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user.type === 'influencer' ? 'インフルエンサーダッシュボード' : '企業ダッシュボード'}
              </h2>
              <p className="text-gray-600 mt-1">
                {user.type === 'influencer' 
                  ? 'ブランドからのオファーを確認し、収益を管理しましょう' 
                  : 'インフルエンサーを探して、効果的なマーケティングを始めましょう'
                }
              </p>
            </div>
            <div className="text-5xl">
              {user.type === 'influencer' ? '👑' : '🏢'}
            </div>
          </div>
        </motion.div>

        {/* 機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user.type === 'influencer' ? (
            <>
              <Link href="/profile">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">プロフィール管理</h3>
                  <p className="text-gray-600">SNSアカウントの連携と実績の管理</p>
                </motion.div>
              </Link>

              <Link href="/opportunities">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📬</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">プロジェクト機会</h3>
                  <p className="text-gray-600">参加可能なプロジェクトを探す</p>
                </motion.div>
              </Link>

              <Link href="/my-applications">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.25 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">応募履歴</h3>
                  <p className="text-gray-600">あなたの応募状況を確認</p>
                </motion.div>
              </Link>

              <Link href="/chat">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">チャット</h3>
                  <p className="text-gray-600">企業とのリアルタイム会話</p>
                </motion.div>
              </Link>

              <Link href="/revenue">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">収益ダッシュボード</h3>
                  <p className="text-gray-600">収益状況と実績の確認</p>
                </motion.div>
              </Link>

              <Link href="/achievements">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">実績管理</h3>
                  <p className="text-gray-600">過去の実績と成果を管理</p>
                </motion.div>
              </Link>

              <Link href="/service-pricing">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">💸</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">料金設定</h3>
                  <p className="text-gray-600">サービス別の料金体系管理</p>
                </motion.div>
              </Link>


              <Link href="/invoices">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📄</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">請求書管理</h3>
                  <p className="text-gray-600">請求書の作成・送信・管理</p>
                </motion.div>
              </Link>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                onClick={() => handleNavigation('/search')}
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">インフルエンサー検索</h3>
                <p className="text-gray-600">条件に合うインフルエンサーを探す</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                onClick={() => handleNavigation('/company-profile')}
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">企業プロフィール</h3>
                <p className="text-gray-600">会社情報とマーケティング設定</p>
              </motion.div>

              <Link href="/team-management">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.25 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">チーム管理</h3>
                  <p className="text-gray-600">メンバーの追加と権限管理</p>
                </motion.div>
              </Link>

              <Link href="/projects">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">進行中のプロジェクト</h3>
                  <p className="text-gray-600">マーケティングプロジェクトを管理</p>
                </motion.div>
              </Link>

              <Link href="/applications">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.35 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">応募管理</h3>
                  <p className="text-gray-600">プロジェクトへの応募を管理</p>
                </motion.div>
              </Link>

              <Link href="/chat">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">チャット</h3>
                  <p className="text-gray-600">インフルエンサーとの会話</p>
                </motion.div>
              </Link>

              <Link href="/payments/history">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">💳</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">支払い管理</h3>
                  <p className="text-gray-600">支払い履歴と統計情報</p>
                </motion.div>
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                onClick={() => handleNavigation('/analytics')}
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">効果測定</h3>
                <p className="text-gray-600">キャンペーンの成果を分析</p>
              </motion.div>


              <Link href="/project-schedule">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">スケジュール管理</h3>
                  <p className="text-gray-600">プロジェクトの進行管理</p>
                </motion.div>
              </Link>

              <Link href="/invoices/received">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📄</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">請求書管理</h3>
                  <p className="text-gray-600">受け取った請求書の確認・支払い</p>
                </motion.div>
              </Link>
            </>
          )}
        </div>

        {/* 分析ダッシュボード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">パフォーマンス分析</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>📊</span>
              <span>リアルタイム更新</span>
            </div>
          </div>
          
          {/* 主要KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {user.type === 'influencer' ? '12' : '5'}
              </div>
              <div className="text-gray-600 text-sm">
                {user.type === 'influencer' ? 'アクティブなオファー' : 'アクティブなキャンペーン'}
              </div>
              <div className="text-xs text-green-600 mt-1">+8% vs 先月</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {user.type === 'influencer' ? '¥850,000' : '¥1,200,000'}
              </div>
              <div className="text-gray-600 text-sm">
                {user.type === 'influencer' ? '今月の収益' : '今月の支出'}
              </div>
              <div className="text-xs text-green-600 mt-1">+12% vs 先月</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {user.type === 'influencer' ? '98%' : '87%'}
              </div>
              <div className="text-gray-600 text-sm">
                {user.type === 'influencer' ? '満足度' : '成功率'}
              </div>
              <div className="text-xs text-green-600 mt-1">+3% vs 先月</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {user.type === 'influencer' ? '4.8' : '4.6'}
              </div>
              <div className="text-gray-600 text-sm">評価</div>
              <div className="text-xs text-green-600 mt-1">+0.2 vs 先月</div>
            </div>
          </div>

          {/* 詳細分析セクション */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* エンゲージメント分析 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {user.type === 'influencer' ? 'エンゲージメント分析' : 'キャンペーン効果'}
                </h4>
                <span className="text-2xl">📈</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {user.type === 'influencer' ? '平均エンゲージメント率' : '平均リーチ率'}
                  </span>
                  <span className="font-semibold text-green-600">
                    {user.type === 'influencer' ? '3.2%' : '2.8%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {user.type === 'influencer' ? '総インプレッション' : '総コンバージョン'}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {user.type === 'influencer' ? '1.2M' : '1,580'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {user.type === 'influencer' ? 'フォロワー増加' : 'ROI'}
                  </span>
                  <span className="font-semibold text-purple-600">
                    {user.type === 'influencer' ? '+2,450' : '340%'}
                  </span>
                </div>
              </div>
            </div>

            {/* パフォーマンストレンド */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {user.type === 'influencer' ? '収益トレンド' : '支出効率'}
                </h4>
                <span className="text-2xl">📊</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">先週比</span>
                  <span className="font-semibold text-green-600">+15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">先月比</span>
                  <span className="font-semibold text-green-600">+22%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">予測（来月）</span>
                  <span className="font-semibold text-blue-600">+18%</span>
                </div>
              </div>
            </div>
          </div>

          {/* プラットフォーム別分析 */}
          {user.type === 'influencer' && (
            <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">プラットフォーム別パフォーマンス</h4>
                <span className="text-2xl">📱</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-lg font-semibold text-pink-600">Instagram</div>
                  <div className="text-sm text-gray-600">エンゲージ: 4.2%</div>
                  <div className="text-xs text-green-600">収益: ¥320K</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-lg font-semibold text-red-600">YouTube</div>
                  <div className="text-sm text-gray-600">エンゲージ: 2.8%</div>
                  <div className="text-xs text-green-600">収益: ¥280K</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-lg font-semibold text-black">TikTok</div>
                  <div className="text-sm text-gray-600">エンゲージ: 6.1%</div>
                  <div className="text-xs text-green-600">収益: ¥180K</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">Twitter</div>
                  <div className="text-sm text-gray-600">エンゲージ: 1.9%</div>
                  <div className="text-xs text-green-600">収益: ¥70K</div>
                </div>
              </div>
            </div>
          )}

          {/* 企業向け詳細分析 */}
          {user.type === 'client' && (
            <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">キャンペーン分析詳細</h4>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">2.4M</div>
                  <div className="text-sm text-gray-600">総リーチ</div>
                  <div className="text-xs text-green-600 mt-1">目標達成率: 120%</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">1,580</div>
                  <div className="text-sm text-gray-600">コンバージョン</div>
                  <div className="text-xs text-green-600 mt-1">CVR: 0.065%</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">¥760</div>
                  <div className="text-sm text-gray-600">CPA</div>
                  <div className="text-xs text-green-600 mt-1">目標比: -15%</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 開発中メッセージ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 bg-yellow-50/80 backdrop-blur-xl border border-yellow-200 rounded-2xl p-6 text-center"
        >
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-xl font-bold text-yellow-800 mb-2">開発中</h3>
          <p className="text-yellow-700">
            このダッシュボードは現在開発中です。各機能は順次実装予定です。
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;