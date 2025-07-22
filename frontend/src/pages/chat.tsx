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
  isProjectChat?: boolean; // プロジェクト関連のチャットかどうか
  chatType?: 'project' | 'general' | 'support'; // チャットの種類
}

// 一般チャット用のインターフェース
interface GeneralChat {
  id: string;
  title: string;
  participant: {
    id: string;
    displayName: string;
    role: string;
  };
  messages: Message[];
  unreadCount: number;
  chatType: 'general' | 'support';
  lastMessageAt: string;
}

const ChatPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [projectChats, setProjectChats] = useState<Project[]>([]);
  const [generalChats, setGeneralChats] = useState<GeneralChat[]>([]);
  const [activeTab, setActiveTab] = useState<'project' | 'general'>('project');
  const [selectedChat, setSelectedChat] = useState<Project | GeneralChat | null>(null);
// 削除されたため、selectedChatに統一
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
      const socketConnection = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000', {
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
        setProjectChats(prev => prev.map(chat => 
          chat.id === message.projectId 
            ? { ...chat, messages: [message], unreadCount: chat.unreadCount + 1 }
            : chat
        ));
        setGeneralChats(prev => prev.map(chat => 
          chat.id === message.projectId 
            ? { ...chat, messages: [message], unreadCount: chat.unreadCount + 1 }
            : chat
        ));
      });

      socketConnection.on('user-typing', ({ userId, projectId }: { userId: string; projectId: string }) => {
        if (selectedChat?.id === projectId && userId !== parsedUser.id) {
          setOtherUserTyping(true);
        }
      });

      socketConnection.on('user-stop-typing', ({ userId, projectId }: { userId: string; projectId: string }) => {
        if (selectedChat?.id === projectId && userId !== parsedUser.id) {
          setOtherUserTyping(false);
        }
      });

      socketConnection.on('messages-read', ({ projectId, readBy }: { projectId: string; readBy: string }) => {
        if (selectedChat?.id === projectId) {
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
  
  // プロジェクトチャットが読み込まれた後、URLパラメーターで指定されたプロジェクトを選択
  useEffect(() => {
    const projectId = router.query.project as string;
    if (projectId && projectChats.length > 0 && !selectedChat) {
      const targetProject = projectChats.find(project => project.id === projectId);
      if (targetProject) {
        setActiveTab('project');
        handleChatSelect(targetProject);
      }
    }
  }, [projectChats, router.query.project, selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatList = async () => {
    try {
      // Vercel環境用のモックデータ
      if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
        console.log('Using mock chat list for Vercel environment');
        
        // プロジェクト関連チャット
        const mockProjectChats: Project[] = [
          {
            id: 'project-1',
            title: '新商品コスメのPRキャンペーン',
            status: 'IN_PROGRESS',
            isProjectChat: true,
            chatType: 'project',
            client: {
              user: {
                id: 'client1',
                email: 'client@beauty.com'
              },
              companyName: '株式会社ビューティコスメ'
            },
            matchedInfluencer: {
              user: {
                id: 'inf1',
                email: 'tanaka@example.com'
              },
              displayName: '田中美咲'
            },
            messages: [
              {
                id: 'msg1',
                content: 'プロジェクトに参加させていただきありがとうございます！',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                senderId: 'inf1',
                receiverId: 'client1',
                isRead: true,
                sender: {
                  id: 'inf1',
                  role: 'INFLUENCER'
                }
              }
            ],
            unreadCount: 0
          },
          {
            id: 'project-2',
            title: 'ライフスタイル商品のレビュー',
            status: 'IN_PROGRESS',
            isProjectChat: true,
            chatType: 'project',
            client: {
              user: {
                id: 'client2',
                email: 'client@lifestyle.com'
              },
              companyName: 'ライフスタイル株式会社'
            },
            matchedInfluencer: {
              user: {
                id: 'inf2',
                email: 'suzuki@example.com'
              },
              displayName: '鈴木さやか'
            },
            messages: [
              {
                id: 'msg2',
                content: '商品サンプルはいつ頃届きますでしょうか？',
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                senderId: 'inf2',
                receiverId: 'client2',
                isRead: false,
                sender: {
                  id: 'inf2',
                  role: 'INFLUENCER'
                }
              }
            ],
            unreadCount: 1
          },
          {
            id: 'project-3',
            title: 'フィットネス用品のプロモーション',
            status: 'MATCHED',
            isProjectChat: true,
            chatType: 'project',
            client: {
              user: {
                id: 'client3',
                email: 'client@fitness.com'
              },
              companyName: 'フィットネスライフ株式会社'
            },
            matchedInfluencer: {
              user: {
                id: 'inf3',
                email: 'yamamoto@example.com'
              },
              displayName: '山本健太'
            },
            messages: [
              {
                id: 'msg3',
                content: 'よろしくお願いします！フィットネス系は得意です。',
                createdAt: new Date(Date.now() - 1800000).toISOString(),
                senderId: 'inf3',
                receiverId: 'client3',
                isRead: true,
                sender: {
                  id: 'inf3',
                  role: 'INFLUENCER'
                }
              }
            ],
            unreadCount: 0
          }
        ];
        
        // 一般チャット（プロジェクト以外）
        const mockGeneralChats: GeneralChat[] = [
          {
            id: 'general-1',
            title: 'ビジネス相談',
            chatType: 'general',
            lastMessageAt: new Date(Date.now() - 5400000).toISOString(),
            participant: {
              id: 'user1',
              displayName: '佐藤明美',
              role: 'CLIENT'
            },
            messages: [
              {
                id: 'general-msg1',
                content: '今度新しいプロジェクトの相談をさせていただきたいのですが...',
                createdAt: new Date(Date.now() - 5400000).toISOString(),
                senderId: 'user1',
                receiverId: 'current-user',
                isRead: false,
                sender: {
                  id: 'user1',
                  role: 'CLIENT'
                }
              }
            ],
            unreadCount: 1
          },
          {
            id: 'general-2',
            title: 'コラボのお話',
            chatType: 'general',
            lastMessageAt: new Date(Date.now() - 10800000).toISOString(),
            participant: {
              id: 'user2',
              displayName: '高橋美結',
              role: 'INFLUENCER'
            },
            messages: [
              {
                id: 'general-msg2',
                content: '今度一緒にコラボしませんか？',
                createdAt: new Date(Date.now() - 10800000).toISOString(),
                senderId: 'user2',
                receiverId: 'current-user',
                isRead: true,
                sender: {
                  id: 'user2',
                  role: 'INFLUENCER'
                }
              }
            ],
            unreadCount: 0
          },
          {
            id: 'support-1',
            title: 'サポートチーム',
            chatType: 'support',
            lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
            participant: {
              id: 'support',
              displayName: 'カスタマーサポート',
              role: 'SUPPORT'
            },
            messages: [
              {
                id: 'support-msg1',
                content: 'いつもご利用いただきありがとうございます。ご不明な点がございましたらお気軽にお声かけください。',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                senderId: 'support',
                receiverId: 'current-user',
                isRead: true,
                sender: {
                  id: 'support',
                  role: 'SUPPORT'
                }
              }
            ],
            unreadCount: 0
          }
        ];
        
        setProjectChats(mockProjectChats);
        setGeneralChats(mockGeneralChats);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000'}/api/chat/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat list');
      }

      const data = await response.json();
      // プロジェクトチャットと一般チャットを分離
      const projects = data.filter((chat: any) => chat.isProjectChat || chat.chatType === 'project');
      const generals = data.filter((chat: any) => !chat.isProjectChat && chat.chatType !== 'project');
      setProjectChats(projects);
      setGeneralChats(generals);
    } catch (err: any) {
      console.error('Error fetching chat list:', err);
      setError('チャット一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (projectId: string) => {
    try {
      // Vercel環境用のモックデータ
      if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
        console.log('Using mock messages for Vercel environment, projectId:', projectId);
        
        const mockMessagesData: Record<string, Message[]> = {
          '1': [
            {
              id: 'msg1-1',
              content: 'プロジェクトに参加させていただきありがとうございます！',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              senderId: 'inf1',
              receiverId: 'current-user',
              isRead: true,
              sender: {
                id: 'inf1',
                role: 'INFLUENCER'
              }
            },
            {
              id: 'msg1-2',
              content: 'こちらこそよろしくお願いします。まずは商品について詳しく教えてください。',
              createdAt: new Date(Date.now() - 3000000).toISOString(),
              senderId: 'current-user',
              receiverId: 'inf1',
              isRead: true,
              sender: {
                id: 'current-user',
                role: 'COMPANY'
              }
            },
            {
              id: 'msg1-3',
              content: '新商品のファンデーションは自然な仕上がりが特徴で、20-30代の女性に人気です。来週サンプルをお送りします。',
              createdAt: new Date(Date.now() - 1800000).toISOString(),
              senderId: 'current-user',
              receiverId: 'inf1',
              isRead: true,
              sender: {
                id: 'current-user',
                role: 'COMPANY'
              }
            }
          ],
          '2': [
            {
              id: 'msg2-1',
              content: 'ライフスタイル商品のレビューは得意分野です。どのような商品でしょうか？',
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              senderId: 'inf2',
              receiverId: 'current-user',
              isRead: true,
              sender: {
                id: 'inf2',
                role: 'INFLUENCER'
              }
            },
            {
              id: 'msg2-2',
              content: '商品サンプルはいつ頃届きますでしょうか？',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              senderId: 'inf2',
              receiverId: 'current-user',
              isRead: false,
              sender: {
                id: 'inf2',
                role: 'INFLUENCER'
              }
            }
          ]
        };
        
        const messages = mockMessagesData[projectId] || [];
        setMessages(messages);
        
        // Update unread count in chat list
        setProjectChats(prev => prev.map(chat => 
          chat.id === projectId ? { ...chat, unreadCount: 0 } : chat
        ));
        setGeneralChats(prev => prev.map(chat => 
          chat.id === projectId ? { ...chat, unreadCount: 0 } : chat
        ));
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000'}/api/chat/messages/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      // バックエンドからのレスポンス構造に応じて調整
      setMessages(data.messages || data);

      // Mark messages as read
      if (socket) {
        socket.emit('mark-messages-read', projectId);
      }

      // Update unread count in chat list
      setProjectChats(prev => prev.map(chat => 
        chat.id === projectId ? { ...chat, unreadCount: 0 } : chat
      ));
      setGeneralChats(prev => prev.map(chat => 
        chat.id === projectId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError('メッセージの取得に失敗しました。');
    }
  };

  const handleChatSelect = (chat: Project | GeneralChat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
    
    if (socket) {
      socket.emit('join-project', chat.id);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    // Vercel環境用のモック処理
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      console.log('Using mock send message for Vercel environment');
      const newMsg: Message = {
        id: 'msg-' + Date.now(),
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        senderId: 'current-user',
        receiverId: 'matchedInfluencer' in selectedChat ? selectedChat.matchedInfluencer?.user.id || 'other-user' : 'participant' in selectedChat ? selectedChat.participant.id : 'other-user',
        isRead: false,
        sender: {
          id: 'current-user',
          role: 'COMPANY'
        }
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setIsTyping(false);
      return;
    }

    if (!socket) return;

    const messageData = {
      projectId: selectedChat.id,
      content: newMessage.trim()
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
    setIsTyping(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && socket && selectedChat) {
      setIsTyping(true);
      socket.emit('typing-start', selectedChat.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedChat) {
        socket.emit('typing-stop', selectedChat.id);
        setIsTyping(false);
      }
    }, 1000);
  };

  // 使用しないため削除

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

  // 使用しないため削除

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
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">ダッシュボードに戻る</span>
            </button>
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
            {/* タブヘッダー */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('project')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'project'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🏢 プロジェクトチャット
                  {projectChats.reduce((sum, chat) => sum + chat.unreadCount, 0) > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {projectChats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'general'
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  💬 その他のチャット
                  {generalChats.reduce((sum, chat) => sum + chat.unreadCount, 0) > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {generalChats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* チャット一覧内容 */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'project' ? (
                projectChats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">🏢</div>
                    <p className="font-medium mb-2">プロジェクトチャットがありません</p>
                    <p className="text-sm">プロジェクトでマッチングされると<br />ここにチャットが表示されます</p>
                  </div>
                ) : (
                  projectChats.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ backgroundColor: '#f8fafc' }}
                      onClick={() => handleChatSelect(project)}
                      className={`p-4 cursor-pointer border-b border-gray-100 ${
                        selectedChat?.id === project.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                🏢
                              </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-white text-xs">P</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">
                              {project.title}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {user?.role === 'CLIENT' ? project.matchedInfluencer?.displayName : project.client?.companyName}
                            </p>
                          </div>
                        </div>
                        {project.unreadCount > 0 && (
                          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {project.unreadCount}
                          </div>
                        )}
                      </div>
                      {project.messages.length > 0 && (
                        <div className="text-sm text-gray-600 truncate ml-13">
                          {project.messages[0].content}
                        </div>
                      )}
                    </motion.div>
                  ))
                )
              ) : (
                generalChats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <p className="font-medium mb-2">その他のチャットがありません</p>
                    <p className="text-sm">一般的な相談や<br />サポートチャットが表示されます</p>
                  </div>
                ) : (
                  generalChats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      whileHover={{ backgroundColor: '#f8fafc' }}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-4 cursor-pointer border-b border-gray-100 ${
                        selectedChat?.id === chat.id ? 'bg-purple-50 border-purple-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              chat.chatType === 'support' 
                                ? 'bg-gradient-to-r from-green-500 to-blue-500'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {chat.chatType === 'support' ? '🎧' : chat.participant.displayName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">
                              {chat.title}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {chat.participant.displayName} • {chat.chatType === 'support' ? 'サポート' : 'ユーザー'}
                            </p>
                          </div>
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                      {chat.messages.length > 0 && (
                        <div className="text-sm text-gray-600 truncate ml-13">
                          {chat.messages[0].content}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 ml-13">
                        {formatMessageTime(chat.lastMessageAt)}
                      </div>
                    </motion.div>
                  ))
                )
              )}
            </div>
          </div>

          {/* チャット画面 */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* チャットヘッダー */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {'matchedInfluencer' in selectedChat ? (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">🏢</span>
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedChat.chatType === 'support' 
                              ? 'bg-gradient-to-r from-green-500 to-blue-500'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}>
                            <span className="text-white font-bold text-sm">
                              {selectedChat.chatType === 'support' ? '🎧' : selectedChat.participant.displayName.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {'matchedInfluencer' in selectedChat ? (
                            selectedChat.title
                          ) : (
                            selectedChat.title
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {'matchedInfluencer' in selectedChat ? (
                            `${user?.role === 'CLIENT' ? selectedChat.matchedInfluencer?.displayName : selectedChat.client?.companyName} • プロジェクト`
                          ) : (
                            `${selectedChat.participant.displayName} • ${selectedChat.chatType === 'support' ? 'サポートチーム' : '個人チャット'}`
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* プロジェクトチャットの場合はプロジェクト詳細への移動ボタン */}
                    {'matchedInfluencer' in selectedChat && (
                      <Link href={`/project-chat/${selectedChat.id}`}>
                        <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors">
                          詳細画面へ
                        </button>
                      </Link>
                    )}
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