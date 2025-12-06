import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaInstagram, FaYoutube, FaTiktok, FaTwitter, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../../services/api';
import { Platform } from '../../types';

interface SocialConnectionStatus {
  platform: Platform;
  isConnected: boolean;
  username?: string;
  followerCount?: number;
  lastSynced?: string;
}

const SNSConnect: React.FC = () => {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<SocialConnectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // OAuthコールバック処理
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const { code, state, platform } = router.query;
      
      if (code && state && platform) {
        try {
          const response = await api.post(`/api/oauth/callback/${platform}`, {
            code,
            state,
          });

          if (response.data.success) {
            setMessage({
              type: 'success',
              text: `${platform}の連携が完了しました！`,
            });
            fetchConnectionStatus();
          }
        } catch (error: any) {
          setMessage({
            type: 'error',
            text: error.response?.data?.error || '連携中にエラーが発生しました',
          });
        }
        
        // URLからパラメータを削除
        router.replace('/profile/sns-connect');
      }
    };

    handleOAuthCallback();
  }, [router.query]);

  const fetchConnectionStatus = async () => {
    try {
      const response = await api.get('/api/oauth/status');
      setConnectionStatus(response.data.connectionStatus);
    } catch (error) {
      console.error('Failed to fetch connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const handleConnect = async (platform: Platform) => {
    setConnecting(platform);
    setMessage(null);

    try {
      const response = await api.get(`/api/oauth/auth/${platform.toLowerCase()}`);
      
      if (response.data.authUrl) {
        // OAuth認証ページへリダイレクト
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '認証の開始に失敗しました',
      });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`${platform}の連携を解除してもよろしいですか？`)) {
      return;
    }

    try {
      await api.delete(`/api/oauth/disconnect/${platform.toLowerCase()}`);
      setMessage({
        type: 'success',
        text: `${platform}の連携を解除しました`,
      });
      fetchConnectionStatus();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '連携解除に失敗しました',
      });
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case Platform.INSTAGRAM:
        return <FaInstagram className="text-2xl" />;
      case Platform.YOUTUBE:
        return <FaYoutube className="text-2xl" />;
      case Platform.TIKTOK:
        return <FaTiktok className="text-2xl" />;
      case Platform.TWITTER:
        return <FaTwitter className="text-2xl" />;
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case Platform.INSTAGRAM:
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case Platform.YOUTUBE:
        return 'bg-red-600';
      case Platform.TIKTOK:
        return 'bg-black';
      case Platform.TWITTER:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const allPlatforms = Object.values(Platform);
  const connectedCount = connectionStatus.filter(status => status.isConnected).length;
  const isAllConnected = connectedCount === allPlatforms.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">SNSアカウント連携</h1>

          {/* 案件応募の条件説明 */}
          <div className={`mb-6 p-4 rounded-lg ${connectedCount > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-start">
              {connectedCount > 0 ? (
                <FaCheckCircle className="text-green-500 text-xl mr-3 mt-1" />
              ) : (
                <FaTimesCircle className="text-yellow-600 text-xl mr-3 mt-1" />
              )}
              <div>
                <p className={`font-semibold ${isAllConnected ? 'text-green-800' : 'text-yellow-800'}`}>
                  {isAllConnected ? '全てのSNSアカウントが連携済みです' : connectedCount > 0 ? 'SNSアカウントが連携されています' : 'SNSアカウントを連携してください'}
                </p>
                <p className={`text-sm mt-1 ${connectedCount > 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                  連携したSNSプラットフォームの案件に応募できます。
                  現在 {connectedCount}/{allPlatforms.length} 連携済み
                </p>
              </div>
            </div>
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {/* SNSプラットフォーム一覧 */}
          <div className="space-y-4">
            {allPlatforms.map((platform) => {
              const status = connectionStatus.find(s => s.platform === platform);
              const isConnected = status?.isConnected || false;

              return (
                <div key={platform} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg text-white ${getPlatformColor(platform)}`}>
                        {getPlatformIcon(platform)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{platform}</h3>
                        {isConnected && status ? (
                          <div className="text-sm text-gray-600">
                            <p>@{status.username}</p>
                            <p>フォロワー: {status.followerCount?.toLocaleString() || 0}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">未連携</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {isConnected ? (
                        <button
                          onClick={() => handleDisconnect(platform)}
                          className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          連携解除
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform)}
                          disabled={connecting === platform}
                          className={`px-4 py-2 text-white rounded-lg transition-colors ${
                            connecting === platform
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {connecting === platform ? '接続中...' : '連携する'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* プロファイルページへのリンク */}
          <div className="mt-8 text-center">
            <Link href="/profile" className="text-blue-600 hover:text-blue-700 font-medium">
              プロファイルに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SNSConnect;