import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar, Trash2 } from 'lucide-react'

export function MobileWeeklyPlanner({
  tasks = [],
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete,
  selectedDate = new Date()
}) {
  const [currentWeek, setCurrentWeek] = useState(0)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [resizingTask, setResizingTask] = useState(null)
  const [touchStartY, setTouchStartY] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [animatingTasks, setAnimatingTasks] = useState(new Set())
  const [dragMode, setDragMode] = useState(null) // 'move', 'resize-top', 'resize-bottom'
  const [initialDragData, setInitialDragData] = useState(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    duration: 1
  })

  const gridRef = useRef(null)
  const HOUR_HEIGHT = 60 // ピクセル単位での1時間の高さ
  const START_HOUR = 6 // 6:00から開始
  const END_HOUR = 23 // 23:00まで
  const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  // 週の日付を取得
  const getWeekDates = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + currentWeek * 7)
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return date
    })
  }

  const weekDates = getWeekDates()
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  // タスクの位置とサイズを計算
  const getTaskStyle = (task) => {
    const startHour = parseInt(task.startTime.split(':')[0])
    const startMinute = parseInt(task.startTime.split(':')[1])
    const top = (startHour - START_HOUR) * HOUR_HEIGHT + (startMinute / 60) * HOUR_HEIGHT
    const height = task.duration * HOUR_HEIGHT

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: '4px',
      right: '4px',
      position: 'absolute'
    }
  }

  // タイムスロットをタップ
  const handleSlotTap = (date, hour) => {
    setSelectedSlot({ date, hour })
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      duration: 1
    })
    setShowTaskModal(true)
  }

  // タスクを追加
  const handleTaskSubmit = () => {
    if (!taskForm.title || !selectedSlot) return

    const newTask = {
      id: Date.now(),
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      date: selectedSlot.date.toISOString().split('T')[0],
      startTime: `${selectedSlot.hour.toString().padStart(2, '0')}:00`,
      duration: taskForm.duration,
      completed: false
    }

    // アニメーション用にタスクIDを追加
    setAnimatingTasks(prev => new Set([...prev, newTask.id]))
    
    onTaskAdd?.(newTask)
    setShowTaskModal(false)
    setSelectedSlot(null)
    
    // アニメーション後にクリーンアップ
    setTimeout(() => {
      setAnimatingTasks(prev => {
        const next = new Set(prev)
        next.delete(newTask.id)
        return next
      })
    }, 300)
  }

  // ドラッグ開始（移動またはリサイズ）
  const handleDragStart = (e, task, mode) => {
    e.stopPropagation()
    e.preventDefault()
    
    const touch = e.touches[0]
    const startY = touch.clientY
    const startHour = parseInt(task.startTime.split(':')[0])
    
    setDraggedTask(task)
    setDragMode(mode)
    setTouchStartY(startY)
    setInitialDragData({
      startHour,
      duration: task.duration,
      startY
    })
    
    // 触覚フィードバック
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  // ドラッグ中の処理
  const handleDragMove = (e) => {
    if (!draggedTask || !dragMode || touchStartY === null || !initialDragData) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - initialDragData.startY
    const hoursDelta = Math.round(deltaY / HOUR_HEIGHT)
    
    const taskElement = document.getElementById(`task-${draggedTask.id}`)
    if (!taskElement) return
    
    taskElement.style.transition = 'none'
    
    if (dragMode === 'move') {
      // タスク全体を移動
      const newStartHour = Math.max(START_HOUR, Math.min(END_HOUR - draggedTask.duration, initialDragData.startHour + hoursDelta))
      const newTop = (newStartHour - START_HOUR) * HOUR_HEIGHT
      taskElement.style.top = `${newTop}px`
      
    } else if (dragMode === 'resize-top') {
      // 上端をドラッグして開始時刻を変更
      const newStartHour = Math.max(START_HOUR, Math.min(initialDragData.startHour + draggedTask.duration - 0.5, initialDragData.startHour + hoursDelta))
      const newDuration = initialDragData.startHour + initialDragData.duration - newStartHour
      const newTop = (newStartHour - START_HOUR) * HOUR_HEIGHT
      
      taskElement.style.top = `${newTop}px`
      taskElement.style.height = `${newDuration * HOUR_HEIGHT}px`
      
    } else if (dragMode === 'resize-bottom') {
      // 下端をドラッグして終了時刻を変更
      const newDuration = Math.max(0.5, Math.min(END_HOUR - initialDragData.startHour, initialDragData.duration + hoursDelta))
      taskElement.style.height = `${newDuration * HOUR_HEIGHT}px`
    }
  }

  // ドラッグ終了
  const handleDragEnd = (e) => {
    // イベントリスナーを削除
    if (dragListenersRef.current.move && dragListenersRef.current.end) {
      document.removeEventListener('touchmove', dragListenersRef.current.move)
      document.removeEventListener('touchend', dragListenersRef.current.end)
      document.removeEventListener('touchcancel', dragListenersRef.current.end)
      dragListenersRef.current = { move: null, end: null }
    }

    if (!draggedTask || !dragMode || touchStartY === null || !initialDragData) {
      // 状態をリセット
      setDraggedTask(null)
      setDragMode(null)
      setTouchStartY(null)
      setInitialDragData(null)
      return
    }

    const currentY = e.changedTouches ? e.changedTouches[0].clientY : e.touches[0].clientY
    const deltaY = currentY - initialDragData.startY
    const hoursDelta = Math.round(deltaY / HOUR_HEIGHT)
    
    let updatedTask = { ...draggedTask }
    
    if (dragMode === 'move') {
      // タスク全体を移動
      const newStartHour = Math.max(START_HOUR, Math.min(END_HOUR - draggedTask.duration, initialDragData.startHour + hoursDelta))
      updatedTask.startTime = `${newStartHour.toString().padStart(2, '0')}:00`
      
    } else if (dragMode === 'resize-top') {
      // 上端をドラッグして開始時刻を変更
      const newStartHour = Math.max(START_HOUR, Math.min(initialDragData.startHour + draggedTask.duration - 0.5, initialDragData.startHour + hoursDelta))
      const newDuration = initialDragData.startHour + initialDragData.duration - newStartHour
      updatedTask.startTime = `${newStartHour.toString().padStart(2, '0')}:00`
      updatedTask.duration = newDuration
      
    } else if (dragMode === 'resize-bottom') {
      // 下端をドラッグして終了時刻を変更
      const newDuration = Math.max(0.5, Math.min(END_HOUR - initialDragData.startHour, initialDragData.duration + hoursDelta))
      updatedTask.duration = newDuration
    }
    
    // タスクが変更された場合のみ更新
    if (updatedTask.startTime !== draggedTask.startTime || updatedTask.duration !== draggedTask.duration) {
      const taskElement = document.getElementById(`task-${draggedTask.id}`)
      if (taskElement) {
        taskElement.style.transition = 'all 0.2s ease-out'
      }
      
      onTaskUpdate?.(updatedTask)
      
      // 触覚フィードバック
      if (navigator.vibrate) {
        navigator.vibrate(20)
      }
    }

    // 状態をリセット
    setDraggedTask(null)
    setDragMode(null)
    setTouchStartY(null)
    setInitialDragData(null)
  }

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      // アンマウント時にイベントリスナーを削除
      if (dragListenersRef.current.move && dragListenersRef.current.end) {
        document.removeEventListener('touchmove', dragListenersRef.current.move)
        document.removeEventListener('touchend', dragListenersRef.current.end)
        document.removeEventListener('touchcancel', dragListenersRef.current.end)
      }
    }
  }, [])

  // タスクをタップして詳細表示
  const handleTaskTap = (task) => {
    setSelectedTask(task)
    setShowTaskDetail(true)
    
    // 触覚フィードバック
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  // タスクを削除
  const handleTaskDelete = () => {
    if (!selectedTask) return
    
    // アニメーション用にタスクIDを追加
    setAnimatingTasks(prev => new Set([...prev, selectedTask.id]))
    
    setTimeout(() => {
      onTaskDelete?.(selectedTask.id)
      setShowTaskDetail(false)
      setSelectedTask(null)
      
      // アニメーション後にクリーンアップ
      setAnimatingTasks(prev => {
        const next = new Set(prev)
        next.delete(selectedTask.id)
        return next
      })
    }, 300)
  }

  // タスクの優先度に応じた色
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    }
    return colors[priority] || colors.medium
  }

  // 現在時刻のインジケーター位置
  const getCurrentTimePosition = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    if (hours < START_HOUR || hours > END_HOUR) return null
    
    const position = (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT
    return position
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">デイリープランナー</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek(currentWeek - 1)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentWeek(0)}
              className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-sm"
            >
              今週
            </button>
            <button
              onClick={() => setCurrentWeek(currentWeek + 1)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString()
            return (
              <div
                key={index}
                className={`text-center py-2 rounded ${
                  isToday ? 'bg-white/30' : ''
                }`}
              >
                <div className="text-xs opacity-80">{dayNames[index]}</div>
                <div className="font-semibold">{date.getDate()}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* タイムグリッド */}
      <div 
        ref={gridRef}
        className="relative overflow-x-auto overflow-y-auto"
        style={{ height: '500px' }}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div className="relative" style={{ minWidth: '700px' }}>
          {/* 時間軸 */}
          <div className="absolute left-0 top-0 w-12 bg-gray-50 z-10">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="h-[60px] border-b border-gray-200 flex items-center justify-center text-xs text-gray-600"
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* グリッド */}
          <div className="ml-12 relative">
            <div className="grid grid-cols-7 relative">
              {weekDates.map((date, dateIndex) => (
                <div key={dateIndex} className="relative">
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="h-[60px] border-b border-r border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSlotTap(date, hour)}
                    />
                  ))}

                  {/* この日のタスク */}
                  {tasks
                    .filter(task => task.date === date.toISOString().split('T')[0])
                    .map(task => (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        className={`${getPriorityColor(task.priority)} text-white rounded-lg cursor-pointer shadow-md transition-all hover:shadow-lg group ${
                          animatingTasks.has(task.id) ? 'animate-fadeIn' : ''
                        } ${draggedTask?.id === task.id ? 'ring-2 ring-white ring-opacity-50 opacity-80' : ''}`}
                        style={{
                          ...getTaskStyle(task),
                          opacity: animatingTasks.has(task.id) ? 0 : 1,
                          transform: animatingTasks.has(task.id) ? 'scale(0.8)' : 'scale(1)',
                          position: 'absolute'
                        }}
                        onClick={() => handleTaskTap(task)}
                      >
                        {/* 上端ドラッグハンドル（開始時刻調整） */}
                        <div
                          className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize touch-target group-hover:bg-white/10 transition-colors"
                          onTouchStart={(e) => handleDragStart(e, task, 'resize-top')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-1 bg-white/70 rounded-full"></div>
                          </div>
                        </div>
                        
                        {/* タスク本体（移動用） */}
                        <div
                          className="p-2 h-full cursor-move"
                          onTouchStart={(e) => handleDragStart(e, task, 'move')}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <div className="font-semibold text-sm truncate">{task.title}</div>
                              {task.duration > 0.5 && (
                                <div className="text-xs opacity-80 mt-1">
                                  {task.startTime} - {
                                    `${(parseInt(task.startTime.split(':')[0]) + task.duration).toString().padStart(2, '0')}:00`
                                  }
                                </div>
                              )}
                            </div>
                            {/* 移動インジケーター */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 下端ドラッグハンドル（終了時刻調整） */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize touch-target group-hover:bg-white/10 transition-colors"
                          onTouchStart={(e) => handleDragStart(e, task, 'resize-bottom')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-1 bg-white/70 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            {/* 現在時刻インジケーター */}
            {getCurrentTimePosition() !== null && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-blue-500 pointer-events-none z-20"
                style={{ top: `${getCurrentTimePosition()}px` }}
              >
                <div className="absolute -left-12 -top-3 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* タスク追加モーダル */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新しいタスクを追加</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タスク名
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="タスクを入力..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="詳細を入力..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    優先度
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時間（時間）
                  </label>
                  <select
                    value={taskForm.duration}
                    onChange={(e) => setTaskForm({ ...taskForm, duration: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0.5">30分</option>
                    <option value="1">1時間</option>
                    <option value="1.5">1.5時間</option>
                    <option value="2">2時間</option>
                    <option value="3">3時間</option>
                    <option value="4">4時間</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleTaskSubmit}
                disabled={!taskForm.title}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* タスク詳細モーダル */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-slideUp">
            <h3 className="text-lg font-semibold mb-4">タスクの詳細</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">タスク名</p>
                <p className="font-medium">{selectedTask.title}</p>
              </div>
              
              {selectedTask.description && (
                <div>
                  <p className="text-sm text-gray-600">説明</p>
                  <p className="text-gray-800">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600">優先度</p>
                  <span className={`inline-block px-2 py-1 rounded text-white text-sm ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority === 'high' ? '高' : selectedTask.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">時間</p>
                  <p className="font-medium">{selectedTask.duration}時間</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">日時</p>
                <p className="font-medium">
                  {new Date(selectedTask.date).toLocaleDateString('ja-JP')} {selectedTask.startTime}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTaskDetail(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                閉じる
              </button>
              <button
                onClick={handleTaskDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                削除
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}