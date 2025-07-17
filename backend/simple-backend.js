const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 5002;
const prisma = new PrismaClient();

// CORS設定 - すべてのオリジンを許可
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());

// Socket.io接続管理
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // ユーザー認証
  socket.on('authenticate', (userData) => {
    connectedUsers.set(socket.id, userData);
    console.log(`User authenticated: ${userData.email} (${userData.role})`);
    
    socket.emit('authenticated', { status: 'success', message: 'リアルタイム通知が有効になりました' });
  });
  
  // 接続解除
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`User disconnected: ${user.email}`);
      connectedUsers.delete(socket.id);
    }
  });
});

// 通知送信関数
function sendNotification(userId, type, title, message, data = {}) {
  // 接続中のユーザーに通知を送信
  for (const [socketId, user] of connectedUsers.entries()) {
    if (user.id === userId) {
      io.to(socketId).emit('notification', {
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// ログイン
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`Login attempt: ${email}`);
    
    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        client: true,
        influencer: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'ユーザーが見つかりません' });
    }
    
    // パスワード確認
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'パスワードが正しくありません' });
    }
    
    // レスポンス
    res.json({
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.client || user.influencer || null
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// プロフィール取得
app.get('/api/profile', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        client: true,
        influencer: true
      }
    });
    
    res.json({
      totalUsers: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        hasProfile: !!(user.client || user.influencer)
      }))
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'プロフィール取得エラー' });
  }
});

// プロジェクト一覧
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: {
          select: {
            companyName: true
          }
        }
      }
    });
    
    res.json({
      totalProjects: projects.length,
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        budget: project.budget,
        status: project.status,
        companyName: project.client.companyName
      }))
    });
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({ error: 'プロジェクト取得エラー' });
  }
});

// プロジェクト作成
app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, budget, category, clientId } = req.body;
    
    const project = await prisma.project.create({
      data: {
        title,
        description,
        budget: parseInt(budget),
        category,
        clientId,
        targetPlatforms: ['INSTAGRAM'],
        status: 'PENDING'
      },
      include: {
        client: {
          select: {
            companyName: true
          }
        }
      }
    });
    
    // 成功レスポンス
    const projectResponse = {
      success: true,
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        budget: project.budget,
        status: project.status,
        companyName: project.client.companyName
      }
    };
    
    // プロジェクト作成時は通知を送信しない（ユーザーリクエストにより無効化）
    // インフルエンサーは案件検索で新しいプロジェクトを発見する
    
    res.json(projectResponse);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'プロジェクト作成エラー' });
  }
});

// インフルエンサー検索
app.get('/api/influencers/search', async (req, res) => {
  try {
    const { category, minFollowers, maxFollowers, prefecture } = req.query;
    
    const whereClause = {};
    
    if (category && category !== 'ALL') {
      whereClause.categories = {
        has: category
      };
    }
    
    if (minFollowers) {
      whereClause.priceMin = {
        gte: parseInt(minFollowers)
      };
    }
    
    if (prefecture && prefecture !== 'ALL') {
      whereClause.prefecture = prefecture;
    }
    
    const influencers = await prisma.influencer.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true
          }
        },
        socialAccounts: true,
        achievements: {
          orderBy: { createdAt: 'desc' },
          take: 5 // 最新5件の実績を取得
        },
        servicePricing: {
          where: { isActive: true },
          orderBy: { serviceType: 'asc' }
        }
      }
    });
    
    res.json({
      totalResults: influencers.length,
      influencers: influencers.map(inf => ({
        id: inf.id,
        displayName: inf.displayName,
        bio: inf.bio,
        categories: inf.categories,
        prefecture: inf.prefecture,
        priceRange: `${inf.priceMin?.toLocaleString() || '0'}円 - ${inf.priceMax?.toLocaleString() || 'N/A'}円`,
        socialAccounts: inf.socialAccounts.length,
        totalAchievements: inf.achievements.length,
        recentAchievements: inf.achievements.map(ach => ({
          title: ach.title,
          purpose: ach.purpose,
          purposeJp: getPurposeJapanese(ach.purpose),
          category: ach.category,
          platform: ach.platform
        })),
        servicePricing: inf.servicePricing.map(sp => ({
          id: sp.id,
          serviceType: sp.serviceType,
          serviceTypeJp: getServiceTypeJapanese(sp.serviceType),
          price: sp.price,
          unit: sp.unit,
          unitJp: getUnitJapanese(sp.unit),
          description: sp.description
        }))
      }))
    });
  } catch (error) {
    console.error('Search influencers error:', error);
    res.status(500).json({ error: 'インフルエンサー検索エラー' });
  }
});

// プロジェクトへの応募
app.post('/api/projects/:projectId/apply', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { influencerId, message, proposedPrice } = req.body;
    
    // 既存の応募をチェック
    const existingApplication = await prisma.application.findUnique({
      where: {
        projectId_influencerId: {
          projectId,
          influencerId
        }
      }
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: '既にこのプロジェクトに応募済みです' });
    }
    
    // プロジェクト情報を取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }
    
    const application = await prisma.application.create({
      data: {
        projectId,
        influencerId,
        clientId: project.clientId,
        message,
        proposedPrice: proposedPrice ? parseInt(proposedPrice) : null
      }
    });
    
    // 企業に通知送信
    try {
      const influencerInfo = await prisma.influencer.findUnique({
        where: { id: influencerId },
        include: { user: true }
      });
      
      sendNotification(
        project.client.userId,
        'new_application',
        '新しい応募がありました！',
        `「${project.title}」に${influencerInfo.displayName}さんから応募がありました`,
        { 
          projectId: project.id,
          applicationId: application.id,
          influencerName: influencerInfo.displayName
        }
      );
    } catch (notificationError) {
      console.error('Application notification error:', notificationError);
    }
    
    res.json({
      success: true,
      message: '応募が完了しました',
      applicationId: application.id
    });
  } catch (error) {
    console.error('Apply to project error:', error);
    res.status(500).json({ error: '応募エラー' });
  }
});

// 応募一覧取得
app.get('/api/applications', async (req, res) => {
  try {
    const { clientId, influencerId } = req.query;
    
    const whereClause = {};
    if (clientId) whereClause.clientId = clientId;
    if (influencerId) whereClause.influencerId = influencerId;
    
    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            title: true,
            budget: true,
            status: true
          }
        },
        influencer: {
          select: {
            displayName: true
          }
        },
        client: {
          select: {
            companyName: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });
    
    res.json({
      totalApplications: applications.length,
      applications: applications.map(app => ({
        id: app.id,
        projectTitle: app.project.title,
        influencerName: app.influencer.displayName,
        companyName: app.client.companyName,
        proposedPrice: app.proposedPrice,
        message: app.message,
        isAccepted: app.isAccepted,
        appliedAt: app.appliedAt
      }))
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: '応募一覧取得エラー' });
  }
});

// インフルエンサー実績作成
app.post('/api/achievements', async (req, res) => {
  try {
    const { 
      influencerId, 
      title, 
      description, 
      purpose, 
      link, 
      metrics,
      budget,
      clientName,
      category,
      platform,
      duration
    } = req.body;
    
    const achievement = await prisma.achievement.create({
      data: {
        influencerId,
        title,
        description,
        purpose, // SALES, LEAD_GEN, AWARENESS, BRAND_IMAGE, ENGAGEMENT
        link,
        metrics: metrics || {},
        budget: budget ? parseInt(budget) : null,
        clientName,
        category,
        platform,
        duration
      }
    });
    
    res.json({
      success: true,
      achievement
    });
  } catch (error) {
    console.error('Create achievement error:', error);
    res.status(500).json({ error: '実績作成エラー' });
  }
});

// インフルエンサー実績取得
app.get('/api/achievements/:influencerId', async (req, res) => {
  try {
    const { influencerId } = req.params;
    
    const achievements = await prisma.achievement.findMany({
      where: { influencerId },
      orderBy: { createdAt: 'desc' }
    });
    
    // 目的別の実績数を集計
    const purposeStats = achievements.reduce((acc, achievement) => {
      acc[achievement.purpose] = (acc[achievement.purpose] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalAchievements: achievements.length,
      purposeStats,
      achievements: achievements.map(ach => ({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        purpose: ach.purpose,
        purposeJp: getPurposeJapanese(ach.purpose),
        link: ach.link,
        metrics: ach.metrics,
        budget: ach.budget,
        clientName: ach.clientName,
        category: ach.category,
        platform: ach.platform,
        duration: ach.duration,
        createdAt: ach.createdAt
      }))
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: '実績取得エラー' });
  }
});

// 実績更新
app.put('/api/achievements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 数値フィールドの変換
    if (updateData.budget) {
      updateData.budget = parseInt(updateData.budget);
    }
    
    const achievement = await prisma.achievement.update({
      where: { id },
      data: updateData
    });
    
    res.json({
      success: true,
      achievement
    });
  } catch (error) {
    console.error('Update achievement error:', error);
    res.status(500).json({ error: '実績更新エラー' });
  }
});

// 実績削除
app.delete('/api/achievements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.achievement.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: '実績を削除しました'
    });
  } catch (error) {
    console.error('Delete achievement error:', error);
    res.status(500).json({ error: '実績削除エラー' });
  }
});

// サービス料金関連API

// サービス料金作成
app.post('/api/service-pricing', async (req, res) => {
  try {
    const { 
      influencerId, 
      serviceType, 
      price, 
      unit, 
      description 
    } = req.body;
    
    const servicePricing = await prisma.servicePricing.create({
      data: {
        influencerId,
        serviceType,
        price: parseInt(price),
        unit: unit || 'per_post',
        description,
        isActive: true
      }
    });
    
    res.json({
      success: true,
      servicePricing
    });
  } catch (error) {
    console.error('Create service pricing error:', error);
    res.status(500).json({ error: 'サービス料金作成エラー' });
  }
});

// インフルエンサーのサービス料金取得
app.get('/api/service-pricing/:influencerId', async (req, res) => {
  try {
    const { influencerId } = req.params;
    
    const servicePricing = await prisma.servicePricing.findMany({
      where: { 
        influencerId,
        isActive: true 
      },
      orderBy: { serviceType: 'asc' }
    });
    
    res.json({
      totalServices: servicePricing.length,
      servicePricing: servicePricing.map(sp => ({
        id: sp.id,
        serviceType: sp.serviceType,
        serviceTypeJp: getServiceTypeJapanese(sp.serviceType),
        price: sp.price,
        unit: sp.unit,
        unitJp: getUnitJapanese(sp.unit),
        description: sp.description,
        isActive: sp.isActive,
        createdAt: sp.createdAt
      }))
    });
  } catch (error) {
    console.error('Get service pricing error:', error);
    res.status(500).json({ error: 'サービス料金取得エラー' });
  }
});

// サービス料金更新
app.put('/api/service-pricing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (updateData.price) {
      updateData.price = parseInt(updateData.price);
    }
    
    const servicePricing = await prisma.servicePricing.update({
      where: { id },
      data: updateData
    });
    
    res.json({
      success: true,
      servicePricing
    });
  } catch (error) {
    console.error('Update service pricing error:', error);
    res.status(500).json({ error: 'サービス料金更新エラー' });
  }
});

// サービス料金削除
app.delete('/api/service-pricing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.servicePricing.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'サービス料金を削除しました'
    });
  } catch (error) {
    console.error('Delete service pricing error:', error);
    res.status(500).json({ error: 'サービス料金削除エラー' });
  }
});

// サービスタイプの日本語変換
function getServiceTypeJapanese(serviceType) {
  const serviceTypeMap = {
    PHOTOGRAPHY: '撮影',
    VIDEO_EDITING: '動画編集',
    CONTENT_CREATION: 'コンテンツ制作',
    POSTING: '投稿',
    STORY_CREATION: 'ストーリー制作',
    CONSULTATION: 'コンサルティング',
    LIVE_STREAMING: 'ライブ配信',
    EVENT_APPEARANCE: 'イベント出演'
  };
  return serviceTypeMap[serviceType] || serviceType;
}

// 単位の日本語変換
function getUnitJapanese(unit) {
  const unitMap = {
    per_post: '投稿あたり',
    per_hour: '時間あたり',
    per_day: '日あたり',
    per_month: '月あたり',
    per_project: 'プロジェクトあたり'
  };
  return unitMap[unit] || unit;
}

// 目的の日本語変換
function getPurposeJapanese(purpose) {
  const purposeMap = {
    SALES: '売上目的',
    LEAD_GEN: '集客目的',
    AWARENESS: '認知拡大目的',
    BRAND_IMAGE: 'ブランドイメージ向上',
    ENGAGEMENT: 'エンゲージメント向上'
  };
  return purposeMap[purpose] || purpose;
}

