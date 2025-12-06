import { Request, Response } from 'express';
import { sanitizeJsonData } from '../utils/xss-protection';

/**
 * セキュリティ関連のコントローラー
 */

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'referrer': string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  };
}

/**
 * CSP違反レポートの処理
 */
export const handleCSPReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = req.body as CSPViolationReport;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // レポートデータのサニタイゼーション
    const sanitizedReport = sanitizeJsonData(report);

    // ログ記録
    console.warn('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      clientIP,
      userAgent,
      report: sanitizedReport,
      headers: {
        referer: req.get('Referer'),
        origin: req.get('Origin')
      }
    });

    // 重要度の判定
    const violation = sanitizedReport['csp-report'];
    let severity = 'low';

    if (violation) {
      // スクリプトインジェクション等の高リスク違反
      if (violation['violated-directive']?.includes('script-src') || 
          violation['blocked-uri']?.includes('javascript:') ||
          violation['blocked-uri']?.includes('data:text/html')) {
        severity = 'high';
      } 
      // インラインスタイル等の中リスク違反
      else if (violation['violated-directive']?.includes('style-src') ||
               violation['violated-directive']?.includes('img-src')) {
        severity = 'medium';
      }
    }

    // 高リスクの場合は即座にアラート
    if (severity === 'high') {
      console.error('HIGH RISK CSP Violation detected:', {
        clientIP,
        blockedUri: violation?.['blocked-uri'],
        violatedDirective: violation?.['violated-directive'],
        documentUri: violation?.['document-uri']
      });

      // 本番環境では外部監視システムに通知
      if (process.env.NODE_ENV === 'production') {
        // await notifySecurityTeam(violation, clientIP);
      }
    }

    // 統計情報の更新（実装例）
    await updateCSPViolationStats(violation?.['violated-directive'] || 'unknown', severity);

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error processing CSP report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * XSS攻撃試行の報告処理
 */
export const handleXSSAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { input, location, userId } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // 入力データのサニタイゼーション
    const sanitizedData = {
      input: typeof input === 'string' ? input.substring(0, 500) : 'unknown', // 長さ制限
      location: typeof location === 'string' ? location.substring(0, 200) : 'unknown',
      userId: typeof userId === 'string' ? userId : null
    };

    // 重要なセキュリティインシデントとしてログ記録
    console.error('XSS Attack Attempt Detected:', {
      timestamp: new Date().toISOString(),
      clientIP,
      userAgent,
      userId: sanitizedData.userId,
      location: sanitizedData.location,
      inputSample: sanitizedData.input,
      headers: {
        referer: req.get('Referer'),
        origin: req.get('Origin')
      }
    });

    // 攻撃パターンの分析
    const attackPatterns = analyzeXSSPattern(sanitizedData.input);
    
    // 統計情報の更新
    await updateXSSAttemptStats(attackPatterns, clientIP);

    // 本番環境では即座にセキュリティチームに通知
    if (process.env.NODE_ENV === 'production') {
      // await notifySecurityTeam({
      //   type: 'XSS_ATTEMPT',
      //   clientIP,
      //   userId: sanitizedData.userId,
      //   patterns: attackPatterns
      // });
    }

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error processing XSS attempt report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * セキュリティ統計情報の取得（管理者用）
 */
export const getSecurityStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 管理者権限チェック
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // 統計情報の取得（実装例）
    const stats = {
      cspViolations: {
        total: await getCSPViolationCount(),
        byDirective: await getCSPViolationsByDirective(),
        recent: await getRecentCSPViolations(24) // 24時間以内
      },
      xssAttempts: {
        total: await getXSSAttemptCount(),
        byPattern: await getXSSAttemptsByPattern(),
        recent: await getRecentXSSAttempts(24)
      },
      blockedIPs: await getBlockedIPs(),
      topAttackers: await getTopAttackers()
    };

    res.json({
      success: true,
      data: stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting security stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * XSS攻撃パターンの分析
 */
function analyzeXSSPattern(input: string): string[] {
  const patterns: string[] = [];

  if (input.includes('<script')) patterns.push('script_tag');
  if (input.includes('javascript:')) patterns.push('javascript_protocol');
  if (input.includes('eval(')) patterns.push('eval_function');
  if (input.includes('innerHTML')) patterns.push('inner_html');
  if (input.includes('document.write')) patterns.push('document_write');
  if (input.includes('onload=')) patterns.push('event_handler');
  if (input.includes('onerror=')) patterns.push('event_handler');
  if (input.includes('<iframe')) patterns.push('iframe_tag');
  if (input.includes('<object')) patterns.push('object_tag');
  if (input.includes('vbscript:')) patterns.push('vbscript_protocol');

  return patterns;
}

/**
 * CSP違反統計の更新（実装例）
 */
async function updateCSPViolationStats(directive: string, severity: string): Promise<void> {
  // 実際の実装では、データベースやRedis等に統計情報を保存
  console.log(`CSP Violation Stats Updated: ${directive} (${severity})`);
}

/**
 * XSS攻撃試行統計の更新（実装例）
 */
async function updateXSSAttemptStats(patterns: string[], clientIP: string): Promise<void> {
  // 実際の実装では、データベースやRedis等に統計情報を保存
  console.log(`XSS Attempt Stats Updated: ${patterns.join(', ')} from ${clientIP}`);
}

/**
 * 統計情報取得関数群（実装例）
 */
async function getCSPViolationCount(): Promise<number> {
  // データベースから実際の数値を取得
  return 0;
}

async function getCSPViolationsByDirective(): Promise<Record<string, number>> {
  return {};
}

async function getRecentCSPViolations(hours: number): Promise<any[]> {
  return [];
}

async function getXSSAttemptCount(): Promise<number> {
  return 0;
}

async function getXSSAttemptsByPattern(): Promise<Record<string, number>> {
  return {};
}

async function getRecentXSSAttempts(hours: number): Promise<any[]> {
  return [];
}

async function getBlockedIPs(): Promise<string[]> {
  return [];
}

async function getTopAttackers(): Promise<Array<{ ip: string; attempts: number }>> {
  return [];
}