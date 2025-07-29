import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { WorkingStatus } from '../types';

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const router = useRouter();

  const workingStatusOptions = [
    { value: WorkingStatus.AVAILABLE, label: '対応可能', color: 'bg-green-100 text-green-800', icon: '✅' },
    { value: WorkingStatus.BUSY, label: '多忙', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
    { value: WorkingStatus.UNAVAILABLE, label: '対応不可', color: 'bg-red-100 text-red-800', icon: '❌' },
    { value: WorkingStatus.BREAK, label: '休暇中', color: 'bg-blue-100 text-blue-800', icon: '🏖️' }
  ];

  const getWorkingStatusInfo = (status: WorkingStatus) => {
    return workingStatusOptions.find(option => option.value === status) || workingStatusOptions[0];
  };

  // マウント状態を設定
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router, isMounted]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path);
    router.push(path);
  };

  const handleWorkingStatusChange = async (newStatus: WorkingStatus) => {
    if (!user || user.role !== 'INFLUENCER') return;
    
    setUpdatingStatus(true);
    
    try {
      // TODO: 実際のAPI呼び出しで稼働状況を更新
      // const { updateWorkingStatus } = await import('../services/api');
      // await updateWorkingStatus({ workingStatus: newStatus });
      
      // モック処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ユーザー情報を更新
      const updatedUser = {
        ...user,
        workingStatus: newStatus,
        workingStatusUpdatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
    } catch (error) {
      console.error('Error updating working status:', error);
      alert('稼働状況の更新に失敗しました。');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // ユーザータイプに応じたダッシュボードデータ
  const dashboardData = user.role === 'INFLUENCER' ? {
    title: 'インフルエンサーダッシュボード',
    subtitle: 'クリエイターとしての活動を管理しましょう',
    cards: [
      {
        icon: '📬',
        title: '新着オファー',
        value: '3',
        description: '未確認のプロジェクト機会',
        link: '/opportunities',
        linkText: '確認する',
        gradient: 'from-emerald-500 to-teal-600'
      },
      {
        icon: '📝',
        title: '進行中のプロジェクト',
        value: '2',
        description: 'アクティブなキャンペーン',
        link: '/projects',
        linkText: '管理する',
        gradient: 'from-blue-500 to-indigo-600'
      },
    ],
    quickActions: [
      { title: 'プロフィール編集', href: '/profile', icon: '👤' },
      { title: '応募履歴', href: '/my-applications', icon: '📝' },
      { title: '今月の収益', href: '/revenue', icon: '💰' },
      { title: '実績管理', href: '/achievements', icon: '🏆' }
    ]
  } : {
    title: '企業ダッシュボード',
    subtitle: 'インフルエンサーマーケティングを効率的に管理',
    cards: [
      {
        icon: '📝',
        title: '進行中のプロジェクト',
        value: '5',
        description: 'アクティブなキャンペーン',
        link: '/projects',
        linkText: '管理する',
        gradient: 'from-emerald-500 to-teal-600'
      },
      {
        icon: '👥',
        title: 'インフルエンサー検索',
        value: '∞',
        description: '最適なパートナーを見つける',
        link: '/search',
        linkText: '検索する',
        gradient: 'from-emerald-600 to-green-600'
      },
      {
        icon: '⭐',
        title: 'お気に入り',
        value: user?.favoriteInfluencers?.length?.toString() || '0',
        description: '登録したインフルエンサー',
        link: '/favorites',
        linkText: '管理する',
        gradient: 'from-yellow-500 to-orange-500'
      }
    ],
    quickActions: [
      { title: 'プロジェクト作成', href: '/projects/create', icon: '➕' },
      { title: 'お気に入り', href: '/favorites', icon: '⭐' },
      { title: '支払い履歴', href: '/payments/history', icon: '💳' },
      { title: '会社プロフィール', href: '/company-profile', icon: '🏢' }
    ]
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
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
            <pattern id="artistic-pattern-dashboard" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern-dashboard)" />
        </svg>
        
        {/* シンプルな波パターン */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.03) 31%, rgba(0,0,0,0.03) 32%, transparent 33%)
          `,
          backgroundSize: '200px 200px'
        }} />
      </div>

      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-50" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">IM</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">InfluenceLink</h1>
                <p className="text-sm text-gray-600">
                  {user.role === 'INFLUENCER' ? 'インフルエンサー' : '企業'}ダッシュボード
                </p>
              </div>
            </motion.div>
            <div className="flex items-center space-x-4">
              {user.role === 'INFLUENCER' && (
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkingStatusInfo(user.workingStatus || WorkingStatus.AVAILABLE).color}`}>
                    {getWorkingStatusInfo(user.workingStatus || WorkingStatus.AVAILABLE).icon} {getWorkingStatusInfo(user.workingStatus || WorkingStatus.AVAILABLE).label}
                  </span>
                  <div className="relative group">
                    <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100">
                      ⚙️
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 mb-2">稼働状況を変更</div>
                        {workingStatusOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => handleWorkingStatusChange(option.value)}
                            disabled={updatingStatus || user.workingStatus === option.value}
                            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                              user.workingStatus === option.value ? 'bg-gray-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                            {updatingStatus && user.workingStatus === option.value && (
                              <span className="ml-auto">⏳</span>
                            )}
                          </button>
                        ))}
                        <div className="border-t mt-2 pt-2">
                          <button
                            onClick={() => router.push('/profile?tab=working')}
                            className="w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors text-left"
                          >
                            詳細設定 →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <span className="hidden md:inline text-gray-700">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="pt-20 pb-12 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダーセクション */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {dashboardData.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {dashboardData.subtitle}
            </p>
          </motion.div>

          {/* 主要メトリクスカード */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto"
          >
            {dashboardData.cards.map((card, index) => (
              <motion.div
                key={index}
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
                  {/* パターン背景 */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05) 1px, transparent 1px),
                      radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px, 80px 80px'
                  }} />
                  
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="text-5xl">{card.icon}</div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-gray-600 mb-4">{card.description}</p>
                    <Link href={card.link} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium">
                      {card.linkText} →
                    </Link>
                  </div>
                  
                  {/* ホバー時のアクセント */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ background: 'linear-gradient(90deg, #34d399, #14b8a6, #10b981, #059669)' }} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* クイックアクション */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">クイックアクション</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {dashboardData.quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href={action.href} className="block">
                    <div className="bg-white border border-gray-200 p-6 text-center transition-all hover:shadow-lg" style={{
                      boxShadow: '3px 3px 0 rgba(0,0,0,0.1), 1px 1px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                    }}>
                      <div className="text-3xl mb-3">{action.icon}</div>
                      <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* フッターメニュー */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 border-t border-gray-200 bg-gray-50 py-8"
          >
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-gray-600">
                  <button
                    onClick={() => router.push('/faq')}
                    className="hover:text-gray-800 transition-colors"
                  >
                    よくある質問
                  </button>
                  <button
                    onClick={() => router.push('/feedback')}
                    className="hover:text-gray-800 transition-colors"
                  >
                    ご要望・フィードバック
                  </button>
                  <button
                    onClick={() => router.push('/terms')}
                    className="hover:text-gray-800 transition-colors"
                  >
                    利用規約
                  </button>
                  <button
                    onClick={() => router.push('/privacy')}
                    className="hover:text-gray-800 transition-colors"
                  >
                    プライバシーポリシー
                  </button>
                  <button
                    onClick={() => router.push('/commercial-law')}
                    className="hover:text-gray-800 transition-colors"
                  >
                    特定商取引法
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Version 1.2.3
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                © 2024 InfluenceLink. All rights reserved.
              </div>
            </div>
          </motion.footer>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;