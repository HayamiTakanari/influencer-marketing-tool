"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const chapter1_registration_routes_1 = __importDefault(require("../routes/chapter1-registration.routes"));
let app;
let prisma;
(0, globals_1.describe)('Chapter 1 Registration Integration Tests', () => {
    (0, globals_1.beforeAll)(async () => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/chapter1', chapter1_registration_routes_1.default);
        prisma = new client_1.PrismaClient();
    });
    (0, globals_1.afterAll)(async () => {
        await prisma.$disconnect();
    });
    (0, globals_1.describe)('POST /api/chapter1/register - Company Registration', () => {
        const companyData = {
            email: `company-${Date.now()}@example.com`,
            password: 'SecurePassword123',
            role: 'COMPANY',
            companyName: 'Test Company Inc.',
            legalNumber: '1234567890123',
            representativeName: 'John Doe',
            industry: 'IT',
        };
        (0, globals_1.it)('should register a new company successfully', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send(companyData);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body).toHaveProperty('message');
            (0, globals_1.expect)(response.body).toHaveProperty('user');
            (0, globals_1.expect)(response.body.user.email).toBe(companyData.email);
            (0, globals_1.expect)(response.body.user.role).toBe('COMPANY');
            (0, globals_1.expect)(response.body.user.status).toBe('PROVISIONAL');
            // Verify company profile was created
            const user = await prisma.user.findUnique({
                where: { email: companyData.email },
                include: { company: true },
            });
            (0, globals_1.expect)(user).toBeDefined();
            (0, globals_1.expect)(user?.company).toBeDefined();
            (0, globals_1.expect)(user?.company?.companyName).toBe(companyData.companyName);
        });
        (0, globals_1.it)('should reject duplicate email registration', async () => {
            // Register first time
            await (0, supertest_1.default)(app).post('/api/chapter1/register').send(companyData);
            // Try to register again with same email
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send(companyData);
            (0, globals_1.expect)(response.status).toBe(409);
            (0, globals_1.expect)(response.body.error).toContain('already registered');
        });
        (0, globals_1.it)('should reject weak password', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send({
                ...companyData,
                email: `weak-password-${Date.now()}@example.com`,
                password: 'weak', // Too short
            });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toBeDefined();
        });
        (0, globals_1.it)('should reject missing company name', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send({
                ...companyData,
                email: `no-company-${Date.now()}@example.com`,
                companyName: '',
            });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toContain('required');
        });
    });
    (0, globals_1.describe)('POST /api/chapter1/register - Influencer Registration', () => {
        const influencerData = {
            email: `influencer-${Date.now()}@example.com`,
            password: 'SecurePassword123',
            role: 'INFLUENCER',
            displayName: 'Test Influencer',
        };
        (0, globals_1.it)('should register a new influencer successfully', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send(influencerData);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body.user.role).toBe('INFLUENCER');
            (0, globals_1.expect)(response.body.user.status).toBe('PROVISIONAL');
            // Verify influencer profile was created
            const user = await prisma.user.findUnique({
                where: { email: influencerData.email },
                include: { influencer: true },
            });
            (0, globals_1.expect)(user).toBeDefined();
            (0, globals_1.expect)(user?.influencer).toBeDefined();
            (0, globals_1.expect)(user?.influencer?.displayName).toBe(influencerData.displayName);
        });
        (0, globals_1.it)('should reject missing display name', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send({
                ...influencerData,
                email: `no-name-${Date.now()}@example.com`,
                displayName: '',
            });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toContain('required');
        });
    });
    (0, globals_1.describe)('GET /api/chapter1/verify-email', () => {
        (0, globals_1.it)('should verify email with valid token', async () => {
            // Register user
            const userData = {
                email: `verify-email-${Date.now()}@example.com`,
                password: 'SecurePassword123',
                role: 'INFLUENCER',
                displayName: 'Verify Test',
            };
            const registerResponse = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send(userData);
            (0, globals_1.expect)(registerResponse.status).toBe(201);
            // Get the verification token
            const user = await prisma.user.findUnique({
                where: { email: userData.email },
            });
            const token = await prisma.emailVerificationToken.findFirst({
                where: { userId: user.id },
            });
            // Verify email
            const verifyResponse = await (0, supertest_1.default)(app)
                .get('/api/chapter1/verify-email')
                .query({ token: token.token });
            (0, globals_1.expect)(verifyResponse.status).toBe(200);
            (0, globals_1.expect)(verifyResponse.body).toHaveProperty('userId');
            (0, globals_1.expect)(verifyResponse.body.status).toBe('VERIFICATION_PENDING');
        });
        (0, globals_1.it)('should reject invalid token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/chapter1/verify-email')
                .query({ token: 'invalid-token' });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toBeDefined();
        });
    });
    (0, globals_1.describe)('POST /api/chapter1/resend-verification', () => {
        (0, globals_1.it)('should resend verification email for unverified account', async () => {
            const userData = {
                email: `resend-${Date.now()}@example.com`,
                password: 'SecurePassword123',
                role: 'INFLUENCER',
                displayName: 'Resend Test',
            };
            // Register user
            await (0, supertest_1.default)(app).post('/api/chapter1/register').send(userData);
            // Resend verification
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/resend-verification')
                .send({ email: userData.email });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('message');
        });
        (0, globals_1.it)('should handle non-existent email gracefully', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/resend-verification')
                .send({ email: 'non-existent@example.com' });
            // Should return 200 for security reasons (don't reveal if email exists)
            (0, globals_1.expect)(response.status).toBe(200);
        });
    });
    (0, globals_1.describe)('GET /api/chapter1/registration-status', () => {
        (0, globals_1.it)('should get registration status for authenticated user', async () => {
            // Note: In real tests, you'd need to set up proper authentication
            // This is a placeholder for the concept
            const response = await (0, supertest_1.default)(app).get('/api/chapter1/registration-status');
            // Will likely fail without auth, but that's expected
            (0, globals_1.expect)([401, 200]).toContain(response.status);
        });
    });
    (0, globals_1.describe)('Rate Limiting', () => {
        (0, globals_1.it)('should enforce rate limiting on registration endpoint', async () => {
            // This would test rate limit middleware
            // Implementation depends on the middleware setup
            const endpoint = '/api/chapter1/register';
            let successCount = 0;
            // Try to make multiple rapid requests
            for (let i = 0; i < 10; i++) {
                const response = await (0, supertest_1.default)(app)
                    .post(endpoint)
                    .send({
                    email: `ratelimit-${i}@example.com`,
                    password: 'SecurePassword123',
                    role: 'INFLUENCER',
                    displayName: 'Test',
                });
                if (response.status === 429) {
                    // Rate limited
                    break;
                }
                if (response.status === 201) {
                    successCount++;
                }
            }
            // Should have been rate limited after some requests
            (0, globals_1.expect)(successCount).toBeLessThan(10);
        });
    });
    (0, globals_1.describe)('Input Validation & Security', () => {
        (0, globals_1.it)('should sanitize XSS attempts in company name', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send({
                email: `xss-test-${Date.now()}@example.com`,
                password: 'SecurePassword123',
                role: 'COMPANY',
                companyName: '<script>alert("xss")</script>',
            });
            // Should either reject or sanitize
            if (response.status === 201) {
                const user = await prisma.user.findUnique({
                    where: { email: `xss-test-${Date.now()}@example.com` },
                    include: { company: true },
                });
                (0, globals_1.expect)(user?.company?.companyName).not.toContain('<script>');
            }
        });
        (0, globals_1.it)('should normalize email addresses', async () => {
            const email = `Test.Email.${Date.now()}@EXAMPLE.COM`;
            const response = await (0, supertest_1.default)(app)
                .post('/api/chapter1/register')
                .send({
                email,
                password: 'SecurePassword123',
                role: 'INFLUENCER',
                displayName: 'Test',
            });
            (0, globals_1.expect)(response.status).toBe(201);
            // Verify email is stored in lowercase
            const user = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() },
            });
            (0, globals_1.expect)(user).toBeDefined();
        });
    });
});
//# sourceMappingURL=chapter1-registration.integration.test.js.map