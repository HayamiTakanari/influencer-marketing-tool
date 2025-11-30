import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import LoadingState from '../../components/common/LoadingState';

const AdminSettings: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <DashboardLayout title="設定" subtitle="管理者設定">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="設定" subtitle="管理者設定">
      <div className="max-w-4xl space-y-6">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              設定ページは現在設計中です
            </h3>
            <p className="text-gray-600">
              システム設定や管理者設定の機能は現在準備中です。<br />
              今後、このページで以下の機能が追加予定です：
            </p>
            <div className="mt-8 text-left max-w-md mx-auto">
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mr-3"></span>
                  一般設定（サイト名、URL など）
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mr-3"></span>
                  予算・手数料設定
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mr-3"></span>
                  ユーザー登録設定
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mr-3"></span>
                  システムメンテナンス設定
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full mr-3"></span>
                  その他管理機能
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
