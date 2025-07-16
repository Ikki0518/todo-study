/**
 * セッションチェックポイント管理サービス
 * ユーザーの進行状況を永続化し、ページリロード時の状態復元を管理
 */

class SessionService {
  constructor() {
    this.SESSION_KEY = 'suna_session_checkpoint';
    this.SESSION_TIMESTAMP_KEY = 'suna_session_timestamp';
    this.SESSION_EXPIRY_HOURS = 24; // 24時間後にセッション期限切れ
    this.USER_PROGRESS_KEY = 'suna_user_progress';
    this.CHECKPOINT_HISTORY_KEY = 'suna_checkpoint_history';
    
    // 重要なチェックポイントの定義
    this.CHECKPOINTS = {
      SYSTEM_OVERVIEW_VIEWED: 'system_overview_viewed',
      USER_REGISTRATION_STARTED: 'user_registration_started',
      USER_REGISTRATION_COMPLETED: 'user_registration_completed',
      PAYMENT_PROCESS_STARTED: 'payment_process_started',
      PAYMENT_COMPLETED: 'payment_completed',
      LOGIN_COMPLETED: 'login_completed',
      FIRST_GOAL_CREATED: 'first_goal_created',
      FIRST_TASK_SCHEDULED: 'first_task_scheduled',
      PROFILE_SETUP_COMPLETED: 'profile_setup_completed',
      EXAM_DATE_SET: 'exam_date_set',
      STUDY_PLAN_GENERATED: 'study_plan_generated'
    };
    
    // 画面遷移の定義
    this.VIEWS = {
      SYSTEM_OVERVIEW: 'system_overview',
      REGISTRATION: 'registration',
      PRICING: 'pricing',
      LOGIN: 'login',
      DASHBOARD: 'dashboard',
      GOALS: 'goals',
      CALENDAR: 'calendar',
      PROFILE: 'profile'
    };
    
    this.initializeSession();
  }
  
  /**
   * セッションを初期化
   */
  initializeSession() {
    try {
      const currentTime = new Date().toISOString();
      const sessionData = this.getSessionData();
      
      if (!sessionData || this.isSessionExpired()) {
        console.log('🔄 新しいセッションを初期化');
        this.createNewSession();
      } else {
        console.log('✅ 既存のセッションを復元:', sessionData);
        this.updateSessionActivity();
      }
    } catch (error) {
      console.error('🚨 セッション初期化エラー:', error);
      this.createNewSession();
    }
  }
  
  /**
   * 新しいセッションを作成
   */
  createNewSession() {
    const sessionData = {
      sessionId: this.generateSessionId(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      checkpoints: [],
      currentView: this.VIEWS.SYSTEM_OVERVIEW,
      userProgress: {
        completedSteps: [],
        currentStep: 'system_overview',
        totalSteps: Object.keys(this.CHECKPOINTS).length
      },
      authState: {
        isLoggedIn: false,
        userRole: null,
        hasValidSubscription: false
      }
    };
    
    this.saveSessionData(sessionData);
    this.updateSessionTimestamp();
    
    console.log('✅ 新しいセッションを作成:', sessionData);
    return sessionData;
  }
  
  /**
   * セッションデータを取得
   */
  getSessionData() {
    try {
      const data = localStorage.getItem(this.SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('🚨 セッションデータの取得エラー:', error);
      return null;
    }
  }
  
  /**
   * セッションデータを保存
   */
  saveSessionData(sessionData) {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      this.updateSessionTimestamp();
      
      // バックアップとして複数の場所に保存
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      
      console.log('💾 セッションデータを保存:', sessionData);
    } catch (error) {
      console.error('🚨 セッションデータの保存エラー:', error);
    }
  }
  
  /**
   * セッションアクティビティを更新
   */
  updateSessionActivity() {
    const sessionData = this.getSessionData();
    if (sessionData) {
      sessionData.lastActivity = new Date().toISOString();
      this.saveSessionData(sessionData);
    }
    this.updateSessionTimestamp();
  }
  
  /**
   * セッションタイムスタンプを更新
   */
  updateSessionTimestamp() {
    const timestamp = new Date().toISOString();
    localStorage.setItem(this.SESSION_TIMESTAMP_KEY, timestamp);
    sessionStorage.setItem(this.SESSION_TIMESTAMP_KEY, timestamp);
  }
  
  /**
   * セッションが期限切れかどうかチェック
   */
  isSessionExpired() {
    try {
      const timestamp = localStorage.getItem(this.SESSION_TIMESTAMP_KEY);
      if (!timestamp) return true;
      
      const lastActivity = new Date(timestamp);
      const now = new Date();
      const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);
      
      return hoursSinceLastActivity > this.SESSION_EXPIRY_HOURS;
    } catch (error) {
      console.error('🚨 セッション期限チェックエラー:', error);
      return true;
    }
  }
  
