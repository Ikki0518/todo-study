import { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function DailyPlannerPage() {
  const [todayTasks] = useState([
    { id: '1', title: '数学の基礎 - 第1章', estimatedMinutes: 60, status: 'PENDING' },
    { id: '2', title: '英語リーディング - Unit 3', estimatedMinutes: 45, status: 'PENDING' },
    { id: '3', title: 'プログラミング演習 - 配列', estimatedMinutes: 90, status: 'PENDING' },
  ]);

  const [overdueTasks] = useState([
    { id: '4', title: '物理学 - 力学の基礎', estimatedMinutes: 60, status: 'OVERDUE' },
  ]);

  const [currentStreak] = useState(15);

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">デイリープランナー</h1>
        <div className="mt-2 flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="mr-1 h-4 w-4" />
            {new Date().toLocaleDateString('ja-JP')}
          </div>
          <div className="streak-badge">
            <span className="streak-flame mr-1">🔥</span>
            {currentStreak}日連続！
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 本日のタスクプール */}
        <div className="card p-4">
          <h2 className="mb-4 font-semibold text-gray-900">本日のタスク</h2>
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <div key={task.id} className="task-card">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-3 w-3" />
                  {task.estimatedMinutes}分
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 未達成タスクプール */}
        <div className="card p-4">
          <h2 className="mb-4 font-semibold text-danger-600">
            未達成タスク
            {overdueTasks.length > 0 && (
              <span className="ml-2 text-sm">({overdueTasks.length}件)</span>
            )}
          </h2>
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <div key={task.id} className="task-card border-danger-200 bg-danger-50">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <div className="mt-1 flex items-center text-sm text-danger-600">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  期限切れ
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* タイムライン */}
        <div className="card p-4">
          <h2 className="mb-4 font-semibold text-gray-900">タイムライン</h2>
          <div className="space-y-2">
            {Array.from({ length: 10 }, (_, i) => {
              const hour = 9 + i;
              return (
                <div key={hour} className="flex items-start">
                  <span className="w-16 text-sm text-gray-500">
                    {hour}:00
                  </span>
                  <div className="flex-1">
                    <div className="timeline-slot">
                      {/* ドラッグ&ドロップでタスクを配置 */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}