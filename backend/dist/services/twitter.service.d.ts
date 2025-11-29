/**
 * Twitter/X API Service
 * Provides methods to fetch Twitter user data and statistics
 */
export declare class TwitterService {
    private apiKey;
    private apiHost;
    private baseUrl;
    constructor();
    private ensureApiKey;
    /**
     * Get user information by username
     * @param username - Twitter ユーザー名（@記号なし）
     */
    getUserInfoByUsername(username: string): Promise<{
        username: string;
        displayName: string;
        avatarUrl: string;
        followerCount: number;
        followingCount: number;
        bio: string;
        profileUrl: string;
        note: string;
    }>;
    /**
     * Get user statistics
     */
    getUserStats(username: string): Promise<{
        username: string;
        followerCount: number;
        followingCount: number;
        tweetCount: number;
        engagementRate: number;
        note: string;
    }>;
}
declare const _default: TwitterService;
export default _default;
//# sourceMappingURL=twitter.service.d.ts.map