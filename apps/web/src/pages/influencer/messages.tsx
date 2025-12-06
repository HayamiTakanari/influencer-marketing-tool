import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import LoadingState from '../../components/common/LoadingState';
import { MdSend } from 'react-icons/md';

interface Chat {
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

interface Message {
  id: string;
  projectId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    role: string;
  };
}

const InfluencerMessagesPage: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchChats();
  }, [router]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchMessages(selectedProjectId);
      // Poll for new messages every 2 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedProjectId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedProjectId]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/chat/chats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(Array.isArray(data) ? data : []);
        setError('');
        // Auto-select first chat if available
        if (Array.isArray(data) && data.length > 0) {
          setSelectedProjectId(data[0].projectId);
        }
      } else {
        setError('チャット一覧の取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('チャット一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (projectId: string) => {
    try {
      setMessageLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/chat/messages/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);

        // Mark messages as read
        await fetch(`http://localhost:3001/api/chat/messages/${projectId}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedProjectId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          content: messageText
        })
      });

      if (response.ok) {
        setMessageText('');
        await fetchMessages(selectedProjectId);
        await fetchChats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'メッセージの送信に失敗しました');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('メッセージの送信に失敗しました');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="メッセージ" subtitle="企業とのメッセージを管理">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="メッセージ"
      subtitle="企業とのメッセージを管理"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-250px)]">
        {/* チャットリスト */}
        <div className="md:col-span-1">
          <Card className="overflow-y-auto h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">会話一覧</h3>

            {chats.length > 0 ? (
              <div className="space-y-2">
                {chats.map((chat) => (
                  <button
                    key={chat.projectId}
                    onClick={() => setSelectedProjectId(chat.projectId)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedProjectId === chat.projectId
                        ? 'bg-emerald-50 border-l-4 border-emerald-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {chat.projectTitle}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {chat.sender.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {chat.lastMessage || 'メッセージはまだありません'}
                        </p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(chat.lastMessageTime).toLocaleString('ja-JP')}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">会話がまだありません</p>
              </div>
            )}
          </Card>
        </div>

        {/* メッセージエリア */}
        <div className="md:col-span-2">
          {selectedProjectId ? (
            <Card className="flex flex-col h-full">
              {/* メッセージ表示エリア */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === localStorage.getItem('userId') ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderId === localStorage.getItem('userId')
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.senderId === localStorage.getItem('userId')
                              ? 'text-emerald-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    メッセージはまだありません
                  </div>
                )}
              </div>

              {/* メッセージ入力フォーム */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={messageLoading}
                />
                <button
                  type="submit"
                  disabled={messageLoading || !messageText.trim()}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <MdSend className="text-lg" />
                </button>
              </form>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-full">
              <p className="text-gray-500">会話を選択してください</p>
            </Card>
          )}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 max-w-md">
          {error}
        </div>
      )}
    </DashboardLayout>
  );
};

export default InfluencerMessagesPage;
