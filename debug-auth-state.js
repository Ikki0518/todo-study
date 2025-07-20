import { supabase } from './src/services/supabase.js';

async function debugAuthState() {
  console.log('🔍 認証状態のデバッグを開始...');
  
  try {
    // 1. 現在のセッション情報を取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ セッション取得エラー:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('❌ セッションが存在しません');
      return;
    }
    
    console.log('✅ セッション情報:', {
      user_id: session.user.id,
      email: session.user.email,
      access_token: session.access_token ? '存在' : '不存在',
      expires_at: new Date(session.expires_at * 1000).toISOString()
    });
    
    // 2. 現在のユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ユーザー取得エラー:', userError);
      return;
    }
    
    console.log('✅ ユーザー情報:', {
      id: user.id,
      email: user.email,
      role: user.role,
      aud: user.aud
    });
    
    // 3. データベース接続テスト
    console.log('🔍 データベース接続テスト...');
    
    // 3-1. user_tasksテーブルへの読み取りテスト
    const { data: readData, error: readError } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', user.id);
    
    if (readError) {
      console.error('❌ 読み取りテストエラー:', readError);
    } else {
      console.log('✅ 読み取りテスト成功:', readData);
    }
    
    // 3-2. user_tasksテーブルへの書き込みテスト
    const testData = {
      user_id: user.id,
      tasks_data: { test: 'debug_test_' + Date.now() },
      updated_at: new Date().toISOString()
    };
    
    const { data: writeData, error: writeError } = await supabase
      .from('user_tasks')
      .upsert(testData, { onConflict: 'user_id' });
    
    if (writeError) {
      console.error('❌ 書き込みテストエラー:', writeError);
      console.error('エラー詳細:', {
        code: writeError.code,
        message: writeError.message,
        details: writeError.details,
        hint: writeError.hint
      });
    } else {
      console.log('✅ 書き込みテスト成功:', writeData);
    }
    
    // 4. RLSポリシーの確認
    console.log('🔍 RLSポリシーの確認...');
    
    const { data: policyData, error: policyError } = await supabase
      .rpc('check_rls_policies');
    
    if (policyError) {
      console.log('⚠️ RLSポリシー確認関数が存在しません（正常）');
    } else {
      console.log('✅ RLSポリシー情報:', policyData);
    }
    
  } catch (error) {
    console.error('❌ デバッグ中にエラーが発生:', error);
  }
}

// 実行
debugAuthState();