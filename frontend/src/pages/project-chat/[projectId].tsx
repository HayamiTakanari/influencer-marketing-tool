import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  messageType: 'text' | 'proposal' | 'video' | 'file' | 'conte' | 'revised_conte' | 'initial_video' | 'revised_video' | 'conte_revision_request';
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
  conteData?: {
    id: string;
    type: 'initial' | 'revised';
    format: 'original' | 'document'; // オリジナルフォーマット or ドキュメント
    title?: string;
    scenes?: {
      id: string;
      sceneNumber: number;
      description: string;
      duration: number; // 秒
      cameraAngle: string;
      notes?: string;
    }[];
    targetDuration?: number; // 秒
    overallTheme?: string;
    keyMessages?: string[];
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
    revisionNotes?: string;
    submittedAt?: string;
  };
  videoData?: {
    id: string;
    type: 'initial' | 'revised';
    description?: string;
    duration?: number; // 秒
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
    revisionNotes?: string;
    submittedAt?: string;
  };
  conteRevisionData?: {
    id: string;
    originalConteId: string;
    overallFeedback: string;
    sceneRevisions: {
      sceneId: string;
      sceneNumber: number;
      revisionType: 'content' | 'duration' | 'camera_angle' | 'notes' | 'overall';
      currentValue?: string;
      suggestedValue?: string;
      comment: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    keyMessageRevisions: {
      index: number;
      currentMessage: string;
      suggestedMessage?: string;
      comment: string;
    }[];
    themeRevision?: {
      currentTheme: string;
      suggestedTheme?: string;
      comment: string;
    };
    durationRevision?: {
      currentDuration: number;
      suggestedDuration?: number;
      comment: string;
    };
    submittedAt: string;
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
    dueDate?: string;
    dueDateStatus?: 'agreed' | 'proposed_by_client' | 'proposed_by_influencer' | 'not_set';
    proposedDueDate?: string;
    proposedBy?: 'client' | 'influencer';
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
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  
  // コンテ提出関連
  const [showConteForm, setShowConteForm] = useState(false);
  const [conteType, setConteType] = useState<'initial' | 'revised'>('initial');
  const [conteFormat, setConteFormat] = useState<'original' | 'document'>('original');
  const [conteFiles, setConteFiles] = useState<File[]>([]);
  const [conteData, setConteData] = useState({
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
  
  // 動画提出関連
  const [showVideoSubmitForm, setShowVideoSubmitForm] = useState(false);
  const [videoSubmitType, setVideoSubmitType] = useState<'initial' | 'revised'>('initial');
  const [videoSubmitFiles, setVideoSubmitFiles] = useState<File[]>([]);
  const [videoSubmitDescription, setVideoSubmitDescription] = useState('');
  
  // コンテ修正指摘関連
  const [showConteRevisionForm, setShowConteRevisionForm] = useState(false);
  const [selectedConteForRevision, setSelectedConteForRevision] = useState<any>(null);
  const [revisionData, setRevisionData] = useState({
    overallFeedback: '',
    sceneRevisions: [] as any[],
    keyMessageRevisions: [] as any[],
    themeRevision: null as any,
    durationRevision: null as any
  });
  
  // 提出物一覧サイドパネル関連
  const [showSubmissionPanel, setShowSubmissionPanel] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'proposals' | 'conte' | 'videos'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
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
              status: 'in_progress',
              dueDate: '2024-01-25T23:59:59Z',
              dueDateStatus: 'agreed'
            },
            {
              id: '7',
              title: '修正稿コンテFIX',
              status: 'pending',
              dueDate: '2024-01-26T17:00:00Z',
              dueDateStatus: 'agreed'
            },
            {
              id: '8',
              title: '撮影',
              status: 'pending',
              dueDate: '2024-01-30T18:00:00Z',
              dueDateStatus: 'agreed'
            },
            {
              id: '9',
              title: '初稿動画提出',
              status: 'pending',
              proposedDueDate: '2024-02-02T23:59:59Z',
              proposedBy: 'influencer',
              dueDateStatus: 'proposed_by_influencer'
            },
            {
              id: '10',
              title: '初稿動画戻し',
              status: 'pending',
              dueDateStatus: 'not_set'
            },
            {
              id: '11',
              title: '動画修正',
              status: 'pending',
              proposedDueDate: '2024-02-08T23:59:59Z',
              proposedBy: 'client',
              dueDateStatus: 'proposed_by_client'
            },
            {
              id: '12',
              title: '動画データ提出',
              status: 'pending',
              dueDateStatus: 'not_set'
            },
            {
              id: '13',
              title: '動画FIX',
              status: 'pending',
              dueDateStatus: 'not_set'
            },
            {
              id: '14',
              title: '投稿',
              status: 'pending',
              dueDate: '2024-02-15T12:00:00Z',
              dueDateStatus: 'agreed'
            },
            {
              id: '15',
              title: 'インサイトデータ提出',
              status: 'pending',
              dueDate: '2024-02-20T23:59:59Z',
              dueDateStatus: 'agreed'
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
  
  // コンテ提出機能
  const handleConteFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setConteFiles(Array.from(files));
    }
  };
  
  const addConteScene = () => {
    const newSceneNumber = conteData.scenes.length + 1;
    setConteData(prev => ({
      ...prev,
      scenes: [...prev.scenes, {
        id: Date.now().toString(),
        sceneNumber: newSceneNumber,
        description: '',
        duration: 30,
        cameraAngle: 'フロント',
        notes: ''
      }]
    }));
  };
  
  const removeConteScene = (sceneId: string) => {
    setConteData(prev => ({
      ...prev,
      scenes: prev.scenes.filter(scene => scene.id !== sceneId).map((scene, index) => ({
        ...scene,
        sceneNumber: index + 1
      }))
    }));
  };
  
  const updateConteScene = (sceneId: string, field: string, value: any) => {
    setConteData(prev => ({
      ...prev,
      scenes: prev.scenes.map(scene => 
        scene.id === sceneId ? { ...scene, [field]: value } : scene
      )
    }));
  };
  
  const handleSubmitConte = async () => {
    if (!user || !project) return;
    
    if (conteFormat === 'document' && conteFiles.length === 0) {
      alert('ドキュメントファイルを選択してください。');
      return;
    }
    
    if (conteFormat === 'original' && (!conteData.overallTheme || conteData.scenes.length === 0)) {
      alert('全体テーマとシーン情報を入力してください。');
      return;
    }
    
    const conteMessage: Message = {
      id: Date.now().toString(),
      content: `${conteType === 'initial' ? '初稿' : '修正稿'}コンテを提出しました`,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      messageType: conteType === 'initial' ? 'conte' : 'revised_conte',
      sender: {
        id: user.id,
        role: user.role,
        displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
      },
      conteData: {
        id: Date.now().toString(),
        type: conteType,
        format: conteFormat,
        title: conteFormat === 'original' ? conteData.overallTheme : conteFiles[0]?.name,
        scenes: conteFormat === 'original' ? conteData.scenes : undefined,
        targetDuration: conteFormat === 'original' ? conteData.targetDuration : undefined,
        overallTheme: conteFormat === 'original' ? conteData.overallTheme : undefined,
        keyMessages: conteFormat === 'original' ? conteData.keyMessages : undefined,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      },
      attachments: conteFormat === 'document' ? conteFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        fileName: file.name,
        fileType: file.type,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size
      })) : undefined
    };
    
    setMessages(prev => [...prev, conteMessage]);
    
    // Reset form
    setConteFiles([]);
    setConteData({
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
    setConteDescription('');
    setShowConteForm(false);
    
    // TODO: Send conte to server
  };
  
  // 動画提出機能
  const handleVideoSubmitFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setVideoSubmitFiles(Array.from(files));
    }
  };
  
  const handleSubmitVideoDeliverable = async () => {
    if (!user || !project) return;
    
    if (videoSubmitFiles.length === 0) {
      alert('動画ファイルを選択してください。');
      return;
    }
    
    const videoMessage: Message = {
      id: Date.now().toString(),
      content: `${videoSubmitType === 'initial' ? '初稿動画' : '修正動画'}を提出しました`,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      messageType: videoSubmitType === 'initial' ? 'initial_video' : 'revised_video',
      sender: {
        id: user.id,
        role: user.role,
        displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
      },
      videoData: {
        id: Date.now().toString(),
        type: videoSubmitType,
        description: videoSubmitDescription,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      },
      attachments: videoSubmitFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        fileName: file.name,
        fileType: file.type,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size
      }))
    };
    
    setMessages(prev => [...prev, videoMessage]);
    
    // Reset form
    setVideoSubmitFiles([]);
    setVideoSubmitDescription('');
    setShowVideoSubmitForm(false);
    
    // TODO: Send video to server
  };
  
  // コンテ修正指摘機能
  const handleOpenConteRevision = (conteMessage: any) => {
    if (!conteMessage.conteData || conteMessage.conteData.format !== 'original') {
      alert('オリジナルフォーマットのコンテのみ修正指摘できます。');
      return;
    }
    
    setSelectedConteForRevision(conteMessage);
    
    // 修正データを初期化
    const sceneRevisions = conteMessage.conteData.scenes?.map((scene: any) => ({
      sceneId: scene.id,
      sceneNumber: scene.sceneNumber,
      revisionType: 'content',
      currentValue: scene.description,
      suggestedValue: '',
      comment: '',
      priority: 'medium'
    })) || [];
    
    const keyMessageRevisions = conteMessage.conteData.keyMessages?.map((message: string, index: number) => ({
      index,
      currentMessage: message,
      suggestedMessage: '',
      comment: ''
    })) || [];
    
    setRevisionData({
      overallFeedback: '',
      sceneRevisions,
      keyMessageRevisions,
      themeRevision: {
        currentTheme: conteMessage.conteData.overallTheme || '',
        suggestedTheme: '',
        comment: ''
      },
      durationRevision: {
        currentDuration: conteMessage.conteData.targetDuration || 60,
        suggestedDuration: null,
        comment: ''
      }
    });
    
    setShowConteRevisionForm(true);
  };
  
  const handleSubmitConteRevision = async () => {
    if (!user || !selectedConteForRevision) return;
    
    if (!revisionData.overallFeedback.trim()) {
      alert('全体的なフィードバックを入力してください。');
      return;
    }
    
    const revisionMessage = {
      id: Date.now().toString(),
      content: 'コンテの詳細な修正指摘をしました',
      createdAt: new Date().toISOString(),
      senderId: user.id,
      messageType: 'conte_revision_request' as const,
      sender: {
        id: user.id,
        role: user.role,
        displayName: project?.client.displayName || 'クライアント'
      },
      conteRevisionData: {
        id: Date.now().toString(),
        originalConteId: selectedConteForRevision.conteData.id,
        overallFeedback: revisionData.overallFeedback,
        sceneRevisions: revisionData.sceneRevisions.filter((rev: any) => rev.comment.trim()),
        keyMessageRevisions: revisionData.keyMessageRevisions.filter((rev: any) => rev.comment.trim()),
        themeRevision: revisionData.themeRevision?.comment.trim() ? revisionData.themeRevision : undefined,
        durationRevision: revisionData.durationRevision?.comment.trim() ? revisionData.durationRevision : undefined,
        submittedAt: new Date().toISOString()
      }
    };
    
    setMessages(prev => [...prev, revisionMessage]);
    
    // Reset form
    setShowConteRevisionForm(false);
    setSelectedConteForRevision(null);
    setRevisionData({
      overallFeedback: '',
      sceneRevisions: [],
      keyMessageRevisions: [],
      themeRevision: null,
      durationRevision: null
    });
    
    // TODO: Send revision request to server
  };
  
  const updateSceneRevision = (sceneId: string, field: string, value: any) => {
    setRevisionData(prev => ({
      ...prev,
      sceneRevisions: prev.sceneRevisions.map(rev => 
        rev.sceneId === sceneId ? { ...rev, [field]: value } : rev
      )
    }));
  };
  
  const updateKeyMessageRevision = (index: number, field: string, value: string) => {
    setRevisionData(prev => ({
      ...prev,
      keyMessageRevisions: prev.keyMessageRevisions.map(rev =>
        rev.index === index ? { ...rev, [field]: value } : rev
      )
    }));
  };
  
  // 提出物一覧関連の関数
  const getSubmissions = () => {
    const submissions: any[] = [];
    
    messages.forEach(message => {
      if (message.messageType === 'proposal' && message.proposalData) {
        submissions.push({
          id: message.id,
          type: 'proposal',
          title: message.proposalData.title || '構成案',
          submittedAt: message.createdAt,
          data: message.proposalData,
          message: message
        });
      }
      
      if ((message.messageType === 'conte' || message.messageType === 'revised_conte') && message.conteData) {
        submissions.push({
          id: message.id,
          type: 'conte',
          title: `${message.messageType === 'conte' ? '初稿' : '修正稿'}コンテ`,
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
      
      if (message.messageType === 'video' && message.attachments) {
        submissions.push({
          id: message.id,
          type: 'video',
          title: '参考動画',
          submittedAt: message.createdAt,
          data: { description: message.content },
          message: message
        });
      }
    });
    
    return submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  };
  
  const getFilteredSubmissions = () => {
    const submissions = getSubmissions();
    
    switch (submissionFilter) {
      case 'proposals':
        return submissions.filter(s => s.type === 'proposal');
      case 'conte':
        return submissions.filter(s => s.type === 'conte');
      case 'videos':
        return submissions.filter(s => s.type === 'video');
      default:
        return submissions;
    }
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
    
    setProject(prev => {
      if (!prev) return prev;
      
      const updatedMilestones = prev.progress?.milestones.map(milestone => {
        if (milestone.id === milestoneId) {
          return {
            ...milestone,
            proposedDueDate: proposedDate,
            proposedBy: user.role === 'CLIENT' ? 'client' : 'influencer',
            dueDateStatus: user.role === 'CLIENT' ? 'proposed_by_client' : 'proposed_by_influencer'
          };
        }
        return milestone;
      });
      
      return {
        ...prev,
        progress: {
          ...prev.progress!,
          milestones: updatedMilestones || []
        }
      };
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
        displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
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
            dueDateStatus: 'agreed',
            proposedDueDate: undefined,
            proposedBy: undefined
          };
        }
        return milestone;
      });
      
      return {
        ...prev,
        progress: {
          ...prev.progress!,
          milestones: updatedMilestones || []
        }
      };
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
        displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
      }
    };
    
    setMessages(prev => [...prev, agreedMessage]);
  };
  
  const handleRejectDueDate = (milestoneId: string) => {
    if (!user || !project) return;
    
    setProject(prev => {
      if (!prev) return prev;
      
      const updatedMilestones = prev.progress?.milestones.map(milestone => {
        if (milestone.id === milestoneId) {
          return {
            ...milestone,
            dueDateStatus: 'not_set',
            proposedDueDate: undefined,
            proposedBy: undefined
          };
        }
        return milestone;
      });
      
      return {
        ...prev,
        progress: {
          ...prev.progress!,
          milestones: updatedMilestones || []
        }
      };
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
        displayName: user.role === 'CLIENT' ? project.client.displayName : project.matchedInfluencer.displayName
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>企業: {project.client.companyName}</span>
                    <span>•</span>
                    <span>インフルエンサー: {project.matchedInfluencer.displayName}</span>
                  </div>
                </div>
              </div>
              
              {/* 提出物一覧ボタン */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setShowSubmissionPanel(true)}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm flex items-center space-x-2"
                >
                  <span>📁</span>
                  <span>提出物一覧</span>
                  <span className="bg-indigo-700 text-white text-xs px-2 py-0.5 rounded-full">
                    {getSubmissions().length}
                  </span>
                </button>
              </div>

              {/* アクションボタン */}
              <div className="border-t border-gray-100 pt-4">
                {user?.role === 'INFLUENCER' && (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 min-w-[100px]">基本提出:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setShowProposalForm(true)}
                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 transition-colors"
                        >
                          📝 構成案提出
                        </button>
                        <button
                          onClick={() => {
                            setConteType('initial');
                            setShowConteForm(true);
                          }}
                          className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg font-medium hover:bg-purple-600 transition-colors"
                        >
                          📋 コンテ提出
                        </button>
                        <button
                          onClick={() => {
                            setVideoSubmitType('initial');
                            setShowVideoSubmitForm(true);
                          }}
                          className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg font-medium hover:bg-green-600 transition-colors"
                        >
                          🎬 動画提出
                        </button>
                        <button
                          onClick={() => setShowVideoForm(true)}
                          className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg font-medium hover:bg-gray-600 transition-colors"
                        >
                          🎥 参考動画
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 min-w-[100px]">修正版提出:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setConteType('revised');
                            setShowConteForm(true);
                          }}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg font-medium hover:bg-purple-200 transition-colors"
                        >
                          📋 修正稿コンテ
                        </button>
                        <button
                          onClick={() => {
                            setVideoSubmitType('revised');
                            setShowVideoSubmitForm(true);
                          }}
                          className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg font-medium hover:bg-green-200 transition-colors"
                        >
                          🎬 修正版動画
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 企業向け修正依頼ボタン */}
                {user?.role === 'CLIENT' && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 min-w-[100px]">修正依頼:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setConteType('revised');
                          const revisionMessage = {
                            id: Date.now().toString(),
                            content: 'コンテの修正をお願いします。',
                            createdAt: new Date().toISOString(),
                            senderId: user.id,
                            messageType: 'text' as const,
                            sender: {
                              id: user.id,
                              role: user.role,
                              displayName: project?.client.displayName || 'クライアント'
                            }
                          };
                          setMessages(prev => [...prev, revisionMessage]);
                        }}
                        className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg font-medium hover:bg-orange-600 transition-colors"
                      >
                        📝 コンテ修正依頼
                      </button>
                      <button
                        onClick={() => {
                          const revisionMessage = {
                            id: Date.now().toString(),
                            content: '動画の修正をお願いします。',
                            createdAt: new Date().toISOString(),
                            senderId: user.id,
                            messageType: 'text' as const,
                            sender: {
                              id: user.id,
                              role: user.role,
                              displayName: project?.client.displayName || 'クライアント'
                            }
                          };
                          setMessages(prev => [...prev, revisionMessage]);
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        🎬 動画修正依頼
                      </button>
                    </div>
                  </div>
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
                    <div key={milestone.id} className="text-center relative group">
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
                      
                      {/* 期日情報 */}
                      {milestone.dueDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(milestone.dueDate)}
                        </div>
                      )}
                      
                      {/* 期日提案アイコン */}
                      {milestone.dueDateStatus === 'proposed_by_client' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full" title="企業から期日提案中">
                          <span className="text-xs text-white">🏢</span>
                        </div>
                      )}
                      {milestone.dueDateStatus === 'proposed_by_influencer' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full" title="インフルエンサーから期日提案中">
                          <span className="text-xs text-white">📺</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {project.progress.milestones.slice(5, 10).map((milestone, index) => (
                    <div key={milestone.id} className="text-center relative group">
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
                      
                      {/* 期日情報 */}
                      {milestone.dueDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(milestone.dueDate)}
                        </div>
                      )}
                      
                      {/* 期日提案アイコン */}
                      {milestone.dueDateStatus === 'proposed_by_client' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full" title="企業から期日提案中">
                          <span className="text-xs text-white">🏢</span>
                        </div>
                      )}
                      {milestone.dueDateStatus === 'proposed_by_influencer' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full" title="インフルエンサーから期日提案中">
                          <span className="text-xs text-white">📺</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {project.progress.milestones.slice(10).map((milestone, index) => (
                    <div key={milestone.id} className="text-center relative group">
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
                      
                      {/* 期日情報 */}
                      {milestone.dueDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(milestone.dueDate)}
                        </div>
                      )}
                      
                      {/* 期日提案アイコン */}
                      {milestone.dueDateStatus === 'proposed_by_client' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full" title="企業から期日提案中">
                          <span className="text-xs text-white">🏢</span>
                        </div>
                      )}
                      {milestone.dueDateStatus === 'proposed_by_influencer' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full" title="インフルエンサーから期日提案中">
                          <span className="text-xs text-white">📺</span>
                        </div>
                      )}
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
                  
                  {/* コンテ提出メッセージ */}
                  {(message.messageType === 'conte' || message.messageType === 'revised_conte') && message.conteData && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        📋 {message.messageType === 'conte' ? '初稿' : '修正稿'}コンテを提出しました
                      </p>
                      <div className="text-xs space-y-2 bg-purple-50 rounded p-3">
                        {message.conteData.format === 'original' ? (
                          <>
                            <div><strong>テーマ:</strong> {message.conteData.overallTheme}</div>
                            <div><strong>目標時間:</strong> {message.conteData.targetDuration}秒</div>
                            <div><strong>シーン数:</strong> {message.conteData.scenes.length}シーン</div>
                            <div>
                              <strong>キーメッセージ:</strong>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {message.conteData.keyMessages.map((msg, index) => (
                                  <li key={index}>{msg}</li>
                                ))}
                              </ul>
                            </div>
                          </>
                        ) : (
                          <div><strong>ドキュメント形式で提出</strong></div>
                        )}
                        {message.attachments && message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center space-x-2 bg-white rounded p-2">
                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                              📄
                            </div>
                            <div>
                              <div className="font-medium text-xs">{attachment.fileName}</div>
                              <div className="opacity-75 text-xs">{formatFileSize(attachment.fileSize)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* 企業側：修正指摘ボタン（オリジナルフォーマットのみ） */}
                      {user?.role === 'CLIENT' && message.conteData.format === 'original' && message.senderId !== user.id && (
                        <div className="mt-3 pt-2 border-t border-purple-200">
                          <button
                            onClick={() => handleOpenConteRevision(message)}
                            className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg font-medium hover:bg-orange-600 transition-colors"
                          >
                            🔍 詳細な修正指摘
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 動画提出メッセージ */}
                  {(message.messageType === 'initial_video' || message.messageType === 'revised_video') && message.videoData && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        🎬 {message.messageType === 'initial_video' ? '初稿動画' : '修正版動画'}を提出しました
                      </p>
                      <div className="text-xs space-y-2 bg-green-50 rounded p-3">
                        <div><strong>タイプ:</strong> {message.videoData.type === 'initial' ? '初稿' : '修正版'}</div>
                        <div><strong>提出日:</strong> {formatDateTime(message.videoData.submittedAt)}</div>
                        {message.videoData.description && (
                          <div><strong>説明:</strong> {message.videoData.description}</div>
                        )}
                        {message.attachments && message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center space-x-2 bg-white rounded p-2">
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              🎬
                            </div>
                            <div>
                              <div className="font-medium text-xs">{attachment.fileName}</div>
                              <div className="opacity-75 text-xs">{formatFileSize(attachment.fileSize)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* コンテ修正指摘メッセージ */}
                  {message.messageType === 'conte_revision_request' && message.conteRevisionData && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-orange-700">
                        🔍 コンテの詳細な修正指摘
                      </p>
                      <div className="text-xs space-y-3 bg-orange-50 rounded p-4 border border-orange-200">
                        
                        {/* 全体的なフィードバック */}
                        <div className="bg-white rounded p-3">
                          <div className="font-semibold text-orange-800 mb-2">📋 全体的なフィードバック</div>
                          <div className="text-gray-700">{message.conteRevisionData.overallFeedback}</div>
                        </div>

                        {/* テーマ修正 */}
                        {message.conteRevisionData.themeRevision && (
                          <div className="bg-white rounded p-3">
                            <div className="font-semibold text-orange-800 mb-2">🎯 テーマについて</div>
                            <div className="text-xs text-gray-600 mb-1">現在: {message.conteRevisionData.themeRevision.currentTheme}</div>
                            {message.conteRevisionData.themeRevision.suggestedTheme && (
                              <div className="text-xs text-green-600 mb-1">提案: {message.conteRevisionData.themeRevision.suggestedTheme}</div>
                            )}
                            <div className="text-gray-700">{message.conteRevisionData.themeRevision.comment}</div>
                          </div>
                        )}

                        {/* 時間修正 */}
                        {message.conteRevisionData.durationRevision && (
                          <div className="bg-white rounded p-3">
                            <div className="font-semibold text-orange-800 mb-2">⏱️ 時間について</div>
                            <div className="text-xs text-gray-600 mb-1">現在: {message.conteRevisionData.durationRevision.currentDuration}秒</div>
                            {message.conteRevisionData.durationRevision.suggestedDuration && (
                              <div className="text-xs text-green-600 mb-1">提案: {message.conteRevisionData.durationRevision.suggestedDuration}秒</div>
                            )}
                            <div className="text-gray-700">{message.conteRevisionData.durationRevision.comment}</div>
                          </div>
                        )}

                        {/* シーン別修正 */}
                        {message.conteRevisionData.sceneRevisions.length > 0 && (
                          <div className="bg-white rounded p-3">
                            <div className="font-semibold text-orange-800 mb-3">🎬 シーン別修正点</div>
                            <div className="space-y-2">
                              {message.conteRevisionData.sceneRevisions.map((revision: any, index: number) => (
                                <div key={index} className="border-l-4 border-orange-300 pl-3 py-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs font-medium text-orange-700">シーン {revision.sceneNumber}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      revision.priority === 'high' ? 'bg-red-100 text-red-700' :
                                      revision.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {revision.priority === 'high' ? '高' : revision.priority === 'medium' ? '中' : '低'}
                                    </span>
                                  </div>
                                  {revision.suggestedValue && (
                                    <div className="text-xs text-green-600 mb-1">提案: {revision.suggestedValue}</div>
                                  )}
                                  <div className="text-xs text-gray-700">{revision.comment}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* キーメッセージ修正 */}
                        {message.conteRevisionData.keyMessageRevisions.length > 0 && (
                          <div className="bg-white rounded p-3">
                            <div className="font-semibold text-orange-800 mb-3">💬 キーメッセージ修正</div>
                            <div className="space-y-2">
                              {message.conteRevisionData.keyMessageRevisions.map((revision: any, index: number) => (
                                <div key={index} className="border-l-4 border-blue-300 pl-3 py-1">
                                  <div className="text-xs font-medium text-blue-700 mb-1">メッセージ {revision.index + 1}</div>
                                  <div className="text-xs text-gray-600 mb-1">現在: {revision.currentMessage}</div>
                                  {revision.suggestedMessage && (
                                    <div className="text-xs text-green-600 mb-1">提案: {revision.suggestedMessage}</div>
                                  )}
                                  <div className="text-xs text-gray-700">{revision.comment}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
        
        {/* 期日管理パネル */}
        {project?.progress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <span className="mr-2">📅</span>
                期日管理
              </h3>
              <div className="text-sm text-gray-600">
                双方の合意で期日を設定
              </div>
            </div>
            
            {/* 期日設定が必要なマイルストーン */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.progress.milestones
                .filter(milestone => milestone.status !== 'completed')
                .slice(0, 9) // 最初の9件のみ表示
                .map((milestone) => (
                <div key={milestone.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 text-sm">{milestone.title}</h4>
                    <div className={`w-3 h-3 rounded-full ${
                      milestone.status === 'in_progress' ? 'bg-blue-500' :
                      milestone.status === 'completed' ? 'bg-green-500' :
                      'bg-gray-300'
                    }`}></div>
                  </div>
                  
                  {/* 合意済み期日 */}
                  {milestone.dueDateStatus === 'agreed' && milestone.dueDate && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 font-medium text-sm">✅ 合意済み</span>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        期日: {formatDateTime(milestone.dueDate)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getDaysUntilDeadline(milestone.dueDate) < 0 ? 
                          `${Math.abs(getDaysUntilDeadline(milestone.dueDate))}日過ぎています` :
                          getDaysUntilDeadline(milestone.dueDate) === 0 ?
                          '今日が期日です' :
                          `あと${getDaysUntilDeadline(milestone.dueDate)}日`
                        }
                      </div>
                    </div>
                  )}
                  
                  {/* 提案中の期日 */}
                  {(milestone.dueDateStatus === 'proposed_by_client' || milestone.dueDateStatus === 'proposed_by_influencer') && milestone.proposedDueDate && (
                    <div className={`border rounded-lg p-3 ${
                      milestone.dueDateStatus === 'proposed_by_client' ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium text-sm ${
                          milestone.dueDateStatus === 'proposed_by_client' ? 'text-orange-700' : 'text-purple-700'
                        }`}>
                          {milestone.dueDateStatus === 'proposed_by_client' ? '🏢 企業からの提案' : '📺 インフルエンサーからの提案'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-3">
                        提案期日: {formatDateTime(milestone.proposedDueDate)}
                      </div>
                      
                      {/* 提案された側ではないユーザーに合意/拒否ボタンを表示 */}
                      {((milestone.dueDateStatus === 'proposed_by_client' && user?.role === 'INFLUENCER') ||
                        (milestone.dueDateStatus === 'proposed_by_influencer' && user?.role === 'CLIENT')) && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAgreeDueDate(milestone.id)}
                            className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg font-medium hover:bg-green-600 transition-colors"
                          >
                            ✅ 合意
                          </button>
                          <button
                            onClick={() => handleRejectDueDate(milestone.id)}
                            className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg font-medium hover:bg-gray-600 transition-colors"
                          >
                            ❌ 拒否
                          </button>
                        </div>
                      )}
                      
                      {/* 提案した側のユーザーには待機メッセージ */}
                      {((milestone.dueDateStatus === 'proposed_by_client' && user?.role === 'CLIENT') ||
                        (milestone.dueDateStatus === 'proposed_by_influencer' && user?.role === 'INFLUENCER')) && (
                        <div className="text-sm text-gray-600 text-center bg-gray-50 rounded p-2">
                          相手の回答を待っています...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 期日未設定 */}
                  {milestone.dueDateStatus === 'not_set' && (
                    <div className="space-y-3">
                      {showDatePicker === milestone.id ? (
                        <div className="space-y-3">
                          <input
                            type="datetime-local"
                            value={proposedDate}
                            onChange={(e) => setProposedDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleProposeDueDate(milestone.id, proposedDate)}
                              disabled={!proposedDate}
                              className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                              提案する
                            </button>
                            <button
                              onClick={() => {
                                setShowDatePicker(null);
                                setProposedDate('');
                              }}
                              className="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDatePicker(milestone.id)}
                          className="w-full px-3 py-2 bg-blue-50 border-2 border-dashed border-blue-300 text-blue-600 text-sm rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                          + 期日を提案する
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* 期日管理の説明 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">期日設定の流れ</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>・ 企業またはインフルエンサーのどちらかが期日を提案</p>
                    <p>・ 相手が合意または拒否で回答</p>
                    <p>・ 合意された期日が正式に設定されます</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
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

      {/* コンテ提出モーダル */}
      <AnimatePresence>
        {showConteForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {conteType === 'initial' ? '初稿' : '修正稿'}コンテ提出
                </h3>
                <button
                  onClick={() => setShowConteForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* フォーマット選択 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">コンテフォーマット</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="original"
                      checked={conteFormat === 'original'}
                      onChange={(e) => setConteFormat(e.target.value as 'original' | 'document')}
                      className="mr-2"
                    />
                    <span>ツール独自フォーマット</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="document"
                      checked={conteFormat === 'document'}
                      onChange={(e) => setConteFormat(e.target.value as 'original' | 'document')}
                      className="mr-2"
                    />
                    <span>ドキュメントアップロード</span>
                  </label>
                </div>
              </div>

              {/* ツール独自フォーマット */}
              {conteFormat === 'original' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">全体テーマ</label>
                    <input
                      type="text"
                      value={conteData.overallTheme}
                      onChange={(e) => setConteData(prev => ({...prev, overallTheme: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="動画の全体的なテーマを入力"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">目標時間（秒）</label>
                    <input
                      type="number"
                      value={conteData.targetDuration}
                      onChange={(e) => setConteData(prev => ({...prev, targetDuration: parseInt(e.target.value) || 60}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="15"
                      max="300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">キーメッセージ</label>
                    {conteData.keyMessages.map((message, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => {
                            const newMessages = [...conteData.keyMessages];
                            newMessages[index] = e.target.value;
                            setConteData(prev => ({...prev, keyMessages: newMessages}));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`キーメッセージ ${index + 1}`}
                        />
                        {conteData.keyMessages.length > 1 && (
                          <button
                            onClick={() => {
                              const newMessages = conteData.keyMessages.filter((_, i) => i !== index);
                              setConteData(prev => ({...prev, keyMessages: newMessages}));
                            }}
                            className="px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setConteData(prev => ({
                        ...prev, 
                        keyMessages: [...prev.keyMessages, '']
                      }))}
                      className="px-3 py-1 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      + メッセージ追加
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">シーン構成</label>
                    {conteData.scenes.map((scene, index) => (
                      <div key={scene.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">シーン {scene.sceneNumber}</h4>
                          {conteData.scenes.length > 1 && (
                            <button
                              onClick={() => {
                                const newScenes = conteData.scenes.filter(s => s.id !== scene.id);
                                setConteData(prev => ({...prev, scenes: newScenes}));
                              }}
                              className="text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                            >
                              削除
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">内容説明</label>
                            <textarea
                              value={scene.description}
                              onChange={(e) => {
                                const newScenes = conteData.scenes.map(s => 
                                  s.id === scene.id ? {...s, description: e.target.value} : s
                                );
                                setConteData(prev => ({...prev, scenes: newScenes}));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              rows={2}
                              placeholder="シーンの内容を説明"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">時間（秒）</label>
                            <input
                              type="number"
                              value={scene.duration}
                              onChange={(e) => {
                                const newScenes = conteData.scenes.map(s => 
                                  s.id === scene.id ? {...s, duration: parseInt(e.target.value) || 0} : s
                                );
                                setConteData(prev => ({...prev, scenes: newScenes}));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="1"
                              max="60"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">カメラアングル</label>
                            <select
                              value={scene.cameraAngle}
                              onChange={(e) => {
                                const newScenes = conteData.scenes.map(s => 
                                  s.id === scene.id ? {...s, cameraAngle: e.target.value} : s
                                );
                                setConteData(prev => ({...prev, scenes: newScenes}));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="フロント">フロント</option>
                              <option value="サイド">サイド</option>
                              <option value="アップ">アップ</option>
                              <option value="引き">引き</option>
                              <option value="俯瞰">俯瞰</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">備考</label>
                            <input
                              type="text"
                              value={scene.notes}
                              onChange={(e) => {
                                const newScenes = conteData.scenes.map(s => 
                                  s.id === scene.id ? {...s, notes: e.target.value} : s
                                );
                                setConteData(prev => ({...prev, scenes: newScenes}));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="特記事項など"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addConteScene}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
                    >
                      + シーン追加
                    </button>
                  </div>
                </div>
              )}

              {/* ドキュメントアップロード */}
              {conteFormat === 'document' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">コンテファイル</label>
                    <input
                      type="file"
                      onChange={handleConteFileUpload}
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.png,.jpg,.jpeg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Word, PowerPoint, Excel, 画像ファイルに対応
                    </p>
                  </div>
                  
                  {conteFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">選択されたファイル:</p>
                      {conteFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                          <button
                            onClick={() => setConteFiles(files => files.filter((_, i) => i !== index))}
                            className="text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">説明・補足</label>
                    <textarea
                      value={conteDescription}
                      onChange={(e) => setConteDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="コンテの説明や補足事項を入力してください"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConteForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitConte}
                  className="px-6 py-2 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
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

      {/* 動画提出モーダル（初稿・修正版） */}
      <AnimatePresence>
        {showVideoSubmitForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {videoSubmitType === 'initial' ? '初稿' : '修正'}動画提出
                </h3>
                <button
                  onClick={() => setShowVideoSubmitForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 動画タイプ選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">動画タイプ</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="initial"
                        checked={videoSubmitType === 'initial'}
                        onChange={(e) => setVideoSubmitType(e.target.value as 'initial' | 'revised')}
                        className="mr-2"
                      />
                      <span>初稿動画</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="revised"
                        checked={videoSubmitType === 'revised'}
                        onChange={(e) => setVideoSubmitType(e.target.value as 'initial' | 'revised')}
                        className="mr-2"
                      />
                      <span>修正版動画</span>
                    </label>
                  </div>
                </div>

                {/* 動画ファイルアップロード */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">動画ファイル *</label>
                  <input
                    type="file"
                    onChange={handleVideoSubmitFileUpload}
                    multiple
                    accept="video/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    対応形式: MP4, MOV, AVI, WMV, MKV など
                  </p>
                </div>

                {/* 選択されたファイル一覧 */}
                {videoSubmitFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">選択された動画:</p>
                    {videoSubmitFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            🎬
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setVideoSubmitFiles(files => files.filter((_, i) => i !== index))}
                          className="text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 説明・補足 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">説明・補足</label>
                  <textarea
                    value={videoSubmitDescription}
                    onChange={(e) => setVideoSubmitDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder={`${videoSubmitType === 'initial' ? '初稿' : '修正版'}動画の説明や補足事項を入力してください`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowVideoSubmitForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitVideoDeliverable}
                  className="px-6 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                  disabled={videoSubmitFiles.length === 0}
                >
                  提出する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* コンテ修正指摘モーダル */}
      <AnimatePresence>
        {showConteRevisionForm && selectedConteForRevision && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  コンテの詳細な修正指摘
                </h3>
                <button
                  onClick={() => setShowConteRevisionForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 全体的なフィードバック */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">全体的なフィードバック *</label>
                <textarea
                  value={revisionData.overallFeedback}
                  onChange={(e) => setRevisionData(prev => ({...prev, overallFeedback: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="コンテ全体に対するフィードバックを記入してください"
                />
              </div>

              {/* テーマ修正 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">🎯 テーマについて</h4>
                <div className="mb-2">
                  <label className="block text-xs text-gray-600 mb-1">現在のテーマ</label>
                  <div className="px-3 py-2 bg-white border rounded text-sm">
                    {selectedConteForRevision.conteData.overallTheme}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">提案テーマ（任意）</label>
                    <input
                      type="text"
                      value={revisionData.themeRevision?.suggestedTheme || ''}
                      onChange={(e) => setRevisionData(prev => ({
                        ...prev,
                        themeRevision: {...prev.themeRevision, suggestedTheme: e.target.value}
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="新しいテーマの提案"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">コメント</label>
                    <textarea
                      value={revisionData.themeRevision?.comment || ''}
                      onChange={(e) => setRevisionData(prev => ({
                        ...prev,
                        themeRevision: {...prev.themeRevision, comment: e.target.value}
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      rows={2}
                      placeholder="テーマについてのコメント"
                    />
                  </div>
                </div>
              </div>

              {/* 時間修正 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">⏱️ 時間について</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">現在の目標時間</label>
                    <div className="px-3 py-2 bg-white border rounded text-sm">
                      {selectedConteForRevision.conteData.targetDuration}秒
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">提案時間（任意）</label>
                    <input
                      type="number"
                      value={revisionData.durationRevision?.suggestedDuration || ''}
                      onChange={(e) => setRevisionData(prev => ({
                        ...prev,
                        durationRevision: {...prev.durationRevision, suggestedDuration: parseInt(e.target.value) || null}
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="秒"
                      min="15"
                      max="600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">コメント</label>
                    <textarea
                      value={revisionData.durationRevision?.comment || ''}
                      onChange={(e) => setRevisionData(prev => ({
                        ...prev,
                        durationRevision: {...prev.durationRevision, comment: e.target.value}
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      rows={2}
                      placeholder="時間についてのコメント"
                    />
                  </div>
                </div>
              </div>

              {/* シーン別修正 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">🎬 シーン別修正点</h4>
                <div className="space-y-4">
                  {revisionData.sceneRevisions.map((revision: any, index: number) => (
                    <div key={revision.sceneId} className="bg-white rounded p-3 border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">シーン {revision.sceneNumber}</h5>
                        <select
                          value={revision.priority}
                          onChange={(e) => updateSceneRevision(revision.sceneId, 'priority', e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="low">優先度: 低</option>
                          <option value="medium">優先度: 中</option>
                          <option value="high">優先度: 高</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">現在の内容</label>
                          <div className="px-2 py-1 bg-gray-50 border rounded text-xs">
                            {revision.currentValue}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">提案内容（任意）</label>
                          <textarea
                            value={revision.suggestedValue}
                            onChange={(e) => updateSceneRevision(revision.sceneId, 'suggestedValue', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            rows={2}
                            placeholder="新しい内容の提案"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">修正コメント</label>
                          <textarea
                            value={revision.comment}
                            onChange={(e) => updateSceneRevision(revision.sceneId, 'comment', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            rows={2}
                            placeholder="このシーンの修正点"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* キーメッセージ修正 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">💬 キーメッセージ修正</h4>
                <div className="space-y-3">
                  {revisionData.keyMessageRevisions.map((revision: any, index: number) => (
                    <div key={revision.index} className="bg-white rounded p-3 border">
                      <div className="font-medium text-sm mb-2">メッセージ {revision.index + 1}</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">現在のメッセージ</label>
                          <div className="px-2 py-1 bg-gray-50 border rounded text-xs">
                            {revision.currentMessage}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">提案メッセージ（任意）</label>
                          <input
                            type="text"
                            value={revision.suggestedMessage}
                            onChange={(e) => updateKeyMessageRevision(revision.index, 'suggestedMessage', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="新しいメッセージの提案"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">修正コメント</label>
                          <textarea
                            value={revision.comment}
                            onChange={(e) => updateKeyMessageRevision(revision.index, 'comment', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            rows={2}
                            placeholder="このメッセージの修正点"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowConteRevisionForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitConteRevision}
                  className="px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                  修正指摘を送信
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 提出物一覧サイドパネル */}
      <AnimatePresence>
        {showSubmissionPanel && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowSubmissionPanel(false)}
            />
            
            {/* サイドパネル */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <span className="mr-2">📁</span>
                    提出物一覧
                  </h3>
                  <button
                    onClick={() => setShowSubmissionPanel(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* フィルター */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => setSubmissionFilter('all')}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      submissionFilter === 'all'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('proposals')}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      submissionFilter === 'proposals'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    構成案
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('conte')}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      submissionFilter === 'conte'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    コンテ
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('videos')}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      submissionFilter === 'videos'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    動画
                  </button>
                </div>
              </div>
              
              {/* 提出物リスト */}
              <div className="p-4">
                {getFilteredSubmissions().length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-gray-500 text-sm">
                      {submissionFilter === 'all' ? '提出物がありません' : 'フィルターに該当する提出物がありません'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredSubmissions().map((submission) => (
                      <div
                        key={submission.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {submission.type === 'proposal' ? '📝' :
                               submission.type === 'conte' ? '📋' : '🎬'}
                            </span>
                            <div>
                              <h4 className="font-medium text-sm text-gray-900">{submission.title}</h4>
                              <p className="text-xs text-gray-500">{formatTimestamp(submission.submittedAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded ${
                              submission.type === 'proposal' ? 'bg-blue-100 text-blue-700' :
                              submission.type === 'conte' ? 'bg-purple-100 text-purple-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {submission.type === 'proposal' ? '構成案' :
                               submission.type === 'conte' ? 'コンテ' : '動画'}
                            </span>
                          </div>
                        </div>
                        
                        {/* プレビュー情報 */}
                        <div className="text-xs text-gray-600">
                          {submission.type === 'proposal' && submission.data.concept && (
                            <p className="truncate">{submission.data.concept}</p>
                          )}
                          {submission.type === 'conte' && submission.data.overallTheme && (
                            <p className="truncate">テーマ: {submission.data.overallTheme}</p>
                          )}
                          {submission.type === 'video' && submission.data.description && (
                            <p className="truncate">{submission.data.description}</p>
                          )}
                        </div>
                        
                        {/* ファイル数 */}
                        {submission.message.attachments && (
                          <div className="mt-2 text-xs text-gray-500">
                            📎 {submission.message.attachments.length}個のファイル
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 提出物詳細モーダル */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {selectedSubmission.type === 'proposal' ? '📝' :
                     selectedSubmission.type === 'conte' ? '📋' : '🎬'}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedSubmission.title}</h3>
                    <p className="text-sm text-gray-500">{formatTimestamp(selectedSubmission.submittedAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 提出物の詳細内容 */}
              <div className="space-y-4">
                {/* 構成案詳細 */}
                {selectedSubmission.type === 'proposal' && selectedSubmission.data && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">📋 構成案詳細</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>タイトル:</strong> {selectedSubmission.data.title}</div>
                        <div><strong>コンセプト:</strong> {selectedSubmission.data.concept}</div>
                        <div><strong>構成:</strong> {selectedSubmission.data.structure}</div>
                        <div><strong>成果物:</strong> {selectedSubmission.data.deliverables}</div>
                        <div><strong>タイムライン:</strong> {selectedSubmission.data.timeline}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* コンテ詳細 */}
                {selectedSubmission.type === 'conte' && selectedSubmission.data && (
                  <div className="space-y-3">
                    <div className="bg-purple-50 rounded p-4">
                      <h4 className="font-semibold text-purple-800 mb-2">📋 コンテ詳細</h4>
                      {selectedSubmission.data.format === 'original' ? (
                        <div className="space-y-2 text-sm">
                          <div><strong>テーマ:</strong> {selectedSubmission.data.overallTheme}</div>
                          <div><strong>目標時間:</strong> {selectedSubmission.data.targetDuration}秒</div>
                          <div><strong>シーン数:</strong> {selectedSubmission.data.scenes?.length || 0}シーン</div>
                          {selectedSubmission.data.keyMessages && (
                            <div>
                              <strong>キーメッセージ:</strong>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {selectedSubmission.data.keyMessages.map((msg: string, index: number) => (
                                  <li key={index}>{msg}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm">
                          <strong>ドキュメント形式で提出</strong>
                        </div>
                      )}
                    </div>

                    {/* シーン詳細 */}
                    {selectedSubmission.data.format === 'original' && selectedSubmission.data.scenes && (
                      <div className="bg-white border rounded p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">🎬 シーン構成</h4>
                        <div className="space-y-3">
                          {selectedSubmission.data.scenes.map((scene: any, index: number) => (
                            <div key={scene.id} className="border border-gray-200 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-sm">シーン {scene.sceneNumber}</h5>
                                <div className="text-xs text-gray-500">
                                  {scene.duration}秒 • {scene.cameraAngle}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700">{scene.description}</p>
                              {scene.notes && (
                                <p className="text-xs text-gray-500 mt-1">備考: {scene.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 動画詳細 */}
                {selectedSubmission.type === 'video' && selectedSubmission.data && (
                  <div className="space-y-3">
                    <div className="bg-green-50 rounded p-4">
                      <h4 className="font-semibold text-green-800 mb-2">🎬 動画詳細</h4>
                      <div className="space-y-2 text-sm">
                        {selectedSubmission.data.type && (
                          <div><strong>タイプ:</strong> {selectedSubmission.data.type === 'initial' ? '初稿' : '修正版'}</div>
                        )}
                        {selectedSubmission.data.description && (
                          <div><strong>説明:</strong> {selectedSubmission.data.description}</div>
                        )}
                        {selectedSubmission.data.submittedAt && (
                          <div><strong>提出日:</strong> {formatTimestamp(selectedSubmission.data.submittedAt)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ファイル一覧 */}
                {selectedSubmission.message.attachments && (
                  <div className="bg-gray-50 rounded p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">📎 添付ファイル</h4>
                    <div className="space-y-2">
                      {selectedSubmission.message.attachments.map((attachment: any) => (
                        <div key={attachment.id} className="flex items-center space-x-3 bg-white rounded p-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            {attachment.fileType.startsWith('video/') ? '🎬' :
                             attachment.fileType.startsWith('image/') ? '🖼️' : '📄'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{attachment.fileName}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</div>
                          </div>
                          {attachment.fileType.startsWith('video/') && (
                            <video
                              src={attachment.fileUrl}
                              controls
                              className="w-32 h-20 object-cover rounded"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  閉じる
                </button>
                {user?.role === 'CLIENT' && selectedSubmission.type === 'conte' && selectedSubmission.data.format === 'original' && (
                  <button
                    onClick={() => {
                      handleOpenConteRevision(selectedSubmission.message);
                      setSelectedSubmission(null);
                      setShowSubmissionPanel(false);
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    🔍 修正指摘
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectChatPage;