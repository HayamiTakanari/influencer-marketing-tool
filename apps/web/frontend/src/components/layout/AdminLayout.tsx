import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, subtitle, children }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { label: 'ダッシュボード', href: '/admin/dashboard', icon: '📊' },
    { label: '企業管理', href: '/admin/companies', icon: '🏢' },
    { label: 'インフルエンサー', href: '/admin/influencers', icon: '👥' },
    { label: 'プロジェクト', href: '/admin/projects', icon: '📋' },
    { label: 'ユーザー管理', href: '/admin/users', icon: '👤' },
  ];

  const isActive = (href: string) => router.pathname === href;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col shadow-lg`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <Link href="/admin/dashboard">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="text-2xl font-bold">⚙️</div>
              {sidebarOpen && <span className="text-lg font-bold">管理画面</span>}
            </div>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-2 p-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive(item.href)
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex justify-center items-center px-4 py-2 rounded-lg hover:bg-gray-800 transition-all"
          >
            {sidebarOpen ? '«' : '»'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                🔔
              </button>
              <Link href="/login">
                <button className="text-gray-600 hover:text-gray-900">
                  ログアウト
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
