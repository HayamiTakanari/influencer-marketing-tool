import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import InfluencerSearch from './InfluencerSearch';
import { UserRole, WorkingStatus } from '../types';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

const CompanyDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  // ナビゲーションアイテム
  const navigationItems: NavigationItem[] = [
    { name: 'インフルエンサー検索', href: '/search', icon: '🔍' },
    { name: 'プロジェクト', href: '/projects', icon: '📝', badge: 5 },
    { name: 'お気に入り', href: '/favorites', icon: '⭐', badge: user?.favoriteInfluencers?.length || 0 },
    { name: 'チャット', href: '/chat', icon: '💬' },
    { name: '支払い履歴', href: '/payments/history', icon: '💳' },
    { name: '請求書', href: '/invoices', icon: '📋' },
    { name: '会社プロフィール', href: '/company-profile', icon: '🏢' },
    { name: 'チーム管理', href: '/team-management', icon: '👥' }
  ];

  const quickActionsItems = [
    { name: 'プロジェクト作成', href: '/projects/create', icon: '➕' },
    { name: 'お知らせ', href: '/notifications', icon: '🔔' },
    { name: 'フィードバック', href: '/feedback', icon: '📝' },
    { name: 'FAQ', href: '/faq', icon: '❓' }
  ];

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
      
      // 企業ユーザーでない場合はリダイレクト
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
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

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* 背景デザイン */}
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
            <pattern id="artistic-pattern-company-dashboard" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern-company-dashboard)" />
        </svg>
        
        {/* シンプルな波パターン */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.03) 31%, rgba(0,0,0,0.03) 32%, transparent 33%)
          `,
          backgroundSize: '200px 200px'
        }} />
      </div>

      {/* サイドバー */}
      <motion.div 
        initial={{ x: sidebarCollapsed ? -280 : 0 }}
        animate={{ x: sidebarCollapsed ? -280 : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed left-0 top-0 h-full ${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white/95 backdrop-blur-xl border-r border-gray-200 z-50`}
        style={{ boxShadow: '4px 0 20px rgba(0,0,0,0.08), 1px 0 3px rgba(0,0,0,0.1)' }}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {!sidebarCollapsed && (
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
                  <p className="text-sm text-gray-600">企業ダッシュボード</p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* ナビゲーション */}
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="space-y-1 px-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all hover:bg-emerald-50 hover:text-emerald-600 ${
                    router.pathname === item.href 
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-emerald-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </nav>

            {!sidebarCollapsed && (
              <>
                {/* セパレーター */}
                <div className="my-6 px-6">
                  <div className="border-t border-gray-200" />
                </div>

                {/* クイックアクション */}
                <div className="px-3">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    クイックアクション
                  </h3>
                  <nav className="space-y-1">
                    {quickActionsItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg transition-all hover:bg-gray-100 hover:text-gray-900"
                      >
                        <span className="text-lg mr-3">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </>
            )}
          </div>

          {/* ユーザー情報とログアウト */}
          <div className="border-t border-gray-200 p-6">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.companyName || user.email}
                  </p>
                  <p className="text-xs text-gray-500">企業アカウント</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`${sidebarCollapsed ? 'w-10 h-10' : 'w-full'} flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50`}
            >
              <span className="text-lg">{sidebarCollapsed ? '🚪' : '🚪'}</span>
              {!sidebarCollapsed && <span className="ml-2">ログアウト</span>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* メインコンテンツエリア */}
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-80'} transition-all duration-300 relative z-10`}>
        {/* トップバー */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200 px-6 py-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">インフルエンサー検索</h1>
              <p className="text-gray-600">最適なパートナーを見つけてプロジェクトを成功させましょう</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/projects/create"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <span className="mr-2">➕</span>
                新規プロジェクト
              </Link>
            </div>
          </div>
        </div>

        {/* 検索インターフェース */}
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <InfluencerSearch />
          </motion.div>
        </div>
      </div>

      {/* サイドバーオーバーレイ（モバイル用） */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;