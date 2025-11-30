import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import { v2 as cloudinary } from 'cloudinary';
import { setupSocketServer } from './services/socket.service';
import { generalRateLimit, securityHeaders } from './middleware/security';
import { protectFromCommandInjection, preventSystemCommands } from './middleware/command-injection-protection';

// Sentry configuration (must be imported first)
// import { initializeSentry, setupSentryErrorHandler } from './config/sentry';
// import { 
//   requestTrackingMiddleware, 
//   userContextMiddleware, 
//   apiErrorHandler, 
//   setupGlobalErrorHandlers 
// } from './middleware/error-tracking';
import { requestIdMiddleware } from './middleware/request-id';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import influencerRoutes from './routes/influencer.routes';
import profileRoutes from './routes/profile.routes';
import chatRoutes from './routes/chat.routes';
import paymentRoutes from './routes/payment.routes';
import snsRoutes from './routes/sns.routes';
import projectRoutes from './routes/project.routes';
import teamRoutes from './routes/team.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import achievementRoutes from './routes/achievement.routes';
import servicePricingRoutes from './routes/servicePricing.routes';
import bulkInquiryRoutes from './routes/bulkInquiry.routes';
import scheduleRoutes from './routes/schedule.routes';
import securityRoutes from './routes/security.routes';
import oauthRoutes from './routes/oauth';
import uploadRoutes from './routes/upload.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import tiktokRoutes from './routes/tiktok.routes';
import instagramRoutes from './routes/instagram.routes';
import youtubeRoutes from './routes/youtube.routes';
import twitterRoutes from './routes/twitter.routes';
import ndaRoutes from './routes/nda.routes';
import submissionRoutes from './routes/submission.routes';
// import chapter1Routes from './routes/chapter1-registration.routes';
import tikTokAuthRoutes from './routes/tiktok-auth.routes';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// Initialize Sentry (must be first)
// initializeSentry(app);

// Setup global error handlers
// setupGlobalErrorHandlers();

const httpServer = createServer(app);

// Setup Socket.io server
try {
  const io = setupSocketServer(httpServer);
  console.log('Socket.io server initialized');
} catch (error) {
  console.error('Socket.io initialization error:', error);
}

const PORT = Number(process.env.PORT) || 5002;

// CORS設定 - セキュリティヘッダーより先に適用
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost on any port during development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow configured frontend URL
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Production domains
    if (process.env.NODE_ENV === 'production') {
      const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (productionOrigins.includes(origin)) {
        return callback(null, true);
      }
    }

    callback(null, true); // Allow in development, restrict in production
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// セキュリティミドルウェアの適用
app.use(securityHeaders);

// コマンドインジェクション対策
app.use(protectFromCommandInjection);
app.use(preventSystemCommands);

// Special handling for Stripe webhooks (raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes with size limit
app.use(express.json({ 
  limit: '50mb',
  verify: (req: any, res, buf) => {
    // JSONの構造をチェック
    try {
      const body = buf.toString();
      if (body.length > 1024 * 1024) { // 1MB制限
        throw new Error('Request too large');
      }
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw error;
    }
  }
}));

// URL encoded data parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// レート制限
app.use(generalRateLimit);

// Request ID ミドルウェア（全リクエストに一意のID を付与）
app.use(requestIdMiddleware);

// Request tracking and user context middleware
// app.use(requestTrackingMiddleware);
// app.use(userContextMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sns', snsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/service-pricing', servicePricingRoutes);
app.use('/api/bulk-inquiries', bulkInquiryRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/twitter', twitterRoutes);
app.use('/api/nda', ndaRoutes);
app.use('/api/submissions', submissionRoutes);
// app.use('/api/chapter1', chapter1Routes);
app.use('/api/sns', tikTokAuthRoutes);

app.use('/uploads', express.static('uploads'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Sentry error handler (must be before other error handlers)
// setupSentryErrorHandler(app);

// Custom API error handler
// app.use(apiErrorHandler);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Auth endpoint: http://localhost:${PORT}/api/auth/login`);
}).on('error', (err) => {
  console.error('Server error:', err);
});