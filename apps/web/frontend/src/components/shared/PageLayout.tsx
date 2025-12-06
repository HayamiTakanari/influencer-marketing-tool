import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showNavigation?: boolean;
  userEmail?: string;
  onLogout?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '7xl';
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  showNavigation = true,
  userEmail,
  onLogout,
  maxWidth = '7xl',
  className = ''
}) => {
  const router = useRouter();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '7xl': 'max-w-7xl'
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* ランディングページと同じ背景デザイン */}
      <div className="fixed inset-0 z-0">
        {/* ベースグラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        
        {/* メッシュグラデーション */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -inset-[100%] opacity-60">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #d1fae5, #10b981, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #f3f4f6, #6b7280, transparent)' }} />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #6ee7b7, #059669, transparent)' }} />
          </div>
        </div>
        
        {/* アーティスティックパターン */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="artistic-pattern-page" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern-page)" />
        </svg>
        
        {/* シンプルな波パターン */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.03) 31%, rgba(0,0,0,0.03) 32%, transparent 33%)
          `,
          backgroundSize: '200px 200px'
        }} />
      </div>

      {/* ナビゲーション */}
      {showNavigation && (
        <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-50" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <Link href="/dashboard" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">IM</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">InfluenceLink</h1>
                  </div>
                </Link>
              </motion.div>
              <div className="flex items-center space-x-4">
                {userEmail && (
                  <span className="hidden md:inline text-gray-700">{userEmail}</span>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
                  >
                    ログアウト
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* メインコンテンツ */}
      <div className={`${showNavigation ? 'pt-20' : 'pt-8'} pb-12 px-4 relative z-10`}>
        <div className={`${maxWidthClasses[maxWidth]} mx-auto ${className}`}>
          {/* ページヘッダー */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </motion.div>

          {/* ページコンテンツ */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;