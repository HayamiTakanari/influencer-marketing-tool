/**
 * SQLインジェクション対策のテストスクリプト
 * ローカル環境での動作確認用
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:10000/api';

// テスト用のSQLインジェクション攻撃パターン
const sqlInjectionPatterns = [
  // 基本的なSQLインジェクション
  {
    name: "Basic SQL Injection",
    email: "test' OR '1'='1",
    password: "password"
  },
  {
    name: "Union Select Attack",
    email: "test@example.com' UNION SELECT * FROM users--",
    password: "password"
  },
  {
    name: "Drop Table Attack",
    email: "test@example.com'; DROP TABLE users;--",
    password: "password"
  },
  {
    name: "Time-based Blind SQL Injection",
    email: "test@example.com' AND SLEEP(5)--",
    password: "password"
  },
  {
    name: "Boolean-based Blind SQL Injection",
    email: "test@example.com' AND 1=1--",
    password: "password"
  },
  {
    name: "Stacked Queries",
    email: "test@example.com'; INSERT INTO users VALUES ('hacker', 'hacked');--",
    password: "password"
  },
  {
    name: "Comment-based Injection",
    email: "test@example.com'/*",
    password: "*/OR/**/1=1--"
  },
  {
    name: "Hex Encoding",
    email: "test@example.com' OR 0x31=0x31--",
    password: "password"
  }
];

// XSS攻撃パターン
const xssPatterns = [
  {
    name: "Basic XSS Script Tag",
    content: "<script>alert('XSS')</script>"
  },
  {
    name: "IMG Tag XSS",
    content: "<img src=x onerror=alert('XSS')>"
  },
  {
    name: "Event Handler XSS",
    content: "<div onmouseover='alert(\"XSS\")'>Hover me</div>"
  },
  {
    name: "JavaScript URL",
    content: "<a href='javascript:alert(\"XSS\")'>Click me</a>"
  },
  {
    name: "SVG XSS",
    content: "<svg onload=alert('XSS')></svg>"
  },
  {
    name: "Encoded XSS",
    content: "&#60;script&#62;alert('XSS')&#60;/script&#62;"
  }
];

// テスト実行
async function runTests() {
  console.log('=== SQLインジェクション対策テスト開始 ===\n');

  // 1. 登録エンドポイントのテスト
  console.log('1. 登録エンドポイントのSQLインジェクションテスト');
  for (const pattern of sqlInjectionPatterns) {
    try {
      console.log(`\nテスト: ${pattern.name}`);
      console.log(`入力値: email="${pattern.email}", password="${pattern.password}"`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: pattern.email,
        password: pattern.password,
        role: 'influencer'
      });
      
      console.log('❌ 脆弱性あり: リクエストが成功しました');
      console.log('レスポンス:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 保護成功: バリデーションエラー');
        console.log('エラーメッセージ:', error.response.data.error);
      } else if (error.response && error.response.status === 500) {
        console.log('⚠️  サーバーエラー（詳細確認が必要）');
        console.log('エラー:', error.response.data);
      } else {
        console.log('❓ 予期しないエラー:', error.message);
      }
    }
  }

  // 2. ログインエンドポイントのテスト
  console.log('\n\n2. ログインエンドポイントのSQLインジェクションテスト');
  for (const pattern of sqlInjectionPatterns.slice(0, 3)) { // 最初の3つだけテスト
    try {
      console.log(`\nテスト: ${pattern.name}`);
      console.log(`入力値: email="${pattern.email}", password="${pattern.password}"`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: pattern.email,
        password: pattern.password
      });
      
      console.log('❌ 脆弱性あり: ログインが成功しました');
      console.log('レスポンス:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 保護成功: バリデーションエラー');
        console.log('エラーメッセージ:', error.response.data.error);
      } else if (error.response && error.response.status === 401) {
        console.log('✅ 保護成功: 認証失敗（正常動作）');
      } else {
        console.log('❓ 予期しないエラー:', error.message);
      }
    }
  }

  // 3. XSS対策のテスト（もしコンテンツ投稿エンドポイントがある場合）
  console.log('\n\n3. XSS対策テスト');
  console.log('注: コンテンツ投稿エンドポイントが実装されている場合のテスト例');
  
  for (const pattern of xssPatterns.slice(0, 3)) {
    console.log(`\nテスト: ${pattern.name}`);
    console.log(`入力値: "${pattern.content}"`);
    console.log('期待結果: XSSコードがサニタイズされること');
  }

  console.log('\n\n=== テスト完了 ===');
  console.log('\n推奨事項:');
  console.log('1. すべてのSQLインジェクション試行が適切にブロックされていることを確認');
  console.log('2. エラーメッセージに内部情報が漏洩していないことを確認');
  console.log('3. ログを確認して、攻撃試行が記録されていることを確認');
  console.log('4. データベースを確認して、不正なデータが挿入されていないことを確認');
}

// テスト実行
runTests().catch(console.error);

// 使用方法の説明
console.log('\n使用方法:');
console.log('1. バックエンドサーバーを起動: cd backend && npm run dev');
console.log('2. 別のターミナルでこのスクリプトを実行: node test-sql-injection.js');
console.log('3. 結果を確認し、すべての攻撃がブロックされていることを確認');