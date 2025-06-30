import { useState, useEffect } from 'react'
import { PersonalizeMode } from './components/PersonalizeMode';
import { CompanionMode } from './components/CompanionMode';
import { LoginScreen } from './components/LoginScreen';
import InstructorDailyPlanner from './components/InstructorView';
import { MonthlyCalendar } from './components/MonthlyCalendar';
import { StudyBookManager } from './components/StudyBookManager';
import { DailyTaskPool } from './components/DailyTaskPool';
import { CalendarWithSchedule } from './components/CalendarWithSchedule';
import { ProfileSettings } from './components/ProfileSettings';
import { ImprovedDailyPlanner } from './components/ImprovedDailyPlanner';
import { generateStudyPlan, convertPlansToTasks, calculateStudyPlanStats } from './utils/studyPlanGenerator';
import authService from './services/authService';

function App() {
  const [currentView, setCurrentView] = useState('goals')
  const [currentStreak] = useState(15)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('STUDENT')
  const [currentUser, setCurrentUser] = useState(null)
  const [goals, setGoals] = useState([])
  const [todayTasks, setTodayTasks] = useState([])
  const [scheduledTasks, setScheduledTasks] = useState({})
  const [completedTasks, setCompletedTasks] = useState({})
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewMode, setViewMode] = useState('week')
  const [overdueTasks, setOverdueTasks] = useState([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // 新機能の状態
  const [studyBooks, setStudyBooks] = useState([])
  const [studyPlans, setStudyPlans] = useState({})
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailyTaskPool, setDailyTaskPool] = useState([])

  // AI機能の状態
  const [currentAIMode, setCurrentAIMode] = useState('select');
  const [userKnowledge, setUserKnowledge] = useState(null);

  // 新機能のハンドラー関数
  const handleDateClick = (date) => {
    setSelectedDate(date)
    const dateKey = date.toISOString().split('T')[0]
    const dayPlans = studyPlans[dateKey] || []
    const tasksFromCalendar = convertPlansToTasks(dayPlans)
    
    // 選択した日付の週を計算してweekOffsetを設定
    const today = new Date()
    const todayKey = today.toISOString().split('T')[0]
    const isToday = dateKey === todayKey
    
    // 選択した日付が含まれる週のオフセットを計算
    const selectedWeekStart = new Date(date)
    const selectedDayOfWeek = selectedWeekStart.getDay()
    selectedWeekStart.setDate(selectedWeekStart.getDate() - selectedDayOfWeek)
    
    const todayWeekStart = new Date(today)
    const todayDayOfWeek = todayWeekStart.getDay()
    todayWeekStart.setDate(todayWeekStart.getDate() - todayDayOfWeek)
    
    const weekDiff = Math.round((selectedWeekStart - todayWeekStart) / (7 * 24 * 60 * 60 * 1000))
    setWeekOffset(weekDiff)
    
    if (isToday) {
      // 今日の場合は、今日のタスクプールに追加
      setTodayTasks(prevTasks => {
        const existingTaskIds = prevTasks.map(task => task.id)
        const newTasks = tasksFromCalendar.filter(task => !existingTaskIds.includes(task.id))
        return [...prevTasks, ...newTasks]
      })
      // デイリータスクプールはクリア
      setDailyTaskPool([])
    } else {
      // 今日以外の場合は、デイリータスクプールのみ設定
      setDailyTaskPool(tasksFromCalendar)
    }
    
    setCurrentView('planner')
  }

  // 参考書学習計画生成関数
  const generateBookStudyPlan = (goal) => {
    const totalPages = goal.totalPages
    const excludeDays = goal.excludeDays || [] // 0=日曜日, 1=月曜日, ..., 6=土曜日
    
    // 日付文字列を年、月、日に分解して正確にDateオブジェクトを作成
    const [startYear, startMonth, startDay] = goal.startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = goal.endDate.split('-').map(Number)
    
    const startDate = new Date(startYear, startMonth - 1, startDay) // 月は0ベース
    const endDate = new Date(endYear, endMonth - 1, endDay)
    
    console.log('開始日:', startDate.toDateString(), '終了日:', endDate.toDateString())
    
    // 学習可能日数を計算
    const studyDays = []
    const currentDate = new Date(startDate)
    
    // 開始日から終了日まで1日ずつチェック
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      if (!excludeDays.includes(dayOfWeek)) {
        studyDays.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    
    if (studyDays.length === 0) {
      alert('学習可能な日がありません。除外する曜日を見直してください。')
      return { dailyPages: 0, schedule: [] }
    }
    
    // 1日あたりのページ数を計算
    const dailyPages = Math.ceil(totalPages / studyDays.length)
    
    // 学習スケジュールを生成
    const schedule = []
    let currentPage = 1
    
    studyDays.forEach((date, index) => {
      const startPage = currentPage
      const endPage = Math.min(currentPage + dailyPages - 1, totalPages)
      const pages = endPage - startPage + 1
      
      // 日付をYYYY-MM-DD形式で正確に生成
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      schedule.push({
        date: dateString,
        startPage,
        endPage,
        pages
      })
      
      
      currentPage = endPage + 1
    })
    
    return { dailyPages, schedule }
  }

  const handleGenerateStudyPlan = () => {
    if (studyBooks.length === 0) {
      alert('参考書を追加してから学習計画を生成してください。')
      return
    }
    
    const newStudyPlans = generateStudyPlan(studyBooks, new Date())
    setStudyPlans(newStudyPlans)
    
    // 今日の日付のタスクがあれば、今日のタスクプールに追加
    const today = new Date()
    const todayKey = today.toISOString().split('T')[0]
    const todayPlans = newStudyPlans[todayKey] || []
    
    if (todayPlans.length > 0) {
      const todayTasks = convertPlansToTasks(todayPlans)
      
      setTodayTasks(prevTasks => {
        const existingTaskIds = prevTasks.map(task => task.id)
        const newTasks = todayTasks.filter(task => !existingTaskIds.includes(task.id))
        return [...prevTasks, ...newTasks]
      })
    }
    
    const stats = calculateStudyPlanStats(newStudyPlans, studyBooks)
    alert(`学習計画を生成しました！\n総学習日数: ${stats.totalDays}日\n総学習時間: ${stats.totalHours}時間${todayPlans.length > 0 ? '\n今日のタスクプールに追加されました！' : ''}`)
  }

  const handleTaskDragStart = (e, task) => {
    e.dataTransfer.setData('task', JSON.stringify(task))
    e.dataTransfer.setData('fromLocation', 'pool')
  }

  // 基本的なハンドラー関数
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
    
    if (newScheduledTasks[key]) return
    
    // タスクプールからの移動
    if (fromLocation === 'pool') {
      if (dailyTaskPool.length > 0) {
        setDailyTaskPool(dailyTaskPool.filter(t => t.id !== task.id))
      } else {
        setTodayTasks(todayTasks.filter(t => t.id !== task.id))
      }
    }
    // スケジュール間での移動
    else if (fromLocation.startsWith('scheduled-')) {
      const oldKey = fromLocation.replace('scheduled-', '')
      delete newScheduledTasks[oldKey]
    }
    
    newScheduledTasks[key] = {
      ...task,
      duration: task.duration || 1 // 既存のdurationを保持、なければ1時間
    }
    setScheduledTasks(newScheduledTasks)
  }

  const handleTaskClick = (task, taskKey) => {
    // スケジュールされたタスクをタスクプールに戻す
    const newScheduledTasks = { ...scheduledTasks }
    delete newScheduledTasks[taskKey]
    setScheduledTasks(newScheduledTasks)
    
    // 今日の日付かどうかをチェック
    const today = new Date()
    const todayKey = today.toISOString().split('T')[0]
    const taskDate = taskKey.split('-')[0] + '-' + taskKey.split('-')[1] + '-' + taskKey.split('-')[2]
    const isToday = taskDate === todayKey
    
    if (isToday) {
      // 今日のタスクプールに戻す
      setTodayTasks(prevTasks => [...prevTasks, task])
    } else {
      // デイリータスクプールに戻す
      setDailyTaskPool(prevTasks => [...prevTasks, task])
    }
  }

  // 優先順位による色を取得する関数
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    }
    return colors[priority] || colors.medium
  }

  const toggleTaskComplete = (taskId, location) => {
    if (location === 'pool') {
      if (dailyTaskPool.length > 0) {
        setDailyTaskPool(dailyTaskPool.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ))
      } else {
        setTodayTasks(todayTasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ))
      }
    } else if (location.startsWith('scheduled-')) {
      const key = location.replace('scheduled-', '')
      setCompletedTasks({
        ...completedTasks,
        [key]: !completedTasks[key]
      })
    }
  }

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

  useEffect(() => {
    // Supabase認証状態を確認
    const checkAuthStatus = async () => {
      try {
        const result = await authService.getCurrentUser();
        if (result.success && result.user) {
          setCurrentUser(result.user);
          setUserRole(result.user.role || 'STUDENT');
          setIsLoggedIn(true);
        } else {
          // セッションが無効な場合はログアウト
          handleLogout();
        }
      } catch (error) {
        console.error('認証状態確認エラー:', error);
        handleLogout();
      }
    };

    checkAuthStatus();

    // Supabaseの認証状態変更を監視
    const { data: { subscription } } = authService.supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          handleLogout();
        } else if (event === 'SIGNED_IN' && session) {
          // ユーザー情報を再取得
          const result = await authService.getCurrentUser();
          if (result.success && result.user) {
            setCurrentUser(result.user);
            setUserRole(result.user.role || 'STUDENT');
            setIsLoggedIn(true);
          }
        }
      }
    );

    // クリーンアップ関数
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
    
    // 状態をリセット
    setCurrentUser(null);
    setUserRole('STUDENT');
    setIsLoggedIn(false);
    setCurrentView('goals');
    // 他の状態もリセット
    setGoals([]);
    setTodayTasks([]);
    setScheduledTasks({});
    setCompletedTasks({});
    setStudyBooks([]);
    setStudyPlans({});
    setDailyTaskPool([]);
    setUserKnowledge(null);
    setCurrentAIMode('select');
  };

  // ユーザー情報更新のハンドラー
  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };


  if (!isLoggedIn) {
    return <LoginScreen onLogin={setIsLoggedIn} onRoleChange={setUserRole} />
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* モバイル用オーバーレイ */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* サイドバー */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out min-h-screen
        ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:h-screen lg:flex-shrink-0
      `}>
        <div className="p-6">
          <div className="flex items-center relative">
            <svg width="115" height="55" viewBox="0 0 115 55" className="flex-shrink-0">
              <circle cx="90" cy="20" r="13" fill="#67E8F9" opacity="0.85"/>
              <circle cx="73" cy="28" r="8" fill="#2563EB" opacity="0.9"/>
              <circle cx="83" cy="35" r="5" fill="#A7F3D0" opacity="0.75"/>
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
                onClick={() => setCurrentView('monthly-calendar')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'monthly-calendar' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📆 月間カレンダー
              </button>
              <button
                onClick={() => setCurrentView('study-books')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'study-books' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📚 参考書管理
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
          
          {/* プロフィール設定ボタン */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentView('profile')}
              className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                currentView === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              ⚙️ プロフィール設定
            </button>
          </div>
          
          {/* ログアウトボタン */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              🚪 ログアウト
            </button>
          </div>
        </nav>
      </div>

      {/* メインコンテンツ */}
      <div className="lg:ml-0 lg:flex-1">
        {/* モバイル用ヘッダー */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">suna</h1>
          <div className="w-10"></div> {/* スペーサー */}
        </div>

        <div className="p-4 lg:p-6">
        {userRole === 'STUDENT' && currentView === 'planner' && (
          <ImprovedDailyPlanner
            currentStreak={currentStreak}
            todayString={todayString}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            dailyTaskPool={dailyTaskPool}
            todayTasks={todayTasks}
            setDailyTaskPool={setDailyTaskPool}
            setTodayTasks={setTodayTasks}
            handleTaskDragStart={handleTaskDragStart}
            selectedDate={selectedDate}
            scheduledTasks={scheduledTasks}
            setScheduledTasks={setScheduledTasks}
            completedTasks={completedTasks}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleTaskClick={handleTaskClick}
            toggleTaskComplete={toggleTaskComplete}
            getPriorityColor={getPriorityColor}
            handleDragStart={handleDragStart}
            DailyTaskPool={DailyTaskPool}
          />
        )}

        {userRole === 'STUDENT' && currentView === 'monthly-calendar' && (
          <CalendarWithSchedule
            studyBooks={studyBooks}
            studyPlans={studyPlans}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
            dailyTaskPool={dailyTaskPool}
            onTasksUpdate={setDailyTaskPool}
            onTaskDragStart={handleTaskDragStart}
            scheduledTasks={scheduledTasks}
            completedTasks={completedTasks}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onTaskComplete={toggleTaskComplete}
            onDragStart={handleDragStart}
          />
        )}

        {userRole === 'STUDENT' && currentView === 'study-books' && (
          <div>
            <StudyBookManager
              studyBooks={studyBooks}
              onBooksUpdate={(updatedBooks) => {
                setStudyBooks(updatedBooks)
                // 参考書が更新されたら学習計画も自動更新
                if (updatedBooks.length > 0) {
                  const newStudyPlans = generateStudyPlan(updatedBooks, new Date())
                  setStudyPlans(newStudyPlans)
                }
              }}
              onGenerateStudyPlan={handleGenerateStudyPlan}
            />
          </div>
        )}

        {userRole === 'STUDENT' && currentView === 'goals' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold text-gray-900">目標管理</h1>
                <button
                  onClick={() => setCurrentView('ai-assistant')}
                  className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <span>🤖</span>
                  <span>AI学習プランナー</span>
                </button>
              </div>
              <button
                onClick={() => setShowGoalModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + 新しい目標を追加
              </button>
            </div>

            {/* AI学習アシスタントで作成された目標 */}
            {userKnowledge && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">🤖</span>
                  AI学習アシスタントで作成された目標
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{userKnowledge.user_profile?.goal?.name || 'AI目標'}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        AI作成
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">目標期限</p>
                        <p className="font-medium">{userKnowledge.user_profile?.goal?.deadline || '未設定'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">現在のレベル</p>
                        <p className="font-medium">{userKnowledge.user_profile?.current_status?.type}: {userKnowledge.user_profile?.current_status?.value}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">学習時間設定</p>
                        <p className="text-sm">平日: {userKnowledge.user_profile?.preferences?.study_hours?.weekday}</p>
                        <p className="text-sm">休日: {userKnowledge.user_profile?.preferences?.study_hours?.holiday}</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-600">進捗状況</p>
                          <p className="text-sm font-medium">0%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: '0%' }}
                          ></div>
                        </div>
                      </div>
                      
                      {userKnowledge.materials && userKnowledge.materials.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">学習教材</p>
                          <div className="space-y-1">
                            {userKnowledge.materials.map((material, index) => (
                              <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                                <p className="font-medium">{material.name}</p>
                                <p className="text-gray-600">
                                  {material.current_progress}/{material.total_amount} {material.type}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 手動で作成された目標 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📝</span>
                手動で作成された目標
              </h2>
              {goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              手動作成
                            </span>
                            {goal.goalType === 'book' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                📚 参考書目標
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {goal.description && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">説明</p>
                            <p className="text-sm">{goal.description}</p>
                          </div>
                        )}
                        
                        {goal.goalType === 'book' ? (
                          <>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">総ページ数</p>
                              <p className="font-medium">{goal.totalPages} ページ</p>
                            </div>
                            
                            {goal.dailyPages && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">1日あたりのページ数</p>
                                <p className="font-medium">{goal.dailyPages} ページ/日</p>
                              </div>
                            )}
                            
                            {goal.excludeDays && goal.excludeDays.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">除外曜日</p>
                                <p className="text-sm">
                                  {goal.excludeDays.map(day => ['日', '月', '火', '水', '木', '金', '土'][day]).join('、')}曜日
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">目標</p>
                            <p className="font-medium">
                              {goal.targetValue} {goal.unit}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1">期間</p>
                          <p className="font-medium">
                            {goal.startDate} 〜 {goal.endDate || goal.deadline}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1">進捗状況</p>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${goal.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{goal.progress || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">手動で作成された目標はありません</p>
                  <p className="text-sm text-gray-500 mt-2">「新しい目標を追加」ボタンから目標を作成できます</p>
                </div>
              )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-200"
                  onClick={() => setCurrentAIMode('personalize')}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h3 className="text-xl font-semibold">パーソナライズモード</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    あなたの学習スタイルや目標に合わせて、最適な学習計画を提案します。
                  </p>
                  <div className="text-sm text-blue-600 font-medium">
                    → 学習計画の最適化
                  </div>
                </div>

                <div
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-200"
                  onClick={() => setCurrentAIMode('companion')}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-2xl">🤝</span>
                    </div>
                    <h3 className="text-xl font-semibold">コンパニオンモード</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    学習中の質問や悩みに答え、モチベーションを維持するサポートを提供します。
                  </p>
                  <div className="text-sm text-green-600 font-medium">
                    → 学習サポート・質問対応
                  </div>
                </div>
              </div>
            )}

            {currentAIMode === 'personalize' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => setCurrentAIMode('select')}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    ← モード選択に戻る
                  </button>
                </div>
                <PersonalizeMode
                  userKnowledge={userKnowledge}
                  onKnowledgeUpdate={setUserKnowledge}
                />
              </div>
            )}

            {currentAIMode === 'companion' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => setCurrentAIMode('select')}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    ← モード選択に戻る
                  </button>
                </div>
                <CompanionMode />
              </div>
            )}
          </div>
        )}

        {userRole === 'INSTRUCTOR' && currentView === 'dashboard' && (
          <InstructorDailyPlanner />
        )}

        {currentView === 'profile' && (
          <ProfileSettings
            currentUser={currentUser}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </div>

      {/* 目標追加モーダル */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">
              {editingGoal ? '目標を編集' : '新しい目標を追加'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              const goalType = formData.get('goalType')
              
              const newGoal = {
                id: editingGoal ? editingGoal.id : Date.now(),
                title: formData.get('title'),
                description: formData.get('description'),
                unit: formData.get('unit'),
                aggregationMethod: formData.get('aggregationMethod'),
                targetValue: parseFloat(formData.get('targetValue')),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                progress: editingGoal ? editingGoal.progress : 0,
                deadline: formData.get('endDate'), // 互換性のため
                goalType: goalType,
                // 参考書目標の追加項目
                totalPages: goalType === 'book' ? parseInt(formData.get('totalPages')) : null,
                excludeDays: goalType === 'book' ? Array.from(formData.getAll('excludeDays')).map(d => parseInt(d)) : [],
                dailyPages: null // 後で計算
              }
              
              // 参考書目標の場合、学習計画を自動生成
              if (goalType === 'book' && newGoal.totalPages && newGoal.startDate && newGoal.endDate) {
                const studyPlan = generateBookStudyPlan(newGoal)
                newGoal.dailyPages = studyPlan.dailyPages
                
                // 月間カレンダーに反映
                const newStudyPlans = { ...studyPlans }
                studyPlan.schedule.forEach(day => {
                  const dateKey = day.date
                  if (!newStudyPlans[dateKey]) {
                    newStudyPlans[dateKey] = []
                  }
                  newStudyPlans[dateKey].push({
                    id: `${newGoal.id}-${dateKey}`,
                    bookTitle: newGoal.title,
                    startPage: day.startPage,
                    endPage: day.endPage,
                    pages: day.pages,
                    type: 'book-goal'
                  })
                })
                setStudyPlans(newStudyPlans)
                
                // 今日の日付のタスクがあれば、今日のタスクプールに追加
                const today = new Date()
                const todayKey = today.toISOString().split('T')[0]
                const todayPlans = studyPlan.schedule.filter(day => day.date === todayKey)
                
                if (todayPlans.length > 0) {
                  const todayTasks = convertPlansToTasks(todayPlans.map(day => ({
                    id: `${newGoal.id}-${day.date}`,
                    bookTitle: newGoal.title,
                    startPage: day.startPage,
                    endPage: day.endPage,
                    pages: day.pages,
                    type: 'book-goal'
                  })))
                  
                  setTodayTasks(prevTasks => {
                    const existingTaskIds = prevTasks.map(task => task.id)
                    const newTasks = todayTasks.filter(task => !existingTaskIds.includes(task.id))
                    return [...prevTasks, ...newTasks]
                  })
                }
              }
              
              if (editingGoal) {
                setGoals(goals.map(goal => goal.id === editingGoal.id ? newGoal : goal))
              } else {
                setGoals([...goals, newGoal])
              }
              
              setShowGoalModal(false)
              setEditingGoal(null)
            }}>
              <div className="space-y-6">
                {/* 目標タイプ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目標タイプ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="goalType"
                    defaultValue={editingGoal?.goalType || 'general'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    onChange={(e) => {
                      const goalTypeInputs = document.querySelectorAll('.goal-type-specific')
                      goalTypeInputs.forEach(input => {
                        input.style.display = e.target.value === 'book' ? 'block' : 'none'
                      })
                    }}
                  >
                    <option value="general">一般目標</option>
                    <option value="book">参考書目標</option>
                  </select>
                </div>

                {/* タイトル */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingGoal?.title || ''}
                    placeholder="タイトルを入力してください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 説明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingGoal?.description || ''}
                    placeholder="説明を入力してください"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 参考書専用項目 */}
                <div className="goal-type-specific" style={{ display: editingGoal?.goalType === 'book' ? 'block' : 'none' }}>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    <h4 className="font-medium text-blue-900">参考書学習設定</h4>
                    
                    {/* 総ページ数 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        総ページ数 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="totalPages"
                        defaultValue={editingGoal?.totalPages || ''}
                        placeholder="300"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 除外する曜日 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        学習しない曜日
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                          <label key={index} className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              name="excludeDays"
                              value={index}
                              defaultChecked={editingGoal?.excludeDays?.includes(index)}
                              className="rounded"
                            />
                            <span className="text-sm">{day}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        チェックした曜日は学習計画から除外されます
                      </p>
                    </div>
                  </div>
                </div>

                {/* 単位 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    単位 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unit"
                    defaultValue={editingGoal?.unit || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">単位を選択してください</option>
                    <option value="件">件</option>
                    <option value="円">円</option>
                    <option value="%">%</option>
                    <option value="人">人</option>
                    <option value="時間">時間</option>
                    <option value="ページ">ページ</option>
                    <option value="問題">問題</option>
                    <option value="点">点</option>
                  </select>
                </div>

                {/* 集計方針 */}
                {/* 集計方針は「全部到達したら達成」に固定 */}
                <input
                  type="hidden"
                  name="aggregationMethod"
                  value="全部到達したら達成"
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">達成条件</p>
                      <p className="text-sm text-blue-700">全ての科目で目標数値に到達したら達成となります</p>
                    </div>
                  </div>
                </div>

                {/* 目標数値 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目標数値 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="targetValue"
                    defaultValue={editingGoal?.targetValue || ''}
                    placeholder="1"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 期間 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    期間 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="date"
                        name="startDate"
                        defaultValue={editingGoal?.startDate || new Date().toISOString().split('T')[0]}
                        placeholder="開始日を選択"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-2 text-gray-500">〜</span>
                      <input
                        type="date"
                        name="endDate"
                        defaultValue={editingGoal?.endDate || editingGoal?.deadline || ''}
                        placeholder="終了日を選択"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalModal(false)
                    setEditingGoal(null)
                  }}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  完了
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
  )
}

export default App