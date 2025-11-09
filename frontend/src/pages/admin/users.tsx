import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingState from '../../components/common/LoadingState';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COMPANY' | 'INFLUENCER' | 'MODERATOR';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
}

const AdminUsers: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

    // Simulate fetching users
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          name: '管理者A',
          email: 'admin@example.com',
          role: 'ADMIN',
          status: 'active',
          createdAt: '2023-01-01',
          lastLogin: '2024-11-10',
        },
        {
          id: '2',
          name: '株式会社サンプル',
          email: 'company@sample.com',
          role: 'COMPANY',
          status: 'active',
          createdAt: '2024-01-15',
          lastLogin: '2024-11-09',
        },
        {
          id: '3',
          name: 'インフルエンサーA',
          email: 'influencer-a@example.com',
          role: 'INFLUENCER',
          status: 'active',
          createdAt: '2024-01-10',
          lastLogin: '2024-11-08',
        },
        {
          id: '4',
          name: 'インフルエンサーB',
          email: 'influencer-b@example.com',
          role: 'INFLUENCER',
          status: 'active',
          createdAt: '2024-02-20',
          lastLogin: '2024-11-10',
        },
        {
          id: '5',
          name: 'モデレーターA',
          email: 'moderator@example.com',
          role: 'MODERATOR',
          status: 'active',
          createdAt: '2024-03-01',
          lastLogin: '2024-11-07',
        },
        {
          id: '6',
          name: 'ファッション企業B',
          email: 'fashion-b@example.com',
          role: 'COMPANY',
          status: 'suspended',
          createdAt: '2024-02-15',
          lastLogin: '2024-10-20',
        },
      ]);
      setLoading(false);
    }, 500);
  }, [router]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '管理者';
      case 'COMPANY':
        return '企業';
      case 'INFLUENCER':
        return 'インフルエンサー';
      case 'MODERATOR':
        return 'モデレーター';
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'アクティブ';
      case 'inactive':
        return '非アクティブ';
      case 'suspended':
        return '停止中';
      default:
        return '不明';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'COMPANY':
        return 'bg-blue-100 text-blue-800';
      case 'INFLUENCER':
        return 'bg-pink-100 text-pink-800';
      case 'MODERATOR':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="ユーザー管理" subtitle="全ユーザーの管理と権限設定">
        <LoadingState />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ユーザー管理" subtitle={`全ユーザー (${filteredUsers.length})`}>
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="ユーザー名またはメールで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">すべての役割</option>
            <option value="ADMIN">管理者</option>
            <option value="COMPANY">企業</option>
            <option value="INFLUENCER">インフルエンサー</option>
            <option value="MODERATOR">モデレーター</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">すべてのステータス</option>
            <option value="active">アクティブ</option>
            <option value="inactive">非アクティブ</option>
            <option value="suspended">停止中</option>
          </select>
        </div>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">ユーザー名</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">メール</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">役割</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">ステータス</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">登録日</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">最後のログイン</th>
                  <th className="text-center px-4 py-2 font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.createdAt}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{user.lastLogin}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">編集</button>
                      {user.status === 'active' ? (
                        <button className="text-red-600 hover:text-red-800 text-xs font-medium">停止</button>
                      ) : (
                        <button className="text-green-600 hover:text-green-800 text-xs font-medium">有効</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
