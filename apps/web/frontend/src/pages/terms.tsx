import React from 'react';
import { Header } from '../components/common/Header';
import Link from 'next/link';
import { LegalTabs } from '../components/legal/LegalTabs';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <LegalTabs defaultTab="terms" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
          ← トップページに戻る
        </Link>
      </div>
    </div>
  );
};

export default TermsPage;
