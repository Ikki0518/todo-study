import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = 'https://wjpcfsjtjgxvhijczxnj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🧪 Supabaseデータベース接続テスト開始...');
  
  try {
    // 1. 基本的な接続テスト
    console.log('\n1. 基本接続テスト:');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_tasks')
      .select('count(*)', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ 接続エラー:', healthError);
      return;
    }
    console.log('✅ データベース接続成功');
    
    // 2. テーブル存在確認
    console.log('\n2. テーブル存在確認:');
    const tables = ['user_tasks', 'user_study_plans', 'user_exam_dates'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: 存在確認`);
        }
      } catch (err) {
        console.error(`❌ ${table}: ${err.message}`);
      }
    }
    
    // 3. テストデータの挿入・取得・削除
    console.log('\n3. データ操作テスト:');
    const testUserId = 'test-user-' + Date.now();
    const testData = {
      todayTasks: ['テスト用タスク1', 'テスト用タスク2'],
      scheduledTasks: {},
      dailyTaskPool: [],
      completedTasks: {},
      goals: []
    };
    
    // 挿入テスト
    const { data: insertData, error: insertError } = await supabase
      .from('user_tasks')
      .upsert({
        user_id: testUserId,
        tasks_data: testData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (insertError) {
      console.error('❌ データ挿入エラー:', insertError);
    } else {
      console.log('✅ データ挿入成功');
      
      // 取得テスト
      const { data: selectData, error: selectError } = await supabase
        .from('user_tasks')
        .select('tasks_data')
        .eq('user_id', testUserId)
        .single();
      
      if (selectError) {
        console.error('❌ データ取得エラー:', selectError);
      } else {
        console.log('✅ データ取得成功:', selectData.tasks_data);
        
        // 削除テスト（クリーンアップ）
        const { error: deleteError } = await supabase
          .from('user_tasks')
          .delete()
          .eq('user_id', testUserId);
        
        if (deleteError) {
          console.error('❌ データ削除エラー:', deleteError);
        } else {
          console.log('✅ データ削除成功（クリーンアップ完了）');
        }
      }
    }
    
    // 4. RLS状態確認
    console.log('\n4. RLS状態確認:');
    try {
      const { data: rlsInfo } = await supabase.rpc('check_rls_status');
      console.log('RLS状態:', rlsInfo);
    } catch (err) {
      console.log('⚠️ RLS状態確認スキップ（関数未定義）');
    }
    
    console.log('\n🎉 データベーステスト完了');
    
  } catch (error) {
    console.error('💥 予期しないエラー:', error);
  }
}

// テスト実行
testDatabaseConnection();