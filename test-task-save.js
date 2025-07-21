import { createClient } from '@supabase/supabase-js'

// Supabaseの設定
const supabaseUrl = 'https://wjpcfsjtjgxvhijczxnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
})

async function testTaskSave() {
  try {
    console.log('🧪 タスク保存テスト開始...')
    
    // テストデータ
    const testUserId = 'test-user-' + Date.now()
    const testTasksData = {
      '2025-01-21': [
        {
          id: 'task-1',
          title: 'テストタスク1',
          description: 'これはテスト用のタスクです',
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-2',
          title: 'テストタスク2',
          description: 'もう一つのテストタスク',
          priority: 'medium',
          completed: true,
          createdAt: new Date().toISOString()
        }
      ]
    }
    
    console.log('📝 テストデータ:', {
      userId: testUserId,
      tasksCount: Object.keys(testTasksData).length
    })
    
    // 1. セッション確認
    console.log('🔐 セッション確認...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.warn('⚠️ セッション取得エラー:', sessionError)
    } else if (session) {
      console.log('✅ 有効なセッション:', session.user.email)
    } else {
      console.log('⚠️ セッションなし - 匿名アクセス')
    }
    
    // 2. タスクデータ保存テスト
    console.log('💾 タスクデータ保存テスト...')
    const { data, error } = await supabase
      .from('user_tasks')
      .upsert({
        user_id: testUserId,
        tasks_data: testTasksData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
    
    if (error) {
      console.error('❌ タスク保存エラー:', error)
      console.error('エラー詳細:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ タスク保存成功:', data)
    }
    
    // 3. 保存されたデータの読み込みテスト
    console.log('📖 タスクデータ読み込みテスト...')
    const { data: loadedData, error: loadError } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', testUserId)
      .single()
    
    if (loadError) {
      console.error('❌ タスク読み込みエラー:', loadError)
    } else {
      console.log('✅ タスク読み込み成功:', {
        userId: loadedData.user_id,
        tasksData: loadedData.tasks_data,
        createdAt: loadedData.created_at,
        updatedAt: loadedData.updated_at
      })
    }
    
    // 4. クリーンアップ（テストデータ削除）
    console.log('🧹 テストデータクリーンアップ...')
    const { error: deleteError } = await supabase
      .from('user_tasks')
      .delete()
      .eq('user_id', testUserId)
    
    if (deleteError) {
      console.warn('⚠️ テストデータ削除エラー:', deleteError)
    } else {
      console.log('✅ テストデータ削除完了')
    }
    
    console.log('🎉 タスク保存テスト完了!')
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
  }
}

testTaskSave()