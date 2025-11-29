/**
 * TikTok API Service
 * Uses RapidAPI's TikTok Video No Watermark API
 */
export declare class TikTokService {
    private apiKey;
    private apiHost;
    private baseUrl;
    constructor();
    private ensureApiKey;
    /**
     * Get video information from TikTok URL
     * @param videoUrl - Full TikTok video URL
     * @returns Video data including metadata, stats, and author info
     */
    getVideoInfo(videoUrl: string): Promise<{
        id: any;
        title: any;
        description: any;
        coverUrl: any;
        originCoverUrl: any;
        videoUrl: any;
        watermarkVideoUrl: any;
        musicUrl: any;
        stats: {
            viewCount: any;
            likeCount: any;
            commentCount: any;
            engagementRate: number;
        };
        createdAt: Date;
        region: any;
        author: {
            unique_id: any;
            nickname: any;
            avatarUrl: any;
        };
        downloadableUrl: any;
    }>;
    /**
     * Extract username from TikTok URL
     * @param videoUrl - TikTok video URL
     * @returns Username if found, null otherwise
     */
    extractUsernameFromUrl(videoUrl: string): string | null;
    /**
     * Get user profile information (from video author data)
     * @param videoUrl - TikTok video URL to extract author info
     * @returns User profile information
     */
    getUserInfo(videoUrl: string): Promise<{
        username: any;
        nickname: any;
        avatarUrl: any;
    }>;
    /**
     * Calculate engagement rate from video stats
     * @param videoData - Video data with metrics
     * @returns Engagement rate as percentage
     */
    calculateEngagementRate(videoData: any): number;
    /**
     * Format raw TikTok API response to standardized format
     * @param rawData - Raw response from TikTok API
     * @returns Formatted video data
     */
    private formatVideoData;
    /**
     * Get multiple video statistics from a single video
     * Useful for analyzing influencer content
     */
    getVideoStatistics(videoUrl: string): Promise<{
        videoId: any;
        title: any;
        stats: {
            viewCount: any;
            likeCount: any;
            commentCount: any;
            engagementRate: number;
        };
        author: {
            unique_id: any;
            nickname: any;
            avatarUrl: any;
        };
        createdAt: Date;
    }>;
    /**
     * Validate if URL is a valid TikTok video URL
     */
    isValidTikTokUrl(url: string): boolean;
    /**
     * Get user information by username
     * Note: This endpoint requires a video URL to extract user info
     * For username-based lookup, we return a helpful error message
     * @param username - TikTok ユーザー名（@記号なし）
     */
    getUserInfoByUsername(username: string): Promise<{
        username: string;
        nickname: string;
        avatarUrl: string;
        followerCount: number;
        followingCount: number;
        videoCount: number;
        bio: string;
        note: string;
        profileUrl: string;
    }>;
    /**
     * Get multiple videos from a user and calculate statistics
     * Note: The current RapidAPI endpoint only works with video URLs
     * @param username - TikTok ユーザー名
     * @param maxVideos - 最大取得動画数（デフォルト: 10）
     */
    getUserVideosStats(username: string, maxVideos?: number): Promise<{
        totalVideos: number;
        totalViews: number;
        totalLikes: number;
        totalComments: number;
        averageEngagementRate: number;
        videos: any[];
        note: string;
        username: string;
        instruction: string;
    }>;
    /**
     * Get user follower list
     * Note: The current RapidAPI endpoint only works with video URLs
     * @param username - TikTok ユーザー名
     */
    getUserFollowerList(username: string): Promise<{
        username: string;
        followerCount: number;
        followingCount: number;
        note: string;
        instruction: string;
    }>;
    /**
     * Search videos by keyword
     * @param keyword - 検索キーワード
     * @param maxResults - 最大結果数（デフォルト: 10）
     */
    searchVideos(keyword: string, maxResults?: number): Promise<{
        keyword: string;
        totalResults: any;
        videos: any;
        note?: undefined;
        instruction?: undefined;
        alternative?: undefined;
    } | {
        keyword: string;
        totalResults: number;
        videos: any[];
        note: string;
        instruction: string;
        alternative: string;
    }>;
}
declare const _default: TikTokService;
export default _default;
//# sourceMappingURL=tiktok.service.d.ts.map