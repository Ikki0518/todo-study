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
let demoUser = null
let authStateListeners = []
let hasInitialStateBeenSent = false
let demoData = {
  users: [],
  goals: [],
  tasks: [],
  study_sessions: []
}

const createDemoClient = () => ({
  auth: {
    signUp: async (credentials) => {
      // デモモードでは簡単な登録を許可
      const user = {
        id: 'demo-user-' + Date.now(),
        email: credentials.email,
        created_at: new Date().toISOString(),
        user_metadata: credentials.options?.data || {}
      }
      
      demoUser = user
      
      // 認証状態変更を通知
      setTimeout(() => {
        authStateListeners.forEach(listener => {
          listener('SIGNED_IN', { user, access_token: 'demo-token' })
        })
      }, 100)
      
      return {
        data: { user, session: { user, access_token: 'demo-token' } },
        error: null
      }
    },
    signInWithPassword: async (credentials) => {
      // デモモードでは任意の認証情報でログイン可能
      const user = {
        id: 'demo-user-' + credentials.email.replace(/[^a-zA-Z0-9]/g, ''),
        email: credentials.email,
        created_at: new Date().toISOString(),
        user_metadata: { name: 'デモユーザー' }
      }
      
      demoUser = user
      
      // 認証状態変更を通知
      setTimeout(() => {
        authStateListeners.forEach(listener => {
          listener('SIGNED_IN', { user, access_token: 'demo-token' })
        })
      }, 100)
      
      return {
        data: { user, session: { user, access_token: 'demo-token' } },
        error: null
      }
    },
    signOut: async () => {
      demoUser = null
      
      // 認証状態変更を通知
      setTimeout(() => {
        authStateListeners.forEach(listener => {
          listener('SIGNED_OUT', null)
        })
      }, 100)
      
      return { error: null }
    },
    getUser: async () => ({ 
      data: { user: demoUser }, 
      error: null 
    }),
    updateUser: async (updates) => {
      if (demoUser) {
        demoUser = { ...demoUser, ...updates }
        return { data: { user: demoUser }, error: null }
      }
      return { data: null, error: { message: 'ユーザーがログインしていません' } }
    },
    onAuthStateChange: (callback) => {
      // 重複登録を防ぐ
      if (authStateListeners.includes(callback)) {
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const index = authStateListeners.indexOf(callback)
                if (index > -1) {
                  authStateListeners.splice(index, 1)
                }
              }
            }
          }
        }
      }
      
      authStateListeners.push(callback)
      
      // 初期状態を即座に通知（非同期にしない）
      if (demoUser) {
        callback('SIGNED_IN', { user: demoUser, access_token: 'demo-token' })
      } else {
        callback('SIGNED_OUT', null)
      }
      
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = authStateListeners.indexOf(callback)
              if (index > -1) {
                authStateListeners.splice(index, 1)
              }
            }
          }
        }
      }
    },
    resetPasswordForEmail: async () => ({
      data: { message: 'デモモード: パスワードリセットメールを送信しました（実際には送信されません）' },
      error: null
    })
  },
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        single: async () => {
          const data = demoData[table]?.find(item => item[column] === value) || null
          return { data, error: null }
        },
        order: (orderColumn, options = {}) => ({
          data: demoData[table]?.filter(item => item[column] === value) || [],
          error: null
        })
      }),
      order: (column, options = {}) => ({
        data: demoData[table] || [],
        error: null
      })
    }),
    insert: (values) => ({
      select: () => ({
        single: async () => {
          const newItem = {
            id: Date.now(),
            ...values,
            created_at: new Date().toISOString()
          }
          if (!demoData[table]) demoData[table] = []
          demoData[table].push(newItem)
          return { data: newItem, error: null }
        }
      })
    }),
    update: (values) => ({
      eq: (column, value) => ({
        select: () => ({
          single: async () => {
            const index = demoData[table]?.findIndex(item => item[column] === value)
            if (index !== undefined && index >= 0) {
              demoData[table][index] = { ...demoData[table][index], ...values }
              return { data: demoData[table][index], error: null }
            }
            return { data: null, error: { message: 'レコードが見つかりません' } }
          }
        })
      })
    }),
    delete: () => ({
      eq: async (column, value) => {
        const index = demoData[table]?.findIndex(item => item[column] === value)
        if (index !== undefined && index >= 0) {
          demoData[table].splice(index, 1)
          return { error: null }
        }
        return { error: { message: 'レコードが見つかりません' } }
      }
    }),
    upsert: (values) => ({
      select: () => ({
        single: async () => {
          const newItem = {
            id: values.id || Date.now(),
            ...values,
            updated_at: new Date().toISOString()
          }
          if (!demoData[table]) demoData[table] = []
          
          const existingIndex = demoData[table].findIndex(item => item.id === newItem.id)
          if (existingIndex >= 0) {
            demoData[table][existingIndex] = newItem
          } else {
            demoData[table].push(newItem)
          }
          
          return { data: newItem, error: null }
        }
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

  // ユーザー情報更新
  async updateUser(updates) {
    const { data, error } = await supabase.auth.updateUser(updates)
    return { data, error }
  }
}

// データベース関連のヘルパー関数
export const database = {
  // ユーザープロフィール関連
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async upsertUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: userId, ...profileData })
      .select()
      .single()
    return { data, error }
  },

  // 目標関連
  async getUserGoals(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createGoal(goalData) {
    const { data, error } = await supabase
      .from('goals')
      .insert(goalData)
      .select()
      .single()
    return { data, error }
  },

  async updateGoal(goalId, updates) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single()
    return { data, error }
  },

  async deleteGoal(goalId) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
    return { error }
  },

  // タスク関連
  async getUserTasks(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()
    return { data, error }
  },

  async updateTask(taskId, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()
    return { data, error }
  },

  async deleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    return { error }
  },

  // 学習セッション関連
  async getUserStudySessions(userId) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createStudySession(sessionData) {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert(sessionData)
      .select()
      .single()
    return { data, error }
  },

  async updateStudySession(sessionId, updates) {
    const { data, error } = await supabase
      .from('study_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()
    return { data, error }
  }
}

export default supabase