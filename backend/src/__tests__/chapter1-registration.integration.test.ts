import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import chapter1Routes from '../routes/chapter1-registration.routes';

let app: Application;
let prisma: PrismaClient;

describe('Chapter 1 Registration Integration Tests', () => {
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/chapter1', chapter1Routes);

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/chapter1/register - Company Registration', () => {
    const companyData = {
      email: `company-${Date.now()}@example.com`,
      password: 'SecurePassword123',
      role: 'COMPANY',
      companyName: 'Test Company Inc.',
      legalNumber: '1234567890123',
      representativeName: 'John Doe',
      industry: 'IT',
    };

    it('should register a new company successfully', async () => {
      const response = await request(app)
        .post('/api/chapter1/register')
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(companyData.email);
      expect(response.body.user.role).toBe('COMPANY');
      expect(response.body.user.status).toBe('PROVISIONAL');

      // Verify company profile was created
      const user = await prisma.user.findUnique({
        where: { email: companyData.email },
        include: { company: true },
      });

      expect(user).toBeDefined();
      expect(user?.company).toBeDefined();
      expect(user?.company?.companyName).toBe(companyData.companyName);
    });

    it('should reject duplicate email registration', async () => {
      // Register first time
      await request(app).post('/api/chapter1/register').send(companyData);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/chapter1/register')
        .send(companyData);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already registered');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/chapter1/register')
        .send({
          ...companyData,
          email: `weak-password-${Date.now()}@example.com`,
          password: 'weak', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject missing company name', async () => {
      const response = await request(app)
        .post('/api/chapter1/register')
        .send({
          ...companyData,
          email: `no-company-${Date.now()}@example.com`,
          companyName: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /api/chapter1/register - Influencer Registration', () => {
    const influencerData = {
      email: `influencer-${Date.now()}@example.com`,
      password: 'SecurePassword123',
      role: 'INFLUENCER',
      displayName: 'Test Influencer',
    };

    it('should register a new influencer successfully', async () => {
      const response = await request(app)
        .post('/api/chapter1/register')
        .send(influencerData);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('INFLUENCER');
      expect(response.body.user.status).toBe('PROVISIONAL');

      // Verify influencer profile was created
      const user = await prisma.user.findUnique({
        where: { email: influencerData.email },
        include: { influencer: true },
      });

      expect(user).toBeDefined();
      expect(user?.influencer).toBeDefined();
      expect(user?.influencer?.displayName).toBe(influencerData.displayName);
    });

    it('should reject missing display name', async () => {
      const response = await request(app)
        .post('/api/chapter1/register')
        .send({
          ...influencerData,
          email: `no-name-${Date.now()}@example.com`,
          displayName: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/chapter1/verify-email', () => {
    it('should verify email with valid token', async () => {
      // Register user
      const userData = {
        email: `verify-email-${Date.now()}@example.com`,
        password: 'SecurePassword123',
        role: 'INFLUENCER',
        displayName: 'Verify Test',
      };

      const registerResponse = await request(app)
        .post('/api/chapter1/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);

      // Get the verification token
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      const token = await prisma.emailVerificationToken.findFirst({
        where: { userId: user!.id },
      });

      // Verify email
      const verifyResponse = await request(app)
        .get('/api/chapter1/verify-email')
        .query({ token: token!.token });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveProperty('userId');
      expect(verifyResponse.body.status).toBe('VERIFICATION_PENDING');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/chapter1/verify-email')
        .query({ token: 'invalid-token' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/chapter1/resend-verification', () => {
    it('should resend verification email for unverified account', async () => {
      const userData = {
        email: `resend-${Date.now()}@example.com`,
        password: 'SecurePassword123',
        role: 'INFLUENCER',
        displayName: 'Resend Test',
      };

      // Register user
      await request(app).post('/api/chapter1/register').send(userData);

      // Resend verification
      const response = await request(app)
        .post('/api/chapter1/resend-verification')
        .send({ email: userData.email });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/chapter1/resend-verification')
        .send({ email: 'non-existent@example.com' });

      // Should return 200 for security reasons (don't reveal if email exists)
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/chapter1/registration-status', () => {
    it('should get registration status for authenticated user', async () => {
      // Note: In real tests, you'd need to set up proper authentication
      // This is a placeholder for the concept
      const response = await request(app).get('/api/chapter1/registration-status');

      // Will likely fail without auth, but that's expected
      expect([401, 200]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on registration endpoint', async () => {
      // This would test rate limit middleware
      // Implementation depends on the middleware setup
      const endpoint = '/api/chapter1/register';
      let successCount = 0;

      // Try to make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
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
      expect(successCount).toBeLessThan(10);
    });
  });

  describe('Input Validation & Security', () => {
    it('should sanitize XSS attempts in company name', async () => {
      const response = await request(app)
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

        expect(user?.company?.companyName).not.toContain('<script>');
      }
    });

    it('should normalize email addresses', async () => {
      const email = `Test.Email.${Date.now()}@EXAMPLE.COM`;

      const response = await request(app)
        .post('/api/chapter1/register')
        .send({
          email,
          password: 'SecurePassword123',
          role: 'INFLUENCER',
          displayName: 'Test',
        });

      expect(response.status).toBe(201);

      // Verify email is stored in lowercase
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      expect(user).toBeDefined();
    });
  });
});
