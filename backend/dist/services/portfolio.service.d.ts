import { Portfolio, Platform } from '@prisma/client';
/**
 * ポートフォリオデータ
 * Chapter 1-7: インフルエンサーのポートフォリオ登録
 */
export interface PortfolioData {
    title: string;
    description?: string;
    imageUrl?: string;
    link?: string;
    platform?: Platform;
}
/**
 * ポートフォリオアイテムを作成
 */
export declare const createPortfolioItem: (influencerId: string, portfolioData: PortfolioData) => Promise<Portfolio>;
/**
 * ポートフォリオアイテムを更新
 */
export declare const updatePortfolioItem: (portfolioId: string, influencerId: string, portfolioData: Partial<PortfolioData>) => Promise<Portfolio>;
/**
 * ポートフォリオアイテムを削除
 */
export declare const deletePortfolioItem: (portfolioId: string, influencerId: string) => Promise<void>;
/**
 * インフルエンサーのすべてのポートフォリオを取得
 */
export declare const getPortfolioItems: (influencerId: string, limit?: number, offset?: number) => Promise<{
    items: Portfolio[];
    total: number;
}>;
/**
 * 単一のポートフォリオアイテムを取得
 */
export declare const getPortfolioItem: (portfolioId: string, influencerId?: string) => Promise<Portfolio | null>;
/**
 * ポートフォリオのバリデーション
 */
export declare const validatePortfolioData: (portfolioData: PortfolioData) => string[];
/**
 * ポートフォリオの統計情報を取得
 */
export declare const getPortfolioStats: (influencerId: string) => Promise<{
    total: number;
    byPlatform: {
        platform: import(".prisma/client").$Enums.Platform;
        count: number;
    }[];
}>;
//# sourceMappingURL=portfolio.service.d.ts.map