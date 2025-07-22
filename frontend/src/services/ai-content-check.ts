// AI コンテンツチェック機能
// プロジェクト情報とコンテ内容の整合性をAIで判定

interface ProjectInfo {
  title: string;
  description: string;
  category: string;
  brandName: string;
  productName: string;
  productFeatures: string;
  campaignObjective: string;
  campaignTarget: string;
  messageToConvey: string;
  targetPlatforms: string[];
}

interface ConteInfo {
  overallTheme?: string;
  keyMessages?: string[];
  scenes: Array<{
    id: string;
    sceneNumber: number;
    description: string;
    duration: number;
    cameraAngle: string;
    notes?: string;
  }>;
  targetDuration?: number;
}

interface AIContentCheckIssue {
  id: string;
  category: 'theme' | 'message' | 'scene_content' | 'duration' | 'target_audience' | 'brand_guideline';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedElement: 'overall_theme' | 'key_message' | 'scene' | 'duration' | 'target_content';
  affectedElementId?: string;
  suggestion?: string;
}

interface AIContentCheckResult {
  id: string;
  checkedAt: string;
  overallAlignment: 'aligned' | 'minor_issues' | 'major_issues';
  issues: AIContentCheckIssue[];
  confidence: number;
}

// モックAI判定機能（実際はOpenAI APIなどを使用）
export const checkConteAlignment = async (
  projectInfo: ProjectInfo, 
  conteInfo: ConteInfo
): Promise<AIContentCheckResult> => {
  // 実際の実装では、プロジェクト情報とコンテ内容をAIに送信して判定
  
  // モック実装 - 実際はAIモデルを使用
  const issues: AIContentCheckIssue[] = [];
  
  // テーマの整合性チェック（シミュレーション）
  if (conteInfo.overallTheme) {
    const projectKeywords = [
      ...projectInfo.campaignObjective.toLowerCase().split(/\s+/),
      ...projectInfo.messageToConvey.toLowerCase().split(/\s+/),
      ...projectInfo.productFeatures.toLowerCase().split(/\s+/)
    ].filter(word => word.length > 2); // 2文字以下の単語は除外
    
    const conteThemeWords = conteInfo.overallTheme.toLowerCase().split(/\s+/);
    
    // より柔軟な類似度チェック（関連キーワードも含める）
    const beautyKeywords = ['スキンケア', '化粧', '美容', '保湿', 'ケア', '肌'];
    const hasCommonKeywords = projectKeywords.some(keyword => 
      conteThemeWords.some(word => word.includes(keyword) || keyword.includes(word))
    ) || (projectInfo.category === '美容・化粧品' && 
         beautyKeywords.some(keyword => conteInfo.overallTheme.includes(keyword)));
    
    if (!hasCommonKeywords) {
      issues.push({
        id: 'theme-mismatch-1',
        category: 'theme',
        severity: 'high',
        title: 'テーマの齟齬の可能性',
        description: 'コンテのテーマがプロジェクトの目的と異なる可能性があります',
        affectedElement: 'overall_theme',
        suggestion: `プロジェクトの目的「${projectInfo.campaignObjective}」により合致したテーマを検討してください`
      });
    }
  }
  
  // キーメッセージの整合性チェック
  if (conteInfo.keyMessages && conteInfo.keyMessages.length > 0) {
    const projectMessages = projectInfo.messageToConvey.toLowerCase();
    const projectMessageWords = projectMessages.split(/\s+/).filter(word => word.length > 1);
    
    const hasAlignedMessages = conteInfo.keyMessages.some(message => {
      const messageWords = message.toLowerCase().split(/\s+/);
      // より緩い条件：関連キーワードも考慮
      return messageWords.some(word => 
        projectMessageWords.some(pWord => 
          word.includes(pWord) || pWord.includes(word) || 
          (word.length > 2 && pWord.length > 2 && 
           (word.includes('効果') || word.includes('実感') || word.includes('潤い')) &&
           (pWord.includes('効果') || pWord.includes('保湿') || pWord.includes('乾燥')))
        )
      );
    });
    
    if (!hasAlignedMessages) {
      issues.push({
        id: 'message-mismatch-1',
        category: 'message',
        severity: 'medium',
        title: 'キーメッセージの齟齬',
        description: 'コンテのキーメッセージがプロジェクトで伝えたい内容と異なる可能性があります',
        affectedElement: 'key_message',
        suggestion: `プロジェクトで伝えたいこと「${projectInfo.messageToConvey}」を含める必要があります`
      });
    }
  }
  
  // シーン内容の妥当性チェック（簡易版）
  if (conteInfo.scenes.length > 0) {
    // 美容・化粧品プロジェクトで食べ物が中心のシーンが多い場合など
    if (projectInfo.category === '美容・化粧品') {
      const foodRelatedScenes = conteInfo.scenes.filter(scene => 
        scene.description.toLowerCase().includes('食べ') ||
        scene.description.toLowerCase().includes('料理') ||
        scene.description.toLowerCase().includes('グルメ')
      );
      
      if (foodRelatedScenes.length > conteInfo.scenes.length / 2) {
        issues.push({
          id: 'scene-category-mismatch-1',
          category: 'scene_content',
          severity: 'medium',
          title: 'カテゴリーとシーン内容の齟齬',
          description: '美容・化粧品のプロジェクトですが、食べ物中心のシーンが多く含まれています',
          affectedElement: 'scene',
          suggestion: '商品の使用シーンや効果を示すシーンに変更を検討してください'
        });
      }
    }
  }
  
  // 尺の妥当性チェック
  const totalDuration = conteInfo.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  if (projectInfo.targetPlatforms.includes('TIKTOK') && totalDuration > 60) {
    issues.push({
      id: 'duration-platform-mismatch-1',
      category: 'duration',
      severity: 'medium',
      title: 'プラットフォームと動画尺の齟齬',
      description: 'TikTok投稿予定ですが、動画が60秒を超えています',
      affectedElement: 'duration',
      suggestion: 'TikTokでは短尺動画（15-60秒）がより効果的です'
    });
  }
  
  // 全体的な評価を決定
  const highIssues = issues.filter(issue => issue.severity === 'high').length;
  const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
  
  let overallAlignment: 'aligned' | 'minor_issues' | 'major_issues';
  if (highIssues > 0 || mediumIssues > 2) {
    overallAlignment = 'major_issues';
  } else if (mediumIssues > 0 || issues.length > 0) {
    overallAlignment = 'minor_issues';
  } else {
    overallAlignment = 'aligned';
  }
  
  return {
    id: `ai-check-${Date.now()}`,
    checkedAt: new Date().toISOString(),
    overallAlignment,
    issues,
    confidence: Math.max(60, 100 - (issues.length * 10)) // 簡易的な信頼度計算
  };
};

// APIエンドポイント呼び出し（実際の実装）
export const performAIContentCheck = async (
  projectId: string,
  conteId: string
): Promise<AIContentCheckResult> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api';
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/conte/${conteId}/ai-check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('AIチェックに失敗しました');
    }
    
    return await response.json();
  } catch (error) {
    console.error('AI content check error:', error);
    throw error;
  }
};

export type { 
  ProjectInfo, 
  ConteInfo, 
  AIContentCheckIssue, 
  AIContentCheckResult 
};