import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

interface SidebarProps {
  user: any;
  favoriteCount?: number;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, favoriteCount = 0, onLogout }) => {
  const router = useRouter();

  // ナビゲーションアイテム
  const navigationItems: NavigationItem[] = [
    { name: 'インフルエンサー検索', href: '/search', icon: '🔍' },
    { name: 'プロジェクト', href: '/projects', icon: '📝', badge: 5 },
    { name: 'お気に入り', href: '/favorites', icon: '⭐', badge: favoriteCount },
    { name: '支払い履歴', href: '/payments/history', icon: '💳' },
    { name: '請求書', href: '/invoices', icon: '📋' },
    { name: '会社プロフィール', href: '/company-profile', icon: '🏢' },
    { name: 'チーム管理', href: '/team-management', icon: '👥' }
  ];

  // 企業ユーザー以外の場合は表示しない
  if (!user || (user.role !== "COMPANY" && user.role !== 'COMPANY')) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 z-50 h-full w-80 bg-white border-r border-gray-200"
      style={{ boxShadow: '4px 0 15px rgba(0,0,0,0.1)' }}
    >
      <div className="flex flex-col h-full">
        {/* ヘッダー */}
        <div className="flex items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">IL</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">InfluenceLink</h1>
              <p className="text-sm text-gray-600">企業ダッシュボード</p>
            </div>
          </div>
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
                <span className="flex-1">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-emerald-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* ユーザー情報とログアウト */}
        <div className="border-t border-gray-200 p-6">
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
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50"
          >
            <span className="text-lg">🚪</span>
            <span className="ml-2">ログアウト</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;