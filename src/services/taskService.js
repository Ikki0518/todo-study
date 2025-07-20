import { supabase } from './supabase'

export const taskService = {
  // ユーザーのタスクデータを保存
  async saveUserTasks(userId, tasksData) {
    try {
      console.log('💾 タスクデータを保存中:', { userId, tasksCount: Object.keys(tasksData).length });
      
      const { data, error } = await supabase
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
      
      const { data, error } = await supabase
        .from('user_tasks')
        .select('tasks_data')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが存在しない場合は空のオブジェクトを返す
          console.log('📝 新規ユーザー - 空のタスクデータを返します');
          return {};
        }
        console.error('❌ タスクデータ読み込みエラー:', error);
        throw error;
      }

      console.log('✅ タスクデータ読み込み完了:', { tasksCount: Object.keys(data.tasks_data || {}).length });
      return data.tasks_data || {};
    } catch (error) {
      console.error('❌ タスクデータ読み込み失敗:', error);
      // エラーの場合は空のオブジェクトを返してアプリが動作するようにする
      return {};
    }
  },

  // ユーザーの学習計画データを保存
  async saveStudyPlans(userId, studyPlansData) {
    try {
      console.log('💾 学習計画データを保存中:', { userId, plansCount: studyPlansData.length });
      
      const { data, error } = await supabase
        .from('user_study_plans')
        .upsert({
          user_id: userId,
          study_plans: studyPlansData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ 学習計画データ保存エラー:', error);
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
      
      const { data, error } = await supabase
        .from('user_study_plans')
        .select('study_plans')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが存在しない場合は空の配列を返す
          console.log('📝 新規ユーザー - 空の学習計画データを返します');
          return [];
        }
        console.error('❌ 学習計画データ読み込みエラー:', error);
        throw error;
      }

      console.log('✅ 学習計画データ読み込み完了:', { plansCount: (data.study_plans || []).length });
      return data.study_plans || [];
    } catch (error) {
      console.error('❌ 学習計画データ読み込み失敗:', error);
      // エラーの場合は空の配列を返してアプリが動作するようにする
      return [];
    }
  },

  // ユーザーの受験日データを保存
  async saveExamDates(userId, examDatesData) {
    try {
      console.log('💾 受験日データを保存中:', { userId, examCount: examDatesData.length });
      
      const { data, error } = await supabase
        .from('user_exam_dates')
        .upsert({
          user_id: userId,
          exam_dates: examDatesData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ 受験日データ保存エラー:', error);
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
      
      const { data, error } = await supabase
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