  /**
   * チェックポイントを記録
   */
  recordCheckpoint(checkpointName, additionalData = {}) {
    try {
      const sessionData = this.getSessionData();
      if (!sessionData) {
        console.warn('⚠️ セッションデータが存在しません');
        return;
      }
      
      const checkpoint = {
        name: checkpointName,
        timestamp: new Date().toISOString(),
        data: additionalData
      };
      
      // 重複チェックポイントを避ける
      const existingIndex = sessionData.checkpoints.findIndex(cp => cp.name === checkpointName);
      if (existingIndex >= 0) {
        sessionData.checkpoints[existingIndex] = checkpoint;
      } else {
        sessionData.checkpoints.push(checkpoint);
      }
      
      // 進行状況を更新
      if (!sessionData.userProgress.completedSteps.includes(checkpointName)) {
        sessionData.userProgress.completedSteps.push(checkpointName);
      }
      
      this.saveSessionData(sessionData);
      this.saveCheckpointHistory(checkpoint);
      
      console.log(`🎯 チェックポイント記録: ${checkpointName}`, checkpoint);
      
      // 重要なチェックポイントでは追加の永続化処理
      this.handleCriticalCheckpoint(checkpointName, additionalData);
      
    } catch (error) {
      console.error('🚨 チェックポイント記録エラー:', error);
    }
  }
  
  /**
   * 重要なチェックポイントの特別処理
   */
  handleCriticalCheckpoint(checkpointName, additionalData) {
    switch (checkpointName) {
      case this.CHECKPOINTS.LOGIN_COMPLETED:
        this.persistAuthState(additionalData);
        break;
      case this.CHECKPOINTS.PAYMENT_COMPLETED:
        this.persistPaymentState(additionalData);
        break;
      case this.CHECKPOINTS.USER_REGISTRATION_COMPLETED:
        this.persistUserRegistration(additionalData);
        break;
      default:
        break;
    }
  }
  
  /**
   * 認証状態を永続化（強化版）
   */
  persistAuthState(authData) {
    try {
      const sessionData = this.getSessionData();
      if (sessionData) {
        sessionData.authState = {
          isLoggedIn: true,
          userRole: authData.userRole,
          hasValidSubscription: authData.hasValidSubscription || false,
          userId: authData.userId,
          currentUser: authData.currentUser || authData,
          loginTime: new Date().toISOString()
        };
        
        this.saveSessionData(sessionData);
        
        // 認証情報を複数の場所にバックアップ
        const authBackup = {
          ...authData,
          backupTime: new Date().toISOString(),
          sessionId: sessionData.sessionId,
          isLoggedIn: true,
          userRole: authData.userRole,
          hasValidSubscription: authData.hasValidSubscription || false
        };
        
        // 複数の場所に保存
        localStorage.setItem('auth_backup', JSON.stringify(authBackup));
        localStorage.setItem('auth_backup_timestamp', new Date().toISOString());
        localStorage.setItem('suna_auth_state', JSON.stringify(authBackup));
        sessionStorage.setItem('suna_auth_state', JSON.stringify(authBackup));
        
        // 従来の形式でも保存（互換性のため）
        localStorage.setItem('currentUser', JSON.stringify(authData.currentUser || authData));
        localStorage.setItem('authToken', authData.authToken || `token_${authData.userId}`);
        localStorage.setItem('userRole', authData.userRole);
        localStorage.setItem('hasValidSubscription', authData.hasValidSubscription ? 'true' : 'false');
        localStorage.setItem('loginTime', new Date().toISOString());
        
        console.log('🔐 認証状態を永続化:', authBackup);
      }
    } catch (error) {
      console.error('🚨 認証状態の永続化エラー:', error);
    }
  }
  
