import { createClient } from '@supabase/supabase-js'

// Supabaseの設定
const supabaseUrl = 'https://wjpcfsjtjgxvhijczxnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugCurrentUser() {
  try {
    console.log('🔍 現在のユーザー状態をデバッグ中...')
    
    // 1. セッション確認
    console.log('1️⃣ セッション確認...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ セッション取得エラー:', sessionError)
    } else if (session) {
      console.log('✅ 有効なセッション:', {
        userId: session.user.id,
        email: session.user.email,
        accessToken: session.access_token ? '存在' : '不存在'
      })
    } else {
      console.log('⚠️ セッションなし')
    }
    
    // 2. ユーザー情報確認
    console.log('2️⃣ ユーザー情報確認...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ ユーザー取得エラー:', userError)
    } else if (user) {
      console.log('✅ ユーザー情報:', {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at ? '確認済み' : '未確認'
      })
    } else {
      console.log('⚠️ ユーザー情報なし')
    }
    
    // 3. 匿名ユーザーでのテスト保存
    console.log('3️⃣ 匿名ユーザーでのテスト保存...')
    const testUserId = 'student-ikki-001' // エラーログで見たユーザーID
    const testData = {
      '2025-01-21': [{
        id: 'debug-task-1',
        title: 'デバッグテストタスク',
        completed: false
      }]
    }
    
    const { data: saveData, error: saveError } = await supabase
      .from('user_tasks')
      .upsert({
        user_id: testUserId,
        tasks_data: testData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
    
    if (saveError) {
      console.error('❌ テスト保存エラー:', saveError)
      console.error('エラー詳細:', {
        message: saveError.message,
        code: saveError.code,
        details: saveError.details,
        hint: saveError.hint
      })
    } else {
      console.log('✅ テスト保存成功:', saveData)
    }
    
    // 4. 読み込みテスト
    console.log('4️⃣ 読み込みテスト...')
    const { data: loadData, error: loadError } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', testUserId)
      .single()
    
    if (loadError) {
      console.error('❌ 読み込みエラー:', loadError)
    } else {
      console.log('✅ 読み込み成功:', {
        userId: loadData.user_id,
        hasData: !!loadData.tasks_data
      })
    }
    
    // 5. クリーンアップ
    console.log('5️⃣ クリーンアップ...')
    const { error: deleteError } = await supabase
      .from('user_tasks')
      .delete()
      .eq('user_id', testUserId)
    
    if (deleteError) {
      console.warn('⚠️ クリーンアップエラー:', deleteError)
    } else {
      console.log('✅ クリーンアップ完了')
    }
    
  } catch (error) {
    console.error('❌ デバッグエラー:', error)
  }
}

debugCurrentUser()