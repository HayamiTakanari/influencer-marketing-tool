/**
 * 異常なリクエストパターン検知機能のテストスクリプト
 */

const axios = require('axios');
const API_BASE_URL = 'http://localhost:10000/api';

// テスト用のユーティリティ関数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 異常パターンのテストケース
const abnormalPatterns = [
  // 1. 高頻度リクエスト攻撃
  {
    name: "高頻度リクエスト攻撃（レート制限違反）",
    test: async () => {
      console.log('100リクエストを高速送信...');
      const results = [];
      
      for (let i = 0; i < 100; i++) {
        try {
          const response = await axios.get(`${API_BASE_URL}/health`, {
            validateStatus: () => true,
            timeout: 5000
          });
          results.push({
            attempt: i + 1,
            status: response.status,
            blocked: response.status === 429
          });
          
          // レート制限に引っかかった場合
          if (response.status === 429) {
            console.log(`✅ レート制限発動: ${i + 1}回目のリクエストでブロック`);
            return { blocked: true, attemptCount: i + 1 };
          }
        } catch (error) {
          results.push({
            attempt: i + 1,
            error: error.message
          });
        }
      }
      
      return { blocked: false, attemptCount: 100, results };
    }
  },

  // 2. 順次攻撃パターン
  {
    name: "順次攻撃パターン（複数エンドポイント探索）",
    test: async () => {
      const endpoints = [
        '/admin',
        '/api/admin',
        '/api/users',
        '/api/config',
        '/api/debug',
        '/api/test',
        '/.env',
        '/config.json',
        '/api/v1/internal',
        '/api/private'
      ];
      
      console.log('複数の管理エンドポイントを探索...');
      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`http://localhost:10000${endpoint}`, {
            validateStatus: () => true,
            timeout: 3000
          });
          
          results.push({
            endpoint,
            status: response.status,
            suspicious: response.status !== 404
          });
          
          await sleep(100); // 少し遅延を入れる
        } catch (error) {
          results.push({
            endpoint,
            error: error.message
          });
        }
      }
      
      const suspiciousCount = results.filter(r => r.suspicious).length;
      console.log(`探索結果: ${endpoints.length}エンドポイント中、${suspiciousCount}個が疑わしい応答`);
      
      return {
        detected: suspiciousCount > 0,
        results,
        suspiciousCount
      };
    }
  },

  // 3. ブルートフォース攻撃
  {
    name: "ブルートフォース攻撃（ログイン試行）",
    test: async () => {
      const passwords = [
        'admin', 'password', '123456', 'admin123',
        'root', 'test', 'demo', 'guest'
      ];
      
      console.log('複数のパスワードでログイン試行...');
      const results = [];
      
      for (const password of passwords) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@example.com',
            password: password
          }, {
            validateStatus: () => true,
            timeout: 3000
          });
          
          results.push({
            password: '***',
            status: response.status,
            blocked: response.status === 429 || response.status === 403
          });
          
          if (response.status === 429 || response.status === 403) {
            console.log(`✅ ブルートフォース検出: ${results.length}回目の試行でブロック`);
            return { detected: true, attemptCount: results.length };
          }
          
          await sleep(500);
        } catch (error) {
          results.push({ error: error.message });
        }
      }
      
      return { detected: false, attemptCount: passwords.length, results };
    }
  },

  // 4. 異常なユーザーエージェント
  {
    name: "異常なユーザーエージェント",
    test: async () => {
      const suspiciousAgents = [
        'sqlmap/1.0',
        'Nikto/2.1.5',
        'Havij',
        'Mozilla/5.0 (compatible; Nmap Scripting Engine)',
        '../../../',
        '<script>alert(1)</script>',
        'python-requests/2.25.1',
        ''  // 空のUser-Agent
      ];
      
      console.log('疑わしいUser-Agentでリクエスト送信...');
      const results = [];
      
      for (const agent of suspiciousAgents) {
        try {
          const response = await axios.get(`${API_BASE_URL}/health`, {
            headers: {
              'User-Agent': agent
            },
            validateStatus: () => true,
            timeout: 3000
          });
          
          results.push({
            agent: agent.substring(0, 30) + '...',
            status: response.status,
            blocked: response.status >= 400
          });
        } catch (error) {
          results.push({
            agent: agent.substring(0, 30) + '...',
            error: error.message
          });
        }
      }
      
      const blockedCount = results.filter(r => r.blocked).length;
      console.log(`${suspiciousAgents.length}個中${blockedCount}個のUser-Agentがブロックされました`);
      
      return { detected: blockedCount > 0, blockedCount, results };
    }
  },

  // 5. 地理的異常
  {
    name: "地理的異常（複数国からの同一ユーザーアクセス）",
    test: async () => {
      const locations = [
        { ip: '1.1.1.1', country: 'US' },
        { ip: '2.2.2.2', country: 'CN' },
        { ip: '3.3.3.3', country: 'RU' },
        { ip: '4.4.4.4', country: 'BR' }
      ];
      
      console.log('異なる国からの連続アクセスをシミュレート...');
      const results = [];
      
      for (const loc of locations) {
        try {
          const response = await axios.get(`${API_BASE_URL}/influencers/search`, {
            headers: {
              'X-Forwarded-For': loc.ip,
              'X-Real-IP': loc.ip
            },
            validateStatus: () => true,
            timeout: 3000
          });
          
          results.push({
            country: loc.country,
            status: response.status,
            suspicious: false
          });
          
          await sleep(200);
        } catch (error) {
          results.push({
            country: loc.country,
            error: error.message
          });
        }
      }
      
      console.log('地理的異常パターンの検出をチェック（実装されている場合）');
      return { tested: true, results };
    }
  },

  // 6. 異常なリクエストサイズ
  {
    name: "異常なリクエストサイズパターン",
    test: async () => {
      const sizes = [
        { size: 100, name: "100B" },
        { size: 10000, name: "10KB" },
        { size: 100000, name: "100KB" },
        { size: 1000000, name: "1MB" },
        { size: 5000000, name: "5MB" }
      ];
      
      console.log('様々なサイズのペイロードを送信...');
      const results = [];
      
      for (const { size, name } of sizes) {
        try {
          const payload = 'X'.repeat(size);
          const response = await axios.post(`${API_BASE_URL}/comments`, {
            content: payload,
            postId: "test"
          }, {
            validateStatus: () => true,
            timeout: 10000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          
          results.push({
            size: name,
            status: response.status,
            blocked: response.status === 413 || response.status === 400
          });
        } catch (error) {
          results.push({
            size: name,
            error: error.message,
            blocked: true
          });
        }
      }
      
      const abnormalSizes = results.filter(r => r.blocked).length;
      console.log(`${sizes.length}個中${abnormalSizes}個の異常サイズが検出されました`);
      
      return { detected: abnormalSizes > 0, abnormalCount: abnormalSizes, results };
    }
  },

  // 7. タイミング攻撃パターン
  {
    name: "タイミング攻撃パターン（夜間の異常アクセス）",
    test: async () => {
      console.log('異常な時間帯のアクセスパターンをシミュレート...');
      
      // 現在時刻を深夜2時として送信
      const nightTimeHeaders = {
        'X-Request-Time': new Date().setHours(2, 0, 0, 0),
        'X-Client-Timezone': 'Asia/Tokyo'
      };
      
      try {
        const response = await axios.get(`${API_BASE_URL}/influencers/search`, {
          headers: nightTimeHeaders,
          validateStatus: () => true
        });
        
        return {
          tested: true,
          status: response.status,
          message: '時間ベースの異常検知（実装されている場合）'
        };
      } catch (error) {
        return { tested: false, error: error.message };
      }
    }
  },

  // 8. セッションハイジャック試行
  {
    name: "セッションハイジャック試行",
    test: async () => {
      console.log('異なるIPからの同一セッション使用を試行...');
      
      const sessionId = 'fake-session-id-123456';
      const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
      const results = [];
      
      for (const ip of ips) {
        try {
          const response = await axios.get(`${API_BASE_URL}/health`, {
            headers: {
              'Cookie': `sessionId=${sessionId}`,
              'X-Forwarded-For': ip
            },
            validateStatus: () => true
          });
          
          results.push({
            ip,
            status: response.status
          });
        } catch (error) {
          results.push({
            ip,
            error: error.message
          });
        }
        
        await sleep(100);
      }
      
      console.log('セッションハイジャックの検出をチェック');
      return { tested: true, results };
    }
  }
];

// リアルタイム検知のテスト
async function testRealtimeDetection() {
  console.log('\n=== リアルタイム異常検知テスト ===\n');
  
  const results = {
    detected: 0,
    notDetected: 0,
    errors: 0
  };
  
  for (const pattern of abnormalPatterns) {
    console.log(`\n【${pattern.name}】`);
    console.log('='.repeat(60));
    
    try {
      const result = await pattern.test();
      
      if (result.detected || result.blocked) {
        console.log('✅ 異常パターンが検出されました');
        results.detected++;
      } else if (result.tested) {
        console.log('ℹ️  テスト実行完了（検出は実装依存）');
        results.notDetected++;
      } else {
        console.log('❌ 異常パターンが検出されませんでした');
        results.notDetected++;
      }
      
      console.log('結果:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ テストエラー:', error.message);
      results.errors++;
    }
    
    // 次のテストまで少し待機
    await sleep(1000);
  }
  
  return results;
}

// 統計情報の確認
async function checkDetectionStats() {
  console.log('\n\n=== 検知統計情報の確認 ===\n');
  
  try {
    // もし統計エンドポイントがあれば確認
    const response = await axios.get(`${API_BASE_URL}/security/stats`, {
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log('検知統計:', response.data);
    } else {
      console.log('統計エンドポイントは利用できません');
    }
  } catch (error) {
    console.log('統計情報の取得に失敗しました');
  }
}

// レポート生成
function generateReport(results) {
  console.log('\n\n=== 異常パターン検知レポート ===\n');
  
  const total = results.detected + results.notDetected;
  const detectionRate = total > 0 ? (results.detected / total * 100).toFixed(2) : 0;
  
  console.log(`テスト実行数: ${total}`);
  console.log(`検出成功: ${results.detected}`);
  console.log(`検出失敗: ${results.notDetected}`);
  console.log(`エラー: ${results.errors}`);
  console.log(`検出率: ${detectionRate}%`);
  
  console.log('\n推奨事項:');
  console.log('1. レート制限の適切な設定と監視');
  console.log('2. 異常なアクセスパターンの機械学習による検出');
  console.log('3. IPレピュテーションデータベースとの連携');
  console.log('4. リアルタイムアラートシステムの構築');
  console.log('5. 異常検知ルールの定期的な更新');
  
  if (detectionRate >= 70) {
    console.log('\n🎉 異常パターン検知は良好に機能しています');
  } else if (detectionRate >= 50) {
    console.log('\n⚠️  検知精度に改善の余地があります');
  } else {
    console.log('\n❌ 異常パターン検知の強化が必要です');
  }
}

// メイン実行
async function main() {
  try {
    console.log('異常なリクエストパターン検知機能のテストを開始します...\n');
    
    // リアルタイム検知テスト
    const results = await testRealtimeDetection();
    
    // 統計情報確認
    await checkDetectionStats();
    
    // レポート生成
    generateReport(results);
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

main();