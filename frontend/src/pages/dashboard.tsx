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
        {/* ウェルカムメッセージ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 mb-8 shadow-xl"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">
              {user.type === 'influencer' ? '👑' : '🏢'}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {user.type === 'influencer' ? 'インフルエンサーダッシュボード' : '企業ダッシュボード'}
            </h2>
            <p className="text-gray-600 text-lg">
              {user.type === 'influencer' 
                ? 'ブランドからのオファーを確認し、収益を管理しましょう' 
                : 'インフルエンサーを探して、効果的なマーケティングを始めましょう'
              }
            </p>
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

              <Link href="/bulk-inquiry">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📢</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">一斉問い合わせ</h3>
                  <p className="text-gray-600">複数案件への回答管理</p>
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
                transition={{ duration: 0.8, delay: 0.2 }}
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">プロジェクト管理</h3>
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
                className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">効果測定</h3>
                <p className="text-gray-600">キャンペーンの成果を分析</p>
              </motion.div>

              <Link href="/bulk-inquiry">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-4">📢</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">一斉問い合わせ</h3>
                  <p className="text-gray-600">複数のインフルエンサーに一斉送信</p>
                </motion.div>
              </Link>

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
            </>
          )}
        </div>

        {/* 統計情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">統計情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {user.type === 'influencer' ? '12' : '5'}
              </div>
              <div className="text-gray-600">
                {user.type === 'influencer' ? 'アクティブなオファー' : 'アクティブなキャンペーン'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {user.type === 'influencer' ? '¥850,000' : '¥1,200,000'}
              </div>
              <div className="text-gray-600">
                {user.type === 'influencer' ? '今月の収益' : '今月の支出'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {user.type === 'influencer' ? '98%' : '87%'}
              </div>
              <div className="text-gray-600">
                {user.type === 'influencer' ? '満足度' : '成功率'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {user.type === 'influencer' ? '4.8' : '4.6'}
              </div>
              <div className="text-gray-600">評価</div>
            </div>
          </div>
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