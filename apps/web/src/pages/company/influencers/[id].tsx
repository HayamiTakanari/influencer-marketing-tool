import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import LoadingState from '../../../components/common/LoadingState';
import api from '../../../services/api';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
  followerCount: number;
  isVerified: boolean;
}

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

interface InfluencerDetail {
  id: string;
  displayName: string;
  bio?: string;
  gender?: string;
  birthDate?: string;
  prefecture?: string;
  city?: string;
  user: {
    email: string;
    createdAt: string;
  };
  socialAccounts: SocialAccount[];
  portfolio: PortfolioItem[];
}

const InfluencerDetailPage: React.FC = () => {
  const [influencer, setInfluencer] = useState<InfluencerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;
  const { handleError } = useErrorHandler();

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchInfluencer = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await api.get(`/influencers/${id}`);
        setInfluencer(response.data);
        setError('');
      } catch (err) {
        handleError(err, 'インフルエンサー情報の取得に失敗しました');
        setError('インフルエンサー情報が見つかりません');
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencer();
  }, [id, router]);


  if (loading) {
    return (
      <DashboardLayout title="インフルエンサー詳細" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (error || !influencer) {
    return (
      <DashboardLayout title="エラー" subtitle="インフルエンサーが見つかりません">
        <Card className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {error || 'インフルエンサーが見つかりませんでした。'}
          </h3>
          <Link href="/company/projects/list?tab=applications">
            <Button variant="primary">応募一覧に戻る</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  const totalFollowers = influencer.socialAccounts.reduce(
    (sum, acc) => sum + acc.followerCount,
    0
  );

  const age = influencer.birthDate
    ? new Date().getFullYear() - new Date(influencer.birthDate).getFullYear()
    : null;

  return (
    <DashboardLayout title={influencer.displayName} subtitle="インフルエンサー詳細">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 基本情報 */}
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {influencer.displayName}
              </h1>
              <p className="text-sm text-gray-600">{influencer.user.email}</p>
              {influencer.bio && (
                <p className="text-gray-700 mt-3 line-clamp-3">{influencer.bio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">総フォロワー数</p>
              <p className="text-lg font-semibold text-gray-900">
                {totalFollowers?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">性別</p>
              <p className="text-lg font-semibold text-gray-900">
                {influencer.gender || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">年齢</p>
              <p className="text-lg font-semibold text-gray-900">{age || '-'}才</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">登録日</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(influencer.user.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </Card>

        {/* 所在地情報 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">所在地</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">都道府県</p>
              <p className="font-semibold text-gray-900">{influencer.prefecture || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">市区町村</p>
              <p className="font-semibold text-gray-900">{influencer.city || '-'}</p>
            </div>
          </div>
        </Card>

        {/* SNS情報 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">連携SNS</h2>
          {influencer.socialAccounts && influencer.socialAccounts.length > 0 ? (
            <div className="space-y-4">
              {influencer.socialAccounts.map(account => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                        {account.platform}
                      </span>
                      {account.isVerified && (
                        <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          認証済み
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">ハンドル</p>
                      <p className="font-semibold text-gray-900">@{account.handle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">フォロワー数</p>
                      <p className="font-semibold text-gray-900">
                        {account.followerCount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">連携SNSがありません</p>
          )}
        </Card>

        {/* ポートフォリオ */}
        {influencer.portfolio && influencer.portfolio.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">ポートフォリオ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {influencer.portfolio.map(item => (
                <div
                  key={item.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {item.imageUrl && (
                    <div className="bg-gray-200 h-40 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* アクション */}
        <div className="flex gap-3">
          <Link href="/company/projects/list?tab=applications">
            <Button variant="secondary">応募一覧に戻る</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InfluencerDetailPage;