// 一斉問い合わせ関連API

// 一斉問い合わせ作成
app.post('/api/bulk-inquiry', async (req, res) => {
  try {
    const { 
      clientId, 
      title, 
      description, 
      budget, 
      deadline, 
      requiredServices,
      targetInfluencers // インフルエンサーIDの配列
    } = req.body;
    
    // 一斉問い合わせを作成
    const bulkInquiry = await prisma.bulkInquiry.create({
      data: {
        clientId,
        title,
        description,
        budget: budget ? parseInt(budget) : null,
        deadline: deadline ? new Date(deadline) : null,
        requiredServices: requiredServices || []
      }
    });
    
    // 対象インフルエンサーに通知送信
    if (targetInfluencers && targetInfluencers.length > 0) {
      for (const influencerId of targetInfluencers) {
        try {
          // インフルエンサー情報を取得
          const influencer = await prisma.influencer.findUnique({
            where: { id: influencerId },
            include: { user: true }
          });
          
          if (influencer) {
            // 問い合わせ回答レコードを作成（初期状態はPENDING）
            await prisma.inquiryResponse.create({
              data: {
                inquiryId: bulkInquiry.id,
                influencerId: influencerId,
                status: 'PENDING'
              }
            });
            
            // リアルタイム通知送信
            sendNotification(
              influencer.user.id,
              'bulk_inquiry',
              '新しい案件のご案内',
              `「${title}」について問い合わせが届きました`,
              { 
                inquiryId: bulkInquiry.id,
                title: title,
                budget: budget
              }
            );
          }
        } catch (notificationError) {
          console.error('Notification error for influencer:', influencerId, notificationError);
        }
      }
    }
    
    res.json({
      success: true,
      bulkInquiry: {
        id: bulkInquiry.id,
        title: bulkInquiry.title,
        description: bulkInquiry.description,
        budget: bulkInquiry.budget,
        targetCount: targetInfluencers ? targetInfluencers.length : 0
      }
    });
  } catch (error) {
    console.error('Create bulk inquiry error:', error);
    res.status(500).json({ error: '一斉問い合わせ作成エラー' });
  }
});

// 企業の一斉問い合わせ一覧取得
app.get('/api/bulk-inquiry/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const inquiries = await prisma.bulkInquiry.findMany({
      where: { clientId },
      include: {
        responses: {
          include: {
            influencer: {
              select: {
                displayName: true
              }
            }
          }
        },
        _count: {
          select: {
            responses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      totalInquiries: inquiries.length,
      inquiries: inquiries.map(inquiry => ({
        id: inquiry.id,
        title: inquiry.title,
        description: inquiry.description,
        budget: inquiry.budget,
        deadline: inquiry.deadline,
        requiredServices: inquiry.requiredServices,
        totalResponses: inquiry._count.responses,
        responses: inquiry.responses.map(response => ({
          id: response.id,
          influencerName: response.influencer.displayName,
          status: response.status,
          statusJp: getInquiryStatusJapanese(response.status),
          proposedPrice: response.proposedPrice,
          message: response.message,
          createdAt: response.createdAt
        })),
        createdAt: inquiry.createdAt
      }))
    });
  } catch (error) {
    console.error('Get client bulk inquiries error:', error);
    res.status(500).json({ error: '問い合わせ一覧取得エラー' });
  }
});

// インフルエンサー向け問い合わせ一覧取得
app.get('/api/bulk-inquiry/influencer/:influencerId', async (req, res) => {
  try {
    const { influencerId } = req.params;
    
    const responses = await prisma.inquiryResponse.findMany({
      where: { influencerId },
      include: {
        inquiry: {
          include: {
            client: {
              select: {
                companyName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      totalInquiries: responses.length,
      inquiries: responses.map(response => ({
        id: response.inquiry.id,
        responseId: response.id,
        title: response.inquiry.title,
        description: response.inquiry.description,
        budget: response.inquiry.budget,
        deadline: response.inquiry.deadline,
        requiredServices: response.inquiry.requiredServices,
        requiredServicesJp: response.inquiry.requiredServices.map(service => getServiceTypeJapanese(service)),
        companyName: response.inquiry.client.companyName,
        status: response.status,
        statusJp: getInquiryStatusJapanese(response.status),
        proposedPrice: response.proposedPrice,
        message: response.message,
        availableFrom: response.availableFrom,
        availableTo: response.availableTo,
        createdAt: response.createdAt
      }))
    });
  } catch (error) {
    console.error('Get influencer inquiries error:', error);
    res.status(500).json({ error: 'インフルエンサー問い合わせ取得エラー' });
  }
});

// 問い合わせ回答
app.put('/api/inquiry-response/:responseId', async (req, res) => {
  try {
    const { responseId } = req.params;
    const { 
      status, 
      proposedPrice, 
      message, 
      availableFrom, 
      availableTo 
    } = req.body;
    
    const updateData = {
      status,
      message,
      updatedAt: new Date()
    };
    
    if (proposedPrice) updateData.proposedPrice = parseInt(proposedPrice);
    if (availableFrom) updateData.availableFrom = new Date(availableFrom);
    if (availableTo) updateData.availableTo = new Date(availableTo);
    
    const response = await prisma.inquiryResponse.update({
      where: { id: responseId },
      data: updateData,
      include: {
        inquiry: {
          include: {
            client: {
              include: {
                user: true
              }
            }
          }
        },
        influencer: {
          select: {
            displayName: true
          }
        }
      }
    });
    
    // 企業に通知送信
    try {
      sendNotification(
        response.inquiry.client.user.id,
        'inquiry_response',
        '問い合わせ回答が届きました',
        `${response.influencer.displayName}さんから「${response.inquiry.title}」への回答が届きました`,
        { 
          inquiryId: response.inquiryId,
          responseId: response.id,
          status: status,
          statusJp: getInquiryStatusJapanese(status)
        }
      );
    } catch (notificationError) {
      console.error('Response notification error:', notificationError);
    }
    
    res.json({
      success: true,
      response: {
        id: response.id,
        status: response.status,
        statusJp: getInquiryStatusJapanese(response.status),
        proposedPrice: response.proposedPrice,
        message: response.message
      }
    });
  } catch (error) {
    console.error('Update inquiry response error:', error);
    res.status(500).json({ error: '問い合わせ回答エラー' });
  }
});

// スケジュール・マイルストーン管理API

// プロジェクトスケジュール作成
app.post('/api/project-schedule', async (req, res) => {
  try {
    const { 
      projectId, 
      publishDate,
      conceptSubmissionDays,  // 構成案初稿提出日（投稿日から何日前）
      conceptReviewDays,      // 構成案確認期間（日数）
      conceptRevisionDays,    // 構成案修正稿提出期間（日数） 
      videoSubmissionDays,    // 動画初稿提出日（構成案確定から何日後）
      videoReviewDays,        // 動画確認期間（日数）
      videoRevisionDays       // 動画修正稿提出期間（日数）
    } = req.body;
    
    const publishDateTime = new Date(publishDate);
    
    // 既存のスケジュールがあれば削除
    const existingSchedule = await prisma.projectSchedule.findUnique({
      where: { projectId }
    });
    
    if (existingSchedule) {
      await prisma.milestone.deleteMany({
        where: { scheduleId: existingSchedule.id }
      });
      await prisma.projectSchedule.delete({
        where: { projectId }
      });
    }
    
    // 新しいスケジュールを作成
    const schedule = await prisma.projectSchedule.create({
      data: {
        projectId,
        publishDate: publishDateTime
      }
    });
    
    // マイルストーンを投稿日から逆算して作成
    const milestones = [];
    
    // 1. 構成案初稿提出日
    const conceptSubmissionDate = new Date(publishDateTime);
    conceptSubmissionDate.setDate(conceptSubmissionDate.getDate() - conceptSubmissionDays);
    milestones.push({
      scheduleId: schedule.id,
      type: 'CONCEPT_APPROVAL',
      title: '構成案初稿提出',
      description: 'インフルエンサーが構成案の初稿を提出する期限',
      dueDate: conceptSubmissionDate
    });
    
    // 2. 構成案確認完了日
    const conceptReviewDate = new Date(conceptSubmissionDate);
    conceptReviewDate.setDate(conceptReviewDate.getDate() + conceptReviewDays);
    milestones.push({
      scheduleId: schedule.id,
      type: 'CONCEPT_APPROVAL',
      title: '構成案初稿確認完了',
      description: '企業が構成案初稿の確認を完了する期限',
      dueDate: conceptReviewDate
    });
    
    // 3. 構成案修正稿提出日
    const conceptRevisionDate = new Date(conceptReviewDate);
    conceptRevisionDate.setDate(conceptRevisionDate.getDate() + conceptRevisionDays);
    milestones.push({
      scheduleId: schedule.id,
      type: 'CONCEPT_APPROVAL',
      title: '構成案修正稿提出',
      description: 'インフルエンサーが構成案の修正稿を提出する期限',
      dueDate: conceptRevisionDate
    });
    
    // 4. 構成案最終確認完了日
    const conceptFinalDate = new Date(conceptRevisionDate);
    conceptFinalDate.setDate(conceptFinalDate.getDate() + conceptReviewDays);
    milestones.push({
      scheduleId: schedule.id,
      type: 'CONCEPT_APPROVAL',
      title: '構成案最終確認完了',
      description: '企業が構成案修正稿の確認を完了し、構成案を確定する期限',
      dueDate: conceptFinalDate
    });
    
    // 5. 動画初稿提出日
    const videoSubmissionDate = new Date(conceptFinalDate);
    videoSubmissionDate.setDate(videoSubmissionDate.getDate() + videoSubmissionDays);
    milestones.push({
      scheduleId: schedule.id,
      type: 'VIDEO_COMPLETION',
      title: '動画初稿提出',
      description: 'インフルエンサーが動画の初稿を提出する期限',
      dueDate: videoSubmissionDate
    });
    
    // 6. 動画確認完了日
    const videoReviewDate = new Date(videoSubmissionDate);
    videoReviewDate.setDate(videoReviewDate.getDate() + videoReviewDays);
    milestones.push({
      scheduleId: schedule.id,
      type: 'VIDEO_COMPLETION',
      title: '動画初稿確認完了',
      description: '企業が動画初稿の確認を完了する期限',
      dueDate: videoReviewDate
    });
    
    // 7. 動画修正稿提出日
    const videoRevisionDate = new Date(videoReviewDate);
    videoRevisionDate.setDate(videoRevisionDate.getDate() + videoRevisionDays);
    milestones.push({
      scheduleId: schedule.id,
      type: 'VIDEO_COMPLETION',
      title: '動画修正稿提出',
      description: 'インフルエンサーが動画の修正稿を提出する期限',
      dueDate: videoRevisionDate
    });
    
    // 8. 動画最終確認完了日
    const videoFinalDate = new Date(videoRevisionDate);
    videoFinalDate.setDate(videoFinalDate.getDate() + videoReviewDays);
    milestones.push({
      scheduleId: schedule.id,
      type: 'FINAL_APPROVAL',
      title: '動画最終確認完了',
      description: '企業が動画修正稿の確認を完了し、最終承認する期限',
      dueDate: videoFinalDate
    });
    
    // 9. 投稿日
    milestones.push({
      scheduleId: schedule.id,
      type: 'PUBLISH_DATE',
      title: '投稿実行',
      description: 'インフルエンサーがコンテンツを投稿する日',
      dueDate: publishDateTime
    });
    
    // マイルストーンを一括作成
    await prisma.milestone.createMany({
      data: milestones
    });
    
    res.json({
      success: true,
      schedule: {
        id: schedule.id,
        projectId: schedule.projectId,
        publishDate: schedule.publishDate,
        milestonesCount: milestones.length
      }
    });
  } catch (error) {
    console.error('Create project schedule error:', error);
    res.status(500).json({ error: 'スケジュール作成エラー' });
  }
});

// プロジェクトスケジュール取得
app.get('/api/project-schedule/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const schedule = await prisma.projectSchedule.findUnique({
      where: { projectId },
      include: {
        milestones: {
          orderBy: { dueDate: 'asc' }
        },
        project: {
          include: {
            client: {
              select: {
                companyName: true
              }
            },
            matchedInfluencer: {
              select: {
                displayName: true
              }
            }
          }
        }
      }
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'スケジュールが見つかりません' });
    }
    
    res.json({
      schedule: {
        id: schedule.id,
        projectId: schedule.projectId,
        publishDate: schedule.publishDate,
        projectTitle: schedule.project.title,
        companyName: schedule.project.client.companyName,
        influencerName: schedule.project.matchedInfluencer?.displayName,
        milestones: schedule.milestones.map(milestone => ({
          id: milestone.id,
          type: milestone.type,
          typeJp: getMilestoneTypeJapanese(milestone.type),
          title: milestone.title,
          description: milestone.description,
          dueDate: milestone.dueDate,
          isCompleted: milestone.isCompleted,
          completedAt: milestone.completedAt,
          isOverdue: new Date() > new Date(milestone.dueDate) && !milestone.isCompleted,
          daysUntilDue: Math.ceil((new Date(milestone.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
        }))
      }
    });
  } catch (error) {
    console.error('Get project schedule error:', error);
    res.status(500).json({ error: 'スケジュール取得エラー' });
  }
});

// マイルストーン完了
app.put('/api/milestone/:milestoneId/complete', async (req, res) => {
  try {
    const { milestoneId } = req.params;
    
    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        isCompleted: true,
        completedAt: new Date()
      },
      include: {
        schedule: {
          include: {
            project: {
              include: {
                client: {
                  include: {
                    user: true
                  }
                },
                matchedInfluencer: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // 完了通知を送信
    const project = milestone.schedule.project;
    const notificationTitle = `マイルストーン完了: ${milestone.title}`;
    const notificationMessage = `「${project.title}」の${milestone.title}が完了しました`;
    
    // 企業とインフルエンサー両方に通知
    if (project.client.user) {
      sendNotification(
        project.client.user.id,
        'milestone_completed',
        notificationTitle,
        notificationMessage,
        { 
          projectId: project.id,
          milestoneId: milestone.id,
          milestoneType: milestone.type
        }
      );
    }
    
    if (project.matchedInfluencer?.user) {
      sendNotification(
        project.matchedInfluencer.user.id,
        'milestone_completed',
        notificationTitle,
        notificationMessage,
        { 
          projectId: project.id,
          milestoneId: milestone.id,
          milestoneType: milestone.type
        }
      );
    }
    
    res.json({
      success: true,
      milestone: {
        id: milestone.id,
        title: milestone.title,
        isCompleted: milestone.isCompleted,
        completedAt: milestone.completedAt
      }
    });
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({ error: 'マイルストーン完了エラー' });
  }
});

// 期限前日通知チェック（定期実行用）
app.get('/api/schedule/check-notifications', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    // 明日が期限のマイルストーンを取得
    const upcomingMilestones = await prisma.milestone.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow
        },
        isCompleted: false,
        notificationSent: false
      },
      include: {
        schedule: {
          include: {
            project: {
              include: {
                client: {
                  include: {
                    user: true
                  }
                },
                matchedInfluencer: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    let notificationsSent = 0;
    
    for (const milestone of upcomingMilestones) {
      const project = milestone.schedule.project;
      const notificationTitle = `⏰ 明日が期限: ${milestone.title}`;
      const notificationMessage = `「${project.title}」の${milestone.title}の期限が明日です`;
      
      // 企業とインフルエンサー両方に通知
      if (project.client.user) {
        sendNotification(
          project.client.user.id,
          'deadline_reminder',
          notificationTitle,
          notificationMessage,
          { 
            projectId: project.id,
            milestoneId: milestone.id,
            milestoneType: milestone.type,
            dueDate: milestone.dueDate
          }
        );
        notificationsSent++;
      }
      
      if (project.matchedInfluencer?.user) {
        sendNotification(
          project.matchedInfluencer.user.id,
          'deadline_reminder',
          notificationTitle,
          notificationMessage,
          { 
            projectId: project.id,
            milestoneId: milestone.id,
            milestoneType: milestone.type,
            dueDate: milestone.dueDate
          }
        );
        notificationsSent++;
      }
      
      // 通知送信フラグを更新
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { notificationSent: true }
      });
    }
    
    res.json({
      success: true,
      upcomingMilestones: upcomingMilestones.length,
      notificationsSent
    });
  } catch (error) {
    console.error('Check notifications error:', error);
    res.status(500).json({ error: '通知チェックエラー' });
  }
});

// ユーザーのスケジュール一覧取得
app.get('/api/schedules/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;
    
    let whereClause = {};
    
    if (role === 'CLIENT') {
      whereClause = {
        project: {
          client: {
            userId: userId
          }
        }
      };
    } else if (role === 'INFLUENCER') {
      whereClause = {
        project: {
          matchedInfluencer: {
            userId: userId
          }
        }
      };
    }
    
    const schedules = await prisma.projectSchedule.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            client: {
              select: {
                companyName: true
              }
            },
            matchedInfluencer: {
              select: {
                displayName: true
              }
            }
          }
        },
        milestones: {
          where: {
            isCompleted: false
          },
          orderBy: { dueDate: 'asc' },
          take: 3 // 次の3つのマイルストーンのみ
        }
      },
      orderBy: { publishDate: 'asc' }
    });
    
    res.json({
      totalSchedules: schedules.length,
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        projectId: schedule.projectId,
        projectTitle: schedule.project.title,
        publishDate: schedule.publishDate,
        companyName: schedule.project.client.companyName,
        influencerName: schedule.project.matchedInfluencer?.displayName,
        upcomingMilestones: schedule.milestones.map(milestone => ({
          id: milestone.id,
          title: milestone.title,
          dueDate: milestone.dueDate,
          daysUntilDue: Math.ceil((new Date(milestone.dueDate) - new Date()) / (1000 * 60 * 60 * 24)),
          isOverdue: new Date() > new Date(milestone.dueDate)
        }))
      }))
    });
  } catch (error) {
    console.error('Get user schedules error:', error);
    res.status(500).json({ error: 'ユーザースケジュール取得エラー' });
  }
});

