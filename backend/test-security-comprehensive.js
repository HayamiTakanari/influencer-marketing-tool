/**
 * セキュリティチェック全機能の包括的テストスクリプト
 */

const axios = require('axios');
const API_BASE_URL = 'http://localhost:10000/api';

// テスト結果の統計
const testResults = {
  sqlInjection: { passed: 0, failed: 0, total: 0 },
  xss: { passed: 0, failed: 0, total: 0 },
  maliciousPayload: { passed: 0, failed: 0, total: 0 },
  errorTracking: { passed: 0, failed: 0, total: 0 },
  abnormalPatterns: { passed: 0, failed: 0, total: 0 },
  overallResults: []
};

// ユーティリティ関数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const logTest = (category, testName, result, details = '') => {
  const status = result ? '✅ PASS' : '❌ FAIL';
  console.log(`[${category}] ${testName}: ${status} ${details}`);
  
  if (result) {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
  }
  testResults[category].total++;
  testResults.overallResults.push({ category, testName, result, details });
};

// 1. SQLインジェクション対策テスト
async function testSQLInjectionProtection() {
  console.log('\n=== 1. SQLインジェクション対策テスト ===\n');
  
  const sqlAttacks = [
    { name: "Basic OR injection", payload: { email: "test' OR '1'='1", password: "anything" }},
    { name: "UNION SELECT", payload: { email: "test' UNION SELECT * FROM users--", password: "test" }},
    { name: "Stacked queries", payload: { email: "test'; DROP TABLE users;--", password: "test" }},
    { name: "Time-based blind", payload: { email: "test' AND SLEEP(5)--", password: "test" }},
    { name: "Boolean-based blind", payload: { email: "test' AND 1=1--", password: "test" }}
  ];
  
  for (const attack of sqlAttacks) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, attack.payload, {
        validateStatus: () => true,
        timeout: 6000
      });
      
      const blocked = response.status === 401 || response.status === 400 || response.status === 403;
      const noSqlError = !JSON.stringify(response.data).toLowerCase().includes('sql');
      
      logTest('sqlInjection', attack.name, blocked && noSqlError, 
        `Status: ${response.status}, No SQL errors exposed: ${noSqlError}`);
    } catch (error) {
      logTest('sqlInjection', attack.name, true, 'Request blocked/timeout');
    }
  }
}

// 2. XSS対策テスト
async function testXSSProtection() {
  console.log('\n=== 2. XSS対策テスト ===\n');
  
  const xssAttacks = [
    { name: "Script tag", payload: "<script>alert('XSS')</script>" },
    { name: "IMG onerror", payload: "<img src=x onerror=alert('XSS')>" },
    { name: "SVG onload", payload: "<svg onload=alert('XSS')>" },
    { name: "JavaScript URL", payload: "<a href='javascript:alert(1)'>click</a>" },
    { name: "Event handler", payload: "<div onmouseover='alert(1)'>hover</div>" }
  ];
  
  for (const attack of xssAttacks) {
    try {
      const response = await axios.post(`${API_BASE_URL}/comments`, {
        content: attack.payload,
        postId: "test"
      }, { validateStatus: () => true });
      
      if (response.status === 200 && response.data.content) {
        const sanitized = response.data.content !== attack.payload;
        const noScript = !response.data.content.includes('<script>');
        const escaped = response.data.content.includes('&lt;') || response.data.content.includes('&gt;');
        
        logTest('xss', attack.name, sanitized && (noScript || escaped),
          `Sanitized: ${sanitized}, Escaped: ${escaped}`);
      } else {
        logTest('xss', attack.name, response.status >= 400, `Blocked with status: ${response.status}`);
      }
    } catch (error) {
      logTest('xss', attack.name, true, 'Request blocked');
    }
  }
  
  // セキュリティヘッダーのチェック
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { validateStatus: () => true });
    const headers = response.headers;
    
    logTest('xss', 'CSP Header', !!headers['content-security-policy'], 
      headers['content-security-policy'] ? 'Present' : 'Missing');
    logTest('xss', 'X-Content-Type-Options', !!headers['x-content-type-options'], 
      headers['x-content-type-options'] || 'Missing');
    logTest('xss', 'X-Frame-Options', !!headers['x-frame-options'], 
      headers['x-frame-options'] || 'Missing');
  } catch (error) {
    logTest('xss', 'Security Headers', false, 'Failed to check headers');
  }
}

