import { supabase, auth, database } from './supabase.js'

class AuthService {
  constructor() {
    this.supabase = supabase
    this.currentUser = null
    this.isInitialized = false
    this.authStateListeners = []
    // 強制的にSupabase認証を使用
    this.isDemo = false
    this.authStateChangeSubscription = null
    this.isListenerRegistered = false
    this.isLoginInProgress = false
    
    console.log('✅ AuthService 初期化開始（セッション復元対応版）')
    console.log('認証状態監視は無効化されていますが、セッション復元は有効です')
    
    // セッション復元のための軽量初期化
    this.initializeSession()
  }

  // セッション復元のための軽量初期化
  async initializeSession() {
    try {
      const { data: { user }, error } = await auth.getUser()
      if (user && !error) {
        console.log('既存セッション復元:', user.email, 'ID:', user.id)
        // 軽量なユーザー情報設定
        this.currentUser = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          role: user.user_metadata?.role || 'STUDENT'
        }
        console.log('✅ 認証済みユーザーとして設定:', this.currentUser.id)
      } else {
        console.log('セッションなし - 匿名ユーザーとして継続')
        // 匿名ユーザーとして設定
        this.currentUser = {
          id: 'student-ikki-001', // デフォルトユーザーID
          email: 'anonymous@example.com',
          name: 'Anonymous User',
          role: 'STUDENT'
        }
        console.log('⚠️ 匿名ユーザーとして設定:', this.currentUser.id)
      }
      this.isInitialized = true
    } catch (error) {
      console.warn('セッション復元エラー:', error)
      // エラーの場合も匿名ユーザーとして設定
      this.currentUser = {
        id: 'student-ikki-001',
        email: 'anonymous@example.com',
        name: 'Anonymous User',
        role: 'STUDENT'
      }
      console.log('❌ エラー時匿名ユーザーとして設定:', this.currentUser.id)
      this.isInitialized = true
    }
  }

  // 認証状態変更のリスナーを追加（無効化）
  onAuthStateChange(callback) {
    console.log('認証状態監視は無効化されています（パフォーマンス改善）')
    
    // 何もしないクリーンアップ関数を返す
    return () => {
      console.log('認証状態監視クリーンアップ（無効化済み）')
    }
  }

  // ユーザープロフィールを読み込み
  async loadUserProfile(userId) {
    try {
      console.log('プロフィール読み込み開始:', userId)
      const { data: profile, error } = await database.getUserProfile(userId)
      console.log('プロフィール取得結果:', { profile, error })
      
      if (error && error.code !== 'PGRST116') { // レコードが見つからない場合以外のエラー
        console.error('プロフィール取得エラー:', error)
        return { success: false, error: 'プロフィール取得に失敗しました' }
      }

      // プロフィールが存在しない場合は作成
      if (!profile) {
        console.log('プロフィールが存在しないため作成中...')
        try {
          const { data: user, error: userError } = await auth.getUser()
          if (user?.user && !userError) {
            const newProfile = {
              email: user.user.email,
              name: user.user.user_metadata?.name || user.user.email.split('@')[0],
              role: user.user.user_metadata?.role || 'STUDENT',
              created_at: new Date().toISOString()
            }
            
            const { data: createdProfile, error: createError } = await database.upsertUserProfile(
              user.user.id,
              newProfile
            )
            
            if (!createError) {
              this.currentUser = createdProfile
              console.log('新しいプロフィール作成成功:', createdProfile)
              return { success: true, user: createdProfile }
            } else {
              console.error('プロフィール作成エラー:', createError)
              return { success: false, error: 'プロフィール作成に失敗しました' }
            }
          } else {
            console.log('認証ユーザーなし - 匿名ユーザーとして継続')
            // 匿名ユーザーの場合はcurrentUserを使用
            return { success: true, user: this.currentUser }
          }
        } catch (authError) {
          console.warn('認証エラー - 匿名ユーザーとして継続:', authError)
          return { success: true, user: this.currentUser }
        }
      } else {
        this.currentUser = profile
        console.log('既存プロフィール読み込み成功:', profile)
        return { success: true, user: profile }
      }
      
      return { success: false, error: 'プロフィール処理に失敗しました' }
    } catch (error) {
      console.error('ユーザープロフィール読み込みエラー:', error)
      return { success: false, error: 'プロフィール読み込み中にエラーが発生しました' }
    }
  }

  // ユーザープロフィールを読み込み（ユーザーデータ付き - ログイン時用）
  async loadUserProfileWithUserData(userId, userData) {
    try {
      console.log('プロフィール読み込み開始（最適化版）:', userId)
      const { data: profile, error } = await database.getUserProfile(userId)
      console.log('プロフィール取得結果:', { profile, error })
      
      if (error && error.code !== 'PGRST116') { // レコードが見つからない場合以外のエラー
        console.error('プロフィール取得エラー:', error)
        return { success: false, error: 'プロフィール取得に失敗しました' }
      }

      // プロフィールが存在しない場合は作成（ユーザーデータを直接使用）
      if (!profile) {
        console.log('プロフィールが存在しないため作成中（最適化版）...')
        const newProfile = {
          email: userData.email,
          name: userData.user_metadata?.name || userData.email.split('@')[0],
          phone: userData.user_metadata?.phone || '',
          role: userData.user_metadata?.role || 'STUDENT',
          created_at: new Date().toISOString()
        }
        
        const { data: createdProfile, error: createError } = await database.upsertUserProfile(
          userData.id,
          newProfile
        )
        
        if (!createError) {
          this.currentUser = createdProfile
          console.log('新しいプロフィール作成成功（最適化版）:', createdProfile)
          return { success: true, user: createdProfile }
        } else {
          console.error('プロフィール作成エラー:', createError)
          return { success: false, error: 'プロフィール作成に失敗しました' }
        }
      } else {
        this.currentUser = profile
        console.log('既存プロフィール読み込み成功:', profile)
        return { success: true, user: profile }
      }
    } catch (error) {
      console.error('ユーザープロフィール読み込みエラー（最適化版）:', error)
      return { success: false, error: 'プロフィール読み込み中にエラーが発生しました' }
    }
  }

  // 初期化（アプリ起動時に呼び出し）
  async initialize() {
    if (this.isInitialized) return

    try {
      // 軽量な初期化（データベースアクセスなし）
      console.log('AuthService 軽量初期化完了')
      this.isInitialized = true
    } catch (error) {
      console.error('認証初期化エラー:', error)
      this.isInitialized = true
    }
  }

  // ユーザー登録（データベース保存付き）
  async register(email, password, userData = {}) {
    try {
      console.log('ユーザー登録開始:', { email, name: userData.name })
      
      const { data, error } = await auth.signUp(email, password, userData)
      
      if (error) {
        console.error('登録エラー:', error)
        return { success: false, error: this.getErrorMessage(error) }
      }

      if (data.user) {
        // ユーザープロフィールをデータベースに保存
        const profileData = {
          email: data.user.email,
          name: userData.name || data.user.email.split('@')[0],
          phone: userData.phone || '',
          role: userData.userRole || 'STUDENT',
          created_at: new Date().toISOString()
        }
        
        try {
          const { data: profile, error: profileError } = await database.upsertUserProfile(
            data.user.id,
            profileData
          )
          
          if (!profileError) {
            this.currentUser = profile
            console.log('登録成功（データベース保存済み）:', profile)
            return {
              success: true,
              user: profile,
              message: 'アカウントが作成されました。'
            }
          } else {
            console.warn('プロフィール保存失敗、軽量版で継続:', profileError)
            // プロフィール保存に失敗しても軽量版で継続
            const simpleUser = { id: data.user.id, ...profileData }
            this.currentUser = simpleUser
            return {
              success: true,
              user: simpleUser,
              message: 'アカウントが作成されました。'
            }
          }
        } catch (dbError) {
          console.warn('データベースエラー、軽量版で継続:', dbError)
          const simpleUser = { id: data.user.id, ...profileData }
          this.currentUser = simpleUser
          return {
            success: true,
            user: simpleUser,
            message: 'アカウントが作成されました。'
          }
        }
      }

      return { success: false, error: '登録処理に失敗しました' }
    } catch (error) {
      console.error('登録エラー:', error)
      return {
        success: false,
        error: 'アカウント作成中にエラーが発生しました'
      }
    }
  }

  // OTP認証付き新規登録
  async registerWithOTP(email, password, userData = {}) {
    try {
      console.log('OTP認証付き新規登録開始:', { email, name: userData.name })
      console.log('送信するユーザーデータ:', userData)
      
      const { data, error } = await auth.signUpWithOTP(email, password, userData)
      
      console.log('Supabase OTP レスポンス:', { data, error })
      
      if (error) {
        console.error('OTP登録エラー詳細:', {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode,
          details: error
        })
        return {
          success: false,
          error: this.getErrorMessage(error),
          debugInfo: error
        }
      }

      if (data.user) {
        console.log('OTP認証メール送信成功:', {
          email: data.user.email,
          id: data.user.id,
          emailConfirmedAt: data.user.email_confirmed_at,
          confirmationSentAt: data.user.confirmation_sent_at
        })
        
        // メール確認が必要かどうかをチェック
        const needsConfirmation = !data.user.email_confirmed_at
        console.log('メール確認が必要:', needsConfirmation)
        
        return {
          success: true,
          requiresVerification: needsConfirmation,
          email: data.user.email,
          message: needsConfirmation
            ? '確認コードをメールに送信しました。メールをご確認ください。'
            : 'アカウントが作成されました。',
          debugInfo: {
            userId: data.user.id,
            emailConfirmed: !!data.user.email_confirmed_at,
            confirmationSent: !!data.user.confirmation_sent_at
          }
        }
      }

      console.warn('予期しないレスポンス:', { data, error })
      return { success: false, error: '登録処理に失敗しました' }
    } catch (error) {
      console.error('OTP登録例外エラー:', error)
      return {
        success: false,
        error: 'アカウント作成中にエラーが発生しました',
        debugInfo: error
      }
    }
  }

  // OTP認証コードの確認
  async verifyOTP(email, token) {
    try {
      console.log('OTP認証開始:', { email })
      
      const { data, error } = await auth.verifyOTP(email, token, 'signup')
      
      if (error) {
        console.error('OTP認証エラー:', error)
        return { success: false, error: this.getErrorMessage(error) }
      }

      if (data.user) {
        // ユーザープロフィールをデータベースに保存
        const profileData = {
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email.split('@')[0],
          phone: data.user.user_metadata?.phone || '',
          role: data.user.user_metadata?.userRole || 'STUDENT',
          created_at: new Date().toISOString()
        }
        
        try {
          const { data: profile, error: profileError } = await database.upsertUserProfile(
            data.user.id,
            profileData
          )
          
          if (!profileError) {
            this.currentUser = profile
            console.log('OTP認証成功（データベース保存済み）:', profile)
            return {
              success: true,
              user: profile,
              message: 'アカウントが正常に作成されました。'
            }
          } else {
            console.warn('プロフィール保存失敗、軽量版で継続:', profileError)
            const simpleUser = { id: data.user.id, ...profileData }
            this.currentUser = simpleUser
            return {
              success: true,
              user: simpleUser,
              message: 'アカウントが正常に作成されました。'
            }
          }
        } catch (dbError) {
          console.warn('データベースエラー、軽量版で継続:', dbError)
          const simpleUser = { id: data.user.id, ...profileData }
          this.currentUser = simpleUser
          return {
            success: true,
            user: simpleUser,
            message: 'アカウントが正常に作成されました。'
          }
        }
      }

      return { success: false, error: 'OTP認証に失敗しました' }
    } catch (error) {
      console.error('OTP認証エラー:', error)
      return {
        success: false,
        error: 'OTP認証中にエラーが発生しました'
      }
    }
  }

  // OTP再送信
  async resendOTP(email) {
    try {
      console.log('OTP再送信開始:', { email })
      
      const { data, error } = await auth.resendOTP(email, 'signup')
      
      if (error) {
        console.error('OTP再送信エラー:', error)
        return { success: false, error: this.getErrorMessage(error) }
      }

      return {
        success: true,
        message: '確認コードを再送信しました。メールをご確認ください。'
      }
    } catch (error) {
      console.error('OTP再送信エラー:', error)
      return {
        success: false,
        error: 'OTP再送信中にエラーが発生しました'
      }
    }
  }

  // ログイン（超高速版）
  async login(email, password) {
    try {
      console.log('ログイン開始（超高速版）:', { email })
      this.isLoginInProgress = true
      
      // タイムアウト付きでSupabase認証を実行（5秒でタイムアウト）
      const authPromise = auth.signIn(email, password)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('認証タイムアウト')), 5000)
      )
      
      const { data, error } = await Promise.race([authPromise, timeoutPromise])
      
      console.log('Supabase認証レスポンス（高速版）:', {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message,
        userData: data?.user ? { id: data.user.id, email: data.user.email } : null
      })
      
      if (error) {
        console.error('ログインエラー:', error.message)
        return { success: false, error: this.getErrorMessage(error) }
      }

      if (data.user) {
        // 最軽量なユーザー情報設定（データベースアクセス完全排除）
        const simpleUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email.split('@')[0],
          role: data.user.user_metadata?.role || 'STUDENT'
        }
        
        this.currentUser = simpleUser
        console.log('ログイン成功（超高速版）:', simpleUser)
        
        return {
          success: true,
          user: simpleUser
        }
      }

      return { success: false, error: 'ログイン処理に失敗しました' }
    } catch (error) {
      console.error('ログインエラー:', error)
      if (error.message === '認証タイムアウト') {
        return { success: false, error: 'ログインがタイムアウトしました。ネットワーク接続を確認してください。' }
      }
      return {
        success: false,
        error: 'ログイン中にエラーが発生しました'
      }
    } finally {
      this.isLoginInProgress = false
    }
  }

  // ログアウト
  async logout() {
    try {
      const { error } = await auth.signOut()
      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      this.currentUser = null
      return { success: true }
    } catch (error) {
      console.error('ログアウトエラー:', error)
      return { success: false, error: 'ログアウト中にエラーが発生しました' }
    }
  }

  // 現在のユーザー取得
  getCurrentUser() {
    return this.currentUser
  }

  // 認証状態確認
  isAuthenticated() {
    return !!this.currentUser
  }

  // プロフィール更新
  async updateProfile(profileData) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'ログインが必要です' }
      }

      const { data, error } = await database.upsertUserProfile(
        this.currentUser.id,
        profileData
      )

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      this.currentUser = { ...this.currentUser, ...data }
      return { success: true, user: this.currentUser }
    } catch (error) {
      console.error('プロフィール更新エラー:', error)
      return { success: false, error: 'プロフィール更新中にエラーが発生しました' }
    }
  }

  // パスワード変更
  async changePassword(newPassword) {
    try {
      const { data, error } = await auth.updatePassword(newPassword)

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true }
    } catch (error) {
      console.error('パスワード変更エラー:', error)
      return { success: false, error: 'パスワード変更中にエラーが発生しました' }
    }
  }

  // パスワードリセット
  async resetPassword(email) {
    try {
      const { data, error } = await auth.resetPassword(email)

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { 
        success: true, 
        message: 'パスワードリセットメールを送信しました' 
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error)
      return { success: false, error: 'パスワードリセット中にエラーが発生しました' }
    }
  }

  // 学習目標の取得
  async getGoals() {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'ログインが必要です' }
      }

      const { data, error } = await database.getUserGoals(this.currentUser.id)

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true, goals: data || [] }
    } catch (error) {
      console.error('目標取得エラー:', error)
      return { success: false, error: '目標の取得中にエラーが発生しました' }
    }
  }

  // 学習目標の作成
  async createGoal(goalData) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'ログインが必要です' }
      }

      const { data, error } = await database.createGoal({
        ...goalData,
        student_id: this.currentUser.id
      })

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true, goal: data }
    } catch (error) {
      console.error('目標作成エラー:', error)
      return { success: false, error: '目標の作成中にエラーが発生しました' }
    }
  }

  // 学習目標の更新
  async updateGoal(goalId, updates) {
    try {
      const { data, error } = await database.updateGoal(goalId, updates)

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true, goal: data }
    } catch (error) {
      console.error('目標更新エラー:', error)
      return { success: false, error: '目標の更新中にエラーが発生しました' }
    }
  }

  // 学習目標の削除
  async deleteGoal(goalId) {
    try {
      const { error } = await database.deleteGoal(goalId)

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true }
    } catch (error) {
      console.error('目標削除エラー:', error)
      return { success: false, error: '目標の削除中にエラーが発生しました' }
    }
  }

  // ==================================================
  // タスク管理機能（Supabase連携）
  // ==================================================

  // ユーザーのタスク一覧取得
  async getTasks(date = null) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'ログインが必要です' }
      }

      let query = database.getUserTasks(this.currentUser.id)
      if (date) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('student_id', this.currentUser.id)
          .eq('scheduled_date', date)
          .order('created_at', { ascending: false })
        return { success: !error, tasks: data || [], error: error?.message }
      }

      const { data, error } = await query
      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      // アプリの形式に変換
      const convertedTasks = (data || []).map(task => this.convertSupabaseTaskToApp(task))
      return { success: true, tasks: convertedTasks }
    } catch (error) {
      console.error('タスク取得エラー:', error)
      return { success: false, error: 'タスクの取得中にエラーが発生しました' }
    }
  }

  // タスク作成
  async createTask(taskData) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'ログインが必要です' }
      }

      // アプリの形式からSupabase形式に変換
      const supabaseTask = this.convertAppTaskToSupabase(taskData)
      const { data, error } = await database.createTask({
        ...supabaseTask,
        student_id: this.currentUser.id
      })

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      // アプリの形式に戻して返す
      const convertedTask = this.convertSupabaseTaskToApp(data)
      return { success: true, task: convertedTask }
    } catch (error) {
      console.error('タスク作成エラー:', error)
      return { success: false, error: 'タスクの作成中にエラーが発生しました' }
    }
  }

  // タスク更新
  async updateTask(taskId, updates) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'ログインが必要です' }
      }

      // アプリの形式からSupabase形式に変換
      const supabaseUpdates = this.convertAppTaskToSupabase(updates)
      const { data, error } = await database.updateTask(taskId, supabaseUpdates)

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      // アプリの形式に戻して返す
      const convertedTask = this.convertSupabaseTaskToApp(data)
      return { success: true, task: convertedTask }
    } catch (error) {
      console.error('タスク更新エラー:', error)
      return { success: false, error: 'タスクの更新中にエラーが発生しました' }
    }
  }

  // タスク削除
  async deleteTask(taskId) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'ログインが必要です' }
      }

      const { error } = await database.deleteTask(taskId)

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true }
    } catch (error) {
      console.error('タスク削除エラー:', error)
      return { success: false, error: 'タスクの削除中にエラーが発生しました' }
    }
  }

  // 今日のタスク取得
  async getTodayTasks() {
    const today = new Date().toISOString().split('T')[0]
    return this.getTasks(today)
  }

  // スケジュールされたタスク取得
  async getScheduledTasks(startDate, endDate) {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'ログインが必要です' }
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('student_id', this.currentUser.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })

      if (error) {
        return { success: false, error: this.getErrorMessage(error) }
      }

      // アプリの形式に変換
      const convertedTasks = (data || []).map(task => this.convertSupabaseTaskToApp(task))
      return { success: true, tasks: convertedTasks }
    } catch (error) {
      console.error('スケジュール取得エラー:', error)
      return { success: false, error: 'スケジュールの取得中にエラーが発生しました' }
    }
  }

  // ==================================================
  // データ変換ヘルパー関数
  // ==================================================

  // Supabaseタスクをアプリ形式に変換
  convertSupabaseTaskToApp(supabaseTask) {
    if (!supabaseTask) return null

    // JSONで保存されたメタデータを解析
    const metadata = supabaseTask.description ?
      (() => {
        try {
          return JSON.parse(supabaseTask.description)
        } catch {
          return { originalDescription: supabaseTask.description }
        }
      })() : {}

    return {
      id: supabaseTask.id,
      title: supabaseTask.title,
      description: metadata.originalDescription || '',
      priority: supabaseTask.priority || 'medium',
      category: metadata.category || 'study',
      completed: supabaseTask.status === 'completed',
      source: metadata.source || 'manual',
      createdAt: supabaseTask.created_at,
      type: metadata.type,
      bookTitle: metadata.bookTitle,
      startPage: metadata.startPage,
      endPage: metadata.endPage,
      pages: metadata.pages,
      // 問題数ベースの情報を追加
      startProblem: metadata.startProblem,
      endProblem: metadata.endProblem,
      problems: metadata.problems,
      studyType: metadata.studyType,
      duration: metadata.duration || 1,
      scheduledDate: supabaseTask.scheduled_date,
      scheduledTime: supabaseTask.scheduled_time,
      estimatedMinutes: supabaseTask.estimated_minutes,
      actualMinutes: supabaseTask.actual_minutes
    }
  }

  // アプリタスクをSupabase形式に変換
  convertAppTaskToSupabase(appTask) {
    if (!appTask) return null

    // メタデータをJSONとして保存
    const metadata = {
      originalDescription: appTask.description || '',
      category: appTask.category,
      source: appTask.source,
      type: appTask.type,
      bookTitle: appTask.bookTitle,
      startPage: appTask.startPage,
      endPage: appTask.endPage,
      pages: appTask.pages,
      // 問題数ベースの情報を追加
      startProblem: appTask.startProblem,
      endProblem: appTask.endProblem,
      problems: appTask.problems,
      studyType: appTask.studyType,
      duration: appTask.duration
    }

    return {
      title: appTask.title,
      description: JSON.stringify(metadata),
      status: appTask.completed ? 'completed' : 'pending',
      priority: appTask.priority || 'medium',
      estimated_minutes: appTask.estimatedMinutes || appTask.duration ? (appTask.duration * 60) : null,
      actual_minutes: appTask.actualMinutes,
      scheduled_date: appTask.scheduledDate,
      scheduled_time: appTask.scheduledTime
    }
  }

  // エラーメッセージの変換
  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
      'Email not confirmed': 'Supabase設定でメール確認を無効化してください。AUTHENTICATION_FIX.mdを参照してください。',
      'User already registered': 'このメールアドレスは既に登録されています',
      'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
      'Invalid email': '有効なメールアドレスを入力してください',
      'Signup requires a valid password': 'パスワードを入力してください'
    }

    return errorMessages[error.message] || error.message || 'エラーが発生しました'
  }

  // データエクスポート（開発用）
  exportData() {
    if (!this.currentUser) {
      return { success: false, error: 'ログインが必要です' }
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      user: this.currentUser
    }

    return { success: true, data: exportData }
  }
}

// シングルトンインスタンスをエクスポート
export const authService = new AuthService()
export { auth } from './supabase.js'
export default authService