// マイルストーンタイプの日本語変換
function getMilestoneTypeJapanese(type) {
  const typeMap = {
    CONCEPT_APPROVAL: '構成案承認',
    VIDEO_COMPLETION: '動画完成',
    FINAL_APPROVAL: '最終承認',
    PUBLISH_DATE: '投稿日'
  };
  return typeMap[type] || type;
}

// 問い合わせステータスの日本語変換
function getInquiryStatusJapanese(status) {
  const statusMap = {
    PENDING: '返答待ち',
    ACCEPTED: '承諾',
    DECLINED: '辞退',
    EXPIRED: '期限切れ'
  };
  return statusMap[status] || status;
}

// AI搭載機能

// AIによるインフルエンサー推薦
app.post('/api/ai/recommend-influencers', async (req, res) => {
  try {
    const { 
      projectDescription, 
      targetAudience, 
      budget, 
      category, 
      campaignGoals 
    } = req.body;
    
    // 全インフルエンサーを取得
    const influencers = await prisma.influencer.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        },
        socialAccounts: true,
        achievements: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        servicePricing: {
          where: { isActive: true }
        }
      }
    });
    
    // AI推薦アルゴリズム（シンプル版）
    const recommendations = influencers.map(inf => {
      let score = 0;
      
      // カテゴリマッチング
      if (category && inf.categories.includes(category)) {
        score += 30;
      }
      
      // 予算マッチング
      if (budget) {
        const budgetNum = parseInt(budget);
        if (inf.priceMin && inf.priceMax) {
          if (budgetNum >= inf.priceMin && budgetNum <= inf.priceMax) {
            score += 25;
          } else if (budgetNum >= inf.priceMin * 0.8 && budgetNum <= inf.priceMax * 1.2) {
            score += 15;
          }
        }
      }
      
      // 実績スコア
      const relevantAchievements = inf.achievements.filter(ach => 
        campaignGoals && campaignGoals.includes(ach.purpose)
      );
      score += Math.min(relevantAchievements.length * 5, 20);
      
      // ソーシャルアカウント数
      score += Math.min(inf.socialAccounts.length * 3, 15);
      
      // サービス料金設定済み
      if (inf.servicePricing.length > 0) {
        score += 10;
      }
      
      return {
        influencer: inf,
        score,
        matchReasons: generateMatchReasons(inf, category, budget, campaignGoals)
      };
    });
    
    // スコア順でソート
    recommendations.sort((a, b) => b.score - a.score);
    
    res.json({
      success: true,
      totalRecommendations: recommendations.length,
      recommendations: recommendations.slice(0, 10).map(rec => ({
        id: rec.influencer.id,
        displayName: rec.influencer.displayName,
        bio: rec.influencer.bio,
        categories: rec.influencer.categories,
        prefecture: rec.influencer.prefecture,
        priceRange: `${rec.influencer.priceMin?.toLocaleString() || '0'}円 - ${rec.influencer.priceMax?.toLocaleString() || 'N/A'}円`,
        aiScore: rec.score,
        matchReasons: rec.matchReasons,
        totalAchievements: rec.influencer.achievements.length,
        socialAccounts: rec.influencer.socialAccounts.length,
        servicePricing: rec.influencer.servicePricing.map(sp => ({
          serviceType: sp.serviceType,
          serviceTypeJp: getServiceTypeJapanese(sp.serviceType),
          price: sp.price,
          unit: sp.unit
        }))
      }))
    });
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({ error: 'AI推薦エラー' });
  }
});

// マッチング理由生成
function generateMatchReasons(influencer, category, budget, campaignGoals) {
  const reasons = [];
  
  if (category && influencer.categories.includes(category)) {
    reasons.push(`${category}カテゴリの専門性`);
  }
  
  if (budget && influencer.priceMin && influencer.priceMax) {
    const budgetNum = parseInt(budget);
    if (budgetNum >= influencer.priceMin && budgetNum <= influencer.priceMax) {
      reasons.push('予算範囲内の料金設定');
    }
  }
  
  if (campaignGoals && influencer.achievements.length > 0) {
    const relevantAchievements = influencer.achievements.filter(ach => 
      campaignGoals.includes(ach.purpose)
    );
    if (relevantAchievements.length > 0) {
      reasons.push(`関連する実績${relevantAchievements.length}件`);
    }
  }
  
  if (influencer.socialAccounts.length > 1) {
    reasons.push(`複数SNS活用（${influencer.socialAccounts.length}プラットフォーム）`);
  }
  
  if (influencer.servicePricing.length > 0) {
    reasons.push('詳細な料金体系設定済み');
  }
  
  return reasons;
}

// エンゲージメント率予測
app.post('/api/ai/predict-engagement', async (req, res) => {
  try {
    const { influencerId, contentType, targetAudience } = req.body;
    
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        achievements: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        socialAccounts: true
      }
    });
    
    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサーが見つかりません' });
    }
    
    // エンゲージメント率予測（シンプルアルゴリズム）
    let baseEngagementRate = 3.5; // ベース3.5%
    
    // 過去実績から調整
    if (influencer.achievements.length > 0) {
      const avgMetrics = influencer.achievements.reduce((acc, ach) => {
        if (ach.metrics && typeof ach.metrics === 'object') {
          acc.views = (acc.views || 0) + (ach.metrics.views || 0);
          acc.likes = (acc.likes || 0) + (ach.metrics.likes || 0);
          acc.count++;
        }
        return acc;
      }, { views: 0, likes: 0, count: 0 });
      
      if (avgMetrics.count > 0 && avgMetrics.views > 0) {
        const historicalRate = (avgMetrics.likes / avgMetrics.views) * 100;
        baseEngagementRate = (baseEngagementRate + historicalRate) / 2;
      }
    }
    
    // コンテンツタイプ調整
    const contentMultiplier = {
      'photo': 1.0,
      'video': 1.3,
      'story': 0.8,
      'reel': 1.5,
      'live': 1.2
    };
    
    const finalRate = baseEngagementRate * (contentMultiplier[contentType] || 1.0);
    
    // 予想リーチとエンゲージメント数計算
    const estimatedReach = Math.floor(Math.random() * 50000) + 10000; // 1万〜6万のランダム
    const estimatedEngagements = Math.floor(estimatedReach * (finalRate / 100));
    
    res.json({
      success: true,
      prediction: {
        influencerId,
        influencerName: influencer.displayName,
        contentType,
        estimatedEngagementRate: Math.round(finalRate * 10) / 10,
        estimatedReach,
        estimatedEngagements,
        estimatedLikes: Math.floor(estimatedEngagements * 0.8),
        estimatedComments: Math.floor(estimatedEngagements * 0.15),
        estimatedShares: Math.floor(estimatedEngagements * 0.05),
        confidenceLevel: influencer.achievements.length > 3 ? 'High' : 'Medium',
        basedOnAchievements: influencer.achievements.length
      }
    });
  } catch (error) {
    console.error('Engagement prediction error:', error);
    res.status(500).json({ error: 'エンゲージメント予測エラー' });
  }
});

