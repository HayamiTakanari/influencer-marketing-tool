interface TikTokUserInfo {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    followerCount: number;
    followingCount: number;
    videoCount: number;
    engagementRate?: number;
    bio?: string;
    verified?: boolean;
    isPrivate?: boolean;
}
/**
 * RapidAPI を使用して TikTok ユーザー情報を取得
 * Chapter 1-6: SNS認証（TikTok）
 */
export declare const getTikTokUserInfo: (username: string) => Promise<TikTokUserInfo>;
/**
 * TikTok アカウントを SocialAccount に保存・更新
 * Chapter 1-6: SNS認証（TikTok）
 */
export declare const saveTikTokAccount: (influencerId: string, accountId: string) => Promise<void>;
/**
 * TikTok アカウント認証情報を取得
 */
export declare const getTikTokAccountStatus: (influencerId: string) => Promise<{
    isVerified: boolean;
    username?: string;
    followerCount?: number;
    verifiedAt?: Date;
}>;
/**
 * TikTok フォロワー数を更新（定期的に実行）
 */
export declare const updateTikTokFollowerCount: (influencerId: string) => Promise<void>;
/**
 * TikTok アカウント認証を削除
 */
export declare const removeTikTokAccount: (influencerId: string) => Promise<void>;
/**
 * エンゲージメント率を計算（補助関数）
 */
export declare const calculateEngagementRate: (username: string, followerCount: number) => Promise<number>;
export {};
//# sourceMappingURL=tiktok-auth.service.d.ts.map