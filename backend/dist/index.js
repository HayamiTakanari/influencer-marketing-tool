"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cloudinary_1 = require("cloudinary");
const socket_service_1 = require("./services/socket.service");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const influencer_routes_1 = __importDefault(require("./routes/influencer.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const sns_routes_1 = __importDefault(require("./routes/sns.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Setup Socket.io server
const io = (0, socket_service_1.setupSocketServer)(httpServer);
const PORT = process.env.PORT || 5000;
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
// Special handling for Stripe webhooks (raw body)
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
// JSON parsing for all other routes
app.use(express_1.default.json());
app.use(limiter);
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/influencers', influencer_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/sns', sns_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/teams', team_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
