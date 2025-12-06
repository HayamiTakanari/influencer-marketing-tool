import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  MdHome, 
  MdWork, 
  MdFolder, 
  MdMessage, 
  MdPerson, 
  MdEmojiEvents, 
  MdAttachMoney, 
  MdBarChart, 
  MdSettings,
  MdSearch,
  MdStar,
  MdBusiness,
  MdGroup,
  MdLogout,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';

interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: any;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, user, onLogout }) => {
  const router = useRouter();

  const workingStatusOptions = [
    { value: 'AVAILABLE', label: '対応可能', color: 'bg-green-100 text-green-700' },
    { value: 'BUSY', label: '多忙', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'UNAVAILABLE', label: '対応不可', color: 'bg-red-100 text-red-700' },
    { value: 'BREAK', label: '休暇中', color: 'bg-blue-100 text-blue-700' }
  ];

  const getWorkingStatusInfo = (status?: string) => {
    return workingStatusOptions.find(option => option.value === status) || workingStatusOptions[0];
  };

  const isInfluencer = user?.role === 'INFLUENCER';
  const isCompany = user?.role === "COMPANY" || user?.role === 'COMPANY';

  const influencerNavigation: NavigationItem[] = [
    { label: 'ホーム', path: '/influencer/dashboard', icon: MdHome },
    { label: '案件を探す', path: '/influencer/opportunities', icon: MdSearch },
    { label: '応募した案件', path: '/influencer/applications', icon: MdFolder },
    { label: 'メッセージ', path: '/influencer/messages', icon: MdMessage },
    { label: '提出物管理', path: '/influencer/submissions', icon: MdAttachMoney },
    { label: 'プロフィール', path: '/influencer/profile', icon: MdPerson },
    { label: '実績', path: '/influencer/achievements', icon: MdEmojiEvents },
    { label: '収益', path: '/influencer/revenue', icon: MdAttachMoney },
    { label: '統計', path: '/influencer/analytics', icon: MdBarChart },
    { label: '設定', path: '/influencer/settings', icon: MdSettings },
  ];

  const companyNavigation: NavigationItem[] = [
    { label: 'ホーム', path: '/company/dashboard', icon: MdHome },
    { label: 'インフルエンサー検索', path: '/company/influencers/search', icon: MdSearch },
    { label: 'プロジェクト', path: '/company/projects/list', icon: MdFolder },
    { label: 'メッセージ', path: '/company/messages', icon: MdMessage },
    { label: '支払い履歴', path: '/company/payments/history', icon: MdAttachMoney },
    { label: '企業プロフィール', path: '/company/profile', icon: MdBusiness },
    { label: '設定', path: '/company/settings', icon: MdSettings },
  ];

  const adminNavigation: NavigationItem[] = [
    { label: 'ダッシュボード', path: '/admin/dashboard', icon: MdHome },
    { label: '企業管理', path: '/admin/companies', icon: MdBusiness },
    { label: 'インフルエンサー', path: '/admin/influencers', icon: MdGroup },
    { label: 'プロジェクト', path: '/admin/projects', icon: MdFolder },
    { label: 'ユーザー管理', path: '/admin/users', icon: MdPerson },
    { label: '設定', path: '/admin/settings', icon: MdSettings },
  ];

  const isAdmin = user?.role === 'ADMIN';
  const navigationItems = isAdmin ? adminNavigation : (isInfluencer ? influencerNavigation : companyNavigation);

  return (
    <aside className={`fixed top-0 left-0 h-screen ${isAdmin ? 'bg-gray-900' : 'bg-white'} border-r ${isAdmin ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 z-40 ${isOpen ? 'w-64' : 'w-16'}`}>
      {/* ロゴ・ヘッダー */}
      <div className={`h-14 flex items-center px-4 border-b ${isAdmin ? 'border-gray-700' : 'border-gray-200'}`}>
        {isOpen ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IL</span>
            </div>
            <h1 className={`text-lg font-bold ${isAdmin ? 'text-white' : 'text-gray-900'}`}>InfluenceLink</h1>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">IL</span>
          </div>
        )}
      </div>

      {/* ユーザー情報 */}
      <div className={`p-4 border-b ${isAdmin ? 'border-gray-700' : 'border-gray-200'} ${isOpen ? '' : 'flex justify-center'}`}>
        {isOpen ? (
          <Link href="/profile" className="block">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isAdmin ? 'text-white' : 'text-gray-900'}`}>{user?.displayName || user?.email}</p>
                {isInfluencer && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getWorkingStatusInfo(user?.workingStatus || 'AVAILABLE').color}`}>
                    {getWorkingStatusInfo(user?.workingStatus || 'AVAILABLE').label}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/profile">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
          </Link>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="p-2 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
        {navigationItems.map((item, index) => {
          const isActive = router.pathname === item.path ||
                          (item.path !== '/dashboard' && router.pathname.startsWith(item.path));
          const IconComponent = item.icon;
          return (
            <Link key={index} href={item.path}>
              <div className={`flex items-center px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? isAdmin ? 'bg-emerald-600 text-white font-medium' : 'bg-emerald-50 text-emerald-700 font-medium'
                  : isAdmin ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
              }`}>
                {IconComponent && (
                  <IconComponent className="text-xl mr-3 flex-shrink-0" />
                )}
                {isOpen && (
                  <span className="text-sm">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* トグルボタン */}
      <div className={`absolute bottom-12 left-0 right-0 p-2 border-t ${isAdmin ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <button
          onClick={onToggle}
          className={`w-full px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center ${
            isAdmin ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {isOpen ? (
            <>
              <MdChevronLeft className="text-xl mr-2" />
              <span>閉じる</span>
            </>
          ) : (
            <MdChevronRight className="text-xl" />
          )}
        </button>
      </div>

      {/* ログアウトボタン */}
      <div className={`absolute bottom-0 left-0 right-0 p-2 border-t ${isAdmin ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <button
          onClick={onLogout}
          className={`w-full px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center ${isOpen ? '' : 'justify-center'} ${
            isAdmin ? 'text-red-400 hover:bg-gray-800' : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <MdLogout className="text-xl mr-3 flex-shrink-0" />
          {isOpen && <span>ログアウト</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
