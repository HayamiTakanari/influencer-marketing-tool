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
    <header className="bg-white border-b border-gray-200 px-6 sticky top-0 z-30" style={{ height: '56px' }}>
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 flex flex-col justify-center">
          {title && <h2 className="font-semibold text-gray-900 m-0 leading-none" style={{ fontSize: '1.4rem' }}>{title}</h2>}
          {breadcrumbs && (
            <div className="border-t border-gray-100 mt-1 pt-1">
              <BreadcrumbNav items={breadcrumbs} showHome={false} />
            </div>
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
