/**
 * YouTube API Service
 * Provides methods to fetch YouTube channel data and statistics
 */

export class YouTubeService {
  private apiKey: string;
  private apiHost: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_YOUTUBE_KEY || '';
    this.apiHost = process.env.RAPIDAPI_YOUTUBE_HOST || 'youtube-v3-api.p.rapidapi.com';
    this.baseUrl = `https://${this.apiHost}`;
  }

  private ensureApiKey() {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }
  }

  /**
   * Get channel information by username/handle
   * @param username - YouTube チャネルのユーザー名（@記号なし）
   */
  async getChannelInfoByUsername(username: string) {
    try {
      // Return channel profile structure with helpful guidance
      return {
        username: username,
        channelName: username,
        avatarUrl: '',
        subscriberCount: 0,
        videoCount: 0,
        bio: '',
        profileUrl: `https://www.youtube.com/@${username}`,
        note: '【テスト中】YouTube API連携はロードマップに含まれています',
      };
    } catch (error) {
      console.error('YouTube getChannelInfoByUsername error:', error);
      throw error;
    }
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(username: string) {
    try {
      return {
        username: username,
        subscriberCount: 0,
        videoCount: 0,
        viewCount: 0,
        engagementRate: 0,
        note: '【テスト中】YouTube統計取得はロードマップに含まれています',
      };
    } catch (error) {
      console.error('YouTube getChannelStats error:', error);
      throw error;
    }
  }
}

export default new YouTubeService();
