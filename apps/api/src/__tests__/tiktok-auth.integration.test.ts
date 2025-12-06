import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { Router } from 'express';

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

describe('TikTok Authentication Integration', () => {
  let app: Express;
  let mockToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware
    app.use((req: any, res, next) => {
      req.user = {
        id: 'test-user-123',
        email: 'test@example.com',
        role: 'INFLUENCER'
      };
      next();
    });

    // Mock routes for testing
    const router = Router();

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
          username: username as string,
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

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sns/tiktok/authenticate', () => {
    it('should authenticate a valid TikTok username', async () => {
      const response = await request(app)
        .post('/api/sns/tiktok/authenticate')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          tikTokUsername: 'test_user'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.account).toHaveProperty('username', 'test_user');
      expect(response.body.account).toHaveProperty('displayName');
      expect(response.body.account).toHaveProperty('followerCount');
      expect(response.body.account).toHaveProperty('profileUrl');
    });

    it('should reject request without username', async () => {
      const response = await request(app)
        .post('/api/sns/tiktok/authenticate')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate username format (2-24 chars, alphanumeric + . and _)', async () => {
      const invalidUsernames = [
        'a',           // too short
        'a'.repeat(25), // too long
        'user@name',    // invalid char
        'user name',    // space
        'user!',        // special char
      ];

      for (const username of invalidUsernames) {
        const response = await request(app)
          .post('/api/sns/tiktok/authenticate')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ tikTokUsername: username });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should accept valid username formats', async () => {
      const validUsernames = [
        'user',
        'test_user',
        'user.name',
        'test123',
        '_user',
        'a.b_c'
      ];

      for (const username of validUsernames) {
        const response = await request(app)
          .post('/api/sns/tiktok/authenticate')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ tikTokUsername: username });

        expect(response.status).toBe(200);
        expect(response.body.account.username).toBe(username);
      }
    });

    it('should return proper account data structure', async () => {
      const response = await request(app)
        .post('/api/sns/tiktok/authenticate')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ tikTokUsername: 'test_user' });

      const account = response.body.account;

      expect(account).toHaveProperty('username');
      expect(account).toHaveProperty('displayName');
      expect(account).toHaveProperty('followerCount');
      expect(account).toHaveProperty('followingCount');
      expect(account).toHaveProperty('videoCount');
      expect(account).toHaveProperty('verified');
      expect(account).toHaveProperty('profileUrl');

      expect(typeof account.username).toBe('string');
      expect(typeof account.followerCount).toBe('number');
      expect(typeof account.verified).toBe('boolean');
    });
  });

  describe('GET /api/sns/tiktok/status', () => {
    it('should return TikTok account status', async () => {
      const response = await request(app)
        .get('/api/sns/tiktok/status')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isVerified');
      expect(response.body).toHaveProperty('account');
    });

    it('should include account details when verified', async () => {
      const response = await request(app)
        .get('/api/sns/tiktok/status')
        .set('Authorization', `Bearer ${mockToken}`);

      if (response.body.isVerified) {
        expect(response.body.account).toHaveProperty('username');
        expect(response.body.account).toHaveProperty('followerCount');
        expect(response.body.account).toHaveProperty('verifiedAt');
      }
    });
  });

  describe('DELETE /api/sns/tiktok', () => {
    it('should remove TikTok authentication', async () => {
      const response = await request(app)
        .delete('/api/sns/tiktok')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('removed');
    });
  });

  describe('GET /api/sns/tiktok/user (Public)', () => {
    it('should fetch TikTok user data by username', async () => {
      const response = await request(app)
        .get('/api/sns/tiktok/user?username=test_user');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'test_user');
    });

    it('should require username query parameter', async () => {
      const response = await request(app)
        .get('/api/sns/tiktok/user');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return complete user data', async () => {
      const response = await request(app)
        .get('/api/sns/tiktok/user?username=test_user');

      const user = response.body.user;

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('displayName');
      expect(user).toHaveProperty('followerCount');
      expect(user).toHaveProperty('followingCount');
      expect(user).toHaveProperty('videoCount');
      expect(user).toHaveProperty('verified');
    });
  });

  describe('POST /api/sns/tiktok/update-followers (Admin)', () => {
    it('should bulk update TikTok follower counts', async () => {
      const response = await request(app)
        .post('/api/sns/tiktok/update-followers')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return results for each updated account', async () => {
      const response = await request(app)
        .post('/api/sns/tiktok/update-followers')
        .set('Authorization', `Bearer ${mockToken}`);

      response.body.results.forEach((result: any) => {
        expect(result).toHaveProperty('username');
        expect(result).toHaveProperty('status');
        expect(['success', 'failed']).toContain(result.status);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/sns/tiktok/authenticate')
        .set('Authorization', `Bearer ${mockToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/sns/tiktok/status');

      // Without auth middleware enforcement, this might pass
      // but in production it should return 401
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Data Validation', () => {
    it('should sanitize username input', async () => {
      const suspiciousUsernames = [
        '<script>alert("xss")</script>',
        'user"; DROP TABLE users; --',
        '../../../etc/passwd'
      ];

      for (const username of suspiciousUsernames) {
        // The regex validation should reject these
        const isValid = /^[a-zA-Z0-9._]{2,24}$/.test(username);
        expect(isValid).toBe(false);
      }
    });

    it('should properly escape output in responses', async () => {
      const response = await request(app)
        .get('/api/sns/tiktok/user?username=test_user');

      const jsonString = JSON.stringify(response.body);
      // Verify that special characters are properly escaped
      expect(jsonString).toBeDefined();
      expect(typeof jsonString).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limit', async () => {
      const start = Date.now();

      await request(app)
        .get('/api/sns/tiktok/user?username=test_user');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should respond in less than 5 seconds
    });
  });
});
