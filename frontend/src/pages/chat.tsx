import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

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

interface Project {
  id: string;
  title: string;
  status: string;
  client?: {
    user: {
      id: string;
      email: string;
    };
    companyName: string;
  };
  matchedInfluencer?: {
    user: {
      id: string;
      email: string;
    };
    displayName: string;
  };
  messages: Message[];
  unreadCount: number;
}

const ChatPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [chatList, setChatList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Initialize Socket.io connection
      const socketConnection = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002', {
        auth: {
          token: token
        }
      });

      setSocket(socketConnection);

      // Socket event handlers
      socketConnection.on('connect', () => {
        console.log('Connected to WebSocket');
        socketConnection.emit('user-online');
      });

      socketConnection.on('new-message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        
        // Update chat list with new message
        setChatList(prev => prev.map(chat => 
          chat.id === message.projectId 
            ? { ...chat, messages: [message], unreadCount: chat.unreadCount + 1 }
            : chat
        ));
      });

      socketConnection.on('user-typing', ({ userId, projectId }: { userId: string; projectId: string }) => {
        if (selectedProject?.id === projectId && userId !== parsedUser.id) {
          setOtherUserTyping(true);
        }
      });

      socketConnection.on('user-stop-typing', ({ userId, projectId }: { userId: string; projectId: string }) => {
        if (selectedProject?.id === projectId && userId !== parsedUser.id) {
          setOtherUserTyping(false);
        }
      });

      socketConnection.on('messages-read', ({ projectId, readBy }: { projectId: string; readBy: string }) => {
        if (selectedProject?.id === projectId) {
          setMessages(prev => prev.map(msg => 
            msg.senderId === parsedUser.id ? { ...msg, isRead: true } : msg
          ));
        }
      });

      socketConnection.on('user-status', ({ userId, status }: { userId: string; status: string }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (status === 'online') {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      });

      socketConnection.on('error', (error: any) => {
        console.error('Socket error:', error);
        setError(error.message);
      });

      fetchChatList();
    } else {
      router.push('/login');
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/chat/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat list');
      }

      const data = await response.json();
      setChatList(data);
    } catch (err: any) {
      console.error('Error fetching chat list:', err);
      setError('チャット一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/chat/messages/${projectId}`, {
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

      // Mark messages as read
      if (socket) {
        socket.emit('mark-messages-read', projectId);
      }

      // Update unread count in chat list
      setChatList(prev => prev.map(chat => 
        chat.id === projectId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError('メッセージの取得に失敗しました。');
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    fetchMessages(project.id);
    
    if (socket) {
      socket.emit('join-project', project.id);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProject || !socket) return;

    const messageData = {
      projectId: selectedProject.id,
      content: newMessage.trim()
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
    setIsTyping(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && socket && selectedProject) {
      setIsTyping(true);
      socket.emit('typing-start', selectedProject.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedProject) {
        socket.emit('typing-stop', selectedProject.id);
        setIsTyping(false);
      }
    }, 1000);
  };

  const getOtherUser = (project: Project) => {
    if (user?.role === 'CLIENT') {
      return project.matchedInfluencer;
    } else {
      return project.client;
    }
  };

  const getOtherUserName = (project: Project) => {
    const otherUser = getOtherUser(project);
    if (user?.role === 'CLIENT') {
      return otherUser?.displayName || 'インフルエンサー';
    } else {
      return otherUser?.companyName || '企業';
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `${days}日前`;
    } else if (hours > 0) {
      return `${hours}時間前`;
    } else if (minutes > 0) {
      return `${minutes}分前`;
    } else {
      return 'たった今';
    }
  };

  const isOtherUserOnline = (project: Project) => {
    const otherUser = getOtherUser(project);
    return otherUser && onlineUsers.has(otherUser.user.id);
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
              <h1 className="text-xl font-bold text-gray-900">チャット</h1>
              <p className="text-sm text-gray-600">プロジェクトメンバーとの会話</p>
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

      {/* エラーメッセージ */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 py-2"
        >
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex h-[600px] bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
          {/* チャット一覧 */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">チャット一覧</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chatList.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">💬</div>
                  <p>チャットがありません</p>
                </div>
              ) : (
                chatList.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ backgroundColor: '#f8fafc' }}
                    onClick={() => handleProjectSelect(project)}
                    className={`p-4 cursor-pointer border-b border-gray-100 ${
                      selectedProject?.id === project.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {getOtherUserName(project).charAt(0)}
                            </span>
                          </div>
                          {isOtherUserOnline(project) && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {getOtherUserName(project)}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{project.title}</p>
                        </div>
                      </div>
                      {project.unreadCount > 0 && (
                        <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {project.unreadCount}
                        </div>
                      )}
                    </div>
                    {project.messages.length > 0 && (
                      <div className="text-sm text-gray-600 truncate">
                        {project.messages[0].content}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* チャット画面 */}
          <div className="flex-1 flex flex-col">
            {selectedProject ? (
              <>
                {/* チャットヘッダー */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {getOtherUserName(selectedProject).charAt(0)}
                        </span>
                      </div>
                      {isOtherUserOnline(selectedProject) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getOtherUserName(selectedProject)}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedProject.title}</p>
                    </div>
                  </div>
                </div>

                {/* メッセージ一覧 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.senderId === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1 text-xs opacity-75">
                          <span>{formatMessageTime(message.createdAt)}</span>
                          {message.senderId === user?.id && (
                            <span>{message.isRead ? '既読' : '未読'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* タイピングインジケーター */}
                  {otherUserTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* メッセージ入力 */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="メッセージを入力..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      送信
                    </motion.button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">チャットを選択してください</h3>
                  <p>左側のリストからチャットを選んで会話を始めましょう</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;