import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  showAuthButtons?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showAuthButtons = true }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <h1 className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                InfluenceLink
              </h1>
            </div>
          </Link>

          {showAuthButtons && (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  ログイン
                </button>
              </Link>
              <Link href="/register">
                <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors">
                  新規登録
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
