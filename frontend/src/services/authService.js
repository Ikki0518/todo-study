import { supabase, auth, database } from './supabase.js'

class AuthService {
  constructor() {
    this.supabase = supabase
    this.currentUser = null
    this.isInitialized = false
    this.authStateListeners = []
    this.isDemo = !import.meta.env.VITE_SUPABASE_URL ||
                  import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url'
    this.authStateChangeSubscription = null
    this.isListenerRegistered = false
    
    // 認証状態の変更を監視（一度だけ）
    if (!this.isListenerRegistered) {
      this.isListenerRegistered = true
      this.authStateChangeSubscription = auth.onAuthStateChange(async (event, session) => {
      console.log('認証状態変更:', { event, session: session?.user?.id })
      
      if (event === 'SIGNED_IN' && session?.user) {
        // ログイン処理で既にプロフィールを読み込んでいる場合はスキップ
        if (!this.currentUser || this.currentUser.id !== session.user.id) {
          console.log('認証状態変更によるプロフィール読み込み')
          const result = await this.loadUserProfile(session.user.id)
          if (!result || !result.success) {
            console.error('認証状態変更時のプロフィール読み込み失敗:', result)
          }
        } else {
          console.log('プロフィール既に読み込み済み、スキップ')
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null
        console.log('ログアウト: currentUserをクリア')
      }
      
      // リスナーに通知
      this.authStateListeners.forEach(listener => {
        try {
          listener(event, session, this.currentUser)
        } catch (error) {
          console.error('認証状態リスナーエラー:', error)
        }
      })
      })
    }
    
    this.initialize()
  }

  // 認証状態変更のリスナーを追加
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback)
    
    // クリーンアップ関数を返す
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
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

  // 初期化（アプリ起動時に呼び出し）
  async initialize() {
    if (this.isInitialized) return

    try {
      const { data: { user }, error } = await auth.getCurrentUser()
      if (user && !error) {
        await this.loadUserProfile(user.id)
      }
      this.isInitialized = true
    } catch (error) {
      console.error('認証初期化エラー:', error)
      this.isInitialized = true
    }
  }

  // ユーザー登録
  async register(email, password, userData = {}) {
    try {
      const { data, error } = await auth.signUp(email, password, {
        name: userData.name,
        role: userData.userRole || 'STUDENT'
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      // 登録成功時にプロフィールを作成
      if (data.user) {
        const profileData = {
          email: data.user.email,
          name: userData.name,
          role: userData.userRole || 'STUDENT',
          created_at: new Date().toISOString()
        }

        await database.upsertUserProfile(data.user.id, profileData)
      }

      return {
        success: true,
        user: data.user,
        message: 'アカウントが作成されました。確認メールをご確認ください。'
      }
    } catch (error) {
      console.error('登録エラー:', error)
      return {
        success: false,
        error: 'アカウント作成中にエラーが発生しました'
      }
    }
  }

  // ログイン
  async login(email, password) {
    try {
      console.log('ログイン開始:', { email, isDemo: this.isDemo })
      const { data, error } = await auth.signIn(email, password)
      console.log('auth.signIn結果:', { data, error })

      if (error) {
        console.log('ログインエラー:', error)
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      if (data && data.user) {
        console.log('ログイン成功、プロフィール読み込み中:', data.user)
        const profileResult = await this.loadUserProfile(data.user.id)
        
        if (profileResult && profileResult.success) {
          return {
            success: true,
            user: this.currentUser,
            session: data.session
          }
        } else {
          console.log('プロフィール読み込み失敗:', profileResult)
          return {
            success: false,
            error: 'プロフィールの読み込みに失敗しました'
          }
        }
      }

      console.log('ログイン失敗: ユーザーデータなし')
      return {
        success: false,
        error: 'ログインに失敗しました'
      }
    } catch (error) {
      console.error('ログインエラー:', error)
      return {
        success: false,
        error: 'ログイン中にエラーが発生しました'
      }
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

      const { data, error } = await database.getGoals(this.currentUser.id)

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
      'Email not confirmed': 'メールアドレスが確認されていません',
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
export default authService