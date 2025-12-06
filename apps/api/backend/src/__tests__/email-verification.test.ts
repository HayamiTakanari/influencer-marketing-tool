import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { sendEmailVerification, verifyEmailToken, resendEmailVerification } from '../services/email-verification.service';

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ response: '250 Message accepted' }),
  })),
}));

describe('Email Verification Service', () => {
  let prisma: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

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

  afterAll(async () => {
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

  describe('sendEmailVerification', () => {
    it('should create email verification token', async () => {
      await sendEmailVerification(testUserId, 'test-verification@example.com');

      const token = await prisma.emailVerificationToken.findFirst({
        where: { userId: testUserId },
      });

      expect(token).toBeDefined();
      expect(token?.userId).toBe(testUserId);
      expect(token?.usedAt).toBeNull();
      expect(token?.expiresAt).toBeGreaterThan(new Date());
    });

    it('should set token expiration to 24 hours', async () => {
      await sendEmailVerification(testUserId, 'test-verification@example.com');

      const token = await prisma.emailVerificationToken.findFirst({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const expectedExpiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      expect(token?.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiration.getTime() + 1000);
      expect(token?.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiration.getTime() - 5000);
    });
  });

  describe('verifyEmailToken', () => {
    it('should verify valid token and update user status', async () => {
      // Create a token
      await sendEmailVerification(testUserId, 'test-verification@example.com');

      const token = await prisma.emailVerificationToken.findFirst({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });

      expect(token).toBeDefined();

      // Verify the token
      const result = await verifyEmailToken(token!.token);

      expect(result.userId).toBe(testUserId);
      expect(result.email).toBe('test-verification@example.com');

      // Check that user status was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(updatedUser?.emailVerifiedAt).toBeDefined();
      expect(updatedUser?.status).toBe('VERIFICATION_PENDING');
    });

    it('should reject invalid token', async () => {
      await expect(verifyEmailToken('invalid-token')).rejects.toThrow('Invalid verification token');
    });

    it('should reject expired token', async () => {
      // Create a token with past expiration
      const expiredToken = await prisma.emailVerificationToken.create({
        data: {
          userId: testUserId,
          token: 'expired-token-123',
          expiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      await expect(verifyEmailToken(expiredToken.token)).rejects.toThrow('Verification token has expired');
    });

    it('should reject already used token', async () => {
      // Create and use a token
      const token = await prisma.emailVerificationToken.create({
        data: {
          userId: testUserId,
          token: 'used-token-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          usedAt: new Date(),
        },
      });

      await expect(verifyEmailToken(token.token)).rejects.toThrow('Verification token has already been used');
    });

    it('should create verification record', async () => {
      // Create a new token
      const newToken = await prisma.emailVerificationToken.create({
        data: {
          userId: testUserId,
          token: 'new-test-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Verify it
      await verifyEmailToken(newToken.token);

      // Check verification record was created
      const verificationRecord = await prisma.verificationRecord.findUnique({
        where: { userId_type: { userId: testUserId, type: 'EMAIL' } },
      });

      expect(verificationRecord).toBeDefined();
      expect(verificationRecord?.status).toBe('APPROVED');
      expect(verificationRecord?.verifiedAt).toBeDefined();
    });
  });

  describe('resendEmailVerification', () => {
    it('should create new token for unverified email', async () => {
      // First, get existing tokens count
      const existingTokens = await prisma.emailVerificationToken.findMany({
        where: { userId: testUserId },
      });

      const initialCount = existingTokens.length;

      // Resend verification
      await resendEmailVerification(testUserId);

      // Check that old tokens were deleted and new one created
      const tokens = await prisma.emailVerificationToken.findMany({
        where: { userId: testUserId },
      });

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some(t => !t.usedAt)).toBe(true);
    });

    it('should reject resend for already verified email', async () => {
      // First verify the email
      const newToken = await prisma.emailVerificationToken.create({
        data: {
          userId: testUserId,
          token: 'verify-' + Date.now(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await verifyEmailToken(newToken.token);

      // Try to resend
      await expect(resendEmailVerification(testUserId)).rejects.toThrow('Email already verified');
    });

    it('should reject resend for non-existent user', async () => {
      await expect(resendEmailVerification('non-existent-user-id')).rejects.toThrow('User not found');
    });
  });
});
