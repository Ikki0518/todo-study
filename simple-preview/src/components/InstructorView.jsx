import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import socketService from '../services/socketService';

// デイリープランナーコンポーネント（講師視点）
const InstructorDailyPlanner = () => {
  const [selectedStudent, setSelectedStudent] = useState('田中太郎');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // モック生徒データ
  const students = ['田中太郎', '佐藤花子', '山田次郎'];

  // モックタスクデータ
  const mockTasks = {
    today: [
      {
        id: 1,
        title: '数学 - 二次関数',
        description: '教科書p.45-50の問題を解く',
        estimatedTime: 60,
        status: 'completed',
        completedAt: '14:30',
        type: 'AI生成'
      },
      {
        id: 2,
        title: '英語 - 長文読解',
        description: '過去問の長文問題3問',
        estimatedTime: 45,
        status: 'in-progress',
        type: '手動'
      },
      {
        id: 3,
        title: '物理 - 力学復習',
        description: '運動方程式の問題',
        estimatedTime: 40,
        status: 'pending',
        type: 'AI生成'
      }
    ],
    overdue: [
      {
        id: 4,
        title: '化学 - 酸化還元',
        description: '昨日の復習問題',
        estimatedTime: 30,
        status: 'overdue',
        originalDate: '2025-06-27'
      }
    ]
  };

  const [tasks, setTasks] = useState(mockTasks);
  const [comments, setComments] = useState({
    1: ['素晴らしい解答です！この調子で頑張ってください。'],
    2: ['途中まで良く出来ています。最後の段落も頑張って！'],
  });
  const [newComment, setNewComment] = useState('');
  const [selectedTaskForComment, setSelectedTaskForComment] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-300',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      overdue: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      completed: '完了',
      'in-progress': '進行中',
      pending: '未着手',
      overdue: '期限切れ'
    };
    return texts[status] || '未着手';
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(prev => ({
      ...prev,
      today: prev.today.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : null }
          : task
      ),
      overdue: prev.overdue.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : null }
          : task
      )
    }));
  };

  const addComment = (taskId) => {
    if (newComment.trim()) {
      setComments(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), newComment.trim()]
      }));
      setNewComment('');
      setSelectedTaskForComment(null);
    }
  };

  const TaskCard = ({ task, showMoveToToday = false }) => (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>📚 {task.estimatedTime}分</span>
            <span>🤖 {task.type}</span>
            {task.completedAt && <span>✅ {task.completedAt}完了</span>}
            {task.originalDate && <span>📅 元予定: {task.originalDate}</span>}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
          {getStatusText(task.status)}
        </span>
      </div>

      {/* ステータス変更 */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={task.status}
          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="pending">未着手</option>
          <option value="in-progress">進行中</option>
          <option value="completed">完了</option>
          <option value="overdue">期限切れ</option>
        </select>
        {showMoveToToday && (
          <button
            onClick={() => {
              // 今日のタスクに移動
              setTasks(prev => ({
                today: [...prev.today, { ...task, status: 'pending' }],
                overdue: prev.overdue.filter(t => t.id !== task.id)
              }));
            }}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
          >
            今日に移動
          </button>
        )}
      </div>

      {/* コメント */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">指導コメント ({(comments[task.id] || []).length}件)</span>
          <button
            onClick={() => setSelectedTaskForComment(selectedTaskForComment === task.id ? null : task.id)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {selectedTaskForComment === task.id ? '閉じる' : 'コメント追加'}
          </button>
        </div>
        
        {/* 既存コメント */}
        {(comments[task.id] || []).map((comment, index) => (
          <div key={index} className="bg-blue-50 rounded p-2 mb-2 text-sm">
            💬 {comment}
          </div>
        ))}

        {/* 新しいコメント入力 */}
        {selectedTaskForComment === task.id && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="生徒へのコメント..."
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              onKeyPress={(e) => e.key === 'Enter' && addComment(task.id)}
            />
            <button
              onClick={() => addComment(task.id)}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              送信
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const completedTasks = tasks.today.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.today.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">講師用デイリープランナー</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 font-medium"
            >
              {students.map(student => (
                <option key={student} value={student}>{student}</option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* 生徒情報 */}
        <div className="flex items-center gap-6 p-4 bg-blue-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{selectedStudent.charAt(0)}</span>
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900">{selectedStudent}</h2>
            <p className="text-gray-600">連続学習: 7日 | 最終学習: 今日</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-gray-600">本日の進捗</div>
            <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">本日のタスク</div>
          <div className="text-2xl font-bold text-blue-600">{totalTasks}件</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">完了済み</div>
          <div className="text-2xl font-bold text-green-600">{completedTasks}件</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">未達成</div>
          <div className="text-2xl font-bold text-red-600">{tasks.overdue.length}件</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600">進行中</div>
          <div className="text-2xl font-bold text-yellow-600">
            {tasks.today.filter(t => t.status === 'in-progress').length}件
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 本日のタスクプール */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 本日のタスク ({new Date(selectedDate).toLocaleDateString('ja-JP')})
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">{progressPercentage}%</span>
              </div>
            </div>
            <div className="space-y-4">
              {tasks.today.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>

        {/* 未達成タスクプール */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚠️ 未達成タスク ({tasks.overdue.length}件)
            </h3>
            <div className="space-y-4">
              {tasks.overdue.map(task => (
                <TaskCard key={task.id} task={task} showMoveToToday={true} />
              ))}
              {tasks.overdue.length === 0 && (
                <p className="text-gray-500 text-center py-8">未達成タスクはありません</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* タイムライン表示 */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ 本日のタイムライン</h3>
        <div className="space-y-2">
          {tasks.today
            .filter(task => task.status === 'completed')
            .map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-green-50 rounded border-l-4 border-green-400">
                <span className="text-sm font-mono text-green-700">{task.completedAt}</span>
                <span className="text-sm text-gray-700">✅ {task.title}</span>
                <span className="text-xs text-gray-500">({task.estimatedTime}分)</span>
              </div>
            ))}
          {tasks.today.filter(task => task.status === 'completed').length === 0 && (
            <p className="text-gray-500 text-center py-8">まだ完了したタスクがありません</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDailyPlanner;