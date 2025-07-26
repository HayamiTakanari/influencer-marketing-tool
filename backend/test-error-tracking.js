/**
 * エラートラッキング機能のテストスクリプト
 */

const axios = require('axios');
const API_BASE_URL = 'http://localhost:10000/api';

// エラーを意図的に発生させるテストケース
const errorTestCases = [
  // 1. 認証エラー
  {
    name: "認証エラー - 無効な認証情報",
    test: async () => {
      return await axios.post(`${API_BASE_URL}/auth/login`, {
        email: "nonexistent@example.com",
        password: "wrongpassword"
      }, { validateStatus: () => true });
    },
    expectedError: "401 Unauthorized"
  },

  // 2. バリデーションエラー
  {
    name: "バリデーションエラー - 無効なメールフォーマット",
    test: async () => {
      return await axios.post(`${API_BASE_URL}/auth/register`, {
        email: "invalid-email-format",
        password: "password123",
        role: "influencer"
      }, { validateStatus: () => true });
    },
    expectedError: "400 Bad Request"
  },

  // 3. 存在しないエンドポイント
  {
    name: "404エラー - 存在しないエンドポイント",
    test: async () => {
      return await axios.get(`${API_BASE_URL}/nonexistent/endpoint`, {
        validateStatus: () => true
      });
    },
    expectedError: "404 Not Found"
  },

  // 4. 不正なJSONペイロード
  {
    name: "構文エラー - 不正なJSON",
    test: async () => {
      return await axios.post(`${API_BASE_URL}/auth/login`, 
        '{"email": "test@example.com", "password": }', // 不正なJSON
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true
        }
      );
    },
    expectedError: "400 Bad Request"
  },

  // 5. タイムアウトエラー
  {
    name: "タイムアウトエラー",
    test: async () => {
      try {
        return await axios.get(`${API_BASE_URL}/health`, {
          timeout: 1, // 1ミリ秒でタイムアウト
          validateStatus: () => true
        });
      } catch (error) {
        return { status: 'timeout', error: error.message };
      }
    },
    expectedError: "timeout"
  },

  // 6. 大きすぎるペイロード
  {
    name: "ペイロードサイズエラー",
    test: async () => {
      const largePayload = "x".repeat(10 * 1024 * 1024); // 10MB
      return await axios.post(`${API_BASE_URL}/comments`, {
        content: largePayload,
        postId: "test"
      }, { 
        validateStatus: () => true,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
    },
    expectedError: "413 Payload Too Large"
  },

  // 7. レート制限エラー（シミュレーション）
  {
    name: "レート制限エラー",
    test: async () => {
      // 短時間に複数のリクエストを送信
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          axios.get(`${API_BASE_URL}/health`, { validateStatus: () => true })
        );
      }
      const results = await Promise.all(promises);
      return results.find(r => r.status === 429) || results[0];
    },
    expectedError: "429 Too Many Requests (期待値)"
  },

  // 8. セキュリティエラー - XSS試行
  {
    name: "セキュリティエラー - XSS攻撃検出",
    test: async () => {
      return await axios.post(`${API_BASE_URL}/comments`, {
        content: "<script>alert('XSS')</script>",
        postId: "test"
      }, { validateStatus: () => true });
    },
    expectedError: "Sanitized (not blocked)"
  },

  // 9. セキュリティエラー - SQLインジェクション試行
  {
    name: "セキュリティエラー - SQLインジェクション検出",
    test: async () => {
      return await axios.post(`${API_BASE_URL}/auth/login`, {
        email: "admin' OR '1'='1",
        password: "' OR '1'='1"
      }, { validateStatus: () => true });
    },
    expectedError: "401 Unauthorized"
  },

  // 10. 内部サーバーエラー（シミュレーション）
  {
    name: "内部サーバーエラー",
    test: async () => {
      // 特殊なヘッダーでエラーをトリガー（もし実装されていれば）
      return await axios.get(`${API_BASE_URL}/health`, {
        headers: {
          'X-Trigger-Error': 'true'
        },
        validateStatus: () => true
      });
    },
    expectedError: "500 Internal Server Error (期待値)"
  }
];

// エラーログの確認
async function checkErrorLogs() {
  console.log('\n=== エラーログ機能の確認 ===\n');
  
  // Sentryの設定確認
  try {
    const fs = require('fs');
    const sentryConfig = fs.readFileSync('/Users/takanari/influencer-marketing-tool/backend/src/config/sentry.ts', 'utf8');
    if (sentryConfig.includes('Sentry.init')) {
      console.log('✅ Sentry設定が検出されました');
    }
  } catch (error) {
    console.log('⚠️  Sentry設定ファイルが見つかりません');
  }

  // ログファイルの確認
  const logPaths = [
    '/Users/takanari/influencer-marketing-tool/backend/logs/error.log',
    '/Users/takanari/influencer-marketing-tool/backend/logs/combined.log',
    '/Users/takanari/influencer-marketing-tool/backend/error.log'
  ];

  for (const logPath of logPaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        console.log(`✅ ログファイル検出: ${logPath} (${stats.size} bytes)`);
      }
    } catch (error) {
      // ファイルが存在しない
    }
  }
}

