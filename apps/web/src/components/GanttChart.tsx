import React, { useState, useMemo } from 'react';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  custom_class?: string;
  projectTitle?: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode?: 'Day' | 'Week' | 'Month';
  onTaskClick?: (task: GanttTask) => void;
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
  readOnly?: boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  viewMode = 'Day',
  onTaskClick,
  onDateChange,
  onProgressChange,
  readOnly = false
}) => {
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const { dateRange, dayWidth } = useMemo(() => {
    if (tasks.length === 0) {
      // タスクがない場合でも今日から30日分表示
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateRange = eachDayOfInterval({ 
        start: today, 
        end: addDays(today, 30) 
      });
      return { dateRange, dayWidth: 40 };
    }

    const allDates = tasks.flatMap(task => [new Date(task.start), new Date(task.end)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // 今日の日付を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 表示開始日を今日にし、終了日はタスクの最大日付＋7日後またはより遠い日付
    const rangeStart = today;
    const rangeEnd = addDays(new Date(Math.max(maxDate.getTime(), addDays(today, 30).getTime())), 7);

    let dateRange: Date[] = [];
    let dayWidth = 30;

    if (currentViewMode === 'Day') {
      dateRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      dayWidth = 50; // 日表示の幅を少し広く
    } else if (currentViewMode === 'Week') {
      // 週表示：今日から始まる週単位の日付を生成
      dateRange = [];
      let current = rangeStart;
      while (current <= rangeEnd) {
        dateRange.push(new Date(current));
        current = addDays(current, 7);
      }
      dayWidth = 80;
    } else { // Month
      // 月表示：今日から始まる月単位の日付を生成
      const months: Date[] = [];
      let current = startOfMonth(rangeStart);
      // 今日が月の途中の場合、今日の月から開始
      if (rangeStart.getDate() > 1) {
        months.push(rangeStart);
        current = startOfMonth(addDays(endOfMonth(rangeStart), 1));
      }
      while (current <= endOfMonth(rangeEnd)) {
        months.push(current);
        current = startOfMonth(addDays(endOfMonth(current), 1));
      }
      dateRange = months;
      dayWidth = 120;
    }

    return { dateRange, dayWidth };
  }, [tasks, currentViewMode]);

  const getTaskPosition = (task: GanttTask) => {
    if (dateRange.length === 0) return { left: 0, width: 0 };

    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);
    const rangeStart = dateRange[0];

    let startOffset = 0;
    let taskWidth = 0;

    if (currentViewMode === 'Day') {
      startOffset = differenceInDays(taskStart, rangeStart) * dayWidth;
      taskWidth = Math.max(differenceInDays(taskEnd, taskStart) * dayWidth, dayWidth / 2);
    } else if (currentViewMode === 'Week') {
      startOffset = Math.floor(differenceInDays(taskStart, rangeStart) / 7) * dayWidth;
      taskWidth = Math.max(Math.ceil(differenceInDays(taskEnd, taskStart) / 7) * dayWidth, dayWidth / 2);
    } else { // Month
      const startMonthIndex = dateRange.findIndex(date => 
        taskStart >= date && taskStart < addDays(endOfMonth(date), 1)
      );
      const endMonthIndex = dateRange.findIndex(date => 
        taskEnd >= date && taskEnd < addDays(endOfMonth(date), 1)
      );
      startOffset = (startMonthIndex >= 0 ? startMonthIndex : 0) * dayWidth;
      taskWidth = Math.max(((endMonthIndex >= 0 ? endMonthIndex : dateRange.length - 1) - (startMonthIndex >= 0 ? startMonthIndex : 0) + 1) * dayWidth, dayWidth / 2);
    }

    return { left: Math.max(0, startOffset), width: Math.max(taskWidth, 20) };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, 'yyyy/MM/dd')} - ${format(endDate, 'yyyy/MM/dd')}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0: 日曜日, 6: 土曜日
  };

  const getDateDisplayClass = (date: Date) => {
    if (isToday(date)) {
      return 'bg-blue-100 text-blue-800 border-blue-400';
    } else if (isWeekend(date)) {
      return 'bg-red-50 text-red-700 border-red-200';
    } else {
      return 'text-gray-600';
    }
  };

  const totalWidth = dateRange.length * dayWidth;

  return (
    <div className="gantt-container bg-white rounded-lg border overflow-hidden">
      {/* ビューモード切り替えボタン */}
      <div className="p-4 border-b bg-gray-50 flex space-x-2 flex-wrap">
        {(['Day', 'Week', 'Month'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setCurrentViewMode(mode)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              currentViewMode === mode
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {mode === 'Day' ? '日' : mode === 'Week' ? '週' : '月'}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
            </svg>
          </div>
          <p>表示するタスクがありません</p>
        </div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: '600px' }}>
          {/* ヘッダー（日付軸） */}
          <div className="sticky top-0 bg-gray-100 border-b z-10">
            <div className="flex" style={{ minWidth: `${Math.max(totalWidth, 800)}px` }}>
              <div className="w-64 p-2 border-r bg-gray-200 font-semibold text-sm">
                タスク名
              </div>
              <div className="flex-1 relative">
                {dateRange.map((date, index) => (
                  <div
                    key={index}
                    className={`absolute top-0 bottom-0 border-r border-gray-300 p-2 text-xs font-medium ${getDateDisplayClass(date)}`}
                    style={{ 
                      left: index * dayWidth, 
                      width: dayWidth,
                      minHeight: '40px'
                    }}
                  >
                    <div className="flex flex-col items-center">
                      {currentViewMode === 'Day' && (
                        <>
                          <div className="font-semibold">{format(date, 'M/d')}</div>
                          <div className="text-xs">{format(date, 'E')}</div>
                          {isToday(date) && <div className="text-xs text-blue-600">今日</div>}
                          {isWeekend(date) && !isToday(date) && (
                            <div className="text-xs text-red-600">
                              {date.getDay() === 0 ? '日' : '土'}
                            </div>
                          )}
                        </>
                      )}
                      {currentViewMode === 'Week' && (
                        <>
                          <div className="font-semibold">{format(date, 'M/d')}</div>
                          <div className="text-xs">週</div>
                          {isToday(date) && <div className="text-xs text-blue-600">今日</div>}
                        </>
                      )}
                      {currentViewMode === 'Month' && (
                        <>
                          <div className="font-semibold">{format(date, 'yyyy/M')}</div>
                          {isToday(date) && <div className="text-xs text-blue-600">今月</div>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* タスク行 */}
          <div>
            {tasks.map((task, taskIndex) => {
              const position = getTaskPosition(task);
              const statusColor = getStatusColor(task.custom_class);

              return (
                <div
                  key={task.id}
                  className={`flex border-b hover:bg-gray-50 ${taskIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  style={{ minWidth: `${Math.max(totalWidth, 800)}px` }}
                >
                  {/* タスク名列 */}
                  <div className="w-64 p-3 border-r bg-white sticky left-0 z-5">
                    <div className="font-medium text-sm text-gray-800 truncate" title={task.name}>
                      {task.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.projectTitle && (
                        <div className="text-blue-600 font-medium mb-1 truncate">
                          📁 {task.projectTitle}
                        </div>
                      )}
                      {formatDateRange(task.start, task.end)}
                    </div>
                  </div>

                  {/* ガントバー表示領域 */}
                  <div className="flex-1 relative" style={{ height: '60px' }}>
                    {/* グリッド線 */}
                    {dateRange.map((date, index) => (
                      <div
                        key={index}
                        className={`absolute top-0 bottom-0 border-r ${
                          isToday(date) 
                            ? 'border-blue-400 bg-blue-50 border-r-2' 
                            : isWeekend(date)
                            ? 'border-red-200 bg-red-25'
                            : 'border-gray-200'
                        }`}
                        style={{ left: index * dayWidth, width: isToday(date) ? 2 : 1 }}
                      />
                    ))}

                    {/* タスクバー */}
                    <div
                      className={`absolute top-2 bottom-2 ${statusColor} rounded shadow-sm cursor-pointer hover:shadow-md transition-all ${
                        hoveredTask === task.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                      style={{
                        left: `${position.left}px`,
                        width: `${position.width}px`,
                        minWidth: '20px'
                      }}
                      onClick={() => onTaskClick?.(task)}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                      title={`${task.name}\n${formatDateRange(task.start, task.end)}\n進捗: ${task.progress}%`}
                    >
                      {/* 進捗バー */}
                      {task.progress > 0 && (
                        <div
                          className="h-full bg-white bg-opacity-30 rounded-l"
                          style={{ width: `${Math.min(task.progress, 100)}%` }}
                        />
                      )}

                      {/* タスク名（バー内） */}
                      {position.width > 80 && (
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-white text-xs font-medium truncate">
                            {task.name}
                          </span>
                        </div>
                      )}

                      {/* 進捗テキスト */}
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 bg-white px-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                        {task.progress}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 凡例 */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="text-sm text-gray-600 mb-2 font-medium">進捗状況:</div>
        <div className="flex space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>完了済み</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>進行中</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>未開始</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;