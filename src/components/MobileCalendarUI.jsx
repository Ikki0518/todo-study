import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  ChevronDown, 
  Search, 
  Plus 
} from 'lucide-react';

const MobileCalendarUI = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState('July');
  const [currentWeek, setCurrentWeek] = useState(29);

  // 今日の日付を取得
  const today = new Date();
  const todayDate = today.getDate();

  // 週の日付を取得（3日間表示）
  const getWeekDates = () => {
    const dates = [];
    const startDate = new Date(2025, 6, 15); // July 15, 2025 (参照デザインに合わせて)
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 時間の配列（01:00から06:00まで表示）
  const timeSlots = ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];

  return (
    <div className="bg-white text-gray-900 min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        {/* 左側：ハンバーガーメニューと月 */}
        <div className="flex items-center space-x-4">
          <Menu className="w-6 h-6 text-white" />
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-white">{currentMonth}</h1>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* 中央：週番号 */}
        <div className="text-gray-400 text-sm">
          Week {currentWeek}
        </div>

        {/* 右側：検索と今日の日付 */}
        <div className="flex items-center space-x-3">
          <Search className="w-6 h-6 text-white" />
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">{todayDate}</span>
          </div>
        </div>
      </header>

      {/* タイムゾーン表示 */}
      <div className="px-4 py-2 text-xs text-gray-400">
        GMT+9
      </div>

      {/* 日付ヘッダー */}
      <div className="grid grid-cols-4 bg-gray-900 border-b border-gray-700">
        {/* 空のセル（時間軸用） */}
        <div className="p-3"></div>
        
        {/* 日付セル */}
        {weekDates.map((date, index) => {
          const dayName = dayNames[date.getDay()];
          const dateNum = date.getDate();
          const isToday = dateNum === 16; // 参照デザインでは16日が今日
          
          return (
            <div key={index} className="p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{dayName}</div>
              <div className={`text-sm font-medium ${
                isToday 
                  ? 'bg-red-500 text-white w-8 h-8 rounded-lg flex items-center justify-center mx-auto' 
                  : 'text-white'
              }`}>
                {dateNum}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day 行 */}
      <div className="grid grid-cols-4 border-b border-gray-200 bg-gray-50">
        <div className="p-3 text-xs text-gray-500 border-r border-gray-200">
          All-day
        </div>
        {weekDates.map((_, index) => (
          <div key={index} className="p-3 min-h-[40px] border-r border-gray-700 last:border-r-0">
            {/* All-day イベントがあればここに表示 */}
          </div>
        ))}
      </div>

      {/* タイムグリッド */}
      <div className="flex-1 overflow-auto">
        {timeSlots.map((time, timeIndex) => (
          <div key={timeIndex} className="grid grid-cols-4 border-b border-gray-700">
            {/* 時間ラベル */}
            <div className="p-3 text-xs text-gray-500 border-r border-gray-200 bg-gray-50">
              {time}
            </div>
            
            {/* 時間セル */}
            {weekDates.map((_, dateIndex) => (
              <div
                key={dateIndex}
                className="p-3 min-h-[60px] border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
                onClick={() => {
                  // セルクリック時の処理
                  console.log(`Clicked on ${time} for date ${dateIndex}`);
                }}
              >
                {/* タスクがあればここに表示 */}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="text-center text-gray-500 text-sm mb-4">
          No upcoming meeting
        </div>
        
        {/* フローティングアクションボタン */}
        <div className="fixed bottom-6 right-6">
          <button 
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
            onClick={() => {
              // 新規イベント追加の処理
              console.log('Add new event');
            }}
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MobileCalendarUI;