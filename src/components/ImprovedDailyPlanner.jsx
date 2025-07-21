import { useState, useEffect } from 'react'
import { isTimeOverdue } from '../utils/overdueTaskDetector'

export const ImprovedDailyPlanner = ({
  currentStreak,
  todayString,
  weekOffset,
  setWeekOffset,
  dailyTaskPool,
  todayTasks,
  setDailyTaskPool,
  setTodayTasks,
  handleTaskDragStart,
  selectedDate,
  scheduledTasks,
  setScheduledTasks,
  completedTasks,
  handleDragOver,
  handleDrop,
  handleTaskClick,
  toggleTaskComplete,
  getPriorityColor,
  handleDragStart,
  DailyTaskPool,
  // タッチイベント用
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  isDragging,
  draggedTask,
  // 学習計画とタスク変換関数
  studyPlans,
  convertPlansToTasks
}) => {
  const [isMobile, setIsMobile] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint - より小さい画面でモバイル判定
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 現在時刻を1秒ごとに更新（最高精度）
  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(new Date())
    }
    
    // 初回実行
    updateCurrentTime()
    
    // 1秒ごとに更新（最高精度）
    const interval = setInterval(updateCurrentTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // 現在時刻の位置を計算（ピクセル単位）
  const getCurrentTimePosition = () => {
    const now = currentTime
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    
    // 各時間行の高さは50px
    // 重要：時間行の基準点は行の上端（例：12:00行は600px位置から開始）
    // 12:30 = 12:00行の中央 = 600px + 25px = 625px
    // 12:35 = 12:00行の70%位置 = 600px + 35px = 635px
    
    const hourPosition = hours * 50  // 時間行の開始位置（上端）
    const totalMinutes = minutes + (seconds / 60)  // 秒を含む分の値
    
    // 重要：分の位置計算を修正
    // 60分 = 50px（1時間行の高さ）なので、1分 = 50/60 = 0.833...px
    const minutePosition = totalMinutes * (50 / 60)  // 直接的な分→ピクセル変換
    const totalPosition = hourPosition + minutePosition
    
    // 詳細デバッグログ
    console.log(`=== 現在時刻インジケーター位置計算（修正版） ===`)
    console.log(`デバイス: ${isMobile ? 'モバイル' : 'デスクトップ'}`)
    console.log(`現在時刻: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    console.log(`計算詳細:`)
    console.log(`  - 時間行開始位置: ${hours}時 × 50px = ${hourPosition}px`)
    console.log(`  - 分の値（秒含む）: ${totalMinutes.toFixed(2)}分`)
    console.log(`  - 分のピクセル位置: ${totalMinutes.toFixed(2)} × (50/60) = ${minutePosition.toFixed(2)}px`)
    console.log(`  - 合計位置: ${hourPosition} + ${minutePosition.toFixed(2)} = ${totalPosition.toFixed(2)}px`)
    
    // 検証用計算
    const expectedPercentage = (totalMinutes / 60) * 100
    console.log(`検証: ${hours}時間目の${expectedPercentage.toFixed(2)}%位置`)
    console.log(`検証: 30分なら25px、35分なら${(35 * 50/60).toFixed(2)}px追加されるべき`)
    
    // 25時間グリッドの範囲（0-1249px）を超えないように制限
    const maxPosition = (25 * 50) - 1 // 1249px
    const finalPosition = Math.min(totalPosition, maxPosition)
    
    console.log(`最終位置: ${finalPosition.toFixed(2)}px`)
    
    return finalPosition
  }

  // 現在時刻の文字列を取得
  const getCurrentTimeString = () => {
    const now = currentTime
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 現在時刻が25時間グリッド内にあるかチェック
  const isCurrentTimeInGrid = () => {
    const now = currentTime
    const hours = now.getHours()
    // 0-23時の範囲内かチェック（24時間表示なので23時まで）
    return hours >= 0 && hours <= 23
  }

  // 日付の取得関数を改善
  const getDates = () => {
    const today = new Date()
    const dates = []
    
    if (isMobile) {
      // モバイル: 今日から2日後まで（3日間）
      for (let i = 0; i < 3; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date)
      }
    } else {
      // PC: 週間表示（weekOffsetを考慮）
      const dayOfWeek = today.getDay()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7))
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        dates.push(date)
      }
    }
    
    return dates
  }

  // 旧コード（削除予定）
  const getOldDates = () => {
    const today = new Date()
    const dates = []
    
    if (false) { // 無効化
      // PC: 週間表示（今日を含む週）
      const dayOfWeek = today.getDay()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7))
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        dates.push(date)
      }
    }
    
    return dates
  }

  const dates = getDates()
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  // 週間表示で現在表示されている週の今日に対応するタスクを計算
  const getCurrentWeekTodayTasks = () => {
    if (isMobile || !studyPlans || !convertPlansToTasks) {
      return todayTasks
    }

    // 現在表示されている週の今日の曜日に対応する日付を取得
    const realToday = new Date()
    const realTodayDayOfWeek = realToday.getDay()
    
    // 表示されている週の開始日（日曜日）を計算
    const today = new Date()
    const todayDayOfWeek = today.getDay()
    const startOfCurrentWeek = new Date(today)
    startOfCurrentWeek.setDate(today.getDate() - todayDayOfWeek + (weekOffset * 7))
    
    // 表示されている週の今日の曜日に対応する日付を計算
    const displayedToday = new Date(startOfCurrentWeek)
    displayedToday.setDate(startOfCurrentWeek.getDate() + realTodayDayOfWeek)
    
    const todayKey = displayedToday.toISOString().split('T')[0]
    const dayPlans = studyPlans[todayKey] || []
    const tasksFromCalendar = convertPlansToTasks(dayPlans)
    
    // 実際の今日の場合は既存のtodayTasksを使用、それ以外は計算されたタスクを使用
    const realTodayKey = realToday.toISOString().split('T')[0]
    if (todayKey === realTodayKey) {
      return todayTasks
    } else {
      return tasksFromCalendar
    }
  }

  const currentWeekTodayTasks = getCurrentWeekTodayTasks()

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 固定ヘッダー */}
      <div className="flex-shrink-0 px-4 pt-4 pb-4 bg-white border-b border-gray-200">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
          {isMobile ? 'デイリープランナー' : '週間プランナー'}
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-4">
            <span className="text-base sm:text-lg lg:text-xl font-medium text-gray-700">{todayString}</span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 lg:px-4 lg:py-2 rounded-full text-sm lg:text-base font-semibold w-fit">
              🔥 {currentStreak}日連続！
            </span>
          </div>
          {!isMobile && (
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="px-2 py-1 sm:px-3 lg:px-4 lg:py-2 border rounded hover:bg-gray-100 text-sm sm:text-base"
              >
                ← 前週
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className={`px-2 py-1 sm:px-3 lg:px-4 lg:py-2 rounded text-sm sm:text-base ${weekOffset === 0 ? 'bg-blue-500 text-white' : 'border hover:bg-gray-100'}`}
              >
                今週
              </button>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="px-2 py-1 sm:px-3 lg:px-4 lg:py-2 border rounded hover:bg-gray-100 text-sm sm:text-base"
              >
                次週 →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 px-4 py-4 min-h-0">
        <div className="lg:col-span-3 flex-shrink-0">
          <DailyTaskPool
            dailyTasks={currentWeekTodayTasks}
            onTasksUpdate={setTodayTasks}
            onTaskDragStart={handleTaskDragStart}
            selectedDate={selectedDate}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          />
        </div>

        <div className="lg:col-span-9 bg-white rounded-lg shadow overflow-hidden planner-grid flex-1 min-h-0" style={{ position: 'relative' }}>
          {/* 現在時刻インジケーター - 完全独立レイヤー（最上位） */}
          {isCurrentTimeInGrid() && (
            <div
              className="absolute pointer-events-none"
              style={{
                top: `${getCurrentTimePosition() + 60}px`, // ヘッダー分のオフセット追加
                left: isMobile ? '60px' : '60px',
                right: '0px',
                height: '2px',
                zIndex: 99999  // 絶対最高優先度
              }}
            >
              <div
                className="calendar-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? `60px repeat(3, 1fr)`
                    : `60px repeat(7, 1fr)`,
                  height: '2px',
                  zIndex: 99999
                }}
              >
                {/* 時間列のスペース */}
                <div className="relative" style={{ zIndex: 99999 }}>
                  <div className="absolute right-2 -top-3 text-xs font-semibold text-blue-600 bg-white px-1 rounded shadow-sm" style={{ zIndex: 99999 }}>
                    {getCurrentTimeString()}
                  </div>
                </div>
                
                {/* 各日付列 - 全ての列に青い線を表示 */}
                {dates.map((date, dateIndex) => {
                  return (
                    <div key={dateIndex} className="relative" style={{ zIndex: 99999 }}>
                      <div className="absolute inset-0 bg-blue-500 h-0.5 shadow-lg" style={{ zIndex: 99999 }}>
                        {dateIndex === 0 && (
                          <div className="absolute left-0 -top-1 w-2 h-2 bg-blue-500 rounded-full" style={{ zIndex: 99999 }}></div>
                        )}
                        {dateIndex === dates.length - 1 && (
                          <div className="absolute right-0 -top-1 w-2 h-2 bg-blue-500 rounded-full" style={{ zIndex: 99999 }}></div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 固定ヘッダー（日付） */}
          <div className="planner-header" style={{ position: 'relative', zIndex: 1 }}>
            <div className="custom-scrollbar">
              <div
                className={`calendar-grid ${isMobile ? 'w-full' : 'min-w-[600px]'}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? `60px repeat(3, 1fr)`
                    : `60px repeat(7, 1fr)`,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <div className="calendar-cell p-2 text-center text-responsive-xs font-medium bg-gray-50"></div>
                {dates.map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString()
                  const day = date.getDate()
                  const month = date.getMonth() + 1
                  return (
                    <div
                      key={index}
                      className={`calendar-cell p-2 text-center ${isMobile ? 'mobile-grid-cell' : ''} ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}
                    >
                      <div className="text-responsive-xs text-gray-500">
                        {dayNames[date.getDay()]}
                      </div>
                      <div className={`text-responsive-sm font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                        {isMobile ? `${month}/${day}` : day}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* スクロール可能な時間グリッド */}
          <div className="planner-body custom-scrollbar" style={{ position: 'relative', height: 'calc(100vh - 200px)', overflowY: 'scroll', overflowX: 'hidden', flex: '1 1 auto', maxHeight: 'none' }}>
            <div className={`planner-content ${isMobile ? 'w-full' : 'min-w-[600px]'}`} style={{ height: '1250px', minHeight: '1250px', maxHeight: 'none', display: 'block' }}>
              {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map((hour) => {
                // 本番環境対応: 明示的な25時間配列 - 絶対に切り捨てられない
                console.log(`🕐 EXPLICIT HOUR RENDERING: ${hour} (${hour === 24 ? '24:00' : hour.toString().padStart(2, '0') + ':00'}) - HARDCODED ARRAY`)
                return (
                  <div
                    key={hour}
                    className="calendar-grid"
                    style={{
                      display: 'grid !important',
                      gridTemplateColumns: isMobile
                        ? `60px repeat(3, 1fr)`
                        : `60px repeat(7, 1fr)`,
                      minHeight: '50px !important',
                      height: '50px !important',
                      flexShrink: '0 !important',
                      visibility: 'visible !important',
                      opacity: '1 !important'
                    }}
                  >
                    <div className="time-column h-[50px] p-2 text-right text-responsive-xs text-gray-500 touch-optimized">
                      {hour === 24 ? '24:00' : hour.toString().padStart(2, '0') + ':00'}
                    </div>
                    {dates.map((date, dateIndex) => {
                      const dateKey = date.toISOString().split('T')[0]
                      const taskKey = `${dateKey}-${hour}`
                      const scheduledTask = scheduledTasks[taskKey]
                      
                      // 他のタスクがこの時間スロットを占有しているかチェック
                      const isOccupiedByOtherTask = () => {
                        for (let checkHour = 0; checkHour < hour; checkHour++) {
                          const checkKey = `${dateKey}-${checkHour}`
                          const checkTask = scheduledTasks[checkKey]
                          if (checkTask && checkTask.duration && checkHour + checkTask.duration > hour) {
                            return true
                          }
                        }
                        return false
                      }
                      
                      const isOccupied = isOccupiedByOtherTask()
                      const isToday = date.toDateString() === new Date().toDateString()
                      
                      // 時間超過タスクの判定（タスク終了から1時間経過）
                      const isTaskOverdue = scheduledTask &&
                                           !completedTasks[taskKey] &&
                                           isToday &&
                                           isTimeOverdue(`${hour}:00`, date, scheduledTask.duration || 1)
                      
                      return (
                        <div
                          key={dateIndex}
                          className={`calendar-cell relative p-1 h-[50px] touch-optimized ${isMobile ? 'mobile-grid-cell' : ''} ${
                            isOccupied ? '' : 'hover:bg-gray-50'
                          } ${isToday ? 'bg-blue-25' : ''} ${isTaskOverdue ? 'bg-red-50' : ''}`}
                          style={{ zIndex: 1 }}  // 日付セルを背景レイヤーに設定
                          onDragOver={!isOccupied ? handleDragOver : undefined}
                          onDrop={!isOccupied ? (e) => handleDrop(e, dateKey, hour) : undefined}
                          onTouchEnd={!isOccupied ? (e) => handleTouchEnd(e, dateKey, hour) : undefined}
                          data-dropzone={!isOccupied ? `${dateKey}-${hour}` : undefined}
                        >
                          {scheduledTask && !isOccupied && (
                            <div
                              className={`scheduled-task absolute p-2 rounded cursor-pointer shadow-md ${
                                completedTasks[taskKey]
                                  ? 'bg-gray-300 text-gray-700'
                                  : isTaskOverdue
                                    ? 'bg-red-500 text-white border-2 border-red-600 hover:bg-red-600'
                                    : `${getPriorityColor(scheduledTask.priority)} text-white hover:opacity-90`
                              }`}
                              style={{
                                height: `${(scheduledTask.duration || 1) * 50 - 2}px`,
                                width: 'calc(100% - 8px)',
                                left: '4px',
                                top: '2px',
                                zIndex: 15  // タスクを日付セルより上に表示
                              }}
                              ref={(el) => {
                                if (el && !completedTasks[taskKey]) {
                                  // タスクドラッグの初期化
                                  const cleanup = initializeTaskDrag(el, {
                                    onDragStart: (coords, e) => {
                                      // ドラッグ開始時の処理
                                      handleDragStart(e, scheduledTask, `scheduled-${taskKey}`)
                                    },
                                    onDragMove: (coords, e) => {
                                      // ドラッグ中の処理
                                      if (handleTouchMove) {
                                        handleTouchMove(e)
                                      }
                                    },
                                    onDragEnd: (coords, e) => {
                                      // ドラッグ終了時の処理
                                      // 必要に応じて追加処理
                                    },
                                    onResizeStart: (coords, e) => {
                                      // リサイズ開始時の処理
                                      const startY = coords.y
                                      const startDuration = scheduledTask.duration || 1
                                      
                                      // リサイズ中の状態を保存
                                      el.dataset.resizeStartY = startY
                                      el.dataset.resizeStartDuration = startDuration
                                    },
                                    onResizeMove: (coords, e) => {
                                      // リサイズ中の処理
                                      const startY = parseFloat(el.dataset.resizeStartY)
                                      const startDuration = parseInt(el.dataset.resizeStartDuration)
                                      const deltaY = coords.y - startY
                                      const hourChange = Math.round(deltaY / 50)
                                      const newDuration = Math.max(1, Math.min(6, startDuration + hourChange))
                                      
                                      setScheduledTasks(prev => ({
                                        ...prev,
                                        [taskKey]: {
                                          ...scheduledTask,
                                          duration: newDuration
                                        }
                                      }))
                                    },
                                    onResizeEnd: (coords, e) => {
                                      // リサイズ終了時の処理
                                      delete el.dataset.resizeStartY
                                      delete el.dataset.resizeStartDuration
                                      
                                      // バイブレーション
                                      if (navigator.vibrate) {
                                        navigator.vibrate(50)
                                      }
                                    }
                                  })
                                  
                                  // クリーンアップ関数を保存
                                  el._dragCleanup = cleanup
                                }
                              }}
                              onClick={(e) => {
                                // クリック処理（チェックボックスとリサイズハンドル以外）
                                if (!e.target.closest('input') && !e.target.closest('.resize-handle')) {
                                  handleTaskClick(scheduledTask, taskKey)
                                }
                              }}
                            >
                              <div className="flex items-start space-x-1">
                                <input
                                  type="checkbox"
                                  checked={completedTasks[taskKey] || false}
                                  onChange={() => toggleTaskComplete(scheduledTask.id, `scheduled-${taskKey}`)}
                                  className="mt-0.5 cursor-pointer flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium text-responsive-xs leading-tight ${completedTasks[taskKey] ? 'line-through' : ''}`}>
                                    {isTaskOverdue && <span className="mr-1">⚠️</span>}
                                    {scheduledTask.title}
                                  </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    {hour.toString().padStart(2, '0')}:00 - {(hour + (scheduledTask.duration || 1)).toString().padStart(2, '0')}:00
                                    {isTaskOverdue && <span className="ml-1 text-red-200">時間超過</span>}
                                  </div>
                                </div>
                              </div>
                              
                              {/* リサイズハンドル */}
                              <div
                                className={`resize-handle absolute bottom-0 right-0 ${isMobile ? 'w-6 h-6' : 'w-3 h-3'} bg-white bg-opacity-30 cursor-se-resize rounded-tl-md`}
                              >
                                <div className="w-full h-full flex items-end justify-end">
                                  <div className="w-2 h-2 border-r-2 border-b-2 border-white opacity-60"></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}