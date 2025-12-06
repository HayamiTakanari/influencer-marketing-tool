/**
 * 薬機法違反チェック機能
 */

import { YAKUJIHO_VIOLATIONS, YakujihoViolation, SEVERITY_LEVELS, APPROPRIATE_EXPRESSIONS } from '../data/yakujiho-regulations';

export interface YakujihoCheckResult {
  hasViolations: boolean;
  violations: YakujihoViolationMatch[];
  riskScore: number; // 0-10のリスクスコア
  summary: string;
  recommendations: string[];
}

export interface YakujihoViolationMatch {
  violation: YakujihoViolation;
  matchedText: string;
  position: {
    start: number;
    end: number;
  };
  context: string; // マッチした部分の前後文脈
  confidence: number; // 0-1の信頼度
}

/**
 * テキストの薬機法違反をチェック
 */
export const checkYakujihoViolations = (text: string): YakujihoCheckResult => {
  const violations: YakujihoViolationMatch[] = [];
  let totalRiskScore = 0;

  // 各違反パターンをチェック
  YAKUJIHO_VIOLATIONS.forEach(violation => {
    const regex = new RegExp(violation.pattern, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchedText = match[0];
      const start = match.index;
      const end = start + matchedText.length;
      
      // 前後の文脈を取得（前後30文字）
      const contextStart = Math.max(0, start - 30);
      const contextEnd = Math.min(text.length, end + 30);
      const context = text.substring(contextStart, contextEnd);

      // 信頼度を計算（パターンの複雑さと一致度から）
      const confidence = calculateConfidence(matchedText, violation.pattern);

      violations.push({
        violation,
        matchedText,
        position: { start, end },
        context,
        confidence
      });

      totalRiskScore += violation.risk_level * confidence;
    }
  });

  // リスクスコアを正規化（0-10）
  const riskScore = Math.min(10, totalRiskScore / Math.max(1, violations.length));

  // サマリーとレコメンデーションを生成
  const summary = generateSummary(violations, riskScore);
  const recommendations = generateRecommendations(violations);

  return {
    hasViolations: violations.length > 0,
    violations,
    riskScore,
    summary,
    recommendations
  };
};

/**
 * 信頼度を計算
 */
const calculateConfidence = (matchedText: string, pattern: string): number => {
  // 基本信頼度
  let confidence = 0.8;

  // マッチした文字列の長さで調整
  if (matchedText.length < 3) {
    confidence -= 0.3;
  } else if (matchedText.length > 10) {
    confidence += 0.1;
  }

  // 完全一致の場合は信頼度を上げる
  if (pattern.includes(matchedText)) {
    confidence += 0.1;
  }

  return Math.max(0.1, Math.min(1.0, confidence));
};

/**
 * サマリーを生成
 */
const generateSummary = (violations: YakujihoViolationMatch[], riskScore: number): string => {
  if (violations.length === 0) {
    return '薬機法違反の可能性は検出されませんでした。';
  }

  const highRiskCount = violations.filter(v => v.violation.severity === 'high').length;
  const mediumRiskCount = violations.filter(v => v.violation.severity === 'medium').length;
  const lowRiskCount = violations.filter(v => v.violation.severity === 'low').length;

  let summary = `${violations.length}件の薬機法違反の可能性を検出しました。`;
  
  if (highRiskCount > 0) {
    summary += ` 高リスク: ${highRiskCount}件`;
  }
  if (mediumRiskCount > 0) {
    summary += ` 中リスク: ${mediumRiskCount}件`;
  }
  if (lowRiskCount > 0) {
    summary += ` 低リスク: ${lowRiskCount}件`;
  }

  summary += ` (リスクスコア: ${riskScore.toFixed(1)}/10)`;

  return summary;
};

/**
 * レコメンデーションを生成
 */
