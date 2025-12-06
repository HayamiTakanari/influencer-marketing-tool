import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import LoadingState from '../../../../components/common/LoadingState';
import Card from '../../../../components/shared/Card';
import Button from '../../../../components/shared/Button';
import api from '../../../../services/api';
import { useErrorHandler } from '../../../../hooks/useErrorHandler';

interface Influencer {
  id: string;
  displayName: string;
  bio: string;
  prefecture: string;
  categories: string[];
  socialAccounts: Array<{
    id: string;
    platform: string;
    followerCount: number;
    engagementRate: number;
    isVerified: boolean;
  }>;
  aiScore: number;
  matchReasons: string[];
  isRecommended: boolean;
}

const AIMatchingPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { projectId } = router.query;
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !projectId) return;

    const fetchData = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);

      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
        router.push('/influencer/dashboard');
        return;
      }

      setUser(parsedUser);

      try {
        // Get project details
        const projectRes = await api.get(`/projects/${projectId}`);
        setProject(projectRes.data.project || projectRes.data);

        // Get AI recommendations
        const aiRes = await api.post('/ai/recommend-influencers-for-project', {
          title: projectRes.data.project?.title || projectRes.data.title,
          description: projectRes.data.project?.description || projectRes.data.description,
          category: projectRes.data.project?.category || projectRes.data.category,
          budget: projectRes.data.project?.budget || projectRes.data.budget,
          targetPlatforms: projectRes.data.project?.targetPlatforms || projectRes.data.targetPlatforms,
          brandName: projectRes.data.project?.brandName || projectRes.data.brandName,
          productName: projectRes.data.project?.productName || projectRes.data.productName,
          campaignObjective: projectRes.data.project?.campaignObjective || projectRes.data.campaignObjective,
          campaignTarget: projectRes.data.project?.campaignTarget || projectRes.data.campaignTarget,
          messageToConvey: projectRes.data.project?.messageToConvey || projectRes.data.messageToConvey,
        });

        setInfluencers(aiRes.data.influencers || []);
      } catch (error) {
        handleError(error, 'AIマッチングデータの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isMounted, projectId, router]);

  const toggleInfluencer = (influencerId: string) => {
    const newSelected = new Set(selectedInfluencers);
    if (newSelected.has(influencerId)) {
      newSelected.delete(influencerId);
    } else {
      newSelected.add(influencerId);
    }
    setSelectedInfluencers(newSelected);
  };

  const recommendedInfluencers = influencers.filter(inf => inf.isRecommended);

  if (!isMounted || loading) {
    return (
      <DashboardLayout title="AI インフルエンサーマッチング" subtitle="最適なインフルエンサーを見つけましょう">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AI インフルエンサーマッチング" subtitle="最適なインフルエンサーを見つけましょう">
      <div className="space-y-6">
        {/* プロジェクト情報 */}
        {project && (
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">予算</p>
                    <p className="font-semibold text-gray-900">¥{project.budget?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">カテゴリー</p>
                    <p className="font-semibold text-gray-900">{project.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">プラットフォーム</p>
                    <p className="font-semibold text-gray-900">{project.targetPlatforms?.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">期限</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(project.endDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <Link href={`/company/projects/${projectId}`}>
                  <Button variant="secondary">編集</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* マッチング分析 */}
        {recommendedInfluencers.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">マッチング分析</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>{recommendedInfluencers.length}人のインフルエンサーがマッチしました</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>高エンゲージメント率のインフルエンサーを優先的に推奨しています</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>予算範囲内で最適なコスト効率を実現できるタレントを選定しました</span>
              </li>
            </ul>
          </Card>
        )}

        {/* インフルエンサー一覧 */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            おすすめインフルエンサー ({recommendedInfluencers.length}/{influencers.length}人)
          </h3>

          {influencers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="text-left py-2 px-4">AIスコア</th>
                    <th className="text-left py-2 px-4">インフルエンサー</th>
                    <th className="text-left py-2 px-4">フォロワー数</th>
                    <th className="text-left py-2 px-4">マッチ理由</th>
                    <th className="text-left py-2 px-4">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.map(inf => (
                    <tr key={inf.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedInfluencers.has(inf.id)}
                          onChange={() => toggleInfluencer(inf.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          inf.isRecommended
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {inf.aiScore}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{inf.displayName}</p>
                          {inf.prefecture && (
                            <p className="text-xs text-gray-500">{inf.prefecture}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">
                          {inf.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {inf.matchReasons.slice(0, 2).map((reason, idx) => (
                            <span key={idx} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                              {reason}
                            </span>
                          ))}
                          {inf.matchReasons.length > 2 && (
                            <span className="inline-block text-xs text-gray-500">+{inf.matchReasons.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/company/influencers/${inf.id}`}>
                          <Button size="sm" variant="secondary">詳細</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">マッチするインフルエンサーが見つかりませんでした</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AIMatchingPage;
