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
    <header className="bg-white border-b border-gray-200 px-6 sticky top-0 z-30">
      <div className="flex items-center justify-between py-2">
        <div className="flex-1">
          {title && <h2 className="text-sm font-semibold text-gray-900 m-0">{title}</h2>}
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          <NotificationBell />
          {userEmail && (
            <span className="text-sm text-gray-600">{userEmail}</span>
          )}
        </div>
      </div>
      {breadcrumbs && (
        <div className="py-1.5 border-t border-gray-100">
          <BreadcrumbNav items={breadcrumbs} showHome={false} />
        </div>
      )}
    </header>
  );
};

export default Header;
