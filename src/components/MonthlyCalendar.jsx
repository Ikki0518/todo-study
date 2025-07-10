import { useState, useEffect } from 'react'
import { convertPlansToTasks } from '../utils/studyPlanGenerator'
import { isPastDate, isToday, isTimeOverdue } from '../utils/overdueTaskDetector'

// ウィンドウサイズを安全に取得するフック
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth })
    }

    window.addEventListener('resize', handleResize)
    handleResize() // 初期値を設定

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

export function MonthlyCalendar({
  studyBooks = [],
  onDateClick,
  selectedDate,
  studyPlans = {},
  completedTasks = {}
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { width: windowWidth } = useWindowSize()
  
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
    const rawPlans = studyPlans[dateKey] || []
    
    // 学習プランをタスクに変換して、タスクプールと一致させる
    const convertedTasks = convertPlansToTasks(rawPlans)
    
    // デバッグログ：変換前後の比較
    if (rawPlans.length > 0) {
      console.log(`📅 月間カレンダー [${dateKey}] データ変換:`)
      console.log('  変換前学習プラン:', rawPlans)
      console.log('  変換後タスク:', convertedTasks)
      
      // 問題ベースの場合の詳細ログ
      rawPlans.forEach((plan, index) => {
        if (plan.studyType === 'problems') {
          const task = convertedTasks[index]
          console.log(`  🧮 問題ベース [${index}] - ${plan.bookTitle}:`)
          console.log('    学習プラン:', {
            startProblem: plan.startProblem,
            endProblem: plan.endProblem,
            problems: plan.problems
          })
          console.log('    変換後タスク:', {
            startProblem: task?.startProblem,
            endProblem: task?.endProblem,
            problems: task?.problems,
            title: task?.title
          })
        }
      })
    }
    
    return convertedTasks
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
                {dayStudyPlan.slice(0, windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4).map((task, taskIndex) => {
                  const isBookGoal = task.type === 'book-goal'
                  const isProblems = task.studyType === 'problems'
                  const maxTitleLength = windowWidth < 640 ? 4 : windowWidth < 768 ? 6 : windowWidth < 1024 ? 8 : 10
                  
                  // 未達成タスクの判定
                  const isCompleted = completedTasks[task.id] || task.completed
                  const isOverdue = !isCompleted && (
                    isPastDate(date) ||
                    (isToday(date) && task.timeSlot && isTimeOverdue(task.timeSlot, date, task.duration || 1))
                  )
                  
                  // 学習タイプに応じてtooltipとラベルを生成
                  const tooltipText = isProblems
                    ? `${task.bookTitle}: ${task.startProblem}-${task.endProblem}問${isBookGoal ? ' (目標)' : ''}${isOverdue ? ' ⚠️未達成' : ''}`
                    : `${task.bookTitle}: ${task.startPage}-${task.endPage}ページ${isBookGoal ? ' (目標)' : ''}${isOverdue ? ' ⚠️未達成' : ''}`
                  
                  const rangeText = isProblems
                    ? `${task.startProblem}-${task.endProblem}問`
                    : `${task.startPage}-${task.endPage}p`
                  
                  // 未達成タスクの場合は赤いスタイリング
                  const taskStyle = isOverdue
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : isBookGoal
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-green-100 text-green-800'
                  
                  return (
                    <div
                      key={taskIndex}
                      className={`text-[10px] sm:text-xs lg:text-sm p-0.5 sm:p-1 rounded truncate leading-tight ${taskStyle}`}
                      title={tooltipText}
                    >
                      <div className="flex flex-col">
                        <span className="truncate">
                          {isOverdue && <span className="mr-0.5">⚠️</span>}
                          {isBookGoal && <span className="mr-0.5">📚</span>}
                          {isProblems && <span className="mr-0.5">🧮</span>}
                          {task.bookTitle.length > maxTitleLength
                            ? task.bookTitle.substring(0, maxTitleLength) + '...'
                            : task.bookTitle}
                        </span>
                        <span className="text-[9px] sm:text-[10px] opacity-80">
                          {rangeText}
                          {isOverdue && <span className="ml-1 text-red-600">未達成</span>}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {dayStudyPlan.length > (windowWidth < 640 ? 2 : 3) && (
                  <div className="text-[9px] sm:text-xs text-gray-500">
                    +{dayStudyPlan.length - (windowWidth < 640 ? 2 : 3)}件
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600">
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
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span>⚠️ 未達成タスク</span>
        </div>
      </div>
    </div>
  )
}