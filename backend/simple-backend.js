const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 10000);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// レート制限設定
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 100, // 最大100リクエスト
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分
  max: 5, // 最大5回の認証試行
  message: 'Too many authentication attempts from this IP, please try again after 10 minutes.',
  skipSuccessfulRequests: true,
});

// 全体的なレート制限を適用
app.use('/api/', generalLimiter);

// 異常パターン検知ミドルウェア
const suspiciousPatterns = {
  userAgents: [
    /sqlmap/i, /nikto/i, /havij/i, /nmap/i,
    /acunetix/i, /burp/i, /owasp/i, /scanner/i
  ],
  paths: [
    /\.\.\//, /\.env/, /config\.(json|yml|yaml)/, /\/admin/,
    /phpmyadmin/i, /wp-admin/i, /\.git/
  ],
  headers: {
    'x-forwarded-for': /[;<>'"]/,
    'user-agent': /<script|javascript:|onerror=/i
  }
};

function abnormalPatternDetection(req, res, next) {
  const userAgent = req.get('user-agent') || '';
  const path = req.path;
  
  // 疑わしいUser-Agentの検出
  for (const pattern of suspiciousPatterns.userAgents) {
    if (pattern.test(userAgent)) {
      console.log(`[SECURITY] Suspicious User-Agent detected: ${userAgent}`);
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  
  // 疑わしいパスの検出
  for (const pattern of suspiciousPatterns.paths) {
    if (pattern.test(path)) {
      console.log(`[SECURITY] Suspicious path detected: ${path}`);
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  
  // 疑わしいヘッダーの検出
  for (const [header, pattern] of Object.entries(suspiciousPatterns.headers)) {
    const value = req.get(header);
    if (value && pattern.test(value)) {
      console.log(`[SECURITY] Suspicious header detected: ${header}=${value}`);
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  
  next();
}

app.use(abnormalPatternDetection);

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data for demonstration
const mockUsers = [
  {
    id: "1",
    email: "company@test.com",
    role: "COMPANY",
    name: "テスト企業"
  },
  {
    id: "2", 
    email: "influencer@test.com",
    role: "INFLUENCER",
    name: "テストインフルエンサー"
  },
  {
    id: "3",
    email: "test.company2@example.com",
    role: "CLIENT",
    name: "テスト企業2"
  },
  {
    id: "4", 
    email: "test.influencer2@example.com",
    role: "INFLUENCER",
    name: "テストインフルエンサー2"
  }
];

const mockInfluencers = [
  {
    id: "1",
    name: "美容インフルエンサー田中",
    category: "美容",
    followerCount: 150000,
    engagementRate: 4.2,
    platform: "Instagram",
    location: "東京都",
    age: 25,
    bio: "美容とライフスタイルについて発信しています。スキンケアやメイクのコツを日々共有中。"
  },
  {
    id: "2",
    name: "フィットネス山田",
    category: "フィットネス",
    followerCount: 80000,
    engagementRate: 5.1,
    platform: "YouTube",
    location: "大阪府",
    age: 28,
    bio: "健康的なライフスタイルを提案します。筋トレ、栄養、ダイエットのアドバイスを発信。"
  },
  {
    id: "3",
    name: "グルメブロガー佐藤",
    category: "グルメ",
    followerCount: 45000,
    engagementRate: 3.8,
    platform: "Instagram",
    location: "東京都",
    age: 32,
    bio: "東京の隠れた名店を紹介。食べ歩きが趣味で、本当に美味しいお店だけを厳選して紹介しています。"
  },
  {
    id: "4",
    name: "ファッションモデル鈴木",
    category: "ファッション",
    followerCount: 200000,
    engagementRate: 4.5,
    platform: "Instagram",
    location: "東京都",
    age: 23,
    bio: "トレンドファッションを発信。プチプラからハイブランドまで幅広くコーディネートを提案。"
  },
  {
    id: "5",
    name: "旅行系YouTuber伊藤",
    category: "旅行",
    followerCount: 120000,
    engagementRate: 4.8,
    platform: "YouTube",
    location: "神奈川県",
    age: 30,
    bio: "世界中の絶景スポットを紹介。旅行のコツや格安旅行術も発信中。"
  },
  {
    id: "6",
    name: "ライフスタイルクリエイター高橋",
    category: "ライフスタイル",
    followerCount: 65000,
    engagementRate: 4.1,
    platform: "Instagram",
    location: "愛知県",
    age: 27,
    bio: "暮らしを豊かにする情報を発信。インテリア、収納、料理など日常生活のアイデアを共有。"
  },
  {
    id: "7",
    name: "美容系TikToker中村",
    category: "美容",
    followerCount: 95000,
    engagementRate: 6.2,
    platform: "TikTok",
    location: "福岡県",
    age: 22,
    bio: "プチプラコスメのレビューやメイクテクニックを発信。10代20代に人気のメイク動画クリエイター。"
  },
  {
    id: "8",
    name: "フィットネスインストラクター小林",
    category: "フィットネス",
    followerCount: 35000,
    engagementRate: 4.9,
    platform: "Instagram",
    location: "大阪府",
    age: 26,
    bio: "自宅でできるトレーニングを中心に発信。ヨガやピラティスも指導しています。"
  }
];

const mockProjects = [];
const mockApplications = [];
const mockNotifications = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth endpoints
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'ユーザーが見つかりません' });
    }

    // Mock authentication - in production, use proper password hashing
    if (password === 'test123' || password === 'test123456') {
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        token: 'mock-jwt-token'
      });
    } else {
      res.status(401).json({ error: 'パスワードが間違っています' });
    }
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Influencer search endpoint with pagination and performance testing
app.get('/api/influencers/search', (req, res) => {
  try {
    const startTime = process.hrtime();
    const { 
      category, 
      minFollowers, 
      maxFollowers, 
      location, 
      prefecture,
      page = 1, 
      limit = 20,
      testLargeData = false 
    } = req.query;
    
    // Generate large dataset for performance testing
    const totalDataSize = testLargeData === 'true' ? 10000 : mockInfluencers.length;
    
    let allInfluencers = [];
    if (testLargeData === 'true') {
      // Generate 10,000 mock influencers for performance testing
      allInfluencers = Array.from({ length: totalDataSize }, (_, index) => ({
        id: `perf-test-${index}`,
        name: `パフォーマンステスト${index + 1}`,
        displayName: `パフォーマンステスト${index + 1}`,
        category: ['美容', 'ライフスタイル', 'ファッション', 'グルメ', 'フィットネス'][index % 5],
        followerCount: Math.floor(Math.random() * 100000) + 1000,
        engagementRate: Math.round((Math.random() * 3 + 2) * 10) / 10,
        platform: ['Instagram', 'YouTube', 'TikTok', 'Twitter'][index % 4],
        location: ['東京都', '大阪府', '神奈川県', '愛知県', '福岡県'][index % 5],
        prefecture: ['東京都', '大阪府', '神奈川県', '愛知県', '福岡県'][index % 5],
        age: Math.floor(Math.random() * 20) + 20,
        bio: `パフォーマンステスト用プロフィール${index + 1}`,
        priceMin: (index % 10 + 1) * 10000,
        priceMax: (index % 10 + 1) * 50000,
        categories: [['美容', 'ライフスタイル', 'ファッション', 'グルメ', 'フィットネス'][index % 5]],
        socialAccounts: [{
          platform: ['Instagram', 'YouTube', 'TikTok', 'Twitter'][index % 4],
          followerCount: Math.floor(Math.random() * 100000) + 1000,
          engagementRate: Math.round((Math.random() * 3 + 2) * 10) / 10
        }]
      }));
    } else {
      // Use regular mock data with multiple social accounts
      allInfluencers = mockInfluencers.map(inf => {
        const socialAccounts = [];
        
        // 各インフルエンサーに複数のSNSアカウントを追加
        const platforms = ['Instagram', 'TikTok', 'YouTube', 'X'];
        platforms.forEach(platform => {
          // メインプラットフォームは元のフォロワー数、他は70-130%の範囲でランダム生成
          let followerCount;
          let engagementRate;
          
          if (platform === inf.platform) {
            followerCount = inf.followerCount;
            engagementRate = inf.engagementRate;
          } else {
            // 30-80%の確率で他のプラットフォームも持っている
            const hasAccount = Math.random() > 0.4;
            if (!hasAccount) return;
            
            followerCount = Math.floor(inf.followerCount * (0.3 + Math.random() * 0.7));
            engagementRate = Math.round((inf.engagementRate * (0.8 + Math.random() * 0.4)) * 10) / 10;
          }
          
          socialAccounts.push({
            platform: platform,
            followerCount: followerCount,
            engagementRate: engagementRate
          });
        });
        
        return {
          ...inf,
          displayName: inf.name,
          prefecture: inf.location,
          categories: [inf.category],
          socialAccounts: socialAccounts
        };
      });
    }
    
    // Apply filters with exact matching
    let filtered = [...allInfluencers];
    
    // キーワード検索（名前、バイオ、カテゴリーを含む）
    const query = req.query.query;
    if (query && query.trim()) {
      const searchQuery = query.toLowerCase().trim();
      filtered = filtered.filter(inf => 
        inf.name.toLowerCase().includes(searchQuery) ||
        inf.displayName.toLowerCase().includes(searchQuery) ||
        inf.bio.toLowerCase().includes(searchQuery) ||
        inf.categories.some(cat => cat.toLowerCase().includes(searchQuery))
      );
    }
    
    // カテゴリー検索（完全一致）
    if (category && category.trim()) {
      filtered = filtered.filter(inf => 
        inf.categories.some(cat => cat === category) ||
        inf.category === category
      );
    }
    
    // 都道府県検索（完全一致）
    if (prefecture && prefecture.trim()) {
      filtered = filtered.filter(inf => 
        inf.prefecture === prefecture
      );
    }
    
    // フォロワー数の範囲検索
    if (minFollowers) {
      const min = parseInt(minFollowers);
      if (!isNaN(min)) {
        filtered = filtered.filter(inf => inf.followerCount >= min);
      }
    }
    
    if (maxFollowers) {
      const max = parseInt(maxFollowers);
      if (!isNaN(max)) {
        filtered = filtered.filter(inf => inf.followerCount <= max);
      }
    }
    
    // Sort by highest follower count across all platforms (descending)
    filtered.sort((a, b) => {
      // 各インフルエンサーの最大フォロワー数を取得
      const aMaxFollowers = Math.max(
        ...(a.socialAccounts?.map(acc => acc.followerCount) || [a.followerCount || 0])
      );
      const bMaxFollowers = Math.max(
        ...(b.socialAccounts?.map(acc => acc.followerCount) || [b.followerCount || 0])
      );
      return bMaxFollowers - aMaxFollowers;
    });
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = Math.min(startIndex + limitNum, totalCount);
    
    // Get page data
    const paginatedInfluencers = filtered.slice(startIndex, endIndex);
    
    // Calculate performance metrics
    const endTime = process.hrtime(startTime);
    const responseTimeMs = Math.round((endTime[0] * 1000) + (endTime[1] / 1000000));
    
    const response = {
      influencers: paginatedInfluencers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      performance: {
        responseTime: responseTimeMs,
        cacheHit: false,
        dataSize: totalDataSize
      }
    };
    
    console.log(`Search API: page=${pageNum}, limit=${limitNum}, total=${totalCount}, responseTime=${responseTimeMs}ms`);
    
    res.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Get influencer by ID
app.get('/api/influencers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const influencer = mockInfluencers.find(inf => inf.id === id);
    
    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサーが見つかりません' });
    }
    
    // Return detailed influencer data
    const detailedInfluencer = {
      ...influencer,
      user: { id: influencer.id, email: `influencer${influencer.id}@test.com` },
      displayName: influencer.name,
      socialAccounts: [
        {
          id: '1',
          platform: influencer.platform,
          username: `@${influencer.name.toLowerCase().replace(/\s/g, '')}`,
          profileUrl: '#',
          followerCount: influencer.followerCount,
          engagementRate: influencer.engagementRate,
          isVerified: true
        }
      ],
      portfolio: [
        {
          id: '1',
          title: 'サンプル投稿1',
          description: '過去の投稿サンプル',
          imageUrl: '#',
          link: '#',
          platform: influencer.platform
        }
      ],
      prefecture: influencer.location,
      city: '',
      priceMin: 50000,
      priceMax: 200000,
      gender: '女性',
      birthDate: '1995-01-01',
      categories: [influencer.category]
    };
    
    res.json(detailedInfluencer);
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// AI recommendation endpoint
app.post('/api/ai/recommend-influencers', (req, res) => {
  try {
    const { category, budget, targetAudience } = req.body;
    
    // Mock AI scoring
    const recommendations = mockInfluencers.map(inf => ({
      ...inf,
      score: Math.random() * 100,
      reasons: [
        "カテゴリマッチ度が高い",
        "エンゲージメント率が良好",
        "ターゲット層との親和性"
      ]
    })).sort((a, b) => b.score - a.score);
    
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Project endpoints
app.post('/api/projects', (req, res) => {
  try {
    const project = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      applicationsCount: 0,
      clientId: req.headers.authorization ? 'current-user' : 'company@test.com' // 実際の実装ではJWTからユーザーIDを取得
    };
    
    mockProjects.push(project);
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // プロジェクトIDに基づいた個別のモックデータ
    const projectsData = {
      '1': {
        id: '1',
        title: '新商品コスメのPRキャンペーン',
        description: '新発売のファンデーションを使用した投稿をお願いします。自然な仕上がりが特徴の商品で、20-30代の女性をターゲットにしています。',
        category: '美容・化粧品',
        budget: 300000,
        status: 'PENDING',
        targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
        targetPrefecture: '東京都',
        targetCity: '渋谷区、新宿区',
        targetGender: 'FEMALE',
        targetAgeMin: 20,
        targetAgeMax: 35,
        targetFollowerMin: 10000,
        targetFollowerMax: 100000,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        deliverables: 'Instagram投稿2回、ストーリー投稿3回、TikTok動画1本',
        requirements: 'ナチュラルメイクでの使用感を重視、#新商品コスメ #ナチュラルメイク のハッシュタグ必須',
        additionalInfo: '商品サンプル提供、撮影用メイク道具一式貸出可能',
        createdAt: '2024-01-15',
        applications: [
          {
            id: 'app1',
            influencer: {
              id: 'inf1',
              displayName: '田中美咲',
              bio: '美容・ファッション系インフルエンサー。20代女性向けコンテンツ発信中。',
              categories: ['美容', 'ファッション'],
              prefecture: '東京都',
              priceMin: 50000,
              priceMax: 200000,
              socialAccounts: [
                { platform: 'INSTAGRAM', followerCount: 35000, engagementRate: 3.5 },
                { platform: 'YOUTUBE', followerCount: 15000, engagementRate: 2.8 }
              ]
            },
            message: 'この商品にとても興味があります。ナチュラルメイクが得意で、同世代の女性に向けた発信を心がけています。',
            proposedPrice: 150000,
            appliedAt: '2024-01-16',
            isAccepted: false
          }
        ]
      },
      '2': {
        id: '2',
        title: 'ライフスタイル商品のレビュー',
        description: '日常使いできる便利グッズの紹介をお願いします。実際に使用した感想や活用方法を自然な形で発信してください。',
        category: 'ライフスタイル',
        budget: 150000,
        status: 'IN_PROGRESS',
        targetPlatforms: ['YOUTUBE', 'INSTAGRAM'],
        targetPrefecture: '全国',
        targetCity: '',
        targetGender: '',
        targetAgeMin: 25,
        targetAgeMax: 45,
        targetFollowerMin: 5000,
        targetFollowerMax: 50000,
        startDate: '2024-01-20',
        endDate: '2024-02-20',
        deliverables: 'YouTube動画1本、Instagram投稿1回、ストーリー投稿2回',
        requirements: '実際の使用感を重視、#便利グッズ #ライフスタイル のハッシュタグ必須',
        additionalInfo: '商品サンプル提供、返品不要',
        createdAt: '2024-01-10',
        applications: [
          {
            id: 'app2',
            influencer: {
              id: 'inf2',
              displayName: '鈴木さやか',
              bio: 'ライフスタイル系クリエイター。料理、旅行、美容など幅広く発信。',
              categories: ['ライフスタイル', '美容', '料理'],
              prefecture: '大阪府',
              priceMin: 80000,
              priceMax: 300000,
              socialAccounts: [
                { platform: 'INSTAGRAM', followerCount: 60000, engagementRate: 4.2 },
                { platform: 'TIKTOK', followerCount: 29000, engagementRate: 5.1 }
              ]
            },
            message: 'ライフスタイル商品のレビューは得意分野です。フォロワーからの反響も良いのでぜひ参加させてください。',
            proposedPrice: 120000,
            appliedAt: '2024-01-11',
            isAccepted: true
          }
        ],
        matchedInfluencer: {
          id: 'inf2',
          displayName: '鈴木さやか'
        }
      }
    };
    
    // 動的に作成されたプロジェクトもサポート
    const existingProject = mockProjects.find(p => p.id === id);
    if (existingProject) {
      // 作成されたプロジェクトにモック応募を追加
      const projectWithApplications = {
        ...existingProject,
        applications: [
          {
            id: 'app_new_' + Date.now(),
            influencer: {
              id: 'inf3',
              displayName: '山田花子',
              bio: existingProject.category + '系インフルエンサー。フォロワーとの交流を大切にしています。',
              categories: [existingProject.category],
              prefecture: existingProject.targetPrefecture || '東京都',
              priceMin: Math.floor(existingProject.budget * 0.3),
              priceMax: Math.floor(existingProject.budget * 0.8),
              socialAccounts: [
                { platform: 'INSTAGRAM', followerCount: Math.floor(Math.random() * 50000) + 10000, engagementRate: Math.round((Math.random() * 3 + 2) * 10) / 10 }
              ]
            },
            message: `${existingProject.title}のプロジェクトに興味があります。私の${existingProject.category}系のコンテンツ経験を活かせると思います。`,
            proposedPrice: Math.floor(existingProject.budget * 0.6),
            appliedAt: new Date().toISOString(),
            isAccepted: false
          }
        ]
      };
      return res.json(projectWithApplications);
    }
    
    const project = projectsData[id];
    if (!project) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/projects', (req, res) => {
  try {
    // 企業固有のプロジェクトのみ返す（実際の実装ではJWTトークンからユーザーIDを取得）
    const userProjects = [
      {
        id: '1',
        title: '新商品コスメのPRキャンペーン',
        description: '新発売のファンデーションを使用した投稿をお願いします。',
        category: '美容・化粧品',
        budget: 300000,
        status: 'IN_PROGRESS',
        targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
        targetPrefecture: '東京都',
        targetAgeMin: 20,
        targetAgeMax: 35,
        targetFollowerMin: 10000,
        targetFollowerMax: 100000,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        createdAt: '2024-01-15',
        applicationsCount: 12,
        clientId: 'current-user', // この企業のプロジェクト
        matchedInfluencer: {
          id: 'inf1',
          displayName: '美容インフルエンサー田中'
        },
        // 進行中プロジェクト用の詳細情報
        projectDetails: {
          listupCount: 35, // リストアップ数
          assignedCount: 2, // アサイン数
          publishDate: '2024-02-15', // 投稿予定日
          manager: '山田美咲', // 担当者
          assignedInfluencers: [
            {
              id: 'inf1',
              displayName: '美容インフルエンサー田中',
              platform: 'Instagram',
              followerCount: 150000,
              contractPrice: 180000
            },
            {
              id: 'inf7',
              displayName: '美容系TikToker中村',
              platform: 'TikTok',
              followerCount: 95000,
              contractPrice: 120000
            }
          ]
        }
      },
      {
        id: '2',
        title: 'ライフスタイル商品のレビュー',
        description: '日常使いできる便利グッズの紹介をお願いします。',
        category: 'ライフスタイル',
        budget: 150000,
        status: 'IN_PROGRESS',
        targetPlatforms: ['YOUTUBE', 'INSTAGRAM'],
        targetPrefecture: '全国',
        targetAgeMin: 25,
        targetAgeMax: 45,
        targetFollowerMin: 5000,
        targetFollowerMax: 50000,
        startDate: '2024-01-20',
        endDate: '2024-02-20',
        createdAt: '2024-01-10',
        applicationsCount: 8,
        clientId: 'current-user', // この企業のプロジェクト
        matchedInfluencer: {
          id: 'inf1',
          displayName: '鈴木さやか'
        },
        // 進行中プロジェクト用の詳細情報
        projectDetails: {
          listupCount: 25, // リストアップ数
          assignedCount: 3, // アサイン数（実際に契約したインフルエンサー数）
          publishDate: '2024-02-20', // 投稿予定日
          manager: '田中太郎', // 担当者
          assignedInfluencers: [
            {
              id: 'inf1',
              displayName: '鈴木さやか',
              platform: 'Instagram',
              followerCount: 60000,
              contractPrice: 120000
            },
            {
              id: 'inf2', 
              displayName: '山田花子',
              platform: 'YouTube',
              followerCount: 45000,
              contractPrice: 80000
            },
            {
              id: 'inf3',
              displayName: '佐藤健',
              platform: 'TikTok', 
              followerCount: 35000,
              contractPrice: 60000
            }
          ]
        }
      },
      {
        id: '3',
        title: 'フィットネス器具のプロモーション',
        description: '新発売のホームトレーニング器具の使用感をレビューしてください。',
        category: 'フィットネス',
        budget: 200000,
        status: 'IN_PROGRESS',
        targetPlatforms: ['YOUTUBE', 'INSTAGRAM'],
        targetPrefecture: '全国',
        targetAgeMin: 25,
        targetAgeMax: 40,
        targetFollowerMin: 20000,
        targetFollowerMax: 80000,
        startDate: '2024-01-25',
        endDate: '2024-02-25',
        createdAt: '2024-01-20',
        applicationsCount: 15,
        clientId: 'current-user',
        matchedInfluencer: {
          id: 'inf2',
          displayName: 'フィットネス山田'
        },
        projectDetails: {
          listupCount: 18,
          assignedCount: 1,
          publishDate: '2024-02-18',
          manager: '鈴木一郎',
          assignedInfluencers: [
            {
              id: 'inf2',
              displayName: 'フィットネス山田',
              platform: 'YouTube',
              followerCount: 80000,
              contractPrice: 150000
            }
          ]
        }
      },
      {
        id: '4',
        title: 'グルメ系新店舗オープンPR',
        description: '渋谷の新しいレストランの紹介をお願いします。',
        category: 'グルメ',
        budget: 150000,
        status: 'PENDING',
        targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
        targetPrefecture: '東京都',
        targetAgeMin: 20,
        targetAgeMax: 30,
        targetFollowerMin: 15000,
        targetFollowerMax: 60000,
        startDate: '2024-02-10',
        endDate: '2024-03-10',
        createdAt: '2024-02-01',
        applicationsCount: 8,
        clientId: 'current-user'
      }
    ];
    
    res.json({ projects: userProjects });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Profile endpoints
app.get('/api/profile/me', (req, res) => {
  try {
    // Mock company profile
    res.json({
      id: "1",
      companyName: "テスト株式会社",
      industry: "テクノロジー",
      contactName: "山田太郎",
      contactPhone: "03-1234-5678",
      address: "東京都渋谷区",
      website: "https://example.com",
      description: "テスト企業の説明",
      budget: 1000000,
      targetAudience: "20-30代",
      location: "東京都"
    });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/profile', (req, res) => {
  try {
    // Mock update response
    res.json({
      ...req.body,
      id: "1"
    });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Application endpoints
app.post('/api/applications', (req, res) => {
  try {
    const application = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    
    mockApplications.push(application);
    res.json({ application });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/applications/my-projects', (req, res) => {
  try {
    // Mock applications data for company's projects
    const mockApplicationsData = [
      {
        id: 'app1',
        message: 'この商品にとても興味があります。ナチュラルメイクが得意で、同世代の女性に向けた発信を心がけています。',
        proposedPrice: 150000,
        isAccepted: false,
        appliedAt: '2024-01-16',
        influencer: {
          id: 'inf1',
          displayName: '田中美咲',
          bio: '美容・ファッション系インフルエンサー。20代女性向けコンテンツ発信中。',
          categories: ['美容', 'ファッション'],
          prefecture: '東京都',
          user: {
            email: 'tanaka@example.com'
          },
          socialAccounts: [
            {
              id: 'sa1',
              platform: 'INSTAGRAM',
              username: 'tanaka_misaki',
              followerCount: 35000,
              engagementRate: 3.5,
              isVerified: true
            }
          ]
        },
        project: {
          id: '1',
          title: '新商品コスメのPRキャンペーン',
          description: '新発売のファンデーションを使用した投稿をお願いします。',
          category: '美容・化粧品',
          budget: 300000,
          status: 'PENDING'
        }
      },
      {
        id: 'app2',
        message: 'ライフスタイル商品のレビューは得意分野です。フォロワーからの反響も良いのでぜひ参加させてください。',
        proposedPrice: 120000,
        isAccepted: true,
        appliedAt: '2024-01-11',
        influencer: {
          id: 'inf2',
          displayName: '鈴木さやか',
          bio: 'ライフスタイル系クリエイター。料理、旅行、美容など幅広く発信。',
          categories: ['ライフスタイル', '美容', '料理'],
          prefecture: '大阪府',
          user: {
            email: 'suzuki@example.com'
          },
          socialAccounts: [
            {
              id: 'sa2',
              platform: 'INSTAGRAM',
              username: 'suzuki_sayaka',
              followerCount: 60000,
              engagementRate: 4.2,
              isVerified: true
            },
            {
              id: 'sa3',
              platform: 'TIKTOK',
              username: 'sayaka_lifestyle',
              followerCount: 29000,
              engagementRate: 5.1,
              isVerified: false
            }
          ]
        },
        project: {
          id: '2',
          title: 'ライフスタイル商品のレビュー',
          description: '日常使いできる便利グッズの紹介をお願いします。',
          category: 'ライフスタイル',
          budget: 150000,
          status: 'IN_PROGRESS'
        }
      },
      {
        id: 'app3',
        message: 'フィットネス系の投稿を得意としており、健康的なライフスタイルを提案できます。',
        proposedPrice: 100000,
        isAccepted: false,
        appliedAt: '2024-01-18',
        influencer: {
          id: 'inf3',
          displayName: '山田健太',
          bio: 'フィットネストレーナー。健康的な生活習慣を発信中。',
          categories: ['フィットネス', 'ヘルスケア'],
          prefecture: '神奈川県',
          user: {
            email: 'yamada@example.com'
          },
          socialAccounts: [
            {
              id: 'sa4',
              platform: 'YOUTUBE',
              username: 'yamada_fitness',
              followerCount: 45000,
              engagementRate: 3.8,
              isVerified: true
            }
          ]
        },
        project: {
          id: '3',
          title: 'フィットネス関連商品のレビュー',
          description: 'トレーニング器具やサプリメントのレビューをお願いします。',
          category: 'フィットネス',
          budget: 200000,
          status: 'PENDING'
        }
      }
    ];
    
    res.json(mockApplicationsData);
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Team management endpoints
let mockTeam = null; // Mock team storage

app.get('/api/teams/my-team', (req, res) => {
  try {
    if (mockTeam) {
      res.json(mockTeam);
    } else {
      // Return 404 for no team
      res.status(404).json({ error: 'チームが見つかりません' });
    }
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/teams', (req, res) => {
  try {
    const team = {
      id: Date.now().toString(),
      name: req.body.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        {
          id: 'owner-' + Date.now(),
          isOwner: true,
          joinedAt: new Date().toISOString(),
          user: {
            id: '1',
            email: 'company@test.com',
            role: 'COMPANY',
            createdAt: new Date().toISOString()
          }
        }
      ],
      clients: []
    };
    mockTeam = team; // Save the created team
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/teams/:teamId', (req, res) => {
  try {
    if (mockTeam && mockTeam.id === req.params.teamId) {
      mockTeam = {
        ...mockTeam,
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      res.json(mockTeam);
    } else {
      res.status(404).json({ error: 'チームが見つかりません' });
    }
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/teams/:teamId/members', (req, res) => {
  try {
    if (mockTeam && mockTeam.id === req.params.teamId) {
      const newMember = {
        id: Date.now().toString(),
        isOwner: req.body.isOwner || false,
        joinedAt: new Date().toISOString(),
        user: {
          id: Date.now().toString(),
          email: req.body.email,
          role: 'CLIENT',
          createdAt: new Date().toISOString()
        }
      };
      mockTeam.members.push(newMember);
      res.json(newMember);
    } else {
      res.status(404).json({ error: 'チームが見つかりません' });
    }
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/teams/:teamId/members/:memberId', (req, res) => {
  try {
    if (mockTeam && mockTeam.id === req.params.teamId) {
      const { memberId } = req.params;
      mockTeam.members = mockTeam.members.filter(member => member.id !== memberId);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'チームが見つかりません' });
    }
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/teams/:teamId/members/:memberId/role', (req, res) => {
  try {
    if (mockTeam && mockTeam.id === req.params.teamId) {
      const { memberId } = req.params;
      const member = mockTeam.members.find(m => m.id === memberId);
      if (member) {
        member.isOwner = req.body.isOwner;
        res.json(member);
      } else {
        res.status(404).json({ error: 'メンバーが見つかりません' });
      }
    } else {
      res.status(404).json({ error: 'チームが見つかりません' });
    }
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/teams/:teamId', (req, res) => {
  try {
    if (mockTeam && mockTeam.id === req.params.teamId) {
      mockTeam = null;
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'チームが見つかりません' });
    }
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Notification endpoints
app.get('/api/notifications/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userNotifications = mockNotifications.filter(n => n.userId === userId);
    res.json({ notifications: userNotifications });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Chat endpoints
app.get('/api/chat/chats', (req, res) => {
  try {
    const mockChatList = [
      {
        id: '1',
        title: '新商品コスメのPRキャンペーン',
        status: 'IN_PROGRESS',
        matchedInfluencer: {
          user: {
            id: 'inf1',
            email: 'tanaka@example.com'
          },
          displayName: '田中美咲'
        },
        messages: [
          {
            id: 'msg1',
            content: 'プロジェクトに参加させていただきありがとうございます！',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            senderId: 'inf1',
            receiverId: 'current-user',
            isRead: true,
            sender: {
              id: 'inf1',
              role: 'INFLUENCER'
            }
          }
        ],
        unreadCount: 0
      },
      {
        id: '2',
        title: 'ライフスタイル商品のレビュー',
        status: 'IN_PROGRESS',
        matchedInfluencer: {
          user: {
            id: 'inf2',
            email: 'suzuki@example.com'
          },
          displayName: '鈴木さやか'
        },
        messages: [
          {
            id: 'msg2',
            content: '商品サンプルはいつ頃届きますでしょうか？',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            senderId: 'inf2',
            receiverId: 'current-user',
            isRead: false,
            sender: {
              id: 'inf2',
              role: 'INFLUENCER'
            }
          }
        ],
        unreadCount: 1
      }
    ];
    
    res.json(mockChatList);
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/chat/rooms/:userId', (req, res) => {
  try {
    res.json({ 
      rooms: [
        {
          id: "room1",
          title: "プロジェクト1 - チャット",
          latestMessage: { content: "よろしくお願いします" },
          lastActivity: new Date().toISOString(),
          unreadCount: 0
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/chat/messages/:roomId', (req, res) => {
  try {
    res.json({ 
      messages: [
        {
          id: "msg1",
          content: "こんにちは",
          senderId: "1",
          createdAt: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/chat/messages', (req, res) => {
  try {
    const message = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Payment endpoints
app.post('/api/payments', (req, res) => {
  try {
    const payment = {
      id: Date.now().toString(),
      ...req.body,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    res.json({ payment });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/payments', (req, res) => {
  try {
    res.json({ 
      payments: [
        {
          id: "payment1",
          projectId: "project1",
          amount: 100000,
          status: "completed",
          paymentMethod: "card",
          createdAt: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
});

// Analytics endpoints
app.get('/api/analytics/overview/:period', (req, res) => {
  try {
    const { period } = req.params;
    res.json({
      period,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      stats: {
        applications: {
          total: 10,
          accepted: 3,
          acceptanceRate: 30
        },
        projects: {
          created: 5,
          completed: 2,
          byCategory: [
            { category: '美容・化粧品', _count: { id: 2 } },
            { category: 'ファッション', _count: { id: 1 } }
          ]
        },
        earnings: {
          total: 500000,
          monthly: [
            { month: '2024-01', earnings: 150000 },
            { month: '2024-02', earnings: 200000 },
            { month: '2024-03', earnings: 150000 }
          ]
        },
        rating: {
          average: 4.8
        },
        socialAccounts: [
          { platform: 'INSTAGRAM', followerCount: 50000, engagementRate: 3.5 }
        ],
        spending: {
          total: 1000000
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/analytics/performance', (req, res) => {
  try {
    res.json({
      socialMetrics: {
        totalFollowers: 50000,
        averageEngagement: 3.5,
        platforms: [
          { platform: 'INSTAGRAM', followerCount: 50000, engagementRate: 3.5 }
        ]
      },
      projectMetrics: {
        totalProjects: 10,
        completionRate: 80
      },
      earnings: [
        { month: '2024-01', amount: 150000, project_count: 2 },
        { month: '2024-02', amount: 200000, project_count: 3 }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/analytics/comparison', (req, res) => {
  try {
    res.json({
      yourStats: {
        totalFollowers: 50000,
        averageEngagement: 3.5,
        averageEarningsPerProject: 100000
      },
      industryAverages: {
        averageFollowers: 30000,
        averageEngagement: 2.8,
        averageEarningsPerProject: 80000
      },
      comparison: {
        followersPercentile: 75,
        engagementPercentile: 80,
        earningsPercentile: 70
      },
      sampleSize: 1000
    });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// XSS test endpoint - コメント投稿をシミュレート
app.post('/api/comments', (req, res) => {
  const { content, postId } = req.body;
  
  // XSS対策: 基本的なHTMLエスケープ
  const escapeHtml = (unsafe) => {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
  
  const sanitizedContent = escapeHtml(content);
  
  res.json({
    id: Date.now().toString(),
    content: sanitizedContent,
    originalContent: content, // テスト用：元のコンテンツも返す
    postId,
    createdAt: new Date(),
    message: "コメントが投稿されました（サニタイズ済み）"
  });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log(`🔔 Socket.io enabled for real-time notifications`);
    console.log(`✅ Server ready without database dependencies`);
  });
}

// Export for Vercel
module.exports = app;