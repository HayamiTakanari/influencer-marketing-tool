// プロジェクトチャットページで使用する型定義

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  messageType: 'text' | 'video' | 'file' | 'conte' | 'revised_conte' | 'initial_video' | 'revised_video' | 'conte_revision_request' | 'direct_comment' | 'nda_approved';
  sender: {
    id: string;
    role: "COMPANY" | 'INFLUENCER';
    displayName: string;
  };
  attachments?: {
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  }[];
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
    // AIコンテンツチェック結果
    aiContentCheck?: {
      id: string;
      checkedAt: string;
      overallAlignment: 'aligned' | 'minor_issues' | 'major_issues';
      issues: {
        id: string;
        category: 'theme' | 'message' | 'scene_content' | 'duration' | 'target_audience' | 'brand_guideline' | 'yakujiho_violation';
        severity: 'low' | 'medium' | 'high';
        title: string;
        description: string;
        affectedElement: 'overall_theme' | 'key_message' | 'scene' | 'duration' | 'target_content';
        affectedElementId?: string;
        suggestion?: string;
        yakujihoInfo?: {
          violatedText: string;
          lawReference: string;
          riskLevel: number;
        };
      }[];
      confidence: number; // 0-100
      yakujihoResult?: {
        hasViolations: boolean;
        riskScore: number;
        summary: string;
        recommendations: string[];
      };
    };
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
  directCommentData?: {
    targetMessageId: string;
    targetType: 'theme' | 'scene' | 'keyMessage' | 'duration';
    targetId?: string;
    targetContent: string;
    comment: string;
  };
}

export interface ProjectProgress {
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
    proposedBy?: "company" | 'influencer';
  }[];
  nextAction: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    assignee: "company" | 'influencer';
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  brandName?: string;
  productName?: string;
  productFeatures?: string;
  campaignObjective?: string;
  campaignTarget?: string;
  messageToConvey?: string;
  targetPlatforms?: string[];
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

// 構成案データの型
export interface ConteData {
  title: string;
  scenes: {
    id: string;
    sceneNumber: number;
    description: string;
    duration: number;
    cameraAngle: string;
    notes: string;
  }[];
  targetDuration: number;
  overallTheme: string;
  keyMessages: string[];
}

// 修正指摘データの型
export interface RevisionData {
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
  } | null;
  durationRevision?: {
    currentDuration: number;
    suggestedDuration?: number;
    comment: string;
  } | null;
}

// 直接コメント対象の型
export interface DirectCommentTarget {
  messageId: string;
  targetType: 'theme' | 'scene' | 'keyMessage' | 'duration';
  targetId?: string;
  targetContent: string;
}

// 提出物の型
export interface Submission {
  id: string;
  type: 'conte' | 'video';
  title: string;
  submittedAt: string;
  data: any;
  message: Message;
}

// ユーザーの型
export interface User {
  id: string;
  email: string;
  role: "COMPANY" | 'INFLUENCER';
  displayName?: string;
}