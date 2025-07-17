const http = require('http');
const url = require('url');

const PORT = 3000;

// Basic HTML for testing
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Frontend</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>🚀 インフルエンサーマーケティングツール</h1>
    <div class="status success">
        <p><strong>フロントエンドが正常に動作しています！</strong></p>
    </div>
    
    <h2>📝 テストアカウント</h2>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>企業アカウント:</strong></p>
        <p>📧 メール: company@test.com</p>
        <p>🔑 パスワード: test123</p>
        <br>
        <p><strong>インフルエンサーアカウント:</strong></p>
        <p>📧 メール: influencer@test.com</p>
        <p>🔑 パスワード: test123</p>
    </div>
    
    <h2>🔗 接続テスト</h2>
    <div id="backend-status">テスト中...</div>
    
    <script>
        console.log('Frontend loaded successfully');
        
        // Test backend connection
        fetch('http://localhost:5002/health')
            .then(res => res.json())
            .then(data => {
                console.log('Backend connection:', data);
                document.getElementById('backend-status').innerHTML = 
                    '<div class="status success">✅ バックエンド接続: OK</div>';
            })
            .catch(err => {
                console.error('Backend connection failed:', err);
                document.getElementById('backend-status').innerHTML = 
                    '<div class="status error">❌ バックエンド接続: エラー</div>';
            });
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Serve HTML for all requests
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(testHTML);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Test frontend server running on http://localhost:${PORT}`);
    console.log('✅ Frontend is ready!');
});