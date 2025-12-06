// AI コンテンツチェック機能
// プロジェクト情報と構成案内容の整合性、薬機法違反をAIで判定

import { checkYakujihoViolations, YakujihoCheckResult, detectProductCategory } from './yakujiho-checker';

interface ProjectInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  brandName?: string;
  productName?: string;
  productFeatures?: string;
  campaignObjective: string;
  campaignTarget: string;
  messageToConvey: string | string[]; // 配列形式にも対応
  targetPlatforms: string[];
  budget?: number;
  deadline?: string;
}

interface ConteInfo {
  messageContent: string; // メッセージの全文
  overallTheme?: string;
  keyMessages?: string[];
  scenes?: Array<{
    id: string;
    sceneNumber: number;
    description: string;
    duration?: number;
    cameraAngle?: string;
    notes?: string;
  }>;
  targetDuration?: number;
  estimatedBudget?: number;
  deliverables?: string[]; // 成果物（動画、写真など）
}

interface AIContentCheckIssue {
  id: string;
  category: 'theme' | 'message' | 'scene_content' | 'duration' | 'target_audience' | 'brand_guideline' | 'yakujiho_violation';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedElement: 'overall_theme' | 'key_message' | 'scene' | 'duration' | 'target_content' | 'yakujiho_content';
  affectedElementId?: string;
  suggestion?: string;
  yakujihoInfo?: {
    violatedText: string;
    lawReference: string;
    riskLevel: number;
  };
}

interface AIContentCheckResult {
  id: string;
  checkedAt: string;
  overallAlignment: 'aligned' | 'minor_issues' | 'major_issues';
  issues: AIContentCheckIssue[];
  confidence: number;
  yakujihoResult?: YakujihoCheckResult;
}

// メッセージから構成案情報を抽出するヘルパー関数
const extractConteFromMessage = (messageContent: string): ConteInfo => {
  const conte: ConteInfo = { messageContent };
  
  // テーマの抽出
  const themeMatch = messageContent.match(/テーマ[:\s]*([^\n\r]+)/i);
  if (themeMatch) conte.overallTheme = themeMatch[1].trim();
  
  // キーメッセージの抽出
  const messageMatches = messageContent.match(/キーメッセージ[:\s]*([^シーン]+)/is);
  if (messageMatches) {
    conte.keyMessages = messageMatches[1]
      .split(/[-・\n]/)
      .map(msg => msg.trim())
      .filter(msg => msg && !msg.match(/^[:\s]*$/));
  }
  
  // シーンの抽出
  const sceneMatches = messageContent.match(/シーン\d+[:\s]*([^\n\r]+)/gi);
  if (sceneMatches) {
    conte.scenes = sceneMatches.map((match, index) => {
      const durationMatch = match.match(/\((\d+)\s*秒\)/);
      return {
        id: `scene-${index + 1}`,
        sceneNumber: index + 1,
        description: match.replace(/シーン\d+[:\s]*/, '').replace(/\(\d+\s*秒\)/, '').trim(),
        duration: durationMatch ? parseInt(durationMatch[1]) : undefined
      };
    });
  }
  
  return conte;
};

