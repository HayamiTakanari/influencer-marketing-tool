import React from 'react';
import NotificationBell from '../common/NotificationBell';
import BreadcrumbNav, { BreadcrumbItem } from '../common/BreadcrumbNav';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  userEmail?: string;
  breadcrumbs?: BreadcrumbItem[];
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, userEmail, breadcrumbs }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-2 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {title && <h2 className="text-sm font-semibold text-gray-900 whitespace-nowrap">{title}</h2>}
          {breadcrumbs && (
            <div className="text-gray-400">/</div>
          )}
          {breadcrumbs && (
            <BreadcrumbNav items={breadcrumbs} showHome={false} />
          )}
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          <NotificationBell />
          {userEmail && (
            <span className="text-sm text-gray-600">{userEmail}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
