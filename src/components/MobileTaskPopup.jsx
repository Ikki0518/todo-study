import { useState } from 'react'

export function MobileTaskPopup({
  isOpen,
  onClose,
  availableTasks = [],
  selectedDate,
  selectedHour,
  onTaskSelect,
  onAddNewTask
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  if (!isOpen) return null

  const handleTaskSelect = (task) => {
    onTaskSelect(task, selectedDate, selectedHour)
    onClose()
  }

  const handleAddTask = (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      completed: false,
      source: 'manual',
      createdAt: new Date().toISOString()
    }
    onAddNewTask(newTask)
    setShowAddForm(false)
    onClose()
  }

  const TaskForm = ({ onSubmit, onCancel }) => {
    const handleSubmit = (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      const category = formData.get('category')
      const customCategory = formData.get('customCategory')
      
      const taskData = {
        title: formData.get('title'),
        description: formData.get('description') || '',
        priority: formData.get('priority') || 'medium',
        category: category === 'custom' ? customCategory : category,
        duration: parseInt(formData.get('duration')) || 1
      }
      onSubmit(taskData)
    }

    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">新しいタスクを追加</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">タスク名</label>
            <input
              name="title"
              type="text"
              className="w-full p-2 border rounded-md text-sm"
              required
              placeholder="例：数学 - 微分の練習問題"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">優先度</label>
              <select name="priority" className="w-full p-2 border rounded-md text-sm">
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">時間(時間)</label>
              <select name="duration" className="w-full p-2 border rounded-md text-sm">
                <option value="1">1時間</option>
                <option value="2">2時間</option>
                <option value="3">3時間</option>
                <option value="4">4時間</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">カテゴリ</label>
            <select name="category" className="w-full p-2 border rounded-md text-sm">
              <option value="study">学習</option>
              <option value="programming">プログラミング</option>
              <option value="math">数学</option>
              <option value="english">英語</option>
              <option value="science">理科</option>
              <option value="certification">資格</option>
              <option value="custom">その他</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-600"
            >
              追加
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-400"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    )
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-slide-up">
        {/* ヘッダー */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">タスクを選択</h2>
              <p className="text-sm opacity-90">
                {selectedDate && new Date(selectedDate).toLocaleDateString('ja-JP', { 
                  month: 'short', 
                  day: 'numeric' 
                })} {selectedHour}:00
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {showAddForm ? (
            <TaskForm 
              onSubmit={handleAddTask}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <div className="p-4">
              {/* 新しいタスクを追加ボタン */}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full p-3 mb-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">新しいタスクを追加</span>
                </div>
              </button>

              {/* 利用可能なタスクリスト */}
              {availableTasks.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">利用可能なタスク</h3>
                  {availableTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskSelect(task)}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-gray-600 truncate">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></span>
                            <span className="text-xs text-gray-500">
                              {task.category} • {task.duration || 1}時間
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">利用可能なタスクがありません</p>
                  <p className="text-xs mt-1">新しいタスクを追加してください</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}