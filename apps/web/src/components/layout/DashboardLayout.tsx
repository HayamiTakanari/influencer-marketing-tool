import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Sidebar from './Sidebar';
import { BreadcrumbItem } from '../common/BreadcrumbNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, subtitle, breadcrumbs }) => {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Generate breadcrumbs based on router path
  const generateBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const path = router.pathname;
    const items: BreadcrumbItem[] = [];

    // Company pages
    if (path.startsWith('/company/')) {
      if (path === '/company/profile') {
        items.push({ label: '企業プロフィール' });
      } else if (path.startsWith('/company/projects')) {
        items.push({ label: 'プロジェクト', href: '/company/projects/list' });
        if (path === '/company/projects/list') {
          items.push({ label: 'プロジェクト一覧' });
        } else if (path === '/company/projects/create') {
          items.push({ label: '新規作成' });
        } else if (path.startsWith('/company/projects/[id]')) {
          items.push({ label: title || 'プロジェクト詳細' });
        }
      } else if (path.startsWith('/company/influencers')) {
        items.push({ label: 'インフルエンサー', href: '/company/influencers/search' });
        if (path === '/company/influencers/search') {
          items.push({ label: 'インフルエンサー検索' });
        } else if (path.startsWith('/company/influencers/[id]')) {
          items.push({ label: title || 'インフルエンサー詳細' });
        }
      } else if (path === '/company/messages') {
        items.push({ label: 'メッセージ' });
      } else if (path.startsWith('/company/payments')) {
        items.push({ label: '支払い', href: '/company/payments/history' });
        if (path === '/company/payments/history') {
          items.push({ label: '支払い履歴' });
        }
      }
    }
    // Influencer pages
    else if (path.startsWith('/influencer/')) {
      if (path === '/influencer/profile') {
        items.push({ label: 'プロフィール' });
      } else if (path === '/influencer/opportunities') {
        items.push({ label: '機会' });
      } else if (path.startsWith('/influencer/opportunities/[id]')) {
        items.push({ label: '機会', href: '/influencer/opportunities' });
        items.push({ label: title || '機会詳細' });
      } else if (path === '/influencer/applications') {
        items.push({ label: '応募' });
      } else if (path.startsWith('/influencer/applications/[id]')) {
        items.push({ label: '応募', href: '/influencer/applications' });
        items.push({ label: title || '応募詳細' });
      } else if (path === '/influencer/messages') {
        items.push({ label: 'メッセージ' });
      } else if (path === '/influencer/submissions') {
        items.push({ label: '提出物' });
      } else if (path.startsWith('/influencer/submissions/[id]')) {
        items.push({ label: '提出物', href: '/influencer/submissions' });
        items.push({ label: title || '提出物詳細' });
      } else if (path === '/influencer/revenue') {
        items.push({ label: '収益' });
      } else if (path === '/influencer/analytics') {
        items.push({ label: 'アナリティクス' });
      } else if (path === '/influencer/notifications') {
        items.push({ label: '通知' });
      } else if (path === '/influencer/settings') {
        items.push({ label: '設定' });
      } else if (path === '/influencer/achievements') {
        items.push({ label: '実績' });
      } else if (path === '/influencer/watchlist') {
        items.push({ label: 'ウォッチリスト' });
      }
    }
    // Admin pages
    else if (path.startsWith('/admin/')) {
      if (path === '/admin/dashboard') {
        items.push({ label: 'ダッシュボード' });
      } else if (path === '/admin/companies') {
        items.push({ label: '企業管理' });
      } else if (path === '/admin/projects') {
        items.push({ label: 'プロジェクト管理' });
      } else if (path.startsWith('/admin/projects/[id]')) {
        items.push({ label: 'プロジェクト管理', href: '/admin/projects' });
        items.push({ label: title || 'プロジェクト詳細' });
      } else if (path === '/admin/influencers') {
        items.push({ label: 'インフルエンサー管理' });
      } else if (path === '/admin/users') {
        items.push({ label: 'ユーザー管理' });
      } else if (path === '/admin/settings') {
        items.push({ label: '設定' });
      } else if (path === '/admin/sns-sync') {
        items.push({ label: 'SNS同期' });
      }
    }
    // Other pages
    else if (path === '/profile') {
      items.push({ label: 'プロフィール' });
    } else if (path === '/settings') {
      items.push({ label: '設定' });
    } else if (path === '/notifications') {
      items.push({ label: '通知' });
    } else if (path === '/messages') {
      items.push({ label: 'メッセージ' });
    } else if (path === '/invoices') {
      items.push({ label: '請求書' });
    } else if (path.startsWith('/invoices/')) {
      items.push({ label: '請求書', href: '/invoices' });
      if (path === '/invoices/create') {
        items.push({ label: '新規作成' });
      } else if (path === '/invoices/received') {
        items.push({ label: '受け取り済み' });
      } else {
        items.push({ label: title || '詳細' });
      }
    }

    return items;
  };

  // Auto-generate breadcrumbs from path or use provided breadcrumbs
  const getDefaultBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs) return breadcrumbs;
    const pathBreadcrumbs = generateBreadcrumbsFromPath();
    if (pathBreadcrumbs.length > 0) return pathBreadcrumbs;
    if (!title) return [];
    return [{ label: title }];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバー */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onLogout={handleLogout}
      />

      {/* メインコンテンツ */}
      <main className={`transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* トップバー */}
        <Header title={title} subtitle={subtitle} breadcrumbs={getDefaultBreadcrumbs()} />

        {/* コンテンツエリア */}
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
