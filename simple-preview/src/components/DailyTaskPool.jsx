import { useState } from 'react'

export function DailyTaskPool({ 
  dailyTasks = [], 
  onTasksUpdate,
  onTaskDragStart,
  selectedDate 
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddTask = (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      completed: false,
      source: 'manual',
      createdAt: new Date().toISOString()
    }
    onTasksUpdate([...dailyTasks, newTask])
    setShowAddForm(false)
  }

  const handleToggleComplete = (taskId) => {
    const updatedTasks = dailyTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )
    onTasksUpdate(updatedTasks)
  }

  const handleDeleteTask = (taskId) => {
    if (confirm('このタスクを削除しますか？')) {
      const updatedTasks = dailyTasks.filter(task => task.id !== taskId)
      onTasksUpdate(updatedTasks)
    }
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
        category: category === 'custom' ? customCategory : category
      }
      onSubmit(taskData)
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">タスクを追加</h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">タスク名</label>
                <input
                  name="title"
                  type="text"
                  className="w-full p-2 border rounded-md"
                  required
                  placeholder="例：数学 - 微分の練習問題"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">優先度</label>
                <select
                  name="priority"
                  className="w-full p-2 border rounded-md"
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">カテゴリ</label>
                <select
                  name="category"
                  className="w-full p-2 border rounded-md"
                  onChange={(e) => {
                    const customInput = e.target.parentElement.nextElementSibling?.querySelector('input[name="customCategory"]')
                    if (customInput) {
                      customInput.style.display = e.target.value === 'custom' ? 'block' : 'none'
                    }
                  }}
                >
                  <option value="study">学習</option>
                  <option value="programming">プログラミング</option>
                  <option value="math">数学</option>
                  <option value="english">英語</option>
                  <option value="science">理科</option>
                  <option value="certification">資格</option>
                  <option value="other">その他</option>
                  <option value="custom">カスタム</option>
                </select>
              </div>
              <div>
                <input
                  name="customCategory"
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="カスタムカテゴリを入力"
                  style={{ display: 'none' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">説明（任意）</label>
                <textarea
                  name="description"
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  placeholder="タスクの詳細"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                追加
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'border-red-300 bg-red-50',
      medium: 'border-yellow-300 bg-yellow-50',
      low: 'border-green-300 bg-green-50'
    }
    return colors[priority] || colors.medium
  }

  const getPriorityIcon = (priority) => {
    const icons = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    }
    return icons[priority] || icons.medium
  }

  const formatDate = (date) => {
    if (!date) return '今日'
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return '今日'
    }
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
  }

  // タスクを優先度順にソート
  const sortedTasks = [...dailyTasks].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h2 className="font-semibold text-base sm:text-lg lg:text-xl">
          📋 {formatDate(selectedDate)}のタスクプール
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-3 py-1 lg:px-4 lg:py-2 rounded-md hover:bg-blue-700 text-sm lg:text-base w-fit"
        >
          ＋ 追加
        </button>
      </div>

      {/* タスク統計 */}
      <div className="mb-4 p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-md">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 text-center text-xs sm:text-sm lg:text-base">
          <div>
            <div className="font-medium text-gray-700">総タスク数</div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">{dailyTasks.length}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">完了済み</div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
              {dailyTasks.filter(task => task.completed).length}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700">残り</div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-purple-600">
              {dailyTasks.filter(task => !task.completed).length}
            </div>
          </div>
        </div>
      </div>

      {/* タスクリスト */}
      <div className="space-y-2 sm:space-y-3 lg:space-y-4 max-h-80 sm:max-h-96 lg:max-h-[500px] overflow-y-auto">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className={`p-2 sm:p-3 lg:p-4 rounded-md border-2 cursor-move hover:shadow-md transition-shadow ${
              task.completed
                ? 'bg-gray-100 border-gray-300 opacity-75'
                : getPriorityColor(task.priority)
            }`}
            draggable={!task.completed}
            onDragStart={(e) => !task.completed && onTaskDragStart && onTaskDragStart(e, task)}
          >
            <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleComplete(task.id)}
                className="mt-1 flex-shrink-0 lg:scale-125"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-xs sm:text-sm lg:text-base flex-shrink-0">{getPriorityIcon(task.priority)}</span>
                  <h3 className={`font-medium text-sm sm:text-base lg:text-lg truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 text-xs lg:text-sm">
                  {task.category && (
                    <span className="bg-gray-100 text-gray-700 px-1 sm:px-2 py-1 rounded">🏷 {task.category}</span>
                  )}
                  {task.source === 'calendar' && (
                    <span className="bg-blue-100 text-blue-800 px-1 sm:px-2 py-1 rounded">📅 カレンダーから</span>
                  )}
                  {task.source === 'ai' && (
                    <span className="bg-green-100 text-green-800 px-1 sm:px-2 py-1 rounded">🤖 AI提案</span>
                  )}
                  {task.type === 'book-goal' && (
                    <span className="bg-emerald-100 text-emerald-800 px-1 sm:px-2 py-1 rounded">📚 参考書目標</span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                )}
                {task.bookTitle && (
                  <div className="text-xs sm:text-sm lg:text-base text-blue-600 mt-1">
                    📚 {task.bookTitle}: {task.startPage}-{task.endPage}ページ
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-500 hover:text-red-700 text-xs sm:text-sm lg:text-base p-1 flex-shrink-0"
                title="削除"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {dailyTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📝</div>
          <p>タスクがありません</p>
          <p className="text-sm">月カレンダーから日付を選択するか、手動でタスクを追加してください</p>
        </div>
      )}

      {/* フォームモーダル */}
      {showAddForm && (
        <TaskForm
          onSubmit={handleAddTask}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}