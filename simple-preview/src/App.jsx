import { useState, useEffect } from 'react'
import { PersonalizeMode } from './components/PersonalizeMode';
import { CompanionMode } from './components/CompanionMode';
import { LoginScreen } from './components/LoginScreen';

function App() {
  const [currentView, setCurrentView] = useState('goals')
  const [currentStreak] = useState(15)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('STUDENT')
  const [currentUser, setCurrentUser] = useState(null)
  const [goals, setGoals] = useState([
    {
      id: '1',
      title: 'TOEIC 800点取得',
      deadline: '2025-12-31',
      progress: 45,
      description: '英語力向上のための目標',
      measurementType: 'sum',
      unit: 'points',
      targetValue: 800,
      currentValue: 360,
      progressHistory: []
    }
  ])
  const [todayTasks, setTodayTasks] = useState([])
  const [scheduledTasks, setScheduledTasks] = useState({})
  const [completedTasks, setCompletedTasks] = useState({})
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0) // 週のオフセット（0が今週）
  const [viewMode, setViewMode] = useState('week') // 'week' or 'twoWeeks'
  const [overdueTasks, setOverdueTasks] = useState([
    { id: '4', title: '物理学 - 力学の基礎', estimatedMinutes: 60, status: 'OVERDUE', completed: false },
  ])

  // AI機能の状態
  const [currentAIMode, setCurrentAIMode] = useState('select');
  const [userKnowledge, setUserKnowledge] = useState(null);

  // AI機能のハンドラー
  const handlePersonalizationComplete = (knowledge) => {
    setUserKnowledge(knowledge);
    localStorage.setItem('ai_knowledge_demo', JSON.stringify(knowledge));
    setCurrentAIMode('companion');
  };

  const handleKnowledgeUpdate = (updatedKnowledge) => {
    setUserKnowledge(updatedKnowledge);
    localStorage.setItem('ai_knowledge_demo', JSON.stringify(updatedKnowledge));
  };

  const handleResetKnowledge = () => {
    if (confirm('学習計画をリセットしますか？これまでのデータは削除されます。')) {
      localStorage.removeItem('ai_knowledge_demo');
      setUserKnowledge(null);
      setCurrentAIMode('select');
    }
  };

  const handleAIModeSelect = (mode) => {
    if (mode === 'companion' && !userKnowledge) {
      alert('まずはパーソナライズモードで学習計画を作成してください。');
      return;
    }
    setCurrentAIMode(mode);
  };

  // ログイン状態とナレッジの初期化
  useEffect(() => {
    // ログイン状態の復元
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setUserRole(user.userRole);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }

    // AIナレッジの復元
    const savedKnowledge = localStorage.getItem('ai_knowledge_demo');
    if (savedKnowledge) {
      try {
        const knowledge = JSON.parse(savedKnowledge);
        setUserKnowledge(knowledge);
      } catch (error) {
        console.error('Failed to parse saved knowledge:', error);
      }
    }
  }, []);

  // ログアウト処理
  const handleLogout = () => {
    if (confirm('ログアウトしますか？')) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('ai_knowledge_demo');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setUserRole('STUDENT');
      setUserKnowledge(null);
      setCurrentAIMode('select');
      setCurrentView('goals');
    }
  };

  // 週間カレンダーの日付を生成
  const getWeekDates = (offset = 0, twoWeeks = false) => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek + (offset * 7))
    
    const weekDates = []
    const days = twoWeeks ? 14 : 7
    for (let i = 0; i < days; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekDates.push(date)
    }
    return weekDates
  }

  const weekDates = getWeekDates(weekOffset, viewMode === 'twoWeeks')
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const today = new Date()
  const todayString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${dayNames[today.getDay()]}）`

  // 目標の追加・編集
  const handleSaveGoal = (goalData) => {
    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, ...goalData } : g))
    } else {
      const newGoal = {
        id: Date.now().toString(),
        ...goalData,
        progress: 0,
        currentValue: 0,
        progressHistory: []
      }
      setGoals([...goals, newGoal])
    }
    setShowGoalModal(false)
    setEditingGoal(null)
  }

  // 目標の削除
  const handleDeleteGoal = (goalId) => {
    if (window.confirm('この目標を削除してもよろしいですか？')) {
      setGoals(goals.filter(g => g.id !== goalId))
    }
  }

  // 進捗の更新
  const handleUpdateProgress = (goalId, progress) => {
    setGoals(goals.map(g => g.id === goalId ? { ...g, progress } : g))
  }

  // タスクの手動追加
  const handleAddTask = (title, estimatedMinutes) => {
    const newTask = {
      id: Date.now().toString(),
      title,
      estimatedMinutes,
      status: 'PENDING',
      completed: false,
      source: 'manual'
    }
    setTodayTasks([...todayTasks, newTask])
  }

  const handleDragStart = (e, task, fromLocation = null) => {
    e.dataTransfer.setData('task', JSON.stringify(task))
    e.dataTransfer.setData('fromLocation', fromLocation || '')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, dateKey, hour) => {
    e.preventDefault()
    const task = JSON.parse(e.dataTransfer.getData('task'))
    const fromLocation = e.dataTransfer.getData('fromLocation')
    const newScheduledTasks = { ...scheduledTasks }
    const key = `${dateKey}-${hour}`
    
    // 既存のタスクがある場合は何もしない
    if (newScheduledTasks[key]) {
      return
    }
    
    // 元の場所からタスクを削除
    if (fromLocation && fromLocation.startsWith('scheduled-')) {
      const oldKey = fromLocation.replace('scheduled-', '')
      delete newScheduledTasks[oldKey]
      // 完了状態も移動
      if (completedTasks[oldKey]) {
        const newCompletedTasks = { ...completedTasks }
        delete newCompletedTasks[oldKey]
        newCompletedTasks[key] = true
        setCompletedTasks(newCompletedTasks)
      }
    } else if (task.status === 'OVERDUE') {
      // 未達成タスクから削除
      setOverdueTasks(overdueTasks.filter(t => t.id !== task.id))
    } else {
      // タスクプールから削除
      setTodayTasks(todayTasks.filter(t => t.id !== task.id))
    }
    
    newScheduledTasks[key] = task
    setScheduledTasks(newScheduledTasks)
  }

  // タスクの完了状態を切り替え
  const toggleTaskComplete = (taskId, location) => {
    if (location === 'pool') {
      setTodayTasks(todayTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ))
    } else if (location.startsWith('scheduled-')) {
      const key = location.replace('scheduled-', '')
      setCompletedTasks({
        ...completedTasks,
        [key]: !completedTasks[key]
      })
    }
  }

  // カレンダーからタスクを削除
  const removeScheduledTask = (dateKey, hour) => {
    const key = `${dateKey}-${hour}`
    const task = scheduledTasks[key]
    if (task) {
      const newScheduledTasks = { ...scheduledTasks }
      delete newScheduledTasks[key]
      setScheduledTasks(newScheduledTasks)
      
      // タスクプールに戻す（未達成タスクの場合は未達成タスクリストに戻す）
      if (task.status === 'OVERDUE') {
        setOverdueTasks([...overdueTasks, task])
      } else {
        setTodayTasks([...todayTasks, task])
      }
      
      // 完了状態もクリア
      const newCompletedTasks = { ...completedTasks }
      delete newCompletedTasks[key]
      setCompletedTasks(newCompletedTasks)
    }
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={setIsLoggedIn} onRoleChange={setUserRole} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバー */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center relative">
            {/* Sunaロゴ - 提供画像に完全に忠実なSVG再現 */}
            <svg width="115" height="55" viewBox="0 0 115 55" className="flex-shrink-0">
              {/* 大きな円（右上、明るいターコイズブルー） */}
              <circle cx="90" cy="20" r="13" fill="#67E8F9" opacity="0.85"/>

              {/* 中くらいの円（左中央、濃いブルー） */}
              <circle cx="73" cy="28" r="8" fill="#2563EB" opacity="0.9"/>

              {/* 小さな円（右下、薄いターコイズ） */}
              <circle cx="83" cy="35" r="5" fill="#A7F3D0" opacity="0.75"/>

              {/* テキスト "suna" - 太字、濃いネイビー */}
              <text x="0" y="42" fontSize="26" fontWeight="700" fill="#1E293B" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" letterSpacing="-1.2px">
                suna
              </text>
            </svg>
          </div>
          {currentUser && (
            <div className="mt-2 text-sm text-gray-600">
              <p>ようこそ、{currentUser.name}さん</p>
              <p className="text-xs">
                {userRole === 'STUDENT' ? '生徒' : '講師'}アカウント
              </p>
            </div>
          )}
        </div>
        <nav className="px-4">
          {userRole === 'STUDENT' ? (
            <>
              <button
                onClick={() => setCurrentView('planner')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'planner' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📅 デイリープランナー
              </button>
              <button
                onClick={() => setCurrentView('goals')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'goals' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                🎯 目標管理
              </button>
              <button
                onClick={() => setCurrentView('ai-assistant')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'ai-assistant' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                🤖 AI学習アシスタント
              </button>
            </>
          ) : (
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              📊 ダッシュボード
            </button>
          )}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-2"
          >
            <span>🚪</span>
            <span>ログアウト</span>
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="ml-64 p-6">
        {userRole === 'STUDENT' && currentView === 'planner' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">週間プランナー</h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-medium text-gray-700">{todayString}</span>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                    🔥 {currentStreak}日連続！
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    className="px-3 py-1 border rounded hover:bg-gray-100"
                  >
                    ← 前週
                  </button>
                  <button
                    onClick={() => setWeekOffset(0)}
                    className={`px-3 py-1 rounded ${weekOffset === 0 ? 'bg-blue-500 text-white' : 'border hover:bg-gray-100'}`}
                  >
                    今週
                  </button>
                  <button
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    className="px-3 py-1 border rounded hover:bg-gray-100"
                  >
                    次週 →
                  </button>
                  <div className="ml-4 border-l pl-4">
                    <button
                      onClick={() => setViewMode(viewMode === 'week' ? 'twoWeeks' : 'week')}
                      className="px-3 py-1 border rounded hover:bg-gray-100"
                    >
                      {viewMode === 'week' ? '2週間表示' : '1週間表示'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              {/* タスクプール */}
              <div className="col-span-3">
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <h2 className="font-semibold mb-4">📋 今日のタスク</h2>
                  
                  {/* タスク手動追加フォーム */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target)
                      const title = formData.get('taskTitle')
                      const minutes = formData.get('taskMinutes')
                      if (title && minutes) {
                        handleAddTask(title, parseInt(minutes))
                        e.target.reset()
                      }
                    }}>
                      <div className="space-y-2">
                        <input
                          name="taskTitle"
                          type="text"
                          placeholder="タスクの内容"
                          className="w-full p-2 text-sm border rounded-md"
                          required
                        />
                        <div className="flex space-x-2">
                          <input
                            name="taskMinutes"
                            type="number"
                            placeholder="予定時間（分）"
                            className="flex-1 p-2 text-sm border rounded-md"
                            min="5"
                            required
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          >
                            追加
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-md cursor-move hover:shadow border ${
                          task.completed ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'
                        }`}
                        draggable={!task.completed}
                        onDragStart={(e) => !task.completed && handleDragStart(e, task)}
                      >
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskComplete(task.id, 'pool')}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <h3 className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </h3>
                            <p className="text-xs text-gray-500">⏱ {task.estimatedMinutes}分</p>
                            {task.source === 'ai' && (
                              <p className="text-xs text-blue-600">🤖 AI提案</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (confirm('このタスクを削除しますか？')) {
                                setTodayTasks(todayTasks.filter(t => t.id !== task.id))
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {todayTasks.length === 0 && (
                      <p className="text-gray-500 text-sm">タスクを追加するか、AI学習アシスタントでタスクを生成してください</p>
                    )}
                  </div>
                </div>

                {overdueTasks.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="font-semibold mb-4 text-red-600">
                      未達成タスク ({overdueTasks.length}件)
                    </h2>
                    <div className="space-y-3">
                      {overdueTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-red-50 p-3 rounded-md border border-red-200 cursor-move"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                        >
                          <h3 className="font-medium text-sm">{task.title}</h3>
                          <p className="text-xs text-red-600">⚠️ 期限切れ</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 週間カレンダー */}
              <div className="col-span-9 bg-white rounded-lg shadow overflow-hidden">
                <div className={`grid border-b`} style={{gridTemplateColumns: viewMode === 'twoWeeks' ? `60px repeat(14, 1fr)` : `60px repeat(7, 1fr)`}}>
                  <div className="p-2 text-center text-sm font-medium bg-gray-50"></div>
                  {weekDates.map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString()
                    const month = date.getMonth() + 1
                    const day = date.getDate()
                    return (
                      <div
                        key={index}
                        className={`p-2 text-center border-l ${isToday ? 'bg-blue-50' : ''} ${viewMode === 'twoWeeks' ? 'text-xs' : ''}`}
                      >
                        <div className={`${viewMode === 'twoWeeks' ? 'text-xs' : 'text-xs'} text-gray-500`}>
                          {dayNames[date.getDay()]}
                        </div>
                        <div className={`${viewMode === 'twoWeeks' ? 'text-sm' : 'text-lg'} font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                          {viewMode === 'twoWeeks' && day === 1 ? `${month}/` : ''}{day}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* 時間軸 */}
                <div className="overflow-y-auto" style={{ height: '600px' }}>
                  {[...Array(24)].map((_, hourIndex) => {
                    const hour = hourIndex
                    return (
                      <div key={hour} className={`grid border-b`} style={{gridTemplateColumns: viewMode === 'twoWeeks' ? `60px repeat(14, 1fr)` : `60px repeat(7, 1fr)`}}>
                        <div className="p-2 text-right text-xs text-gray-500 bg-gray-50">
                          {hour}:00
                        </div>
                        {weekDates.map((date, dateIndex) => {
                          const dateKey = date.toISOString().split('T')[0]
                          const taskKey = `${dateKey}-${hour}`
                          const scheduledTask = scheduledTasks[taskKey]
                          const isPast = date < new Date() && date.toDateString() !== new Date().toDateString()
                          
                          return (
                            <div
                              key={dateIndex}
                              className={`p-1 border-l min-h-[50px] hover:bg-gray-50 ${isPast ? 'bg-gray-50' : ''}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, dateKey, hour)}
                            >
                              {scheduledTask && (
                                <div
                                  className={`p-${viewMode === 'twoWeeks' ? '1' : '2'} rounded text-xs cursor-move ${
                                    completedTasks[taskKey]
                                      ? 'bg-gray-300 text-gray-700'
                                      : 'bg-blue-500 text-white'
                                  }`}
                                  draggable={!completedTasks[taskKey]}
                                  onDragStart={(e) => !completedTasks[taskKey] && handleDragStart(e, scheduledTask, `scheduled-${taskKey}`)}
                                  onDoubleClick={() => removeScheduledTask(dateKey, hour)}
                                  title="ダブルクリックで削除、ドラッグで移動"
                                >
                                  <div className="flex items-start space-x-1">
                                    <input
                                      type="checkbox"
                                      checked={completedTasks[taskKey] || false}
                                      onChange={() => toggleTaskComplete(scheduledTask.id, `scheduled-${taskKey}`)}
                                      className="mt-0.5 cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1">
                                      <div className={`${viewMode === 'twoWeeks' ? 'text-xs' : 'font-medium'} ${completedTasks[taskKey] ? 'line-through' : ''}`}>
                                        {viewMode === 'twoWeeks' && scheduledTask.title.length > 10 
                                          ? scheduledTask.title.substring(0, 10) + '...' 
                                          : scheduledTask.title}
                                      </div>
                                      {viewMode !== 'twoWeeks' && (
                                        <div className={completedTasks[taskKey] ? 'text-gray-600' : 'text-blue-100'}>
                                          {scheduledTask.estimatedMinutes}分
                                        </div>
                                      )}
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
        )}

        {userRole === 'STUDENT' && currentView === 'goals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">目標管理</h1>
              <button
                onClick={() => setShowGoalModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                ＋ 新しい目標を追加
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* 目標一覧 */}
              <div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-4">現在の目標</h3>
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{goal.title}</h4>
                            <p className="text-sm text-gray-600">期限: {new Date(goal.deadline).toLocaleDateString('ja-JP')}</p>
                            {goal.description && (
                              <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                            )}
                            <div className="mt-3">
                              {goal.measurementType && goal.targetValue && (
                                <div className="text-sm text-gray-700 mb-2">
                                  <span className="font-medium">目標: </span>
                                  {goal.targetValue} {goal.unit === 'pages' ? 'ページ' : 
                                   goal.unit === 'problems' ? '問題' : 
                                   goal.unit === 'points' ? '点' : 
                                   goal.unit === 'percent' ? '％' : 
                                   goal.unit === 'people' ? '人' : 
                                   goal.unit === 'hours' ? '時間' : goal.unit}
                                  {goal.measurementType === 'sum' && ' (合計)'}
                                  {goal.measurementType === 'average' && ' (平均)'}
                                  {goal.measurementType === 'max' && ' (最大)'}
                                  {goal.measurementType === 'min' && ' (最小)'}
                                </div>
                              )}
                              <div className="flex justify-between text-sm mb-1">
                                <span>進捗</span>
                                <span>
                                  {goal.currentValue || 0} / {goal.targetValue || 0} ({goal.progress}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all" 
                                  style={{width: `${goal.progress}%`}}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => {
                                setEditingGoal(goal)
                                setShowGoalModal(true)
                              }}
                              className="text-gray-600 hover:text-gray-800"
                              title="編集"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                const newValue = prompt(`現在の${goal.unit === 'pages' ? 'ページ数' : 
                                  goal.unit === 'problems' ? '問題数' : 
                                  goal.unit === 'points' ? '点数' : 
                                  goal.unit === 'percent' ? 'パーセント' : 
                                  goal.unit === 'people' ? '人数' : 
                                  goal.unit === 'hours' ? '時間' : '数値'}を入力してください:`, goal.currentValue || 0)
                                if (newValue !== null && !isNaN(parseInt(newValue))) {
                                  const value = parseInt(newValue)
                                  const progress = goal.targetValue > 0 ? Math.round((value / goal.targetValue) * 100) : 0
                                  setGoals(goals.map(g => 
                                    g.id === goal.id 
                                      ? { 
                                          ...g, 
                                          currentValue: value, 
                                          progress,
                                          progressHistory: [...(g.progressHistory || []), {
                                            date: new Date().toISOString(),
                                            value: value
                                          }]
                                        } 
                                      : g
                                  ))
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="進捗を更新"
                            >
                              📊
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {goals.length === 0 && (
                      <p className="text-gray-500 text-center">目標がまだ設定されていません</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 右側のコンテンツ */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-4">学習統計</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{currentStreak}</div>
                      <div className="text-sm text-gray-600">連続学習日数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">127</div>
                      <div className="text-sm text-gray-600">総学習時間</div>
                    </div>
                  </div>
                </div>

                {/* タスク手動追加 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-4">タスクを追加</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target)
                    const title = formData.get('taskTitle')
                    const minutes = formData.get('taskMinutes')
                    if (title && minutes) {
                      handleAddTask(title, parseInt(minutes))
                      e.target.reset()
                    }
                  }}>
                    <div className="space-y-3">
                      <input
                        name="taskTitle"
                        type="text"
                        placeholder="タスクの内容"
                        className="w-full p-2 border rounded-md"
                        required
                      />
                      <input
                        name="taskMinutes"
                        type="number"
                        placeholder="予定時間（分）"
                        className="w-full p-2 border rounded-md"
                        min="5"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                      >
                        タスクを追加
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {userRole === 'INSTRUCTOR' && currentView === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">講師ダッシュボード</h1>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold mb-4">担当生徒一覧</h2>
                <div className="space-y-2">
                  <div className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <p className="font-medium">山田太郎</p>
                    <p className="text-sm text-gray-500">未達成タスク: 2件</p>
                  </div>
                  <div className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <p className="font-medium">鈴木花子</p>
                    <p className="text-sm text-gray-500">未達成タスク: 0件</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold mb-4">通知</h2>
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm">山田太郎さんの未達成タスクが10件を超えました</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {userRole === 'STUDENT' && currentView === 'ai-assistant' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">AI学習アシスタント</h1>
              <p className="text-gray-600">AIがあなたの学習をサポートします</p>
            </div>

            {currentAIMode === 'select' && (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-xl font-semibold mb-3">パーソナライズモード</h3>
                      <p className="text-gray-600 mb-4">
                        AIとの対話を通じて、あなた専用の学習計画を作成します。
                        目標、現在のレベル、利用可能な時間などを詳しくお聞きして、
                        最適化された学習プランを提案します。
                      </p>
                      <button
                        onClick={() => handleAIModeSelect('personalize')}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        学習計画を作成する
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-colors">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🤝</div>
                      <h3 className="text-xl font-semibold mb-3">コンパニオンモード</h3>
                      <p className="text-gray-600 mb-4">
                        作成された学習計画に基づいて、日々の学習をサポートします。
                        今日やるべきタスクの提案、進捗の確認、モチベーション維持など、
                        継続的な学習をお手伝いします。
                      </p>
                      <button
                        onClick={() => handleAIModeSelect('companion')}
                        className={`w-full py-3 px-4 rounded-md transition-colors ${
                          userKnowledge
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!userKnowledge}
                      >
                        {userKnowledge ? '学習サポートを開始' : '学習計画が必要です'}
                      </button>
                    </div>
                  </div>
                </div>

                {userKnowledge && (
                  <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">現在の学習計画</h3>
                        <p className="text-gray-600">目標: {userKnowledge.goal}</p>
                        <p className="text-gray-600">期限: {userKnowledge.deadline}</p>
                      </div>
                      <button
                        onClick={handleResetKnowledge}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
                      >
                        計画をリセット
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentAIMode === 'personalize' && (
              <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                  <button
                    onClick={() => setCurrentAIMode('select')}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    ← モード選択に戻る
                  </button>
                </div>
                <PersonalizeMode
                  studentId="demo-student"
                  onComplete={handlePersonalizationComplete}
                />
              </div>
            )}

            {currentAIMode === 'companion' && userKnowledge && (
              <div className="max-w-4xl mx-auto">
                <div className="mb-4 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentAIMode('select')}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    ← モード選択に戻る
                  </button>
                  <div className="text-sm text-gray-600">
                    目標: {userKnowledge.goal} | 期限: {userKnowledge.deadline}
                  </div>
                </div>
                <CompanionMode
                  userKnowledge={userKnowledge}
                  onKnowledgeUpdate={handleKnowledgeUpdate}
                  onTasksGenerated={setTodayTasks}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 目標追加・編集モーダル */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingGoal ? '目標を編集' : '新しい目標を追加'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              const targetValue = parseInt(formData.get('targetValue'))
              const currentValue = editingGoal ? parseInt(formData.get('currentValue') || 0) : 0
              const progress = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0
              
              handleSaveGoal({
                title: formData.get('title'),
                deadline: formData.get('deadline'),
                description: formData.get('description'),
                measurementType: formData.get('measurementType'),
                unit: formData.get('unit'),
                targetValue,
                currentValue,
                progress
              })
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">目標名</label>
                  <input
                    name="title"
                    type="text"
                    defaultValue={editingGoal?.title}
                    className="w-full p-2 border rounded-md"
                    required
                    placeholder="例：TOEIC 800点取得"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">期限</label>
                  <input
                    name="deadline"
                    type="date"
                    defaultValue={editingGoal?.deadline}
                    className="w-full p-2 border rounded-md"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">説明（任意）</label>
                  <textarea
                    name="description"
                    defaultValue={editingGoal?.description}
                    className="w-full p-2 border rounded-md"
                    rows="3"
                    placeholder="目標についての詳細"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">集計方針</label>
                  <select
                    name="measurementType"
                    defaultValue={editingGoal?.measurementType || 'sum'}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="sum">合計（上回れば達成）</option>
                    <option value="average">平均（上回れば達成）</option>
                    <option value="max">最大（上回れば達成）</option>
                    <option value="min">最小（下回れば達成）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">単位</label>
                  <select
                    name="unit"
                    defaultValue={editingGoal?.unit || 'pages'}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="pages">ページ</option>
                    <option value="problems">問題</option>
                    <option value="points">点</option>
                    <option value="percent">％</option>
                    <option value="people">人</option>
                    <option value="hours">時間</option>
                    <option value="custom">カスタム単位を作成</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">目標数値</label>
                  <input
                    name="targetValue"
                    type="number"
                    defaultValue={editingGoal?.targetValue}
                    className="w-full p-2 border rounded-md"
                    required
                    min="1"
                    placeholder="例：500（ページ）"
                  />
                </div>
                {editingGoal && (
                  <div>
                    <label className="block text-sm font-medium mb-1">現在の達成数値</label>
                    <input
                      name="currentValue"
                      type="number"
                      defaultValue={editingGoal.currentValue || 0}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      placeholder="例：225（ページ）"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalModal(false)
                    setEditingGoal(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingGoal ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App