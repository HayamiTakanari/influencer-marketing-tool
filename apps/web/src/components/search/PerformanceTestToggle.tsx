import React from 'react';

interface PerformanceTestToggleProps {
  testLargeData: boolean;
  onToggle: () => void;
}

const PerformanceTestToggle: React.FC<PerformanceTestToggleProps> = ({
  testLargeData,
  onToggle
}) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-yellow-800">パフォーマンステストモード</h3>
          <p className="text-sm text-yellow-700">
            {testLargeData ? '10,000件のデータでテスト中' : '通常モード（50件）'}
          </p>
        </div>
        <button
          onClick={onToggle}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            testLargeData 
              ? 'bg-yellow-600 text-white' 
              : 'bg-yellow-200 text-yellow-800'
          }`}
        >
          {testLargeData ? '通常モードに切り替え' : 'テストモードに切り替え'}
        </button>
      </div>
    </div>
  );
};

export default PerformanceTestToggle;