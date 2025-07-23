import { useState, useEffect, useRef } from 'react'
import { SunaLogo } from './components/SunaLogo';
import { PersonalizeMode } from './components/PersonalizeMode';
import { CompanionMode } from './components/CompanionMode';
import { LoginScreen } from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import { PricingPage } from './components/PricingPage';
import { RegistrationFlow } from './components/RegistrationFlow';
import { SystemOverview } from './components/SystemOverview';
import InstructorDashboard from './components/InstructorView';
import { MonthlyCalendar } from './components/MonthlyCalendar';
import { StudyBookManager } from './components/StudyBookManager';
import { DailyTaskPool } from './components/DailyTaskPool';
import { CalendarWithSchedule } from './components/CalendarWithSchedule';
import { getEventCoordinates, startDrag } from './utils/dragUtils';
import { ProfileSettings } from './components/ProfileSettings';
import { InviteManager } from './components/InviteManager';
import StudentMessages from './components/StudentMessages';
import InstructorMessages from './components/InstructorMessages';
import FloatingActionButton from './components/FloatingActionButton';
import { MobileTaskPopup } from './components/MobileTaskPopup';
import { ExamDateSettings } from './components/ExamDateSettings';
import { MobileWeeklyPlannerDemo } from './components/MobileWeeklyPlannerDemo';
import MobileCalendarUI from './components/MobileCalendarUI';
import TaskPoolManager from './components/TaskPoolManager';
import ImprovedDailyPlanner from './components/ImprovedDailyPlanner';
import { generateStudyPlan, convertPlansToTasks, calculateStudyPlanStats } from './utils/studyPlanGenerator';
import apiService from './services/apiService';
import sessionService from './services/sessionService';
import { taskService } from './services/taskService';

