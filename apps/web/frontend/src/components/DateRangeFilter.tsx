import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DateRangeFilterProps {
  onDateChange: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateChange,
  initialStartDate = '',
  initialEndDate = ''
}) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const presets = [
    { label: '今日', value: 'today' },
    { label: '昨日', value: 'yesterday' },
    { label: '今週', value: 'thisWeek' },
    { label: '先週', value: 'lastWeek' },
    { label: '今月', value: 'thisMonth' },
    { label: '先月', value: 'lastMonth' },
    { label: '過去7日間', value: 'last7days' },
    { label: '過去30日間', value: 'last30days' },
    { label: '過去90日間', value: 'last90days' },
    { label: '今年', value: 'thisYear' },
  ];

  const getPresetDates = (preset: string): { start: string; end: string } => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    const day = today.getDay();

    switch (preset) {
      case 'today':
        return {
          start: formatDate(today),
          end: formatDate(today)
        };
      
      case 'yesterday':
        const yesterday = new Date(year, month, date - 1);
        return {
          start: formatDate(yesterday),
          end: formatDate(yesterday)
        };
      
      case 'thisWeek':
        const weekStart = new Date(year, month, date - day);
        const weekEnd = new Date(year, month, date + (6 - day));
        return {
          start: formatDate(weekStart),
          end: formatDate(weekEnd)
        };
      
      case 'lastWeek':
        const lastWeekStart = new Date(year, month, date - day - 7);
        const lastWeekEnd = new Date(year, month, date - day - 1);
        return {
          start: formatDate(lastWeekStart),
          end: formatDate(lastWeekEnd)
        };
      
      case 'thisMonth':
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        return {
          start: formatDate(monthStart),
          end: formatDate(monthEnd)
        };
      
      case 'lastMonth':
        const lastMonthStart = new Date(year, month - 1, 1);
        const lastMonthEnd = new Date(year, month, 0);
        return {
          start: formatDate(lastMonthStart),
          end: formatDate(lastMonthEnd)
        };
      
      case 'last7days':
        const sevenDaysAgo = new Date(year, month, date - 7);
        return {
          start: formatDate(sevenDaysAgo),
          end: formatDate(today)
        };
      
      case 'last30days':
        const thirtyDaysAgo = new Date(year, month, date - 30);
        return {
          start: formatDate(thirtyDaysAgo),
          end: formatDate(today)
        };
      
      case 'last90days':
        const ninetyDaysAgo = new Date(year, month, date - 90);
        return {
          start: formatDate(ninetyDaysAgo),
          end: formatDate(today)
        };
      
      case 'thisYear':
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        return {
          start: formatDate(yearStart),
          end: formatDate(yearEnd)
        };
      
      default:
        return { start: '', end: '' };
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    const dates = getPresetDates(preset);
    setStartDate(dates.start);
    setEndDate(dates.end);
    onDateChange(dates.start, dates.end);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setSelectedPreset(null);
    onDateChange(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setSelectedPreset(null);
    onDateChange(startDate, value);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPreset(null);
    onDateChange('', '');
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-4">期間フィルター</h3>
      
      {/* プリセットボタン */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {presets.map((preset) => (
          <motion.button
            key={preset.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePresetClick(preset.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPreset === preset.value
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </motion.button>
        ))}
      </div>
      
      {/* カスタム日付選択 */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-center pt-6">
          <span className="text-gray-500">〜</span>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClear}
          className="mt-6 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          クリア
        </motion.button>
      </div>
      
      {/* 現在の期間表示 */}
      {(startDate || endDate) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            選択期間: {startDate || '指定なし'} 〜 {endDate || '指定なし'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;