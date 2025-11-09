"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var client_1 = require("@prisma/client");
var auth_1 = require("../middleware/auth");
var crypto_1 = require("crypto");
var axios_1 = require("axios");
var router = (0, express_1.Router)();
var prisma = new client_1.PrismaClient();
// OAuth設定（環境変数から読み込み）
var oauthConfig = {
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
var algorithm = 'aes-256-cbc';
var key = Buffer.from(process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32).toString('hex'), 'hex');
var iv = Buffer.from(process.env.ENCRYPTION_IV || crypto_1.default.randomBytes(16).toString('hex'), 'hex');
function encrypt(text) {
    var cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
    var encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
function decrypt(encrypted) {
    var decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
// OAuth認証開始エンドポイント
router.get('/auth/:platform', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var platform, userId, user, state, authUrl, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                platform = req.params.platform;
                userId = req.user.id;
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: userId },
                        include: { influencer: true },
                    })];
            case 1:
                user = _a.sent();
                if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' })];
                }
                state = crypto_1.default.randomBytes(16).toString('hex');
                authUrl = '';
                switch (platform.toLowerCase()) {
                    case 'instagram':
                        authUrl = "".concat(oauthConfig.instagram.authUrl, "?client_id=").concat(oauthConfig.instagram.clientId, "&redirect_uri=").concat(encodeURIComponent(oauthConfig.instagram.redirectUri), "&scope=user_profile,user_media&response_type=code&state=").concat(state);
                        break;
                    case 'youtube':
                        authUrl = "".concat(oauthConfig.youtube.authUrl, "?client_id=").concat(oauthConfig.youtube.clientId, "&redirect_uri=").concat(encodeURIComponent(oauthConfig.youtube.redirectUri), "&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&state=").concat(state);
                        break;
                    case 'tiktok':
                        authUrl = "".concat(oauthConfig.tiktok.authUrl, "?client_key=").concat(oauthConfig.tiktok.clientKey, "&redirect_uri=").concat(encodeURIComponent(oauthConfig.tiktok.redirectUri), "&scope=user.info.basic&response_type=code&state=").concat(state);
                        break;
                    case 'twitter':
                        authUrl = "".concat(oauthConfig.twitter.authUrl, "?client_id=").concat(oauthConfig.twitter.clientId, "&redirect_uri=").concat(encodeURIComponent(oauthConfig.twitter.redirectUri), "&scope=users.read%20tweet.read&response_type=code&state=").concat(state, "&code_challenge=challenge&code_challenge_method=plain");
                        break;
                    default:
                        return [2 /*return*/, res.status(400).json({ error: 'サポートされていないプラットフォームです' })];
                }
                res.json({ authUrl: authUrl });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('OAuth auth error:', error_1);
                res.status(500).json({ error: 'OAuth認証の開始に失敗しました' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// OAuth コールバックエンドポイント
router.post('/callback/:platform', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var platform, _a, code, state, userId, user, tokenData, userInfo, platformEnum, _b, instagramResponse, instagramUser, youtubeResponse, youtubeChannel, tiktokResponse, tiktokUser, twitterResponse, twitterUser, socialAccount, error_2;
    var _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                _j.trys.push([0, 17, , 18]);
                platform = req.params.platform;
                _a = req.body, code = _a.code, state = _a.state;
                userId = req.user.id;
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: userId },
                        include: { influencer: true },
                    })];
            case 1:
                user = _j.sent();
                if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' })];
                }
                tokenData = null;
                userInfo = null;
                platformEnum = void 0;
                _b = platform.toLowerCase();
                switch (_b) {
                    case 'instagram': return [3 /*break*/, 2];
                    case 'youtube': return [3 /*break*/, 5];
                    case 'tiktok': return [3 /*break*/, 8];
                    case 'twitter': return [3 /*break*/, 11];
                }
                return [3 /*break*/, 14];
            case 2:
                platformEnum = client_1.Platform.INSTAGRAM;
                return [4 /*yield*/, axios_1.default.post(oauthConfig.instagram.tokenUrl, {
                        client_id: oauthConfig.instagram.clientId,
                        client_secret: oauthConfig.instagram.clientSecret,
                        grant_type: 'authorization_code',
                        redirect_uri: oauthConfig.instagram.redirectUri,
                        code: code,
                    })];
            case 3:
                instagramResponse = _j.sent();
                tokenData = instagramResponse.data;
                return [4 /*yield*/, axios_1.default.get("".concat(oauthConfig.instagram.apiUrl, "/me"), {
                        params: {
                            fields: 'id,username,account_type,media_count',
                            access_token: tokenData.access_token,
                        },
                    })];
            case 4:
                instagramUser = _j.sent();
                userInfo = instagramUser.data;
                return [3 /*break*/, 15];
            case 5:
                platformEnum = client_1.Platform.YOUTUBE;
                return [4 /*yield*/, axios_1.default.post(oauthConfig.youtube.tokenUrl, {
                        client_id: oauthConfig.youtube.clientId,
                        client_secret: oauthConfig.youtube.clientSecret,
                        grant_type: 'authorization_code',
                        redirect_uri: oauthConfig.youtube.redirectUri,
                        code: code,
                    })];
            case 6:
                youtubeResponse = _j.sent();
                tokenData = youtubeResponse.data;
                return [4 /*yield*/, axios_1.default.get("".concat(oauthConfig.youtube.apiUrl, "/channels"), {
                        params: {
                            part: 'snippet,statistics',
                            mine: true,
                        },
                        headers: {
                            Authorization: "Bearer ".concat(tokenData.access_token),
                        },
                    })];
            case 7:
                youtubeChannel = _j.sent();
                userInfo = youtubeChannel.data.items[0];
                return [3 /*break*/, 15];
            case 8:
                platformEnum = client_1.Platform.TIKTOK;
                return [4 /*yield*/, axios_1.default.post(oauthConfig.tiktok.tokenUrl, {
                        client_key: oauthConfig.tiktok.clientKey,
                        client_secret: oauthConfig.tiktok.clientSecret,
                        grant_type: 'authorization_code',
                        redirect_uri: oauthConfig.tiktok.redirectUri,
                        code: code,
                    })];
            case 9:
                tiktokResponse = _j.sent();
                tokenData = tiktokResponse.data;
                return [4 /*yield*/, axios_1.default.get("".concat(oauthConfig.tiktok.apiUrl, "/user/info/"), {
                        headers: {
                            Authorization: "Bearer ".concat(tokenData.access_token),
                        },
                    })];
            case 10:
                tiktokUser = _j.sent();
                userInfo = tiktokUser.data.data.user;
                return [3 /*break*/, 15];
            case 11:
                platformEnum = client_1.Platform.TWITTER;
                return [4 /*yield*/, axios_1.default.post(oauthConfig.twitter.tokenUrl, {
                        client_id: oauthConfig.twitter.clientId,
                        client_secret: oauthConfig.twitter.clientSecret,
                        grant_type: 'authorization_code',
                        redirect_uri: oauthConfig.twitter.redirectUri,
                        code: code,
                        code_verifier: 'challenge', // 実際は適切な PKCE を実装
                    })];
            case 12:
                twitterResponse = _j.sent();
                tokenData = twitterResponse.data;
                return [4 /*yield*/, axios_1.default.get("".concat(oauthConfig.twitter.apiUrl, "/users/me"), {
                        headers: {
                            Authorization: "Bearer ".concat(tokenData.access_token),
                        },
                    })];
            case 13:
                twitterUser = _j.sent();
                userInfo = twitterUser.data.data;
                return [3 /*break*/, 15];
            case 14: return [2 /*return*/, res.status(400).json({ error: 'サポートされていないプラットフォームです' })];
            case 15: return [4 /*yield*/, prisma.socialAccount.upsert({
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
                        username: userInfo.username || ((_c = userInfo.snippet) === null || _c === void 0 ? void 0 : _c.title) || userInfo.display_name,
                        followerCount: userInfo.follower_count ||
                            ((_d = userInfo.statistics) === null || _d === void 0 ? void 0 : _d.subscriberCount) ||
                            ((_e = userInfo.public_metrics) === null || _e === void 0 ? void 0 : _e.followers_count) ||
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
                        username: userInfo.username || ((_f = userInfo.snippet) === null || _f === void 0 ? void 0 : _f.title) || userInfo.display_name,
                        profileUrl: "https://".concat(platform.toLowerCase(), ".com/").concat(userInfo.username || userInfo.id),
                        followerCount: userInfo.follower_count ||
                            ((_g = userInfo.statistics) === null || _g === void 0 ? void 0 : _g.subscriberCount) ||
                            ((_h = userInfo.public_metrics) === null || _h === void 0 ? void 0 : _h.followers_count) ||
                            0,
                        isVerified: userInfo.is_verified || false,
                    },
                })];
            case 16:
                socialAccount = _j.sent();
                res.json({
                    success: true,
                    platform: platform,
                    username: socialAccount.username,
                    followerCount: socialAccount.followerCount,
                });
                return [3 /*break*/, 18];
            case 17:
                error_2 = _j.sent();
                console.error('OAuth callback error:', error_2);
                res.status(500).json({ error: 'OAuth認証に失敗しました' });
                return [3 /*break*/, 18];
            case 18: return [2 /*return*/];
        }
    });
}); });
// SNSアカウント連携解除
router.delete('/disconnect/:platform', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var platform, userId, user, platformEnum, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                platform = req.params.platform;
                userId = req.user.id;
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: userId },
                        include: { influencer: true },
                    })];
            case 1:
                user = _a.sent();
                if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' })];
                }
                platformEnum = client_1.Platform[platform.toUpperCase()];
                return [4 /*yield*/, prisma.socialAccount.update({
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
                    })];
            case 2:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('Disconnect error:', error_3);
                res.status(500).json({ error: '連携解除に失敗しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// SNSアカウント連携状態確認
router.get('/status', auth_1.authenticate, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, user, connectionStatus, error_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                }
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: userId },
                        include: {
                            influencer: {
                                include: {
                                    socialAccounts: true,
                                },
                            },
                        },
                    })];
            case 1:
                user = _b.sent();
                if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' })];
                }
                connectionStatus = user.influencer.socialAccounts.map(function (account) { return ({
                    platform: account.platform,
                    isConnected: account.isConnected,
                    username: account.username,
                    followerCount: account.followerCount,
                    lastSynced: account.lastSynced,
                }); });
                res.json({ connectionStatus: connectionStatus });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error('Status check error:', error_4);
                res.status(500).json({ error: 'ステータス確認に失敗しました' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
