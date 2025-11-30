import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
  readAt?: string;
}

const NotificationsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const router = useRouter();
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchNotifications();
    } else {
      router.push('/login');
    }
  }, [router, filter]);

  const fetchNotifications = async (page: number = 1) => {
    try {
      const { getNotifications } = await import('../services/api');
      const result = await getNotifications(page, 20, filter === 'unread');
      setNotifications(result.notifications || []);
      setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      setUnreadCount((result.notifications || []).filter((n: Notification) => !n.isRead).length);
    } catch (err: any) {
      handleError(err, '通知の取得');
      setError('通知の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };


  const handleMarkAsRead = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      const { markNotificationAsRead } = await import('../services/api');
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
    } catch (err: any) {
      handleError(err, '通知の既読化');
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!confirm('すべての通知を既読にしますか？')) return;
    
    setProcessing('all');
    try {
      const { markAllNotificationsAsRead } = await import('../services/api');
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ 
        ...n, 
        isRead: true, 
        readAt: new Date().toISOString() 
      })));
      alert('すべての通知を既読にしました。');
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      alert('既読処理に失敗しました。');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('この通知を削除しますか？')) return;
    
    setProcessing(notificationId);
    try {
      const { deleteNotification } = await import('../services/api');
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      alert('通知の削除に失敗しました。');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      APPLICATION_RECEIVED: '📝',
      APPLICATION_ACCEPTED: '✅',
      APPLICATION_REJECTED: '❌',
      PROJECT_MATCHED: '🤝',
      MESSAGE_RECEIVED: '💬',
      PAYMENT_COMPLETED: '💰',
      PROJECT_STATUS_CHANGED: '🔄',
      TEAM_INVITATION: '👥',
      SYSTEM_ANNOUNCEMENT: '📢',
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      APPLICATION_RECEIVED: 'border-blue-200 bg-blue-50/50',
      APPLICATION_ACCEPTED: 'border-green-200 bg-green-50/50',
      APPLICATION_REJECTED: 'border-red-200 bg-red-50/50',
      PROJECT_MATCHED: 'border-purple-200 bg-purple-50/50',
      MESSAGE_RECEIVED: 'border-indigo-200 bg-indigo-50/50',
      PAYMENT_COMPLETED: 'border-emerald-200 bg-emerald-50/50',
      PROJECT_STATUS_CHANGED: 'border-orange-200 bg-orange-50/50',
      TEAM_INVITATION: 'border-cyan-200 bg-cyan-50/50',
      SYSTEM_ANNOUNCEMENT: 'border-yellow-200 bg-yellow-50/50',
    };
    return colors[type as keyof typeof colors] || 'border-gray-200 bg-gray-50/50';
  };

  const getNotificationPriority = (type: string): 'high' | 'medium' | 'low' => {
    const highPriority = ['APPLICATION_ACCEPTED', 'PAYMENT_COMPLETED', 'PROJECT_MATCHED'];
    const mediumPriority = ['APPLICATION_RECEIVED', 'MESSAGE_RECEIVED', 'TEAM_INVITATION'];
    
    if (highPriority.includes(type)) return 'high';
    if (mediumPriority.includes(type)) return 'medium';
    return 'low';
  };

  const getPriorityBadge = (type: string) => {
    const priority = getNotificationPriority(type);
    const badges = {
      high: { text: '重要', className: 'bg-red-100 text-red-700' },
      medium: { text: '普通', className: 'bg-yellow-100 text-yellow-700' },
      low: { text: '低', className: 'bg-gray-100 text-gray-700' }
    };
    return badges[priority];
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to relevant page based on notification data
    if (notification.data) {
      if (notification.data.projectId) {
        router.push(`/projects/${notification.data.projectId}`);
      } else if (notification.data.applicationId) {
        router.push('/applications');
      } else if (notification.data.teamId) {
        router.push('/team-management');
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="通知" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`通知${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
      subtitle="あなたの通知を確認"
    >
        {/* エラーメッセージ */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <div className="text-red-700">
              {error}
            </div>
          </Card>
        )}

        {/* フィルターとアクション */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'すべて' },
                { value: 'unread', label: '未読のみ' }
              ].map(filterOption => (
                <Button
                  key={filterOption.value}
                  variant={filter === filterOption.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter(filterOption.value)}
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={processing === 'all'}
              loading={processing === 'all'}
            >
              全て既読にする
            </Button>
          </div>

        </Card>


        {/* 通知一覧 */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <EmptyState
              icon="🔔"
              title="通知がありません"
              description="新しい通知が届くとここに表示されます。"
            />
          ) : (
            notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`border rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  notification.isRead 
                    ? 'bg-white/80 border-gray-200' 
                    : `${getNotificationColor(notification.type)} border-l-4`
                } ${!notification.isRead ? (
                  getNotificationPriority(notification.type) === 'high' 
                    ? 'border-l-red-500' 
                    : getNotificationPriority(notification.type) === 'medium'
                    ? 'border-l-yellow-500'
                    : 'border-l-gray-400'
                ) : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-bold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(notification.type).className}`}>
                          {getPriorityBadge(notification.type).text}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      <div className="text-sm text-gray-500">
                        {formatDate(notification.createdAt)}
                        {notification.readAt && (
                          <span className="ml-2">• 既読: {formatDate(notification.readAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        disabled={processing === notification.id}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {processing === notification.id ? '処理中...' : '既読'}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      disabled={processing === notification.id}
                      className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ページネーション */}
        {pagination.totalPages > 1 && (
          <Card className="mt-8">
            <div className="flex items-center justify-between">
              <div className="text-gray-600">
                {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNotifications(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  前へ
                </Button>
                <span className="px-4 py-2 text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNotifications(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  次へ
                </Button>
              </div>
            </div>
          </Card>
        )}
    </DashboardLayout>
  );
};

export default NotificationsPage;