import { useState } from 'react'
import { MonthlyCalendar } from './MonthlyCalendar'

export function CalendarWithSchedule({
  studyBooks = [],
  studyPlans = {},
  onDateClick,
  selectedDate,
  dailyTasks = [],
  dailyTaskPool,
  onTasksUpdate,　
  onTaskDragStart,
  scheduledTasks,
  completedTasks,
  onDragOver,
  onDrop,
  onTaskComplete,
  onDragStart,
  overdueTasks = []
}) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // 選択された日のタスクを取得
  const getSelectedDateTasks = () => {
    if (!selectedDate) return []
    const dateKey = selectedDate.toISOString().split('T')[0]
    const dayPlans = studyPlans[dateKey] || []
    return dayPlans
  }

  // 時間スロットを生成（15:00-22:00）
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 15; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time: timeString,
          hour,
          minute
        })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()
  const selectedTasks = getSelectedDateTasks()

  // タスクの色を取得（優先順位を優先）
  const getTaskColor = (task) => {
    // 優先順位による色分けを最優先
    if (task.priority) {
      const priorityColors = {
        high: 'bg-red-500',
        medium: 'bg-yellow-500',
        low: 'bg-green-500'
      }
      return priorityColors[task.priority] || priorityColors.medium
    }
    
    // 参考書目標の場合
    if (task.type === 'book-goal') {
      return 'bg-emerald-500'
    }
    
    // カテゴリによる色分け（優先順位がない場合のフォールバック）
    const colors = {
      programming: 'bg-blue-500',
      math: 'bg-purple-500',
      english: 'bg-green-500',
      science: 'bg-yellow-500',
      certification: 'bg-red-500',
      other: 'bg-gray-500'
    }
    return colors[task.category] || colors.other
  }

  return (
    <div className="space-y-6">
      {/* 月間カレンダー */}
      <div>
        <MonthlyCalendar
          studyBooks={studyBooks}
          studyPlans={studyPlans}
          onDateClick={onDateClick}
          selectedDate={selectedDate}
        />
      </div>

      {/* 下部のタスク表示 */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">
          {selectedDate ?
            `${selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}のタスク` :
            '日付を選択してください'
          }
        </h3>
        
        {selectedDate && selectedTasks.length > 0 && (
          <div className="space-y-3">
            {selectedTasks.map((task, index) => (
              <div key={task.id} className={`p-3 rounded-md border-l-4 ${getTaskColor(task)} bg-opacity-10`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {task.bookTitle}
                      {task.type === 'book-goal' && (
                        <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                          📚 目標
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {task.startPage}-{task.endPage}ページ ({task.pages}ページ)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!selectedDate && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📅</div>
            <p>カレンダーから日付を選択してタスクを表示</p>
          </div>
        )}

        {selectedDate && selectedTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>この日の学習計画はありません</p>
            <p className="text-sm">参考書を追加して学習計画を生成してください</p>
          </div>
        )}
      </div>

      {/* 学習統計サマリー */}
      {selectedDate && selectedTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-semibold mb-3">この日の学習サマリー</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{selectedTasks.length}</div>
              <div className="text-sm text-gray-600">学習項目</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {selectedTasks.reduce((total, task) => total + (task.endPage - task.startPage + 1), 0)}
              </div>
              <div className="text-sm text-gray-600">総ページ数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {selectedTasks.filter(task => task.type === 'book-goal').length}
              </div>
              <div className="text-sm text-gray-600">参考書目標</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}