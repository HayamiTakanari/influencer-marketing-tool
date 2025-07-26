/**
 * XSS対策のテストスクリプト
 * ローカル環境での動作確認用
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:10000/api';

// XSS攻撃パターン
const xssPatterns = [
  {
    name: "Basic Script Tag",
    payload: "<script>alert('XSS')</script>",
    description: "基本的なスクリプトタグ注入"
  },
  {
    name: "IMG Tag with onerror",
    payload: "<img src=x onerror=alert('XSS')>",
    description: "画像タグのonerrorイベント"
  },
  {
    name: "SVG onload",
    payload: "<svg onload=alert('XSS')>",
    description: "SVGタグのonloadイベント"
  },
  {
    name: "JavaScript URL",
    payload: "<a href='javascript:alert(\"XSS\")'>Click me</a>",
    description: "JavaScriptプロトコル"
  },
  {
    name: "Event Handler",
    payload: "<div onmouseover='alert(\"XSS\")'>Hover me</div>",
    description: "イベントハンドラー注入"
  },
  {
    name: "Encoded Script",
    payload: "&#60;script&#62;alert('XSS')&#60;/script&#62;",
    description: "エンコードされたスクリプト"
  },
  {
    name: "Double Encoded",
    payload: "%3Cscript%3Ealert('XSS')%3C/script%3E",
    description: "URLエンコードされたスクリプト"
  },
  {
    name: "Iframe Injection",
    payload: "<iframe src='javascript:alert(\"XSS\")'></iframe>",
    description: "iframeを使用した攻撃"
  },
  {
    name: "Style Tag with Expression",
    payload: "<style>body{background:url('javascript:alert(\"XSS\")')}</style>",
    description: "スタイルタグを使用した攻撃"
  },
  {
    name: "Input Tag with onfocus",
    payload: "<input type='text' onfocus='alert(\"XSS\")' autofocus>",
    description: "自動フォーカスを利用した攻撃"
  }
];

// テスト用のエンドポイント（実際のAPIに合わせて調整）
async function testXSSProtection() {
  console.log('=== XSS対策テスト開始 ===\n');

  // 1. プロフィール更新エンドポイントのテスト（存在する場合）
  console.log('1. プロフィール更新でのXSSテスト\n');
  
  for (const pattern of xssPatterns) {
    console.log(`テスト: ${pattern.name}`);
    console.log(`説明: ${pattern.description}`);
    console.log(`ペイロード: ${pattern.payload}`);
    
    try {
      // インフルエンサープロフィール更新をシミュレート
      const response = await axios.post(`${API_BASE_URL}/influencers/profile`, {
        displayName: `Test User ${pattern.payload}`,
        bio: pattern.payload,
        categories: ['Beauty'],
        socialMediaAccounts: {
          instagram: `https://instagram.com/${pattern.payload}`
        }
      }, {
        headers: {
          'Authorization': 'Bearer mock-jwt-token'
        }
      });
      
      console.log('❌ 警告: XSSペイロードが処理されました');
      console.log('レスポンス:', JSON.stringify(response.data).substring(0, 200));
      
      // サニタイズされているか確認
      const containsScript = JSON.stringify(response.data).includes('<script>');
      const containsAlert = JSON.stringify(response.data).includes('alert(');
      
      if (!containsScript && !containsAlert) {
        console.log('✅ 部分的な保護: スクリプトタグは除去されています');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('⚠️  エンドポイントが存在しません');
      } else if (error.response && error.response.status === 400) {
        console.log('✅ 保護成功: 入力が拒否されました');
        console.log('エラー:', error.response.data.error);
      } else {
        console.log('❓ エラー:', error.message);
      }
    }
    console.log('---\n');
  }

  // 2. コメント投稿のテスト（存在する場合）
  console.log('2. コメント投稿でのXSSテスト\n');
  
  const testComment = {
    content: "<script>alert('XSS in comment')</script>",
    postId: "test-post-1"
  };
  
  try {
    console.log(`テスト: コメントへのXSS注入`);
    console.log(`ペイロード: ${testComment.content}`);
    
    const response = await axios.post(`${API_BASE_URL}/comments`, testComment, {
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });
    
    console.log('レスポンス:', response.data);
  } catch (error) {
    console.log('⚠️  コメントエンドポイントのテストをスキップ');
  }

  // 3. 検索エンドポイントのテスト（反射型XSS）
  console.log('\n3. 検索での反射型XSSテスト\n');
  
  for (const pattern of xssPatterns.slice(0, 3)) {
    try {
      console.log(`テスト: ${pattern.name}`);
      console.log(`検索クエリ: ${pattern.payload}`);
      
      const response = await axios.get(`${API_BASE_URL}/influencers/search`, {
        params: {
          query: pattern.payload,
          category: pattern.payload
        }
      });
      
      // レスポンスにXSSペイロードが含まれているか確認
      const responseText = JSON.stringify(response.data);
      if (responseText.includes(pattern.payload)) {
        console.log('❌ 警告: 検索結果にXSSペイロードが含まれています');
      } else if (responseText.includes('&lt;script&gt;') || responseText.includes('\\u003c')) {
        console.log('✅ 保護成功: XSSペイロードがエスケープされています');
      } else {
        console.log('✅ 保護成功: XSSペイロードが除去されています');
      }
    } catch (error) {
      console.log('エラー:', error.message);
    }
    console.log('---\n');
  }

  console.log('=== XSS対策テスト完了 ===\n');
  console.log('推奨事項:');
  console.log('1. すべての入力がサニタイズされていることを確認');
  console.log('2. 出力時にも適切にエスケープされていることを確認');
  console.log('3. Content Security Policy (CSP) ヘッダーが設定されていることを確認');
  console.log('4. HTTPOnly Cookieが使用されていることを確認');
}

// CSPヘッダーのチェック
async function checkSecurityHeaders() {
  console.log('\n=== セキュリティヘッダーのチェック ===\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      validateStatus: () => true
    });
    
    const headers = response.headers;
    console.log('レスポンスヘッダー:');
    
    // CSPヘッダー
    if (headers['content-security-policy']) {
      console.log('✅ Content-Security-Policy:', headers['content-security-policy']);
    } else {
      console.log('❌ Content-Security-Policy ヘッダーが設定されていません');
    }
    
    // X-XSS-Protection
    if (headers['x-xss-protection']) {
      console.log('✅ X-XSS-Protection:', headers['x-xss-protection']);
    } else {
      console.log('❌ X-XSS-Protection ヘッダーが設定されていません');
    }
    
    // X-Content-Type-Options
    if (headers['x-content-type-options']) {
      console.log('✅ X-Content-Type-Options:', headers['x-content-type-options']);
    } else {
      console.log('❌ X-Content-Type-Options ヘッダーが設定されていません');
    }
    
    // X-Frame-Options
    if (headers['x-frame-options']) {
      console.log('✅ X-Frame-Options:', headers['x-frame-options']);
    } else {
      console.log('❌ X-Frame-Options ヘッダーが設定されていません');
    }
    
  } catch (error) {
    console.log('ヘッダーチェックエラー:', error.message);
  }
}

// テスト実行
async function runTests() {
  await testXSSProtection();
  await checkSecurityHeaders();
}

runTests().catch(console.error);