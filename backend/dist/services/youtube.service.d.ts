/**
 * YouTube API Service
 * Provides methods to fetch YouTube channel data and statistics
 */
export declare class YouTubeService {
    private apiKey;
    private apiHost;
    private baseUrl;
    constructor();
    private ensureApiKey;
    /**
     * Get channel information by username/handle
     * @param username - YouTube チャネルのユーザー名（@記号なし）
     */
    getChannelInfoByUsername(username: string): Promise<{
        username: string;
        channelName: string;
        avatarUrl: string;
        subscriberCount: number;
        videoCount: number;
        bio: string;
        profileUrl: string;
        note: string;
    }>;
    /**
     * Get channel statistics
     */
    getChannelStats(username: string): Promise<{
        username: string;
        subscriberCount: number;
        videoCount: number;
        viewCount: number;
        engagementRate: number;
        note: string;
    }>;
}
declare const _default: YouTubeService;
export default _default;
//# sourceMappingURL=youtube.service.d.ts.map