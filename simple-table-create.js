import { createClient } from '@supabase/supabase-js'

// Supabaseの設定
const supabaseUrl = 'https://wjpcfsjtjgxvhijczxnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createUserTasksTable() {
  try {
    console.log('🔧 user_tasksテーブル作成開始...')
    
    // まず既存テーブルを確認
    console.log('🔍 既存テーブル確認...')
    const { data: existingData, error: existingError } = await supabase
      .from('user_tasks')
      .select('*')
      .limit(1)
    
    if (!existingError) {
      console.log('✅ user_tasksテーブルは既に存在します')
      return
    }
    
    console.log('📝 テーブルが存在しないため作成します:', existingError.message)
    
    // テーブル作成を試行（直接INSERT/UPSERTで）
    console.log('🔄 テーブル作成を試行...')
    const { data, error } = await supabase
      .from('user_tasks')
      .upsert({
        user_id: 'test-user-001',
        tasks_data: { test: 'data' },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      console.error('❌ テーブル作成/データ挿入エラー:', error)
      console.error('エラー詳細:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ テーブル作成/データ挿入成功:', data)
    }
    
    // 再度確認
    console.log('🔍 テーブル作成後の確認...')
    const { data: finalData, error: finalError } = await supabase
      .from('user_tasks')
      .select('*')
      .limit(5)
    
    if (finalError) {
      console.error('❌ 最終確認エラー:', finalError)
    } else {
      console.log('✅ 最終確認成功:', finalData)
    }
    
  } catch (error) {
    console.error('❌ 処理エラー:', error)
  }
}

createUserTasksTable()