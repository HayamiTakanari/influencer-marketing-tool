"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const cloudinary_1 = require("cloudinary");
const socket_service_1 = require("./services/socket.service");
const security_1 = require("./middleware/security");
const command_injection_protection_1 = require("./middleware/command-injection-protection");
// Sentry configuration (must be imported first)
// import { initializeSentry, setupSentryErrorHandler } from './config/sentry';
// import { 
//   requestTrackingMiddleware, 
//   userContextMiddleware, 
//   apiErrorHandler, 
//   setupGlobalErrorHandlers 
// } from './middleware/error-tracking';
const request_id_1 = require("./middleware/request-id");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const influencer_routes_1 = __importDefault(require("./routes/influencer.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const sns_routes_1 = __importDefault(require("./routes/sns.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const achievement_routes_1 = __importDefault(require("./routes/achievement.routes"));
const servicePricing_routes_1 = __importDefault(require("./routes/servicePricing.routes"));
const bulkInquiry_routes_1 = __importDefault(require("./routes/bulkInquiry.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const security_routes_1 = __importDefault(require("./routes/security.routes"));
const oauth_1 = __importDefault(require("./routes/oauth"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const tiktok_routes_1 = __importDefault(require("./routes/tiktok.routes"));
const instagram_routes_1 = __importDefault(require("./routes/instagram.routes"));
const youtube_routes_1 = __importDefault(require("./routes/youtube.routes"));
const twitter_routes_1 = __importDefault(require("./routes/twitter.routes"));
const nda_routes_1 = __importDefault(require("./routes/nda.routes"));
const submission_routes_1 = __importDefault(require("./routes/submission.routes"));
const chapter1_registration_routes_1 = __importDefault(require("./routes/chapter1-registration.routes"));
const tiktok_auth_routes_1 = __importDefault(require("./routes/tiktok-auth.routes"));
const watchlist_routes_1 = __importDefault(require("./routes/watchlist.routes"));
const favorites_routes_1 = __importDefault(require("./routes/favorites.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const contract_routes_1 = __importDefault(require("./routes/contract.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const scout_routes_1 = __importDefault(require("./routes/scout.routes"));
const performance_routes_1 = __importDefault(require("./routes/performance.routes"));
const security_monitoring_routes_1 = __importDefault(require("./routes/security-monitoring.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const admin_management_routes_1 = __importDefault(require("./routes/admin-management.routes"));
const legal_compliance_routes_1 = __importDefault(require("./routes/legal-compliance.routes"));
const faq_routes_1 = __importDefault(require("./routes/faq.routes"));
const company_profile_routes_1 = __importDefault(require("./routes/company-profile.routes"));
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const app = (0, express_1.default)();
// Initialize Sentry (must be first)
// initializeSentry(app);
// Setup global error handlers
// setupGlobalErrorHandlers();
const httpServer = (0, http_1.createServer)(app);
// Setup Socket.io server
try {
    const io = (0, socket_service_1.setupSocketServer)(httpServer);
    console.log('Socket.io server initialized');
}
catch (error) {
    console.error('Socket.io initialization error:', error);
}
const PORT = Number(process.env.PORT) || 5002;
// CORS設定 - セキュリティヘッダーより先に適用
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
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
app.use(security_1.securityHeaders);
// コマンドインジェクション対策
app.use(command_injection_protection_1.protectFromCommandInjection);
app.use(command_injection_protection_1.preventSystemCommands);
// Special handling for Stripe webhooks (raw body)
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
// JSON parsing for all other routes with size limit
app.use(express_1.default.json({
    limit: '50mb',
    verify: (req, res, buf) => {
        // JSONの構造をチェック
        try {
            const body = buf.toString();
            if (body.length > 1024 * 1024) { // 1MB制限
                throw new Error('Request too large');
            }
        }
        catch (error) {
            console.error('JSON parsing error:', error);
            throw error;
        }
    }
}));
// URL encoded data parsing
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// レート制限
app.use(security_1.generalRateLimit);
// Request ID ミドルウェア（全リクエストに一意のID を付与）
app.use(request_id_1.requestIdMiddleware);
// Request tracking and user context middleware
// app.use(requestTrackingMiddleware);
// app.use(userContextMiddleware);
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/influencers', influencer_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/sns', sns_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/teams', team_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/achievements', achievement_routes_1.default);
app.use('/api/service-pricing', servicePricing_routes_1.default);
app.use('/api/bulk-inquiries', bulkInquiry_routes_1.default);
app.use('/api/schedules', schedule_routes_1.default);
app.use('/api/security', security_routes_1.default);
app.use('/api/oauth', oauth_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/tiktok', tiktok_routes_1.default);
app.use('/api/instagram', instagram_routes_1.default);
app.use('/api/youtube', youtube_routes_1.default);
app.use('/api/twitter', twitter_routes_1.default);
app.use('/api/nda', nda_routes_1.default);
app.use('/api/submissions', submission_routes_1.default);
app.use('/api/chapter1', chapter1_registration_routes_1.default);
app.use('/api/sns', tiktok_auth_routes_1.default);
app.use('/api/watchlist', watchlist_routes_1.default);
app.use('/api/favorites', favorites_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/contracts', contract_routes_1.default);
app.use('/api/invoices', invoice_routes_1.default);
app.use('/api/scouts', scout_routes_1.default);
app.use('/api/performance', performance_routes_1.default);
app.use('/api/security', security_monitoring_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/admin-management', admin_management_routes_1.default);
app.use('/api/legal', legal_compliance_routes_1.default);
app.use('/api/faqs', faq_routes_1.default);
app.use('/api/company-profile', company_profile_routes_1.default);
app.use('/uploads', express_1.default.static('uploads'));
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
//# sourceMappingURL=index.js.map