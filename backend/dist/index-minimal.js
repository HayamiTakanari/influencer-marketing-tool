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
const socket_service_1 = require("./services/socket.service");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const influencer_routes_1 = __importDefault(require("./routes/influencer.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
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
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for local development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Special handling for Stripe webhooks (raw body)
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
// JSON parsing for all other routes
app.use(express_1.default.json());
app.use(limiter);
// Core routes only
app.use('/api/auth', auth_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/influencers', influencer_routes_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Full backend is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Auth endpoint: http://localhost:${PORT}/api/auth/login`);
}).on('error', (err) => {
    console.error('Server error:', err);
});
//# sourceMappingURL=index-minimal.js.map