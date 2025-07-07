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
      const { data: { user } } = await auth.getCurrentUser()
      if (user) {
        console.log('既存セッション復元:', user.email)
        // 軽量なユーザー情報設定
        this.currentUser = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          role: user.user_metadata?.role || 'STUDENT'
        }
      }
      this.isInitialized = true
    } catch (error) {
      console.warn('セッション復元エラー:', error)
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
        const { data: user } = await auth.getCurrentUser()
        if (user?.user) {
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