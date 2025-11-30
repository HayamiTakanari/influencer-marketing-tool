export declare class TwitterService {
    private client;
    constructor();
    private ensureClient;
    getUserInfo(username: string): Promise<{
        id: string;
        username: string;
        name: string;
        followersCount: number;
        followingCount: number;
        tweetCount: number;
        verified: boolean;
        profileImageUrl: string;
    }>;
    getUserTweets(userId: string, maxResults?: number): Promise<{
        id: any;
        text: any;
        createdAt: any;
        metrics: any;
    }[]>;
    calculateEngagementRate(tweets: any[]): number;
}
export declare class InstagramService {
    private accessToken;
    constructor(accessToken: string);
    getUserInfo(): Promise<any>;
    getUserMedia(limit?: number): Promise<any>;
    calculateEngagementRate(media: any[], followersCount: number): number;
}
export declare class YouTubeService {
    private apiKey;
    constructor();
    getChannelInfo(channelId: string): Promise<{
        id: any;
        title: any;
        description: any;
        subscriberCount: number;
        videoCount: number;
        viewCount: number;
        thumbnailUrl: any;
    }>;
    getChannelVideos(channelId: string, maxResults?: number): Promise<any>;
    getVideoStats(videoId: string): Promise<{
        viewCount: number;
        likeCount: number;
        commentCount: number;
    }>;
    calculateEngagementRate(videos: any[], subscriberCount: number): number;
}
export declare class SNSSyncService {
    private twitterService;
    private youtubeService;
    private tiktokService;
    constructor();
    syncSocialAccount(socialAccountId: string): Promise<{
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        platform: import(".prisma/client").$Enums.Platform;
        username: string;
        profileUrl: string;
        influencerId: string;
        followerCount: number;
        engagementRate: number | null;
        isConnected: boolean;
        lastSynced: Date;
        accessToken: string | null;
        refreshToken: string | null;
        tokenExpiresAt: Date | null;
        platformUserId: string | null;
    }>;
    syncAllInfluencerAccounts(influencerId: string): Promise<{
        total: number;
        successful: number;
        failed: number;
        results: PromiseSettledResult<{
            id: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            platform: import(".prisma/client").$Enums.Platform;
            username: string;
            profileUrl: string;
            influencerId: string;
            followerCount: number;
            engagementRate: number | null;
            isConnected: boolean;
            lastSynced: Date;
            accessToken: string | null;
            refreshToken: string | null;
            tokenExpiresAt: Date | null;
            platformUserId: string | null;
        }>[];
    }>;
    scheduleSyncForAllInfluencers(): Promise<void>;
}
//# sourceMappingURL=sns.service.d.ts.map