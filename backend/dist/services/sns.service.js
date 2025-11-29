"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNSSyncService = exports.YouTubeService = exports.InstagramService = exports.TwitterService = void 0;
const twitter_api_v2_1 = require("twitter-api-v2");
const client_1 = require("@prisma/client");
const tiktok_service_1 = require("./tiktok.service");
const prisma = new client_1.PrismaClient();
// Twitter API service
class TwitterService {
    client = null;
    constructor() {
        if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET) {
            this.client = new twitter_api_v2_1.TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_SECRET,
            });
        }
    }
    ensureClient() {
        if (!this.client) {
            throw new Error('Twitter API credentials not configured');
        }
        return this.client;
    }
    async getUserInfo(username) {
        try {
            const user = await this.ensureClient().v2.userByUsername(username, {
                'user.fields': ['public_metrics', 'verified', 'profile_image_url'],
            });
            return {
                id: user.data?.id,
                username: user.data?.username,
                name: user.data?.name,
                followersCount: user.data?.public_metrics?.followers_count || 0,
                followingCount: user.data?.public_metrics?.following_count || 0,
                tweetCount: user.data?.public_metrics?.tweet_count || 0,
                verified: user.data?.verified || false,
                profileImageUrl: user.data?.profile_image_url,
            };
        }
        catch (error) {
            console.error('Twitter API error:', error);
            throw new Error('Failed to fetch Twitter user info');
        }
    }
    async getUserTweets(userId, maxResults = 10) {
        try {
            const tweets = await this.ensureClient().v2.userTimeline(userId, {
                max_results: maxResults,
                'tweet.fields': ['public_metrics', 'created_at'],
            });
            return tweets.data.data?.map((tweet) => ({
                id: tweet.id,
                text: tweet.text,
                createdAt: tweet.created_at,
                metrics: tweet.public_metrics,
            })) || [];
        }
        catch (error) {
            console.error('Twitter API error:', error);
            throw new Error('Failed to fetch Twitter tweets');
        }
    }
    calculateEngagementRate(tweets) {
        if (tweets.length === 0)
            return 0;
        const totalEngagement = tweets.reduce((sum, tweet) => {
            const likes = tweet.metrics?.like_count || 0;
            const retweets = tweet.metrics?.retweet_count || 0;
            const replies = tweet.metrics?.reply_count || 0;
            return sum + likes + retweets + replies;
        }, 0);
        const totalImpressions = tweets.reduce((sum, tweet) => {
            return sum + (tweet.metrics?.impression_count || 0);
        }, 0);
        return totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;
    }
}
exports.TwitterService = TwitterService;
// Instagram Basic Display API service
class InstagramService {
    accessToken;
    constructor(accessToken) {
        this.accessToken = accessToken;
    }
    async getUserInfo() {
        try {
            const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${this.accessToken}`);
            if (!response.ok) {
                throw new Error('Failed to fetch Instagram user info');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Instagram API error:', error);
            throw new Error('Failed to fetch Instagram user info');
        }
    }
    async getUserMedia(limit = 10) {
        try {
            const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${this.accessToken}`);
            if (!response.ok) {
                throw new Error('Failed to fetch Instagram media');
            }
            const data = await response.json();
            return data.data || [];
        }
        catch (error) {
            console.error('Instagram API error:', error);
            throw new Error('Failed to fetch Instagram media');
        }
    }
    calculateEngagementRate(media, followersCount) {
        if (media.length === 0 || followersCount === 0)
            return 0;
        const totalEngagement = media.reduce((sum, item) => {
            const likes = item.like_count || 0;
            const comments = item.comments_count || 0;
            return sum + likes + comments;
        }, 0);
        const averageEngagement = totalEngagement / media.length;
        return (averageEngagement / followersCount) * 100;
    }
}
exports.InstagramService = InstagramService;
// YouTube Data API service
class YouTubeService {
    apiKey;
    constructor() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
    }
    async getChannelInfo(channelId) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`);
            if (!response.ok) {
                throw new Error('Failed to fetch YouTube channel info');
            }
            const data = await response.json();
            const channel = data.items?.[0];
            if (!channel) {
                throw new Error('Channel not found');
            }
            return {
                id: channel.id,
                title: channel.snippet.title,
                description: channel.snippet.description,
                subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
                videoCount: parseInt(channel.statistics.videoCount || '0'),
                viewCount: parseInt(channel.statistics.viewCount || '0'),
                thumbnailUrl: channel.snippet.thumbnails?.default?.url,
            };
        }
        catch (error) {
            console.error('YouTube API error:', error);
            throw new Error('Failed to fetch YouTube channel info');
        }
    }
    async getChannelVideos(channelId, maxResults = 10) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${this.apiKey}`);
            if (!response.ok) {
                throw new Error('Failed to fetch YouTube videos');
            }
            const data = await response.json();
            return data.items || [];
        }
        catch (error) {
            console.error('YouTube API error:', error);
            throw new Error('Failed to fetch YouTube videos');
        }
    }
    async getVideoStats(videoId) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${this.apiKey}`);
            if (!response.ok) {
                throw new Error('Failed to fetch YouTube video stats');
            }
            const data = await response.json();
            const video = data.items?.[0];
            if (!video) {
                throw new Error('Video not found');
            }
            return {
                viewCount: parseInt(video.statistics.viewCount || '0'),
                likeCount: parseInt(video.statistics.likeCount || '0'),
                commentCount: parseInt(video.statistics.commentCount || '0'),
            };
        }
        catch (error) {
            console.error('YouTube API error:', error);
            throw new Error('Failed to fetch YouTube video stats');
        }
    }
    calculateEngagementRate(videos, subscriberCount) {
        if (videos.length === 0 || subscriberCount === 0)
            return 0;
        const totalEngagement = videos.reduce((sum, video) => {
            const likes = video.likeCount || 0;
            const comments = video.commentCount || 0;
            return sum + likes + comments;
        }, 0);
        const totalViews = videos.reduce((sum, video) => {
            return sum + (video.viewCount || 0);
        }, 0);
        return totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
    }
}
exports.YouTubeService = YouTubeService;
// SNS synchronization service
class SNSSyncService {
    twitterService;
    youtubeService;
    tiktokService;
    constructor() {
        this.twitterService = new TwitterService();
        this.youtubeService = new YouTubeService();
        this.tiktokService = new tiktok_service_1.TikTokService();
    }
    async syncSocialAccount(socialAccountId) {
        try {
            const socialAccount = await prisma.socialAccount.findUnique({
                where: { id: socialAccountId },
            });
            if (!socialAccount) {
                throw new Error('Social account not found');
            }
            let updatedData = {};
            switch (socialAccount.platform) {
                case client_1.Platform.TWITTER:
                    const twitterData = await this.twitterService.getUserInfo(socialAccount.username);
                    const tweets = await this.twitterService.getUserTweets(twitterData.id);
                    const twitterEngagementRate = this.twitterService.calculateEngagementRate(tweets);
                    updatedData = {
                        followerCount: twitterData.followersCount,
                        engagementRate: twitterEngagementRate,
                        isVerified: twitterData.verified,
                    };
                    break;
                case client_1.Platform.YOUTUBE:
                    const channelData = await this.youtubeService.getChannelInfo(socialAccount.username);
                    const videos = await this.youtubeService.getChannelVideos(socialAccount.username);
                    // Get detailed stats for videos
                    const videoStats = await Promise.all(videos.slice(0, 5).map((video) => this.youtubeService.getVideoStats(video.id.videoId)));
                    const youtubeEngagementRate = this.youtubeService.calculateEngagementRate(videoStats, channelData.subscriberCount);
                    updatedData = {
                        followerCount: channelData.subscriberCount,
                        engagementRate: youtubeEngagementRate,
                    };
                    break;
                case client_1.Platform.INSTAGRAM:
                    // Instagram requires user-specific access token
                    // This would be implemented with OAuth flow
                    throw new Error('Instagram sync requires user authentication');
                case client_1.Platform.TIKTOK:
                    // For TikTok, we use the profileUrl to fetch user info
                    // The profileUrl should be a valid TikTok profile URL or video URL
                    try {
                        const tiktokUserInfo = await this.tiktokService.getUserInfo(socialAccount.profileUrl);
                        // Note: The RapidAPI endpoint we're using returns video-level stats
                        // For a more complete implementation, you would need:
                        // 1. TikTok Official API access for complete user stats
                        // 2. Or aggregation of multiple video stats
                        updatedData = {
                            username: tiktokUserInfo.username,
                            // Note: profileUrl will be updated if different
                            // engagementRate would be calculated from videos
                            // For now, we set placeholder values
                            followerCount: 0, // Would need official API for this
                            engagementRate: 0, // Would calculate from multiple videos
                            isVerified: false, // Would need official API for this
                        };
                    }
                    catch (error) {
                        // If single video approach fails, it might be a profile URL
                        // In production, implement proper TikTok profile scraping or use official API
                        console.warn(`TikTok sync warning for ${socialAccount.username}:`, error.message);
                        updatedData = {
                            // Keep existing data if sync fails
                            isVerified: false,
                        };
                    }
                    break;
                default:
                    throw new Error(`Unsupported platform: ${socialAccount.platform}`);
            }
            const updatedSocialAccount = await prisma.socialAccount.update({
                where: { id: socialAccountId },
                data: {
                    ...updatedData,
                    lastSynced: new Date(),
                },
            });
            return updatedSocialAccount;
        }
        catch (error) {
            console.error('Sync social account error:', error);
            throw error;
        }
    }
    async syncAllInfluencerAccounts(influencerId) {
        try {
            const socialAccounts = await prisma.socialAccount.findMany({
                where: { influencerId },
            });
            const results = await Promise.allSettled(socialAccounts.map((account) => this.syncSocialAccount(account.id)));
            const successful = results.filter((result) => result.status === 'fulfilled').length;
            const failed = results.filter((result) => result.status === 'rejected').length;
            return {
                total: socialAccounts.length,
                successful,
                failed,
                results,
            };
        }
        catch (error) {
            console.error('Sync all accounts error:', error);
            throw error;
        }
    }
    async scheduleSyncForAllInfluencers() {
        try {
            const influencers = await prisma.influencer.findMany({
                where: { isRegistered: true },
                include: {
                    socialAccounts: true,
                },
            });
            console.log(`Starting sync for ${influencers.length} influencers`);
            for (const influencer of influencers) {
                try {
                    await this.syncAllInfluencerAccounts(influencer.id);
                    console.log(`Synced accounts for influencer ${influencer.id}`);
                }
                catch (error) {
                    console.error(`Failed to sync influencer ${influencer.id}:`, error);
                }
            }
            console.log('Finished syncing all influencers');
        }
        catch (error) {
            console.error('Schedule sync error:', error);
        }
    }
}
exports.SNSSyncService = SNSSyncService;
