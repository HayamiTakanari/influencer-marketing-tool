"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const client_1 = require("@prisma/client");
const email_verification_service_1 = require("../services/email-verification.service");
// Mock Nodemailer
globals_1.jest.mock('nodemailer', () => ({
    createTransport: globals_1.jest.fn(() => ({
        sendMail: globals_1.jest.fn().mockResolvedValue({ response: '250 Message accepted' }),
    })),
}));
(0, globals_1.describe)('Email Verification Service', () => {
    let prisma;
    let testUserId;
    (0, globals_1.beforeAll)(async () => {
        prisma = new client_1.PrismaClient();
        // Create a test user
        const testUser = await prisma.user.create({
            data: {
                email: 'test-verification@example.com',
                password: 'hashedPassword123',
                role: 'INFLUENCER',
                status: 'PROVISIONAL',
            },
        });
        testUserId = testUser.id;
    });
    (0, globals_1.afterAll)(async () => {
        // Clean up
        await prisma.emailVerificationToken.deleteMany({
            where: { userId: testUserId },
        });
        await prisma.verificationRecord.deleteMany({
            where: { userId: testUserId },
        });
        await prisma.user.delete({
            where: { id: testUserId },
        });
        await prisma.$disconnect();
    });
    (0, globals_1.describe)('sendEmailVerification', () => {
        (0, globals_1.it)('should create email verification token', async () => {
            await (0, email_verification_service_1.sendEmailVerification)(testUserId, 'test-verification@example.com');
            const token = await prisma.emailVerificationToken.findFirst({
                where: { userId: testUserId },
            });
            (0, globals_1.expect)(token).toBeDefined();
            (0, globals_1.expect)(token?.userId).toBe(testUserId);
            (0, globals_1.expect)(token?.usedAt).toBeNull();
            (0, globals_1.expect)(token?.expiresAt).toBeGreaterThan(new Date());
        });
        (0, globals_1.it)('should set token expiration to 24 hours', async () => {
            await (0, email_verification_service_1.sendEmailVerification)(testUserId, 'test-verification@example.com');
            const token = await prisma.emailVerificationToken.findFirst({
                where: { userId: testUserId },
                orderBy: { createdAt: 'desc' },
            });
            const now = new Date();
            const expectedExpiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            (0, globals_1.expect)(token?.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiration.getTime() + 1000);
            (0, globals_1.expect)(token?.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiration.getTime() - 5000);
        });
    });
    (0, globals_1.describe)('verifyEmailToken', () => {
        (0, globals_1.it)('should verify valid token and update user status', async () => {
            // Create a token
            await (0, email_verification_service_1.sendEmailVerification)(testUserId, 'test-verification@example.com');
            const token = await prisma.emailVerificationToken.findFirst({
                where: { userId: testUserId },
                orderBy: { createdAt: 'desc' },
            });
            (0, globals_1.expect)(token).toBeDefined();
            // Verify the token
            const result = await (0, email_verification_service_1.verifyEmailToken)(token.token);
            (0, globals_1.expect)(result.userId).toBe(testUserId);
            (0, globals_1.expect)(result.email).toBe('test-verification@example.com');
            // Check that user status was updated
            const updatedUser = await prisma.user.findUnique({
                where: { id: testUserId },
            });
            (0, globals_1.expect)(updatedUser?.emailVerifiedAt).toBeDefined();
            (0, globals_1.expect)(updatedUser?.status).toBe('VERIFICATION_PENDING');
        });
        (0, globals_1.it)('should reject invalid token', async () => {
            await (0, globals_1.expect)((0, email_verification_service_1.verifyEmailToken)('invalid-token')).rejects.toThrow('Invalid verification token');
        });
        (0, globals_1.it)('should reject expired token', async () => {
            // Create a token with past expiration
            const expiredToken = await prisma.emailVerificationToken.create({
                data: {
                    userId: testUserId,
                    token: 'expired-token-123',
                    expiresAt: new Date(Date.now() - 1000), // 1 second ago
                },
            });
            await (0, globals_1.expect)((0, email_verification_service_1.verifyEmailToken)(expiredToken.token)).rejects.toThrow('Verification token has expired');
        });
        (0, globals_1.it)('should reject already used token', async () => {
            // Create and use a token
            const token = await prisma.emailVerificationToken.create({
                data: {
                    userId: testUserId,
                    token: 'used-token-123',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    usedAt: new Date(),
                },
            });
            await (0, globals_1.expect)((0, email_verification_service_1.verifyEmailToken)(token.token)).rejects.toThrow('Verification token has already been used');
        });
        (0, globals_1.it)('should create verification record', async () => {
            // Create a new token
            const newToken = await prisma.emailVerificationToken.create({
                data: {
                    userId: testUserId,
                    token: 'new-test-token-' + Date.now(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
            // Verify it
            await (0, email_verification_service_1.verifyEmailToken)(newToken.token);
            // Check verification record was created
            const verificationRecord = await prisma.verificationRecord.findUnique({
                where: { userId_type: { userId: testUserId, type: 'EMAIL' } },
            });
            (0, globals_1.expect)(verificationRecord).toBeDefined();
            (0, globals_1.expect)(verificationRecord?.status).toBe('APPROVED');
            (0, globals_1.expect)(verificationRecord?.verifiedAt).toBeDefined();
        });
    });
    (0, globals_1.describe)('resendEmailVerification', () => {
        (0, globals_1.it)('should create new token for unverified email', async () => {
            // First, get existing tokens count
            const existingTokens = await prisma.emailVerificationToken.findMany({
                where: { userId: testUserId },
            });
            const initialCount = existingTokens.length;
            // Resend verification
            await (0, email_verification_service_1.resendEmailVerification)(testUserId);
            // Check that old tokens were deleted and new one created
            const tokens = await prisma.emailVerificationToken.findMany({
                where: { userId: testUserId },
            });
            (0, globals_1.expect)(tokens.length).toBeGreaterThan(0);
            (0, globals_1.expect)(tokens.some(t => !t.usedAt)).toBe(true);
        });
        (0, globals_1.it)('should reject resend for already verified email', async () => {
            // First verify the email
            const newToken = await prisma.emailVerificationToken.create({
                data: {
                    userId: testUserId,
                    token: 'verify-' + Date.now(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
            await (0, email_verification_service_1.verifyEmailToken)(newToken.token);
            // Try to resend
            await (0, globals_1.expect)((0, email_verification_service_1.resendEmailVerification)(testUserId)).rejects.toThrow('Email already verified');
        });
        (0, globals_1.it)('should reject resend for non-existent user', async () => {
            await (0, globals_1.expect)((0, email_verification_service_1.resendEmailVerification)('non-existent-user-id')).rejects.toThrow('User not found');
        });
    });
});
//# sourceMappingURL=email-verification.test.js.map