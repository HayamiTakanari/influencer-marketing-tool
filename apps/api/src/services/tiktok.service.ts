/**
 * TikTok API Service
 * Uses RapidAPI's TikTok Video No Watermark API
 */

export class TikTokService {
  private apiKey: string;
  private apiHost: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_TIKTOK_KEY || '';
    this.apiHost = process.env.RAPIDAPI_TIKTOK_HOST || 'tiktok-video-no-watermark2.p.rapidapi.com';
    this.baseUrl = `https://${this.apiHost}`;
  }

  private ensureApiKey() {
    if (!this.apiKey) {
      throw new Error('TikTok API key not configured');
    }
  }

  /**
   * Get video information from TikTok URL
   * @param videoUrl - Full TikTok video URL
   * @returns Video data including metadata, stats, and author info
   */
  async getVideoInfo(videoUrl: string) {
    try {
      this.ensureApiKey();

      const response = await fetch(
        `${this.baseUrl}/?url=${encodeURIComponent(videoUrl)}&hd=1`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': this.apiHost,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`TikTok API error: ${data.msg}`);
      }

      return this.formatVideoData(data.data);
    } catch (error) {
      console.error('TikTok API error:', error);
      throw error;
    }
  }

  /**
   * Extract username from TikTok URL
   * @param videoUrl - TikTok video URL
   * @returns Username if found, null otherwise
   */
  extractUsernameFromUrl(videoUrl: string): string | null {
    try {
      const url = new URL(videoUrl);
      const match = url.pathname.match(/@([a-zA-Z0-9._-]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting username:', error);
      return null;
    }
  }

  /**
   * Get user profile information (from video author data)
   * @param videoUrl - TikTok video URL to extract author info
   * @returns User profile information
   */
  async getUserInfo(videoUrl: string) {
    try {
      const videoData = await this.getVideoInfo(videoUrl);

      return {
        username: videoData.author.unique_id,
        nickname: videoData.author.nickname,
        avatarUrl: videoData.author.avatarUrl,
      };
    } catch (error) {
      console.error('TikTok getUserInfo error:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement rate from video stats
   * @param videoData - Video data with metrics
   * @returns Engagement rate as percentage
   */
  calculateEngagementRate(videoData: any): number {
    try {
      const {
        play_count = 0,
        digg_count = 0,
        comment_count = 0,
      } = videoData;

      const totalEngagement = digg_count + comment_count;
      const viewCount = play_count;

      if (viewCount === 0) return 0;

      return (totalEngagement / viewCount) * 100;
    } catch (error) {
      console.error('Error calculating engagement rate:', error);
      return 0;
    }
  }

  /**
   * Format raw TikTok API response to standardized format
   * @param rawData - Raw response from TikTok API
   * @returns Formatted video data
   */
  private formatVideoData(rawData: any) {
    const {
      aweme_id,
      title,
      cover,
      origin_cover,
      play,
      wmplay,
      music,
      play_count,
      digg_count,
      comment_count,
      create_time,
      author,
      region,
    } = rawData;

    const engagementRate = this.calculateEngagementRate(rawData);

    return {
      id: aweme_id,
      title,
      description: title,
      coverUrl: cover,
      originCoverUrl: origin_cover,
      videoUrl: play,
      watermarkVideoUrl: wmplay,
      musicUrl: music,
      stats: {
        viewCount: play_count || 0,
        likeCount: digg_count || 0,
        commentCount: comment_count || 0,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
      },
      createdAt: new Date(create_time * 1000),
      region,
      author: {
        unique_id: author.unique_id,
        nickname: author.nickname,
        avatarUrl: author.avatar,
      },
      downloadableUrl: play, // Video without watermark
    };
  }

  /**
   * Get multiple video statistics from a single video
   * Useful for analyzing influencer content
   */
  async getVideoStatistics(videoUrl: string) {
    try {
      const videoData = await this.getVideoInfo(videoUrl);

      return {
        videoId: videoData.id,
        title: videoData.title,
        stats: videoData.stats,
        author: videoData.author,
        createdAt: videoData.createdAt,
      };
    } catch (error) {
      console.error('TikTok getVideoStatistics error:', error);
      throw error;
    }
  }

  /**
   * Validate if URL is a valid TikTok video URL
   */
  isValidTikTokUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes('tiktok.com') &&
        urlObj.pathname.includes('/video/')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get user information by username
   * Note: This endpoint requires a video URL to extract user info
   * For username-based lookup, we return a helpful error message
   * @param username - TikTok ユーザー名（@記号なし）
   */
  async getUserInfoByUsername(username: string) {
    try {
      // Construct a typical TikTok profile URL from username
      const profileUrl = `https://www.tiktok.com/@${username}`;

      // Note: The current RapidAPI endpoint only works with video URLs
      // Return a user-friendly message with instructions
      return {
        username: username,
        nickname: username,
        avatarUrl: '',
        followerCount: 0,
        followingCount: 0,
        videoCount: 0,
        bio: '',
        note: '【テスト中】TikTok API連携はロードマップに含まれています',
        profileUrl: profileUrl,
      };
    } catch (error) {
      console.error('TikTok getUserInfoByUsername error:', error);
      throw error;
    }
  }

  /**
   * Get multiple videos from a user and calculate statistics
   * Note: The current RapidAPI endpoint only works with video URLs
   * @param username - TikTok ユーザー名
   * @param maxVideos - 最大取得動画数（デフォルト: 10）
   */
  async getUserVideosStats(username: string, maxVideos: number = 10) {
    try {
      this.ensureApiKey();

      // Return helpful message since RapidAPI endpoint doesn't support username-based queries
      return {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        averageEngagementRate: 0,
        videos: [],
        note: 'To get video statistics, provide individual video URLs using the /video-info endpoint',
        username: username,
        instruction: 'Fetch multiple video URLs from @' + username + ' and use /video-info for each to aggregate statistics',
      };
    } catch (error) {
      console.error('TikTok getUserVideosStats error:', error);
      throw error;
    }
  }

  /**
   * Get user follower list
   * Note: The current RapidAPI endpoint only works with video URLs
   * @param username - TikTok ユーザー名
   */
  async getUserFollowerList(username: string) {
    try {
      this.ensureApiKey();

      // Return helpful message since RapidAPI endpoint doesn't support username-based queries
      return {
        username: username,
        followerCount: 0,
        followingCount: 0,
        note: 'Follower data requires a video URL from this user',
        instruction: 'Use a video URL from @' + username + ' with /video-info to extract author follower information',
      };
    } catch (error) {
      console.error('TikTok getUserFollowerList error:', error);
      throw error;
    }
  }

  /**
   * Search videos by keyword
   * @param keyword - 検索キーワード
   * @param maxResults - 最大結果数（デフォルト: 10）
   */
  async searchVideos(keyword: string, maxResults: number = 10) {
    try {
      this.ensureApiKey();

      const response = await fetch(
        `${this.baseUrl}?keywords=${encodeURIComponent(keyword)}&count=${maxResults}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': this.apiHost,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`TikTok API error: ${data.msg}`);
      }

      const videos = Array.isArray(data.data) ? data.data : [data.data];

      return {
        keyword,
        totalResults: videos.length,
        videos: videos.map((video: any) => ({
          id: video.aweme_id,
          title: video.title,
          author: {
            username: video.author?.unique_id,
            nickname: video.author?.nickname,
            avatarUrl: video.author?.avatar,
          },
          stats: {
            viewCount: video.play_count || 0,
            likeCount: video.digg_count || 0,
            commentCount: video.comment_count || 0,
            engagementRate: this.calculateEngagementRate(video),
          },
          coverUrl: video.cover,
          videoUrl: video.play,
        })),
      };
    } catch (error: any) {
      console.error('TikTok searchVideos error:', error);
      // Return helpful message instead of failing
      return {
        keyword,
        totalResults: 0,
        videos: [],
        note: 'Keyword search is not available with the current RapidAPI endpoint',
        instruction: 'Use individual video URLs with /video-info or visit TikTok.com to search',
        alternative: 'For searching TikTok videos, consider using the official TikTok API or web scraping approach',
      };
    }
  }
}

export default new TikTokService();
