import { Router } from 'express';
import { PrismaClient, Platform } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import crypto from 'crypto';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

// OAuth設定（環境変数から読み込み）
const oauthConfig = {
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/oauth/instagram/callback',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    apiUrl: 'https://graph.instagram.com',
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/oauth/youtube/callback',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiUrl: 'https://www.googleapis.com/youtube/v3',
  },
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/oauth/tiktok/callback',
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    apiUrl: 'https://open-api.tiktok.com',
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
    redirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/oauth/twitter/callback',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    apiUrl: 'https://api.twitter.com/2',
  },
};

// 暗号化・復号化用の関数
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV || crypto.randomBytes(16).toString('hex'), 'hex');

function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// OAuth認証開始エンドポイント
router.get('/auth/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user!.id;
    
    // インフルエンサーのみアクセス可能
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { influencer: true },
    });

    if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
      return res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' });
    }

    // state パラメータ（CSRF対策）
    const state = crypto.randomBytes(16).toString('hex');
    
    // セッションに保存（実際の実装では Redis などを使用）
    // ここでは簡易的に実装
    await prisma.user.update({
      where: { id: userId },
      data: { 
        // 一時的にプロフィールに保存（実際はセッションストアを使用）
        profile: {
          ...user.profile,
          oauthState: state,
        } as any,
      },
    });

    let authUrl = '';
    
    switch (platform.toLowerCase()) {
      case 'instagram':
        authUrl = `${oauthConfig.instagram.authUrl}?client_id=${oauthConfig.instagram.clientId}&redirect_uri=${encodeURIComponent(oauthConfig.instagram.redirectUri)}&scope=user_profile,user_media&response_type=code&state=${state}`;
        break;
      case 'youtube':
        authUrl = `${oauthConfig.youtube.authUrl}?client_id=${oauthConfig.youtube.clientId}&redirect_uri=${encodeURIComponent(oauthConfig.youtube.redirectUri)}&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&state=${state}`;
        break;
      case 'tiktok':
        authUrl = `${oauthConfig.tiktok.authUrl}?client_key=${oauthConfig.tiktok.clientKey}&redirect_uri=${encodeURIComponent(oauthConfig.tiktok.redirectUri)}&scope=user.info.basic&response_type=code&state=${state}`;
        break;
      case 'twitter':
        authUrl = `${oauthConfig.twitter.authUrl}?client_id=${oauthConfig.twitter.clientId}&redirect_uri=${encodeURIComponent(oauthConfig.twitter.redirectUri)}&scope=users.read%20tweet.read&response_type=code&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
        break;
      default:
        return res.status(400).json({ error: 'サポートされていないプラットフォームです' });
    }

    res.json({ authUrl });
  } catch (error) {
    console.error('OAuth auth error:', error);
    res.status(500).json({ error: 'OAuth認証の開始に失敗しました' });
  }
});

// OAuth コールバックエンドポイント
router.post('/callback/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { influencer: true },
    });

    if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
      return res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' });
    }

    // state 検証（CSRF対策）
    // 実際の実装ではセッションストアから取得
    const savedState = (user.profile as any)?.oauthState;
    if (state !== savedState) {
      return res.status(400).json({ error: '無効なリクエストです' });
    }

    let tokenData: any = null;
    let userInfo: any = null;
    let platformEnum: Platform;

    switch (platform.toLowerCase()) {
      case 'instagram':
        platformEnum = Platform.INSTAGRAM;
        // Instagram のトークン取得
        const instagramResponse = await axios.post(oauthConfig.instagram.tokenUrl, {
          client_id: oauthConfig.instagram.clientId,
          client_secret: oauthConfig.instagram.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: oauthConfig.instagram.redirectUri,
          code,
        });
        tokenData = instagramResponse.data;
        
        // ユーザー情報取得
        const instagramUser = await axios.get(`${oauthConfig.instagram.apiUrl}/me`, {
          params: {
            fields: 'id,username,account_type,media_count',
            access_token: tokenData.access_token,
          },
        });
        userInfo = instagramUser.data;
        break;

      case 'youtube':
        platformEnum = Platform.YOUTUBE;
        // YouTube のトークン取得
        const youtubeResponse = await axios.post(oauthConfig.youtube.tokenUrl, {
          client_id: oauthConfig.youtube.clientId,
          client_secret: oauthConfig.youtube.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: oauthConfig.youtube.redirectUri,
          code,
        });
        tokenData = youtubeResponse.data;
        
        // チャンネル情報取得
        const youtubeChannel = await axios.get(`${oauthConfig.youtube.apiUrl}/channels`, {
          params: {
            part: 'snippet,statistics',
            mine: true,
          },
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        userInfo = youtubeChannel.data.items[0];
        break;

      case 'tiktok':
        platformEnum = Platform.TIKTOK;
        // TikTok のトークン取得
        const tiktokResponse = await axios.post(oauthConfig.tiktok.tokenUrl, {
          client_key: oauthConfig.tiktok.clientKey,
          client_secret: oauthConfig.tiktok.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: oauthConfig.tiktok.redirectUri,
          code,
        });
        tokenData = tiktokResponse.data;
        
        // ユーザー情報取得
        const tiktokUser = await axios.get(`${oauthConfig.tiktok.apiUrl}/user/info/`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        userInfo = tiktokUser.data.data.user;
        break;

      case 'twitter':
        platformEnum = Platform.TWITTER;
        // Twitter のトークン取得
        const twitterResponse = await axios.post(oauthConfig.twitter.tokenUrl, {
          client_id: oauthConfig.twitter.clientId,
          client_secret: oauthConfig.twitter.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: oauthConfig.twitter.redirectUri,
          code,
          code_verifier: 'challenge', // 実際は適切な PKCE を実装
        });
        tokenData = twitterResponse.data;
        
        // ユーザー情報取得
        const twitterUser = await axios.get(`${oauthConfig.twitter.apiUrl}/users/me`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        userInfo = twitterUser.data.data;
        break;

      default:
        return res.status(400).json({ error: 'サポートされていないプラットフォームです' });
    }

    // SocialAccount を更新または作成
    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        influencerId_platform: {
          influencerId: user.influencer.id,
          platform: platformEnum,
        },
      },
      update: {
        isConnected: true,
        accessToken: encrypt(tokenData.access_token),
        refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        platformUserId: userInfo.id || userInfo.user_id,
        username: userInfo.username || userInfo.snippet?.title || userInfo.display_name,
        followerCount: 
          userInfo.follower_count || 
          userInfo.statistics?.subscriberCount || 
          userInfo.public_metrics?.followers_count || 
          0,
        lastSynced: new Date(),
      },
      create: {
        influencerId: user.influencer.id,
        platform: platformEnum,
        isConnected: true,
        accessToken: encrypt(tokenData.access_token),
        refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        platformUserId: userInfo.id || userInfo.user_id,
        username: userInfo.username || userInfo.snippet?.title || userInfo.display_name,
        profileUrl: `https://${platform.toLowerCase()}.com/${userInfo.username || userInfo.id}`,
        followerCount: 
          userInfo.follower_count || 
          userInfo.statistics?.subscriberCount || 
          userInfo.public_metrics?.followers_count || 
          0,
        isVerified: userInfo.is_verified || false,
      },
    });

    res.json({
      success: true,
      platform,
      username: socialAccount.username,
      followerCount: socialAccount.followerCount,
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth認証に失敗しました' });
  }
});

// SNSアカウント連携解除
router.delete('/disconnect/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { influencer: true },
    });

    if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
      return res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' });
    }

    const platformEnum = Platform[platform.toUpperCase() as keyof typeof Platform];
    
    await prisma.socialAccount.update({
      where: {
        influencerId_platform: {
          influencerId: user.influencer.id,
          platform: platformEnum,
        },
      },
      data: {
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        platformUserId: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: '連携解除に失敗しました' });
  }
});

// SNSアカウント連携状態確認
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        influencer: {
          include: {
            socialAccounts: true,
          },
        },
      },
    });

    if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
      return res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' });
    }

    const connectionStatus = user.influencer.socialAccounts.map(account => ({
      platform: account.platform,
      isConnected: account.isConnected,
      username: account.username,
      followerCount: account.followerCount,
      lastSynced: account.lastSynced,
    }));

    res.json({ connectionStatus });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'ステータス確認に失敗しました' });
  }
});

export default router;