const generateRecommendations = (violations: YakujihoViolationMatch[]): string[] => {
  const recommendations: string[] = [];
  const categoryCounts: Record<string, number> = {};

  // カテゴリ別の違反数をカウント
  violations.forEach(violation => {
    const category = violation.violation.category;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // 高リスク違反への対応
  const highRiskViolations = violations.filter(v => v.violation.severity === 'high');
  if (highRiskViolations.length > 0) {
    recommendations.push('⚠️ 高リスクの違反表現が検出されました。即座に修正してください。');
    
    highRiskViolations.forEach(v => {
      recommendations.push(`• "${v.matchedText}" → ${v.violation.description}`);
    });
  }

  // カテゴリ別のアドバイス
  if (categoryCounts.cosmetics > 0) {
    recommendations.push('💄 化粧品に関する表現について:');
    APPROPRIATE_EXPRESSIONS.cosmetics.forEach(expr => {
      recommendations.push(`  ✓ "${expr}" のような表現をご検討ください`);
    });
  }

  if (categoryCounts['health-food'] > 0) {
    recommendations.push('🌿 健康食品に関する表現について:');
    APPROPRIATE_EXPRESSIONS['health-food'].forEach(expr => {
      recommendations.push(`  ✓ "${expr}" のような表現をご検討ください`);
    });
  }

  // 一般的なアドバイス
  if (violations.some(v => v.violation.id.startsWith('com-'))) {
    recommendations.push('📋 一般的なアドバイス:');
    recommendations.push('  • 効果の絶対的保証は避けましょう');
    recommendations.push('  • 医師の推奨等の表現は慎重に使用しましょう');
    recommendations.push('  • 公的機関の認可表現は事実確認が必要です');
  }

  return recommendations;
};

/**
 * カテゴリ別の商品タイプを判定
 */
export const detectProductCategory = (text: string): string[] => {
  const categories: string[] = [];
  
  // 化粧品関連キーワード
  const cosmeticsKeywords = ['化粧品', 'コスメ', 'スキンケア', '美容液', 'クリーム', 'ローション', 'ファンデーション', 'リップ', 'マスカラ'];
  if (cosmeticsKeywords.some(keyword => text.includes(keyword))) {
    categories.push('cosmetics');
  }

  // 健康食品関連キーワード
  const healthFoodKeywords = ['サプリ', 'サプリメント', '健康食品', '栄養補助食品', 'ダイエット', 'プロテイン'];
  if (healthFoodKeywords.some(keyword => text.includes(keyword))) {
    categories.push('health-food');
  }

  // 医療機器関連キーワード
  const medicalDeviceKeywords = ['医療機器', 'マッサージ器', '治療器', '測定器'];
  if (medicalDeviceKeywords.some(keyword => text.includes(keyword))) {
    categories.push('medical-device');
  }

  // 医薬品関連キーワード
  const medicineKeywords = ['薬', '医薬品', '治療', '診断', '処方'];
  if (medicineKeywords.some(keyword => text.includes(keyword))) {
    categories.push('medicine');
  }

  return categories.length > 0 ? categories : ['cosmetics']; // デフォルトは化粧品
};

/**
 * 薬機法チェックの重要度に基づく色分け
 */
export const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
  switch (severity) {
    case 'high':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-orange-600 bg-orange-50';
    case 'low':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

/**
 * 薬機法チェック結果のフォーマット
 */
export const formatYakujihoResults = (results: YakujihoCheckResult): string => {
  if (!results.hasViolations) {
    return '✅ 薬機法違反の可能性は検出されませんでした。';
  }

  let formatted = `⚠️ ${results.summary}\n\n`;
  
  results.violations.forEach((violation, index) => {
    formatted += `${index + 1}. 【${SEVERITY_LEVELS[violation.violation.severity]}】\n`;
    formatted += `   問題箇所: "${violation.matchedText}"\n`;
    formatted += `   説明: ${violation.violation.description}\n`;
    formatted += `   法的根拠: ${violation.violation.law_reference}\n`;
    formatted += `   文脈: ...${violation.context}...\n\n`;
  });

  if (results.recommendations.length > 0) {
    formatted += '💡 改善提案:\n';
    results.recommendations.forEach(rec => {
      formatted += `${rec}\n`;
    });
  }

  return formatted;
};