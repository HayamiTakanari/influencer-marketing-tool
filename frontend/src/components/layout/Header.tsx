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
      <div className="h-12 flex items-center justify-between">
        <div className="flex-1">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          {userEmail && (
            <span className="text-sm text-gray-600">{userEmail}</span>
          )}
        </div>
      </div>
      {(subtitle || breadcrumbs) && (
        <div className="h-10 flex items-center border-t border-gray-100">
          {breadcrumbs ? (
            <BreadcrumbNav items={breadcrumbs} showHome={false} className="text-xs" />
          ) : (
            subtitle && <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