  /**
   * 決済状態を永続化
   */
  persistPaymentState(paymentData) {
    try {
      const sessionData = this.getSessionData();
      if (sessionData) {
        sessionData.paymentState = {
          isPaid: true,
          paymentStatus: 'completed',
          selectedPlan: paymentData.selectedPlan,
          paymentTime: new Date().toISOString()
        };
        
        this.saveSessionData(sessionData);
        
        console.log('💳 決済状態を永続化:', paymentData);
      }
    } catch (error) {
      console.error('🚨 決済状態の永続化エラー:', error);
    }
  }
  
  /**
   * ユーザー登録を永続化
   */
  persistUserRegistration(userData) {
    try {
      const sessionData = this.getSessionData();
      if (sessionData) {
        sessionData.registrationState = {
          isRegistered: true,
          userData: userData,
          registrationTime: new Date().toISOString()
        };
        
        this.saveSessionData(sessionData);
        
        console.log('📝 ユーザー登録を永続化:', userData);
      }
    } catch (error) {
      console.error('🚨 ユーザー登録の永続化エラー:', error);
    }
  }
  
  /**
   * 現在のビューを更新
   */
  updateCurrentView(viewName) {
    try {
      const sessionData = this.getSessionData();
      if (sessionData) {
        sessionData.currentView = viewName;
        sessionData.lastViewChange = new Date().toISOString();
        this.saveSessionData(sessionData);
        
        console.log(`📱 現在のビューを更新: ${viewName}`);
      }
    } catch (error) {
      console.error('🚨 ビュー更新エラー:', error);
    }
  }
  
  /**
   * チェックポイント履歴を保存
   */
  saveCheckpointHistory(checkpoint) {
    try {
      const historyKey = this.CHECKPOINT_HISTORY_KEY;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      existingHistory.push(checkpoint);
      
      // 最新の50件のみ保持
      if (existingHistory.length > 50) {
        existingHistory.splice(0, existingHistory.length - 50);
      }
      
      localStorage.setItem(historyKey, JSON.stringify(existingHistory));
    } catch (error) {
      console.error('🚨 チェックポイント履歴の保存エラー:', error);
    }
  }
  
  /**
   * 状態復元機能（強化版）
   */
  restoreSession() {
    try {
      const sessionData = this.getSessionData();
      let restoredData = null;
      
      if (sessionData && !this.isSessionExpired()) {
        console.log('🔄 セッションを復元:', sessionData);
        this.updateSessionActivity();
        
        restoredData = {
          currentView: sessionData.currentView,
          authState: sessionData.authState,
          paymentState: sessionData.paymentState,
          registrationState: sessionData.registrationState,
          userProgress: sessionData.userProgress,
          checkpoints: sessionData.checkpoints
        };
      }
      
      // セッションデータが無効または期限切れの場合、バックアップから復元を試行
      if (!restoredData || !restoredData.authState || !restoredData.authState.isLoggedIn) {
        console.log('🔄 バックアップから認証状態を復元試行');
        const backupAuthState = this.restoreFromBackup();
        
        if (backupAuthState) {
          restoredData = restoredData || {};
          restoredData.authState = backupAuthState;
          restoredData.currentView = backupAuthState.userRole === 'INSTRUCTOR' ? 'dashboard' : 'goals';
          
          // 復元したデータでセッションを再作成
          this.recreateSessionFromBackup(backupAuthState);
          
          console.log('✅ バックアップから認証状態を復元:', backupAuthState);
        }
      }
      
      return restoredData;
    } catch (error) {
      console.error('🚨 セッション復元エラー:', error);
      return null;
    }
  }
  
