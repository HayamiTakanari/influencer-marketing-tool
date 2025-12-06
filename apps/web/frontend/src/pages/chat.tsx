import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  sender: {
    id: string;
    role: string;
  };
}

interface ChatItem {
  id: string;
  title: string;
  participant: {
    id: string;
    displayName: string;
    role: string;
  };
  messages: Message[];
  unreadCount: number;
  lastMessageAt: string;
  isOnline?: boolean;
}

const ChatPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // サンプルチャットデータを設定
    const sampleChats: ChatItem[] = [
      {
        id: '1',
        title: 'プロジェクト: 新商品PR',
        participant: {
          id: '2',
          displayName: '田中美咲',
          role: 'INFLUENCER'
        },
        messages: [
          {
            id: '1',
            content: 'こんにちは！プロジェクトの件でお話しさせていただきたいです。',
            createdAt: new Date().toISOString(),
            senderId: '2',
            receiverId: parsedUser.id,
            isRead: false,
            sender: { id: '2', role: 'INFLUENCER' }
          }
        ],
        unreadCount: 1,
        lastMessageAt: new Date().toISOString(),
        isOnline: true
      },
      {
        id: '2',
        title: 'コラボレーション相談',
        participant: {
          id: '3',
          displayName: '株式会社サンプル',
          role: "COMPANY"
        },
        messages: [
          {
            id: '2',
            content: '来月のキャンペーンについて詳細を相談したいです。',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            senderId: '3',
            receiverId: parsedUser.id,
            isRead: true,
            sender: { id: '3', role: "COMPANY" }
          }
        ],
        unreadCount: 0,
        lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
        isOnline: false
      }
    ];

    setChats(sampleChats);
    setLoading(false);
  }, [router]);

  const handleChatSelect = (chat: ChatItem) => {
    setSelectedChat(chat);
    setMessages(chat.messages);
    // 未読メッセージを既読にする
    setChats(prev => 
      prev.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      receiverId: selectedChat.participant.id,
      isRead: false,
      sender: { id: user.id, role: user.role }
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // チャットリストを更新
    setChats(prev => 
      prev.map(c => 
        c.id === selectedChat.id 
          ? { ...c, messages: [...c.messages, message], lastMessageAt: message.createdAt }
          : c
      )
    );

    // 自動スクロール
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!user) return null;

  return (
    <DashboardLayout
      title="メッセージ"
      subtitle="プロジェクトやコラボレーションについてやり取りしましょう"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)]">
        {/* チャットリスト */}
        <div className="lg:col-span-4">
          <Card className="h-full" padding="md">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-3">💬</span>
              チャット一覧
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedChat?.id === chat.id
                        ? 'bg-emerald-50 border-2 border-emerald-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {chat.participant.displayName.charAt(0)}
                          </div>
                          {chat.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {chat.participant.displayName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {chat.participant.role === 'INFLUENCER' ? 'インフルエンサー' : '企業'}
                          </p>
                        </div>
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {chat.messages[chat.messages.length - 1]?.content || 'メッセージなし'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(chat.lastMessageAt).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {chats.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💭</div>
                <p className="text-gray-600">まだチャットがありません</p>
              </div>
            )}
          </Card>
        </div>

        {/* チャット画面 */}
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col" padding="sm">
            {selectedChat ? (
              <>
                {/* チャットヘッダー */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {selectedChat.participant.displayName.charAt(0)}
                      </div>
                      {selectedChat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedChat.participant.displayName}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedChat.isOnline ? 'オンライン' : '最終ログイン: 1時間前'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* メッセージエリア */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.senderId === user.id
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderId === user.id ? 'text-emerald-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* メッセージ入力エリア */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="メッセージを入力..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      variant="primary"
                      size="md"
                      icon={<span>📤</span>}
                    >
                      送信
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">チャットを選択してください</h3>
                  <p className="text-gray-600">
                    左側のリストからチャットを選んでメッセージを開始しましょう
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;