import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingState from '../../components/common/LoadingState';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import Link from 'next/link';

interface WatchlistItem {
  id: string;
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    targetPlatforms: string[];
    targetPrefecture: string;
    status: string;
    startDate: string;
    endDate: string;
    isPublic: boolean;
  };
  notes?: string;
  savedAt: string;
}

const WatchlistPage: React.FC = () => {
  const router = useRouter();
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await api.get('/watchlist');
      setWatchlists(response.data.watchlists);
    } catch (error) {
      handleError(error, 'ウォッチリストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (watchlistId: string) => {
    if (!window.confirm('このプロジェクトをウォッチリストから削除しますか？')) {
      return;
    }

    setDeleting(watchlistId);
    try {
      await api.delete(`/watchlist/${watchlistId}`);
      setWatchlists(watchlists.filter(w => w.id !== watchlistId));
      handleSuccess('ウォッチリストから削除しました');
    } catch (error) {
      handleError(error, '削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditNotes = async (watchlistId: string) => {
    try {
      await api.put(`/watchlist/${watchlistId}/notes`, { notes: editNotes });
      setWatchlists(
        watchlists.map(w =>
          w.id === watchlistId ? { ...w, notes: editNotes } : w
        )
      );
      setEditing(null);
      handleSuccess('メモを更新しました');
    } catch (error) {
      handleError(error, 'メモの更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="ウォッチリスト" subtitle="保存したプロジェクト">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="ウォッチリスト" subtitle="保存したプロジェクト">
      <div className="space-y-4">
        {watchlists.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">保存したプロジェクトはまだありません</p>
              <Link href="/influencer/opportunities">
                <Button variant="primary">プロジェクトを探す</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-2">
              全 {watchlists.length} 件のプロジェクト
            </div>
            {watchlists.map(watchlist => (
              <Card key={watchlist.id}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <Link href={`/influencer/opportunities/${watchlist.project.id}`}>
                      <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                        {watchlist.project.title}
                      </h3>
                    </Link>

                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">予算</label>
                        <p className="font-medium">
                          ¥{watchlist.project.budget.toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600">カテゴリー</label>
                        <p className="font-medium">{watchlist.project.category}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">ステータス</label>
                        <p className="font-medium">{watchlist.project.status}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">保存日</label>
                        <p className="font-medium">
                          {new Date(watchlist.savedAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-sm">
                      <label className="text-gray-600">プラットフォーム</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {watchlist.project.targetPlatforms.map(platform => (
                          <span
                            key={platform}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      {editing === watchlist.id ? (
                        <div className="space-y-2">
                          <label className="block text-sm text-gray-700">メモ</label>
                          <textarea
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            rows={2}
                            placeholder="メモを入力..."
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleEditNotes(watchlist.id)}
                            >
                              保存
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditing(null)}
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-sm text-gray-600">メモ</label>
                          {watchlist.notes ? (
                            <p className="mt-1 text-gray-700">{watchlist.notes}</p>
                          ) : (
                            <p className="mt-1 text-gray-500 italic">メモはまだありません</p>
                          )}
                          <button
                            onClick={() => {
                              setEditing(watchlist.id);
                              setEditNotes(watchlist.notes || '');
                            }}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            {watchlist.notes ? '編集' : 'メモを追加'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/influencer/opportunities/${watchlist.project.id}`}>
                      <Button variant="primary" size="sm">
                        詳細を見る
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemove(watchlist.id)}
                      loading={deleting === watchlist.id}
                      disabled={deleting === watchlist.id}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WatchlistPage;
