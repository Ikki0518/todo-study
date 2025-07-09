import { useState } from 'react'
import { getOverdueMessage, getOverdueTaskStats } from '../utils/overdueTaskDetector'

export function OverdueTaskPool({ 
  overdueTasks = [], 
  onTaskComplete,
  onTaskReschedule,
  onTaskDelete 
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  
  const stats = getOverdueTaskStats(overdueTasks)
  
  const handleCompleteTask = (taskId) => {
    if (onTaskComplete) {
      onTaskComplete(taskId)
    }
  }
  
  const handleRescheduleTask = (task) => {
    setSelectedTask(task)
    // リスケジュール機能は後で実装
  }
  
  const handleDeleteTask = (taskId) => {
    if (confirm('この未達成タスクを削除しますか？')) {
      if (onTaskDelete) {
        onTaskDelete(taskId)
      }
    }
  }
  
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50'
    }
    return colors[priority] || colors.medium
  }
  
  const getOverdueTypeColor = (overdueReason) => {
    const colors = {
      pastDate: 'bg-red-100 text-red-800',
      timeOverdue: 'bg-orange-100 text-orange-800'
    }
    return colors[overdueReason] || 'bg-gray-100 text-gray-800'
  }
  
  const getOverdueIcon = (overdueReason) => {
    const icons = {
      pastDate: '📅❌',
      timeOverdue: '⏰❌'
    }
    return icons[overdueReason] || '❌'
  }
  
  if (overdueTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base sm:text-lg lg:text-xl">
            ⚠️ 未達成タスクプール
          </h2>
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            すべて完了 ✅
          </span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🎉</div>
          <p>未達成タスクはありません</p>
          <p className="text-sm">素晴らしいです！</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base sm:text-lg lg:text-xl">
          ⚠️ 未達成タスクプール
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
            {stats.total}件
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            {showDetails ? '詳細を閉じる' : '詳細を表示'}
          </button>
        </div>
      </div>
      
      {/* 統計情報 */}
      {showDetails && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">過去の未完了</div>
              <div className="text-red-600 font-bold">{stats.pastDate}件</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">時間超過</div>
              <div className="text-orange-600 font-bold">{stats.timeOverdue}件</div>
            </div>
          </div>
          <div className="mt-2 flex space-x-4 text-xs">
            <span className="text-red-600">🔴 高優先度: {stats.byPriority.high}</span>
            <span className="text-yellow-600">🟡 中優先度: {stats.byPriority.medium}</span>
            <span className="text-green-600">🟢 低優先度: {stats.byPriority.low}</span>
          </div>
        </div>
      )}
      
      {/* 未達成タスクリスト */}
      <div className="space-y-2 sm:space-y-3 lg:space-y-4 max-h-80 sm:max-h-96 lg:max-h-[500px] overflow-y-auto">
        {overdueTasks.map((task) => (
          <div
            key={task.id}
            className={`p-3 rounded-md border-2 ${getPriorityColor(task.priority)} bg-red-50 border-red-300 relative`}
          >
            {/* 未達成警告ラベル */}
            <div className="absolute top-2 right-2">
              <span className={`text-xs px-2 py-1 rounded ${getOverdueTypeColor(task.overdueReason)}`}>
                {getOverdueIcon(task.overdueReason)} {getOverdueMessage(task)}
              </span>
            </div>
            
            <div className="flex items-start space-x-3 pr-16">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-sm sm:text-base lg:text-lg text-red-800">
                    {task.title || `${task.bookTitle} - ${task.studyType === 'problems' ? 
                      `${task.startProblem}-${task.endProblem}問` : 
                      `${task.startPage}-${task.endPage}ページ`}`}
                  </h3>
                </div>
                
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 text-xs lg:text-sm">
                  {task.category && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      🏷 {task.category}
                    </span>
                  )}
                  {task.timeSlot && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      ⏰ {task.timeSlot}
                    </span>
                  )}
                  {task.priority && (
                    <span className={`px-2 py-1 rounded ${
                      task.priority === 'high' ? 'bg-red-200 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {task.priority === 'high' ? '🔴 高' :
                       task.priority === 'medium' ? '🟡 中' : '🟢 低'}
                    </span>
                  )}
                </div>
                
                {task.bookTitle && (
                  <div className="text-xs sm:text-sm text-blue-600 mt-1">
                    {task.studyType === 'problems' ? (
                      <>🧮 {task.bookTitle}: {task.startProblem}-{task.endProblem}問</>
                    ) : (
                      <>📚 {task.bookTitle}: {task.startPage}-{task.endPage}ページ</>
                    )}
                  </div>
                )}
                
                {task.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* アクションボタン */}
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => handleCompleteTask(task.id)}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                title="完了にする"
              >
                ✅ 完了
              </button>
              <button
                onClick={() => handleRescheduleTask(task)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                title="リスケジュール"
              >
                📅 再予定
              </button>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                title="削除"
              >
                ✕ 削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}