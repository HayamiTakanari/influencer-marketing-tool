import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

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
  const [analytics, setAnalytics] = useState<any>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
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
      setUnreadCount((result.notifications || []).filter((n: Notification) => !n.isRead).length);
      
      // 分析データとスマート提案を生成
      generateAnalytics(result.notifications || []);
      generateSmartSuggestions(result.notifications || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('通知の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = (notifications: Notification[]) => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent7Days = notifications.filter(n => new Date(n.createdAt) >= last7Days);
    const recent30Days = notifications.filter(n => new Date(n.createdAt) >= last30Days);

    const typeDistribution = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const readRate = notifications.length > 0 
      ? (notifications.filter(n => n.isRead).length / notifications.length * 100).toFixed(1)
      : '0';

    const avgResponseTime = notifications
      .filter(n => n.isRead && n.readAt)
      .map(n => new Date(n.readAt!).getTime() - new Date(n.createdAt).getTime())
      .reduce((sum, time, _, arr) => sum + (time / arr.length), 0);

    setAnalytics({
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      recent7Days: recent7Days.length,
      recent30Days: recent30Days.length,
      readRate: parseFloat(readRate),
      avgResponseTime: Math.round(avgResponseTime / (1000 * 60 * 60)), // hours
      typeDistribution,
      highPriority: notifications.filter(n => getNotificationPriority(n.type) === 'high').length
    });
  };

  const generateSmartSuggestions = (notifications: Notification[]) => {
    const suggestions = [];
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const highPriorityUnread = unreadNotifications.filter(n => getNotificationPriority(n.type) === 'high');

    if (highPriorityUnread.length > 0) {
      suggestions.push({
        type: 'urgent',
        title: '重要な未読通知があります',
        message: `${highPriorityUnread.length}件の重要な通知を確認してください`,
        action: () => setFilter('unread'),
        icon: '🚨'
      });
    }

    if (unreadNotifications.length > 10) {
      suggestions.push({
        type: 'bulk_action',
        title: '一括処理をお勧めします',
        message: `${unreadNotifications.length}件の未読通知があります。一括で既読にしませんか？`,
        action: handleMarkAllAsRead,
        icon: '📚'
      });
    }

    const applicationNotifications = notifications.filter(n => n.type === 'APPLICATION_RECEIVED' && !n.isRead);
    if (applicationNotifications.length >= 3) {
      suggestions.push({
        type: 'workflow',
        title: '新しい応募が複数あります',
        message: `${applicationNotifications.length}件の応募を確認し、対応を検討してください`,
        action: () => router.push('/applications'),
        icon: '📝'
      });
    }

    const oldUnread = unreadNotifications.filter(n => {
      const days = (Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return days > 7;
    });

    if (oldUnread.length > 0) {
      suggestions.push({
        type: 'maintenance',
        title: '古い未読通知があります',
        message: `1週間以上前の未読通知が${oldUnread.length}件あります`,
        action: () => setFilter('unread'),
        icon: '🗂️'
      });
    }

    setSmartSuggestions(suggestions);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title={
        <span>
          通知
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </span>
      }
      subtitle="あなたの通知を確認"
      userEmail={user?.email}
      onLogout={() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
      }}
      maxWidth="xl"
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
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                icon="📊"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                分析表示
              </Button>
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
          </div>

          {/* 分析セクション */}
          {showAnalytics && analytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 pt-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 通知分析</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{analytics.total}</div>
                  <div className="text-sm text-gray-600">総通知数</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">{analytics.unread}</div>
                  <div className="text-sm text-gray-600">未読数</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{analytics.readRate}%</div>
                  <div className="text-sm text-gray-600">既読率</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{analytics.avgResponseTime}h</div>
                  <div className="text-sm text-gray-600">平均応答時間</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">期間別統計</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">過去7日</span>
                      <span className="font-semibold">{analytics.recent7Days}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">過去30日</span>
                      <span className="font-semibold">{analytics.recent30Days}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">重要通知</span>
                      <span className="font-semibold text-red-600">{analytics.highPriority}件</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">通知タイプ別</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.typeDistribution).slice(0, 5).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-gray-600 flex items-center">
                          {getNotificationIcon(type)} 
                          <span className="ml-2 text-xs">{type.replace('_', ' ')}</span>
                        </span>
                        <span className="font-semibold">{count as number}件</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </Card>

        {/* スマート提案 */}
        {smartSuggestions.length > 0 && (
          <Card className="mb-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🤖 スマート提案
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smartSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-md border border-yellow-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{suggestion.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{suggestion.message}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={suggestion.action}
                          className="bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          実行
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

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
    </PageLayout>
  );
};

export default NotificationsPage;