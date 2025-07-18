const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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

const PORT = process.env.PORT || 10000;

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
    location: "東京",
    age: 25,
    bio: "美容とライフスタイルについて発信しています"
  },
  {
    id: "2",
    name: "フィットネス山田",
    category: "フィットネス",
    followerCount: 80000,
    engagementRate: 5.1,
    platform: "YouTube",
    location: "大阪",
    age: 28,
    bio: "健康的なライフスタイルを提案します"
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
app.post('/api/auth/login', async (req, res) => {
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

// Influencer search endpoint
app.get('/api/influencers/search', (req, res) => {
  try {
    const { category, minFollowers, maxFollowers, location } = req.query;
    
    let filtered = [...mockInfluencers];
    
    if (category) {
      filtered = filtered.filter(inf => 
        inf.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (minFollowers) {
      filtered = filtered.filter(inf => inf.followerCount >= parseInt(minFollowers));
    }
    
    if (maxFollowers) {
      filtered = filtered.filter(inf => inf.followerCount <= parseInt(maxFollowers));
    }
    
    if (location) {
      filtered = filtered.filter(inf => 
        inf.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    res.json({ influencers: filtered });
  } catch (error) {
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
    
    // Mock project data - 実際の実装ではデータベースから取得
    const project = {
      id: id,
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
      applicationsCount: 12,
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
      ],
      clientId: 'current-user'
    };
    
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
        status: 'PENDING',
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
        clientId: 'current-user' // この企業のプロジェクト
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
        }
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
    // Mock applications data
    res.json([]);
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

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`🔔 Socket.io enabled for real-time notifications`);
  console.log(`✅ Server ready without database dependencies`);
});

module.exports = app;