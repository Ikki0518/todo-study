import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = 'https://wjpcfsjtjgxvhijczxnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  console.log('🔍 Supabaseデータベース接続テスト開始...')
  console.log('📊 URL:', supabaseUrl)
  console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...')
  
  try {
    // 1. 基本的な接続テスト
    console.log('\n1️⃣ 基本接続テスト...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.error('❌ 接続エラー:', healthError.message)
      return false
    }
    console.log('✅ 基本接続成功')

    // 2. テーブル存在確認
    console.log('\n2️⃣ テーブル存在確認...')
    const tables = ['profiles', 'tenants', 'assignments', 'assignment_submissions', 'study_records', 'messages']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: テーブル存在確認`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }

    // 3. ユーザーデータ確認
    console.log('\n3️⃣ ユーザーデータ確認...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10)
    
    if (profilesError) {
      console.log('❌ プロファイル取得エラー:', profilesError.message)
    } else {
      console.log(`✅ プロファイル数: ${profiles?.length || 0}`)
      if (profiles && profiles.length > 0) {
        console.log('📋 サンプルプロファイル:')
        profiles.slice(0, 3).forEach((profile, index) => {
          console.log(`  ${index + 1}. ID: ${profile.user_id}, 名前: ${profile.name}, ロール: ${profile.role}, テナント: ${profile.tenant_code}`)
        })
      }
    }

    // 4. テナントデータ確認
    console.log('\n4️⃣ テナントデータ確認...')
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
    
    if (tenantsError) {
      console.log('❌ テナント取得エラー:', tenantsError.message)
    } else {
      console.log(`✅ テナント数: ${tenants?.length || 0}`)
      if (tenants && tenants.length > 0) {
        console.log('🏢 テナント一覧:')
        tenants.forEach((tenant, index) => {
          console.log(`  ${index + 1}. コード: ${tenant.code}, 名前: ${tenant.name}`)
        })
      }
    }

    // 5. 課題データ確認
    console.log('\n5️⃣ 課題データ確認...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(5)
    
    if (assignmentsError) {
      console.log('❌ 課題取得エラー:', assignmentsError.message)
    } else {
      console.log(`✅ 課題数: ${assignments?.length || 0}`)
      if (assignments && assignments.length > 0) {
        console.log('📚 サンプル課題:')
        assignments.slice(0, 3).forEach((assignment, index) => {
          console.log(`  ${index + 1}. タイトル: ${assignment.title}, 講師: ${assignment.teacher_user_id}, ステータス: ${assignment.status}`)
        })
      }
    }

    // 6. 学習記録データ確認
    console.log('\n6️⃣ 学習記録データ確認...')
    const { data: studyRecords, error: studyRecordsError } = await supabase
      .from('study_records')
      .select('*')
      .limit(5)
    
    if (studyRecordsError) {
      console.log('❌ 学習記録取得エラー:', studyRecordsError.message)
    } else {
      console.log(`✅ 学習記録数: ${studyRecords?.length || 0}`)
      if (studyRecords && studyRecords.length > 0) {
        console.log('📖 サンプル学習記録:')
        studyRecords.slice(0, 3).forEach((record, index) => {
          console.log(`  ${index + 1}. 生徒: ${record.student_user_id}, 科目: ${record.subject}, 時間: ${record.duration_minutes}分`)
        })
      }
    }

    // 7. メッセージデータ確認
    console.log('\n7️⃣ メッセージデータ確認...')
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(5)
    
    if (messagesError) {
      console.log('❌ メッセージ取得エラー:', messagesError.message)
    } else {
      console.log(`✅ メッセージ数: ${messages?.length || 0}`)
      if (messages && messages.length > 0) {
        console.log('💬 サンプルメッセージ:')
        messages.slice(0, 3).forEach((message, index) => {
          console.log(`  ${index + 1}. 送信者: ${message.sender_user_id}, 受信者: ${message.recipient_user_id || '全体'}, 件名: ${message.subject}`)
        })
      }
    }

    // 8. 認証ユーザー確認
    console.log('\n8️⃣ 認証ユーザー確認...')
    const { data: authUser, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ 認証ユーザー取得エラー:', authError.message)
    } else {
      console.log('✅ 認証状態:', authUser?.user ? 'ログイン中' : '未ログイン')
      if (authUser?.user) {
        console.log(`📧 ユーザーメール: ${authUser.user.email}`)
        console.log(`🆔 ユーザーID: ${authUser.user.id}`)
      }
    }

    console.log('\n🎉 Supabaseデータベース確認完了!')
    return true

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    return false
  }
}

// テスト実行
testSupabaseConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ 全てのテストが完了しました')
    } else {
      console.log('\n❌ 一部のテストで問題が発生しました')
    }
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ テスト実行エラー:', error)
    process.exit(1)
  })