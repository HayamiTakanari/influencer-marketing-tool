import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { checkConteAlignment, AIContentCheckResult, ProjectInfo, ConteInfo } from '../../services/ai-content-check';
import { checkYakujihoViolations, YakujihoCheckResult } from '../../services/yakujiho-checker';
import { YakujihoHighlightedText, YakujihoCheckSummary } from '../../components/YakujihoHighlightedText';
import { checkAndRedirectForNDA } from '../../utils/ndaValidation';
import { Message, ProjectProgress, Project, User, ConteData, RevisionData, DirectCommentTarget, Submission } from '../../types/projectChat';
import ProjectInfoCard from '../../components/projectChat/ProjectInfoCard';
import ProgressCard from '../../components/projectChat/ProgressCard';
import MessageInput from '../../components/projectChat/MessageInput';
import DeadlinePanel from '../../components/projectChat/DeadlinePanel';

const ProjectChatPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoDescription, setVideoDescription] = useState('');

  // 成約状態を判定する関数
  const isContractEstablished = (project: Project, currentUser: User): boolean => {
    if (!project || !currentUser) return false;
    
    // インフルエンサーの場合、自分がマッチングされており、かつプロジェクトが進行中以上の状態
    if (currentUser.role === 'INFLUENCER') {
      return project.matchedInfluencer?.id === currentUser.id && 
             (project.status === 'IN_PROGRESS' || project.status === 'COMPLETED');
    }
    
    // 企業の場合は常に表示
    return true;
  };

  const [videoType, setVideoType] = useState<'initial' | 'revised'>('initial');
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  
  // 構成案提出関連
  const [showConteForm, setShowConteForm] = useState(false);
  const [conteType, setConteType] = useState<'initial' | 'revised'>('initial');
  const [conteFormat, setConteFormat] = useState<'original' | 'document'>('original');
  const [conteFiles, setConteFiles] = useState<File[]>([]);
  const [conteData, setConteData] = useState<ConteData>({
    title: '',
    scenes: [{
      id: '1',
      sceneNumber: 1,
      description: '',
      duration: 30,
      cameraAngle: 'フロント',
      notes: ''
    }],
    targetDuration: 60,
    overallTheme: '',
    keyMessages: [''],
  });
  const [conteDescription, setConteDescription] = useState('');
  
  // 構成案修正指摘関連
  const [showConteRevisionForm, setShowConteRevisionForm] = useState(false);
  const [selectedConteForRevision, setSelectedConteForRevision] = useState<any>(null);
  const [revisionData, setRevisionData] = useState<RevisionData>({
    overallFeedback: '',
    sceneRevisions: [],
    keyMessageRevisions: [],
    themeRevision: null,
    durationRevision: null
  });

  // 直接コメント機能
  const [showDirectCommentForm, setShowDirectCommentForm] = useState(false);
  const [directCommentTarget, setDirectCommentTarget] = useState<DirectCommentTarget | null>(null);
  const [directComment, setDirectComment] = useState('');
  
  // 提出物一覧サイドパネル関連
  const [showSubmissionPanel, setShowSubmissionPanel] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'conte'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  
  // AIコンテンツチェック関連
  const [aiCheckResults, setAiCheckResults] = useState<Map<string, AIContentCheckResult>>(new Map());
  const [isAiChecking, setIsAiChecking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { projectId } = router.query;

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (typeof window === 'undefined') {
          return;
        }
        
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
          router.push('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // NDAチェック（企業・インフルエンサー両方）
        if (!checkAndRedirectForNDA(parsedUser, router)) {
          return;
        }

        if (projectId && typeof projectId === 'string') {
          setLoading(true);
          setError('');
          
          try {
            await Promise.all([
              fetchProjectData(),
              fetchMessages()
            ]);
          } catch (err: any) {
            console.error('Error loading data:', err);
            setError('データの読み込みに失敗しました。ページを再読み込みしてください。');
          } finally {
            setLoading(false);
          }
        } else if (router.isReady && !projectId) {
          setError('プロジェクトIDが指定されていません。');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error in useEffect:', err);
        setError('初期化に失敗しました。');
        setLoading(false);
      }
    };
    
    initializeData();
  }, [router, router.isReady, projectId]);

  const fetchProjectData = async () => {
    try {
      const { getProjectById } = await import('../../services/api');
      const result = await getProjectById(projectId as string);
      setProject(result);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      throw new Error('プロジェクト情報の取得に失敗しました。');
    }
  };

  const fetchMessages = async () => {
    try {
      const { getProjectMessages } = await import('../../services/api');
      const result = await getProjectMessages(projectId as string);
      setMessages(result || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      throw new Error('メッセージの取得に失敗しました。');
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

    const messageContent = newMessage;
    setNewMessage('');

    try {
      // Import and call the sendMessage API
      const { sendMessage } = await import('../../services/api');
      const messageFromServer = await sendMessage(project.id, messageContent);

      // Add the server-returned message to the messages list
      if (messageFromServer) {
        const message: Message = {
          id: messageFromServer.id,
          content: messageFromServer.content,
          createdAt: messageFromServer.createdAt,
          senderId: messageFromServer.senderId,
          messageType: messageFromServer.messageType || 'text',
          sender: {
            id: messageFromServer.sender?.id || user.id,
            role: messageFromServer.sender?.role || user.role,
            displayName: user.role === "COMPANY" ? project.client.displayName : (project.matchedInfluencer?.displayName || 'インフルエンサー')
          }
        };
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore the message in the input if sending fails
      setNewMessage(messageContent);
      setError('メッセージの送信に失敗しました');
    }
  };

  // 提出物一覧関連の関数
  const getSubmissions = (): Submission[] => {
    const submissions: Submission[] = [];
    
    messages.forEach(message => {
      if ((message.messageType === 'conte' || message.messageType === 'revised_conte') && message.conteData) {
        submissions.push({
          id: message.id,
          type: 'conte',
          title: `${message.messageType === 'conte' ? '初稿' : '修正稿'}構成案`,
          submittedAt: message.createdAt,
          data: message.conteData,
          message: message
        });
      }
      
      if ((message.messageType === 'initial_video' || message.messageType === 'revised_video') && message.videoData) {
        submissions.push({
          id: message.id,
          type: 'video',
          title: `${message.messageType === 'initial_video' ? '初稿' : '修正版'}動画`,
          submittedAt: message.createdAt,
          data: message.videoData,
          message: message
        });
      }
    });
    
    return submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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

  // 期日管理の関数
  const handleProposeDueDate = (milestoneId: string, proposedDate: string) => {
    if (!user || !project) return;
    
    setProject((prev: Project | null) => {
      if (!prev) return prev;

      const updatedMilestones = prev.progress?.milestones.map(milestone => {
        if (milestone.id === milestoneId) {
          return {
            ...milestone,
            proposedDueDate: proposedDate,
            proposedBy: user.role === "COMPANY" ? "company" as const : 'influencer' as const,
            dueDateStatus: (user.role === "COMPANY" ? 'proposed_by_client' : 'proposed_by_influencer') as 'proposed_by_client' | 'proposed_by_influencer'
          };
        }
        return milestone;
      }) || [];

      return {
        ...prev,
        progress: {
          ...prev.progress!,
          milestones: updatedMilestones
        }
      } as Project;
    });
    
    // チャットに期日提案メッセージを追加
    const proposalMessage: Message = {
      id: Date.now().toString(),
      content: `📅 「${project.progress?.milestones.find(m => m.id === milestoneId)?.title}」の期日を${formatDateTime(proposedDate)}に設定することを提案しました。`,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      messageType: 'text',
      sender: {
        id: user.id,
        role: user.role,
        displayName: user.role === "COMPANY" ? project.client.displayName : (project.matchedInfluencer?.displayName || 'インフルエンサー')
      }
    };

    setMessages(prev => [...prev, proposalMessage]);
    setShowDatePicker(null);
    setProposedDate('');
  };
  
  const handleAgreeDueDate = (milestoneId: string) => {
    if (!user || !project) return;
    
    setProject(prev => {
      if (!prev) return prev;
      
      const updatedMilestones = prev.progress?.milestones.map(milestone => {
        if (milestone.id === milestoneId && milestone.proposedDueDate) {
          return {
            ...milestone,
            dueDate: milestone.proposedDueDate,
            dueDateStatus: 'agreed' as const,
            proposedDueDate: undefined,
            proposedBy: undefined
          };
        }
        return milestone;
      }) || [];
      
      return {
        ...prev,
        progress: {
          ...prev.progress!,
          milestones: updatedMilestones
        }
      } as Project;
    });
    
    // チャットに合意メッセージを追加
    const milestoneTitle = project.progress?.milestones.find(m => m.id === milestoneId)?.title;
    const agreedMessage: Message = {
      id: Date.now().toString(),
      content: `✅ 「${milestoneTitle}」の期日設定に合意しました。`,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      messageType: 'text',
      sender: {
        id: user.id,
        role: user.role,
        displayName: user.role === "COMPANY" ? project.client.displayName : (project.matchedInfluencer?.displayName || 'インフルエンサー')
      }
    };

    setMessages(prev => [...prev, agreedMessage]);
  };
  
  const handleRejectDueDate = (milestoneId: string) => {
    if (!user || !project) return;
    
    setProject((prev: Project | null) => {
      if (!prev) return prev;

      const updatedMilestones = prev.progress?.milestones.map(milestone => {
        if (milestone.id === milestoneId) {
          return {
            ...milestone,
            dueDateStatus: 'not_set' as const,
            proposedDueDate: undefined,
            proposedBy: undefined
          };
        }
        return milestone;
      }) || [];

      return {
        ...prev,
        progress: {
          ...prev.progress!,
          milestones: updatedMilestones
        }
      } as Project;
    });
    
    // チャットに拒否メッセージを追加
    const milestoneTitle = project.progress?.milestones.find(m => m.id === milestoneId)?.title;
    const rejectMessage: Message = {
      id: Date.now().toString(),
      content: `❌ 「${milestoneTitle}」の期日提案を拒否しました。再度相談して決めましょう。`,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      messageType: 'text',
      sender: {
        id: user.id,
        role: user.role,
        displayName: user.role === "COMPANY" ? project.client.displayName : (project.matchedInfluencer?.displayName || 'インフルエンサー')
      }
    };

    setMessages(prev => [...prev, rejectMessage]);
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

  // イベントハンドラー
  const handleShowConteForm = (type: 'initial' | 'revised') => {
    setConteType(type);
    setShowConteForm(true);
  };

  const handleShowVideoForm = (type: 'initial' | 'revised') => {
    setVideoType(type);
    setShowVideoForm(true);
  };

  const handleRequestConteRevision = () => {
    const revisionMessage: Message = {
      id: Date.now().toString(),
      content: '構成案の修正をお願いします。',
      createdAt: new Date().toISOString(),
      senderId: user!.id,
      messageType: 'text',
      sender: {
        id: user!.id,
        role: user!.role,
        displayName: project?.client.displayName || 'クライアント'
      }
    };
    setMessages(prev => [...prev, revisionMessage]);
  };

  if (loading) {
    return (
      <DashboardLayout title="プロジェクトチャット" subtitle="読み込み中...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">プロジェクトを読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="プロジェクトチャット" subtitle="エラーが発生しました">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              再読み込み
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="プロジェクトチャット" subtitle="プロジェクトが見つかりません">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">プロジェクトが見つかりません</h3>
            <p className="text-gray-600 mb-4">指定されたプロジェクトは存在しないか、アクセス権限がありません。</p>
            <button
              onClick={() => router.push('/projects')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              プロジェクト一覧に戻る
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="プロジェクトチャット" subtitle={project?.title}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 transition-all duration-300 ease-in-out">
            {error}
          </div>
        )}

        {/* プロジェクト情報コンポーネント */}
        {project && user && (
          <ProjectInfoCard
            project={project}
            user={user}
            isContractEstablished={isContractEstablished}
            getSubmissions={getSubmissions}
            onShowSubmissionPanel={() => setShowSubmissionPanel(true)}
            onShowConteForm={handleShowConteForm}
            onShowVideoForm={handleShowVideoForm}
            onRequestConteRevision={handleRequestConteRevision}
          />
        )}

        {/* プロジェクト進捗とネクストアクションコンポーネント */}
        {project && user && (
          <ProgressCard
            project={project}
            user={user}
            formatDate={formatDate}
            getDaysUntilDeadline={getDaysUntilDeadline}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        )}

        {/* チャットエリア */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-800 ease-in-out">
          {/* メッセージエリア */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'} transition-all duration-300 ease-in-out`}
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

                  {message.messageType === 'nda_approved' && (
                    <p className="text-sm font-medium">🎉 NDA（秘密保持契約）が承認されました。チャットが有効化されました。</p>
                  )}

                  <div className="text-xs mt-2 opacity-75">
                    {formatTimestamp(message.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* メッセージ入力コンポーネント */}
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={handleSendMessage}
          />
        </div>
        
        {/* 期日管理パネルコンポーネント */}
        {project && user && (
          <DeadlinePanel
            project={project}
            user={user}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            proposedDate={proposedDate}
            setProposedDate={setProposedDate}
            onProposeDueDate={handleProposeDueDate}
            onAgreeDueDate={handleAgreeDueDate}
            onRejectDueDate={handleRejectDueDate}
            formatDateTime={formatDateTime}
            getDaysUntilDeadline={getDaysUntilDeadline}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectChatPage;