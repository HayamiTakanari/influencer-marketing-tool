import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingState from '../../components/common/LoadingState';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

interface Company {
  id: string;
  companyName: string;
  industry: string;
  contactName: string;
  contactPhone: string;
  address: string;
  website: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

const AdminCompanies: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

    // Simulate fetching companies
    setTimeout(() => {
      setCompanies([
        {
          id: '1',
          companyName: '株式会社サンプル',
          industry: '美容・化粧品',
          contactName: '田中太郎',
          contactPhone: '03-1234-5678',
          address: '東京都渋谷区',
          website: 'https://example.com',
          status: 'active',
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          companyName: 'ファッション企業B',
          industry: 'ファッション',
          contactName: '鈴木花子',
          contactPhone: '06-1234-5678',
          address: '大阪府大阪市',
          website: 'https://fashion-b.com',
          status: 'active',
          createdAt: '2024-02-20',
        },
        {
          id: '3',
          companyName: '食品会社C',
          industry: '食品',
          contactName: '佐藤次郎',
          contactPhone: '045-1234-5678',
          address: '神奈川県横浜市',
          website: 'https://food-c.com',
          status: 'pending',
          createdAt: '2024-03-10',
        },
      ]);
      setLoading(false);
    }, 500);
  }, [router]);

  const filteredCompanies = companies.filter((company) =>
    company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '活動中';
      case 'inactive':
        return '非表示';
      case 'pending':
        return '承認待ち';
      default:
        return '不明';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="企業管理" subtitle="全企業の管理と確認">
        <LoadingState />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="企業管理" subtitle={`全企業 (${filteredCompanies.length})`}>
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="企業名または業界で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Button>検索</Button>
        </div>

        {/* Companies Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">企業名</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">業界</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">担当者</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">電話</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">ステータス</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">登録日</th>
                  <th className="text-center px-4 py-2 font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{company.companyName}</p>
                        <p className="text-xs text-gray-500">{company.address}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{company.industry}</td>
                    <td className="px-4 py-3 text-gray-600">{company.contactName}</td>
                    <td className="px-4 py-3 text-gray-600">{company.contactPhone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                        {getStatusLabel(company.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{company.createdAt}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">詳細</button>
                      <button className="text-orange-600 hover:text-orange-800 text-xs font-medium">編集</button>
                      <button className="text-red-600 hover:text-red-800 text-xs font-medium">削除</button>
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

export default AdminCompanies;
