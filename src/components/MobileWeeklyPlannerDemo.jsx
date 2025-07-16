import { useState } from 'react'
import { MobileWeeklyPlanner } from './MobileWeeklyPlanner'

export function MobileWeeklyPlannerDemo() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: '数学の宿題',
      description: '二次関数の問題集 p.45-50',
      priority: 'high',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      duration: 2,
      completed: false
    },
    {
      id: 2,
      title: '英語の予習',
      description: 'Unit 5の単語を覚える',
      priority: 'medium',
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      duration: 1.5,
      completed: false
    }
  ])

  const handleTaskAdd = (newTask) => {
    setTasks([...tasks, newTask])
    console.log('Task added:', newTask)
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ))
    console.log('Task updated:', updatedTask)
  }

  const handleTaskDelete = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId))
    console.log('Task deleted:', taskId)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            モバイル週間プランナー デモ
          </h1>
          <p className="text-gray-600">
            タイムスロットをタップしてタスクを追加し、タスクの右下をドラッグして時間を調整できます。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4">
          <MobileWeeklyPlanner
            tasks={tasks}
            onTaskAdd={handleTaskAdd}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">使い方</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">📍</span>
              <span>時間スロットをタップして新しいタスクを追加</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📏</span>
              <span>タスクの右下隅をドラッグして時間を調整</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">👆</span>
              <span>タスクをタップして詳細を表示・削除</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⏰</span>
              <span>現在時刻は青い線で表示されます</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">現在のタスク</h2>
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{task.title}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {task.date} {task.startTime} ({task.duration}時間)
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs text-white ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}