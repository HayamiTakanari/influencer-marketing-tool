import React from 'react';
import NotificationBell from '../common/NotificationBell';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  userEmail?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, userEmail }) => {
  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex-1">
        {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        {userEmail && (
          <span className="text-sm text-gray-600">{userEmail}</span>
        )}
      </div>
    </header>
  );
};

export default Header;