// キャンペーン分析・パフォーマンストラッキング
app.post('/api/analytics/campaign', async (req, res) => {
  try {
    const { projectId } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: {
            companyName: true
          }
        },
        matchedInfluencer: {
          include: {
            achievements: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90日以内
                }
              }
            }
          }
        },
        applications: {
          include: {
            influencer: {
              select: {
                displayName: true
              }
            }
          }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }
    
    // 分析データ生成
    const analytics = {
      projectId: project.id,
      projectTitle: project.title,
      companyName: project.client.companyName,
      budget: project.budget,
      status: project.status,
      totalApplications: project.applications.length,
      
      // パフォーマンス指標（サンプルデータ）
      performance: {
        reach: Math.floor(Math.random() * 100000) + 50000,
        impressions: Math.floor(Math.random() * 200000) + 100000,
        engagements: Math.floor(Math.random() * 10000) + 5000,
        clicks: Math.floor(Math.random() * 2000) + 500,
        conversions: Math.floor(Math.random() * 100) + 20,
        ctr: Math.round((Math.random() * 3 + 1) * 100) / 100, // 1-4%
        conversionRate: Math.round((Math.random() * 5 + 1) * 100) / 100, // 1-6%
      },
      
      // ROI計算
      roi: calculateROI(project.budget),
      
      // 参加インフルエンサー分析
      influencerAnalysis: project.matchedInfluencer ? {
        name: project.matchedInfluencer.displayName,
        recentAchievements: project.matchedInfluencer.achievements.length,
        avgEngagementRate: calculateAvgEngagementRate(project.matchedInfluencer.achievements)
      } : null,
      
      // 応募分析
      applicationAnalysis: {
        totalApplications: project.applications.length,
        averageResponseTime: '2.5日',
        topApplicants: project.applications.slice(0, 3).map(app => ({
          name: app.influencer.displayName,
          proposedPrice: app.proposedPrice
        }))
      }
    };
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({ error: 'キャンペーン分析エラー' });
  }
});

// ROI計算
function calculateROI(budget) {
  // サンプルROI計算
  const revenue = budget * (1.5 + Math.random() * 2); // 1.5-3.5倍のランダム
  const roi = ((revenue - budget) / budget) * 100;
  
  return {
    revenue: Math.floor(revenue),
    investment: budget,
    profit: Math.floor(revenue - budget),
    roiPercentage: Math.round(roi * 10) / 10
  };
}

// 平均エンゲージメント率計算
function calculateAvgEngagementRate(achievements) {
  if (!achievements || achievements.length === 0) return 0;
  
  let totalRate = 0;
  let count = 0;
  
  achievements.forEach(ach => {
    if (ach.metrics && ach.metrics.views && ach.metrics.likes) {
      totalRate += (ach.metrics.likes / ach.metrics.views) * 100;
      count++;
    }
  });
  
  return count > 0 ? Math.round((totalRate / count) * 10) / 10 : 0;
}

