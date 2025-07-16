import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
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
      console.error('Error marking notification as read:', err);
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
              <h1 className="text-xl font-bold text-gray-900">通知</h1>
              <p className="text-sm text-gray-600">あなたの通知を確認</p>
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

      <div className="max-w-4xl mx-auto px-4 py-8">
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

        {/* フィルターとアクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'すべて' },
                { value: 'unread', label: '未読のみ' }
              ].map(filterOption => (
                <motion.button
                  key={filterOption.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(filterOption.value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filter === filterOption.value
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </motion.button>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkAllAsRead}
              disabled={processing === 'all'}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {processing === 'all' ? '処理中...' : '全て既読にする'}
            </motion.button>
          </div>
        </motion.div>

        {/* 通知一覧 */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">通知がありません</h3>
              <p className="text-gray-600">新しい通知が届くとここに表示されます。</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`border rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  notification.isRead 
                    ? 'bg-white/80 border-gray-200' 
                    : `${getNotificationColor(notification.type)} border-l-4`
                } ${!notification.isRead ? 'border-l-blue-500' : ''}`}
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        disabled={processing === notification.id}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {processing === notification.id ? '処理中...' : '既読'}
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      disabled={processing === notification.id}
                      className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      削除
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ページネーション */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mt-8"
          >
            <div className="flex items-center justify-between">
              <div className="text-gray-600">
                {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchNotifications(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  前へ
                </motion.button>
                <span className="px-4 py-2 text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchNotifications(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  次へ
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;