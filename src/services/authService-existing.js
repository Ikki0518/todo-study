import { supabase, auth, database } from './supabase-existing.js'

class AuthService {
  constructor() {
    this.supabase = supabase
    this.currentUser = null
    this.isInitialized = false
    this.authStateListeners = []
    this.isDemo = !import.meta.env.VITE_SUPABASE_URL || 
                  import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url'
    
    // 認証状態の変更を監視
    auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.loadUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null
      }
      
      // リスナーに通知
      this.authStateListeners.forEach(listener => {
        listener(event, session, this.currentUser)
      })
    })
  }

  // デモモード用のメッセージを生成
  getDemoMessage() {
    return 'デモモードで動作中です。実際のSupabaseプロジェクトを使用するには、.envファイルでSupabase環境変数を設定してください。'
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

  // ユーザープロフィールを読み込み（既存テーブル構造に対応）
  async loadUserProfile(userId) {
    try {
      const { data: profile, error } = await database.getUserProfile(userId)
      if (error && error.code !== 'PGRST116') { // レコードが見つからない場合以外のエラー
        console.error('プロフィール取得エラー:', error)
        return
      }

      // プロフィールが存在しない場合は作成
      if (!profile) {
        const { data: user } = await auth.getCurrentUser()
        if (user?.user) {
          const newProfile = {
            email: user.user.email,
            name: user.user.user_metadata?.name || user.user.email.split('@')[0],
            role: 'STUDENT',
            created_at: new Date().toISOString()
          }

          const { data: createdProfile, error: createError } = await database.upsertUserProfile(userId, newProfile)
          if (!createError) {
            this.currentUser = createdProfile
          }
        }
      } else {
        this.currentUser = profile
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error)
    }
  }

  // ユーザー登録
  async register(email, password, userData = {}) {
    try {
      if (this.isDemo) {
        return {
          success: false,
          error: this.getDemoMessage()
        }
      }

      const { data, error } = await auth.signUp(email, password, {
        name: userData.name,
        role: userData.userRole || 'STUDENT'
      })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      if (data.user) {
        // プロフィールを作成
        await database.upsertUserProfile(data.user.id, {
          email: email,
          name: userData.name,
          role: userData.userRole || 'STUDENT',
          created_at: new Date().toISOString()
        })

        return {
          success: true,
          user: data.user,
          message: 'アカウントが作成されました。確認メールをご確認ください。'
        }
      }

      return {
        success: false,
        error: '登録に失敗しました'
      }
    } catch (error) {
      console.error('登録エラー:', error)
      return {
        success: false,
        error: 'システムエラーが発生しました'
      }
    }
  }

  // ログイン
  async login(email, password) {
    try {
      if (this.isDemo) {
        return {
          success: false,
          error: this.getDemoMessage()
        }
      }

      const { data, error } = await auth.signIn(email, password)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      if (data.user) {
        await this.loadUserProfile(data.user.id)
        
        return {
          success: true,
          user: this.currentUser
        }
      }

      return {
        success: false,
        error: 'ログインに失敗しました'
      }
    } catch (error) {
      console.error('ログインエラー:', error)
      return {
        success: false,
        error: 'システムエラーが発生しました'
      }
    }
  }

  // ログアウト
  async logout() {
    try {
      const { error } = await auth.signOut()
      this.currentUser = null
      
      if (error) {
        console.error('ログアウトエラー:', error)
      }
      
      return { success: true }
    } catch (error) {
      console.error('ログアウトエラー:', error)
      return {
        success: false,
        error: 'ログアウトに失敗しました'
      }
    }
  }

  // 現在のユーザー取得
  async getCurrentUser() {
    try {
      if (this.isDemo) {
        return {
          success: false,
          error: this.getDemoMessage()
        }
      }

      const { data, error } = await auth.getCurrentUser()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      if (data.user) {
        if (!this.currentUser) {
          await this.loadUserProfile(data.user.id)
        }
        
        return {
          success: true,
          user: this.currentUser
        }
      }

      return {
        success: false,
        error: 'ユーザーが見つかりません'
      }
    } catch (error) {
      console.error('ユーザー取得エラー:', error)
      return {
        success: false,
        error: 'システムエラーが発生しました'
      }
    }
  }

  // プロフィール更新
  async updateProfile(profileData) {
    try {
      if (this.isDemo) {
        return {
          success: false,
          error: this.getDemoMessage()
        }
      }

      const { data: user } = await auth.getCurrentUser()
      if (!user?.user) {
        return {
          success: false,
          error: 'ユーザーが認証されていません'
        }
      }

      const { data, error } = await database.upsertUserProfile(user.user.id, profileData)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      this.currentUser = { ...this.currentUser, ...data }
      
      return {
        success: true,
        user: this.currentUser
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error)
      return {
        success: false,
        error: 'プロフィールの更新に失敗しました'
      }
    }
  }

  // パスワード変更
  async changePassword(currentPassword, newPassword) {
    try {
      if (this.isDemo) {
        return {
          success: false,
          error: this.getDemoMessage()
        }
      }

      // 現在のパスワードで再認証
      const { data: user } = await auth.getCurrentUser()
      if (!user?.user?.email) {
        return {
          success: false,
          error: 'ユーザー情報が取得できません'
        }
      }

      // 現在のパスワードで認証確認
      const { error: signInError } = await auth.signIn(user.user.email, currentPassword)
      if (signInError) {
        return {
          success: false,
          error: '現在のパスワードが正しくありません'
        }
      }

      // パスワード更新
      const { error } = await auth.updatePassword(newPassword)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        message: 'パスワードが変更されました'
      }
    } catch (error) {
      console.error('パスワード変更エラー:', error)
      return {
        success: false,
        error: 'パスワードの変更に失敗しました'
      }
    }
  }

  // データエクスポート（既存テーブル構造に対応）
  async exportData() {
    try {
      if (this.isDemo) {
        return {
          success: false,
          error: this.getDemoMessage()
        }
      }

      const { data: user } = await auth.getCurrentUser()
      if (!user?.user) {
        return {
          success: false,
          error: 'ユーザーが認証されていません'
        }
      }

      const userId = user.user.id

      // 各テーブルからデータを取得
      const [
        profileResult,
        goalsResult,
        tasksResult,
        coursesResult,
        progressResult
      ] = await Promise.all([
        database.getUserProfile(userId),
        database.getGoals(userId),
        database.getTasks(userId),
        database.getStudyCourses(userId),
        database.getStudentProgress(userId)
      ])

      const exportData = {
        profile: profileResult.data,
        goals: goalsResult.data || [],
        tasks: tasksResult.data || [],
        courses: coursesResult.data || [],
        progress: progressResult.data || [],
        exportedAt: new Date().toISOString()
      }

      return {
        success: true,
        data: exportData
      }
    } catch (error) {
      console.error('データエクスポートエラー:', error)
      return {
        success: false,
        error: 'データのエクスポートに失敗しました'
      }
    }
  }

  // 認証状態確認
  isAuthenticated() {
    return !!this.currentUser
  }
}

// シングルトンインスタンスをエクスポート
const authService = new AuthService()
export default authService