  /**
   * バックアップから認証状態を復元
   */
  restoreFromBackup() {
    const backupSources = [
      'suna_auth_state',
      'auth_backup',
      'currentUser',
      'authToken'
    ];
    
    for (const source of backupSources) {
      try {
        // localStorage と sessionStorage の両方をチェック
        const localData = localStorage.getItem(source);
        const sessionData = sessionStorage.getItem(source);
        
        let authData = null;
        
        if (source === 'suna_auth_state' || source === 'auth_backup') {
          // JSON形式のバックアップデータ
          const data = localData || sessionData;
          if (data) {
            authData = JSON.parse(data);
            if (authData.isLoggedIn) {
              return {
                isLoggedIn: true,
                userRole: authData.userRole,
                hasValidSubscription: authData.hasValidSubscription,
                userId: authData.userId,
                currentUser: authData.currentUser || authData
              };
            }
          }
        } else if (source === 'currentUser') {
          // 従来の形式のユーザーデータ
          const userData = localData || sessionData;
          const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          
          if (userData && authToken) {
            const user = JSON.parse(userData);
            return {
              isLoggedIn: true,
              userRole: user.userRole || 'STUDENT',
              hasValidSubscription: true,
              userId: user.id || user.userId,
              currentUser: user
            };
          }
        }
      } catch (error) {
        console.warn(`❌ ${source}からの復元に失敗:`, error);
      }
    }
    
    return null;
  }
  
  /**
   * バックアップデータからセッションを再作成
   */
  recreateSessionFromBackup(authState) {
    try {
      const sessionData = {
        sessionId: this.generateSessionId(),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        checkpoints: [{
          name: 'session_restored_from_backup',
          timestamp: new Date().toISOString(),
          data: { source: 'backup_restoration' }
        }],
        currentView: authState.userRole === 'INSTRUCTOR' ? 'dashboard' : 'goals',
        userProgress: {
          completedSteps: ['login_completed'],
          currentStep: 'authenticated',
          totalSteps: Object.keys(this.CHECKPOINTS).length
        },
        authState: authState
      };
      
      this.saveSessionData(sessionData);
      console.log('🔄 バックアップからセッションを再作成:', sessionData);
    } catch (error) {
      console.error('🚨 セッション再作成エラー:', error);
    }
  }
  
  /**
   * セッションをクリア
   */
  clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.SESSION_TIMESTAMP_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.SESSION_TIMESTAMP_KEY);
      
      console.log('🧹 セッションをクリア');
    } catch (error) {
      console.error('🚨 セッションクリアエラー:', error);
    }
  }
  
  /**
   * セッションIDを生成
   */
  generateSessionId() {
    return `suna_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 進行状況を取得
   */
  getProgress() {
    const sessionData = this.getSessionData();
    if (!sessionData) return null;
    
    return {
      completedSteps: sessionData.userProgress.completedSteps.length,
      totalSteps: sessionData.userProgress.totalSteps,
      percentage: Math.round((sessionData.userProgress.completedSteps.length / sessionData.userProgress.totalSteps) * 100)
    };
  }
  
  /**
   * 特定のチェックポイントが完了しているかチェック
   */
  isCheckpointCompleted(checkpointName) {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;
    
    return sessionData.checkpoints.some(cp => cp.name === checkpointName);
  }
}

// シングルトンインスタンス
const sessionService = new SessionService();

export default sessionService;