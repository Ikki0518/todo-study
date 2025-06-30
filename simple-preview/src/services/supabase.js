import { createClient } from '@supabase/supabase-js'

// Supabaseの設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 環境変数の検証
const isValidConfig = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')

if (!isValidConfig) {
  console.warn('⚠️ Supabase環境変数が正しく設定されていません。')
  console.warn('実際のSupabaseプロジェクトを使用するには、.envファイルで以下の変数を設定してください:')
  console.warn('VITE_SUPABASE_URL=https://your-project-id.supabase.co')
  console.warn('VITE_SUPABASE_ANON_KEY=your-anon-key-here')
  console.warn('現在はデモモードで動作します。')
}

// デモ用のダミークライアント
const createDemoClient = () => ({
  auth: {
    signUp: async () => ({
      data: null,
      error: { message: 'デモモード: Supabase環境変数を設定してください' }
    }),
    signInWithPassword: async () => ({
      data: null,
      error: { message: 'デモモード: Supabase環境変数を設定してください' }
    }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    updateUser: async () => ({
      data: null,
      error: { message: 'デモモード: Supabase環境変数を設定してください' }
    }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    }),
    resetPasswordForEmail: async () => ({
      data: null,
      error: { message: 'デモモード: Supabase環境変数を設定してください' }
    })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null })
      }),
      order: () => ({ data: [], error: null })
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({
          data: null,
          error: { message: 'デモモード: Supabase環境変数を設定してください' }
        })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: null,
            error: { message: 'デモモード: Supabase環境変数を設定してください' }
          })
        })
      })
    }),
    delete: () => ({
      eq: async () => ({
        error: { message: 'デモモード: Supabase環境変数を設定してください' }
      })
    }),
    upsert: () => ({
      select: () => ({
        single: async () => ({
          data: null,
          error: { message: 'デモモード: Supabase環境変数を設定してください' }
        })
      })
    })
  })
})

// Supabaseクライアントの作成
export const supabase = (() => {
  if (!isValidConfig) {
    return createDemoClient()
  }
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Supabaseクライアントの作成に失敗しました:', error)
    return createDemoClient()
  }
})()

// 認証関連のヘルパー関数
export const auth = {
  // ユーザー登録
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // ログイン
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // ログアウト
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 現在のユーザー取得
  getCurrentUser() {
    return supabase.auth.getUser()
  },

  // 認証状態の変更を監視
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // パスワードリセット
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  },

  // パスワード更新
  async updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  }
}

// データベース操作のヘルパー関数
export const database = {
  // ユーザープロフィール取得
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // ユーザープロフィール作成/更新
  async upsertUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    return { data, error }
  },

  // 学習目標の取得
  async getGoals(studentId) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // 学習目標の作成
  async createGoal(goalData) {
    const { data, error } = await supabase
      .from('goals')
      .insert(goalData)
      .select()
      .single()
    return { data, error }
  },

  // 学習目標の更新
  async updateGoal(goalId, updates) {
    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single()
    return { data, error }
  },

  // 学習目標の削除
  async deleteGoal(goalId) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
    return { error }
  },

  // タスクの取得
  async getTasks(studentId, date = null) {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('student_id', studentId)
      .order('scheduled_date', { ascending: true })

    if (date) {
      query = query.eq('scheduled_date', date)
    }

    const { data, error } = await query
    return { data, error }
  },

  // タスクの作成
  async createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()
    return { data, error }
  },

  // タスクの更新
  async updateTask(taskId, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single()
    return { data, error }
  },

  // タスクの削除
  async deleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    return { error }
  }
}

export default supabase