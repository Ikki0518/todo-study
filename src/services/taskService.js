import { supabase } from './supabase'

// 認証済みSupabaseクライアントを取得（匿名アクセス対応）
const getAuthenticatedClient = async () => {
  console.log('🔐 Supabaseクライアントを取得中...');
  
  try {
    // セッション確認（エラーが発生しても継続）
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️ セッション取得エラー（匿名アクセスで継続）:', error.message);
    } else if (session) {
      console.log('✅ 有効なセッションが見つかりました:', session.user.email);
    } else {
      console.log('ℹ️ セッションなし - 匿名アクセスで継続');
    }
    
    return supabase;
  } catch (error) {
    console.log('ℹ️ 認証確認エラー（匿名アクセスで継続）:', error.message);
    return supabase;
  }
};

export const taskService = {
  // ユーザーのタスクデータを保存
  async saveUserTasks(userId, tasksData) {
    try {
      console.log('💾 タスクデータを保存中:', { userId, tasksCount: Object.keys(tasksData).length });
      
      const client = await getAuthenticatedClient();
      
      const { data, error } = await client
        .from('user_tasks')
        .upsert({
          user_id: userId,
          tasks_data: tasksData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ タスクデータ保存エラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ タスクデータ保存完了:', data);
      return data;
    } catch (error) {
      console.error('❌ タスクデータ保存失敗:', error);
      throw error;
    }
  },

  // ユーザーのタスクデータを読み込み
  async loadUserTasks(userId) {
    try {
      console.log('📖 タスクデータを読み込み中:', userId);
      
      const client = await getAuthenticatedClient();
      
      // maybeSingle()を使用してデータが存在しない場合もエラーにしない
      const { data, error } = await client
        .from('user_tasks')
        .select('tasks_data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ タスクデータ読み込みエラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        // エラーが発生してもアプリは継続動作
        console.log('⚠️ エラーを無視して空のデータを返します');
        return {};
      }

      if (!data) {
        // データが存在しない場合は空のオブジェクトを返す
        console.log('📝 新規ユーザー - 空のタスクデータを返します');
        return {};
      }

      console.log('✅ タスクデータ読み込み完了:', { tasksCount: Object.keys(data.tasks_data || {}).length });
      return data.tasks_data || {};
    } catch (error) {
      console.error('❌ タスクデータ読み込み失敗:', error);
      console.log('⚠️ 例外を無視して空のデータを返します');
      // エラーの場合は空のオブジェクトを返してアプリが動作するようにする
      return {};
    }
  },

  // ユーザーの学習計画データを保存
  async saveStudyPlans(userId, studyPlansData) {
    try {
      // データ形式を確認して安全に処理
      const safeStudyPlansData = studyPlansData || [];
      const plansCount = Array.isArray(safeStudyPlansData) ? safeStudyPlansData.length : Object.keys(safeStudyPlansData).length;
      
      console.log('💾 学習計画データを保存中:', { userId, plansCount, dataType: typeof safeStudyPlansData });
      
      const client = await getAuthenticatedClient();
      
      const { data, error } = await client
        .from('user_study_plans')
        .upsert({
          user_id: userId,
          study_plans: safeStudyPlansData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ 学習計画データ保存エラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ 学習計画データ保存完了:', data);
      return data;
    } catch (error) {
      console.error('❌ 学習計画データ保存失敗:', error);
      throw error;
    }
  },

  // ユーザーの学習計画データを読み込み
  async loadStudyPlans(userId) {
    try {
      console.log('📖 学習計画データを読み込み中:', userId);
      
      const client = await getAuthenticatedClient();
      
      // maybeSingle()を使用してデータが存在しない場合もエラーにしない
      const { data, error } = await client
        .from('user_study_plans')
        .select('study_plans')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ 学習計画データ読み込みエラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        // エラーが発生してもアプリは継続動作
        console.log('⚠️ エラーを無視して空のデータを返します');
        return [];
      }

      if (!data) {
        // データが存在しない場合は空の配列を返す
        console.log('📝 新規ユーザー - 空の学習計画データを返します');
        return [];
      }

      console.log('✅ 学習計画データ読み込み完了:', { plansCount: (data.study_plans || []).length });
      return data.study_plans || [];
    } catch (error) {
      console.error('❌ 学習計画データ読み込み失敗:', error);
      console.log('⚠️ 例外を無視して空のデータを返します');
      // エラーの場合は空の配列を返してアプリが動作するようにする
      return [];
    }
  },

  // ユーザーの受験日データを保存
  async saveExamDates(userId, examDatesData) {
    try {
      // データ形式を確認して安全に処理
      const safeExamDatesData = examDatesData || [];
      const examCount = Array.isArray(safeExamDatesData) ? safeExamDatesData.length : Object.keys(safeExamDatesData).length;
      
      console.log('💾 受験日データを保存中:', { userId, examCount, dataType: typeof safeExamDatesData });
      
      const client = await getAuthenticatedClient();
      
      const { data, error } = await client
        .from('user_exam_dates')
        .upsert({
          user_id: userId,
          exam_dates: safeExamDatesData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ 受験日データ保存エラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ 受験日データ保存完了:', data);
      return data;
    } catch (error) {
      console.error('❌ 受験日データ保存失敗:', error);
      throw error;
    }
  },

  // ユーザーの受験日データを読み込み
  async loadExamDates(userId) {
    try {
      console.log('📖 受験日データを読み込み中:', userId);
      
      const client = await getAuthenticatedClient();
      
      const { data, error } = await client
        .from('user_exam_dates')
        .select('exam_dates')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが存在しない場合は空の配列を返す
          console.log('📝 新規ユーザー - 空の受験日データを返します');
          return [];
        }
        console.error('❌ 受験日データ読み込みエラー:', error);
        console.error('❌ エラー詳細:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ 受験日データ読み込み完了:', { examCount: (data.exam_dates || []).length });
      return data.exam_dates || [];
    } catch (error) {
      console.error('❌ 受験日データ読み込み失敗:', error);
      // エラーの場合は空の配列を返してアプリが動作するようにする
      return [];
    }
  }
};