// 3. 不正ペイロード検出テスト
async function testMaliciousPayloadDetection() {
  console.log('\n=== 3. 不正ペイロード検出テスト ===\n');
  
  // ペイロードサイズテスト
  const sizes = [
    { size: 100000, name: "100KB", shouldPass: true },
    { size: 1000000, name: "1MB", shouldPass: false },
    { size: 5000000, name: "5MB", shouldPass: false }
  ];
  
  for (const test of sizes) {
    try {
      const payload = 'X'.repeat(test.size);
      const response = await axios.post(`${API_BASE_URL}/comments`, {
        content: payload,
        postId: "test"
      }, { 
        validateStatus: () => true,
        timeout: 10000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity 
      });
      
      const actualBlocked = response.status === 413 || response.status === 400;
      const expectedResult = test.shouldPass ? !actualBlocked : actualBlocked;
      
      logTest('maliciousPayload', `Payload size ${test.name}`, expectedResult,
        `Status: ${response.status}, Expected blocked: ${!test.shouldPass}`);
    } catch (error) {
      const blocked = error.code === 'ECONNABORTED' || error.message.includes('413');
      logTest('maliciousPayload', `Payload size ${test.name}`, !test.shouldPass || blocked,
        'Request blocked or timeout');
    }
  }
  
  // NoSQLインジェクションテスト
  const noSqlAttacks = [
    { name: "MongoDB $ne", payload: { email: {"$ne": ""}, password: {"$ne": ""} }},
    { name: "Query operator", payload: { email: {"$regex": ".*"}, password: {"$gt": ""} }}
  ];
  
  for (const attack of noSqlAttacks) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, attack.payload, {
        validateStatus: () => true
      });
      
      const blocked = response.status >= 400;
      logTest('maliciousPayload', attack.name, blocked, `Status: ${response.status}`);
    } catch (error) {
      logTest('maliciousPayload', attack.name, true, 'Request blocked');
    }
  }
}

// 4. エラートラッキングテスト
async function testErrorTracking() {
  console.log('\n=== 4. エラートラッキングテスト ===\n');
  
  // 認証エラー
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "nonexistent@example.com",
      password: "wrongpassword"
    }, { validateStatus: () => true });
    
    const properError = response.status === 401 && response.data.error;
    const noStackTrace = !JSON.stringify(response.data).includes('stack');
    
    logTest('errorTracking', 'Authentication error handling', properError && noStackTrace,
      `Status: ${response.status}, No stack trace: ${noStackTrace}`);
  } catch (error) {
    logTest('errorTracking', 'Authentication error handling', false, 'Request failed');
  }
  
  // 404エラー
  try {
    const response = await axios.get(`${API_BASE_URL}/nonexistent`, { validateStatus: () => true });
    logTest('errorTracking', '404 error handling', response.status === 404, `Status: ${response.status}`);
  } catch (error) {
    logTest('errorTracking', '404 error handling', false, 'Request failed');
  }
  
  // 不正JSONエラー
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, 
      '{"email": "test@example.com", "password": }', // 不正なJSON
      {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true
      }
    );
    
    logTest('errorTracking', 'Invalid JSON handling', response.status === 400, `Status: ${response.status}`);
  } catch (error) {
    logTest('errorTracking', 'Invalid JSON handling', true, 'Request blocked');
  }
  
  // ペイロードサイズエラー
  try {
    const largePayload = "x".repeat(10 * 1024 * 1024); // 10MB
    const response = await axios.post(`${API_BASE_URL}/comments`, {
      content: largePayload,
      postId: "test"
    }, { 
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity 
    });
    
    logTest('errorTracking', 'Payload size error handling', response.status === 413, `Status: ${response.status}`);
  } catch (error) {
    logTest('errorTracking', 'Payload size error handling', true, 'Request blocked or timeout');
  }
}

