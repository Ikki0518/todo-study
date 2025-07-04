import { useState, useEffect } from 'react'

export function MonthlyCalendar({ 
  studyBooks = [], 
  onDateClick, 
  selectedDate,
  studyPlans = {} 
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // 月の最初の日と最後の日を取得
  const getMonthInfo = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 日曜日から開始
    
    const days = []
    const current = new Date(startDate)
    
    // 6週間分の日付を生成（42日）
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return { days, year, month }
  }

  const { days, year, month } = getMonthInfo(currentDate)
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const today = new Date()

  // 前月・次月への移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // 日付のキーを生成
  const getDateKey = (date) => {
    return date.toISOString().split('T')[0]
  }

  // その日の学習計画を取得
  const getDayStudyPlan = (date) => {
    const dateKey = getDateKey(date)
    return studyPlans[dateKey] || []
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          ←
        </button>
        <h2 className="text-xl font-bold">
          {year}年 {monthNames[month]}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          →
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div
            key={index}
            className={`text-center py-2 text-sm font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-px md:gap-1">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month
          const isToday = date.toDateString() === today.toDateString()
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
          const dayStudyPlan = getDayStudyPlan(date)
          const dayOfWeek = date.getDay()

          return (
            <div
              key={index}
              className={`
                min-h-[60px] sm:min-h-[100px] lg:min-h-[120px]
                p-1 sm:p-2 lg:p-3 border border-gray-200 cursor-pointer hover:bg-gray-50
                transition-colors duration-200
                ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                ${isSelected ? 'bg-blue-100 border-blue-500' : ''}
                ${dayOfWeek === 0 ? 'text-red-600' : dayOfWeek === 6 ? 'text-blue-600' : ''}
              `}
              onClick={() => onDateClick && onDateClick(date)}
            >
              <div className={`text-xs sm:text-sm lg:text-base font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {date.getDate()}
              </div>
              
              {/* その日の学習計画を表示 */}
              <div className="space-y-0.5 sm:space-y-1">
                {dayStudyPlan.slice(0, window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 4).map((plan, planIndex) => {
                  const isBookGoal = plan.type === 'book-goal'
                  const maxTitleLength = window.innerWidth < 640 ? 4 : window.innerWidth < 768 ? 6 : window.innerWidth < 1024 ? 8 : 10
                  return (
                    <div
                      key={planIndex}
                      className={`text-[10px] sm:text-xs lg:text-sm p-0.5 sm:p-1 rounded truncate leading-tight ${
                        isBookGoal
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                      title={`${plan.bookTitle}: ${plan.startPage}-${plan.endPage}ページ${isBookGoal ? ' (目標)' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className="truncate">
                          {isBookGoal && <span className="mr-0.5">📚</span>}
                          {plan.bookTitle.length > maxTitleLength
                            ? plan.bookTitle.substring(0, maxTitleLength) + '...'
                            : plan.bookTitle}
                        </span>
                        <span className="text-[9px] sm:text-[10px] opacity-80">
                          {plan.startPage}-{plan.endPage}p
                        </span>
                      </div>
                    </div>
                  )
                })}
                {dayStudyPlan.length > (window.innerWidth < 640 ? 2 : 3) && (
                  <div className="text-[9px] sm:text-xs text-gray-500">
                    +{dayStudyPlan.length - (window.innerWidth < 640 ? 2 : 3)}件
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex items-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded"></div>
          <span>今日</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span>学習計画</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-emerald-100 rounded"></div>
          <span>📚 参考書目標</span>
        </div>
      </div>
    </div>
  )
}