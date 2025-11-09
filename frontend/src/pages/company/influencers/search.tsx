import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingState from '../../../components/common/LoadingState';
import EmptyState from '../../../components/common/EmptyState';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import api from '../../../services/api';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

interface Influencer {
  id: string;
  displayName: string;
  bio: string;
  categories: string[];
  prefecture: string;
  socialAccounts: Array<{
    platform: string;
    followerCount: number;
    engagementRate: number;
  }>;
}

const InfluencerSearchPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const router = useRouter();
  const { handleError } = useErrorHandler();

  // Check authentication on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      // Not authenticated - redirect to login
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
      // Wrong role
      router.push('/influencer/dashboard');
      return;
    }

    setIsAuthenticated(true);
    setIsMounted(true);
  }, [router]);

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

      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/influencer/dashboard');
        return;
      }

      setUser(parsedUser);

      try {
        // Get available influencers
        const response = await api.get('/projects/available');
        // Extract unique influencers from projects (simplified for now)
        setInfluencers([]);
        setLoading(false);
      } catch (error: any) {
        // Suppress 403 and 401 errors - these are expected for protected routes
        if (error.response?.status !== 403 && error.response?.status !== 401) {
          handleError(error, 'インフルエンサー検索に失敗しました');
        }
        setLoading(false);
      }
    };

    // Only fetch if we have both user and token to avoid race conditions
    const hasAuth = localStorage.getItem('user') && localStorage.getItem('token');
    if (hasAuth) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isMounted, router]);

  if (!isAuthenticated || !isMounted || loading) {
    return (
      <DashboardLayout title="インフルエンサー検索" subtitle="パートナーを見つけましょう">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="インフルエンサー検索" subtitle="パートナーを見つけましょう">
      <div className="space-y-6">
        {/* 検索フォーム */}
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="名前、カテゴリーなどで検索"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  カテゴリー
                </label>
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
              </div>
            )}
          </div>
        </Card>

        {/* インフルエンサー一覧 */}
        {influencers.length > 0 ? (
          <div className="space-y-4">
            {influencers.map(influencer => (
              <Card key={influencer.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {influencer.displayName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{influencer.bio}</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">カテゴリー</p>
                        <p className="font-semibold text-gray-900">
                          {influencer.categories?.join(', ') || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">地域</p>
                        <p className="font-semibold text-gray-900">{influencer.prefecture}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">フォロワー数</p>
                        <p className="font-semibold text-gray-900">
                          {influencer.socialAccounts?.reduce((sum, acc) => sum + acc.followerCount, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <Link href={`/company/influencers/${influencer.id}`}>
                      <Button>詳細を見る</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🔍"
            title="インフルエンサーが見つかりません"
            description="プロジェクトを作成してAI マッチング機能を使用してください"
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default InfluencerSearchPage;