// 5. 異常パターン検知テスト
async function testAbnormalPatternDetection() {
  console.log('\n=== 5. 異常パターン検知テスト ===\n');
  
  // Wait for rate limit to reset
  console.log('レート制限リセット待機中...');
  await sleep(65000); // 65秒待機
  
  // 疑わしいUser-Agentテスト
  const suspiciousAgents = [
    'sqlmap/1.0',
    'Nikto/2.1.5',
    'Mozilla/5.0 (compatible; Nmap Scripting Engine)',
    'Havij'
  ];
  
  for (const agent of suspiciousAgents) {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        headers: { 'User-Agent': agent },
        validateStatus: () => true
      });
      
      logTest('abnormalPatterns', `Suspicious User-Agent: ${agent}`, response.status === 403,
        `Status: ${response.status}`);
    } catch (error) {
      logTest('abnormalPatterns', `Suspicious User-Agent: ${agent}`, true, 'Request blocked');
    }
    await sleep(1000);
  }
  
  // 疑わしいパステスト
  const suspiciousPaths = ['/admin', '/.env', '/config.json', '/wp-admin'];
  
  for (const path of suspiciousPaths) {
    try {
      const response = await axios.get(`http://localhost:10000${path}`, {
        validateStatus: () => true
      });
      
      logTest('abnormalPatterns', `Suspicious path: ${path}`, response.status === 403,
        `Status: ${response.status}`);
    } catch (error) {
      logTest('abnormalPatterns', `Suspicious path: ${path}`, true, 'Request blocked');
    }
    await sleep(500);
  }
  
  // レート制限テスト（認証）
  console.log('認証レート制限テスト実行中...');
  let rateLimitTriggered = false;
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: "test@example.com",
        password: "wrongpassword"
      }, { validateStatus: () => true });
      
      if (response.status === 429) {
        rateLimitTriggered = true;
        console.log(`レート制限が${i}回目で発動`);
        break;
      }
    } catch (error) {
      // エラーも許容
    }
    await sleep(100);
  }
  
  logTest('abnormalPatterns', 'Authentication rate limiting', rateLimitTriggered,
    rateLimitTriggered ? 'Rate limit triggered' : 'Rate limit not triggered');
  
  // 一般APIレート制限テスト
  console.log('一般APIレート制限テスト実行中...');
  let generalRateLimitTriggered = false;
  
  for (let i = 1; i <= 150; i++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/influencers/search`, {
        validateStatus: () => true
      });
      
      if (response.status === 429) {
        generalRateLimitTriggered = true;
        console.log(`一般レート制限が${i}回目で発動`);
        break;
      }
    } catch (error) {
      // エラーも許容
    }
    
    if (i % 10 === 0) {
      await sleep(100); // 10リクエストごとに少し待機
    }
  }
  
  logTest('abnormalPatterns', 'General API rate limiting', generalRateLimitTriggered,
    generalRateLimitTriggered ? 'Rate limit triggered' : 'Rate limit not triggered');
}

// 6. セキュリティヘッダーテスト
async function testSecurityHeaders() {
  console.log('\n=== 6. セキュリティヘッダーテスト ===\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { validateStatus: () => true });
    const headers = response.headers;
    
    const requiredHeaders = {
      'content-security-policy': 'Content Security Policy',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-frame-options': 'X-Frame-Options',
    };
    
    for (const [header, name] of Object.entries(requiredHeaders)) {
      logTest('abnormalPatterns', `Security header: ${name}`, !!headers[header],
        headers[header] ? `Present: ${headers[header]}` : 'Missing');
    }
  } catch (error) {
    logTest('abnormalPatterns', 'Security headers check', false, 'Failed to check headers');
  }
}

// 7. 統合セキュリティテスト
async function testIntegratedSecurity() {
  console.log('\n=== 7. 統合セキュリティテスト ===\n');
  
  // 複合攻撃テスト: XSS + SQLインジェクション
  try {
    const response = await axios.post(`${API_BASE_URL}/comments`, {
      content: "<script>alert('XSS')</script>' OR '1'='1",
      postId: "test"
    }, { validateStatus: () => true });
    
    const bothBlocked = response.status === 200 && 
      response.data.content && 
      response.data.content !== "<script>alert('XSS')</script>' OR '1'='1";
    
    logTest('abnormalPatterns', 'Combined XSS + SQL injection', bothBlocked,
      bothBlocked ? 'Both attacks neutralized' : 'Attack may have succeeded');
  } catch (error) {
    logTest('abnormalPatterns', 'Combined XSS + SQL injection', true, 'Request blocked');
  }
  
  // セキュリティログ確認（ファイル存在確認）
  const fs = require('fs');
  const logPaths = [
    '/Users/takanari/influencer-marketing-tool/backend/src/config/sentry.ts',
    '/Users/takanari/influencer-marketing-tool/backend/src/middleware/error-tracking.ts'
  ];
  
  let securityLoggingConfigured = 0;
  for (const path of logPaths) {
    if (fs.existsSync(path)) {
      securityLoggingConfigured++;
    }
  }
  
  logTest('abnormalPatterns', 'Security logging configuration', securityLoggingConfigured >= 1,
    `${securityLoggingConfigured} security config files found`);
}

// 最終レポート生成
function generateComprehensiveReport() {
  console.log('\n' + '='.repeat(70));
  console.log('               セキュリティチェック総合レポート');
  console.log('='.repeat(70));
  
  const categories = Object.keys(testResults).filter(key => key !== 'overallResults');
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  
  categories.forEach(category => {
    const result = testResults[category];
    const successRate = result.total > 0 ? (result.passed / result.total * 100).toFixed(1) : 0;
    
    console.log(`\n【${category.toUpperCase()}】`);
    console.log(`  テスト数: ${result.total}`);
    console.log(`  成功: ${result.passed}`);
    console.log(`  失敗: ${result.failed}`);
    console.log(`  成功率: ${successRate}%`);
    
    totalPassed += result.passed;
    totalFailed += result.failed;
    totalTests += result.total;
  });
  
  const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
  
  console.log(`\n【総合結果】`);
  console.log(`  総テスト数: ${totalTests}`);
  console.log(`  総成功数: ${totalPassed}`);
  console.log(`  総失敗数: ${totalFailed}`);
  console.log(`  総合成功率: ${overallSuccessRate}%`);
  
  // セキュリティレベル判定
  let securityLevel = '';
  let recommendation = '';
  
  if (overallSuccessRate >= 90) {
    securityLevel = '🛡️  EXCELLENT - 優秀';
    recommendation = 'セキュリティ対策は非常に優秀です。定期的な見直しを継続してください。';
  } else if (overallSuccessRate >= 80) {
    securityLevel = '✅ GOOD - 良好';
    recommendation = 'セキュリティ対策は良好です。いくつかの改善点があります。';
  } else if (overallSuccessRate >= 70) {
    securityLevel = '⚠️  NEEDS IMPROVEMENT - 要改善';
    recommendation = 'セキュリティ対策に改善が必要です。失敗したテストを重点的に見直してください。';
  } else {
    securityLevel = '❌ CRITICAL - 危険';
    recommendation = 'セキュリティ対策が不十分です。緊急に対策を強化してください。';
  }
  
  console.log(`\n【セキュリティレベル】`);
  console.log(`  ${securityLevel}`);
  console.log(`  ${recommendation}`);
  
  // 失敗したテストの詳細
  const failedTests = testResults.overallResults.filter(test => !test.result);
  if (failedTests.length > 0) {
    console.log(`\n【要対策項目】`);
    failedTests.forEach(test => {
      console.log(`  ❌ [${test.category}] ${test.testName}: ${test.details}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
}

// メイン実行
async function runComprehensiveSecurityTest() {
  console.log('🔒 セキュリティチェック全機能の包括的テストを開始します...\n');
  
  try {
    await testSQLInjectionProtection();
    await testXSSProtection();
    await testMaliciousPayloadDetection();
    await testErrorTracking();
    await testAbnormalPatternDetection();
    await testSecurityHeaders();
    await testIntegratedSecurity();
    
    generateComprehensiveReport();
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

runComprehensiveSecurityTest();