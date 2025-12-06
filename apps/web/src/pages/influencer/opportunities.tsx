import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  targetPlatforms: string[];
  targetPrefecture: string;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetFollowerMin?: number;
  targetFollowerMax?: number;
  startDate: string;
  endDate: string;
  isApplied?: boolean;
  company?: {
    id: string;
    name?: string;
    companyName?: string;
    industry?: string;
    contactName?: string;
  };
  client?: {
    companyName: string;
    user: {
      email: string;
    };
  };
}

const OpportunitiesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const router = useRouter();
  const { handleError } = useErrorHandler();

  const getCompanyName = (project: Project) => {
    return project.company?.companyName || project.company?.name || project.client?.companyName || '企業名未設定';
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchData = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);

      if (parsedUser.role !== 'INFLUENCER') {
        router.push('/company/dashboard');
        return;
      }

      setUser(parsedUser);

      try {
        // Get available projects for influencer
        const response = await api.get('/projects/available');
        console.log('Projects API response:', response.data);
        const projectsList = response.data.projects || [];
        console.log('Projects to display:', projectsList);
        setProjects(projectsList);

        // Get unique categories
        if (projectsList.length > 0) {
          const uniqueCategories = [...new Set(projectsList.map((p: any) => p.category))];
          setCategories(uniqueCategories as string[]);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        handleError(error, '案件一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isMounted, router]);

  const filteredProjects = projects
    .filter(p => !p.isApplied)
    .filter(p => (selectedCategory ? p.category === selectedCategory : true));

  if (!isMounted || loading) {
    return (
      <DashboardLayout title="案件を探す" subtitle="新しい機会を見つけましょう">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="案件を探す" subtitle="新しい機会を見つけましょう">
      <div className="space-y-6">
        {/* カテゴリーフィルター */}
        {categories.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">カテゴリーで絞り込み</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === ''
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* プロジェクト一覧 */}
        {filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map(project => (
              <Card key={project.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {project.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500 text-xs">予算</p>
                        <p className="font-semibold text-gray-900">¥{project.budget?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">企業</p>
                        <p className="font-semibold text-gray-900">{getCompanyName(project)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">対象プラットフォーム</p>
                        <p className="font-semibold text-gray-900">{project.targetPlatforms?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">期限</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(project.endDate).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>

                    {/* ターゲット情報 */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-4 text-xs text-gray-600">
                      <p className="mb-1">
                        <span className="font-medium">対象地域:</span> {project.targetPrefecture || '全国'}
                      </p>
                      {project.targetAgeMin && project.targetAgeMax && (
                        <p className="mb-1">
                          <span className="font-medium">年齢:</span> {project.targetAgeMin}～{project.targetAgeMax}歳
                        </p>
                      )}
                      {project.targetFollowerMin && (
                        <p>
                          <span className="font-medium">フォロワー数:</span> {project.targetFollowerMin?.toLocaleString()}～
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <Link href={`/opportunities/${project.id}`}>
                      <Button className="whitespace-nowrap">詳細を見る</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🔍"
            title="案件がありません"
            description="条件に合う案件がまだありません。後で確認してください。"
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default OpportunitiesPage;
