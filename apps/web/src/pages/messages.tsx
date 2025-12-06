import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface Message {
  id: string;
  projectId: string;
  projectTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  sender: {
    name: string;
    role: string;
  };
}

const MessagesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchMessages();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiBaseUrl}/chat/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data);
      setError('');
    } catch (err: any) {
      handleError(err, 'メッセージの取得');
      setError('メッセージの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨日';
    } else if (days < 7) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="メッセージ" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="メッセージ"
      subtitle="プロジェクトに関するメッセージを確認しよう"
    >
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <Card>
        {messages.length === 0 ? (
          <EmptyState
            icon="💬"
            title="メッセージがありません"
            description="プロジェクトが開始されると、ここにメッセージが表示されます。"
          />
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <Link
                key={message.id}
                href={`/project-chat/${message.projectId}`}
                className="block"
              >
                <div className="p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{message.projectTitle}</h3>
                    <div className="flex items-center space-x-2">
                      {message.unreadCount > 0 && (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {message.unreadCount}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatTime(message.lastMessageTime)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 text-sm truncate flex-1 mr-4">
                      <span className="font-medium">{message.sender.name}:</span> {message.lastMessage}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default MessagesPage;
