import { useState, useEffect } from 'react'
import { PersonalizeMode } from './components/PersonalizeMode';
import { CompanionMode } from './components/CompanionMode';
import { LoginScreen } from './components/LoginScreen';
import InstructorDashboard from './components/InstructorView';
import { MonthlyCalendar } from './components/MonthlyCalendar';
import { StudyBookManager } from './components/StudyBookManager';
import { DailyTaskPool } from './components/DailyTaskPool';
import { CalendarWithSchedule } from './components/CalendarWithSchedule';
import { ProfileSettings } from './components/ProfileSettings';
import { ImprovedDailyPlanner } from './components/ImprovedDailyPlanner';
import { OverdueTaskPool } from './components/OverdueTaskPool';
import { generateStudyPlan, convertPlansToTasks, calculateStudyPlanStats } from './utils/studyPlanGenerator';
import { detectOverdueTasks, sortOverdueTasks } from './utils/overdueTaskDetector';
import authService, { auth } from './services/authService';
import './styles/touch-fixes.css';

function App() {
  const [currentView, setCurrentView] = useState('goals')
  const [currentStreak] = useState(15)
  // LocalStorageからログイン状態を復元
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('isLoggedIn') === 'true'
    } catch {
      return false
    }
  })
  const [userRole, setUserRole] = useState(() => {
    try {
      return localStorage.getItem('userRole') || 'INSTRUCTOR'
    } catch {
      return 'INSTRUCTOR'
    }
  })
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('currentUser')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
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
  
  // 未達成タスクプール用の状態
  const [overdueTaskPool, setOverdueTaskPool] = useState([])
  const [lastOverdueCheck, setLastOverdueCheck] = useState(new Date())

  // AI機能の状態
  const [currentAIMode, setCurrentAIMode] = useState('select');
  const [userKnowledge, setUserKnowledge] = useState(null);

  // 新機能のハンドラー関数
  const handleDateClick = (date) => {
    setSelectedDate(date)
    const dateKey = date.toISOString().split('T')[0]
    const dayPlans = studyPlans[dateKey] || []
    const tasksFromCalendar = convertPlansToTasks(dayPlans)
    
    // デバッグ用：学習プランとタスクの内容を比較
    console.log('📅 月間カレンダー用学習プラン:', dayPlans)
    console.log('📋 タスクプール用変換タスク:', tasksFromCalendar)
    
    // 詳細なデバッグ：問題ベースの場合の比較
    dayPlans.forEach((plan, index) => {
      if (plan.studyType === 'problems') {
        const task = tasksFromCalendar[index]
        console.log(`🔍 問題ベース比較 [${index}] - ${plan.bookTitle}:`)
        console.log('  学習プラン:', {
          startProblem: plan.startProblem,
          endProblem: plan.endProblem,
          problems: plan.problems
        })
        console.log('  タスク:', {
          startProblem: task?.startProblem,
          endProblem: task?.endProblem,
          problems: task?.problems,
          title: task?.title
        })
        
        const isMatching = plan.startProblem === task?.startProblem &&
                          plan.endProblem === task?.endProblem &&
                          plan.problems === task?.problems
        
        console.log(`  一致性: ${isMatching ? '✅ 一致' : '❌ 不一致'}`)
        
        if (!isMatching) {
          console.log('  ❌ 不一致が検出されました！')
          console.log('  差分:', {
            startProblem: `${plan.startProblem} → ${task?.startProblem}`,
            endProblem: `${plan.endProblem} → ${task?.endProblem}`,
            problems: `${plan.problems} → ${task?.problems}`
          })
        }
      }
    })
    
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
      const existingTaskIds = todayTasks.map(task => task.id)
      const newTasks = tasksFromCalendar.filter(task => !existingTaskIds.includes(task.id))
      updateTodayTasks([...todayTasks, ...newTasks])
      // デイリータスクプールはクリア
      updateDailyTaskPool([])
    } else {
      // 今日以外の場合は、デイリータスクプールのみ設定
      updateDailyTaskPool(tasksFromCalendar)
    }
    
    setCurrentView('planner')
  }

  // 未達成タスクプール管理関数
  const updateOverdueTaskPool = () => {
    console.log('🔍 未達成タスクを検出中...')
    const detectedOverdueTasks = detectOverdueTasks(studyPlans, completedTasks)
    const sortedOverdueTasks = sortOverdueTasks(detectedOverdueTasks)
    
    console.log('⚠️ 検出された未達成タスク:', sortedOverdueTasks)
    setOverdueTaskPool(sortedOverdueTasks)
    setLastOverdueCheck(new Date())
  }

  // 未達成タスクの完了処理
  const handleOverdueTaskComplete = (taskId) => {
    console.log('✅ 未達成タスクを完了:', taskId)
    
    // 完了状態を更新
    const newCompletedTasks = {
      ...completedTasks,
      [taskId]: true
    }
    setCompletedTasks(newCompletedTasks)
    
    // 未達成タスクプールから除去
    const updatedOverdueTasks = overdueTaskPool.filter(task => task.id !== taskId)
    setOverdueTaskPool(updatedOverdueTasks)
    
    // Supabaseと同期
    if (isLoggedIn && currentUser) {
      setTimeout(async () => {
        try {
          const task = overdueTaskPool.find(t => t.id === taskId)
          if (task) {
            await authService.updateTask(taskId, {
              ...task,
              completed: true
            })
            console.log('✅ 未達成タスク完了状態をSupabaseと同期完了')
          }
        } catch (error) {
          console.warn('未達成タスク完了状態同期エラー:', error)
        }
      }, 500)
    }
  }

  // 未達成タスクの削除処理
  const handleOverdueTaskDelete = (taskId) => {
    console.log('🗑️ 未達成タスクを削除:', taskId)
    
    // 未達成タスクプールから除去
    const updatedOverdueTasks = overdueTaskPool.filter(task => task.id !== taskId)
    setOverdueTaskPool(updatedOverdueTasks)
    
    // 学習プランからも削除
    const updatedStudyPlans = { ...studyPlans }
    Object.keys(updatedStudyPlans).forEach(dateKey => {
      updatedStudyPlans[dateKey] = updatedStudyPlans[dateKey].filter(plan => plan.id !== taskId)
    })
    setStudyPlans(updatedStudyPlans)
    
    // Supabaseと同期
    if (isLoggedIn && currentUser) {
      setTimeout(async () => {
        try {
          await authService.deleteTask(taskId)
          console.log('🗑️ 未達成タスク削除をSupabaseと同期完了')
        } catch (error) {
          console.warn('未達成タスク削除同期エラー:', error)
        }
      }, 500)
    }
  }

  // 未達成タスクの定期チェック（1分ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      updateOverdueTaskPool()
    }, 60000) // 1分ごと
    
    return () => clearInterval(interval)
  }, [studyPlans, completedTasks])

  // 学習プランや完了状態が変更されたときに未達成タスクを再検出
  useEffect(() => {
    updateOverdueTaskPool()
  }, [studyPlans, completedTasks])

  // 参考書学習計画生成関数（ページ・問題両対応）
  const generateBookStudyPlan = (goal) => {
    const isProblems = goal.studyType === 'problems'
    const totalUnits = isProblems ? goal.totalProblems : goal.totalPages
    const excludeDays = goal.excludeDays || [] // 0=日曜日, 1=月曜日, ..., 6=土曜日
    
    // 日付文字列を年、月、日に分解して正確にDateオブジェクトを作成
    const [startYear, startMonth, startDay] = goal.startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = goal.endDate.split('-').map(Number)
    
    const startDate = new Date(startYear, startMonth - 1, startDay) // 月は0ベース
    const endDate = new Date(endYear, endMonth - 1, endDay)
    
    console.log(`学習計画生成（${isProblems ? '問題' : 'ページ'}ベース）:`,
                '開始日:', startDate.toDateString(), '終了日:', endDate.toDateString())
    
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
      return {
        dailyPages: 0,
        dailyProblems: 0,
        schedule: []
      }
    }
    
    // 1日あたりの単位数を計算
    const dailyUnits = Math.ceil(totalUnits / studyDays.length)
    
    // 学習スケジュールを生成
    const schedule = []
    let currentUnit = 1
    
    studyDays.forEach((date, index) => {
      const startUnit = currentUnit
      const endUnit = Math.min(currentUnit + dailyUnits - 1, totalUnits)
      const units = endUnit - startUnit + 1
      
      // 日付をYYYY-MM-DD形式で正確に生成
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      if (isProblems) {
        schedule.push({
          date: dateString,
          startProblem: startUnit,
          endProblem: endUnit,
          problems: units,
          studyType: 'problems'
        })
      } else {
        schedule.push({
          date: dateString,
          startPage: startUnit,
          endPage: endUnit,
          pages: units,
          studyType: 'pages'
        })
      }
      
      currentUnit = endUnit + 1
    })
    
    return {
      dailyPages: isProblems ? 0 : dailyUnits,
      dailyProblems: isProblems ? dailyUnits : 0,
      schedule
    }
  }

  const handleGenerateStudyPlan = () => {
    if (studyBooks.length === 0) {
      alert('参考書を追加してから学習計画を生成してください。')
      return
    }
    
    const newStudyPlans = generateStudyPlan(studyBooks, new Date())
    setStudyPlans(newStudyPlans)
    
    // 今日の日付のタスクがあれば、今日のタスクプールを完全に置き換え
    const today = new Date()
    const todayKey = today.toISOString().split('T')[0]
    const todayPlans = newStudyPlans[todayKey] || []
    
    // デバッグログ：今日のタスク取得処理
    console.log('🔍 今日のタスク取得処理:')
    console.log(`  今日の日付: ${todayKey} (曜日: ${today.getDay()})`)
    console.log(`  生成された学習プラン:`, newStudyPlans)
    console.log(`  今日の学習プラン:`, todayPlans)
    
    if (todayPlans.length > 0) {
      const todayTasksToAdd = convertPlansToTasks(todayPlans)
      
      // デバッグログ：変換されたタスク
      console.log(`  変換されたタスク:`, todayTasksToAdd)
      
      // 既存の今日のタスクの中からカレンダー由来のタスクを除去
      const nonCalendarTasks = todayTasks.filter(task => task.source !== 'calendar')
      
      // 新しいカレンダータスクと手動追加タスクを組み合わせ
      updateTodayTasks([...nonCalendarTasks, ...todayTasksToAdd])
    } else {
      // 今日の計画がない場合は、カレンダー由来のタスクのみを削除
      const nonCalendarTasks = todayTasks.filter(task => task.source !== 'calendar')
      updateTodayTasks(nonCalendarTasks)
    }
    
    const stats = calculateStudyPlanStats(newStudyPlans, studyBooks)
    alert(`学習計画を生成しました！\n総学習日数: ${stats.totalDays}日\n総学習時間: ${stats.totalHours}時間${todayPlans.length > 0 ? '\n今日のタスクプールに追加されました！' : ''}`)
  }

  // タッチデバイス用の状態
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragFromLocation, setDragFromLocation] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

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

  // タッチイベント用のハンドラー
  const handleTouchStart = (e, task, fromLocation = null) => {
    e.preventDefault()
    setDraggedTask(task)
    setDragFromLocation(fromLocation || 'pool')
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
  }

  const handleTouchEnd = (e, dateKey = null, hour = null) => {
    if (!isDragging || !draggedTask) return
    
    e.preventDefault()
    
    // タッチ位置から要素を取得
    const touch = e.changedTouches[0]
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    
    // ドロップ可能な要素を探す
    let dropTarget = elementBelow
    while (dropTarget && !dropTarget.dataset.dropzone) {
      dropTarget = dropTarget.parentElement
    }
    
    if (dropTarget && dropTarget.dataset.dropzone) {
      const [targetDate, targetHour] = dropTarget.dataset.dropzone.split('-')
      handleTaskDrop(draggedTask, dragFromLocation, targetDate, parseInt(targetHour))
    }
    
    // リセット
    setDraggedTask(null)
    setDragFromLocation(null)
    setIsDragging(false)
  }

  // 統一されたドロップ処理
  const handleTaskDrop = (task, fromLocation, dateKey, hour) => {
    const newScheduledTasks = { ...scheduledTasks }
    const key = `${dateKey}-${hour}`
    
    if (newScheduledTasks[key]) return
    
    // タスクプールからの移動
    if (fromLocation === 'pool') {
      if (dailyTaskPool.length > 0) {
        updateDailyTaskPool(dailyTaskPool.filter(t => t.id !== task.id))
      } else {
        updateTodayTasks(todayTasks.filter(t => t.id !== task.id))
      }
    }
    // スケジュール間での移動
    else if (fromLocation && fromLocation.startsWith('scheduled-')) {
      const oldKey = fromLocation.replace('scheduled-', '')
      delete newScheduledTasks[oldKey]
    }
    
    newScheduledTasks[key] = {
      ...task,
      duration: task.duration || 1
    }
    setScheduledTasks(newScheduledTasks)
  }

  const handleDrop = (e, dateKey, hour) => {
    e.preventDefault()
    const task = JSON.parse(e.dataTransfer.getData('task'))
    const fromLocation = e.dataTransfer.getData('fromLocation')
    handleTaskDrop(task, fromLocation, dateKey, hour)
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
      updateTodayTasks([...todayTasks, task])
    } else {
      // デイリータスクプールに戻す
      updateDailyTaskPool([...dailyTaskPool, task])
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
        const updatedTasks = dailyTaskPool.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
        updateDailyTaskPool(updatedTasks)
      } else {
        const updatedTasks = todayTasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
        updateTodayTasks(updatedTasks)
      }
    } else if (location.startsWith('scheduled-')) {
      const key = location.replace('scheduled-', '')
      const newCompletedTasks = {
        ...completedTasks,
        [key]: !completedTasks[key]
      }
      setCompletedTasks(newCompletedTasks)
      
      // スケジュールされたタスクの完了状態もSupabaseと同期
      if (isLoggedIn && currentUser && scheduledTasks[key]) {
        setTimeout(async () => {
          try {
            const task = scheduledTasks[key]
            await authService.updateTask(task.id, {
              ...task,
              completed: newCompletedTasks[key]
            })
            console.log('スケジュールタスク完了状態をSupabaseと同期完了')
          } catch (error) {
            console.warn('スケジュールタスク完了状態同期エラー:', error)
          }
        }, 500)
      }
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

  // ログイン状態をLocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem('isLoggedIn', isLoggedIn.toString())
    } catch (error) {
      console.warn('LocalStorage保存エラー (isLoggedIn):', error)
    }
  }, [isLoggedIn])

  useEffect(() => {
    try {
      localStorage.setItem('userRole', userRole)
    } catch (error) {
      console.warn('LocalStorage保存エラー (userRole):', error)
    }
  }, [userRole])

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser))
      } else {
        localStorage.removeItem('currentUser')
      }
    } catch (error) {
      console.warn('LocalStorage保存エラー (currentUser):', error)
    }
  }, [currentUser])

  useEffect(() => {
    console.log('App.jsx 初期化開始（永続化セッション対応版）');
    
    // LocalStorageからの復元を優先し、Supabaseセッションは補助的に使用
    const initializeAuth = async () => {
      try {
        // LocalStorageにログイン状態がある場合は、それを信頼
        const savedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        const savedUser = localStorage.getItem('currentUser')
        
        if (savedIsLoggedIn && savedUser) {
          console.log('LocalStorageからセッション復元成功');
          const user = JSON.parse(savedUser)
          setCurrentUser(user);
          setUserRole(user.role || 'STUDENT');
          setIsLoggedIn(true);
          return
        }
        
        // LocalStorageにない場合のみSupabaseセッションを確認
        await authService.initializeSession();
        const user = authService.getCurrentUser();
        
        if (user) {
          console.log('Supabaseセッション復元成功:', user.email);
          setCurrentUser(user);
          setUserRole(user.role || 'STUDENT');
          setIsLoggedIn(true);
        } else {
          console.log('セッションなし - ログイン画面表示');
          // LocalStorageもクリア
          localStorage.removeItem('isLoggedIn')
          localStorage.removeItem('userRole')
          localStorage.removeItem('currentUser')
          setCurrentUser(null);
          setUserRole('STUDENT');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.warn('セッション復元エラー:', error);
        // エラー時はLocalStorageをクリア
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userRole')
        localStorage.removeItem('currentUser')
        setCurrentUser(null);
        setUserRole('STUDENT');
        setIsLoggedIn(false);
      }
    };
    
    initializeAuth();
    console.log('App.jsx 初期化完了（永続化セッション対応）');
  }, []);

  // ログイン状態変更時にユーザーデータを即座に読み込み
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      console.log('ログイン後のデータ読み込みを即座に実行');
      // データ永続化のため、即座に実行
      loadUserData();
    }
  }, [isLoggedIn]); // currentUserを依存関係から削除


  // タスクデータの軽量キャッシュ（パフォーマンス向上のため）
  useEffect(() => {
    if (isLoggedIn && todayTasks.length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('todayTasks_cache', JSON.stringify(todayTasks));
        console.log('今日のタスクをキャッシュ:', todayTasks.length, '件');
      }, 1000); // 1秒遅延でキャッシュ
      return () => clearTimeout(timeoutId);
    }
  }, [todayTasks, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && Object.keys(scheduledTasks).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('scheduledTasks_cache', JSON.stringify(scheduledTasks));
        console.log('スケジュールタスクをキャッシュ:', Object.keys(scheduledTasks).length, '件');
      }, 1000); // 1秒遅延でキャッシュ
      return () => clearTimeout(timeoutId);
    }
  }, [scheduledTasks, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && Object.keys(completedTasks).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('completedTasks_cache', JSON.stringify(completedTasks));
        console.log('完了タスクをキャッシュ:', Object.keys(completedTasks).length, '件');
      }, 1000); // 1秒遅延でキャッシュ
      return () => clearTimeout(timeoutId);
    }
  }, [completedTasks, isLoggedIn]);

  // ユーザーデータ読み込み関数
  const loadUserData = async () => {
    try {
      console.log('全ユーザーデータ読み込み開始');
      
      // 目標データを読み込み
      const goalsResult = await authService.getGoals();
      if (goalsResult.success) {
        setGoals(goalsResult.goals);
        console.log('目標データ読み込み完了:', goalsResult.goals.length, '件');
      }
      
      // 参考書データを読み込み
      try {
        const booksResult = await authService.getStudyBooks();
        if (booksResult.success) {
          setStudyBooks(booksResult.books || []);
          console.log('参考書データ読み込み完了:', (booksResult.books || []).length, '件');
        }
      } catch (booksError) {
        console.warn('参考書データ読み込みエラー:', booksError);
      }
      
      // 学習プランデータを読み込み
      try {
        const plansResult = await authService.getUserStudyPlans();
        if (plansResult.success) {
          setStudyPlans(plansResult.plans || {});
          console.log('学習プランデータ読み込み完了:', Object.keys(plansResult.plans || {}).length, '日分');
        }
      } catch (plansError) {
        console.warn('学習プランデータ読み込みエラー:', plansError);
      }
      
      // 注意：AI学習アシスタントのユーザー知識データについては、
      // 現在AuthServiceに対応するメソッドが存在しないため、
      // このデータのみローカル状態で管理されます
      console.log('AI知識データは現在ローカル管理です');
      
      // Supabaseからタスクデータを取得（主要データソース）
      try {
        console.log('Supabaseからタスクデータ取得開始');
        
        // 今日のタスク取得
        const todayResult = await authService.getTodayTasks();
        if (todayResult.success && todayResult.tasks) {
          setTodayTasks(todayResult.tasks);
          console.log('今日のタスク取得成功:', todayResult.tasks.length, '件');
        }
        
        // 週間スケジュールタスク取得
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 13); // 2週間分
        
        const scheduledResult = await authService.getScheduledTasks(
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );
        
        if (scheduledResult.success && scheduledResult.tasks) {
          // タスクをスケジュール形式に変換
          const scheduledMap = {};
          const completedMap = {};
          
          scheduledResult.tasks.forEach(task => {
            if (task.scheduledDate && task.scheduledTime) {
              const key = `${task.scheduledDate}-${task.scheduledTime.split(':')[0]}`;
              scheduledMap[key] = task;
              if (task.completed) {
                completedMap[key] = true;
              }
            }
          });
          
          setScheduledTasks(scheduledMap);
          setCompletedTasks(completedMap);
          console.log('スケジュールタスク取得成功:', Object.keys(scheduledMap).length, '件');
        }
        
        // 軽量キャッシュも更新（オフライン対応）
        try {
          if (todayResult.success && todayResult.tasks) {
            localStorage.setItem('todayTasks_cache', JSON.stringify(todayResult.tasks));
          }
          if (scheduledResult.success) {
            localStorage.setItem('scheduledTasks_cache', JSON.stringify(scheduledMap || {}));
            localStorage.setItem('completedTasks_cache', JSON.stringify(completedMap || {}));
          }
        } catch (cacheError) {
          console.warn('キャッシュ更新エラー:', cacheError);
        }
        
      } catch (supabaseError) {
        console.warn('Supabaseタスク取得エラー、キャッシュから復元を試行:', supabaseError);
        
        // Supabase取得に失敗した場合のみキャッシュから復元
        try {
          const cachedTasks = localStorage.getItem('todayTasks_cache');
          const cachedScheduled = localStorage.getItem('scheduledTasks_cache');
          const cachedCompleted = localStorage.getItem('completedTasks_cache');
          
          if (cachedTasks) {
            const tasks = JSON.parse(cachedTasks);
            setTodayTasks(tasks);
            console.log('今日のタスクをキャッシュから復元:', tasks.length, '件');
          }
          
          if (cachedScheduled) {
            const scheduled = JSON.parse(cachedScheduled);
            setScheduledTasks(scheduled);
            console.log('スケジュールタスクをキャッシュから復元:', Object.keys(scheduled).length, '件');
          }
          
          if (cachedCompleted) {
            const completed = JSON.parse(cachedCompleted);
            setCompletedTasks(completed);
            console.log('完了タスクをキャッシュから復元:', Object.keys(completed).length, '件');
          }
        } catch (cacheError) {
          console.warn('キャッシュからの復元もエラー:', cacheError);
        }
      }
      
    } catch (error) {
      console.warn('ユーザーデータ読み込みエラー:', error);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
    
    // LocalStorageをクリア（永続化データ含む）
    try {
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userRole')
      localStorage.removeItem('currentUser')
      // キャッシュデータのみクリア
      localStorage.removeItem('todayTasks_cache')
      localStorage.removeItem('scheduledTasks_cache')
      localStorage.removeItem('completedTasks_cache')
      console.log('LocalStorage クリア完了')
    } catch (error) {
      console.warn('LocalStorage クリアエラー:', error)
    }
    
    // 状態をリセット（authServiceのリスナーで処理されるが、念のため）
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

  // ==================================================
  // Supabase同期タスク管理関数
  // ==================================================

  // 今日のタスク更新（Supabaseと同期）
  const updateTodayTasks = async (newTasks) => {
    try {
      console.log('今日のタスクを更新中:', newTasks.length, '件');
      
      // ローカル状態を即座に更新（UX向上）
      setTodayTasks(newTasks);
      
      // バックグラウンドでSupabaseと同期
      if (isLoggedIn && currentUser) {
        // 現在のタスクとの差分を計算して効率的に同期
        const currentTasks = todayTasks;
        
        // 新しく追加されたタスク
        const addedTasks = newTasks.filter(newTask =>
          !currentTasks.find(current => current.id === newTask.id)
        );
        
        // 削除されたタスク
        const deletedTasks = currentTasks.filter(current =>
          !newTasks.find(newTask => newTask.id === current.id)
        );
        
        // 更新されたタスク
        const updatedTasks = newTasks.filter(newTask => {
          const current = currentTasks.find(c => c.id === newTask.id);
          return current && JSON.stringify(current) !== JSON.stringify(newTask);
        });
        
        // Supabaseと同期（バックグラウンド）
        setTimeout(async () => {
          try {
            // 新しいタスクを作成
            for (const task of addedTasks) {
              await authService.createTask(task);
            }
            
            // タスクを更新
            for (const task of updatedTasks) {
              await authService.updateTask(task.id, task);
            }
            
            // タスクを削除
            for (const task of deletedTasks) {
              await authService.deleteTask(task.id);
            }
            
            console.log('今日のタスクSupabase同期完了');
          } catch (syncError) {
            console.warn('今日のタスクSupabase同期エラー:', syncError);
          }
        }, 500); // 500ms後に同期
      }
    } catch (error) {
      console.error('今日のタスク更新エラー:', error);
    }
  };

  // デイリータスクプール更新（Supabaseと同期）
  const updateDailyTaskPool = async (newTasks) => {
    try {
      console.log('🔄 デイリータスクプール更新開始:', {
        newTasksCount: newTasks.length,
        selectedDate: selectedDate.toISOString().split('T')[0],
        isLoggedIn,
        hasCurrentUser: !!currentUser
      });
      
      // ローカル状態を即座に更新
      setDailyTaskPool(newTasks);
      console.log('✅ ローカル状態更新完了');
      
      // 選択された日付が今日以外の場合のみSupabaseと同期
      const today = new Date().toISOString().split('T')[0];
      const selectedDateKey = selectedDate.toISOString().split('T')[0];
      
      if (isLoggedIn && currentUser) {
        console.log('🔄 Supabase同期開始:', { selectedDateKey, today, willSync: selectedDateKey !== today });
        
        // バックグラウンドでSupabaseと同期
        setTimeout(async () => {
          try {
            // 現在のタスクプールと比較して新しいタスクのみを処理
            const currentTasks = dailyTaskPool;
            const addedTasks = newTasks.filter(newTask =>
              !currentTasks.find(current => current.id === newTask.id)
            );
            
            console.log('📝 追加されたタスク:', addedTasks.length, '件');
            
            // 新しいタスクのみをSupabaseに保存
            for (const task of addedTasks) {
              console.log('💾 タスク保存中:', task.title);
              
              const taskWithDate = {
                ...task,
                scheduledDate: selectedDateKey !== today ? selectedDateKey : null
              };
              
              try {
                const result = await authService.createTask(taskWithDate);
                if (result.success) {
                  console.log('✅ タスク保存成功:', task.title);
                } else {
                  console.error('❌ タスク保存失敗:', result.error);
                }
              } catch (taskError) {
                console.error('❌ 個別タスク保存エラー:', taskError);
              }
            }
            
            console.log('✅ デイリータスクプールSupabase同期完了');
          } catch (syncError) {
            console.error('❌ デイリータスクプールSupabase同期エラー:', syncError);
          }
        }, 500);
      } else {
        console.log('⚠️ Supabase同期スキップ（未ログインまたはユーザー情報なし）');
      }
    } catch (error) {
      console.error('❌ デイリータスクプール更新エラー:', error);
    }
  };

  // スケジュールタスク更新（Supabaseと同期）
  const updateScheduledTasks = async (newScheduledTasks) => {
    try {
      console.log('スケジュールタスクを更新中');
      
      // ローカル状態を即座に更新
      setScheduledTasks(newScheduledTasks);
      
      // バックグラウンドでSupabaseと同期
      if (isLoggedIn && currentUser) {
        setTimeout(async () => {
          try {
            for (const [key, task] of Object.entries(newScheduledTasks)) {
              const [date, hour] = key.split('-');
              const taskWithSchedule = {
                ...task,
                scheduledDate: date,
                scheduledTime: `${hour}:00`
              };
              
              if (!task.id || task.id.toString().startsWith('temp-')) {
                await authService.createTask(taskWithSchedule);
              } else {
                await authService.updateTask(task.id, taskWithSchedule);
              }
            }
            
            console.log('スケジュールタスクSupabase同期完了');
          } catch (syncError) {
            console.warn('スケジュールタスクSupabase同期エラー:', syncError);
          }
        }, 500);
      }
    } catch (error) {
      console.error('スケジュールタスク更新エラー:', error);
    }
  };

  // ユーザー情報更新のハンドラー
  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // ログイン成功時のハンドラー（LocalStorage保存付き）
  const handleLogin = (loginStatus) => {
    setIsLoggedIn(loginStatus)
    
    if (loginStatus) {
      // ログイン成功時にAuthServiceからユーザー情報を取得してLocalStorageに保存
      const user = authService.getCurrentUser()
      if (user) {
        console.log('ログイン成功 - LocalStorageに保存:', user)
        setCurrentUser(user)
        try {
          localStorage.setItem('currentUser', JSON.stringify(user))
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('userRole', user.role || 'STUDENT')
        } catch (error) {
          console.warn('LocalStorage保存エラー:', error)
        }
      }
    }
  }

  // ロール変更時のハンドラー（LocalStorage保存付き）
  const handleRoleChange = (role) => {
    setUserRole(role)
    try {
      localStorage.setItem('userRole', role)
    } catch (error) {
      console.warn('LocalStorage保存エラー (role):', error)
    }
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} onRoleChange={handleRoleChange} />
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex" style={{ overscrollBehavior: 'none', touchAction: 'pan-x pan-y' }}>
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
            <div className="flex items-center space-x-3">
              {/* AI学習プランナーロゴ */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI学習プランナー</h1>
                <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              </div>
            </div>
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
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">AI学習プランナー</h1>
          </div>
          <div className="w-10"></div> {/* スペーサー */}
        </div>

        <div className="p-4 lg:p-6">
        {userRole === 'STUDENT' && currentView === 'planner' && (
          <div className="space-y-6">
            {/* 未達成タスクプール */}
            {overdueTaskPool.length > 0 && (
              <OverdueTaskPool
                overdueTasks={overdueTaskPool}
                onTaskComplete={handleOverdueTaskComplete}
                onTaskDelete={handleOverdueTaskDelete}
              />
            )}
            
            {/* メインプランナー */}
            <ImprovedDailyPlanner
              currentStreak={currentStreak}
              todayString={todayString}
              weekOffset={weekOffset}
              setWeekOffset={(newOffset) => {
                console.log('🗓️ 週間ナビゲーション:', {
                  oldOffset: weekOffset,
                  newOffset,
                  change: newOffset - weekOffset
                });
                setWeekOffset(newOffset);
                
                // 週変更時に新しい週のデータを読み込み
                if (isLoggedIn && currentUser) {
                  setTimeout(async () => {
                    try {
                      console.log('📊 新しい週のデータ読み込み開始');
                      const today = new Date();
                      const weekStart = new Date(today);
                      weekStart.setDate(today.getDate() - today.getDay() + (newOffset * 7));
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      
                      console.log('📅 読み込み期間:', {
                        start: weekStart.toISOString().split('T')[0],
                        end: weekEnd.toISOString().split('T')[0]
                      });
                      
                      const result = await authService.getScheduledTasks(
                        weekStart.toISOString().split('T')[0],
                        weekEnd.toISOString().split('T')[0]
                      );
                      
                      if (result.success) {
                        console.log('✅ 新しい週のデータ取得成功:', result.tasks.length, '件');
                        
                        // スケジュールタスクを更新
                        const scheduledMap = {};
                        const completedMap = {};
                        
                        result.tasks.forEach(task => {
                          if (task.scheduledDate && task.scheduledTime) {
                            const key = `${task.scheduledDate}-${task.scheduledTime.split(':')[0]}`;
                            scheduledMap[key] = task;
                            if (task.completed) {
                              completedMap[key] = true;
                            }
                          }
                        });
                        
                        setScheduledTasks(scheduledMap);
                        setCompletedTasks(completedMap);
                      } else {
                        console.warn('⚠️ 新しい週のデータ取得失敗:', result.error);
                      }
                    } catch (error) {
                      console.error('❌ 週間データ読み込みエラー:', error);
                    }
                  }, 100);
                }
              }}
              dailyTaskPool={dailyTaskPool}
              todayTasks={todayTasks}
              setDailyTaskPool={updateDailyTaskPool}
              setTodayTasks={updateTodayTasks}
              handleTaskDragStart={handleTaskDragStart}
              selectedDate={selectedDate}
              scheduledTasks={scheduledTasks}
              setScheduledTasks={updateScheduledTasks}
              completedTasks={completedTasks}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleTaskClick={handleTaskClick}
              toggleTaskComplete={toggleTaskComplete}
              getPriorityColor={getPriorityColor}
              handleDragStart={handleDragStart}
              DailyTaskPool={DailyTaskPool}
              // タッチイベント用
              handleTouchStart={handleTouchStart}
              handleTouchMove={handleTouchMove}
              handleTouchEnd={handleTouchEnd}
              isDragging={isDragging}
              draggedTask={draggedTask}
              // 学習計画とタスク変換関数を渡す
              studyPlans={studyPlans}
              convertPlansToTasks={convertPlansToTasks}
            />
          </div>
        )}

        {userRole === 'STUDENT' && currentView === 'monthly-calendar' && (
          <CalendarWithSchedule
            studyBooks={studyBooks}
            studyPlans={studyPlans}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
            dailyTaskPool={dailyTaskPool}
            onTasksUpdate={updateDailyTaskPool}
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
                  studentId={currentUser?.id}
                  onComplete={(data) => {
                    setUserKnowledge(data);
                    setCurrentAIMode('companion');
                  }}
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
                <CompanionMode
                  userKnowledge={userKnowledge}
                  onKnowledgeUpdate={setUserKnowledge}
                  onTasksGenerated={(tasks) => {
                    updateTodayTasks([...todayTasks, ...tasks]);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {userRole === 'INSTRUCTOR' && currentView === 'dashboard' && (
          <InstructorDashboard />
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
                  
                  const existingTaskIds = todayTasks.map(task => task.id)
                  const newTasks = todayTasks.filter(task => !existingTaskIds.includes(task.id))
                  updateTodayTasks([...todayTasks, ...newTasks])
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