function App() {
  // Cookie管理ユーティリティ（App.jsx用）
  const cookieUtils = {
    getCookie: (name) => {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
      return null;
    }
  };

  // 認証状態の初期化を同期的に行う（強化された認証チェック版）
  const initializeAuthSync = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 ===== 同期認証初期化開始 =====');
      console.log('🍪 Cookie復元処理開始');
      console.log('  - 利用可能Cookie:', document.cookie);
    }
    
    // デモモード用の一時的な設定
    if (window.location.search.includes('demo=true')) {
      return {
        isAuthenticated: true,
        currentUser: {
          id: 'PM-0001',
          name: '山田太郎',
          role: 'STUDENT',
          email: 'demo@example.com'
        },
        authToken: 'demo-token'
      };
    }
    
    // 基本的な認証データのチェック（厳格化）
    let authToken = localStorage.getItem('authToken');
    let savedUser = localStorage.getItem('currentUser');
    
    // 認証データが存在しない場合は未認証として扱う
    if (!authToken || !savedUser) {
      console.log('🔍 基本認証データが不足 - 未認証として処理');
      return {
        isLoggedIn: false,
        userRole: null,
        currentUser: null,
        currentView: 'weekly-planner'
      };
    }
    
    // ユーザーデータの妥当性チェック
    try {
      const userData = JSON.parse(savedUser);
      
      // 必須フィールドの存在確認
      if (!userData.id || !userData.email || !userData.name) {
        console.warn('🚨 ユーザーデータに必須フィールドが不足:', userData);
        // 不完全なデータをクリア
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        return {
          isLoggedIn: false,
          userRole: null,
          currentUser: null,
          currentView: 'weekly-planner'
        };
      }
      
      // トークンの基本的な妥当性チェック
      if (authToken.length < 10 || authToken === 'undefined' || authToken === 'null') {
        console.warn('🚨 無効なトークン形式:', authToken);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        return {
          isLoggedIn: false,
          userRole: null,
          currentUser: null,
          currentView: 'weekly-planner'
        };
      }
      
      console.log('✅ 認証データの妥当性確認完了:', userData);
      return {
        isLoggedIn: true,
        userRole: userData.userRole || 'STUDENT',
        currentUser: userData,
        currentView: userData.userRole === 'INSTRUCTOR' ? 'dashboard' : 'weekly-planner'
      };
      
    } catch (parseError) {
      console.error('🚨 ユーザーデータの解析エラー:', parseError);
      // 破損データをクリア
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      return {
        isLoggedIn: false,
        userRole: null,
        currentUser: null,
        currentView: 'weekly-planner'
      };
    }
  };
  
  // 同期的に認証状態を初期化（セッションサービス統合版）
  const initialAuthState = process.env.NODE_ENV === 'development' ?
    {
      isLoggedIn: true,
      userRole: 'STUDENT',
      currentUser: {
        id: 'test-user',
        name: 'テストユーザー',
        email: 'test@example.com',
        userRole: 'STUDENT'
      },
      currentView: 'weekly-planner'
    } :
    initializeAuthSync();
  
  // セッションサービスから追加の状態を復元（認証状態を優先）
  const restoreSessionState = () => {
    // 初期認証状態が未認証の場合は、セッション復元も行わない
    if (!initialAuthState.isLoggedIn) {
      console.log('🔍 初期認証状態が未認証のため、セッション復元をスキップ');
      return {
        currentView: 'goals',
        isPaid: false,
        paymentStatus: null,
        selectedPlan: null,
        showPricing: false,
        showRegistrationFlow: false,
        showLoginScreen: false,
        isLoggedIn: false,
        userRole: null,
        currentUser: null,
        hasValidSubscription: false
      };
    }
    
    const restoredSession = sessionService.restoreSession();
    if (restoredSession && restoredSession.authState?.isLoggedIn) {
      console.log('🔄 セッションから追加状態を復元:', restoredSession);
      
      // セッションの認証状態も検証
      const sessionUser = restoredSession.authState.currentUser;
      if (!sessionUser || !sessionUser.id || !sessionUser.email) {
        console.warn('🚨 セッション内のユーザーデータが不完全');
        return {
          currentView: initialAuthState.currentView || 'goals',
          isPaid: false,
          paymentStatus: null,
          selectedPlan: null,
          showPricing: false,
          showRegistrationFlow: false,
          showLoginScreen: false,
          isLoggedIn: initialAuthState.isLoggedIn,
          userRole: initialAuthState.userRole,
          currentUser: initialAuthState.currentUser,
          hasValidSubscription: initialAuthState.isLoggedIn
        };
      }
      
      return {
        currentView: restoredSession.currentView || initialAuthState.currentView || 'goals',
        isPaid: restoredSession.paymentState?.isPaid || false,
        paymentStatus: restoredSession.paymentState?.paymentStatus || null,
        selectedPlan: restoredSession.paymentState?.selectedPlan || null,
        showPricing: false,
        showRegistrationFlow: false,
        showLoginScreen: false,
        isLoggedIn: initialAuthState.isLoggedIn,
        userRole: initialAuthState.userRole,
        currentUser: initialAuthState.currentUser,
        hasValidSubscription: initialAuthState.isLoggedIn
      };
    }
    
    return {
      currentView: initialAuthState.currentView || 'goals',
      isPaid: false,
      paymentStatus: null,
      selectedPlan: null,
      showPricing: false,
      showRegistrationFlow: false,
      showLoginScreen: false,
      isLoggedIn: initialAuthState.isLoggedIn,
      userRole: initialAuthState.userRole,
      currentUser: initialAuthState.currentUser,
      hasValidSubscription: initialAuthState.isLoggedIn
    };
  };
  
  const sessionState = restoreSessionState();
  
  const [currentView, setCurrentView] = useState(sessionState.currentView)
  const [currentStreak] = useState(15)
  
  // セッションサービスと連携したビュー更新関数
  const updateCurrentView = (newView) => {
    setCurrentView(newView);
    sessionService.updateCurrentView(newView);
    sessionService.updateSessionActivity();
  };
  
  // 決済状態の管理（セッションから復元）
  const [isPaid, setIsPaid] = useState(sessionState.isPaid)
  const [paymentStatus, setPaymentStatus] = useState(sessionState.paymentStatus)
  const [selectedPlan, setSelectedPlan] = useState(sessionState.selectedPlan)
  const [showPricing, setShowPricing] = useState(sessionState.showPricing)
  const [showRegistrationFlow, setShowRegistrationFlow] = useState(sessionState.showRegistrationFlow)
  const [showLoginScreen, setShowLoginScreen] = useState(sessionState.showLoginScreen)
  const [showSignupScreen, setShowSignupScreen] = useState(false)
  
  // 認証状態を初期化時に復元（セッションサービス統合版）
  const [isLoggedIn, setIsLoggedIn] = useState(sessionState.isLoggedIn)
  const [authInitialized, setAuthInitialized] = useState(true)
  const [userRole, setUserRole] = useState(sessionState.userRole)
  const [currentUser, setCurrentUser] = useState(sessionState.currentUser)
  const [hasValidSubscription, setHasValidSubscription] = useState(sessionState.hasValidSubscription)
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
  const [allTasksHistory, setAllTasksHistory] = useState({})
  const [examDates, setExamDates] = useState([])

  // AI機能の状態
  const [currentAIMode, setCurrentAIMode] = useState('select');
  const [userKnowledge, setUserKnowledge] = useState(null);

  // ドラッグ&ドロップの状態
  const [currentTime, setCurrentTime] = useState(new Date())
  const [animatingTasks, setAnimatingTasks] = useState(new Set())
  const [draggingOverCalendar, setDraggingOverCalendar] = useState(false)
  const [currentDragTask, setCurrentDragTask] = useState(null)
  const [dragImageElement, setDragImageElement] = useState(null)
  const [draggingTaskId, setDraggingTaskId] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // タスク削除確認の状態
  const [taskClickCount, setTaskClickCount] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  
  // モバイル用ポップアップの状態
  const [showMobileTaskPopup, setShowMobileTaskPopup] = useState(false)
  const [selectedCellInfo, setSelectedCellInfo] = useState({ date: null, hour: null })
  
  // currentUserの参照を保持（無限ループ防止用）
  const currentUserRef = useRef(currentUser);
  
  // currentUserが変更されたらrefを更新
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  
  // 受験日データをデータベースから読み込み
  useEffect(() => {
    const loadExamDatesFromDB = async () => {
      if (currentUserRef.current && currentUserRef.current.id) {
        try {
          console.log('📖 受験日データをデータベースから読み込み中:', currentUserRef.current.id);
          const examDatesData = await taskService.loadExamDates(currentUserRef.current.id);
          setExamDates(examDatesData);
          console.log('✅ 受験日データ読み込み完了:', examDatesData);
        } catch (error) {
          console.error('❌ 受験日データ読み込み失敗:', error);
          // エラーの場合はlocalStorageからフォールバック
          const savedExamDates = localStorage.getItem('examDates');
          if (savedExamDates) {
            try {
              const parsedExamDates = JSON.parse(savedExamDates);
              setExamDates(parsedExamDates);
              console.log('📦 localStorageから受験日データをフォールバック読み込み:', parsedExamDates);
            } catch (localError) {
              console.error('❌ localStorageフォールバックも失敗:', localError);
            }
          }
        }
      }
    };

    loadExamDatesFromDB();
  }, [currentUserRef]);
  // 受験日データが変更されたらデータベースに保存
  useEffect(() => {
    const saveExamDatesToDB = async () => {
      if (currentUserRef.current && currentUserRef.current.id && examDates.length > 0) {
        try {
          console.log('💾 受験日データをデータベースに保存中:', { userId: currentUserRef.current.id, examCount: examDates.length });
          await taskService.saveExamDates(currentUserRef.current.id, examDates);
          console.log('✅ 受験日データ保存完了');
          
          // バックアップとしてlocalStorageにも保存
          localStorage.setItem('examDates', JSON.stringify(examDates));
        } catch (error) {
          console.error('❌ 受験日データ保存失敗:', error);
          // エラーの場合はlocalStorageに保存
          localStorage.setItem('examDates', JSON.stringify(examDates));
          console.log('📦 localStorageにフォールバック保存');
        }
      }
    };

    saveExamDatesToDB();
  }, [examDates]); // currentUserRefを依存関係から削除

  // ユーザーがログインした時にすべてのデータを読み込み
  useEffect(() => {
    const loadAllUserData = async () => {
      if (currentUserRef.current && currentUserRef.current.id) {
        try {
          console.log('📖 ユーザーデータを読み込み開始:', currentUserRef.current.id);
          
          // ユーザーIDを取得（ログアウト時のデータ保持のため、IDの強制変更は行わない）
          const actualUserId = currentUserRef.current.id;
          console.log('📋 現在のユーザーID:', actualUserId);
          
          // タスクデータを読み込み（ローカルストレージ優先戦略）
          let tasksData = null;
          
          // 1. まずローカルストレージから読み込み（永続化データを含む）
          try {
            const localData = localStorage.getItem(`tasks_${actualUserId}`);
            const backupData = localStorage.getItem('suna_user_tasks_backup');
            const fallbackData = localStorage.getItem(`tasks_fallback_${actualUserId}`);
            const preservedData = localStorage.getItem('preserved_task_data');
            const preservedBackup = localStorage.getItem('preserved_task_backup');
            const userPreservedData = localStorage.getItem(`preserved_tasks_${actualUserId}`);
            
            if (localData) {
              tasksData = JSON.parse(localData);
              console.log('✅ ローカルストレージからデータ読み込み完了');
            } else if (userPreservedData) {
              // ユーザー固有の永続化データから復元（最優先）
              const preserved = JSON.parse(userPreservedData);
              tasksData = {
                goals: preserved.goals || [],
                todayTasks: preserved.todayTasks || [],
                scheduledTasks: preserved.scheduledTasks || {},
                completedTasks: preserved.completedTasks || {},
                allTasksHistory: preserved.allTasksHistory || {},
                studyBooks: preserved.studyBooks || [],
                studyPlans: preserved.studyPlans || {},
                dailyTaskPool: preserved.dailyTaskPool || []
              };
              console.log('✅ ユーザー固有永続化データから復元（ログアウト後のデータ保持）');
              
              // 復元後は通常のローカルストレージにも保存
              localStorage.setItem(`tasks_${actualUserId}`, JSON.stringify(tasksData));
            } else if (preservedData) {
              // ログアウト時に保存された永続化データから復元
              const preserved = JSON.parse(preservedData);
              tasksData = {
                goals: preserved.goals || [],
                todayTasks: preserved.todayTasks || [],
                scheduledTasks: preserved.scheduledTasks || {},
                completedTasks: preserved.completedTasks || {},
                allTasksHistory: preserved.allTasksHistory || {},
                studyBooks: preserved.studyBooks || [],
                studyPlans: preserved.studyPlans || {},
                dailyTaskPool: preserved.dailyTaskPool || []
              };
              console.log('✅ 永続化データから復元（ログアウト後のデータ保持）');
              
              // 復元後は通常のローカルストレージにも保存
              localStorage.setItem(`tasks_${actualUserId}`, JSON.stringify(tasksData));
            } else if (preservedBackup) {
              // バックアップの永続化データから復元
              const preserved = JSON.parse(preservedBackup);
              tasksData = {
                goals: preserved.goals || [],
                todayTasks: preserved.todayTasks || [],
                scheduledTasks: preserved.scheduledTasks || {},
                completedTasks: preserved.completedTasks || {},
                allTasksHistory: preserved.allTasksHistory || {},
                studyBooks: preserved.studyBooks || [],
                studyPlans: preserved.studyPlans || {},
                dailyTaskPool: preserved.dailyTaskPool || []
              };
              console.log('✅ 永続化バックアップデータから復元');
              
              // 復元後は通常のローカルストレージにも保存
              localStorage.setItem(`tasks_${actualUserId}`, JSON.stringify(tasksData));
            } else if (backupData) {
              const backup = JSON.parse(backupData);
              tasksData = backup.tasksData;
              console.log('✅ バックアップデータから復元');
            } else if (fallbackData) {
              const fallback = JSON.parse(fallbackData);
              tasksData = fallback.tasksData;
              console.log('✅ フォールバックデータから復元');
            }
          } catch (localError) {
            console.warn('⚠️ ローカルストレージ読み込み失敗:', localError);
          }
          
          // 2. ローカルストレージにデータがない場合のみSupabaseから読み込み
          if (!tasksData || Object.keys(tasksData).length === 0) {
            try {
              console.log('🔄 ローカルデータなし、Supabaseから読み込み試行...');
              tasksData = await taskService.loadUserTasks(actualUserId);
              
              // Supabaseから読み込めた場合はローカルストレージに保存
              if (tasksData && Object.keys(tasksData).length > 0) {
                localStorage.setItem(`tasks_${actualUserId}`, JSON.stringify(tasksData));
                console.log('✅ Supabaseからデータ読み込み完了、ローカルストレージに保存');
              }
            } catch (dbError) {
              console.warn('⚠️ Supabaseデータベース読み込み失敗（ローカルデータなし）:', dbError.message);
              tasksData = {}; // 空のデータで初期化
            }
          }
          
          if (tasksData && Object.keys(tasksData).length > 0) {
            // 永続化データから復元された場合の処理
            if (tasksData.todayTasks) {
              setTodayTasks(tasksData.todayTasks);
              console.log('✅ 今日のタスクを復元:', tasksData.todayTasks.length);
            }
            
            if (tasksData.goals) {
              setGoals(tasksData.goals);
              console.log('✅ 目標を復元:', tasksData.goals.length);
            }
            
            if (tasksData.dailyTaskPool) {
              setDailyTaskPool(tasksData.dailyTaskPool);
              console.log('✅ デイリータスクプールを復元:', tasksData.dailyTaskPool.length);
            }
            
            if (tasksData.completedTasks) {
              setCompletedTasks(tasksData.completedTasks);
              console.log('✅ 完了タスクを復元:', Object.keys(tasksData.completedTasks).length);
            }
            
            if (tasksData.studyBooks) {
              setStudyBooks(tasksData.studyBooks);
              console.log('✅ 学習書籍を復元:', tasksData.studyBooks.length);
            }
            
            if (tasksData.studyPlans) {
              setStudyPlans(tasksData.studyPlans);
              console.log('✅ 学習計画を復元:', Object.keys(tasksData.studyPlans).length);
            }
            
            if (tasksData.allTasksHistory) {
              setAllTasksHistory(tasksData.allTasksHistory);
              console.log('✅ タスク履歴を復元:', Object.keys(tasksData.allTasksHistory).length);
            }
            
            // scheduledTasksの構造を変換：{date: {hour: task}} → {"date-hour": task}
            if (tasksData.scheduledTasks) {
              console.log('🔍 スケジュールタスクを復元:', tasksData.scheduledTasks);
              setScheduledTasks(tasksData.scheduledTasks);
            } else {
              // taskServiceから返されたデータを変換
              console.log('🔍 データ変換開始 - 元データ:', tasksData);
              const convertedScheduledTasks = {};
              Object.entries(tasksData).forEach(([dateKey, dayTasks]) => {
                console.log(`🔍 処理中の日付: ${dateKey}`, dayTasks);
                if (typeof dayTasks === 'object' && dayTasks !== null && !['todayTasks', 'dailyTaskPool', 'completedTasks', 'goals', 'studyBooks', 'studyPlans', 'allTasksHistory'].includes(dateKey)) {
                  Object.entries(dayTasks).forEach(([hour, task]) => {
                    console.log(`🔍 時間: ${hour}, タスク:`, task);
                    if (task && typeof task === 'object' && task.id) {
                      const taskKey = `${dateKey}-${hour}`;
                      convertedScheduledTasks[taskKey] = task;
                      console.log(`✅ タスク追加: ${taskKey}`, task);
                    }
                  });
                }
              });
              console.log('🔄 タスクデータ構造変換完了:', {
                originalKeys: Object.keys(tasksData),
                convertedKeys: Object.keys(convertedScheduledTasks),
                convertedCount: Object.keys(convertedScheduledTasks).length,
                convertedTasks: convertedScheduledTasks
              });
              
              // 既存のscheduledTasksが空でない場合は、競合を避けるために確認する
              setScheduledTasks(prevScheduledTasks => {
                const existingCount = Object.keys(prevScheduledTasks).length;
                const newCount = Object.keys(convertedScheduledTasks).length;
                console.log('🔍 State更新確認:', {
                  existingCount,
                  newCount,
                  willUpdate: existingCount === 0 || newCount > 0
                });
                
                // 既存データがある場合は上書きしない（競合防止）
                if (existingCount > 0 && newCount === 0) {
                  console.log('⚠️ 既存データ保護: 空データでの上書きを防止');
                  return prevScheduledTasks;
                }
                
                return convertedScheduledTasks;
              });
            }
            
            console.log('✅ タスクデータ読み込み完了:', { tasksCount: Object.keys(tasksData).length });
          } else {
            console.log('ℹ️ タスクデータなし - 新規ユーザー');
          }
          
          // 学習計画データを読み込み（エラー耐性強化）
          try {
            const studyPlansData = await taskService.loadStudyPlans(actualUserId);
            if (studyPlansData && studyPlansData.length > 0) {
              setStudyPlans(studyPlansData);
              console.log('✅ 学習計画データ読み込み完了');
            } else {
              console.log('ℹ️ 学習計画データなし - 空の状態で継続');
            }
          } catch (studyPlanError) {
            console.warn('⚠️ 学習計画データ読み込みエラー（継続動作）:', studyPlanError.message);
            // エラーが発生してもアプリは継続動作
          }
          
        } catch (error) {
          console.error('❌ ユーザーデータ読み込み失敗:', error);
        }
      }
    };

    loadAllUserData();
  }, []); // 初回マウント時のみ実行

  // データが変更されたらTaskServiceで保存
  useEffect(() => {
    const saveAllUserData = async () => {
      // 🚨 緊急修正: 実際のユーザーIDを強制使用
      const actualUserId = '9c91a0e0-cfac-4178-9d84-74a567200f3a';
      const userId = currentUserRef.current?.id || actualUserId;
      
      console.log('🔍 保存処理開始（強化版）:', {
        hasCurrentUser: !!currentUserRef.current,
        userId: userId,
        actualUserId: actualUserId,
        todayTasksCount: todayTasks.length,
        scheduledTasksCount: Object.keys(scheduledTasks).length,
        dailyTaskPoolCount: dailyTaskPool.length,
        goalsCount: goals.length
      });
      
      // 🚨 緊急修正: ユーザーIDが存在しない場合も実際のユーザーIDで保存
      if (userId) {
        try {
          const tasksData = {
            todayTasks,
            scheduledTasks,
            dailyTaskPool,
            completedTasks,
            goals
          };
          
          console.log('💾 データベースに保存中（強化版）...', { userId, tasksData });
          
          // 🚨 緊急修正: 複数のキーでローカルストレージに保存（冗長化）
          try {
            localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasksData));
            localStorage.setItem(`tasks_${actualUserId}`, JSON.stringify(tasksData));
            localStorage.setItem('suna_user_tasks_backup', JSON.stringify({
              userId: actualUserId,
              tasksData,
              updatedAt: new Date().toISOString()
            }));
            console.log('✅ ローカルストレージ保存完了（冗長化）');
          } catch (localError) {
            console.warn('⚠️ ローカルストレージ保存失敗:', localError);
          }
          
          // データベースに保存（バックグラウンドで実行、エラーは無視）
          try {
            await taskService.saveUserTasks(userId, tasksData);
            console.log('✅ Supabaseデータベース保存完了');
          } catch (dbError) {
            console.warn('⚠️ Supabaseデータベース保存失敗（ローカルストレージは保持）:', dbError.message);
            // データベース保存失敗してもアプリケーションは継続
          }
          
          console.log('✅ タスクデータ保存完了（ローカルストレージ優先）');
        } catch (error) {
          console.error('❌ タスクデータ保存失敗:', error);
          // ローカルストレージ保存も失敗した場合のみエラー
        }
      } else {
        console.warn('⚠️ 保存スキップ - ユーザー情報なし:', { currentUser: currentUserRef.current, userId });
      }
    };

    // ユーザーがログインしている場合は常に保存を試行
    if (currentUserRef.current) {
      saveAllUserData();
    }
  }, [todayTasks, scheduledTasks, dailyTaskPool, completedTasks, goals]); // currentUserを依存関係から削除

  // 学習計画データの保存
  useEffect(() => {
    const saveStudyPlansData = async () => {
      if (currentUserRef.current && currentUserRef.current.id && studyPlans && Object.keys(studyPlans).length > 0) {
        try {
          await taskService.saveStudyPlans(currentUserRef.current.id, studyPlans);
          console.log('✅ 学習計画データ保存完了');
        } catch (error) {
          console.error('❌ 学習計画データ保存失敗:', error);
        }
      }
    };

    saveStudyPlansData();
  }, [studyPlans]); // currentUserを依存関係から削除

  // 決済状態のチェック（セッションサービス統合版）
  useEffect(() => {
    const checkPaymentStatus = () => {
      // セッションサービスから状態を確認
      const restoredSession = sessionService.restoreSession()
      if (restoredSession && restoredSession.authState && restoredSession.authState.isLoggedIn) {
        console.log('✅ セッションサービスから認証状態を復元 - 決済チェックをスキップ')
        return // セッションサービスが有効な場合は従来のチェックをスキップ
      }
      
      // URLパラメータから決済成功をチェック
      const urlParams = new URLSearchParams(window.location.search)
      const paymentSuccess = urlParams.get('payment_success')
      const sessionId = urlParams.get('session_id')
      const userId = urlParams.get('user_id')
      
      // localStorageから決済情報をチェック
      const savedPaymentStatus = localStorage.getItem('paymentStatus')
      const savedSelectedPlan = localStorage.getItem('selectedPlan')
      const savedUserInfo = localStorage.getItem('userInfo')
      
      console.log('🔍 決済状態チェック:', {
        paymentSuccess,
        sessionId,
        userId,
        savedPaymentStatus,
        savedSelectedPlan,
        savedUserInfo
      })
      
      if (paymentSuccess === 'true' || sessionId) {
        // Stripe決済成功からの戻り
        setPaymentStatus('completed')
        setIsPaid(true)
        setShowPricing(false)
        
        // 決済完了後、ユーザーをシステムにログイン状態にする
        if (savedUserInfo) {
          try {
            const userInfo = JSON.parse(savedUserInfo)
            
            // ユーザー情報に決済済みタグを追加
            const updatedUserInfo = {
              ...userInfo,
              paymentStatus: 'completed',
              paidAt: new Date().toISOString(),
              subscriptionActive: true
            }
            
            // ユーザー情報を更新
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
            localStorage.setItem('currentUser', JSON.stringify(updatedUserInfo))
            localStorage.setItem('authToken', `token_${updatedUserInfo.userId}`)
            
            // システムにログイン状態を設定
            setIsLoggedIn(true)
            setCurrentUser(updatedUserInfo)
            setUserRole('STUDENT')
            setHasValidSubscription(true)
            
            // セッションサービスにも状態を記録
            sessionService.recordCheckpoint(sessionService.CHECKPOINTS.PAYMENT_COMPLETED, {
              userId: updatedUserInfo.userId,
              paymentStatus: 'completed',
              subscriptionActive: true
            })
            
            sessionService.recordCheckpoint(sessionService.CHECKPOINTS.LOGIN_COMPLETED, {
              userId: updatedUserInfo.userId,
              userRole: 'STUDENT',
              hasValidSubscription: true
            })
            
            console.log('✅ 決済完了 - ユーザーをシステムにログイン:', updatedUserInfo)
          } catch (error) {
            console.error('🚨 ユーザーデータの処理に失敗:', error)
          }
        }
        
        if (savedSelectedPlan) {
          try {
            const planData = JSON.parse(savedSelectedPlan)
            setSelectedPlan(planData)
            console.log('✅ 決済完了:', planData)
          } catch (error) {
            console.error('🚨 プランデータの復元に失敗:', error)
          }
        }
        
        // URL履歴をクリーンアップ
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // 決済完了をlocalStorageに保存
        localStorage.setItem('paymentStatus', 'completed')
        localStorage.setItem('isPaid', 'true')
        
      } else if (savedPaymentStatus === 'completed') {
        // 既に決済済み - システムにログイン状態を復元
        setPaymentStatus('completed')
        setIsPaid(true)
        setShowPricing(false)
        
        if (savedUserInfo) {
          try {
            const userInfo = JSON.parse(savedUserInfo)
            
            // サブスクリプション状態をチェック
            if (userInfo.subscriptionActive !== false) {
              setIsLoggedIn(true)
              setCurrentUser(userInfo)
              setUserRole('STUDENT')
              setHasValidSubscription(true)
              
              // セッションサービスにも状態を記録
              sessionService.recordCheckpoint(sessionService.CHECKPOINTS.LOGIN_COMPLETED, {
                userId: userInfo.userId,
                userRole: 'STUDENT',
                hasValidSubscription: true
              })
              
              console.log('✅ 決済済み状態を復元 - システムにログイン:', userInfo)
            } else {
              console.log('⚠️ サブスクリプションが非アクティブ - ログイン不可')
              setIsLoggedIn(false)
              setCurrentUser(null)
              setUserRole(null)
              setHasValidSubscription(false)
            }
          } catch (error) {
            console.error('🚨 ユーザーデータの復元に失敗:', error)
          }
        }
        
        if (savedSelectedPlan) {
          try {
            const planData = JSON.parse(savedSelectedPlan)
            setSelectedPlan(planData)
            console.log('✅ 決済済み状態を復元:', planData)
          } catch (error) {
            console.error('🚨 プランデータの復元に失敗:', error)
          }
        }
      } else {
        // セッションサービスが無効で、決済情報もない場合のみログアウト状態に
        const authToken = localStorage.getItem('authToken')
        const savedUser = localStorage.getItem('currentUser')
        
        if (authToken && savedUser) {
          // 既存のログイン状態を維持
          try {
            const userData = JSON.parse(savedUser)
            setIsLoggedIn(true)
            setCurrentUser(userData)
            setUserRole(userData.userRole || 'STUDENT')
            setHasValidSubscription(true)
            setShowPricing(false)
            console.log('✅ 既存のログイン状態を維持:', userData)
          } catch (error) {
            console.error('🚨 既存ユーザーデータの復元に失敗:', error)
            // 破損データの場合はログアウト状態に
            setIsLoggedIn(false)
            setCurrentUser(null)
            setUserRole(null)
            setHasValidSubscription(false)
          }
        } else {
          // 認証情報がない場合のみログアウト状態に
          console.log('ℹ️ 認証情報なし - 料金プランを表示')
        }
        
        // 決済状態は常に未決済として設定
        setPaymentStatus(null)
        setIsPaid(false)
      }
    }
    
    checkPaymentStatus()
  }, [])

  // ログイン状態を定期的に更新（セッション維持）
  useEffect(() => {
    if (isLoggedIn && currentUserRef.current) {
      const updateSessionActivity = () => {
        const timestamp = new Date().toISOString();
        const sessionData = {
          user: currentUserRef.current,
          token: localStorage.getItem('authToken'),
          loginTime: localStorage.getItem('loginTime') || timestamp,
          lastActiveTime: timestamp
        };
        
        // セッションデータを更新
        localStorage.setItem('auth_data', JSON.stringify(sessionData));
        localStorage.setItem('pm_0001_session', JSON.stringify(sessionData));
        localStorage.setItem('lastActiveTime', timestamp);
      };
      
      // 初回更新
      updateSessionActivity();
      
      // 5分ごとに更新
      const interval = setInterval(updateSessionActivity, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]) // currentUserを依存関係から削除

  // ウィンドウサイズ変更の監視
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768
      setIsMobile(newIsMobile)
      
      // デバッグログ: isMobile判定とウィンドウサイズ
      console.log('🔍 Debug - isMobile判定 (リサイズ):', {
        windowWidth: window.innerWidth,
        isMobile: newIsMobile,
        timestamp: new Date().toLocaleTimeString()
      })
    }
    
    // 初回ログ
    console.log('🔍 Debug - isMobile判定 (初期化):', {
      windowWidth: window.innerWidth,
      isMobile: isMobile,
      timestamp: new Date().toLocaleTimeString()
    })
    
    window.addEventListener('resize', handleResize)
    
    // モバイル用グローバルタッチイベント
    const handleGlobalTouchMove = (e) => {
      if (window.mobileTouch && window.mobileTouch.isDragging) {
        e.preventDefault()
      }
    }
    
    const handleGlobalTouchEnd = (e) => {
      if (window.mobileTouch) {
        // グローバルタッチ終了時のクリーンアップ
        if (window.mobileTouch.longPressTimer) {
          clearTimeout(window.mobileTouch.longPressTimer)
        }
        window.mobileTouch = null
        
        // ドラッグ状態をリセット
        setCurrentDragTask(null)
        setDraggingTaskId(null)
        
        // ハイライトを削除
        document.querySelectorAll('[data-cell-info]').forEach(c => {
          c.classList.remove('bg-green-100')
        })
      }
    }
    
    if (isMobile) {
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
      document.addEventListener('touchend', handleGlobalTouchEnd)
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (isMobile) {
        document.removeEventListener('touchmove', handleGlobalTouchMove)
        document.removeEventListener('touchend', handleGlobalTouchEnd)
      }
    }
  }, [isMobile])

  // 未達成タスクを収集する関数
  const getOverdueTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = today.toISOString().split('T')[0]
    
    // 未達成タスクを収集
    
    const overdue = []
    
    // allTasksHistoryから過去の未完了タスクを収集
    Object.entries(allTasksHistory).forEach(([dateKey, tasks]) => {
      if (dateKey < todayKey) {
        tasks.forEach(task => {
          if (!task.completed) {
            overdue.push({
              ...task,
              originalDate: dateKey
            })
          }
        })
      }
    })
    
    // scheduledTasksから過去の未完了タスクを収集
    Object.entries(scheduledTasks).forEach(([taskKey, task]) => {
      const dateKey = taskKey.split('-').slice(0, 3).join('-')
      if (dateKey < todayKey && !completedTasks[taskKey]) {
        overdue.push({
          ...task,
          originalDate: dateKey
        })
      }
    })
    
    return overdue
  }

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
      // 今日以外の場合は、デイリータスクプールに設定し、今日のタスクはクリア
      setDailyTaskPool(tasksFromCalendar)
      setTodayTasks([])
    }
    
    updateCurrentView('planner')
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
    
    // 学習計画の全てのタスクをカレンダーに自動スケジュール
    const newScheduledTasks = { ...scheduledTasks }
    let totalScheduledTasks = 0
    
    Object.entries(newStudyPlans).forEach(([dateKey, dayPlans]) => {
      if (dayPlans && dayPlans.length > 0) {
        const tasks = convertPlansToTasks(dayPlans)
        
        // 各タスクを適切な時間にスケジュール（12時から開始、3時間間隔）
        tasks.forEach((task, index) => {
          const hour = 12 + (index * 3) // 3時間間隔でスケジュール
          if (hour < 22) { // 22時までに制限
            const taskKey = `${dateKey}-${hour}`
            
            // 既存のタスクがない場合のみスケジュール
            if (!newScheduledTasks[taskKey]) {
              newScheduledTasks[taskKey] = {
                ...task,
                duration: 3, // 3時間のデフォルト期間
                scheduledAt: new Date().toISOString()
              }
              totalScheduledTasks++
            }
          }
        })
      }
    })
    
    // スケジュールされたタスクを更新
    setScheduledTasks(newScheduledTasks)
    
    // 今日の日付のタスクがあれば、今日のタスクプールにも追加
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
      // デイリータスクプールをクリア（今日のタスクが生成されたため）
      setDailyTaskPool([])
    }
    
    const stats = calculateStudyPlanStats(newStudyPlans, studyBooks)
    alert(`学習計画を生成しました！\n総学習日数: ${stats.totalDays}日\n総学習時間: ${stats.totalHours}時間\nカレンダーに${totalScheduledTasks}個のタスクをスケジュールしました！${todayPlans.length > 0 ? '\n今日のタスクプールにも追加されました！' : ''}`)
  }

  const createDragImage = (task, isSmall = false) => {
    const dragElement = document.createElement('div')
    dragElement.className = `p-2 rounded-md border-2 bg-white shadow-lg ${isSmall ? 'text-xs' : 'text-sm'}`
    dragElement.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: ${isSmall ? '120px' : '200px'};
      height: ${isSmall ? '40px' : '60px'};
      z-index: 1000;
      pointer-events: none;
      transform: ${isSmall ? 'scale(0.8)' : 'scale(1)'};
    `
    
    const priorityColors = {
      high: 'border-red-300 bg-red-50',
      medium: 'border-yellow-300 bg-yellow-50',
      low: 'border-green-300 bg-green-50'
    }
    
    dragElement.className += ` ${priorityColors[task.priority] || priorityColors.medium}`
    dragElement.innerHTML = `
      <div class="flex items-center space-x-1">
        <span>${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}</span>
        <span class="font-medium truncate">${task.title}</span>
      </div>
    `
    
    document.body.appendChild(dragElement)
    return dragElement
  }

  // タスクドラッグ開始ハンドラー（高度なドラッグ機能付き）
  const handleTaskDragStart = (e, task, fromLocation = null) => {
    console.log('🔍 Debug - handleTaskDragStart called:', { task, fromLocation })
    
    // 基本的なドラッグデータを設定
    e.dataTransfer.setData('task', JSON.stringify(task))
    e.dataTransfer.setData('fromLocation', fromLocation || 'pool')
    
    // 現在のドラッグタスクを設定
    setCurrentDragTask(task)
    
    // カスタムドラッグイメージを作成
    const dragImage = createDragImage(task, false)
    setDragImageElement(dragImage)
    e.dataTransfer.setDragImage(dragImage, 100, 30)
    
    // ドラッグが開始された後にタスクを非表示にする（少し遅らせる）
    setTimeout(() => {
      setDraggingTaskId(task.id)
    }, 50)
    
    // ドラッグ終了時のクリーンアップを設定
    const cleanup = () => {
      setCurrentDragTask(null)
      setDragImageElement(null)
      setDraggingOverCalendar(false)
      setDraggingTaskId(null)
      if (dragImage && dragImage.parentNode) {
        dragImage.parentNode.removeChild(dragImage)
      }
      document.removeEventListener('dragend', cleanup)
    }
    
    document.addEventListener('dragend', cleanup)
  }

  // 基本的なハンドラー関数
  const handleDragStart = (e, task, fromLocation = null) => {
    e.dataTransfer.setData('task', JSON.stringify(task))
    e.dataTransfer.setData('fromLocation', fromLocation || '')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!draggingOverCalendar && currentDragTask) {
      setDraggingOverCalendar(true)
      
      // カレンダー上で小さなドラッグイメージに変更
      if (dragImageElement) {
        dragImageElement.style.transform = 'scale(0.6)'
        dragImageElement.style.width = '100px'
        dragImageElement.style.height = '32px'
        dragImageElement.style.fontSize = '10px'
      }
    }
  }

  const handleDragLeave = (e) => {
    // カレンダー領域から完全に出た場合のみfalseに設定
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggingOverCalendar(false)
      
      // ドラッグイメージを元のサイズに戻す
      if (dragImageElement && currentDragTask) {
        dragImageElement.style.transform = 'scale(1)'
        dragImageElement.style.width = '200px'
        dragImageElement.style.height = '60px'
        dragImageElement.style.fontSize = '14px'
      }
    }
  }

  const handleDrop = (e, dateKey, hour) => {
    e.preventDefault()
    setDraggingOverCalendar(false) // ドラッグ状態をリセット
    
    let task, fromLocation
    
    // 通常のドラッグ&ドロップの場合
    if (e.dataTransfer && e.dataTransfer.getData('task')) {
      task = JSON.parse(e.dataTransfer.getData('task'))
      fromLocation = e.dataTransfer.getData('fromLocation') || 'taskPool'
    }
    // タスクプールからのタッチドラッグの場合
    else if (window.taskPoolTouch && window.taskPoolTouch.isDragging) {
      task = window.taskPoolTouch.task
      fromLocation = 'taskPool'
      console.log('🔍 Debug - タスクプールからのタッチドロップ:', { task, dateKey, hour })
    }
    // カレンダー内でのタッチドラッグの場合
    else if (window.mobileTouch && window.mobileTouch.isDragging) {
      task = window.mobileTouch.scheduledTask
      fromLocation = `scheduled-${window.mobileTouch.taskKey}`
      console.log('🔍 Debug - カレンダー内でのタッチドロップ:', { task, dateKey, hour })
    }
    
    if (!task) return
    
    const newScheduledTasks = { ...scheduledTasks }
    const key = `${dateKey}-${hour}`
    
    if (newScheduledTasks[key]) return
    
    // アニメーション開始
    setAnimatingTasks(prev => new Set([...prev, key]))
    
    // タスクプールからの移動の場合、元のリストから削除
    if (fromLocation === 'taskPool') {
      // todayTasksとdailyTaskPoolの両方をチェック
      const isInTodayTasks = todayTasks.some(t => t.id === task.id)
      const isInDailyTaskPool = dailyTaskPool.some(t => t.id === task.id)
      
      if (isInTodayTasks) {
        setTodayTasks(todayTasks.filter(t => t.id !== task.id))
      }
      if (isInDailyTaskPool) {
        setDailyTaskPool(dailyTaskPool.filter(t => t.id !== task.id))
      }
      
      // 移行履歴のログを記録
      console.log('📋 タスク移行ログ:', {
        action: 'task_moved_to_calendar',
        taskId: task.id,
        taskTitle: task.title,
        from: 'taskPool',
        to: { date: dateKey, hour },
        taskDetails: {
          priority: task.priority,
          subject: task.subject,
          description: task.description,
          estimatedTime: task.estimatedTime,
          dueDate: task.dueDate
        },
        timestamp: new Date().toISOString(),
        userId: currentUserRef.current?.id
      })
    }
    // スケジュール間での移動
    else if (fromLocation.startsWith('scheduled-')) {
      const oldKey = fromLocation.replace('scheduled-', '')
      delete newScheduledTasks[oldKey]
      
      // 移動履歴のログを記録
      console.log('📋 タスク移動ログ:', {
        action: 'task_rescheduled',
        taskId: task.id,
        taskTitle: task.title,
        from: oldKey,
        to: { date: dateKey, hour },
        timestamp: new Date().toISOString(),
        userId: currentUserRef.current?.id
      })
    }
    
    // カレンダーイベントとして変換（詳細情報を保持）
    newScheduledTasks[key] = {
      ...task,
      scheduledDate: dateKey,
      scheduledHour: hour,
      duration: task.duration || task.estimatedTime ? Math.ceil(task.estimatedTime / 60) : 1,
      // 元のタスク情報を保持
      originalTaskData: {
        id: task.id,
        title: task.title,
        subject: task.subject,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedTime: task.estimatedTime,
        color: task.color
      }
    }
    setScheduledTasks(newScheduledTasks)
    
    // チェックポイント: 初回タスクスケジュール
    if (Object.keys(scheduledTasks).length === 0 && Object.keys(newScheduledTasks).length > 0) {
      sessionService.recordCheckpoint(sessionService.CHECKPOINTS.FIRST_TASK_SCHEDULED, {
        taskId: draggingTaskId,
        scheduledDate: dateKey,
        scheduledHour: hour,
        userId: currentUserRef.current?.id,
        timestamp: new Date().toISOString()
      })
    }
    
    // タッチ状態をクリーンアップ
    if (window.taskPoolTouch) {
      window.taskPoolTouch = null
    }
    if (window.mobileTouch) {
      window.mobileTouch = null
    }
    
    // アニメーション終了（500ms後）
    setTimeout(() => {
      setAnimatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }, 500)
  }

  const handleTaskClick = (task, taskKey) => {
    const currentTime = Date.now()
    const lastClickTime = taskClickCount[taskKey]?.time || 0
    const clickCount = taskClickCount[taskKey]?.count || 0
    
    // ダブルクリック判定（500ms以内）
    if (currentTime - lastClickTime < 500) {
      // ダブルクリック確認ダイアログを表示
      setShowDeleteConfirm({
        task,
        taskKey,
        message: `「${task.title}」をタスクプールに戻しますか？`
      })
      
      // クリックカウントをリセット
      setTaskClickCount(prev => ({
        ...prev,
        [taskKey]: { time: 0, count: 0 }
      }))
    } else {
      // 最初のクリック
      setTaskClickCount(prev => ({
        ...prev,
        [taskKey]: { time: currentTime, count: clickCount + 1 }
      }))
      
      // 500ms後にクリックカウントをリセット
      setTimeout(() => {
        setTaskClickCount(prev => ({
          ...prev,
          [taskKey]: { time: 0, count: 0 }
        }))
      }, 500)
    }
  }
  
  // タスク削除確認の実行
  const confirmTaskRemoval = () => {
    if (!showDeleteConfirm) return
    
    const { task, taskKey } = showDeleteConfirm
    
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
    
    setShowDeleteConfirm(null)
  }
  
  // タスク削除確認のキャンセル
  const cancelTaskRemoval = () => {
    setShowDeleteConfirm(null)
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

  // モバイル判定とリアルタイム更新

  // 現在時刻を1分ごとに更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 1分ごと

    return () => clearInterval(timer)
  }, [])

  const getDates = () => {
    const today = new Date()
    const dates = []
    
    // PC・モバイル共通: 3日間表示（weekOffsetを考慮）
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + (weekOffset * 3))
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }
    
    return dates
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

  const dates = getDates()
  const weekDates = getWeekDates(weekOffset, viewMode === 'twoWeeks')
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const today = new Date()
  const todayString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${dayNames[today.getDay()]}）`

  // 現在時刻インジケーター関連の関数
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    
    // ヘッダー行の高さを考慮（実際の測定値に基づく）
    const headerHeight = isMobile ? 60 : 80
    
    // 各時間行の高さは50px（ImprovedDailyPlannerと同じ）
    // 時間グリッドは0時から始まるので、現在時刻の行インデックスを計算
    const hourIndex = hours
    const minuteOffset = minutes / 60 // 0-1の範囲
    
    // 位置計算：ヘッダー高さ + 行インデックス * 50px + 分のオフセット * 50px
    const position = headerHeight + (hourIndex * 50) + (minuteOffset * 50)
    
    // 24時間グリッドの範囲を超えないように制限
    const maxPosition = headerHeight + (24 * 50) - 1
    return Math.min(position, maxPosition)
  }

  const getCurrentTimeString = () => {
    // 24時間表記で時刻を表示
    return currentTime.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // 24時間表記を強制
    })
  }

  const isCurrentTimeInGrid = () => {
    // 現在時刻表示を常に表示（24時間表示なので常にグリッド内）
    return true
  }

  // 非同期でトークンの有効性を確認し、必要に応じて認証状態を更新
  useEffect(() => {
    const validateAuthToken = async () => {
      if (isLoggedIn && currentUserRef.current) {
        try {
          console.log('🔍 バックグラウンドでトークンの有効性を確認中...');
          const response = await apiService.getCurrentUser();
          
          if (response.success) {
            const user = response.data.user;
            const updatedUserData = {
              id: user.id,
              email: user.email,
              name: user.name,
              userRole: user.role,
              avatar_url: user.avatar_url
            };
            
            console.log('✅ サーバーから最新情報を取得:', updatedUserData);
            // サーバーから最新情報を取得できた場合は更新
            setCurrentUser(updatedUserData);
            setUserRole(user.role);
            localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
          } else {
            console.warn('⚠️ Token validation failed, but keeping local session');
            // トークンが無効でも一定期間はローカルセッションを維持
          }
        } catch (error) {
          console.warn('⚠️ Failed to validate token, but keeping local session:', error);
          // API接続エラーでもローカルセッションを維持
        }
      }
    };
    
    // タスク履歴をデータベースから読み込む
    const loadUserTasksFromDB = async () => {
      if (currentUserRef.current && currentUserRef.current.id) {
        try {
          console.log('📖 ユーザータスクデータをデータベースから読み込み中:', currentUserRef.current.id);
          const tasksData = await taskService.loadUserTasks(currentUserRef.current.id);
          setAllTasksHistory(tasksData);
          console.log('✅ タスクデータ読み込み完了:', { tasksCount: Object.keys(tasksData).length });
        } catch (error) {
          console.error('❌ タスクデータ読み込み失敗:', error);
          // エラーの場合はlocalStorageからフォールバック
          const savedTasksHistory = localStorage.getItem('allTasksHistory');
          if (savedTasksHistory) {
            try {
              setAllTasksHistory(JSON.parse(savedTasksHistory));
              console.log('📦 localStorageからタスクデータをフォールバック読み込み');
            } catch (localError) {
              console.error('❌ localStorageフォールバックも失敗:', localError);
            }
          }
        }
      }
    };

    loadUserTasksFromDB();
    
    // 認証状態が復元されている場合のみトークンを確認
    if (isLoggedIn) {
      validateAuthToken();
    }
  }, [isLoggedIn]); // currentUserを依存関係から削除

  // タスクが更新されたらデータベースに保存
  useEffect(() => {
    const saveUserTasksToDB = async () => {
      if (currentUserRef.current && currentUserRef.current.id) {
        const today = new Date().toISOString().split('T')[0];
        // 空の配列でも保存するように修正
        const updatedHistory = {
          ...allTasksHistory,
          [today]: todayTasks || []  // nullの場合は空配列を使用
        };
        
        try {
          console.log('💾 タスクデータをデータベースに保存中:', {
            userId: currentUserRef.current.id,
            tasksCount: Object.keys(updatedHistory).length,
            todayTasksCount: (todayTasks || []).length
          });
          await taskService.saveUserTasks(currentUserRef.current.id, updatedHistory);
          setAllTasksHistory(updatedHistory);
          console.log('✅ タスクデータ保存完了');
          
          // バックアップとしてlocalStorageにも保存
          localStorage.setItem('allTasksHistory', JSON.stringify(updatedHistory));
        } catch (error) {
          console.error('❌ タスクデータ保存失敗:', error);
          // エラーの場合はlocalStorageに保存
          setAllTasksHistory(updatedHistory);
          localStorage.setItem('allTasksHistory', JSON.stringify(updatedHistory));
          console.log('📦 localStorageにフォールバック保存');
        }
      } else {
        console.log('⚠️ ユーザー情報がないため保存をスキップ');
      }
    };

    saveUserTasksToDB();
  }, [todayTasks, scheduledTasks]); // allTasksHistoryを依存関係から削除して無限ループを防ぐ



  // 認証初期化が同期的に行われるため、ローディング画面は不要

  // デモページのチェック
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'mobile-weekly-planner') {
    return <MobileWeeklyPlannerDemo />;
  }

  // 新フロー: 料金プラン → 新規登録 → 決済 → アプリ利用
  
  // 0. 認証チェック - 未認証の場合はシステム概要ページを表示
  if (!isLoggedIn && !showLoginScreen && !showPricing && !showRegistrationFlow && !showSignupScreen) {
    return (
      <SystemOverview
        onGetStarted={() => {
          setShowSignupScreen(true);
        }}
        onLogin={() => {
          setShowLoginScreen(true);
        }}
      />
    );
  }
  
  // 料金プラン表示
  if (showPricing) {
    return (
      <PricingPage
        onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          setShowPricing(false);
          setShowRegistrationFlow(true);
        }}
        onLoginClick={() => {
          setShowPricing(false);
          setShowLoginScreen(true);
        }}
      />
    );
  }
  
  // 1. 料金プラン表示（最初の画面）
  // 1. ログイン画面の表示
  if (showLoginScreen) {
    return (
      <LoginScreen
        onLogin={(success) => {
          if (success) {
            setShowLoginScreen(false)
            setIsLoggedIn(true)
            // 既に決済済みの場合はすぐにシステム利用可能
            const userInfo = JSON.parse(localStorage.getItem('currentUser') || '{}')
            if (userInfo.subscriptionActive || userInfo.paymentStatus === 'completed') {
              setIsPaid(true)
              setHasValidSubscription(true)
            }
          }
        }}
        onRoleChange={(role) => {
          setUserRole(role)
        }}
        onSignupClick={() => {
          setShowLoginScreen(false)
          setShowSignupScreen(true)
        }}
      />
    )
  }

  // 新規登録画面の表示
  if (showSignupScreen) {
    return (
      <SignupScreen
        onSignup={async (newUser) => {
          console.log('新規登録完了:', newUser);
          
          // ユーザー情報をlocalStorageに保存
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          localStorage.setItem('authToken', 'local-test-token');
          
          // 認証状態を更新
          setCurrentUser(newUser);
          setUserRole(newUser.userRole);
          setIsLoggedIn(true);
          setShowSignupScreen(false);
          
          // 新規登録後は料金プラン選択画面に遷移
          setShowPricing(true);
        }}
        onBackToLogin={() => {
          setShowSignupScreen(false);
          setShowLoginScreen(true);
        }}
        onError={(errorMessage) => {
          console.error('新規登録エラー:', errorMessage);
          alert(errorMessage);
        }}
      />
    );
  }

  // 2. 決済状態チェック - 未決済の場合
  // デモモードではスキップ
  if (false && (!isPaid || !hasValidSubscription)) {
    // 最初は常にRegistrationFlowのシステム説明画面から始まる
    return (
      <RegistrationFlow
        selectedPlan={selectedPlan}
        onComplete={() => {
          setShowRegistrationFlow(false)
          setIsPaid(true)
          
          // チェックポイント: ユーザー登録完了
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
          sessionService.recordCheckpoint(sessionService.CHECKPOINTS.USER_REGISTRATION_COMPLETED, {
            userId: userInfo.userId,
            username: userInfo.username,
            email: userInfo.email,
            timestamp: new Date().toISOString()
          })
          
          // 現在のビューを更新
          sessionService.updateCurrentView(sessionService.VIEWS.DASHBOARD)
        }}
        onBack={() => {
          // 戻るボタンは不要だが、念のため
          setShowRegistrationFlow(false)
          setShowPricing(true)
        }}
        onLoginClick={() => {
          setShowLoginScreen(true)
        }}
      />
    )
  }
  
  // 2. 決済済みだがログイン状態でない場合の処理
  if (isPaid && hasValidSubscription && !isLoggedIn) {
    // 決済完了後は直接アプリを利用可能にする
    setIsLoggedIn(true)
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const currentUser = {
      id: userInfo.userId || 'user-' + Date.now(),
      name: userInfo.username || 'ユーザー',
      email: userInfo.email || '',
      userRole: 'STUDENT',
      subscriptionActive: true,
      paymentStatus: 'completed'
    }
    setCurrentUser(currentUser)
    setUserRole('STUDENT')
    
    // チェックポイント: 決済完了とログイン完了
    sessionService.recordCheckpoint(sessionService.CHECKPOINTS.PAYMENT_COMPLETED, {
      userId: currentUser.id,
      paymentStatus: 'completed',
      subscriptionActive: true,
      timestamp: new Date().toISOString()
    })
    
    sessionService.recordCheckpoint(sessionService.CHECKPOINTS.LOGIN_COMPLETED, {
      userId: currentUser.id,
      userRole: 'STUDENT',
      hasValidSubscription: true,
      timestamp: new Date().toISOString()
    })
    
    // 現在のビューを更新
    sessionService.updateCurrentView(sessionService.VIEWS.DASHBOARD)
  }
  
  // 3. システム入場時の決済チェック
  // デモモードではスキップ
  if (false && isLoggedIn && (!isPaid || !hasValidSubscription)) {
    // 決済状態が無効な場合はログアウト
    setIsLoggedIn(false)
    setCurrentUser(null)
    setUserRole(null)
    setIsPaid(false)
    setHasValidSubscription(false)
    
    console.log('⚠️ 決済状態が無効 - ログアウト処理実行')
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-6">
            サブスクリプションが無効か、解約されています。<br />
            システムをご利用いただくには決済が必要です。
          </p>
          <button
            onClick={() => {
              setShowPricing(true)
              setShowRegistrationFlow(false)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            プラン選択へ
          </button>
        </div>
      </div>
    )
  }
  
  // 旧コード：決済完了後の新規登録・ログインフロー（削除予定）
  if (false && !isLoggedIn && isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* 決済完了メッセージ */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">決済完了！</h2>
              <p className="text-gray-600 mb-4">
                {selectedPlan ? `${selectedPlan.name}にご登録いただきありがとうございます。` : 'ご利用いただきありがとうございます。'}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                続いて、アカウントを作成してSunaを始めましょう。
              </p>
            </div>
          </div>
          
          {/* ログイン・新規登録フォーム */}
          <LoginScreen
            onLogin={(loginStatus) => {
              console.log('🔍 ログイン成功コールバック受信:', loginStatus);
              if (loginStatus) {
                // localStorage からユーザーデータを読み取り
                try {
                  const savedUser = localStorage.getItem('currentUser');
                  const authToken = localStorage.getItem('authToken');
                  
                  if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    console.log('🔍 ログイン時ユーザーデータ設定:', userData);
                    
                    // 状態を設定
                    setCurrentUser(userData);
                    setUserRole(userData.userRole || 'STUDENT');
                    setIsLoggedIn(true);
                    setHasValidSubscription(true);
                    setShowPricing(false);
                    
                    // 現在のビューを設定
                    if (userData.userRole === 'INSTRUCTOR') {
                      updateCurrentView('dashboard');
                    } else {
                      updateCurrentView('goals');
                    }
                    
                    // 追加の永続化処理
                    const timestamp = new Date().toISOString();
                    const sessionData = {
                      user: userData,
                      token: authToken,
                      loginTime: timestamp,
                      lastActiveTime: timestamp
                    };
                    
                    // 複数の場所に保存して冗長性を確保
                    localStorage.setItem('auth_data', JSON.stringify(sessionData));
                    localStorage.setItem('pm_0001_session', JSON.stringify(sessionData));
                    sessionStorage.setItem('currentUser', JSON.stringify(userData));
                    sessionStorage.setItem('authToken', authToken);
                    
                    console.log('✅ ログイン状態を永続化しました');
                  }
                } catch (error) {
                  console.error('🚨 ログイン時ユーザーデータ読み取りエラー:', error);
                }
              } else {
                setIsLoggedIn(false);
              }
            }}
            onRoleChange={(role) => {
              setUserRole(role);
              // 役割変更時にcurrentViewを設定
              if (role === 'INSTRUCTOR') {
                updateCurrentView('dashboard');
              } else {
                updateCurrentView('goals');
              }
            }}
            showPaymentSuccess={true}
            selectedPlan={selectedPlan}
          />
        </div>
      </div>
    )
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
        fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out min-h-screen flex flex-col
        ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:h-screen lg:flex-shrink-0
      `}>
        <div className="p-6">
          <div className="flex items-center relative">
            <SunaLogo width={80} height={40} />
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
        <nav className="px-4 flex-1">
          {userRole === 'STUDENT' ? (
            <div>
              <button
                onClick={() => updateCurrentView('weekly-planner')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'weekly-planner' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📅 週間プランナー
              </button>
              <button
                onClick={() => updateCurrentView('monthly-calendar')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'monthly-calendar' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📆 月間カレンダー
              </button>
              <button
                onClick={() => updateCurrentView('study-books')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'study-books' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📚 参考書管理
              </button>
              <button
                onClick={() => updateCurrentView('goals')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'goals' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                🎯 目標管理
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => updateCurrentView('dashboard')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📊 講師ダッシュボード
              </button>
              <button
                onClick={() => updateCurrentView('students')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'students' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                👥 生徒管理
              </button>
              <button
                onClick={() => updateCurrentView('assignments')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'assignments' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📝 課題管理
              </button>
              <button
                onClick={() => updateCurrentView('analytics')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'analytics' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                📈 分析
              </button>
              <button
                onClick={() => updateCurrentView('messages')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'messages' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                💬 メッセージ
              </button>
              <button
                onClick={() => updateCurrentView('invites')}
                className={`w-full text-left px-4 py-2 rounded-md mb-2 ${
                  currentView === 'invites' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                ✉️ 招待管理
              </button>
            </div>
          )}
        </nav>
        
        {/* 下部のアイコンボタン */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => updateCurrentView('settings')}
              className={`p-2 rounded-lg transition-colors ${
                currentView === 'settings' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="設定"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={async () => {
                try {
                  console.log('🔄 ログアウト処理開始 - タスクデータを保持');
                  
                  // ログアウト前にタスクデータを永続化ストレージに保存
                  const taskDataToPreserve = {
                    goals,
                    todayTasks,
                    scheduledTasks,
                    completedTasks,
                    allTasksHistory,
                    studyBooks,
                    studyPlans,
                    dailyTaskPool,
                    timestamp: new Date().toISOString(),
                    userId: currentUser?.id || 'unknown'
                  };
                  
                  // 永続化ストレージに保存（ログアウト後も保持）
                  localStorage.setItem('preserved_task_data', JSON.stringify(taskDataToPreserve));
                  localStorage.setItem('preserved_task_backup', JSON.stringify(taskDataToPreserve));
                  
                  // ユーザー固有のキーでも保存（冗長化）
                  if (currentUser?.id) {
                    localStorage.setItem(`preserved_tasks_${currentUser.id}`, JSON.stringify(taskDataToPreserve));
                  }
                  
                  console.log('💾 タスクデータを永続化ストレージに保存完了');
                  
                  // APIでログアウト
                  await apiService.logout();
                  
                  // セッションサービスでセッションをクリア
                  sessionService.clearSession();
                  
                  // 認証関連データのみクリア（タスクデータは保持）
                  localStorage.removeItem('currentUser')
                  localStorage.removeItem('authToken')
                  localStorage.removeItem('paymentStatus')
                  localStorage.removeItem('isPaid')
                  localStorage.removeItem('selectedPlan')
                  localStorage.removeItem('userInfo')
                  localStorage.removeItem('userKnowledge')
                  localStorage.removeItem('pm_0001_session')
                  localStorage.removeItem('auth_data')
                  
                  // セッションストレージもクリア
                  sessionStorage.clear();
                  
                  // 状態をリセット（タスクデータは保持）
                  setIsLoggedIn(false)
                  setCurrentUser(null)
                  setUserRole('STUDENT')
                  updateCurrentView('goals')
                  // タスクデータは保持するためクリアしない
                  // setGoals([])
                  // setTodayTasks([])
                  // setScheduledTasks({})
                  // setCompletedTasks({})
                  // setAllTasksHistory({})
                  // setStudyBooks([])
                  // setStudyPlans({})
                  // setDailyTaskPool([])
                  setUserKnowledge(null)
                  setHasValidSubscription(false)
                  setShowPricing(false)
                  setShowRegistrationFlow(false)
                  setShowLoginScreen(false)
                  setShowSignupScreen(false)
                  
                  console.log('✅ ログアウト完了 - タスクデータは保持されました');
                  
                  // 強制的にコンポーネントを再レンダリング
                  // ページリロードではなく状態リセットでSystemOverview画面を表示
                } catch (error) {
                  console.error('Logout error:', error);
                  
                  // エラー時でもタスクデータを保存
                  try {
                    const taskDataToPreserve = {
                      goals,
                      todayTasks,
                      scheduledTasks,
                      completedTasks,
                      allTasksHistory,
                      studyBooks,
                      studyPlans,
                      dailyTaskPool,
                      timestamp: new Date().toISOString()
                    };
                    localStorage.setItem('preserved_task_data', JSON.stringify(taskDataToPreserve));
                    localStorage.setItem('preserved_task_backup', JSON.stringify(taskDataToPreserve));
                    console.log('💾 エラー時でもタスクデータを保存完了');
                  } catch (saveError) {
                    console.error('タスクデータ保存エラー:', saveError);
                  }
                  
                  // エラーが発生してもログアウトを継続
                  sessionService.clearSession();
                  sessionStorage.clear();
                  setIsLoggedIn(false)
                  setCurrentUser(null)
                  setHasValidSubscription(false)
                  setShowPricing(false)
                  setShowRegistrationFlow(false)
                  setShowLoginScreen(false)
                  setShowSignupScreen(false)
                  
                  // エラーが発生してもSystemOverview画面を表示
                  console.log('✅ エラー時ログアウト完了 - タスクデータは保持されました');
                }
              }}
              className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="ログアウト"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
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
          <SunaLogo width={80} height={40} />
          <div className="w-10"></div> {/* スペーサー */}
        </div>

        <div className="p-4 lg:p-6 h-full">
          {userRole === 'STUDENT' && currentView === 'weekly-planner' && (
            <div className="h-full">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6">週間プランナー</h1>
              <ImprovedDailyPlanner
                currentStreak={currentStreak}
                todayString={new Date().toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
                weekOffset={weekOffset}
                setWeekOffset={setWeekOffset}
                dailyTaskPool={dailyTaskPool}
                todayTasks={todayTasks}
                setDailyTaskPool={setDailyTaskPool}
                setTodayTasks={setTodayTasks}
                handleTaskDragStart={handleDragStart}
                selectedDate={selectedDate}
                scheduledTasks={scheduledTasks}
                setScheduledTasks={setScheduledTasks}
                completedTasks={completedTasks}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleTaskClick={handleTaskClick}
                onTaskUpdate={(updatedTasks) => {
                  setDailyTaskPool(updatedTasks);
                }}
                onScheduledTaskUpdate={(updatedScheduledTasks) => {
                  setScheduledTasks(updatedScheduledTasks);
                }}
                toggleTaskComplete={(taskId, location) => {
                  const newCompletedTasks = { ...completedTasks };
                  newCompletedTasks[location] = !newCompletedTasks[location];
                  setCompletedTasks(newCompletedTasks);
                }}
                getPriorityColor={(priority) => {
                  switch (priority) {
                    case 'high': return '#dc2626';
                    case 'medium': return '#f59e0b';
                    case 'low': return '#10b981';
                    default: return '#6b7280';
                  }
                }}
                handleDragStart={handleDragStart}
                handleTouchStart={(e, task) => {
                  // タッチ開始処理
                  console.log('Touch start:', task);
                }}
                handleTouchMove={(e) => {
                  // タッチ移動処理
                  e.preventDefault();
                }}
                handleTouchEnd={(e, dateKey, hour) => {
                  // タッチ終了処理
                  console.log('Touch end:', dateKey, hour);
                }}
                isDragging={draggingTaskId !== null}
                draggedTask={currentDragTask}
                studyPlans={studyPlans}
                convertPlansToTasks={convertPlansToTasks}
              />
            </div>
          )}
          {userRole === 'STUDENT' && currentView === 'planner' && (
            <div className="h-full">
              <ImprovedDailyPlanner
                currentStreak={currentStreak}
                todayString={new Date().toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
                weekOffset={weekOffset}
                setWeekOffset={setWeekOffset}
                dailyTaskPool={dailyTaskPool}
                todayTasks={todayTasks}
                setDailyTaskPool={setDailyTaskPool}
                setTodayTasks={setTodayTasks}
                handleTaskDragStart={handleDragStart}
                selectedDate={selectedDate}
                scheduledTasks={scheduledTasks}
                setScheduledTasks={setScheduledTasks}
                completedTasks={completedTasks}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleTaskClick={handleTaskClick}
                onTaskUpdate={(updatedTasks) => {
                  setDailyTaskPool(updatedTasks);
                }}
                onScheduledTaskUpdate={(updatedScheduledTasks) => {
                  setScheduledTasks(updatedScheduledTasks);
                }}
                toggleTaskComplete={toggleTaskComplete}
                getPriorityColor={getPriorityColor}
                handleDragStart={handleDragStart}
                handleTouchStart={(e, task) => {
                  // タッチ開始処理
                  console.log('Touch start:', task);
                }}
                handleTouchMove={(e) => {
                  // タッチ移動処理
                  e.preventDefault();
                }}
                handleTouchEnd={(e, dateKey, hour) => {
                  // タッチ終了処理
                  console.log('Touch end:', dateKey, hour);
                }}
                isDragging={draggingTaskId !== null}
                draggedTask={currentDragTask}
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
            onTasksUpdate={setDailyTaskPool}
            onTaskDragStart={handleTaskDragStart}
            overdueTasks={getOverdueTasks()}
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
                  onClick={() => updateCurrentView('ai-assistant')}
                  className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <span>🤖</span>
                  <span>Suna</span>
                </button>
              </div>
              <button
                onClick={() => setShowGoalModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + 新しい目標を追加
              </button>
            </div>

            {/* 受験日設定セクション */}
            <ExamDateSettings
              examList={examDates}
              onExamDateChange={(examData) => {
                console.log('受験日が追加されました:', examData);
                // App.jsxのexamDatesステートを更新
                setExamDates(prevExams => {
                  const updatedExams = [...prevExams, examData];
                  
                  // チェックポイント: 受験日設定
                  sessionService.recordCheckpoint(sessionService.CHECKPOINTS.EXAM_DATE_SET, {
                    examId: examData.id,
                    examTitle: examData.title,
                    examDate: examData.date,
                    userId: currentUser?.id,
                    timestamp: new Date().toISOString()
                  });
                  
                  return updatedExams;
                });
              }}
              onExamDateDelete={(examId) => {
                console.log('受験日が削除されました:', examId);
                // App.jsxのexamDatesステートを更新
                setExamDates(prevExams => {
                  return prevExams.filter(exam => exam.id !== examId);
                });
              }}
            />

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
                              {goal.targetValue} {goal.unit} ({goal.aggregationMethod})
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

        {userRole === 'STUDENT' && currentView === 'student-messages' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">講師への質問</h1>
              <p className="text-gray-600">分からないことがあれば、いつでも講師に質問してください</p>
            </div>
            <div className="h-[calc(100vh-250px)]">
              <StudentMessages currentUser={currentUser} />
            </div>
          </div>
        )}

        {userRole === 'INSTRUCTOR' && currentView === 'dashboard' && (
          <InstructorDashboard />
        )}
        
        {userRole === 'INSTRUCTOR' && currentView === 'messages' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">受講生とのメッセージ</h1>
              <p className="text-gray-600">受講生からの質問や相談に対応できます</p>
            </div>
            <div className="h-[calc(100vh-250px)]">
              <InstructorMessages />
            </div>
          </div>
        )}
        
        {userRole === 'INSTRUCTOR' && currentView === 'invites' && (
          <InviteManager currentUser={currentUser} />
        )}
        
        {currentView === 'settings' && (
          <ProfileSettings
            currentUser={currentUser}
            onUpdateUser={(updatedUser) => {
              setCurrentUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }}
            onClose={() => {
              // 前の画面に戻る
              updateCurrentView(userRole === 'STUDENT' ? 'goals' : 'dashboard');
            }}
          />
        )}
      </div>

      {/* 受講生用の浮動アクションボタン */}
      {userRole === 'STUDENT' && <FloatingActionButton currentUser={currentUser} />}

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
              const unitValue = formData.get('unit')
              const customUnit = formData.get('customUnit')
              
              // カスタム単位が選択された場合は、customUnit の値を使用
              const finalUnit = unitValue === 'custom' ? customUnit : unitValue
              
              const newGoal = {
                id: editingGoal ? editingGoal.id : Date.now(),
                title: formData.get('title'),
                description: formData.get('description'),
                unit: finalUnit,
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
                
                // チェックポイント: 初回ゴール作成
                if (goals.length === 0) {
                  sessionService.recordCheckpoint(sessionService.CHECKPOINTS.FIRST_GOAL_CREATED, {
                    goalId: newGoal.id,
                    goalTitle: newGoal.title,
                    goalType: goalType,
                    userId: currentUser?.id,
                    timestamp: new Date().toISOString()
                  })
                }
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
                    defaultValue={editingGoal && !['件', '円', '%', '人', '時間', 'ページ', '問題', '点'].includes(editingGoal.unit) ? 'custom' : (editingGoal?.unit || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    onChange={(e) => {
                      const customUnitInput = document.getElementById('customUnitInput')
                      if (e.target.value === 'custom') {
                        customUnitInput.style.display = 'block'
                        customUnitInput.querySelector('input').required = true
                      } else {
                        customUnitInput.style.display = 'none'
                        customUnitInput.querySelector('input').required = false
                        customUnitInput.querySelector('input').value = ''
                      }
                    }}
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
                    <option value="custom">カスタム</option>
                  </select>
                  <div
                    id="customUnitInput"
                    style={{ display: editingGoal && !['件', '円', '%', '人', '時間', 'ページ', '問題', '点'].includes(editingGoal.unit) ? 'block' : 'none' }}
                    className="mt-2"
                  >
                    <input
                      type="text"
                      name="customUnit"
                      defaultValue={editingGoal && !['件', '円', '%', '人', '時間', 'ページ', '問題', '点'].includes(editingGoal.unit) ? editingGoal.unit : ''}
                      placeholder="カスタム単位を入力してください"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 集計方針 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    集計方針 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="aggregationMethod"
                    defaultValue={editingGoal?.aggregationMethod || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">集計方針を選択してください</option>
                    <option value="合計（上回れば達成）">合計（上回れば達成）</option>
                    <option value="合計（下回れば達成）">合計（下回れば達成）</option>
                    <option value="平均（上回れば達成）">平均（上回れば達成）</option>
                    <option value="平均（下回れば達成）">平均（下回れば達成）</option>
                    <option value="最大（上回れば達成）">最大（上回れば達成）</option>
                    <option value="最大（下回れば達成）">最大（下回れば達成）</option>
                    <option value="最小（上回れば達成）">最小（上回れば達成）</option>
                    <option value="最小（下回れば達成）">最小（下回れば達成）</option>
                  </select>
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

        {/* モバイル用タスクプールポップアップ */}
        <MobileTaskPopup
          isOpen={showMobileTaskPopup}
          onClose={() => {
            console.log('🔍 Debug - ポップアップクローズ')
            setShowMobileTaskPopup(false)
          }}
          availableTasks={[...todayTasks, ...dailyTaskPool, ...getOverdueTasks()]}
          selectedDate={selectedCellInfo.date}
          selectedHour={selectedCellInfo.hour}
          onTaskSelect={(task, dateKey, hour) => {
            console.log('🔍 Debug - タスク選択:', { task, dateKey, hour })
            // タスクをカレンダーにスケジュール
            const taskKey = `${dateKey}-${hour}`
            const scheduledTask = {
              ...task,
              duration: task.duration || 1
            }
            
            setScheduledTasks(prev => ({
              ...prev,
              [taskKey]: scheduledTask
            }))
            
            // タスクプールから削除
            const today = new Date().toISOString().split('T')[0]
            if (dateKey === today) {
              setTodayTasks(prev => prev.filter(t => t.id !== task.id))
            } else {
              setDailyTaskPool(prev => prev.filter(t => t.id !== task.id))
            }
            
            // 未達成タスクの場合は、allTasksHistoryからも削除
            if (task.originalDate) {
              setAllTasksHistory(prev => {
                const updated = { ...prev }
                if (updated[task.originalDate]) {
                  updated[task.originalDate] = updated[task.originalDate].filter(t => t.id !== task.id)
                  if (updated[task.originalDate].length === 0) {
                    delete updated[task.originalDate]
                  }
                }
                return updated
              })
            }
          }}
          onAddNewTask={(newTask) => {
            console.log('🔍 Debug - 新規タスク追加:', newTask)
            // 新しいタスクを直接カレンダーセルに配置
            const dateKey = selectedCellInfo.date
            const hour = selectedCellInfo.hour
            const taskKey = `${dateKey}-${hour}`
            
            // セルが空いているかチェック
            if (!scheduledTasks[taskKey]) {
              const scheduledTask = {
                ...newTask,
                duration: newTask.duration || 1
              }
              
              setScheduledTasks(prev => {
                const newScheduledTasks = {
                  ...prev,
                  [taskKey]: scheduledTask
                }
                
                // 🚨 修正: 新規タスク追加時にSupabaseデータベースに即座保存
                const actualUserId = '9c91a0e0-cfac-4178-9d84-74a567200f3a';
                const tasksData = {
                  todayTasks,
                  scheduledTasks: newScheduledTasks,
                  dailyTaskPool,
                  completedTasks,
                  goals
                };
                
                // Supabaseデータベースに非同期保存（Overloadedエラー対応）
                taskService.saveUserTasks(actualUserId, tasksData)
                  .then(() => {
                    console.log('✅ 新規タスク追加時のSupabaseデータベース保存完了:', { taskKey, scheduledTask });
                  })
                  .catch(error => {
                    // Overloadedエラーの判定
                    const isOverloaded = error.message && (
                      error.message.includes('Overloaded') ||
                      error.message.includes('overloaded') ||
                      error.message.includes('rate limit') ||
                      error.message.includes('too many requests')
                    );
                    
                    if (isOverloaded) {
                      console.log('🔄 Overloadedエラー検出、フォールバック処理を実行');
                      // ユーザーに通知
                      alert('サーバーが一時的に混雑しています。データはローカルに保存されました。');
                    } else {
                      console.error('❌ 🚨 サーバーへのタスク保存リクエストが失敗しました');
                      console.error('❌ 新規タスク追加時のSupabaseデータベース保存失敗:', error);
                    }
                    
                    console.error('❌ エラーの詳細情報:', {
                      name: error.name,
                      message: error.message,
                      code: error.code,
                      details: error.details,
                      hint: error.hint,
                      stack: error.stack
                    });
                    console.error('❌ 保存しようとしたデータ:', {
                      userId: actualUserId,
                      tasksDataKeys: Object.keys(tasksData),
                      scheduledTasksCount: Object.keys(tasksData.scheduledTasks || {}).length,
                      todayTasksCount: (tasksData.todayTasks || []).length
                    });
                    
                    // フォールバック: ローカルストレージに保存
                    try {
                      localStorage.setItem(`tasks_${actualUserId}`, JSON.stringify(tasksData));
                      console.log('⚠️ フォールバック: ローカルストレージに保存完了');
                    } catch (localError) {
                      console.error('❌ フォールバック保存も失敗:', localError);
                    }
                  });
                
                return newScheduledTasks;
              })
              
              console.log('✅ 新規タスクを直接セルに配置:', { taskKey, scheduledTask })
            } else {
              // セルが占有されている場合はタスクプールに追加
              const today = new Date().toISOString().split('T')[0]
              const selectedDateKey = selectedCellInfo.date
              
              if (selectedDateKey === today) {
                setTodayTasks(prev => {
                  const newTodayTasks = [...prev, newTask];
                  
                  // 🚨 修正: 今日のタスク追加時にSupabaseデータベースに即座保存
                  const actualUserId = '9c91a0e0-cfac-4178-9d84-74a567200f3a';
                  const tasksData = {
                    todayTasks: newTodayTasks,
                    scheduledTasks,
                    dailyTaskPool,
                    completedTasks,
                    goals
                  };
                  
                  // Supabaseデータベースに非同期保存（Overloadedエラー対応）
                  taskService.saveUserTasks(actualUserId, tasksData)
                    .then(() => {
                      console.log('✅ 今日のタスク追加時のSupabaseデータベース保存完了:', newTask);
                    })
                    .catch(error => {
                      // Overloadedエラーの判定
                      const isOverloaded = error.message && (
                        error.message.includes('Overloaded') ||
                        error.message.includes('overloaded') ||
                        error.message.includes('rate limit') ||
                        error.message.includes('too many requests')
                      );
                      
                      if (isOverloaded) {
                        console.log('🔄 Overloadedエラー検出、フォールバック処理を実行');
                        // ユーザーに通知
                        alert('サーバーが一時的に混雑しています。データはローカルに保存されました。');
                      } else {
                        console.error('❌ 🚨 サーバーへのタスク保存リクエストが失敗しました (今日のタスク)');
                        console.error('❌ 今日のタスク追加時のSupabaseデータベース保存失敗:', error);
                      }
                      
                      console.error('❌ エラーの詳細情報:', {
                        name: error.name,
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint,
                        stack: error.stack
                      });
                      console.error('❌ 保存しようとしたデータ:', {
                        userId: actualUserId,
                        tasksDataKeys: Object.keys(tasksData),
                        newTask: newTask
                      });
                      
                      // フォールバック: ローカルストレージに保存
                      try {
                        localStorage.setItem(`tasks_${actualUserId}`, JSON.stringify(tasksData));
                        console.log('⚠️ フォールバック: ローカルストレージに保存完了');
                      } catch (localError) {
                        console.error('❌ フォールバック保存も失敗:', localError);
                      }
                    });
                  
                  return newTodayTasks;
                })
              } else {
                setDailyTaskPool(prev => {
                  const newDailyTaskPool = [...prev, newTask];
                  
                  // 🚨 修正: デイリータスクプール追加時にSupabaseデータベースに即座保存
                  const actualUserId = '9c91a0e0-cfac-4178-9d84-74a567200f3a';
                  const tasksData = {
                    todayTasks,
                    scheduledTasks,
                    dailyTaskPool: newDailyTaskPool,
                    completedTasks,
                    goals
                  };
                  
                  // Supabaseデータベースに非同期保存（Overloadedエラー対応）
                  taskService.saveUserTasks(actualUserId, tasksData)
                    .then(() => {
                      console.log('✅ デイリータスクプール追加時のSupabaseデータベース保存完了:', newTask);
                    })
                    .catch(error => {
                      // Overloadedエラーの判定
                      const isOverloaded = error.message && (
                        error.message.includes('Overloaded') ||
                        error.message.includes('overloaded') ||
                        error.message.includes('rate limit') ||
                        error.message.includes('too many requests')
                      );
                      
                      if (isOverloaded) {
                        console.log('🔄 Overloadedエラー検出、フォールバック処理を実行');
                        // ユーザーに通知
                        alert('サーバーが一時的に混雑しています。データはローカルに保存されました。');
                      } else {
                        console.error('❌ 🚨 サーバーへのタスク保存リクエストが失敗しました (デイリータスクプール)');
                        console.error('❌ デイリータスクプール追加時のSupabaseデータベース保存失敗:', error);
                      }
                      
                      console.error('❌ エラーの詳細情報:', {
                        name: error.name,
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint,
                        stack: error.stack
                      });
                      console.error('❌ 保存しようとしたデータ:', {
                        userId: actualUserId,
                        tasksDataKeys: Object.keys(tasksData),
                        newTask: newTask
                      });
                      
                      // フォールバック: ローカルストレージに保存
                      try {
                        localStorage.setItem(`tasks_${actualUserId}`, JSON.stringify(tasksData));
                        console.log('⚠️ フォールバック: ローカルストレージに保存完了');
                      } catch (localError) {
                        console.error('❌ フォールバック保存も失敗:', localError);
                      }
                    });
                  
                  return newDailyTaskPool;
                })
              }
              
              console.log('⚠️ セルが占有されているためタスクプールに追加:', newTask)
            }
          }}
        />
        </div>

        {/* タスク削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                タスクをタスクプールに戻しますか？
              </h3>
              <p className="text-gray-600 mb-6">
                {showDeleteConfirm.message}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelTaskRemoval}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmTaskRemoval}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  タスクプールに戻す
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
}

export default App