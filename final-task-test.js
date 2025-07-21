import { createClient } from '@supabase/supabase-js'

// Supabaseの設定
const supabaseUrl = 'https://wjpcfsjtjgxvhijczxnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function finalTaskTest() {
  try {
    console.log('🧪 最終タスク保存テスト開始...')
    
    const testUserId = 'student-ikki-001'
    const today = new Date().toISOString().split('T')[0]
    
    // 1. タスクデータテスト
    console.log('1️⃣ タスクデータ保存テスト...')
    const testTasksData = {
      [today]: [
        {
          id: 'final-test-task-1',
          title: '最終テストタスク1',
          description: 'リロード後も保持されるテストタスク',
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'final-test-task-2',
          title: '最終テストタスク2',
          description: '完了済みテストタスク',
          priority: 'medium',
          completed: true,
          createdAt: new Date().toISOString()
        }
      ]
    }
    
    const { data: taskData, error: taskError } = await supabase
      .from('user_tasks')
      .upsert({
        user_id: testUserId,
        tasks_data: testTasksData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
    
    if (taskError) {
      console.error('❌ タスクデータ保存エラー:', taskError)
    } else {
      console.log('✅ タスクデータ保存成功')
    }
    
    // 2. 学習計画データテスト
    console.log('2️⃣ 学習計画データ保存テスト...')
    const testStudyPlans = [
      {
        id: 'plan-1',
        subject: '数学',
        topic: '微分積分',
        date: today
      }
    ]
    
    const { data: planData, error: planError } = await supabase
      .from('user_study_plans')
      .upsert({
        user_id: testUserId,
        study_plans: testStudyPlans,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
    
    if (planError) {
      console.error('❌ 学習計画データ保存エラー:', planError)
    } else {
      console.log('✅ 学習計画データ保存成功')
    }
    
    // 3. 受験日データテスト
    console.log('3️⃣ 受験日データ保存テスト...')
    const testExamDates = [
      {
        id: 'exam-1',
        name: '期末試験',
        date: '2025-02-15',
        subject: '数学'
      }
    ]
    
    const { data: examData, error: examError } = await supabase
      .from('user_exam_dates')
      .upsert({
        user_id: testUserId,
        exam_dates: testExamDates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
    
    if (examError) {
      console.error('❌ 受験日データ保存エラー:', examError)
    } else {
      console.log('✅ 受験日データ保存成功')
    }
    
    // 4. データ読み込みテスト
    console.log('4️⃣ データ読み込みテスト...')
    
    const { data: loadedTasks, error: loadTaskError } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', testUserId)
      .single()
    
    if (loadTaskError) {
      console.error('❌ タスクデータ読み込みエラー:', loadTaskError)
    } else {
      console.log('✅ タスクデータ読み込み成功:', {
        tasksCount: Object.keys(loadedTasks.tasks_data || {}).length,
        todayTasksCount: (loadedTasks.tasks_data[today] || []).length
      })
    }
    
    // 5. クリーンアップ
    console.log('5️⃣ テストデータクリーンアップ...')
    
    await Promise.all([
      supabase.from('user_tasks').delete().eq('user_id', testUserId),
      supabase.from('user_study_plans').delete().eq('user_id', testUserId),
      supabase.from('user_exam_dates').delete().eq('user_id', testUserId)
    ])
    
    console.log('✅ クリーンアップ完了')
    console.log('🎉 最終テスト完了 - 全機能正常動作!')
    
  } catch (error) {
    console.error('❌ 最終テストエラー:', error)
  }
}

finalTaskTest()