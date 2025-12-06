import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonPath?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = true,
  backButtonText = "ダッシュボードに戻る",
  backButtonPath = "/dashboard"
}) => {
  const router = useRouter();

  return (
    <div className="flex items-center space-x-4 mb-8">
      {showBackButton && (
        <button
          onClick={() => router.push(backButtonPath)}
          className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">{backButtonText}</span>
        </button>
      )}
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
      >
        {title}
      </motion.h1>
    </div>
  );
};

export default PageHeader;