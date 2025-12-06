import { useState, useCallback } from 'react';
import { searchInfluencers } from '../services/api';

interface SearchFilters {
  query: string;
  category: string;
  prefecture: string;
  platform: string;
  minFollowers: string;
  maxFollowers: string;
  page: number;
  limit: number;
  testLargeData: boolean;
}

export const useInfluencerSearch = () => {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [searchTime, setSearchTime] = useState<number>(0);

  const executeSearch = useCallback(async (filters: SearchFilters) => {
    const startTime = Date.now();
    setLoading(true);
    setError('');

    try {
      const searchParams = {
        ...filters,
        minFollowers: filters.minFollowers ? parseInt(filters.minFollowers) : undefined,
        maxFollowers: filters.maxFollowers ? parseInt(filters.maxFollowers) : undefined,
      };

      const result = await searchInfluencers(searchParams);
      const endTime = Date.now();
      
      setInfluencers(result.influencers || []);
      setPagination(result.pagination || null);
      setPerformance(result.performance || null);
      setSearchTime(endTime - startTime);
      
      return result;
    } catch (err: any) {
      console.error('Search error:', err);
      setError('検索に失敗しました: ' + (err.message || err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToCSV = useCallback((currentInfluencers: any[]) => {
    if (!currentInfluencers || currentInfluencers.length === 0) {
      alert('抽出するデータがありません');
      return;
    }

    // CSVヘッダー（複数SNS対応）
    const headers = [
      '名前',
      '都道府県',
      'カテゴリー',
      'Instagramフォロワー数',
      'Instagramエンゲージメント率',
      'TikTokフォロワー数',
      'TikTokエンゲージメント率',
      'YouTubeフォロワー数',
      'YouTubeエンゲージメント率',
      'Xフォロワー数',
      'Xエンゲージメント率',
      '最低料金',
      '最高料金',
      'プロフィール'
    ];

    // CSVデータを作成
    const csvData = currentInfluencers.map(influencer => {
      const getAccountData = (platform: string) => {
        const account = influencer.socialAccounts?.find((acc: any) => acc.platform === platform);
        return account ? [account.followerCount || 0, account.engagementRate || ''] : [0, ''];
      };

      const [instagramFollowers, instagramEngagement] = getAccountData('Instagram');
      const [tiktokFollowers, tiktokEngagement] = getAccountData('TikTok');
      const [youtubeFollowers, youtubeEngagement] = getAccountData('YouTube');
      const [xFollowers, xEngagement] = getAccountData('X');

      return [
        influencer.displayName || '',
        influencer.prefecture || '',
        influencer.categories?.join(';') || '',
        instagramFollowers,
        instagramEngagement,
        tiktokFollowers,
        tiktokEngagement,
        youtubeFollowers,
        youtubeEngagement,
        xFollowers,
        xEngagement,
        influencer.priceMin || '',
        influencer.priceMax || '',
        (influencer.bio || '').replace(/"/g, '""')
      ];
    });

    // CSVコンテンツを作成
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field}"` 
            : field
        ).join(',')
      )
    ].join('\n');

    // BOMを追加してExcelでの文字化けを防ぐ
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // ファイル名を生成（現在の日時を含む）
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
    link.setAttribute('download', `influencers_${timestamp}.csv`);
    
    // ダウンロードを実行
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportAllToCSV = useCallback(async (filters: SearchFilters, currentPagination: any) => {
    if (!currentPagination) {
      alert('検索を実行してからCSV抽出してください');
      return;
    }

    setLoading(true);
    try {
      // 全データを取得するため、limit を大きく設定
      const allDataParams = {
        ...filters,
        page: 1,
        limit: currentPagination.total, // 全件取得
        minFollowers: filters.minFollowers ? parseInt(filters.minFollowers) : undefined,
        maxFollowers: filters.maxFollowers ? parseInt(filters.maxFollowers) : undefined,
      };

      const result = await searchInfluencers(allDataParams);
      const allInfluencers = result.influencers || [];

      if (allInfluencers.length === 0) {
        alert('抽出するデータがありません');
        return;
      }

      exportToCSV(allInfluencers);
      alert(`${allInfluencers.length}件のデータを抽出しました`);
    } catch (error) {
      console.error('CSV抽出エラー:', error);
      alert('CSV抽出に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [exportToCSV]);

  return {
    influencers,
    loading,
    error,
    pagination,
    performance,
    searchTime,
    executeSearch,
    exportToCSV,
    exportAllToCSV
  };
};