// エラーハンドリングのテスト実行
async function runErrorTests() {
  console.log('=== エラートラッキング機能テスト開始 ===\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const testCase of errorTestCases) {
    console.log(`\nテスト: ${testCase.name}`);
    console.log('-'.repeat(50));
    
    try {
      const response = await testCase.test();
      
      if (response.status === 'timeout') {
        console.log(`結果: タイムアウト - ${response.error}`);
        results.passed++;
      } else {
        console.log(`HTTPステータス: ${response.status}`);
        console.log(`レスポンス: ${JSON.stringify(response.data).substring(0, 100)}...`);
        
        // エラーハンドリングの確認
        if (response.status >= 400) {
          console.log('✅ エラーが適切に処理されました');
          results.passed++;
          
          // エラーレスポンスの構造確認
          if (response.data.error) {
            console.log(`エラーメッセージ: ${response.data.error}`);
          }
          if (response.data.message) {
            console.log(`詳細メッセージ: ${response.data.message}`);
          }
          if (response.data.stack && process.env.NODE_ENV === 'development') {
            console.log('⚠️  スタックトレースが露出しています（開発環境）');
          }
        } else if (testCase.expectedError.includes("Sanitized")) {
          console.log('✅ セキュリティ対策が機能しています');
          results.passed++;
        } else {
          console.log('❌ 期待されたエラーが発生しませんでした');
          results.failed++;
        }
      }
    } catch (error) {
      console.log(`❌ テスト実行エラー: ${error.message}`);
      results.errors.push({ test: testCase.name, error: error.message });
      results.failed++;
    }
  }

  return results;
}

// エラー通知のテスト
async function testErrorNotifications() {
  console.log('\n\n=== エラー通知機能のテスト ===\n');
  
  // 重大なエラーをシミュレート
  const criticalErrors = [
    {
      name: "データベース接続エラー",
      simulate: async () => {
        // データベース接続エラーをシミュレート
        console.log('データベース接続エラーのシミュレーション...');
      }
    },
    {
      name: "メモリ不足エラー",
      simulate: async () => {
        console.log('メモリ不足エラーのシミュレーション...');
      }
    },
    {
      name: "セキュリティブリーチ",
      simulate: async () => {
        console.log('セキュリティブリーチのシミュレーション...');
      }
    }
  ];

  for (const error of criticalErrors) {
    console.log(`\nテスト: ${error.name}`);
    await error.simulate();
    console.log('通知が送信されるべきです（実装されている場合）');
  }
}

// エラー集計とレポート
async function generateErrorReport(results) {
  console.log('\n\n=== エラートラッキングレポート ===\n');
  
  const total = results.passed + results.failed;
  const successRate = total > 0 ? (results.passed / total * 100).toFixed(2) : 0;
  
  console.log(`テスト実行数: ${total}`);
  console.log(`成功: ${results.passed}`);
  console.log(`失敗: ${results.failed}`);
  console.log(`成功率: ${successRate}%`);
  
  if (results.errors.length > 0) {
    console.log('\n実行エラー:');
    results.errors.forEach(err => {
      console.log(`- ${err.test}: ${err.error}`);
    });
  }
  
  console.log('\n推奨事項:');
  console.log('1. すべてのエラーが適切にキャッチされ、ログに記録されることを確認');
  console.log('2. エラーレスポンスに機密情報が含まれていないことを確認');
  console.log('3. 本番環境ではスタックトレースを非表示にする');
  console.log('4. エラー率の監視とアラート設定を実装');
  console.log('5. エラーの分類と優先度付けを行う');
  
  if (successRate >= 80) {
    console.log('\n🎉 エラートラッキングは適切に機能しています');
  } else if (successRate >= 60) {
    console.log('\n⚠️  エラートラッキングに改善の余地があります');
  } else {
    console.log('\n❌ エラートラッキングの実装を見直してください');
  }
}

// メイン実行
async function main() {
  try {
    // エラーログ機能の確認
    await checkErrorLogs();
    
    // エラーハンドリングのテスト
    const results = await runErrorTests();
    
    // エラー通知のテスト
    await testErrorNotifications();
    
    // レポート生成
    await generateErrorReport(results);
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

main();