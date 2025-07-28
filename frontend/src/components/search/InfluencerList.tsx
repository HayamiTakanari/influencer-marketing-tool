import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

interface InfluencerListProps {
  influencers: any[];
  filters: {
    platform: string;
  };
}

const InfluencerList: React.FC<InfluencerListProps> = ({ influencers, filters }) => {
  const router = useRouter();

  if (influencers.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 text-center shadow-lg mb-6">
        <div className="text-6xl mb-4">😅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">検索結果がありません</h3>
        <p className="text-gray-600">
          検索条件を変更して再度お試しください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-8">
      {influencers.map((influencer, index) => (
        <motion.div
          key={influencer.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          className="bg-white/90 backdrop-blur-xl rounded-lg shadow hover:shadow-md transition-all"
        >
          <div className="p-4">
            <div className="flex items-center gap-4">
              {/* アイコン */}
              <div 
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => router.push(`/influencer/${influencer.id}`)}
                title={`${influencer.displayName}の詳細を見る`}
              >
                {influencer.displayName?.charAt(0) || 'U'}
              </div>
              
              {/* メイン情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{influencer.displayName}</h3>
                      <span className="text-sm text-gray-500">({influencer.prefecture})</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1 mb-2">{influencer.bio}</p>
                    <div className="space-y-2">
                      {/* カテゴリー */}
                      <div className="flex gap-2">
                        {influencer.categories?.map((category: string, index: number) => (
                          <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {category}
                          </span>
                        ))}
                      </div>
                      {/* ハッシュタグ（使用頻度順に3つ） */}
                      <div className="flex gap-2">
                        {influencer.topHashtags?.slice(0, 3).map((hashtag: string, index: number) => (
                          <span key={index} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            #{hashtag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm mt-2">
                      {/* SNS情報（プラットフォーム別） */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['Instagram', 'TikTok', 'YouTube', 'X'].map(platform => {
                          const account = influencer.socialAccounts?.find((acc: any) => acc.platform === platform);
                          const isSelectedPlatform = filters.platform === platform;
                          
                          if (!account) {
                            return (
                              <div key={platform} className={`flex items-center gap-1 ${isSelectedPlatform ? 'text-gray-600' : 'text-gray-400'}`}>
                                <span className={`w-16 ${isSelectedPlatform ? 'font-semibold' : ''}`}>
                                  {platform}{isSelectedPlatform ? '*' : ''}:
                                </span>
                                <span>-</span>
                              </div>
                            );
                          }
                          return (
                            <div key={platform} className={`flex items-center gap-1 ${isSelectedPlatform ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                              <span className={`${isSelectedPlatform ? 'text-blue-700 font-semibold' : 'text-gray-500'} w-16`}>
                                {platform}{isSelectedPlatform ? '*' : ''}:
                              </span>
                              <span className={`font-semibold ${isSelectedPlatform ? 'text-blue-900' : 'text-gray-900'}`}>
                                {account.followerCount?.toLocaleString()}
                              </span>
                              {account.engagementRate && (
                                <span className={isSelectedPlatform ? 'text-blue-600' : 'text-green-600'}>
                                  ({account.engagementRate}%)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* 右側の情報 */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">料金レンジ</div>
                      <div className="text-sm font-bold text-gray-900">
                        ¥{influencer.priceMin?.toLocaleString()} - ¥{influencer.priceMax?.toLocaleString()}
                      </div>
                    </div>
                    <button 
                      onClick={() => router.push(`/influencer/${influencer.id}`)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md text-sm font-medium hover:shadow-md transition-all"
                    >
                      詳細
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InfluencerList;