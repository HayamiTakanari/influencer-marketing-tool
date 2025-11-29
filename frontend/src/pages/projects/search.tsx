import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SearchFilters, { FilterConfig } from '../../components/search/SearchFilters';
import Pagination from '../../components/search/Pagination';
import { FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  targetPlatforms: string[];
  targetPrefecture: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  client: {
    companyName: string;
  };
  hasApplied?: boolean;
}

const ProjectSearchPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const [filters, setFilters] = useState<Record<string, any>>({
    category: '',
    minBudget: '',
    maxBudget: '',
    platforms: [] as string[],
    prefecture: '',
  });

  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  const categories = [
    '美容・コスメ',
    'ファッション',
    'グルメ・飲食',
    '旅行・観光',
    'テクノロジー',
    'エンターテイメント',
    'スポーツ・フィットネス',
    'ライフスタイル',
    'その他'
  ];

  const platforms = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'];

  const prefectures = [
    '東京都', '大阪府', '神奈川県', '愛知県', '福岡県', '北海道', '埼玉県', '千葉県',
    '兵庫県', '京都府', '広島県', '宮城県', '新潟県', '長野県', '静岡県', '岐阜県'
  ];

  const PlatformIcon: React.FC<{ platform: string; className?: string }> = ({ platform, className = 'w-5 h-5' }) => {
    switch (platform) {
      case 'INSTAGRAM': return <FaInstagram className={className} />;
      case 'YOUTUBE': return <FaYoutube className={className} />;
      case 'TIKTOK': return <FaTiktok className={className} />;
      case 'TWITTER': return <FaXTwitter className={className} />;
      default: return null;
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    if (parsedUser.role !== 'INFLUENCER') {
      router.push('/dashboard');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, page, filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.minBudget) queryParams.append('minBudget', filters.minBudget);
      if (filters.maxBudget) queryParams.append('maxBudget', filters.maxBudget);
      if (filters.prefecture) queryParams.append('prefecture', filters.prefecture);
      filters.platforms.forEach(p => queryParams.append('platforms', p));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/projects/available?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      setTotal(data.total || 0);
      setPagination({
        totalPages: Math.ceil((data.total || 0) / 12),
        totalItems: data.total || 0
      });
      setError('');
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError('プロジェクトの取得に失敗しました。');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minBudget: '',
      maxBudget: '',
      platforms: [],
      prefecture: '',
    });
    setPage(1);
  };

  const filterConfig: FilterConfig[] = [
    {
      key: 'category',
      label: 'カテゴリー',
      type: 'select',
      options: categories.map(cat => ({ label: cat, value: cat }))
    },
    {
      key: 'prefecture',
      label: '都道府県',
      type: 'select',
      options: prefectures.map(pref => ({ label: pref, value: pref }))
    },
    {
      key: 'budget',
      label: '予算（円）',
      type: 'range'
    },
    {
      key: 'platforms',
      label: 'プラットフォーム',
      type: 'multiSelect',
      options: platforms.map(p => ({
        label: p,
        value: p
      }))
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(total / 12);

  if (loading && projects.length === 0) {
    return (
      <DashboardLayout title="プロジェクト検索" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="プロジェクト検索"
      subtitle="あなたに合ったプロジェクトを見つけましょう"
    >
      <div className="space-y-4">
        <SearchFilters
          filters={filters}
          config={filterConfig}
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
          loading={loading}
        />

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {total}件のプロジェクトが見つかりました
          </p>
        </div>

        {projects.length === 0 ? (
          <Card>
            <EmptyState
              icon="🔍"
              title="プロジェクトが見つかりません"
              description="条件を変更して再度検索してください"
            />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <Link href={`/projects/${project.id}`}>
                    <div className="cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {project.title}
                        </h3>
                        {project.hasApplied && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
                            応募済み
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 w-20">企業:</span>
                          <span className="font-medium text-gray-900">{project.client.companyName}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 w-20">カテゴリ:</span>
                          <span className="font-medium text-gray-900">{project.category}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 w-20">予算:</span>
                          <span className="font-bold text-emerald-600">{formatPrice(project.budget)}</span>
                        </div>
                        {project.targetPrefecture && (
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-20">地域:</span>
                            <span className="text-gray-900">{project.targetPrefecture}</span>
                          </div>
                        )}
                      </div>

                      {project.targetPlatforms && project.targetPlatforms.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {project.targetPlatforms.map((platform, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center gap-1"
                            >
                              <PlatformIcon platform={platform} className="w-4 h-4" />
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>募集期限: {formatDate(project.endDate)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                onPageChange={setPage}
                itemsPerPage={12}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectSearchPage;
