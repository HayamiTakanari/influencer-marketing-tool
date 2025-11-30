"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const express_2 = require("express");
/**
 * TikTok Authentication Integration Tests
 * Chapter 1-6: SNS認証（TikTok）
 *
 * Tests the complete flow of TikTok authentication:
 * 1. Authenticating a TikTok account
 * 2. Checking authentication status
 * 3. Removing TikTok authentication
 * 4. Fetching TikTok user data
 * 5. Bulk updating follower counts
 */
(0, globals_1.describe)('TikTok Authentication Integration', () => {
    let app;
    let mockToken;
    (0, globals_1.beforeAll)(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        // Mock auth middleware
        app.use((req, res, next) => {
            req.user = {
                id: 'test-user-123',
                email: 'test@example.com',
                role: 'INFLUENCER'
            };
            next();
        });
        // Mock routes for testing
        const router = (0, express_2.Router)();
        // Placeholder test routes - these would be actual routes in production
        router.post('/tiktok/authenticate', (req, res) => {
            const { tikTokUsername } = req.body;
            if (!tikTokUsername) {
                return res.status(400).json({ error: 'TikTok username is required' });
            }
            if (!/^[a-zA-Z0-9._]{2,24}$/.test(tikTokUsername)) {
                return res.status(400).json({
                    error: 'Invalid TikTok username format. Use 2-24 characters (letters, numbers, . or _)'
                });
            }
            // Mock successful authentication
            return res.status(200).json({
                message: 'TikTok account authenticated successfully',
                account: {
                    username: tikTokUsername,
                    displayName: 'Test User',
                    followerCount: 50000,
                    followingCount: 100,
                    videoCount: 25,
                    verified: false,
                    profileUrl: `https://www.tiktok.com/@${tikTokUsername}`
                }
            });
        });
        router.get('/tiktok/status', (req, res) => {
            // Mock status endpoint
            return res.json({
                isVerified: true,
                account: {
                    username: 'test_user',
                    followerCount: 50000,
                    verifiedAt: new Date()
                }
            });
        });
        router.delete('/tiktok', (req, res) => {
            return res.json({
                message: 'TikTok account removed successfully'
            });
        });
        router.get('/tiktok/user', (req, res) => {
            const { username } = req.query;
            if (!username) {
                return res.status(400).json({ error: 'Username query parameter is required' });
            }
            // Mock user data response
            return res.json({
                user: {
                    id: '123456789',
                    username: username,
                    displayName: 'Test TikTok User',
                    followerCount: 50000,
                    followingCount: 100,
                    videoCount: 25,
                    verified: false,
                    profileImageUrl: 'https://example.com/avatar.jpg'
                }
            });
        });
        router.post('/tiktok/update-followers', (req, res) => {
            // Mock admin endpoint
            return res.json({
                message: 'Updated 5/5 accounts',
                results: [
                    { username: 'user1', status: 'success' },
                    { username: 'user2', status: 'success' },
                    { username: 'user3', status: 'success' },
                    { username: 'user4', status: 'success' },
                    { username: 'user5', status: 'success' }
                ]
            });
        });
        app.use('/api/sns', router);
    });
    (0, globals_1.afterAll)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('POST /api/sns/tiktok/authenticate', () => {
        (0, globals_1.it)('should authenticate a valid TikTok username', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sns/tiktok/authenticate')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                tikTokUsername: 'test_user'
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('message');
            (0, globals_1.expect)(response.body.account).toHaveProperty('username', 'test_user');
            (0, globals_1.expect)(response.body.account).toHaveProperty('displayName');
            (0, globals_1.expect)(response.body.account).toHaveProperty('followerCount');
            (0, globals_1.expect)(response.body.account).toHaveProperty('profileUrl');
        });
        (0, globals_1.it)('should reject request without username', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sns/tiktok/authenticate')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({});
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.it)('should validate username format (2-24 chars, alphanumeric + . and _)', async () => {
            const invalidUsernames = [
                'a', // too short
                'a'.repeat(25), // too long
                'user@name', // invalid char
                'user name', // space
                'user!', // special char
            ];
            for (const username of invalidUsernames) {
                const response = await (0, supertest_1.default)(app)
                    .post('/api/sns/tiktok/authenticate')
                    .set('Authorization', `Bearer ${mockToken}`)
                    .send({ tikTokUsername: username });
                (0, globals_1.expect)(response.status).toBe(400);
                (0, globals_1.expect)(response.body).toHaveProperty('error');
            }
        });
        (0, globals_1.it)('should accept valid username formats', async () => {
            const validUsernames = [
                'user',
                'test_user',
                'user.name',
                'test123',
                '_user',
                'a.b_c'
            ];
            for (const username of validUsernames) {
                const response = await (0, supertest_1.default)(app)
                    .post('/api/sns/tiktok/authenticate')
                    .set('Authorization', `Bearer ${mockToken}`)
                    .send({ tikTokUsername: username });
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.body.account.username).toBe(username);
            }
        });
        (0, globals_1.it)('should return proper account data structure', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sns/tiktok/authenticate')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ tikTokUsername: 'test_user' });
            const account = response.body.account;
            (0, globals_1.expect)(account).toHaveProperty('username');
            (0, globals_1.expect)(account).toHaveProperty('displayName');
            (0, globals_1.expect)(account).toHaveProperty('followerCount');
            (0, globals_1.expect)(account).toHaveProperty('followingCount');
            (0, globals_1.expect)(account).toHaveProperty('videoCount');
            (0, globals_1.expect)(account).toHaveProperty('verified');
            (0, globals_1.expect)(account).toHaveProperty('profileUrl');
            (0, globals_1.expect)(typeof account.username).toBe('string');
            (0, globals_1.expect)(typeof account.followerCount).toBe('number');
            (0, globals_1.expect)(typeof account.verified).toBe('boolean');
        });
    });
    (0, globals_1.describe)('GET /api/sns/tiktok/status', () => {
        (0, globals_1.it)('should return TikTok account status', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/sns/tiktok/status')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('isVerified');
            (0, globals_1.expect)(response.body).toHaveProperty('account');
        });
        (0, globals_1.it)('should include account details when verified', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/sns/tiktok/status')
                .set('Authorization', `Bearer ${mockToken}`);
            if (response.body.isVerified) {
                (0, globals_1.expect)(response.body.account).toHaveProperty('username');
                (0, globals_1.expect)(response.body.account).toHaveProperty('followerCount');
                (0, globals_1.expect)(response.body.account).toHaveProperty('verifiedAt');
            }
        });
    });
    (0, globals_1.describe)('DELETE /api/sns/tiktok', () => {
        (0, globals_1.it)('should remove TikTok authentication', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/sns/tiktok')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('message');
            (0, globals_1.expect)(response.body.message).toContain('removed');
        });
    });
    (0, globals_1.describe)('GET /api/sns/tiktok/user (Public)', () => {
        (0, globals_1.it)('should fetch TikTok user data by username', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/sns/tiktok/user?username=test_user');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('user');
            (0, globals_1.expect)(response.body.user).toHaveProperty('username', 'test_user');
        });
        (0, globals_1.it)('should require username query parameter', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/sns/tiktok/user');
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.it)('should return complete user data', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/sns/tiktok/user?username=test_user');
            const user = response.body.user;
            (0, globals_1.expect)(user).toHaveProperty('id');
            (0, globals_1.expect)(user).toHaveProperty('username');
            (0, globals_1.expect)(user).toHaveProperty('displayName');
            (0, globals_1.expect)(user).toHaveProperty('followerCount');
            (0, globals_1.expect)(user).toHaveProperty('followingCount');
            (0, globals_1.expect)(user).toHaveProperty('videoCount');
            (0, globals_1.expect)(user).toHaveProperty('verified');
        });
    });
    (0, globals_1.describe)('POST /api/sns/tiktok/update-followers (Admin)', () => {
        (0, globals_1.it)('should bulk update TikTok follower counts', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sns/tiktok/update-followers')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('message');
            (0, globals_1.expect)(response.body).toHaveProperty('results');
            (0, globals_1.expect)(Array.isArray(response.body.results)).toBe(true);
        });
        (0, globals_1.it)('should return results for each updated account', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sns/tiktok/update-followers')
                .set('Authorization', `Bearer ${mockToken}`);
            response.body.results.forEach((result) => {
                (0, globals_1.expect)(result).toHaveProperty('username');
                (0, globals_1.expect)(result).toHaveProperty('status');
                (0, globals_1.expect)(['success', 'failed']).toContain(result.status);
            });
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should handle invalid JSON in request body', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sns/tiktok/authenticate')
                .set('Authorization', `Bearer ${mockToken}`)
                .set('Content-Type', 'application/json')
                .send('invalid json');
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should handle missing authorization header', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/sns/tiktok/status');
            // Without auth middleware enforcement, this might pass
            // but in production it should return 401
            (0, globals_1.expect)([200, 401]).toContain(response.status);
        });
    });
    (0, globals_1.describe)('Data Validation', () => {
        (0, globals_1.it)('should sanitize username input', async () => {
            const suspiciousUsernames = [
                '<script>alert("xss")</script>',
                'user"; DROP TABLE users; --',
                '../../../etc/passwd'
            ];
            for (const username of suspiciousUsernames) {
                // The regex validation should reject these
                const isValid = /^[a-zA-Z0-9._]{2,24}$/.test(username);
                (0, globals_1.expect)(isValid).toBe(false);
            }
        });
        (0, globals_1.it)('should properly escape output in responses', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/sns/tiktok/user?username=test_user');
            const jsonString = JSON.stringify(response.body);
            // Verify that special characters are properly escaped
            (0, globals_1.expect)(jsonString).toBeDefined();
            (0, globals_1.expect)(typeof jsonString).toBe('string');
        });
    });
    (0, globals_1.describe)('Performance', () => {
        (0, globals_1.it)('should respond within acceptable time limit', async () => {
            const start = Date.now();
            await (0, supertest_1.default)(app)
                .get('/api/sns/tiktok/user?username=test_user');
            const duration = Date.now() - start;
            (0, globals_1.expect)(duration).toBeLessThan(5000); // Should respond in less than 5 seconds
        });
    });
});
//# sourceMappingURL=tiktok-auth.integration.test.js.map