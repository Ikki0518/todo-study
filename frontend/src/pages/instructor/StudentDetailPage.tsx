import React, { useState, useEffect } from 'react';
import {
  Student,
  Task,
  TaskStatus,
  TaskType,
  Comment,
  Goal,
  UserRole,
  DailyPlannerView
} from '../../types';

// タスク管理コンポーネント
interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddComment: (taskId: string, comment: string) => void;
  comments: Comment[];
}

function TaskCard({ task, onStatusChange, onAddComment, comments }: TaskCardProps) {
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case TaskStatus.OVERDUE:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return '完了';
      case TaskStatus.IN_PROGRESS:
        return '進行中';
      case TaskStatus.OVERDUE:
        return '期限切れ';
      default:
        return '未着手';
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(task.id, e.target.value as TaskStatus);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const taskComments = comments.filter(c => c.taskId === task.id);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>予定時間: {task.estimatedMinutes}分</span>
            <span>タイプ: {task.type === TaskType.AI_GENERATED ? 'AI生成' : '手動'}</span>
            {task.completedAt && (
              <span>完了: {task.completedAt.toLocaleDateString('ja-JP')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(task.status)}`}>
            {getStatusText(task.status)}
          </span>
        </div>
      </div>

      {/* ステータス変更 */}
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-gray-700">ステータス:</label>
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value={TaskStatus.PENDING}>未着手</option>
          <option value={TaskStatus.IN_PROGRESS}>進行中</option>
          <option value={TaskStatus.COMPLETED}>完了</option>
          <option value={TaskStatus.OVERDUE}>期限切れ</option>
        </select>
      </div>

      {/* コメント機能 */}
      <div>
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          コメント ({taskComments.length}) {showComments ? '▼' : '▶'}
        </button>
        
        {showComments && (
          <div className="mt-3 space-y-3">
            {/* 既存のコメント */}
            {taskComments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-800">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {comment.createdAt.toLocaleString('ja-JP')}
                </p>
              </div>
            ))}
            
            {/* 新しいコメント入力 */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力..."
                className="flex-1 text-sm border border-gray-300 rounded px-3 py-2"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                送信
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentDetailPage() {
  const [studentData, setStudentData] = useState<DailyPlannerView | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // モックデータ（実際にはAPIから取得）
  useEffect(() => {
    const mockData: DailyPlannerView = {
      date: selectedDate,
      student: {
        id: '1',
        email: 'student1@example.com',
        name: '田中太郎',
        role: UserRole.STUDENT,
        instructorId: 'instructor1',
        currentStreak: 7,
        lastStudiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      todayTasks: [
        {
          id: '1',
          studentId: '1',
          goalId: 'goal1',
          title: '数学 - 二次関数の問題演習',
          description: '教科書p.45-50の問題を解く',
          type: TaskType.AI_GENERATED,
          status: TaskStatus.COMPLETED,
          estimatedMinutes: 60,
          actualMinutes: 55,
          scheduledDate: selectedDate,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isOverdue: false
        },
        {
          id: '2',
          studentId: '1',
          goalId: 'goal1',
          title: '英語 - 長文読解',
          description: '過去問の長文問題3問',
          type: TaskType.MANUAL,
          status: TaskStatus.IN_PROGRESS,
          estimatedMinutes: 45,
          scheduledDate: selectedDate,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOverdue: false
        }
      ],
      overdueTasks: [
        {
          id: '3',
          studentId: '1',
          goalId: 'goal1',
          title: '物理 - 力学の復習',
          description: '前回の授業の復習',
          type: TaskType.AI_GENERATED,
          status: TaskStatus.OVERDUE,
          estimatedMinutes: 30,
          scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          isOverdue: true
        }
      ],
      timelineTasks: [],
      comments: [
        {
          id: '1',
          taskId: '1',
          instructorId: 'instructor1',
          studentId: '1',
          content: '問題の解き方が正確です。この調子で頑張ってください！',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };

    setStudentData(mockData);
    setLoading(false);
  }, [selectedDate]);

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    if (!studentData) return;

    const updateTasks = (tasks: Task[]) =>
      tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status,
              completedAt: status === TaskStatus.COMPLETED ? new Date() : undefined,
              actualMinutes: status === TaskStatus.COMPLETED ? task.estimatedMinutes : undefined
            }
          : task
      );

    setStudentData({
      ...studentData,
      todayTasks: updateTasks(studentData.todayTasks),
      overdueTasks: updateTasks(studentData.overdueTasks)
    });
  };

  const handleAddComment = (taskId: string, content: string) => {
    if (!studentData) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      taskId,
      instructorId: 'instructor1',
      studentId: studentData.student.id,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setStudentData({
      ...studentData,
      comments: [...studentData.comments, newComment]
    });
  };

  if (loading || !studentData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { student, todayTasks, overdueTasks, comments } = studentData;
  const completedTasks = todayTasks.filter(t => t.status === TaskStatus.COMPLETED);
  const progressPercentage = todayTasks.length > 0
    ? Math.round((completedTasks.length / todayTasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {student.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-gray-600">{student.email}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">連続学習日数</div>
            <div className="text-2xl font-bold text-green-600">{student.currentStreak}日</div>
          </div>
        </div>

        {/* 日付選択 */}
        <div className="flex items-center space-x-3">
          <label className="font-medium text-gray-700">表示日:</label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      {/* 進捗概要 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-600">本日のタスク</div>
          <div className="text-2xl font-bold text-blue-600">{todayTasks.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600">完了済み</div>
          <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600">未達成</div>
          <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600">進捗率</div>
          <div className="text-2xl font-bold text-purple-600">{progressPercentage}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 本日のタスク */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            本日のタスク ({selectedDate.toLocaleDateString('ja-JP')})
          </h2>
          <div className="space-y-4">
            {todayTasks.length === 0 ? (
              <p className="text-gray-600">本日のタスクはありません</p>
            ) : (
              todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onAddComment={handleAddComment}
                  comments={comments}
                />
              ))
            )}
          </div>
        </div>

        {/* 未達成タスク */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            未達成タスク ({overdueTasks.length}件)
          </h2>
          <div className="space-y-4">
            {overdueTasks.length === 0 ? (
              <p className="text-gray-600">未達成タスクはありません</p>
            ) : (
              overdueTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onAddComment={handleAddComment}
                  comments={comments}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 進捗チャート */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">本日の進捗</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage > 20 && (
              <span className="text-white text-xs font-medium">{progressPercentage}%</span>
            )}
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}