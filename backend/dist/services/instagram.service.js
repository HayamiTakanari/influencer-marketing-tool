"use strict";
/**
 * Instagram API Service
 * Provides methods to fetch Instagram user data and statistics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramService = void 0;
class InstagramService {
    constructor() {
        this.apiKey = process.env.RAPIDAPI_INSTAGRAM_KEY || '';
        this.apiHost = process.env.RAPIDAPI_INSTAGRAM_HOST || 'instagram-api1.p.rapidapi.com';
        this.baseUrl = `https://${this.apiHost}`;
    }
    ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('Instagram API key not configured');
        }
    }
    /**
     * Get user information by username
     * @param username - Instagram ユーザー名（@記号なし）
     */
    async getUserInfoByUsername(username) {
        try {
            // Return user profile structure with helpful guidance
            // Note: API key validation is skipped for test mode
            return {
                username: username,
                nickname: username,
                avatarUrl: '',
                followerCount: 0,
                followingCount: 0,
                bio: '',
                profileUrl: `https://www.instagram.com/${username}`,
                note: '【テスト中】Instagram API連携はロードマップに含まれています',
            };
        }
        catch (error) {
            console.error('Instagram getUserInfoByUsername error:', error);
            throw error;
        }
    }
    /**
     * Get user engagement statistics
     */
    async getUserStats(username) {
        try {
            return {
                username: username,
                followerCount: 0,
                engagementRate: 0,
                postCount: 0,
                note: '【テスト中】Instagram統計取得はロードマップに含まれています',
            };
        }
        catch (error) {
            console.error('Instagram getUserStats error:', error);
            throw error;
        }
    }
}
exports.InstagramService = InstagramService;
exports.default = new InstagramService();
//# sourceMappingURL=instagram.service.js.map