// データベース接続テスト
app.get('/api/test/database', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const applicationCount = await prisma.application.count();
    const achievementCount = await prisma.achievement.count();
    const bulkInquiryCount = await prisma.bulkInquiry.count();
    
    res.json({
      status: 'connected',
      userCount,
      projectCount,
      applicationCount,
      achievementCount,
      bulkInquiryCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

// 競合他社分析エンドポイント
app.post('/api/competitor-analysis', async (req, res) => {
  try {
    const { category, region, engagementThreshold = 1000 } = req.body;
    
    // 実際の競合分析では外部APIを使用しますが、ここではモックデータを提供
    const mockCompetitors = [
      {
        id: 'comp1',
        name: '競合企業A',
        category: 'BEAUTY',
        region: '東京都',
        recentCampaigns: [
          {
            id: 'camp1',
            title: '新商品プロモーション',
            startDate: '2024-01-15',
            endDate: '2024-02-15',
            budget: 500000,
            influencers: ['inf1', 'inf2', 'inf3'],
            engagement: 12500,
            reach: 85000
          }
        ]
      },
      {
        id: 'comp2',
        name: '競合企業B',
        category: 'LIFESTYLE',
        region: '大阪府',
        recentCampaigns: [
          {
            id: 'camp2',
            title: 'ブランドアウェアネス',
            startDate: '2024-02-01',
            endDate: '2024-02-28',
            budget: 800000,
            influencers: ['inf4', 'inf5'],
            engagement: 18000,
            reach: 120000
          }
        ]
      }
    ];

    // 競合が使用しているインフルエンサーを分析
    const competitorInfluencers = await prisma.user.findMany({
      where: {
        role: 'INFLUENCER',
        profile: {
          categories: {
            has: category
          }
        }
      },
      include: {
        profile: true,
        achievements: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    });

    // 各インフルエンサーの競合使用頻度を計算
    const influencerAnalysis = competitorInfluencers.map(inf => {
      const competitorUsage = Math.floor(Math.random() * 5) + 1; // モック値
      const avgEngagement = calculateEngagementRate(inf.achievements);
      const estimatedRate = Math.floor(Math.random() * 100000) + 50000; // モック値
      
      return {
        id: inf.id,
        name: inf.profile?.displayName || inf.email,
        category: inf.profile?.categories || [],
        competitorUsage,
        avgEngagement,
        estimatedRate,
        recentWork: inf.achievements.map(ach => ({
          title: ach.title,
          purpose: ach.purpose,
          metrics: ach.metrics
        })),
        riskLevel: competitorUsage > 3 ? 'HIGH' : competitorUsage > 1 ? 'MEDIUM' : 'LOW'
      };
    });

    // 競合分析サマリー
    const analysis = {
      totalCompetitors: mockCompetitors.length,
      activeInfluencers: influencerAnalysis.length,
      avgBudget: mockCompetitors.reduce((sum, comp) => 
        sum + comp.recentCampaigns.reduce((cSum, camp) => cSum + camp.budget, 0), 0) / mockCompetitors.length,
      popularCategories: [category, 'LIFESTYLE', 'BEAUTY'].slice(0, 3),
      recommendations: [
        '競合が使用していない新進インフルエンサーへの投資を検討',
        '競合より高いエンゲージメント率を持つインフルエンサーを特定',
        '競合のキャンペーン終了後のタイミングでアプローチ'
      ]
    };

    res.json({
      analysis,
      competitors: mockCompetitors,
      influencerAnalysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze competitors' });
  }
});

// 高度なキャンペーン分析・ROI計算
app.post('/api/analytics/campaign-performance', async (req, res) => {
  try {
    const { projectId, startDate, endDate, metrics } = req.body;
    
    // プロジェクトの詳細情報を取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        applications: {
          include: {
            influencer: {
              include: {
                profile: true,
                achievements: {
                  where: {
                    createdAt: {
                      gte: new Date(startDate),
                      lte: new Date(endDate)
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // パフォーマンス指標の計算
    const campaignMetrics = {
      totalReach: 0,
      totalEngagement: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalCost: project.budget || 0,
      influencerCount: project.applications.length,
      avgEngagementRate: 0,
      costPerEngagement: 0,
      roi: 0
    };

    // 各インフルエンサーのパフォーマンスを分析
    const influencerPerformance = project.applications.map(app => {
      const influencer = app.influencer;
      const achievements = influencer.achievements || [];
      
      const performance = {
        id: influencer.id,
        name: influencer.profile?.displayName || influencer.email,
        reach: achievements.reduce((sum, ach) => sum + (ach.metrics?.views || 0), 0),
        engagement: achievements.reduce((sum, ach) => {
          const m = ach.metrics || {};
          return sum + (m.likes || 0) + (m.comments || 0) + (m.shares || 0);
        }, 0),
        clicks: achievements.reduce((sum, ach) => sum + (ach.metrics?.clicks || 0), 0),
        conversions: achievements.reduce((sum, ach) => sum + (ach.metrics?.conversions || 0), 0),
        posts: achievements.length,
        engagementRate: 0,
        costPerEngagement: 0
      };

      // エンゲージメント率の計算
      performance.engagementRate = performance.reach > 0 ? 
        (performance.engagement / performance.reach) * 100 : 0;

      // キャンペーンメトリクスに追加
      campaignMetrics.totalReach += performance.reach;
      campaignMetrics.totalEngagement += performance.engagement;
      campaignMetrics.totalClicks += performance.clicks;
      campaignMetrics.totalConversions += performance.conversions;

      return performance;
    });

    // 総合指標の計算
    campaignMetrics.avgEngagementRate = campaignMetrics.totalReach > 0 ? 
      (campaignMetrics.totalEngagement / campaignMetrics.totalReach) * 100 : 0;
    
    campaignMetrics.costPerEngagement = campaignMetrics.totalEngagement > 0 ? 
      campaignMetrics.totalCost / campaignMetrics.totalEngagement : 0;

    // ROI計算（仮定：コンバージョン単価5000円）
    const estimatedRevenue = campaignMetrics.totalConversions * 5000;
    campaignMetrics.roi = campaignMetrics.totalCost > 0 ? 
      ((estimatedRevenue - campaignMetrics.totalCost) / campaignMetrics.totalCost) * 100 : 0;

    // 期間別パフォーマンス（日別）
    const dailyPerformance = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayMetrics = {
        date: d.toISOString().split('T')[0],
        reach: Math.floor(Math.random() * 10000) + 1000, // モック値
        engagement: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 200) + 20,
        conversions: Math.floor(Math.random() * 50) + 5
      };
      dailyPerformance.push(dayMetrics);
    }

    // 推奨改善点
    const recommendations = [];
    if (campaignMetrics.avgEngagementRate < 2) {
      recommendations.push('エンゲージメント率が低いため、コンテンツの質を向上させることを推奨');
    }
    if (campaignMetrics.costPerEngagement > 10) {
      recommendations.push('コスト効率が悪いため、より安価なインフルエンサーとの協業を検討');
    }
    if (campaignMetrics.totalConversions < 100) {
      recommendations.push('コンバージョン率向上のため、CTA（Call to Action）を強化');
    }

    res.json({
      projectId,
      campaignMetrics,
      influencerPerformance,
      dailyPerformance,
      recommendations,
      analysisDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to analyze campaign performance' });
  }
});

// リアルタイムパフォーマンス監視
app.get('/api/analytics/realtime/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // リアルタイムメトリクス（通常は外部API経由で取得）
    const realtimeMetrics = {
      currentReach: Math.floor(Math.random() * 50000) + 10000,
      currentEngagement: Math.floor(Math.random() * 5000) + 1000,
      currentClicks: Math.floor(Math.random() * 1000) + 200,
      currentConversions: Math.floor(Math.random() * 100) + 20,
      trendDirection: Math.random() > 0.5 ? 'up' : 'down',
      lastUpdated: new Date().toISOString(),
      
      // 過去24時間のトレンド
      hourlyTrend: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        reach: Math.floor(Math.random() * 2000) + 500,
        engagement: Math.floor(Math.random() * 200) + 50,
        engagementRate: Math.random() * 5 + 1
      })),
      
      // アクティブインフルエンサー
      activeInfluencers: Math.floor(Math.random() * 10) + 1,
      
      // 地域別パフォーマンス
      regionalPerformance: [
        { region: '東京都', engagement: Math.floor(Math.random() * 2000) + 500 },
        { region: '大阪府', engagement: Math.floor(Math.random() * 1500) + 300 },
        { region: '神奈川県', engagement: Math.floor(Math.random() * 1200) + 200 }
      ]
    };

    res.json(realtimeMetrics);
  } catch (error) {
    console.error('Realtime analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch realtime metrics' });
  }
});

// リード生成・収益追跡システム
app.post('/api/lead-generation/track', async (req, res) => {
  try {
    const { projectId, influencerId, leadSource, leadType, leadValue, customerInfo } = req.body;
    
    // リードをデータベースに保存（実際のシステムでは専用のLeadテーブルを使用）
    const leadData = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      influencerId,
      leadSource, // 'instagram', 'youtube', 'tiktok', 'twitter'
      leadType, // 'inquiry', 'purchase', 'signup', 'download'
      leadValue: parseFloat(leadValue) || 0,
      customerInfo: customerInfo || {},
      status: 'new',
      createdAt: new Date().toISOString(),
      attributionPath: [], // 顧客の接触履歴
      conversionProbability: Math.random() * 100 // AI予測コンバージョン確率
    };
    
    // リード情報を一時的にメモリに保存（実際のシステムでは永続化）
    if (!global.leadDatabase) {
      global.leadDatabase = [];
    }
    global.leadDatabase.push(leadData);
    
    res.json({
      success: true,
      leadId: leadData.id,
      message: 'リードが正常に追跡されました'
    });
  } catch (error) {
    console.error('Lead tracking error:', error);
    res.status(500).json({ error: 'Failed to track lead' });
  }
});

// リード分析・レポート生成
app.get('/api/lead-generation/analytics', async (req, res) => {
  try {
    const { projectId, startDate, endDate, influencerId } = req.query;
    
    // リードデータを取得
    const allLeads = global.leadDatabase || [];
    let filteredLeads = allLeads;
    
    if (projectId) {
      filteredLeads = filteredLeads.filter(lead => lead.projectId === projectId);
    }
    
    if (influencerId) {
      filteredLeads = filteredLeads.filter(lead => lead.influencerId === influencerId);
    }
    
    if (startDate && endDate) {
      filteredLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= new Date(startDate) && leadDate <= new Date(endDate);
      });
    }
    
    // 分析指標の計算
    const analytics = {
      totalLeads: filteredLeads.length,
      totalValue: filteredLeads.reduce((sum, lead) => sum + lead.leadValue, 0),
      averageLeadValue: filteredLeads.length > 0 ? 
        filteredLeads.reduce((sum, lead) => sum + lead.leadValue, 0) / filteredLeads.length : 0,
      
      // リードソース別分析
      bySource: {},
      byType: {},
      byInfluencer: {},
      
      // 時系列分析
      dailyLeads: [],
      
      // コンバージョンファネル
      conversionFunnel: {
        awareness: filteredLeads.length,
        interest: Math.floor(filteredLeads.length * 0.7),
        consideration: Math.floor(filteredLeads.length * 0.4),
        purchase: Math.floor(filteredLeads.length * 0.15)
      },
      
      // 高価値リード
      highValueLeads: filteredLeads.filter(lead => lead.leadValue > 10000),
      
      // 予測分析
      predictedRevenue: filteredLeads.reduce((sum, lead) => 
        sum + (lead.leadValue * lead.conversionProbability / 100), 0
      )
    };
    
    // ソース別分析
    filteredLeads.forEach(lead => {
      analytics.bySource[lead.leadSource] = (analytics.bySource[lead.leadSource] || 0) + 1;
      analytics.byType[lead.leadType] = (analytics.byType[lead.leadType] || 0) + 1;
      analytics.byInfluencer[lead.influencerId] = (analytics.byInfluencer[lead.influencerId] || 0) + 1;
    });
    
    // 過去30日間の日別リード数
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyCount = filteredLeads.filter(lead => 
        lead.createdAt.startsWith(dateStr)
      ).length;
      
      analytics.dailyLeads.push({
        date: dateStr,
        leads: dailyCount,
        value: filteredLeads.filter(lead => 
          lead.createdAt.startsWith(dateStr)
        ).reduce((sum, lead) => sum + lead.leadValue, 0)
      });
    }
    
    res.json(analytics);
  } catch (error) {
    console.error('Lead analytics error:', error);
    res.status(500).json({ error: 'Failed to generate lead analytics' });
  }
});

// 収益追跡・ROI計算
app.post('/api/revenue/track', async (req, res) => {
  try {
    const { projectId, influencerId, revenue, cost, conversionType, attribution } = req.body;
    
    // 収益データを記録
    const revenueData = {
      id: `revenue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      influencerId,
      revenue: parseFloat(revenue) || 0,
      cost: parseFloat(cost) || 0,
      conversionType, // 'direct', 'assisted', 'view_through'
      attribution: attribution || 'last_click',
      roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
      createdAt: new Date().toISOString(),
      quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1}_${new Date().getFullYear()}`
    };
    
    // 収益データを保存
    if (!global.revenueDatabase) {
      global.revenueDatabase = [];
    }
    global.revenueDatabase.push(revenueData);
    
    res.json({
      success: true,
      revenueId: revenueData.id,
      roi: revenueData.roi,
      message: '収益が正常に追跡されました'
    });
  } catch (error) {
    console.error('Revenue tracking error:', error);
    res.status(500).json({ error: 'Failed to track revenue' });
  }
});

// 収益分析・レポート
app.get('/api/revenue/analytics', async (req, res) => {
  try {
    const { projectId, startDate, endDate, influencerId } = req.query;
    
    const allRevenue = global.revenueDatabase || [];
    let filteredRevenue = allRevenue;
    
    if (projectId) {
      filteredRevenue = filteredRevenue.filter(rev => rev.projectId === projectId);
    }
    
    if (influencerId) {
      filteredRevenue = filteredRevenue.filter(rev => rev.influencerId === influencerId);
    }
    
    if (startDate && endDate) {
      filteredRevenue = filteredRevenue.filter(rev => {
        const revDate = new Date(rev.createdAt);
        return revDate >= new Date(startDate) && revDate <= new Date(endDate);
      });
    }
    
    const analytics = {
      totalRevenue: filteredRevenue.reduce((sum, rev) => sum + rev.revenue, 0),
      totalCost: filteredRevenue.reduce((sum, rev) => sum + rev.cost, 0),
      totalROI: 0,
      averageROI: 0,
      
      // 期間別収益
      monthlyRevenue: {},
      quarterlyRevenue: {},
      
      // インフルエンサー別ROI
      influencerROI: {},
      
      // コンバージョンタイプ別
      byConversionType: {},
      
      // 収益予測
      projectedRevenue: 0,
      
      // トップパフォーマー
      topInfluencers: []
    };
    
    // 基本指標計算
    analytics.totalROI = analytics.totalCost > 0 ? 
      ((analytics.totalRevenue - analytics.totalCost) / analytics.totalCost) * 100 : 0;
    
    analytics.averageROI = filteredRevenue.length > 0 ? 
      filteredRevenue.reduce((sum, rev) => sum + rev.roi, 0) / filteredRevenue.length : 0;
    
    // インフルエンサー別ROI分析
    const influencerStats = {};
    filteredRevenue.forEach(rev => {
      if (!influencerStats[rev.influencerId]) {
        influencerStats[rev.influencerId] = {
          revenue: 0,
          cost: 0,
          count: 0
        };
      }
      influencerStats[rev.influencerId].revenue += rev.revenue;
      influencerStats[rev.influencerId].cost += rev.cost;
      influencerStats[rev.influencerId].count += 1;
    });
    
    Object.keys(influencerStats).forEach(influencerId => {
      const stats = influencerStats[influencerId];
      analytics.influencerROI[influencerId] = {
        revenue: stats.revenue,
        cost: stats.cost,
        roi: stats.cost > 0 ? ((stats.revenue - stats.cost) / stats.cost) * 100 : 0,
        campaigns: stats.count
      };
    });
    
    // トップパフォーマー
    analytics.topInfluencers = Object.entries(analytics.influencerROI)
      .sort((a, b) => b[1].roi - a[1].roi)
      .slice(0, 5)
      .map(([influencerId, stats]) => ({
        influencerId,
        roi: stats.roi,
        revenue: stats.revenue
      }));
    
    // コンバージョンタイプ別分析
    filteredRevenue.forEach(rev => {
      if (!analytics.byConversionType[rev.conversionType]) {
        analytics.byConversionType[rev.conversionType] = {
          revenue: 0,
          cost: 0,
          count: 0
        };
      }
      analytics.byConversionType[rev.conversionType].revenue += rev.revenue;
      analytics.byConversionType[rev.conversionType].cost += rev.cost;
      analytics.byConversionType[rev.conversionType].count += 1;
    });
    
    // 収益予測（過去のトレンドベース）
    const recentRevenue = filteredRevenue.slice(-30); // 最新30件
    const avgDailyRevenue = recentRevenue.length > 0 ? 
      recentRevenue.reduce((sum, rev) => sum + rev.revenue, 0) / recentRevenue.length : 0;
    analytics.projectedRevenue = avgDailyRevenue * 30; // 30日間の予測
    
    res.json(analytics);
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to generate revenue analytics' });
  }
});

// ソーシャルメディア統合機能
app.post('/api/social-media/sync', async (req, res) => {
  try {
    const { influencerId, platform, credentials } = req.body;
    
    // 各プラットフォームに対応したデータ取得（実際のAPIキーが必要）
    const socialData = {
      platform,
      influencerId,
      syncedAt: new Date().toISOString(),
      data: {}
    };
    
    switch (platform) {
      case 'instagram':
        socialData.data = await mockInstagramAPI(credentials);
        break;
      case 'youtube':
        socialData.data = await mockYouTubeAPI(credentials);
        break;
      case 'tiktok':
        socialData.data = await mockTikTokAPI(credentials);
        break;
      case 'twitter':
        socialData.data = await mockTwitterAPI(credentials);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }
    
    // データベースに保存
    if (!global.socialMediaDatabase) {
      global.socialMediaDatabase = [];
    }
    global.socialMediaDatabase.push(socialData);
    
    res.json({
      success: true,
      syncId: `sync_${Date.now()}`,
      platform,
      dataPoints: Object.keys(socialData.data).length,
      message: `${platform}データの同期が完了しました`
    });
  } catch (error) {
    console.error('Social media sync error:', error);
    res.status(500).json({ error: 'Failed to sync social media data' });
  }
});

// Instagram API モック
async function mockInstagramAPI(credentials) {
  return {
    profile: {
      followers: Math.floor(Math.random() * 100000) + 10000,
      following: Math.floor(Math.random() * 1000) + 100,
      posts: Math.floor(Math.random() * 500) + 50,
      engagement_rate: Math.random() * 5 + 1,
      verification: Math.random() > 0.7
    },
    recent_posts: Array.from({ length: 10 }, (_, i) => ({
      id: `post_${i}`,
      caption: `Sample Instagram post ${i + 1}`,
      likes: Math.floor(Math.random() * 5000) + 100,
      comments: Math.floor(Math.random() * 200) + 10,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      media_type: Math.random() > 0.5 ? 'photo' : 'video'
    })),
    audience_insights: {
      age_groups: {
        '18-24': 25,
        '25-34': 35,
        '35-44': 25,
        '45+': 15
      },
      gender: {
        'male': 45,
        'female': 55
      },
      top_locations: ['Tokyo', 'Osaka', 'Kyoto']
    }
  };
}

// YouTube API モック
async function mockYouTubeAPI(credentials) {
  return {
    channel: {
      subscribers: Math.floor(Math.random() * 50000) + 5000,
      total_views: Math.floor(Math.random() * 1000000) + 100000,
      video_count: Math.floor(Math.random() * 200) + 20,
      average_views: Math.floor(Math.random() * 10000) + 1000,
      verification: Math.random() > 0.6
    },
    recent_videos: Array.from({ length: 10 }, (_, i) => ({
      id: `video_${i}`,
      title: `Sample YouTube video ${i + 1}`,
      views: Math.floor(Math.random() * 50000) + 1000,
      likes: Math.floor(Math.random() * 2000) + 50,
      comments: Math.floor(Math.random() * 500) + 20,
      duration: Math.floor(Math.random() * 600) + 60,
      published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
    })),
    analytics: {
      watch_time_hours: Math.floor(Math.random() * 1000) + 100,
      ctr: Math.random() * 10 + 2,
      retention_rate: Math.random() * 40 + 30
    }
  };
}

// TikTok API モック
async function mockTikTokAPI(credentials) {
  return {
    profile: {
      followers: Math.floor(Math.random() * 200000) + 20000,
      following: Math.floor(Math.random() * 500) + 50,
      likes: Math.floor(Math.random() * 500000) + 50000,
      video_count: Math.floor(Math.random() * 100) + 10,
      verification: Math.random() > 0.8
    },
    recent_videos: Array.from({ length: 10 }, (_, i) => ({
      id: `tiktok_${i}`,
      description: `Sample TikTok video ${i + 1}`,
      view_count: Math.floor(Math.random() * 100000) + 5000,
      like_count: Math.floor(Math.random() * 10000) + 500,
      comment_count: Math.floor(Math.random() * 1000) + 50,
      share_count: Math.floor(Math.random() * 500) + 25,
      create_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
    })),
    trending_hashtags: ['#fashion', '#beauty', '#lifestyle', '#trending']
  };
}

// Twitter API モック
async function mockTwitterAPI(credentials) {
  return {
    profile: {
      followers: Math.floor(Math.random() * 30000) + 3000,
      following: Math.floor(Math.random() * 1000) + 200,
      tweets: Math.floor(Math.random() * 2000) + 200,
      verified: Math.random() > 0.7
    },
    recent_tweets: Array.from({ length: 10 }, (_, i) => ({
      id: `tweet_${i}`,
      text: `Sample tweet ${i + 1} about influencer marketing`,
      retweet_count: Math.floor(Math.random() * 100) + 5,
      favorite_count: Math.floor(Math.random() * 500) + 25,
      reply_count: Math.floor(Math.random() * 50) + 2,
      created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    })),
    engagement_metrics: {
      avg_retweets: Math.floor(Math.random() * 50) + 10,
      avg_likes: Math.floor(Math.random() * 200) + 50,
      engagement_rate: Math.random() * 3 + 1
    }
  };
}

// ソーシャルメディア統合データ取得
app.get('/api/social-media/data/:influencerId', async (req, res) => {
  try {
    const { influencerId } = req.params;
    const { platform } = req.query;
    
    const socialData = global.socialMediaDatabase || [];
    let filteredData = socialData.filter(data => data.influencerId === influencerId);
    
    if (platform) {
      filteredData = filteredData.filter(data => data.platform === platform);
    }
    
    // 統合メトリクスの計算
    const aggregatedMetrics = {
      totalFollowers: 0,
      totalEngagement: 0,
      avgEngagementRate: 0,
      platformCount: filteredData.length,
      lastSync: null,
      platforms: {}
    };
    
    filteredData.forEach(data => {
      const platform = data.platform;
      aggregatedMetrics.platforms[platform] = data.data;
      
      // フォロワー数の合計
      if (data.data.profile?.followers) {
        aggregatedMetrics.totalFollowers += data.data.profile.followers;
      }
      if (data.data.channel?.subscribers) {
        aggregatedMetrics.totalFollowers += data.data.channel.subscribers;
      }
      
      // エンゲージメント率の平均
      if (data.data.profile?.engagement_rate) {
        aggregatedMetrics.avgEngagementRate += data.data.profile.engagement_rate;
      }
      if (data.data.engagement_metrics?.engagement_rate) {
        aggregatedMetrics.avgEngagementRate += data.data.engagement_metrics.engagement_rate;
      }
      
      // 最新の同期時間
      if (!aggregatedMetrics.lastSync || data.syncedAt > aggregatedMetrics.lastSync) {
        aggregatedMetrics.lastSync = data.syncedAt;
      }
    });
    
    if (filteredData.length > 0) {
      aggregatedMetrics.avgEngagementRate /= filteredData.length;
    }
    
    res.json({
      influencerId,
      aggregatedMetrics,
      platformData: filteredData,
      recommendations: generateSocialMediaRecommendations(aggregatedMetrics)
    });
  } catch (error) {
    console.error('Social media data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch social media data' });
  }
});

// ソーシャルメディア推奨事項生成
function generateSocialMediaRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.avgEngagementRate < 2) {
    recommendations.push('エンゲージメント率が低いため、コンテンツ品質の向上を推奨');
  }
  
  if (metrics.platformCount < 3) {
    recommendations.push('複数プラットフォームでの活動でリーチを拡大');
  }
  
  if (metrics.totalFollowers < 10000) {
    recommendations.push('フォロワー増加施策の実施を推奨');
  }
  
  recommendations.push('定期的なコンテンツ投稿でエンゲージメントを維持');
  recommendations.push('ハッシュタグ戦略の最適化でリーチを向上');
  
  return recommendations;
}

