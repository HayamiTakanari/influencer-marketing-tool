import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SyncStatus {
  totalAccounts: number;
  accounts: {
    id: string;
    platform: string;
    username: string;
    lastSynced: string | null;
    followerCount: number;
    engagementRate: number;
    isVerified: boolean;
  }[];
}

const AdminSNSSyncPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 管理者のみアクセス可能
      if (parsedUser.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      
      fetchSyncStatus();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchSyncStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // TODO: 実際のAPI実装
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/sns/status`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to fetch sync status');
      // }
      
      // const data = await response.json();
      // setSyncStatus(data);

      // 仮のデータ
      const mockStatus: SyncStatus = {
        totalAccounts: 15,
        accounts: [
          {
            id: 'acc1',
            platform: 'INSTAGRAM',
            username: 'beauty_influencer',
            lastSynced: '2024-01-20T10:30:00Z',
            followerCount: 45000,
            engagementRate: 3.2,
            isVerified: true
          },
          {
            id: 'acc2',
            platform: 'YOUTUBE',
            username: 'lifestyle_channel',
            lastSynced: null,
            followerCount: 12000,
            engagementRate: 4.1,
            isVerified: false
          },
          {
            id: 'acc3',
            platform: 'TWITTER',
            username: 'tech_reviewer',
            lastSynced: '2024-01-19T15:20:00Z',
            followerCount: 28000,
            engagementRate: 2.8,
            isVerified: true
          }
        ]
      };

      setSyncStatus(mockStatus);
    } catch (err: any) {
      console.error('Error fetching sync status:', err);
      setError('同期状況の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllInfluencers = async () => {
    if (!confirm('全てのインフルエンサーのSNSアカウントを同期しますか？この処理には時間がかかる場合があります。')) {
      return;
    }

    setSyncing(true);
    setSyncLogs(['同期を開始しています...']);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/sns/sync-all-influencers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start sync for all influencers');
      }

      setSyncLogs(prev => [...prev, 'バックグラウンドで同期処理を開始しました']);
      setSyncLogs(prev => [...prev, 'この処理は完了まで数分かかる場合があります']);
      
      // シミュレートログ（実際の実装では WebSocket で進捗を受信）
      setTimeout(() => {
        setSyncLogs(prev => [...prev, 'インフルエンサー 1/10 の同期完了']);
      }, 2000);
      
      setTimeout(() => {
        setSyncLogs(prev => [...prev, 'インフルエンサー 5/10 の同期完了']);
      }, 5000);
      
      setTimeout(() => {
        setSyncLogs(prev => [...prev, '全てのインフルエンサーの同期が完了しました']);
        fetchSyncStatus();
      }, 8000);

    } catch (err: any) {
      console.error('Error syncing all influencers:', err);
      setSyncLogs(prev => [...prev, `エラー: ${err.message}`]);
    } finally {
      setTimeout(() => setSyncing(false), 8000);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📸';
      case 'youtube': return '🎥';
      case 'tiktok': return '🎵';
      case 'twitter': return '🐦';
      default: return '📱';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未同期';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastSyncColor = (lastSynced: string | null) => {
    if (!lastSynced) return 'text-red-600';
    
    const daysSinceSync = (Date.now() - new Date(lastSynced).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSync > 7) return 'text-red-600';
    if (daysSinceSync > 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SNS同期管理</h1>
              <p className="text-sm text-gray-600">全インフルエンサーのSNSデータ同期管理</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.email}</span>
            <Link href="/dashboard" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
              ダッシュボード
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* エラーメッセージ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* API設定状況 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API設定状況</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">🐦</span>
                <h3 className="font-bold text-green-900">Twitter API</h3>
              </div>
              <p className="text-green-700 text-sm">
                {process.env.NEXT_PUBLIC_TWITTER_CONFIGURED ? '設定済み' : '要設定'}
              </p>
              <p className="text-green-600 text-xs mt-1">
                フォロワー数、エンゲージメント率を取得
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">🎥</span>
                <h3 className="font-bold text-red-900">YouTube API</h3>
              </div>
              <p className="text-red-700 text-sm">
                {process.env.NEXT_PUBLIC_YOUTUBE_CONFIGURED ? '設定済み' : '要設定'}
              </p>
              <p className="text-red-600 text-xs mt-1">
                チャンネル登録者数、視聴データを取得
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">📸</span>
                <h3 className="font-bold text-yellow-900">Instagram API</h3>
              </div>
              <p className="text-yellow-700 text-sm">OAuth認証が必要</p>
              <p className="text-yellow-600 text-xs mt-1">
                ユーザー個別認証でデータ取得
              </p>
            </div>
          </div>
        </motion.div>

        {/* 同期コントロール */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">一括同期</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSyncAllInfluencers}
              disabled={syncing}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? '同期中...' : '🔄 全インフルエンサー同期'}
            </motion.button>
          </div>

          {syncLogs.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm max-h-48 overflow-y-auto">
              {syncLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  [{new Date().toLocaleTimeString()}] {log}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 同期状況一覧 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">SNSアカウント同期状況</h2>
          
          {syncStatus && (
            <>
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-bold text-blue-900 mb-2">概要</h3>
                <p className="text-blue-700">
                  総アカウント数: {syncStatus.totalAccounts}件
                  （表示中: {syncStatus.accounts.length}件）
                </p>
              </div>

              <div className="space-y-4">
                {syncStatus.accounts.map((account, index) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                        <div>
                          <h4 className="font-bold text-gray-900">@{account.username}</h4>
                          <p className="text-gray-600 text-sm">{account.platform}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-gray-900">{account.followerCount.toLocaleString()}</div>
                          <div className="text-gray-500">フォロワー</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-gray-900">{account.engagementRate}%</div>
                          <div className="text-gray-500">エンゲージメント</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold ${getLastSyncColor(account.lastSynced)}`}>
                            {formatDate(account.lastSynced)}
                          </div>
                          <div className="text-gray-500">最終同期</div>
                        </div>
                        <div className="text-center">
                          {account.isVerified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ✓ 認証済み
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* 設定ガイド */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-blue-50/80 backdrop-blur-xl border border-blue-200 rounded-3xl p-8 shadow-xl mt-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 API設定ガイド</h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🐦 Twitter API設定</h4>
              <p className="mb-2">1. Twitter Developer Portal でアプリケーションを作成</p>
              <p className="mb-2">2. 以下の環境変数を設定:</p>
              <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
                TWITTER_API_KEY=your_api_key<br/>
                TWITTER_API_SECRET=your_api_secret<br/>
                TWITTER_ACCESS_TOKEN=your_access_token<br/>
                TWITTER_ACCESS_SECRET=your_access_secret
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎥 YouTube Data API設定</h4>
              <p className="mb-2">1. Google Cloud Console でYouTube Data API v3を有効化</p>
              <p className="mb-2">2. 環境変数を設定:</p>
              <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
                YOUTUBE_API_KEY=your_youtube_api_key
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📸 Instagram Basic Display API</h4>
              <p className="mb-2">※ ユーザー個別のOAuth認証が必要のため、一括同期は対象外</p>
              <p>各インフルエンサーが個別にInstagramアカウントを連携する必要があります。</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSNSSyncPage;