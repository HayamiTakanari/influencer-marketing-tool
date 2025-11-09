"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
var http_1 = require("http");
var cloudinary_1 = require("cloudinary");
var socket_service_1 = require("./services/socket.service");
var security_1 = require("./middleware/security");
var command_injection_protection_1 = require("./middleware/command-injection-protection");
// Sentry configuration (must be imported first)
// import { initializeSentry, setupSentryErrorHandler } from './config/sentry';
// import { 
//   requestTrackingMiddleware, 
//   userContextMiddleware, 
//   apiErrorHandler, 
//   setupGlobalErrorHandlers 
// } from './middleware/error-tracking';
var auth_routes_1 = require("./routes/auth.routes");
var dashboard_routes_1 = require("./routes/dashboard.routes");
var influencer_routes_1 = require("./routes/influencer.routes");
var profile_routes_1 = require("./routes/profile.routes");
var chat_routes_1 = require("./routes/chat.routes");
var payment_routes_1 = require("./routes/payment.routes");
var sns_routes_1 = require("./routes/sns.routes");
var project_routes_1 = require("./routes/project.routes");
var team_routes_1 = require("./routes/team.routes");
var notification_routes_1 = require("./routes/notification.routes");
var analytics_routes_1 = require("./routes/analytics.routes");
var achievement_routes_1 = require("./routes/achievement.routes");
var servicePricing_routes_1 = require("./routes/servicePricing.routes");
var bulkInquiry_routes_1 = require("./routes/bulkInquiry.routes");
var schedule_routes_1 = require("./routes/schedule.routes");
var security_routes_1 = require("./routes/security.routes");
var oauth_1 = require("./routes/oauth");
var upload_routes_1 = require("./routes/upload.routes");
var ai_routes_1 = require("./routes/ai.routes");
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
var app = (0, express_1.default)();
// Initialize Sentry (must be first)
// initializeSentry(app);
// Setup global error handlers
// setupGlobalErrorHandlers();
var httpServer = (0, http_1.createServer)(app);
// Setup Socket.io server
try {
    var io = (0, socket_service_1.setupSocketServer)(httpServer);
    console.log('Socket.io server initialized');
}
catch (error) {
    console.error('Socket.io initialization error:', error);
}
var PORT = Number(process.env.PORT) || 5002;
// CORS設定 - セキュリティヘッダーより先に適用
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    verify: function (req, res, buf) {
        // JSONの構造をチェック
        try {
            var body = buf.toString();
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
app.use('/uploads', express_1.default.static('uploads'));
app.get('/health', function (_req, res) {
    res.json({ status: 'ok' });
});
// Sentry error handler (must be before other error handlers)
// setupSentryErrorHandler(app);
// Custom API error handler
// app.use(apiErrorHandler);
httpServer.listen(PORT, '0.0.0.0', function () {
    console.log("Server is running on port ".concat(PORT));
    console.log("Health check: http://localhost:".concat(PORT, "/health"));
    console.log("Auth endpoint: http://localhost:".concat(PORT, "/api/auth/login"));
}).on('error', function (err) {
    console.error('Server error:', err);
});
