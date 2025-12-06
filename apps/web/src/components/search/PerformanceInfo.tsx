import React from 'react';

interface PerformanceInfoProps {
  searchTime: number;
  pagination?: {
    total: number;
  } | null;
  performance?: {
    responseTime: number;
    cacheHit: boolean;
  } | null;
}

const PerformanceInfo: React.FC<PerformanceInfoProps> = ({
  searchTime,
  pagination,
  performance
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">検索時間</p>
          <p className="text-lg font-bold text-blue-600">{searchTime.toFixed(0)}ms</p>
        </div>
        {pagination && (
          <div className="text-center">
            <p className="text-sm text-gray-600">総件数</p>
            <p className="text-lg font-bold text-green-600">{pagination.total.toLocaleString()}</p>
          </div>
        )}
        {performance && (
          <>
            <div className="text-center">
              <p className="text-sm text-gray-600">サーバー応答時間</p>
              <p className="text-lg font-bold text-purple-600">{performance.responseTime}ms</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">キャッシュ</p>
              <p className={`text-lg font-bold ${performance.cacheHit ? 'text-green-600' : 'text-gray-600'}`}>
                {performance.cacheHit ? 'HIT' : 'MISS'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PerformanceInfo;