import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  messageType: 'text' | 'proposal' | 'video' | 'file';
  sender: {
    id: string;
    role: 'CLIENT' | 'INFLUENCER';
    displayName: string;
  };
  attachments?: {
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  }[];
  proposalData?: {
    id: string;
    title: string;
    concept: string;
    structure: string;
    deliverables: string;
    timeline: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
  };
}

interface ProjectProgress {
  currentPhase: string;
  overallProgress: number; // 0-100
  milestones: {
    id: string;
    title: string;
    status: 'completed' | 'in_progress' | 'pending';
    completedAt?: string;
  }[];
  nextAction: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    assignee: 'client' | 'influencer';
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  };
}

interface Project {
  id: string;
  title: string;
  status: string;
  client: {
    id: string;
    displayName: string;
    companyName: string;
  };
  matchedInfluencer: {
    id: string;
    displayName: string;
  };
  progress?: ProjectProgress;
}

const ProjectChatPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalType, setProposalType] = useState<'format' | 'upload'>('format');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoDescription, setVideoDescription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { projectId } = router.query;

  // 構成案フォーマット用のstate
  const [proposalForm, setProposalForm] = useState({
    title: '',
    concept: '',
    structure: '',
    deliverables: '',
    timeline: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userData || !token) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (projectId) {
        fetchProjectData();
        fetchMessages();
      }
    }
  }, [router, projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      // Mock project data - 実際の環境ではAPIから取得
      const mockProject: Project = {
        id: projectId as string,
        title: '美容コスメ PR キャンペーン',
        status: 'IN_PROGRESS',
        client: {
          id: 'client-1',
          displayName: '田中太郎',
          companyName: '株式会社ビューティコスメ'
        },
        matchedInfluencer: {
          id: 'influencer-1',
          displayName: '美容系インフルエンサー 田中美咲'
        },
        progress: {
          currentPhase: 'コンテ修正',
          overallProgress: 47,
          milestones: [
            {
              id: '1',
              title: '正式依頼',
              status: 'completed',
              completedAt: '2024-01-15T09:00:00Z'
            },
            {
              id: '2',
              title: '商品受領',
              status: 'completed',
              completedAt: '2024-01-16T14:00:00Z'
            },
            {
              id: '3',
              title: '初稿コンテ作成',
              status: 'completed',
              completedAt: '2024-01-18T10:30:00Z'
            },
            {
              id: '4',
              title: '初稿コンテ提出',
              status: 'completed',
              completedAt: '2024-01-18T16:30:00Z'
            },
            {
              id: '5',
              title: '初稿コンテ戻し',
              status: 'completed',
              completedAt: '2024-01-20T11:15:00Z'
            },
            {
              id: '6',
              title: 'コンテ修正',
              status: 'in_progress'
            },
            {
              id: '7',
              title: '修正稿コンテFIX',
              status: 'pending'
            },
            {
              id: '8',
              title: '撮影',
              status: 'pending'
            },
            {
              id: '9',
              title: '初稿動画提出',
              status: 'pending'
            },
            {
              id: '10',
              title: '初稿動画戻し',
              status: 'pending'
            },
            {
              id: '11',
              title: '動画修正',
              status: 'pending'
            },
            {
              id: '12',
              title: '動画データ提出',
              status: 'pending'
            },
            {
              id: '13',
              title: '動画FIX',
              status: 'pending'
            },
            {
              id: '14',
              title: '投稿',
              status: 'pending'
            },
            {
              id: '15',
              title: 'インサイトデータ提出',
              status: 'pending'
            }
          ],
          nextAction: {
            id: 'action-1',
            title: 'コンテ修正作業',
            description: 'クライアントからのフィードバックを反映してコンテを修正し、修正稿を提出してください',
            dueDate: '2024-01-25T23:59:59Z',
            assignee: 'influencer',
            priority: 'high',
            status: 'in_progress'
          }
        }
      };
      setProject(mockProject);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError('プロジェクト情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      // Mock messages data
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'こんにちは！このプロジェクトでよろしくお願いします。',
          createdAt: '2024-01-15T10:00:00Z',
          senderId: 'client-1',
          messageType: 'text',
          sender: {
            id: 'client-1',
            role: 'CLIENT',
            displayName: '田中太郎（株式会社ビューティコスメ）'
          }
        },
        {
          id: '2',
          content: 'こちらこそよろしくお願いします！さっそく構成案を作成させていただきます。',
          createdAt: '2024-01-15T10:30:00Z',
          senderId: 'influencer-1',
          messageType: 'text',
          sender: {
            id: 'influencer-1',
            role: 'INFLUENCER',
            displayName: '田中美咲'
          }
        }
      ];
      setMessages(mockMessages);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !project) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      messageType: 'text',
      sender: {
        id: user.id,
        role: user.role,
        displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
      }
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // TODO: Send message to server
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadFiles(Array.from(files));
    }
  };

  const handleSubmitProposal = async () => {
    if (!user || !project) return;

    if (proposalType === 'format') {
      // オリジナルフォーマットの場合
      if (!proposalForm.title || !proposalForm.concept || !proposalForm.structure) {
        alert('必須項目を入力してください。');
        return;
      }

      const proposalMessage: Message = {
        id: Date.now().toString(),
        content: '構成案を提出しました',
        createdAt: new Date().toISOString(),
        senderId: user.id,
        messageType: 'proposal',
        sender: {
          id: user.id,
          role: user.role,
          displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
        },
        proposalData: {
          id: Date.now().toString(),
          ...proposalForm,
          status: 'submitted'
        }
      };

      setMessages(prev => [...prev, proposalMessage]);
      setProposalForm({
        title: '',
        concept: '',
        structure: '',
        deliverables: '',
        timeline: ''
      });
    } else {
      // ファイルアップロードの場合
      if (uploadFiles.length === 0) {
        alert('アップロードするファイルを選択してください。');
        return;
      }

      const fileMessage: Message = {
        id: Date.now().toString(),
        content: 'ファイルを送信しました',
        createdAt: new Date().toISOString(),
        senderId: user.id,
        messageType: 'file',
        sender: {
          id: user.id,
          role: user.role,
          displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
        },
        attachments: uploadFiles.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          fileName: file.name,
          fileType: file.type,
          fileUrl: URL.createObjectURL(file),
          fileSize: file.size
        }))
      };

      setMessages(prev => [...prev, fileMessage]);
      setUploadFiles([]);
    }

    setShowProposalForm(false);
    // TODO: Send proposal to server
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setVideoFiles(Array.from(files));
    }
  };

  const handleSubmitVideo = async () => {
    if (!user || !project) return;

    if (videoFiles.length === 0) {
      alert('アップロードする動画ファイルを選択してください。');
      return;
    }

    const videoMessage: Message = {
      id: Date.now().toString(),
      content: videoDescription || '動画を提出しました',
      createdAt: new Date().toISOString(),
      senderId: user.id,
      messageType: 'video',
      sender: {
        id: user.id,
        role: user.role,
        displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
      },
      attachments: videoFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        fileName: file.name,
        fileType: file.type,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size
      }))
    };

    setMessages(prev => [...prev, videoMessage]);
    setVideoFiles([]);
    setVideoDescription('');
    setShowVideoForm(false);
    
    // TODO: Send video to server
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilDeadline = (dateString: string) => {
    const deadline = new Date(dateString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">プロジェクトを読み込み中...</p>
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
            <Link href="/projects" className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">プロジェクトに戻る</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">プロジェクトチャット</h1>
              <p className="text-sm text-gray-600">{project?.title}</p>
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* プロジェクト情報 */}
        {project && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>企業: {project.client.companyName}</span>
                  <span>•</span>
                  <span>インフルエンサー: {project.matchedInfluencer.displayName}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                {user?.role === 'INFLUENCER' && (
                  <>
                    <button
                      onClick={() => setShowProposalForm(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                    >
                      📝 構成案提出
                    </button>
                    <button
                      onClick={() => setShowVideoForm(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                    >
                      🎬 動画提出
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* プロジェクト進捗とネクストアクション */}
        {project?.progress && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* プロジェクト進捗 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-2">📊</span>
                  プロジェクト進捗
                </h3>
                <div className="text-sm text-gray-600">
                  {project.progress.overallProgress}% 完了
                </div>
              </div>
              
              {/* 進捗バー */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    現在のフェーズ: {project.progress.currentPhase}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress.overallProgress}%` }}
                  />
                </div>
              </div>

              {/* マイルストーン */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">ワークフロー進捗</h4>
                
                {/* 簡易フロー表示 */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {project.progress.milestones.slice(0, 5).map((milestone, index) => (
                    <div key={milestone.id} className="text-center">
                      <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
                        milestone.status === 'completed' ? 'bg-green-500 text-white' :
                        milestone.status === 'in_progress' ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {milestone.status === 'completed' ? '✓' : index + 1}
                      </div>
                      <div className={`text-xs ${
                        milestone.status === 'completed' ? 'text-green-700 font-medium' :
                        milestone.status === 'in_progress' ? 'text-blue-700 font-medium' :
                        'text-gray-600'
                      }`}>
                        {milestone.title}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {project.progress.milestones.slice(5, 10).map((milestone, index) => (
                    <div key={milestone.id} className="text-center">
                      <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
                        milestone.status === 'completed' ? 'bg-green-500 text-white' :
                        milestone.status === 'in_progress' ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {milestone.status === 'completed' ? '✓' : index + 6}
                      </div>
                      <div className={`text-xs ${
                        milestone.status === 'completed' ? 'text-green-700 font-medium' :
                        milestone.status === 'in_progress' ? 'text-blue-700 font-medium' :
                        'text-gray-600'
                      }`}>
                        {milestone.title}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {project.progress.milestones.slice(10).map((milestone, index) => (
                    <div key={milestone.id} className="text-center">
                      <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
                        milestone.status === 'completed' ? 'bg-green-500 text-white' :
                        milestone.status === 'in_progress' ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {milestone.status === 'completed' ? '✓' : index + 11}
                      </div>
                      <div className={`text-xs ${
                        milestone.status === 'completed' ? 'text-green-700 font-medium' :
                        milestone.status === 'in_progress' ? 'text-blue-700 font-medium' :
                        'text-gray-600'
                      }`}>
                        {milestone.title}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 現在進行中のステップをハイライト表示 */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-sm font-medium text-blue-800">
                      現在進行中: {project.progress.milestones.find(m => m.status === 'in_progress')?.title}
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {project.progress.milestones.findIndex(m => m.status === 'in_progress') + 1} / {project.progress.milestones.length} ステップ
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ネクストアクション */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-2">🎯</span>
                  ネクストアクション
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(project.progress.nextAction.priority)}`}>
                  {project.progress.nextAction.priority === 'high' ? '高優先度' :
                   project.progress.nextAction.priority === 'medium' ? '中優先度' : '低優先度'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    {project.progress.nextAction.title}
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    {project.progress.nextAction.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">期日</div>
                    <div className={`text-sm font-medium ${
                      getDaysUntilDeadline(project.progress.nextAction.dueDate) < 0 ? 'text-red-600' :
                      getDaysUntilDeadline(project.progress.nextAction.dueDate) <= 2 ? 'text-orange-600' :
                      'text-gray-900'
                    }`}>
                      {formatDate(project.progress.nextAction.dueDate)}
                      <div className="text-xs text-gray-500">
                        {getDaysUntilDeadline(project.progress.nextAction.dueDate) < 0 ? 
                          `${Math.abs(getDaysUntilDeadline(project.progress.nextAction.dueDate))}日遅延` :
                          getDaysUntilDeadline(project.progress.nextAction.dueDate) === 0 ?
                          '今日が期日' :
                          `あと${getDaysUntilDeadline(project.progress.nextAction.dueDate)}日`
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">担当者</div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        project.progress.nextAction.assignee === 'client' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {project.progress.nextAction.assignee === 'client' ? 
                          project.client.displayName.charAt(0) : 
                          project.matchedInfluencer.displayName.charAt(0)
                        }
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {project.progress.nextAction.assignee === 'client' ? 
                          project.client.displayName : 
                          project.matchedInfluencer.displayName
                        }
                      </span>
                      {project.progress.nextAction.assignee === user?.role?.toLowerCase() && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                          あなた
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.progress.nextAction.status)}`}>
                    {project.progress.nextAction.status === 'pending' ? '未着手' :
                     project.progress.nextAction.status === 'in_progress' ? '進行中' :
                     project.progress.nextAction.status === 'completed' ? '完了' :
                     project.progress.nextAction.status === 'overdue' ? '期限超過' : project.progress.nextAction.status}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* チャットエリア */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-xl overflow-hidden"
        >
          {/* メッセージエリア */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.senderId === user?.id ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.senderId === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="text-xs mb-1 opacity-75">
                    {message.sender.displayName}
                  </div>
                  
                  {message.messageType === 'text' && (
                    <p className="text-sm">{message.content}</p>
                  )}
                  
                  {message.messageType === 'proposal' && message.proposalData && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">📝 {message.content}</p>
                      <div className="text-xs space-y-1 bg-black/10 rounded p-2">
                        <div><strong>タイトル:</strong> {message.proposalData.title}</div>
                        <div><strong>コンセプト:</strong> {message.proposalData.concept}</div>
                        <div><strong>構成:</strong> {message.proposalData.structure}</div>
                      </div>
                    </div>
                  )}
                  
                  {message.messageType === 'file' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">📎 {message.content}</p>
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="text-xs bg-black/10 rounded p-2">
                          <div className="font-medium">{attachment.fileName}</div>
                          <div className="opacity-75">{formatFileSize(attachment.fileSize)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.messageType === 'video' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">🎬 {message.content}</p>
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="text-xs bg-black/10 rounded p-2">
                          {attachment.fileType.startsWith('video/') ? (
                            <div className="space-y-2">
                              <video 
                                controls 
                                className="w-full max-w-xs rounded"
                                src={attachment.fileUrl}
                              >
                                お使いのブラウザは動画再生に対応していません。
                              </video>
                              <div>
                                <div className="font-medium">{attachment.fileName}</div>
                                <div className="opacity-75">{formatFileSize(attachment.fileSize)}</div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{attachment.fileName}</div>
                              <div className="opacity-75">{formatFileSize(attachment.fileSize)}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs mt-2 opacity-75">
                    {formatTimestamp(message.createdAt)}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* メッセージ入力エリア */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="メッセージを入力..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                送信
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 構成案提出モーダル */}
      <AnimatePresence>
        {showProposalForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">構成案提出</h3>
                <button
                  onClick={() => setShowProposalForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 提出方法選択 */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">提出方法を選択してください</p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setProposalType('format')}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      proposalType === 'format'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📋 指定フォーマット
                  </button>
                  <button
                    onClick={() => setProposalType('upload')}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      proposalType === 'upload'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📎 ファイルアップロード
                  </button>
                </div>
              </div>

              {proposalType === 'format' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">構成案タイトル *</label>
                    <input
                      type="text"
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm({...proposalForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 新商品PR動画構成案"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">コンセプト *</label>
                    <textarea
                      value={proposalForm.concept}
                      onChange={(e) => setProposalForm({...proposalForm, concept: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="動画のコンセプトや狙いを記載してください"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">構成・シナリオ *</label>
                    <textarea
                      value={proposalForm.structure}
                      onChange={(e) => setProposalForm({...proposalForm, structure: e.target.value})}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="動画の構成やシナリオを時系列で記載してください"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">成果物</label>
                    <textarea
                      value={proposalForm.deliverables}
                      onChange={(e) => setProposalForm({...proposalForm, deliverables: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="提供する動画の仕様や追加成果物"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">スケジュール</label>
                    <textarea
                      value={proposalForm.timeline}
                      onChange={(e) => setProposalForm({...proposalForm, timeline: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="制作スケジュールを記載してください"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ファイルを選択</label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      multiple
                      accept=".doc,.docx,.pdf,.ppt,.pptx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      対応ファイル: Word(.doc, .docx), PDF, PowerPoint(.ppt, .pptx)
                    </p>
                  </div>
                  
                  {uploadFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">選択されたファイル:</p>
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                          <button
                            onClick={() => setUploadFiles(files => files.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowProposalForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitProposal}
                  className="px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                >
                  提出する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 動画提出モーダル */}
      <AnimatePresence>
        {showVideoForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">動画提出</h3>
                <button
                  onClick={() => setShowVideoForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">動画ファイルを選択 *</label>
                  <input
                    type="file"
                    onChange={handleVideoUpload}
                    multiple
                    accept="video/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    対応ファイル: MP4, MOV, AVI, WMV など
                  </p>
                </div>

                {videoFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">選択された動画:</p>
                    {videoFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            🎬
                          </div>
                          <div>
                            <div className="text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setVideoFiles(files => files.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">コメント</label>
                  <textarea
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="動画についてのコメントや説明があれば記載してください"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowVideoForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitVideo}
                  className="px-6 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                >
                  提出する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectChatPage;