import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase認証ユーザー確認開始...')
console.log('📊 URL:', supabaseUrl)
console.log('🔑 Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'なし')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAuthUsers() {
  try {
    console.log('\n1️⃣ 基本接続テスト...')
    
    // プロファイルテーブルから既存ユーザーを確認
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profileError) {
      console.log('❌ プロファイル取得エラー:', profileError.message)
      return
    }
    
    console.log('✅ プロファイル取得成功')
    console.log('📋 既存プロファイル:')
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ID: ${profile.id}, 名前: ${profile.name}, ロール: ${profile.role}`)
    })
    
    console.log('\n2️⃣ 特定ユーザーの確認...')
    
    // ikki_y0518@icloud.com のプロファイルを確認
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'ikki_y0518@icloud.com')
      .single()
    
    if (targetError) {
      console.log('❌ 対象ユーザープロファイル取得エラー:', targetError.message)
    } else {
      console.log('✅ 対象ユーザープロファイル存在確認')
      console.log('👤 ユーザー情報:', targetProfile)
    }
    
    console.log('\n3️⃣ 認証テスト...')
    
    // テストログインを試行
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ikki_y0518@icloud.com',
      password: 'ikki0518'
    })
    
    if (authError) {
      console.log('❌ 認証エラー:', authError.message)
      console.log('🔍 エラー詳細:', authError)
      
      // 認証エラーの種類を分析
      if (authError.message.includes('Invalid login credentials')) {
        console.log('💡 分析: ユーザーアカウントが認証テーブル（auth.users）に存在しない可能性があります')
        console.log('🔧 解決策: Supabaseダッシュボードでユーザーアカウントを作成する必要があります')
      }
    } else {
      console.log('✅ 認証成功!')
      console.log('👤 認証ユーザー:', authData.user?.email)
      
      // ログアウト
      await supabase.auth.signOut()
    }
    
  } catch (error) {
    console.log('❌ 予期しないエラー:', error.message)
  }
}

checkAuthUsers()