// 改良されたAI判定機能
export const checkConteAlignment = async (
  projectInfo: ProjectInfo, 
  conteInfo: ConteInfo | string // 文字列の場合は自動抽出
): Promise<AIContentCheckResult> => {
  // 文字列の場合は構成案情報を自動抽出
  const conte = typeof conteInfo === 'string' ? extractConteFromMessage(conteInfo) : conteInfo;
  
  console.log('🤖 AIチェック開始:', { project: projectInfo.title, conte: conte.overallTheme });
  
  const issues: AIContentCheckIssue[] = [];
  
  // 薬機法チェックを実行
  console.log('⚖️ 薬機法チェック開始...');
  const yakujihoResult = checkYakujihoViolations(conte.messageContent);
  
  // 薬機法違反があれば issues に追加
  if (yakujihoResult.hasViolations) {
    yakujihoResult.violations.forEach((violation, index) => {
      issues.push({
        id: `yakujiho-${violation.violation.id}-${index}`,
        category: 'yakujiho_violation',
        severity: violation.violation.severity,
        title: `⚖️ 薬機法違反の可能性`,
        description: `「${violation.matchedText}」が${violation.violation.description}に該当する可能性があります。`,
        affectedElement: 'yakujiho_content',
        suggestion: violation.violation.example ? `適切な表現例: ${violation.violation.example}` : '表現の見直しをお勧めします。',
        yakujihoInfo: {
          violatedText: violation.matchedText,
          lawReference: violation.violation.law_reference,
          riskLevel: violation.violation.risk_level
        }
      });
    });
    console.log(`⚖️ 薬機法違反 ${yakujihoResult.violations.length} 件検出`);
  } else {
    console.log('✅ 薬機法違反なし');
  }
  
  // プロジェクトの「伝えたいこと」を配列に正規化
  const projectMessages = Array.isArray(projectInfo.messageToConvey) 
    ? projectInfo.messageToConvey.filter(msg => msg.trim())
    : [projectInfo.messageToConvey].filter(msg => msg.trim());
  
  // 1. テーマの整合性チェック
  if (conte.overallTheme) {
    const projectKeywords = [
      ...projectInfo.campaignObjective.toLowerCase().split(/\s+/),
      ...projectMessages.join(' ').toLowerCase().split(/\s+/),
      ...(projectInfo.productFeatures || '').toLowerCase().split(/\s+/)
    ].filter(word => word.length > 2);
    
    const conteThemeWords = conte.overallTheme.toLowerCase();
    
    // カテゴリー別関連キーワード
    const categoryKeywords: { [key: string]: string[] } = {
      '美容・化粧品': ['スキンケア', '化粧', '美容', '保湿', 'ケア', '肌', 'メイク'],
      'ファッション': ['コーディネート', 'スタイリング', 'ファッション', '着こなし'],
      'グルメ・食品': ['レシピ', '料理', '食べ物', 'グルメ', 'レストラン', '美味'],
      'ライフスタイル': ['日常', 'ライフスタイル', '暮らし', '生活'],
      'フィットネス・健康': ['トレーニング', 'ダイエット', '健康', 'フィットネス', '運動']
    };
    
    const relevantKeywords = categoryKeywords[projectInfo.category] || [];
    
    const hasThemeAlignment = projectKeywords.some(keyword => 
      conteThemeWords.includes(keyword)
    ) || relevantKeywords.some(keyword => 
      conteThemeWords.includes(keyword)
    );
    
    if (!hasThemeAlignment) {
      issues.push({
        id: 'theme-mismatch-1',
        category: 'theme',
        severity: 'high',
        title: '❗ テーマとプロジェクト内容の不一致',
        description: `構成案のテーマ「${conte.overallTheme}」がプロジェクトの趣旨と合致していません。`,
        affectedElement: 'overall_theme',
        suggestion: `プロジェクト「${projectInfo.title}」の目的「${projectInfo.campaignObjective}」に沿ったテーマに変更することをお勧めします。`
      });
    }
  }
  
  // 2. キーメッセージの整合性チェック
  if (conte.keyMessages && conte.keyMessages.length > 0) {
    const projectMessageText = projectMessages.join(' ').toLowerCase();
    
    let alignedMessagesCount = 0;
    
    conte.keyMessages.forEach((message, index) => {
      const messageWords = message.toLowerCase().split(/\s+/);
      const hasAlignment = messageWords.some(word => 
        projectMessages.some(pMessage => 
          pMessage.toLowerCase().includes(word) || 
          word.includes(pMessage.toLowerCase().split(' ')[0])
        )
      );
      
      if (hasAlignment) alignedMessagesCount++;
    });
    
    const alignmentRatio = alignedMessagesCount / conte.keyMessages.length;
    
    if (alignmentRatio < 0.3) { // 30%未満の場合は警告
      issues.push({
        id: 'message-mismatch-1',
        category: 'message',
        severity: 'medium',
        title: '⚠️ キーメッセージの内容不足',
        description: `構成案のキーメッセージがプロジェクトで伝えたい内容と十分に合致していません。一致率: ${Math.round(alignmentRatio * 100)}%`,
        affectedElement: 'key_message',
        suggestion: `プロジェクトで重視している「${projectMessages.join('」「')}」の要素をキーメッセージに含めることをお勧めします。`
      });
    }
  }
  
  // 3. シーン内容の妥当性チェック
  if (conte.scenes && conte.scenes.length > 0) {
    const categoryMismatchScenes: any[] = [];
    
    // カテゴリー別の不適切なキーワード
    const inappropriateKeywords: { [key: string]: string[] } = {
      '美容・化粧品': ['食べ', '料理', 'グルメ', 'ラーメン', '居酒屋'],
      'グルメ・食品': ['化粧', 'スキンケア', 'メイク'],
      'ファッション': ['料理', '食事', 'スキンケア'],
      'フィットネス・健康': ['食べ放題', 'お酒', '甘いもの']
    };
    
    const badKeywords = inappropriateKeywords[projectInfo.category] || [];
    
    conte.scenes.forEach(scene => {
      const hasInappropriateContent = badKeywords.some(keyword => 
        scene.description.toLowerCase().includes(keyword)
      );
      
      if (hasInappropriateContent) {
        categoryMismatchScenes.push(scene);
      }
    });
    
    if (categoryMismatchScenes.length > 0) {
      issues.push({
        id: 'scene-category-mismatch-1',
        category: 'scene_content',
        severity: 'medium',
        title: '🎬 シーン内容とカテゴリーの不一致',
        description: `「${projectInfo.category}」のプロジェクトですが、カテゴリーに合わない内容のシーンが${categoryMismatchScenes.length}個含まれています。`,
        affectedElement: 'scene',
        suggestion: `プロジェクトカテゴリー「${projectInfo.category}」に適したシーン内容に変更することをお勧めします。商品やサービスの実際の使用場面を中心に構成してください。`
      });
    }
  }
  
  // 4. 動画尺とプラットフォームの適合性チェック
  const scenesWithDuration = conte.scenes?.filter(scene => scene.duration) || [];
  if (scenesWithDuration.length > 0) {
    const totalDuration = scenesWithDuration.reduce((sum, scene) => sum + (scene.duration || 0), 0);
    
    // プラットフォーム別推奨尺
    const platformDurationLimits: { [key: string]: { max: number; optimal: string } } = {
      'TIKTOK': { max: 60, optimal: '15-60秒' },
      'INSTAGRAM_REEL': { max: 90, optimal: '15-90秒' },
      'INSTAGRAM_STORY': { max: 15, optimal: '15秒以内' },
      'YOUTUBE_SHORTS': { max: 60, optimal: '30-60秒' },
      'TWITTER': { max: 140, optimal: '30-140秒' }
    };
    
    projectInfo.targetPlatforms.forEach(platform => {
      const limit = platformDurationLimits[platform];
      if (limit && totalDuration > limit.max) {
        issues.push({
          id: `duration-${platform.toLowerCase()}-1`,
          category: 'duration',
          severity: 'medium',
          title: `⏱️ ${platform}の動画尺オーバー`,
          description: `${platform}向けですが、動画尺が${totalDuration}秒で推奨時間を超えています。`,
          affectedElement: 'duration',
          suggestion: `${platform}では${limit.optimal}の動画がより効果的です。シーンを短縮するか、重要な部分に絞ることをお勧めします。`
        });
      }
    });
  }
  
  // 5. ターゲットオーディエンスの適合性チェック
  if (conte.messageContent) {
    const targetAge = projectInfo.campaignTarget.toLowerCase();
    const isYoungTarget = targetAge.includes('10代') || targetAge.includes('20代');
    const isBusinessTarget = targetAge.includes('ビジネス') || targetAge.includes('会社員');
    
    if (isYoungTarget && conte.messageContent.includes('敬語') && conte.messageContent.length > 100) {
      issues.push({
        id: 'target-mismatch-1',
        category: 'target_audience',
        severity: 'low',
        title: '📱 ターゲットと表現スタイルのミスマッチ',
        description: '若年層向けですが、少し堅い表現が含まれている可能性があります。',
        affectedElement: 'target_content',
        suggestion: 'より親しみやすく、カジュアルな表現にすることで若年層により響きやすくなります。'
      });
    }
  }
  
  // 6. 全体的な評価を決定
  const highIssues = issues.filter(issue => issue.severity === 'high').length;
  const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
  const lowIssues = issues.filter(issue => issue.severity === 'low').length;
  
  let overallAlignment: 'aligned' | 'minor_issues' | 'major_issues';
  let confidenceScore = 95; // 基本信頼度
  
  if (highIssues > 0) {
    overallAlignment = 'major_issues';
    confidenceScore -= (highIssues * 20);
  } else if (mediumIssues > 1) {
    overallAlignment = 'major_issues';
    confidenceScore -= (mediumIssues * 15);
  } else if (mediumIssues > 0 || lowIssues > 2) {
    overallAlignment = 'minor_issues';
    confidenceScore -= (mediumIssues * 10 + lowIssues * 5);
  } else {
    overallAlignment = 'aligned';
  }
  
  const result = {
    id: `ai-check-${Date.now()}`,
    checkedAt: new Date().toISOString(),
    overallAlignment,
    issues,
    confidence: Math.max(60, confidenceScore),
    yakujihoResult
  };
  
  console.log('🤖 AIチェック完了:', {
    project: projectInfo.title,
    result: overallAlignment,
    issueCount: issues.length,
    confidence: result.confidence
  });
  
  return result;
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