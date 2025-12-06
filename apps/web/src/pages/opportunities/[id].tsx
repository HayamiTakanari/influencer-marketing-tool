import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import api from '../../services/api';

interface OpportunityDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  targetPlatforms: string[];
  targetPrefecture: string;
  targetCity?: string;
  targetGender?: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  company?: {
    id: string;
    name?: string;
    companyName?: string;
    industry?: string;
    contactName?: string;
  };
  client?: {
    id: string;
    companyName: string;
    industry: string;
    contactName?: string;
  };
  // Additional details
  advertiserName?: string;
  brandName?: string;
  productName?: string;
  productUrl?: string;
  productPrice?: number;
  productFeatures?: string;
  campaignObjective?: string;
  campaignTarget?: string;
  postingPeriodStart?: string;
  postingPeriodEnd?: string;
  postingMedia?: string[];
  messageToConvey?: string;
  shootingAngle?: string;
  packagePhotography?: string;
  prohibitedMatters?: string;
  hashtagInstruction?: string;
  mentionInstruction?: string;
  remarks?: string;
}

const OpportunityDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // インフルエンサーのみアクセス可能
      if (parsedUser.role !== 'INFLUENCER') {
        router.push('/dashboard');
        return;
      }

      if (id) {
        fetchOpportunityDetail();
      }
    } else {
      router.push('/login');
    }
  }, [id, router]);

  const fetchOpportunityDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/projects/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch opportunity');
      }

      const data = await response.json();
      setOpportunity(data.project);
      setError('');
    } catch (err: any) {
      console.error('Error fetching opportunity:', err);
      setError('機会の詳細を取得できませんでした。');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunity || !proposedPrice) {
      alert('提案金額を入力してください。');
      return;
    }

    setIsApplying(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/projects/${opportunity.id}/apply`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: applicationMessage,
            proposedPrice: Number(proposedPrice)
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply');
      }

      alert('プロジェクトに応募しました！');
      router.push('/influencer/opportunities');
    } catch (err: any) {
      console.error('Error applying:', err);
      alert(err.message || '応募に失敗しました。');
    } finally {
      setIsApplying(false);
    }
  };

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

  const formatPlatform = (platform: string) => {
    const platformMap: { [key: string]: string } = {
      'INSTAGRAM': 'Instagram',
      'YOUTUBE': 'YouTube',
      'TIKTOK': 'TikTok',
      'TWITTER': 'X (Twitter)',
      'FACEBOOK': 'Facebook',
      'TWITCH': 'Twitch',
      'PINTEREST': 'Pinterest',
      'LINKEDIN': 'LinkedIn'
    };
    return platformMap[platform] || platform;
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout title="機会詳細" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (error || !opportunity) {
    return (
      <DashboardLayout title="機会詳細" subtitle="エラーが発生しました">
        <ErrorState message={error || '機会が見つかりません'} />
        <div className="mt-6">
          <Link href="/influencer/opportunities">
            <Button>戻る</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const companyName = opportunity.company?.companyName || opportunity.company?.name || opportunity.client?.companyName || '企業';
  const industry = opportunity.company?.industry || opportunity.client?.industry || 'N/A';

  return (
    <DashboardLayout title={opportunity.title} subtitle={`${companyName} - ${opportunity.category}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{opportunity.title}</h2>
              <p className="text-gray-600">{opportunity.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">報酬</p>
                <p className="text-2xl font-bold text-emerald-600">{formatPrice(opportunity.budget)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">カテゴリー</p>
                <p className="text-lg font-semibold text-gray-900">{opportunity.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">企業</p>
                <p className="text-lg font-semibold text-gray-900">{companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">業界</p>
                <p className="text-lg text-gray-900">{industry}</p>
              </div>
            </div>

            <hr className="my-6" />

            {/* Target Information */}
            <h3 className="font-semibold text-gray-900 mb-4">ターゲット情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">対象地域</p>
                <p className="text-gray-900">{opportunity.targetPrefecture || '全国'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">性別</p>
                <p className="text-gray-900">{opportunity.targetGender || '指定なし'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">年齢</p>
                <p className="text-gray-900">
                  {opportunity.targetAgeMin && opportunity.targetAgeMax
                    ? `${opportunity.targetAgeMin}～${opportunity.targetAgeMax}歳`
                    : '指定なし'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">フォロワー数</p>
                <p className="text-gray-900">{opportunity.targetFollowerMin ? `${opportunity.targetFollowerMin.toLocaleString()}～` : '指定なし'}</p>
              </div>
            </div>
          </Card>

          {/* Platforms */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">対象プラットフォーム</h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.targetPlatforms && opportunity.targetPlatforms.map((platform) => (
                <span key={platform} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {formatPlatform(platform)}
                </span>
              ))}
            </div>
          </Card>

          {/* Dates */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">期限</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">開始日</p>
                <p className="font-semibold text-gray-900">{formatDate(opportunity.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">終了日</p>
                <p className="font-semibold text-gray-900">{formatDate(opportunity.endDate)}</p>
              </div>
            </div>
          </Card>

          {/* Additional Details */}
          {(opportunity.productName || opportunity.campaignObjective || opportunity.messageToConvey) && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">詳細情報</h3>
              <div className="space-y-3">
                {opportunity.productName && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">商品名</p>
                    <p className="text-gray-900">{opportunity.productName}</p>
                  </div>
                )}
                {opportunity.campaignObjective && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">キャンペーン目的</p>
                    <p className="text-gray-900">{opportunity.campaignObjective}</p>
                  </div>
                )}
                {opportunity.messageToConvey && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">伝えたいメッセージ</p>
                    <p className="text-gray-900">{opportunity.messageToConvey}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Application Form */}
        <div>
          <Card className="sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">応募する</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提案金額 (円) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="金額を入力"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メッセージ
                </label>
                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="あなたのメッセージを入力"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={isApplying}
                className="w-full px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
              >
                {isApplying ? '送信中...' : '応募する'}
              </button>

              <Link href="/influencer/opportunities">
                <button
                  type="button"
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
              </Link>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OpportunityDetailPage;
