import { createClient } from '@supabase/supabase-js'

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

// 既存テーブル構造に合わせた認証関連のヘルパー関数
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

// 既存テーブル構造に合わせたデータベース操作のヘルパー関数
export const database = {
  // ユーザープロフィール取得（既存のusersテーブルまたはstudy_user_profilesテーブルを使用）
  async getUserProfile(userId) {
    // まずusersテーブルを試す
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    // usersテーブルにない場合はstudy_user_profilesテーブルを試す
    if (error && error.code === 'PGRST116') {
      const result = await supabase
        .from('study_user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      data = result.data
      error = result.error
    }
    
    return { data, error }
  },

  // ユーザープロフィール作成/更新
  async upsertUserProfile(userId, profileData) {
    // まずusersテーブルに挿入を試す
    let { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    // usersテーブルが使えない場合はstudy_user_profilesテーブルを使用
    if (error) {
      const result = await supabase
        .from('study_user_profiles')
        .upsert({
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }
    
    return { data, error }
  },

  // 学習目標の取得（既存のgoalsテーブルを使用）
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

  // タスクの取得（既存のtasksテーブルを使用）
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
  },

  // 学習コースの取得（既存のstudy_coursesテーブルを使用）
  async getStudyCourses(studentId) {
    const { data, error } = await supabase
      .from('study_courses')
      .select(`
        *,
        study_subjects(name),
        study_schools(name)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // 学習進捗の取得（既存のstudy_student_progressテーブルを使用）
  async getStudentProgress(studentId) {
    const { data, error } = await supabase
      .from('study_student_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
    return { data, error }
  },

  // 学習教材の取得（既存のstudy_materialsテーブルを使用）
  async getStudyMaterials(courseId) {
    const { data, error } = await supabase
      .from('study_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // コメントの取得（既存のcommentsテーブルを使用）
  async getComments(entityId, entityType) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users(name, email)
      `)
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  // コメントの作成
  async createComment(commentData) {
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single()
    return { data, error }
  }
}

export default supabase