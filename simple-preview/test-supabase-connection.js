import { createClient } from '@supabase/supabase-js'

// 環境変数を直接読み込み
const supabaseUrl = 'https://wjpcfsjtjgxvhijczxnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0'

console.log('🔍 Supabase接続テスト開始')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? 'あり' : 'なし')

async function testSupabaseConnection() {
  try {
    console.log('\n1. Supabaseクライアント作成中...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ クライアント作成成功')

    console.log('\n2. 基本的な接続テスト中...')
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('⚠️ 認証エラー（これは正常）:', error.message)
    } else {
      console.log('✅ 認証API接続成功:', data)
    }

    console.log('\n3. データベース接続テスト中...')
    const { data: tables, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (dbError) {
      console.log('❌ データベース接続エラー:', dbError.message)
      console.log('詳細:', dbError)
    } else {
      console.log('✅ データベース接続成功')
    }

    console.log('\n4. テストユーザー登録試行中...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (signUpError) {
      console.log('❌ ユーザー登録エラー:', signUpError.message)
      console.log('詳細:', signUpError)
    } else {
      console.log('✅ ユーザー登録成功（またはすでに存在）')
    }

    console.log('\n5. テストログイン試行中...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (signInError) {
      console.log('❌ ログインエラー:', signInError.message)
      console.log('詳細:', signInError)
    } else {
      console.log('✅ ログイン成功')
    }

  } catch (error) {
    console.log('❌ 予期しないエラー:', error)
  }
}

testSupabaseConnection()