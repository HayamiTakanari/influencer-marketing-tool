import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingState from '../../components/common/LoadingState';

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="設定" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="設定"
      subtitle="アカウント設定と通知設定を管理"
    >
      <div className="space-y-4">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">通知設定</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" defaultChecked />
                <span className="text-sm text-gray-700">新しいオファー通知を受け取る</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" defaultChecked />
                <span className="text-sm text-gray-700">メッセージ通知を受け取る</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" />
                <span className="text-sm text-gray-700">マーケティングメールを受け取る</span>
              </label>
            </div>
          
          <div className="pt-4">
            <Button>
              変更を保存
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