// 高度な検索・フィルタリング機能
app.post('/api/advanced-search', async (req, res) => {
  try {
    const {
      categories = [],
      locations = [],
      followerRange = { min: 0, max: 1000000 },
      engagementRateRange = { min: 0, max: 100 },
      priceRange = { min: 0, max: 1000000 },
      keywords = [],
      platforms = [],
      achievementPurposes = [],
      availabilityDates = [],
      sortBy = 'relevance',
      limit = 20,
      offset = 0
    } = req.body;
    
    // インフルエンサーの検索
    const allInfluencers = await prisma.user.findMany({
      where: {
        role: 'INFLUENCER'
      },
      include: {
        profile: true,
        achievements: true,
        servicePricing: true,
        socialAccounts: true
      }
    });
    
    // 高度なフィルタリング
    let filteredInfluencers = allInfluencers.filter(influencer => {
      const profile = influencer.profile;
      if (!profile) return false;
      
      // カテゴリフィルタ
      if (categories.length > 0) {
        const hasCategory = categories.some(cat => profile.categories?.includes(cat));
        if (!hasCategory) return false;
      }
      
      // 場所フィルタ
      if (locations.length > 0) {
        if (!locations.includes(profile.prefecture)) return false;
      }
      
      // フォロワー範囲（ソーシャルメディアデータから）
      const socialData = global.socialMediaDatabase?.find(data => 
        data.influencerId === influencer.id
      );
      if (socialData) {
        const followers = socialData.data.profile?.followers || 0;
        if (followers < followerRange.min || followers > followerRange.max) {
          return false;
        }
      }
      
      // エンゲージメント率フィルタ
      const avgEngagement = calculateEngagementRate(influencer.achievements);
      if (avgEngagement < engagementRateRange.min || avgEngagement > engagementRateRange.max) {
        return false;
      }
      
      // 価格範囲フィルタ
      if (influencer.servicePricing?.length > 0) {
        const avgPrice = influencer.servicePricing.reduce((sum, sp) => sum + sp.price, 0) / influencer.servicePricing.length;
        if (avgPrice < priceRange.min || avgPrice > priceRange.max) {
          return false;
        }
      }
      
      // キーワードフィルタ
      if (keywords.length > 0) {
        const searchText = `${profile.displayName || ''} ${profile.bio || ''}`.toLowerCase();
        const hasKeyword = keywords.some(keyword => 
          searchText.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }
      
      // プラットフォームフィルタ
      if (platforms.length > 0) {
        const hasPllatform = platforms.some(platform => 
          influencer.socialAccounts?.some(acc => acc.platform === platform)
        );
        if (!hasPllatform) return false;
      }
      
      // 実績目的フィルタ
      if (achievementPurposes.length > 0) {
        const hasPurpose = achievementPurposes.some(purpose => 
          influencer.achievements?.some(ach => ach.purpose === purpose)
        );
        if (!hasPurpose) return false;
      }
      
      return true;
    });
    
    // スコアリングとソート
    const scoredInfluencers = filteredInfluencers.map(influencer => {
      let score = 0;
      
      // エンゲージメント率スコア
      const engagementRate = calculateEngagementRate(influencer.achievements);
      score += engagementRate * 10;
      
      // 実績数スコア
      score += (influencer.achievements?.length || 0) * 5;
      
      // プロフィール完成度スコア
      if (influencer.profile?.displayName) score += 10;
      if (influencer.profile?.bio) score += 10;
      if (influencer.profile?.categories?.length > 0) score += 15;
      
      // ソーシャルメディアスコア
      const socialData = global.socialMediaDatabase?.find(data => 
        data.influencerId === influencer.id
      );
      if (socialData) {
        const followers = socialData.data.profile?.followers || 0;
        score += Math.log10(followers + 1) * 5;
      }
      
      // 価格競争力スコア
      if (influencer.servicePricing?.length > 0) {
        const avgPrice = influencer.servicePricing.reduce((sum, sp) => sum + sp.price, 0) / influencer.servicePricing.length;
        score += Math.max(0, 100 - (avgPrice / 1000)); // 安いほど高スコア
      }
      
      return {
        ...influencer,
        searchScore: score,
        matchReasons: generateMatchReasons(influencer, {
          categories, locations, keywords, platforms, achievementPurposes
        })
      };
    });
    
    // ソート
    switch (sortBy) {
      case 'relevance':
        scoredInfluencers.sort((a, b) => b.searchScore - a.searchScore);
        break;
      case 'engagement':
        scoredInfluencers.sort((a, b) => 
          calculateEngagementRate(b.achievements) - calculateEngagementRate(a.achievements)
        );
        break;
      case 'followers':
        scoredInfluencers.sort((a, b) => {
          const aFollowers = global.socialMediaDatabase?.find(data => data.influencerId === a.id)?.data.profile?.followers || 0;
          const bFollowers = global.socialMediaDatabase?.find(data => data.influencerId === b.id)?.data.profile?.followers || 0;
          return bFollowers - aFollowers;
        });
        break;
      case 'price':
        scoredInfluencers.sort((a, b) => {
          const aPrice = a.servicePricing?.length > 0 ? 
            a.servicePricing.reduce((sum, sp) => sum + sp.price, 0) / a.servicePricing.length : 0;
          const bPrice = b.servicePricing?.length > 0 ? 
            b.servicePricing.reduce((sum, sp) => sum + sp.price, 0) / b.servicePricing.length : 0;
          return aPrice - bPrice;
        });
        break;
    }
    
    // ページネーション
    const paginatedResults = scoredInfluencers.slice(offset, offset + limit);
    
    res.json({
      results: paginatedResults,
      totalCount: scoredInfluencers.length,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(scoredInfluencers.length / limit),
      searchCriteria: {
        categories, locations, followerRange, engagementRateRange, 
        priceRange, keywords, platforms, achievementPurposes,
        sortBy, limit, offset
      },
      suggestions: generateSearchSuggestions(scoredInfluencers, {
        categories, locations, keywords, platforms
      })
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Failed to perform advanced search' });
  }
});

// マッチング理由の生成
function generateMatchReasons(influencer, criteria) {
  const reasons = [];
  
  if (criteria.categories.length > 0) {
    const matchedCategories = criteria.categories.filter(cat => 
      influencer.profile?.categories?.includes(cat)
    );
    if (matchedCategories.length > 0) {
      reasons.push(`カテゴリマッチ: ${matchedCategories.join(', ')}`);
    }
  }
  
  if (criteria.locations.length > 0 && criteria.locations.includes(influencer.profile?.prefecture)) {
    reasons.push(`地域マッチ: ${influencer.profile.prefecture}`);
  }
  
  if (criteria.keywords.length > 0) {
    const searchText = `${influencer.profile?.displayName || ''} ${influencer.profile?.bio || ''}`.toLowerCase();
    const matchedKeywords = criteria.keywords.filter(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    if (matchedKeywords.length > 0) {
      reasons.push(`キーワードマッチ: ${matchedKeywords.join(', ')}`);
    }
  }
  
  const engagementRate = calculateEngagementRate(influencer.achievements);
  if (engagementRate > 3) {
    reasons.push('高エンゲージメント率');
  }
  
  if (influencer.achievements?.length > 5) {
    reasons.push('豊富な実績');
  }
  
  return reasons;
}

// 検索提案の生成
function generateSearchSuggestions(results, criteria) {
  const suggestions = [];
  
  // カテゴリ提案
  const categoryCount = {};
  results.forEach(influencer => {
    influencer.profile?.categories?.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
  });
  
  const topCategories = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
  
  if (topCategories.length > 0) {
    suggestions.push({
      type: 'category',
      title: '関連カテゴリ',
      items: topCategories
    });
  }
  
  // 価格帯提案
  const priceRanges = [
    { min: 0, max: 50000, label: '〜5万円' },
    { min: 50000, max: 100000, label: '5〜10万円' },
    { min: 100000, max: 200000, label: '10〜20万円' },
    { min: 200000, max: 500000, label: '20〜50万円' },
    { min: 500000, max: 1000000, label: '50万円〜' }
  ];
  
  suggestions.push({
    type: 'price',
    title: '価格帯で絞り込み',
    items: priceRanges
  });
  
  // エンゲージメント率提案
  suggestions.push({
    type: 'engagement',
    title: 'エンゲージメント率',
    items: [
      { min: 0, max: 1, label: '〜1%' },
      { min: 1, max: 3, label: '1〜3%' },
      { min: 3, max: 5, label: '3〜5%' },
      { min: 5, max: 100, label: '5%以上' }
    ]
  });
  
  return suggestions;
}

// 保存された検索の管理
app.post('/api/saved-searches', async (req, res) => {
  try {
    const { userId, searchName, searchCriteria } = req.body;
    
    const savedSearch = {
      id: `search_${Date.now()}`,
      userId,
      name: searchName,
      criteria: searchCriteria,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 1
    };
    
    if (!global.savedSearches) {
      global.savedSearches = [];
    }
    global.savedSearches.push(savedSearch);
    
    res.json({
      success: true,
      searchId: savedSearch.id,
      message: '検索条件を保存しました'
    });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ error: 'Failed to save search' });
  }
});

app.get('/api/saved-searches/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const savedSearches = global.savedSearches || [];
    const userSearches = savedSearches.filter(search => search.userId === userId);
    
    res.json({
      searches: userSearches.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
    });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ error: 'Failed to get saved searches' });
  }
});

