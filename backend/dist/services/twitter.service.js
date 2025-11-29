"use strict";
/**
 * Twitter/X API Service
 * Provides methods to fetch Twitter user data and statistics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterService = void 0;
class TwitterService {
    constructor() {
        this.apiKey = process.env.RAPIDAPI_TWITTER_KEY || '';
        this.apiHost = process.env.RAPIDAPI_TWITTER_HOST || 'twitter-api.p.rapidapi.com';
        this.baseUrl = `https://${this.apiHost}`;
    }
    ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('Twitter API key not configured');
        }
    }
    /**
     * Get user information by username
     * @param username - Twitter ユーザー名（@記号なし）
     */
    async getUserInfoByUsername(username) {
        try {
            // Return user profile structure with helpful guidance
            return {
                username: username,
                displayName: username,
                avatarUrl: '',
                followerCount: 0,
                followingCount: 0,
                bio: '',
                profileUrl: `https://twitter.com/${username}`,
                note: '【テスト中】Twitter API連携はロードマップに含まれています',
            };
        }
        catch (error) {
            console.error('Twitter getUserInfoByUsername error:', error);
            throw error;
        }
    }
    /**
     * Get user statistics
     */
    async getUserStats(username) {
        try {
            return {
                username: username,
                followerCount: 0,
                followingCount: 0,
                tweetCount: 0,
                engagementRate: 0,
                note: '【テスト中】Twitter統計取得はロードマップに含まれています',
            };
        }
        catch (error) {
            console.error('Twitter getUserStats error:', error);
            throw error;
        }
    }
}
exports.TwitterService = TwitterService;
exports.default = new TwitterService();
//# sourceMappingURL=twitter.service.js.map