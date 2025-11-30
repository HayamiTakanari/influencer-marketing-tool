/**
 * Instagram API Service
 * Provides methods to fetch Instagram user data and statistics
 */
export declare class InstagramService {
    private apiKey;
    private apiHost;
    private baseUrl;
    constructor();
    private ensureApiKey;
    /**
     * Get user information by username
     * @param username - Instagram ユーザー名（@記号なし）
     */
    getUserInfoByUsername(username: string): Promise<{
        username: string;
        nickname: string;
        avatarUrl: string;
        followerCount: number;
        followingCount: number;
        bio: string;
        profileUrl: string;
        note: string;
    }>;
    /**
     * Get user engagement statistics
     */
    getUserStats(username: string): Promise<{
        username: string;
        followerCount: number;
        engagementRate: number;
        postCount: number;
        note: string;
    }>;
}
declare const _default: InstagramService;
export default _default;
//# sourceMappingURL=instagram.service.d.ts.map