// チャット・案件管理機能
app.post('/api/chat/rooms', async (req, res) => {
  try {
    const { projectId, participantIds, title } = req.body;
    
    const chatRoom = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title: title || 'Project Chat',
      participantIds: participantIds || [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      isActive: true
    };
    
    // チャットルームをメモリに保存
    if (!global.chatRooms) {
      global.chatRooms = [];
    }
    global.chatRooms.push(chatRoom);
    
    // 参加者に通知
    participantIds.forEach(participantId => {
      io.to(participantId).emit('chat_room_created', {
        roomId: chatRoom.id,
        title: chatRoom.title,
        projectId: chatRoom.projectId
      });
    });
    
    res.json({
      success: true,
      chatRoom,
      message: 'チャットルームが作成されました'
    });
  } catch (error) {
    console.error('Chat room creation error:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

// チャットルーム一覧取得
app.get('/api/chat/rooms/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const chatRooms = global.chatRooms || [];
    const userRooms = chatRooms.filter(room => 
      room.participantIds.includes(userId) && room.isActive
    );
    
    // 各ルームの最新メッセージを取得
    const roomsWithMessages = await Promise.all(
      userRooms.map(async (room) => {
        const messages = global.chatMessages || [];
        const roomMessages = messages.filter(msg => msg.roomId === room.id);
        const latestMessage = roomMessages.length > 0 ? 
          roomMessages[roomMessages.length - 1] : null;
        
        return {
          ...room,
          latestMessage,
          unreadCount: roomMessages.filter(msg => 
            !msg.readBy.includes(userId)
          ).length
        };
      })
    );
    
    res.json({
      rooms: roomsWithMessages.sort((a, b) => 
        new Date(b.lastActivity) - new Date(a.lastActivity)
      )
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ error: 'Failed to get chat rooms' });
  }
});

// メッセージ送信
app.post('/api/chat/messages', async (req, res) => {
  try {
    const { roomId, senderId, content, messageType = 'text', attachments = [] } = req.body;
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      senderId,
      content,
      messageType, // 'text', 'image', 'file', 'system'
      attachments,
      createdAt: new Date().toISOString(),
      readBy: [senderId], // 送信者は既読
      edited: false,
      editedAt: null
    };
    
    // メッセージをメモリに保存
    if (!global.chatMessages) {
      global.chatMessages = [];
    }
    global.chatMessages.push(message);
    
    // チャットルームの最終活動時間を更新
    const chatRooms = global.chatRooms || [];
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
      room.lastActivity = new Date().toISOString();
      room.messageCount = (room.messageCount || 0) + 1;
      
      // 他の参加者にリアルタイム通知
      room.participantIds.forEach(participantId => {
        if (participantId !== senderId) {
          io.to(participantId).emit('new_message', {
            roomId,
            message,
            roomTitle: room.title
          });
        }
      });
    }
    
    res.json({
      success: true,
      message,
      messageId: message.id
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// メッセージ取得
app.get('/api/chat/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = global.chatMessages || [];
    const roomMessages = messages.filter(msg => msg.roomId === roomId);
    
    // 日付順でソート（古い順）
    roomMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // ページネーション
    const paginatedMessages = roomMessages.slice(
      Math.max(0, roomMessages.length - limit - offset),
      roomMessages.length - offset
    );
    
    res.json({
      messages: paginatedMessages,
      totalCount: roomMessages.length,
      hasMore: roomMessages.length > limit + offset
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// メッセージ既読処理
app.put('/api/chat/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    const messages = global.chatMessages || [];
    const message = messages.find(msg => msg.id === messageId);
    
    if (message && !message.readBy.includes(userId)) {
      message.readBy.push(userId);
      
      // 送信者に既読通知
      io.to(message.senderId).emit('message_read', {
        messageId,
        userId,
        readAt: new Date().toISOString()
      });
      
      res.json({ success: true });
    } else {
      res.json({ success: true, message: 'Already read' });
    }
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// プロジェクト管理機能
app.post('/api/projects/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, note, userId } = req.body;
    
    // プロジェクトステータス更新
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { status }
    });
    
    // ステータス変更履歴を記録
    const statusHistory = {
      id: `status_${Date.now()}`,
      projectId,
      oldStatus: project.status,
      newStatus: status,
      note: note || '',
      changedBy: userId,
      changedAt: new Date().toISOString()
    };
    
    if (!global.projectStatusHistory) {
      global.projectStatusHistory = [];
    }
    global.projectStatusHistory.push(statusHistory);
    
    // 関係者に通知
    const applications = await prisma.application.findMany({
      where: { projectId },
      include: { influencer: true }
    });
    
    applications.forEach(app => {
      io.to(app.influencer.id).emit('project_status_changed', {
        projectId,
        newStatus: status,
        note,
        changedAt: statusHistory.changedAt
      });
    });
    
    // 企業にも通知
    io.to(project.clientId).emit('project_status_changed', {
      projectId,
      newStatus: status,
      note,
      changedAt: statusHistory.changedAt
    });
    
    res.json({
      success: true,
      project,
      statusHistory
    });
  } catch (error) {
    console.error('Project status update error:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

// プロジェクト進捗取得
app.get('/api/projects/:projectId/progress', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        applications: {
          include: {
            influencer: {
              include: { profile: true }
            }
          }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // ステータス履歴を取得
    const statusHistory = global.projectStatusHistory || [];
    const projectHistory = statusHistory.filter(h => h.projectId === projectId);
    
    // スケジュール情報を取得
    const schedules = global.scheduleDatabase || [];
    const projectSchedule = schedules.find(s => s.projectId === projectId);
    
    // チャットルーム情報を取得
    const chatRooms = global.chatRooms || [];
    const projectChatRooms = chatRooms.filter(room => room.projectId === projectId);
    
    // 進捗計算
    const progress = {
      projectId,
      currentStatus: project.status,
      completionPercentage: calculateProjectProgress(project.status),
      timeline: projectHistory.sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt)),
      schedule: projectSchedule,
      chatRooms: projectChatRooms,
      participants: project.applications.map(app => ({
        id: app.influencer.id,
        name: app.influencer.profile?.displayName || app.influencer.email,
        role: 'INFLUENCER',
        status: app.status
      })).concat([{
        id: project.clientId,
        name: 'Client',
        role: 'CLIENT',
        status: 'ACTIVE'
      }])
    };
    
    res.json(progress);
  } catch (error) {
    console.error('Get project progress error:', error);
    res.status(500).json({ error: 'Failed to get project progress' });
  }
});

// プロジェクト進捗計算
function calculateProjectProgress(status) {
  const statusProgress = {
    'DRAFT': 0,
    'PUBLISHED': 10,
    'APPLICATIONS_OPEN': 20,
    'IN_REVIEW': 40,
    'NEGOTIATIONS': 60,
    'CONTRACTED': 80,
    'IN_PROGRESS': 85,
    'COMPLETED': 100,
    'CANCELLED': 0
  };
  
  return statusProgress[status] || 0;
}

// ファイルアップロード（チャット用）
app.post('/api/chat/upload', async (req, res) => {
  try {
    const { fileName, fileType, fileSize, userId } = req.body;
    
    // 実際のファイルアップロード処理（ここではモック）
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileUrl = `https://storage.example.com/uploads/${fileId}`;
    
    const fileRecord = {
      id: fileId,
      fileName,
      fileType,
      fileSize,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      url: fileUrl,
      status: 'uploaded'
    };
    
    if (!global.uploadedFiles) {
      global.uploadedFiles = [];
    }
    global.uploadedFiles.push(fileRecord);
    
    res.json({
      success: true,
      file: fileRecord
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// チームアカウント管理
app.post('/api/teams', async (req, res) => {
  try {
    const { name, ownerId, plan = 'basic', settings = {} } = req.body;
    
    const team = {
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      ownerId,
      plan, // 'basic', 'pro', 'enterprise'
      settings,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      isActive: true
    };
    
    if (!global.teams) {
      global.teams = [];
    }
    global.teams.push(team);
    
    // チームメンバーレコード作成
    const teamMember = {
      id: `member_${Date.now()}`,
      teamId: team.id,
      userId: ownerId,
      role: 'OWNER',
      permissions: ['all'],
      joinedAt: new Date().toISOString(),
      isActive: true
    };
    
    if (!global.teamMembers) {
      global.teamMembers = [];
    }
    global.teamMembers.push(teamMember);
    
    res.json({
      success: true,
      team,
      message: 'チームが作成されました'
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// チームメンバー招待
app.post('/api/teams/:teamId/invite', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'MEMBER', permissions = [], invitedBy } = req.body;
    
    const invitation = {
      id: `invite_${Date.now()}`,
      teamId,
      email,
      role,
      permissions,
      invitedBy,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日後
      status: 'pending',
      token: Math.random().toString(36).substr(2, 32)
    };
    
    if (!global.teamInvitations) {
      global.teamInvitations = [];
    }
    global.teamInvitations.push(invitation);
    
    // 実際のシステムではメール送信
    console.log(`Team invitation sent to ${email} for team ${teamId}`);
    
    res.json({
      success: true,
      invitation,
      message: `${email}にチーム招待を送信しました`
    });
  } catch (error) {
    console.error('Team invite error:', error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

// チーム一覧取得
app.get('/api/teams/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const teamMembers = global.teamMembers || [];
    const userTeamMemberships = teamMembers.filter(member => 
      member.userId === userId && member.isActive
    );
    
    const teams = global.teams || [];
    const userTeams = userTeamMemberships.map(membership => {
      const team = teams.find(t => t.id === membership.teamId);
      return {
        ...team,
        memberRole: membership.role,
        permissions: membership.permissions,
        joinedAt: membership.joinedAt
      };
    });
    
    res.json({
      teams: userTeams
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({ error: 'Failed to get user teams' });
  }
});

// Stripe決済機能
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'jpy', projectId, influencerId, description } = req.body;
    
    // 実際のStripe実装では以下のようになります
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // Stripeは最小単位で処理
    //   currency,
    //   metadata: { projectId, influencerId }
    // });
    
    // モック実装
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100,
      currency,
      status: 'requires_payment_method',
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 16)}`,
      created: Date.now(),
      metadata: { projectId, influencerId },
      description: description || 'インフルエンサーマーケティング支払い'
    };
    
    // 支払い記録を保存
    if (!global.paymentIntents) {
      global.paymentIntents = [];
    }
    global.paymentIntents.push(paymentIntent);
    
    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// 支払い確認
app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;
    
    // 実際のStripe実装
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    //   payment_method: paymentMethodId
    // });
    
    // モック実装
    const paymentIntents = global.paymentIntents || [];
    const paymentIntent = paymentIntents.find(pi => pi.id === paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }
    
    // 支払い成功をシミュレート
    paymentIntent.status = 'succeeded';
    paymentIntent.payment_method = paymentMethodId;
    paymentIntent.confirmed_at = new Date().toISOString();
    
    // 支払い履歴を記録
    const paymentRecord = {
      id: `payment_${Date.now()}`,
      paymentIntentId,
      projectId: paymentIntent.metadata.projectId,
      influencerId: paymentIntent.metadata.influencerId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'completed',
      paymentMethod: paymentMethodId,
      completedAt: new Date().toISOString(),
      stripeChargeId: `ch_${Date.now()}`,
      fees: Math.round(paymentIntent.amount * 0.036), // 3.6%の手数料
      netAmount: paymentIntent.amount - Math.round(paymentIntent.amount * 0.036)
    };
    
    if (!global.paymentHistory) {
      global.paymentHistory = [];
    }
    global.paymentHistory.push(paymentRecord);
    
    // 関係者に通知
    if (paymentIntent.metadata.projectId) {
      io.to(paymentIntent.metadata.influencerId).emit('payment_received', {
        paymentId: paymentRecord.id,
        amount: paymentRecord.amount,
        projectId: paymentRecord.projectId
      });
    }
    
    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      },
      paymentRecord
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// 支払い履歴取得
app.get('/api/payments/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, startDate, endDate } = req.query;
    
    const paymentHistory = global.paymentHistory || [];
    let filteredPayments = paymentHistory;
    
    // ユーザーの役割に基づいてフィルタリング
    if (role === 'INFLUENCER') {
      filteredPayments = filteredPayments.filter(payment => 
        payment.influencerId === userId
      );
    } else if (role === 'CLIENT') {
      // 企業の場合は、自分のプロジェクトの支払いを取得
      const userProjects = await prisma.project.findMany({
        where: { clientId: userId },
        select: { id: true }
      });
      const projectIds = userProjects.map(p => p.id);
      filteredPayments = filteredPayments.filter(payment => 
        projectIds.includes(payment.projectId)
      );
    }
    
    // 日付範囲でフィルタリング
    if (startDate && endDate) {
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.completedAt);
        return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
      });
    }
    
    // 統計情報を計算
    const stats = {
      totalAmount: filteredPayments.reduce((sum, payment) => sum + payment.amount, 0),
      totalFees: filteredPayments.reduce((sum, payment) => sum + payment.fees, 0),
      totalNetAmount: filteredPayments.reduce((sum, payment) => sum + payment.netAmount, 0),
      transactionCount: filteredPayments.length,
      averageAmount: filteredPayments.length > 0 ? 
        filteredPayments.reduce((sum, payment) => sum + payment.amount, 0) / filteredPayments.length : 0
    };
    
    res.json({
      payments: filteredPayments.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
      stats,
      userId,
      role
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

// 支払い詳細取得
app.get('/api/payments/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const paymentHistory = global.paymentHistory || [];
    const payment = paymentHistory.find(p => p.id === paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // プロジェクト情報を取得
    const project = await prisma.project.findUnique({
      where: { id: payment.projectId },
      include: {
        client: {
          include: { profile: true }
        }
      }
    });
    
    // インフルエンサー情報を取得
    const influencer = await prisma.user.findUnique({
      where: { id: payment.influencerId },
      include: { profile: true }
    });
    
    const paymentDetails = {
      ...payment,
      project: project ? {
        id: project.id,
        title: project.title,
        client: {
          id: project.client.id,
          name: project.client.profile?.displayName || project.client.email
        }
      } : null,
      influencer: influencer ? {
        id: influencer.id,
        name: influencer.profile?.displayName || influencer.email
      } : null
    };
    
    res.json(paymentDetails);
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ error: 'Failed to get payment details' });
  }
});

// 請求書生成
app.post('/api/payments/invoice', async (req, res) => {
  try {
    const { paymentId, billingAddress, items } = req.body;
    
    const paymentHistory = global.paymentHistory || [];
    const payment = paymentHistory.find(p => p.id === paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const invoice = {
      id: `inv_${Date.now()}`,
      paymentId,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'paid',
      billingAddress,
      items: items || [{
        description: 'インフルエンサーマーケティングサービス',
        quantity: 1,
        unitPrice: payment.amount,
        totalPrice: payment.amount
      }],
      subtotal: payment.amount,
      tax: Math.round(payment.amount * 0.1), // 10%の税金
      total: payment.amount + Math.round(payment.amount * 0.1),
      currency: payment.currency
    };
    
    if (!global.invoices) {
      global.invoices = [];
    }
    global.invoices.push(invoice);
    
    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// 返金処理
app.post('/api/payments/refund', async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    
    const paymentHistory = global.paymentHistory || [];
    const payment = paymentHistory.find(p => p.id === paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Cannot refund non-completed payment' });
    }
    
    // 実際のStripe実装
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const refund = await stripe.refunds.create({
    //   charge: payment.stripeChargeId,
    //   amount: amount * 100,
    //   reason: reason || 'requested_by_customer'
    // });
    
    // モック実装
    const refund = {
      id: `re_${Date.now()}`,
      paymentId,
      amount: amount || payment.amount,
      reason: reason || 'requested_by_customer',
      status: 'succeeded',
      createdAt: new Date().toISOString(),
      stripeRefundId: `re_${Date.now()}_stripe`
    };
    
    // 返金記録を保存
    if (!global.refunds) {
      global.refunds = [];
    }
    global.refunds.push(refund);
    
    // 元の支払い記録を更新
    payment.refundAmount = (payment.refundAmount || 0) + refund.amount;
    payment.refundStatus = payment.refundAmount >= payment.amount ? 'fully_refunded' : 'partially_refunded';
    
    // 関係者に通知
    io.to(payment.influencerId).emit('refund_processed', {
      refundId: refund.id,
      amount: refund.amount,
      paymentId: payment.id
    });
    
    res.json({
      success: true,
      refund,
      message: `¥${refund.amount.toLocaleString()}の返金処理が完了しました`
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// 支払い方法管理
app.post('/api/payments/payment-methods', async (req, res) => {
  try {
    const { userId, type, cardDetails } = req.body;
    
    // 実際のStripe実装
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentMethod = await stripe.paymentMethods.create({
    //   type: 'card',
    //   card: cardDetails
    // });
    
    // モック実装
    const paymentMethod = {
      id: `pm_${Date.now()}`,
      userId,
      type,
      card: {
        brand: cardDetails.brand || 'visa',
        last4: cardDetails.last4 || '4242',
        expMonth: cardDetails.expMonth || 12,
        expYear: cardDetails.expYear || 2025
      },
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    
    if (!global.paymentMethods) {
      global.paymentMethods = [];
    }
    global.paymentMethods.push(paymentMethod);
    
    res.json({
      success: true,
      paymentMethod
    });
  } catch (error) {
    console.error('Save payment method error:', error);
    res.status(500).json({ error: 'Failed to save payment method' });
  }
});

// 支払い方法取得
app.get('/api/payments/payment-methods/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const paymentMethods = global.paymentMethods || [];
    const userPaymentMethods = paymentMethods.filter(pm => pm.userId === userId);
    
    res.json({
      paymentMethods: userPaymentMethods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// 顧客生涯価値（LTV）分析
app.get('/api/revenue/ltv-analysis', async (req, res) => {
  try {
    const { customerId, projectId } = req.query;
    
    // 顧客の取引履歴を分析
    const customerTransactions = global.revenueDatabase || [];
    const customerLeads = global.leadDatabase || [];
    
    const ltvAnalysis = {
      customerId,
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
      firstPurchaseDate: null,
      lastPurchaseDate: null,
      customerLifespan: 0, // 日数
      predictedLTV: 0,
      riskScore: 0, // 0-100, 離脱リスク
      recommendedActions: []
    };
    
    // 顧客固有の分析（実際のシステムではcustomerIdで絞り込み）
    const relevantTransactions = customerTransactions.filter(trans => 
      trans.projectId === projectId
    );
    
    if (relevantTransactions.length > 0) {
      ltvAnalysis.totalRevenue = relevantTransactions.reduce((sum, trans) => sum + trans.revenue, 0);
      ltvAnalysis.totalTransactions = relevantTransactions.length;
      ltvAnalysis.averageOrderValue = ltvAnalysis.totalRevenue / ltvAnalysis.totalTransactions;
      
      const dates = relevantTransactions.map(trans => new Date(trans.createdAt)).sort();
      ltvAnalysis.firstPurchaseDate = dates[0];
      ltvAnalysis.lastPurchaseDate = dates[dates.length - 1];
      
      const lifespanMs = ltvAnalysis.lastPurchaseDate - ltvAnalysis.firstPurchaseDate;
      ltvAnalysis.customerLifespan = Math.floor(lifespanMs / (1000 * 60 * 60 * 24));
      
      // LTV予測（簡易版）
      const monthlyRevenue = ltvAnalysis.customerLifespan > 0 ? 
        ltvAnalysis.totalRevenue / (ltvAnalysis.customerLifespan / 30) : ltvAnalysis.totalRevenue;
      ltvAnalysis.predictedLTV = monthlyRevenue * 12; // 1年間の予測
      
      // リスクスコア計算
      const daysSinceLastPurchase = (Date.now() - ltvAnalysis.lastPurchaseDate) / (1000 * 60 * 60 * 24);
      ltvAnalysis.riskScore = Math.min(100, (daysSinceLastPurchase / 30) * 25); // 30日で25%のリスク
      
      // 推奨アクション
      if (ltvAnalysis.riskScore > 50) {
        ltvAnalysis.recommendedActions.push('リテンション キャンペーンの実施');
      }
      if (ltvAnalysis.averageOrderValue < 5000) {
        ltvAnalysis.recommendedActions.push('アップセル・クロスセル戦略の実施');
      }
      if (ltvAnalysis.totalTransactions < 3) {
        ltvAnalysis.recommendedActions.push('リピート購入促進キャンペーン');
      }
    }
    
    res.json(ltvAnalysis);
  } catch (error) {
    console.error('LTV analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze customer LTV' });
  }
});

// A/Bテスト分析
app.post('/api/analytics/ab-test', async (req, res) => {
  try {
    const { projectId, testType, variantA, variantB } = req.body;
    
    // A/Bテスト結果の分析
    const abTestResults = {
      testId: `ab_${Date.now()}`,
      projectId,
      testType,
      variants: {
        A: {
          ...variantA,
          reach: Math.floor(Math.random() * 25000) + 5000,
          engagement: Math.floor(Math.random() * 2500) + 500,
          clicks: Math.floor(Math.random() * 500) + 100,
          conversions: Math.floor(Math.random() * 50) + 10,
          engagementRate: 0,
          conversionRate: 0
        },
        B: {
          ...variantB,
          reach: Math.floor(Math.random() * 25000) + 5000,
          engagement: Math.floor(Math.random() * 2500) + 500,
          clicks: Math.floor(Math.random() * 500) + 100,
          conversions: Math.floor(Math.random() * 50) + 10,
          engagementRate: 0,
          conversionRate: 0
        }
      },
      statisticalSignificance: Math.random() > 0.3,
      confidenceLevel: Math.random() * 10 + 90,
      recommendation: '',
      duration: '7 days',
      createdAt: new Date().toISOString()
    };

    // 各バリアントの率を計算
    Object.keys(abTestResults.variants).forEach(variant => {
      const v = abTestResults.variants[variant];
      v.engagementRate = v.reach > 0 ? (v.engagement / v.reach) * 100 : 0;
      v.conversionRate = v.clicks > 0 ? (v.conversions / v.clicks) * 100 : 0;
    });

    // 勝者の判定
    const variantAScore = abTestResults.variants.A.engagementRate + abTestResults.variants.A.conversionRate;
    const variantBScore = abTestResults.variants.B.engagementRate + abTestResults.variants.B.conversionRate;
    
    if (variantAScore > variantBScore) {
      abTestResults.winner = 'A';
      abTestResults.recommendation = 'バリアントAの方が総合的に優れています';
    } else if (variantBScore > variantAScore) {
      abTestResults.winner = 'B';
      abTestResults.recommendation = 'バリアントBの方が総合的に優れています';
    } else {
      abTestResults.winner = 'tie';
      abTestResults.recommendation = '統計的に有意な差は見られませんでした';
    }

    res.json(abTestResults);
  } catch (error) {
    console.error('A/B test analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze A/B test' });
  }
});

// トレンドインフルエンサー発見
app.get('/api/trending-influencers', async (req, res) => {
  try {
    const { category, timeframe = '30days' } = req.query;
    
    // 最近のエンゲージメントが高いインフルエンサーを検索
    const trendingInfluencers = await prisma.user.findMany({
      where: {
        role: 'INFLUENCER',
        ...(category && category !== 'ALL' ? {
          profile: {
            categories: {
              has: category
            }
          }
        } : {})
      },
      include: {
        profile: true,
        achievements: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - (timeframe === '7days' ? 7 : 30) * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // トレンドスコア計算
    const trendingWithScores = trendingInfluencers.map(inf => {
      const recentAchievements = inf.achievements;
      const totalEngagement = recentAchievements.reduce((sum, ach) => {
        const metrics = ach.metrics || {};
        return sum + (metrics.likes || 0) + (metrics.shares || 0) + (metrics.comments || 0);
      }, 0);
      
      const growthRate = recentAchievements.length > 1 ? 
        ((recentAchievements[0].metrics?.views || 0) - (recentAchievements[recentAchievements.length - 1].metrics?.views || 0)) / 
        (recentAchievements[recentAchievements.length - 1].metrics?.views || 1) * 100 : 0;
      
      const trendScore = totalEngagement + (growthRate * 100);
      
      return {
        id: inf.id,
        name: inf.profile?.displayName || inf.email,
        category: inf.profile?.categories || [],
        trendScore: Math.round(trendScore),
        totalEngagement,
        growthRate: Math.round(growthRate * 10) / 10,
        recentAchievements: recentAchievements.length,
        avgEngagement: calculateEngagementRate(recentAchievements),
        isRising: growthRate > 10
      };
    });

    // トレンドスコア順でソート
    trendingWithScores.sort((a, b) => b.trendScore - a.trendScore);

    res.json({
      trendingInfluencers: trendingWithScores.slice(0, 20), // 上位20位
      timeframe,
      totalAnalyzed: trendingInfluencers.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trending influencers error:', error);
    res.status(500).json({ error: 'Failed to fetch trending influencers' });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 定期的な期限前日通知チェック（毎日午前9時に実行）
function startScheduleNotificationChecker() {
  const checkInterval = 24 * 60 * 60 * 1000; // 24時間ごと
  
  async function checkAndSendNotifications() {
    try {
      console.log('🔔 期限前日通知チェックを実行中...');
      const response = await fetch(`http://localhost:${PORT}/api/schedule/check-notifications`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 期限前日通知チェック完了: ${result.upcomingMilestones}件のマイルストーン, ${result.notificationsSent}件の通知送信`);
      } else {
        console.error('❌ 期限前日通知チェックエラー:', result.error);
      }
    } catch (error) {
      console.error('❌ 期限前日通知チェック失敗:', error.message);
    }
  }
  
  // 初回実行（5秒後）
  setTimeout(checkAndSendNotifications, 5000);
  
  // 定期実行（毎日）
  setInterval(checkAndSendNotifications, checkInterval);
  
  console.log('🕘 期限前日通知チェッカーを開始しました（24時間間隔）');
}

// サーバー起動
httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`🔔 Socket.io enabled for real-time notifications`);
  console.log(`📅 Schedule management enabled`);
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 期限前日通知チェッカーを開始
    startScheduleNotificationChecker();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});