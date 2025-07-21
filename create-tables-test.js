import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Supabaseの設定
const supabaseUrl = 'https://wjpcfsjtjgxvhijczxnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTables() {
  try {
    console.log('🔧 ユーザーデータテーブル作成開始...')
    
    // SQLファイルを読み込み
    const sql = fs.readFileSync('./create-user-tables-no-rls.sql', 'utf8')
    
    // SQLを実行
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ テーブル作成エラー:', error)
      
      // 個別にテーブルを作成してみる
      console.log('🔄 個別テーブル作成を試行...')
      
      // user_tasksテーブル作成
      const { error: taskError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS user_tasks (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            tasks_data JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          ALTER TABLE user_tasks DISABLE ROW LEVEL SECURITY;
        `
      })
      
      if (taskError) {
        console.error('❌ user_tasksテーブル作成エラー:', taskError)
      } else {
        console.log('✅ user_tasksテーブル作成成功')
      }
      
    } else {
      console.log('✅ テーブル作成成功:', data)
    }
    
    // テーブル存在確認
    console.log('🔍 テーブル存在確認...')
    const { data: tables, error: checkError } = await supabase
      .from('user_tasks')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.error('❌ user_tasksテーブル確認エラー:', checkError)
    } else {
      console.log('✅ user_tasksテーブル存在確認成功')
    }
    
  } catch (error) {
    console.error('❌ 処理エラー:', error)
  }
}

createTables()