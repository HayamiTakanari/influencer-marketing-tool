import React, { useState, useEffect } from 'react';
import { FaYoutube, FaSync, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Button from './shared/Button';
import Card from './shared/Card';
import api from '../services/api';

interface YouTubeAccountManagerProps {
  socialAccountId?: string;
  username?: string;
  onRefresh?: () => void;
}

interface ChannelStats {
  username: string;
  subscriberCount: number;
  engagementRate: number;
  isVerified: boolean;
  lastSynced: string;
}

const YouTubeAccountManager: React.FC<YouTubeAccountManagerProps> = ({
  socialAccountId,
  username,
  onRefresh,
}) => {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (socialAccountId) {
      fetchChannelStats();
    }
  }, [socialAccountId]);

  const fetchChannelStats = async () => {
    if (!socialAccountId) return;

    try {
      setLoading(true);
      const response = await api.get(`/youtube/account/${socialAccountId}/stats`);

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setMessage({
        type: 'error',
        text: 'チャネル情報の取得に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!socialAccountId) return;

    try {
      setSyncing(true);
      setMessage(null);

      const response = await api.post(`/youtube/sync/${socialAccountId}`);

      if (response.data.success) {
        setStats(response.data.data);
        setMessage({
          type: 'success',
          text: 'チャネル情報を更新しました',
        });

        if (onRefresh) {
          onRefresh();
        }
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'チャネル同期に失敗しました',
        });
      }
    } catch (error: any) {
      console.error('Error syncing account:', error);
      setMessage({
        type: 'error',
        text: 'チャネル同期に失敗しました',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!socialAccountId) return;

    if (!confirm('このチャネルを削除してもよろしいですか？')) {
      return;
    }

    try {
      setDeleting(true);
      setMessage(null);

      const response = await api.delete(`/youtube/account/${socialAccountId}`);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'チャネルが削除されました',
        });
        setStats(null);

        if (onRefresh) {
          setTimeout(onRefresh, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setMessage({
        type: 'error',
        text: 'チャネル削除に失敗しました',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!stats) {
    return null;
  }

  return (
    <Card className="border-youtube">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center space-x-3">
          <FaYoutube className="text-2xl text-red-600" />
          <div>
            <h4 className="font-semibold text-gray-800">{stats.username}</h4>
            <p className="text-xs text-gray-500">
              最終更新: {new Date(stats.lastSynced).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
        {expanded ? <FaChevronUp /> : <FaChevronDown />}
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500 mb-1">チャネル登録者数</p>
              <p className="text-lg font-bold text-gray-800">
                {stats.subscriberCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500 mb-1">エンゲージメント率</p>
              <p className="text-lg font-bold text-gray-800">
                {stats.engagementRate.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleSync}
              disabled={syncing || deleting}
              variant="outline"
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <FaSync className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? '更新中...' : '更新'}</span>
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting || syncing}
              className="flex-1 bg-red-500 text-white hover:bg-red-600 flex items-center justify-center space-x-2"
            >
              <FaTrash />
              <span>{deleting ? '削除中...' : '削除'}</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default YouTubeAccountManager;
