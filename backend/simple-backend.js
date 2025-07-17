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
      status: 'PUBLISHED'
    };
    
    mockProjects.push(project);
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/projects', (req, res) => {
  try {
    res.json({ projects: mockProjects });
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

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`🔔 Socket.io enabled for real-time notifications`);
  console.log(`✅ Server ready without database dependencies`);
});

module.exports = app;